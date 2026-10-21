import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import {
  TransportSecurityService,
  checkScanRateLimit,
  recordFailedScanAttempt,
  resetScanRateLimit,
} from '@/lib/transport/transport-security'
import { db } from '@/lib/db'

/**
 * POST /api/v1/transport/scan — Universal Transport QR Scanner API
 *
 * Enforces Cryptographically Signed, Expiring QR Tokens (JWT / HMAC HS256)
 * Strictly eliminates all unsigned fallback paths (no raw IDs, no raw JSON, no unsigned base64).
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  // 1. Rate Limiting Check (Abuse & Brute Force Protection)
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rateLimitKey = `scan:${session.tenantId}:${session.uid}:${clientIp}`
  const rateLimit = checkScanRateLimit(rateLimitKey)
  if (!rateLimit.allowed) {
    return Errors.rateLimit(rateLimit.retryAfterSeconds)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { qrPayload } = body

    if (!qrPayload || typeof qrPayload !== 'string') {
      return Errors.validation('qrPayload string is required')
    }

    const tenantId = session.tenantId

    const context = {
      tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      ipAddress: clientIp,
      userAgent: req.headers.get('user-agent'),
    }

    // 2. Cryptographic Signature, Expiry, Purpose & Multi-Tenant Validation
    const verifyResult = await TransportSecurityService.verifyTransportQrToken(qrPayload, {
      expectedTenantId: tenantId,
      expectedBranchId: session.branchId || undefined,
    })

    if (!verifyResult.valid) {
      recordFailedScanAttempt(rateLimitKey)

      await TransportSecurityService.logSecurityEvent(context, {
        eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
        action: 'QR_SCAN',
        result: 'BLOCKED',
        reason: `Scan verification rejected: [${verifyResult.code}] ${verifyResult.message}`,
      })

      return ok({
        valid: false,
        scanType: 'UNKNOWN',
        status: verifyResult.code,
        message: verifyResult.message,
      })
    }

    // Reset rate limiter on valid QR token format & signature
    resetScanRateLimit(rateLimitKey)
    const payload = verifyResult.payload!

    // 3. Workflow Routing Based on Signed Purpose

    // ── Workflow A: TRANSPORT_DRIVER ──
    if (payload.purpose === 'TRANSPORT_DRIVER') {
      const routeId = payload.routeId || payload.sub
      const route = await db.transportRoute.findFirst({
        where: { id: routeId, tenantId, deletedAt: null },
        include: {
          vehicle: true,
          driverProfile: { include: { user: { select: { fullName: true, phone: true } } } },
          stops: { orderBy: { sequence: 'asc' } },
        },
      })

      if (!route) {
        return ok({
          valid: false,
          scanType: 'TRANSPORT_DRIVER',
          status: 'INVALID_ROUTE',
          message: 'Route not found or inactive',
        })
      }

      if (payload.vehicleId && route.vehicleId && route.vehicleId !== payload.vehicleId) {
        return ok({
          valid: false,
          scanType: 'TRANSPORT_DRIVER',
          status: 'VEHICLE_MISMATCH',
          message: 'Vehicle assignment does not match route record',
        })
      }

      await TransportSecurityService.logSecurityEvent(context, {
        eventType: 'QR_SCAN',
        routeId: route.id,
        vehicleId: route.vehicleId ?? undefined,
        action: 'Driver Transport QR Scanned',
        result: 'SUCCESS',
        reason: `Driver QR scanned successfully for route ${route.name}`,
      })

      return ok({
        valid: true,
        scanType: 'TRANSPORT_DRIVER',
        status: 'VERIFIED',
        route: {
          id: route.id,
          name: route.name,
          code: route.code,
          stops: route.stops,
        },
        vehicle: route.vehicle,
        driver: route.driverProfile?.user,
        availableActions: [
          { key: 'REGISTERED_GUARDIAN', label: '1. Parent / Registered Guardian' },
          { key: 'UNKNOWN_PERSON', label: '2. Unknown / Unregistered Person' },
        ],
        message: 'Driver Transport QR verified successfully. Please select your identity workflow.',
      })
    }

    // ── Workflow B: TRANSPORT_PICKUP_AUTH (Temporary Pickup Person) ──
    if (payload.purpose === 'TRANSPORT_PICKUP_AUTH') {
      const authId = payload.authId || payload.sub
      const auth = await db.transportPickupAuthorization.findFirst({
        where: { id: authId, tenantId },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, photoUrl: true, branchId: true } },
          guardian: { select: { id: true, fullName: true, phone: true } },
        },
      })

      if (!auth) {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          action: 'AUTH_SCAN',
          result: 'FAILED',
          reason: 'Authorization record not found in tenant',
        })
        return ok({
          valid: false,
          scanType: 'AUTHORIZATION',
          status: 'NOT_FOUND',
          message: 'Temporary Pickup Authorization not found',
        })
      }

      // Replay Protection: Check if already consumed
      if (auth.status === 'USED') {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'DUPLICATE_PICKUP_ATTEMPT',
          studentId: auth.studentId,
          authorizationId: auth.id,
          action: 'AUTH_SCAN',
          result: 'BLOCKED',
          reason: 'Replay attempt: One-time pickup authorization has already been used',
        })
        return ok({
          valid: false,
          scanType: 'AUTHORIZATION',
          status: 'ALREADY_USED',
          authorization: auth,
          message: 'This pickup authorization QR code has already been used and cannot be replayed.',
        })
      }

      // Check approval status
      if (auth.status !== 'APPROVED') {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          action: 'AUTH_SCAN',
          studentId: auth.studentId,
          result: 'BLOCKED',
          reason: `Authorization status is ${auth.status} (Approval required)`,
        })
        return ok({
          valid: false,
          scanType: 'AUTHORIZATION',
          status: auth.status,
          authorization: auth,
          message: `Authorization is not approved (Current Status: ${auth.status})`,
        })
      }

      // Check time window
      const now = new Date()
      if (now < auth.validFrom || now > auth.validUntil) {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          action: 'AUTH_SCAN',
          studentId: auth.studentId,
          result: 'REJECTED',
          reason: 'Authorization window expired or not started',
        })
        return ok({
          valid: false,
          scanType: 'AUTHORIZATION',
          status: 'EXPIRED',
          authorization: auth,
          message: 'Pickup authorization has expired or is outside valid time window',
        })
      }

      // Check branch scoping if session is branch-scoped
      if (session.branchId && auth.student.branchId && auth.student.branchId !== session.branchId) {
        return ok({
          valid: false,
          scanType: 'AUTHORIZATION',
          status: 'BRANCH_MISMATCH',
          message: 'Student belongs to a different school branch',
        })
      }

      await TransportSecurityService.logSecurityEvent(context, {
        eventType: 'QR_SCAN',
        studentId: auth.studentId,
        authorizationId: auth.id,
        action: 'Temporary Pickup Authorization QR Scanned',
        result: 'SUCCESS',
        reason: `Authorized person ${auth.personName} verified for student ${auth.student.firstName}`,
      })

      return ok({
        valid: true,
        scanType: 'AUTHORIZATION',
        status: 'APPROVED',
        authorization: {
          ...auth,
          authorizedPersonName: auth.personName,
          authorizedPersonPhone: auth.phone,
        },
        message: `Authorized Pickup Person: ${auth.personName} (${auth.relationship})`,
      })
    }

    // ── Workflow C: TRANSPORT_GUARDIAN (Parent / Guardian Badge) ──
    if (payload.purpose === 'TRANSPORT_GUARDIAN') {
      const guardianId = payload.guardianId || payload.sub
      const guardian = await db.guardian.findFirst({
        where: { id: guardianId, tenantId, deletedAt: null },
        include: {
          user: { select: { fullName: true, phone: true, email: true } },
          studentLinks: {
            include: {
              student: {
                select: { id: true, firstName: true, lastName: true, admissionNo: true, photoUrl: true, branchId: true },
              },
            },
          },
        },
      })

      if (!guardian) {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          action: 'GUARDIAN_QR_SCAN',
          result: 'FAILED',
          reason: 'Guardian not found in tenant',
        })
        return ok({
          valid: false,
          scanType: 'GUARDIAN',
          status: 'INVALID_GUARDIAN',
          message: 'Guardian identity not found or tenant mismatch',
        })
      }

      const linkedStudents = guardian.studentLinks.map((s) => s.student)

      await TransportSecurityService.logSecurityEvent(context, {
        eventType: 'QR_SCAN',
        action: 'Guardian QR Scanned',
        result: 'SUCCESS',
        reason: `Guardian ${guardian.fullName} verified with ${linkedStudents.length} linked student(s)`,
      })

      return ok({
        valid: true,
        scanType: 'GUARDIAN',
        status: 'VERIFIED',
        guardian: {
          id: guardian.id,
          name: guardian.fullName,
          phone: guardian.phone,
          relationship: guardian.relationship,
        },
        linkedStudents,
        message: `Guardian ${guardian.fullName} verified. Linked to ${linkedStudents.length} student(s).`,
      })
    }

    // ── Workflow D: TRANSPORT_STUDENT (Student ID / Badge) ──
    if (payload.purpose === 'TRANSPORT_STUDENT') {
      const studentId = payload.studentId || payload.sub
      const student = await db.student.findFirst({
        where: { id: studentId, tenantId, deletedAt: null },
        include: {
          guardians: {
            include: {
              guardian: { select: { id: true, fullName: true, phone: true, relationship: true } },
            },
          },
          transportAssignments: {
            where: { status: 'ACTIVE', deletedAt: null },
            include: { route: true, pickupStop: true, dropStop: true },
          },
        },
      })

      if (!student) {
        await TransportSecurityService.logSecurityEvent(context, {
          eventType: 'QR_SCAN',
          action: 'STUDENT_QR_SCAN',
          studentId,
          result: 'FAILED',
          reason: 'Student not found in tenant',
        })
        return ok({
          valid: false,
          scanType: 'STUDENT',
          status: 'INVALID_STUDENT',
          message: 'Student record not found or tenant mismatch',
        })
      }

      // Branch scoping check
      if (session.branchId && student.branchId && student.branchId !== session.branchId) {
        return ok({
          valid: false,
          scanType: 'STUDENT',
          status: 'BRANCH_MISMATCH',
          message: 'Student is enrolled in a different school branch',
        })
      }

      const transportAssigned = student.transportAssignments.length > 0
      const activeAssignment = student.transportAssignments[0] || null

      const activeAuth = await db.transportPickupAuthorization.findFirst({
        where: {
          tenantId,
          studentId: student.id,
          status: 'APPROVED',
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      })

      await TransportSecurityService.logSecurityEvent(context, {
        eventType: 'QR_SCAN',
        action: 'Student QR Scanned',
        studentId: student.id,
        result: 'SUCCESS',
        reason: `Student ${student.firstName} verified for transport`,
      })

      return ok({
        valid: true,
        scanType: 'STUDENT',
        status: 'VERIFIED',
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNo: student.admissionNo,
          photoUrl: student.photoUrl,
        },
        transportAssigned,
        assignment: activeAssignment,
        guardians: student.guardians.map((g) => ({
          id: g.guardian.id,
          name: g.guardian.fullName,
          phone: g.guardian.phone,
          relationship: g.guardian.relationship,
        })),
        activeTemporaryAuthorization: activeAuth
          ? {
              ...activeAuth,
              authorizedPersonName: activeAuth.personName,
              authorizedPersonPhone: activeAuth.phone,
            }
          : null,
        message: transportAssigned
          ? `Student ${student.firstName} ${student.lastName || ''} is assigned to Route: ${activeAssignment.route.name}`
          : `Student ${student.firstName} ${student.lastName || ''} has no active transport assignment`,
      })
    }

    return ok({
      valid: false,
      scanType: 'UNKNOWN',
      status: 'UNSUPPORTED_PURPOSE',
      message: `Unsupported QR token purpose: ${payload.purpose}`,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

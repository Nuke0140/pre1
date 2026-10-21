import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportSecurityService } from '@/lib/transport/transport-security'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { db } from '@/lib/db'

/**
 * POST /api/v1/transport/registered-guardian/pickup — Registered Guardian Student Pickup Action
 * Enforces server-authoritative PIN verification, rate limiting, branch boundaries, and child safety rules.
 */
async function _POST(req: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const rl = await checkRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'rl-gate-pickup',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many pickup verification attempts. Please wait.')
  }

  const session = await requireApi(req, 'transport:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json().catch(() => ({}))
    const { studentId, guardianId, userId, pin, tripId, stopId, notes } = body

    if (!studentId || typeof studentId !== 'string') {
      return Errors.validation('studentId is required')
    }

    if (!guardianId && !userId) {
      return Errors.validation('guardianId or userId is required for pickup verification')
    }

    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return Errors.validation('Security PIN is required for child pickup verification')
    }

    const context = {
      tenantId: session.tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    }

    // 1. Verify student exists and belongs to current tenant & branch
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId, deletedAt: null },
    })
    if (!student) return Errors.notFound('Student not found')

    if (session.branchId && student.branchId && student.branchId !== session.branchId) {
      return Errors.forbidden('Student belongs to a different school branch')
    }

    // 2. Validate actor access
    const hasAccess = await TransportSecurityService.validateStudentAccess(context, studentId)
    if (!hasAccess) {
      return Errors.forbidden('You are not authorized to perform pickup for this student')
    }

    // 3. Server-authoritative PIN & Guardian Verification (fails closed on unconfigured/invalid PIN)
    const pinCheck = await TransportSecurityService.verifyPin(context, {
      guardianId,
      userId,
      pin,
      studentId,
    })

    if (!pinCheck.valid) {
      return Errors.forbidden(pinCheck.message || 'Pickup verification failed')
    }

    const now = new Date()

    // 4. Concurrency & duplicate pickup guard if tripId is provided
    if (tripId) {
      const existing = await db.tripManifestItem.findUnique({
        where: { tripId_studentId: { tripId, studentId } },
      })
      if (existing && existing.status === 'DROPPED') {
        return Errors.conflict(`Student ${student.firstName} has already completed drop/pickup for this trip`)
      }

      await db.tripManifestItem.upsert({
        where: { tripId_studentId: { tripId, studentId } },
        create: {
          tripId,
          studentId,
          stopId: stopId || 'default-stop',
          status: 'BOARDED',
          boardedAt: now,
          verifiedGuardianId: pinCheck.guardian?.id || guardianId || null,
          actionById: session.uid,
          actionByName: session.name,
          notes: notes || 'Verified Registered Guardian Handover',
        },
        update: {
          status: 'BOARDED',
          boardedAt: now,
          verifiedGuardianId: pinCheck.guardian?.id || guardianId || null,
          actionById: session.uid,
          actionByName: session.name,
          notes: notes || 'Verified Registered Guardian Handover',
        },
      })
    }

    await TransportSecurityService.logSecurityEvent(context, {
      eventType: 'PIN_VERIFICATION_SUCCESS',
      studentId,
      tripId,
      action: 'Registered Guardian Pickup',
      result: 'SUCCESS',
      reason: `Verified pickup for student ${student.firstName} ${student.lastName || ''} by guardian ${pinCheck.guardian?.fullName || session.name}`,
    })

    return ok({
      success: true,
      studentId,
      studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
      guardianId: pinCheck.guardian?.id,
      guardianName: pinCheck.guardian?.fullName,
      status: 'BOARDED',
      action: 'PICKUP',
      time: now,
      message: `Pickup verified and completed successfully for ${student.firstName}`,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

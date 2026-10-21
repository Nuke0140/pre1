import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { TransportService } from '@/lib/transport/transport-service'
import { TransportSecurityService, TransportQrPurpose } from '@/lib/transport/transport-security'

/**
 * POST /api/v1/transport/qr/generate — Generate Server-Authoritative Cryptographically Signed QR Tokens
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json().catch(() => ({}))
    const { purpose = 'TRANSPORT_DRIVER', routeId, vehicleId, authId, studentId, guardianId, expiresIn } = body

    const context = {
      tenantId: session.tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    }

    const scope = await TransportSecurityService.getRoleScopingFilter(context)

    // 1. TRANSPORT_DRIVER
    if (purpose === 'TRANSPORT_DRIVER' || (routeId && vehicleId && !authId && !studentId && !guardianId)) {
      if (!routeId || !vehicleId) {
        return Errors.validation('routeId and vehicleId are required for Driver QR token generation')
      }

      if (scope.isDriver && scope.allowedRouteIds && !scope.allowedRouteIds.includes(routeId)) {
        return Errors.forbidden('Driver is not authorized to generate QR tokens for an unassigned route')
      }

      const qrResult = await TransportService.generateDriverQRToken(context, { routeId, vehicleId })
      return ok(qrResult)
    }

    // 2. TRANSPORT_PICKUP_AUTH
    if (purpose === 'TRANSPORT_PICKUP_AUTH' || authId) {
      if (!authId) {
        return Errors.validation('authId is required for Pickup Authorization QR token generation')
      }

      const auth = await db.transportPickupAuthorization.findFirst({
        where: { id: authId, tenantId: session.tenantId },
        include: { student: true, guardian: true },
      })

      if (!auth) {
        return Errors.notFound('Pickup authorization request not found in tenant')
      }

      // Check role scoping
      if (scope.isParent && scope.allowedStudentIds && !scope.allowedStudentIds.includes(auth.studentId)) {
        return Errors.forbidden('You are not authorized to access pickup tokens for this student')
      }

      if (auth.status !== 'APPROVED') {
        return Errors.forbidden(`Cannot generate QR code: Authorization status is ${auth.status} (Approval required)`)
      }

      const tokenData = await TransportSecurityService.generateTransportQrToken({
        tenantId: session.tenantId,
        branchId: auth.branchId ?? auth.student.branchId,
        purpose: 'TRANSPORT_PICKUP_AUTH',
        sub: auth.id,
        authId: auth.id,
        studentId: auth.studentId,
        guardianId: auth.guardianId ?? undefined,
        expiresIn: expiresIn ?? '24h',
      })

      return ok({
        token: tokenData.token,
        qrPayload: tokenData.qrPayload,
        tenantId: session.tenantId,
        authId: auth.id,
        studentId: auth.studentId,
        studentName: `${auth.student.firstName} ${auth.student.lastName || ''}`.trim(),
        authorizedPersonName: auth.personName,
        expiresAt: tokenData.expiresAt,
        timestamp: Date.now(),
      })
    }

    // 3. TRANSPORT_STUDENT
    if (purpose === 'TRANSPORT_STUDENT' || studentId) {
      if (!studentId) {
        return Errors.validation('studentId is required for Student QR token generation')
      }

      if (scope.isParent && scope.allowedStudentIds && !scope.allowedStudentIds.includes(studentId)) {
        return Errors.forbidden('You are not authorized to generate QR tokens for this student')
      }

      const student = await db.student.findFirst({
        where: { id: studentId, tenantId: session.tenantId, deletedAt: null },
      })

      if (!student) {
        return Errors.notFound('Student not found in tenant')
      }

      const tokenData = await TransportSecurityService.generateTransportQrToken({
        tenantId: session.tenantId,
        branchId: student.branchId,
        purpose: 'TRANSPORT_STUDENT',
        sub: student.id,
        studentId: student.id,
        expiresIn: expiresIn ?? '24h',
      })

      return ok({
        token: tokenData.token,
        qrPayload: tokenData.qrPayload,
        tenantId: session.tenantId,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        expiresAt: tokenData.expiresAt,
        timestamp: Date.now(),
      })
    }

    // 4. TRANSPORT_GUARDIAN
    if (purpose === 'TRANSPORT_GUARDIAN' || guardianId) {
      if (!guardianId) {
        return Errors.validation('guardianId is required for Guardian QR token generation')
      }

      const guardian = await db.guardian.findFirst({
        where: { id: guardianId, tenantId: session.tenantId, deletedAt: null },
      })

      if (!guardian) {
        return Errors.notFound('Guardian not found in tenant')
      }

      const tokenData = await TransportSecurityService.generateTransportQrToken({
        tenantId: session.tenantId,
        purpose: 'TRANSPORT_GUARDIAN',
        sub: guardian.id,
        guardianId: guardian.id,
        expiresIn: expiresIn ?? '24h',
      })

      return ok({
        token: tokenData.token,
        qrPayload: tokenData.qrPayload,
        tenantId: session.tenantId,
        guardianId: guardian.id,
        guardianName: guardian.fullName,
        expiresAt: tokenData.expiresAt,
        timestamp: Date.now(),
      })
    }

    return Errors.validation(`Unsupported purpose: ${purpose}`)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

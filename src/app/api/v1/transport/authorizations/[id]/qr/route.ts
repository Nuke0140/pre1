import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { TransportSecurityService } from '@/lib/transport/transport-security'

/**
 * GET /api/v1/transport/authorizations/:id/qr — Get signed QR token for approved pickup authorization
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: authId } = await params
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const auth = await db.transportPickupAuthorization.findFirst({
      where: { id: authId, tenantId: session.tenantId },
      include: { student: true },
    })

    if (!auth) {
      return Errors.notFound('Pickup authorization not found in tenant')
    }

    const context = {
      tenantId: session.tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    }

    const scope = await TransportSecurityService.getRoleScopingFilter(context)
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
      expiresIn: '24h',
    })

    return ok({
      token: tokenData.token,
      qrPayload: tokenData.qrPayload,
      tenantId: session.tenantId,
      authId: auth.id,
      studentId: auth.studentId,
      studentName: `${auth.student.firstName} ${auth.student.lastName || ''}`.trim(),
      authorizedPersonName: auth.personName,
      status: auth.status,
      expiresAt: tokenData.expiresAt,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

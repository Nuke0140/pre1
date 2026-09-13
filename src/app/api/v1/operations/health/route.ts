import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { OperationsService } from '@/lib/operations/operations-service'

/**
 * POST /api/v1/operations/health
 * Records morning health check and symptom observation
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const meta = getRequestMeta(req)

    const res = await OperationsService.recordHealthCheck(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      body
    )

    return ok(res, undefined, 201)
  } catch (err: any) {
    return bad(err.message, 'HEALTH_RECORD_FAILED')
  }
}

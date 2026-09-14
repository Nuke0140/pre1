import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'

/**
 * PATCH /api/v1/transport/assignments/[id] â€” Cancel or end-date assignment
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApi(req, 'transport:assign')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  const { id } = await params
  try {
    const body = await req.json()
    const { action, reason } = body

    if (action === 'CANCEL') {
      const updated = await TransportService.cancelAssignment(
        {
          tenantId: session.tenantId,
          branchId: session.branchId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        id,
        reason
      )
      return ok(updated)
    }

    return bad('Invalid action')
  } catch (e: any) {
    return bad(e.message)
  }
}

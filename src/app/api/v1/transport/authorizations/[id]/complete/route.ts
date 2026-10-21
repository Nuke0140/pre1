import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportSecurityService } from '@/lib/transport/transport-security'

/**
 * POST /api/v1/transport/authorizations/:id/complete — Complete Handover (Strict Re-Validation with Atomic Single-Use Replay Protection)
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: authId } = await params
  const session = await requireApi(req, 'transport:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const context = {
      tenantId: session.tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    }

    const result = await TransportSecurityService.completePickupAuthorization(context, authId)
    return ok(result)
  } catch (e: any) {
    const msg = e?.message || 'Failed to complete handover'
    if (msg.startsWith('NOT_FOUND:')) {
      return Errors.notFound(msg.substring(11))
    }
    if (msg.startsWith('ALREADY_USED:')) {
      return Errors.forbidden(`REPLAY_DETECTED: ${msg.substring(13)}`)
    }
    if (msg.startsWith('NOT_APPROVED:') || msg.startsWith('EXPIRED:')) {
      return Errors.forbidden(`ACCESS_DENIED: ${msg}`)
    }
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

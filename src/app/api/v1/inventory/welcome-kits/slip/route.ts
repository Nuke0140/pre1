import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { WelcomeKitService } from '@/lib/inventory/welcome-kit-service'

/**
 * GET /api/v1/inventory/welcome-kits/slip
 * Returns authoritative printable handover slip data by kit issuance ID or kit number.
 * Can be fetched repeatedly for reprints without altering inventory balances.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || searchParams.get('kitNumber')

    if (!id) {
      return Errors.badRequest('Kit issuance ID or kit number is required to retrieve handover slip.')
    }

    const slip = await WelcomeKitService.getHandoverSlip(session.tenantId, id)
    return ok(slip)
  } catch (err: any) {
    return bad(err.message, 'HANDOVER_SLIP_FETCH_FAILED')
  }
}

export const GET = withApi(_GET)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * POST /api/v1/inventory/material-requests/[id]/reject
 * Rejects the classroom supply request. Mandates rejection reason, records reviewer,
 * dispatches notification to requesting teacher, and audits.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:approve')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const meta = getRequestMeta(req)

    if (!body.reason || !body.reason.trim()) {
      return Errors.badRequest('A rejection reason is mandatory when rejecting a supply request.')
    }

    const rejected = await SupplyCartService.rejectSupplyRequest(
      session.tenantId,
      id,
      body.reason.trim(),
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }
    )

    return ok(rejected)
  } catch (err: any) {
    return bad(err.message, 'MATERIAL_REQUEST_REJECT_FAILED')
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * POST /api/v1/inventory/material-requests/[id]/fulfill
 * Physically issues approved supplies from an active store location.
 * Atomic stock decrement, negative stock prevention, StockIssue creation,
 * StockMovement creation, and MaterialRequest status update.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:issue')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const meta = getRequestMeta(req)

    if (!body.locationId) {
      return Errors.badRequest('Location ID (store warehouse) is required for issuing materials.')
    }

    const result = await SupplyCartService.fulfillSupplyRequest(
      session.tenantId,
      id,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      {
        locationId: body.locationId,
        items: body.items,
        recipientNotes: body.recipientNotes,
      }
    )

    return ok(result)
  } catch (err: any) {
    return bad(err.message, 'MATERIAL_REQUEST_FULFILL_FAILED')
  }
}

export const POST = withApi(_POST)

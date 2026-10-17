import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * POST /api/v1/inventory/supply-store/validate-cart
 * Validates selected cart items and quantities against real branch stock.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json().catch(() => ({}))
    const branchId = body.branchId || session.branchId || undefined

    const validation = await SupplyCartService.validateCart(
      session.tenantId,
      body.items || [],
      branchId
    )

    return ok(validation)
  } catch (err: any) {
    return bad(err.message, 'CART_VALIDATION_FAILED')
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { InventoryService } from '@/lib/inventory/inventory-service'
import { db } from '@/lib/db'

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:approve')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params

    const order = await db.purchaseOrder.findFirst({
      where: { id, tenantId: session.tenantId },
      select: { branchId: true },
    })
    if (!order) return Errors.notFound('Purchase order not found')

    const branchCheck = await requireBranchAccess(session, order.branchId)
    if (branchCheck) return branchCheck

    const meta = getRequestMeta(req)

    const approved = await InventoryService.approvePurchaseOrder(
      session.tenantId,
      id,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }
    )

    return ok(approved)
  } catch (err: any) {
    return bad(err.message, 'PURCHASE_ORDER_APPROVE_FAILED')
  }
}

export const POST = withApi(_POST)

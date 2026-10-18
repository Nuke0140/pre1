import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { WhatsAppReorderService } from '@/lib/inventory/whatsapp-reorder-service'

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  // Check procurement / inventory write authorization
  const allowedRoles = ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN', 'ADMIN']
  const userRoles = [session.role, ...(session.roles || [])]
  const hasRole = userRoles.some((r) => allowedRoles.includes(r))
  if (!hasRole && !session.permissions?.includes('inventory:order') && !session.permissions?.includes('inventory:write')) {
    return Errors.forbidden('Unauthorized: Only administrators and accounts staff can initiate vendor reorders')
  }

  try {
    const body = await req.json()
    const meta = getRequestMeta(req)
    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    }

    const { action = 'PREPARE', items, vendorId, vendorName, vendorPhone, deliveryDate, deliveryNotes } = body

    if (action === 'AUDIT_OPENED') {
      if (!vendorName || !Array.isArray(items)) {
        return Errors.validation('vendorName and items array are required to record audit log')
      }

      await WhatsAppReorderService.recordReorderAudit({
        tenantId: session.tenantId,
        branchId: session.branchId || null,
        actor,
        action: 'INVENTORY_WHATSAPP_REORDER_OPENED',
        vendorId: vendorId || null,
        vendorName,
        vendorPhone: vendorPhone || null,
        itemCount: items.length,
        items,
      })

      return ok({
        success: true,
        action: 'INVENTORY_WHATSAPP_REORDER_OPENED',
        loggedAt: new Date().toISOString(),
      })
    }

    // Default action: PREPARE
    if (!Array.isArray(items) || items.length === 0) {
      return Errors.validation('Items array with at least one item is required')
    }

    const result = await WhatsAppReorderService.prepareReorder({
      tenantId: session.tenantId,
      branchId: session.branchId || null,
      items,
      deliveryDate,
      deliveryNotes,
    })

    // Log the preparation event for audit traceability
    const totalItems = result.totalItems
    const firstGroup = result.vendorGroups[0]
    await WhatsAppReorderService.recordReorderAudit({
      tenantId: session.tenantId,
      branchId: session.branchId || null,
      actor,
      action: 'INVENTORY_WHATSAPP_REORDER_PREPARED',
      vendorId: firstGroup?.vendorId || null,
      vendorName: firstGroup?.vendorName || 'Multiple Vendors',
      vendorPhone: firstGroup?.rawPhone || null,
      itemCount: totalItems,
      items: result.vendorGroups.flatMap((g) =>
        g.items.map((i) => ({ name: i.name, quantity: i.requestedQuantity, unit: i.unit }))
      ),
    })

    return ok(result)
  } catch (err: any) {
    return bad(err.message, 'WHATSAPP_REORDER_FAILED')
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { FastReceivingService } from '@/lib/inventory/fast-receiving-service'
import { normalizeRole } from '@/lib/roles'

/**
 * POST /api/v1/inventory/fast-receive/receive
 * Authoritative stock intake with server-side idempotency and duplicate prevention.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:receive')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  // Enforce authorized receiving roles
  const effectiveRoles = [session.role, ...(session.roles || [])].filter(Boolean).map(normalizeRole)
  const isAuthorizedRole = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN', 'ADMIN'].includes(r)
  )
  const hasPermission = session.permissions?.includes('inventory:receive') || session.permissions?.includes('inventory:write')

  if (!isAuthorizedRole && !hasPermission) {
    return Errors.forbidden('You do not have permission to receive stock deliveries')
  }

  try {
    const body = await req.json().catch(() => ({}))
    const {
      idempotencyKey,
      itemId,
      branchId: requestBranchId,
      locationId,
      quantity,
      purchaseOrderId,
      purchaseOrderItemId,
      unitCost,
      batchNumber,
      expiryDate,
      serialNumber,
      invoiceNumber,
      challanNumber,
      deliveryNotes,
      deliveryPhotoUrl,
    } = body

    const branchId = requestBranchId || session.branchId
    if (!branchId) {
      return bad('School branch identifier is required', 'BRANCH_REQUIRED')
    }

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
      return bad('idempotencyKey is required for duplicate protection', 'IDEMPOTENCY_KEY_REQUIRED')
    }

    if (!itemId) {
      return bad('Inventory itemId is required', 'ITEM_ID_REQUIRED')
    }

    if (!locationId) {
      return bad('Receiving locationId is required', 'LOCATION_ID_REQUIRED')
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return bad('Received quantity must be a positive number greater than zero', 'INVALID_QUANTITY')
    }

    const meta = getRequestMeta(req)
    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    }

    const receipt = await FastReceivingService.processFastStockReceipt(
      session.tenantId,
      {
        idempotencyKey: idempotencyKey.trim(),
        itemId,
        branchId,
        locationId,
        quantity: qty,
        purchaseOrderId: purchaseOrderId || null,
        purchaseOrderItemId: purchaseOrderItemId || null,
        unitCost: unitCost !== undefined ? Number(unitCost) : null,
        batchNumber: batchNumber?.trim() || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        serialNumber: serialNumber?.trim() || null,
        invoiceNumber: invoiceNumber?.trim() || null,
        challanNumber: challanNumber?.trim() || null,
        deliveryNotes: deliveryNotes?.trim() || null,
        deliveryPhotoUrl: deliveryPhotoUrl?.trim() || null,
      },
      actor
    )

    return ok(receipt, undefined, receipt.isDuplicate ? 200 : 201)
  } catch (err: any) {
    return bad(err.message || 'Failed to process fast stock receipt', 'RECEIPT_FAILED')
  }
}

export const POST = withApi(_POST)

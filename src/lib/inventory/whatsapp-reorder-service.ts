import { db } from '../db'
import { AuditService } from '../audit/audit-service'
import { ActorContext } from './inventory-service'

export {
  type ReorderItemInput,
  type VendorReorderGroup,
  type GenerateMessageOptions,
  normalizeWhatsAppNumber,
  generateVendorOrderMessage,
  buildWhatsAppClickToChatUrl,
  groupItemsByVendor,
} from './whatsapp-reorder-utils'

import {
  type ReorderItemInput,
  type VendorReorderGroup,
  type GenerateMessageOptions,
  normalizeWhatsAppNumber,
  generateVendorOrderMessage,
  buildWhatsAppClickToChatUrl,
  groupItemsByVendor,
} from './whatsapp-reorder-utils'

/**
 * Service orchestrator for WhatsApp vendor reorders, verification, and audit logging.
 */
export class WhatsAppReorderService {
  /**
   * Prepares and validates a reorder bundle for a tenant/branch.
   * Resolves actual database records for items, vendors, and school branding.
   */
  static async prepareReorder(params: {
    tenantId: string
    branchId?: string | null
    items: Array<{
      itemId: string
      requestedQuantity?: number
      vendorId?: string | null
    }>
    deliveryDate?: string | null
    deliveryNotes?: string | null
  }) {
    const { tenantId, branchId, items: requestedItems } = params

    if (!requestedItems || requestedItems.length === 0) {
      throw new Error('At least one inventory item is required for WhatsApp reorder')
    }

    const itemIds = requestedItems.map((i) => i.itemId)

    // 1. Fetch items with category, unit, default vendor, and stocks
    const dbItems = await db.inventoryItem.findMany({
      where: {
        tenantId,
        id: { in: itemIds },
        isActive: true,
      },
      include: {
        unit: { select: { id: true, name: true, symbol: true } },
        category: { select: { id: true, name: true } },
        defaultVendor: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            alternatePhone: true,
            contactPerson: true,
          },
        },
        stocks: branchId ? { where: { branchId } } : true,
      },
    })

    if (dbItems.length === 0) {
      throw new Error('None of the requested inventory items were found in the current tenant')
    }

    // 2. Fetch tenant & branch names for display
    const [tenant, branch, allVendors] = await Promise.all([
      db.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      }),
      branchId
        ? db.branch.findUnique({
            where: { id: branchId },
            select: { id: true, name: true },
          })
        : null,
      db.vendor.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          phone: true,
          alternatePhone: true,
          contactPerson: true,
        },
        orderBy: { name: 'asc' },
      }),
    ])

    const schoolName = tenant?.name || 'Sunshine Preschool'
    const branchName = branch?.name || null

    // 3. Map items to ReorderItemInput
    const mappedItems: ReorderItemInput[] = dbItems.map((dbItem) => {
      const req = requestedItems.find((r) => r.itemId === dbItem.id)
      const available = dbItem.stocks.reduce(
        (sum, s) => sum + Number(s.availableQuantity || 0),
        0
      )
      const reorderLevel = Number(dbItem.reorderLevel || 0)
      const maxStock = dbItem.maximumStock ? Number(dbItem.maximumStock) : null

      const suggestedReorder = maxStock
        ? Math.max(0, maxStock - available)
        : Math.max(0, reorderLevel * 2 - available || 10)

      const finalQuantity =
        req?.requestedQuantity && req.requestedQuantity > 0
          ? Number(req.requestedQuantity)
          : suggestedReorder > 0
          ? suggestedReorder
          : 10

      // Chosen vendor: explicitly passed vendorId > defaultVendorId
      const targetVendorId = req?.vendorId !== undefined ? req.vendorId : dbItem.defaultVendorId
      const targetVendor = allVendors.find((v) => v.id === targetVendorId) || dbItem.defaultVendor

      return {
        id: dbItem.id,
        name: dbItem.name,
        sku: dbItem.sku,
        availableQuantity: available,
        suggestedReorderQuantity: suggestedReorder,
        requestedQuantity: finalQuantity,
        unit: dbItem.unit?.symbol || dbItem.unit?.name || 'units',
        vendorId: targetVendor?.id || null,
        vendorName: targetVendor?.name || null,
        vendorPhone: targetVendor?.phone || targetVendor?.alternatePhone || null,
        vendorContactPerson: targetVendor?.contactPerson || null,
      }
    })

    // 4. Group items by vendor
    const vendorGroups = groupItemsByVendor(
      mappedItems,
      allVendors,
      schoolName,
      branchName,
      params.deliveryDate,
      params.deliveryNotes
    )

    return {
      schoolName,
      branchName,
      allVendors,
      totalItems: mappedItems.length,
      vendorGroups,
    }
  }

  /**
   * Records an audit log entry for WhatsApp re-order events.
   * Does NOT mutate stock or mark orders as placed.
   */
  static async recordReorderAudit(params: {
    tenantId: string
    branchId?: string | null
    actor: ActorContext
    action: 'INVENTORY_WHATSAPP_REORDER_PREPARED' | 'INVENTORY_WHATSAPP_REORDER_OPENED'
    vendorId?: string | null
    vendorName: string
    vendorPhone?: string | null
    itemCount: number
    items: Array<{ name: string; quantity: number; unit?: string }>
  }) {
    const itemSummary = params.items.map((i) => `${i.quantity} ${i.unit || 'units'} ${i.name}`).join(', ')
    const summary = params.action === 'INVENTORY_WHATSAPP_REORDER_OPENED'
      ? `Opened WhatsApp reorder chat for vendor '${params.vendorName}' (${params.itemCount} items: ${itemSummary})`
      : `Prepared WhatsApp reorder message for vendor '${params.vendorName}' (${params.itemCount} items: ${itemSummary})`

    await AuditService.record({
      tenantId: params.tenantId,
      branchId: params.branchId,
      actorId: params.actor.id,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      action: params.action,
      entity: 'VendorReorder',
      entityId: params.vendorId || undefined,
      module: 'INVENTORY',
      summary,
      ipAddress: params.actor.ipAddress,
      userAgent: params.actor.userAgent,
      requestId: params.actor.requestId,
      newValues: {
        vendorId: params.vendorId,
        vendorName: params.vendorName,
        vendorPhone: params.vendorPhone,
        itemCount: params.itemCount,
        items: params.items,
        timestamp: new Date().toISOString(),
      },
    })
  }
}

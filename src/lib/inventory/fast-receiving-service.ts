import { db } from '../db'
import { AuditService } from '../audit/audit-service'
import { nextNumber } from '../sequence'
import { getDomainConfig, getInventoryConfig } from '../config'
import { S3StorageService } from '../storage/s3-storage-service'
import { ActorContext } from './inventory-service'

export {
  type ItemLookupResult,
  type FastStockReceiptInput,
  type FastStockReceiptResult,
  type FastReceiveSessionItem,
} from './fast-receiving-types'

import {
  type ItemLookupResult,
  type FastStockReceiptInput,
  type FastStockReceiptResult,
} from './fast-receiving-types'

export class FastReceivingService {
  /**
   * Looks up an inventory item by exact SKU/barcode or partial search within tenant.
   * Resolves live stock levels at the given branch and finds any open PO items.
   */
  static async lookupItemByBarcodeOrSku(params: {
    tenantId: string
    code: string
    branchId?: string | null
  }): Promise<{
    exactMatch: ItemLookupResult | null
    matches: ItemLookupResult[]
    availableLocations: Array<{ id: string; name: string; code: string; locationType: string }>
  }> {
    const { tenantId, code, branchId } = params
    const trimmedCode = (code || '').trim()

    if (!trimmedCode) {
      return { exactMatch: null, matches: [], availableLocations: [] }
    }

    // 1. Fetch available locations for the branch
    const locations = await db.inventoryLocation.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        locationType: true,
        branchId: true,
      },
      orderBy: [{ locationType: 'asc' }, { name: 'asc' }],
    })

    // 2. Query items: check exact SKU match first, then broader matches
    const exactDbItem = await db.inventoryItem.findFirst({
      where: {
        tenantId,
        sku: { equals: trimmedCode, mode: 'insensitive' },
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, symbol: true, decimalAllowed: true } },
        defaultVendor: { select: { id: true, name: true, code: true, phone: true, contactPerson: true } },
        stocks: branchId ? { where: { branchId } } : true,
      },
    })

    // Search broader matches if exact wasn't the only one or not found
    const broaderDbItems = await db.inventoryItem.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { sku: { contains: trimmedCode, mode: 'insensitive' } },
          { name: { contains: trimmedCode, mode: 'insensitive' } },
          { description: { contains: trimmedCode, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: {
        category: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, symbol: true, decimalAllowed: true } },
        defaultVendor: { select: { id: true, name: true, code: true, phone: true, contactPerson: true } },
        stocks: branchId ? { where: { branchId } } : true,
      },
      orderBy: { name: 'asc' },
    })

    const allItemMap = new Map<string, any>()
    if (exactDbItem) allItemMap.set(exactDbItem.id, exactDbItem)
    for (const it of broaderDbItems) {
      if (!allItemMap.has(it.id)) {
        allItemMap.set(it.id, it)
      }
    }

    const uniqueItems = Array.from(allItemMap.values())
    const itemIds = uniqueItems.map((i) => i.id)

    // 3. Find open Purchase Orders with pending quantities for these items
    const openPoItems = itemIds.length > 0
      ? await db.purchaseOrderItem.findMany({
          where: {
            itemId: { in: itemIds },
            pendingQuantity: { gt: 0 },
            purchaseOrder: {
              tenantId,
              status: { in: ['ISSUED', 'PARTIALLY_RECEIVED'] },
              ...(branchId ? { branchId } : {}),
            },
          },
          include: {
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                orderDate: true,
                vendor: { select: { id: true, name: true } },
              },
            },
          },
        })
      : []

    // Map open POs by itemId
    const poMap = new Map<string, any[]>()
    for (const poi of openPoItems) {
      if (!poMap.has(poi.itemId)) {
        poMap.set(poi.itemId, [])
      }
      poMap.get(poi.itemId)!.push({
        purchaseOrderId: poi.purchaseOrder.id,
        purchaseOrderItemId: poi.id,
        poNumber: poi.purchaseOrder.poNumber,
        orderDate: poi.purchaseOrder.orderDate,
        vendorName: poi.purchaseOrder.vendor?.name || 'Vendor',
        orderedQuantity: Number(poi.quantity),
        receivedQuantity: Number(poi.receivedQuantity),
        pendingQuantity: Number(poi.pendingQuantity),
        unitPrice: Number(poi.unitPrice),
      })
    }

    // 4. Format results
    const locationMap = new Map(locations.map((l) => [l.id, l]))

    const formatItem = (item: any): ItemLookupResult => {
      const availableQuantity = item.stocks.reduce((sum: number, s: any) => sum + Number(s.availableQuantity || 0), 0)
      const physicalQuantity = item.stocks.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
      const reservedQuantity = item.stocks.reduce((sum: number, s: any) => sum + Number(s.reservedQuantity || 0), 0)

      const stockLocations = item.stocks.map((s: any) => {
        const loc = locationMap.get(s.locationId)
        return {
          locationId: s.locationId,
          locationName: loc?.name || 'Storage',
          locationCode: loc?.code || 'LOC',
          availableQuantity: Number(s.availableQuantity || 0),
          physicalQuantity: Number(s.quantity || 0),
        }
      })

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
        unit: {
          id: item.unit.id,
          name: item.unit.name,
          symbol: item.unit.symbol,
          decimalAllowed: item.unit.decimalAllowed,
        },
        category: {
          id: item.category.id,
          name: item.category.name,
          code: item.category.code,
        },
        defaultVendor: item.defaultVendor
          ? {
              id: item.defaultVendor.id,
              name: item.defaultVendor.name,
              code: item.defaultVendor.code,
              phone: item.defaultVendor.phone,
              contactPerson: item.defaultVendor.contactPerson,
            }
          : null,
        currentStock: {
          availableQuantity,
          physicalQuantity,
          reservedQuantity,
          locations: stockLocations,
        },
        openPurchaseOrders: poMap.get(item.id) || [],
      }
    }

    const matches = uniqueItems.map(formatItem)
    const exactMatch = exactDbItem ? formatItem(exactDbItem) : null

    return {
      exactMatch,
      matches,
      availableLocations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        locationType: l.locationType,
      })),
    }
  }

  /**
   * Executes atomic stock receiving with duplicate submission protection (idempotency).
   * Works for both Direct Fast Receiving and Purchase Order (GRN) linked receiving.
   */
  static async processFastStockReceipt(
    tenantId: string,
    input: FastStockReceiptInput,
    actor: ActorContext
  ): Promise<FastStockReceiptResult> {
    const {
      idempotencyKey,
      itemId,
      branchId,
      locationId,
      quantity,
      purchaseOrderId,
      purchaseOrderItemId,
      batchNumber,
      expiryDate,
      serialNumber,
      invoiceNumber,
      challanNumber,
      deliveryNotes,
      deliveryPhotoUrl,
      unitCost: inputCost,
    } = input

    // 1. Idempotency Check — Prevent duplicate stock increments
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      throw new Error('An idempotencyKey is required for atomic fast stock receiving')
    }

    const existingMovement = await db.stockMovement.findFirst({
      where: {
        tenantId,
        requestId: idempotencyKey.trim(),
      },
      include: {
        item: {
          include: { unit: true },
        },
        toLocation: true,
      },
    })

    if (existingMovement) {
      // Find current stock balance to return authoritative status
      const currentStock = await db.inventoryStock.findFirst({
        where: {
          tenantId,
          branchId: existingMovement.branchId,
          locationId: existingMovement.locationId,
          itemId: existingMovement.itemId,
        },
      })

      const availableQty = currentStock ? Number(currentStock.availableQuantity) : Number(existingMovement.quantity)
      const meta = (existingMovement.metadata as any) || {}

      return {
        success: true,
        isDuplicate: true,
        movementId: existingMovement.id,
        referenceType: existingMovement.referenceType,
        referenceNumber: meta.grnNumber || meta.receiptNumber || existingMovement.id,
        grnNumber: meta.grnNumber || null,
        purchaseOrderId: meta.purchaseOrderId || null,
        itemId: existingMovement.itemId,
        itemName: existingMovement.item.name,
        sku: existingMovement.item.sku,
        receivedQuantity: Number(existingMovement.quantity),
        unitSymbol: existingMovement.item.unit.symbol,
        unitName: existingMovement.item.unit.name,
        previousAvailableQuantity: Math.max(0, availableQty - Number(existingMovement.quantity)),
        newAvailableQuantity: availableQty,
        locationId: existingMovement.locationId,
        locationName: existingMovement.toLocation?.name || 'Storage',
        branchId: existingMovement.branchId,
        receivedAt: existingMovement.createdAt,
        deliveryPhotoUrl: meta.deliveryPhotoUrl || null,
      }
    }

    // 2. Validate Quantity
    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Received quantity must be a positive number greater than zero')
    }

    // 3. Validate Item
    const item = await db.inventoryItem.findFirst({
      where: { id: itemId, tenantId },
      include: {
        unit: true,
        category: true,
        defaultVendor: true,
      },
    })
    if (!item) {
      throw new Error('Inventory item not found in current school tenant')
    }
    if (!item.isActive) {
      throw new Error(`Inventory item '${item.name}' (${item.sku}) is deactivated and cannot receive new stock`)
    }

    // Validate decimal precision if unit disallows decimals
    if (item.unit.decimalAllowed === false && !Number.isInteger(qty)) {
      throw new Error(`Unit '${item.unit.name}' does not allow fractional quantities. Received quantity must be a whole number.`)
    }

    // Validate batch/expiry tracking
    if (item.trackBatch && !batchNumber?.trim()) {
      throw new Error(`Batch number is required for batch-tracked item '${item.name}'`)
    }
    if (item.trackExpiry && !expiryDate) {
      throw new Error(`Expiry date is required for expiry-tracked item '${item.name}'`)
    }

    // 4. Validate Location & Branch
    const location = await db.inventoryLocation.findFirst({
      where: {
        id: locationId,
        tenantId,
        branchId,
      },
    })
    if (!location) {
      throw new Error(`Storage location not found for the selected school branch`)
    }

    // 5. Check PO linking if requested
    let po: any = null
    let poItem: any = null
    if (purchaseOrderId) {
      po = await db.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, tenantId, branchId },
        include: {
          vendor: true,
          items: true,
        },
      })
      if (!po) {
        throw new Error('Linked Purchase Order not found for this school branch')
      }
      if (po.status === 'CANCELLED') {
        throw new Error('Cannot receive goods against a CANCELLED purchase order')
      }
      if (po.status === 'FULLY_RECEIVED') {
        throw new Error('Purchase order is already FULLY_RECEIVED')
      }
      if (po.status !== 'ISSUED' && po.status !== 'PARTIALLY_RECEIVED') {
        throw new Error(`Purchase order must be in ISSUED or PARTIALLY_RECEIVED status (current: ${po.status})`)
      }

      if (purchaseOrderItemId) {
        poItem = po.items.find((i: any) => i.id === purchaseOrderItemId && i.itemId === item.id)
      } else {
        poItem = po.items.find((i: any) => i.itemId === item.id && Number(i.pendingQuantity) > 0)
      }

      if (!poItem) {
        throw new Error(`Item '${item.name}' does not have pending quantity on Purchase Order ${po.poNumber}`)
      }

      const cfg = getInventoryConfig(await getDomainConfig(tenantId, 'INVENTORY'))
      const pendingQty = Number(poItem.pendingQuantity)
      if (!cfg.allowOverReceiving && qty > pendingQty) {
        throw new Error(`Cannot receive ${qty} ${item.unit.symbol}. Only ${pendingQty} ${item.unit.symbol} pending on PO ${po.poNumber}.`)
      }
    }

    const cleanBatchNumber = batchNumber?.trim() || null
    const cleanExpiryDate = expiryDate ? new Date(expiryDate) : null
    const cleanSerialNumber = serialNumber?.trim() || null
    const effectiveCost = inputCost !== undefined && inputCost !== null
      ? Number(inputCost)
      : poItem
      ? Number(poItem.unitPrice)
      : 0

    // 6. Execute Transaction
    const transactionResult = await db.$transaction(async (tx) => {
      let grnRecord: any = null
      let receiptReference = ''

      // A. If PO is linked, create GoodsReceipt & GoodsReceiptItem
      if (po && poItem) {
        const grnNumber = await nextNumber('goods_receipt', tenantId)
        receiptReference = grnNumber

        const lineTotal = qty * effectiveCost

        grnRecord = await tx.goodsReceipt.create({
          data: {
            tenantId,
            branchId,
            purchaseOrderId: po.id,
            vendorId: po.vendorId,
            grnNumber,
            receiptDate: new Date(),
            receivedById: actor.id,
            receivedByName: actor.name,
            status: 'FINALIZED',
            notes: deliveryNotes?.trim() || `Fast mobile receipt: ${item.name} (+${qty} ${item.unit.symbol})`,
            totalReceivedValue: Number(lineTotal.toFixed(2)),
          },
        })

        await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: grnRecord.id,
            purchaseOrderItemId: poItem.id,
            itemId: item.id,
            locationId,
            orderedQuantity: poItem.quantity,
            receivedQuantity: qty,
            acceptedQuantity: qty,
            rejectedQuantity: 0,
            unitCost: effectiveCost,
            batchNumber: cleanBatchNumber,
            expiryDate: cleanExpiryDate,
          },
        })

        // Update PO Item quantities
        const newReceivedQty = Number(poItem.receivedQuantity) + qty
        const newPendingQty = Math.max(0, Number(poItem.quantity) - newReceivedQty)
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            receivedQuantity: newReceivedQty,
            pendingQuantity: newPendingQty,
          },
        })

        // Check if all PO items are received
        const allPoItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: po.id },
        })
        const isFullyReceived = allPoItems.every((i) => Number(i.pendingQuantity) <= 0)
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: isFullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED',
          },
        })

        // Reconcile or create vendor bill invoice if value > 0
        const receivedCents = Math.round(lineTotal * 100)
        if (receivedCents > 0) {
          const existingInvoice = await tx.invoice.findFirst({
            where: {
              tenantId,
              purchaseOrderId: po.id,
              invoiceType: 'VENDOR_BILL',
            },
          })

          if (existingInvoice) {
            await tx.invoice.update({
              where: { id: existingInvoice.id },
              data: {
                subtotalCents: existingInvoice.subtotalCents + receivedCents,
                totalCents: existingInvoice.totalCents + receivedCents,
                balanceCents: (existingInvoice.totalCents + receivedCents) - existingInvoice.paidCents,
                notes: `${existingInvoice.notes || ''} | Fast Receive ${grnNumber} (₹${lineTotal.toFixed(2)})`.trim(),
              },
            })
          } else {
            const invNumber = await nextNumber('invoice', tenantId)
            await tx.invoice.create({
              data: {
                tenantId,
                branchId,
                vendorId: po.vendorId,
                purchaseOrderId: po.id,
                invoiceType: 'VENDOR_BILL',
                invoiceNumber: invNumber,
                title: `Vendor Bill - ${po.poNumber} (${po.vendor.name})`,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotalCents: receivedCents,
                discountCents: 0,
                taxCents: 0,
                totalCents: receivedCents,
                paidCents: 0,
                balanceCents: receivedCents,
                notes: `Auto-generated from Fast Mobile GRN ${grnNumber}`,
              },
            })
          }
        }
      } else {
        // Direct receipt reference code
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randSuffix = Math.floor(1000 + Math.random() * 9000)
        receiptReference = `FST-${dateStr}-${randSuffix}`
      }

      // B. Upsert InventoryStock atomically
      const existingStock = await tx.inventoryStock.findFirst({
        where: {
          tenantId,
          branchId,
          locationId,
          itemId: item.id,
          batchNumber: cleanBatchNumber,
        },
      })

      let prevAvailable = 0
      let newAvailable = 0

      if (existingStock) {
        const curQty = Number(existingStock.quantity)
        prevAvailable = Number(existingStock.availableQuantity)
        const updatedQty = curQty + qty
        newAvailable = prevAvailable + qty

        const prevCost = Number(existingStock.unitCost || effectiveCost)
        const avgCost = updatedQty > 0 ? (curQty * prevCost + qty * effectiveCost) / updatedQty : effectiveCost

        await tx.inventoryStock.update({
          where: { id: existingStock.id },
          data: {
            quantity: updatedQty,
            availableQuantity: newAvailable,
            unitCost: effectiveCost > 0 ? effectiveCost : existingStock.unitCost,
            averageCost: Number(avgCost.toFixed(2)),
            lastMovementAt: new Date(),
          },
        })
      } else {
        prevAvailable = 0
        newAvailable = qty

        await tx.inventoryStock.create({
          data: {
            tenantId,
            branchId,
            locationId,
            itemId: item.id,
            batchNumber: cleanBatchNumber,
            expiryDate: cleanExpiryDate,
            quantity: qty,
            availableQuantity: qty,
            reservedQuantity: 0,
            unitCost: effectiveCost,
            averageCost: effectiveCost,
            lastMovementAt: new Date(),
          },
        })
      }

      // C. Record Immutable Stock Movement
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          branchId,
          itemId: item.id,
          locationId,
          movementType: 'RECEIPT',
          quantity: qty,
          unitCost: effectiveCost,
          referenceType: po ? 'GOODS_RECEIPT' : 'FAST_RECEIPT',
          referenceId: grnRecord?.id || null,
          requestId: idempotencyKey.trim(),
          batchNumber: cleanBatchNumber,
          expiryDate: cleanExpiryDate,
          performedById: actor.id,
          performedByName: actor.name,
          reason: deliveryNotes?.trim() || (po ? `Fast GRN against PO ${po.poNumber}` : 'Fast Mobile Stock Receipt'),
          metadata: {
            source: 'FAST_MOBILE_RECEIVING',
            idempotencyKey: idempotencyKey.trim(),
            receiptNumber: receiptReference,
            grnNumber: grnRecord?.grnNumber || null,
            purchaseOrderId: po?.id || null,
            poNumber: po?.poNumber || null,
            vendorName: po?.vendor?.name || item.defaultVendor?.name || null,
            invoiceNumber: invoiceNumber?.trim() || null,
            challanNumber: challanNumber?.trim() || null,
            deliveryNotes: deliveryNotes?.trim() || null,
            deliveryPhotoUrl: deliveryPhotoUrl?.trim() || null,
          },
        },
      })

      return {
        movement,
        receiptReference,
        grnRecord,
        prevAvailable,
        newAvailable,
      }
    })

    // 7. Record Audit Trail
    await AuditService.record({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'INVENTORY_FAST_STOCK_RECEIVED',
      entity: 'StockMovement',
      entityId: transactionResult.movement.id,
      module: 'INVENTORY',
      summary: `Fast received +${qty} ${item.unit.symbol} for '${item.name}' at location '${location.name}'`,
      newValues: {
        movementId: transactionResult.movement.id,
        reference: transactionResult.receiptReference,
        itemId: item.id,
        sku: item.sku,
        quantity: qty,
        unit: item.unit.symbol,
        locationId: location.id,
        locationName: location.name,
        photoAttached: Boolean(deliveryPhotoUrl),
        poNumber: po?.poNumber || null,
      },
    })

    return {
      success: true,
      isDuplicate: false,
      movementId: transactionResult.movement.id,
      referenceType: po ? 'GOODS_RECEIPT' : 'FAST_RECEIPT',
      referenceNumber: transactionResult.receiptReference,
      grnNumber: transactionResult.grnRecord?.grnNumber || null,
      purchaseOrderId: po?.id || null,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      receivedQuantity: qty,
      unitSymbol: item.unit.symbol,
      unitName: item.unit.name,
      previousAvailableQuantity: transactionResult.prevAvailable,
      newAvailableQuantity: transactionResult.newAvailable,
      locationId: location.id,
      locationName: location.name,
      branchId,
      receivedAt: transactionResult.movement.createdAt,
      deliveryPhotoUrl: deliveryPhotoUrl || null,
    }
  }

  /**
   * Uploads and validates delivery box evidence photo.
   */
  static async uploadDeliveryPhoto(params: {
    tenantId: string
    fileBuffer: Buffer
    mimeType: string
    filename: string
    userId?: string
  }): Promise<{ photoUrl: string; key: string }> {
    const { tenantId, fileBuffer, mimeType, filename, userId } = params

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new Error(`Unsupported image format: ${mimeType}. Allowed formats: JPG, PNG, WEBP`)
    }

    const maxBytes = 5 * 1024 * 1024 // 5MB
    if (fileBuffer.length > maxBytes) {
      throw new Error(`Photo size exceeds 5MB limit (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`)
    }

    const result = await S3StorageService.uploadBufferToS3({
      tenantId,
      category: 'documents',
      buffer: fileBuffer,
      mimeType,
      originalName: filename || 'delivery-box.jpg',
      userId,
    })

    return {
      photoUrl: result.url,
      key: result.key,
    }
  }
}

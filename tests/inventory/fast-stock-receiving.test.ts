import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { FastReceivingService } from '@/lib/inventory/fast-receiving-service'
import { GET as fastLookupRoute } from '@/app/api/v1/inventory/fast-receive/lookup/route'
import { POST as fastReceiveRoute } from '@/app/api/v1/inventory/fast-receive/receive/route'
import { POST as uploadPhotoRoute } from '@/app/api/v1/inventory/fast-receive/upload-photo/route'

describe('PreOne Inventory — Mobile Barcode / Camera Fast Stock Receiving', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let otherBranch: any
  let locationMain: any
  let locationPantry: any
  let otherLocation: any
  let unitBoxes: any
  let unitBottles: any
  let categoryArt: any
  let categorySnacks: any
  let vendorApex: any
  let itemCrayons: any
  let itemJuice: any
  let itemInactive: any
  let purchaseOrder: any
  let poItemCrayons: any

  let adminCookie: string
  let parentCookie: string
  let adminUser: any
  let parentUser: any

  beforeAll(async () => {
    // 1. Seed Tenant & Branches
    tenant = await db.tenant.create({
      data: {
        code: `FAST-REC-TENANT-${ts.slice(-5)}`,
        name: 'Little Explorers Preschool & Daycare',
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Aundh Main Branch',
        code: `BR-AU-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    otherBranch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Kalyani Nagar Branch',
        code: `BR-KN-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    // 2. Locations
    locationMain = await db.inventoryLocation.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: 'Main Store Room',
        code: `LOC-MAIN-${ts.slice(-4)}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })

    locationPantry = await db.inventoryLocation.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: 'Kitchen Pantry',
        code: `LOC-PANTRY-${ts.slice(-4)}`,
        locationType: 'KITCHEN_STORE',
        isActive: true,
      },
    })

    otherLocation = await db.inventoryLocation.create({
      data: {
        tenantId: tenant.id,
        branchId: otherBranch.id,
        name: 'KN Storage',
        code: `LOC-KN-${ts.slice(-4)}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })

    // 3. Units of Measure
    unitBoxes = await db.inventoryUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Boxes',
        code: `BOX-${ts.slice(-4)}`,
        symbol: 'boxes',
        decimalAllowed: false,
      },
    })

    unitBottles = await db.inventoryUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Bottles',
        code: `BTL-${ts.slice(-4)}`,
        symbol: 'bottles',
        decimalAllowed: false,
      },
    })

    // 4. Categories & Vendor
    categoryArt = await db.inventoryCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Art & Craft',
        code: `ART-${ts.slice(-4)}`,
      },
    })

    categorySnacks = await db.inventoryCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Snacks & Pantry',
        code: `SNK-${ts.slice(-4)}`,
      },
    })

    vendorApex = await db.vendor.create({
      data: {
        tenantId: tenant.id,
        name: 'Apex Educational Supplies',
        code: `VEND-APEX-${ts.slice(-4)}`,
        phone: '9876543210',
        contactPerson: 'Mr. Ramesh Gupta',
      },
    })

    // 5. Inventory Items
    itemCrayons = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryArt.id,
        unitId: unitBoxes.id,
        defaultVendorId: vendorApex.id,
        sku: `BARCODE-8901234567890`,
        name: 'Jumbo Wax Crayons (24 Pack)',
        description: 'Non-toxic toddler jumbo wax crayons',
        minimumStock: 10,
        reorderLevel: 25,
        isActive: true,
      },
    })

    itemJuice = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categorySnacks.id,
        unitId: unitBottles.id,
        sku: `SKU-JUICE-100`,
        name: 'Organic Apple Juice 1L',
        minimumStock: 5,
        reorderLevel: 15,
        isActive: true,
      },
    })

    itemInactive = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryArt.id,
        unitId: unitBoxes.id,
        sku: `SKU-DISCONTINUED-99`,
        name: 'Discontinued Modeling Clay',
        isActive: false,
      },
    })

    // 6. Seed initial stock balance for itemCrayons at locationMain
    await db.inventoryStock.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        locationId: locationMain.id,
        itemId: itemCrayons.id,
        quantity: 15,
        availableQuantity: 15,
        reservedQuantity: 0,
        unitCost: 120,
      },
    })

    // 7. Seed Users for Auth Tests
    adminUser = await db.user.create({
      data: {
        email: `admin.fastrec.${ts}@preone.local`,
        fullName: 'Admin Fast Receiver',
        passwordHash: 'hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'PRINCIPAL',
      },
    })

    parentUser = await db.user.create({
      data: {
        email: `parent.fastrec.${ts}@preone.local`,
        fullName: 'Parent Unauthorized',
        passwordHash: 'hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: parentUser.id,
        role: 'PARENT',
      },
    })

    // 8. Seed an open Purchase Order for itemCrayons
    purchaseOrder = await db.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        vendorId: vendorApex.id,
        poNumber: `PO-TEST-${ts.slice(-4)}`,
        orderDate: new Date(),
        status: 'ISSUED',
        subtotal: 2400,
        taxAmount: 0,
        grandTotal: 2400,
        createdById: adminUser.id,
        createdByName: adminUser.fullName,
      },
    })

    poItemCrayons = await db.purchaseOrderItem.create({
      data: {
        purchaseOrderId: purchaseOrder.id,
        itemId: itemCrayons.id,
        quantity: 20,
        unitPrice: 120,
        lineTotal: 2400,
        receivedQuantity: 0,
        pendingQuantity: 20,
      },
    })

    adminCookie = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tenantId: tenant.id,
      branchId: branch.id,
      permissions: ['inventory:read', 'inventory:receive', 'inventory:write'],
    })

    parentCookie = await signSession({
      uid: parentUser.id,
      email: parentUser.email,
      name: parentUser.fullName,
      role: 'PARENT',
      roles: ['PARENT'],
      tenantId: tenant.id,
      branchId: branch.id,
      permissions: [],
    })
  })

  // =========================================================================
  // 1. Barcode & SKU Lookup
  // =========================================================================
  describe('1. Barcode & SKU Lookup Resolution', () => {
    it('accurately resolves exact scanned barcode to the inventory item with stock and locations', async () => {
      const res = await FastReceivingService.lookupItemByBarcodeOrSku({
        tenantId: tenant.id,
        code: 'BARCODE-8901234567890',
        branchId: branch.id,
      })

      expect(res.exactMatch).not.toBeNull()
      expect(res.exactMatch?.id).toBe(itemCrayons.id)
      expect(res.exactMatch?.name).toBe('Jumbo Wax Crayons (24 Pack)')
      expect(res.exactMatch?.sku).toBe('BARCODE-8901234567890')
      expect(res.exactMatch?.unit.symbol).toBe('boxes')
      expect(res.exactMatch?.currentStock.availableQuantity).toBe(15)
      expect(res.availableLocations.length).toBeGreaterThanOrEqual(2)
      expect(res.exactMatch?.openPurchaseOrders.length).toBe(1)
      expect(res.exactMatch?.openPurchaseOrders[0].poNumber).toBe(purchaseOrder.poNumber)
    })

    it('matches partial SKU or product name when barcode is entered partially', async () => {
      const res = await FastReceivingService.lookupItemByBarcodeOrSku({
        tenantId: tenant.id,
        code: 'Apple Juice',
        branchId: branch.id,
      })

      expect(res.matches.length).toBeGreaterThanOrEqual(1)
      const found = res.matches.find((m) => m.id === itemJuice.id)
      expect(found).toBeDefined()
      expect(found?.sku).toBe('SKU-JUICE-100')
      expect(found?.unit.symbol).toBe('bottles')
    })

    it('returns empty matches without crashing for non-existent barcode', async () => {
      const res = await FastReceivingService.lookupItemByBarcodeOrSku({
        tenantId: tenant.id,
        code: 'NON_EXISTENT_9999999',
        branchId: branch.id,
      })

      expect(res.exactMatch).toBeNull()
      expect(res.matches).toHaveLength(0)
    })

    it('returns empty results when empty code is passed', async () => {
      const res = await FastReceivingService.lookupItemByBarcodeOrSku({
        tenantId: tenant.id,
        code: '   ',
        branchId: branch.id,
      })

      expect(res.exactMatch).toBeNull()
      expect(res.matches).toHaveLength(0)
    })
  })

  // =========================================================================
  // 2. Quantity & Unit Validation
  // =========================================================================
  describe('2. Quantity & Unit Validation', () => {
    it('rejects zero or negative quantities', async () => {
      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey: `ERR-QTY-${Date.now()}`,
            itemId: itemCrayons.id,
            branchId: branch.id,
            locationId: locationMain.id,
            quantity: 0,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('Received quantity must be a positive number greater than zero')

      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey: `ERR-NEG-${Date.now()}`,
            itemId: itemCrayons.id,
            branchId: branch.id,
            locationId: locationMain.id,
            quantity: -5,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('Received quantity must be a positive number greater than zero')
    })

    it('rejects fractional quantity when unit does not allow decimals', async () => {
      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey: `ERR-DEC-${Date.now()}`,
            itemId: itemCrayons.id,
            branchId: branch.id,
            locationId: locationMain.id,
            quantity: 4.5,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('does not allow fractional quantities')
    })

    it('rejects receiving stock for a deactivated item', async () => {
      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey: `ERR-INACT-${Date.now()}`,
            itemId: itemInactive.id,
            branchId: branch.id,
            locationId: locationMain.id,
            quantity: 10,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('is deactivated and cannot receive new stock')
    })

    it('rejects receiving into a storage location belonging to another branch', async () => {
      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey: `ERR-LOC-${Date.now()}`,
            itemId: itemCrayons.id,
            branchId: branch.id,
            locationId: otherLocation.id, // from otherBranch
            quantity: 5,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('Storage location not found for the selected school branch')
    })
  })

  // =========================================================================
  // 3. Direct Fast Stock Receipt (without PO)
  // =========================================================================
  describe('3. Direct Fast Stock Receipt (Atomic Update & Ledger)', () => {
    it('atomically adds stock, updates available balance, and creates an immutable StockMovement', async () => {
      const idempotencyKey = `DIRECT-REC-${Date.now()}`
      const prevAvailable = 15 // Seeded initially

      const result = await FastReceivingService.processFastStockReceipt(
        tenant.id,
        {
          idempotencyKey,
          itemId: itemCrayons.id,
          branchId: branch.id,
          locationId: locationMain.id,
          quantity: 10,
          challanNumber: 'DC-88421',
          invoiceNumber: 'INV-APEX-99',
          deliveryNotes: 'Direct store delivery received at reception',
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )

      expect(result.success).toBe(true)
      expect(result.isDuplicate).toBe(false)
      expect(result.receivedQuantity).toBe(10)
      expect(result.previousAvailableQuantity).toBe(prevAvailable)
      expect(result.newAvailableQuantity).toBe(25) // 15 + 10 = 25
      expect(result.referenceType).toBe('FAST_RECEIPT')
      expect(result.referenceNumber).toContain('FST-')

      // Authoritative database check on InventoryStock
      const stockInDb = await db.inventoryStock.findFirst({
        where: {
          tenantId: tenant.id,
          branchId: branch.id,
          locationId: locationMain.id,
          itemId: itemCrayons.id,
        },
      })
      expect(Number(stockInDb?.availableQuantity)).toBe(25)
      expect(Number(stockInDb?.quantity)).toBe(25)

      // Authoritative database check on StockMovement
      const movementInDb = await db.stockMovement.findFirst({
        where: { id: result.movementId },
      })
      expect(movementInDb).not.toBeNull()
      expect(movementInDb?.movementType).toBe('RECEIPT')
      expect(movementInDb?.referenceType).toBe('FAST_RECEIPT')
      expect(Number(movementInDb?.quantity)).toBe(10)
      expect(movementInDb?.performedById).toBe(adminUser.id)

      const meta: any = movementInDb?.metadata
      expect(meta.challanNumber).toBe('DC-88421')
      expect(meta.invoiceNumber).toBe('INV-APEX-99')
      expect(meta.source).toBe('FAST_MOBILE_RECEIVING')
    })

    it('creates initial stock entry if item has zero existing stock at location', async () => {
      const idempotencyKey = `INIT-STOCK-${Date.now()}`

      const result = await FastReceivingService.processFastStockReceipt(
        tenant.id,
        {
          idempotencyKey,
          itemId: itemJuice.id,
          branchId: branch.id,
          locationId: locationPantry.id, // Brand new location for this item
          quantity: 12,
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )

      expect(result.success).toBe(true)
      expect(result.previousAvailableQuantity).toBe(0)
      expect(result.newAvailableQuantity).toBe(12)

      const stockInDb = await db.inventoryStock.findFirst({
        where: {
          locationId: locationPantry.id,
          itemId: itemJuice.id,
        },
      })
      expect(Number(stockInDb?.availableQuantity)).toBe(12)
    })
  })

  // =========================================================================
  // 4. Server-Side Idempotency & Duplicate Protection
  // =========================================================================
  describe('4. Server-Side Idempotency & Duplicate Protection', () => {
    it('rapid duplicate submissions with the same idempotencyKey do not increment stock twice', async () => {
      const sharedIdempotencyKey = `IDEMP-RAPID-${Date.now()}`

      // First call: Should succeed and add 5 units
      const firstResult = await FastReceivingService.processFastStockReceipt(
        tenant.id,
        {
          idempotencyKey: sharedIdempotencyKey,
          itemId: itemCrayons.id,
          branchId: branch.id,
          locationId: locationMain.id,
          quantity: 5,
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )
      expect(firstResult.success).toBe(true)
      expect(firstResult.isDuplicate).toBe(false)
      const stockAfterFirst = firstResult.newAvailableQuantity

      // Second immediate call (simulating double tap / network retry with same key)
      const secondResult = await FastReceivingService.processFastStockReceipt(
        tenant.id,
        {
          idempotencyKey: sharedIdempotencyKey,
          itemId: itemCrayons.id,
          branchId: branch.id,
          locationId: locationMain.id,
          quantity: 5,
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )

      expect(secondResult.success).toBe(true)
      expect(secondResult.isDuplicate).toBe(true)
      expect(secondResult.movementId).toBe(firstResult.movementId)
      expect(secondResult.newAvailableQuantity).toBe(stockAfterFirst) // Exactly the same, zero duplicate increment!

      // Verify authoritative database count
      const movementsCount = await db.stockMovement.count({
        where: { requestId: sharedIdempotencyKey },
      })
      expect(movementsCount).toBe(1)
    })
  })

  // =========================================================================
  // 5. Purchase Order (GRN) Linked Receiving
  // =========================================================================
  describe('5. Purchase Order (GRN) Linked Receiving', () => {
    it('creates GoodsReceipt, updates PO item pending qty, and posts stock', async () => {
      const idempotencyKey = `PO-GRN-${Date.now()}`

      const result = await FastReceivingService.processFastStockReceipt(
        tenant.id,
        {
          idempotencyKey,
          itemId: itemCrayons.id,
          branchId: branch.id,
          locationId: locationMain.id,
          quantity: 8, // Receiving 8 out of 20 ordered
          purchaseOrderId: purchaseOrder.id,
          purchaseOrderItemId: poItemCrayons.id,
          deliveryNotes: 'Partial box delivery via courier',
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )

      expect(result.success).toBe(true)
      expect(result.referenceType).toBe('GOODS_RECEIPT')
      expect(result.grnNumber).toMatch(/^GRN-/)

      // Verify PO Item updated in DB
      const updatedPoItem = await db.purchaseOrderItem.findUnique({
        where: { id: poItemCrayons.id },
      })
      expect(Number(updatedPoItem?.receivedQuantity)).toBe(8)
      expect(Number(updatedPoItem?.pendingQuantity)).toBe(12) // 20 - 8 = 12

      // Verify PO status is PARTIALLY_RECEIVED
      const updatedPo = await db.purchaseOrder.findUnique({
        where: { id: purchaseOrder.id },
      })
      expect(updatedPo?.status).toBe('PARTIALLY_RECEIVED')

      // Verify GoodsReceipt created in DB
      const grnInDb = await db.goodsReceipt.findFirst({
        where: { purchaseOrderId: purchaseOrder.id },
      })
      expect(grnInDb).not.toBeNull()
      expect(grnInDb?.grnNumber).toBe(result.grnNumber!)
    })

    it('blocks over-receipt beyond pending quantity when over-receiving is not permitted', async () => {
      const idempotencyKey = `OVER-REC-${Date.now()}`

      // Attempting to receive 50 units when only 12 are pending
      expect(
        FastReceivingService.processFastStockReceipt(
          tenant.id,
          {
            idempotencyKey,
            itemId: itemCrayons.id,
            branchId: branch.id,
            locationId: locationMain.id,
            quantity: 50,
            purchaseOrderId: purchaseOrder.id,
            purchaseOrderItemId: poItemCrayons.id,
          },
          { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
        )
      ).rejects.toThrow('pending on PO')
    })
  })

  // =========================================================================
  // 6. Delivery Photo Evidence Handling
  // =========================================================================
  describe('6. Delivery Photo Evidence Handling', () => {
    it('validates photo mime types and uploads delivery photo', async () => {
      // Mock valid JPEG buffer
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])

      const upload = await FastReceivingService.uploadDeliveryPhoto({
        tenantId: tenant.id,
        fileBuffer: jpegHeader,
        mimeType: 'image/jpeg',
        filename: 'delivery-box.jpg',
        userId: adminUser.id,
      })

      expect(upload.photoUrl).toBeDefined()
      expect(upload.key).toContain('documents')
    })

    it('rejects unsupported file formats like executable or text files', async () => {
      const textBuffer = Buffer.from('hello plain text')

      expect(
        FastReceivingService.uploadDeliveryPhoto({
          tenantId: tenant.id,
          fileBuffer: textBuffer,
          mimeType: 'text/plain',
          filename: 'notes.txt',
        })
      ).rejects.toThrow('Unsupported image format')
    })
  })

  // =========================================================================
  // 7. HTTP API Routes Integration & Security
  // =========================================================================
  describe('7. HTTP API Routes Integration & Security', () => {
    it('GET /api/v1/inventory/fast-receive/lookup: rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/fast-receive/lookup?code=123')
      const res = await fastLookupRoute(req)
      expect(res.status).toBe(401)
    })

    it('GET /api/v1/inventory/fast-receive/lookup: successfully looks up item for authorized staff', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/inventory/fast-receive/lookup?code=BARCODE-8901234567890&branchId=${branch.id}`,
        {
          headers: {
            Cookie: `${SESSION_COOKIE}=${adminCookie}`,
          },
        }
      )
      const res = await fastLookupRoute(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.exactMatch.name).toBe('Jumbo Wax Crayons (24 Pack)')
    })

    it('POST /api/v1/inventory/fast-receive/receive: rejects unauthorized roles with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/fast-receive/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE}=${parentCookie}`,
        },
        body: JSON.stringify({
          idempotencyKey: `FORBID-${Date.now()}`,
          itemId: itemCrayons.id,
          locationId: locationMain.id,
          quantity: 5,
        }),
      })

      const res = await fastReceiveRoute(req)
      expect(res.status).toBe(403)
    })

    it('POST /api/v1/inventory/fast-receive/receive: validates required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/fast-receive/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE}=${adminCookie}`,
        },
        body: JSON.stringify({
          // Missing idempotencyKey and locationId
          itemId: itemCrayons.id,
          quantity: 5,
        }),
      })

      const res = await fastReceiveRoute(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED')
    })

    it('POST /api/v1/inventory/fast-receive/receive: posts stock and returns 201 on success', async () => {
      const idempotencyKey = `API-SUCCESS-${Date.now()}`
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/fast-receive/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE}=${adminCookie}`,
        },
        body: JSON.stringify({
          idempotencyKey,
          itemId: itemCrayons.id,
          branchId: branch.id,
          locationId: locationMain.id,
          quantity: 3,
          deliveryNotes: 'Courier delivery verified by admin',
        }),
      })

      const res = await fastReceiveRoute(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.receivedQuantity).toBe(3)
      expect(json.data.isDuplicate).toBe(false)
    })
  })
})

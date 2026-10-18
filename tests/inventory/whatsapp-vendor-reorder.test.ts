import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import {
  normalizeWhatsAppNumber,
  generateVendorOrderMessage,
  buildWhatsAppClickToChatUrl,
  groupItemsByVendor,
  WhatsAppReorderService,
} from '@/lib/inventory/whatsapp-reorder-service'
import { POST as whatsappReorderRoute } from '@/app/api/v1/inventory/reorder/whatsapp/route'

describe('PreOne Inventory — 1-Tap WhatsApp Vendor Re-Ordering', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let unitBoxes: any
  let unitSets: any
  let unitBottles: any
  let categoryStationery: any
  let categoryHygiene: any
  let vendorStationery: any
  let vendorCleaners: any
  let vendorNoPhone: any
  let itemCraftPaper: any
  let itemClay: any
  let itemHandwash: any
  let itemNoVendor: any
  let adminCookie: string
  let teacherCookie: string
  let parentCookie: string

  beforeAll(async () => {
    // 1. Seed Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        code: `WHATSAPP-TENANT-${ts.slice(-5)}`,
        name: 'Sunshine Playgroup & Daycare',
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Kothrud Main Campus',
        code: `BR-KT-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    // 2. Units of Measure
    unitBoxes = await db.inventoryUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Boxes',
        code: `BOX-${ts.slice(-4)}`,
        symbol: 'boxes',
      },
    })

    unitSets = await db.inventoryUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Sets',
        code: `SET-${ts.slice(-4)}`,
        symbol: 'sets',
      },
    })

    unitBottles = await db.inventoryUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Bottles',
        code: `BTL-${ts.slice(-4)}`,
        symbol: 'bottles',
      },
    })

    // 3. Categories
    categoryStationery = await db.inventoryCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Arts & Stationery',
        code: `STN-${ts.slice(-4)}`,
      },
    })

    categoryHygiene = await db.inventoryCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Sanitation & Hygiene',
        code: `HYG-${ts.slice(-4)}`,
      },
    })

    // 4. Vendors
    vendorStationery = await db.vendor.create({
      data: {
        tenantId: tenant.id,
        name: 'Raj Stationery & Supplies',
        code: `V-RAJ-${ts.slice(-4)}`,
        contactPerson: 'Rajesh Sharma',
        phone: '9876543210',
        email: 'rajesh@rajstationery.demo',
      },
    })

    vendorCleaners = await db.vendor.create({
      data: {
        tenantId: tenant.id,
        name: 'Apex CleanCare Distributors',
        code: `V-APEX-${ts.slice(-4)}`,
        contactPerson: 'Sunita Patil',
        phone: '+91 91234 56780',
        email: 'orders@apexcleancare.demo',
      },
    })

    vendorNoPhone = await db.vendor.create({
      data: {
        tenantId: tenant.id,
        name: 'Universal Imports (No Phone)',
        code: `V-NOPHONE-${ts.slice(-4)}`,
        contactPerson: 'Anil Gupta',
        phone: null,
      },
    })

    // 5. Inventory Location & Items
    const location = await db.inventoryLocation.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: 'Campus Central Store',
        code: `LOC-${ts.slice(-4)}`,
        locationType: 'MAIN_STORE',
      },
    })

    itemCraftPaper = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryStationery.id,
        unitId: unitBoxes.id,
        defaultVendorId: vendorStationery.id,
        sku: `SKU-PAPER-${ts.slice(-4)}`,
        name: 'A4 Craft Paper (100 Sheets)',
        reorderLevel: 15,
        minimumStock: 5,
        maximumStock: 40,
        stocks: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            locationId: location.id,
            quantity: 3,
            availableQuantity: 3,
            unitCost: 150,
          },
        },
      },
    })

    itemClay = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryStationery.id,
        unitId: unitSets.id,
        defaultVendorId: vendorStationery.id,
        sku: `SKU-CLAY-${ts.slice(-4)}`,
        name: 'Faber-Castell Modelling Clay',
        reorderLevel: 25,
        minimumStock: 10,
        maximumStock: 50,
        stocks: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            locationId: location.id,
            quantity: 8,
            availableQuantity: 8,
            unitCost: 80,
          },
        },
      },
    })

    itemHandwash = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryHygiene.id,
        unitId: unitBottles.id,
        defaultVendorId: vendorCleaners.id,
        sku: `SKU-HANDWASH-${ts.slice(-4)}`,
        name: 'Dettol Liquid Handwash 250ml',
        reorderLevel: 10,
        minimumStock: 4,
        maximumStock: 30,
        stocks: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            locationId: location.id,
            quantity: 2,
            availableQuantity: 2,
            unitCost: 95,
          },
        },
      },
    })

    itemNoVendor = await db.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryStationery.id,
        unitId: unitBoxes.id,
        defaultVendorId: null,
        sku: `SKU-NOVENDOR-${ts.slice(-4)}`,
        name: 'Generic White Chalk',
        reorderLevel: 10,
        minimumStock: 2,
        stocks: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            locationId: location.id,
            quantity: 1,
            availableQuantity: 1,
            unitCost: 30,
          },
        },
      },
    })

    // 6. Test Users & Authentication Tokens
    const adminUser = await db.user.create({
      data: {
        email: `principal.${ts}@sunshine.demo`,
        username: `principal_${ts}`,
        fullName: 'Dr. Sunita Sharma',
        passwordHash: 'dummyHash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PRINCIPAL',
            status: 'ACTIVE',
          },
        },
      },
    })

    const parentUser = await db.user.create({
      data: {
        email: `parent.${ts}@sunshine.demo`,
        username: `parent_${ts}`,
        fullName: 'Rohan Mehta',
        passwordHash: 'dummyHash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PARENT',
            status: 'ACTIVE',
          },
        },
      },
    })

    const adminToken = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL', 'ACCOUNTS'],
    })
    adminCookie = `${SESSION_COOKIE}=${adminToken}`

    const parentToken = await signSession({
      uid: parentUser.id,
      email: parentUser.email,
      name: parentUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })
    parentCookie = `${SESSION_COOKIE}=${parentToken}`
  })

  // =========================================================================
  // 1. PHONE NUMBER NORMALIZATION
  // =========================================================================
  describe('1. Phone Number Normalization', () => {
    it('normalizes standard 10-digit Indian numbers with 91 country code', () => {
      expect(normalizeWhatsAppNumber('9876543210')).toBe('919876543210')
      expect(normalizeWhatsAppNumber(' 9876543210 ')).toBe('919876543210')
    })

    it('strips leading trunk zero prefix and adds 91 country code', () => {
      expect(normalizeWhatsAppNumber('09876543210')).toBe('919876543210')
    })

    it('normalizes formatted phone numbers with spaces, dashes, parens, and plus symbols', () => {
      expect(normalizeWhatsAppNumber('+91 98765-43210')).toBe('919876543210')
      expect(normalizeWhatsAppNumber('+91 (98765) 43210')).toBe('919876543210')
      expect(normalizeWhatsAppNumber('+1 (415) 555-2671')).toBe('14155552671')
    })

    it('returns null for missing, empty, or invalid numbers', () => {
      expect(normalizeWhatsAppNumber(null)).toBeNull()
      expect(normalizeWhatsAppNumber(undefined)).toBeNull()
      expect(normalizeWhatsAppNumber('')).toBeNull()
      expect(normalizeWhatsAppNumber('   ')).toBeNull()
      expect(normalizeWhatsAppNumber('12345')).toBeNull() // Too short
      expect(normalizeWhatsAppNumber('abcdefghij')).toBeNull() // No digits
    })
  })

  // =========================================================================
  // 2. PROFESSIONAL PREFILLED MESSAGE GENERATION
  // =========================================================================
  describe('2. Professional Prefilled Message Generation', () => {
    it('generates a clean, polite preschool vendor order message matching the required format', () => {
      const msg = generateVendorOrderMessage({
        vendorName: 'Raj Stationery',
        schoolName: 'Sunshine Preschool',
        branchName: 'Main Campus',
        items: [
          { name: 'A4 Craft Paper', quantity: 10, unit: 'boxes' },
          { name: 'Faber-Castell Clay', quantity: 20, unit: 'sets' },
          { name: 'Dettol Handwash', quantity: 5, unit: 'bottles' },
        ],
      })

      expect(msg).toContain('Hi Raj Stationery,')
      expect(msg).toContain('Please arrange the following supplies for Sunshine Preschool (Main Campus):')
      expect(msg).toContain('• 10 boxes — A4 Craft Paper')
      expect(msg).toContain('• 20 sets — Faber-Castell Clay')
      expect(msg).toContain('• 5 bottles — Dettol Handwash')
      expect(msg).toContain('Please confirm availability and expected delivery. Kindly send the invoice to accounts.')
      expect(msg).toContain('Thank you,\nSunshine Preschool (Main Campus)')

      // Must not leak internal prices or confidential notes
      expect(msg).not.toContain('costPrice')
      expect(msg).not.toContain('₹')
      expect(msg).not.toContain('cents')
    })

    it('supports optional delivery date and location notes when provided', () => {
      const msg = generateVendorOrderMessage({
        vendorName: 'Apex CleanCare',
        schoolName: 'Sunshine Preschool',
        items: [{ name: 'Hand Sanitizer', quantity: 5, unit: 'bottles' }],
        deliveryDate: 'Tomorrow by 11:00 AM',
        deliveryNotes: 'Deliver to Reception / Gate 1',
      })

      expect(msg).toContain('Expected Delivery: Tomorrow by 11:00 AM')
      expect(msg).toContain('Delivery Location / Notes: Deliver to Reception / Gate 1')
    })

    it('falls back gracefully to school name only when branchName is not supplied', () => {
      const msg = generateVendorOrderMessage({
        vendorName: 'Apex CleanCare',
        schoolName: 'Sunshine Playgroup',
        items: [{ name: 'Hand Sanitizer', quantity: 2, unit: 'cans' }],
      })

      expect(msg).toContain('Please arrange the following supplies for Sunshine Playgroup:')
      expect(msg).toContain('Thank you,\nSunshine Playgroup')
      expect(msg).not.toContain('(')
    })
  })

  // =========================================================================
  // 3. WHATSAPP CLICK-TO-CHAT DEEP LINK CONSTRUCTION
  // =========================================================================
  describe('3. WhatsApp Click-to-Chat Deep-Link Construction', () => {
    it('constructs a valid wa.me link with URL-encoded message text and E.164 phone number', () => {
      const message = 'Hi Raj Stationery,\n\n• 10 boxes — Craft Paper'
      const url = buildWhatsAppClickToChatUrl('9876543210', message)

      expect(url).toStartWith('https://wa.me/919876543210?text=')
      expect(url).toContain(encodeURIComponent('Hi Raj Stationery,'))
      expect(url).toContain(encodeURIComponent('• 10 boxes — Craft Paper'))
    })

    it('throws when attempting to build click-to-chat URL with invalid phone', () => {
      expect(() => buildWhatsAppClickToChatUrl('123', 'Hello')).toThrow(
        'Cannot construct WhatsApp URL with invalid phone number'
      )
    })
  })

  // =========================================================================
  // 4. MULTI-VENDOR ITEM GROUPING
  // =========================================================================
  describe('4. Multi-Vendor Item Grouping', () => {
    it('groups multi-item order by assigned vendor with independent WhatsApp actions', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'A4 Craft Paper',
          requestedQuantity: 10,
          unit: 'boxes',
          vendorId: vendorStationery.id,
        },
        {
          id: 'item-2',
          name: 'Modelling Clay',
          requestedQuantity: 20,
          unit: 'sets',
          vendorId: vendorStationery.id,
        },
        {
          id: 'item-3',
          name: 'Handwash Liquid',
          requestedQuantity: 5,
          unit: 'bottles',
          vendorId: vendorCleaners.id,
        },
        {
          id: 'item-4',
          name: 'White Chalk',
          requestedQuantity: 15,
          unit: 'boxes',
          vendorId: null, // Unassigned
        },
      ]

      const groups = groupItemsByVendor(
        mockItems,
        [vendorStationery, vendorCleaners],
        'Sunshine Preschool',
        'Main Branch'
      )

      expect(groups.length).toBe(3)

      // Group 1: Stationery (2 items)
      const stationeryGroup = groups.find((g) => g.vendorId === vendorStationery.id)
      expect(stationeryGroup).toBeDefined()
      expect(stationeryGroup!.items.length).toBe(2)
      expect(stationeryGroup!.isPhoneValid).toBe(true)
      expect(stationeryGroup!.normalizedPhone).toBe('919876543210')
      expect(stationeryGroup!.whatsAppUrl).toStartWith('https://wa.me/919876543210?text=')

      // Group 2: Cleaners (1 item)
      const cleanersGroup = groups.find((g) => g.vendorId === vendorCleaners.id)
      expect(cleanersGroup).toBeDefined()
      expect(cleanersGroup!.items.length).toBe(1)
      expect(cleanersGroup!.isPhoneValid).toBe(true)
      expect(cleanersGroup!.normalizedPhone).toBe('919123456780')

      // Group 3: Unassigned (1 item)
      const unassignedGroup = groups.find((g) => g.vendorId === null)
      expect(unassignedGroup).toBeDefined()
      expect(unassignedGroup!.items.length).toBe(1)
      expect(unassignedGroup!.isPhoneValid).toBe(false)
      expect(unassignedGroup!.whatsAppUrl).toBeNull()
    })

    it('marks vendors with missing contact numbers as invalid without crashing', () => {
      const mockItems = [
        {
          id: 'item-x',
          name: 'Special Item',
          requestedQuantity: 5,
          unit: 'units',
          vendorId: vendorNoPhone.id,
        },
      ]

      const groups = groupItemsByVendor(
        mockItems,
        [vendorNoPhone],
        'Sunshine Preschool'
      )

      expect(groups.length).toBe(1)
      expect(groups[0].isPhoneValid).toBe(false)
      expect(groups[0].whatsAppUrl).toBeNull()
    })
  })

  // =========================================================================
  // 5. SERVICE INTEGRATION & ZERO STOCK MUTATION SAFEGUARD
  // =========================================================================
  describe('5. Service Orchestration & Inventory Integrity Safeguard', () => {
    it('prepares vendor reorders from actual database items without modifying on-hand stock', async () => {
      // Record on-hand stocks before
      const stockBeforePaper = await db.inventoryStock.findFirst({
        where: { itemId: itemCraftPaper.id },
      })
      const stockBeforeHandwash = await db.inventoryStock.findFirst({
        where: { itemId: itemHandwash.id },
      })

      const prepared = await WhatsAppReorderService.prepareReorder({
        tenantId: tenant.id,
        branchId: branch.id,
        items: [
          { itemId: itemCraftPaper.id, requestedQuantity: 15 },
          { itemId: itemHandwash.id, requestedQuantity: 8 },
        ],
      })

      expect(prepared.schoolName).toBe('Sunshine Playgroup & Daycare')
      expect(prepared.branchName).toBe('Kothrud Main Campus')
      expect(prepared.totalItems).toBe(2)
      expect(prepared.vendorGroups.length).toBe(2)

      // Verify on-hand stock quantities in database are STRICTLY UNCHANGED
      const stockAfterPaper = await db.inventoryStock.findFirst({
        where: { itemId: itemCraftPaper.id },
      })
      const stockAfterHandwash = await db.inventoryStock.findFirst({
        where: { itemId: itemHandwash.id },
      })

      expect(Number(stockAfterPaper?.availableQuantity)).toBe(
        Number(stockBeforePaper?.availableQuantity)
      )
      expect(Number(stockAfterHandwash?.availableQuantity)).toBe(
        Number(stockBeforeHandwash?.availableQuantity)
      )

      // Verify no PurchaseOrder was prematurely created
      const poCount = await db.purchaseOrder.count({
        where: { tenantId: tenant.id },
      })
      expect(poCount).toBe(0)
    })

    it('records audit log entries for WhatsApp reorder preparation and opening', async () => {
      const actor = {
        id: 'actor-test',
        name: 'Dr. Sunita Sharma',
        role: 'PRINCIPAL',
        ipAddress: '127.0.0.1',
      }

      await WhatsAppReorderService.recordReorderAudit({
        tenantId: tenant.id,
        branchId: branch.id,
        actor,
        action: 'INVENTORY_WHATSAPP_REORDER_OPENED',
        vendorId: vendorStationery.id,
        vendorName: vendorStationery.name,
        vendorPhone: vendorStationery.phone,
        itemCount: 2,
        items: [
          { name: 'A4 Craft Paper', quantity: 10, unit: 'boxes' },
          { name: 'Modelling Clay', quantity: 20, unit: 'sets' },
        ],
      })

      // Query audit log
      const log = await db.auditLog.findFirst({
        where: {
          tenantId: tenant.id,
          action: 'INVENTORY_WHATSAPP_REORDER_OPENED',
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(log).toBeDefined()
      expect(log?.actorName).toBe('Dr. Sunita Sharma')
      expect(log?.entity).toBe('VendorReorder')
      expect(log?.summary).toContain('Opened WhatsApp reorder chat for vendor')
      expect(log?.summary).toContain('Raj Stationery')
    })
  })

  // =========================================================================
  // 6. HTTP API ROUTE HANDLER & RBAC ENFORCEMENT
  // =========================================================================
  describe('6. HTTP API Route: POST /api/v1/inventory/reorder/whatsapp', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/reorder/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PREPARE',
          items: [{ itemId: itemCraftPaper.id, requestedQuantity: 10 }],
        }),
      })

      const res = await whatsappReorderRoute(req)
      expect(res.status).toBe(401)
    })

    it('rejects unauthorized roles (PARENT, GUARDIAN) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/reorder/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: parentCookie,
        },
        body: JSON.stringify({
          action: 'PREPARE',
          items: [{ itemId: itemCraftPaper.id, requestedQuantity: 10 }],
        }),
      })

      const res = await whatsappReorderRoute(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('rejects requests with missing or empty items array', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/reorder/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          action: 'PREPARE',
          items: [],
        }),
      })

      const res = await whatsappReorderRoute(req)
      expect(res.status).toBe(400)
    })

    it('successfully prepares reorder bundle for authorized administrators', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/reorder/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          action: 'PREPARE',
          items: [
            { itemId: itemCraftPaper.id, requestedQuantity: 12 },
            { itemId: itemClay.id, requestedQuantity: 25 },
            { itemId: itemHandwash.id, requestedQuantity: 6 },
          ],
          deliveryDate: 'Friday, 10:00 AM',
          deliveryNotes: 'Deliver to Kindergarten Reception',
        }),
      })

      const res = await whatsappReorderRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.totalItems).toBe(3)
      expect(json.data.vendorGroups.length).toBe(2)

      const stationeryGroup = json.data.vendorGroups.find(
        (g: any) => g.vendorName.includes('Raj Stationery')
      )
      expect(stationeryGroup).toBeDefined()
      expect(stationeryGroup.items.length).toBe(2)
      expect(stationeryGroup.isPhoneValid).toBe(true)
      expect(stationeryGroup.whatsAppUrl).toStartWith('https://wa.me/919876543210')
      expect(stationeryGroup.generatedMessage).toContain('Expected Delivery: Friday, 10:00 AM')
      expect(stationeryGroup.generatedMessage).toContain('Delivery Location / Notes: Deliver to Kindergarten Reception')
    })

    it('records AUDIT_OPENED event when user launches WhatsApp', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/reorder/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          action: 'AUDIT_OPENED',
          vendorId: vendorStationery.id,
          vendorName: vendorStationery.name,
          vendorPhone: '919876543210',
          items: [
            { name: 'A4 Craft Paper', quantity: 12, unit: 'boxes' },
          ],
        }),
      })

      const res = await whatsappReorderRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.action).toBe('INVENTORY_WHATSAPP_REORDER_OPENED')
    })
  })
})

import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'
import { InventoryService } from '@/lib/inventory/inventory-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

import { GET as catalogGet } from '@/app/api/v1/inventory/supply-store/catalog/route'
import { POST as validateCartPost } from '@/app/api/v1/inventory/supply-store/validate-cart/route'
import { POST as submitCartPost } from '@/app/api/v1/inventory/supply-store/submit/route'
import { GET as requestGet } from '@/app/api/v1/inventory/material-requests/[id]/route'
import { POST as approvePost } from '@/app/api/v1/inventory/material-requests/[id]/approve/route'
import { POST as rejectPost } from '@/app/api/v1/inventory/material-requests/[id]/reject/route'
import { POST as fulfillPost } from '@/app/api/v1/inventory/material-requests/[id]/fulfill/route'

describe('PreOne Inventory Module — Teacher Classroom Supply Cart & Approval Workflow', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchB1: string
  let locationA1: string
  let locationB1: string
  let academicSessionA: string
  let classroomA1: string
  let classroomB1: string

  let teacherUserA: any
  let principalUserA: any
  let staffUserA: any
  let principalUserB: any

  let teacherCookieA: string
  let principalCookieA: string
  let staffCookieA: string
  let principalCookieB: string

  let categoryArt: any
  let categoryPaper: any
  let unitBox: any
  let unitPack: any

  let itemCrayons: any
  let itemPaint: any
  let itemPaper: any
  let itemOutOfStock: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant A
    const tA = await db.tenant.create({
      data: {
        name: `Cart School A ${ts}`,
        code: `CART_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    // 2. Create Tenant B (Cross-tenant isolation)
    const tB = await db.tenant.create({
      data: {
        name: `Cart School B ${ts}`,
        code: `CART_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 3. Branches
    const brA = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus A',
        code: `BR_A_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchA1 = brA.id

    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Main Campus B',
        code: `BR_B_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchB1 = brB.id

    // 4. Store Locations
    const locA = await db.inventoryLocation.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        name: 'Central Supply Depot A',
        code: `DEPOT_A_${ts}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })
    locationA1 = locA.id

    const locB = await db.inventoryLocation.create({
      data: {
        tenantId: tenantB,
        branchId: branchB1,
        name: 'Central Supply Depot B',
        code: `DEPOT_B_${ts}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })
    locationB1 = locB.id

    // 5. Academic Sessions
    const sesA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })
    academicSessionA = sesA.id

    const sesB = await db.academicSession.create({
      data: {
        tenantId: tenantB,
        name: `2026-2027 ${ts} B`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })

    // 6. Users
    teacherUserA = await db.user.create({
      data: {
        email: `teacher.a.${ts}@preone.test`,
        fullName: 'Priya Sharma (Teacher)',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    principalUserA = await db.user.create({
      data: {
        email: `principal.a.${ts}@preone.test`,
        fullName: 'Dr. Anita Desai (Principal)',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    staffUserA = await db.user.create({
      data: {
        email: `inventory.staff.a.${ts}@preone.test`,
        fullName: 'Ramesh Storekeeper',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    principalUserB = await db.user.create({
      data: {
        email: `principal.b.${ts}@preone.test`,
        fullName: 'Other Principal B',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    // 6b. TenantUser Memberships
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: teacherUserA.id,
        role: 'TEACHER',
        branchId: branchA1,
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: principalUserA.id,
        role: 'PRINCIPAL',
        branchId: branchA1,
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: staffUserA.id,
        role: 'STAFF',
        branchId: branchA1,
      },
    })

    // 7. Classrooms
    const clsA = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        name: 'Playgroup Butterflies',
        code: `PG-BUTTERFLY-${ts}`,
        programType: 'PLAYGROUP',
        primaryTeacherId: teacherUserA.id,
        capacity: 15,
        isActive: true,
      },
    })
    classroomA1 = clsA.id

    const clsB = await db.classroom.create({
      data: {
        tenantId: tenantB,
        branchId: branchB1,
        academicSessionId: sesB.id,
        name: 'Class B Room',
        code: `CLS-B-${ts}`,
        programType: 'NURSERY',
        capacity: 20,
        isActive: true,
      },
    })
    classroomB1 = clsB.id

    // 8. Inventory Categories & Units
    categoryArt = await db.inventoryCategory.create({
      data: {
        tenantId: tenantA,
        name: 'Art & Craft',
        code: `ART_${ts}`,
      },
    })

    categoryPaper = await db.inventoryCategory.create({
      data: {
        tenantId: tenantA,
        name: 'Paper & Stationery',
        code: `PPR_${ts}`,
      },
    })

    unitBox = await db.inventoryUnit.create({
      data: {
        tenantId: tenantA,
        name: 'Box of 24',
        code: `BOX_${ts}`,
        symbol: 'box',
      },
    })

    unitPack = await db.inventoryUnit.create({
      data: {
        tenantId: tenantA,
        name: 'Pack of 50',
        code: `PACK_${ts}`,
        symbol: 'pack',
      },
    })

    // 9. Inventory Items
    itemCrayons = await db.inventoryItem.create({
      data: {
        tenantId: tenantA,
        name: 'Washable Jumbo Wax Crayons',
        sku: `SKU-CRAYON-${ts}`,
        categoryId: categoryArt.id,
        unitId: unitBox.id,
        itemType: 'CONSUMABLE',
        trackStock: true,
        reorderLevel: 5,
      },
    })

    itemPaint = await db.inventoryItem.create({
      data: {
        tenantId: tenantA,
        name: 'Non-Toxic Finger Paint Set',
        sku: `SKU-PAINT-${ts}`,
        categoryId: categoryArt.id,
        unitId: unitBox.id,
        itemType: 'CONSUMABLE',
        trackStock: true,
        reorderLevel: 5,
      },
    })

    itemPaper = await db.inventoryItem.create({
      data: {
        tenantId: tenantA,
        name: 'Colored Chart Paper Assorted',
        sku: `SKU-CHART-${ts}`,
        categoryId: categoryPaper.id,
        unitId: unitPack.id,
        itemType: 'CONSUMABLE',
        trackStock: true,
        reorderLevel: 10,
      },
    })

    itemOutOfStock = await db.inventoryItem.create({
      data: {
        tenantId: tenantA,
        name: 'Organic Wet Wipes Pack',
        sku: `SKU-WIPES-${ts}`,
        categoryId: categoryArt.id,
        unitId: unitPack.id,
        itemType: 'CONSUMABLE',
        trackStock: true,
        reorderLevel: 10,
      },
    })

    // 10. Seed Stock in Location A1
    await db.inventoryStock.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        locationId: locationA1,
        itemId: itemCrayons.id,
        quantity: 50,
        availableQuantity: 50,
        unitCost: 150,
      },
    })

    await db.inventoryStock.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        locationId: locationA1,
        itemId: itemPaint.id,
        quantity: 20,
        availableQuantity: 20,
        unitCost: 250,
      },
    })

    await db.inventoryStock.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        locationId: locationA1,
        itemId: itemPaper.id,
        quantity: 100,
        availableQuantity: 100,
        unitCost: 200,
      },
    })

    // itemOutOfStock has 0 stock record or empty quantity

    // 11. Create Session Cookies
    teacherCookieA = await signSession({
      uid: teacherUserA.id,
      email: teacherUserA.email,
      name: teacherUserA.fullName,
      role: 'TEACHER',
      tenantId: tenantA,
      branchId: branchA1,
    })

    principalCookieA = await signSession({
      uid: principalUserA.id,
      email: principalUserA.email,
      name: principalUserA.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantA,
      branchId: branchA1,
    })

    staffCookieA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      name: staffUserA.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantA,
      branchId: branchA1,
    })

    principalCookieB = await signSession({
      uid: principalUserB.id,
      email: principalUserB.email,
      name: principalUserB.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantB,
      branchId: branchB1,
    })
  })

  // Helper request builder
  function makeReq(url: string, method: string, cookie: string, body?: any) {
    const headers: Record<string, string> = {
      cookie: `${SESSION_COOKIE}=${cookie}`,
    }
    if (body) {
      headers['content-type'] = 'application/json'
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  describe('1. Teacher Supply Store Catalog & Auto-resolution', () => {
    it('returns catalog items with preschool emoji icons, live stock, and teacher classroom', async () => {
      const req = makeReq('http://localhost/api/v1/inventory/supply-store/catalog', 'GET', teacherCookieA)
      const res = await catalogGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.items).toBeDefined()
      expect(json.data.items.length).toBeGreaterThanOrEqual(4)

      // Verify preschool emoji enrichment
      const crayonCard = json.data.items.find((i: any) => i.id === itemCrayons.id)
      expect(crayonCard).toBeDefined()
      expect(crayonCard.iconEmoji).toBe('🖍️')
      expect(crayonCard.availableStock).toBe(50)
      expect(crayonCard.isOutOfStock).toBe(false)

      const paintCard = json.data.items.find((i: any) => i.id === itemPaint.id)
      expect(paintCard).toBeDefined()
      expect(paintCard.iconEmoji).toBe('🎨')

      const paperCard = json.data.items.find((i: any) => i.id === itemPaper.id)
      expect(paperCard).toBeDefined()
      expect(paperCard.iconEmoji).toBe('📄')

      const outOfStockCard = json.data.items.find((i: any) => i.id === itemOutOfStock.id)
      expect(outOfStockCard).toBeDefined()
      expect(outOfStockCard.availableStock).toBe(0)
      expect(outOfStockCard.isOutOfStock).toBe(true)

      // Verify auto-detected classroom for primary teacher
      expect(json.data.classroom).toBeDefined()
      expect(json.data.classroom.id).toBe(classroomA1)
      expect(json.data.classroom.name).toBe('Playgroup Butterflies')
    })
  })

  describe('2. Classroom Request Cart Validation', () => {
    it('fails when cart is empty', async () => {
      const req = makeReq(
        'http://localhost/api/v1/inventory/supply-store/validate-cart',
        'POST',
        teacherCookieA,
        { items: [] }
      )
      const res = await validateCartPost(req)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.isValid).toBe(false)
      expect(json.data.errors.some((e: string) => e.toLowerCase().includes('empty'))).toBe(true)
    })

    it('flags items exceeding live available stock', async () => {
      const req = makeReq(
        'http://localhost/api/v1/inventory/supply-store/validate-cart',
        'POST',
        teacherCookieA,
        {
          items: [
            { itemId: itemCrayons.id, quantity: 100 }, // only 50 available
            { itemId: itemOutOfStock.id, quantity: 2 }, // 0 available
          ],
        }
      )
      const res = await validateCartPost(req)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.isValid).toBe(false)
      expect(json.data.stockIssues.length).toBe(2)
      expect(json.data.stockIssues.some((s: any) => s.itemId === itemOutOfStock.id && !s.isStockSufficient)).toBe(true)
    })

    it('passes validation for valid in-stock quantities', async () => {
      const req = makeReq(
        'http://localhost/api/v1/inventory/supply-store/validate-cart',
        'POST',
        teacherCookieA,
        {
          items: [
            { itemId: itemCrayons.id, quantity: 5 },
            { itemId: itemPaint.id, quantity: 3 },
          ],
        }
      )
      const res = await validateCartPost(req)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.isValid).toBe(true)
      expect(json.data.errors.length).toBe(0)
    })
  })

  describe('3. Submit Request for Approval Workflow', () => {
    let createdRequestId: string
    let createdRequestNumber: string

    it('teacher submits supply cart request with classroom and purpose', async () => {
      const req = makeReq(
        'http://localhost/api/v1/inventory/supply-store/submit',
        'POST',
        teacherCookieA,
        {
          classroomId: classroomA1,
          requiredDate: new Date('2026-11-01').toISOString(),
          priority: 'NORMAL',
          purpose: 'Sensory Art & Butterfly Painting Activity',
          items: [
            { itemId: itemCrayons.id, quantity: 4, notes: 'Yellow and green shades' },
            { itemId: itemPaint.id, quantity: 2, notes: 'Washable primary colors' },
          ],
        }
      )
      const res = await submitCartPost(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.requestNumber).toMatch(/^MR-/)
      expect(json.data.status).toBe('PENDING')
      expect(json.data.items.length).toBe(2)
      expect(json.data.classroomId).toBe(classroomA1)

      createdRequestId = json.data.id
      createdRequestNumber = json.data.requestNumber

      // Verify in-app notification created for Principal
      const notifs = await db.inAppNotification.findMany({
        where: {
          tenantId: tenantA,
          userId: principalUserA.id,
          category: 'INVENTORY',
        },
      })
      expect(notifs.length).toBeGreaterThanOrEqual(1)
      expect(notifs.some((n) => n.title.includes('Supply Request'))).toBe(true)
    })

    it('retrieves detailed request with line items and current live stock', async () => {
      const req = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${createdRequestId}`,
        'GET',
        principalCookieA
      )
      const res = await requestGet(req, { params: Promise.resolve({ id: createdRequestId }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.id).toBe(createdRequestId)
      expect(json.data.requestNumber).toBe(createdRequestNumber)
      expect(json.data.status).toBe('PENDING')
      expect(json.data.items[0].currentAvailableStock).toBeDefined()
    })

    it('prevents cross-tenant access to request details', async () => {
      const req = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${createdRequestId}`,
        'GET',
        principalCookieB // Tenant B
      )
      const res = await requestGet(req, { params: Promise.resolve({ id: createdRequestId }) })
      expect(res.status).toBe(404)
    })
  })

  describe('4. Principal Review: Approval & Mandatory Rejection Reason', () => {
    let pendingRequestId: string

    beforeAll(async () => {
      // Create request to reject
      const req = await SupplyCartService.submitSupplyRequest(
        tenantA,
        {
          classroomId: classroomA1,
          branchId: branchA1,
          requiredDate: new Date('2026-11-10'),
          purpose: 'Extra Paper Sheets',
          items: [{ itemId: itemPaper.id, quantity: 20 }],
        },
        {
          id: teacherUserA.id,
          name: teacherUserA.fullName,
          role: 'TEACHER',
        }
      )
      pendingRequestId = req.id
    })

    it('rejecting without reason is blocked', async () => {
      const req = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${pendingRequestId}/reject`,
        'POST',
        principalCookieA,
        { reason: '   ' } // Empty / whitespace
      )
      const res = await rejectPost(req, { params: Promise.resolve({ id: pendingRequestId }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error?.message.toLowerCase()).toContain('rejection reason is mandatory')
    })

    it('rejecting with reason updates status to REJECTED and notifies teacher', async () => {
      const req = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${pendingRequestId}/reject`,
        'POST',
        principalCookieA,
        { reason: 'Paper quota exhausted for this month. Please re-apply next cycle.' }
      )
      const res = await rejectPost(req, { params: Promise.resolve({ id: pendingRequestId }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('REJECTED')
      expect(json.data.rejectionReason).toContain('Paper quota exhausted')
      expect(json.data.rejectedByName).toBe(principalUserA.fullName)

      // Verify teacher received notification
      const teacherNotifs = await db.inAppNotification.findMany({
        where: {
          tenantId: tenantA,
          userId: teacherUserA.id,
          category: 'INVENTORY',
        },
      })
      expect(teacherNotifs.some((n) => n.title.includes('Supply Request Rejected'))).toBe(true)
    })

    it('approving request updates status to APPROVED with reviewer recorded', async () => {
      // Create fresh request to approve
      const req = await SupplyCartService.submitSupplyRequest(
        tenantA,
        {
          classroomId: classroomA1,
          branchId: branchA1,
          requiredDate: new Date('2026-11-05'),
          purpose: 'Finger Painting Session',
          items: [{ itemId: itemPaint.id, quantity: 5 }],
        },
        {
          id: teacherUserA.id,
          name: teacherUserA.fullName,
          role: 'TEACHER',
        }
      )

      const approveReq = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${req.id}/approve`,
        'POST',
        principalCookieA,
        { notes: 'Approved for Nursery art workshop.' }
      )
      const res = await approvePost(approveReq, { params: Promise.resolve({ id: req.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('APPROVED')
      expect(json.data.approvedByName).toBe(principalUserA.fullName)

      // Verify stock was NOT decremented at approval time
      const stock = await db.inventoryStock.findFirst({
        where: { tenantId: tenantA, locationId: locationA1, itemId: itemPaint.id },
      })
      expect(Number(stock?.availableQuantity)).toBe(20) // unchanged!
    })
  })

  describe('5. Inventory Fulfilment & Atomic Stock Safety', () => {
    let approvedRequestId: string
    const requestQty = 6

    beforeAll(async () => {
      // Create and approve request
      const req = await SupplyCartService.submitSupplyRequest(
        tenantA,
        {
          classroomId: classroomA1,
          branchId: branchA1,
          requiredDate: new Date('2026-11-05'),
          purpose: 'Sensory play crayons',
          items: [{ itemId: itemCrayons.id, quantity: requestQty }],
        },
        {
          id: teacherUserA.id,
          name: teacherUserA.fullName,
          role: 'TEACHER',
        }
      )
      await SupplyCartService.approveSupplyRequest(
        tenantA,
        req.id,
        {
          id: principalUserA.id,
          name: principalUserA.fullName,
          role: 'PRINCIPAL',
        },
        { notes: 'Approved for classroom dispatch.' }
      )
      approvedRequestId = req.id
    })

    it('cannot fulfill a non-approved request', async () => {
      // Create pending request
      const pendingReq = await SupplyCartService.submitSupplyRequest(
        tenantA,
        {
          classroomId: classroomA1,
          branchId: branchA1,
          requiredDate: new Date('2026-11-05'),
          items: [{ itemId: itemCrayons.id, quantity: 2 }],
        },
        { id: teacherUserA.id, name: teacherUserA.fullName, role: 'TEACHER' }
      )

      const fulfillReq = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${pendingReq.id}/fulfill`,
        'POST',
        staffCookieA,
        { locationId: locationA1 }
      )
      const res = await fulfillPost(fulfillReq, { params: Promise.resolve({ id: pendingReq.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error?.message).toContain('Only APPROVED requests can be fulfilled')
    })

    it('physical issue atomically decrements stock and creates StockIssue + StockMovement', async () => {
      const stockBefore = await db.inventoryStock.findFirst({
        where: { tenantId: tenantA, locationId: locationA1, itemId: itemCrayons.id },
      })
      const initialAvailable = stockBefore?.availableQuantity || 0

      const fulfillReq = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${approvedRequestId}/fulfill`,
        'POST',
        staffCookieA,
        {
          locationId: locationA1,
          recipientNotes: 'Handed over in classroom 2B',
        }
      )
      const res = await fulfillPost(fulfillReq, { params: Promise.resolve({ id: approvedRequestId }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('FULFILLED')

      // 1. Verify stock decremented atomically
      const stockAfter = await db.inventoryStock.findFirst({
        where: { tenantId: tenantA, locationId: locationA1, itemId: itemCrayons.id },
      })
      expect(Number(stockAfter?.availableQuantity)).toBe(Number(initialAvailable) - requestQty)

      // 2. Verify StockIssue record
      const issue = await db.stockIssue.findFirst({
        where: { tenantId: tenantA, materialRequestId: approvedRequestId },
        include: { items: true },
      })
      expect(issue).toBeDefined()
      expect(issue?.destinationType).toBe('CLASSROOM')
      expect(issue?.classroomId).toBe(classroomA1)
      expect(Number(issue?.items[0].quantity)).toBe(requestQty)

      // 3. Verify immutable ISSUE StockMovement
      const movement = await db.stockMovement.findFirst({
        where: {
          tenantId: tenantA,
          referenceId: issue?.id,
          movementType: 'ISSUE',
          itemId: itemCrayons.id,
        },
      })
      expect(movement).toBeDefined()
      expect(Number(movement?.quantity)).toBe(requestQty)
      expect(movement?.performedByName).toBe(staffUserA.fullName)
    })

    it('prevents overdraft when available stock is insufficient', async () => {
      // Create and approve request for 1000 units (far exceeding stock of ~44)
      const hugeReq = await db.materialRequest.create({
        data: {
          tenantId: tenantA,
          branchId: branchA1,
          requestNumber: `MR-HUGE-${Date.now()}`,
          requestedById: teacherUserA.id,
          requestedByName: teacherUserA.fullName,
          requestedByRole: 'TEACHER',
          classroomId: classroomA1,
          requiredDate: new Date(),
          priority: 'HIGH',
          status: 'APPROVED',
          approvedById: principalUserA.id,
          approvedByName: principalUserA.fullName,
          items: {
            create: [
              {
                itemId: itemCrayons.id,
                requestedQuantity: 1000,
                approvedQuantity: 1000,
                issuedQuantity: 0,
              },
            ],
          },
        },
      })

      const fulfillReq = makeReq(
        `http://localhost/api/v1/inventory/material-requests/${hugeReq.id}/fulfill`,
        'POST',
        staffCookieA,
        { locationId: locationA1 }
      )
      const res = await fulfillPost(fulfillReq, { params: Promise.resolve({ id: hugeReq.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error?.message).toContain('INSUFFICIENT_STOCK')
    })
  })
})

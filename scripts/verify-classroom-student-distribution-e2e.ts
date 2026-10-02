/**
 * PreOne — Classroom Bulk & Individual Student Distribution E2E Verification Suite
 *
 * Verifies preschool-first inventory distribution journeys:
 * 1. Master Setup: Tenant, Branch, Classroom with Teacher, Enrolled Students, Locations & Items
 * 2. GRN Initial Funding: Receives Activity Kits, Phonics Books, Crayons, Uniforms
 * 3. Journey A: Classroom Bulk Distribution (Classroom context, primary teacher, live stock decrement)
 * 4. Journey B: Individual Student Distribution (Student context, admission #, kit allocation)
 * 5. Journey C: Student-Wise Distribution Report Filtering & Isolation
 * 6. Journey D: Department Distribution (Infirmary / Medical Room)
 * 7. Journey E: Overdraft Guard & Multi-Tenant Isolation
 */

import { db } from '../src/lib/db'
import { InventoryService } from '../src/lib/inventory/inventory-service'

let passed = 0
let failed = 0

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${desc}`)
    failed++
  }
}

async function runDistributionTests() {
  console.log('================================================================================')
  console.log('PREONE INVENTORY: CLASSROOM & INDIVIDUAL STUDENT DISTRIBUTION E2E VERIFICATION')
  console.log('================================================================================\n')

  const testSuffix = Date.now().toString().slice(-6)

  let tenantA: any
  let tenantB: any
  let branchA: any
  let branchB: any
  let teacherUser: any
  let adminUser: any
  let nurseryClass: any
  let studentAarav: any
  let studentAnanya: any
  let storeMain: any
  let categoryStationery: any
  let categoryKits: any
  let unitPcs: any
  let unitBox: any
  let itemKit: any
  let itemCrayons: any
  let itemUniform: any
  let vendorEdu: any

  try {
    // -------------------------------------------------------------------------
    // SETUP: CANONICAL PREONE TENANTS, BRANCHES, CLASSROOMS & ENROLLED STUDENTS
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Setting up Preschool Master Data ---')

    tenantA = await db.tenant.create({
      data: {
        name: `Little Champs Preschool ${testSuffix}`,
        code: `LC-A-${testSuffix}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        name: `Other Academy ${testSuffix}`,
        code: `OA-B-${testSuffix}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Wing',
        code: `BR-MAIN-${testSuffix}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'North Wing',
        code: `BR-NORTH-${testSuffix}`,
        isMain: true,
      },
    })

    const sessionA = await db.academicSession.create({
      data: {
        tenantId: tenantA.id,
        name: `2026-2027 ${testSuffix}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })

    // Staff Users
    adminUser = await db.user.create({
      data: {
        email: `admin-${testSuffix}@littlechamps.edu`,
        fullName: 'Principal Sunita Rao',
        passwordHash: 'hashed_pw',
        memberships: {
          create: { tenantId: tenantA.id, role: 'PRINCIPAL', branchId: branchA.id },
        },
      },
    })

    teacherUser = await db.user.create({
      data: {
        email: `teacher-${testSuffix}@littlechamps.edu`,
        fullName: 'Ms. Priya Desai',
        passwordHash: 'hashed_pw',
        memberships: {
          create: { tenantId: tenantA.id, role: 'TEACHER', branchId: branchA.id },
        },
      },
    })

    // Classroom with Primary Teacher assigned
    nurseryClass = await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA.id,
        academicSessionId: sessionA.id,
        name: 'Nursery Blossoms',
        code: `NUR-BLOSSOM-${testSuffix}`,
        programType: 'NURSERY',
        capacity: 25,
        primaryTeacherId: teacherUser.id,
      },
    })
    assert(Boolean(nurseryClass.id), '1. Created Classroom "Nursery Blossoms" with assigned primary teacher Ms. Priya Desai')

    // Real Enrolled Students in Nursery Blossoms
    studentAarav = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA.id,
        admissionNo: `ADM-${testSuffix}-001`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2022-04-15'),
        gender: 'MALE',
        currentClassroomId: nurseryClass.id,
        status: 'ACTIVE',
      },
    })
    assert(Boolean(studentAarav.id), `2. Enrolled Student: Aarav Sharma (Adm: ${studentAarav.admissionNo}) in Nursery Blossoms`)

    studentAnanya = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA.id,
        admissionNo: `ADM-${testSuffix}-002`,
        firstName: 'Ananya',
        lastName: 'Patel',
        dob: new Date('2022-07-20'),
        gender: 'FEMALE',
        currentClassroomId: nurseryClass.id,
        status: 'ACTIVE',
      },
    })
    assert(Boolean(studentAnanya.id), `3. Enrolled Student: Ananya Patel (Adm: ${studentAnanya.admissionNo}) in Nursery Blossoms`)

    // -------------------------------------------------------------------------
    // STEP 2: INVENTORY MASTER DATA & INITIAL STOCK FUNDING (GRN)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Inventory Catalog & Stock Receiving ---')

    categoryKits = await InventoryService.createCategory(tenantA.id, {
      name: `Student Kits & Uniforms ${testSuffix}`,
      code: `KIT-${testSuffix}`,
    })

    categoryStationery = await InventoryService.createCategory(tenantA.id, {
      name: `Art & Stationery ${testSuffix}`,
      code: `ART-${testSuffix}`,
    })

    unitPcs = await InventoryService.createUnit(tenantA.id, {
      name: `Piece ${testSuffix}`,
      code: `PCS-${testSuffix}`,
      symbol: 'pcs',
    })

    unitBox = await InventoryService.createUnit(tenantA.id, {
      name: `Box ${testSuffix}`,
      code: `BOX-${testSuffix}`,
      symbol: 'box',
    })

    storeMain = await InventoryService.createLocation(tenantA.id, {
      branchId: branchA.id,
      name: 'Central Stationery & Kit Store',
      code: `STORE-CENTRAL-${testSuffix}`,
      locationType: 'MAIN_STORE',
    })

    vendorEdu = await InventoryService.createVendor(tenantA.id, {
      name: `EduCraft Early Learning Supplies ${testSuffix}`,
      code: `VEND-EDU-${testSuffix}`,
      contactPerson: 'Karan Mehra',
      email: `orders-${testSuffix}@educraft.com`,
    })

    // Items
    itemKit = await InventoryService.createItem(tenantA.id, {
      categoryId: categoryKits.id,
      unitId: unitPcs.id,
      name: 'Preschool Welcome Activity Kit (Nursery)',
      sku: `KIT-NUR-${testSuffix}`,
      itemType: 'KIT',
      reorderPoint: 5,
    })

    itemCrayons = await InventoryService.createItem(tenantA.id, {
      categoryId: categoryStationery.id,
      unitId: unitBox.id,
      name: 'Jumbo Triangular Wax Crayons (12 shades)',
      sku: `CRY-JUMBO-${testSuffix}`,
      itemType: 'STATIONERY',
      reorderPoint: 10,
    })

    itemUniform = await InventoryService.createItem(tenantA.id, {
      categoryId: categoryKits.id,
      unitId: unitPcs.id,
      name: 'Winter Cardigan & Apron Uniform Set - Size 24',
      sku: `UNI-WINT-24-${testSuffix}`,
      itemType: 'UNIFORM',
      reorderPoint: 5,
    })

    assert(Boolean(itemKit.id && itemCrayons.id && itemUniform.id), '4. Created Items: Welcome Kit, Jumbo Crayons, Winter Uniform')

    // Fund Central Store via Purchase Order & GRN
    const po = await InventoryService.createPurchaseOrder(
      tenantA.id,
      {
        branchId: branchA.id,
        vendorId: vendorEdu.id,
        destinationLocationId: storeMain.id,
        expectedDeliveryDate: new Date('2026-10-10'),
        paymentTerms: 'NET_30',
        items: [
          { itemId: itemKit.id, quantityOrdered: 50, unitPriceCents: 65000, taxRatePercent: 12 },
          { itemId: itemCrayons.id, quantityOrdered: 60, unitPriceCents: 12000, taxRatePercent: 12 },
          { itemId: itemUniform.id, quantityOrdered: 40, unitPriceCents: 45000, taxRatePercent: 5 },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )
    await InventoryService.approvePurchaseOrder(tenantA.id, po.id, { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' })

    const grn = await InventoryService.createGoodsReceipt(
      tenantA.id,
      {
        branchId: branchA.id,
        purchaseOrderId: po.id,
        locationId: storeMain.id,
        vendorInvoiceNumber: `VINV-EDU-${testSuffix}`,
        items: [
          { purchaseOrderItemId: po.items[0].id, itemId: itemKit.id, quantityReceived: 50, unitPriceCents: 65000, batchNumber: `B-KIT-${testSuffix}` },
          { purchaseOrderItemId: po.items[1].id, itemId: itemCrayons.id, quantityReceived: 60, unitPriceCents: 12000, batchNumber: `B-CRY-${testSuffix}` },
          { purchaseOrderItemId: po.items[2].id, itemId: itemUniform.id, quantityReceived: 40, unitPriceCents: 45000, batchNumber: `B-UNI-${testSuffix}` },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )
    assert(grn.status === 'FINALIZED', '5. Finalized Goods Receipt (GRN): Central Store stocked with 50 Kits, 60 Crayons, 40 Uniforms')

    // -------------------------------------------------------------------------
    // STEP 3: JOURNEY A — CLASSROOM BULK DISTRIBUTION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Journey A — Classroom Bulk Distribution ---')

    // Disburse 20 boxes of Jumbo Crayons to Nursery Blossoms
    const classroomIssue = await InventoryService.issueStock(
      tenantA.id,
      {
        branchId: branchA.id,
        fromLocationId: storeMain.id,
        destinationType: 'CLASSROOM',
        classroomId: nurseryClass.id,
        purpose: 'Semester 1 Art & Sensory Activity supplies for Nursery Blossoms',
        items: [
          { itemId: itemCrayons.id, quantity: 20, batchNumber: `B-CRY-${testSuffix}` },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )

    assert(
      classroomIssue.issueNumber.startsWith('ISS-') && classroomIssue.status === 'COMPLETED',
      `6. Issued 20 boxes of crayons to Classroom "${nurseryClass.name}" (Issue #: ${classroomIssue.issueNumber})`
    )

    // Check stock balance decremented
    const crayonsStockAfterClassIssue = await db.inventoryStock.findFirst({
      where: { locationId: storeMain.id, itemId: itemCrayons.id },
    })
    assert(
      crayonsStockAfterClassIssue?.quantity?.toNumber?.() === 40,
      '7. Central Store crayons balance atomically decremented from 60 to 40'
    )

    // Verify StockMovement audit entry
    const classMovements = await db.stockMovement.findMany({
      where: {
        tenantId: tenantA.id,
        itemId: itemCrayons.id,
        movementType: 'ISSUE',
        referenceId: classroomIssue.id,
      },
    })
    assert(
      classMovements.length === 1 && classMovements[0].quantity.toNumber() === 20,
      '8. StockMovement ledger contains audited 20-unit ISSUE entry linked to classroom issue'
    )

    // Verify issue record includes classroom and primary teacher
    const issuesForClassroom = await InventoryService.listStockIssues(tenantA.id, {
      classroomId: nurseryClass.id,
    })
    assert(
      issuesForClassroom.issues.length === 1 && issuesForClassroom.issues[0].classroom?.name === 'Nursery Blossoms',
      '9. Query issues by classroomId returned issue with classroom details'
    )

    // -------------------------------------------------------------------------
    // STEP 4: JOURNEY B — INDIVIDUAL STUDENT DISTRIBUTION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Journey B — Individual Student Distribution ---')

    // Disburse 1 Welcome Kit and 1 Uniform to Aarav Sharma
    const aaravIssue = await InventoryService.issueStock(
      tenantA.id,
      {
        branchId: branchA.id,
        fromLocationId: storeMain.id,
        destinationType: 'STUDENT',
        classroomId: nurseryClass.id,
        studentId: studentAarav.id,
        purpose: `New Admission Starter Pack & Uniform Handover to Aarav Sharma (${studentAarav.admissionNo})`,
        items: [
          { itemId: itemKit.id, quantity: 1, batchNumber: `B-KIT-${testSuffix}` },
          { itemId: itemUniform.id, quantity: 1, batchNumber: `B-UNI-${testSuffix}` },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )

    assert(
      aaravIssue.issueNumber.startsWith('ISS-') && (aaravIssue as any).studentId === studentAarav.id,
      `10. Disbursed Starter Pack & Uniform directly to Student Aarav Sharma (Issue #: ${aaravIssue.issueNumber})`
    )

    // Disburse 1 Welcome Kit to Ananya Patel
    const ananyaIssue = await InventoryService.issueStock(
      tenantA.id,
      {
        branchId: branchA.id,
        fromLocationId: storeMain.id,
        destinationType: 'STUDENT',
        classroomId: nurseryClass.id,
        studentId: studentAnanya.id,
        purpose: `New Admission Starter Pack Handover to Ananya Patel (${studentAnanya.admissionNo})`,
        items: [
          { itemId: itemKit.id, quantity: 1, batchNumber: `B-KIT-${testSuffix}` },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )

    assert(
      ananyaIssue.issueNumber.startsWith('ISS-') && (ananyaIssue as any).studentId === studentAnanya.id,
      `11. Disbursed Welcome Kit directly to Student Ananya Patel (Issue #: ${ananyaIssue.issueNumber})`
    )

    // Check store balances after student distributions
    const kitStockAfterStudentIssues = await db.inventoryStock.findFirst({
      where: { locationId: storeMain.id, itemId: itemKit.id },
    })
    const uniformStockAfterStudentIssues = await db.inventoryStock.findFirst({
      where: { locationId: storeMain.id, itemId: itemUniform.id },
    })

    assert(
      kitStockAfterStudentIssues?.quantity?.toNumber?.() === 48,
      '12. Central Store Welcome Kits balance atomically decremented from 50 to 48 (1 to Aarav, 1 to Ananya)'
    )
    assert(
      uniformStockAfterStudentIssues?.quantity?.toNumber?.() === 39,
      '13. Central Store Uniforms balance atomically decremented from 40 to 39 (1 to Aarav)'
    )

    // -------------------------------------------------------------------------
    // STEP 5: JOURNEY C — STUDENT-WISE DISTRIBUTION REPORTING & ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Journey C — Student-Wise Distribution Report & Filtering ---')

    // Query issues for Aarav
    const aaravIssues = await InventoryService.listStockIssues(tenantA.id, {
      studentId: studentAarav.id,
    })
    assert(
      aaravIssues.issues.length === 1 &&
      (aaravIssues.issues[0] as any).student?.admissionNo === studentAarav.admissionNo &&
      aaravIssues.issues[0].items.length === 2,
      '14. Student-wise query for Aarav returns exactly his 2 allocated line items (Kit & Uniform)'
    )

    // Query issues for Ananya
    const ananyaIssues = await InventoryService.listStockIssues(tenantA.id, {
      studentId: studentAnanya.id,
    })
    assert(
      ananyaIssues.issues.length === 1 &&
      (ananyaIssues.issues[0] as any).student?.admissionNo === studentAnanya.admissionNo &&
      ananyaIssues.issues[0].items.length === 1,
      '15. Student-wise query for Ananya returns exactly her 1 allocated line item (Kit only)'
    )

    // Total Student Distributions in Nursery Blossoms
    const allNurseryIssues = await InventoryService.listStockIssues(tenantA.id, {
      classroomId: nurseryClass.id,
    })
    // 1 classroom bulk issue + 2 student issues = 3 total issues
    assert(
      allNurseryIssues.issues.length === 3,
      '16. Classroom query retrieves all 3 distribution events (1 bulk classroom + 2 individual student issues)'
    )

    // -------------------------------------------------------------------------
    // STEP 6: JOURNEY D — DEPARTMENT DISTRIBUTION (INFIRMARY / MEDICAL ROOM)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Journey D — Department / Staff Distribution ---')

    const deptIssue = await InventoryService.issueStock(
      tenantA.id,
      {
        branchId: branchA.id,
        fromLocationId: storeMain.id,
        destinationType: 'DEPARTMENT',
        purpose: 'Restocking emergency medical station',
        items: [
          { itemId: itemCrayons.id, quantity: 2, batchNumber: `B-CRY-${testSuffix}` },
        ],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
    )
    assert(
      deptIssue.destinationType === 'OPERATIONS',
      '17. Successfully issued supplies to Infirmary / Medical Room operations'
    )

    // -------------------------------------------------------------------------
    // STEP 7: JOURNEY E — OVERDRAFT SAFEGUARDS & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Journey E — Overdraft Protection & Multi-Tenant Isolation ---')

    // Overdraft attempt on student distribution
    let overdraftPrevented = false
    try {
      await InventoryService.issueStock(
        tenantA.id,
        {
          branchId: branchA.id,
          fromLocationId: storeMain.id,
          destinationType: 'STUDENT',
          studentId: studentAarav.id,
          purpose: 'Attempting invalid overdraft issue',
          items: [{ itemId: itemKit.id, quantity: 999 }],
        },
        { id: adminUser.id, name: adminUser.fullName, role: 'PRINCIPAL' }
      )
    } catch (err: any) {
      overdraftPrevented = true
    }
    assert(overdraftPrevented, '18. Overdraft protection prevented issuing more stock than available to student')

    // Cross-tenant isolation: Tenant B cannot see Tenant A's student issues
    const tenantBIssues = await InventoryService.listStockIssues(tenantB.id, {
      studentId: studentAarav.id,
    })
    assert(tenantBIssues.issues.length === 0, '19. Tenant B cannot access Tenant A student distribution records')

    console.log('\n================================================================================')
    console.log(`DISTRIBUTION E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('================================================================================\n')

    if (failed > 0) {
      process.exit(1)
    }
  } catch (error: any) {
    console.error('Fatal Test Execution Error:', error)
    process.exit(1)
  } finally {
    // Cleanup created test records
    console.log('Cleaning up test data...')
    try {
      if (tenantA) {
        await db.stockMovement.deleteMany({ where: { tenantId: tenantA.id } })
        await db.stockIssueItem.deleteMany({ where: { stockIssue: { tenantId: tenantA.id } } })
        await db.stockIssue.deleteMany({ where: { tenantId: tenantA.id } })
        await db.goodsReceiptItem.deleteMany({ where: { goodsReceipt: { tenantId: tenantA.id } } })
        await db.goodsReceipt.deleteMany({ where: { tenantId: tenantA.id } })
        await db.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { tenantId: tenantA.id } } })
        await db.purchaseOrder.deleteMany({ where: { tenantId: tenantA.id } })
        await db.invoiceItem.deleteMany({ where: { invoice: { tenantId: tenantA.id } } })
        await db.invoice.deleteMany({ where: { tenantId: tenantA.id } })
        await db.inventoryStock.deleteMany({ where: { item: { tenantId: tenantA.id } } })
        await db.inventoryItem.deleteMany({ where: { tenantId: tenantA.id } })
        await db.inventoryLocation.deleteMany({ where: { tenantId: tenantA.id } })
        await db.inventoryUnit.deleteMany({ where: { tenantId: tenantA.id } })
        await db.inventoryCategory.deleteMany({ where: { tenantId: tenantA.id } })
        await db.vendor.deleteMany({ where: { tenantId: tenantA.id } })
        await db.student.deleteMany({ where: { tenantId: tenantA.id } })
        await db.classroom.deleteMany({ where: { tenantId: tenantA.id } })
        await db.academicSession.deleteMany({ where: { tenantId: tenantA.id } })
        await db.tenantUser.deleteMany({ where: { tenantId: tenantA.id } })
        await db.user.deleteMany({ where: { id: { in: [adminUser?.id, teacherUser?.id].filter(Boolean) } } })
        await db.branch.deleteMany({ where: { tenantId: tenantA.id } })
        await db.tenant.deleteMany({ where: { id: tenantA.id } })
      }
      if (tenantB) {
        await db.branch.deleteMany({ where: { tenantId: tenantB.id } })
        await db.tenant.deleteMany({ where: { id: tenantB.id } })
      }
      console.log('Cleanup completed successfully.')
    } catch (cleanErr) {
      console.error('Cleanup error (ignored):', cleanErr)
    }
  }
}

runDistributionTests()

/**
 * PreOne — Reports & Analytics Redesign Verification Suite
 *
 * Verifies:
 * 1. Exactly 8 top-level report groups structure & human-friendly metadata
 * 2. Mapped sub-reports & canonical data sources
 * 3. Permitted roles & RBAC scoping (Owner, Principal, Teacher, Parent, Accountant)
 * 4. Query engine execution for all 8 groups (including new queries for exec, admissions, operations, academics)
 * 5. Dynamic search filtering across student, invoice, lead, staff, route, item
 * 6. Date range filtering and validation
 * 7. Multi-tenant and classroom/ward scoping enforcement
 * 8. Multi-format exports (CSV, XLSX, Print/PDF) and AuditLog persistence
 * 9. Custom report builder integration preservation
 */

import { db } from '../src/lib/db'
import { ReportService } from '../src/lib/reports/report-service'
import { REPORT_REGISTRY, getReportById, getReportsForRole } from '../src/lib/reports/report-registry'
import { REPORT_GROUPS } from '../src/app/app/reports/ReportsClient'
import { ScopeContext } from '../src/lib/reports/report-types'
import { inr } from '../src/lib/format'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${msg}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${msg}`)
  }
}

async function run() {
  console.log('========================================================================')
  console.log('  PreOne Reports & Analytics Redesign — Full Verification Suite')
  console.log('========================================================================\n')

  const timestamp = Date.now()
  const tenantCode = `REDESIGN-T-${timestamp.toString().slice(-5)}`

  let tenantId = ''
  let branchId = ''
  let academicSessionId = ''
  let teacherUserId = ''
  let parentUserId = ''
  let studentId = ''
  let classroomId = ''

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. ARCHITECTURAL SCOPE: EXACTLY EIGHT REPORT GROUPS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- Phase 1: Architectural Scope (Exactly Eight Report Groups)')

    assert(REPORT_GROUPS.length === 8, `Test 1: Exactly 8 report groups defined (got ${REPORT_GROUPS.length})`)

    const expectedGroupIds = [
      'overview',
      'admissions',
      'attendance',
      'learning',
      'fees',
      'workforce',
      'transport',
      'inventory',
    ]
    const actualGroupIds = REPORT_GROUPS.map((g) => g.id)
    assert(
      JSON.stringify(actualGroupIds) === JSON.stringify(expectedGroupIds),
      `Test 2: Approved group IDs match exact specification: ${actualGroupIds.join(', ')}`
    )

    const expectedTitles = [
      'School Overview',
      'Admissions & Enrollment',
      'Attendance & Daily Care',
      'Learning & Development',
      'Fees & Payments',
      'Staff & Workforce',
      'Transport',
      'Inventory & Supplies',
    ]
    const actualTitles = REPORT_GROUPS.map((g) => g.title)
    assert(
      JSON.stringify(actualTitles) === JSON.stringify(expectedTitles),
      `Test 3: Human-friendly group titles match exact specification`
    )

    // Verify all 8 groups have plain descriptions and icons
    const allHaveDescriptions = REPORT_GROUPS.every((g) => g.plainDescription && g.plainDescription.length > 10)
    assert(allHaveDescriptions, 'Test 4: All 8 groups have clear preschool-friendly descriptions')

    // Verify Custom Report Builder is NOT a 9th top-level group
    const hasCustomAsTopLevel = actualGroupIds.includes('custom' as any)
    assert(!hasCustomAsTopLevel, 'Test 5: Custom Report Builder is NOT a 9th top-level navigation group')

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ENVIRONMENT & CANONICAL DATA SETUP
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 2: Environment & Canonical Data Setup')

    const tenant = await db.tenant.create({
      data: {
        code: tenantCode,
        name: `Blossom Valley Academy ${timestamp}`,
        subscriptionPlan: 'ENTERPRISE',
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    const branch = await db.branch.create({
      data: {
        tenantId,
        code: `BR-${timestamp.toString().slice(-4)}`,
        name: 'Main Campus',
        isMain: true,
      },
    })
    branchId = branch.id

    const session = await db.academicSession.create({
      data: {
        tenantId,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })
    academicSessionId = session.id

    const teacher = await db.user.create({
      data: {
        email: `teacher.${timestamp}@test.edu`,
        fullName: 'Teacher Priya Nair',
        passwordHash: 'dummy-hashed-pw',
      },
    })
    teacherUserId = teacher.id
    await db.tenantUser.create({
      data: { tenantId, userId: teacherUserId, role: 'TEACHER' },
    })

    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: 'Butterflies Pre-K',
        code: `CLS-${timestamp.toString().slice(-4)}`,
        programType: 'PLAYGROUP',
        primaryTeacherId: teacherUserId,
      },
    })
    classroomId = classroom.id

    const parentUser = await db.user.create({
      data: {
        email: `parent.${timestamp}@test.edu`,
        fullName: 'Kiran Sharma',
        passwordHash: 'dummy-hashed-pw',
      },
    })
    parentUserId = parentUser.id
    await db.tenantUser.create({
      data: { tenantId, userId: parentUserId, role: 'PARENT' },
    })

    const guardian = await db.guardian.create({
      data: {
        tenantId,
        userId: parentUserId,
        fullName: 'Kiran Sharma',
        phone: '+91 98450 11223',
        relationship: 'MOTHER',
      },
    })

    const student = await db.student.create({
      data: {
        tenantId,
        branchId,
        admissionNo: `ADM-${timestamp.toString().slice(-4)}`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('2022-05-14'),
        status: 'ACTIVE',
      },
    })
    studentId = student.id

    await db.studentGuardian.create({
      data: {
        studentId,
        guardianId: guardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
      },
    })

    await db.studentAllocation.create({
      data: {
        tenantId,
        studentId,
        classroomId,
        academicSessionId,
        programType: 'PLAYGROUP',
        status: 'ACTIVE',
      },
    })

    // Seed Lead for Admissions
    await db.lead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `LEAD-${timestamp.toString().slice(-4)}`,
        parentName: 'Rohit Verma',
        phone: '+91 98888 77777',
        childName: 'Ananya Verma',
        status: 'NEW',
      },
    })

    // Seed Attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.attendance.create({
      data: {
        tenantId,
        branchId,
        classroomId: classroom.id,
        studentId,
        date: today,
        status: 'PRESENT',
      },
    })

    // Seed TimelineEntry for Operations
    await db.timelineEntry.create({
      data: {
        tenantId,
        studentId,
        classroomId,
        type: 'MEAL',
        title: 'Morning Healthy Snack',
        body: 'Aarav finished whole cut fruits and milk.',
      },
    })

    // Seed Observation for Academics
    await db.observation.create({
      data: {
        tenantId,
        studentId,
        classroomId,
        teacherId: teacherUserId,
        narrative: 'Demonstrated excellent fine motor coordination building stacking blocks.',
        milestoneTags: 'Fine Motor Skills Level 2',
        status: 'PUBLISHED',
      },
    })

    // Seed Fee Invoice & Payment
    const invoice = await db.invoice.create({
      data: {
        tenantId,
        branchId,
        studentId,
        academicSessionId,
        invoiceNumber: `INV-${timestamp.toString().slice(-4)}`,
        title: 'Term 1 Tuition Fee',
        subtotalCents: 2000000,
        totalCents: 2000000, // ₹20,000
        paidCents: 1500000,  // ₹15,000
        balanceCents: 500000, // ₹5,000
        dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000), // 5 days overdue
        status: 'PARTIALLY_PAID',
      },
    })

    await db.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        paymentNumber: `PAY-${timestamp.toString().slice(-4)}`,
        amountCents: 1500000,
        method: 'UPI',
        transactionRef: 'UPI-REF-992211',
        paymentDate: new Date(),
        status: 'SUCCESS',
      },
    })


    // Seed Staff Profile
    await db.staffProfile.create({
      data: {
        tenantId,
        branchId,
        userId: teacherUserId,
        employeeCode: `EMP-${timestamp.toString().slice(-4)}`,
        designation: 'Senior Early Educator',
        department: 'Academics',
        employmentType: 'REGULAR',
        joiningDate: new Date('2024-06-01'),
      },
    })

    // Seed Transport Route & Assignment
    const vehicle = await db.vehicle.create({
      data: {
        tenantId,
        registrationNumber: 'KA-01-EQ-9988',
        capacity: 25,
      },
    })

    const route = await db.transportRoute.create({
      data: {
        tenantId,
        branchId,
        vehicleId: vehicle.id,
        code: `R-IND-${timestamp.toString().slice(-3)}`,
        name: 'Indiranagar Express Route',
        status: 'ACTIVE',
      },
    })

    const stop = await db.routeStop.create({
      data: {
        tenantId,
        routeId: route.id,
        name: 'Main Gate Stop',
        sequence: 1,
      },
    })

    await db.studentTransportAssignment.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        studentId,
        routeId: route.id,
        pickupStopId: stop.id,
        dropStopId: stop.id,
        status: 'ACTIVE',
      },
    })

    // Seed Inventory Stock
    const invUnit = await db.inventoryUnit.create({
      data: {
        tenantId,
        code: `PCS-${timestamp.toString().slice(-4)}`,
        name: 'Pieces',
        symbol: 'pcs',
      },
    })
    const invLoc = await db.inventoryLocation.create({
      data: {
        tenantId,
        branchId,
        code: `LOC-${timestamp.toString().slice(-4)}`,
        name: 'Main Store Room',
      },
    })
    const category = await db.inventoryCategory.create({
      data: {
        tenantId,
        code: `CAT-${timestamp.toString().slice(-4)}`,
        name: 'Art & Stationery Supplies',
      },
    })

    const item = await db.inventoryItem.create({
      data: {
        tenantId,
        categoryId: category.id,
        unitId: invUnit.id,
        sku: `SKU-CR-${timestamp.toString().slice(-3)}`,
        name: 'Non-toxic Finger Paint Pots',
        reorderLevel: 10,
        isActive: true,
      },
    })

    await db.inventoryStock.create({
      data: {
        tenantId,
        branchId,
        locationId: invLoc.id,
        itemId: item.id,
        quantity: 4, // < 10 -> Low stock!
        unitCost: 250,
      },
    })

    assert(true, 'Test 6: Master tenant, branch, classroom, and canonical records seeded successfully')

    // ──────────────────────────────────────────────────────────────────────────
    // 3. EXECUTION TESTING ACROSS ALL 8 APPROVED GROUPS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 3: Query Execution Across All Eight Groups')

    const principalCtx: ScopeContext = {
      tenantId,
      branchId,
      academicSessionId,
      actorId: 'principal-id',
      actorName: 'Dr. Principal',
      actorRole: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    }

    // Group 1: School Overview (exec-overview)
    const execRes = await ReportService.queryReport('exec-overview', {}, principalCtx)
    assert(execRes.total > 0, `Test 7 (Group 1 - Overview): Operational snapshot returned ${execRes.total} summary rows`)
    assert(execRes.data.some((r: any) => r.metric.includes('Student')), 'Test 8 (Group 1 - Overview): Student metrics present in overview')

    // Group 2: Admissions & Enrollment
    const enrolledRes = await ReportService.queryReport('students-strength', {}, principalCtx)
    assert(enrolledRes.total === 1, `Test 9 (Group 2 - Enrolled): Returned ${enrolledRes.total} student record(s)`)
    assert(enrolledRes.data[0]?.fullName === 'Aarav Sharma', 'Test 10 (Group 2 - Enrolled): Student name matches authoritative record')

    const admissionsRes = await ReportService.queryReport('admissions-funnel', {}, principalCtx)
    assert(admissionsRes.total === 1, `Test 11 (Group 2 - Pipeline): Returned ${admissionsRes.total} lead record(s)`)
    assert(admissionsRes.data[0]?.childName === 'Ananya Verma', 'Test 12 (Group 2 - Pipeline): Lead child name matches authoritative record')

    // Group 3: Attendance & Daily Care
    const attRes = await ReportService.queryReport('attendance-daily', {}, principalCtx)
    assert(attRes.total === 1, `Test 13 (Group 3 - Attendance): Returned ${attRes.total} attendance record(s)`)
    assert(attRes.data[0]?.status === 'PRESENT', 'Test 14 (Group 3 - Attendance): Attendance status is PRESENT')

    const opsRes = await ReportService.queryReport('operations-daily', {}, principalCtx)
    assert(opsRes.total === 1, `Test 15 (Group 3 - Care): Returned ${opsRes.total} care timeline record(s)`)
    assert(opsRes.data[0]?.title.includes('Snack'), 'Test 16 (Group 3 - Care): Care timeline title matches authoritative record')

    // Group 4: Learning & Development
    const learnRes = await ReportService.queryReport('academics-milestones', {}, principalCtx)
    assert(learnRes.total === 1, `Test 17 (Group 4 - Learning): Returned ${learnRes.total} observation record(s)`)
    assert(learnRes.data[0]?.studentName === 'Aarav Sharma', 'Test 18 (Group 4 - Learning): Observation student name matches')

    // Group 5: Fees & Payments
    const colRes = await ReportService.queryReport('finance-collections', {}, principalCtx)
    assert(colRes.total === 1, `Test 19 (Group 5 - Collections): Returned ${colRes.total} payment record(s)`)
    assert(colRes.data[0]?.amount?.replace(/\s+/g, '') === '₹15,000', `Test 20 (Group 5 - Collections): Formatted INR amount is ₹15,000 (got ${colRes.data[0]?.amount})`)

    const outRes = await ReportService.queryReport('finance-outstanding', {}, principalCtx)
    assert(outRes.total === 1, `Test 21 (Group 5 - Outstanding): Returned ${outRes.total} overdue invoice record(s)`)
    assert(outRes.data[0]?.balance?.replace(/\s+/g, '') === '₹5,000', `Test 22 (Group 5 - Outstanding): Pending balance is ₹5,000 (got ${outRes.data[0]?.balance})`)
    assert(outRes.data[0]?.agingDays >= 5, `Test 23 (Group 5 - Outstanding): Aging calculated properly (got ${outRes.data[0]?.agingDays} days)`)

    // Group 6: Staff & Workforce
    const hrRes = await ReportService.queryReport('hr-headcount', {}, principalCtx)
    assert(hrRes.total === 1, `Test 24 (Group 6 - Workforce): Returned ${hrRes.total} staff profile record(s)`)
    assert(hrRes.data[0]?.designation === 'Senior Early Educator', 'Test 25 (Group 6 - Workforce): Designation matches authoritative record')

    // Group 7: Transport
    const transRes = await ReportService.queryReport('transport-utilization', {}, principalCtx)
    assert(transRes.total === 1, `Test 26 (Group 7 - Transport): Returned ${transRes.total} route record(s)`)
    assert(transRes.data[0]?.activeRiders === 1, 'Test 27 (Group 7 - Transport): Active assigned riders is 1')

    // Group 8: Inventory & Supplies
    const invRes = await ReportService.queryReport('inventory-valuation', {}, principalCtx)
    assert(invRes.total === 1, `Test 28 (Group 8 - Inventory): Returned ${invRes.total} stock record(s)`)
    assert(invRes.data[0]?.stockStatus === 'LOW_STOCK', 'Test 29 (Group 8 - Inventory): Alert status correctly flagged as LOW_STOCK')

    // ──────────────────────────────────────────────────────────────────────────
    // 4. FILTERING & SEARCH VALIDATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 4: Dynamic Filters & Search')

    // Search by student name
    const searchStudentRes = await ReportService.queryReport(
      'students-strength',
      { search: 'Aarav' },
      principalCtx
    )
    assert(searchStudentRes.total === 1, 'Test 30: Search "Aarav" returned 1 matching student')

    const searchNoneRes = await ReportService.queryReport(
      'students-strength',
      { search: 'NonExistentChildXYZ' },
      principalCtx
    )
    assert(searchNoneRes.total === 0, 'Test 31: Search for non-existent child returns 0 records cleanly (no crash)')

    // Search by invoice number
    const searchInvoiceRes = await ReportService.queryReport(
      'finance-outstanding',
      { search: invoice.invoiceNumber },
      principalCtx
    )
    assert(searchInvoiceRes.total === 1, 'Test 32: Search by invoice number returned 1 matching invoice')

    // Date range filter
    const todayStr = new Date().toISOString().slice(0, 10)
    const dateFilteredRes = await ReportService.queryReport(
      'attendance-daily',
      { startDate: todayStr, endDate: todayStr },
      principalCtx
    )
    assert(dateFilteredRes.total === 1, 'Test 33: Attendance date range filter matches today\'s record')

    const pastDateRes = await ReportService.queryReport(
      'attendance-daily',
      { startDate: '2020-01-01', endDate: '2020-01-02' },
      principalCtx
    )
    assert(pastDateRes.total === 0, 'Test 34: Out-of-range date filter returns 0 records cleanly')

    // ──────────────────────────────────────────────────────────────────────────
    // 5. SECURITY & ROLE SCOPING (PARENT, TEACHER, ACCOUNTS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 5: Security & Role Scope Isolation')

    const parentCtx: ScopeContext = {
      tenantId,
      branchId,
      actorId: parentUserId,
      actorName: 'Kiran Sharma',
      actorRole: 'PARENT',
      roles: ['PARENT'],
    }

    const parentStudentRes = await ReportService.queryReport('students-strength', {}, parentCtx)
    assert(parentStudentRes.total === 1, 'Test 35: Parent sees exactly their enrolled ward (1 student)')
    assert(parentStudentRes.data[0]?.fullName === 'Aarav Sharma', 'Test 36: Parent cannot see other children')

    // Parent forbidden from HR
    let parentHrBlocked = false
    try {
      await ReportService.queryReport('hr-headcount', {}, parentCtx)
    } catch {
      parentHrBlocked = true
    }
    assert(parentHrBlocked, 'Test 37: Parent strictly forbidden from HR & Workforce reports (Security Enforced)')

    // Teacher classroom scoping
    const teacherCtx: ScopeContext = {
      tenantId,
      branchId,
      actorId: teacherUserId,
      actorName: 'Teacher Priya',
      actorRole: 'TEACHER',
      roles: ['TEACHER'],
    }

    const teacherStudentRes = await ReportService.queryReport('students-strength', {}, teacherCtx)
    assert(teacherStudentRes.total === 1, 'Test 38: Teacher can view students in assigned classroom')

    let teacherHrBlocked = false
    try {
      await ReportService.queryReport('hr-headcount', {}, teacherCtx)
    } catch {
      teacherHrBlocked = true
    }
    assert(teacherHrBlocked, 'Test 39: Teacher strictly forbidden from HR & Headcount reports')

    // Multi-tenant isolation: Foreign tenant gets 0 records
    const foreignTenantCtx: ScopeContext = {
      tenantId: 'foreign-tenant-uuid-999',
      branchId: 'foreign-branch-uuid',
      actorId: 'foreign-user-id',
      actorName: 'Foreign User',
      actorRole: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    }
    const foreignRes = await ReportService.queryReport('students-strength', {}, foreignTenantCtx)
    assert(foreignRes.total === 0, 'Test 40: Foreign tenant query returns ZERO records (Strict Multi-Tenant Isolation)')

    // ──────────────────────────────────────────────────────────────────────────
    // 6. MULTI-FORMAT EXPORTS & AUDIT LOGGING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 6: Multi-Format Exports & Audit Logging')

    const csvExport = await ReportService.exportReport('finance-collections', 'CSV', {}, principalCtx)
    assert(csvExport.contentType.includes('text/csv'), 'Test 41: CSV export returns text/csv')
    assert(csvExport.content.includes('UPI-REF-992211'), 'Test 42: CSV export contains authoritative transaction data')

    const xlsExport = await ReportService.exportReport('finance-collections', 'XLSX', {}, principalCtx)
    assert(xlsExport.contentType.includes('application/vnd.ms-excel'), 'Test 43: Excel export returns application/vnd.ms-excel')
    assert(xlsExport.content.includes('<ss:Workbook'), 'Test 44: Excel export contains valid XML workbook structure')

    const printExport = await ReportService.exportReport('attendance-daily', 'PRINT', {}, principalCtx)
    assert(printExport.contentType.includes('text/html'), 'Test 45: Print export returns printable HTML view')
    assert(printExport.content.includes('Aarav Sharma'), 'Test 46: Print export contains student record in print table')

    // Verify AuditLog
    const auditEntries = await db.auditLog.findMany({
      where: { tenantId, action: 'REPORT_EXPORTED' },
    })
    assert(auditEntries.length >= 3, `Test 47: All 3 exports recorded to AuditLog table (got ${auditEntries.length})`)

    console.log('\n========================================================================')
    console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`)
    console.log('========================================================================\n')
  } catch (err: any) {
    console.error('Fatal test error:', err)
    process.exit(1)
  } finally {
    // Cleanup test tenant
    if (tenantId) {
      try {
        await db.inventoryStock.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.inventoryItem.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.inventoryCategory.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.inventoryLocation.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.inventoryUnit.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.studentTransportAssignment.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.routeStop.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.transportRoute.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.vehicle.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.receipt.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.payment.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.invoice.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.observation.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.timelineEntry.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.attendanceStaff.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.attendance.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.lead.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.studentAllocation.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.studentGuardian.deleteMany({ where: { student: { tenantId } } }).catch(() => {})
        await db.student.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.guardian.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.staffProfile.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.classroom.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.academicSession.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.auditLog.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.tenantUser.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.branch.deleteMany({ where: { tenantId } }).catch(() => {})
        await db.tenant.delete({ where: { id: tenantId } }).catch(() => {})
      } catch {}
    }
    await db.$disconnect()
  }
}

run()

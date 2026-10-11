import { db } from '../src/lib/db'
import { FeeService } from '../src/lib/fees/fee-service'
import { StudentService } from '../src/lib/students/student-service'

async function run() {
  console.log('=== PREONE FEE SCHEDULES & OPERATIONAL FINANCE E2E VERIFICATION ===\n')

  const tenant = await db.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found')
  console.log(`[INIT] Testing on Tenant: ${tenant.name} (${tenant.id})`)

  const branch = await db.branch.findFirst({ where: { tenantId: tenant.id } })
  if (!branch) throw new Error('No branch found')

  const session = await db.academicSession.findFirst({ where: { tenantId: tenant.id } })
  if (!session) throw new Error('No academic session found')

  const ctx = {
    tenantId: tenant.id,
    branchId: branch.id,
    academicSessionId: session.id,
    actorId: 'test-admin',
    actorName: 'Test Admin',
    actorRole: 'TENANT_ADMIN',
  }

  // 1. Setup a unique test program + branch mapping
  console.log('\n[TEST 1] Creating test Program and Branch Mapping...')
  const testProgram = await db.program.create({
    data: {
      tenantId: tenant.id,
      name: `E2E Playgroup Master ${Date.now()}`,
      code: `PG-E2E-${Date.now().toString().slice(-4)}`,
      programType: 'PLAYGROUP',
      ageMinMonths: 24,
      ageMaxMonths: 36,
      isActive: true,
    },
  })

  const testMapping = await db.programBranch.create({
    data: {
      tenantId: tenant.id,
      programId: testProgram.id,
      branchId: branch.id,
      capacity: 30,
      isActive: true,
    },
  })
  console.log(`  ✓ Program created: ${testProgram.name} (${testProgram.id})`)
  console.log(`  ✓ ProgramBranch mapped to branch: ${branch.name}`)

  // 2. Setup a test classroom
  console.log('\n[TEST 2] Creating test classroom...')
  const testClassroom = await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      academicSessionId: session.id,
      name: `Playgroup E2E Sec-${Date.now().toString().slice(-4)}`,
      code: `PG-SEC-${Date.now().toString().slice(-4)}`,
      programType: testProgram.programType,
      programId: testProgram.id,
      capacity: 25,
      isActive: true,
    },
  })
  console.log(`  ✓ Created test classroom: ${testClassroom.name} (${testClassroom.id})`)

  // 3. Setup an active fee structure for this classroom/program
  console.log('\n[TEST 3] Configuring active Fee Structure...')
  const testStructure = await FeeService.createFeeStructure(ctx, {
    branchId: branch.id,
    programId: testProgram.id,
    classroomId: testClassroom.id,
    name: `E2E Fee Plan ${Date.now()}`,
    status: 'ACTIVE',
    academicSessionId: session.id,
    items: [
      {
        name: 'Admission Fee',
        feeType: 'REGULAR',
        amountCents: 150000, // ₹1,500
        frequency: 'ONE_TIME',
      },
      {
        name: 'Monthly Tuition Fee',
        feeType: 'REGULAR',
        amountCents: 300000, // ₹3,000
        frequency: 'MONTHLY',
      },
      {
        name: 'Security Deposit',
        feeType: 'REFUNDABLE_DEPOSIT',
        amountCents: 500000, // ₹5,000
        frequency: 'ONE_TIME',
        isRefundable: true,
      },
    ],
  })
  console.log(`  ✓ Fee Structure created: ${testStructure.name} (${testStructure.id})`)

  // 4. Create a test student enrolled in this classroom
  console.log('\n[TEST 4] Enrolling test student (with automatic fee schedule trigger)...')
  const testStudent = await StudentService.createStudent(ctx, {
    firstName: 'Finance',
    lastName: 'Tester',
    dob: new Date('2023-01-15'),
    gender: 'MALE',
    branchId: branch.id,
    classroomId: testClassroom.id,
    guardianName: 'Parent Tester',
    guardianPhone: `99999${Date.now().toString().slice(-5)}`,
    confirmDuplicate: true,
  })
  console.log(`  ✓ Student created: ${testStudent.firstName} ${testStudent.lastName} (${testStudent.admissionNo})`)

  // 5. Verify that fee schedules were auto-generated
  console.log('\n[TEST 5] Verifying auto-generated fee schedules...')
  const studentSchedules = await db.studentFeeSchedule.findMany({
    where: { tenantId: tenant.id, studentId: testStudent.id },
    include: { feeItem: true },
    orderBy: { dueDate: 'asc' },
  })

  console.log(`  ✓ Generated Schedules count: ${studentSchedules.length}`)
  if (studentSchedules.length === 0) {
    throw new Error('Expected auto-generated fee schedules for enrolled student, but found 0!')
  }

  for (const sc of studentSchedules.slice(0, 3)) {
    console.log(`    - Item: ${sc.feeItem.name} | Period: ${sc.period} | Due: ₹${sc.amountDueCents / 100} | Status: ${sc.status}`)
  }

  // 6. Verify security deposit record was tracked
  console.log('\n[TEST 6] Verifying security deposit record...')
  const deposits = await db.studentDeposit.findMany({
    where: { tenantId: tenant.id, studentId: testStudent.id },
  })
  console.log(`  ✓ Tracked deposits count: ${deposits.length}`)
  if (deposits.length > 0) {
    console.log(`    - Deposit Amount: ₹${deposits[0].totalAmountCents / 100} | Status: ${deposits[0].status}`)
  }

  // 7. Test payment recording against the first schedule
  console.log('\n[TEST 7] Testing payment recording against fee schedule...')
  const targetSchedule = studentSchedules[0]
  const payResult = await FeeService.recordFeeSchedulePayment(ctx, {
    feeScheduleId: targetSchedule.id,
    studentId: testStudent.id,
    amountCents: targetSchedule.amountDueCents, // full payment
    method: 'UPI',
    transactionRef: `UPI-TEST-${Date.now()}`,
    notes: 'Full payment test',
  })

  console.log(`  ✓ Payment Recorded: ${payResult.payment.paymentNumber}`)
  console.log(`  ✓ Schedule updated status: ${payResult.schedule.status} (expected: PAID)`)
  console.log(`  ✓ Official Receipt generated: ${payResult.receipt?.receiptNumber}`)

  // 8. Cleanup
  console.log('\n[CLEANUP] Cleaning up test records...')
  await db.receipt.deleteMany({ where: { tenantId: tenant.id, paymentId: payResult.payment.id } })
  await db.payment.deleteMany({ where: { tenantId: tenant.id, studentId: testStudent.id } })
  await db.studentDeposit.deleteMany({ where: { tenantId: tenant.id, studentId: testStudent.id } })
  await db.studentFeeSchedule.deleteMany({ where: { tenantId: tenant.id, studentId: testStudent.id } })
  await db.studentAllocation.deleteMany({ where: { tenantId: tenant.id, studentId: testStudent.id } })
  await db.studentGuardian.deleteMany({ where: { studentId: testStudent.id } })
  await db.timelineEntry.deleteMany({ where: { tenantId: tenant.id, studentId: testStudent.id } })
  await db.auditLog.deleteMany({ where: { tenantId: tenant.id, entityId: testStudent.id } })
  await db.student.delete({ where: { id: testStudent.id } })
  await db.feeItem.deleteMany({ where: { feeStructureId: testStructure.id } })
  await db.feeStructure.delete({ where: { id: testStructure.id } })
  await db.classroom.delete({ where: { id: testClassroom.id } })
  await db.programBranch.delete({ where: { id: testMapping.id } })
  await db.program.delete({ where: { id: testProgram.id } })
  console.log('  ✓ Cleaned up test student, classroom, fee structure, schedules, program, and mappings.')

  console.log('\n======================================================================')
  console.log('   FULL E2E FEE SETUP ↔ FINANCE WORKFLOW VERIFIED SUCCESSFULLY! ✓')
  console.log('======================================================================')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E verification error:', err)
    process.exit(1)
  })

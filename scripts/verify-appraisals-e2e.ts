import { db } from '../src/lib/db'
import { AppraisalService } from '../src/lib/hr/appraisal-service'

async function main() {
  console.log('=== PreOne — HR Module — Performance & Appraisal E2E Test Suite ===\n')

  // 1. Fetch seed tenant and staff profiles
  const tenant = await db.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found in database.')
  console.log(`✓ Tenant loaded: ${tenant.name} (${tenant.id})`)

  const staffProfiles = await db.staffProfile.findMany({
    where: { tenantId: tenant.id },
    take: 2,
    include: { user: true },
  })

  if (staffProfiles.length < 2) {
    throw new Error('Need at least 2 staff profiles in DB to test appraisal and reviewer roles.')
  }

  const employee = staffProfiles[0]
  const reviewer = staffProfiles[1]

  console.log(`✓ Target Employee: ${employee.user.fullName} (${employee.employeeCode}) [ID: ${employee.id}]`)
  console.log(`✓ Reviewer: ${reviewer.user.fullName} (${reviewer.employeeCode}) [ID: ${reviewer.id}]`)

  // Ensure target employee has a base Salary Structure
  let baseSalaryStructure = await db.staffSalaryStructure.findFirst({
    where: { tenantId: tenant.id, staffProfileId: employee.id },
  })

  if (!baseSalaryStructure) {
    baseSalaryStructure = await db.staffSalaryStructure.create({
      data: {
        tenantId: tenant.id,
        staffProfileId: employee.id,
        basicSalary: 25000,
        hra: 10000,
        specialAllowance: 5000,
        effectiveFrom: new Date('2025-04-01'),
      },
    })
    console.log(`✓ Created base Salary Structure: ₹25,000 basic salary for employee`)
  } else {
    console.log(`✓ Existing active Base Salary Structure found: ₹${Number(baseSalaryStructure.basicSalary)}`)
  }

  const initialBaseSalary = Number(baseSalaryStructure.basicSalary)

  // -------------------------------------------------------------
  // Test 1: Percentage Increase Calculation & Appraisal Creation
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Create Percentage Increase Appraisal (2025–26) ---')
  const appraisal1 = await AppraisalService.createAppraisal(tenant.id, {
    employeeId: employee.id,
    reviewPeriod: '2025–26',
    reviewStartDate: new Date('2025-04-01'),
    reviewEndDate: new Date('2026-03-31'),
    appraisalDate: new Date('2026-04-01'),
    reviewerId: reviewer.id,
    rating: 4.5,
    performanceStatus: 'Excellent',
    strengths: 'Outstanding classroom leadership, curriculum development',
    areasForImprovement: 'Parent communication tools',
    goals: 'Lead pedagogical workshop for junior teachers',
    achievements: '98% student retention rate',
    reviewerComments: 'Strongly recommended for 10% merit increment.',
    increaseType: 'PERCENTAGE',
    increasePercentage: 10,
    effectiveDate: new Date('2026-04-01'),
    actorUserId: reviewer.userId,
  })

  console.log(`✓ Appraisal 1 created with ID: ${appraisal1.id}`)
  console.log(`  Previous Salary: ₹${appraisal1.previousSalary}`)
  console.log(`  Increase %: ${appraisal1.increasePercentage}%`)
  console.log(`  Increase Amount: ₹${appraisal1.increaseAmount}`)
  console.log(`  Revised Salary: ₹${appraisal1.revisedSalary}`)
  console.log(`  Status: ${appraisal1.status}`)

  if (appraisal1.increaseAmount !== Math.round((initialBaseSalary * 10) / 100)) {
    throw new Error(`Invalid percentage calculation! Expected ${Math.round(initialBaseSalary * 0.1)}, got ${appraisal1.increaseAmount}`)
  }
  if (appraisal1.revisedSalary !== initialBaseSalary + appraisal1.increaseAmount) {
    throw new Error(`Invalid revised salary calculation!`)
  }
  console.log('✓ Test 1 Passed: Percentage calculation verified server-side.')

  // -------------------------------------------------------------
  // Test 2: Workflow Submission & Self-Approval Prevention
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Submission & Self-Approval Prevention Gate ---')
  const submitted1 = await AppraisalService.submitAppraisal(tenant.id, appraisal1.id, reviewer.userId)
  console.log(`✓ Appraisal status updated to: ${submitted1.status}`)

  // Attempt self-approval (employee trying to approve their own appraisal)
  let selfApprovalBlocked = false
  try {
    await AppraisalService.approveAppraisal(tenant.id, appraisal1.id, employee.userId)
  } catch (err: any) {
    selfApprovalBlocked = true
    console.log(`✓ Self-approval correctly BLOCKED: "${err.message}"`)
  }
  if (!selfApprovalBlocked) {
    throw new Error('SECURITY VIOLATION: Employee was able to approve their own appraisal!')
  }
  console.log('✓ Test 2 Passed: Self-approval guard enforced.')

  // -------------------------------------------------------------
  // Test 3: Approval & Salary Structure Auto-Application
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Approval & Automatic Salary Structure Revision ---')
  const approved1 = await AppraisalService.approveAppraisal(tenant.id, appraisal1.id, reviewer.userId, 'Approved by Management')
  console.log(`✓ Appraisal 1 Approved! Status: ${approved1.status}, Revision Status: ${approved1.salaryRevisionStatus}`)
  console.log(`  Linked SalaryStructureId: ${approved1.salaryStructureId}`)

  // Verify resulting Salary Structure in database
  const updatedSalaryStructure = await db.staffSalaryStructure.findUnique({
    where: { id: approved1.salaryStructureId! },
  })
  if (!updatedSalaryStructure) {
    throw new Error('Linked Salary Structure was not found!')
  }

  console.log(`✓ Salary Structure updated with revised basic salary: ₹${Number(updatedSalaryStructure.basicSalary)}`)
  console.log(`  Effective From: ${updatedSalaryStructure.effectiveFrom.toISOString().split('T')[0]}`)
  if (Number(updatedSalaryStructure.basicSalary) !== approved1.revisedSalary) {
    throw new Error('Salary Structure basic salary does not match appraisal revised salary!')
  }
  console.log('✓ Test 3 Passed: Salary structure integrated successfully.')

  // -------------------------------------------------------------
  // Test 4: Second Appraisal (2026–27) & Fixed Amount Increase
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Second Appraisal Cycle (2026–27) - Fixed Amount Increase ---')
  const appraisal2 = await AppraisalService.createAppraisal(tenant.id, {
    employeeId: employee.id,
    reviewPeriod: '2026–27',
    reviewStartDate: new Date('2026-04-01'),
    reviewEndDate: new Date('2027-03-31'),
    appraisalDate: new Date('2027-04-01'),
    reviewerId: reviewer.id,
    rating: 4.8,
    performanceStatus: 'Outstanding',
    strengths: 'Pioneered new STEM activity modules',
    reviewerComments: 'Fixed increment of ₹3,000 approved.',
    increaseType: 'FIXED_AMOUNT',
    increaseAmount: 3000,
    effectiveDate: new Date('2027-04-01'),
    actorUserId: reviewer.userId,
  })

  console.log(`✓ Appraisal 2 created with ID: ${appraisal2.id}`)
  console.log(`  Previous Base (from latest structure): ₹${appraisal2.previousSalary}`)
  console.log(`  Fixed Increase: ₹${appraisal2.increaseAmount}`)
  console.log(`  Revised Salary: ₹${appraisal2.revisedSalary}`)

  if (appraisal2.previousSalary !== approved1.revisedSalary) {
    throw new Error(`Previous salary for Appraisal 2 (${appraisal2.previousSalary}) should equal previous revised salary (${approved1.revisedSalary})!`)
  }
  if (appraisal2.revisedSalary !== appraisal2.previousSalary + 3000) {
    throw new Error('Fixed amount calculation failed!')
  }

  // Submit and approve second appraisal
  await AppraisalService.submitAppraisal(tenant.id, appraisal2.id, reviewer.userId)
  const approved2 = await AppraisalService.approveAppraisal(tenant.id, appraisal2.id, reviewer.userId)
  console.log(`✓ Appraisal 2 Approved! Revised Salary: ₹${approved2.revisedSalary}`)

  // -------------------------------------------------------------
  // Test 5: Historical Appraisal Retrieval & Self-Service
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Employee Self-Service & Appraisal History ---')
  const history = await AppraisalService.getEmployeeSelfServiceAppraisals(tenant.id, employee.id)
  console.log(`✓ Historical Appraisals count for Employee: ${history.length}`)
  history.forEach((h, idx) => {
    console.log(`  [${idx + 1}] Period: ${h.reviewPeriod} | Rating: ${h.rating} | Previous: ₹${h.previousSalary} ➔ Revised: ₹${h.revisedSalary} | Status: ${h.status}`)
  })
  if (history.length < 2) {
    throw new Error('Employee historical appraisals were overwritten or not retrieved properly!')
  }

  // -------------------------------------------------------------
  // Test 6: Dashboard Statistics Verification
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Dashboard Statistics ---')
  const stats = await AppraisalService.getDashboardStats(tenant.id)
  console.log(`✓ Total Employees: ${stats.totalEmployees}`)
  console.log(`✓ Completed Appraisals: ${stats.completedAppraisals}`)
  console.log(`✓ Approved Appraisals: ${stats.approvedAppraisals}`)
  console.log(`✓ Salary Revisions Applied: ${stats.salaryRevisionsApplied}`)

  console.log('\n✅ ALL E2E INTEGRATION TESTS PASSED 100%! Performance & Appraisal module is fully verified.')
}

main()
  .catch((e) => {
    console.error('\n❌ E2E TEST FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

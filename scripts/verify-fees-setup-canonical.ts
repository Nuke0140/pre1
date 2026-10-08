/**
 * Verification test for Setup Fee Setup <-> Finance Canonical Architecture
 */

import { db } from '../src/lib/db'
import { FeeService } from '../src/lib/fees/fee-service'
import { loadContext, evaluateStep } from '../src/lib/setup/engine'
import { runValidation } from '../src/lib/setup/validate'

async function runVerification() {
  console.log('=== PREONE FEE SETUP <-> FINANCE CANONICAL ARCHITECTURE VERIFICATION ===\n')

  // 1. Fetch current demo tenant
  const tenant = await db.tenant.findFirst({ where: { code: 'SUNSHINE' } })
  if (!tenant) throw new Error('Demo tenant SUNSHINE not found')

  console.log(`Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Ensure Academic Session & Branch exist
  let session = await db.academicSession.findFirst({ where: { tenantId: tenant.id, isCurrent: true } })
  if (!session) {
    session = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: 'AY 2026-27',
        code: 'AY2627',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })
  }

  let branch = await db.branch.findFirst({ where: { tenantId: tenant.id, deletedAt: null } })
  if (!branch) {
    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: 'MAIN-01',
        timingOpen: '08:30',
        timingClose: '15:30',
        isActive: true,
      },
    })
  }

  // 3. Ensure a Program exists and is mapped to Branch
  let program = await db.program.findFirst({ where: { tenantId: tenant.id, deletedAt: null } })
  if (!program) {
    program = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Nursery',
        code: 'NUR',
        programType: 'NURSERY',
        isActive: true,
      },
    })
  }

  // Ensure ProgramBranch mapping
  let mapping = await db.programBranch.findFirst({
    where: { programId: program.id, branchId: branch.id, tenantId: tenant.id, deletedAt: null },
  })
  if (!mapping) {
    mapping = await db.programBranch.create({
      data: {
        tenantId: tenant.id,
        programId: program.id,
        branchId: branch.id,
        isActive: true,
      },
    })
  }

  // Clean up any existing fee structures for this test
  await db.feeItem.deleteMany({ where: { tenantId: tenant.id } })
  await db.feeStructure.deleteMany({ where: { tenantId: tenant.id } })
  await db.feePlan.deleteMany({ where: { tenantId: tenant.id } })

  console.log('\n[TEST 1] Setup Engine reflects missing fee coverage before configuration:')
  let ctx = await loadContext(tenant.id)
  let evalRes = evaluateStep('fees_setup', ctx!)
  console.log(`- fees_setup satisfied: ${evalRes.satisfied} (expected: false)`)
  console.log(`- fees_setup detail: "${evalRes.detail}"`)
  if (evalRes.satisfied) throw new Error('Expected fees_setup to be unsatisfied initially')

  const valRes = await runValidation(tenant.id)
  const financeCat = valRes?.categories.find((c) => c.key === 'finance')
  console.log(`- Finance readiness status: ${financeCat?.status}`)
  if (!financeCat || financeCat.status !== 'BLOCKED') {
    throw new Error('Expected finance BLOCKED status for missing fee structure')
  }

  console.log('\n[TEST 2] Create Canonical FeeStructure (Integer Paise Precision):')
  const ctxScope = {
    tenantId: tenant.id,
    branchId: branch.id,
    actorId: 'test-user',
    actorName: 'Administrator',
    actorRole: 'OWNER',
  }

  const createdStructure = await FeeService.createFeeStructure(ctxScope, {
    branchId: branch.id,
    academicSessionId: session.id,
    programId: program.id,
    name: 'Nursery Canonical Fee Structure 2026-27',
    description: 'Annual tuition + admission + deposit',
    status: 'ACTIVE',
    items: [
      {
        name: 'Admission Fee',
        feeType: 'REGULAR',
        amountCents: 500000, // Rs 5,000 in integer paise
        frequency: 'ONE_TIME',
        dueRule: 'On Admission',
        lateFeeApplicable: false,
        lateFeeAmountCents: 0,
        isRefundable: false,
      },
      {
        name: 'Tuition Fee',
        feeType: 'REGULAR',
        amountCents: 400000, // Rs 4,000 in integer paise
        frequency: 'MONTHLY',
        dueRule: '10th of every month',
        lateFeeApplicable: true,
        lateFeeAmountCents: 20000, // Rs 200 late fee
        isRefundable: false,
      },
      {
        name: 'Security Deposit',
        feeType: 'REFUNDABLE_DEPOSIT',
        amountCents: 500000, // Rs 5,000 in integer paise
        frequency: 'ONE_TIME',
        dueRule: 'On Admission',
        lateFeeApplicable: false,
        lateFeeAmountCents: 0,
        isRefundable: true,
      },
    ],
  })

  console.log(`- Created FeeStructure ID: ${createdStructure.id}`)
  console.log(`- Stored Items count: ${createdStructure.items.length}`)
  console.log(`- Item 1 amountCents: ${createdStructure.items[0].amountCents} (Rs ${createdStructure.items[0].amountCents / 100})`)
  console.log(`- Item 2 lateFeeAmountCents: ${createdStructure.items[1].lateFeeAmountCents} (Rs ${createdStructure.items[1].lateFeeAmountCents / 100})`)
  console.log(`- Item 3 isRefundable: ${createdStructure.items[2].isRefundable}`)

  if (createdStructure.items[0].amountCents !== 500000) {
    throw new Error('Integer paise invariant failed for Admission Fee')
  }

  console.log('\n[TEST 3] Duplicate active fee structure prevention:')
  let duplicatePrevented = false
  try {
    await FeeService.createFeeStructure(ctxScope, {
      branchId: branch.id,
      academicSessionId: session.id,
      programId: program.id,
      name: 'Duplicate Nursery Structure',
      status: 'ACTIVE',
      items: [
        {
          name: 'Tuition',
          amountCents: 300000,
        },
      ],
    })
  } catch (err: any) {
    duplicatePrevented = true
    console.log(`- Duplicate caught successfully: "${err.message}"`)
  }
  if (!duplicatePrevented) throw new Error('Expected duplicate active fee structure to be rejected')

  console.log('\n[TEST 4] Unmapped program rejection for branch:')
  const otherProg = await db.program.create({
    data: {
      tenantId: tenant.id,
      name: 'Unmapped Program',
      code: 'UNMAP',
      programType: 'DAYCARE',
      isActive: true,
    },
  })
  let unmappedPrevented = false
  try {
    await FeeService.createFeeStructure(ctxScope, {
      branchId: branch.id,
      academicSessionId: session.id,
      programId: otherProg.id,
      name: 'Unmapped Program Fee',
      status: 'ACTIVE',
      items: [{ name: 'Fee', amountCents: 100000 }],
    })
  } catch (err: any) {
    unmappedPrevented = true
    console.log(`- Unmapped caught successfully: "${err.message}"`)
  }
  if (!unmappedPrevented) throw new Error('Expected unmapped program for branch to be rejected')

  // Clean up otherProg
  await db.program.delete({ where: { id: otherProg.id } })

  console.log('\n[TEST 5] Setup Engine re-evaluation with active fee structure:')
  // Query all active programBranch mappings and ensure each has an active fee structure
  const activeMappings = await db.programBranch.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: { program: true, branch: true },
  })

  for (const map of activeMappings) {
    const existing = await db.feeStructure.findFirst({
      where: {
        tenantId: tenant.id,
        programId: map.programId,
        branchId: map.branchId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    })
    if (!existing) {
      await FeeService.createFeeStructure(ctxScope, {
        branchId: map.branchId,
        academicSessionId: session.id,
        programId: map.programId,
        name: `${map.program.name} (${map.branch.name}) Annual Fee Structure`,
        status: 'ACTIVE',
        items: [{ name: 'Tuition', amountCents: 350000, frequency: 'ANNUALLY' }],
      })
    }
  }

  ctx = await loadContext(tenant.id)
  evalRes = evaluateStep('fees_setup', ctx!)
  console.log(`- fees_setup satisfied: ${evalRes.satisfied} (expected: true)`)
  console.log(`- fees_setup detail: "${evalRes.detail}"`)
  if (!evalRes.satisfied) throw new Error('Expected fees_setup to be satisfied after creating FeeStructures')

  const postValRes = await runValidation(tenant.id)
  const postFinanceCat = postValRes?.categories.find((c) => c.key === 'finance')
  console.log(`- Post-configuration finance status: ${postFinanceCat?.status} (expected: PASS or WARNING)`)
  if (postFinanceCat && postFinanceCat.status === 'BLOCKED') {
    throw new Error(`Unexpected finance BLOCKED status: ${postFinanceCat.findings.map((b) => b.message).join(', ')}`)
  }

  console.log('\n[TEST 6] Finance Module reads the exact same canonical FeeStructure:')
  const financeStructures = await FeeService.getFeeStructures(tenant.id, {
    branchId: branch.id,
    academicSessionId: session.id,
  })
  console.log(`- Finance query returned ${financeStructures.length} structures`)
  const found = financeStructures.find((s) => s.id === createdStructure.id)
  if (!found) throw new Error('Finance failed to read the canonical FeeStructure created in Setup')
  console.log(`- Verified Finance sees: "${found.name}" with ${found.items.length} items`)

  console.log('\n>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<')
}

runVerification()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

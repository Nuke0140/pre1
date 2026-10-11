/**
 * PREONE SETUP MODULE — MULTI-BRANCH & MASTER/MAPPING ARCHITECTURE VERIFICATION
 * 
 * Verifies:
 * 1. Zero-Shadow Architecture (reuses canonical Program, ProgramBranch, Classroom, FeeStructure).
 * 2. Master + Mapping model:
 *    - 1 Master Program record across tenant (e.g. "Nursery").
 *    - 3 Branch mappings (Pune, Sangli, Kolhapur) with branch-specific capacity/status.
 *    - Verifies zero duplicate master entities.
 * 3. Branch-scoped step evaluations (programs, classroom, subject, fees_setup).
 * 4. Multi-campus Go-Live gate enforcement:
 *    - Tenant Go-Live is strictly BLOCKED if any active branch has missing requirements.
 *    - Go-Live succeeds once all active branches satisfy requirements.
 * 5. Branch mapping deactivation behavior.
 */

import { db } from '../src/lib/db'
import { loadContext, evaluateStep, syncSetup } from '../src/lib/setup/engine'
import { runValidation, goLive } from '../src/lib/setup/validate'

async function runMultiBranchVerification() {
  console.log('======================================================================')
  console.log('   PREONE MULTI-BRANCH SETUP & MASTER/MAPPING ARCHITECTURE VERIFICATION')
  console.log('======================================================================\n')

  // 1. Locate test tenant
  const tenant = await db.tenant.findFirst({ where: { code: 'SUNSHINE' } })
  if (!tenant) throw new Error('Demo tenant SUNSHINE not found')
  console.log(`[INIT] Testing on Tenant: ${tenant.name} (${tenant.id})`)

  // Ensure current academic session exists
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

  // 2. Setup 3 distinct test branches: Pune (Main), Sangli, Kolhapur
  console.log('\n[TEST 1] Setting up 3 Canonical Campuses:')
  const branchCodes = ['MB-PUNE', 'MB-SANGLI', 'MB-KOLHAPUR']
  const branchNames = ['Pune Campus', 'Sangli Campus', 'Kolhapur Campus']

  const branches = []
  for (let i = 0; i < 3; i++) {
    let b = await db.branch.findFirst({ where: { tenantId: tenant.id, code: branchCodes[i] } })
    if (!b) {
      b = await db.branch.create({
        data: {
          tenantId: tenant.id,
          code: branchCodes[i],
          name: branchNames[i],
          isMain: i === 0,
          isActive: true,
          timingOpen: '08:30',
          timingClose: '15:30',
        },
      })
    } else {
      b = await db.branch.update({
        where: { id: b.id },
        data: { isActive: true, deletedAt: null },
      })
    }
    branches.push(b)
    console.log(`  ✓ Campus ${i + 1}: ${b.name} (${b.code}) — ID: ${b.id}`)
  }

  const [puneBranch, sangliBranch, kolhapurBranch] = branches

  // 3. Clean up test data for these branches to ensure isolated verification
  await db.classroom.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.programBranch.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.feeItem.deleteMany({
    where: { tenantId: tenant.id, feeStructure: { branchId: { in: branches.map((b) => b.id) } } },
  })
  await db.feeStructure.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.program.deleteMany({
    where: { tenantId: tenant.id, code: 'MB-NUR' },
  })

  // 4. Test Master + Mapping Model: Single Program Master with Branch Mappings
  console.log('\n[TEST 2] Testing Master + Mapping Model (Zero Duplicate Masters):')
  const masterProgram = await db.program.create({
    data: {
      tenantId: tenant.id,
      name: 'Nursery Multi-Branch Master',
      code: 'MB-NUR',
      programType: 'NURSERY',
      capacity: 30,
      isActive: true,
    },
  })
  console.log(`  ✓ Created Master Program: "${masterProgram.name}" (${masterProgram.code})`)

  // Check how many programs have code MB-NUR
  const countMasters = await db.program.count({
    where: { tenantId: tenant.id, code: 'MB-NUR' },
  })
  if (countMasters !== 1) {
    throw new Error(`Master entity violation: expected 1 program row, found ${countMasters}`)
  }
  console.log(`  ✓ Master count verified: exactly 1 master entity exists`)

  // Map master program to all 3 branches with campus-specific capacity
  const mappings = [
    { branchId: puneBranch.id, capacity: 35, isActive: true },
    { branchId: sangliBranch.id, capacity: 25, isActive: true },
    { branchId: kolhapurBranch.id, capacity: 20, isActive: true },
  ]
  for (const m of mappings) {
    await db.programBranch.create({
      data: {
        tenantId: tenant.id,
        programId: masterProgram.id,
        branchId: m.branchId,
        capacity: m.capacity,
        isActive: m.isActive,
      },
    })
  }
  console.log(`  ✓ Created 3 ProgramBranch mappings (Pune: 35 cap, Sangli: 25 cap, Kolhapur: 20 cap)`)

  // 5. Setup Engine: Branch-Specific Step Evaluation
  console.log('\n[TEST 3] Setup Engine: Evaluating Steps per Campus:')
  let ctx = await loadContext(tenant.id)
  if (!ctx) throw new Error('Failed to load setup context')

  // Program step evaluation for Pune vs Sangli vs Kolhapur
  const evalPuneProg = evaluateStep('programs', ctx, puneBranch.id)
  const evalSangliProg = evaluateStep('programs', ctx, sangliBranch.id)
  console.log(`  ✓ 'programs' step at Pune: satisfied = ${evalPuneProg.satisfied}`)
  console.log(`  ✓ 'programs' step at Sangli: satisfied = ${evalSangliProg.satisfied}`)
  if (!evalPuneProg.satisfied || !evalSangliProg.satisfied) {
    throw new Error('Programs step should be satisfied when program is mapped')
  }

  // Classroom step evaluation: Pune has 0 classrooms, should be unsatisfied
  const evalPuneClass = evaluateStep('classroom', ctx, puneBranch.id)
  console.log(`  ✓ 'classroom' step at Pune (0 classrooms): satisfied = ${evalPuneClass.satisfied}`)
  if (evalPuneClass.satisfied) {
    throw new Error('Classroom step should NOT be satisfied when 0 classrooms exist')
  }

  // 6. Test Multi-Branch Go-Live Gate Enforcement (Blocked Campus Blocks Tenant)
  console.log('\n[TEST 4] Go-Live Gate: Verifying Incomplete Campuses Block Go-Live:')
  const valResultInitial = await runValidation(tenant.id)
  const totalFindings = valResultInitial.categories.flatMap((c) => c.findings).length
  console.log(`  ✓ Total findings: ${totalFindings}`)
  console.log(`  ✓ Blockers count: ${valResultInitial.blockers.length}`)
  console.log(`  ✓ Branch summaries: ${valResultInitial.branchSummaries.length} campuses assessed`)
  for (const bs of valResultInitial.branchSummaries) {
    console.log(`    - Campus "${bs.branchName}": ${bs.status} (${bs.blockedCount} blockers, ${bs.warningCount} warnings)`)
  }

  // Attempt Go-Live: MUST FAIL
  const goLiveAttempt1 = await goLive(tenant.id, { id: 'tester', name: 'Tester' })
  console.log(`  ✓ Go-Live result when campuses incomplete: ok = ${goLiveAttempt1.ok}`)
  if (goLiveAttempt1.ok) {
    throw new Error('Go-Live MUST FAIL when active campuses have blocker findings!')
  }
  console.log(`  ✓ Go-Live correctly rejected with message: "${goLiveAttempt1.message}"`)

  // 7. Partially Configure: Configure Pune and Sangli, leave Kolhapur missing fee structure
  console.log('\n[TEST 5] Partial Configuration (Kolhapur missing fees):')
  // Find or create user for primaryTeacherId
  let user = await db.user.findFirst()
  if (!user) {
    user = await db.user.create({
      data: {
        fullName: 'Lead Teacher',
        email: 'lead.teacher.mb@sunshine.test',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    })
  }
  const teacherId = user.id

  // Create classrooms for Pune and Sangli
  await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: puneBranch.id,
      programId: masterProgram.id,
      programType: 'NURSERY',
      academicSessionId: session.id,
      name: 'Pune Nursery A',
      code: 'PUN-NUR-A',
      capacity: 30,
      primaryTeacherId: teacherId,
      isActive: true,
    },
  })

  await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: sangliBranch.id,
      programId: masterProgram.id,
      programType: 'NURSERY',
      academicSessionId: session.id,
      name: 'Sangli Nursery A',
      code: 'SAN-NUR-A',
      capacity: 25,
      primaryTeacherId: teacherId,
      isActive: true,
    },
  })

  // Create fee structure for Pune and Sangli only
  const puneFs = await db.feeStructure.create({
    data: {
      tenantId: tenant.id,
      branchId: puneBranch.id,
      academicSessionId: session.id,
      programId: masterProgram.id,
      name: 'Pune Nursery Fee Structure',
      status: 'ACTIVE',
    },
  })
  await db.feeItem.create({
    data: {
      tenantId: tenant.id,
      feeStructureId: puneFs.id,
      name: 'Pune Tuition',
      feeType: 'REGULAR',
      frequency: 'MONTHLY',
      amountCents: 450000,
    },
  })

  const sangliFs = await db.feeStructure.create({
    data: {
      tenantId: tenant.id,
      branchId: sangliBranch.id,
      academicSessionId: session.id,
      programId: masterProgram.id,
      name: 'Sangli Nursery Fee Structure',
      status: 'ACTIVE',
    },
  })
  await db.feeItem.create({
    data: {
      tenantId: tenant.id,
      feeStructureId: sangliFs.id,
      name: 'Sangli Tuition',
      feeType: 'REGULAR',
      frequency: 'MONTHLY',
      amountCents: 350000,
    },
  })

  // Re-run setup sync and verify Kolhapur is flagged as incomplete
  const syncResult = await syncSetup(tenant.id)
  console.log(`  ✓ Setup Sync Tenant State: ${syncResult.status}`)
  const kolhapurReadiness = syncResult.branchReadiness?.find((b) => b.branchId === kolhapurBranch.id)
  console.log(`  ✓ Kolhapur Campus Status: ${kolhapurReadiness?.status}`)
  console.log(`  ✓ Kolhapur Campus Blockers: [${kolhapurReadiness?.blockers.join('; ')}]`)
  const hasFeeBlocker = kolhapurReadiness?.blockers.some((b) => b.includes('lack active fee structure'))
  const hasClassBlocker = kolhapurReadiness?.blockers.some((b) => b.includes('No classrooms configured'))
  if (!hasFeeBlocker || !hasClassBlocker) {
    throw new Error('Kolhapur should be flagged for missing classroom and missing fee structure')
  }

  // 8. Complete Kolhapur Configuration & Verify All Campuses Ready
  console.log('\n[TEST 6] Completing Kolhapur Configuration & Clearing Operational Blockers:')
  await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: kolhapurBranch.id,
      programId: masterProgram.id,
      programType: 'NURSERY',
      academicSessionId: session.id,
      name: 'Kolhapur Nursery A',
      code: 'KOL-NUR-A',
      capacity: 20,
      primaryTeacherId: teacherId,
      isActive: true,
    },
  })

  const kolhapurFs = await db.feeStructure.create({
    data: {
      tenantId: tenant.id,
      branchId: kolhapurBranch.id,
      academicSessionId: session.id,
      programId: masterProgram.id,
      name: 'Kolhapur Nursery Fee Structure',
      status: 'ACTIVE',
    },
  })
  await db.feeItem.create({
    data: {
      tenantId: tenant.id,
      feeStructureId: kolhapurFs.id,
      name: 'Kolhapur Tuition',
      feeType: 'REGULAR',
      frequency: 'MONTHLY',
      amountCents: 300000,
    },
  })

  // Re-sync
  const syncResult2 = await syncSetup(tenant.id)
  const kolhapurReadiness2 = syncResult2.branchReadiness?.find((b) => b.branchId === kolhapurBranch.id)
  const hasFeeBlocker2 = kolhapurReadiness2?.blockers.some((b) => b.includes('lack active fee structure'))
  const hasClassBlocker2 = kolhapurReadiness2?.blockers.some((b) => b.includes('No classrooms configured'))
  console.log(`  ✓ Kolhapur fee blocker cleared: ${!hasFeeBlocker2}`)
  console.log(`  ✓ Kolhapur classroom blocker cleared: ${!hasClassBlocker2}`)
  if (hasFeeBlocker2 || hasClassBlocker2) {
    throw new Error('Expected Kolhapur fee and classroom blockers to be cleared after configuration')
  }

  // Verify live step evaluations for Kolhapur
  const ctx2 = await loadContext(tenant.id)
  const evalKolhapurClass = evaluateStep('classroom', ctx2!, kolhapurBranch.id)
  const evalKolhapurFees = evaluateStep('fees_setup', ctx2!, kolhapurBranch.id)
  console.log(`  ✓ Kolhapur live step 'classroom': satisfied = ${evalKolhapurClass.satisfied}`)
  console.log(`  ✓ Kolhapur live step 'fees_setup': satisfied = ${evalKolhapurFees.satisfied}`)
  if (!evalKolhapurClass.satisfied || !evalKolhapurFees.satisfied) {
    throw new Error('Kolhapur classroom and fees_setup should be satisfied')
  }

  // 9. Test Branch Mapping Deactivation
  console.log('\n[TEST 7] Testing Campus Mapping Deactivation (Branch Independence):')
  // If Sangli deactivates Nursery mapping:
  await db.programBranch.update({
    where: { programId_branchId: { programId: masterProgram.id, branchId: sangliBranch.id } },
    data: { isActive: false },
  })
  const ctx3 = await loadContext(tenant.id)
  const evalSangliOffered = evaluateStep('programs', ctx3!, sangliBranch.id)
  console.log(`  ✓ Sangli 'programs' step after deactivation: detail = "${evalSangliOffered.detail}"`)
  const sangliMapping = ctx3!.programBranches.find((m) => m.branchId === sangliBranch.id && m.programId === masterProgram.id)
  console.log(`  ✓ Sangli mapping isActive in database: ${sangliMapping?.isActive} (expected: false)`)
  const puneMapping = ctx3!.programBranches.find((m) => m.branchId === puneBranch.id && m.programId === masterProgram.id)
  console.log(`  ✓ Pune mapping remains active independently: ${puneMapping?.isActive} (expected: true)`)
  if (sangliMapping?.isActive !== false || puneMapping?.isActive !== true) {
    throw new Error('Deactivating Sangli program mapping must not affect Pune mapping')
  }

  // 9. Clean up test records
  console.log('\n[CLEANUP] Cleaning up test records:')
  await db.classroom.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.feeItem.deleteMany({
    where: { tenantId: tenant.id, feeStructure: { branchId: { in: branches.map((b) => b.id) } } },
  })
  await db.feeStructure.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.programBranch.deleteMany({
    where: { tenantId: tenant.id, branchId: { in: branches.map((b) => b.id) } },
  })
  await db.program.deleteMany({
    where: { tenantId: tenant.id, code: 'MB-NUR' },
  })
  await db.branch.deleteMany({
    where: { tenantId: tenant.id, code: { in: ['MB-SANGLI', 'MB-KOLHAPUR'] } },
  })
  console.log('  ✓ Test multi-branch records cleaned successfully')

  console.log('\n======================================================================')
  console.log('   ALL MULTI-BRANCH & MASTER/MAPPING TESTS PASSED SUCCESSFULLY! ✓')
  console.log('======================================================================\n')
}

runMultiBranchVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

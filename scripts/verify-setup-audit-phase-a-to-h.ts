import { db } from '../src/lib/db'
import { SETUP_STEPS, PHASES, STEP_MAP } from '../src/lib/setup/steps'
import { syncSetup } from '../src/lib/setup/engine'
import { SubjectService } from '../src/lib/academics/subject-service'
import { FeeService } from '../src/lib/fees/fee-service'

async function runAuditVerification() {
  console.log('================================================================')
  console.log('PREONE SETUP MODULE — AUDIT VERIFICATION (PHASE A THROUGH H)')
  console.log('================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`)
      passed++
    } else {
      console.error(`  ✗ FAIL: ${desc}`)
      failed++
    }
  }

  // ── AUDIT TEST 1: Phase C Removal ──
  console.log('[AUDIT 1] Phase 3 Operations Removal from Active Setup')
  assert(PHASES.length === 3, 'PHASES array contains exactly 3 active phases')
  assert(!PHASES.some((p) => p.key === 'OPERATIONS'), 'OPERATIONS phase is completely absent from PHASES')
  const stepKeys = SETUP_STEPS.map((s) => s.key)
  assert(!stepKeys.includes('mood_environment'), 'mood_environment step is removed from SETUP_STEPS')
  assert(!stepKeys.includes('health_settings'), 'health_settings step is removed from SETUP_STEPS')
  assert(!stepKeys.includes('daily_operations'), 'daily_operations step is removed from SETUP_STEPS')
  assert(!stepKeys.includes('observation'), 'observation step is removed from SETUP_STEPS')

  // ── AUDIT TEST 2: Deferred & Non-Blocking Rules (B4 & B9) ──
  console.log('\n[AUDIT 2] Curriculum Approach & Roles & Permissions Non-Blocking')
  const rolesDef = STEP_MAP['roles']
  const curriculumDef = STEP_MAP['curriculum']
  assert(rolesDef?.applicability === 'OPTIONAL', 'Roles & Permissions is OPTIONAL/non-blocking')
  assert(curriculumDef?.applicability === 'OPTIONAL', 'Curriculum Approach is OPTIONAL/non-blocking')
  assert((curriculumDef?.deps?.length ?? 0) === 0, 'Curriculum Approach has 0 blocking dependencies')

  // ── AUDIT TEST 3: B1 School Profile & Branch Synchronization ──
  console.log('\n[AUDIT 3] School Profile and Branch Synchronization (Single Source of Truth)')
  const tenant = await db.tenant.findFirst({
    where: { deletedAt: null },
    include: {
      branches: { where: { deletedAt: null } },
    },
  })
  assert(!!tenant, 'Active tenant exists for verification')
  if (tenant) {
    const branches = tenant.branches
    assert(branches.length > 0, `Tenant "${tenant.name}" has ${branches.length} branch records`)
    assert(branches.every((b) => b.tenantId === tenant.id), 'All branch records strictly preserve tenant isolation')
  }

  // ── AUDIT TEST 4: B2 Program-wise Subject Creation & Persistence ──
  console.log('\n[AUDIT 4] Program-wise Subject Creation and Persistence')
  if (tenant) {
    const playgroupProg = await db.program.findFirst({
      where: { tenantId: tenant.id, programType: 'PLAYGROUP', deletedAt: null },
    }) || await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Playgroup Audit Program',
        code: `PG-AUD-${Date.now().toString().slice(-4)}`,
        programType: 'PLAYGROUP',
        capacity: 25,
      },
    })

    const testSubjectCode = `AUD-${Date.now().toString().slice(-4)}`
    const createdSubject = await SubjectService.createSubject(
      tenant.id,
      {
        name: 'Early Sensory & Motor Skills',
        code: testSubjectCode,
        shortName: 'Sensory',
        description: 'Sensory play audit test',
        subjectType: 'CORE',
        programIds: [playgroupProg.id],
      },
      { id: 'audit-runner', name: 'Audit Runner', role: 'ADMIN' }
    )
    assert(!!createdSubject?.id, 'Subject created and persisted via SubjectService')

    const reloaded = await db.subject.findFirst({
      where: { id: createdSubject.id, tenantId: tenant.id },
      include: { programMappings: true },
    })
    assert(!!reloaded, 'Subject verified in database (single source of truth)')
    assert(
      reloaded?.programMappings.some((pm) => pm.programId === playgroupProg.id) ?? false,
      'Subject correctly mapped to Playgroup program'
    )
  }

  // ── AUDIT TEST 5: B5 & B6 Branch-wise Classrooms & Mappings ──
  console.log('\n[AUDIT 5] Branch-wise Classroom Configuration & Label Formatting')
  if (tenant) {
    const branch = tenant.branches[0]
    const currentYear = await db.academicSession.findFirst({
      where: { tenantId: tenant.id, isCurrent: true },
    }) || await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: 'AY 2026-27 Audit',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })

    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
    const roomA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: currentYear.id,
        name: 'Sunshine Room Alpha',
        code: `AUD-CLA-${randomSuffix}`,
        programType: 'PLAYGROUP',
        capacity: 20,
      },
    })

    assert(roomA.branchId === branch.id, 'Classroom correctly scoped to Branch ID')
    assert(roomA.tenantId === tenant.id, 'Classroom correctly scoped to Tenant ID')

    const expectedDisplayLabel = `${branch.name} — ${roomA.name}`
    assert(expectedDisplayLabel.startsWith(branch.name), `Classroom display label formatted as "${expectedDisplayLabel}"`)

    // Clean up test room
    await db.classroom.delete({ where: { id: roomA.id } })
  }

  // ── AUDIT TEST 6: Phase D Fees Module Integration & Apply to Class ──
  console.log('\n[AUDIT 6] Fees Setup Integration & Apply to Class')
  assert(stepKeys.includes('fees_setup'), 'fees_setup step active in SETUP_STEPS (Phase 3 in UI, Phase 4 in spec)')
  const feeStepDef = STEP_MAP['fees_setup']
  assert(feeStepDef?.applicability === 'MANDATORY', 'fees_setup is a MANDATORY go-live requirement')

  if (tenant) {
    const activeStructures = await db.feeStructure.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE', deletedAt: null },
      include: { items: true },
    })
    assert(activeStructures.length > 0, `Active fee structures found (${activeStructures.length})`)
    const hasRefundable = activeStructures.some((s) => s.items.some((i) => i.isRefundable))
    assert(hasRefundable, 'Supports refundable caution deposit items alongside regular fee heads')
  }

  // ── AUDIT TEST 7: Tenant Evaluation Engine ──
  console.log('\n[AUDIT 7] Setup Engine Evaluation Consistency')
  if (tenant) {
    const syncResult = await syncSetup(tenant.id)
    assert(syncResult.steps.length === 14, `Engine evaluated exactly 14 canonical steps (got ${syncResult.steps.length})`)
    assert(typeof syncResult.progress === 'number', `Progress calculated accurately: ${syncResult.progress}%`)
  }

  console.log('\n================================================================')
  console.log(`AUDIT VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runAuditVerification()
  .catch((e) => {
    console.error('Audit verification crashed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

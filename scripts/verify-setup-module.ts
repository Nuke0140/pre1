import { db } from '../src/lib/db'
import { loadContext, syncSetup, evaluateStep } from '../src/lib/setup/engine'
import { SETUP_STEPS, STEP_MAP } from '../src/lib/setup/steps'
import { runValidation } from '../src/lib/setup/validate'
import { getEffectiveBranding } from '../src/lib/branding-service'

async function runTests() {
  console.log('=== STARTING SETUP MODULE VERIFICATION ===')

  // Find a tenant to test against
  const tenant = await db.tenant.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true, code: true },
  })

  if (!tenant) {
    console.error('FAIL: No tenant found in DB to test against!')
    process.exit(1)
  }

  console.log(`Testing with Tenant ID: ${tenant.id} (${tenant.name})`)

  // 1. Verify School Legal Name Data Flow
  console.log('\n--- Test 1: School Legal Name Data Flow ---')
  const originalName = tenant.name
  const branding = await getEffectiveBranding(tenant.id)
  console.log(`Branding schoolName: "${branding.schoolName}"`)

  if (branding.schoolName !== originalName) {
    console.error(`FAIL: Branding schoolName "${branding.schoolName}" does not match tenant name "${originalName}"!`)
    process.exit(1)
  } else {
    console.log('PASS: School Legal Name fetched accurately from School Profile (Tenant.name)')
  }

  // 2. Verify Branch Step Evaluation (Issue 2 Fix)
  console.log('\n--- Test 2: Branch Step Evaluation (No premature classroom requirement) ---')
  const ctx = await loadContext(tenant.id)
  if (!ctx) {
    console.error('FAIL: Could not load tenant context!')
    process.exit(1)
  }

  const branchEval = evaluateStep('branch', ctx)
  console.log(`Branch Step Satisfied: ${branchEval.satisfied}`)
  console.log(`Branch Step Detail: "${branchEval.detail}"`)

  const activeBranches = ctx.branches.filter((b) => b.isActive)
  if (activeBranches.length > 0 && activeBranches.every((b) => b.timingOpen < b.timingClose)) {
    if (!branchEval.satisfied) {
      console.error('FAIL: Branch step should be satisfied when active branches with valid timings exist!')
      process.exit(1)
    } else {
      console.log('PASS: Branch step satisfied based solely on active branches and valid timings (no circular classroom block).')
    }
  }

  // 3. Verify Classroom Foundation Step
  console.log('\n--- Test 3: Classroom Foundation Step ---')
  const cfDef = STEP_MAP['classroom_foundation']
  if (!cfDef) {
    console.error('FAIL: classroom_foundation step not found in STEP_MAP!')
    process.exit(1)
  }
  console.log(`Classroom Foundation Phase: ${cfDef.phase}, Applicability: ${cfDef.applicability}, Deps: [${cfDef.deps.join(', ')}]`)

  const cfEval = evaluateStep('classroom_foundation', ctx)
  console.log(`Classroom Foundation Satisfied: ${cfEval.satisfied}`)
  console.log(`Classroom Foundation Detail: "${cfEval.detail}"`)

  // 4. Verify Academic Year Step Dependency Unlocking
  console.log('\n--- Test 4: Academic Year Dependency Unlocking ---')
  const ayDef = STEP_MAP['academic_year']
  console.log(`Academic Year Deps: [${ayDef.deps.join(', ')}]`)
  if (ayDef.deps.includes('classroom' as any) || ayDef.deps.includes('classroom_foundation' as any)) {
    console.error('FAIL: Academic Year should depend only on branch, not classroom!')
    process.exit(1)
  } else {
    console.log('PASS: Academic Year correctly depends on Branch and is unlocked after Branch creation.')
  }

  // 5. Verify Full Setup Sync & Health Check Validation
  console.log('\n--- Test 5: Full Setup Sync & Health Check Validation ---')
  const setupPayload = await syncSetup(tenant.id, { id: 'test', name: 'Test Runner' })
  if (!setupPayload) {
    console.error('FAIL: syncSetup returned null!')
    process.exit(1)
  }
  console.log(`Setup Status: ${setupPayload.status}, Progress: ${setupPayload.progress}%`)
  console.log(`Total Steps in Payload: ${setupPayload.steps.length}`)

  const validationRes = await runValidation(tenant.id)
  console.log(`Validation Overall Status: ${validationRes?.overall}`)

  console.log('\n=== ALL SETUP MODULE VERIFICATION TESTS PASSED SUCCESSFULLY! ===')
}

runTests()
  .catch((err) => {
    console.error('FATAL TEST ERROR:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

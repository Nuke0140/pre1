import {
  assertActorResourceScope,
  assertBranchScope,
  assertTenantScope,
  tenantScopedIdWhere,
  isInstitutionWide,
  isActorInstitutionWide,
} from '../src/lib/security/resource-scope'

const owner = {
  uid: 'owner-1',
  email: 'owner@example.com',
  name: 'Owner',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'OWNER' as const,
  roles: ['OWNER' as const],
}

const teacher = {
  uid: 'teacher-1',
  email: 'teacher@example.com',
  name: 'Teacher',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'TEACHER' as const,
  roles: ['TEACHER' as const],
}

const teacherNoBranch = {
  uid: 'teacher-2',
  email: 'teacher2@example.com',
  name: 'Teacher Unassigned',
  tenantId: 'tenant-a',
  branchId: null,
  role: 'TEACHER' as const,
  roles: ['TEACHER' as const],
}

const multiRoleTeacherPrincipal = {
  uid: 'multi-1',
  email: 'multi1@example.com',
  name: 'Teacher and Principal',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'TEACHER' as const,
  roles: ['TEACHER' as const, 'PRINCIPAL' as const],
}

const multiRoleTeacherAccountant = {
  uid: 'multi-2',
  email: 'multi2@example.com',
  name: 'Teacher and Accountant',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'TEACHER' as const,
  roles: ['TEACHER' as const, 'ACCOUNTANT' as const],
}

const foreignResource = { tenantId: 'tenant-b', branchId: 'branch-a' }
const foreignBranch = { tenantId: 'tenant-a', branchId: 'branch-b' }
const sameResource = { tenantId: 'tenant-a', branchId: 'branch-a' }

function expectThrows(label: string, fn: () => void, expectedMessageSubstr?: string) {
  try {
    fn()
    throw new Error(`FAIL: ${label} did not reject`)
  } catch (error: any) {
    if (String(error).startsWith('Error: FAIL:')) throw error
    if (expectedMessageSubstr && !error.message?.includes(expectedMessageSubstr)) {
      throw new Error(`FAIL: ${label} threw unexpected error: ${error.message}`)
    }
    console.log(`PASS: ${label}`)
  }
}

// 1. Tenant-scoped ID helper test
if (JSON.stringify(tenantScopedIdWhere('student-1', 'tenant-a')) !==
    JSON.stringify({ id: 'student-1', tenantId: 'tenant-a' })) {
  throw new Error('FAIL: tenantScopedIdWhere')
}
console.log('PASS: tenantScopedIdWhere')

// 2. Tenant boundary assertion
assertTenantScope(owner, sameResource)
console.log('PASS: same-tenant resource')
expectThrows('cross-tenant resource', () => assertTenantScope(owner, foreignResource), 'cross-tenant')

// 3. Branch scope assertion: basic
expectThrows('branch-scoped teacher on foreign branch', () => assertBranchScope(teacher, foreignBranch), 'belongs to another branch')
assertBranchScope(owner, foreignBranch.branchId)
console.log('PASS: institution-wide owner branch access')

// 4. Hardened Fix 1: Branch-scoped actor with missing branchId MUST BE DENIED (fail-closed)
expectThrows(
  'branch-scoped teacher with no branch assignment is denied',
  () => assertBranchScope(teacherNoBranch, foreignBranch.branchId),
  'missing branch assignment'
)
expectThrows(
  'actor with missing branch is denied access to branch-bound resource',
  () => assertActorResourceScope(
    { tenantId: 'tenant-a', branchId: null, role: 'TEACHER', roles: ['TEACHER'] },
    foreignBranch
  ),
  'missing branch assignment'
)

// 5. Hardened Fix 2: Multi-role resolution
// A user who is both TEACHER and PRINCIPAL has institution-wide privileges
if (!isInstitutionWide(multiRoleTeacherPrincipal)) {
  throw new Error('FAIL: multiRoleTeacherPrincipal should be institution-wide')
}
if (!isActorInstitutionWide({ tenantId: 'tenant-a', role: 'TEACHER', roles: ['TEACHER', 'PRINCIPAL'] })) {
  throw new Error('FAIL: ScopeActor with TEACHER + PRINCIPAL should be institution-wide')
}
assertBranchScope(multiRoleTeacherPrincipal, foreignBranch.branchId)
console.log('PASS: multi-role [TEACHER, PRINCIPAL] has institution-wide branch bypass')

// A user who is TEACHER + ACCOUNTANT remains branch-scoped
if (isInstitutionWide(multiRoleTeacherAccountant)) {
  throw new Error('FAIL: multiRoleTeacherAccountant should NOT be institution-wide')
}
expectThrows(
  'multi-role [TEACHER, ACCOUNTANT] is restricted by branch scope',
  () => assertBranchScope(multiRoleTeacherAccountant, foreignBranch.branchId),
  'belongs to another branch'
)

// 6. Actor resource scope boundary
assertActorResourceScope(teacher, sameResource)
console.log('PASS: actor resource scope')

expectThrows('actor cross-tenant resource', () =>
  assertActorResourceScope(teacher, foreignResource),
  'cross-tenant'
)
expectThrows('actor foreign-branch resource', () =>
  assertActorResourceScope(teacher, foreignBranch),
  'belongs to another branch'
)

console.log('\n======================================================')
console.log('  ALL R1 HARDENED RESOURCE-SCOPE ASSERTIONS PASSED')
console.log('======================================================\n')

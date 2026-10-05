import {
  assertActorResourceScope,
  assertBranchScope,
  assertTenantScope,
  tenantScopedIdWhere,
} from '../src/lib/security/resource-scope'

const owner = {
  uid: 'owner-1',
  email: 'owner@example.com',
  name: 'Owner',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'OWNER' as const,
}

const teacher = {
  uid: 'teacher-1',
  email: 'teacher@example.com',
  name: 'Teacher',
  tenantId: 'tenant-a',
  branchId: 'branch-a',
  role: 'TEACHER' as const,
}

const foreignResource = { tenantId: 'tenant-b', branchId: 'branch-a' }
const foreignBranch = { tenantId: 'tenant-a', branchId: 'branch-b' }
const sameResource = { tenantId: 'tenant-a', branchId: 'branch-a' }

function expectThrows(label: string, fn: () => void) {
  try {
    fn()
    throw new Error(`FAIL: ${label} did not reject`)
  } catch (error) {
    if (String(error).startsWith('Error: FAIL:')) throw error
    console.log(`PASS: ${label}`)
  }
}

if (JSON.stringify(tenantScopedIdWhere('student-1', 'tenant-a')) !==
    JSON.stringify({ id: 'student-1', tenantId: 'tenant-a' })) {
  throw new Error('FAIL: tenantScopedIdWhere')
}
console.log('PASS: tenantScopedIdWhere')

assertTenantScope(owner, sameResource)
console.log('PASS: same-tenant resource')

expectThrows('cross-tenant resource', () => assertTenantScope(owner, foreignResource))
expectThrows('branch-scoped teacher on foreign branch', () => assertBranchScope(teacher, foreignBranch))
assertBranchScope(owner, foreignBranch.branchId)
console.log('PASS: institution-wide owner branch access')

assertActorResourceScope(teacher, sameResource)
console.log('PASS: actor resource scope')

expectThrows('actor cross-tenant resource', () =>
  assertActorResourceScope(teacher, foreignResource)
)
expectThrows('actor foreign-branch resource', () =>
  assertActorResourceScope(teacher, foreignBranch)
)

console.log('R1 resource-scope verification PASSED')

import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession, can } from '@/lib/auth'
import { GET as effectiveGet } from '@/app/api/v1/roles/effective/route'
import {
  GET as branchAssignmentsGet,
  POST as branchAssignmentsPost,
} from '@/app/api/v1/roles/branch-assignments/route'
import { POST as rolesPost, GET as rolesGet } from '@/app/api/v1/roles/route'
import { PATCH as rolePatch, DELETE as roleDelete } from '@/app/api/v1/roles/[id]/route'
import { PATCH as userPatch, GET as userGet } from '@/app/api/v1/users/[id]/route'
import { RbacEngine, CustomRoleService, CAPABILITY_CATALOG } from '@/lib/auth/rbac-engine'
import { requireCanManageUser } from '@/lib/auth-api'

describe('PRE1-RBAC-AUDIT-001: Comprehensive Security Audit & Remediation Suite', () => {
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any

  let ownerUserA: any
  let principalUserA: any
  let coordinatorUserA: any
  let coordinatorMemberA: any
  let teacherUserA: any
  let teacherMemberA: any
  let otherBranchTeacherUserA: any
  let otherBranchTeacherMemberA: any
  let multiBranchStaffUserA: any
  let multiBranchStaffMemberA: any

  let ownerUserB: any
  let customRoleB: any

  let cookieOwnerA: string
  let cookiePrincipalA: string
  let cookieCoordinatorA: string
  let cookieTeacherA: string
  let cookieOwnerB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Create Tenant A with two branches
    tenantA = await db.tenant.create({
      data: {
        name: `RBAC Audit Academy A ${ts}`,
        code: `RBA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'South Campus Alpha',
        code: `SCA-${ts.slice(-4)}`,
        isMain: true,
        isActive: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'North Campus Beta',
        code: `NCB-${ts.slice(-4)}`,
        isMain: false,
        isActive: true,
      },
    })

    // 2. Create Tenant B with one branch
    tenantB = await db.tenant.create({
      data: {
        name: `RBAC Audit Academy B ${ts}`,
        code: `RBB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchB1 = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'Tenant B Central',
        code: `TBC-${ts.slice(-4)}`,
        isMain: true,
        isActive: true,
      },
    })

    // 3. Create Tenant B Owner & Custom Role
    ownerUserB = await db.user.create({
      data: {
        email: `owner_b_${ts}@audit.test`,
        username: `owner_b_${ts}`,
        fullName: 'Owner Tenant B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: ownerUserB.id,
        role: 'OWNER',
        status: 'ACTIVE',
        branchId: branchB1.id,
      },
    })

    cookieOwnerB = await signSession({
      uid: ownerUserB.id,
      email: ownerUserB.email,
      name: ownerUserB.fullName,
      role: 'OWNER',
      tenantId: tenantB.id,
      branchId: branchB1.id,
    })

    customRoleB = await db.customRole.create({
      data: {
        tenantId: tenantB.id,
        name: 'Tenant B Special Ops',
        code: `B_SPEC_${ts.slice(-4)}`,
        capabilities: ['finance:write', 'settings:write'],
        status: 'ACTIVE',
      },
    })

    // 4. Create Tenant A Owner
    ownerUserA = await db.user.create({
      data: {
        email: `owner_a_${ts}@audit.test`,
        username: `owner_a_${ts}`,
        fullName: 'Owner Tenant A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerUserA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerUserA.id,
      email: ownerUserA.email,
      name: ownerUserA.fullName,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // 5. Create Tenant A Principal
    principalUserA = await db.user.create({
      data: {
        email: `principal_a_${ts}@audit.test`,
        username: `principal_a_${ts}`,
        fullName: 'Principal Tenant A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: principalUserA.id,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    })

    cookiePrincipalA = await signSession({
      uid: principalUserA.id,
      email: principalUserA.email,
      name: principalUserA.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantA.id,
    })

    // 6. Create Tenant A Branch 1 Staff/Coordinator (branch-scoped with users:read)
    coordinatorUserA = await db.user.create({
      data: {
        email: `coord_a1_${ts}@audit.test`,
        username: `coord_a1_${ts}`,
        fullName: 'Coordinator Branch A1',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    coordinatorMemberA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: coordinatorUserA.id,
        role: 'STAFF',
        roles: ['STAFF', 'COORDINATOR'],
        status: 'ACTIVE',
        branchId: branchA1.id,
      },
    })

    await db.tenantUserBranch.create({
      data: {
        tenantId: tenantA.id,
        tenantUserId: coordinatorMemberA.id,
        branchId: branchA1.id,
        isPrimary: true,
      },
    })

    cookieCoordinatorA = await signSession({
      uid: coordinatorUserA.id,
      email: coordinatorUserA.email,
      name: coordinatorUserA.fullName,
      role: 'STAFF',
      roles: ['STAFF', 'COORDINATOR'],
      tenantId: tenantA.id,
      branchId: branchA1.id,
    })

    // 7. Create Teacher in Branch A1
    teacherUserA = await db.user.create({
      data: {
        email: `teacher_a1_${ts}@audit.test`,
        username: `teacher_a1_${ts}`,
        fullName: 'Teacher Branch A1',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    teacherMemberA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherUserA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
        branchId: branchA1.id,
      },
    })

    await db.tenantUserBranch.create({
      data: {
        tenantId: tenantA.id,
        tenantUserId: teacherMemberA.id,
        branchId: branchA1.id,
        isPrimary: true,
      },
    })

    cookieTeacherA = await signSession({
      uid: teacherUserA.id,
      email: teacherUserA.email,
      name: teacherUserA.fullName,
      role: 'TEACHER',
      tenantId: tenantA.id,
      branchId: branchA1.id,
    })

    // 8. Create Teacher in Branch A2 (strictly distinct branch)
    otherBranchTeacherUserA = await db.user.create({
      data: {
        email: `teacher_a2_${ts}@audit.test`,
        username: `teacher_a2_${ts}`,
        fullName: 'Teacher Branch A2',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    otherBranchTeacherMemberA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: otherBranchTeacherUserA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
        branchId: branchA2.id,
      },
    })

    await db.tenantUserBranch.create({
      data: {
        tenantId: tenantA.id,
        tenantUserId: otherBranchTeacherMemberA.id,
        branchId: branchA2.id,
        isPrimary: true,
      },
    })

    // 9. Create Multi-Branch Staff Member (Primary: Branch A2, Assigned: Branch A1)
    multiBranchStaffUserA = await db.user.create({
      data: {
        email: `multibranch_${ts}@audit.test`,
        username: `multibranch_${ts}`,
        fullName: 'Multi Campus Specialist',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    multiBranchStaffMemberA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: multiBranchStaffUserA.id,
        role: 'STAFF',
        status: 'ACTIVE',
        branchId: branchA2.id,
      },
    })

    await db.tenantUserBranch.create({
      data: {
        tenantId: tenantA.id,
        tenantUserId: multiBranchStaffMemberA.id,
        branchId: branchA2.id,
        isPrimary: true,
      },
    })

    await db.tenantUserBranch.create({
      data: {
        tenantId: tenantA.id,
        tenantUserId: multiBranchStaffMemberA.id,
        branchId: branchA1.id,
        isPrimary: false,
      },
    })
  })

  // ────────────────────────────────────────────────────────────
  // Scenario A: Effective Permissions & Boundary Enforcement
  // ────────────────────────────────────────────────────────────
  describe('Scenario A: Effective Permissions & Isolation', () => {
    it('resolves combined permissions for multi-role user with no duplicates', async () => {
      const perms = await RbacEngine.resolveEffectivePermissions({
        userId: teacherUserA.id,
        tenantId: tenantA.id,
        roles: ['TEACHER', 'COORDINATOR'],
      })

      // Teacher has academics:write, Coordinator has academics:approve
      expect(perms).toContain('academics:write')
      expect(perms).toContain('academics:approve')
      expect(perms).toContain('students:read')

      // Ensure no duplicates in resolved list
      const unique = new Set(perms)
      expect(unique.size).toBe(perms.length)
    })

    it('rejects cross-tenant custom roles passed in effective permissions preview', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/roles/effective?primaryRole=TEACHER&customRoleIds=${customRoleB.id}`,
        {
          method: 'GET',
          headers: {
            cookie: `preone_session=${cookieOwnerA}`,
          },
        }
      )

      const res = await effectiveGet(req)
      expect(res.status).toBe(200)
      const body = await res.json()

      // The custom role from Tenant B must not be included or granted
      expect(body.data.evaluatedCustomRoles.length).toBe(0)
      expect(body.data.effectivePermissions).not.toContain('settings:write')
    })

    it('wildcard * does not grant platform-scoped capabilities', () => {
      expect(can('OWNER', 'students:read')).toBe(true)
      expect(can('OWNER', 'finance:write')).toBe(true)
      expect(can('OWNER', 'platform:manage')).toBe(false)
      expect(can(['OWNER', 'PRINCIPAL'], 'platform:infrastructure')).toBe(false)
    })
  })

  // ────────────────────────────────────────────────────────────
  // Scenario B: Privilege Escalation Prevention
  // ────────────────────────────────────────────────────────────
  describe('Scenario B: Privilege Escalation Prevention', () => {
    it('rejects assigning PLATFORM_ADMIN role by school actors', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${teacherUserA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            role: 'PLATFORM_ADMIN',
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: teacherUserA.id }) })
      expect(res.status).toBe(403)
      const err = await res.json()
      const msg = err.error?.message || err.error || ''
      expect(msg).toContain('Cannot assign PLATFORM_ADMIN role')
    })

    it('rejects assigning OWNER role by non-owner actors', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${teacherUserA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookiePrincipalA}`,
          },
          body: JSON.stringify({
            role: 'OWNER',
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: teacherUserA.id }) })
      expect(res.status).toBe(403)
      const err = await res.json()
      const msg = err.error?.message || err.error || ''
      expect(msg).toContain('Only owners can assign OWNER role')
    })

    it('prevents self-escalation (non-owner actor cannot modify their own roles)', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${principalUserA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookiePrincipalA}`,
          },
          body: JSON.stringify({
            role: 'OWNER',
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: principalUserA.id }) })
      expect(res.status).toBe(403)
    })

    it('rejects cross-tenant parent role inheritance in CustomRoleService.updateRole', async () => {
      // Create a custom role in Tenant A
      const roleA = await db.customRole.create({
        data: {
          tenantId: tenantA.id,
          name: 'Tenant A Role',
          code: `A_ROLE_${ts.slice(-4)}`,
          capabilities: ['students:read'],
          status: 'ACTIVE',
        },
      })

      // Attempt to update roleA to inherit from Tenant B's custom role
      const req = new NextRequest(
        `http://localhost:3000/api/v1/roles/${roleA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            parentRoleId: customRoleB.id,
          }),
        }
      )

      const res = await rolePatch(req, { params: Promise.resolve({ id: roleA.id }) })
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ────────────────────────────────────────────────────────────
  // Scenario C: Branch Assignments & Boundary Enforcement
  // ────────────────────────────────────────────────────────────
  describe('Scenario C: Branch Assignments & Scoping', () => {
    it('SEC-RBAC-01: branch filtering remains strictly enforced when staffId is supplied', async () => {
      // Coordinator in Branch A1 attempts to query Teacher in Branch A2 by specifying staffId
      const req = new NextRequest(
        `http://localhost:3000/api/v1/roles/branch-assignments?staffId=${otherBranchTeacherUserA.id}`,
        {
          method: 'GET',
          headers: {
            cookie: `preone_session=${cookieCoordinatorA}`,
          },
        }
      )

      const res = await branchAssignmentsGet(req)
      expect(res.status).toBe(200)
      const body = await res.json()

      // Should return 0 assignments because the target staff is exclusively in Branch A2
      expect(body.data.assignments.length).toBe(0)
    })

    it('SEC-RBAC-02: REMOVE_BRANCH on primary branch fails closed and does not mutate DB', async () => {
      const initialTeacher = await db.tenantUser.findUnique({
        where: { id: teacherMemberA.id },
      })
      expect(initialTeacher?.branchId).toBe(branchA1.id)

      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            action: 'REMOVE_BRANCH',
            userId: teacherUserA.id,
            targetBranchId: branchA1.id,
          }),
        }
      )

      const res = await branchAssignmentsPost(req)
      expect(res.status).toBe(400)
      const err = await res.json()
      const code = err.error?.code || err.code
      expect(code).toBe('CANNOT_REMOVE_PRIMARY_BRANCH')

      // Verify DB was NOT mutated
      const recheck = await db.tenantUser.findUnique({
        where: { id: teacherMemberA.id },
      })
      expect(recheck?.branchId).toBe(branchA1.id)
    })

    it('SEC-RBAC-05: requireCanManageUser correctly evaluates multi-branch target staff', async () => {
      // Coordinator in Branch A1 can manage multi-branch staff assigned to Branch A1
      const manageOk = await requireCanManageUser(
        {
          uid: coordinatorUserA.id,
          email: coordinatorUserA.email,
          name: coordinatorUserA.fullName,
          role: 'STAFF',
          roles: ['STAFF', 'COORDINATOR'],
          tenantId: tenantA.id,
          branchId: branchA1.id,
        },
        multiBranchStaffUserA.id
      )
      expect((manageOk as any).targetMember).toBeDefined()

      // Coordinator in Branch A1 CANNOT manage staff assigned exclusively to Branch A2
      const manageBlocked = await requireCanManageUser(
        {
          uid: coordinatorUserA.id,
          email: coordinatorUserA.email,
          name: coordinatorUserA.fullName,
          role: 'STAFF',
          roles: ['STAFF', 'COORDINATOR'],
          tenantId: tenantA.id,
          branchId: branchA1.id,
        },
        otherBranchTeacherUserA.id
      )
      expect((manageBlocked as Response).status).toBe(403)
    })
  })

  // ────────────────────────────────────────────────────────────
  // Scenario D: Immediate Cache Invalidation & Revocation
  // ────────────────────────────────────────────────────────────
  describe('Scenario D: Cache Invalidation & Role Revocation', () => {
    it('SEC-RBAC-04: immediately invalidates permission cache upon role update', async () => {
      // 1. Create a staff member with initial TEACHER role
      const staffUser = await db.user.create({
        data: {
          email: `cache_test_${ts}@audit.test`,
          username: `cache_test_${ts}`,
          fullName: 'Cache Test Staff',
          status: 'ACTIVE',
          passwordHash: '$2b$10$hashedtestpasswordstringhere',
        },
      })

      const staffMember = await db.tenantUser.create({
        data: {
          tenantId: tenantA.id,
          userId: staffUser.id,
          role: 'TEACHER',
          status: 'ACTIVE',
          branchId: branchA1.id,
        },
      })

      // 2. Resolve initial permissions -> populates cache
      const initialPerms = await RbacEngine.resolveEffectivePermissions({
        userId: staffUser.id,
        tenantId: tenantA.id,
        roles: ['TEACHER'],
      })
      expect(initialPerms).not.toContain('finance:write')

      // 3. Assign ACCOUNTS role via user PATCH
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${staffUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            primaryRole: 'TEACHER',
            roles: ['TEACHER', 'ACCOUNTS'],
          }),
        }
      )

      const patchRes = await userPatch(req, { params: Promise.resolve({ id: staffUser.id }) })
      expect(patchRes.status).toBe(200)

      // 4. Resolve permissions immediately without sleeping -> must reflect updated ACCOUNTS permissions immediately
      const updatedPerms = await RbacEngine.resolveEffectivePermissions({
        userId: staffUser.id,
        tenantId: tenantA.id,
        roles: ['TEACHER', 'ACCOUNTS'],
      })

      expect(updatedPerms).toContain('finance:write')
    })
  })
})

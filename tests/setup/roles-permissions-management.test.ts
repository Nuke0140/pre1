import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as effectiveGet } from '@/app/api/v1/roles/effective/route'
import { GET as branchAssignmentsGet, POST as branchAssignmentsPost } from '@/app/api/v1/roles/branch-assignments/route'
import { PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { RbacEngine, CustomRoleService, CAPABILITY_CATALOG } from '@/lib/auth/rbac-engine'

describe('PRE1-HR-ROLES-001: Complete Roles, Permissions & Branch Transfer Management', () => {
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any
  let ownerUserA: any
  let teacherUserA: any
  let teacherMemberA: any
  let cookieOwnerA: string
  let cookieTeacherA: string
  let cookieOwnerB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A with 2 branches
    tenantA = await db.tenant.create({
      data: {
        name: `Roles Test Academy A ${ts}`,
        code: `RTA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Campus Alpha',
        code: `MCA-${ts.slice(-4)}`,
        isMain: true,
        isActive: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'City North Campus',
        code: `CNC-${ts.slice(-4)}`,
        isMain: false,
        isActive: true,
      },
    })

    // 2. Setup Tenant B with 1 branch for isolation testing
    tenantB = await db.tenant.create({
      data: {
        name: `Roles Test Academy B ${ts}`,
        code: `RTB-${ts.slice(-4)}`,
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

    // 3. Setup Owner A
    ownerUserA = await db.user.create({
      data: {
        email: `owner_${ts}@roles.test`,
        username: `owner_${ts}`,
        fullName: 'Owner Test Academy A',
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
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // 4. Setup Teacher A (staff member)
    teacherUserA = await db.user.create({
      data: {
        email: `teacher_${ts}@roles.test`,
        username: `teacher_${ts}`,
        fullName: 'Teacher Priya Sharma',
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

    await db.staffProfile.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherUserA.id,
        employeeCode: `EMP-T-${ts.slice(-4)}`,
        designation: 'Senior Teacher',
        branchId: branchA1.id,
      },
    })

    // Assign to branchA1 via TenantUserBranch
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
      role: 'TEACHER',
      tenantId: tenantA.id,
      branchId: branchA1.id,
    })

    // 5. Setup Owner B
    const ownerUserB = await db.user.create({
      data: {
        email: `ownerb_${ts}@roles.test`,
        username: `ownerb_${ts}`,
        fullName: 'Owner Academy B',
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
      },
    })

    cookieOwnerB = await signSession({
      uid: ownerUserB.id,
      email: ownerUserB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })
  })

  // ────────────────────────────────────────────────────────────
  // 1. Authoritative Effective Permissions Preview API
  // ────────────────────────────────────────────────────────────
  describe('1. Authoritative Effective Permissions Preview API (/api/v1/roles/effective)', () => {
    it('returns authoritative effective capabilities breakdown for a user', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/roles/effective?userId=${teacherUserA.id}`,
        {
          headers: { cookie: `preone_session=${cookieOwnerA}` },
        }
      )

      const res = await effectiveGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.userId).toBe(teacherUserA.id)
      expect(json.data.evaluatedRoles.primary).toBe('TEACHER')
      expect(json.data.isFullAccess).toBe(false)
      expect(json.data.effectivePermissions).toContain('academics:read')
      expect(json.data.effectivePermissions).toContain('attendance:mark')
      expect(json.data.effectivePermissions).not.toContain('finance:write')
    })

    it('simulates multi-role addition and previews augmented capabilities', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/roles/effective?userId=${teacherUserA.id}&primaryRole=TEACHER&roles=ACCOUNTS`,
        {
          headers: { cookie: `preone_session=${cookieOwnerA}` },
        }
      )

      const res = await effectiveGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.evaluatedRoles.combined).toContain('TEACHER')
      expect(json.data.evaluatedRoles.combined).toContain('ACCOUNTS')
      // ACCOUNTS adds finance:write
      expect(json.data.effectivePermissions).toContain('finance:write')
    })
  })

  // ────────────────────────────────────────────────────────────
  // 2. Branch Assignment & Transfer Operations
  // ────────────────────────────────────────────────────────────
  describe('2. Branch Assignment & Transfer Operations (/api/v1/roles/branch-assignments)', () => {
    it('lists staff branch assignments scoped to authorized tenant and branch', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          headers: { cookie: `preone_session=${cookieOwnerA}` },
        }
      )

      const res = await branchAssignmentsGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.assignments.length).toBeGreaterThanOrEqual(1)
      const teacher = json.data.assignments.find((a: any) => a.userId === teacherUserA.id)
      expect(teacher).toBeDefined()
      expect(teacher.primaryBranchId).toBe(branchA1.id)
    })

    it('adds an authorized secondary branch assignment to staff member', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            action: 'ADD_BRANCH',
            userId: teacherUserA.id,
            targetBranchId: branchA2.id,
          }),
        }
      )

      const res = await branchAssignmentsPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.action).toBe('ADD_BRANCH')
      expect(json.data.assignedBranchIds).toContain(branchA2.id)

      // Verify DB junction
      const junctions = await db.tenantUserBranch.findMany({
        where: { tenantUserId: teacherMemberA.id },
      })
      expect(junctions.length).toBe(2)
      expect(junctions.some((j) => j.branchId === branchA2.id)).toBe(true)
    })

    it('executes primary branch transfer with optional retention of source branch', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            action: 'TRANSFER_PRIMARY',
            userId: teacherUserA.id,
            targetBranchId: branchA2.id,
            retainSourceAccess: true,
            reason: 'Promoted to lead teacher at City North Campus',
          }),
        }
      )

      const res = await branchAssignmentsPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.newPrimaryBranchId).toBe(branchA2.id)

      // Verify DB primary branch
      const updatedMember = await db.tenantUser.findUnique({
        where: { id: teacherMemberA.id },
      })
      expect(updatedMember?.branchId).toBe(branchA2.id)
    })

    it('rejects cross-tenant branch assignment (Tenant B branch to Tenant A staff)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            action: 'ADD_BRANCH',
            userId: teacherUserA.id,
            targetBranchId: branchB1.id, // Foreign branch!
          }),
        }
      )

      const res = await branchAssignmentsPost(req)
      // Expect 403 Forbidden or 404 Not Found
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('rejects branch operations performed by unauthorized staff without users:write', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/roles/branch-assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieTeacherA}`,
          },
          body: JSON.stringify({
            action: 'ADD_BRANCH',
            userId: teacherUserA.id,
            targetBranchId: branchA1.id,
          }),
        }
      )

      const res = await branchAssignmentsPost(req)
      expect(res.status).toBe(403)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 3. Multi-Role Assignment & Role Editing
  // ────────────────────────────────────────────────────────────
  describe('3. Multi-Role Assignment & Role Editing via PATCH /api/v1/users/[id]', () => {
    it('assigns secondary roles to staff member while retaining primary role', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${teacherUserA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieOwnerA}`,
          },
          body: JSON.stringify({
            primaryRole: 'TEACHER',
            roles: ['TEACHER', 'COORDINATOR'],
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: teacherUserA.id }) })
      expect(res.status).toBe(200)

      const updated = await db.tenantUser.findUnique({
        where: { id: teacherMemberA.id },
      })
      expect(updated?.role).toBe('TEACHER')
      expect(updated?.roles).toContain('TEACHER')
      expect(updated?.roles).toContain('COORDINATOR')
    })

    it('prevents self-escalation (staff cannot grant themselves OWNER)', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${teacherUserA.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `preone_session=${cookieTeacherA}`,
          },
          body: JSON.stringify({
            role: 'OWNER',
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: teacherUserA.id }) })
      expect(res.status).toBe(403)
    })
  })

  // ────────────────────────────────────────────────────────────
  // 4. Setup Roles Page Source Code & Architecture Verification
  // ────────────────────────────────────────────────────────────
  describe('4. Setup Roles Page (/app/setup/roles) Verification', () => {
    it('verifies setup roles page component exists and defines primary workspace tabs', async () => {
      const pageCode = await Bun.file('src/app/app/setup/roles/page.tsx').text()
      expect(pageCode).toContain('Staff Directory')
      expect(pageCode).toContain('Roles & Templates')
      expect(pageCode).toContain('Module Permissions')
      expect(pageCode).toContain('Branch Assignments')
      expect(pageCode).toContain('Access History')
    })

    it('verifies setup hub links directly to /app/setup/roles', async () => {
      const hubCode = await Bun.file('src/app/app/setup/page.tsx').text()
      expect(hubCode).toContain("s.key === 'roles'")
      expect(hubCode).toContain("'/app/setup/roles'")
    })
  })
})

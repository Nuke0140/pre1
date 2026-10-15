import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { RbacEngine, CustomRoleService, CAPABILITY_CATALOG } from '@/lib/auth/rbac-engine'
import { GET as capabilitiesGet } from '@/app/api/v1/roles/capabilities/route'
import { GET as rolesGet, POST as rolesPost } from '@/app/api/v1/roles/route'
import { GET as roleDetailGet, PATCH as roleDetailPatch, DELETE as roleDetailDelete } from '@/app/api/v1/roles/[id]/route'
import { PATCH as userPatch, GET as userGet } from '@/app/api/v1/users/[id]/route'
import { requireApi } from '@/lib/auth-api'

describe('Custom Dynamic Roles & DB-Driven Capability Sets (Doc 2.1 / ADR-064 / ADR-067)', () => {
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let teacherA: any
  let staffUserA: any
  let staffMemberA: any
  let adminB: any
  let cookieOwnerA: string
  let cookieTeacherA: string
  let cookieStaffUserA: string
  let cookieTenantB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        name: `Dynamic RBAC Academy A ${ts}`,
        code: `RBA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Tenant B (for cross-tenant checks)
    tenantB = await db.tenant.create({
      data: {
        name: `Dynamic RBAC Academy B ${ts}`,
        code: `RBB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 3. Setup Owner A in Tenant A
    ownerA = await db.user.create({
      data: {
        email: `owner_${ts}@rbac.test`,
        username: `owner_${ts}`,
        fullName: 'Owner Academy A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // 4. Setup Teacher A (lacks users:write)
    teacherA = await db.user.create({
      data: {
        email: `teacher_${ts}@rbac.test`,
        username: `teacher_${ts}`,
        fullName: 'Teacher Academy A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    cookieTeacherA = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })

    // 5. Setup Staff User A (base STAFF role: has attendance:read, but lacks finance:write)
    staffUserA = await db.user.create({
      data: {
        email: `staff_${ts}@rbac.test`,
        username: `staff_${ts}`,
        fullName: 'Staff Member A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    staffMemberA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: staffUserA.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })

    cookieStaffUserA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      role: 'STAFF',
      tenantId: tenantA.id,
    })

    // 6. Setup Admin B in Tenant B
    adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@rbac.test`,
        username: `adminB_${ts}`,
        fullName: 'Admin Academy B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: adminB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieTenantB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })
  })

  // =========================================================================
  // Section 1: Capability Catalog & Validation (ADR-063)
  // =========================================================================

  describe('Capability Catalog & Privilege Escalation Guard', () => {
    it('GET /api/v1/roles/capabilities returns all capabilities grouped by functional category', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles/capabilities', {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })
      const res = await capabilitiesGet(req)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.totalCount).toBeGreaterThanOrEqual(30)
      expect(json.data.categories.FINANCE).toBeDefined()
      expect(json.data.categories.STUDENTS).toBeDefined()
      expect(json.data.categories.OPERATIONS).toBeDefined()
    })

    it('rejects custom role creation declaring invalid or fake capabilities (privilege escalation guard)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          name: 'Privilege Escalation Attempt',
          code: 'PRIV_ESC',
          capabilities: ['students:read', 'super_root:destroy_all', 'fake:permission'],
        }),
      })

      const res = await rolesPost(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.code).toBe('INVALID_CAPABILITIES')
    })
  })

  // =========================================================================
  // Section 2: Custom Dynamic Role Lifecycle (ADR-064)
  // =========================================================================

  describe('Custom Role Lifecycle (Create, List, Detail, Update, Hierarchy)', () => {
    let createdRoleId: string
    let childRoleId: string

    it('creates a custom dynamic role with valid capabilities', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          name: 'Bursar & Accounts Head',
          code: `BURSAR_${ts.slice(-4)}`,
          description: 'Custom dynamic role with finance billing authority',
          capabilities: ['finance:read', 'finance:write'],
        }),
      })

      const res = await rolesPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.name).toBe('Bursar & Accounts Head')
      expect(json.data.capabilities).toEqual(['finance:read', 'finance:write'])
      createdRoleId = json.data.id
    })

    it('rejects duplicate role code within the same tenant (409 Conflict)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          name: 'Duplicate Bursar',
          code: `BURSAR_${ts.slice(-4)}`,
          capabilities: ['finance:read'],
        }),
      })

      const res = await rolesPost(req)
      expect(res.status).toBe(409)
    })

    it('allows identical role code in another tenant (multi-tenant code scoping)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieTenantB}`,
        },
        body: JSON.stringify({
          name: 'School B Bursar',
          code: `BURSAR_${ts.slice(-4)}`,
          capabilities: ['finance:read'],
        }),
      })

      const res = await rolesPost(req)
      expect(res.status).toBe(200)
    })

    it('supports single-level inheritance and flattens inherited capabilities', async () => {
      // Create Child Role: Cashier inheriting from Bursar
      const req = new NextRequest('http://localhost:3000/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          name: 'Junior Cashier',
          code: `CASHIER_${ts.slice(-4)}`,
          capabilities: ['inventory:read'],
          parentRoleId: createdRoleId,
        }),
      })

      const res = await rolesPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.parentRoleId).toBe(createdRoleId)
      childRoleId = json.data.id

      // Inspect detail of Junior Cashier: effectiveCapabilities should include parent's finance:read and finance:write
      const detailReq = new NextRequest(`http://localhost:3000/api/v1/roles/${childRoleId}`, {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })
      const detailRes = await roleDetailGet(detailReq, { params: Promise.resolve({ id: childRoleId }) })
      expect(detailRes.status).toBe(200)
      const detailJson = await detailRes.json()

      expect(detailJson.data.capabilities).toEqual(['inventory:read'])
      expect(detailJson.data.inheritedCapabilities).toContain('finance:read')
      expect(detailJson.data.inheritedCapabilities).toContain('finance:write')
      expect(detailJson.data.effectiveCapabilities).toContain('inventory:read')
      expect(detailJson.data.effectiveCapabilities).toContain('finance:read')
      expect(detailJson.data.effectiveCapabilities).toContain('finance:write')
    })

    it('cycle detection: rejects setting parent to self or creating an inheritance cycle', async () => {
      // Attempt to set parent of Bursar to Junior Cashier (cycle: Bursar -> Cashier -> Bursar)
      const req = new NextRequest(`http://localhost:3000/api/v1/roles/${createdRoleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          parentRoleId: childRoleId,
        }),
      })

      const res = await roleDetailPatch(req, { params: Promise.resolve({ id: createdRoleId }) })
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error.message.toLowerCase().includes('cycl')).toBe(true)
    })

    it('cross-tenant protection: prevents Tenant B admin from modifying Tenant A role', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/roles/${createdRoleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieTenantB}`,
        },
        body: JSON.stringify({
          name: 'Hacked Name',
        }),
      })

      const res = await roleDetailPatch(req, { params: Promise.resolve({ id: createdRoleId }) })
      expect(res.status).toBe(400)
    })
  })

  // =========================================================================
  // Section 3: User Assignment & Effective Permission Resolver (ADR-067)
  // =========================================================================

  describe('Dynamic Role Assignment & Effective Permission Resolver', () => {
    let customFinanceRole: any

    beforeAll(async () => {
      customFinanceRole = await CustomRoleService.createRole({
        tenantId: tenantA.id,
        name: `Dynamic Finance Officer ${ts}`,
        code: `DYN_FIN_${ts.slice(-4)}`,
        capabilities: ['finance:read', 'finance:write'],
        actorSession: {
          uid: ownerA.id,
          email: ownerA.email,
          role: 'OWNER',
          tenantId: tenantA.id,
        } as any,
      })
    })

    it('Staff member initially lacks finance:write permission', async () => {
      // Simulate endpoint requiring finance:write
      const testReq = new NextRequest('http://localhost:3000/api/v1/finance/invoices', {
        headers: { cookie: `preone_session=${cookieStaffUserA}` },
      })

      const check = await requireApi(testReq, 'finance:write')
      expect(check instanceof Response).toBe(true)
      expect((check as Response).status).toBe(403)
    })

    it('assigns custom dynamic role to staff member via PATCH /api/v1/users/[id]', async () => {
      const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${staffUserA.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          customRoleIds: [customFinanceRole.id],
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: staffUserA.id }) })
      expect(patchRes.status).toBe(200)

      // Verify GET /api/v1/users/[id] returns assigned custom roles
      const getReq = new NextRequest(`http://localhost:3000/api/v1/users/${staffUserA.id}`, {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })
      const getRes = await userGet(getReq, { params: Promise.resolve({ id: staffUserA.id }) })
      expect(getRes.status).toBe(200)
      const getJson = await getRes.json()

      expect(getJson.data.customRoleIds).toContain(customFinanceRole.id)
      expect(getJson.data.customRoles[0].name).toBe(customFinanceRole.name)
    })

    it('Effective Permission Resolver dynamically grants finance:write access to staff member', async () => {
      // Staff member calls endpoint requiring finance:write again
      const testReq = new NextRequest('http://localhost:3000/api/v1/finance/invoices', {
        headers: { cookie: `preone_session=${cookieStaffUserA}` },
      })

      const check = await requireApi(testReq, 'finance:write')
      // Should now succeed and return session payload (not an error Response)
      expect(check instanceof Response).toBe(false)
      expect((check as any).uid).toBe(staffUserA.id)
    })

    it('immediately reflects role revocation and cache invalidation (ADR-069)', async () => {
      // Remove custom role assignment
      await CustomRoleService.syncUserCustomRoles({
        tenantUserId: staffMemberA.id,
        tenantId: tenantA.id,
        customRoleIds: [],
        assignedById: ownerA.id,
      })

      // Next request must fail immediately without stale permission caching
      const testReq = new NextRequest('http://localhost:3000/api/v1/finance/invoices', {
        headers: { cookie: `preone_session=${cookieStaffUserA}` },
      })

      const check = await requireApi(testReq, 'finance:write')
      expect(check instanceof Response).toBe(true)
      expect((check as Response).status).toBe(403)
    })
  })

  // =========================================================================
  // Section 4: Role Deletion Safeguards (ADR-064)
  // =========================================================================

  describe('Role Deletion Safeguards', () => {
    let roleWithUser: any

    beforeAll(async () => {
      roleWithUser = await CustomRoleService.createRole({
        tenantId: tenantA.id,
        name: `Delete Guard Role ${ts}`,
        code: `DEL_GUARD_${ts.slice(-4)}`,
        capabilities: ['reports:read'],
        actorSession: {
          uid: ownerA.id,
          email: ownerA.email,
          role: 'OWNER',
          tenantId: tenantA.id,
        } as any,
      })

      await CustomRoleService.syncUserCustomRoles({
        tenantUserId: staffMemberA.id,
        tenantId: tenantA.id,
        customRoleIds: [roleWithUser.id],
        assignedById: ownerA.id,
      })
    })

    it('rejects deletion of a custom role that currently has assigned users without force flag', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/roles/${roleWithUser.id}`, {
        method: 'DELETE',
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })

      const res = await roleDetailDelete(req, { params: Promise.resolve({ id: roleWithUser.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.code).toBe('ROLE_HAS_ASSIGNED_USERS')
    })

    it('allows forced deletion, cleans up user assignments, and archives role', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/roles/${roleWithUser.id}?force=true`, {
        method: 'DELETE',
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })

      const res = await roleDetailDelete(req, { params: Promise.resolve({ id: roleWithUser.id }) })
      expect(res.status).toBe(200)

      // Verify in DB that role is ARCHIVED and assignments deleted
      const dbRole = await db.customRole.findUnique({ where: { id: roleWithUser.id } })
      expect(dbRole!.status).toBe('ARCHIVED')
      expect(dbRole!.deletedAt).not.toBeNull()

      const assignments = await db.tenantUserCustomRole.findMany({
        where: { customRoleId: roleWithUser.id },
      })
      expect(assignments.length).toBe(0)
    })
  })
})

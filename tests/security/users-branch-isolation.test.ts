import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as usersGet, POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch, DELETE as userDelete } from '@/app/api/v1/users/[id]/route'
import { GET as guardiansGet } from '@/app/api/v1/users/guardians/route'
import { GET as familyGroupsGet } from '@/app/api/v1/users/family-groups/route'
import { POST as exportPost } from '@/app/api/v1/users/export/route'
import { POST as bulkPost } from '@/app/api/v1/users/bulk/route'
import { GET as branchesGet } from '@/app/api/v1/branches/route'
import { POST as familyLinkPost } from '@/app/api/v1/users/[id]/family/route'
import { UserCsvEngine } from '@/lib/users/csv-engine'
import { UserIdentityService } from '@/lib/users/user-identity-service'

describe('PreOne Users Module: Complete Branch-Wise Data Isolation (Doc 2.2 / RBAC)', () => {
  let tenant1: any
  let tenant2: any
  let branchA: any
  let branchB: any
  let branchC: any

  let ownerUser: any
  let ownerCookie: string

  let branchAAdmin: any
  let branchAAdminCookie: string
  let branchATeacher: any

  let branchBStaff: any
  let branchBStaffCookie: string

  let multiBranchStaff: any
  let multiBranchStaffCookie: string

  let parentAUser: any
  let parentACookie: string

  let studentA: any
  let studentB: any
  let studentC: any

  let nonLoginGuardianB: any

  const ts = `${Date.now()}`

  beforeAll(async () => {
    // 1. Create Tenant 1 with Branch A and Branch B
    tenant1 = await db.tenant.create({
      data: {
        name: `Isolation School 1 ${ts.slice(-4)}`,
        code: `IS1-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenant1.id,
        name: 'Campus Alpha',
        code: `ALPHA-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant1.id,
        name: 'Campus Beta',
        code: `BETA-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    // 2. Create Tenant 2 with Branch C (cross-tenant verification)
    tenant2 = await db.tenant.create({
      data: {
        name: `Foreign School 2 ${ts.slice(-4)}`,
        code: `FS2-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchC = await db.branch.create({
      data: {
        tenantId: tenant2.id,
        name: 'Foreign Campus',
        code: `FRGN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 3. Create Owner in Tenant 1
    ownerUser = await db.user.create({
      data: {
        email: `owner.${ts}@sunshine.demo`,
        fullName: 'Chief School Owner',
        username: `owner.${ts}`,
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: ownerUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    ownerCookie = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant1.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    // 4. Create Branch A Admin / Principal (branch-scoped)
    branchAAdmin = await db.user.create({
      data: {
        email: `admin.a.${ts}@sunshine.demo`,
        fullName: 'Campus A Administrator',
        username: `admin.a.${ts}`,
        passwordHash: 'dummy-hash',
      },
    })
    const tuAdminA = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: branchAAdmin.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant1.id,
        tenantUserId: tuAdminA.id,
        branchId: branchA.id,
        isPrimary: true,
      },
    })
    branchAAdminCookie = await signSession({
      uid: branchAAdmin.id,
      email: branchAAdmin.email,
      name: branchAAdmin.fullName,
      tenantId: tenant1.id,
      branchId: branchA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    // 4b. Create Branch A Teacher
    branchATeacher = await db.user.create({
      data: {
        email: `teacher.a.${ts}@sunshine.demo`,
        fullName: 'Campus A Teacher',
        username: `teacher.a.${ts}`,
        passwordHash: 'dummy-hash',
      },
    })
    const tuTeacherA = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: branchATeacher.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant1.id,
        tenantUserId: tuTeacherA.id,
        branchId: branchA.id,
        isPrimary: true,
      },
    })

    // 5. Create Branch B Staff
    branchBStaff = await db.user.create({
      data: {
        email: `staff.b.${ts}@sunshine.demo`,
        fullName: 'Campus B Teacher',
        username: `teacher.b.${ts}`,
        passwordHash: 'dummy-hash',
      },
    })
    const tuStaffB = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: branchBStaff.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branchB.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant1.id,
        tenantUserId: tuStaffB.id,
        branchId: branchB.id,
        isPrimary: true,
      },
    })
    branchBStaffCookie = await signSession({
      uid: branchBStaff.id,
      email: branchBStaff.email,
      name: branchBStaff.fullName,
      tenantId: tenant1.id,
      branchId: branchB.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // 6. Create Multi-Branch Staff (Authorized for Branch A AND Branch B)
    multiBranchStaff = await db.user.create({
      data: {
        email: `multistaff.${ts}@sunshine.demo`,
        fullName: 'Multi Campus Specialist',
        username: `multistaff.${ts}`,
        passwordHash: 'dummy-hash',
      },
    })
    const tuMulti = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: multiBranchStaff.id,
        role: 'STAFF',
        roles: ['STAFF'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.createMany({
      data: [
        {
          tenantId: tenant1.id,
          tenantUserId: tuMulti.id,
          branchId: branchA.id,
          isPrimary: true,
        },
        {
          tenantId: tenant1.id,
          tenantUserId: tuMulti.id,
          branchId: branchB.id,
          isPrimary: false,
        },
      ],
    })
    multiBranchStaffCookie = await signSession({
      uid: multiBranchStaff.id,
      email: multiBranchStaff.email,
      name: multiBranchStaff.fullName,
      tenantId: tenant1.id,
      branchId: branchA.id,
      role: 'STAFF',
      roles: ['STAFF'],
    })

    // 7. Create Students
    studentA = await db.student.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        admissionNo: `ADM-A-${ts.slice(-4)}`,
        firstName: 'Aarav',
        lastName: 'CampusA',
        dob: new Date('2020-01-15'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    studentB = await db.student.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        admissionNo: `ADM-B-${ts.slice(-4)}`,
        firstName: 'Diya',
        lastName: 'CampusB',
        dob: new Date('2020-05-20'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    studentC = await db.student.create({
      data: {
        tenantId: tenant2.id,
        branchId: branchC.id,
        admissionNo: `ADM-C-${ts.slice(-4)}`,
        firstName: 'Foreign',
        lastName: 'Child',
        dob: new Date('2020-03-10'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // 8. Create Parent A in Branch A
    parentAUser = await db.user.create({
      data: {
        email: `parent.a.${ts}@sunshine.demo`,
        fullName: 'Priya Sharma (Parent A)',
        phone: `98000${ts.slice(-5)}`,
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: parentAUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    const guardianA = await db.guardian.create({
      data: {
        tenantId: tenant1.id,
        userId: parentAUser.id,
        fullName: parentAUser.fullName,
        phone: parentAUser.phone!,
        email: parentAUser.email,
        relationship: 'MOTHER',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA.id,
        guardianId: guardianA.id,
        relationship: 'MOTHER',
        canPickup: true,
      },
    })
    parentACookie = await signSession({
      uid: parentAUser.id,
      email: parentAUser.email,
      name: parentAUser.fullName,
      tenantId: tenant1.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })

    // 9. Create Non-Login Guardian in Branch B
    nonLoginGuardianB = await db.guardian.create({
      data: {
        tenantId: tenant1.id,
        fullName: 'Vikram Escort (Guardian B)',
        phone: `97000${ts.slice(-5)}`,
        email: `vikram.b.${ts}@sunshine.demo`,
        relationship: 'GUARDIAN',
        pickupPin: '5432',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentB.id,
        guardianId: nonLoginGuardianB.id,
        relationship: 'GUARDIAN',
        canPickup: true,
        pickupPin: '5432',
      },
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Owner can access records from all branches within tenant
  // ─────────────────────────────────────────────────────────────
  it('1. Owner can access records from all branches within their tenant', async () => {
    const req = new NextRequest('http://localhost/api/v1/users', {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const data = await res.json()

    // Owner sees staff from Branch A and Branch B
    const users = data.data || data.users || []
    const userIds = users.map((u: any) => u.userId)
    expect(userIds).toContain(branchAAdmin.id)
    expect(userIds).toContain(branchBStaff.id)
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Owner cannot access another tenant records
  // ─────────────────────────────────────────────────────────────
  it('2. Owner cannot access another tenant records', async () => {
    // Attempting to manage or fetch studentC/user from Tenant 2
    const req = new NextRequest(`http://localhost/api/v1/users/${studentC.id}`, {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: studentC.id }) })
    // Not found in this tenant
    expect([403, 404]).toContain(res.status)
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Branch A Admin cannot access Branch B records without explicit permission
  // ─────────────────────────────────────────────────────────────
  it('3. Branch A Admin cannot access Branch B records without explicit permission', async () => {
    const req = new NextRequest(`http://localhost/api/v1/users/${branchBStaff.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: branchBStaff.id }) })
    expect(res.status).toBe(403)
    const err = await res.json()
    const errMsg = err.error?.message || err.message || JSON.stringify(err)
    expect(errMsg).toContain('another campus branch')
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Staff cannot retrieve another branch records through direct API
  // ─────────────────────────────────────────────────────────────
  it('4. Staff cannot retrieve another branch records through direct API requests', async () => {
    const req = new NextRequest(`http://localhost/api/v1/users/${branchAAdmin.id}`, {
      headers: { cookie: `preone_session=${branchBStaffCookie}` },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: branchAAdmin.id }) })
    expect(res.status).toBe(403)
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Parent cannot access unrelated children or family profiles
  // ─────────────────────────────────────────────────────────────
  it('5. Parent cannot access unrelated children or family profiles', async () => {
    // Parent A tries to fetch family profile of Branch B staff or student B
    const req = new NextRequest(`http://localhost/api/v1/users/${branchBStaff.id}`, {
      headers: { cookie: `preone_session=${parentACookie}` },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: branchBStaff.id }) })
    expect(res.status).toBe(403)
  })

  // ─────────────────────────────────────────────────────────────
  // 6. Guardian cannot access unrelated children or family profiles
  // ─────────────────────────────────────────────────────────────
  it('6. Guardian cannot access unrelated children or family profiles', async () => {
    // Non-login guardian has no session, but create a login Guardian C to test
    const guardianUser = await db.user.create({
      data: {
        email: `guardian.escort.${ts}@sunshine.demo`,
        fullName: 'Escort Login User',
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: guardianUser.id,
        role: 'GUARDIAN',
        roles: ['GUARDIAN'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    const guardianCookie = await signSession({
      uid: guardianUser.id,
      email: guardianUser.email,
      name: guardianUser.fullName,
      tenantId: tenant1.id,
      role: 'GUARDIAN',
      roles: ['GUARDIAN'],
    })

    const req = new NextRequest(`http://localhost/api/v1/users/${parentAUser.id}`, {
      headers: { cookie: `preone_session=${guardianCookie}` },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: parentAUser.id }) })
    expect(res.status).toBe(403)
  })

  // ─────────────────────────────────────────────────────────────
  // 7. Parent/Guardian linking cannot attach unauthorized students
  // ─────────────────────────────────────────────────────────────
  it('7. Parent/Guardian linking cannot attach unauthorized students', async () => {
    // Branch A Admin tries to link studentB (Campus Beta) to Parent A
    const req = new NextRequest(`http://localhost/api/v1/users/${parentAUser.id}/family`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        studentId: studentB.id,
        relationship: 'MOTHER',
      }),
    })
    const res = await familyLinkPost(req, { params: Promise.resolve({ id: parentAUser.id }) })
    expect([400, 403]).toContain(res.status)
  })

  // ─────────────────────────────────────────────────────────────
  // 8. Non-Owner cannot create or reassign accounts into unauthorized branches
  // ─────────────────────────────────────────────────────────────
  it('8. Non-Owner cannot create or reassign accounts into unauthorized branches', async () => {
    // A: Branch A Admin attempts to create a staff member in Branch B
    const createReq = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        fullName: 'Malicious Beta Staff',
        email: `unauth.b.${ts}@sunshine.demo`,
        role: 'TEACHER',
        branchId: branchB.id,
        password: 'Password@123',
      }),
    })
    const createRes = await usersPost(createReq)
    expect([400, 403]).toContain(createRes.status)

    // B: Branch A Admin attempts to reassign multiBranchStaff primary branch to Branch B
    const patchReq = new NextRequest(`http://localhost/api/v1/users/${multiBranchStaff.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        branchId: branchB.id,
      }),
    })
    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: multiBranchStaff.id }) })
    expect([400, 403]).toContain(patchRes.status)
  })

  // ─────────────────────────────────────────────────────────────
  // 9. CSV imports cannot bypass branch authorization
  // ─────────────────────────────────────────────────────────────
  it('9. CSV imports cannot bypass branch authorization', async () => {
    const csvContent = `Full Name,Email,Role,Branch Code\nForeign Staff,foreign.staff.${ts}@test.com,TEACHER,${branchB.code}`

    // Preview for Branch A Admin should flag error for Branch B
    const preview = await UserCsvEngine.previewStaffCsv(tenant1.id, csvContent, {
      actorRole: 'PRINCIPAL',
      actorBranchId: branchA.id,
      authorizedBranchIds: [branchA.id],
    })

    expect(preview.blockedRows).toBeGreaterThanOrEqual(1)
    const row = preview.rows[0]
    expect(row.errors.some((e: string) => e.includes('outside your authorized campus'))).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────
  // 10. Exports cannot leak cross-branch records
  // ─────────────────────────────────────────────────────────────
  it('10. Exports cannot leak cross-branch records', async () => {
    // A: Branch A Admin export without filter only returns Branch A records
    const req = new NextRequest('http://localhost/api/v1/users/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        userType: 'STAFF',
      }),
    })
    const res = await exportPost(req)
    expect(res.status).toBe(200)
    const csv = await res.text()
    expect(csv).toContain(branchAAdmin.email)
    expect(csv).not.toContain(branchBStaff.email)

    // B: Branch A Admin explicitly requesting branchB export is rejected
    const reqRestricted = new NextRequest('http://localhost/api/v1/users/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        branchId: branchB.id,
      }),
    })
    const resRestricted = await exportPost(reqRestricted)
    expect([400, 403]).toContain(resRestricted.status)
  })

  // ─────────────────────────────────────────────────────────────
  // 11. Bulk updates reject unauthorized target records
  // ─────────────────────────────────────────────────────────────
  it('11. Bulk updates reject unauthorized target records', async () => {
    const req = new NextRequest('http://localhost/api/v1/users/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${branchAAdminCookie}`,
      },
      body: JSON.stringify({
        action: 'DEACTIVATE',
        userIds: [branchATeacher.id, branchBStaff.id],
      }),
    })
    const res = await bulkPost(req)
    expect(res.status).toBe(200)
    const raw = await res.json()
    const data = raw.data || raw
    expect(data.blocked).toBeDefined()
    const bBlocked = data.blocked.find((b: any) => b.userId === branchBStaff.id)
    expect(bBlocked).toBeDefined()
    expect(bBlocked.reason).toBe('CROSS_BRANCH_FORBIDDEN')
  })

  // ─────────────────────────────────────────────────────────────
  // 12. Search, filters, pagination, counts, and details are properly scoped
  // ─────────────────────────────────────────────────────────────
  it('12. Search, filters, pagination, counts, and details are properly scoped', async () => {
    // Querying with an unauthorized branch filter returns 403
    const req = new NextRequest(`http://localhost/api/v1/users?branchId=${branchB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    try {
      const res = await usersGet(req)
      expect(res.status).toBe(403)
    } catch (err: any) {
      expect(err.message || err.toString()).toContain('branch scope restricted')
    }

    // Default query without filter only returns authorized branch records
    const reqUnscoped = new NextRequest('http://localhost/api/v1/users', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const resUnscoped = await usersGet(reqUnscoped)
    expect(resUnscoped.status).toBe(200)
    const raw = await resUnscoped.json()
    const users = raw.data || raw.users || []
    const emails = users.map((u: any) => u.email)
    expect(emails).toContain(branchAAdmin.email)
    expect(emails).not.toContain(branchBStaff.email)
  })

  // ─────────────────────────────────────────────────────────────
  // 13. Non-login Guardians remain supported without weakening authorization
  // ─────────────────────────────────────────────────────────────
  it('13. Non-login Guardians remain supported without weakening authorization', async () => {
    // Owner sees non-login guardian B
    const ownerReq = new NextRequest('http://localhost/api/v1/users/guardians', {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const ownerRes = await guardiansGet(ownerReq)
    expect(ownerRes.status).toBe(200)
    const ownerGuardians = (await ownerRes.json()).data || []
    expect(ownerGuardians.some((g: any) => g.id === nonLoginGuardianB.id)).toBe(true)

    // Branch A Admin does NOT see non-login guardian B (who only has children in Branch B)
    const adminAReq = new NextRequest('http://localhost/api/v1/users/guardians', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const adminARes = await guardiansGet(adminAReq)
    expect(adminARes.status).toBe(200)
    const adminAGuardians = (await adminARes.json()).data || []
    expect(adminAGuardians.some((g: any) => g.id === nonLoginGuardianB.id)).toBe(false)
  })

  // ─────────────────────────────────────────────────────────────
  // 14. Existing valid multi-branch permissions continue to work
  // ─────────────────────────────────────────────────────────────
  it('14. Existing valid multi-branch permissions continue to work', async () => {
    // Multi-branch staff has access to Branch A and Branch B
    const req = new NextRequest('http://localhost/api/v1/users', {
      headers: { cookie: `preone_session=${multiBranchStaffCookie}` },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const raw = await res.json()
    const users = raw.data || raw.users || []
    const emails = users.map((u: any) => u.email)
    expect(emails).toContain(branchAAdmin.email)
    expect(emails).toContain(branchBStaff.email)
  })

  // ─────────────────────────────────────────────────────────────
  // 15. UI / Branch selection returns only authorized branches
  // ─────────────────────────────────────────────────────────────
  it('15. UI / Branch selection returns only authorized branches', async () => {
    // Owner gets all branches in tenant
    const ownerReq = new NextRequest('http://localhost/api/v1/branches', {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const ownerRes = await branchesGet(ownerReq)
    expect(ownerRes.status).toBe(200)
    const ownerBranches = (await ownerRes.json()).data || []
    const ownerBIds = ownerBranches.map((b: any) => b.id)
    expect(ownerBIds).toContain(branchA.id)
    expect(ownerBIds).toContain(branchB.id)

    // Branch A Admin only gets Branch A
    const adminAReq = new NextRequest('http://localhost/api/v1/branches', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const adminARes = await branchesGet(adminAReq)
    expect(adminARes.status).toBe(200)
    const adminABranches = (await adminARes.json()).data || []
    const adminABIds = adminABranches.map((b: any) => b.id)
    expect(adminABIds).toContain(branchA.id)
    expect(adminABIds).not.toContain(branchB.id)

    // Parent A only gets Branch A (where their child Aarav is enrolled)
    const parentReq = new NextRequest('http://localhost/api/v1/branches', {
      headers: { cookie: `preone_session=${parentACookie}` },
    })
    const parentRes = await branchesGet(parentReq)
    expect(parentRes.status).toBe(200)
    const parentBranches = (await parentRes.json()).data || []
    const parentBIds = parentBranches.map((b: any) => b.id)
    expect(parentBIds).toContain(branchA.id)
    expect(parentBIds).not.toContain(branchB.id)
  })
})

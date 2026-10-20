import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { GET as usersGet, POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch, DELETE as userDelete } from '@/app/api/v1/users/[id]/route'
import { GET as userFamilyGet, POST as userFamilyPost } from '@/app/api/v1/users/[id]/family/route'
import { GET as userPinGet, POST as userPinPost } from '@/app/api/v1/users/[id]/pickup-pin/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { getBulkEditableFields } from '@/lib/users/bulk-field-config'

describe('PreOne — Family Directory Stabilization & Non-Login Guardian Tests', () => {
  const ts = Date.now().toString()
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any
  let ownerUserA: any
  let ownerCookieA: string
  let ownerUserB: any
  let ownerCookieB: string
  let branchAdminUserA: any
  let branchAdminCookieA: string

  let studentA1: any
  let studentA2: any
  let nonLoginGuardian: any
  let loginGuardianUser: any
  let loginGuardian: any
  let suspendedGuardianUser: any
  let suspendedGuardian: any

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        code: `FAM-A-${ts.slice(-6)}`,
        name: `Family Academy A ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // Setup Tenant B (for cross-tenant checks)
    tenantB = await db.tenant.create({
      data: {
        code: `FAM-B-${ts.slice(-6)}`,
        name: `Family Academy B ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Campus A1',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'West Campus A2',
        code: `WEST-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    branchB1 = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'Main Campus B',
        code: `BMAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // Owner in Tenant A
    ownerUserA = await db.user.create({
      data: {
        email: `owner.fama.${ts}@preone.test`,
        fullName: 'Owner Tenant A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'OWNER',
          },
        },
      },
    })
    const tokenA = await signSession({
      uid: ownerUserA.id,
      email: ownerUserA.email,
      name: ownerUserA.fullName,
      tenantId: tenantA.id,
      branchId: branchA1.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })
    ownerCookieA = `${SESSION_COOKIE}=${tokenA}`

    // Branch Admin in Tenant A (branchA2 only)
    branchAdminUserA = await db.user.create({
      data: {
        email: `admin.west.${ts}@preone.test`,
        fullName: 'West Campus Coordinator',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA2.id,
            role: 'COORDINATOR',
          },
        },
      },
    })
    const tokenWest = await signSession({
      uid: branchAdminUserA.id,
      email: branchAdminUserA.email,
      name: branchAdminUserA.fullName,
      tenantId: tenantA.id,
      branchId: branchA2.id,
      role: 'COORDINATOR',
      roles: ['COORDINATOR'],
    })
    branchAdminCookieA = `${SESSION_COOKIE}=${tokenWest}`

    // Owner in Tenant B
    ownerUserB = await db.user.create({
      data: {
        email: `owner.famb.${ts}@preone.test`,
        fullName: 'Owner Tenant B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantB.id,
            branchId: branchB1.id,
            role: 'OWNER',
          },
        },
      },
    })
    const tokenB = await signSession({
      uid: ownerUserB.id,
      email: ownerUserB.email,
      name: ownerUserB.fullName,
      tenantId: tenantB.id,
      branchId: branchB1.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })
    ownerCookieB = `${SESSION_COOKIE}=${tokenB}`

    // Seed Students in Tenant A
    studentA1 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-1-${ts.slice(-4)}`,
        firstName: 'ChildOne',
        lastName: 'Verma',
        dob: new Date('2021-03-10'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    studentA2 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-2-${ts.slice(-4)}`,
        firstName: 'ChildTwo',
        lastName: 'Verma',
        dob: new Date('2022-05-15'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // Seed Non-Login Guardian in Tenant A (NO User, NO TenantUser account)
    nonLoginGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Uncle Ramesh Verma',
        relationship: 'OTHER',
        phone: `9911${ts.slice(-6)}`,
        email: `ramesh.escort.${ts}@preone.test`,
        pickupPin: '5432',
        isPrimaryContact: false,
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: nonLoginGuardian.id,
        canPickup: true,
        pickupPin: '5432',
        relationship: 'OTHER',
      },
    })

    // Seed Active Login Guardian in Tenant A
    loginGuardianUser = await db.user.create({
      data: {
        email: `guardian.active.${ts}@preone.test`,
        fullName: 'Aunt Sunita Verma',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'GUARDIAN',
            status: 'ACTIVE',
          },
        },
      },
    })
    loginGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: loginGuardianUser.id,
        fullName: loginGuardianUser.fullName,
        relationship: 'GRANDPARENT',
        phone: `9922${ts.slice(-6)}`,
        isPrimaryContact: false,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: loginGuardian.id,
        canPickup: true,
        relationship: 'GRANDPARENT',
      },
    })

    // Seed Suspended Login Guardian in Tenant A
    suspendedGuardianUser = await db.user.create({
      data: {
        email: `guardian.suspended.${ts}@preone.test`,
        fullName: 'Suspended Guardian User',
        status: 'SUSPENDED',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'GUARDIAN',
            status: 'SUSPENDED',
          },
        },
      },
    })
    suspendedGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: suspendedGuardianUser.id,
        fullName: suspendedGuardianUser.fullName,
        relationship: 'OTHER',
        phone: `9933${ts.slice(-6)}`,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: suspendedGuardian.id,
        canPickup: false,
        relationship: 'OTHER',
      },
    })
  })

  afterAll(async () => {
    await db.studentGuardian.deleteMany({ where: { student: { tenantId: { in: [tenantA.id, tenantB.id] } } } }).catch(() => {})
    await db.student.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } }).catch(() => {})
    await db.guardian.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } }).catch(() => {})
    await db.tenantUser.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } }).catch(() => {})
    await db.user.deleteMany({ where: { email: { contains: ts } } }).catch(() => {})
    await db.branch.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } }).catch(() => {})
    await db.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } }).catch(() => {})
  })

  // ─────────────────────────────────────────────────────────────
  // Phase 1: Non-Login Guardian Identity Resolution
  // ─────────────────────────────────────────────────────────────

  it('1. Successfully retrieves user profile for non-login guardian via GET /api/v1/users/[id] (no 404)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}`, {
      headers: { Cookie: ownerCookieA },
    })
    const res = await userGet(req, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe(nonLoginGuardian.id)
    expect(json.data.fullName).toBe('Uncle Ramesh Verma')
    expect(json.data.role).toBe('GUARDIAN')
    expect(json.data.hasPassword).toBe(false)
    expect(json.data.guardianProfile).toBeDefined()
    expect(json.data.guardianProfile.students.length).toBe(1)
    expect(json.data.guardianProfile.students[0].name).toBe('ChildOne Verma')
    expect(json.data.guardianProfile.pickupPin).toBe('••••')
  })

  it('2. Successfully retrieves family household for non-login guardian via GET /api/v1/users/[id]/family', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/family`, {
      headers: { Cookie: ownerCookieA },
    })
    const res = await userFamilyGet(req, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.isFamily).toBe(true)
    expect(json.data.household).toBeDefined()
    expect(json.data.household.students.length).toBeGreaterThanOrEqual(1)
  })

  it('3. Successfully links sibling to non-login guardian via POST /api/v1/users/[id]/family', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/family`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookieA },
      body: JSON.stringify({
        studentAdmissionNo: studentA2.admissionNo,
        relationship: 'OTHER',
        permissions: { canPickup: true },
      }),
    })
    const res = await userFamilyPost(req, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    const linkObj = json.data?.link || json.link
    expect(linkObj.admissionNo).toBe(studentA2.admissionNo)

    // Verify DB link
    const link = await db.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: studentA2.id,
          guardianId: nonLoginGuardian.id,
        },
      },
    })
    expect(link).toBeDefined()
    expect(link?.canPickup).toBe(true)
  })

  it('4. Successfully manages pickup PIN lifecycle for non-login guardian via /api/v1/users/[id]/pickup-pin', async () => {
    // 4a. GET PIN status
    const getReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/pickup-pin`, {
      headers: { Cookie: ownerCookieA },
    })
    const getRes = await userPinGet(getReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(getRes.status).toBe(200)
    const getJson = await getRes.json()
    expect(getJson.success).toBe(true)
    expect(getJson.data.hasGuardianPin).toBe(true)
    expect(getJson.data.guardianPinMasked).toBe('••••')

    // 4b. Reset PIN (custom)
    const resetReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/pickup-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookieA },
      body: JSON.stringify({
        action: 'reset',
        pin: '7890',
        syncToAllStudents: true,
      }),
    })
    const resetRes = await userPinPost(resetReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(resetRes.status).toBe(200)

    // 4c. Regenerate PIN
    const regenReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/pickup-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookieA },
      body: JSON.stringify({
        action: 'regenerate',
        pinLength: 4,
      }),
    })
    const regenRes = await userPinPost(regenReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(regenRes.status).toBe(200)
    const regenJson = await regenRes.json()
    const regenData = regenJson.data || regenJson
    expect(regenData.newPin).toMatch(/^\d{4}$/)

    // 4d. Clear PIN
    const clearReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}/pickup-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookieA },
      body: JSON.stringify({ action: 'clear' }),
    })
    const clearRes = await userPinPost(clearReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(clearRes.status).toBe(200)
  })

  it('5. Successfully updates non-login guardian profile via PATCH /api/v1/users/[id]', async () => {
    const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookieA },
      body: JSON.stringify({
        fullName: 'Uncle Ramesh Verma Updated',
        occupation: 'Senior Logistics Specialist',
      }),
    })
    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(patchRes.status).toBe(200)

    const updated = await db.guardian.findUnique({ where: { id: nonLoginGuardian.id } })
    expect(updated?.fullName).toBe('Uncle Ramesh Verma Updated')
    expect(updated?.occupation).toBe('Senior Logistics Specialist')
  })

  it('6. Blocks cross-tenant access to non-login guardian with 404 (strictly tenant-isolated)', async () => {
    const crossReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonLoginGuardian.id}`, {
      headers: { Cookie: ownerCookieB }, // Session from Tenant B
    })
    const res = await userGet(crossReq, { params: Promise.resolve({ id: nonLoginGuardian.id }) })
    expect(res.status).toBe(404)
  })

  // ─────────────────────────────────────────────────────────────
  // Phase 2: Guardian Status Filtering
  // ─────────────────────────────────────────────────────────────

  it('7. Correctly filters guardians by status=ACTIVE in GET /api/v1/users', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users?role=GUARDIAN&status=ACTIVE', {
      headers: { Cookie: ownerCookieA },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    const items = json.data || []

    // Both active login guardian and non-login escort should be in ACTIVE
    const ids = items.map((u: any) => u.id)
    expect(ids).toContain(loginGuardian.id)
    expect(ids).toContain(nonLoginGuardian.id)
    expect(ids).not.toContain(suspendedGuardian.id)
  })

  it('8. Correctly filters guardians by status=SUSPENDED in GET /api/v1/users', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users?role=GUARDIAN&status=SUSPENDED', {
      headers: { Cookie: ownerCookieA },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    const items = json.data || []

    const ids = items.map((u: any) => u.id)
    expect(ids).toContain(suspendedGuardian.id)
    expect(ids).not.toContain(loginGuardian.id)
    expect(ids).not.toContain(nonLoginGuardian.id)
  })

  it('9. Returns 0 matching records when querying with an invalid/unsupported status filter', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users?role=GUARDIAN&status=INVALID_STATUS_FOO', {
      headers: { Cookie: ownerCookieA },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.length).toBe(0)
    expect(json.meta.total).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────
  // Phase 3: Family Bulk Field Updates Whitelist
  // ─────────────────────────────────────────────────────────────

  it('10. getBulkEditableFields for FAMILY excludes staff-only HR fields', () => {
    const familyFields = getBulkEditableFields('FAMILY')
    const familyKeys = familyFields.map((f) => f.key)

    expect(familyKeys).toContain('fullName')
    expect(familyKeys).toContain('phone')
    expect(familyKeys).toContain('email')
    expect(familyKeys).toContain('status')
    expect(familyKeys).toContain('branchId')

    // Must NOT contain staff-only HR fields
    expect(familyKeys).not.toContain('designation')
    expect(familyKeys).not.toContain('department')
    expect(familyKeys).not.toContain('employmentType')
  })

  it('11. getBulkEditableFields for STAFF retains all staff placement fields', () => {
    const staffFields = getBulkEditableFields('STAFF')
    const staffKeys = staffFields.map((f) => f.key)

    expect(staffKeys).toContain('designation')
    expect(staffKeys).toContain('department')
    expect(staffKeys).toContain('employmentType')
  })
})

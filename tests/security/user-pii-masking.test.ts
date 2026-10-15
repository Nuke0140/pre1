import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { GET as usersGet, POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { EncryptionService } from '@/lib/security/encryption-service'

describe('PreOne Users Module — PII Masking & Safe Patching (P0 Compliance)', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let classroom: any
  let adminUser: any
  let adminCookie: string
  let staffUser: any
  let familyUser: any

  beforeAll(async () => {
    // 1. Setup Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        code: `MASK-${ts.slice(-6)}`,
        name: `PII Masking Test Academy ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Branch',
        code: `MB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    const sessionRecord = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Academic Year ${ts.slice(-4)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: sessionRecord.id,
        name: `Class Alpha ${ts.slice(-4)}`,
        code: `CA-${ts.slice(-4)}`,
        capacity: 20,
        programType: 'PLAYGROUP',
      },
    })

    await db.program.create({
      data: {
        tenantId: tenant.id,
        code: `PG-${ts.slice(-4)}`,
        name: 'Playgroup Program',
        programType: 'PLAYGROUP',
        ageMinMonths: 12,
        ageMaxMonths: 60,
      },
    })

    // 2. Setup Super Admin (Owner)
    adminUser = await db.user.create({
      data: {
        email: `admin.masking.${ts}@preone.test`,
        fullName: 'Security Auditor',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            role: 'OWNER',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    adminCookie = `${SESSION_COOKIE}=${token}`

    // 3. Create Staff User with exhaustive PII & Statutory IDs
    const staffReq = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Dr. Evelyn Reed',
        email: `evelyn.reed.${ts}@preone.test`,
        phone: '+91 98888 77777',
        username: `evelyn.reed.${ts.slice(-4)}`,
        password: 'Password@123',
        role: 'TEACHER',
        designation: 'Lead Educator',
        department: 'Early Childhood',
        employeeCode: `STF-${ts.slice(-4)}`,
        dateOfBirth: '1989-05-14',
        currentAddress: 'Flat 402, Sunshine Heights, Koramangala, Bangalore',
        permanentAddress: 'Ancestral Villa, 12 Park Road, Dehradun, UK',
        panNumber: 'ABCDE9999Z',
        aadhaarNumber: '999988887779',
        uanNumber: '100099998888',
        esiNumber: '31999988887777665',
      }),
    })

    const staffRes = await usersPost(staffReq)
    expect(staffRes.status).toBe(201)
    const staffJson = await staffRes.json()
    staffUser = staffJson.data

    // 4. Create Family User with child and Pickup PIN
    const familyReq = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Ramesh Sharma',
        email: `ramesh.sharma.${ts}@preone.test`,
        phone: '+91 97777 66666',
        username: `ramesh.sharma.${ts.slice(-4)}`,
        password: 'Password@123',
        role: 'PARENT',
        relationship: 'FATHER',
        occupation: 'Software Engineer',
        isPrimaryContact: true,
        canPickup: true,
        pickupPin: '5432',
        childMode: 'CREATE',
        newChild: {
          firstName: 'Ananya',
          lastName: 'Sharma',
          dob: '2022-10-10',
          gender: 'FEMALE',
          branchId: branch.id,
          classroomId: classroom.id,
        },
      }),
    })

    const familyRes = await usersPost(familyReq)
    expect(familyRes.status).toBe(201)
    const familyJson = await familyRes.json()
    familyUser = familyJson.data
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: DIRECTORY LIST API (GET /api/v1/users) MASKS ALL SENSITIVE PII
  // ─────────────────────────────────────────────────────────────────────────
  it('masks statutory IDs, DOB, and addresses in GET /api/v1/users list endpoint', async () => {
    const req = new NextRequest('http://localhost/api/v1/users?pageSize=50', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    })

    const res = await usersGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const items = json.data || json.items || []
    expect(items.length).toBeGreaterThanOrEqual(2)

    // Locate staff user in list
    const foundStaff = items.find((u: any) => u.userId === staffUser.userId || u.id === staffUser.id)
    expect(foundStaff).toBeDefined()
    expect(foundStaff.fullName).toBe('Dr. Evelyn Reed')

    const sp = foundStaff.staffProfile
    expect(sp).toBeDefined()

    // Non-PII workforce fields remain intact
    expect(sp.employeeCode).toBe(`STF-${ts.slice(-4)}`)
    expect(sp.designation).toBe('Lead Educator')
    expect(sp.department).toBe('Early Childhood')

    // CRITICAL P0 VERIFICATION: Sensitive PII MUST be masked with '••••'
    expect(sp.panNumber).toBe('••••')
    expect(sp.aadhaarNumber).toBe('••••')
    expect(sp.uanNumber).toBe('••••')
    expect(sp.esiNumber).toBe('••••')
    expect(sp.dateOfBirth).toBe('••••')
    expect(sp.currentAddress).toBe('••••')
    expect(sp.permanentAddress).toBe('••••')

    // Verify raw values NEVER leak in staffProfile JSON
    const spRaw = JSON.stringify(sp)
    expect(spRaw).not.toContain('ABCDE9999Z')
    expect(spRaw).not.toContain('999988887779')
    expect(spRaw).not.toContain('100099998888')
    expect(spRaw).not.toContain('31999988887777665')
    expect(spRaw).not.toContain('1989-05-14')
    expect(spRaw).not.toContain('Sunshine Heights')
    expect(spRaw).not.toContain('Dehradun')

    // Locate family user in list
    const foundFamily = items.find((u: any) => u.userId === familyUser.userId || u.id === familyUser.id)
    expect(foundFamily).toBeDefined()
    const gp = foundFamily.guardianProfile
    expect(gp).toBeDefined()

    // Guardian pickup PIN and linked student pickup PIN MUST be masked
    expect(gp.pickupPin).toBe('••••')
    expect(gp.students[0].pickupPin).toBe('••••')

    const gpRaw = JSON.stringify(gp)
    expect(gpRaw).not.toContain('5432')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: SINGLE USER DETAILS (GET /api/v1/users/[id]) RETURNS UNMASKED PII
  // ─────────────────────────────────────────────────────────────────────────
  it('returns unmasked PII for authorized single user view in GET /api/v1/users/[id]', async () => {
    const req = new NextRequest(`http://localhost/api/v1/users/${staffUser.userId}`, {
      method: 'GET',
      headers: { Cookie: adminCookie },
    })

    const res = await userGet(req, { params: Promise.resolve({ id: staffUser.userId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const sp = json.data.staffProfile
    expect(sp.panNumber).toBe('ABCDE9999Z')
    expect(sp.aadhaarNumber).toBe('999988887779')
    expect(sp.uanNumber).toBe('100099998888')
    expect(sp.esiNumber).toBe('31999988887777665')
    expect(sp.currentAddress).toContain('Sunshine Heights')
    expect(sp.permanentAddress).toContain('Dehradun')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: SAFE PATCH PRESERVES EXISTING VALUES WHEN MASKED PLACEHOLDER IS SENT
  // ─────────────────────────────────────────────────────────────────────────
  it('preserves underlying database values when PATCH is submitted with masked "••••" placeholders', async () => {
    const patchReq = new NextRequest(`http://localhost/api/v1/users/${staffUser.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Dr. Evelyn Reed-Smith', // Updated field
        panNumber: '••••', // Masked placeholder should be IGNORED
        aadhaarNumber: '••••',
        uanNumber: '••••',
        esiNumber: '••••',
        dateOfBirth: '••••',
        currentAddress: '••••',
        permanentAddress: '••••',
      }),
    })

    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: staffUser.userId }) })
    expect(patchRes.status).toBe(200)

    // Inspect database directly to confirm original values were NOT overwritten with '••••'
    const dbStaff = await db.tenantUser.findFirst({
      where: { tenantId: tenant.id, userId: staffUser.userId },
      include: { staffProfile: true, user: true },
    })

    expect(dbStaff?.user.fullName).toBe('Dr. Evelyn Reed-Smith')
    const sp = dbStaff!.staffProfile!
    expect(EncryptionService.decrypt(sp.panNumber, tenant.id)).toBe('ABCDE9999Z')
    expect(EncryptionService.decrypt(sp.aadhaarNumber, tenant.id)).toBe('999988887779')
    expect(EncryptionService.decrypt(sp.uanNumber, tenant.id)).toBe('100099998888')
    expect(EncryptionService.decrypt(sp.esiNumber, tenant.id)).toBe('31999988887777665')
    expect(EncryptionService.decrypt(sp.currentAddress, tenant.id)).toContain('Sunshine Heights')
    expect(EncryptionService.decrypt(sp.permanentAddress, tenant.id)).toContain('Dehradun')
    expect(sp.dateOfBirth?.toISOString()).toContain('1989-05-14')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: FAMILY USER PIN PRESERVED WHEN MASKED PLACEHOLDER SENT IN PATCH
  // ─────────────────────────────────────────────────────────────────────────
  it('preserves family pickupPin when PATCH is submitted with "••••"', async () => {
    const patchReq = new NextRequest(`http://localhost/api/v1/users/${familyUser.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        occupation: 'Senior Staff Engineer',
        pickupPin: '••••', // Masked placeholder should not overwrite nor trigger validation error
      }),
    })

    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: familyUser.userId }) })
    expect(patchRes.status).toBe(200)

    const dbGuardian = await db.guardian.findFirst({
      where: { tenantId: tenant.id, userId: familyUser.userId },
      include: { studentLinks: true },
    })

    expect(dbGuardian?.occupation).toBe('Senior Staff Engineer')
    expect(dbGuardian?.pickupPin).toBe('5432')
    expect(dbGuardian?.studentLinks[0].pickupPin).toBe('5432')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: EXPLICIT NULL CLEARING STILL SUCCEEDS
  // ─────────────────────────────────────────────────────────────────────────
  it('allows explicitly clearing nullable fields with null', async () => {
    const patchReq = new NextRequest(`http://localhost/api/v1/users/${staffUser.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        panNumber: null,
        currentAddress: null,
      }),
    })

    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: staffUser.userId }) })
    expect(patchRes.status).toBe(200)

    const dbStaff = await db.tenantUser.findFirst({
      where: { tenantId: tenant.id, userId: staffUser.userId },
      include: { staffProfile: true },
    })

    const sp = dbStaff!.staffProfile!
    expect(sp.panNumber).toBeNull()
    expect(sp.currentAddress).toBeNull()
    // Non-cleared statutory fields still intact
    expect(EncryptionService.decrypt(sp.aadhaarNumber, tenant.id)).toBe('999988887779')
    expect(EncryptionService.decrypt(sp.uanNumber, tenant.id)).toBe('100099998888')
  })
})

import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as familyGet, POST as familyPost } from '@/app/api/v1/users/[id]/family/route'
import { GET as familyGroupsGet } from '@/app/api/v1/users/family-groups/route'

describe('Family Grouping & Cross-Campus Parent Switcher (Doc 5.3)', () => {
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let ownerUser: any
  let motherUser: any
  let fatherUser: any
  let thirdParentUser: any
  let motherGuardian: any
  let fatherGuardian: any
  let thirdParentGuardian: any
  let child1: any
  let child2: any
  let child3: any
  let singleCampusParentUser: any
  let singleCampusGuardian: any
  let singleCampusChild: any
  let cookieOwner: string
  let cookieTenantB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A with two distinct campuses (Branch 1 and Branch 2)
    tenantA = await db.tenant.create({
      data: {
        name: `Cross Campus Academy ${ts}`,
        code: `CCA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        name: `Other School ${ts}`,
        code: `OTH-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Downtown Campus ${ts}`,
        code: `DT-${ts.slice(-3)}`,
        isMain: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `North Campus ${ts}`,
        code: `NC-${ts.slice(-3)}`,
        isMain: false,
      },
    })

    // 2. Setup Owner Admin
    ownerUser = await db.user.create({
      data: {
        email: `owner_${ts}@crosscampus.com`,
        username: `owner_${ts}`,
        fullName: 'Principal Owner',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwner = await signSession({
      userId: ownerUser.id,
      tenantId: tenantA.id,
      role: 'OWNER',
      name: ownerUser.fullName,
      email: ownerUser.email,
    })

    cookieTenantB = await signSession({
      userId: ownerUser.id,
      tenantId: tenantB.id,
      role: 'OWNER',
      name: ownerUser.fullName,
      email: ownerUser.email,
    })

    // 3. Setup Cross-Campus Family:
    // Mother & Father with Child 1 in Downtown Campus (branchA1) and Child 2 in North Campus (branchA2)
    motherUser = await db.user.create({
      data: {
        email: `mother_${ts}@family.com`,
        username: `mother_${ts}`,
        fullName: 'Sunita Sharma',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: motherUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    motherGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: motherUser.id,
        fullName: 'Sunita Sharma',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'MOTHER',
        isPrimaryContact: true,
      },
    })

    fatherUser = await db.user.create({
      data: {
        email: `father_${ts}@family.com`,
        username: `father_${ts}`,
        fullName: 'Rajesh Sharma',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: fatherUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    fatherGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: fatherUser.id,
        fullName: 'Rajesh Sharma',
        phone: `+9198764${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'FATHER',
        isPrimaryContact: false,
      },
    })

    // Enrolled Child 1 in Downtown Campus
    child1 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-1-${ts.slice(-4)}`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2020-04-10'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // Enrolled Child 2 in North Campus
    child2 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA2.id,
        admissionNo: `ADM-2-${ts.slice(-4)}`,
        firstName: 'Ananya',
        lastName: 'Sharma',
        dob: new Date('2022-08-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    // Link Child 1 to both Mother and Father
    await db.studentGuardian.create({
      data: {
        studentId: child1.id,
        guardianId: motherGuardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: child1.id,
        guardianId: fatherGuardian.id,
        relationship: 'FATHER',
        isPrimary: false,
        canPickup: true,
      },
    })

    // Link Child 2 to Mother
    await db.studentGuardian.create({
      data: {
        studentId: child2.id,
        guardianId: motherGuardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
      },
    })

    // Additional Child 3 in Downtown Campus (unlinked initially for linking test)
    child3 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-3-${ts.slice(-4)}`,
        firstName: 'Kabir',
        lastName: 'Sharma',
        dob: new Date('2023-01-20'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // Single-Campus Family for comparison
    singleCampusParentUser = await db.user.create({
      data: {
        email: `single_${ts}@family.com`,
        username: `single_${ts}`,
        fullName: 'Pooja Verma',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: singleCampusParentUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    singleCampusGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: singleCampusParentUser.id,
        fullName: 'Pooja Verma',
        phone: `+9198763${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'MOTHER',
        isPrimaryContact: true,
      },
    })

    singleCampusChild = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-SC-${ts.slice(-4)}`,
        firstName: 'Rohan',
        lastName: 'Verma',
        dob: new Date('2021-06-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: singleCampusChild.id,
        guardianId: singleCampusGuardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
      },
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 1. GET /api/v1/users/[id]/family
  // ─────────────────────────────────────────────────────────────
  it('identifies cross-campus parent and clusters siblings and household caregivers', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${motherUser.id}/family`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGet(req, { params: Promise.resolve({ id: motherUser.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.isFamily).toBe(true)
    expect(data.household).toBeDefined()

    const hh = data.household
    // 1. Cross Campus detection
    expect(hh.isCrossCampus).toBe(true)
    expect(hh.campuses.length).toBe(2)

    const campus1 = hh.campuses.find((c: any) => c.id === branchA1.id)
    const campus2 = hh.campuses.find((c: any) => c.id === branchA2.id)
    expect(campus1).toBeDefined()
    expect(campus2).toBeDefined()
    expect(campus1.studentCount).toBe(1)
    expect(campus2.studentCount).toBe(1)

    // 2. Both enrolled siblings are returned
    expect(hh.students.length).toBe(2)
    const studentIds = hh.students.map((s: any) => s.id)
    expect(studentIds).toContain(child1.id)
    expect(studentIds).toContain(child2.id)

    // 3. Co-guardians are aggregated across siblings (Mother + Father)
    expect(hh.guardians.length).toBe(2)
    const guardianIds = hh.guardians.map((g: any) => g.id)
    expect(guardianIds).toContain(motherGuardian.id)
    expect(guardianIds).toContain(fatherGuardian.id)

    // 4. Primary guardian is identified
    expect(hh.primaryGuardian).toBeDefined()
    expect(hh.primaryGuardian.id).toBe(motherGuardian.id)
    expect(hh.familyName).toContain('Sharma')
  })

  it('correctly marks single-campus family with isCrossCampus = false', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${singleCampusParentUser.id}/family`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGet(req, { params: Promise.resolve({ id: singleCampusParentUser.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.isFamily).toBe(true)
    const hh = data.household
    expect(hh.isCrossCampus).toBe(false)
    expect(hh.campuses.length).toBe(1)
    expect(hh.campuses[0].id).toBe(branchA1.id)
    expect(hh.students.length).toBe(1)
    expect(hh.students[0].id).toBe(singleCampusChild.id)
  })

  // ─────────────────────────────────────────────────────────────
  // 2. POST /api/v1/users/[id]/family — Linking Sibling
  // ─────────────────────────────────────────────────────────────
  it('links an additional sibling to the family unit by admission number', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${motherUser.id}/family`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        studentAdmissionNo: child3.admissionNo,
        relationship: 'MOTHER',
        permissions: {
          canPickup: true,
          pickupPin: '5432',
          receivesCommunication: true,
          isFeePayer: true,
        },
      }),
    })

    const res = await familyPost(req, { params: Promise.resolve({ id: motherUser.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.success).toBe(true)
    expect(data.link.studentId).toBe(child3.id)

    // Verify child3 is now in the family unit
    const verifyReq = new NextRequest(`http://localhost:3000/api/v1/users/${motherUser.id}/family`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })
    const verifyRes = await familyGet(verifyReq, { params: Promise.resolve({ id: motherUser.id }) })
    const verifyJson = await verifyRes.json()
    const verifyData = verifyJson.data || verifyJson
    expect(verifyData.household.students.length).toBe(3)
    const sIds = verifyData.household.students.map((s: any) => s.id)
    expect(sIds).toContain(child3.id)
  })

  it('enforces Max 2 Parents rule when linking a child who already has 2 registered parents', async () => {
    // Child 1 already has Mother and Father registered with role PARENT.
    // Create a 3rd parent user and try to link Child 1
    thirdParentUser = await db.user.create({
      data: {
        email: `third_${ts}@family.com`,
        username: `third_${ts}`,
        fullName: 'Step Parent',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: thirdParentUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    thirdParentGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: thirdParentUser.id,
        fullName: 'Step Parent',
        phone: `+9198762${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'GUARDIAN',
        isPrimaryContact: false,
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/v1/users/${thirdParentUser.id}/family`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        studentId: child1.id,
        relationship: 'GUARDIAN',
      }),
    })

    const res = await familyPost(req, { params: Promise.resolve({ id: thirdParentUser.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    const data = json.error || json
    expect(data.code || json.code).toBe('PARENT_LIMIT_REACHED')
  })

  // ─────────────────────────────────────────────────────────────
  // 3. GET /api/v1/users/family-groups — Aggregated Household View
  // ─────────────────────────────────────────────────────────────
  it('clusters all households across the school in family-groups route', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/family-groups`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGroupsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.success).toBe(true)
    expect(Array.isArray(data.households)).toBe(true)
    expect(data.total).toBeGreaterThanOrEqual(2)

    // Verify cross-campus detection in aggregated groups
    const crossCampusList = data.households.filter((h: any) => h.isCrossCampus)
    expect(crossCampusList.length).toBeGreaterThanOrEqual(1)
    const sharmaHousehold = crossCampusList.find((h: any) => h.familyName.includes('Sharma'))
    expect(sharmaHousehold).toBeDefined()
    expect(sharmaHousehold.campuses.length).toBe(2)
  })

  it('filters family-groups by crossCampusOnly = true', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/family-groups?crossCampusOnly=true`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGroupsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.success).toBe(true)
    // Every returned household must have isCrossCampus === true
    for (const h of data.households) {
      expect(h.isCrossCampus).toBe(true)
      expect(h.campuses.length).toBeGreaterThan(1)
    }
  })

  it('filters family-groups by branchId', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/family-groups?branchId=${branchA2.id}`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGroupsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.success).toBe(true)
    // Every returned household must have a campus matching branchA2
    for (const h of data.households) {
      const hasCampus = h.campuses.some((c: any) => c.id === branchA2.id)
      expect(hasCampus).toBe(true)
    }
  })

  it('searches family-groups by student admission number or guardian name', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/family-groups?q=${child1.admissionNo}`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await familyGroupsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    const data = json.data || json
    expect(data.success).toBe(true)
    expect(data.households.length).toBe(1)
    expect(data.households[0].familyName).toContain('Sharma')
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Security & RBAC Isolation
  // ─────────────────────────────────────────────────────────────
  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${motherUser.id}/family`, {
      method: 'GET',
    })
    const res = await familyGet(req, { params: Promise.resolve({ id: motherUser.id }) })
    expect(res.status).toBe(401)
  })

  it('blocks cross-tenant family queries with 404', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${motherUser.id}/family`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieTenantB}` },
    })
    const res = await familyGet(req, { params: Promise.resolve({ id: motherUser.id }) })
    expect(res.status).toBe(404)
  })
})

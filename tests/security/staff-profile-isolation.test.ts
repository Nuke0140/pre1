import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as usersGet, POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { GET as profileGet, PATCH as profilePatch } from '@/app/api/v1/profile/route'

describe('StaffProfile Cross-Tenant Isolation (Doc 3.1 P0 Audit)', () => {
  let tenantA: any
  let branchA: any
  let tenantB: any
  let branchB: any
  let adminA: any
  let adminB: any
  let adminCookieA: string
  let adminCookieB: string

  const ts = `${Date.now()}`

  beforeAll(async () => {
    // 1. Create School A
    tenantA = await db.tenant.create({
      data: {
        name: `Isolation School A ${ts.slice(-4)}`,
        code: `ISOLA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Campus Alpha',
        code: `CA-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 2. Create School B
    tenantB = await db.tenant.create({
      data: {
        name: `Isolation School B ${ts.slice(-4)}`,
        code: `ISOLB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'Campus Beta',
        code: `CB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 3. Create Admin for School A
    adminA = await db.user.create({
      data: {
        email: `admin.a.${ts}@preone.test`,
        fullName: 'Admin School A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenA = await signSession({
      uid: adminA.id,
      email: adminA.email,
      name: adminA.fullName,
      tenantId: tenantA.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
      branchId: branchA.id,
    })
    adminCookieA = `preone_session=${tokenA}`

    // 4. Create Admin for School B
    adminB = await db.user.create({
      data: {
        email: `admin.b.${ts}@preone.test`,
        fullName: 'Admin School B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantB.id,
            branchId: branchB.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      name: adminB.fullName,
      tenantId: tenantB.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
      branchId: branchB.id,
    })
    adminCookieB = `preone_session=${tokenB}`
  })

  it('proves complete tenant isolation for dual-school staff accounts (no HR cross-leakage)', async () => {
    const sharedEmail = `dual.staff.${ts}@preone.test`
    const sharedUsername = `dual.staff.${ts.slice(-4)}`

    // Step 1: Onboard staff member in School A
    const reqCreateA = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookieA,
      },
      body: JSON.stringify({
        fullName: 'Professor Albus McGonagall',
        email: sharedEmail,
        username: sharedUsername,
        phone: '+91 98111 22233',
        password: 'Password@123',
        role: 'TEACHER',
        designation: 'Senior Advanced Mathematics Teacher',
        department: 'Pure Mathematics',
        employeeCode: `TCH-A-${ts.slice(-4)}`,
        employmentType: 'FULL_TIME',
        panNumber: 'ABCDE1111Z',
        aadhaarNumber: '234567890124',
        branchId: branchA.id,
      }),
    })

    const resCreateA = await usersPost(reqCreateA)
    expect(resCreateA.status).toBe(201)
    const jsonA = await resCreateA.json()
    expect(jsonA.success).toBe(true)
    const userId = jsonA.data.userId || jsonA.data.id

    // Step 2: Onboard SAME global user in School B with different workforce/HR profile
    const reqCreateB = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookieB,
      },
      body: JSON.stringify({
        fullName: 'Professor Albus McGonagall',
        email: sharedEmail,
        username: sharedUsername,
        password: 'Password@123',
        role: 'COORDINATOR',
        designation: 'Weekend STEM Program Coordinator',
        department: 'Community Outreach & Extension',
        employeeCode: `CRD-B-${ts.slice(-4)}`,
        employmentType: 'PART_TIME',
        panNumber: 'ABCDE1111Z',
        aadhaarNumber: '234567890124',
        branchId: branchB.id,
      }),
    })

    const resCreateB = await usersPost(reqCreateB)
    expect(resCreateB.status).toBe(201)
    const jsonB = await resCreateB.json()
    expect(jsonB.success).toBe(true)
    expect(jsonB.data.userId).toBe(userId) // Corroborates single global User entity

    // Step 3: Query School A Directory (`GET /api/v1/users`)
    const reqListA = new NextRequest('http://localhost/api/v1/users', {
      method: 'GET',
      headers: { Cookie: adminCookieA },
    })
    const resListA = await usersGet(reqListA)
    expect(resListA.status).toBe(200)
    const listAData = (await resListA.json()).data
    const staffInListA = listAData.find((u: any) => u.userId === userId)
    expect(staffInListA).toBeDefined()
    expect(staffInListA.role).toBe('TEACHER')
    expect(staffInListA.staffProfile.employeeCode).toBe(`TCH-A-${ts.slice(-4)}`)
    expect(staffInListA.staffProfile.designation).toBe('Senior Advanced Mathematics Teacher')
    expect(staffInListA.staffProfile.department).toBe('Pure Mathematics')
    expect(staffInListA.staffProfile.employmentType).toBe('FULL_TIME')

    // Verify School B information has NOT leaked into School A directory
    expect(JSON.stringify(staffInListA.staffProfile)).not.toContain(`CRD-B-${ts.slice(-4)}`)
    expect(JSON.stringify(staffInListA.staffProfile)).not.toContain('Weekend STEM Program Coordinator')
    expect(JSON.stringify(staffInListA.staffProfile)).not.toContain('Community Outreach')

    // Step 4: Query School B Directory (`GET /api/v1/users`)
    const reqListB = new NextRequest('http://localhost/api/v1/users', {
      method: 'GET',
      headers: { Cookie: adminCookieB },
    })
    const resListB = await usersGet(reqListB)
    expect(resListB.status).toBe(200)
    const listBData = (await resListB.json()).data
    const staffInListB = listBData.find((u: any) => u.userId === userId)
    expect(staffInListB).toBeDefined()
    expect(staffInListB.role).toBe('COORDINATOR')
    expect(staffInListB.staffProfile.employeeCode).toBe(`CRD-B-${ts.slice(-4)}`)
    expect(staffInListB.staffProfile.designation).toBe('Weekend STEM Program Coordinator')
    expect(staffInListB.staffProfile.department).toBe('Community Outreach & Extension')
    expect(staffInListB.staffProfile.employmentType).toBe('PART_TIME')

    // Verify School A information has NOT leaked into School B directory
    expect(JSON.stringify(staffInListB.staffProfile)).not.toContain(`TCH-A-${ts.slice(-4)}`)
    expect(JSON.stringify(staffInListB.staffProfile)).not.toContain('Senior Advanced Mathematics Teacher')
    expect(JSON.stringify(staffInListB.staffProfile)).not.toContain('Pure Mathematics')

    // Step 5: Query Single User in School A (`GET /api/v1/users/[id]`)
    const reqSingleA = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
      method: 'GET',
      headers: { Cookie: adminCookieA },
    })
    const resSingleA = await userGet(reqSingleA, { params: Promise.resolve({ id: userId }) })
    expect(resSingleA.status).toBe(200)
    const singleA = (await resSingleA.json()).data
    expect(singleA.role).toBe('TEACHER')
    expect(singleA.staffProfile.employeeCode).toBe(`TCH-A-${ts.slice(-4)}`)
    expect(singleA.staffProfile.designation).toBe('Senior Advanced Mathematics Teacher')

    // Step 6: Query Single User in School B (`GET /api/v1/users/[id]`)
    const reqSingleB = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
      method: 'GET',
      headers: { Cookie: adminCookieB },
    })
    const resSingleB = await userGet(reqSingleB, { params: Promise.resolve({ id: userId }) })
    expect(resSingleB.status).toBe(200)
    const singleB = (await resSingleB.json()).data
    expect(singleB.role).toBe('COORDINATOR')
    expect(singleB.staffProfile.employeeCode).toBe(`CRD-B-${ts.slice(-4)}`)
    expect(singleB.staffProfile.designation).toBe('Weekend STEM Program Coordinator')

    // Step 7: Modify workforce profile in School B via PATCH
    const reqPatchB = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookieB,
      },
      body: JSON.stringify({
        designation: 'Director of Robotic Innovations',
        department: 'Future Technologies & Robotics',
        employmentType: 'CONTRACT',
      }),
    })
    const resPatchB = await userPatch(reqPatchB, { params: Promise.resolve({ id: userId }) })
    expect(resPatchB.status).toBe(200)
    const patchedB = (await resPatchB.json()).data
    expect(patchedB.staffProfile.designation).toBe('Director of Robotic Innovations')
    expect(patchedB.staffProfile.department).toBe('Future Technologies & Robotics')
    expect(patchedB.staffProfile.employmentType).toBe('CONTRACT')

    // Step 8: Verify School A is completely UNTOUCHED by School B's edits
    const resRecheckA = await userGet(reqSingleA, { params: Promise.resolve({ id: userId }) })
    expect(resRecheckA.status).toBe(200)
    const recheckA = (await resRecheckA.json()).data
    expect(recheckA.staffProfile.employeeCode).toBe(`TCH-A-${ts.slice(-4)}`)
    expect(recheckA.staffProfile.designation).toBe('Senior Advanced Mathematics Teacher')
    expect(recheckA.staffProfile.department).toBe('Pure Mathematics')
    expect(recheckA.staffProfile.employmentType).toBe('FULL_TIME')

    // Step 9: Database Level Direct Verification
    const dbProfiles = await db.staffProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    expect(dbProfiles.length).toBe(2)

    const dbProfileA = dbProfiles.find((p) => p.tenantId === tenantA.id)
    const dbProfileB = dbProfiles.find((p) => p.tenantId === tenantB.id)

    expect(dbProfileA).toBeDefined()
    expect(dbProfileB).toBeDefined()
    expect(dbProfileA?.employeeCode).toBe(`TCH-A-${ts.slice(-4)}`)
    expect(dbProfileA?.designation).toBe('Senior Advanced Mathematics Teacher')
    expect(dbProfileB?.employeeCode).toBe(`CRD-B-${ts.slice(-4)}`)
    expect(dbProfileB?.designation).toBe('Director of Robotic Innovations')

    // Step 10: Verify Self-Service Profile API (`/api/v1/profile`) respects active tenant context
    const tokenTeacherA = await signSession({
      uid: userId,
      email: sharedEmail,
      name: 'Professor Albus McGonagall',
      tenantId: tenantA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tokenVersion: 0,
      mustChangePassword: false,
      branchId: branchA.id,
    })

    const tokenTeacherB = await signSession({
      uid: userId,
      email: sharedEmail,
      name: 'Professor Albus McGonagall',
      tenantId: tenantB.id,
      role: 'COORDINATOR',
      roles: ['COORDINATOR'],
      tokenVersion: 0,
      mustChangePassword: false,
      branchId: branchB.id,
    })

    const reqProfileA = new NextRequest('http://localhost/api/v1/profile', {
      method: 'GET',
      headers: { Cookie: `preone_session=${tokenTeacherA}` },
    })
    const resProfileA = await profileGet(reqProfileA)
    expect(resProfileA.status).toBe(200)
    const profileA = (await resProfileA.json()).data
    expect(profileA.staffProfile.designation).toBe('Senior Advanced Mathematics Teacher')
    expect(profileA.staffProfile.employeeCode).toBe(`TCH-A-${ts.slice(-4)}`)

    const reqProfileB = new NextRequest('http://localhost/api/v1/profile', {
      method: 'GET',
      headers: { Cookie: `preone_session=${tokenTeacherB}` },
    })
    const resProfileB = await profileGet(reqProfileB)
    expect(resProfileB.status).toBe(200)
    const profileB = (await resProfileB.json()).data
    expect(profileB.staffProfile.designation).toBe('Director of Robotic Innovations')
    expect(profileB.staffProfile.employeeCode).toBe(`CRD-B-${ts.slice(-4)}`)
  })
})

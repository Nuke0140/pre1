import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { POST as loginPost } from '@/app/api/v1/auth/login/route'
import bcrypt from 'bcryptjs'
import { signSession } from '@/lib/auth'

describe('REM-USR-01: Cross-Tenant Global Identity & Account Status Mutation Defense', () => {
  const ts = Date.now().toString()
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let ownerB: any
  let cookieOwnerA: string
  let cookieOwnerB: string

  const userEmail = `multi.school.educator.${ts}@preone.test`
  const originalFullName = 'Prof. Maya Sen'
  let establishedUserId: string

  beforeAll(async () => {
    // 1. Setup Tenant A and Tenant B
    tenantA = await db.tenant.create({
      data: {
        code: `SCH-A-${ts.slice(-5)}`,
        name: `Academy Alpha ${ts}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        code: `SCH-B-${ts.slice(-5)}`,
        name: `Academy Beta ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)

    ownerA = await db.user.create({
      data: {
        email: `owner.a.${ts}@test.com`,
        username: `owner_a_${ts}`,
        fullName: 'Owner A',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    ownerB = await db.user.create({
      data: {
        email: `owner.b.${ts}@test.com`,
        username: `owner_b_${ts}`,
        fullName: 'Owner B',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: ownerB.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    cookieOwnerB = await signSession({
      uid: ownerB.id,
      email: ownerB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })

    // 2. Create established ACTIVE user in Tenant A
    const educatorUser = await db.user.create({
      data: {
        email: userEmail,
        fullName: originalFullName,
        username: `maya_sen_${ts}`,
        phone: '9876543210',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    establishedUserId = educatorUser.id

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: establishedUserId,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
  })

  it('1. Confirms established user can authenticate into Tenant A', async () => {
    const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: userEmail,
        password: 'SecurePassword@123',
        schoolCode: tenantA.code,
      }),
    })

    const res = await loginPost(loginReq)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.user.email).toBe(userEmail)
    expect(json.data.user.name).toBe(originalFullName)
  })

  it('2. Tenant B invites existing user with INVITE (PENDING) mode without mutating global status or name', async () => {
    const inviteReq = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerB}`,
      },
      body: JSON.stringify({
        fullName: 'Maya S. (Attendant Candidate)', // Tenant B uses different name formatting
        email: userEmail,
        role: 'ATTENDANT',
        credentialSetupMode: 'INVITE', // Sets initialStatus to PENDING
      }),
    })

    const res = await usersPost(inviteReq)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.userId).toBe(establishedUserId)

    // Verify global user record in database
    const globalUser = await db.user.findUnique({
      where: { id: establishedUserId },
    })

    // Global status MUST remain ACTIVE (not downgraded to PENDING)
    expect(globalUser?.status).toBe('ACTIVE')
    // Established full name MUST NOT be overwritten by secondary school
    expect(globalUser?.fullName).toBe(originalFullName)

    // Verify Tenant B membership is correctly PENDING
    const membershipB = await db.tenantUser.findFirst({
      where: { tenantId: tenantB.id, userId: establishedUserId },
    })
    expect(membershipB?.status).toBe('PENDING')
    expect(membershipB?.role).toBe('ATTENDANT')

    // Verify Tenant A membership is completely untouched
    const membershipA = await db.tenantUser.findFirst({
      where: { tenantId: tenantA.id, userId: establishedUserId },
    })
    expect(membershipA?.status).toBe('ACTIVE')
    expect(membershipA?.role).toBe('TEACHER')
  })

  it('3. Existing user can STILL log in to Tenant A after Tenant B invite was created', async () => {
    const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: userEmail,
        password: 'SecurePassword@123',
        schoolCode: tenantA.code,
      }),
    })

    const res = await loginPost(loginReq)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.user.email).toBe(userEmail)
    expect(json.data.user.name).toBe(originalFullName)
  })

  it('4. Genuinely new user onboarding still creates fresh PENDING user identity', async () => {
    const newEmail = `brand.new.user.${ts}@preone.test`
    const createReq = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        fullName: 'Brand New Educator',
        email: newEmail,
        role: 'TEACHER',
        credentialSetupMode: 'INVITE',
      }),
    })

    const res = await usersPost(createReq)
    expect(res.status).toBe(201)

    const newUser = await db.user.findUnique({
      where: { email: newEmail },
    })
    expect(newUser?.status).toBe('PENDING')
    expect(newUser?.fullName).toBe('Brand New Educator')
  })
})

import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as usersGet, POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { UserIdentityService } from '@/lib/users/user-identity-service'

describe('Multi-Branch Staff Assignment (Doc 2.2 P2 Audit)', () => {
  let tenant: any
  let branchMain: any
  let branchNorth: any
  let branchSouth: any
  let otherTenant: any
  let otherBranch: any

  let adminUser: any
  let adminCookie: string

  const ts = `${Date.now()}`

  beforeAll(async () => {
    // 1. Create primary tenant with 3 branches
    tenant = await db.tenant.create({
      data: {
        name: `Multi-Campus Academy ${ts.slice(-4)}`,
        code: `MCA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchMain = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchNorth = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'North Campus',
        code: `NRTH-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    branchSouth = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'South Campus',
        code: `STH-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    // 2. Create another tenant with its own branch for isolation testing
    otherTenant = await db.tenant.create({
      data: {
        name: `Foreign Academy ${ts.slice(-4)}`,
        code: `FA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    otherBranch = await db.branch.create({
      data: {
        tenantId: otherTenant.id,
        name: 'Foreign Campus',
        code: `FC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 3. Create Tenant Admin
    adminUser = await db.user.create({
      data: {
        email: `admin.multibranch.${ts}@preone.test`,
        fullName: 'Admin MultiBranch',
        username: `adminmb_${ts.slice(-6)}`,
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branchMain.id,
            role: 'OWNER',
            roles: ['OWNER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branchMain.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    adminCookie = `preone_session=${token}`
  })

  it('1. UserIdentityService.syncTenantUserBranches syncs junction table records idempotently', async () => {
    // Create a staff user directly
    const staffUser = await db.user.create({
      data: {
        email: `service.staff.${ts}@preone.test`,
        fullName: 'Service Staff Test',
        passwordHash: '$2b$10$placeholderhash1234567890',
        status: 'ACTIVE',
      },
    })

    const membership = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: staffUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branchMain.id,
        status: 'ACTIVE',
      },
    })

    // Sync with 2 branches: Main (primary) and North
    await UserIdentityService.syncTenantUserBranches(db, {
      tenantId: tenant.id,
      tenantUserId: membership.id,
      primaryBranchId: branchMain.id,
      branchIds: [branchMain.id, branchNorth.id],
    })

    const junctionRows = await (db as any).tenantUserBranch.findMany({
      where: { tenantUserId: membership.id },
      orderBy: { branchId: 'asc' },
    })

    expect(junctionRows.length).toBe(2)
    const mainRecord = junctionRows.find((r: any) => r.branchId === branchMain.id)
    const northRecord = junctionRows.find((r: any) => r.branchId === branchNorth.id)
    expect(mainRecord).toBeDefined()
    expect(mainRecord.isPrimary).toBe(true)
    expect(northRecord).toBeDefined()
    expect(northRecord.isPrimary).toBe(false)

    // Re-sync with South replacing North
    await UserIdentityService.syncTenantUserBranches(db, {
      tenantId: tenant.id,
      tenantUserId: membership.id,
      primaryBranchId: branchMain.id,
      branchIds: [branchMain.id, branchSouth.id],
    })

    const updatedRows = await (db as any).tenantUserBranch.findMany({
      where: { tenantUserId: membership.id },
    })

    expect(updatedRows.length).toBe(2)
    const updatedBranchIds = updatedRows.map((r: any) => r.branchId)
    expect(updatedBranchIds).toContain(branchMain.id)
    expect(updatedBranchIds).toContain(branchSouth.id)
    expect(updatedBranchIds).not.toContain(branchNorth.id)
  })

  it('2. POST /api/v1/users creates a multi-branch staff member with assignedBranchIds', async () => {
    const newStaffEmail = `multibranch.post.${ts}@preone.test`
    const newStaffUsername = `mbpost_${ts.slice(-6)}`

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Eleanor MultiCampus Teacher',
        email: newStaffEmail,
        username: newStaffUsername,
        password: 'Password1234!',
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branchMain.id,
        branchIds: [branchMain.id, branchNorth.id, branchSouth.id],
        designation: 'Senior Lead Teacher',
        employeeCode: `EMP-MB-${ts.slice(-4)}`,
      }),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.branchId).toBe(branchMain.id)
    expect(json.data.assignedBranchIds).toBeDefined()
    expect(json.data.assignedBranchIds.length).toBe(3)
    expect(json.data.assignedBranchIds).toContain(branchMain.id)
    expect(json.data.assignedBranchIds).toContain(branchNorth.id)
    expect(json.data.assignedBranchIds).toContain(branchSouth.id)

    // Verify junction rows in database
    const junctions = await (db as any).tenantUserBranch.findMany({
      where: { tenantUserId: json.data.id },
    })
    expect(junctions.length).toBe(3)
  })

  it('3. GET /api/v1/users directory filtering returns staff under any assigned branch', async () => {
    // Query directory with branchId=branchNorth.id
    const reqNorth = new NextRequest(`http://localhost:3000/api/v1/users?branchId=${branchNorth.id}`, {
      headers: { cookie: adminCookie },
    })
    const resNorth = await usersGet(reqNorth)
    expect(resNorth.status).toBe(200)
    const jsonNorth = await resNorth.json()
    expect(jsonNorth.success).toBe(true)

    // The staff created in test 2 has branchMain as primary, but is assigned to branchNorth as well
    const foundStaff = jsonNorth.data.find((u: any) => u.fullName === 'Eleanor MultiCampus Teacher')
    expect(foundStaff).toBeDefined()
    expect(foundStaff.branchId).toBe(branchMain.id)
    expect(foundStaff.assignedBranches).toBeDefined()
    expect(foundStaff.assignedBranches.length).toBe(3)

    // Query directory with branchId=branchSouth.id
    const reqSouth = new NextRequest(`http://localhost:3000/api/v1/users?branchId=${branchSouth.id}`, {
      headers: { cookie: adminCookie },
    })
    const resSouth = await usersGet(reqSouth)
    expect(resSouth.status).toBe(200)
    const jsonSouth = await resSouth.json()
    const foundStaffSouth = jsonSouth.data.find((u: any) => u.fullName === 'Eleanor MultiCampus Teacher')
    expect(foundStaffSouth).toBeDefined()
  })

  it('4. PATCH /api/v1/users/[id] updates assigned branches and syncs junction table', async () => {
    // Find the membership for Eleanor
    const member = await db.tenantUser.findFirst({
      where: {
        tenantId: tenant.id,
        user: { email: `multibranch.post.${ts}@preone.test` },
      },
    })
    expect(member).toBeDefined()

    // Update to remove branchSouth and keep only branchMain and branchNorth
    const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${member!.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        branchId: branchNorth.id, // Switch primary branch to North
        branchIds: [branchNorth.id, branchMain.id],
      }),
    })

    const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: member!.id }) })
    expect(patchRes.status).toBe(200)
    const patchJson = await patchRes.json()
    expect(patchJson.success).toBe(true)
    expect(patchJson.data.branchId).toBe(branchNorth.id)
    expect(patchJson.data.assignedBranchIds.length).toBe(2)
    expect(patchJson.data.assignedBranchIds).toContain(branchNorth.id)
    expect(patchJson.data.assignedBranchIds).toContain(branchMain.id)
    expect(patchJson.data.assignedBranchIds).not.toContain(branchSouth.id)

    // Check primary flag on junction row
    const junctions = await (db as any).tenantUserBranch.findMany({
      where: { tenantUserId: member!.id },
    })
    const northJunction = junctions.find((j: any) => j.branchId === branchNorth.id)
    const mainJunction = junctions.find((j: any) => j.branchId === branchMain.id)
    expect(northJunction.isPrimary).toBe(true)
    expect(mainJunction.isPrimary).toBe(false)
  })

  it('5. GET /api/v1/users/[id] returns full assignedBranches objects with code and isPrimary', async () => {
    const member = await db.tenantUser.findFirst({
      where: {
        tenantId: tenant.id,
        user: { email: `multibranch.post.${ts}@preone.test` },
      },
    })
    expect(member).toBeDefined()

    const getReq = new NextRequest(`http://localhost:3000/api/v1/users/${member!.id}`, {
      headers: { cookie: adminCookie },
    })
    const getRes = await userGet(getReq, { params: Promise.resolve({ id: member!.id }) })
    expect(getRes.status).toBe(200)
    const json = await getRes.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.assignedBranches)).toBe(true)
    expect(json.data.assignedBranches.length).toBe(2)

    const primaryBranch = json.data.assignedBranches.find((b: any) => b.isPrimary)
    expect(primaryBranch).toBeDefined()
    expect(primaryBranch.id).toBe(branchNorth.id)
    expect(primaryBranch.name).toBe('North Campus')
    expect(primaryBranch.code).toContain('NRTH-')
  })

  it('6. Single-branch staff is not returned when filtering by a branch they are not assigned to', async () => {
    // Create single-branch staff only on branchSouth
    const singleStaff = await db.user.create({
      data: {
        email: `single.south.${ts}@preone.test`,
        fullName: 'South Campus Only Teacher',
        passwordHash: '$2b$10$placeholderhash1234567890',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branchSouth.id,
            role: 'TEACHER',
            roles: ['TEACHER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    // Filter by branchNorth
    const reqNorth = new NextRequest(`http://localhost:3000/api/v1/users?branchId=${branchNorth.id}`, {
      headers: { cookie: adminCookie },
    })
    const resNorth = await usersGet(reqNorth)
    const jsonNorth = await resNorth.json()
    const foundOnNorth = jsonNorth.data.find((u: any) => u.fullName === 'South Campus Only Teacher')
    expect(foundOnNorth).toBeUndefined()

    // Filter by branchSouth
    const reqSouth = new NextRequest(`http://localhost:3000/api/v1/users?branchId=${branchSouth.id}`, {
      headers: { cookie: adminCookie },
    })
    const resSouth = await usersGet(reqSouth)
    const jsonSouth = await resSouth.json()
    const foundOnSouth = jsonSouth.data.find((u: any) => u.fullName === 'South Campus Only Teacher')
    expect(foundOnSouth).toBeDefined()
  })
})

import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { DELETE as userDelete, PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import bcrypt from 'bcryptjs'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('REM-USR-02: Last Active Administrator Protection (OWNER & PRINCIPAL)', () => {
  const ts = Date.now().toString()
  let tenantA: any
  let tenantB: any

  let principal1User: any
  let memberPrincipal1: any
  let cookiePrincipal1: string

  let principal2User: any
  let memberPrincipal2: any
  let cookiePrincipal2: string

  let externalPrincipalBUser: any
  let memberPrincipalB: any

  beforeAll(async () => {
    // 1. Setup Tenant A & Tenant B
    tenantA = await db.tenant.create({
      data: {
        code: `PRIN-A-${ts.slice(-5)}`,
        name: `Principal Alpha Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        code: `PRIN-B-${ts.slice(-5)}`,
        name: `Principal Beta Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)

    // Principal 1 in Tenant A
    principal1User = await db.user.create({
      data: {
        email: `principal1.${ts}@preone.test`,
        username: `prin1_${ts}`,
        fullName: 'Principal Alpha One',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    memberPrincipal1 = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: principal1User.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
    const token1 = await signSession({
      uid: principal1User.id,
      email: principal1User.email,
      name: principal1User.fullName,
      tenantId: tenantA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })
    cookiePrincipal1 = `${SESSION_COOKIE}=${token1}`

    // Principal 2 in Tenant A
    principal2User = await db.user.create({
      data: {
        email: `principal2.${ts}@preone.test`,
        username: `prin2_${ts}`,
        fullName: 'Principal Alpha Two',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    memberPrincipal2 = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: principal2User.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
    const token2 = await signSession({
      uid: principal2User.id,
      email: principal2User.email,
      name: principal2User.fullName,
      tenantId: tenantA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })
    cookiePrincipal2 = `${SESSION_COOKIE}=${token2}`

    // Principal in Tenant B (should never count towards Tenant A)
    externalPrincipalBUser = await db.user.create({
      data: {
        email: `principal.b.${ts}@preone.test`,
        username: `prin_b_${ts}`,
        fullName: 'Principal Beta Other',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    memberPrincipalB = await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: externalPrincipalBUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
  })

  it('1. Allows deleting Principal 1 when Principal 2 is an active administrator in Tenant A', async () => {
    const deleteReq = new NextRequest(`http://localhost:3000/api/v1/users/${memberPrincipal1.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePrincipal2,
      },
    })

    const res = await userDelete(deleteReq, { params: Promise.resolve({ id: memberPrincipal1.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    // Confirm member 1 is now marked INACTIVE / soft-deleted
    const member1 = await db.tenantUser.findUnique({ where: { id: memberPrincipal1.id } })
    expect(member1?.status).not.toBe('ACTIVE')
  })

  it('2. Rejects deleting the sole remaining active PRINCIPAL (Principal 2) with LAST_ADMIN_PROTECTION', async () => {
    // Principal 1 (who still has a valid session token but is now inactive) attempts to delete Principal 2
    const deleteReq = new NextRequest(`http://localhost:3000/api/v1/users/${memberPrincipal2.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePrincipal1,
      },
    })

    const res = await userDelete(deleteReq, { params: Promise.resolve({ id: memberPrincipal2.id }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error?.code).toBe('LAST_ADMIN_PROTECTION')
    expect(json.error?.message).toContain('last active administrator or owner')

    // Confirm Principal 2 is still ACTIVE
    const member2 = await db.tenantUser.findUnique({ where: { id: memberPrincipal2.id } })
    expect(member2?.status).toBe('ACTIVE')
  })

  it('3. Rejects suspending or deactivating the sole remaining active PRINCIPAL (403 LAST_ADMIN_PROTECTION)', async () => {
    const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${memberPrincipal2.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePrincipal1,
      },
      body: JSON.stringify({
        status: 'SUSPENDED',
      }),
    })

    const res = await userPatch(patchReq, { params: Promise.resolve({ id: memberPrincipal2.id }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error?.code).toBe('LAST_ADMIN_PROTECTION')
    expect(json.error?.message).toContain('last active administrator or owner')
  })

  it('4. Rejects downgrading the role of the sole remaining active PRINCIPAL to TEACHER (403 LAST_ADMIN_PROTECTION)', async () => {
    const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${memberPrincipal2.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookiePrincipal1,
      },
      body: JSON.stringify({
        role: 'TEACHER',
        roles: ['TEACHER'],
      }),
    })

    const res = await userPatch(patchReq, { params: Promise.resolve({ id: memberPrincipal2.id }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error?.code).toBe('LAST_ADMIN_PROTECTION')
    expect(json.error?.message).toContain('sole active Principal')
  })

  it('5. Cross-tenant administrator in Tenant B does not satisfy Tenant A admin requirements', async () => {
    // Confirm memberPrincipalB is ACTIVE in Tenant B
    const memberB = await db.tenantUser.findUnique({ where: { id: memberPrincipalB.id } })
    expect(memberB?.status).toBe('ACTIVE')

    // But Tenant A has exactly 1 active administrator
    const tenantAAdmins = await db.tenantUser.count({
      where: {
        tenantId: tenantA.id,
        role: { in: ['OWNER', 'PRINCIPAL'] },
        status: 'ACTIVE',
        deletedAt: null,
      },
    })
    expect(tenantAAdmins).toBe(1)
  })
})

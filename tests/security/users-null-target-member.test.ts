import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as resetPassword } from '@/app/api/v1/users/[id]/reset-password/route'
import { POST as transitionStatus } from '@/app/api/v1/users/[id]/status/route'
import { POST as unlockUser } from '@/app/api/v1/users/[id]/unlock/route'
import { GET as getSessions, DELETE as deleteSessions } from '@/app/api/v1/users/[id]/sessions/route'
import { POST as resendInvite } from '@/app/api/v1/users/[id]/resend-invite/route'
import { POST as revokeSessions } from '@/app/api/v1/users/[id]/revoke-sessions/route'

describe('P0-05: Null Target Member Handling Regression Suite', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let ownerUser: any
  let guardianWithoutTenantUser: any
  let staffUser: any
  let ownerToken: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `P05-${ts.slice(-6)}`,
        name: `Null Member Tenant ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `B-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    ownerUser = await db.user.create({
      data: {
        email: `owner.${ts}@p05.test`,
        fullName: 'Owner Test',
        status: 'ACTIVE',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'OWNER',
            roles: ['OWNER'],
            branchId: branch.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    staffUser = await db.user.create({
      data: {
        email: `staff.${ts}@p05.test`,
        fullName: 'Staff Test',
        status: 'ACTIVE',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'TEACHER',
            roles: ['TEACHER'],
            branchId: branch.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    // Guardian who has NO TenantUser record (only a Guardian row)
    guardianWithoutTenantUser = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Guardian No TenantUser',
        phone: `+9198777${ts.slice(-5)}`,
        email: `guardian.${ts}@p05.test`,
        relationship: 'MOTHER',
      },
    })

    ownerToken = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })
  })

  afterAll(async () => {
    await db.guardian.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
    await db.user.deleteMany({ where: { id: { in: [ownerUser.id, staffUser.id] } } })
    await db.branch.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenant.deleteMany({ where: { id: tenant.id } })
  })

  const fakeNonexistentId = '00000000-0000-0000-0000-000000000000'

  it('reset-password returns 404 on nonexistent user ID without crashing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/reset-password`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reason: 'Test reset' }),
    })
    const res = await resetPassword(req, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(res.status).toBe(404)
  })

  it('reset-password returns 404 when target is a guardian without TenantUser record', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianWithoutTenantUser.id}/reset-password`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reason: 'Test reset' }),
    })
    const res = await resetPassword(req, { params: Promise.resolve({ id: guardianWithoutTenantUser.id }) })
    expect(res.status).toBe(404)
  })

  it('status transition returns 404 on nonexistent user ID without crashing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/status`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ action: 'suspend', reason: 'Test suspension' }),
    })
    const res = await transitionStatus(req, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(res.status).toBe(404)
  })

  it('status transition returns 404 when target is a guardian without TenantUser record', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianWithoutTenantUser.id}/status`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ action: 'suspend', reason: 'Test suspension' }),
    })
    const res = await transitionStatus(req, { params: Promise.resolve({ id: guardianWithoutTenantUser.id }) })
    expect(res.status).toBe(404)
  })

  it('unlock returns 404 on nonexistent user ID without crashing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/unlock`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reason: 'Test unlock' }),
    })
    const res = await unlockUser(req, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(res.status).toBe(404)
  })

  it('sessions GET & DELETE returns 404 on nonexistent user ID without crashing', async () => {
    const reqGet = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/sessions`, {
      method: 'GET',
      headers: { authorization: `Bearer ${ownerToken}` },
    })
    const resGet = await getSessions(reqGet, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(resGet.status).toBe(404)

    const reqDel = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/sessions`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${ownerToken}` },
    })
    const resDel = await deleteSessions(reqDel, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(resDel.status).toBe(404)
  })

  it('resend-invite returns 404 on nonexistent user ID without crashing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/resend-invite`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
    })
    const res = await resendInvite(req, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(res.status).toBe(404)
  })

  it('revoke-sessions returns 404 on nonexistent user ID without crashing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${fakeNonexistentId}/revoke-sessions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
    })
    const res = await revokeSessions(req, { params: Promise.resolve({ id: fakeNonexistentId }) })
    expect(res.status).toBe(404)
  })

  it('valid manageable staff user succeeds without error', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffUser.id}/reset-password`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reason: 'Valid admin reset' }),
    })
    const res = await resetPassword(req, { params: Promise.resolve({ id: staffUser.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.temporaryPassword).toBeDefined()
  })
})

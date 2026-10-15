import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as adminSessionsGet, DELETE as adminSessionsDelete } from '@/app/api/v1/users/[id]/sessions/route'
import { POST as revokeAllPost } from '@/app/api/v1/users/[id]/revoke-sessions/route'
import { SessionService } from '@/lib/users/session-service'

describe('Admin-Side Session Management (Doc 5.1 P2 Audit)', () => {
  let tenantA: any
  let branchA: any
  let tenantB: any
  let branchB: any

  let ownerA: any
  let teacherA: any
  let parentA: any
  let ownerB: any

  let ownerCookieA: string
  let teacherCookieA: string
  let principalCookieA: string
  let ownerCookieB: string

  let staffSession1: any
  let staffSession2: any
  let staffToken1: string
  let staffToken2: string

  const ts = `${Date.now()}`

  beforeAll(async () => {
    // 1. Create School A
    tenantA = await db.tenant.create({
      data: {
        name: `Session School A ${ts.slice(-4)}`,
        code: `SSA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Campus A',
        code: `MCA-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 2. Create School B (for isolation test)
    tenantB = await db.tenant.create({
      data: {
        name: `Session School B ${ts.slice(-4)}`,
        code: `SSB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'Main Campus B',
        code: `MCB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 3. Create Owner A
    ownerA = await db.user.create({
      data: {
        email: `owner.a.${ts}@preone.test`,
        fullName: 'Owner School A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA.id,
            role: 'OWNER',
            roles: ['OWNER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      name: ownerA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    ownerCookieA = `preone_session=${tokenOwnerA}`

    // 4. Create Teacher A
    teacherA = await db.user.create({
      data: {
        email: `teacher.a.${ts}@preone.test`,
        fullName: 'Teacher School A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA.id,
            role: 'TEACHER',
            roles: ['TEACHER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenTeacherA = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      name: teacherA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    teacherCookieA = `preone_session=${tokenTeacherA}`

    // 4b. Create Principal A (has users:write, but cannot manage Owner)
    const principalA = await db.user.create({
      data: {
        email: `principal.a.${ts}@preone.test`,
        fullName: 'Principal School A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA.id,
            role: 'PRINCIPAL',
            roles: ['PRINCIPAL'],
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenPrincipalA = await signSession({
      uid: principalA.id,
      email: principalA.email,
      name: principalA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    principalCookieA = `preone_session=${tokenPrincipalA}`

    // 5. Create Parent A
    parentA = await db.user.create({
      data: {
        email: `parent.a.${ts}@preone.test`,
        fullName: 'Parent School A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA.id,
            role: 'PARENT',
            roles: ['PARENT'],
            status: 'ACTIVE',
          },
        },
      },
    })

    // 6. Create Owner B
    ownerB = await db.user.create({
      data: {
        email: `owner.b.${ts}@preone.test`,
        fullName: 'Owner School B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenantB.id,
            branchId: branchB.id,
            role: 'OWNER',
            roles: ['OWNER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    const tokenOwnerB = await signSession({
      uid: ownerB.id,
      email: ownerB.email,
      name: ownerB.fullName,
      tenantId: tenantB.id,
      branchId: branchB.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    ownerCookieB = `preone_session=${tokenOwnerB}`

    // 7. Seed active sessions for Teacher A (Device 1: Desktop, Device 2: Mobile)
    staffToken1 = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      name: teacherA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })

    staffSession1 = await db.userSession.create({
      data: {
        userId: teacherA.id,
        tenantId: tenantA.id,
        tokenHash: SessionService.hashToken(staffToken1),
        device: 'Desktop (Chrome)',
        platform: 'Windows 11',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    staffToken2 = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      name: teacherA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tokenVersion: 0,
      mustChangePassword: false,
    })

    staffSession2 = await db.userSession.create({
      data: {
        userId: teacherA.id,
        tenantId: tenantA.id,
        tokenHash: SessionService.hashToken(staffToken2),
        device: 'Mobile (Safari)',
        platform: 'iOS',
        ipAddress: '10.0.0.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Seed session for Parent A
    const parentToken = await signSession({
      uid: parentA.id,
      email: parentA.email,
      name: parentA.fullName,
      tenantId: tenantA.id,
      branchId: branchA.id,
      role: 'PARENT',
      roles: ['PARENT'],
      tokenVersion: 0,
      mustChangePassword: false,
    })
    await db.userSession.create({
      data: {
        userId: parentA.id,
        tenantId: tenantA.id,
        tokenHash: SessionService.hashToken(parentToken),
        device: 'Mobile (Android)',
        platform: 'Android',
        ipAddress: '172.16.0.8',
        userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  })

  it('1. GET /api/v1/users/[id]/sessions allows admin to list active devices for a staff member', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${teacherA.id}/sessions`, {
      headers: { cookie: ownerCookieA },
    })

    const res = await adminSessionsGet(req, { params: Promise.resolve({ id: teacherA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(2)

    const devices = json.data.map((s: any) => s.device)
    expect(devices).toContain('Desktop (Chrome)')
    expect(devices).toContain('Mobile (Safari)')

    // Check session fields
    const desktopSession = json.data.find((s: any) => s.device === 'Desktop (Chrome)')
    expect(desktopSession.platform).toBe('Windows 11')
    expect(desktopSession.ipAddress).toBe('192.168.1.101')
    expect(desktopSession.status).toBe('ACTIVE')
  })

  it('2. GET /api/v1/users/[id]/sessions allows admin to list active devices for a parent user', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentA.id}/sessions`, {
      headers: { cookie: ownerCookieA },
    })

    const res = await adminSessionsGet(req, { params: Promise.resolve({ id: parentA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.length).toBe(1)
    expect(json.data[0].device).toBe('Mobile (Android)')
    expect(json.data[0].platform).toBe('Android')
  })

  it('3. GET /api/v1/users/[id]/sessions rejects cross-tenant inspection with 404', async () => {
    // Owner of School B attempts to inspect sessions of Teacher in School A
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${teacherA.id}/sessions`, {
      headers: { cookie: ownerCookieB },
    })

    const res = await adminSessionsGet(req, { params: Promise.resolve({ id: teacherA.id }) })
    expect(res.status).toBe(404)
  })

  it('4. DELETE /api/v1/users/[id]/sessions?sessionId=... revokes a specific device session', async () => {
    // Revoke staffSession1 (Desktop)
    const req = new NextRequest(
      `http://localhost:3000/api/v1/users/${teacherA.id}/sessions?sessionId=${staffSession1.id}`,
      {
        method: 'DELETE',
        headers: { cookie: ownerCookieA },
      }
    )

    const res = await adminSessionsDelete(req, { params: Promise.resolve({ id: teacherA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.revoked).toBe(true)
    expect(json.data.sessionId).toBe(staffSession1.id)

    // Verify session 1 is REVOKED in database
    const dbSession1 = await db.userSession.findUnique({ where: { id: staffSession1.id } })
    expect(dbSession1?.status).toBe('REVOKED')

    // Verify session 2 is still ACTIVE in database
    const dbSession2 = await db.userSession.findUnique({ where: { id: staffSession2.id } })
    expect(dbSession2?.status).toBe('ACTIVE')

    // Verify staffToken1 is rejected by SessionService.validateSession
    const val1 = await SessionService.validateSession(staffToken1)
    expect(val1.valid).toBe(false)
    expect(val1.reason).toBe('SESSION_REVOKED')

    // Verify staffToken2 remains valid
    const val2 = await SessionService.validateSession(staffToken2)
    expect(val2.valid).toBe(true)

    // Audit log was recorded
    const audit = await db.auditLog.findFirst({
      where: {
        tenantId: tenantA.id,
        action: 'REVOKE_DEVICE_SESSION',
        entityId: staffSession1.id,
      },
    })
    expect(audit).toBeDefined()
  })

  it('5. POST /api/v1/users/[id]/revoke-sessions performs nuclear revocation of all active sessions', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${teacherA.id}/revoke-sessions`, {
      method: 'POST',
      headers: { cookie: ownerCookieA },
    })

    const res = await revokeAllPost(req, { params: Promise.resolve({ id: teacherA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.revoked).toBe(true)

    // Verify session 2 is now REVOKED
    const dbSession2 = await db.userSession.findUnique({ where: { id: staffSession2.id } })
    expect(dbSession2?.status).toBe('REVOKED')

    // Verify tokenVersion was bumped
    const secMeta = await SessionService.getUserSecurityMeta(teacherA.id)
    expect(secMeta.tokenVersion).toBeGreaterThan(0)

    // Verify staffToken2 is now stale/rejected (either by DB session revocation or tokenVersion bump)
    const val2 = await SessionService.validateSession(staffToken2)
    expect(val2.valid).toBe(false)
    expect(['SESSION_REVOKED', 'TOKEN_VERSION_STALE']).toContain(val2.reason)
  })

  it('6. Hierarchy protection: Teacher (insufficient permission) gets 401; Principal cannot revoke Owner (403)', async () => {
    // 1. Teacher lacks users:write permission -> 401
    const reqTeacher = new NextRequest(
      `http://localhost:3000/api/v1/users/${ownerA.id}/sessions?sessionId=dummy`,
      {
        method: 'DELETE',
        headers: { cookie: teacherCookieA },
      }
    )
    const resTeacher = await adminSessionsDelete(reqTeacher, { params: Promise.resolve({ id: ownerA.id }) })
    expect(resTeacher.status).toBe(401)

    // 2. Principal has users:write, but cannot manage Owner -> 403
    const reqPrincipal = new NextRequest(
      `http://localhost:3000/api/v1/users/${ownerA.id}/sessions?sessionId=dummy`,
      {
        method: 'DELETE',
        headers: { cookie: principalCookieA },
      }
    )
    const resPrincipal = await adminSessionsDelete(reqPrincipal, { params: Promise.resolve({ id: ownerA.id }) })
    expect(resPrincipal.status).toBe(403)
  })
})

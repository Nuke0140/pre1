import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

describe('B1 — Login Resilience Test Suite', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let activeUser: any
  let lockedUser: any
  let suspendedUser: any
  let multiRoleUser: any
  let noMembershipUser: any

  beforeAll(async () => {
    // 1. Create isolated test tenant
    testTenant = await db.tenant.create({
      data: {
        code: `B1-TENANT-${ts.slice(-6)}`,
        name: `B1 Resilience Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('Resilience@123', 10)

    // 2. Active User with school membership
    activeUser = await db.user.create({
      data: {
        email: `b1.active.${ts}@test.com`,
        username: `b1_active_${ts}`,
        fullName: 'B1 Active Educator',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: activeUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })

    // 3. Locked User
    lockedUser = await db.user.create({
      data: {
        email: `b1.locked.${ts}@test.com`,
        username: `b1_locked_${ts}`,
        fullName: 'B1 Locked User',
        passwordHash,
        status: 'LOCKED',
      },
    })

    // 4. Suspended User
    suspendedUser = await db.user.create({
      data: {
        email: `b1.suspended.${ts}@test.com`,
        username: `b1_suspended_${ts}`,
        fullName: 'B1 Suspended User',
        passwordHash,
        status: 'SUSPENDED',
      },
    })

    // 5. Multi-Role User (Teacher + Accounts)
    multiRoleUser = await db.user.create({
      data: {
        email: `b1.multirole.${ts}@test.com`,
        username: `b1_multirole_${ts}`,
        fullName: 'B1 MultiRole Staff',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: multiRoleUser.id,
        role: 'TEACHER',
        roles: ['TEACHER', 'ACCOUNTS'],
        status: 'ACTIVE',
      },
    })

    // 6. User without school membership (Platform Admin scope)
    noMembershipUser = await db.user.create({
      data: {
        email: `b1.platform.${ts}@test.com`,
        username: `b1_platform_${ts}`,
        fullName: 'B1 Platform Operator',
        passwordHash,
        status: 'ACTIVE',
      },
    })
  })

  it('B1-01: Valid credentials return HTTP 200, user payload, roles, and session cookie', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: activeUser.email,
        password: 'Resilience@123',
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.user.email).toBe(activeUser.email)
    expect(json.data.user.role).toBe('TEACHER')
    expect(json.data.user.tenant.id).toBe(testTenant.id)

    const cookie = res.headers.get('set-cookie')
    expect(cookie).not.toBeNull()
    expect(cookie).toContain('preone_session=')
    expect(cookie).toContain('HttpOnly')
  })

  it('B1-02: Missing fields return HTTP 400 VALIDATION_001', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_001')
  })

  it('B1-03: Malformed JSON returns HTTP 400 VALIDATION_001 without crashing', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json-{',
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_001')
  })

  it('B1-04: Unknown user returns generic HTTP 401 AUTH_003 without enumerating', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: `nonexistent_${Date.now()}@domain.com`,
        password: 'RandomPassword123!',
      }),
    })
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('AUTH_003')
  })

  it('B1-05: Invalid password returns HTTP 401 AUTH_003', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: activeUser.email,
        password: 'IncorrectPassword!',
      }),
    })
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('AUTH_003')
  })

  it('B1-06: Locked account returns HTTP 423 ACCOUNT_LOCKED', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: lockedUser.email,
        password: 'Resilience@123',
      }),
    })
    expect(res.status).toBe(423)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('ACCOUNT_LOCKED')
  })

  it('B1-07: Suspended account returns HTTP 403 ACCOUNT_SUSPENDED', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: suspendedUser.email,
        password: 'Resilience@123',
      }),
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('B1-08: Multi-role user resolves unified roles array', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: multiRoleUser.email,
        password: 'Resilience@123',
      }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.user.role).toBe('TEACHER')
    expect(json.data.user.roles).toContain('TEACHER')
    expect(json.data.user.roles).toContain('ACCOUNTS')
  })

  it('B1-09: User without school membership resolves PLATFORM_ADMIN', async () => {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: noMembershipUser.email,
        password: 'Resilience@123',
      }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.user.role).toBe('PLATFORM_ADMIN')
    expect(json.data.user.tenant).toBeNull()
  })
})

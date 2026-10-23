import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { POST as loginPost } from '@/app/api/v1/auth/login/route'
import { POST as otpPost } from '@/app/api/v1/auth/otp/route'
import { POST as resetPasswordPost } from '@/app/api/v1/users/[id]/reset-password/route'
import { middleware } from '@/proxy'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { UserIdentityService } from '@/lib/users/user-identity-service'
import bcrypt from 'bcryptjs'

describe('PR-30: Parent Password Change Exemption & Auto-Healing', () => {
  let testTenantId: string
  let testParentUser: any
  let testStaffUser: any
  let adminSessionCookie: string

  beforeAll(async () => {
    const ts = Date.now()
    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)

    // 1. Create a test tenant
    const tenant = await db.tenant.create({
      data: {
        name: `Parent Exemption Test Tenant ${ts}`,
        code: `PR30_${ts.toString().slice(-6)}`,
        status: 'ACTIVE',
      },
    })
    testTenantId = tenant.id

    // 2. Create parent user with stale mustChangePassword: true
    testParentUser = await db.user.create({
      data: {
        email: `parent_pr30_${ts}@example.com`,
        username: `parent_pr30_${ts}`,
        fullName: 'Parent Test User',
        phone: `919${ts.toString().slice(-7)}`,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: true, // Stale flag to be auto-healed
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: testTenantId,
        userId: testParentUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })

    // 3. Create staff user with mustChangePassword: true
    testStaffUser = await db.user.create({
      data: {
        email: `staff_pr30_${ts}@example.com`,
        username: `staff_pr30_${ts}`,
        fullName: 'Staff Test Teacher',
        phone: `918${ts.toString().slice(-7)}`,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: true,
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: testTenantId,
        userId: testStaffUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })

    // 4. Create admin user and cookie for resetting passwords
    const adminUser = await db.user.create({
      data: {
        email: `admin_pr30_${ts}@example.com`,
        username: `admin_pr30_${ts}`,
        fullName: 'Admin Test User',
        phone: `917${ts.toString().slice(-7)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: testTenantId,
        userId: adminUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    const adminToken = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: testTenantId,
      role: 'OWNER',
      roles: ['OWNER'],
    })
    adminSessionCookie = `${SESSION_COOKIE}=${adminToken}`
  })

  afterAll(async () => {
    try {
      await db.tenantUser.deleteMany({ where: { tenantId: testTenantId } }).catch(() => {})
      await db.tenant.delete({ where: { id: testTenantId } }).catch(() => {})
      if (testParentUser?.id) await db.user.delete({ where: { id: testParentUser.id } }).catch(() => {})
      if (testStaffUser?.id) await db.user.delete({ where: { id: testStaffUser.id } }).catch(() => {})
    } catch {}
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Login Endpoint Auto-Healing for Parent Role
  // ───────────────────────────────────────────────────────────────────────────
  it('1. POST /api/v1/auth/login auto-heals parent mustChangePassword flag to false in DB and session', async () => {
    // Confirm initial state is mustChangePassword: true
    const before = await db.user.findUnique({ where: { id: testParentUser.id } })
    expect(before?.mustChangePassword).toBe(true)

    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentUser.email,
        password: 'SecurePassword@123',
      }),
    })

    const res = await loginPost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.user.mustChangePassword).toBe(false)

    // Verify DB flag was auto-healed to false
    const after = await db.user.findUnique({ where: { id: testParentUser.id } })
    expect(after?.mustChangePassword).toBe(false)
  })

  it('2. POST /api/v1/auth/login retains mustChangePassword: true for staff roles', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStaffUser.email,
        password: 'SecurePassword@123',
      }),
    })

    const res = await loginPost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.user.mustChangePassword).toBe(true)

    // Staff DB flag must remain true
    const after = await db.user.findUnique({ where: { id: testStaffUser.id } })
    expect(after?.mustChangePassword).toBe(true)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. OTP Verification Auto-Healing for Parent Role
  // ───────────────────────────────────────────────────────────────────────────
  it('3. POST /api/v1/auth/otp/verify auto-heals parent mustChangePassword flag to false', async () => {
    // Reset parent user flag to true
    await db.user.update({
      where: { id: testParentUser.id },
      data: { mustChangePassword: true },
    })

    // Request OTP
    const reqSend = new NextRequest('http://localhost:3000/api/v1/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        identifier: testParentUser.email,
      }),
    })
    const resSend = await otpPost(reqSend)
    expect(resSend.status).toBe(200)

    // Verify with demo bypass in non-production
    const reqVerify = new NextRequest('http://localhost:3000/api/v1/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        identifier: testParentUser.email,
        code: '0000',
      }),
    })
    const resVerify = await otpPost(reqVerify)
    const jsonVerify = await resVerify.json()

    expect(resVerify.status).toBe(200)
    expect(jsonVerify.success).toBe(true)
    expect(jsonVerify.data.user.mustChangePassword).toBe(false)

    // Verify DB flag auto-healed
    const after = await db.user.findUnique({ where: { id: testParentUser.id } })
    expect(after?.mustChangePassword).toBe(false)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Middleware Navigation: Parent vs Staff
  // ───────────────────────────────────────────────────────────────────────────
  it('4. Middleware forwards parents landing on /app/change-password directly to /app/dashboard', async () => {
    const parentToken = await signSession({
      uid: testParentUser.id,
      email: testParentUser.email,
      name: testParentUser.fullName,
      tenantId: testTenantId,
      role: 'PARENT',
      roles: ['PARENT'],
      mustChangePassword: true, // Even if token has stale flag
    })

    const req = new NextRequest('http://localhost:3000/app/change-password', {
      headers: { cookie: `${SESSION_COOKIE}=${parentToken}` },
    })

    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/app/dashboard')
  })

  it('5. Middleware redirects staff with mustChangePassword: true to /app/change-password', async () => {
    const staffToken = await signSession({
      uid: testStaffUser.id,
      email: testStaffUser.email,
      name: testStaffUser.fullName,
      tenantId: testTenantId,
      role: 'TEACHER',
      roles: ['TEACHER'],
      mustChangePassword: true,
    })

    const req = new NextRequest('http://localhost:3000/app/dashboard', {
      headers: { cookie: `${SESSION_COOKIE}=${staffToken}` },
    })

    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/app/change-password')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Admin Reset Password Endpoint: Role-Aware mustChangePassword Default
  // ───────────────────────────────────────────────────────────────────────────
  it('6. POST /api/v1/users/[id]/reset-password sets mustChangePassword: false for parent', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${testParentUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        cookie: adminSessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customPassword: 'NewParentPassword@123',
      }),
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: testParentUser.id }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    const updatedParent = await db.user.findUnique({ where: { id: testParentUser.id } })
    expect(updatedParent?.mustChangePassword).toBe(false)
  })

  it('7. POST /api/v1/users/[id]/reset-password sets mustChangePassword: true for staff', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${testStaffUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        cookie: adminSessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customPassword: 'NewStaffPassword@123',
      }),
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: testStaffUser.id }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    const updatedStaff = await db.user.findUnique({ where: { id: testStaffUser.id } })
    expect(updatedStaff?.mustChangePassword).toBe(true)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. UserIdentityService: Initial Account Provisioning
  // ───────────────────────────────────────────────────────────────────────────
  it('8. UserIdentityService provisions PARENT with mustChangePassword: false', async () => {
    const ts = Date.now()
    const result = await UserIdentityService.resolveOrCreateUser(db as any, {
      fullName: 'New Parent Auto',
      email: `newparent_${ts}@example.com`,
      phone: `916${ts.toString().slice(-7)}`,
      usernameType: 'PARENT',
    })

    expect(result.user.mustChangePassword).toBe(false)

    // Cleanup
    await db.user.delete({ where: { id: result.user.id } })
  })
})

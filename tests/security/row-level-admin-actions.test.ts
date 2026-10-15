import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as statusPost } from '@/app/api/v1/users/[id]/status/route'
import { POST as resetPasswordPost } from '@/app/api/v1/users/[id]/reset-password/route'
import { POST as unlockPost } from '@/app/api/v1/users/[id]/unlock/route'
import { POST as resendInvitePost } from '@/app/api/v1/users/[id]/resend-invite/route'
import { POST as invitationsPost } from '@/app/api/v1/users/invitations/route'
import { SessionService } from '@/lib/users/session-service'
import { recordFailedAttempt, getFailedAttempts } from '@/lib/auth/lockout-tracker'

describe('Row-Level Admin Actions (suspend/reset/unlock/resend — Doc N-4)', () => {
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let principalA: any
  let teacherA: any
  let staffTarget: any
  let cookieOwnerA: string
  let cookiePrincipalA: string
  let cookieTeacherA: string
  let cookieTenantB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        name: `Row Actions School A ${ts}`,
        code: `RWA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Tenant B (for cross-tenant checks)
    tenantB = await db.tenant.create({
      data: {
        name: `Row Actions School B ${ts}`,
        code: `RWB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 3. Setup Owner A
    ownerA = await db.user.create({
      data: {
        email: `ownerA_${ts}@rowactions.com`,
        username: `ownerA_${ts}`,
        fullName: 'Owner Admin A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      name: ownerA.fullName,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // 4. Setup Principal A
    principalA = await db.user.create({
      data: {
        email: `principalA_${ts}@rowactions.com`,
        username: `principalA_${ts}`,
        fullName: 'Principal Admin A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: principalA.id,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    })

    cookiePrincipalA = await signSession({
      uid: principalA.id,
      email: principalA.email,
      name: principalA.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantA.id,
    })

    // 5. Setup Teacher A (lacks users:write)
    teacherA = await db.user.create({
      data: {
        email: `teacherA_${ts}@rowactions.com`,
        username: `teacherA_${ts}`,
        fullName: 'Teacher A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    cookieTeacherA = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      name: teacherA.fullName,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })

    // 6. Setup Admin in Tenant B
    const adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@rowactions.com`,
        username: `adminB_${ts}`,
        fullName: 'Admin B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: adminB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieTenantB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      name: adminB.fullName,
      role: 'OWNER',
      tenantId: tenantB.id,
    })

    // 7. Setup target Staff user in Tenant A
    staffTarget = await db.user.create({
      data: {
        email: `staffTarget_${ts}@rowactions.com`,
        username: `staffTarget_${ts}`,
        fullName: 'Target Staff User',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: staffTarget.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })
  })

  // ──────────────────────────────────────────────────────────
  // 1. SUSPEND & REACTIVATE ACTIONS
  // ──────────────────────────────────────────────────────────
  it('1. POST /api/v1/users/[id]/status with action: suspend immediately halts access and revokes sessions', async () => {
    // Create an active session for the staff user
    const token = await signSession({
      uid: staffTarget.id,
      email: staffTarget.email,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })
    await SessionService.createSession({
      userId: staffTarget.id,
      tenantId: tenantA.id,
      token,
      device: 'Chrome on MacOS',
    })

    // Verify session is initially valid
    const preValid = await SessionService.validateSession(token)
    expect(preValid.valid).toBe(true)

    // Admin suspends the user
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        action: 'suspend',
        reason: 'Administrative policy review',
      }),
    })

    const res = await statusPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data?.status || json.status).toBe('SUSPENDED')

    // Verify tenantUser record in database
    const member = await db.tenantUser.findFirst({
      where: { userId: staffTarget.id, tenantId: tenantA.id },
    })
    expect(member?.status).toBe('SUSPENDED')

    // Verify active session was instantly revoked
    const postValid = await SessionService.validateSession(token)
    expect(postValid.valid).toBe(false)

    // Verify canonical audit record
    const auditRecord = await db.auditLog.findFirst({
      where: {
        entityId: staffTarget.id,
        action: 'USER_SUSPENDED',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(auditRecord).not.toBeNull()
    expect(auditRecord?.actorId).toBe(principalA.id)
  })

  it('2. POST /api/v1/users/[id]/status with action: activate restores account to ACTIVE', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        action: 'activate',
      }),
    })

    const res = await statusPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data?.status || json.status).toBe('ACTIVE')

    const member = await db.tenantUser.findFirst({
      where: { userId: staffTarget.id, tenantId: tenantA.id },
    })
    expect(member?.status).toBe('ACTIVE')
  })

  // ──────────────────────────────────────────────────────────
  // 2. UNLOCK ACTION
  // ──────────────────────────────────────────────────────────
  it('3. POST /api/v1/users/[id]/unlock clears persistent and in-memory failed attempts and unlocks account', async () => {
    // Simulate failed login attempts lockout
    await db.user.update({
      where: { id: staffTarget.id },
      data: {
        status: 'LOCKED',
        failedLoginAttempts: 5,
        lastFailedLoginAt: new Date(),
      },
    })
    await db.tenantUser.updateMany({
      where: { userId: staffTarget.id, tenantId: tenantA.id },
      data: { status: 'LOCKED' },
    })
    recordFailedAttempt(staffTarget.id)
    recordFailedAttempt(staffTarget.email)

    // Admin unlocks the user
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        reason: 'Front desk identity verification completed',
      }),
    })

    const res = await unlockPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.status || json.status).toBe('ACTIVE')

    // Verify DB status is ACTIVE and failedLoginAttempts is 0
    const dbUser = await db.user.findUnique({ where: { id: staffTarget.id } })
    expect(dbUser?.status).toBe('ACTIVE')
    expect(dbUser?.failedLoginAttempts).toBe(0)
    expect(dbUser?.lastFailedLoginAt).toBeNull()

    const dbMember = await db.tenantUser.findFirst({
      where: { userId: staffTarget.id, tenantId: tenantA.id },
    })
    expect(dbMember?.status).toBe('ACTIVE')

    // Verify in-memory failed attempts cleared
    expect(getFailedAttempts(staffTarget.email)).toBe(0)

    // Verify audit log
    const auditRecord = await db.auditLog.findFirst({
      where: {
        entityId: staffTarget.id,
        action: 'USER_UNLOCKED',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(auditRecord).not.toBeNull()
  })

  // ──────────────────────────────────────────────────────────
  // 3. RESET PASSWORD ACTION
  // ──────────────────────────────────────────────────────────
  it('4. POST /api/v1/users/[id]/reset-password auto-generates temporary password, sets mustChangePassword, and invalidates sessions', async () => {
    // Create an active session
    const token = await signSession({
      uid: staffTarget.id,
      email: staffTarget.email,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })
    await SessionService.createSession({
      userId: staffTarget.id,
      tenantId: tenantA.id,
      token,
      device: 'Firefox on Windows',
    })

    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        sendEmail: true,
        reason: 'Forgotten credentials support ticket',
      }),
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    const tempPass = json.data?.temporaryPassword || json.temporaryPassword
    expect(typeof tempPass).toBe('string')
    expect(tempPass.length).toBeGreaterThanOrEqual(8)
    expect(json.data?.mustChangePassword ?? json.mustChangePassword).toBe(true)

    // Verify user record has mustChangePassword = true
    const updatedUser = await db.user.findUnique({ where: { id: staffTarget.id } })
    expect(updatedUser?.mustChangePassword).toBe(true)

    // Verify previous session was invalidated
    const sessionCheck = await SessionService.validateSession(token)
    expect(sessionCheck.valid).toBe(false)

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        entityId: staffTarget.id,
        action: 'ADMIN_PASSWORD_RESET',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.actorId).toBe(principalA.id)
  })

  it('5. POST /api/v1/users/[id]/reset-password rejects custom passwords shorter than 8 characters', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        password: 'short', // 5 chars, violates 8-char policy floor
      }),
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error?.code || json.code).toBe('INVALID_PASSWORD_POLICY')
  })

  it('6. POST /api/v1/users/[id]/reset-password accepts custom password meeting >= 8 char policy', async () => {
    const customPass = `PreOneSecure@${ts.slice(-4)}`
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        password: customPass,
      }),
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.temporaryPassword || json.temporaryPassword).toBe(customPass)
  })

  // ──────────────────────────────────────────────────────────
  // 4. RESEND INVITATION / WELCOME ACTION
  // ──────────────────────────────────────────────────────────
  it('7. POST /api/v1/users/[id]/resend-invite sends welcome email to ACTIVE user', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/resend-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
    })

    const res = await resendInvitePost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.message || json.message).toContain(staffTarget.email)

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        entityId: staffTarget.id,
        action: 'RESEND_WELCOME',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  it('8. POST /api/v1/users/invitations with action: resend supports both PENDING and ACTIVE members', async () => {
    // 1. Create a PENDING staff member
    const pendingUser = await db.user.create({
      data: {
        email: `pendingStaff_${ts}@rowactions.com`,
        username: `pendingStaff_${ts}`,
        fullName: 'Pending Staff',
        status: 'PENDING',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: pendingUser.id,
        role: 'TEACHER',
        status: 'PENDING',
      },
    })

    const req = new NextRequest('http://localhost:3000/api/v1/users/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
      body: JSON.stringify({
        action: 'resend',
        userId: pendingUser.id,
      }),
    })

    const res = await invitationsPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const audit = await db.auditLog.findFirst({
      where: {
        entityId: pendingUser.id,
        action: 'RESEND_INVITATION',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  it('9. POST /api/v1/users/[id]/resend-invite fails with 400 if user has no email', async () => {
    const noEmailUser = await db.user.create({
      data: {
        email: null,
        username: `noemail_${ts}`,
        fullName: 'No Email User',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: noEmailUser.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/v1/users/${noEmailUser.id}/resend-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
    })

    const res = await resendInvitePost(req, { params: Promise.resolve({ id: noEmailUser.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error?.code || json.code).toBe('MISSING_EMAIL')
  })

  // ──────────────────────────────────────────────────────────
  // 5. SECURITY GUARDS & HIERARCHY PROTECTIONS
  // ──────────────────────────────────────────────────────────
  it('10. Unprivileged teacher lacking users:write is rejected with 401/403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieTeacherA}`,
      },
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect([401, 403]).toContain(res.status)
  })

  it('11. Principal cannot suspend or reset password of an Owner (hierarchy protection -> 403)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${ownerA.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookiePrincipalA}`,
      },
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: ownerA.id }) })
    expect(res.status).toBe(403)
  })

  it('12. Admin cannot suspend their own active account (self-suspension guard -> 400)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${ownerA.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'suspend',
      }),
    })

    const res = await statusPost(req, { params: Promise.resolve({ id: ownerA.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error?.code || json.code).toBe('CANNOT_SUSPEND_SELF')
  })

  it('13. Cross-tenant user administration is blocked with 404', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieTenantB}`,
      },
    })

    const res = await resetPasswordPost(req, { params: Promise.resolve({ id: staffTarget.id }) })
    expect(res.status).toBe(404)
  })
})

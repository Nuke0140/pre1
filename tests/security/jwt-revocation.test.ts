import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { SessionService } from '@/lib/users/session-service'
import { SettingsService } from '@/lib/settings/settings-service'
import { PasswordResetService } from '@/lib/auth/password-reset-service'
import { UserLifecycleService } from '@/lib/users/user-lifecycle-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { getSession } from '@/lib/auth-server'
import bcrypt from 'bcryptjs'

describe('PreOne Security Audit — JWT Revocation & Token Versioning (Doc 1.1)', () => {
  let testTenant: any
  let testUser: any
  let testMembership: any
  const initialPassword = 'InitialSecurePassword@2026'

  beforeAll(async () => {
    // Setup isolated test tenant
    testTenant = await db.tenant.create({
      data: {
        code: `REV-T-${Date.now().toString().slice(-4)}`,
        name: `Revocation Test Campus ${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    // Setup test user with hashed password
    const passwordHash = await bcrypt.hash(initialPassword, 10)
    testUser = await db.user.create({
      data: {
        email: `revtest.${Date.now()}@example.com`,
        username: `revtest_${Date.now()}`,
        fullName: 'Revocation Test User',
        passwordHash,
        mustChangePassword: false,
        status: 'ACTIVE',
      },
    })

    testMembership = await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: testUser.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })
  })

  it('1. Token issued before a password change is immediately rejected after SettingsService.changePassword', async () => {
    // 1. Issue token and create active session for initial state
    const userMeta1 = await SessionService.getUserSecurityMeta(testUser.id)
    const oldToken = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: userMeta1.tokenVersion,
      passwordChangedAt: userMeta1.passwordChangedAt,
    })

    await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token: oldToken,
    })

    // Verify token is initially valid
    const checkBefore = await SessionService.validateSession(oldToken)
    expect(checkBefore.valid).toBe(true)

    // 2. User changes password
    const newPassword = 'BrandNewPassword@2026'
    const changeResult = await SettingsService.changePassword(
      testUser.id,
      initialPassword,
      newPassword,
      { id: testUser.id, name: testUser.fullName, role: 'STAFF' }
    )
    expect(changeResult.success).toBe(true)
    expect(changeResult.tokenVersion).toBeGreaterThan(userMeta1.tokenVersion)

    // 3. Verify the old token is now REJECTED
    const checkAfter = await SessionService.validateSession(oldToken)
    expect(checkAfter.valid).toBe(false)

    // 4. Verify getSession(req) with the old token returns null
    const dummyReq = new Request('http://localhost:3000/api/v1/auth/me', {
      headers: {
        authorization: `Bearer ${oldToken}`,
      },
    })
    const sessionRes = await getSession(dummyReq)
    expect(sessionRes).toBeNull()

    // 5. Issue a new refreshed token with the bumped tokenVersion
    const newToken = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: changeResult.tokenVersion,
      passwordChangedAt: changeResult.passwordChangedAt,
    })
    await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token: newToken,
    })

    const checkNew = await SessionService.validateSession(newToken)
    expect(checkNew.valid).toBe(true)
  })

  it('2. Password reset via PasswordResetService invalidates existing sessions and bumps tokenVersion', async () => {
    // 1. Issue an active token
    const userMeta = await SessionService.getUserSecurityMeta(testUser.id)
    const token = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: userMeta.tokenVersion,
      passwordChangedAt: userMeta.passwordChangedAt,
    })
    await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token,
    })

    expect((await SessionService.validateSession(token)).valid).toBe(true)

    // 2. Trigger password reset completion
    const resetUser = await db.user.findUnique({ where: { id: testUser.id } })
    const resetToken = await PasswordResetService.generateResetToken({
      id: testUser.id,
      email: testUser.email,
      passwordHash: resetUser!.passwordHash,
    })

    await PasswordResetService.completePasswordReset(resetToken, 'ResetPassword@2026')

    // 3. Verify previous token is invalidated
    const validation = await SessionService.validateSession(token)
    expect(validation.valid).toBe(false)
  })

  it('3. Explicit individual session revocation marks session REVOKED and invalidates only that token', async () => {
    const userMeta = await SessionService.getUserSecurityMeta(testUser.id)

    // Device 1 session
    const token1 = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: userMeta.tokenVersion,
      passwordChangedAt: userMeta.passwordChangedAt,
    })
    const session1 = await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token: token1,
    })

    // Device 2 session
    const token2 = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: userMeta.tokenVersion,
      passwordChangedAt: userMeta.passwordChangedAt,
    })
    await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token: token2,
    })

    expect((await SessionService.validateSession(token1)).valid).toBe(true)
    expect((await SessionService.validateSession(token2)).valid).toBe(true)

    // Revoke session 1
    const revoked = await SessionService.revokeSession(session1!.id, testUser.id)
    expect(revoked).toBe(true)

    // Session 1 is now invalid, session 2 remains valid
    expect((await SessionService.validateSession(token1)).valid).toBe(false)
    expect((await SessionService.validateSession(token2)).valid).toBe(true)
  })

  it('4. Global session revocation ("Sign Out All Devices") bumps tokenVersion and invalidates all prior tokens', async () => {
    const userMeta = await SessionService.getUserSecurityMeta(testUser.id)

    const tokenA = await signSession({
      uid: testUser.id,
      email: testUser.email,
      name: testUser.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: userMeta.tokenVersion,
      passwordChangedAt: userMeta.passwordChangedAt,
    })
    await SessionService.createSession({
      userId: testUser.id,
      tenantId: testTenant.id,
      token: tokenA,
    })

    expect((await SessionService.validateSession(tokenA)).valid).toBe(true)

    // Simulate "Sign Out All Devices": bump tokenVersion and revoke all sessions
    await SessionService.bumpTokenVersion(testUser.id)
    await SessionService.revokeAllUserSessions(testUser.id)

    expect((await SessionService.validateSession(tokenA)).valid).toBe(false)
  })

  it('5. User account suspension immediately invalidates all active tokens in validateSession and getSession', async () => {
    // Create an isolated user for suspension test
    const victim = await db.user.create({
      data: {
        email: `victim.${Date.now()}@example.com`,
        username: `victim_${Date.now()}`,
        fullName: 'Victim User',
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    })
    const victimMember = await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: victim.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })

    const token = await signSession({
      uid: victim.id,
      email: victim.email,
      name: victim.fullName,
      tenantId: testTenant.id,
      role: 'STAFF',
      tokenVersion: 0,
    })
    await SessionService.createSession({
      userId: victim.id,
      tenantId: testTenant.id,
      token,
    })

    expect((await SessionService.validateSession(token)).valid).toBe(true)

    // Suspend user
    const res = await UserLifecycleService.transitionUserStatus({
      member: {
        id: victimMember.id,
        userId: victim.id,
        role: 'STAFF',
        status: 'ACTIVE',
        user: { fullName: victim.fullName },
      },
      actorSession: {
        uid: 'admin-actor',
        name: 'Admin Actor',
        role: 'OWNER',
        tenantId: testTenant.id,
      },
      targetStatus: 'SUSPENDED',
      reason: 'Policy violation',
    })
    expect(res.success).toBe(true)

    // Verify token is rejected immediately
    const check = await SessionService.validateSession(token)
    expect(check.valid).toBe(false)

    // Verify getSession with cookie returns null
    const cookieReq = new Request('http://localhost:3000/api/v1/auth/me', {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    })
    const sessionRes = await getSession(cookieReq)
    expect(sessionRes).toBeNull()
  })
})

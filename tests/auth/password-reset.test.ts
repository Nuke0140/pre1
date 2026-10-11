import { describe, it, expect, beforeAll, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { PasswordResetService } from '@/lib/auth/password-reset-service'
import { MockEmailProvider, emailService } from '@/lib/email/email-service'
import bcrypt from 'bcryptjs'

describe('B3 — Password Reset & Staff Onboarding Test Suite', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let testUser: any
  let mockEmail: MockEmailProvider

  beforeAll(async () => {
    testTenant = await db.tenant.create({
      data: {
        code: `B3-AUTH-${ts.slice(-5)}`,
        name: `B3 Auth Campus ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('OriginalPass@123', 10)

    testUser = await db.user.create({
      data: {
        email: `reset.user.${ts}@test.com`,
        username: `reset_user_${ts}`,
        fullName: 'Password Reset Tester',
        passwordHash,
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: testUser.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })
  })

  beforeEach(() => {
    mockEmail = new MockEmailProvider()
    emailService.setProvider(mockEmail)
  })

  it('B3-01: Request password reset returns generic success and sends email with secure token', async () => {
    const res = await PasswordResetService.requestPasswordReset(testUser.email)
    expect(res.success).toBe(true)
    expect(res.message).toContain('If an account exists')

    // Verify email was sent
    expect(mockEmail.sentMessages.length).toBe(1)
    const email = mockEmail.sentMessages[0]
    expect(email.options.to).toBe(testUser.email)
    expect(email.options.subject).toContain('Password Reset')
    expect(email.options.html).toContain('/auth/reset-password?token=')
  })

  it('B3-02: Request reset for nonexistent user returns identical generic response without leaking', async () => {
    mockEmail.clear()
    const res = await PasswordResetService.requestPasswordReset('nonexistent_user_999@test.com')
    expect(res.success).toBe(true)
    expect(res.message).toContain('If an account exists')
    // No email should be sent
    expect(mockEmail.sentMessages.length).toBe(0)
  })

  it('B3-03: Valid token can be verified and used to update password', async () => {
    // 1. Generate token
    const token = await PasswordResetService.generateResetToken(testUser)

    // 2. Verify token
    const verification = await PasswordResetService.verifyResetToken(token)
    expect(verification.valid).toBe(true)
    expect(verification.userId).toBe(testUser.id)

    // 3. Complete password reset
    const completion = await PasswordResetService.completePasswordReset(token, 'NewSecurePassword@456')
    expect(completion.success).toBe(true)

    // 4. Verify password was updated in DB
    const updated = await db.user.findUnique({ where: { id: testUser.id } })
    const match = await bcrypt.compare('NewSecurePassword@456', updated!.passwordHash)
    expect(match).toBe(true)
  })

  it('B3-04: Single-use enforcement: used token cannot be reused', async () => {
    // Generate token with current password
    const userNow = await db.user.findUnique({ where: { id: testUser.id } })
    const token = await PasswordResetService.generateResetToken(userNow!)

    // First use succeeds
    await PasswordResetService.completePasswordReset(token, 'AnotherNewPassword@789')

    // Second use with same token must fail
    expect(PasswordResetService.completePasswordReset(token, 'FailAttempt@123')).rejects.toThrow(
      'Reset token has already been used'
    )
  })

  it('B3-05: Password reset endpoint /api/v1/auth/reset-password handles request, verify, and complete actions', async () => {
    // 1. Request via API
    const reqRes = await fetch('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request',
        identifier: testUser.email,
      }),
    })
    expect(reqRes.status).toBe(200)

    // 2. Complete via API with invalid token should return 400
    const failRes = await fetch('http://localhost:3000/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        token: 'invalid.token.here',
        newPassword: 'Short',
      }),
    })
    expect(failRes.status).toBe(400)
    const json = await failRes.json()
    expect(json.success).toBe(false)
  })
})

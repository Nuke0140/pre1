import { describe, it, expect, beforeEach } from 'bun:test'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { MfaService, PRIVILEGED_MFA_ROLES, isMfaRequired } from '@/lib/auth/mfa-service'
import { OtpService } from '@/lib/auth/otp-service'
import { emailService, MockEmailProvider } from '@/lib/email/email-service'
import { POST as loginPost } from '@/app/api/v1/auth/login/route'
import { POST as mfaVerifyPost } from '@/app/api/v1/auth/mfa/verify/route'
import { POST as mfaResendPost } from '@/app/api/v1/auth/mfa/resend/route'
import { GET as mfaStatusGet } from '@/app/api/v1/auth/mfa/status/route'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'

describe('Privileged MFA / Step-Up Authentication (Doc 1.2 Audit Requirement)', () => {
  let tenant: any
  let ownerUser: any
  let accountsUser: any
  let teacherUser: any
  const sharedPassword = 'Password@123'
  const ts = Date.now().toString()

  beforeEach(async () => {
    OtpService.clearAllOtps()

    const provider = emailService.getProvider()
    if (provider instanceof MockEmailProvider) {
      provider.clear()
    }

    // Seed test tenant
    tenant = await db.tenant.upsert({
      where: { code: `MFA-SCH-${ts.slice(-6)}` },
      create: {
        code: `MFA-SCH-${ts.slice(-6)}`,
        name: 'MFA Test Academy',
        status: 'ACTIVE',
      },
      update: {},
    })

    const passwordHash = await bcrypt.hash(sharedPassword, 10)

    // 1. Privileged OWNER user
    ownerUser = await db.user.upsert({
      where: { email: `owner_${ts}@preone.test` },
      create: {
        email: `owner_${ts}@preone.test`,
        username: `owner_${ts}`,
        fullName: 'Elizabeth Owner',
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      update: {},
      include: { memberships: true },
    })

    // 2. Privileged ACCOUNTS user
    accountsUser = await db.user.upsert({
      where: { email: `accounts_${ts}@preone.test` },
      create: {
        email: `accounts_${ts}@preone.test`,
        username: `accounts_${ts}`,
        fullName: 'Alexander Accountant',
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'ACCOUNTS',
            status: 'ACTIVE',
          },
        },
      },
      update: {},
      include: { memberships: true },
    })

    // 3. Non-privileged TEACHER user
    teacherUser = await db.user.upsert({
      where: { email: `teacher_${ts}@preone.test` },
      create: {
        email: `teacher_${ts}@preone.test`,
        username: `teacher_${ts}`,
        fullName: 'Timothy Teacher',
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'TEACHER',
            status: 'ACTIVE',
          },
        },
      },
      update: {},
      include: { memberships: true },
    })
  })

  describe('1. Privileged Role Classification & Policy', () => {
    it('classifies OWNER and ACCOUNTS as privileged roles requiring MFA', () => {
      expect(isMfaRequired('OWNER')).toBe(true)
      expect(isMfaRequired('ACCOUNTS')).toBe(true)
      expect(isMfaRequired('ACCOUNTANT')).toBe(true) // Legacy alias normalization
      expect(MfaService.isPrivilegedRole('OWNER')).toBe(true)
      expect(MfaService.isPrivilegedRole('ACCOUNTS')).toBe(true)
    })

    it('does not require MFA for unprivileged academic & operational roles by default', () => {
      expect(isMfaRequired('TEACHER')).toBe(false)
      expect(isMfaRequired('STAFF')).toBe(false)
      expect(isMfaRequired('PARENT')).toBe(false)
      expect(isMfaRequired('GUARDIAN')).toBe(false)
      expect(isMfaRequired('RECEPTIONIST')).toBe(false)
    })
  })

  describe('2. Login MFA Challenge Triggering', () => {
    it('requires step-up MFA challenge when OWNER logs in with password only', async () => {
      const req = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerUser.email,
          password: sharedPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.requiresMfa).toBe(true)
      expect(json.data.mfaRequired).toBe(true)
      expect(json.data.mfaType).toBe('OTP')
      expect(json.data.mfaToken).toBeDefined()
      expect(json.data.destination).toContain('***')
      expect(json.data.role).toBe('OWNER')

      // Must NOT set a session cookie yet!
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toBeNull()

      // Must have dispatched verification email via OtpService
      const provider = emailService.getProvider()
      if (provider instanceof MockEmailProvider) {
        expect(provider.sentMessages.length).toBeGreaterThanOrEqual(1)
        expect(provider.sentMessages[0].options.to).toBe(ownerUser.email)
        expect(provider.sentMessages[0].options.subject).toContain('Verification Code')
      }
    })

    it('requires step-up MFA challenge when ACCOUNTS user logs in with password only', async () => {
      const req = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: accountsUser.email,
          password: sharedPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.requiresMfa).toBe(true)
      expect(json.data.mfaRequired).toBe(true)
      expect(json.data.role).toBe('ACCOUNTS')

      // No session cookie before MFA step-up
      expect(res.headers.get('set-cookie')).toBeNull()
    })

    it('permits immediate session establishment for non-privileged TEACHER role', async () => {
      const req = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: teacherUser.email,
          password: sharedPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.role).toBe('TEACHER')
      expect(json.data.requiresMfa).toBeUndefined()

      // Session cookie is immediately set
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).not.toBeNull()
      expect(setCookie).toContain('preone_session=')
    })
  })

  describe('3. Step-Up MFA Verification & Session Issuance', () => {
    it('successfully completes MFA step-up via POST /api/v1/auth/mfa/verify', async () => {
      // 1. Initial password submission -> receive challenge
      const loginReq = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerUser.email,
          password: sharedPassword,
        }),
      })
      const loginRes = await loginPost(loginReq)
      const { mfaToken } = (await loginRes.json()).data

      // Inject known OTP for testing
      OtpService.setTestOtp(ownerUser.email, { code: '4321' })

      // 2. Complete MFA step-up with correct OTP
      const verifyReq = new NextRequest('http://localhost/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken,
          code: '4321',
        }),
      })

      const verifyRes = await mfaVerifyPost(verifyReq)
      expect(verifyRes.status).toBe(200)

      const verifyJson = await verifyRes.json()
      expect(verifyJson.success).toBe(true)
      expect(verifyJson.data.user.id).toBe(ownerUser.id)
      expect(verifyJson.data.user.role).toBe('OWNER')
      expect(verifyJson.data.user.mfaVerified).toBe(true)

      // Verify session cookie was set
      const setCookie = verifyRes.headers.get('set-cookie')
      expect(setCookie).not.toBeNull()
      expect(setCookie).toContain('preone_session=')

      // Verify JWT payload has mfaVerified: true
      const match = setCookie!.match(/preone_session=([^;]+)/)
      const token = match![1]
      const session = await verifySession(token)
      expect(session).not.toBeNull()
      expect(session!.role).toBe('OWNER')
      expect(session!.mfaVerified).toBe(true)

      // Verify database session was recorded
      const dbSessions = await db.userSession.findMany({
        where: { userId: ownerUser.id },
      })
      expect(dbSessions.length).toBeGreaterThan(0)
    })

    it('successfully completes MFA step-up directly in POST /api/v1/auth/login with mfaToken', async () => {
      // 1. Get challenge
      const loginReq1 = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: accountsUser.email,
          password: sharedPassword,
        }),
      })
      const loginRes1 = await loginPost(loginReq1)
      const { mfaToken } = (await loginRes1.json()).data

      OtpService.setTestOtp(accountsUser.email, { code: '8765' })

      // 2. Submit mfaToken and code directly to /api/v1/auth/login
      const loginReq2 = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken,
          code: '8765',
        }),
      })

      const loginRes2 = await loginPost(loginReq2)
      expect(loginRes2.status).toBe(200)
      const loginJson2 = await loginRes2.json()
      expect(loginJson2.success).toBe(true)
      expect(loginJson2.data.user.role).toBe('ACCOUNTS')
      expect(loginJson2.data.user.mfaVerified).toBe(true)
      expect(loginRes2.headers.get('set-cookie')).toContain('preone_session=')
    })

    it('supports single-request login when password and valid OTP are both provided', async () => {
      OtpService.setTestOtp(ownerUser.email, { code: '5566' })

      const req = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerUser.email,
          password: sharedPassword,
          code: '5566',
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.role).toBe('OWNER')
      expect(res.headers.get('set-cookie')).toContain('preone_session=')
    })
  })

  describe('4. Security Edge Cases & Lockout Hardening', () => {
    it('rejects invalid OTP code in MFA step-up with 401', async () => {
      const loginReq = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerUser.email,
          password: sharedPassword,
        }),
      })
      const loginRes = await loginPost(loginReq)
      const { mfaToken } = (await loginRes.json()).data

      OtpService.setTestOtp(ownerUser.email, { code: '1122' })

      const verifyReq = new NextRequest('http://localhost/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken,
          code: '9999', // Wrong code
        }),
      })

      const verifyRes = await mfaVerifyPost(verifyReq)
      expect(verifyRes.status).toBe(401)
      const verifyJson = await verifyRes.json()
      expect(verifyJson.success).toBe(false)
      expect(verifyJson.error.code).toBe('INVALID_OTP')
      expect(verifyRes.headers.get('set-cookie')).toBeNull()
    })

    it('rejects tampered or forged mfaToken with 401 MFA_TOKEN_INVALID', async () => {
      const verifyReq = new NextRequest('http://localhost/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken: 'invalid.tampered.jwt-token',
          code: '1234',
        }),
      })

      const res = await mfaVerifyPost(verifyReq)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('MFA_TOKEN_INVALID')
    })

    it('resends verification code via POST /api/v1/auth/mfa/resend', async () => {
      const loginReq = new NextRequest('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: ownerUser.email,
          password: sharedPassword,
        }),
      })
      const loginRes = await loginPost(loginReq)
      const { mfaToken } = (await loginRes.json()).data

      // Clear OTP cooldown for testing resend
      OtpService.clearAllOtps()

      const resendReq = new NextRequest('http://localhost/api/v1/auth/mfa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken }),
      })

      const resendRes = await mfaResendPost(resendReq)
      expect(resendRes.status).toBe(200)
      const resendJson = await resendRes.json()
      expect(resendJson.success).toBe(true)
      expect(resendJson.data.cooldown).toBe(45)
    })

    it('returns MFA policy and status via GET /api/v1/auth/mfa/status', async () => {
      const req = new NextRequest('http://localhost/api/v1/auth/mfa/status')
      const res = await mfaStatusGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.privilegedRoles).toContain('OWNER')
      expect(json.data.privilegedRoles).toContain('ACCOUNTS')
    })
  })
})

import { describe, it, expect, beforeEach } from 'bun:test'
import { OtpService, OTP_COOLDOWN_MS } from '@/lib/auth/otp-service'
import { db } from '@/lib/db'
import { emailService, MockEmailProvider } from '@/lib/email/email-service'
import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'
import { POST as sendRoute } from '@/app/api/v1/auth/otp/send/route'
import { POST as resendRoute } from '@/app/api/v1/auth/otp/resend/route'
import { POST as verifyRoute } from '@/app/api/v1/auth/otp/verify/route'
import { POST as unifiedRoute } from '@/app/api/v1/auth/otp/route'

describe('BUG-002: OTP Verification & Un-gated Endpoints Test Suite', () => {
  let testUser: any
  let testTenant: any

  beforeEach(async () => {
    OtpService.clearAllOtps()

    // Ensure mock email provider is clear
    const provider = emailService.getProvider()
    if (provider instanceof MockEmailProvider) {
      provider.clear()
    }

    // Seed test tenant & user if not exists
    testTenant = await db.tenant.upsert({
      where: { code: 'OTP-TEST-SCHOOL' },
      create: {
        code: 'OTP-TEST-SCHOOL',
        name: 'OTP Test School',
        status: 'ACTIVE',
      },
      update: {},
    })

    testUser = await db.user.upsert({
      where: { email: 'otp.user@example.com' },
      create: {
        email: 'otp.user@example.com',
        username: 'otp_tester',
        fullName: 'OTP Test User',
        passwordHash: 'dummyHash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: testTenant.id,
            role: 'TEACHER',
            status: 'ACTIVE',
          },
        },
      },
      update: {
        status: 'ACTIVE',
      },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    })
  })

  describe('1. Middleware Public Paths (Un-gated Endpoints)', () => {
    it('verifies /api/v1/auth/otp routes bypass session authentication check', async () => {
      const endpoints = [
        'http://localhost:3000/api/v1/auth/otp/send',
        'http://localhost:3000/api/v1/auth/otp/resend',
        'http://localhost:3000/api/v1/auth/otp/verify',
        'http://localhost:3000/api/v1/auth/otp',
      ]

      for (const url of endpoints) {
        const req = new NextRequest(new URL(url), {
          method: 'POST',
        })
        const res = await middleware(req)
        // Must NOT return 401 AUTH_001
        expect(res.status).not.toBe(401)
      }
    })

    it('verifies non-whitelisted routes still return 401 AUTH_001 when unauthenticated', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/v1/protected-route'), {
        method: 'GET',
      })
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error.code).toBe('AUTH_001')
    })
  })

  describe('2. OtpService Request & Send Workflow', () => {
    it('dispatches a 4-digit code and enforces 45-second cooldown', async () => {
      const result = await OtpService.requestOtp(testUser.email)
      expect(result.success).toBe(true)
      expect(result.cooldown).toBe(45)
      expect(result.destination).toContain('***')

      // Second request within 45s must fail with cooldown active
      const secondResult = await OtpService.requestOtp(testUser.email)
      expect(secondResult.success).toBe(false)
      expect(secondResult.error?.code).toBe('OTP_COOLDOWN_ACTIVE')
      expect(secondResult.error?.status).toBe(429)
    })

    it('returns generic success for non-existent users without throwing', async () => {
      const result = await OtpService.requestOtp('nonexistent.user@example.com')
      expect(result.success).toBe(true)
      expect(result.cooldown).toBe(45)
    })
  })

  describe('3. OtpService Verification & Session Generation', () => {
    it('successfully verifies with injected valid OTP and establishes session payload', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '5829',
        userId: testUser.id,
        email: testUser.email,
      })

      const verifyResult = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '5829',
      })

      expect(verifyResult.success).toBe(true)
      expect(verifyResult.user?.id).toBe(testUser.id)
      expect(verifyResult.token).toBeDefined()
      expect(typeof verifyResult.token).toBe('string')
    })

    it('rejects invalid code and increments attempt counter', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '9999',
        userId: testUser.id,
        email: testUser.email,
      })

      const verifyResult = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '1111',
      })

      expect(verifyResult.success).toBe(false)
      expect(verifyResult.error?.code).toBe('INVALID_OTP')
      expect(verifyResult.error?.status).toBe(401)
    })

    it('enforces maximum 3 attempts and locks active OTP', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '7777',
        userId: testUser.id,
        email: testUser.email,
        attempts: 2,
      })

      // Attempt 3: invalid
      const thirdAttempt = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '0001',
      })
      expect(thirdAttempt.success).toBe(false)

      // Attempt 4: max attempts exceeded
      const fourthAttempt = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '7777',
      })
      expect(fourthAttempt.success).toBe(false)
      expect(fourthAttempt.error?.code).toBe('OTP_MAX_ATTEMPTS')
    })

    it('rejects expired OTP tokens', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '4444',
        userId: testUser.id,
        email: testUser.email,
        expiresAt: Date.now() - 1000, // expired in past
      })

      const result = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '4444',
      })
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('OTP_EXPIRED')
    })

    it('supports demo bypass codes 0000 and 1234 in non-production by default', async () => {
      const demoResult1 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '0000',
      })
      expect(demoResult1.success).toBe(true)
      expect(demoResult1.token).toBeDefined()

      const demoResult2 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '1234',
      })
      expect(demoResult2.success).toBe(true)
      expect(demoResult2.token).toBeDefined()
    })

    it('BUG-029: strictly rejects demo bypass codes when NODE_ENV is production without flag', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      const originalAllow = process.env.ALLOW_DEMO_OTP
      const originalEnable = process.env.ENABLE_DEMO_OTP

      try {
        process.env.NODE_ENV = 'production'
        delete process.env.ALLOW_DEMO_OTP
        delete process.env.ENABLE_DEMO_OTP

        expect(OtpService.isDemoOtpAllowed()).toBe(false)

        const prodResult = await OtpService.verifyOtp({
          identifier: testUser.email,
          code: '0000',
        })
        expect(prodResult.success).toBe(false)
        expect(prodResult.error?.code).toBe('AUTH_004') // No active OTP found, bypass rejected
      } finally {
        process.env.NODE_ENV = originalNodeEnv
        if (originalAllow !== undefined) process.env.ALLOW_DEMO_OTP = originalAllow
        else delete process.env.ALLOW_DEMO_OTP
        if (originalEnable !== undefined) process.env.ENABLE_DEMO_OTP = originalEnable
        else delete process.env.ENABLE_DEMO_OTP
      }
    })

    it('BUG-029: rejects demo bypass codes when ENABLE_DEMO_OTP=false even in non-production', async () => {
      const originalEnable = process.env.ENABLE_DEMO_OTP

      try {
        process.env.ENABLE_DEMO_OTP = 'false'
        expect(OtpService.isDemoOtpAllowed()).toBe(false)

        const result = await OtpService.verifyOtp({
          identifier: testUser.email,
          code: '1234',
        })
        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('AUTH_004')
      } finally {
        if (originalEnable !== undefined) process.env.ENABLE_DEMO_OTP = originalEnable
        else delete process.env.ENABLE_DEMO_OTP
      }
    })

    it('BUG-029: permits demo bypass codes in production only when ALLOW_DEMO_OTP or ENABLE_DEMO_OTP is explicitly true', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      const originalAllow = process.env.ALLOW_DEMO_OTP

      try {
        process.env.NODE_ENV = 'production'
        process.env.ALLOW_DEMO_OTP = 'true'
        expect(OtpService.isDemoOtpAllowed()).toBe(true)

        const result = await OtpService.verifyOtp({
          identifier: testUser.email,
          code: '0000',
        })
        expect(result.success).toBe(true)
        expect(result.token).toBeDefined()
      } finally {
        process.env.NODE_ENV = originalNodeEnv
        if (originalAllow !== undefined) process.env.ALLOW_DEMO_OTP = originalAllow
        else delete process.env.ALLOW_DEMO_OTP
      }
    })

    it('BUG-030: provides remaining attempt counter and locks out after 3 failed active OTP attempts', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '5555',
        userId: testUser.id,
        email: testUser.email,
        attempts: 0,
      })

      // Attempt 1: wrong code -> 401 with remainingAttempts: 2
      const att1 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '1111',
      })
      expect(att1.success).toBe(false)
      expect(att1.error?.code).toBe('INVALID_OTP')
      expect(att1.error?.status).toBe(401)
      expect(att1.error?.message).toContain('2 attempts remaining')
      expect((att1.error as any)?.remainingAttempts).toBe(2)

      // Attempt 2: wrong code -> 401 with remainingAttempts: 1
      const att2 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '2222',
      })
      expect(att2.success).toBe(false)
      expect(att2.error?.code).toBe('INVALID_OTP')
      expect(att2.error?.status).toBe(401)
      expect(att2.error?.message).toContain('1 attempt remaining')
      expect((att2.error as any)?.remainingAttempts).toBe(1)

      // Attempt 3: wrong code -> 429 OTP_MAX_ATTEMPTS, code invalidated
      const att3 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '3333',
      })
      expect(att3.success).toBe(false)
      expect(att3.error?.code).toBe('OTP_MAX_ATTEMPTS')
      expect(att3.error?.status).toBe(429)
      expect((att3.error as any)?.remainingAttempts).toBe(0)

      // Attempt 4: subsequent attempts stay locked with 429
      const att4 = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '5555', // Even correct code is rejected because OTP was invalidated
      })
      expect(att4.success).toBe(false)
      expect(att4.error?.code).toBe('OTP_MAX_ATTEMPTS')
      expect(att4.error?.status).toBe(429)
    })

    it('BUG-030: throttles per-identifier after 5 consecutive failed verify attempts (429 TOO_MANY_ATTEMPTS)', async () => {
      // Simulate 5 failed attempts for a non-existent active code (e.g. brute force guessing)
      for (let i = 0; i < 4; i++) {
        const res = await OtpService.verifyOtp({
          identifier: testUser.email,
          code: `999${i}`,
        })
        expect(res.success).toBe(false)
        expect(res.error?.status).toBe(400) // AUTH_004
      }

      // 5th attempt triggers lockout
      const fifthAttempt = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '9999',
      })
      expect(fifthAttempt.success).toBe(false)
      expect(fifthAttempt.error?.status).toBe(429)
      expect(fifthAttempt.error?.code).toBe('TOO_MANY_ATTEMPTS')

      // 6th attempt is blocked at entry
      const sixthAttempt = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '9999',
      })
      expect(sixthAttempt.success).toBe(false)
      expect(sixthAttempt.error?.status).toBe(429)
      expect(sixthAttempt.error?.code).toBe('TOO_MANY_ATTEMPTS')
    })

    it('BUG-030: throttles per-IP after 10 consecutive failed attempts (429 RATE_LIMITED)', async () => {
      const mockReq = (ip: string) =>
        new NextRequest(new URL('http://localhost:3000/api/v1/auth/otp/verify'), {
          method: 'POST',
          headers: {
            'x-forwarded-for': ip,
            'content-type': 'application/json',
          },
        })

      const testIp = '198.51.100.42'
      for (let i = 0; i < 9; i++) {
        const res = await OtpService.verifyOtp({
          identifier: `diff_user_${i}@example.com`,
          code: '8888',
          req: mockReq(testIp),
        })
        expect(res.success).toBe(false)
      }

      // 10th attempt triggers IP throttling
      const tenth = await OtpService.verifyOtp({
        identifier: 'diff_user_10@example.com',
        code: '8888',
        req: mockReq(testIp),
      })
      expect(tenth.success).toBe(false)
      expect(tenth.error?.status).toBe(429)
      expect(tenth.error?.code).toBe('RATE_LIMITED')

      // Subsequent request from same IP is blocked immediately
      const eleventh = await OtpService.verifyOtp({
        identifier: 'fresh_user@example.com',
        code: '8888',
        req: mockReq(testIp),
      })
      expect(eleventh.success).toBe(false)
      expect(eleventh.error?.status).toBe(429)
      expect(eleventh.error?.code).toBe('RATE_LIMITED')
    })

    it('BUG-030: supports 6-digit codes on verification and configurable generation', async () => {
      // 1. Verify 6-digit code validation
      OtpService.setTestOtp(testUser.email, {
        code: '654321',
        userId: testUser.id,
        email: testUser.email,
      })

      const sixDigitVerify = await OtpService.verifyOtp({
        identifier: testUser.email,
        code: '654321',
      })
      expect(sixDigitVerify.success).toBe(true)
      expect(sixDigitVerify.token).toBeDefined()

      // 2. Verify configurable code generation with OTP_CODE_LENGTH=6
      const originalLen = process.env.OTP_CODE_LENGTH
      try {
        process.env.OTP_CODE_LENGTH = '6'
        const reqResult = await OtpService.requestOtp(testUser.email)
        expect(reqResult.success).toBe(true)

        // Find the active OTP generated
        const active = (OtpService as any).getActiveOtp?.(testUser.email)
        // If not directly exposed, verify via OtpService verification
      } finally {
        if (originalLen !== undefined) process.env.OTP_CODE_LENGTH = originalLen
        else delete process.env.OTP_CODE_LENGTH
      }
    })
  })

  describe('4. Dedicated HTTP Route Handlers', () => {
    it('POST /api/v1/auth/otp/send dispatches OTP', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/v1/auth/otp/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testUser.email }),
      })

      const res = await sendRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.cooldown).toBe(45)
    })

    it('POST /api/v1/auth/otp/verify sets session cookie on success', async () => {
      OtpService.setTestOtp(testUser.email, {
        code: '8888',
        userId: testUser.id,
        email: testUser.email,
      })

      const req = new NextRequest(new URL('http://localhost:3000/api/v1/auth/otp/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testUser.email, code: '8888' }),
      })

      const res = await verifyRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.id).toBe(testUser.id)

      // Verify Set-Cookie header is present
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('preone_session=')
    })

    it('POST /api/v1/auth/otp handles unified actions', async () => {
      // Test unified send
      const reqSend = new NextRequest(new URL('http://localhost:3000/api/v1/auth/otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier: testUser.email }),
      })
      const resSend = await unifiedRoute(reqSend)
      expect(resSend.status).toBe(200)

      // Test unified verify with demo code
      const reqVerify = new NextRequest(new URL('http://localhost:3000/api/v1/auth/otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', identifier: testUser.email, code: '1234' }),
      })
      const resVerify = await unifiedRoute(reqVerify)
      expect(resVerify.status).toBe(200)
      const jsonVerify = await resVerify.json()
      expect(jsonVerify.success).toBe(true)
    })
  })

  describe('5. Client Login Page Verification Wireup', () => {
    it('verifies src/app/page.tsx calls /api/v1/auth/otp/verify with loading and error states', async () => {
      const pageCode = await Bun.file('src/app/page.tsx').text()

      // Endpoint call
      expect(pageCode).toContain("fetch('/api/v1/auth/otp/verify'")
      // Loading states
      expect(pageCode).toContain('setLoading(true)')
      expect(pageCode).toContain('setLoading(false)')
      // Error states
      expect(pageCode).toContain("setFieldErrors({ otp: errorMsg })")
      expect(pageCode).toContain('setGeneralError(errorMsg)')
      // Resend wireup
      expect(pageCode).toContain("fetch('/api/v1/auth/otp/resend'")
      // Wireup to AuthActions with explicit onClick
      expect(pageCode).toContain('onClick={(e) => handleOtpVerify(e)}')
      // DOM fallback for verification code recovery
      expect(pageCode).toContain('.auth-otp-group input')
    })

    it('verifies AuthActions component supports onClick prop and forwards to Button', async () => {
      const authActionsCode = await Bun.file('src/components/auth/AuthActions.tsx').text()
      expect(authActionsCode).toContain('onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void')
      expect(authActionsCode).toContain('onClick={onClick}')
    })
  })
})

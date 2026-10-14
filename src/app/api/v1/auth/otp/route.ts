import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { OtpService } from '@/lib/auth/otp-service'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

/**
 * POST /api/v1/auth/otp
 * Unified public endpoint for OTP operations:
 * - action: 'send' | 'request'
 * - action: 'resend'
 * - action: 'verify'
 */
export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}))
      const {
        action = 'send',
        identifier,
        email,
        username,
        code,
        otp,
        schoolCode,
      } = (body || {}) as {
        action?: 'send' | 'request' | 'resend' | 'verify'
        identifier?: string
        email?: string
        username?: string
        code?: string
        otp?: string
        schoolCode?: string
      }

      const loginId = identifier || email || username
      const cleanCode = code || otp

      if (action === 'send' || action === 'request') {
        if (!loginId) {
          return Errors.validation('Username or email is required', 'identifier')
        }
        const result = await OtpService.requestOtp(loginId, schoolCode, req)
        if (!result.success && result.error) {
          return fail(result.error.code, result.error.message, result.error.status)
        }
        return ok(result)
      }

      if (action === 'resend') {
        if (!loginId) {
          return Errors.validation('Username or email is required', 'identifier')
        }
        const result = await OtpService.resendOtp(loginId, schoolCode, req)
        if (!result.success && result.error) {
          return fail(result.error.code, result.error.message, result.error.status)
        }
        return ok(result)
      }

      if (action === 'verify') {
        if (!cleanCode) {
          return Errors.validation('Verification code is required', 'code')
        }
        const result = await OtpService.verifyOtp({
          identifier: loginId,
          code: cleanCode,
          schoolCode,
          req,
        })

        if (!result.success && result.error) {
          return fail(result.error.code, result.error.message, result.error.status)
        }

        const res = ok({
          user: result.user,
          mustChangePassword: result.mustChangePassword,
        })

        if (result.token) {
          res.cookies.set(SESSION_COOKIE, result.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_MAX_AGE,
            path: '/',
          })
        }

        if (result.locale) {
          res.cookies.set('preone_locale', result.locale, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60,
            path: '/',
          })
        }

        return res
      }

      return Errors.validation('Invalid action specified')
    } catch (e: any) {
      return Errors.business('OTP_FAILED', e.message || 'Failed to process OTP request', 400)
    }
  },
  { module: 'auth' }
)

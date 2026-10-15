import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { OtpService } from '@/lib/auth/otp-service'
import { MfaService } from '@/lib/auth/mfa-service'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

/**
 * POST /api/v1/auth/otp/verify
 * Public endpoint to verify a 4-digit code and establish an authenticated session.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { identifier, email, username, code, otp, schoolCode, mfaToken, mfaCode } = (body || {}) as {
        identifier?: string
        email?: string
        username?: string
        code?: string
        otp?: string
        mfaCode?: string
        schoolCode?: string
        mfaToken?: string
      }

      const cleanCode = code || otp || mfaCode
      if (!cleanCode) {
        return Errors.validation('Verification code is required', 'code')
      }

      if (mfaToken) {
        const mfaResult = await MfaService.completeStepUp({
          mfaToken,
          code: cleanCode,
          req,
        })
        if (!mfaResult.success && mfaResult.error) {
          return fail(mfaResult.error.code, mfaResult.error.message, mfaResult.error.status)
        }
        const res = ok({
          user: mfaResult.user,
          mustChangePassword: mfaResult.mustChangePassword,
        })
        if (mfaResult.token) {
          res.cookies.set(SESSION_COOKIE, mfaResult.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_MAX_AGE,
            path: '/',
          })
        }
        if (mfaResult.locale) {
          res.cookies.set('preone_locale', mfaResult.locale, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60,
            path: '/',
          })
        }
        return res
      }

      const loginId = identifier || email || username
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
    } catch (e: any) {
      return Errors.business('OTP_VERIFY_FAILED', e.message || 'Failed to verify code', 400)
    }
  },
  { module: 'auth' }
)

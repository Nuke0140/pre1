import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { OtpService } from '@/lib/auth/otp-service'
import { MfaService } from '@/lib/auth/mfa-service'

/**
 * POST /api/v1/auth/otp/resend
 * Public endpoint to resend a 4-digit login verification code.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { identifier, email, username, schoolCode, mfaToken } = (body || {}) as {
        identifier?: string
        email?: string
        username?: string
        schoolCode?: string
        mfaToken?: string
      }

      let loginId = identifier || email || username
      if (mfaToken) {
        const payload = await MfaService.verifyMfaToken(mfaToken)
        if (payload?.email) {
          loginId = payload.email
        }
      }

      if (!loginId) {
        return Errors.validation('Username or email is required', 'identifier')
      }

      const result = await OtpService.resendOtp(loginId, schoolCode, req)
      if (!result.success && result.error) {
        return fail(result.error.code, result.error.message, result.error.status)
      }

      return ok(result)
    } catch (e: any) {
      return Errors.business('OTP_RESEND_FAILED', e.message || 'Failed to resend verification code', 400)
    }
  },
  { module: 'auth' }
)

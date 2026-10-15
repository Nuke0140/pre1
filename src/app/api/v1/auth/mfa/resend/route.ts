import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { MfaService } from '@/lib/auth/mfa-service'

/**
 * POST /api/v1/auth/mfa/resend
 * Public endpoint to resend a step-up MFA verification code.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { mfaToken, identifier, schoolCode } = (body || {}) as {
        mfaToken?: string
        identifier?: string
        schoolCode?: string
      }

      if (!mfaToken && !identifier) {
        return Errors.validation('Either mfaToken or identifier is required', 'mfaToken')
      }

      const result = await MfaService.resendCode({
        mfaToken,
        identifier,
        schoolCode,
        req,
      })

      if (!result.success && result.error) {
        return fail(result.error.code, result.error.message, result.error.status)
      }

      return ok(result)
    } catch (e: any) {
      return Errors.business('MFA_RESEND_FAILED', e.message || 'Failed to resend verification code', 400)
    }
  },
  { module: 'auth' }
)

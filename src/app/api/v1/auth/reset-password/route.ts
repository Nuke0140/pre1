import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { PasswordResetService } from '@/lib/auth/password-reset-service'

/**
 * POST /api/v1/auth/reset-password
 * Public endpoint to request a password reset email or complete a password reset.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { action, identifier, token, newPassword } = body as {
        action?: 'request' | 'verify' | 'complete'
        identifier?: string
        token?: string
        newPassword?: string
      }

      const origin = req.headers.get('origin') || 'http://localhost:3000'

      if (action === 'request' || (!action && identifier)) {
        if (!identifier) {
          return Errors.validation('Username or email is required', 'identifier')
        }
        const result = await PasswordResetService.requestPasswordReset(identifier, origin)
        return ok(result)
      }

      if (action === 'verify') {
        if (!token) {
          return Errors.validation('Token is required', 'token')
        }
        const verification = await PasswordResetService.verifyResetToken(token)
        if (!verification.valid) {
          return Errors.business('INVALID_TOKEN', verification.error || 'Token is invalid or expired', 400)
        }
        return ok({ valid: true, email: verification.email })
      }

      if (action === 'complete') {
        if (!token || !newPassword) {
          return Errors.validation('Both token and newPassword are required')
        }
        const result = await PasswordResetService.completePasswordReset(token, newPassword)
        return ok(result)
      }

      return Errors.validation('Invalid action or parameters specified')
    } catch (e: any) {
      return Errors.business('PASSWORD_RESET_FAILED', e.message || 'Failed to process password reset', 400)
    }
  },
  { module: 'auth' }
)

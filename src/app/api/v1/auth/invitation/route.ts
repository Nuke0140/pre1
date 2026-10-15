import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { InvitationService } from '@/lib/users/invitation-service'

/**
 * GET /api/v1/auth/invitation?token=...
 * Public verification endpoint for staff/user invitation onboarding.
 */
async function _GET(req: NextRequest) {
  const rl = await checkRateLimit(req, {
    windowMs: 60 * 1000,
    max: 60,
    keyPrefix: 'invitation_verify',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many verification attempts. Please wait.')
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return bad('Invitation token is required', 'TOKEN_REQUIRED')
  }

  try {
    const result = await InvitationService.verifyInvitation(token)
    if (!result.valid) {
      return bad(result.error || 'Invalid or expired invitation', result.isExpired ? 'INVITATION_EXPIRED' : 'INVALID_INVITATION')
    }

    return ok(result.invitation)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/auth/invitation
 * Public endpoint to accept an invitation, set password, and activate account.
 */
async function _POST(req: NextRequest) {
  const rl = await checkRateLimit(req, {
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: 'invitation_accept',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many activation attempts. Please wait.')
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { token, password, username } = body as {
      token?: string
      password?: string
      username?: string
    }

    if (!token || !password) {
      return bad('Both invitation token and password are required', 'MISSING_FIELDS')
    }

    const result = await InvitationService.acceptInvitation({
      token,
      password,
      username,
      req,
    })

    return ok(result)
  } catch (err: any) {
    const status = err.httpStatus || err.status || err.statusCode
    if (status && status < 500) {
      return bad(err.userMessage || err.message, err.code || 'ACTIVATION_FAILED')
    }
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

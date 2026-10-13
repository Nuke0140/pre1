import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { UsernameService, UsernameType } from '@/lib/users/username-service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * GET /api/v1/users/username?name=Ananya+Sharma&type=STAFF|PARENT|GUARDIAN|STUDENT
 */
async function _GET(req: NextRequest) {
  // Apply rate limiting: max 40 requests per minute per IP
  const rl = await checkRateLimit(req, {
    windowMs: 60 * 1000,
    max: 40,
    keyPrefix: 'username_lookup',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many username checks. Please wait before retrying.')
  }

  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  const url = new URL(req.url)
  const name = url.searchParams.get('name')?.trim() || ''
  const type = (url.searchParams.get('type')?.toUpperCase() || 'STAFF') as UsernameType
  const preferred = url.searchParams.get('preferred')?.trim() || undefined

  if (!name && !preferred) {
    return bad('name or preferred is required', 'MISSING_FIELDS')
  }

  try {
    let isValid = true
    let invalidReason: string | undefined = undefined

    if (preferred) {
      const valCheck = isValidUsername(preferred)
      if (!valCheck.valid) {
        isValid = false
        invalidReason = valCheck.reason
      }
    }

    const isAvailable = preferred && isValid
      ? await UsernameService.isUsernameAvailable(preferred, type)
      : false

    const suggestedUsername = await UsernameService.generateUniqueUsername({
      type,
      name: name || preferred || 'user',
      preferred: isValid ? preferred : undefined,
      tenantId: session.tenantId || undefined,
    })

    return ok({
      username: suggestedUsername,
      normalizedUsername: preferred ? normalizeUsername(preferred) : suggestedUsername,
      isAvailable,
      isValid,
      invalidReason,
    })
  } catch (err: any) {
    return bad(err.message)
  }
}

export const GET = withApi(_GET)

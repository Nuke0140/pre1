import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { PRIVILEGED_MFA_ROLES, isMfaRequired } from '@/lib/auth/mfa-service'

/**
 * GET /api/v1/auth/mfa/status
 * Returns MFA enrollment and enforcement metadata for the active session.
 */
export const GET = withApi(
  async (req: NextRequest) => {
    const session = await getSession(req)
    if (!session) {
      return ok({
        privilegedRoles: PRIVILEGED_MFA_ROLES,
        enforced: true,
        authenticated: false,
      })
    }

    const enforced = isMfaRequired(session.role, session.roles)

    return ok({
      privilegedRoles: PRIVILEGED_MFA_ROLES,
      enforced,
      authenticated: true,
      role: session.role,
      roles: session.roles || [session.role],
      mfaVerified: Boolean(session.mfaVerified),
      destinationMasked: session.email ? `${session.email.slice(0, 2)}***@${session.email.split('@')[1]}` : null,
    })
  },
  { module: 'auth' }
)

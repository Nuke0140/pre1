import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { UserLifecycleService } from '@/lib/users/user-lifecycle-service'

/**
 * POST /api/v1/users/[id]/unlock
 * Row-level admin action: clears lockout tracker, resets persistent failed attempts,
 * transitions account back to ACTIVE state, and records audit.
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    const body = await req.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    const result = await UserLifecycleService.transitionUserStatus({
      member,
      actorSession: {
        uid: session.uid,
        name: session.name,
        role: session.role,
        tenantId: session.tenantId,
      },
      action: 'unlock',
      reason: reason || 'Administrative unlock from user directory',
      req,
    })

    if (!result.success) {
      if (result.statusHttp === 403) return forbidden(result.error)
      return bad(result.error, result.code)
    }

    return ok({
      success: true,
      userId: member.userId,
      status: 'ACTIVE',
      message: `Account for ${member.user.fullName} has been successfully unlocked`,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

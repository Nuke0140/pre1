import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { UserActivityService } from '@/lib/users/user-activity-service'

/**
 * GET /api/v1/users/[id]/security-timeline — Security & Audit Event Timeline (UAM-E11)
 * Retrieves security, auth, lifecycle, and administrative events for a given user from AuditLog.
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  // Allow self or users with management authority
  const isSelf = session.uid === id
  if (!isSelf) {
    const manageCheck = await requireCanManageUser(session, id)
    if (isResponse(manageCheck)) return manageCheck
  }

  try {
    const result = await UserActivityService.getUserActivityTrail({
      targetIdentifier: id,
      tenantId: session.tenantId,
      perspective: 'ALL',
      limit: 100,
    })

    if (!result) {
      return notFound('User not found in this school')
    }

    return ok({
      userId: result.userId,
      totalEvents: result.items.length,
      timeline: result.items,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { UserActivityService } from '@/lib/users/user-activity-service'

/**
 * GET /api/v1/users/[id]/activity
 * Per-user activity trail read model endpoint (Doc N-6).
 * Retrieves paginated chronological audit & activity events where user was actor or subject.
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  // Allow self-lookup or users with management authority
  const isSelf = session.uid === id
  if (!isSelf) {
    const manageCheck = await requireCanManageUser(session, id)
    if (isResponse(manageCheck)) return manageCheck
  }

  const { searchParams } = new URL(req.url)
  const perspectiveParam = searchParams.get('perspective')?.toUpperCase()
  const perspective = (
    ['ALL', 'TARGET', 'ACTOR'].includes(perspectiveParam || '')
      ? perspectiveParam
      : 'ALL'
  ) as 'ALL' | 'TARGET' | 'ACTOR'

  const moduleParam = searchParams.get('module') || undefined
  const severityParam = searchParams.get('severity') || undefined
  const search = searchParams.get('search') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10) || 30))

  try {
    const result = await UserActivityService.getUserActivityTrail({
      targetIdentifier: id,
      tenantId: session.tenantId,
      perspective,
      module: moduleParam,
      severity: severityParam,
      search,
      page,
      limit,
    })

    if (!result) {
      return notFound('User not found in this school')
    }

    return ok(result)
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)

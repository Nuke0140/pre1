import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FollowUpVisitService } from '@/lib/admissions/followup-visit-service'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'

/**
 * GET /api/v1/visits — Query follow-ups & visits workspace queues with metric counters
 * Query params: branchId, queue (DUE_TODAY | OVERDUE | UPCOMING | COMPLETED), limit
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const url = new URL(req.url)
  const requestedBranchId = url.searchParams.get('branchId')
  const queue = (url.searchParams.get('queue') as any) || 'DUE_TODAY'
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined

  try {
    const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return Errors.forbidden('No authorized branch access for active user')
    }

    const data = await FollowUpVisitService.listWorkspaceQueues(session.tenantId, {
      branchId: branchScope.mode === 'SINGLE_BRANCH' ? branchScope.selectedBranchId! : undefined,
      branchIds: branchScope.mode === 'ALL_BRANCHES' ? branchScope.authorizedBranchIds : undefined,
      queue,
      limit,
    } as any)

    return ok(data, {
      scope: {
        tenantId: branchScope.tenantId,
        mode: branchScope.mode,
        selectedBranchId: branchScope.selectedBranchId,
        authorizedBranchIds: branchScope.authorizedBranchIds,
      },
    })
  } catch (e: any) {
    return Errors.internal(e.message || 'Failed to list workspace items')
  }
}

export const GET = withApi(_GET)


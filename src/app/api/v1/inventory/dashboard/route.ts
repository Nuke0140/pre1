import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { InventoryService } from '@/lib/inventory/inventory-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const requestedBranchId = searchParams.get('branchId') || undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    const branchScope = requestedBranchId
      ? requestedBranchId
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    const metrics = await InventoryService.getDashboardMetrics(session.tenantId, branchScope)
    return ok(metrics)
  } catch (err: any) {
    return bad(err.message, 'DASHBOARD_FETCH_FAILED')
  }
}

export const GET = withApi(_GET)

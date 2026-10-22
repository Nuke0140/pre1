import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'

/**
 * GET /api/v1/transport/dashboard — Real-time transport KPIs and active operations
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const sp = req.nextUrl.searchParams
    const requestedBranchId = sp.get('branchId') || undefined
    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return ok({ activeTrips: 0, pendingAlerts: 0, totalVehicles: 0, totalRoutes: 0, activeAssignments: 0 })
    }

    const branchToUse = requestedBranchId || (authorizedBranches === 'ALL' ? undefined : session.branchId)

    const data = await TransportService.getDashboardMetrics({
      tenantId: session.tenantId,
      branchId: branchToUse,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    })
    return ok(data)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

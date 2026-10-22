import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const requestedBranchId = sp.get('branchId') || undefined
    const academicSessionId = sp.get('academicSessionId') || undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return ok({
        metrics: {
          totalBilled: 0,
          totalCollected: 0,
          totalOverdue: 0,
          collectionRate: 0,
          totalInvoicesCount: 0,
          paidInvoicesCount: 0,
          overdueInvoicesCount: 0,
          partialInvoicesCount: 0,
          issuedInvoicesCount: 0,
          cancelledInvoicesCount: 0,
          activeFeePlansCount: 0,
          recentPaymentsCount: 0,
        },
        aging: { current: 0, days30: 0, days60: 0, days90Plus: 0 },
        recentPayments: [],
      })
    }

    const branchToUse = requestedBranchId || (authorizedBranches === 'ALL' ? undefined : (session.branchId || authorizedBranches[0]))

    const metrics = await FeeService.getDashboardMetrics(session.tenantId, branchToUse, academicSessionId)
    return ok(metrics)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

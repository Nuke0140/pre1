import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import { Errors } from '@/lib/api'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const type = sp.get('type') || 'invoices'
    const status = sp.get('status') || undefined
    const requestedBranchId = sp.get('branchId') || undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return Errors.forbidden('Access denied: branch scope restricted')
    }

    const branchIds = requestedBranchId
      ? [requestedBranchId]
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    let csv: string
    let filename: string

    if (type === 'payments') {
      csv = await FeeService.exportPaymentsCsv(session.tenantId, branchIds)
      filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`
    } else {
      csv = await FeeService.exportInvoicesCsv(session.tenantId, status, branchIds)
      filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

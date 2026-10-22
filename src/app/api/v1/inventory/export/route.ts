import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { InventoryService } from '@/lib/inventory/inventory-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'stock') as 'stock' | 'movements' | 'procurement' | 'consumption'
    const requestedBranchId = searchParams.get('branchId') || undefined
    const meta = getRequestMeta(req)

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    const branchIds = requestedBranchId
      ? [requestedBranchId]
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    const csvData = await InventoryService.exportData(
      session.tenantId,
      type,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      branchIds
    )

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory-${type}-${Date.now()}.csv"`,
      },
    })
  } catch (err: any) {
    return new NextResponse(`Export failed: ${err.message}`, { status: 400 })
  }
}

export const GET = withApi(_GET)

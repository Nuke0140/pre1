import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { InventoryService } from '@/lib/inventory/inventory-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const requestedBranchId = searchParams.get('branchId') || undefined
    const status = searchParams.get('status') as any || undefined
    const requestedById = searchParams.get('requestedById') || undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return ok({ requests: [], total: 0, page: 1, pageSize: pageSize || 50, totalPages: 0 })
    }

    const branchIds = requestedBranchId
      ? undefined
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    const result = await InventoryService.listPurchaseRequests(session.tenantId, {
      branchId: requestedBranchId,
      branchIds,
      status,
      page,
      pageSize,
    })

    return ok(result)
  } catch (err: any) {
    return bad(err.message, 'PURCHASE_REQUESTS_FETCH_FAILED')
  }
}

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:request')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const targetBranchId = body.branchId || session.branchId
    if (!targetBranchId) {
      return Errors.badRequest('Branch context is required')
    }

    const branchCheck = await requireBranchAccess(session, targetBranchId)
    if (branchCheck) return branchCheck

    const meta = getRequestMeta(req)

    const request = await InventoryService.createPurchaseRequest(
      session.tenantId,
      {
        ...body,
        branchId: targetBranchId,
      },
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }
    )

    return ok(request, undefined, 201)
  } catch (err: any) {
    return bad(err.message, 'PURCHASE_REQUEST_CREATE_FAILED')
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

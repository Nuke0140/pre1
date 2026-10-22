import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { InventoryService } from '@/lib/inventory/inventory-service'

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const requestedBranchId = searchParams.get('branchId') || undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    const branchIds = requestedBranchId
      ? undefined
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    const item = await InventoryService.getItemDetail(session.tenantId, id, requestedBranchId, branchIds)
    if (!item) return Errors.notFound('Item not found')
    return ok(item)
  } catch (err: any) {
    return bad(err.message, 'ITEM_FETCH_FAILED')
  }
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json()
    const meta = getRequestMeta(req)

    const updated = await InventoryService.updateItem(
      session.tenantId,
      id,
      body,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }
    )

    return ok(updated)
  } catch (err: any) {
    return bad(err.message, 'ITEM_UPDATE_FAILED')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)

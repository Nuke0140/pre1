import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { InventoryService } from '@/lib/inventory/inventory-service'
import { db } from '@/lib/db'

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params

    const existingLoc = await db.inventoryLocation.findFirst({
      where: { id, tenantId: session.tenantId },
      select: { branchId: true },
    })
    if (!existingLoc) return Errors.notFound('Location not found')

    const branchCheck = await requireBranchAccess(session, existingLoc.branchId)
    if (branchCheck) return branchCheck

    const body = await req.json()
    if (body.branchId && body.branchId !== existingLoc.branchId) {
      const newBranchCheck = await requireBranchAccess(session, body.branchId)
      if (newBranchCheck) return newBranchCheck
    }

    const meta = getRequestMeta(req)

    const updated = await InventoryService.updateLocation(
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
    return bad(err.message, 'LOCATION_UPDATE_FAILED')
  }
}

export const PATCH = withApi(_PATCH)

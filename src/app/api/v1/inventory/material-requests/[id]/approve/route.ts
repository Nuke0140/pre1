import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'
import { db } from '@/lib/db'

/**
 * POST /api/v1/inventory/material-requests/[id]/approve
 * Authorizes the classroom supply request. Records reviewer identity, timestamp,
 * updates approved quantities, dispatches notification to requesting teacher, and audits.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:approve')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params

    const existing = await db.materialRequest.findFirst({
      where: { id, tenantId: session.tenantId },
      select: { branchId: true },
    })
    if (!existing) return Errors.notFound('Supply request not found')

    const branchCheck = await requireBranchAccess(session, existing.branchId)
    if (branchCheck) return branchCheck

    const body = await req.json().catch(() => ({}))
    const meta = getRequestMeta(req)

    const approved = await SupplyCartService.approveSupplyRequest(
      session.tenantId,
      id,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      {
        approvedItems: body.approvedItems,
        notes: body.notes,
      }
    )

    return ok(approved)
  } catch (err: any) {
    return bad(err.message, 'MATERIAL_REQUEST_APPROVE_FAILED')
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * POST /api/v1/inventory/supply-store/submit
 * Submits the classroom request cart for principal/admin approval.
 * Creates MaterialRequest, structured MaterialRequestItems, dispatches in-app notifications,
 * logs audit entry, and prevents duplicate submissions.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:request')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json().catch(() => ({}))
    const meta = getRequestMeta(req)

    const request = await SupplyCartService.submitSupplyRequest(
      session.tenantId,
      {
        classroomId: body.classroomId,
        branchId: body.branchId || session.branchId || undefined,
        academicSessionId: body.academicSessionId || undefined,
        requiredDate: body.requiredDate,
        priority: body.priority || 'NORMAL',
        purpose: body.purpose,
        notes: body.notes,
        items: body.items || [],
      },
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }
    )

    return ok(
      {
        ...request,
        message: `Classroom supply request ${request.requestNumber} submitted successfully for review.`,
      },
      undefined,
      201
    )
  } catch (err: any) {
    return bad(err.message, 'SUPPLY_REQUEST_SUBMISSION_FAILED')
  }
}

export const POST = withApi(_POST)

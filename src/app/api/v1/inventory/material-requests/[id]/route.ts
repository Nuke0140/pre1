import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * GET /api/v1/inventory/material-requests/[id]
 * Retrieves single request with item lines, live stock levels, classroom, and fulfillment history.
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const request = await SupplyCartService.getRequestDetails(session.tenantId, id)

    if (!request) {
      return Errors.notFound('Supply request not found')
    }

    const branchCheck = await requireBranchAccess(session, request.branchId)
    if (branchCheck) return branchCheck

    // Role scoping: If user is only TEACHER/STAFF, verify they are the requester or assigned teacher
    const isElevated = [session.role, ...(session.roles || [])].some((r) =>
      ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN'].includes(r)
    )
    if (!isElevated && request.requestedById !== session.uid) {
      // Check if teacher is assigned to this classroom
      const teacherClass = await SupplyCartService.getTeacherClassroom(
        session.tenantId,
        session.uid,
        request.branchId
      )
      if (!teacherClass || teacherClass.id !== request.classroomId) {
        return Errors.forbidden('You are only authorized to view supply requests for your assigned classroom.')
      }
    }

    return ok(request)
  } catch (err: any) {
    return bad(err.message, 'MATERIAL_REQUEST_DETAIL_FAILED')
  }
}

export const GET = withApi(_GET)

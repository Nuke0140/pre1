import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { StudentService } from '@/lib/students/student-service'
import { db } from '@/lib/db'

/**
 * POST /api/v1/students/[id]/transfer — Inter-branch student transfer
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const student = await db.student.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      select: { branchId: true },
    })
    if (!student) return Errors.notFound('Student')

    const sourceBranchCheck = await requireBranchAccess(session, student.branchId)
    if (sourceBranchCheck) return sourceBranchCheck

    const body = await req.json()
    const { destinationBranchId, destinationClassroomId, reason } = body

    if (!destinationBranchId || !destinationClassroomId) {
      return Errors.validation('destinationBranchId and destinationClassroomId are required')
    }

    const destBranchCheck = await requireBranchAccess(session, destinationBranchId)
    if (destBranchCheck) return destBranchCheck

    const updated = await StudentService.transferBranch(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      {
        destinationBranchId,
        destinationClassroomId,
        reason,
      }
    )

    return ok(updated)
  } catch (e: any) {
    return Errors.business('TRANSFER_FAILED', e.message || 'Failed to transfer branch', 422)
  }
}

export const POST = withApi(_POST)

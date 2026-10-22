import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/visits/[id]/cancel — Cancel school visit with reason
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const visit = await db.followUp.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { lead: { select: { branchId: true } } },
    })
    if (!visit) return Errors.notFound('Visit not found')
    const targetBranchId = visit.branchId || visit.lead?.branchId
    if (targetBranchId) {
      const branchCheck = await requireBranchAccess(session, targetBranchId)
      if (branchCheck) return branchCheck
    }

    const body = await req.json()
    const { reason, nextFollowUpAt, branchId, academicYearId } = body

    if (!reason?.trim()) {
      return Errors.validation('Cancellation reason is required')
    }

    const result = await AdmissionService.cancelSchoolVisit(
      {
        tenantId: session.tenantId,
        branchId: branchId || session.branchId || '',
        academicYearId: academicYearId || '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      {
        reason: reason.trim(),
        nextFollowUpAt,
      }
    )

    return ok(result)
  } catch (e: any) {
    return Errors.business('VISIT_CANCEL_FAILED', e.message || 'Failed to cancel visit', 422)
  }
}

export const POST = withApi(_POST)

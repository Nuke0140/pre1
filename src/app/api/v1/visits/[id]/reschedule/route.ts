import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/visits/[id]/reschedule — Reschedule school visit non-destructively
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
    const { newScheduledAt, reason, visitorCount, attendees, tourFocus, branchId, academicYearId } = body

    if (!newScheduledAt) {
      return Errors.validation('New scheduled date and time is required')
    }

    const result = await AdmissionService.rescheduleSchoolVisit(
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
        newScheduledAt,
        reason,
        visitorCount,
        attendees,
        tourFocus,
      }
    )

    return ok(result)
  } catch (e: any) {
    return Errors.business('VISIT_RESCHEDULE_FAILED', e.message || 'Failed to reschedule visit', 422)
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/leads/[id]/visits — Schedule a school visit / counselling session
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
    const body = await req.json()
    const { scheduledAt, visitorCount, notes, assignedUserId, branchId, academicYearId } = body

    if (!scheduledAt) {
      return Errors.validation('Visit scheduled date and time is required')
    }

    const visit = await AdmissionService.scheduleSchoolVisit(
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
        scheduledAt,
        visitorCount,
        notes,
        assignedUserId,
      }
    )

    return ok(visit, undefined, 201)
  } catch (e: any) {
    return Errors.business('VISIT_SCHEDULE_FAILED', e.message || 'Failed to schedule school visit', 422)
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/leads/[id]/follow-ups — Log a follow-up action on an enquiry
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
    const { type, note, dueAt, outcome, branchId, academicYearId } = body

    if (!note?.trim()) {
      return Errors.validation('Note is required')
    }

    const fu = await AdmissionService.addEnquiryFollowUp(
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
        type: type || 'Call Parent',
        note: note.trim(),
        dueAt,
        outcome,
      }
    )

    return ok(fu, undefined, 201)
  } catch (e: any) {
    return Errors.business('FOLLOWUP_FAILED', e.message || 'Failed to add follow-up', 422)
  }
}

export const POST = withApi(_POST)

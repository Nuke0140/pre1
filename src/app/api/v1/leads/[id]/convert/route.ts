import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { LeadService } from '@/lib/admissions/lead-service'

/**
 * POST /api/v1/leads/{id}/convert — Explicitly convert a Qualified Enquiry into an Admission Application
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  const lead = await db.lead.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { branchId: true },
  })
  if (!lead) return Errors.notFound('Enquiry not found')

  const branchErr = await requireBranchAccess(session, lead.branchId)
  if (branchErr) return branchErr

  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    if (body.branchId) {
      const targetBranchErr = await requireBranchAccess(session, body.branchId)
      if (targetBranchErr) return targetBranchErr
    }

    const result = await LeadService.convertToApplication(
      {
        tenantId: session.tenantId,
        branchId: body.branchId || session.branchId || '',
        academicYearId: body.academicYearId || '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      body
    )

    return ok(result, undefined, 201)
  } catch (e: any) {
    return Errors.business('CONVERT_FAILED', e.message || 'Failed to convert enquiry to application', 422)
  }
}

export const POST = withApi(_POST)

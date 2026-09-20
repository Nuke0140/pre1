import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * GET /api/v1/leads/[id] — Retrieve single enquiry details with history & followups
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const lead = await db.lead.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: {
        applications: {
          select: { id: true, applicationNumber: true, status: true, programType: true },
        },
      },
    })
    if (!lead) return Errors.notFound('Enquiry')

    // Find followups tied to this enquiry
    const followUps = await db.followUp.findMany({
      where: {
        tenantId: session.tenantId,
        sourceType: { in: ['EnquiryFollowUp', 'SchoolVisit'] },
        sourceId: id,
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok({ enquiry: lead, followUps })
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * PATCH /api/v1/leads/[id] — Update status/notes via AdmissionService
 */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const body = await req.json()
    const { status, notes, nextFollowUpAt, branchId, academicYearId } = body

    if (status) {
      const updated = await AdmissionService.updateEnquiryStatus(
        {
          tenantId: session.tenantId,
          branchId: branchId || session.branchId || '',
          academicYearId: academicYearId || '',
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        id,
        status,
        notes,
        nextFollowUpAt
      )
      return ok(updated)
    }

    const updated = await db.lead.update({
      where: { id },
      data: {
        ...(notes !== undefined ? { notes } : {}),
        ...(nextFollowUpAt ? { nextFollowUpAt: new Date(nextFollowUpAt) } : {}),
      },
    })
    return ok(updated)
  } catch (e: any) {
    return Errors.business('UPDATE_FAILED', e.message || 'Failed to update enquiry', 422)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)

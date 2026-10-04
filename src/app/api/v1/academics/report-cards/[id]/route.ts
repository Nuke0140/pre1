import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportCardService } from '@/lib/academics/report-card-service'
import { db } from '@/lib/db'

/**
 * GET /api/v1/academics/report-cards/[id] — Retrieve single report card details
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const rc = await ReportCardService.getReportCard(session.tenantId, id)

    // Parent permission check: can only view own child's published reports
    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isParent = effectiveRoles.includes('PARENT') || effectiveRoles.includes('GUARDIAN')
    const isStaff = effectiveRoles.some((r) =>
      ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'ACCOUNTS', 'ADMIN'].includes(r)
    )

    if (isParent && !isStaff) {
      const isLinked = rc.student.guardians.some((g: any) => g.guardian.userId === session.uid && !g.guardian.deletedAt)
      if (!isLinked) return Errors.forbidden('You can only view reports for your linked child')
      if (rc.status !== 'PUBLISHED') return Errors.notFound('Report Card')
    }

    return ok(rc)
  } catch (err: any) {
    return Errors.notFound('Report Card')
  }
}

/**
 * PATCH /api/v1/academics/report-cards/[id] — Update report card status or contents
 */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const { id } = await params

  try {
    const body = await req.json()
    const { status, overallGrade, remarks, attendancePct, fieldValues } = body

    const existing = await db.studentReportCard.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!existing) return Errors.notFound('Report Card')

    // Safeguard: Prevent unauthorized edits to published reports
    const isStaffAdmin = effectiveRoles.some((r) =>
      ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR', 'ADMIN'].includes(r)
    )
    if (existing.status === 'PUBLISHED' && !isStaffAdmin && status !== 'DRAFT') {
      return Errors.business(
        'CANNOT_EDIT_PUBLISHED',
        'Published report cards cannot be edited without administrative permission. Unpublish first to make modifications.',
        403
      )
    }

    const updateData: any = { updatedAt: new Date() }
    if (status) {
      updateData.status = status
      if (status === 'PUBLISHED') {
        updateData.publishedAt = new Date()
        updateData.publishedById = session.uid
        updateData.publishedByName = session.name
      }
    }
    if (overallGrade !== undefined) updateData.overallGrade = overallGrade
    if (remarks !== undefined) updateData.remarks = remarks
    if (attendancePct !== undefined) updateData.attendancePct = attendancePct
    if (fieldValues) {
      // Preserve existing values when fields are omitted from partial update
      const existingFields = (existing.fieldValues as Record<string, any>) || {}
      updateData.fieldValues = { ...existingFields, ...fieldValues }
    }

    const updated = await db.studentReportCard.update({
      where: { id },
      data: updateData,
    })

    return ok(updated)
  } catch (err: any) {
    return Errors.business('REPORT_CARD_UPDATE_FAILED', err.message || 'Failed to update report card', 422)
  }
}

/**
 * DELETE /api/v1/academics/report-cards/[id] — Delete a draft report card
 */
async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const existing = await db.studentReportCard.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!existing) return Errors.notFound('Report Card')

    if (existing.status === 'PUBLISHED') {
      return Errors.business('CANNOT_DELETE_PUBLISHED', 'Published report cards cannot be deleted. Unpublish first.', 400)
    }

    await db.studentReportCard.delete({ where: { id } })
    return ok({ success: true, message: 'Report card deleted' })
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to delete report card')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { can } from '@/lib/auth'
import { ReportCardService } from '@/lib/academics/report-card-service'

import { db } from '@/lib/db'

/**
 * GET /api/v1/academics/report-cards — List report cards with filters
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const hasAccess = can(effectiveRoles, 'students:read') || can(effectiveRoles, 'academics:read')
  if (!hasAccess) {
    return Errors.forbidden('Missing permission: students:read or academics:read')
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  if (action === 'fields') {
    const templateId = searchParams.get('templateId')
    if (!templateId) return Errors.validation('templateId query parameter is required')
    try {
      const fields = await ReportCardService.getTemplateFieldsById(session.tenantId, templateId)
      return ok({ fields })
    } catch (err: any) {
      return Errors.bad(err.message || 'Failed to fetch template fields')
    }
  }

  const studentId = searchParams.get('studentId') || undefined
  const classroomId = searchParams.get('classroomId') || undefined
  const academicSessionId = searchParams.get('academicSessionId') || undefined
  const term = searchParams.get('term') || undefined
  const status = searchParams.get('status') || undefined
  const templateId = searchParams.get('templateId') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  // Enforce parent-ward isolation: parents can ONLY see their canonical linked children's published reports
  const isParent = effectiveRoles.includes('PARENT') || effectiveRoles.includes('GUARDIAN')
  const isStaff = effectiveRoles.some((r) =>
    ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'ACCOUNTS', 'ADMIN'].includes(r)
  )

  if (isParent && !isStaff) {
    // Validate actual Guardian-Student canonical relationship in database
    const linkedGuardians = await db.guardianStudent.findMany({
      where: {
        tenantId: session.tenantId,
        guardian: {
          userId: session.uid,
          deletedAt: null,
        },
      },
      select: { studentId: true },
    })

    const authorizedStudentIds = Array.from(new Set(linkedGuardians.map((l) => l.studentId)))

    if (authorizedStudentIds.length === 0) {
      return ok({
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        reportCards: [],
      })
    }

    if (studentId) {
      if (!authorizedStudentIds.includes(studentId)) {
        return Errors.forbidden('You are not authorized to view report cards for this student')
      }
    }

    // Parents ONLY see PUBLISHED report cards for authorized children
    try {
      const result = await ReportCardService.listReportCards(session.tenantId, {
        studentId: studentId || undefined,
        studentIds: studentId ? undefined : authorizedStudentIds,
        academicSessionId,
        term,
        status: 'PUBLISHED',
        page,
        limit,
      })
      return ok(result)
    } catch (err: any) {
      return Errors.bad(err.message)
    }
  }

  try {
    const result = await ReportCardService.listReportCards(session.tenantId, {
      studentId,
      classroomId,
      academicSessionId,
      term,
      status,
      templateId,
      page,
      limit,
    })
    return ok(result)
  } catch (err: any) {
    return Errors.bad(err.message)
  }
}

/**
 * POST /api/v1/academics/report-cards — Create or update a single student's report card
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { academicSessionId, term, studentId, classroomId, templateId, status, overallGrade, remarks, attendancePct, fieldValues } = body

    if (!academicSessionId || !term || !studentId || !templateId) {
      return Errors.validation('academicSessionId, term, studentId, and templateId are required')
    }

    const reportCard = await ReportCardService.saveReportCard(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        academicSessionId,
        term,
        studentId,
        classroomId,
        templateId,
        status,
        overallGrade,
        remarks,
        attendancePct,
        fieldValues: fieldValues || {},
      }
    )

    return ok(reportCard)
  } catch (err: any) {
    return Errors.business('REPORT_CARD_SAVE_FAILED', err.message || 'Failed to save report card', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

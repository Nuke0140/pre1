import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'

/**
 * GET /api/v1/parent/daily-diary
 * Fetches scheduled class daily diary for a parent's linked student on a given date.
 * Strict authorization: Parent must be linked to the student in the current tenant.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const tenantId = session.tenantId
    const url = new URL(req.url)
    const studentId = url.searchParams.get('studentId')
    const dateStr = url.searchParams.get('date') || isoDate()

    if (!studentId) {
      return Errors.badRequest('studentId is required')
    }

    // 1. Authorize: Check that this student is linked to the logged-in parent/guardian
    const guardian = await db.guardian.findFirst({
      where: {
        userId: session.uid,
        tenantId,
        deletedAt: null,
        studentLinks: {
          some: { studentId },
        },
      },
      select: { id: true },
    })

    if (!guardian) {
      return Errors.forbidden('You are not authorized to view class diary for this student')
    }

    // 2. Fetch Student details & assigned classroom
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      include: {
        currentClassroom: {
          include: {
            primaryTeacher: { select: { id: true, fullName: true, email: true } },
            program: { select: { id: true, name: true, code: true } },
            academicSession: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!student) {
      return Errors.notFound('Student not found')
    }

    // Fetch branch info strictly for this student's classroom / enrollment
    const branchId = student.currentClassroom?.branchId || student.branchId
    const branch = branchId
      ? await db.branch.findFirst({
          where: { id: branchId, tenantId, deletedAt: null },
          select: { id: true, name: true, code: true },
        })
      : null

    if (!student.currentClassroomId || !student.currentClassroom) {
      return ok({
        date: dateStr,
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName || ''}`.trim(),
          admissionNo: student.admissionNo,
        },
        classroom: null,
        branch: branch ? { id: branch.id, name: branch.name, code: branch.code } : null,
        activities: [],
      })
    }

    const classroom = student.currentClassroom
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

    // 3. Query scheduled activities for this classroom and date
    // Following publication / visibility rules: only non-cancelled, non-deleted activities
    const activities = await db.classroomActivity.findMany({
      where: {
        tenantId,
        classroomId: classroom.id,
        activityDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    })

    return ok({
      date: dateStr,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        admissionNo: student.admissionNo,
      },
      branch: branch ? { id: branch.id, name: branch.name, code: branch.code } : null,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        programType: classroom.programType,
        programName: classroom.program?.name || classroom.programType,
        academicSessionName: classroom.academicSession?.name || null,
        teacherName: classroom.primaryTeacher?.fullName || null,
      },
      activities: activities.map((act) => ({
        id: act.id,
        title: act.title,
        activityType: act.activityType || 'ACTIVITY',
        startTime: act.startTime || null,
        endTime: act.endTime || null,
        durationMinutes: act.durationMinutes,
        description: act.description || null,
        instructions: act.instructions || null,
        materials: act.materials || null,
        expectedOutcome: act.expectedOutcome || null,
        actualOutcome: act.status === 'COMPLETED' ? act.actualOutcome : null,
        status: act.status,
        teacherName: act.teacher?.fullName || classroom.primaryTeacher?.fullName || null,
      })),
    })
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to fetch scheduled daily diary')
  }
}

export const GET = withApi(_GET)

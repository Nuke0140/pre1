import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { bad, serverError, forbidden } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { AttendanceStatus } from '@prisma/client'
import { isoDate } from '@/lib/format'

/** Sanitize cell against spreadsheet formula injection (=, +, -, @, \t, \r) */
function sanitizeCsvCell(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const raw = String(val)
  let s = raw.trim()
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(s)) {
    s = `'${s}`
  }
  return `"${s.replace(/"/g, '""')}"`
}

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'attendance:read')
  if (isResponse(session)) return session

  const tenantId = session.tenantId
  if (!tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const sp = req.nextUrl.searchParams
    const requestedClassroomId = sp.get('classroomId')?.trim() || undefined
    const requestedBranchId = sp.get('branchId')?.trim() || undefined
    const dateParam = sp.get('date')?.trim() || undefined
    const startDateParam = sp.get('startDate')?.trim() || undefined
    const endDateParam = sp.get('endDate')?.trim() || undefined
    const statusParam = sp.get('status')?.trim()?.toUpperCase() || undefined

    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isInstitutionWide = effectiveRoles.some((r) =>
      ['OWNER', 'PLATFORM_ADMIN'].includes(r)
    )
    const isTeacher =
      effectiveRoles.includes('TEACHER') && !isInstitutionWide

    if (requestedBranchId && requestedBranchId !== 'ALL') {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return forbidden('Access denied: branch scope restricted')
    }

    const branchFilter = (requestedBranchId && requestedBranchId !== 'ALL')
      ? { branchId: requestedBranchId }
      : authorizedBranches === 'ALL'
      ? {}
      : { branchId: { in: authorizedBranches } }

    // Teacher classroom scoping
    let teacherClassroomIds: string[] | undefined = undefined
    if (isTeacher) {
      const assignedRooms = await db.classroom.findMany({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { primaryTeacherId: session.uid },
            { subjectMappings: { some: { specialistTeacherId: session.uid } } },
          ],
        },
        select: { id: true, branchId: true },
      })

      teacherClassroomIds = assignedRooms.map((r) => r.id)
      if (teacherClassroomIds.length === 0) {
        // Teacher is unassigned: return empty CSV with headers
        const headers = [
          'Date',
          'Admission No',
          'Student Name',
          'Campus',
          'Classroom',
          'Status',
          'Marked At',
          'Recorded By',
          'Remarks',
        ]
        const emptyCsv = '\uFEFF' + headers.map(sanitizeCsvCell).join(',') + '\n'
        return new Response(emptyCsv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="attendance_export_${isoDate()}.csv"`,
            'Cache-Control': 'no-cache, no-store',
          },
        })
      }

      if (requestedClassroomId && !teacherClassroomIds.includes(requestedClassroomId)) {
        return forbidden('Teacher is not authorized to access this classroom')
      }
    }

    // Build Prisma where clause
    const where: any = {
      tenantId,
      ...branchFilter,
      ...(statusParam && statusParam !== 'ALL' ? { status: statusParam as AttendanceStatus } : {}),
    }

    if (requestedClassroomId && requestedClassroomId !== 'ALL') {
      where.classroomId = requestedClassroomId
    } else if (teacherClassroomIds) {
      where.classroomId = { in: teacherClassroomIds }
    }

    // Date range filtering
    if (startDateParam && endDateParam) {
      where.date = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      }
    } else if (dateParam) {
      where.date = new Date(dateParam)
    } else if (startDateParam) {
      where.date = { gte: new Date(startDateParam) }
    } else if (endDateParam) {
      where.date = { lte: new Date(endDateParam) }
    }

    const [attendanceRecords, branches] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
            },
          },
          classroom: {
            select: {
              id: true,
              name: true,
              code: true,
              branchId: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { classroom: { name: 'asc' } }, { student: { firstName: 'asc' } }],
        take: 5000,
      }),
      db.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true, code: true },
      }),
    ])

    const branchMap = new Map<string, string>(branches.map((b) => [b.id, b.name]))

    // Look up marker user names
    const markerIds = Array.from(
      new Set(attendanceRecords.map((r) => r.markedById).filter(Boolean))
    ) as string[]
    const markers =
      markerIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: markerIds } },
            select: { id: true, fullName: true },
          })
        : []
    const markerMap = new Map<string, string>(markers.map((m) => [m.id, m.fullName]))

    const headers = [
      'Date',
      'Admission No',
      'Student Name',
      'Campus',
      'Classroom',
      'Status',
      'Marked At',
      'Recorded By',
      'Remarks',
    ]

    const csvRows = [headers.map(sanitizeCsvCell).join(',')]

    for (const record of attendanceRecords) {
      const studentName = record.student
        ? `${record.student.firstName} ${record.student.lastName || ''}`.trim()
        : 'Unknown'
      const admissionNo = record.student?.admissionNo || ''
      const campusName = branchMap.get(record.branchId) || branchMap.get(record.classroom?.branchId) || 'Main Campus'
      const classroomName = record.classroom?.name || 'Classroom'
      const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : ''
      const markedAtTime = record.markedAt
        ? new Date(record.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : ''
      const recordedByName = record.markedById ? (markerMap.get(record.markedById) || 'Staff') : ''
      const notes = record.notes || ''

      const row = [
        sanitizeCsvCell(recordDate),
        sanitizeCsvCell(admissionNo),
        sanitizeCsvCell(studentName),
        sanitizeCsvCell(campusName),
        sanitizeCsvCell(classroomName),
        sanitizeCsvCell(record.status),
        sanitizeCsvCell(markedAtTime),
        sanitizeCsvCell(recordedByName),
        sanitizeCsvCell(notes),
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n')
    const filenameDate = dateParam || startDateParam || isoDate()

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      branchId: effectiveBranchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'EXPORT_ATTENDANCE',
      entity: 'Attendance',
      entityId: requestedClassroomId || 'all',
      module: 'ATTENDANCE',
      severity: 'INFO',
      summary: `Exported ${attendanceRecords.length} attendance records to CSV`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_export_${filenameDate}.csv"`,
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (err: any) {
    return serverError(err.message || 'Failed to export attendance records')
  }
}

export const GET = withApi(_GET)

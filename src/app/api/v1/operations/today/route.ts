import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'
import { dayStatus } from '@/lib/calendar'

/**
 * GET /api/v1/operations/today — principal/owner command centre read model
 * (Spec §33/§34). Exception-driven presentation: CRITICAL / ATTENTION / NORMAL.
 * Default scope: current branch + current academic year + today (Spec §55).
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'operations:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const tenantId = session.tenantId
    const today = isoDate()
    const todayDate = new Date(today)

    const day = await dayStatus(tenantId, todayDate)

    // sections w/ staffing + today's attendance
    const classrooms = await db.classroom.findMany({
      where: { tenantId, isActive: true },
      include: {
        primaryTeacher: { select: { id: true, fullName: true } },
        _count: { select: { students: { where: { status: 'ACTIVE', deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    })

    const todayAttendance = await db.attendance.findMany({
      where: { tenantId, date: todayDate },
      select: { classroomId: true, studentId: true, status: true },
    })

    const sections = classrooms.map((c) => {
      const rows = todayAttendance.filter((a) => a.classroomId === c.id)
      const present = rows.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length
      const absent = rows.filter((r) => r.status === 'ABSENT').length
      const expected = c._count.students
      return {
        id: c.id,
        name: c.name,
        programType: c.programType,
        teacher: c.primaryTeacher?.fullName ?? null,
        teacherId: c.primaryTeacherId,
        capacity: c.capacity,
        expected,
        present,
        absent,
        unmarked: Math.max(0, expected - rows.length),
        attendancePct: expected > 0 ? Math.round((present / expected) * 100) : 0,
        understaffed: !c.primaryTeacherId,
      }
    })

    // exceptions banded (Spec §34)
    const followUps = await db.followUp.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING'] } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { name: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    })

    const critical = followUps.filter((f) => f.severity === 'EMERGENCY' || f.severity === 'URGENT')
    const attention = followUps.filter((f) => f.severity === 'WARNING')
    const normalCount = followUps.filter((f) => f.severity === 'INFO').length

    const shape = (f: (typeof followUps)[number]) => ({
      id: f.id, domain: f.domain, severity: f.severity, status: f.status,
      title: f.title, student: f.student ? `${f.student.firstName} ${f.student.lastName || ''}`.trim() : null,
      classroom: f.classroom?.name ?? null, createdAt: f.createdAt, dueAt: f.dueAt,
      responsibleRole: f.responsibleRole,
    })

    // care events + comms today
    const [careToday, announcementsToday] = await Promise.all([
      db.timelineEntry.count({
        where: { tenantId, createdAt: { gte: todayDate }, type: { in: ['MEAL', 'NAP', 'ACTIVITY', 'BATHROOM', 'ARRIVAL'] } },
      }),
      db.announcement.count({
        where: { tenantId, publishedAt: { gte: todayDate } },
      }),
    ])

    const activeStudents = sections.reduce((s, x) => s + x.expected, 0)
    const totalPresent = sections.reduce((s, x) => s + x.present, 0)

    return ok({
      today,
      schoolStatus: {
        dayStatus: day.status,
        eventTitle: day.eventTitle ?? null,
        attendanceExpected: day.attendanceExpected,
        open: day.workingDay,
      },
      attendance: {
        expected: activeStudents,
        present: totalPresent,
        absent: sections.reduce((s, x) => s + x.absent, 0),
        unmarked: sections.reduce((s, x) => s + x.unmarked, 0),
        pct: activeStudents > 0 ? Math.round((totalPresent / activeStudents) * 100) : 0,
      },
      sections,
      exceptions: {
        critical: critical.map(shape),
        attention: attention.map(shape),
        normalCount,
        criticalCount: critical.length,
        attentionCount: attention.length,
        unresolvedTotal: followUps.length,
      },
      activity: {
        careEventsToday: careToday,
        announcementsToday,
      },
    })
  } catch (e) {
    return Errors.system(e)
  }
}

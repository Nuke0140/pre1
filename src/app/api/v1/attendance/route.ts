import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'

/** GET /api/v1/attendance?classroomId=&date= — class register for a day */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'attendance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const classroomId = sp.get('classroomId')
    const date = sp.get('date') || isoDate()

    if (!classroomId) return Errors.validation('classroomId is required')

    const students = await db.student.findMany({
      where: { tenantId: session.tenantId, currentClassroomId: classroomId, status: 'ACTIVE', deletedAt: null },
      orderBy: { firstName: 'asc' },
    })

    const records = await db.attendance.findMany({
      where: { tenantId: session.tenantId, classroomId, date: new Date(date) },
    })

    const byStudent = new Map(records.map((r) => [r.studentId, r]))
    return ok({
      date,
      students: students.map((s) => {
        const rec = byStudent.get(s.id)
        return {
          studentId: s.id,
          name: `${s.firstName} ${s.lastName || ''}`.trim(),
          admissionNo: s.admissionNo,
          status: rec?.status ?? null,
          notes: rec?.notes ?? null,
        }
      }),
      summary: {
        total: students.length,
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
        unmarked: students.length - records.length,
      },
    })
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/attendance — bulk mark for a class (attendance:mark) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { classroomId, date, entries } = body as {
      classroomId: string
      date: string
      entries: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE'; notes?: string }[]
    }
    if (!classroomId || !date || !Array.isArray(entries)) {
      return Errors.validation('classroomId, date and entries[] are required')
    }

    const classroom = await db.classroom.findFirst({
      where: { id: classroomId, tenantId: session.tenantId },
    })
    if (!classroom) return Errors.notFound('Classroom')

    const dateObj = new Date(date)
    let upserts = 0
    const absentNames: string[] = []

    await db.$transaction(async (tx) => {
      for (const e of entries) {
        const student = await tx.student.findFirst({
          where: { id: e.studentId, tenantId: session.tenantId },
        })
        if (!student) continue
        await tx.attendance.upsert({
          where: { studentId_date: { studentId: e.studentId, date: dateObj } },
          create: {
            tenantId: session.tenantId!,
            branchId: classroom.branchId,
            classroomId,
            studentId: e.studentId,
            date: dateObj,
            status: e.status,
            notes: e.notes,
            markedById: session.uid,
          },
          update: {
            status: e.status,
            notes: e.notes,
            markedById: session.uid,
            markedAt: new Date(),
          },
        })
        upserts++
        if (e.status === 'ABSENT') absentNames.push(student.firstName)
      }
    })

    const { audit: auditLog } = await import('@/lib/sequence')
    await auditLog({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Attendance',
      entityId: classroomId,
      summary: `Attendance marked for ${classroom.name} on ${date} — ${upserts} students`,
    })

    return ok({ markedCount: upserts, absentCount: absentNames.length })
  } catch (e) {
    return Errors.system(e)
  }
}

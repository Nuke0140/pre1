import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/students/{id} — full profile: guardians, attendance, invoices, timeline */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'students:read')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const student = await db.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        currentClassroom: { include: { primaryTeacher: { select: { fullName: true } } } },
        guardians: { include: { guardian: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { payments: true },
        },
        timelineEntries: { orderBy: { createdAt: 'desc' }, take: 20 },
        observations: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
    if (!student) return Errors.notFound('Student')

    // Parent can only see their own child
    if (session.role === 'PARENT') {
      const isLinked = student.guardians.some((g) => {
        return g.guardian.userId === session.uid
      })
      if (!isLinked) return Errors.forbidden('You can only view your own child')
    }

    const attendanceStats = {
      present: student.attendances.filter((a) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length,
      total: student.attendances.length,
    }

    return ok({
      id: student.id,
      admissionNo: student.admissionNo,
      name: `${student.firstName} ${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      dob: student.dob,
      gender: student.gender,
      status: student.status,
      admissionDate: student.admissionDate,
      bloodGroup: student.bloodGroup,
      address: student.address,
      photoUrl: student.photoUrl,
      classroom: student.currentClassroom
        ? {
            id: student.currentClassroom.id,
            name: student.currentClassroom.name,
            programType: student.currentClassroom.programType,
            teacher: student.currentClassroom.primaryTeacher?.fullName ?? null,
          }
        : null,
      guardians: student.guardians.map((g) => ({
        id: g.guardian.id,
        name: g.guardian.fullName,
        relationship: g.guardian.relationship,
        phone: g.guardian.phone,
        email: g.guardian.email,
        isPrimary: g.isPrimary,
        canPickup: g.canPickup,
        isFeePayer: g.isFeePayer,
      })),
      attendance: {
        recent: student.attendances.slice(0, 10).map((a) => ({
          date: a.date, status: a.status,
        })),
        present: attendanceStats.present,
        total: attendanceStats.total,
        pct: attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0,
      },
      invoices: student.invoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        title: i.title,
        totalCents: i.totalCents,
        paidCents: i.paidCents,
        balanceCents: i.balanceCents,
        status: i.status,
        dueDate: i.dueDate,
      })),
      timeline: student.timelineEntries.map((t) => ({
        id: t.id, type: t.type, title: t.title, body: t.body, mood: t.mood, at: t.createdAt,
      })),
      observations: student.observations.map((o) => ({
        id: o.id, narrative: o.narrative, milestoneTags: o.milestoneTags,
        status: o.status, observedAt: o.observedAt,
      })),
    })
  } catch (e) {
    return Errors.system(e)
  }
}

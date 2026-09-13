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
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: {
        currentClassroom: { include: { primaryTeacher: { select: { fullName: true } } } },
        guardians: { include: { guardian: true } },
        allocations: {
          include: { classroom: true, academicSession: true },
          orderBy: { startedAt: 'desc' },
        },
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
      seatNumber: student.seatNumber,
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
            code: student.currentClassroom.code,
            programType: student.currentClassroom.programType,
            teacher: student.currentClassroom.primaryTeacher?.fullName ?? null,
          }
        : null,
      allocations: student.allocations.map((a) => ({
        id: a.id,
        sessionName: a.academicSession.name,
        classroomName: a.classroom.name,
        programType: a.programType,
        status: a.status,
        startedAt: a.startedAt,
        endedAt: a.endedAt,
        reason: a.reason,
      })),
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

/** PATCH /api/v1/students/{id} — update student details & seat number */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const student = await db.student.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: { currentClassroom: true },
    })
    if (!student) return Errors.notFound('Student')

    const body = await req.json()
    const { firstName, lastName, bloodGroup, address, seatNumber, photoUrl, generateSeatNumber } = body

    let newSeatNumber = seatNumber
    if (generateSeatNumber) {
      // Collision-safe database-driven seat number generation
      const count = await db.student.count({
        where: {
          tenantId: session.tenantId,
          currentClassroomId: student.currentClassroomId,
          seatNumber: { not: null },
        },
      })
      const prefix = student.currentClassroom?.code || 'PRE'
      newSeatNumber = `${prefix}-${String(count + 1).padStart(3, '0')}`
    }

    const updated = await db.student.update({
      where: { id: student.id },
      data: {
        ...(firstName ? { firstName: firstName.trim() } : {}),
        ...(lastName !== undefined ? { lastName: lastName?.trim() || null } : {}),
        ...(bloodGroup !== undefined ? { bloodGroup } : {}),
        ...(address !== undefined ? { address: address?.trim() || null } : {}),
        ...(newSeatNumber !== undefined ? { seatNumber: newSeatNumber } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      },
    })

    return ok({
      id: updated.id,
      seatNumber: updated.seatNumber,
      name: `${updated.firstName} ${updated.lastName || ''}`.trim(),
    })
  } catch (e) {
    return Errors.system(e)
  }
}

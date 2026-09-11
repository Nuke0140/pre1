import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { StudentDetailClient } from './StudentDetailClient'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await db.student.findUnique({
    where: { id },
    include: {
      currentClassroom: { include: { primaryTeacher: true } },
      guardians: { include: { guardian: true } },
      attendances: { orderBy: { date: 'desc' }, take: 14 },
      invoices: { orderBy: { createdAt: 'desc' } },
      observations: { orderBy: { createdAt: 'desc' }, take: 10 },
      timelineEntries: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!student || student.deletedAt) notFound()

  const present = student.attendances.filter((a) =>
    ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)
  ).length

  return (
    <StudentDetailClient
      student={{
        id: student.id,
        admissionNo: student.admissionNo,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        firstName: student.firstName,
        dob: student.dob.toISOString(),
        gender: student.gender,
        status: student.status,
        bloodGroup: student.bloodGroup,
        address: student.address,
        admissionDate: student.admissionDate.toISOString(),
        classroom: student.currentClassroom
          ? {
              name: student.currentClassroom.name,
              programType: student.currentClassroom.programType,
              teacher: student.currentClassroom.primaryTeacher?.fullName ?? null,
            }
          : null,
        guardians: student.guardians.map((g) => ({
          guardianId: g.guardianId,
          name: g.guardian.fullName,
          relationship: g.guardian.relationship,
          phone: g.guardian.phone,
          email: g.guardian.email,
          isPrimary: g.isPrimary,
          canPickup: g.canPickup,
        })),
        attendance: {
          pct: student.attendances.length > 0 ? Math.round((present / student.attendances.length) * 100) : 0,
          present,
          total: student.attendances.length,
          recent: student.attendances.slice(0, 8).map((a) => ({
            date: a.date.toISOString().slice(0, 10),
            status: a.status,
          })),
        },
        invoices: student.invoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          title: i.title,
          totalCents: i.totalCents,
          paidCents: i.paidCents,
          balanceCents: i.balanceCents,
          status: i.status,
          dueDate: i.dueDate.toISOString(),
        })),
        observations: student.observations.map((o) => ({
          id: o.id,
          narrative: o.narrative,
          milestoneTags: o.milestoneTags,
          status: o.status,
          observedAt: o.observedAt.toISOString(),
        })),
        timeline: student.timelineEntries.map((t) => ({
          id: t.id,
          type: t.type,
          title: t.title,
          body: t.body,
          at: t.createdAt.toISOString(),
        })),
      }}
    />
  )
}

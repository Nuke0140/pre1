import { can } from '@/lib/auth'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { normalizeRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { TeacherToday } from './TeacherToday'
import { ParentToday } from './ParentToday'
import { StaffDashboardView } from './StaffDashboardView'
import { FinanceDashboardView } from './FinanceDashboardView'
import { calculateDashboardFeeMetrics } from '@/lib/fees/dashboard-fees'
import { currentSession } from '@/lib/academic'

/**
 * Enterprise Dashboard Controller — /app/dashboard
 * Role-aware, tenant-scoped, server-authorized dashboard orchestrator.
 */
export default async function DashboardPage() {
  const session = await getSession()

  // 1. Unauthenticated or missing tenant context
  if (!session) {
    redirect('/auth/login')
  }

  // 2. Platform Admin guard: Platform admins belong in system tenant operations
  if (session.role === 'PLATFORM_ADMIN') {
    redirect('/onboard')
  }

  if (!session.tenantId) {
    redirect('/auth/login')
  }

  const tenantId = session.tenantId
  const canonicalRole = normalizeRole(session.role)

  // 3. School Setup Status Query for Leadership
  let setup: { status: string } | null = null
  if (canonicalRole === 'OWNER' || canonicalRole === 'PRINCIPAL') {
    setup = await db.schoolSetup.findUnique({ where: { tenantId }, select: { status: true } })
  }

  // 4. Academic Operations Persona (TEACHER, COORDINATOR)
  if (canonicalRole === 'TEACHER' || canonicalRole === 'COORDINATOR') {
    return <TeacherToday />
  }

  // 5. Family Persona (PARENT, GUARDIAN) — Scoped strictly to linked children
  if (canonicalRole === 'PARENT' || canonicalRole === 'GUARDIAN') {
    return <ParentToday />
  }

  // 6. Operational Support & Restricted Staff Roles (STAFF, ATTENDANT, DRIVER, RECEPTIONIST)
  // Non-leadership, non-finance operational personnel get the safe restricted duty workspace
  if (
    canonicalRole === 'STAFF' ||
    canonicalRole === 'ATTENDANT' ||
    canonicalRole === 'DRIVER' ||
    canonicalRole === 'RECEPTIONIST'
  ) {
    return (
      <StaffDashboardView
        role={canonicalRole}
        name={session.name || 'Staff Member'}
      />
    )
  }

  // 7. Finance Persona (ACCOUNTS, and legacy alias ACCOUNTANT)
  // Dedicated financial command center with hardened fee metrics, draft work queues, and receivables
  if (canonicalRole === 'ACCOUNTS') {
    const canReadFinance = can(session.role, 'finance:read')
    if (!canReadFinance) {
      redirect('/app/home')
    }

    const activeSession = await currentSession(tenantId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [invoices, recentInvoicesRaw, recentPaymentsRaw] = await Promise.all([
      db.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(activeSession?.id ? { academicSessionId: activeSession.id } : {}),
        },
        select: {
          totalCents: true,
          paidCents: true,
          balanceCents: true,
          status: true,
          dueDate: true,
        },
      }),
      db.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(activeSession?.id ? { academicSessionId: activeSession.id } : {}),
        },
        select: {
          id: true,
          invoiceNumber: true,
          totalCents: true,
          paidCents: true,
          balanceCents: true,
          status: true,
          dueDate: true,
          student: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      db.payment.findMany({
        where: {
          tenantId,
          ...(activeSession?.id ? { invoice: { academicSessionId: activeSession.id } } : {}),
        },
        select: {
          id: true,
          paymentNumber: true,
          amountCents: true,
          method: true,
          status: true,
          paymentDate: true,
          student: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: 8,
      }),
    ])

    const feeMetrics = calculateDashboardFeeMetrics(invoices, today)

    return (
      <FinanceDashboardView
        role={session.role}
        sessionName={activeSession?.name}
        metrics={feeMetrics}
        recentInvoices={recentInvoicesRaw.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          studentName: inv.student
            ? `${inv.student.firstName} ${inv.student.lastName || ''}`.trim()
            : 'Unassigned',
          totalCents: inv.totalCents,
          paidCents: inv.paidCents,
          balanceCents: inv.balanceCents,
          status: inv.status,
          dueDate: inv.dueDate.toISOString(),
        }))}
        recentPayments={recentPaymentsRaw.map((pmt) => ({
          id: pmt.id,
          paymentNumber: pmt.paymentNumber,
          studentName: pmt.student
            ? `${pmt.student.firstName} ${pmt.student.lastName || ''}`.trim()
            : 'Unassigned',
          amountCents: pmt.amountCents,
          method: pmt.method,
          status: pmt.status,
          paymentDate: pmt.paymentDate.toISOString(),
        }))}
      />
    )
  }

  // 8. Leadership Executive Dashboard (OWNER, PRINCIPAL)
  // Explicitly check for authorized roles before proceeding with institutional data aggregation
  const isAuthorizedExecutive = canonicalRole === 'OWNER' || canonicalRole === 'PRINCIPAL'

  if (!isAuthorizedExecutive) {
    // Unknown or unsupported role receives explicit safe rejection to home launchpad
    redirect('/app/home')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Strict server-side permission checks
  const canReadFinance = can(session.role, 'finance:read')
  const canReadStudents = can(session.role, 'students:read')
  const canReadAdmissions = can(session.role, 'admissions:read')
  const canReadAttendance = can(session.role, 'attendance:read')
  const canReadAudit = can(session.role, 'audit:read')

  // Fetch only strictly authorized data alongside active academic session
  const activeAcademicSession = await currentSession(tenantId)

  const [activeStudents, presentToday, invoices, pendingApps, newLeads, classrooms, recentAudit] =
    await Promise.all([
      canReadStudents
        ? db.student.count({ where: { tenantId, status: 'ACTIVE', deletedAt: null } })
        : 0,
      canReadAttendance
        ? db.attendance.count({
            where: { tenantId, date: today, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } },
          })
        : 0,
      canReadFinance
        ? db.invoice.findMany({
            where: {
              tenantId,
              deletedAt: null,
              ...(activeAcademicSession?.id ? { academicSessionId: activeAcademicSession.id } : {}),
            },
            select: { totalCents: true, paidCents: true, balanceCents: true, status: true, dueDate: true },
          })
        : [],
      canReadAdmissions
        ? db.admissionApplication.count({
            where: { tenantId, status: { in: ['SUBMITTED', 'DOCUMENT_PENDING', 'VERIFIED', 'UNDER_REVIEW'] } },
          })
        : 0,
      canReadAdmissions
        ? db.lead.count({ where: { tenantId, status: { in: ['NEW', 'CONTACTED'] }, deletedAt: null } })
        : 0,
      canReadStudents
        ? db.classroom.findMany({
            where: { tenantId, isActive: true },
            include: { _count: { select: { students: true } } },
            orderBy: { name: 'asc' },
          })
        : [],
      canReadAudit
        ? db.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 8 })
        : [],
    ])

  // Calculate standardized fee metrics (strictly excludes DRAFT, CANCELLED, and WRITTEN_OFF)
  const { billed, collected, overdue, collectRate } = calculateDashboardFeeMetrics(invoices, today)

  // 7-day attendance trend (Single aggregated database query instead of 14 roundtrips)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const attendanceGrouped = canReadAttendance
    ? await db.attendance.groupBy({
        by: ['date', 'status'],
        where: {
          tenantId,
          date: { gte: sevenDaysAgo, lte: today },
        },
        _count: { _all: true },
      })
    : []

  const trend = canReadAttendance
    ? Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        const dateKey = d.toDateString()

        let present = 0
        let total = 0
        for (const item of attendanceGrouped) {
          if (new Date(item.date).toDateString() === dateKey) {
            total += item._count._all
            if (['PRESENT', 'LATE', 'HALF_DAY'].includes(item.status)) {
              present += item._count._all
            }
          }
        }

        return {
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          pct: total > 0 ? Math.round((present / total) * 100) : 0,
        }
      })
    : []

  return (
    <DashboardClient
      role={session.role}
      setup={setup}
      sessionName={activeAcademicSession?.name}
      userName={session.name || undefined}
      perms={{
        students: canReadStudents,
        admissions: canReadAdmissions,
        finance: canReadFinance,
        attendance: canReadAttendance,
        audit: canReadAudit,
      }}
      data={{
        activeStudents,
        presentToday,
        attendancePct: activeStudents > 0 ? Math.round((presentToday / activeStudents) * 100) : 0,
        billed,
        collected,
        overdue,
        collectRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
        pendingApps,
        newLeads,
        classrooms: classrooms.map((c) => ({
          name: c.name,
          programType: c.programType,
          students: c._count.students,
          capacity: c.capacity,
        })),
        trend,
        recentActivity: recentAudit.map((a) => ({
          summary: a.summary || `${a.action} ${a.entity}`,
          actor: a.actorName,
          at: a.createdAt.toISOString(),
        })),
      }}
    />
  )
}

/**
 * PreO AI — school knowledge snapshot.
 *
 * Builds a compact, permission-scoped JSON fact sheet about one school (tenant),
 * optionally narrowed to a single branch. Everything the assistant is allowed to
 * say comes from here, so access control is enforced by what we put in.
 */
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { can, type Role } from '@/lib/auth'

export interface AiScope {
  tenantId: string
  branchId: string | null
  roles: Role[]
}

const rupees = (cents: unknown) => Math.round(Number(cents ?? 0) / 100)
const num = (v: unknown) => Number(v ?? 0)
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

// ponytail: in-process cache, swap for Redis if the app runs on multiple instances
const cache = new Map<string, { at: number; data: SchoolContext }>()
const TTL_MS = 2 * 60 * 1000

export type SchoolContext = Awaited<ReturnType<typeof build>>

export async function buildSchoolContext(scope: AiScope): Promise<SchoolContext> {
  const key = `${scope.tenantId}|${scope.branchId ?? 'ALL'}|${[...scope.roles].sort().join(',')}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data
  const data = await build(scope)
  cache.set(key, { at: Date.now(), data })
  return data
}

async function build({ tenantId, branchId, roles }: AiScope) {
  const perms = {
    finance: can(roles, 'finance:read'),
    students: can(roles, 'students:read'),
    admissions: can(roles, 'admissions:read'),
    hr: can(roles, 'hr:read'),
    academics: can(roles, 'academics:read') || can(roles, 'students:read'),
    transport: can(roles, 'transport:read'),
    inventory: can(roles, 'inventory:read'),
  }
  // Branch filter fragments (classrooms alias "c", generic alias with branchId column)
  const bc = branchId ? Prisma.sql`AND c."branchId" = ${branchId}` : Prisma.empty
  const bx = (alias: string) => (branchId ? Prisma.sql`AND ${Prisma.raw(`${alias}."branchId"`)} = ${branchId}` : Prisma.empty)

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { name: true, city: true, state: true, timezone: true } })
  const branches = await db.branch.findMany({
    where: { tenantId, deletedAt: null, ...(branchId ? { id: branchId } : {}) },
    select: { id: true, name: true, code: true, isMain: true },
    orderBy: { name: 'asc' },
  })
  const branchName = new Map(branches.map((b) => [b.id, b.name]))
  const sessions = await db.academicSession.findMany({
    where: { tenantId },
    select: { id: true, name: true, startDate: true, endDate: true, status: true, isCurrent: true },
    orderBy: { startDate: 'asc' },
  })
  const tz = tenant?.timezone || 'Asia/Kolkata'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  // ── Enrollment + outcomes per session × branch × program ──
  const enrol = await db.$queryRaw<any[]>`
    SELECT a."academicSessionId" sid, c."branchId" bid, a."programType"::text prog,
           count(DISTINCT a."studentId") students,
           count(DISTINCT a."studentId") FILTER (WHERE a.status = 'PROMOTED') promoted,
           count(DISTINCT a."studentId") FILTER (WHERE a.status = 'COMPLETED') completed,
           count(DISTINCT a."studentId") FILTER (WHERE a.status = 'WITHDRAWN') withdrawn,
           count(DISTINCT a."studentId") FILTER (WHERE a.status = 'ACTIVE') active,
           count(DISTINCT a."studentId") FILTER (WHERE s.gender = 'FEMALE') girls,
           count(DISTINCT a."studentId") FILTER (WHERE s."admissionDate" >= se."startDate" - interval '120 days') new_admissions
    FROM student_allocations a
    JOIN classrooms c ON c.id = a."classroomId"
    JOIN students s ON s.id = a."studentId"
    JOIN academic_sessions se ON se.id = a."academicSessionId"
    WHERE a."tenantId" = ${tenantId} ${bc}
    GROUP BY 1, 2, 3`

  const attendance = await db.$queryRaw<any[]>`
    SELECT a."academicSessionId" sid, c."branchId" bid, c."programType"::text prog,
           count(*) marked,
           count(*) FILTER (WHERE a.status IN ('PRESENT','LATE','HALF_DAY')) present,
           count(*) FILTER (WHERE a.status = 'ABSENT') absent,
           count(*) FILTER (WHERE a.status = 'LATE') late
    FROM attendance a JOIN classrooms c ON c.id = a."classroomId"
    WHERE a."tenantId" = ${tenantId} ${bc}
    GROUP BY 1, 2, 3`

  const fees = perms.finance
    ? await db.$queryRaw<any[]>`
    SELECT f."academicSessionId" sid, c."branchId" bid, c."programType"::text prog,
           sum(f."amountDueCents") billed, sum(f."amountPaidCents") collected,
           sum(f."remainingAmountCents") outstanding,
           sum(f."remainingAmountCents") FILTER (WHERE f."dueDate" < now()) overdue,
           count(DISTINCT f."studentId") FILTER (WHERE f."remainingAmountCents" > 0 AND f."dueDate" < now()) defaulters
    FROM student_fee_schedules f JOIN classrooms c ON c.id = f."classroomId"
    WHERE f."tenantId" = ${tenantId} AND f.status <> 'CANCELLED' ${bc}
    GROUP BY 1, 2, 3`
    : []

  const progress = perms.academics
    ? await db.$queryRaw<any[]>`
    SELECT p."academicSessionId" sid, c."branchId" bid, a."programType"::text prog,
           count(*) goals,
           count(*) FILTER (WHERE p.stage = 'ACHIEVED') achieved,
           count(*) FILTER (WHERE p.stage = 'DEVELOPING') developing,
           count(*) FILTER (WHERE p.stage IN ('INTRODUCED','NOT_STARTED')) emerging
    FROM student_progress p
    JOIN student_allocations a ON a."studentId" = p."studentId" AND a."academicSessionId" = p."academicSessionId"
    JOIN classrooms c ON c.id = a."classroomId"
    WHERE p."tenantId" = ${tenantId} ${bc}
    GROUP BY 1, 2, 3`
    : []

  const grades = perms.academics
    ? await db.$queryRaw<any[]>`
    SELECT r."academicSessionId" sid, c."branchId" bid, c."programType"::text prog, r."overallGrade" grade,
           count(*) n, avg(r."attendancePct") att
    FROM student_report_cards r JOIN classrooms c ON c.id = r."classroomId"
    WHERE r."tenantId" = ${tenantId} AND r.term = 'TERM_2' ${bc}
    GROUP BY 1, 2, 3, 4`
    : []

  const observations = perms.academics
    ? await db.$queryRaw<any[]>`
    SELECT o."academicSessionId" sid, o.concern::text concern, count(*) n
    FROM observations o JOIN classrooms c ON c.id = o."classroomId"
    WHERE o."tenantId" = ${tenantId} ${bc}
    GROUP BY 1, 2`
    : []

  // ── Assemble the session × branch × program cube ──
  const k = (r: any) => `${r.sid}|${r.bid}|${r.prog}`
  const idx = <T,>(rows: T[]) => new Map(rows.map((r: any) => [k(r), r]))
  const att = idx(attendance), fee = idx(fees), prg = idx(progress)
  const gradeBy = new Map<string, { dist: Record<string, number>; att: number[] }>()
  for (const g of grades) {
    const e = gradeBy.get(k(g)) ?? { dist: {}, att: [] }
    e.dist[g.grade ?? 'NA'] = num(g.n)
    e.att.push(num(g.att))
    gradeBy.set(k(g), e)
  }
  const sessName = new Map(sessions.map((s) => [s.id, s.name]))
  const cube = enrol
    .map((e) => {
      const a = att.get(k(e)), f = fee.get(k(e)), p = prg.get(k(e)), g = gradeBy.get(k(e))
      const students = num(e.students)
      return {
        session: sessName.get(e.sid) ?? e.sid,
        branch: branchName.get(e.bid) ?? e.bid,
        program: e.prog,
        students,
        newAdmissions: num(e.new_admissions),
        girls: num(e.girls),
        boys: students - num(e.girls),
        outcome: { stillActive: num(e.active), promoted: num(e.promoted), graduated: num(e.completed), leftSchool: num(e.withdrawn) },
        attendanceRatePct: a ? pct(num(a.present), num(a.marked)) : null,
        absences: a ? num(a.absent) : null,
        ...(perms.finance && f
          ? {
              feesINR: {
                billed: rupees(f.billed),
                collected: rupees(f.collected),
                outstanding: rupees(f.outstanding),
                overdue: rupees(f.overdue),
                collectionRatePct: pct(num(f.collected), num(f.billed)),
                studentsWithOverdue: num(f.defaulters),
                revenuePerStudent: students ? Math.round(rupees(f.collected) / students) : null,
              },
            }
          : {}),
        ...(p
          ? {
              learningGoals: {
                assessed: num(p.goals),
                achievedPct: pct(num(p.achieved), num(p.goals)),
                developingPct: pct(num(p.developing), num(p.goals)),
                emergingPct: pct(num(p.emerging), num(p.goals)),
              },
            }
          : {}),
        ...(g ? { reportCardGradesFinalTerm: g.dist, reportCardAvgAttendancePct: Math.round(g.att.reduce((s, x) => s + x, 0) / g.att.length) } : {}),
      }
    })
    .sort((a, b) => a.session.localeCompare(b.session) || a.branch.localeCompare(b.branch) || a.program.localeCompare(b.program))

  const sessionTotals = sessions.map((s) => {
    const rows = cube.filter((r) => r.session === s.name)
    const sum = (f: (r: any) => number | null | undefined) => rows.reduce((t, r) => t + (f(r) ?? 0), 0)
    const attRows = attendance.filter((a) => a.sid === s.id)
    const prRows = progress.filter((p) => p.sid === s.id)
    const obs = Object.fromEntries(observations.filter((o) => o.sid === s.id).map((o) => [o.concern, num(o.n)]))
    return {
      session: s.name,
      status: s.status,
      isCurrent: s.isCurrent,
      from: s.startDate.toISOString().slice(0, 10),
      to: s.endDate.toISOString().slice(0, 10),
      students: sum((r) => r.students),
      newAdmissions: sum((r) => r.newAdmissions),
      outcome: {
        promoted: sum((r) => r.outcome.promoted),
        graduated: sum((r) => r.outcome.graduated),
        leftSchool: sum((r) => r.outcome.leftSchool),
        stillActive: sum((r) => r.outcome.stillActive),
      },
      attendanceRatePct: pct(attRows.reduce((t, a) => t + num(a.present), 0), attRows.reduce((t, a) => t + num(a.marked), 0)),
      ...(perms.finance
        ? {
            feesINR: {
              billed: sum((r) => r.feesINR?.billed),
              collected: sum((r) => r.feesINR?.collected),
              outstanding: sum((r) => r.feesINR?.outstanding),
              overdue: sum((r) => r.feesINR?.overdue),
              collectionRatePct: pct(sum((r) => r.feesINR?.collected), sum((r) => r.feesINR?.billed)),
            },
          }
        : {}),
      ...(prRows.length
        ? { learningGoalsAchievedPct: pct(prRows.reduce((t, p) => t + num(p.achieved), 0), prRows.reduce((t, p) => t + num(p.goals), 0)) }
        : {}),
      ...(Object.keys(obs).length ? { teacherObservationsByConcern: obs } : {}),
    }
  })

  // ── Trends ──
  const monthlyCollections = perms.finance
    ? (
        await db.$queryRaw<any[]>`
      SELECT to_char(date_trunc('month', p."paymentDate"), 'YYYY-MM') m, sum(p."amountCents") amt, count(*) n
      FROM payments p JOIN students s ON s.id = p."studentId"
      WHERE p."tenantId" = ${tenantId} AND p.status = 'SUCCESS' AND p."vendorId" IS NULL ${bx('s')}
      GROUP BY 1 ORDER BY 1`
      ).map((r) => ({ month: r.m, collectedINR: rupees(r.amt), payments: num(r.n) }))
    : undefined

  const paymentMethods = perms.finance
    ? (
        await db.$queryRaw<any[]>`
      SELECT p.method::text method, sum(p."amountCents") amt, count(*) n
      FROM payments p JOIN students s ON s.id = p."studentId"
      WHERE p."tenantId" = ${tenantId} AND p.status = 'SUCCESS' AND p."vendorId" IS NULL ${bx('s')}
      GROUP BY 1 ORDER BY 2 DESC`
      ).map((r) => ({ method: r.method, collectedINR: rupees(r.amt), payments: num(r.n) }))
    : undefined

  const monthlyAttendance = (
    await db.$queryRaw<any[]>`
    SELECT to_char(date_trunc('month', a.date), 'YYYY-MM') m, count(*) marked,
           count(*) FILTER (WHERE a.status IN ('PRESENT','LATE','HALF_DAY')) present
    FROM attendance a WHERE a."tenantId" = ${tenantId} ${bx('a')}
    GROUP BY 1 ORDER BY 1`
  ).map((r) => ({ month: r.m, attendanceRatePct: pct(num(r.present), num(r.marked)) }))

  const weekdayAttendance = (
    await db.$queryRaw<any[]>`
    SELECT extract(isodow from a.date)::int d, count(*) marked,
           count(*) FILTER (WHERE a.status IN ('PRESENT','LATE','HALF_DAY')) present
    FROM attendance a WHERE a."tenantId" = ${tenantId} ${bx('a')}
    GROUP BY 1 ORDER BY 1`
  ).map((r) => ({ weekday: ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][r.d], attendanceRatePct: pct(num(r.present), num(r.marked)) }))

  // ── Admissions funnel per session window ──
  const admissions = perms.admissions
    ? await Promise.all(
        sessions.map(async (s) => {
          const from = new Date(s.startDate.getTime() - 200 * 86400000)
          const to = s.startDate.getTime() > Date.now() ? new Date() : new Date(s.startDate.getTime() + 165 * 86400000)
          const [leads] = await db.$queryRaw<any[]>`
            SELECT count(*) total, count(*) FILTER (WHERE status = 'CONVERTED') converted, count(*) FILTER (WHERE status = 'LOST') lost
            FROM crm_leads l WHERE l."tenantId" = ${tenantId} AND l."createdAt" BETWEEN ${from} AND ${to} ${bx('l')}`
          const src = await db.$queryRaw<any[]>`
            SELECT source::text source, count(*) n, count(*) FILTER (WHERE status = 'CONVERTED') converted
            FROM crm_leads l WHERE l."tenantId" = ${tenantId} AND l."createdAt" BETWEEN ${from} AND ${to} ${bx('l')}
            GROUP BY 1 ORDER BY 2 DESC`
          const apps = await db.$queryRaw<any[]>`
            SELECT status::text status, count(*) n FROM admission_applications ap
            WHERE ap."tenantId" = ${tenantId} AND ap."academicSessionId" = ${s.id} ${bx('ap')} GROUP BY 1`
          return {
            session: s.name,
            enquiries: num(leads?.total),
            enquiriesConverted: num(leads?.converted),
            enquiriesLost: num(leads?.lost),
            enquiryToEnrolmentPct: pct(num(leads?.converted), num(leads?.total)),
            enquiriesBySource: src.map((r) => ({ source: r.source, enquiries: num(r.n), converted: num(r.converted) })),
            applicationsByStatus: Object.fromEntries(apps.map((a) => [a.status, num(a.n)])),
          }
        }),
      )
    : undefined

  // ── Current session live view ──
  const current = sessions.find((s) => s.isCurrent) ?? sessions[sessions.length - 1]
  const classrooms = current
    ? (
        await db.$queryRaw<any[]>`
      SELECT c.name, c."programType"::text prog, c.capacity, c."branchId" bid, u."fullName" teacher,
             (SELECT count(*) FROM students s WHERE s."currentClassroomId" = c.id AND s.status = 'ACTIVE' AND s."deletedAt" IS NULL) enrolled,
             (SELECT count(*) FROM attendance a WHERE a."classroomId" = c.id AND a.date > now() - interval '30 days') marked30,
             (SELECT count(*) FROM attendance a WHERE a."classroomId" = c.id AND a.date > now() - interval '30 days' AND a.status IN ('PRESENT','LATE','HALF_DAY')) present30
      FROM classrooms c LEFT JOIN users u ON u.id = c."primaryTeacherId"
      WHERE c."tenantId" = ${tenantId} AND c."academicSessionId" = ${current.id} ${bc}
      ORDER BY c.name`
      ).map((c) => ({
        classroom: c.name,
        program: c.prog,
        branch: branchName.get(c.bid) ?? c.bid,
        teacher: c.teacher,
        enrolled: num(c.enrolled),
        capacity: num(c.capacity),
        occupancyPct: pct(num(c.enrolled), num(c.capacity)),
        attendanceLast30DaysPct: pct(num(c.present30), num(c.marked30)),
      }))
    : []

  const lastMarked = await db.$queryRaw<any[]>`
    SELECT a.date::text d, count(*) marked, count(*) FILTER (WHERE a.status IN ('PRESENT','LATE','HALF_DAY')) present
    FROM attendance a WHERE a."tenantId" = ${tenantId} ${bx('a')}
    GROUP BY 1 ORDER BY 1 DESC LIMIT 1`

  const staff = perms.hr
    ? {
        byRole: Object.fromEntries(
          (
            await db.$queryRaw<any[]>`
          SELECT tu.role::text role, count(*) n FROM tenant_users tu
          WHERE tu."tenantId" = ${tenantId} AND tu.role NOT IN ('PARENT','GUARDIAN') AND tu."deletedAt" IS NULL AND tu.status = 'ACTIVE'
          ${branchId ? Prisma.sql`AND (tu."branchId" = ${branchId} OR tu."branchId" IS NULL)` : Prisma.empty}
          GROUP BY 1`
          ).map((r) => [r.role, num(r.n)]),
        ),
        ...(perms.finance
          ? {
              monthlyPayrollINR: (
                await db.$queryRaw<any[]>`
            SELECT pc.year, pc.month, sum(p."netSalary") net, sum(p."grossEarnings") gross, count(*) n
            FROM payslips p JOIN payroll_cycles pc ON pc.id = p."payrollCycleId"
            WHERE p."tenantId" = ${tenantId}
            GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC LIMIT 12`
              ).map((r) => ({ month: `${r.year}-${String(r.month).padStart(2, '0')}`, gross: Math.round(num(r.gross)), net: Math.round(num(r.net)), staffPaid: num(r.n) })),
            }
          : {}),
        staffAttendanceLast30DaysPct: await (async () => {
          const [r] = await db.$queryRaw<any[]>`
            SELECT count(*) marked, count(*) FILTER (WHERE a.status IN ('PRESENT','LATE','HALF_DAY')) present
            FROM attendance_staff a WHERE a."tenantId" = ${tenantId} AND a.date > now() - interval '30 days' ${bx('a')}`
          return pct(num(r?.present), num(r?.marked))
        })(),
      }
    : undefined

  const followUps = Object.fromEntries(
    (
      await db.$queryRaw<any[]>`
      SELECT f.domain::text domain, count(*) n FROM follow_ups f
      WHERE f."tenantId" = ${tenantId} AND f.status NOT IN ('RESOLVED','CLOSED') ${bx('f')}
      GROUP BY 1`
    ).map((r) => [r.domain, num(r.n)]),
  )

  const transport = perms.transport
    ? await (async () => {
        const [r] = await db.$queryRaw<any[]>`
          SELECT (SELECT count(*) FROM transport_routes t WHERE t."tenantId" = ${tenantId} AND t.status = 'ACTIVE' ${bx('t')}) routes,
                 (SELECT count(*) FROM student_transport_assignments t WHERE t."tenantId" = ${tenantId} AND t.status = 'ACTIVE' ${bx('t')}) riders,
                 (SELECT count(*) FROM transport_incidents t WHERE t."tenantId" = ${tenantId} ${bx('t')}) incidents,
                 (SELECT round(avg("delayMinutes")::numeric, 1) FROM transport_trips t WHERE t."tenantId" = ${tenantId} ${bx('t')}) avg_delay`
        return { activeRoutes: num(r.routes), activeRiders: num(r.riders), incidentsAllTime: num(r.incidents), avgTripDelayMin: num(r.avg_delay) }
      })()
    : undefined

  const inventory = perms.inventory
    ? await (async () => {
        const [r] = await db.$queryRaw<any[]>`
          SELECT round(sum(s.quantity * coalesce(s."averageCost", s."unitCost", 0))::numeric) valuation, count(DISTINCT s."itemId") items
          FROM inventory_stocks s WHERE s."tenantId" = ${tenantId} ${bx('s')}`
        const low = await db.$queryRaw<any[]>`
          SELECT i.name, sum(s."availableQuantity") avail, i."reorderLevel" lvl
          FROM inventory_items i JOIN inventory_stocks s ON s."itemId" = i.id
          WHERE i."tenantId" = ${tenantId} ${bx('s')}
          GROUP BY i.id HAVING sum(s."availableQuantity") <= i."reorderLevel" * 2 ORDER BY 2 LIMIT 5`
        return { stockValuationINR: num(r.valuation), itemsTracked: num(r.items), lowestStock: low.map((l) => ({ item: l.name, available: num(l.avail), reorderLevel: num(l.lvl) })) }
      })()
    : undefined

  return {
    school: { name: tenant?.name, city: tenant?.city, state: tenant?.state, timezone: tz },
    today,
    scope: branchId ? `Branch: ${branches[0]?.name ?? branchId}` : `All branches (${branches.length})`,
    branches: branches.map((b) => b.name),
    academicSessions: sessions.map((s) => ({ name: s.name, status: s.status, isCurrent: s.isCurrent })),
    visibleDomains: Object.entries(perms).filter(([, v]) => v).map(([k]) => k),
    sessionTotals,
    bySessionBranchProgram: cube,
    ...(admissions ? { admissionsFunnel: admissions } : {}),
    trends: {
      ...(monthlyCollections ? { monthlyFeeCollections: monthlyCollections } : {}),
      ...(paymentMethods ? { feeCollectionsByPaymentMethod: paymentMethods } : {}),
      monthlyStudentAttendance: monthlyAttendance,
      attendanceByWeekday: weekdayAttendance,
    },
    currentSession: {
      name: current?.name,
      classrooms,
      lastAttendanceDay: lastMarked[0] ? { date: lastMarked[0].d, present: num(lastMarked[0].present), marked: num(lastMarked[0].marked) } : null,
      openFollowUpsByDomain: followUps,
    },
    ...(staff ? { staff } : {}),
    ...(transport ? { transport } : {}),
    ...(inventory ? { inventory } : {}),
  }
}

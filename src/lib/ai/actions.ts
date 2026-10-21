/**
 * PreO AI write actions. The model only *proposes* an action; nothing changes
 * until a human clicks Approve. Both preview and execute re-resolve every name
 * against the caller's own school and check the caller's permission.
 */
import { db } from '@/lib/db'
import { can, type Role } from '@/lib/auth'
import { FeeService } from '@/lib/fees/fee-service'
import { audit } from '@/lib/audit'

export interface ActionSession {
  tenantId: string
  branchId: string | null
  uid: string
  name: string
  role: string
  roles: Role[]
}

export type AiAction =
  | { type: 'mark_attendance'; classroom: string; date?: string; default?: 'PRESENT' | 'ABSENT'; exceptions?: { student: string; status: string; notes?: string }[] }
  | { type: 'record_payment'; student: string; amount: number; method?: string; installment?: string; reference?: string }
  | { type: 'draft_announcement'; title: string; body: string; audience?: string; category?: string }

export interface Preview {
  ok: boolean
  title: string
  description?: string
  lines: { label: string; value: string }[]
  rows?: { name: string; detail: string; tone?: 'good' | 'warn' | 'bad' }[]
  warnings: string[]
  error?: string
  confirmLabel: string
}

export interface Executed {
  ok: boolean
  title: string
  lines: { label: string; value: string }[]
  link?: { label: string; href: string }
  error?: string
}

const ATT = new Set(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'])
const METHODS = new Set(['CASH', 'CHEQUE', 'CARD', 'UPI', 'NET_BANKING', 'WALLET', 'BANK_TRANSFER', 'ONLINE'])
const AUDIENCES = new Set(['ALL_PARENTS', 'BRANCH_PARENTS', 'ALL_STAFF', 'SCHOOL_WIDE'])
const CATEGORIES = new Set(['GENERAL', 'HOLIDAY', 'EMERGENCY', 'EVENT', 'ACHIEVEMENT', 'IMPORTANT', 'FEE_REMINDER', 'ACADEMIC'])
const inr = (cents: number) => `₹${(cents / 100).toLocaleString('en-IN')}`
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function tenantToday(tenantId: string) {
  const t = await db.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } })
  return new Intl.DateTimeFormat('en-CA', { timeZone: t?.timezone || 'Asia/Kolkata' }).format(new Date())
}

class ActionError extends Error {}
const fail = (msg: string): never => { throw new ActionError(msg) }

/* ─────────────── resolvers ─────────────── */

async function resolveClassroom(s: ActionSession, name: string) {
  const current = await db.academicSession.findFirst({ where: { tenantId: s.tenantId, isCurrent: true }, select: { id: true } })
  const rooms = await db.classroom.findMany({
    where: { tenantId: s.tenantId, isActive: true, ...(current ? { academicSessionId: current.id } : {}), ...(s.branchId ? { branchId: s.branchId } : {}) },
    select: { id: true, name: true, programType: true, branchId: true, academicSessionId: true },
  })
  const q = norm(name)
  const hit =
    rooms.find((r) => norm(r.name) === q) ??
    rooms.find((r) => norm(r.name).includes(q) || q.includes(norm(r.name))) ??
    rooms.filter((r) => q.split(' ').some((w) => w.length > 2 && (norm(r.name).includes(w) || r.programType.toLowerCase() === w)))[0]
  return hit ?? fail(`No current-session classroom matches "${name}". Available: ${rooms.map((r) => r.name).join(', ')}`)
}

async function resolveStudent(s: ActionSession, ref: string, classroomId?: string) {
  const q = ref.trim()
  const base = { tenantId: s.tenantId, deletedAt: null, ...(classroomId ? { currentClassroomId: classroomId } : {}), ...(s.branchId ? { branchId: s.branchId } : {}) }
  const byNo = await db.student.findFirst({ where: { ...base, admissionNo: { equals: q, mode: 'insensitive' } }, include: { currentClassroom: { select: { name: true } } } })
  if (byNo) return byNo
  const parts = q.split(/\s+/)
  const matches = await db.student.findMany({
    where: {
      ...base,
      status: 'ACTIVE',
      firstName: { equals: parts[0], mode: 'insensitive' },
      ...(parts.length > 1 ? { lastName: { equals: parts.slice(1).join(' '), mode: 'insensitive' } } : {}),
    },
    include: { currentClassroom: { select: { name: true } } },
    take: 6,
  })
  if (matches.length === 1) return matches[0]
  if (!matches.length) fail(`No active student named "${ref}"${classroomId ? ' in this classroom' : ''}.`)
  return fail(`"${ref}" matches ${matches.length} students: ${matches.map((m) => `${m.firstName} ${m.lastName ?? ''} (${m.admissionNo}, ${m.currentClassroom?.name ?? '—'})`).join('; ')}. Use the admission number.`)
}

/* ─────────────── attendance ─────────────── */

async function planAttendance(s: ActionSession, a: Extract<AiAction, { type: 'mark_attendance' }>) {
  if (!can(s.roles, 'attendance:write')) fail('Your role cannot mark attendance.')
  const room = await resolveClassroom(s, a.classroom)
  const today = await tenantToday(s.tenantId)
  const date = (a.date || today).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Date must be YYYY-MM-DD.')
  if (date > today) fail('Attendance cannot be marked for a future date.')
  const def = (a.default ?? 'PRESENT').toUpperCase()
  if (!ATT.has(def)) fail(`Unknown default status ${def}.`)
  const students = await db.student.findMany({
    where: { tenantId: s.tenantId, currentClassroomId: room.id, status: 'ACTIVE', deletedAt: null },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
    orderBy: { firstName: 'asc' },
  })
  if (!students.length) fail(`${room.name} has no active students.`)
  const overrides = new Map<string, { status: string; notes?: string }>()
  for (const ex of a.exceptions ?? []) {
    const st = ex.status?.toUpperCase()
    if (!ATT.has(st)) fail(`Unknown status "${ex.status}" for ${ex.student}.`)
    const stu = await resolveStudent(s, ex.student, room.id)
    overrides.set(stu.id, { status: st, notes: ex.notes })
  }
  const existing = await db.attendance.findMany({ where: { studentId: { in: students.map((x) => x.id) }, date: new Date(date) }, select: { studentId: true, status: true } })
  const plan = students.map((st) => ({ ...st, status: overrides.get(st.id)?.status ?? def, notes: overrides.get(st.id)?.notes, previous: existing.find((e) => e.studentId === st.id)?.status }))
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay()
  const holiday = await db.calendarEvent.findFirst({ where: { tenantId: s.tenantId, date: new Date(date), type: { in: ['HOLIDAY', 'VACATION'] } }, select: { title: true } })
  const warnings = [
    ...(weekday === 0 || weekday === 6 ? [`${date} is a ${weekday === 0 ? 'Sunday' : 'Saturday'} — school is normally closed.`] : []),
    ...(holiday ? [`${date} is marked as a holiday: ${holiday.title}.`] : []),
    ...(existing.length ? [`${existing.length} of ${students.length} students already have attendance for this date; it will be overwritten.`] : []),
  ]
  return { room, date, plan, warnings }
}

/* ─────────────── payment ─────────────── */

async function planPayment(s: ActionSession, a: Extract<AiAction, { type: 'record_payment' }>) {
  if (!can(s.roles, 'finance:write')) fail('Your role cannot record payments.')
  const student = await resolveStudent(s, a.student)
  const cents = Math.round(Number(a.amount) * 100)
  if (!Number.isFinite(cents) || cents <= 0) fail('Amount must be a positive number of rupees.')
  const method = (a.method ?? 'CASH').toUpperCase().replace(/\s+/g, '_')
  if (!METHODS.has(method)) fail(`Unknown payment method ${a.method}.`)
  const schedules = await db.studentFeeSchedule.findMany({
    where: { tenantId: s.tenantId, studentId: student.id, remainingAmountCents: { gt: 0 }, status: { not: 'CANCELLED' } },
    include: { feeItem: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
  })
  if (!schedules.length) fail(`${student.firstName} ${student.lastName ?? ''} has no outstanding fees.`)
  const hint = a.installment ? norm(a.installment) : ''
  const schedule =
    (hint && schedules.find((x) => norm(`${x.feeItem.name} ${x.period}`).includes(hint) || hint.split(' ').every((w) => norm(`${x.feeItem.name} ${x.period}`).includes(w)))) ||
    schedules.find((x) => x.remainingAmountCents === cents) ||
    schedules[0]
  if (cents > schedule.remainingAmountCents) fail(`${inr(cents)} is more than the ${inr(schedule.remainingAmountCents)} remaining on ${schedule.feeItem.name} (${schedule.period}).`)
  const totalDue = schedules.reduce((t, x) => t + x.remainingAmountCents, 0)
  return { student, cents, method, schedule, totalDue, schedules }
}

/* ─────────────── public API ─────────────── */

export async function previewAction(s: ActionSession, a: AiAction): Promise<Preview> {
  try {
    if (a.type === 'mark_attendance') {
      const { room, date, plan, warnings } = await planAttendance(s, a)
      const counts = plan.reduce<Record<string, number>>((m, p) => ((m[p.status] = (m[p.status] ?? 0) + 1), m), {})
      return {
        ok: true,
        title: `Mark attendance · ${room.name}`,
        description: `For ${new Date(date + 'T12:00:00Z').toDateString()}`,
        lines: [{ label: 'Students', value: String(plan.length) }, ...Object.entries(counts).map(([k, v]) => ({ label: k.replace('_', ' '), value: String(v) }))],
        rows: plan.map((p) => ({ name: `${p.firstName} ${p.lastName ?? ''}`.trim(), detail: p.status + (p.previous && p.previous !== p.status ? ` (was ${p.previous})` : ''), tone: p.status === 'PRESENT' ? 'good' : p.status === 'ABSENT' ? 'bad' : 'warn' })),
        warnings,
        confirmLabel: `Save attendance for ${plan.length}`,
      }
    }
    if (a.type === 'record_payment') {
      const { student, cents, method, schedule, totalDue } = await planPayment(s, a)
      return {
        ok: true,
        title: `Record payment & issue receipt`,
        description: `${student.firstName} ${student.lastName ?? ''} · ${student.admissionNo} · ${student.currentClassroom?.name ?? ''}`,
        lines: [
          { label: 'Amount', value: inr(cents) },
          { label: 'Method', value: method.replace('_', ' ') },
          { label: 'Applied to', value: `${schedule.feeItem.name} · ${schedule.period}` },
          { label: 'Installment due', value: `${inr(schedule.remainingAmountCents)} (due ${schedule.dueDate.toISOString().slice(0, 10)})` },
          { label: 'Balance after', value: `${inr(totalDue - cents)} total outstanding` },
        ],
        warnings: cents < schedule.remainingAmountCents ? [`Partial payment — ${inr(schedule.remainingAmountCents - cents)} will remain on this installment.`] : [],
        confirmLabel: `Record ${inr(cents)} & issue receipt`,
      }
    }
    if (a.type === 'draft_announcement') {
      if (!can(s.roles, 'communication:write')) fail('Your role cannot create announcements.')
      if (!a.title?.trim() || !a.body?.trim()) fail('Announcement needs a title and message.')
      return {
        ok: true,
        title: 'Save announcement as draft',
        description: a.title,
        lines: [
          { label: 'Audience', value: AUDIENCES.has(String(a.audience)) ? String(a.audience).replace('_', ' ') : 'SCHOOL WIDE' },
          { label: 'Category', value: CATEGORIES.has(String(a.category)) ? String(a.category) : 'GENERAL' },
          { label: 'Message', value: a.body.slice(0, 280) + (a.body.length > 280 ? '…' : '') },
        ],
        warnings: ['Saved as a draft — nothing is sent to parents until you publish it from Announcements.'],
        confirmLabel: 'Save draft',
      }
    }
    return fail('Unsupported action.')
  } catch (e: any) {
    if (!(e instanceof ActionError)) console.error('[PreO AI] preview failed', e)
    return { ok: false, title: 'Cannot prepare this action', lines: [], warnings: [], error: e instanceof ActionError ? e.message : 'Something went wrong preparing this action.', confirmLabel: '' }
  }
}

export async function executeAction(s: ActionSession, a: AiAction, idempotencyKey: string): Promise<Executed> {
  try {
    if (a.type === 'mark_attendance') {
      const { room, date, plan } = await planAttendance(s, a)
      const day = new Date(date)
      await db.$transaction(
        plan.map((p) =>
          db.attendance.upsert({
            where: { studentId_date: { studentId: p.id, date: day } },
            update: { status: p.status as any, notes: p.notes ?? null, classroomId: room.id, branchId: room.branchId, academicSessionId: room.academicSessionId, markedById: s.uid, markedAt: new Date() },
            create: { tenantId: s.tenantId, branchId: room.branchId, classroomId: room.id, academicSessionId: room.academicSessionId, studentId: p.id, date: day, status: p.status as any, notes: p.notes ?? null, markedById: s.uid },
          }),
        ),
      )
      await audit({ tenantId: s.tenantId, actorId: s.uid, actorName: s.name, actorRole: s.role, action: 'AI_MARK_ATTENDANCE', entity: 'Attendance', entityId: room.id, module: 'ATTENDANCE', summary: `PreO AI marked attendance for ${plan.length} students in ${room.name} on ${date}` }).catch(() => {})
      const absent = plan.filter((p) => p.status !== 'PRESENT')
      return {
        ok: true,
        title: `Attendance saved for ${room.name}`,
        lines: [{ label: 'Date', value: date }, { label: 'Present', value: String(plan.length - absent.length) }, { label: 'Not present', value: absent.length ? absent.map((p) => `${p.firstName} (${p.status.toLowerCase()})`).join(', ') : 'None' }],
        link: { label: 'Open Daily Diary', href: '/app/daily-diary' },
      }
    }
    if (a.type === 'record_payment') {
      const { student, cents, method, schedule } = await planPayment(s, a)
      const result = await FeeService.recordFeeSchedulePayment(
        { tenantId: s.tenantId, actorId: s.uid, actorName: s.name, actorRole: s.role } as any,
        { feeScheduleId: schedule.id, studentId: student.id, amountCents: cents, method: method as any, transactionRef: a.reference?.trim() || `PREOAI-${idempotencyKey}`, notes: 'Recorded via PreO AI' },
      )
      const receipt = (result as any).receipt
      return {
        ok: true,
        title: receipt ? `Receipt ${receipt.receiptNumber} issued` : 'Payment already recorded',
        lines: [
          { label: 'Student', value: `${student.firstName} ${student.lastName ?? ''} (${student.admissionNo})` },
          { label: 'Amount', value: inr(cents) },
          { label: 'Payment no.', value: (result as any).payment?.paymentNumber ?? '—' },
          { label: 'Installment status', value: (result as any).schedule?.status ?? '—' },
        ],
        link: { label: 'Open student fees', href: `/app/students/${student.id}` },
      }
    }
    if (a.type === 'draft_announcement') {
      if (!can(s.roles, 'communication:write')) fail('Your role cannot create announcements.')
      const ann = await db.announcement.create({
        data: {
          tenantId: s.tenantId,
          branchId: s.branchId,
          title: a.title.trim().slice(0, 200),
          body: a.body.trim().slice(0, 5000),
          type: (CATEGORIES.has(String(a.category)) ? a.category : 'GENERAL') as any,
          audience: (AUDIENCES.has(String(a.audience)) ? a.audience : 'SCHOOL_WIDE') as any,
          status: 'DRAFT',
          authorId: s.uid,
        },
      })
      await audit({ tenantId: s.tenantId, actorId: s.uid, actorName: s.name, actorRole: s.role, action: 'AI_DRAFT_ANNOUNCEMENT', entity: 'Announcement', entityId: ann.id, module: 'COMMUNICATION', summary: `PreO AI drafted "${ann.title}"` }).catch(() => {})
      return { ok: true, title: 'Draft saved', lines: [{ label: 'Title', value: ann.title }, { label: 'Status', value: 'Draft — review and publish from Announcements' }], link: { label: 'Open Announcements', href: '/app/communication' } }
    }
    return fail('Unsupported action.')
  } catch (e: any) {
    if (!(e instanceof ActionError)) console.error('[PreO AI] execute failed', e)
    const msg = String(e?.message ?? '')
    return { ok: false, title: 'Action failed', lines: [], error: e instanceof ActionError ? msg : msg.replace(/^BUSINESS_[A-Z_]+:\s*/, '') || 'Something went wrong.' }
  }
}

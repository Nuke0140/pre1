/**
 * M00 — Setup Engine
 *
 * The engine DERIVES step completion from real operational data
 * (one source of truth — Impact Map §1/§41) and drives the persistent
 * state machine stored in SchoolSetup / SchoolSetupStep.
 *
 * Step lifecycle:  PENDING → BLOCKED(deps unmet) → COMPLETE(actor, snapshot)
 *                  COMPLETE → PENDING/BLOCKED (drift → changedAfterCompletion)
 * Tenant lifecycle: NOT_STARTED → IN_PROGRESS/BLOCKED → READY_FOR_REVIEW
 *                   → READY_FOR_GO_LIVE (validation) → LIVE (go-live)
 */
import { db } from '@/lib/db'
import { audit } from '@/lib/sequence'
import { SETUP_STEPS, STEP_MAP, isUnlocked, type StepKey } from './steps'

type StepStatus = 'PENDING' | 'COMPLETE' | 'BLOCKED' | 'SKIPPED'

interface CtxBranch { id: string; name: string; code: string; timingOpen: string; timingClose: string; capacity: number | null; isActive: boolean }
interface CtxProgram { id: string; code: string; name: string; programType: string; ageMinMonths: number | null; ageMaxMonths: number | null; capacity: number; isActive: boolean }
interface CtxClassroom { id: string; branchId: string; academicSessionId: string; programType: string; programId: string | null; capacity: number; primaryTeacherId: string | null; isActive: boolean }
interface CtxConfig { domain: string; data: Record<string, unknown> }

export interface TenantContext {
  tenant: {
    id: string; name: string; code: string; email: string | null; phone: string | null
    city: string | null; state: string | null; address: string | null; website: string | null
    timezone: string; locale: string; logoUrl: string | null
  }
  branches: CtxBranch[]
  programs: CtxProgram[]
  classrooms: CtxClassroom[]
  facilities: { id: string; branchId: string; type: string; isActive: boolean }[]
  currentSession: { id: string; name: string; startDate: Date; endDate: Date; isCurrent: boolean } | null
  memberships: { id: string; userId: string; role: string; branchId: string | null; status: string }[]
  staffProfiles: { id: string; userId: string; branchId: string | null; employeeCode: string }[]
  calendarEvents: { id: string; type: string; date: Date }[]
  feePlans: { id: string; programType: string; isActive: boolean; totalAnnualCents: number }[]
  configs: Record<string, Record<string, unknown>>
  studentCount: number
}

/** Load everything the predicates need, scoped to the tenant. */
export async function loadContext(tenantId: string): Promise<TenantContext | null> {
  const tenant = await db.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) return null

  const [branches, programs, classrooms, facilities, sessions, memberships, staffProfiles, calendarEvents, feePlans, configs, studentCount] =
    await Promise.all([
      db.branch.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
      db.program.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
      db.classroom.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } }),
      db.facility.findMany({ where: { tenantId, deletedAt: null } }),
      db.academicSession.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } }),
      db.tenantUser.findMany({ where: { tenantId, deletedAt: null } }),
      db.staffProfile.findMany({ where: { tenantId, deletedAt: null } }),
      db.calendarEvent.findMany({ where: { tenantId }, orderBy: { date: 'asc' } }),
      db.feePlan.findMany({ where: { tenantId } }),
      db.schoolConfig.findMany({ where: { tenantId } }),
      db.student.count({ where: { tenantId, deletedAt: null } }),
    ])

  const current = sessions.find((s) => s.isCurrent) ?? null
  return {
    tenant: {
      id: tenant.id, name: tenant.name, code: tenant.code,
      email: tenant.email, phone: tenant.phone, city: tenant.city, state: tenant.state,
      address: tenant.address, website: tenant.website,
      timezone: tenant.timezone, locale: tenant.locale, logoUrl: tenant.logoUrl,
    },
    branches: branches.map((b) => ({ id: b.id, name: b.name, code: b.code, timingOpen: b.timingOpen, timingClose: b.timingClose, capacity: b.capacity, isActive: b.isActive })),
    programs: programs.map((p) => ({ id: p.id, code: p.code, name: p.name, programType: p.programType, ageMinMonths: p.ageMinMonths, ageMaxMonths: p.ageMaxMonths, capacity: p.capacity, isActive: p.isActive })),
    classrooms: classrooms.map((c) => ({ id: c.id, branchId: c.branchId, academicSessionId: c.academicSessionId, programType: c.programType, programId: c.programId, capacity: c.capacity, primaryTeacherId: c.primaryTeacherId, isActive: c.isActive })),
    facilities: facilities.map((f) => ({ id: f.id, branchId: f.branchId, type: f.type, isActive: f.isActive })),
    currentSession: current ? { id: current.id, name: current.name, startDate: current.startDate, endDate: current.endDate, isCurrent: current.isCurrent } : null,
    memberships: memberships.map((m) => ({ id: m.id, userId: m.userId, role: m.role, branchId: m.branchId, status: m.status })),
    staffProfiles: staffProfiles.map((s) => ({ id: s.id, userId: s.userId, branchId: s.branchId, employeeCode: s.employeeCode })),
    calendarEvents: calendarEvents.map((e) => ({ id: e.id, type: e.type, date: e.date })),
    feePlans: feePlans.map((f) => ({ id: f.id, programType: f.programType, isActive: f.isActive, totalAnnualCents: f.totalAnnualCents })),
    configs: Object.fromEntries(configs.map((c) => [c.domain, (c.data ?? {}) as Record<string, unknown>])),
    studentCount,
  }
}

// ── helpers ─────────────────────────────────────────────────────────
const activeBranches = (ctx: TenantContext) => ctx.branches.filter((b) => b.isActive)
const activePrograms = (ctx: TenantContext) => ctx.programs.filter((p) => p.isActive)
const activeClassrooms = (ctx: TenantContext) => ctx.classrooms.filter((c) => c.isActive)
const currentClassrooms = (ctx: TenantContext) =>
  ctx.currentSession ? activeClassrooms(ctx).filter((c) => c.academicSessionId === ctx.currentSession!.id) : []
const str = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const arr = (v: unknown): unknown[] => Array.isArray(v) ? v : []
const activeMemberships = (ctx: TenantContext) => ctx.memberships.filter((m) => m.status === 'ACTIVE')

export interface StepEvaluation {
  satisfied: boolean
  blocked: boolean
  reason?: string
  detail: string
  snapshot: Record<string, unknown>
  missingDeps: string[]
}

/** Pure predicate per step — derived ONLY from real data. */
export function evaluateStep(key: StepKey, ctx: TenantContext): StepEvaluation {
  const noDeps: string[] = []
  switch (key) {
    case 'school_profile': {
      const missing: string[] = []
      if (!ctx.tenant.email) missing.push('email')
      if (!ctx.tenant.phone) missing.push('phone')
      if (!ctx.tenant.city) missing.push('city')
      if (!ctx.tenant.address) missing.push('address')
      return {
        satisfied: missing.length === 0, blocked: false,
        detail: missing.length ? `Missing: ${missing.join(', ')}` : 'Identity complete',
        snapshot: { missing }, missingDeps: noDeps,
      }
    }
    case 'branch': {
      const n = activeBranches(ctx).length
      return {
        satisfied: n >= 1, blocked: false,
        detail: `${n} active branch${n === 1 ? '' : 'es'}`,
        snapshot: { branches: n }, missingDeps: noDeps,
      }
    }
    case 'branding': {
      const bc = ctx.configs.BRANDING ?? {}
      const okB = !!ctx.tenant.logoUrl || Object.keys(bc).length > 0
      return { satisfied: okB, blocked: false, detail: okB ? 'Branding configured' : 'No logo or branding yet', snapshot: { logo: !!ctx.tenant.logoUrl, config: Object.keys(bc).length }, missingDeps: noDeps }
    }
    case 'programs': {
      const n = activePrograms(ctx).length
      const withAge = activePrograms(ctx).filter((p) => p.ageMinMonths != null || p.ageMaxMonths != null).length
      return {
        satisfied: n >= 1, blocked: false,
        detail: n === 0 ? 'No programs configured' : `${n} active program${n === 1 ? '' : 's'}, ${withAge} with age eligibility`,
        snapshot: { programs: n, withAge }, missingDeps: noDeps,
      }
    }
    case 'infrastructure': {
      const rooms = activeClassrooms(ctx).length
      const areas = ctx.facilities.filter((f) => f.isActive).length
      return {
        satisfied: rooms >= 1, blocked: false,
        detail: rooms === 0 ? 'No rooms or areas yet' : `${rooms} room(s), ${areas} other area(s)${areas === 0 ? ' — adding play/nap/meal areas is recommended' : ''}`,
        snapshot: { rooms, areas }, missingDeps: noDeps,
      }
    }
    case 'operating_config': {
      const oc = ctx.configs.OPERATING ?? {}
      const hasTimes = str(oc.schoolStartTime) && str(oc.schoolEndTime)
      const wd = arr(oc.workingDays)
      return {
        satisfied: hasTimes && wd.length >= 1, blocked: false,
        detail: hasTimes && wd.length >= 1 ? 'Operating rules configured' : 'School hours and working days not set',
        snapshot: { times: hasTimes, workingDays: wd.length }, missingDeps: noDeps,
      }
    }
    case 'roles': {
      const n = activeMemberships(ctx).length
      const owner = ctx.memberships.some((m) => m.role === 'OWNER' && m.status === 'ACTIVE')
      return {
        satisfied: n >= 2 && owner, blocked: false,
        detail: owner ? `${n} user account${n === 1 ? '' : 's'} — need at least 2 (owner + operator)` : 'No active owner account',
        snapshot: { memberships: n, owner }, missingDeps: noDeps,
      }
    }
    case 'staff': {
      const assigned = ctx.staffProfiles.filter((s) => s.branchId != null).length
      return {
        satisfied: assigned >= 1, blocked: false,
        detail: assigned === 0 ? 'No staff employment profiles with branch assignment' : `${assigned} staff operationally assigned to a branch`,
        snapshot: { staffAssigned: assigned, staffTotal: ctx.staffProfiles.length }, missingDeps: noDeps,
      }
    }
    case 'academic_year': {
      const s = ctx.currentSession
      const valid = !!s && s.startDate < s.endDate
      return {
        satisfied: valid, blocked: false,
        detail: s ? (valid ? `Current year: ${s.name}` : 'Current academic year has an invalid date range') : 'No academic year marked current',
        snapshot: { session: s?.name ?? null, valid }, missingDeps: noDeps,
      }
    }
    case 'classes_sections': {
      const cur = currentClassrooms(ctx)
      const linked = cur.filter((c) => c.programId != null && c.capacity > 0)
      return {
        satisfied: linked.length >= 1, blocked: false,
        detail: linked.length === 0 ? 'No class-section linked to a program for the current year' : `${linked.length} class-section(s) ready`,
        snapshot: { classrooms: cur.length, linked: linked.length }, missingDeps: noDeps,
      }
    }
    case 'teacher_assignment': {
      const cur = currentClassrooms(ctx)
      const unassigned = cur.filter((c) => c.primaryTeacherId == null).length
      return {
        satisfied: cur.length >= 1 && unassigned === 0, blocked: false,
        detail: cur.length === 0 ? 'No classes to staff yet' : unassigned === 0 ? 'All classes have a primary teacher' : `${unassigned} of ${cur.length} class(es) without a primary teacher`,
        snapshot: { classrooms: cur.length, unassigned }, missingDeps: noDeps,
      }
    }
    case 'curriculum': {
      const cu = ctx.configs.CURRICULUM ?? {}
      const areas = arr(cu.learningAreas)
      return {
        satisfied: areas.length >= 1, blocked: false,
        detail: areas.length >= 1 ? `${areas.length} learning area(s) defined` : 'No learning areas defined',
        snapshot: { learningAreas: areas.length }, missingDeps: noDeps,
      }
    }
    case 'calendar': {
      const events = ctx.currentSession
        ? ctx.calendarEvents.filter((e) => e.date >= ctx.currentSession!.startDate && e.date <= ctx.currentSession!.endDate)
        : []
      const holidays = events.filter((e) => e.type === 'HOLIDAY' || e.type === 'VACATION').length
      return {
        satisfied: events.length >= 1, blocked: false,
        detail: events.length === 0 ? 'No calendar events for the current year' : `${events.length} event(s), ${holidays} holiday/vacation day(s)`,
        snapshot: { events: events.length, holidays }, missingDeps: noDeps,
      }
    }
    case 'fees': {
      const progs = activePrograms(ctx)
      const covered = progs.filter((p) => ctx.feePlans.some((f) => f.isActive && f.programType === p.programType))
      return {
        satisfied: progs.length >= 1 && covered.length === progs.length, blocked: false,
        detail: progs.length === 0 ? 'No programs to bill yet' : covered.length === progs.length ? 'Every program has an active fee plan' : `${progs.length - covered.length} program(s) without an active fee plan`,
        snapshot: { programs: progs.length, covered: covered.length }, missingDeps: noDeps,
      }
    }
    case 'admission_config': {
      const ac = ctx.configs.ADMISSION ?? {}
      const docs = arr(ac.requiredDocuments)
      const stages = arr(ac.approvalStages)
      return {
        satisfied: str(ac.admissionOpenDate) && docs.length >= 1 && stages.length >= 1, blocked: false,
        detail: str(ac.admissionOpenDate) && docs.length >= 1 && stages.length >= 1
          ? 'Admission window, documents and workflow configured'
          : 'Admission window, required documents or approval workflow incomplete',
        snapshot: { window: !!str(ac.admissionOpenDate), docs: docs.length, stages: stages.length }, missingDeps: noDeps,
      }
    }
    case 'student_parent': {
      const sp = ctx.configs.STUDENT_PARENT ?? {}
      const consents = arr(sp.consentTypes)
      const pickup = sp.pickupVerification !== undefined
      return {
        satisfied: consents.length >= 1 && pickup, blocked: false,
        detail: consents.length >= 1 && pickup ? `${consents.length} consent type(s), pickup rules set` : 'Consent types or pickup authorisation rules missing',
        snapshot: { consents: consents.length, pickup }, missingDeps: noDeps,
      }
    }
    case 'daily_operations': {
      const dc = ctx.configs.DAILY_OPERATIONS ?? {}
      const recs = arr(dc.recordTypes)
      return {
        satisfied: dc.attendanceEnabled === true && recs.length >= 1, blocked: false,
        detail: dc.attendanceEnabled === true && recs.length >= 1 ? `Attendance + ${recs.length} daily record type(s)` : 'Attendance or daily record types not configured',
        snapshot: { attendance: dc.attendanceEnabled === true, recordTypes: recs.length }, missingDeps: noDeps,
      }
    }
    case 'health_safety': {
      const hc = ctx.configs.HEALTH_SAFETY ?? {}
      const allergy = arr(hc.allergyCategories), incident = arr(hc.incidentCategories), contacts = arr(hc.emergencyContacts)
      return {
        satisfied: allergy.length >= 1 && incident.length >= 1 && contacts.length >= 1, blocked: false,
        detail: allergy.length >= 1 && incident.length >= 1 && contacts.length >= 1
          ? 'Allergy, incident and escalation rules configured'
          : 'Allergy categories, incident categories or emergency contacts missing',
        snapshot: { allergy: allergy.length, incident: incident.length, contacts: contacts.length }, missingDeps: noDeps,
      }
    }
    case 'communication': {
      const cc = ctx.configs.COMMUNICATION ?? {}
      const channels = arr(cc.channels), events = arr(cc.notificationEvents)
      return {
        satisfied: channels.length >= 1 && events.length >= 1, blocked: false,
        detail: channels.length >= 1 && events.length >= 1 ? `${channels.length} channel(s), ${events.length} notification event(s)` : 'Channels or notification events not configured',
        snapshot: { channels: channels.length, events: events.length }, missingDeps: noDeps,
      }
    }
    case 'documents': {
      const dc = ctx.configs.DOCUMENT_TEMPLATES ?? {}
      const templates = arr(dc.templates)
      return {
        satisfied: templates.length >= 1, blocked: false,
        detail: templates.length >= 1 ? `${templates.length} template(s) registered` : 'No document templates registered',
        snapshot: { templates: templates.length }, missingDeps: noDeps,
      }
    }
    case 'data_import': {
      return {
        satisfied: ctx.studentCount >= 1, blocked: false,
        detail: ctx.studentCount >= 1 ? `${ctx.studentCount} student record(s) present` : 'No historical data imported (optional)',
        snapshot: { students: ctx.studentCount }, missingDeps: noDeps,
      }
    }
    default:
      return { satisfied: false, blocked: false, detail: 'Unknown step', snapshot: {}, missingDeps: noDeps }
  }
}

// ── persistence ─────────────────────────────────────────────────────

/** Lazy-init: guarantee SchoolSetup + 21 step rows exist (covers pre-M00 tenants). */
export async function ensureSetupRows(tenantId: string): Promise<void> {
  await db.schoolSetup.upsert({
    where: { tenantId },
    create: { tenantId, status: 'NOT_STARTED' },
    update: {},
  })
  const existing = await db.schoolSetupStep.findMany({ where: { tenantId } })
  const have = new Set(existing.map((s) => s.stepKey))
  const toCreate = SETUP_STEPS.filter((s) => !have.has(s.key))
  if (toCreate.length) {
    await db.schoolSetupStep.createMany({
      data: toCreate.map((s) => ({ tenantId, stepKey: s.key, applicability: s.applicability })),
    })
  }
}

export interface SetupStatusPayload {
  status: string
  progress: number
  startedAt: Date | null
  goLiveAt: Date | null
  steps: {
    key: string; label: string; phase: string; applicability: string; icon: string
    description: string; status: StepStatus; detail: string
    blockedReason: string | null; missingDeps: { key: string; label: string }[]
    completedAt: Date | null; completedByName: string | null
    changedAfterCompletion: boolean; lastCheckedAt: Date
    locked: boolean
  }[]
  nextStepKey: string | null
  guidance: { level: 'info' | 'warning'; message: string; stepKey: string }[]
}

/**
 * Re-evaluate every step against live data, persist transitions,
 * advance the tenant state machine, and return the dashboard payload.
 */
export async function syncSetup(
  tenantId: string,
  actor?: { id: string; name: string } | null
): Promise<SetupStatusPayload | null> {
  await ensureSetupRows(tenantId)
  const ctx = await loadContext(tenantId)
  if (!ctx) return null

  const rows = await db.schoolSetupStep.findMany({ where: { tenantId } })
  const statusByKey: Record<string, StepStatus> = Object.fromEntries(rows.map((r) => [r.stepKey, r.status as StepStatus]))

  const autoCompletes: string[] = []
  const autoOpens: string[] = []

  // pass 1 — evaluate deps then predicates (deps first by registry order)
  for (const def of SETUP_STEPS) {
    const row = rows.find((r) => r.stepKey === def.key)
    if (!row) continue
    if (row.status === 'SKIPPED') { await db.schoolSetupStep.update({ where: { id: row.id }, data: { lastCheckedAt: new Date() } }); continue }

    const missingDeps = def.deps.filter((d) => {
      const s = statusByKey[d]
      return s !== 'COMPLETE' && s !== 'SKIPPED'
    })
    const ev = evaluateStep(def.key, ctx)

    if (missingDeps.length > 0) {
      const reason = `Requires ${missingDeps.map((d) => STEP_MAP[d].label).join(' and ')} to be completed first.`
      if (row.status !== 'BLOCKED' || row.blockedReason !== reason) {
        await db.schoolSetupStep.update({
          where: { id: row.id },
          data: { status: 'BLOCKED', blockedReason: reason, lastCheckedAt: new Date(), changedAfterCompletion: row.status === 'COMPLETE' ? true : row.changedAfterCompletion },
        })
        if (row.status === 'COMPLETE') autoOpens.push(def.key)
      }
      statusByKey[def.key] = 'BLOCKED'
      continue
    }

    if (ev.satisfied) {
      if (row.status !== 'COMPLETE') {
        await db.schoolSetupStep.update({
          where: { id: row.id },
          data: {
            status: 'COMPLETE', blockedReason: null, completedAt: row.completedAt ?? new Date(),
            completedById: row.completedById ?? actor?.id ?? 'system',
            completedByName: row.completedByName ?? actor?.name ?? 'system (auto-evaluated)',
            dataSnapshot: ev.snapshot, lastCheckedAt: new Date(),
          },
        })
        statusByKey[def.key] = 'COMPLETE'
        autoCompletes.push(def.key)
      } else {
        const changed = JSON.stringify(row.dataSnapshot ?? {}) !== JSON.stringify(ev.snapshot)
        if (changed || row.changedAfterCompletion) {
          await db.schoolSetupStep.update({
            where: { id: row.id },
            data: { dataSnapshot: ev.snapshot, changedAfterCompletion: changed ? true : row.changedAfterCompletion, lastCheckedAt: new Date() },
          })
        } else {
          await db.schoolSetupStep.update({ where: { id: row.id }, data: { lastCheckedAt: new Date() } })
        }
      }
    } else {
      if (row.status === 'COMPLETE') {
        await db.schoolSetupStep.update({
          where: { id: row.id },
          data: { status: 'PENDING', changedAfterCompletion: true, lastCheckedAt: new Date() },
        })
        statusByKey[def.key] = 'PENDING'
        autoOpens.push(def.key)
      } else if (row.status !== 'PENDING' || row.blockedReason != null) {
        await db.schoolSetupStep.update({
          where: { id: row.id },
          data: { status: 'PENDING', blockedReason: null, lastCheckedAt: new Date() },
        })
        statusByKey[def.key] = 'PENDING'
      }
    }
  }

  if (autoCompletes.length || autoOpens.length) {
    await audit({
      tenantId, actorId: actor?.id ?? null, actorName: actor?.name ?? 'system',
      action: 'SETUP_SYNC', entity: 'SchoolSetupStep', entityId: tenantId,
      summary: `Auto-evaluation: completed [${autoCompletes.join(', ') || '—'}], reopened [${autoOpens.join(', ') || '—'}]`,
    })
  }

  // pass 2 — tenant state machine + progress
  const freshRows = await db.schoolSetupStep.findMany({ where: { tenantId } })
  const mandatory = freshRows.filter((r) => r.applicability === 'MANDATORY')
  const mandatoryDone = mandatory.filter((r) => r.status === 'COMPLETE' || r.status === 'SKIPPED').length
  const anyBlocked = mandatory.some((r) => r.status === 'BLOCKED')
  const doneCount = freshRows.filter((r) => r.status === 'COMPLETE' || r.status === 'SKIPPED').length
  const progress = Math.round((doneCount / freshRows.length) * 100)

  const setup = await db.schoolSetup.findUnique({ where: { tenantId } })
  let status = setup!.status
  if (status !== 'LIVE') {
    if (mandatoryDone === mandatory.length) {
      if (anyBlocked) status = 'BLOCKED'
      else if (status === 'NOT_STARTED' || status === 'IN_PROGRESS' || status === 'BLOCKED') status = 'READY_FOR_REVIEW'
      // READY_FOR_REVIEW / READY_FOR_GO_LIVE persist until go-live
    } else {
      // steps reopened → drop out of review/go-live states honestly
      status = anyBlocked ? 'BLOCKED' : doneCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    }
    if (status !== setup!.status) {
      await db.schoolSetup.update({ where: { tenantId }, data: { status, startedAt: setup!.startedAt ?? new Date() } })
    }
  }

  // next action + guidance
  const unlockedPending = SETUP_STEPS.filter((d) => {
    const s = statusByKey[d.key]
    return (s === 'PENDING') && isUnlocked(d, (k) => statusByKey[k] ?? 'PENDING')
  })
  const nextStepKey = unlockedPending[0]?.key ?? null

  const guidance: SetupStatusPayload['guidance'] = []
  for (const d of SETUP_STEPS) {
    const row = freshRows.find((r) => r.stepKey === d.key)
    if (!row || row.status !== 'PENDING') continue
    const ev = evaluateStep(d.key, ctx)
    if (d.key === 'fees' && /without an active fee plan/.test(ev.detail)) {
      guidance.push({ level: 'warning', message: `Admissions cannot open until an active fee plan is configured — ${ev.detail}`, stepKey: d.key })
    } else if (d.key === 'teacher_assignment' && /without a primary teacher/.test(ev.detail)) {
      guidance.push({ level: 'warning', message: `${ev.detail.charAt(0).toUpperCase()}${ev.detail.slice(1)} — assign before daily operations`, stepKey: d.key })
    } else if (nextStepKey === d.key) {
      guidance.push({ level: 'info', message: `Your next step is ${d.label}. ${d.description}`, stepKey: d.key })
    }
  }
  if (status === 'READY_FOR_REVIEW') guidance.push({ level: 'info', message: 'All mandatory configuration is complete — run setup validation, then go live.', stepKey: 'review' })

  return {
    status, progress, startedAt: setup!.startedAt, goLiveAt: setup!.goLiveAt,
    steps: SETUP_STEPS.map((d) => {
      const row = freshRows.find((r) => r.stepKey === d.key)!
      const missing = d.deps.filter((k) => {
        const s = statusByKey[k]
        return s !== 'COMPLETE' && s !== 'SKIPPED'
      })
      return {
        key: d.key, label: d.label, phase: d.phase, applicability: d.applicability, icon: d.icon,
        description: d.description, status: row.status as StepStatus,
        detail: row.status === 'BLOCKED' ? row.blockedReason ?? '' : evaluateStep(d.key, ctx).detail,
        blockedReason: row.blockedReason, completedAt: row.completedAt, completedByName: row.completedByName,
        changedAfterCompletion: row.changedAfterCompletion, lastCheckedAt: row.lastCheckedAt,
        missingDeps: missing.map((k) => ({ key: k, label: STEP_MAP[k].label })),
        locked: !isUnlocked(d, (k) => statusByKey[k] ?? 'PENDING'),
      }
    }),
    nextStepKey, guidance,
  }
}

/** Explicit completion — records the human actor (M00 §3 who/when). */
export async function completeStep(
  tenantId: string,
  stepKey: string,
  actor: { id: string; name: string }
): Promise<{ ok: boolean; message: string; detail?: string }> {
  const def = STEP_MAP[stepKey]
  if (!def) return { ok: false, message: 'Unknown setup step' }
  const ctx = await loadContext(tenantId)
  if (!ctx) return { ok: false, message: 'Tenant not found' }

  const rows = await db.schoolSetupStep.findMany({ where: { tenantId } })
  const row = rows.find((r) => r.stepKey === stepKey)
  if (!row) return { ok: false, message: 'Setup step not initialised' }
  if (row.status === 'SKIPPED') return { ok: false, message: 'Step was skipped — reopen it first' }

  const missingDeps = def.deps.filter((d) => {
    const s = rows.find((r) => r.stepKey === d)?.status
    return s !== 'COMPLETE' && s !== 'SKIPPED'
  })
  if (missingDeps.length) {
    return {
      ok: false, message: 'Step is blocked by dependencies',
      detail: `Requires ${missingDeps.map((d) => STEP_MAP[d].label).join(' and ')} to be completed first.`,
    }
  }

  const ev = evaluateStep(def.key, ctx)
  if (!ev.satisfied) {
    return { ok: false, message: 'Requirements not met yet', detail: ev.detail }
  }

  await db.schoolSetupStep.update({
    where: { id: row.id },
    data: {
      status: 'COMPLETE', blockedReason: null, completedAt: row.completedAt ?? new Date(),
      completedById: actor.id, completedByName: actor.name,
      dataSnapshot: ev.snapshot, lastCheckedAt: new Date(),
      lastUpdatedById: actor.id,
    },
  })
  await audit({
    tenantId, actorId: actor.id, actorName: actor.name, action: 'SETUP_STEP_COMPLETE',
    entity: 'SchoolSetupStep', entityId: `${tenantId}:${stepKey}`,
    summary: `Completed setup step "${def.label}" — ${ev.detail}`,
  })
  await syncSetup(tenantId, actor)
  return { ok: true, message: `${def.label} marked complete` }
}

/** Skip — only allowed for non-mandatory steps. */
export async function skipStep(
  tenantId: string,
  stepKey: string,
  actor: { id: string; name: string }
): Promise<{ ok: boolean; message: string }> {
  const def = STEP_MAP[stepKey]
  if (!def) return { ok: false, message: 'Unknown setup step' }
  if (def.applicability === 'MANDATORY') {
    return { ok: false, message: `"${def.label}" is mandatory and cannot be skipped` }
  }
  const row = await db.schoolSetupStep.findUnique({ where: { tenantId_stepKey: { tenantId, stepKey } } })
  if (!row) return { ok: false, message: 'Setup step not initialised' }
  await db.schoolSetupStep.update({
    where: { id: row.id },
    data: { status: 'SKIPPED', blockedReason: null, lastCheckedAt: new Date(), lastUpdatedById: actor.id },
  })
  await audit({
    tenantId, actorId: actor.id, actorName: actor.name, action: 'SETUP_STEP_SKIP',
    entity: 'SchoolSetupStep', entityId: `${tenantId}:${stepKey}`,
    summary: `Skipped optional setup step "${def.label}" (${def.applicability})`,
  })
  await syncSetup(tenantId, actor)
  return { ok: true, message: `${def.label} skipped` }
}

/** Reopen a completed/skipped step for re-configuration. */
export async function reopenStep(
  tenantId: string,
  stepKey: string,
  actor: { id: string; name: string }
): Promise<{ ok: boolean; message: string }> {
  const def = STEP_MAP[stepKey]
  if (!def) return { ok: false, message: 'Unknown setup step' }
  const row = await db.schoolSetupStep.findUnique({ where: { tenantId_stepKey: { tenantId, stepKey } } })
  if (!row) return { ok: false, message: 'Setup step not initialised' }
  await db.schoolSetupStep.update({
    where: { id: row.id },
    data: { status: 'PENDING', blockedReason: null, lastCheckedAt: new Date(), lastUpdatedById: actor.id },
  })
  await audit({
    tenantId, actorId: actor.id, actorName: actor.name, action: 'SETUP_STEP_REOPEN',
    entity: 'SchoolSetupStep', entityId: `${tenantId}:${stepKey}`,
    summary: `Reopened setup step "${def.label}" for re-configuration`,
  })
  await syncSetup(tenantId, actor)
  return { ok: true, message: `${def.label} reopened` }
}

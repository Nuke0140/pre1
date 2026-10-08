/**
 * M00 — Setup Validation Engine (v2 Canonical 17-Area Architecture)
 *
 * 15 categories, each PASS / WARNING / BLOCKED with findings.
 * A validation run is persisted in SchoolSetupValidationRun for audit.
 * Go-live is blocked when ANY category has a BLOCKED finding in ANY branch.
 *
 * Multi-Branch Master/Mapping Architecture:
 *  - Evaluates readiness tenant-wide and branch-by-branch.
 *  - Every active campus must have active programs mapped, classrooms configured,
 *    teachers assigned, and active fee structures.
 *  - If any active campus is BLOCKED, the tenant Go-Live is BLOCKED.
 */
import { db } from '@/lib/db'
import { loadContext, type TenantContext } from './engine'

export type FindingStatus = 'PASS' | 'WARNING' | 'BLOCKED'

export interface Finding {
  status: FindingStatus
  message: string
  branchId?: string | null
  branchName?: string | null
  entity?: string | null
}

export interface ValidationCategory {
  key: string
  label: string
  status: FindingStatus
  findings: Finding[]
}

export interface BranchValidationSummary {
  branchId: string
  branchName: string
  status: FindingStatus
  blockedCount: number
  warningCount: number
  blockers: string[]
}

export interface ValidationResult {
  overall: 'PASS' | 'WARNING' | 'BLOCKED'
  categories: ValidationCategory[]
  branchSummaries: BranchValidationSummary[]
  blockers: { category: string; message: string; branchName?: string | null }[]
}

const A = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const S = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

function cat(key: string, label: string, findings: Finding[]): ValidationCategory {
  const status: FindingStatus = findings.some((f) => f.status === 'BLOCKED')
    ? 'BLOCKED'
    : findings.some((f) => f.status === 'WARNING')
      ? 'WARNING'
      : 'PASS'
  return {
    key,
    label,
    status,
    findings: findings.length ? findings : [{ status: 'PASS', message: 'All checks passed' }],
  }
}

const B = (m: string, branch?: { id: string; name: string } | null, entity?: string | null): Finding => ({
  status: 'BLOCKED',
  message: branch ? `[${branch.name}] ${m}` : m,
  branchId: branch?.id ?? null,
  branchName: branch?.name ?? null,
  entity: entity ?? null,
})

const W = (m: string, branch?: { id: string; name: string } | null, entity?: string | null): Finding => ({
  status: 'WARNING',
  message: branch ? `[${branch.name}] ${m}` : m,
  branchId: branch?.id ?? null,
  branchName: branch?.name ?? null,
  entity: entity ?? null,
})

export async function runValidation(tenantId: string): Promise<ValidationResult | null> {
  const ctx = await loadContext(tenantId)
  if (!ctx) return null

  const cfg = ctx.configs
  const t = ctx.tenant
  const branches = ctx.branches.filter((b) => b.isActive)
  const programs = ctx.programs.filter((p) => p.isActive)
  const rooms = ctx.classrooms.filter((c) => c.isActive)
  const cur = ctx.currentSession
  const curRooms = cur ? rooms.filter((c) => c.academicSessionId === cur.id) : []
  const activeSubs = ctx.subjects.filter((s) => s.status === 'ACTIVE')

  const categories: ValidationCategory[] = [
    // 1. Identity
    cat('identity', 'Identity (School Profile)', [
      !t.name || !t.code ? B('School name or code missing', null, 'Tenant') : null,
      !t.email || !t.phone ? B('School email / contact number missing', null, 'Tenant') : null,
      !t.city || !t.address ? W('City / address incomplete — appears on reports and documents', null, 'Tenant') : null,
    ].filter((f): f is Finding => f !== null)),

    // 2. Branch & Infrastructure
    cat('branch', 'Branch / Campus & Infrastructure', [
      branches.length === 0 ? B('No active branch/campus exists', null, 'Branch') : null,
      ...branches.flatMap((b) => {
        const bRooms = rooms.filter((r) => r.branchId === b.id)
        const bFacs = ctx.facilities.filter((f) => f.branchId === b.id && f.isActive)
        const list: Finding[] = []
        if (bRooms.length === 0) list.push(W('No classroom rooms configured yet', b, 'Classroom'))
        if (bRooms.some((r) => r.capacity <= 0)) list.push(W('A classroom has zero or invalid capacity', b, 'Classroom'))
        if (bFacs.length === 0) list.push(W('No play / nap / meal / medical areas registered (recommended)', b, 'Facility'))
        return list
      }),
    ].filter((f): f is Finding => f !== null)),

    // 3. RBAC & Staffing
    cat('users_rbac', 'Users & RBAC (M01 Identity)', [
      ctx.memberships.filter((m) => m.status === 'ACTIVE').length < 2
        ? B('At least two operating accounts (owner + staff) are required', null, 'TenantUser')
        : null,
      !ctx.memberships.some((m) => m.role === 'OWNER' && m.status === 'ACTIVE')
        ? B('No active owner account', null, 'TenantUser')
        : null,
      !ctx.memberships.some(
        (m) => ['PRINCIPAL', 'TEACHER', 'ACCOUNTS', 'RECEPTIONIST', 'STAFF'].includes(m.role) && m.status === 'ACTIVE'
      )
        ? B('No operating staff account (Principal, Teacher, Accounts, or Receptionist)', null, 'TenantUser')
        : null,
      ...branches.flatMap((b) => {
        const bStaff = ctx.staffProfiles.filter((s) => s.branchId === b.id).length +
                       ctx.memberships.filter((m) => m.branchId === b.id).length
        return bStaff === 0 ? [W('No staff or teachers assigned to this campus', b, 'StaffProfile')] : []
      }),
    ].filter((f): f is Finding => f !== null)),

    // 4. Academic Structure
    cat('academic', 'Academic Structure & Classrooms', [
      !cur ? B('No academic year is marked current', null, 'AcademicSession') : null,
      cur && cur.startDate >= cur.endDate ? B('Academic year end date is not after start date', null, 'AcademicSession') : null,
      ...branches.flatMap((b) => {
        const bRooms = curRooms.filter((c) => c.branchId === b.id)
        const list: Finding[] = []
        if (cur && bRooms.length === 0) {
          list.push(B('No active classrooms configured in current academic year', b, 'Classroom'))
        }
        if (bRooms.some((c) => c.programId == null)) {
          list.push(W('Some classrooms are not linked to a preschool program', b, 'Classroom'))
        }
        return list
      }),
    ].filter((f): f is Finding => f !== null)),

    // 5. Programs Master & Branch Mappings
    cat('programs', 'Programs Master & Campus Availability', [
      programs.length === 0 ? B('No preschool programs configured in school', null, 'Program') : null,
      ...branches.flatMap((b) => {
        const bMappings = ctx.programBranches.filter((pb) => pb.branchId === b.id && pb.isActive)
        return bMappings.length === 0
          ? [B('No preschool programs mapped to this campus', b, 'ProgramBranch')]
          : []
      }),
    ].filter((f): f is Finding => f !== null)),

    // 6. Subjects
    cat('subject', 'Subjects & Activities', [
      activeSubs.length === 0 ? B('No active academic subjects or activities configured', null, 'Subject') : null,
      programs.length > 0 && ctx.programSubjects.length === 0 ? W('Subjects not mapped to programs yet', null, 'ProgramSubject') : null,
    ].filter((f): f is Finding => f !== null)),

    // 7. Curriculum
    cat('curriculum', 'Curriculum & Learning Areas', [
      A(cfg.CURRICULUM?.learningAreas).length === 0 && ctx.curriculums.length === 0
        ? B('No learning areas defined — observations and report cards need them', null, 'Curriculum')
        : null,
      A(cfg.CURRICULUM?.assessmentMethods).length === 0 ? W('No assessment methods configured (recommended)', null, 'Curriculum') : null,
    ].filter((f): f is Finding => f !== null)),

    // 8. Calendar
    cat('calendar', 'School Calendar Readiness', [
      A(cfg.OPERATING?.workingDays).length === 0 ? B('Working days not configured', null, 'SchoolConfig') : null,
      cur && !ctx.calendarEvents.some((e) => e.date >= cur.startDate && e.date <= cur.endDate)
        ? W('No calendar events (holidays/terms) in the current academic year', null, 'CalendarEvent')
        : null,
    ].filter((f): f is Finding => f !== null)),

    // 9. Admissions
    cat('admissions', 'Admissions Readiness', [
      !S(cfg.ADMISSION?.admissionOpenDate) ? W('Admission window not set — admissions module cannot open', null, 'SchoolConfig') : null,
      A(cfg.ADMISSION?.requiredDocuments).length === 0 ? W('No required documents configured for applications', null, 'SchoolConfig') : null,
      programs.length === 0 ? B('No programs — nothing to admit into', null, 'Program') : null,
    ].filter((f): f is Finding => f !== null)),

    // 10. Student & Parent Safeguards
    cat('students_parents', 'Student & Parent Safeguards', [
      A(cfg.STUDENT_PARENT?.consentTypes).length === 0 ? B('No consent types defined — enrolment cannot collect consent', null, 'SchoolConfig') : null,
      cfg.STUDENT_PARENT?.pickupVerification === undefined && cfg.DAILY_OPERATIONS?.pickupVerification === undefined
        ? B('Authorised pickup verification rules missing', null, 'SchoolConfig')
        : null,
    ].filter((f): f is Finding => f !== null)),

    // 11. Fees & Finance
    cat('finance', 'Fees & Finance', [
      ...branches.flatMap((b) => {
        const mappedProgIds = new Set(
          ctx.programBranches
            .filter((pb) => pb.branchId === b.id && pb.isActive)
            .map((pb) => pb.programId)
        )
        const branchProgs = mappedProgIds.size > 0
          ? programs.filter((p) => mappedProgIds.has(p.id))
          : programs

        const missing = branchProgs.filter((p) => {
          const hasActiveStructure = ctx.feeStructures.some(
            (fs) =>
              fs.status === 'ACTIVE' &&
              (fs.programId === p.id || fs.programType === p.programType) &&
              (!fs.branchId || fs.branchId === b.id)
          )
          const hasActivePlan = ctx.feePlans.some(
            (fp) => fp.isActive && fp.programType === p.programType
          )
          return !hasActiveStructure && !hasActivePlan
        })

        return missing.map((p) =>
          B(`No active fee structure configured for program "${p.name}"`, b, 'FeeStructure')
        )
      }),
      A(cfg.FINANCE?.paymentMethods).length === 0 ? W('Accepted payment methods not configured (defaults: Cash, UPI, Bank)', null, 'SchoolConfig') : null,
    ].filter((f): f is Finding => f !== null)),

    // 12. Daily Operations
    cat('daily_operations', 'Daily Operations Readiness', [
      cfg.DAILY_OPERATIONS?.attendanceEnabled !== true ? B('Attendance is not enabled — core daily operation', null, 'SchoolConfig') : null,
      A(cfg.DAILY_OPERATIONS?.recordTypes).length === 0 ? W('No daily record types (meals/nap/bathroom/mood) selected', null, 'SchoolConfig') : null,
    ].filter((f): f is Finding => f !== null)),

    // 13. Health & Safety
    cat('health_safety', 'Health & Safety Settings', [
      A(cfg.HEALTH_SAFETY?.emergencyContacts).length === 0 ? B('No emergency contacts configured', null, 'SchoolConfig') : null,
      A(cfg.HEALTH_SAFETY?.allergyCategories).length === 0 ? W('No allergy categories configured', null, 'SchoolConfig') : null,
      A(cfg.HEALTH_SAFETY?.incidentCategories).length === 0 ? W('No incident categories configured', null, 'SchoolConfig') : null,
    ].filter((f): f is Finding => f !== null)),

    // 14. Communication
    cat('communication', 'Communication Channels', [
      A(cfg.COMMUNICATION?.channels).length === 0 ? B('No communication channel enabled', null, 'SchoolConfig') : null,
      A(cfg.COMMUNICATION?.notificationEvents).length === 0 ? W('No notification events mapped (fee reminders, health alerts)', null, 'SchoolConfig') : null,
    ].filter((f): f is Finding => f !== null)),

    // 15. Templates
    cat('documents', 'Templates Registry', [
      A(cfg.DOCUMENT_TEMPLATES?.templates).length === 0 ? W('No document templates registered (receipts fall back to defaults)', null, 'SchoolConfig') : null,
    ].filter((f): f is Finding => f !== null)),

    // 16. Data Quality & Staff Assignment
    cat('data', 'Data Quality & Staffing', [
      ...branches.flatMap((b) => {
        const bRooms = curRooms.filter((c) => c.branchId === b.id)
        const unassigned = bRooms.filter((c) => c.primaryTeacherId == null)
        return unassigned.length > 0
          ? [B(`${unassigned.length} class(es) have no primary teacher assigned`, b, 'Classroom')]
          : []
      }),
    ].filter((f): f is Finding => f !== null)),
  ]

  // Branch summaries
  const branchSummaries: BranchValidationSummary[] = branches.map((b) => {
    const branchFindings: Finding[] = []
    for (const c of categories) {
      for (const f of c.findings) {
        if (f.branchId === b.id) {
          branchFindings.push(f)
        }
      }
    }
    const blockedCount = branchFindings.filter((f) => f.status === 'BLOCKED').length
    const warningCount = branchFindings.filter((f) => f.status === 'WARNING').length
    const bStatus: FindingStatus = blockedCount > 0 ? 'BLOCKED' : warningCount > 0 ? 'WARNING' : 'PASS'
    const blockers = branchFindings.filter((f) => f.status === 'BLOCKED').map((f) => f.message)
    return {
      branchId: b.id,
      branchName: b.name,
      status: bStatus,
      blockedCount,
      warningCount,
      blockers,
    }
  })

  // All blockers
  const blockers: { category: string; message: string; branchName?: string | null }[] = []
  for (const c of categories) {
    for (const f of c.findings) {
      if (f.status === 'BLOCKED') {
        blockers.push({
          category: c.key,
          message: f.message,
          branchName: f.branchName ?? null,
        })
      }
    }
  }

  const overall = categories.some((c) => c.status === 'BLOCKED')
    ? 'BLOCKED'
    : categories.some((c) => c.status === 'WARNING')
      ? 'WARNING'
      : 'PASS'

  return { overall, categories, branchSummaries, blockers }
}

/** Run validation, persist it in SchoolSetupValidationRun, and advance the state machine. */
export async function validateAndRecord(
  tenantId: string,
  kind: 'SETUP_VALIDATION' | 'GO_LIVE_CHECK',
  actor: { id: string; name: string }
): Promise<ValidationResult | null> {
  const result = await runValidation(tenantId)
  if (!result) return null

  await db.schoolSetupValidationRun.create({
    data: {
      tenantId,
      kind,
      overall: result.overall,
      result: result as unknown as object,
      runById: actor.id,
      runByName: actor.name,
    },
  })

  const setup = await db.schoolSetup.findUnique({ where: { tenantId } })
  if (!setup) return result

  const data: { lastValidationAt: Date; status?: 'READY_FOR_GO_LIVE' | 'READY_FOR_REVIEW' } = { lastValidationAt: new Date() }
  if (setup.status !== 'LIVE') {
    if (result.overall !== 'BLOCKED') {
      if (setup.status === 'READY_FOR_REVIEW' || setup.status === 'IN_PROGRESS') {
        data.status = 'READY_FOR_GO_LIVE'
      }
    } else if (setup.status === 'READY_FOR_GO_LIVE') {
      data.status = 'READY_FOR_REVIEW'
    }
  }

  await db.schoolSetup.update({ where: { tenantId }, data })
  return result
}

/** Execute the Go-Live transition once all checks pass */
export async function goLive(
  tenantId: string,
  actor: { id: string; name: string }
): Promise<{ ok: boolean; message: string; blockers?: { category: string; message: string; branchName?: string | null }[] }> {
  const result = await validateAndRecord(tenantId, 'GO_LIVE_CHECK', actor)
  if (!result || result.overall === 'BLOCKED') {
    return {
      ok: false,
      message: 'Cannot go live: critical setup checks are blocked across operating campuses.',
      blockers: result?.blockers || [],
    }
  }

  await db.schoolSetup.update({
    where: { tenantId },
    data: {
      status: 'LIVE',
      goLiveAt: new Date(),
    },
  })

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      status: 'ACTIVE',
    },
  })

  return { ok: true, message: 'School setup completed and school is now live!' }
}



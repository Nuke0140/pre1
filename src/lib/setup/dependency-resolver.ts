/**
 * PreOne — Smart Dependency Resolver Service
 *
 * Evaluates setup prerequisites against real persisted database configuration,
 * determines why steps are blocked, provides smart pre-filled defaults,
 * and executes 1-click prerequisite resolution with tenant isolation and audit logging.
 */

import { db } from '@/lib/db'
import { audit } from '@/lib/sequence'
import { SETUP_STEPS, STEP_MAP, type StepKey, type StepDef } from './steps'
import { syncSetup } from './engine'

export type ResolutionActionType =
  | 'QUICK_CREATE_YEAR'
  | 'QUICK_CREATE_BRANCH'
  | 'QUICK_CREATE_PROGRAM'
  | 'NAVIGATE_PROFILE'
  | 'NAVIGATE_STEP'

export interface PrerequisiteDiagnostic {
  key: StepKey
  label: string
  isMissing: boolean
  reason: string
  whyRequired: string
  actionType: ResolutionActionType
  actionLabel: string
  suggestedPayload?: Record<string, unknown>
  requiredPermission: string
  canUserResolve: boolean
  targetRoute: string
}

export interface StepDependencyResolution {
  stepKey: StepKey
  stepLabel: string
  isBlocked: boolean
  status: 'AVAILABLE' | 'BLOCKED' | 'COMPLETE'
  detail: string
  canResolveAll: boolean
  missingPrerequisites: PrerequisiteDiagnostic[]
  satisfiedPrerequisites: PrerequisiteDiagnostic[]
  nextRecommendedAction: PrerequisiteDiagnostic | null
}

/**
 * Explanations of why each prerequisite is required by downstream setup steps.
 */
export const PREREQUISITE_EXPLANATIONS: Record<StepKey, { reason: string; whyRequired: string; actionLabel: string; actionType: ResolutionActionType }> = {
  school_profile: {
    reason: 'Primary institution identity, timezone, and legal details are missing.',
    whyRequired: 'School profile establishes the legal identity, address, and local timezone required for campuses and calendars.',
    actionLabel: 'Configure School Profile',
    actionType: 'NAVIGATE_PROFILE',
  },
  branch: {
    reason: 'No operating campus or branch has been configured.',
    whyRequired: 'Campuses define the physical locations where classrooms, learning facilities, and academic sessions operate.',
    actionLabel: 'Quick Add Campus Branch',
    actionType: 'QUICK_CREATE_BRANCH',
  },
  academic_year: {
    reason: 'No operating academic year or session is configured.',
    whyRequired: 'An active academic session is required to anchor terms, classroom rosters, attendance tracking, and student billing.',
    actionLabel: 'Create Academic Year',
    actionType: 'QUICK_CREATE_YEAR',
  },
  programs: {
    reason: 'No preschool educational programs have been defined.',
    whyRequired: 'Classrooms and fee plans must map to specific educational programs (Playgroup, Nursery, LKG, UKG, or Daycare).',
    actionLabel: 'Quick Add Program',
    actionType: 'QUICK_CREATE_PROGRAM',
  },
  classroom: {
    reason: 'No classrooms configured.',
    whyRequired: 'Classrooms house student allocations and teacher assignments.',
    actionLabel: 'Add Classroom',
    actionType: 'NAVIGATE_STEP',
  },
  branding: {
    reason: 'Branding and theme not configured.',
    whyRequired: 'Branding personalizes receipts, reports, and portal theme.',
    actionLabel: 'Setup Branding',
    actionType: 'NAVIGATE_STEP',
  },
  roles: {
    reason: 'Staff roles not configured.',
    whyRequired: 'Roles dictate staff permissions.',
    actionLabel: 'Configure Roles',
    actionType: 'NAVIGATE_STEP',
  },
  classroom_foundation: {
    reason: 'Classrooms foundation missing.',
    whyRequired: 'Rooms and facilities required.',
    actionLabel: 'Setup Classrooms',
    actionType: 'NAVIGATE_STEP',
  },
  curriculum: {
    reason: 'Curriculum not configured.',
    whyRequired: 'Curriculum defines learning areas.',
    actionLabel: 'Configure Curriculum',
    actionType: 'NAVIGATE_STEP',
  },
  subject: {
    reason: 'Subjects not configured.',
    whyRequired: 'Subjects map activities to programs.',
    actionLabel: 'Configure Subjects',
    actionType: 'NAVIGATE_STEP',
  },
  mood_environment: {
    reason: 'Environment not set.',
    whyRequired: 'Defines learning space ambiance.',
    actionLabel: 'Configure Environment',
    actionType: 'NAVIGATE_STEP',
  },
  health_settings: {
    reason: 'Health settings not configured.',
    whyRequired: 'Defines health and safety protocols.',
    actionLabel: 'Configure Health Settings',
    actionType: 'NAVIGATE_STEP',
  },
  daily_operations: {
    reason: 'Daily operations not configured.',
    whyRequired: 'Configures school timings and daily routine.',
    actionLabel: 'Configure Daily Operations',
    actionType: 'NAVIGATE_STEP',
  },
  observation: {
    reason: 'Observation framework missing.',
    whyRequired: 'Configures assessment rubrics.',
    actionLabel: 'Configure Observations',
    actionType: 'NAVIGATE_STEP',
  },
  fees_setup: {
    reason: 'Fee structure not set.',
    whyRequired: 'Defines fee schedules and payment plans.',
    actionLabel: 'Configure Fees',
    actionType: 'NAVIGATE_STEP',
  },
  templates: {
    reason: 'Document templates not configured.',
    whyRequired: 'Required for invoices and certificates.',
    actionLabel: 'Configure Templates',
    actionType: 'NAVIGATE_STEP',
  },
  communication: {
    reason: 'Communication channels not set.',
    whyRequired: 'Defines messaging and notices.',
    actionLabel: 'Configure Communication',
    actionType: 'NAVIGATE_STEP',
  },
  promotion: {
    reason: 'Promotion rules not set.',
    whyRequired: 'Defines end-of-year grade transitions.',
    actionLabel: 'Configure Promotion',
    actionType: 'NAVIGATE_STEP',
  },
}

/**
 * Calculates a smart, deterministic, non-hardcoded Academic Year proposal
 * based on current calendar date and existing academic sessions.
 */
export function calculateSmartAcademicYear(
  existingSessions: { name: string; endDate: Date; startDate: Date }[],
  referenceDate: Date = new Date()
): { name: string; startDate: string; endDate: string; isCurrent: boolean } {
  // If existing sessions exist, sort by end date to determine the next sequential session
  if (existingSessions.length > 0) {
    const sorted = [...existingSessions].sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
    const latest = sorted[0]

    // Parse session naming pattern if numeric e.g. "2025-26" or "2025-2026"
    const yearMatch = latest.name.match(/(\d{4})[-–](\d{2,4})/)
    if (yearMatch) {
      const startYear = parseInt(yearMatch[1], 10) + 1
      const endYear = startYear + 1
      const endYearSuffix = String(endYear).slice(-2)

      // Start the day after or following month of previous session
      const nextStart = new Date(latest.endDate)
      nextStart.setDate(nextStart.getDate() + 1)
      const nextEnd = new Date(nextStart)
      nextEnd.setFullYear(nextEnd.getFullYear() + 1)
      nextEnd.setDate(nextEnd.getDate() - 1)

      return {
        name: `${startYear}-${endYearSuffix}`,
        startDate: nextStart.toISOString().slice(0, 10),
        endDate: nextEnd.toISOString().slice(0, 10),
        isCurrent: false,
      }
    }
  }

  // If no existing sessions, calculate based on current reference date (April 1 or June 1 cycle)
  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth() // 0-indexed: 0 = Jan, 3 = April, 5 = June

  // If current month is June or later (preschool academic session standard in many regions)
  let startYear = currentYear
  if (currentMonth < 3) {
    // Before April, current academic session started last calendar year
    startYear = currentYear - 1
  }

  const endYear = startYear + 1
  const endYearSuffix = String(endYear).slice(-2)
  const startDate = `${startYear}-06-01`
  const endDate = `${endYear}-04-30`

  return {
    name: `${startYear}-${endYearSuffix}`,
    startDate,
    endDate,
    isCurrent: true,
  }
}

/**
 * Determines a smart branch code and name proposal.
 */
export function calculateSmartBranch(
  existingBranches: { code: string; name: string }[]
): { name: string; code: string; capacity: number } {
  const count = existingBranches.length
  if (count === 0) {
    return { name: 'Main Campus', code: 'MAIN', capacity: 120 }
  }

  const nextNum = count + 1
  const suggestedCode = `CAMPUS-${nextNum}`
  const suggestedName = `Campus ${nextNum}`

  return {
    name: suggestedName,
    code: suggestedCode,
    capacity: 100,
  }
}

/**
 * Topological prerequisite ordering to ensure root prerequisites (e.g. Branch)
 * are resolved before dependent prerequisites (e.g. Academic Year).
 */
export function orderPrerequisites(prerequisites: StepKey[]): StepKey[] {
  const order: StepKey[] = ['school_profile', 'branch', 'programs', 'academic_year', 'classroom']
  return [...prerequisites].sort((a, b) => {
    const idxA = order.indexOf(a)
    const idxB = order.indexOf(b)
    const scoreA = idxA >= 0 ? idxA : 99
    const scoreB = idxB >= 0 ? idxB : 99
    return scoreA - scoreB
  })
}

/**
 * Validates that there are no circular dependencies in the step definition graph.
 */
export function detectDependencyCycles(steps: StepDef[] = SETUP_STEPS): { hasCycle: boolean; cyclePath?: string[] } {
  const stepMap = new Map(steps.map((s) => [s.key, s]))
  const visited = new Set<StepKey>()
  const recursionStack = new Set<StepKey>()
  let detectedPath: string[] = []

  function dfs(curr: StepKey, path: StepKey[]): boolean {
    visited.add(curr)
    recursionStack.add(curr)
    path.push(curr)

    const def = stepMap.get(curr)
    if (def) {
      for (const dep of def.deps) {
        if (!visited.has(dep)) {
          if (dfs(dep, [...path])) return true
        } else if (recursionStack.has(dep)) {
          detectedPath = [...path, dep]
          return true
        }
      }
    }

    recursionStack.delete(curr)
    return false
  }

  for (const step of steps) {
    if (!visited.has(step.key)) {
      if (dfs(step.key, [])) {
        return { hasCycle: true, cyclePath: detectedPath }
      }
    }
  }

  return { hasCycle: false }
}

/**
 * Core Diagnostic: Evaluates exact missing prerequisites for a step
 * from actual persisted database entities.
 */
export async function evaluateStepDependencies(
  tenantId: string,
  stepKey: StepKey,
  branchId?: string | null,
  userPermissions: string[] = ['settings:write', 'settings:read']
): Promise<StepDependencyResolution> {
  const def = STEP_MAP[stepKey]
  if (!def) {
    throw new Error(`Unknown setup step: ${stepKey}`)
  }

  // Load persistent DB status
  const rows = await db.schoolSetupStep.findMany({ where: { tenantId } })
  const stepByKey = Object.fromEntries(rows.map((r) => [r.stepKey, r]))

  // Real entity checks
  const [tenant, branches, sessions, programs] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.branch.findMany({ where: { tenantId, deletedAt: null, isActive: true } }),
    db.academicSession.findMany({ where: { tenantId } }),
    db.program.findMany({ where: { tenantId, deletedAt: null, isActive: true } }),
  ])

  const missingList: PrerequisiteDiagnostic[] = []
  const satisfiedList: PrerequisiteDiagnostic[] = []

  // Check each declared dependency in topological order
  const orderedDeps = orderPrerequisites(def.deps)

  for (const depKey of orderedDeps) {
    const depDef = STEP_MAP[depKey]
    const depRow = stepByKey[depKey]
    const meta = PREREQUISITE_EXPLANATIONS[depKey] || {
      reason: `Requires ${depDef?.label || depKey} to be configured.`,
      whyRequired: `This prerequisite must be completed before ${def.label} can be configured.`,
      actionLabel: `Configure ${depDef?.label || depKey}`,
      actionType: 'NAVIGATE_STEP' as ResolutionActionType,
    }

    // Determine if prerequisite is truly satisfied by DB entities
    let isSatisfied = false
    let suggestedPayload: Record<string, unknown> | undefined

    switch (depKey) {
      case 'school_profile':
        isSatisfied = Boolean(tenant?.name && tenant?.timezone && tenant?.city)
        break
      case 'branch':
        isSatisfied = branches.length > 0
        if (!isSatisfied) {
          suggestedPayload = calculateSmartBranch(branches)
        }
        break
      case 'academic_year':
        isSatisfied = sessions.length > 0
        if (!isSatisfied) {
          suggestedPayload = calculateSmartAcademicYear(sessions)
        }
        break
      case 'programs':
        isSatisfied = programs.length > 0
        if (!isSatisfied) {
          suggestedPayload = {
            name: 'Playgroup',
            code: 'PG',
            programType: 'PLAYGROUP',
            capacity: 20,
            description: 'Foundation exploratory early-learning program',
          }
        }
        break
      default:
        isSatisfied = depRow?.status === 'COMPLETE' || depRow?.status === 'SKIPPED'
        break
    }

    const canResolve = userPermissions.includes('settings:write') || userPermissions.includes('*')

    const item: PrerequisiteDiagnostic = {
      key: depKey,
      label: depDef?.label || depKey,
      isMissing: !isSatisfied,
      reason: meta.reason,
      whyRequired: meta.whyRequired,
      actionType: meta.actionType,
      actionLabel: meta.actionLabel,
      suggestedPayload,
      requiredPermission: 'settings:write',
      canUserResolve: canResolve,
      targetRoute: `/app/setup/${depKey}`,
    }

    if (isSatisfied) {
      satisfiedList.push(item)
    } else {
      missingList.push(item)
    }
  }

  const currentRow = stepByKey[stepKey]
  const isBlocked = missingList.length > 0
  const status: 'AVAILABLE' | 'BLOCKED' | 'COMPLETE' =
    currentRow?.status === 'COMPLETE' ? 'COMPLETE' : isBlocked ? 'BLOCKED' : 'AVAILABLE'

  const detail = isBlocked
    ? `Blocked by ${missingList.length} prerequisite(s): ${missingList.map((m) => m.label).join(', ')}`
    : `All prerequisites satisfied. ${def.label} is ready for configuration.`

  return {
    stepKey,
    stepLabel: def.label,
    isBlocked,
    status,
    detail,
    canResolveAll: missingList.every((m) => m.canUserResolve),
    missingPrerequisites: missingList,
    satisfiedPrerequisites: satisfiedList,
    nextRecommendedAction: missingList[0] || null,
  }
}

/**
 * 1-Click Prerequisite Resolution Executor
 * Safely creates missing entity, logs audit, and updates setup engine state.
 */
export async function executePrerequisiteResolution(
  tenantId: string,
  actor: { id: string; name: string },
  actionType: ResolutionActionType,
  payload: Record<string, any>
): Promise<{ success: boolean; createdId: string; message: string; stepKey: StepKey }> {
  switch (actionType) {
    case 'QUICK_CREATE_YEAR': {
      const { name, startDate, endDate, status = 'ACTIVE' } = payload
      if (!name || !startDate || !endDate) {
        throw new Error('Name, start date, and end date are required for Academic Year')
      }
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid dates provided for Academic Year')
      }
      if (start >= end) {
        throw new Error('Academic Year end date must be after start date')
      }

      // Check duplicate
      const dup = await db.academicSession.findFirst({
        where: { tenantId, name: String(name).trim() },
      })
      if (dup) {
        throw new Error(`Academic year "${name}" already exists`)
      }

      const count = await db.academicSession.count({ where: { tenantId } })

      const created = await db.academicSession.create({
        data: {
          tenantId,
          name: String(name).trim(),
          startDate: start,
          endDate: end,
          status: status === 'ACTIVE' ? 'ACTIVE' : 'PLANNED',
          isCurrent: count === 0, // First year is automatically current session
        },
      })

      await audit({
        tenantId,
        actorId: actor.id,
        actorName: actor.name,
        action: 'CREATE',
        entity: 'AcademicSession',
        entityId: created.id,
        summary: `Smart Dependency Resolver: Created Academic Year ${created.name} (${startDate} → ${endDate})`,
      })

      // Immediate setup engine sync
      await syncSetup(tenantId, actor)

      return {
        success: true,
        createdId: created.id,
        message: `Academic Year ${created.name} successfully created.`,
        stepKey: 'academic_year',
      }
    }

    case 'QUICK_CREATE_BRANCH': {
      const { name, code, capacity = 100, city, address, phone } = payload
      if (!name || !code) {
        throw new Error('Branch name and unique branch code are required')
      }
      const upperCode = String(code).trim().toUpperCase()

      const dup = await db.branch.findFirst({
        where: { tenantId, code: upperCode, deletedAt: null },
      })
      if (dup) {
        throw new Error(`Branch code "${upperCode}" already exists`)
      }

      const branch = await db.branch.create({
        data: {
          tenantId,
          name: String(name).trim(),
          code: upperCode,
          capacity: capacity ? Number(capacity) : 100,
          city: city ? String(city).trim() : null,
          address: address ? String(address).trim() : null,
          phone: phone ? String(phone).trim() : null,
          isActive: true,
        },
      })

      await audit({
        tenantId,
        actorId: actor.id,
        actorName: actor.name,
        action: 'CREATE',
        entity: 'Branch',
        entityId: branch.id,
        summary: `Smart Dependency Resolver: Created Campus Branch ${branch.name} (${branch.code})`,
      })

      // Immediate setup engine sync
      await syncSetup(tenantId, actor)

      return {
        success: true,
        createdId: branch.id,
        message: `Campus Branch ${branch.name} successfully created.`,
        stepKey: 'branch',
      }
    }

    case 'QUICK_CREATE_PROGRAM': {
      const { name, code, programType = 'PLAYGROUP', capacity = 20, description } = payload
      if (!name || !code) {
        throw new Error('Program name and code are required')
      }
      const upperCode = String(code).trim().toUpperCase()

      const dup = await db.program.findFirst({
        where: { tenantId, code: upperCode, deletedAt: null },
      })
      if (dup) {
        throw new Error(`Program code "${upperCode}" already exists`)
      }

      const program = await db.program.create({
        data: {
          tenantId,
          name: String(name).trim(),
          code: upperCode,
          programType: programType as any,
          capacity: capacity ? Number(capacity) : 20,
          description: description ? String(description).trim() : null,
          isActive: true,
        },
      })

      await audit({
        tenantId,
        actorId: actor.id,
        actorName: actor.name,
        action: 'CREATE',
        entity: 'Program',
        entityId: program.id,
        summary: `Smart Dependency Resolver: Created Educational Program ${program.name} (${program.code})`,
      })

      // Immediate setup engine sync
      await syncSetup(tenantId, actor)

      return {
        success: true,
        createdId: program.id,
        message: `Program ${program.name} successfully created.`,
        stepKey: 'programs',
      }
    }

    default:
      throw new Error(`Unsupported 1-click action type: ${actionType}`)
  }
}

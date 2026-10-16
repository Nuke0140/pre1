/**
 * PreOne — Setup Scope Model & Branch Copy Policies (M00)
 *
 * Establishes an authoritative scope classification across all PreOne setup entities:
 * 1. TENANT (School-Wide / Global): Settings shared across the entire school organization.
 * 2. BRANCH (Branch-Specific): Settings tailored to an individual campus or operating branch.
 *
 * Also defines the strict Category-Level Copy Policy for transferring supported
 * configuration safely between branches without duplicating or corrupting operational data.
 */

import type { StepKey, StepScope } from './steps'

export type SetupScope = 'TENANT' | 'BRANCH'

export interface SetupStepScopeInfo {
  key: StepKey
  scope: SetupScope
  title: string
  globalLabel: string
  branchLabelPrefix: string
  description: string
  schoolWideExplanation: string
  branchSpecificExplanation: string
  copyable: boolean
  copyCategory?: CopyableCategory
}

export type CopyableCategory = 'classrooms' | 'fee_structures' | 'programs' | 'facilities'

export interface CategoryCopyPolicy {
  category: CopyableCategory
  label: string
  description: string
  supported: boolean
  copiedFields: string[]
  transformedFields: string[]
  excludedFields: string[]
  dependencyPrerequisites: string[]
  conflictKey: string
  allowOverwrite: boolean
}

/** Authoritative Setup Scope Registry */
export const SETUP_SCOPE_REGISTRY: Record<StepKey, SetupStepScopeInfo> = {
  // ── School-Wide (Global) ──────────────────────────────────────────────
  school_profile: {
    key: 'school_profile',
    scope: 'TENANT',
    title: 'School Profile',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Legal identity, address, contact details, timezone and authorized principal signature.',
    schoolWideExplanation: 'Changes to school profile apply organization-wide across all campuses.',
    branchSpecificExplanation: '',
    copyable: false,
  },
  branch: {
    key: 'branch',
    scope: 'TENANT',
    title: 'Branch / Campus',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Central registry of all operating campuses, addresses, contact details and operating capacities.',
    schoolWideExplanation: 'Campus registry is shared across the organization.',
    branchSpecificExplanation: '',
    copyable: false,
  },
  branding: {
    key: 'branding',
    scope: 'TENANT',
    title: 'Branding & Theme',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'School logo, theme colors, and brand assets used across portals, receipts, and report cards.',
    schoolWideExplanation: 'Branding is shared across all school branches.',
    branchSpecificExplanation: '',
    copyable: false,
  },
  roles: {
    key: 'roles',
    scope: 'TENANT',
    title: 'Roles & Permissions',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Role definitions, capabilities, and access control governance.',
    schoolWideExplanation: 'Role definitions and access policies govern all campuses.',
    branchSpecificExplanation: '',
    copyable: false,
  },
  templates: {
    key: 'templates',
    scope: 'TENANT',
    title: 'Templates',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Central registry of branded document templates: admission forms, receipts, consent forms, and certificates.',
    schoolWideExplanation: 'Document templates are maintained centrally for the entire organization.',
    branchSpecificExplanation: '',
    copyable: false,
  },

  // ── Branch-Specific ──────────────────────────────────────────────────
  academic_year: {
    key: 'academic_year',
    scope: 'BRANCH',
    title: 'Academic Year',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Operating academic session calendar, terms, and working periods.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Configured for the selected campus academic schedule.',
    copyable: false, // Sessions are tenant-wide with branch calendar events
  },
  programs: {
    key: 'programs',
    scope: 'BRANCH',
    title: 'Program',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Preschool programs offered (Playgroup, Nursery, Jr KG, Sr KG, Daycare) and campus availability mappings.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Program capacity and campus availability mapped to the selected branch.',
    copyable: true,
    copyCategory: 'programs',
  },
  classroom: {
    key: 'classroom',
    scope: 'BRANCH',
    title: 'Classroom',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Class-section units per program with capacity, assigned room, and primary teacher.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Classroom sections and capacity configured for the selected branch.',
    copyable: true,
    copyCategory: 'classrooms',
  },
  classroom_foundation: {
    key: 'classroom_foundation',
    scope: 'BRANCH',
    title: 'Classroom Foundation',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Initial room setup and capacity allocation for the campus.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Configured specifically for the selected campus.',
    copyable: true,
    copyCategory: 'classrooms',
  },
  subject: {
    key: 'subject',
    scope: 'BRANCH',
    title: 'Subject',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Academic subjects and activity disciplines mapped to campus programs and classrooms.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Subject curriculum mapped to this campus.',
    copyable: false,
  },
  fees_setup: {
    key: 'fees_setup',
    scope: 'BRANCH',
    title: 'Fees Setup',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Fee structures, tuition, frequencies, and fee schedules per program and campus.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Fee heads and fee structures configured for the selected campus.',
    copyable: true,
    copyCategory: 'fee_structures',
  },
  promotion: {
    key: 'promotion',
    scope: 'BRANCH',
    title: 'Promotion',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Year-end academic progression rules and program grade mappings.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Promotion criteria and progression rules for the selected campus.',
    copyable: false,
  },
  // Legacy / optional keys
  mood_environment: {
    key: 'mood_environment',
    scope: 'BRANCH',
    title: 'Mood & Environment',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Campus sensory and learning environment configuration.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Configured for the selected campus.',
    copyable: false,
  },
  health_settings: {
    key: 'health_settings',
    scope: 'BRANCH',
    title: 'Health & Safety',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Campus emergency and health verification standards.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Campus-specific health and emergency protocols.',
    copyable: false,
  },
  daily_operations: {
    key: 'daily_operations',
    scope: 'BRANCH',
    title: 'Daily Operations',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Operating hours, drop-off/pickup gates, and daily schedule.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Operating schedule for the selected campus.',
    copyable: false,
  },
  observation: {
    key: 'observation',
    scope: 'BRANCH',
    title: 'Observation & Milestones',
    globalLabel: '🏫 Branch Specific',
    branchLabelPrefix: '🏫 Branch Specific · ',
    description: 'Child observation guidelines and tracking milestones.',
    schoolWideExplanation: '',
    branchSpecificExplanation: 'Developmental milestones for this campus.',
    copyable: false,
  },
  communication: {
    key: 'communication',
    scope: 'TENANT',
    title: 'Communication',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Delivery channels, SMS/WhatsApp gateways, and event triggers.',
    schoolWideExplanation: 'Organization-wide messaging gateways and channels.',
    branchSpecificExplanation: '',
    copyable: false,
  },
  curriculum: {
    key: 'curriculum',
    scope: 'TENANT',
    title: 'Curriculum',
    globalLabel: '🌐 All Branches',
    branchLabelPrefix: '',
    description: 'Early years learning frameworks and pedagogical standards.',
    schoolWideExplanation: 'Curriculum framework is shared organization-wide.',
    branchSpecificExplanation: '',
    copyable: false,
  },
}

/** Category-Level Copy Policies */
export const CATEGORY_COPY_POLICIES: Record<CopyableCategory, CategoryCopyPolicy> = {
  classrooms: {
    category: 'classrooms',
    label: 'Classrooms & Learning Sections',
    description: 'Copies room definitions, program types, and room capacities. Generates fresh unique codes.',
    supported: true,
    copiedFields: ['name', 'programType', 'capacity', 'ageBandMinMonths', 'ageBandMaxMonths'],
    transformedFields: ['branchId (destination branch)', 'code (destination-scoped unique code)', 'academicSessionId'],
    excludedFields: [
      'primaryTeacherId (staff assignments not copied)',
      'students (zero student records transferred)',
      'attendances (no attendance history copied)',
      'observations (no child observations copied)',
      'materialRequests',
      'stockIssues',
    ],
    dependencyPrerequisites: ['Active academic session in tenant', 'Programs must exist in tenant'],
    conflictKey: 'name + programType',
    allowOverwrite: true,
  },
  fee_structures: {
    category: 'fee_structures',
    label: 'Fee Structures & Component Heads',
    description: 'Copies tuition and fee component schedules, frequencies, and amounts mapped to the destination branch.',
    supported: true,
    copiedFields: ['name', 'description', 'programType', 'status', 'items (name, amountCents, currency, frequency, feeType, dueRule, isRefundable)'],
    transformedFields: ['branchId (destination branch)', 'academicSessionId', 'feeHeadId (mapped)'],
    excludedFields: [
      'studentFeeSchedules (zero student billing schedules transferred)',
      'invoices (zero financial invoices or charges created)',
      'payments (zero payment records transferred)',
      'deposits (zero security deposits copied)',
    ],
    dependencyPrerequisites: ['Fee heads must exist in tenant'],
    conflictKey: 'name + programType',
    allowOverwrite: true,
  },
  programs: {
    category: 'programs',
    label: 'Program Campus Availability & Capacities',
    description: 'Maps the programs offered at the source branch to the destination campus with capacity guidelines.',
    supported: true,
    copiedFields: ['capacity', 'isActive', 'displayOrder'],
    transformedFields: ['branchId (destination branch)', 'programId (mapped)'],
    excludedFields: ['Enrolled students', 'Classroom assignments'],
    dependencyPrerequisites: ['Programs must exist in tenant'],
    conflictKey: 'programId',
    allowOverwrite: true,
  },
  facilities: {
    category: 'facilities',
    label: 'Campus Facilities & Learning Spaces',
    description: 'Copies learning environments, play areas, and facility definitions with unique destination codes.',
    supported: true,
    copiedFields: ['name', 'type', 'capacity', 'floorOrArea', 'ageSuitability', 'isActive'],
    transformedFields: ['branchId (destination branch)', 'code (destination-scoped unique code)'],
    excludedFields: ['Classroom room assignments', 'Maintenance records'],
    dependencyPrerequisites: [],
    conflictKey: 'name + type',
    allowOverwrite: true,
  },
}

export interface ScopedProgressMetrics {
  schoolWide: {
    total: number
    completed: number
    percentage: number
    mandatoryTotal: number
    mandatoryCompleted: number
    isComplete: boolean
  }
  branchSpecific: {
    branchId: string | null
    branchName: string | null
    total: number
    completed: number
    percentage: number
    mandatoryTotal: number
    mandatoryCompleted: number
    isComplete: boolean
  }
  combined: {
    total: number
    completed: number
    percentage: number
  }
}

/**
 * Calculates separate completion metrics for School-Wide and Branch-Specific setup scopes.
 */
export function calculateScopedProgress(
  steps: Array<{ key: string; scope: SetupScope | string; status: string; applicability: string }>,
  selectedBranchId: string | null,
  selectedBranchName: string | null
): ScopedProgressMetrics {
  const globalSteps = steps.filter((s) => s.scope === 'TENANT')
  const branchSteps = steps.filter((s) => s.scope === 'BRANCH')

  const isDone = (s: { status: string }) => s.status === 'COMPLETE' || s.status === 'SKIPPED'
  const isMandatory = (s: { applicability: string }) => s.applicability === 'MANDATORY'

  const globalCompleted = globalSteps.filter(isDone).length
  const globalMandatory = globalSteps.filter(isMandatory)
  const globalMandatoryDone = globalMandatory.filter(isDone).length

  const branchCompleted = branchSteps.filter(isDone).length
  const branchMandatory = branchSteps.filter(isMandatory)
  const branchMandatoryDone = branchMandatory.filter(isDone).length

  const totalCompleted = steps.filter(isDone).length

  return {
    schoolWide: {
      total: globalSteps.length,
      completed: globalCompleted,
      percentage: globalSteps.length > 0 ? Math.round((globalCompleted / globalSteps.length) * 100) : 0,
      mandatoryTotal: globalMandatory.length,
      mandatoryCompleted: globalMandatoryDone,
      isComplete: globalMandatory.length > 0 && globalMandatoryDone >= globalMandatory.length,
    },
    branchSpecific: {
      branchId: selectedBranchId,
      branchName: selectedBranchName,
      total: branchSteps.length,
      completed: branchCompleted,
      percentage: branchSteps.length > 0 ? Math.round((branchCompleted / branchSteps.length) * 100) : 0,
      mandatoryTotal: branchMandatory.length,
      mandatoryCompleted: branchMandatoryDone,
      isComplete: branchMandatory.length > 0 && branchMandatoryDone >= branchMandatory.length,
    },
    combined: {
      total: steps.length,
      completed: totalCompleted,
      percentage: steps.length > 0 ? Math.round((totalCompleted / steps.length) * 100) : 0,
    },
  }
}

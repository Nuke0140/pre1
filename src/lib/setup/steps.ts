/**
 * M00 — Setup Step Registry (v2 Canonical 17-Area Architecture)
 *
 * Canonical definition of every Preschool Creation & Setup step:
 * applicability (MANDATORY / OPTIONAL / RECOMMENDED), dependency edges
 * (blocking), phase grouping and UI copy.
 *
 * Rules of the house:
 *  - Steps derive completion from REAL operational data — never from
 *    parallel "setup copies" of configuration.
 *  - Zero shadow tables: Existing PreOne entities are the source of truth
 *    (Tenant, Branch, AcademicSession, Program, Classroom, Subject, FeePlan, SchoolConfig).
 */

export type StepKey =
  // Phase 1 — Foundation (5)
  | 'school_profile'
  | 'branch'
  | 'classroom_foundation'
  | 'branding'
  | 'roles'
  // Phase 2 — Academic Structure (5)
  | 'academic_year'
  | 'curriculum'
  | 'programs'
  | 'classroom'
  | 'subject'
  // Phase 3 — Operations (4)
  | 'mood_environment'
  | 'health_settings'
  | 'daily_operations'
  | 'observation'
  // Phase 4 — Business Rules (4)
  | 'fees_setup'
  | 'templates'
  | 'communication'
  | 'promotion'

export type Applicability = 'MANDATORY' | 'OPTIONAL' | 'RECOMMENDED'

export type StepPhase = 'FOUNDATION' | 'ACADEMIC_STRUCTURE' | 'OPERATIONS' | 'BUSINESS_RULES'

export type StepScope = 'TENANT' | 'BRANCH'

export interface StepDef {
  key: StepKey
  label: string
  phase: StepPhase
  scope: StepScope
  applicability: Applicability
  /** blocking dependencies — all must be COMPLETE or SKIPPED before this step unlocks */
  deps: StepKey[]
  /** one-line explanation shown on the dashboard and step page */
  description: string
  /** lucide icon name (client maps string → component) */
  icon: string
}

export const SETUP_STEPS: StepDef[] = [
  // ── PHASE 1 — FOUNDATION ──────────────────────────────────────────────
  {
    key: 'school_profile',
    label: 'School Profile',
    phase: 'FOUNDATION',
    scope: 'TENANT',
    applicability: 'MANDATORY',
    deps: [],
    icon: 'School',
    description: 'Legal identity, address, contact details, timezone and authorized principal signature.',
  },
  {
    key: 'branch',
    label: 'Branch / Campus',
    phase: 'FOUNDATION',
    scope: 'TENANT',
    applicability: 'MANDATORY',
    deps: ['school_profile'],
    icon: 'Building2',
    description: 'At least one operating campus with address, contact details and operating capacity.',
  },
  {
    key: 'classroom_foundation',
    label: 'Classroom Foundation',
    phase: 'FOUNDATION',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['branch'],
    icon: 'DoorOpen',
    description: 'Basic physical classrooms and rooms created and assigned to operating branches.',
  },
  {
    key: 'branding',
    label: 'Branding & Theme',
    phase: 'FOUNDATION',
    scope: 'TENANT',
    applicability: 'RECOMMENDED',
    deps: ['school_profile'],
    icon: 'Palette',
    description: 'School logo and brand colors applied across portals, receipts, report cards and communications.',
  },
  {
    key: 'roles',
    label: 'Roles & Permissions',
    phase: 'FOUNDATION',
    scope: 'TENANT',
    applicability: 'OPTIONAL',
    deps: ['school_profile'],
    icon: 'ShieldCheck',
    description: 'Roles & Permissions: deferred for future implementation (non-blocking).',
  },

  // ── PHASE 2 — ACADEMIC STRUCTURE ─────────────────────────────────────
  {
    key: 'academic_year',
    label: 'Academic Year',
    phase: 'ACADEMIC_STRUCTURE',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['branch'],
    icon: 'CalendarRange',
    description: 'Operating academic session (with start/end dates) that rosters, admissions, attendance and fees hang from.',
  },
  {
    key: 'curriculum',
    label: 'Curriculum Approach',
    phase: 'ACADEMIC_STRUCTURE',
    scope: 'TENANT',
    applicability: 'OPTIONAL',
    deps: [],
    icon: 'BookOpen',
    description: 'Optional pedagogical framework (EYFS, Montessori, Reggio Emilia, NEP 2020) — preserved and non-mandatory.',
  },
  {
    key: 'programs',
    label: 'Program',
    phase: 'ACADEMIC_STRUCTURE',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['school_profile'],
    icon: 'Blocks',
    description: 'Preschool programs offered (Playgroup, Nursery, Jr KG, Sr KG, Daycare) with age bands and campus availability mappings.',
  },
  {
    key: 'classroom',
    label: 'Classroom',
    phase: 'ACADEMIC_STRUCTURE',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['academic_year', 'programs', 'branch', 'classroom_foundation'],
    icon: 'LayoutGrid',
    description: 'Class-section units per program with capacity, assigned room, and designated primary teacher.',
  },
  {
    key: 'subject',
    label: 'Subject',
    phase: 'ACADEMIC_STRUCTURE',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['programs'],
    icon: 'GraduationCap',
    description: 'Academic subjects and activity disciplines (Core, Optional, Activity) mapped to programs and classrooms.',
  },

  // ── PHASE 3 — BUSINESS RULES (Phase 3 Operations removed) ────────────
  {
    key: 'fees_setup',
    label: 'Fees Setup',
    phase: 'BUSINESS_RULES',
    scope: 'BRANCH',
    applicability: 'MANDATORY',
    deps: ['programs', 'academic_year'],
    icon: 'IndianRupee',
    description: 'Complete fee structure governance: tuition, deposits, frequencies, fee schedules, receipts and payments per program and campus.',
  },
  {
    key: 'templates',
    label: 'Templates',
    phase: 'BUSINESS_RULES',
    scope: 'TENANT',
    applicability: 'RECOMMENDED',
    deps: ['school_profile'],
    icon: 'FileText',
    description: 'Central registry of branded document templates: admission forms, receipts, consent forms, and certificates.',
  },
  {
    key: 'communication',
    label: 'Communication',
    phase: 'BUSINESS_RULES',
    scope: 'TENANT',
    applicability: 'MANDATORY',
    deps: ['school_profile'],
    icon: 'Megaphone',
    description: 'Active delivery channels (In-App, WhatsApp, SMS, Email), event trigger mappings, and parent summary dispatch rules.',
  },
  {
    key: 'promotion',
    label: 'Promotion',
    phase: 'BUSINESS_RULES',
    scope: 'BRANCH',
    applicability: 'RECOMMENDED',
    deps: ['programs', 'academic_year'],
    icon: 'ArrowRight',
    description: 'Year-end academic progression rules, program grade mappings, and capacity checks preserving immutable allocation history.',
  },
]

export const STEP_MAP: Record<string, StepDef> = Object.fromEntries(
  SETUP_STEPS.map((s) => [s.key, s])
)

export const PHASES: { key: StepPhase; label: string; sub: string }[] = [
  { key: 'FOUNDATION', label: 'Foundation', sub: 'Who the school is and who operates it' },
  { key: 'ACADEMIC_STRUCTURE', label: 'Academic Structure', sub: 'Year, programs, classrooms and subjects' },
  { key: 'BUSINESS_RULES', label: 'Business Rules', sub: 'Fees setup, templates, communication and academic promotion' },
]

export function isUnlocked(
  step: StepDef,
  statusOf: (key: StepKey) => 'PENDING' | 'COMPLETE' | 'BLOCKED' | 'SKIPPED'
): boolean {
  return step.deps.every((d) => {
    const s = statusOf(d)
    return s === 'COMPLETE' || s === 'SKIPPED'
  })
}

/** Legacy key alias map for backward compatibility */
export const LEGACY_KEY_MAP: Record<string, StepKey> = {
  classes_sections: 'classroom',
  teacher_assignment: 'classroom',
  infrastructure: 'branch',
  fees: 'fees_setup',
  documents: 'templates',
  health_safety: 'health_settings',
  operating_config: 'daily_operations',
  admission_config: 'daily_operations',
  student_parent: 'daily_operations',
}

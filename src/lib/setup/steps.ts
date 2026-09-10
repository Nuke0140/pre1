/**
 * M00 — Setup Step Registry
 *
 * Canonical definition of every Preschool Creation & Setup step:
 * applicability (MANDATORY / OPTIONAL / RECOMMENDED), dependency edges
 * (blocking), phase grouping and UI copy.
 *
 * Rules of the house (Impact Map §1):
 *  - Steps derive completion from REAL operational data — never from
 *    parallel "setup copies" of configuration.
 *  - Existing PreOne entities are the source of truth (Branch,
 *    AcademicSession, Classroom, FeePlan, Tenant, SchoolConfig).
 */

export type StepKey =
  | 'school_profile'
  | 'branch'
  | 'branding'
  | 'programs'
  | 'infrastructure'
  | 'operating_config'
  | 'roles'
  | 'staff'
  | 'academic_year'
  | 'classes_sections'
  | 'teacher_assignment'
  | 'curriculum'
  | 'calendar'
  | 'fees'
  | 'admission_config'
  | 'student_parent'
  | 'daily_operations'
  | 'health_safety'
  | 'communication'
  | 'documents'
  | 'data_import'

export type Applicability = 'MANDATORY' | 'OPTIONAL' | 'RECOMMENDED'

export type StepPhase = 'FOUNDATION' | 'ACADEMIC_STRUCTURE' | 'BUSINESS_RULES' | 'OPERATIONS_READINESS'

export interface StepDef {
  key: StepKey
  label: string
  phase: StepPhase
  applicability: Applicability
  /** blocking dependencies — all must be COMPLETE or SKIPPED before this step unlocks */
  deps: StepKey[]
  /** one-line explanation shown on the dashboard and step page */
  description: string
  /** lucide icon name (client maps string → component) */
  icon: string
}

export const SETUP_STEPS: StepDef[] = [
  {
    key: 'school_profile', label: 'School Profile', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: [], icon: 'School',
    description: 'Legal identity, contact details, address, timezone and language of the preschool.',
  },
  {
    key: 'branch', label: 'Branch / Campus', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['school_profile'], icon: 'Building2',
    description: 'At least one operating campus with address and daily timings. One school may run many branches.',
  },
  {
    key: 'branding', label: 'Branding & Theme', phase: 'FOUNDATION',
    applicability: 'RECOMMENDED', deps: ['school_profile'], icon: 'Palette',
    description: 'School logo and colours applied across login, portals, receipts and documents.',
  },
  {
    key: 'programs', label: 'Programs Offered', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['school_profile'], icon: 'Blocks',
    description: 'Programs the preschool runs (Playgroup, Nursery, Jr KG, Sr KG, Daycare or custom) with age eligibility and capacity.',
  },
  {
    key: 'infrastructure', label: 'Infrastructure', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['branch'], icon: 'DoorOpen',
    description: 'Rooms and areas per branch — classrooms, activity, play, nap, meal areas, washrooms and medical rooms.',
  },
  {
    key: 'operating_config', label: 'Operating Configuration', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['branch'], icon: 'Clock',
    description: 'School hours, arrival & pickup windows, working days and absence rules consumed by Daily Operations.',
  },
  {
    key: 'roles', label: 'Roles & Permissions', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['school_profile'], icon: 'ShieldCheck',
    description: 'Who operates the school — owner plus at least one staff account using the PreOne RBAC roles.',
  },
  {
    key: 'staff', label: 'Staff Foundation', phase: 'FOUNDATION',
    applicability: 'MANDATORY', deps: ['roles'], icon: 'Users',
    description: 'Staff employment profiles (code, designation, joining date) with branch assignment — creation is not assignment.',
  },

  {
    key: 'academic_year', label: 'Academic Year', phase: 'ACADEMIC_STRUCTURE',
    applicability: 'MANDATORY', deps: ['branch'], icon: 'CalendarRange',
    description: 'The operating academic year (with terms) that enrolment, attendance, fees and reports hang from.',
  },
  {
    key: 'classes_sections', label: 'Classes & Sections', phase: 'ACADEMIC_STRUCTURE',
    applicability: 'MANDATORY', deps: ['academic_year', 'programs', 'infrastructure'], icon: 'LayoutGrid',
    description: 'Class-section units per program with capacity and a linked classroom room — the home of every enrolled child.',
  },
  {
    key: 'teacher_assignment', label: 'Teacher Assignment', phase: 'ACADEMIC_STRUCTURE',
    applicability: 'MANDATORY', deps: ['classes_sections', 'staff'], icon: 'GraduationCap',
    description: 'Every active class-section needs a primary teacher before daily operations begin.',
  },
  {
    key: 'curriculum', label: 'Curriculum & Learning Areas', phase: 'ACADEMIC_STRUCTURE',
    applicability: 'MANDATORY', deps: ['programs', 'academic_year'], icon: 'BookOpen',
    description: 'Learning areas, skills, milestones and assessment methods per program for observations and report cards.',
  },
  {
    key: 'calendar', label: 'School Calendar', phase: 'ACADEMIC_STRUCTURE',
    applicability: 'MANDATORY', deps: ['academic_year', 'operating_config'], icon: 'CalendarDays',
    description: 'Holidays, vacations, events, parent meetings and assessment periods — attendance understands these.',
  },

  {
    key: 'fees', label: 'Fees & Finance', phase: 'BUSINESS_RULES',
    applicability: 'MANDATORY', deps: ['programs', 'academic_year'], icon: 'IndianRupee',
    description: 'An active fee plan per program — invoices can never be generated without valid fee configuration.',
  },
  {
    key: 'admission_config', label: 'Admission Configuration', phase: 'BUSINESS_RULES',
    applicability: 'MANDATORY', deps: ['programs', 'fees'], icon: 'ClipboardList',
    description: 'Admission window, required documents, registration fee and the approval workflow per program.',
  },
  {
    key: 'student_parent', label: 'Student & Parent Foundation', phase: 'BUSINESS_RULES',
    applicability: 'MANDATORY', deps: ['school_profile'], icon: 'HeartHandshake',
    description: 'Required student/parent data, authorised pickup rules and the consent types you collect (with versions).',
  },

  {
    key: 'daily_operations', label: 'Daily Operations', phase: 'OPERATIONS_READINESS',
    applicability: 'MANDATORY', deps: ['operating_config', 'classes_sections'], icon: 'Sun',
    description: 'What the preschool records each day — attendance, meals, nap, bathroom, mood, activities and pickup.',
  },
  {
    key: 'health_safety', label: 'Health & Safety', phase: 'OPERATIONS_READINESS',
    applicability: 'MANDATORY', deps: ['school_profile'], icon: 'Cross',
    description: 'Health-check rules, allergy & incident categories, emergency contacts and escalation paths.',
  },
  {
    key: 'communication', label: 'Communication', phase: 'OPERATIONS_READINESS',
    applicability: 'MANDATORY', deps: ['student_parent'], icon: 'Megaphone',
    description: 'Channels and notification events — attendance updates, health alerts, fee reminders, announcements.',
  },
  {
    key: 'documents', label: 'Documents & Templates', phase: 'OPERATIONS_READINESS',
    applicability: 'RECOMMENDED', deps: ['school_profile'], icon: 'FileText',
    description: 'Branded templates for admission forms, consents, receipts, certificates and report cards.',
  },
  {
    key: 'data_import', label: 'Data Import (optional)', phase: 'OPERATIONS_READINESS',
    applicability: 'OPTIONAL', deps: ['classes_sections', 'student_parent'], icon: 'Upload',
    description: 'Migrate existing students, parents and staff from spreadsheets — validate, preview, then import.',
  },
]

export const STEP_MAP: Record<string, StepDef> = Object.fromEntries(
  SETUP_STEPS.map((s) => [s.key, s])
)

export const PHASES: { key: StepPhase; label: string; sub: string }[] = [
  { key: 'FOUNDATION', label: 'Foundation', sub: 'Who the school is and who operates it' },
  { key: 'ACADEMIC_STRUCTURE', label: 'Academic Structure', sub: 'Year, programs, classes and curriculum' },
  { key: 'BUSINESS_RULES', label: 'Business Rules', sub: 'Fees, admissions, student & parent policies' },
  { key: 'OPERATIONS_READINESS', label: 'Operations & Readiness', sub: 'Daily ops, health, communication and import' },
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

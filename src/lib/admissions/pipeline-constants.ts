/**
 * PreOne — Canonical Admissions Pipeline Constants & Types
 * Pure TypeScript definitions safe for both Client and Server components.
 *
 * The 5 Canonical Stages align 1-to-1 with the core Admission modules:
 * 1. ENQUIRIES: /app/admissions/enquiries (New enquiries & prospective inquiries)
 * 2. FOLLOW_UPS: /app/admissions/follow-ups (Active follow-ups, calls, tours & tasks)
 * 3. APPLICATIONS: /app/admissions/applications (Submitted, under review & offer issued)
 * 4. CONFIRMED_ADMISSIONS: /app/admissions/admitted (Offer accepted & admission confirmed)
 * 5. CLASSROOM_PLACEMENTS: /app/admissions/classroom-placements (Classroom & section allocated)
 */

export type CanonicalPipelineStageKey =
  | 'ENQUIRIES'
  | 'FOLLOW_UPS'
  | 'APPLICATIONS'
  | 'CONFIRMED_ADMISSIONS'
  | 'CLASSROOM_PLACEMENTS'

export type LegacyPipelineStageKey =
  | 'NEW_LEADS'
  | 'TOUR_BOOKED'
  | 'APPLICATION_SHARED'
  | 'OFFER_PENDING_FEE'
  | 'ENROLLED_PLACED'

export type PipelineStageKey = CanonicalPipelineStageKey | LegacyPipelineStageKey

export interface PipelineStageConfig {
  key: CanonicalPipelineStageKey
  label: string
  description: string
  color: 'rose' | 'amber' | 'violet' | 'emerald' | 'teal'
  accentBorder: string
  badgeVariant: string
  href: string
}

export const PIPELINE_STAGES: Record<CanonicalPipelineStageKey, PipelineStageConfig> = {
  ENQUIRIES: {
    key: 'ENQUIRIES',
    label: 'Enquiries',
    description: 'New enquiries & inquiries received',
    color: 'rose',
    accentBorder: 'border-rose-300 dark:border-rose-700',
    badgeVariant: 'rose',
    href: '/app/admissions/enquiries',
  },
  FOLLOW_UPS: {
    key: 'FOLLOW_UPS',
    label: 'Follow-ups',
    description: 'Open tasks, calls & scheduled visits',
    color: 'amber',
    accentBorder: 'border-amber-300 dark:border-amber-700',
    badgeVariant: 'amber',
    href: '/app/admissions/follow-ups',
  },
  APPLICATIONS: {
    key: 'APPLICATIONS',
    label: 'Applications',
    description: 'Submitted & under review',
    color: 'violet',
    accentBorder: 'border-violet-300 dark:border-violet-700',
    badgeVariant: 'violet',
    href: '/app/admissions/applications',
  },
  CONFIRMED_ADMISSIONS: {
    key: 'CONFIRMED_ADMISSIONS',
    label: 'Confirmed Admissions',
    description: 'Admitted & offer accepted',
    color: 'emerald',
    accentBorder: 'border-emerald-300 dark:border-emerald-700',
    badgeVariant: 'emerald',
    href: '/app/admissions/admitted',
  },
  CLASSROOM_PLACEMENTS: {
    key: 'CLASSROOM_PLACEMENTS',
    label: 'Classroom Placements',
    description: 'Section & classroom allocated',
    color: 'teal',
    accentBorder: 'border-teal-300 dark:border-teal-700',
    badgeVariant: 'teal',
    href: '/app/admissions/classroom-placements',
  },
}

export const ORDERED_PIPELINE_STAGES: CanonicalPipelineStageKey[] = [
  'ENQUIRIES',
  'FOLLOW_UPS',
  'APPLICATIONS',
  'CONFIRMED_ADMISSIONS',
  'CLASSROOM_PLACEMENTS',
]

/**
 * Normalizes any legacy stage key to its corresponding canonical stage.
 */
export function normalizePipelineStageKey(stage: string): CanonicalPipelineStageKey {
  switch (stage) {
    case 'NEW_LEADS':
    case 'new_leads':
    case 'ENQUIRIES':
    case 'enquiries':
      return 'ENQUIRIES'

    case 'TOUR_BOOKED':
    case 'TOURS_BOOKED':
    case 'tour_booked':
    case 'tours_booked':
    case 'FOLLOW_UPS':
    case 'follow-ups':
    case 'followups':
      return 'FOLLOW_UPS'

    case 'APPLICATION_SHARED':
    case 'APPLICATIONS_SHARED':
    case 'application_shared':
    case 'applications_shared':
    case 'APPLICATIONS':
    case 'applications':
      return 'APPLICATIONS'

    case 'OFFER_PENDING_FEE':
    case 'OFFERS_PENDING_FEE':
    case 'offer_pending_fee':
    case 'offers_pending_fee':
    case 'CONFIRMED_ADMISSIONS':
    case 'admitted':
    case 'confirmed-admissions':
      return 'CONFIRMED_ADMISSIONS'

    case 'ENROLLED_PLACED':
    case 'enrolled_placed':
    case 'CLASSROOM_PLACEMENTS':
    case 'classroom-placements':
    case 'placements':
      return 'CLASSROOM_PLACEMENTS'

    default:
      return 'ENQUIRIES'
  }
}

export interface PipelineCardData {
  id: string // Record ID (lead.id or application.id)
  kind: 'LEAD' | 'APPLICATION'
  referenceNumber: string // leadNumber or applicationNumber
  studentName: string
  childDob?: string | null
  parentName: string
  phone: string
  email?: string | null
  stage: CanonicalPipelineStageKey
  domainStatus: string
  branchId?: string | null
  branchName?: string | null
  academicSessionId?: string | null
  academicSessionName?: string | null
  programType?: string | null
  programName?: string | null
  classroomId?: string | null
  classroomName?: string | null
  createdAt: string
  updatedAt: string
  nextFollowUpAt?: string | null
  isOverdue?: boolean
  isDueToday?: boolean
  tourScheduledAt?: string | null
  documentsPendingCount?: number
  offerDetails?: {
    id: string
    offerNumber: string
    status: string
    feeTotalCents?: number
    validUntil?: string
  } | null
  assignedStaffId?: string | null
  notes?: string | null
  hasDuplicateFlag?: boolean
}

export interface PipelineMetrics {
  totalActive: number
  enquiries: number
  followUps: number
  applications: number
  confirmedAdmissions: number
  classroomPlacements: number
  followupsOverdue: number
  followupsDueToday: number
  upcomingTours: number
  // Legacy aliases for backward compatibility
  newLeads?: number
  toursBooked?: number
  applicationsShared?: number
  offersPendingFee?: number
  enrolledPlaced?: number
}

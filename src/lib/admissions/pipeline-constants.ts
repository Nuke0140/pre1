/**
 * PreOne — Canonical Admissions Pipeline Constants & Types
 * Pure TypeScript definitions safe for both Client and Server components.
 */

export type PipelineStageKey =
  | 'NEW_LEADS'
  | 'TOUR_BOOKED'
  | 'APPLICATION_SHARED'
  | 'OFFER_PENDING_FEE'
  | 'ENROLLED_PLACED'

export interface PipelineStageConfig {
  key: PipelineStageKey
  label: string
  description: string
  color: 'sky' | 'amber' | 'violet' | 'indigo' | 'emerald'
  accentBorder: string
  badgeVariant: string
}

export const PIPELINE_STAGES: Record<PipelineStageKey, PipelineStageConfig> = {
  NEW_LEADS: {
    key: 'NEW_LEADS',
    label: 'New Leads',
    description: 'Needs first call',
    color: 'sky',
    accentBorder: 'border-sky-300 dark:border-sky-700',
    badgeVariant: 'sky',
  },
  TOUR_BOOKED: {
    key: 'TOUR_BOOKED',
    label: 'Campus Tour Booked',
    description: 'Scheduled visit',
    color: 'amber',
    accentBorder: 'border-amber-300 dark:border-amber-700',
    badgeVariant: 'amber',
  },
  APPLICATION_SHARED: {
    key: 'APPLICATION_SHARED',
    label: 'Application Shared',
    description: 'Parent reviewing',
    color: 'violet',
    accentBorder: 'border-violet-300 dark:border-violet-700',
    badgeVariant: 'violet',
  },
  OFFER_PENDING_FEE: {
    key: 'OFFER_PENDING_FEE',
    label: 'Offer Sent / Pending Fee',
    description: 'Offer issued; fee action pending',
    color: 'indigo',
    accentBorder: 'border-indigo-300 dark:border-indigo-700',
    badgeVariant: 'indigo',
  },
  ENROLLED_PLACED: {
    key: 'ENROLLED_PLACED',
    label: 'Enrolled & Placed',
    description: 'Enrollment completed',
    color: 'emerald',
    accentBorder: 'border-emerald-300 dark:border-emerald-700',
    badgeVariant: 'emerald',
  },
}

export const ORDERED_PIPELINE_STAGES: PipelineStageKey[] = [
  'NEW_LEADS',
  'TOUR_BOOKED',
  'APPLICATION_SHARED',
  'OFFER_PENDING_FEE',
  'ENROLLED_PLACED',
]

export interface PipelineCardData {
  id: string // Record ID (lead.id or application.id)
  kind: 'LEAD' | 'APPLICATION'
  referenceNumber: string // leadNumber or applicationNumber
  studentName: string
  childDob?: string | null
  parentName: string
  phone: string
  email?: string | null
  stage: PipelineStageKey
  domainStatus: string
  branchId?: string | null
  branchName?: string | null
  academicSessionId?: string | null
  academicSessionName?: string | null
  programType?: string | null
  programName?: string | null
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
  newLeads: number
  toursBooked: number
  applicationsShared: number
  offersPendingFee: number
  enrolledPlaced: number
  followupsOverdue: number
  followupsDueToday: number
  upcomingTours: number
}

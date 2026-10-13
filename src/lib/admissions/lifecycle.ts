import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * PreOne Admissions — Authoritative Lifecycle Stage Definitions
 *
 * Business Rule:
 * Every logical prospect/enquiry has exactly ONE authoritative current lifecycle stage at any time:
 *
 * Stage 1: ENQUIRY
 *   Newly created or publicly submitted enquiry.
 *   Appears in Enquiries ONLY.
 *
 * Stage 2: FOLLOW_UP
 *   Enquiry moved to follow-ups (outreach, campus tour scheduled, nurture).
 *   Appears in Follow-ups ONLY.
 *
 * Stage 3: APPLICATION
 *   Prospect converted into an Admission Application.
 *   Appears in Applications ONLY.
 *
 * Closed / Terminal:
 *   LOST, DUPLICATE — excluded from all active stage lists.
 */

export type AdmissionsStageName = 'ENQUIRY' | 'FOLLOW_UP' | 'APPLICATION' | 'CLOSED'

export const ENQUIRY_STAGE_STATUSES = ['NEW'] as const

export const FOLLOW_UP_STAGE_STATUSES = [
  'CONTACTED',
  'QUALIFIED',
  'NURTURE',
  'APPLICATION_STARTED',
] as const

export const CONVERTED_STAGE_STATUSES = ['CONVERTED'] as const

export const CLOSED_STAGE_STATUSES = ['LOST', 'DUPLICATE'] as const

/**
 * Determines the authoritative lifecycle stage of a Lead record.
 */
export function determineLeadStage(lead: {
  status: string
  convertedApplicationId?: string | null
  applications?: any[]
}): AdmissionsStageName {
  if (
    lead.status === 'CONVERTED' ||
    Boolean(lead.convertedApplicationId) ||
    (Array.isArray(lead.applications) && lead.applications.some((a) => !a.deletedAt))
  ) {
    return 'APPLICATION'
  }

  if (CLOSED_STAGE_STATUSES.includes(lead.status as any)) {
    return 'CLOSED'
  }

  if (ENQUIRY_STAGE_STATUSES.includes(lead.status as any)) {
    return 'ENQUIRY'
  }

  if (FOLLOW_UP_STAGE_STATUSES.includes(lead.status as any)) {
    return 'FOLLOW_UP'
  }

  return 'ENQUIRY'
}

/**
 * Builds Prisma WhereInput for active Stage 1 (Enquiries) records.
 * Excludes any record moved to Follow-ups or converted to Applications.
 */
export function buildEnquiryStageWhere(
  tenantId: string,
  extra?: {
    branchId?: string | null
    branchIds?: string[]
  }
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {
    tenantId,
    deletedAt: null,
    status: 'NEW',
    convertedApplicationId: null,
    applications: { none: { deletedAt: null } },
  }

  if (extra?.branchId) {
    where.branchId = extra.branchId
  } else if (extra?.branchIds && extra.branchIds.length > 0) {
    where.OR = [
      { branchId: { in: extra.branchIds } },
      { branchId: null },
    ]
  }

  return where
}

/**
 * Builds Prisma WhereInput for active Stage 2 (Follow-ups) records.
 * Excludes Stage 1 (NEW) and Stage 3 (CONVERTED / has application).
 */
export function buildFollowUpStageWhere(
  tenantId: string,
  extra?: {
    branchId?: string | null
    branchIds?: string[]
  }
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {
    tenantId,
    deletedAt: null,
    status: { in: ['CONTACTED', 'QUALIFIED', 'NURTURE', 'APPLICATION_STARTED'] },
    convertedApplicationId: null,
    applications: { none: { deletedAt: null } },
  }

  if (extra?.branchId) {
    where.branchId = extra.branchId
  } else if (extra?.branchIds && extra.branchIds.length > 0) {
    where.OR = [
      { branchId: { in: extra.branchIds } },
      { branchId: null },
    ]
  }

  return where
}

/**
 * Builds Prisma WhereInput for Stage 3 (Applications).
 */
export function buildApplicationStageWhere(
  tenantId: string,
  extra?: {
    branchId?: string | null
    branchIds?: string[]
    academicSessionId?: string
  }
): Prisma.AdmissionApplicationWhereInput {
  const where: Prisma.AdmissionApplicationWhereInput = {
    tenantId,
    deletedAt: null,
  }

  if (extra?.branchId) {
    where.branchId = extra.branchId
  } else if (extra?.branchIds && extra.branchIds.length > 0) {
    where.branchId = { in: extra.branchIds }
  }

  if (extra?.academicSessionId) {
    where.academicSessionId = extra.academicSessionId
  }

  return where
}

/**
 * Safe, non-destructive reconciliation for legacy data:
 * - If a lead has a linked active application or convertedApplicationId, marks status as CONVERTED
 *   and resolves open follow-up tasks.
 * - If a lead is LOST, ensures open follow-up tasks are closed.
 */
export async function reconcileAdmissionsLifecycleData(targetTenantId?: string) {
  const tenantFilter = targetTenantId ? { tenantId: targetTenantId } : {}

  // 1. Reconcile leads that have active applications but status was left as APPLICATION_STARTED
  const inconsistentLeads = await db.lead.findMany({
    where: {
      ...tenantFilter,
      deletedAt: null,
      status: { not: 'CONVERTED' },
      OR: [
        { convertedApplicationId: { not: null } },
        { applications: { some: { deletedAt: null } } },
      ],
    },
    include: {
      applications: {
        where: { deletedAt: null },
        take: 1,
      },
    },
  })

  let updatedCount = 0
  for (const lead of inconsistentLeads) {
    const appId = lead.convertedApplicationId || lead.applications[0]?.id
    await db.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedApplicationId: appId || undefined,
        },
      })
      await tx.followUp.updateMany({
        where: {
          tenantId: lead.tenantId,
          sourceId: lead.id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING'] },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: 'System Reconciliation',
          outcome: 'Converted to Application',
        },
      })
    })
    updatedCount++
  }

  return {
    reconciledCount: updatedCount,
  }
}

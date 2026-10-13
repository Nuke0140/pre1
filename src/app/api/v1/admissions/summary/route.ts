import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'
import { FollowUpVisitService } from '@/lib/admissions/followup-visit-service'
import { Prisma } from '@prisma/client'

/**
 * GET /api/v1/admissions/summary
 * Canonical Admissions Lifecycle Metrics & Ribbon Module Counts
 *
 * Query Params:
 * - branchId: string (specific branch ID, '__ALL_BRANCHES__', or omitted)
 * - academicYearId: string (academic session ID, or omitted for current/all)
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const sp = req.nextUrl.searchParams
  const requestedBranchId = sp.get('branchId')
  const requestedSessionId = sp.get('academicYearId') || sp.get('academicSessionId')

  const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
  if (branchScope.mode === 'NO_BRANCH_ACCESS') {
    return Errors.forbidden('No authorized branch access for active user')
  }

  const tenantId = branchScope.tenantId

  // Resolve session if specified or fallback to active session
  let academicSessionId: string | undefined = undefined
  if (requestedSessionId && requestedSessionId !== '__ALL_SESSIONS__') {
    academicSessionId = requestedSessionId
  }

  // Branch filter construction
  const branchFilter: Prisma.StringNullableFilter | string | { in: string[] } =
    branchScope.mode === 'SINGLE_BRANCH'
      ? branchScope.selectedBranchId!
      : { in: branchScope.authorizedBranchIds }

  // 1. Leads / Enquiries Where — Authoritative Stage 1 (Enquiries only, un-converted and not in follow-up)
  const leadWhere: Prisma.LeadWhereInput = {
    tenantId,
    deletedAt: null,
    status: 'NEW',
    convertedApplicationId: null,
    applications: { none: { deletedAt: null } },
  }
  if (branchScope.mode === 'SINGLE_BRANCH') {
    leadWhere.branchId = branchScope.selectedBranchId
  } else {
    leadWhere.OR = [
      { branchId: { in: branchScope.authorizedBranchIds } },
      { branchId: null },
    ]
  }

  // 2. Applications Where
  const appWhere: Prisma.AdmissionApplicationWhereInput = {
    tenantId,
    deletedAt: null,
  }
  if (branchScope.mode === 'SINGLE_BRANCH') {
    appWhere.branchId = branchScope.selectedBranchId
  } else {
    appWhere.branchId = { in: branchScope.authorizedBranchIds }
  }
  if (academicSessionId) {
    appWhere.academicSessionId = academicSessionId
  }

  // 3. Classrooms Where
  const classroomWhere: Prisma.ClassroomWhereInput = {
    tenantId,
    isActive: true,
  }
  if (branchScope.mode === 'SINGLE_BRANCH') {
    classroomWhere.branchId = branchScope.selectedBranchId
  } else {
    classroomWhere.branchId = { in: branchScope.authorizedBranchIds }
  }

  // Execute parallel count aggregations
  const [
    totalActiveEnquiries,
    newEnquiriesCount,
    contactedEnquiriesCount,
    qualifiedEnquiriesCount,
    nurtureEnquiriesCount,
    totalApplications,
    submittedAppsCount,
    underReviewAppsCount,
    approvedAppsCount,
    offerSentAppsCount,
    offerAcceptedAppsCount,
    waitlistedAppsCount,
    enrolledAppsCount,
    totalClassrooms,
    followUpQueues,
  ] = await Promise.all([
    // Enquiries counts (Stage 1 active enquiries)
    db.lead.count({ where: leadWhere }),
    db.lead.count({ where: leadWhere }),
    db.lead.count({ where: { tenantId, deletedAt: null, convertedApplicationId: null, applications: { none: { deletedAt: null } }, status: 'CONTACTED', ...(branchScope.mode === 'SINGLE_BRANCH' ? { branchId: branchScope.selectedBranchId } : { OR: [{ branchId: { in: branchScope.authorizedBranchIds } }, { branchId: null }] }) } }),
    db.lead.count({ where: { tenantId, deletedAt: null, convertedApplicationId: null, applications: { none: { deletedAt: null } }, status: 'QUALIFIED', ...(branchScope.mode === 'SINGLE_BRANCH' ? { branchId: branchScope.selectedBranchId } : { OR: [{ branchId: { in: branchScope.authorizedBranchIds } }, { branchId: null }] }) } }),
    db.lead.count({ where: { tenantId, deletedAt: null, convertedApplicationId: null, applications: { none: { deletedAt: null } }, status: 'NURTURE', ...(branchScope.mode === 'SINGLE_BRANCH' ? { branchId: branchScope.selectedBranchId } : { OR: [{ branchId: { in: branchScope.authorizedBranchIds } }, { branchId: null }] }) } }),

    // Applications counts (Stage 3)
    db.admissionApplication.count({ where: appWhere }),
    db.admissionApplication.count({ where: { ...appWhere, status: 'SUBMITTED' } }),
    db.admissionApplication.count({
      where: {
        ...appWhere,
        status: { in: ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'VERIFIED', 'UNDER_REVIEW', 'COUNSELLING', 'COUNSELLING_SCHEDULED'] },
      },
    }),
    db.admissionApplication.count({ where: { ...appWhere, status: 'APPROVED' } }),
    db.admissionApplication.count({ where: { ...appWhere, status: 'OFFER_SENT' } }),
    db.admissionApplication.count({ where: { ...appWhere, status: 'OFFER_ACCEPTED' } }),
    db.admissionApplication.count({ where: { ...appWhere, status: 'WAITLISTED' } }),
    db.admissionApplication.count({ where: { ...appWhere, status: { in: ['ENROLLED', 'ADMITTED'] } } }),

    // Classrooms count
    db.classroom.count({ where: classroomWhere }),

    // FollowUp queues authoritative counts
    FollowUpVisitService.listWorkspaceQueues(tenantId, {
      branchId: branchScope.mode === 'SINGLE_BRANCH' ? branchScope.selectedBranchId! : undefined,
      branchIds: branchScope.mode === 'ALL_BRANCHES' ? branchScope.authorizedBranchIds : undefined,
    } as any),
  ])

  const totalFollowUps = followUpQueues.counts.allOpen
  const totalAdmitted = enrolledAppsCount

  // Normalized counts for AdmissionsNavigationRibbon
  const ribbonCounts = {
    enquiries: totalActiveEnquiries,
    'follow-ups': totalFollowUps,
    applications: totalApplications,
    admitted: totalAdmitted,
    'classroom-placements': totalClassrooms,
    reports: totalActiveEnquiries + totalFollowUps + totalApplications,
  }

  // Dashboard & Control Center Card Metrics
  const metrics = {
    enquiries: {
      total: totalActiveEnquiries,
      new: newEnquiriesCount,
      contacted: contactedEnquiriesCount,
      qualified: qualifiedEnquiriesCount,
      nurture: nurtureEnquiriesCount,
    },
    followUps: {
      total: totalFollowUps,
      allOpen: followUpQueues.counts.allOpen,
      dueToday: followUpQueues.counts.dueToday,
      overdue: followUpQueues.counts.overdue,
      upcoming: followUpQueues.counts.upcoming,
      completed: followUpQueues.counts.completed,
    },
    applications: {
      total: totalApplications,
      submitted: submittedAppsCount,
      underReview: underReviewAppsCount,
      approved: approvedAppsCount,
      offerSent: offerSentAppsCount,
      offerAccepted: offerAcceptedAppsCount,
      waitlisted: waitlistedAppsCount,
      admitted: enrolledAppsCount,
    },
    classrooms: totalClassrooms,
  }

  return ok(
    {
      counts: ribbonCounts,
      metrics,
    },
    {
      scope: {
        tenantId,
        mode: branchScope.mode,
        selectedBranchId: branchScope.selectedBranchId,
        authorizedBranchIds: branchScope.authorizedBranchIds,
        academicSessionId,
      },
    }
  )
}

export const GET = withApi(_GET)

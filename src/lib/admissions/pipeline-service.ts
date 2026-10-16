/**
 * PreOne — Authoritative Visual Admission Pipeline Service
 *
 * Implements the 5 canonical business-facing pipeline stages:
 * 1. NEW_LEADS: New enquiries needing initial contact
 * 2. TOUR_BOOKED: Scheduled campus visit / school tour
 * 3. APPLICATION_SHARED: Application started / submitted / reviewing
 * 4. OFFER_PENDING_FEE: Offer issued; acceptance or fee pending
 * 5. ENROLLED_PLACED: Fully enrolled student & placed in class
 *
 * Business Safety:
 * - Real persisted records (Lead & AdmissionApplication).
 * - Multi-tenant and branch boundaries strictly enforced.
 * - Enforces business rules: dragging NEVER falsifies enrollment, fee payment, or document verification.
 * - Integrated with PreOne FollowUp subsystem and Audit logging.
 */

import { db } from '@/lib/db'
import { audit } from '@/lib/audit'
import { raiseFollowUp } from '@/lib/followups'
import { FollowUpVisitService } from '@/lib/admissions/followup-visit-service'
import type { ResolvedBranchScope } from '@/lib/admissions/branch-context'
import type { SchoolRole } from '@/lib/auth'

import {
  PIPELINE_STAGES,
  ORDERED_PIPELINE_STAGES,
  type PipelineStageKey,
  type PipelineCardData,
  type PipelineMetrics,
} from './pipeline-constants'
export * from './pipeline-constants'

export interface ScopeContext {
  tenantId: string
  branchId?: string | null
  academicYearId?: string | null
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
}

export class AdmissionsPipelineService {
  /**
   * Determine the pipeline stage for an Enquiry / Lead record.
   */
  static determineLeadPipelineStage(lead: {
    status: string
    convertedApplicationId?: string | null
    applications?: any[]
    schoolVisits?: any[]
    nextFollowUpAt?: Date | null
  }): PipelineStageKey | 'EXCLUDED' {
    // If converted or linked to application, it is handled as an APPLICATION card to avoid duplicate entries
    if (
      lead.status === 'CONVERTED' ||
      Boolean(lead.convertedApplicationId) ||
      (Array.isArray(lead.applications) && lead.applications.some((a) => !a.deletedAt))
    ) {
      return 'EXCLUDED'
    }

    // Terminal / inactive leads
    if (['LOST', 'DUPLICATE'].includes(lead.status)) {
      return 'EXCLUDED'
    }

    // Application started before conversion
    if (lead.status === 'APPLICATION_STARTED') {
      return 'APPLICATION_SHARED'
    }

    // Campus tour booked / scheduled
    const hasScheduledVisit =
      Array.isArray(lead.schoolVisits) &&
      lead.schoolVisits.some((v) => ['OPEN', 'IN_PROGRESS', 'WAITING'].includes(v.status))

    if (hasScheduledVisit || lead.status === 'QUALIFIED') {
      return 'TOUR_BOOKED'
    }

    // Default early leads
    return 'NEW_LEADS'
  }

  /**
   * Determine the pipeline stage for an AdmissionApplication record.
   */
  static determineApplicationPipelineStage(app: {
    status: string
    studentId?: string | null
    offers?: any[]
  }): PipelineStageKey | 'EXCLUDED' {
    if (['REJECTED', 'WITHDRAWN'].includes(app.status)) {
      return 'EXCLUDED'
    }

    if (app.status === 'ENROLLED' || Boolean(app.studentId)) {
      return 'ENROLLED_PLACED'
    }

    const hasActiveOffer =
      Array.isArray(app.offers) &&
      app.offers.some((o) => ['ISSUED', 'ACCEPTED'].includes(o.status))

    if (app.status === 'OFFER_SENT' || app.status === 'OFFER_ACCEPTED' || hasActiveOffer) {
      return 'OFFER_PENDING_FEE'
    }

    return 'APPLICATION_SHARED'
  }

  /**
   * Fetch all pipeline data grouped into 5 stages with full metrics and filtering.
   */
  static async getPipelineData(
    tenantId: string,
    branchScope: ResolvedBranchScope,
    filters?: {
      academicSessionId?: string | null
      searchQuery?: string | null
      programFilter?: string | null
      stageFilter?: string | null
      followUpFilter?: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'UNSCHEDULED' | null
      assignedStaffId?: string | null
      includeArchived?: boolean
    }
  ) {
    const branchFilter =
      branchScope.mode === 'SINGLE_BRANCH'
        ? branchScope.selectedBranchId
        : branchScope.authorizedBranchIds.length > 0
        ? { in: branchScope.authorizedBranchIds }
        : undefined

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // 1. Fetch active Leads (Enquiries)
    const leadWhere: any = {
      tenantId,
      deletedAt: null,
      convertedApplicationId: null,
      applications: { none: { deletedAt: null } },
      status: filters?.includeArchived ? undefined : { notIn: ['LOST', 'DUPLICATE', 'CONVERTED'] },
    }

    if (branchScope.mode === 'SINGLE_BRANCH') {
      leadWhere.branchId = branchScope.selectedBranchId
    } else if (branchScope.authorizedBranchIds.length > 0) {
      leadWhere.OR = [
        { branchId: { in: branchScope.authorizedBranchIds } },
        { branchId: null },
      ]
    }

    if (filters?.programFilter) {
      leadWhere.interestedProgram = filters.programFilter
    }

    if (filters?.assignedStaffId) {
      leadWhere.assignedToId = filters.assignedStaffId
    }

    const leads = await db.lead.findMany({
      where: leadWhere,
      include: {
        applications: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    })

    // Fetch school visits follow-ups for leads
    const leadIds = leads.map((l) => l.id)
    const schoolVisits =
      leadIds.length > 0
        ? await db.followUp.findMany({
            where: {
              tenantId,
              sourceType: 'SchoolVisit',
              sourceId: { in: leadIds },
            },
            select: {
              id: true,
              sourceId: true,
              status: true,
              dueAt: true,
              detail: true,
            },
          })
        : []

    const visitsByLead = new Map<string, any[]>()
    for (const v of schoolVisits) {
      if (!v.sourceId) continue
      const list = visitsByLead.get(v.sourceId) || []
      list.push(v)
      visitsByLead.set(v.sourceId, list)
    }

    // 2. Fetch active Applications
    const appWhere: any = {
      tenantId,
      deletedAt: null,
      status: filters?.includeArchived ? undefined : { notIn: ['REJECTED', 'WITHDRAWN'] },
    }

    if (branchScope.mode === 'SINGLE_BRANCH') {
      appWhere.branchId = branchScope.selectedBranchId
    } else if (branchScope.authorizedBranchIds.length > 0) {
      appWhere.branchId = { in: branchScope.authorizedBranchIds }
    }

    if (filters?.academicSessionId && filters.academicSessionId !== '__ALL_SESSIONS__') {
      appWhere.academicSessionId = filters.academicSessionId
    }

    if (filters?.programFilter) {
      appWhere.programType = filters.programFilter
    }

    const applications = await db.admissionApplication.findMany({
      where: appWhere,
      include: {
        academicSession: { select: { id: true, name: true } },
        program: { select: { id: true, name: true, code: true } },
        documents: {
          select: { id: true, status: true, verified: true },
        },
        offers: {
          select: {
            id: true,
            offerNumber: true,
            status: true,
            feeTotalCents: true,
            validUntil: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        lead: {
          select: { id: true, leadNumber: true, nextFollowUpAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 250,
    })

    // Fetch branches for name resolution
    const branches = await db.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
    })
    const branchNameMap = new Map<string, string>(branches.map((b) => [b.id, b.name]))

    // 3. Assemble and map into canonical PipelineCardData
    const allCards: PipelineCardData[] = []

    for (const l of leads) {
      const visits = visitsByLead.get(l.id) || []
      const stage = this.determineLeadPipelineStage({
        status: l.status,
        convertedApplicationId: l.convertedApplicationId,
        applications: l.applications,
        schoolVisits: visits,
        nextFollowUpAt: l.nextFollowUpAt,
      })

      if (stage === 'EXCLUDED') continue

      const nextFollowUp = l.nextFollowUpAt ? new Date(l.nextFollowUpAt) : null
      const isOverdue = nextFollowUp ? nextFollowUp < now : false
      const isDueToday = nextFollowUp ? nextFollowUp >= startOfToday && nextFollowUp <= endOfToday : false

      const activeVisit = visits.find((v) => ['OPEN', 'IN_PROGRESS', 'WAITING'].includes(v.status))

      allCards.push({
        id: l.id,
        kind: 'LEAD',
        referenceNumber: l.leadNumber,
        studentName: l.childName || 'Unnamed Child',
        childDob: l.childDob ? l.childDob.toISOString() : null,
        parentName: l.parentName,
        phone: l.phone,
        email: l.email,
        stage,
        domainStatus: l.status,
        branchId: l.branchId,
        branchName: l.branchId ? branchNameMap.get(l.branchId) || null : 'Main Campus',
        academicSessionId: null,
        academicSessionName: null,
        programType: l.interestedProgram,
        programName: l.interestedProgram || null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.toISOString() : null,
        isOverdue,
        isDueToday,
        tourScheduledAt: activeVisit?.dueAt ? activeVisit.dueAt.toISOString() : null,
        documentsPendingCount: 0,
        offerDetails: null,
        assignedStaffId: l.assignedToId,
        notes: l.notes,
        hasDuplicateFlag: false,
      })
    }

    for (const a of applications) {
      const stage = this.determineApplicationPipelineStage({
        status: a.status,
        studentId: a.studentId,
        offers: a.offers,
      })

      if (stage === 'EXCLUDED') continue

      const latestOffer = a.offers[0] || null
      const unverifiedDocs = a.documents.filter((d) => !d.verified && d.status !== 'VERIFIED')

      // Application follow-up may inherit from lead or default to submitted time
      const nextFollowUp = a.lead?.nextFollowUpAt ? new Date(a.lead.nextFollowUpAt) : null
      const isOverdue = nextFollowUp ? nextFollowUp < now : false
      const isDueToday = nextFollowUp ? nextFollowUp >= startOfToday && nextFollowUp <= endOfToday : false

      allCards.push({
        id: a.id,
        kind: 'APPLICATION',
        referenceNumber: a.applicationNumber,
        studentName: `${a.childFirstName} ${a.childLastName || ''}`.trim(),
        childDob: a.childDob.toISOString(),
        parentName: a.parentName,
        phone: a.parentPhone,
        email: a.parentEmail,
        stage,
        domainStatus: a.status,
        branchId: a.branchId,
        branchName: branchNameMap.get(a.branchId) || null,
        academicSessionId: a.academicSessionId,
        academicSessionName: a.academicSession?.name || null,
        programType: a.programType,
        programName: a.program?.name || a.programType,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        nextFollowUpAt: a.lead?.nextFollowUpAt ? a.lead.nextFollowUpAt.toISOString() : null,
        isOverdue,
        isDueToday,
        tourScheduledAt: null,
        documentsPendingCount: unverifiedDocs.length,
        offerDetails: latestOffer
          ? {
              id: latestOffer.id,
              offerNumber: latestOffer.offerNumber,
              status: latestOffer.status,
              feeTotalCents: latestOffer.feeTotalCents,
              validUntil: latestOffer.validUntil.toISOString(),
            }
          : null,
        assignedStaffId: null,
        notes: a.notes,
        hasDuplicateFlag: a.isDuplicateConfirmed,
      })
    }

    // 4. Compute Metrics before search filtering for authoritative pipeline health
    const metrics: PipelineMetrics = {
      totalActive: allCards.length,
      newLeads: allCards.filter((c) => c.stage === 'NEW_LEADS').length,
      toursBooked: allCards.filter((c) => c.stage === 'TOUR_BOOKED').length,
      applicationsShared: allCards.filter((c) => c.stage === 'APPLICATION_SHARED').length,
      offersPendingFee: allCards.filter((c) => c.stage === 'OFFER_PENDING_FEE').length,
      enrolledPlaced: allCards.filter((c) => c.stage === 'ENROLLED_PLACED').length,
      followupsOverdue: allCards.filter((c) => c.isOverdue).length,
      followupsDueToday: allCards.filter((c) => c.isDueToday).length,
      upcomingTours: allCards.filter((c) => c.tourScheduledAt && new Date(c.tourScheduledAt) >= now).length,
    }

    // 5. Apply in-memory search and secondary filters
    let filteredCards = allCards

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim()
      filteredCards = filteredCards.filter(
        (c) =>
          c.studentName.toLowerCase().includes(q) ||
          c.parentName.toLowerCase().includes(q) ||
          c.referenceNumber.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    }

    if (filters?.stageFilter && filters.stageFilter !== 'ALL') {
      filteredCards = filteredCards.filter((c) => c.stage === filters.stageFilter)
    }

    if (filters?.followUpFilter && filters.followUpFilter !== 'ALL') {
      if (filters.followUpFilter === 'OVERDUE') {
        filteredCards = filteredCards.filter((c) => c.isOverdue)
      } else if (filters.followUpFilter === 'TODAY') {
        filteredCards = filteredCards.filter((c) => c.isDueToday)
      } else if (filters.followUpFilter === 'UPCOMING') {
        filteredCards = filteredCards.filter(
          (c) => c.nextFollowUpAt && new Date(c.nextFollowUpAt) > endOfToday
        )
      } else if (filters.followUpFilter === 'UNSCHEDULED') {
        filteredCards = filteredCards.filter((c) => !c.nextFollowUpAt)
      }
    }

    // 6. Group cards into the 5 stages
    const stages: Record<PipelineStageKey, PipelineCardData[]> = {
      NEW_LEADS: [],
      TOUR_BOOKED: [],
      APPLICATION_SHARED: [],
      OFFER_PENDING_FEE: [],
      ENROLLED_PLACED: [],
    }

    for (const card of filteredCards) {
      stages[card.stage].push(card)
    }

    return {
      stages,
      metrics,
      totalCount: filteredCards.length,
      stageConfigs: PIPELINE_STAGES,
    }
  }

  /**
   * Execute an authorized stage transition with strict business validation.
   */
  static async transitionStage(
    ctx: ScopeContext,
    params: {
      cardId: string
      targetStage: PipelineStageKey
      reason?: string
      followUp?: {
        dueAt?: string | Date
        note: string
        responsibleRole?: SchoolRole
        tourFocus?: string
        visitorCount?: number
      }
    }
  ) {
    if (!ctx.tenantId) throw new Error('Tenant context required')
    const { cardId, targetStage, reason, followUp } = params

    // 1. Locate either Lead or AdmissionApplication in this tenant
    const lead = await db.lead.findFirst({
      where: { id: cardId, tenantId: ctx.tenantId, deletedAt: null },
      include: {
        applications: { where: { deletedAt: null } },
      },
    })

    const app = !lead
      ? await db.admissionApplication.findFirst({
          where: { id: cardId, tenantId: ctx.tenantId, deletedAt: null },
          include: {
            offers: { where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' } },
            documents: true,
          },
        })
      : null

    if (!lead && !app) {
      throw new Error(`Record with ID ${cardId} not found in this tenant`)
    }

    // Branch authorization check
    const recordBranchId = lead ? lead.branchId : app!.branchId
    if (ctx.branchId && recordBranchId && ctx.branchId !== recordBranchId) {
      throw new Error('Unauthorized branch access: Record belongs to another branch')
    }

    // 2. Strict Business Rules for Target Stages:
    // RULE A: Direct drag to ENROLLED_PLACED is NEVER allowed to falsify enrollment.
    if (targetStage === 'ENROLLED_PLACED') {
      if (app && app.status === 'ENROLLED') {
        // Already enrolled
        return { success: true, message: 'Prospect is already fully enrolled.' }
      }
      return {
        success: false,
        code: 'ENROLLMENT_PREREQUISITE_REQUIRED',
        requireAction: 'COMPLETE_ENROLLMENT',
        message:
          'Direct card movement to "Enrolled & Placed" is not permitted. School policy requires verifying required documents, issuing/accepting the offer, and confirming classroom placement through the Admission Review workspace.',
      }
    }

    // RULE B: Target Stage OFFER_PENDING_FEE requires an actual admission application and offer.
    if (targetStage === 'OFFER_PENDING_FEE') {
      if (lead) {
        return {
          success: false,
          code: 'APPLICATION_REQUIRED_FOR_OFFER',
          requireAction: 'CREATE_APPLICATION',
          message:
            'Cannot issue an offer directly to an enquiry. An admission application must be submitted and reviewed first.',
        }
      }

      if (app) {
        const hasExistingOffer = app.offers.length > 0
        if (!hasExistingOffer) {
          return {
            success: false,
            code: 'OFFER_GENERATION_REQUIRED',
            requireAction: 'GENERATE_OFFER',
            message:
              'Cannot move to "Offer Sent / Pending Fee" without an offer. Please generate an official admission offer first.',
          }
        }

        // If offer is draft, issue it and advance application status to OFFER_SENT
        const draftOffer = app.offers.find((o) => o.status === 'DRAFT')
        if (draftOffer) {
          await db.$transaction([
            db.admissionOffer.update({
              where: { id: draftOffer.id },
              data: { status: 'ISSUED', issuedAt: new Date() },
            }),
            db.admissionApplication.update({
              where: { id: app.id },
              data: { status: 'OFFER_SENT' },
            }),
          ])
        } else if (app.status !== 'OFFER_SENT' && app.status !== 'OFFER_ACCEPTED') {
          await db.admissionApplication.update({
            where: { id: app.id },
            data: { status: 'OFFER_SENT' },
          })
        }
      }
    }

    // RULE C: Handling Transitions for LEAD records
    if (lead) {
      const oldStatus = lead.status

      if (targetStage === 'TOUR_BOOKED') {
        const tourDate = followUp?.dueAt ? new Date(followUp.dueAt) : new Date(Date.now() + 48 * 60 * 60 * 1000)
        await FollowUpVisitService.scheduleVisit(ctx, lead.id, {
          scheduledAt: tourDate,
          tourFocus: followUp?.tourFocus || 'Campus Tour & Facilities',
          visitorCount: followUp?.visitorCount || 2,
          notes: followUp?.note || reason || 'Tour booked via Visual Admission Pipeline',
        })
      } else if (targetStage === 'APPLICATION_SHARED') {
        await db.lead.update({
          where: { id: lead.id },
          data: { status: 'APPLICATION_STARTED' },
        })
      } else if (targetStage === 'NEW_LEADS') {
        // Moving back to NEW_LEADS: cancel or resolve any open tour follow-up
        await db.lead.update({
          where: { id: lead.id },
          data: { status: 'NEW' },
        })
        await db.followUp.updateMany({
          where: {
            tenantId: ctx.tenantId,
            sourceType: 'SchoolVisit',
            sourceId: lead.id,
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING'] },
          },
          data: {
            status: 'CLOSED',
            actionTaken: reason || 'Reverted to New Leads',
            resolvedAt: new Date(),
          },
        })
      }

      // Schedule optional follow-up reminder if provided
      if (followUp && followUp.note && targetStage !== 'TOUR_BOOKED') {
        await FollowUpVisitService.addFollowUp(ctx, lead.id, {
          type: 'Pipeline Follow-up',
          note: followUp.note,
          dueAt: followUp.dueAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          responsibleRole: followUp.responsibleRole || 'PRINCIPAL',
        })
      }

      // Audit transition
      await audit({
        tenantId: ctx.tenantId,
        branchId: lead.branchId || undefined,
        actorId: ctx.actorId || undefined,
        actorRole: ctx.actorRole || 'ADMIN',
        action: 'PIPELINE_STAGE_TRANSITION',
        entity: 'Lead',
        entityId: lead.id,
        summary: `Pipeline move for ${lead.leadNumber} (${lead.childName || lead.parentName}) to ${targetStage}`,
        oldValues: { status: oldStatus },
        newValues: { status: targetStage },
      })

      return {
        success: true,
        message: `Successfully moved ${lead.leadNumber} to ${PIPELINE_STAGES[targetStage].label}.`,
      }
    }

    // RULE D: Handling Transitions for APPLICATION records
    if (app) {
      const oldStatus = app.status

      if (targetStage === 'APPLICATION_SHARED') {
        // Reverting from offer or review stage to application shared
        if (app.status === 'OFFER_SENT') {
          await db.admissionApplication.update({
            where: { id: app.id },
            data: { status: 'UNDER_REVIEW' },
          })
        }
      }

      // Schedule follow-up reminder if provided
      if (followUp && followUp.note) {
        await raiseFollowUp({
          tenantId: ctx.tenantId,
          branchId: app.branchId,
          academicSessionId: app.academicSessionId,
          domain: 'ADMISSION',
          severity: 'INFO',
          title: `Application Follow-up: ${app.applicationNumber}`,
          detail: followUp.note,
          sourceType: 'AdmissionApplication',
          sourceId: app.id,
          dueAt: followUp.dueAt ? new Date(followUp.dueAt) : new Date(Date.now() + 48 * 60 * 60 * 1000),
          responsibleRole: followUp.responsibleRole || 'PRINCIPAL',
          actorId: ctx.actorId,
          actorName: ctx.actorName,
        })
      }

      // Audit transition
      await audit({
        tenantId: ctx.tenantId,
        branchId: app.branchId,
        academicSessionId: app.academicSessionId,
        actorId: ctx.actorId || undefined,
        actorRole: ctx.actorRole || 'ADMIN',
        action: 'PIPELINE_STAGE_TRANSITION',
        entity: 'AdmissionApplication',
        entityId: app.id,
        summary: `Pipeline move for ${app.applicationNumber} (${app.childFirstName}) to ${targetStage}`,
        oldValues: { status: oldStatus },
        newValues: { status: targetStage },
      })

      return {
        success: true,
        message: `Successfully moved ${app.applicationNumber} to ${PIPELINE_STAGES[targetStage].label}.`,
      }
    }

    return { success: true }
  }
}

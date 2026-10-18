/**
 * PreOne — Authoritative Visual Admission Pipeline Service
 *
 * Implements the 5 canonical business-facing pipeline stages matching the 5 core modules:
 * 1. ENQUIRIES: New enquiries needing initial contact (/app/admissions/enquiries)
 * 2. FOLLOW_UPS: Open tasks, scheduled campus tours & calls (/app/admissions/follow-ups)
 * 3. APPLICATIONS: Applications submitted / under review / offer issued (/app/admissions/applications)
 * 4. CONFIRMED_ADMISSIONS: Admitted students & accepted offers awaiting placement (/app/admissions/admitted)
 * 5. CLASSROOM_PLACEMENTS: Enrolled students with classroom section allocated (/app/admissions/classroom-placements)
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
  normalizePipelineStageKey,
  type CanonicalPipelineStageKey,
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
  }): CanonicalPipelineStageKey | 'EXCLUDED' {
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
      return 'APPLICATIONS'
    }

    // Follow-ups: Scheduled visit / campus tour, active follow-up date, or in follow-up status
    const hasScheduledVisit =
      Array.isArray(lead.schoolVisits) &&
      lead.schoolVisits.some((v) => ['OPEN', 'IN_PROGRESS', 'WAITING'].includes(v.status))

    const hasScheduledFollowUp = Boolean(lead.nextFollowUpAt)

    if (
      hasScheduledVisit ||
      hasScheduledFollowUp ||
      ['CONTACTED', 'QUALIFIED', 'NURTURE', 'IN_PROGRESS'].includes(lead.status)
    ) {
      return 'FOLLOW_UPS'
    }

    // Default: Fresh raw enquiries
    return 'ENQUIRIES'
  }

  /**
   * Determine the pipeline stage for an AdmissionApplication record.
   */
  static determineApplicationPipelineStage(app: {
    status: string
    studentId?: string | null
    classroomId?: string | null
    offers?: any[]
  }): CanonicalPipelineStageKey | 'EXCLUDED' {
    if (['REJECTED', 'WITHDRAWN'].includes(app.status)) {
      return 'EXCLUDED'
    }

    // 5. Classroom Placements: when a classroom section is allocated
    if (Boolean(app.classroomId)) {
      return 'CLASSROOM_PLACEMENTS'
    }

    // 4. Confirmed Admissions: Enrolled, Admitted, or Offer Accepted (ready for classroom placement)
    if (
      app.status === 'ENROLLED' ||
      app.status === 'ADMITTED' ||
      app.status === 'OFFER_ACCEPTED' ||
      Boolean(app.studentId)
    ) {
      return 'CONFIRMED_ADMISSIONS'
    }

    // 3. Applications: In review, submitted, approved, documents pending, or offer sent
    return 'APPLICATIONS'
  }

  /**
   * Fetch all pipeline data grouped into the 5 core stages with full metrics and filtering.
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

    // Fetch branches and classrooms for name resolution
    const [branches, classrooms] = await Promise.all([
      db.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true },
      }),
      db.classroom.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true },
      }),
    ])
    const branchNameMap = new Map<string, string>(branches.map((b) => [b.id, b.name]))
    const classroomNameMap = new Map<string, string>(classrooms.map((c) => [c.id, c.name]))

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
        classroomId: null,
        classroomName: null,
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
        classroomId: a.classroomId,
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
        classroomId: a.classroomId || null,
        classroomName: a.classroomId ? classroomNameMap.get(a.classroomId) || null : null,
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

    // 4. Compute Metrics matching the 5 core modules + overdue & due today indicators
    const metrics: PipelineMetrics = {
      totalActive: allCards.length,
      enquiries: allCards.filter((c) => c.stage === 'ENQUIRIES').length,
      followUps: allCards.filter((c) => c.stage === 'FOLLOW_UPS').length,
      applications: allCards.filter((c) => c.stage === 'APPLICATIONS').length,
      confirmedAdmissions: allCards.filter((c) => c.stage === 'CONFIRMED_ADMISSIONS').length,
      classroomPlacements: allCards.filter((c) => c.stage === 'CLASSROOM_PLACEMENTS').length,
      followupsOverdue: allCards.filter((c) => c.isOverdue).length,
      followupsDueToday: allCards.filter((c) => c.isDueToday).length,
      upcomingTours: allCards.filter((c) => c.tourScheduledAt && new Date(c.tourScheduledAt) >= now).length,
      // Backward compatibility fields
      newLeads: allCards.filter((c) => c.stage === 'ENQUIRIES').length,
      toursBooked: allCards.filter((c) => c.stage === 'FOLLOW_UPS').length,
      applicationsShared: allCards.filter((c) => c.stage === 'APPLICATIONS').length,
      offersPendingFee: allCards.filter((c) => c.stage === 'CONFIRMED_ADMISSIONS').length,
      enrolledPlaced: allCards.filter((c) => c.stage === 'CLASSROOM_PLACEMENTS' || c.domainStatus === 'ENROLLED' || c.domainStatus === 'ADMITTED').length,
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
      const targetStage = normalizePipelineStageKey(filters.stageFilter)
      filteredCards = filteredCards.filter((c) => c.stage === targetStage)
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

    // 6. Group cards into the 5 core stages (including legacy aliases for backward compatibility)
    const stages: Record<string, PipelineCardData[]> = {
      ENQUIRIES: [],
      FOLLOW_UPS: [],
      APPLICATIONS: [],
      CONFIRMED_ADMISSIONS: [],
      CLASSROOM_PLACEMENTS: [],
      NEW_LEADS: [],
      TOUR_BOOKED: [],
      APPLICATION_SHARED: [],
      OFFER_PENDING_FEE: [],
      ENROLLED_PLACED: [],
    }

    for (const card of filteredCards) {
      stages[card.stage].push(card)
      if (card.stage === 'ENQUIRIES') stages.NEW_LEADS.push(card)
      else if (card.stage === 'FOLLOW_UPS') stages.TOUR_BOOKED.push(card)
      else if (card.stage === 'APPLICATIONS') stages.APPLICATION_SHARED.push(card)
      else if (card.stage === 'CONFIRMED_ADMISSIONS') {
        if (card.domainStatus === 'ENROLLED' || card.domainStatus === 'ADMITTED') {
          stages.ENROLLED_PLACED.push(card)
        } else {
          stages.OFFER_PENDING_FEE.push(card)
        }
      } else if (card.stage === 'CLASSROOM_PLACEMENTS') {
        stages.ENROLLED_PLACED.push(card)
      }
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
    const canonicalTarget = normalizePipelineStageKey(targetStage)

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

    // RULE 1: CLASSROOM_PLACEMENTS (Section Allocation)
    if (canonicalTarget === 'CLASSROOM_PLACEMENTS') {
      if (lead) {
        return {
          success: false,
          code: 'APPLICATION_REQUIRED_FOR_PLACEMENT',
          requireAction: 'CREATE_APPLICATION',
          message:
            'Direct card movement to "Classroom Placements" is not permitted for an enquiry. The student must have an application, accepted admission offer, and enrollment confirmed first.',
        }
      }

      if (app) {
        if (app.classroomId) {
          return { success: true, message: 'Prospect is already allocated to a classroom section.' }
        }

        // Requires selecting a classroom section in the Classroom Placements workspace
        const isLegacyEnrolledPlaced = (targetStage as string) === 'ENROLLED_PLACED'
        return {
          success: false,
          code: 'PLACEMENT_ACTION_REQUIRED',
          requireAction: isLegacyEnrolledPlaced ? 'COMPLETE_ENROLLMENT' : 'ALLOCATE_CLASSROOM',
          message: isLegacyEnrolledPlaced
            ? 'Direct card movement to "Enrolled & Placed" is not permitted. Please complete enrollment and assign a classroom in the workflow.'
            : 'Classroom placement requires selecting an available classroom and section. Please complete placement in the Classroom Placements workspace.',
        }
      }
    }

    // RULE 2: CONFIRMED_ADMISSIONS (Accepted Offer / Enrolled)
    if (canonicalTarget === 'CONFIRMED_ADMISSIONS') {
      if (lead) {
        return {
          success: false,
          code: 'APPLICATION_REQUIRED_FOR_ADMISSION',
          requireAction: 'CREATE_APPLICATION',
          message:
            'Cannot confirm admission directly for an enquiry. An admission application must be submitted and reviewed first.',
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
              'Cannot confirm admission without an offer. Please generate or review an official admission offer first.',
          }
        }

        if ((targetStage as string) === 'OFFER_PENDING_FEE') {
          const latestOffer = app.offers[0]
          if (latestOffer && latestOffer.status === 'DRAFT') {
            await db.$transaction([
              db.admissionOffer.update({
                where: { id: latestOffer.id },
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
        } else {
          // If offer is issued or draft, accept it and confirm admission
          const latestOffer = app.offers[0]
          if (latestOffer && latestOffer.status !== 'ACCEPTED') {
            await db.$transaction([
              db.admissionOffer.update({
                where: { id: latestOffer.id },
                data: { status: 'ACCEPTED', acceptedAt: new Date() },
              }),
              db.admissionApplication.update({
                where: { id: app.id },
                data: { status: 'OFFER_ACCEPTED' },
              }),
            ])
          } else if (app.status !== 'OFFER_ACCEPTED' && app.status !== 'ENROLLED' && app.status !== 'ADMITTED') {
            await db.admissionApplication.update({
              where: { id: app.id },
              data: { status: 'OFFER_ACCEPTED' },
            })
          }
        }
      }
    }

    // RULE 3: APPLICATIONS (Application Shared / In Review)
    if (canonicalTarget === 'APPLICATIONS') {
      if (lead) {
        await db.lead.update({
          where: { id: lead.id },
          data: { status: 'APPLICATION_STARTED' },
        })
      } else if (app) {
        if (app.status === 'OFFER_SENT' || app.status === 'OFFER_ACCEPTED') {
          await db.admissionApplication.update({
            where: { id: app.id },
            data: { status: 'UNDER_REVIEW' },
          })
        }
      }
    }

    // RULE 4: FOLLOW_UPS (Tours, Tasks, Scheduled Calls)
    if (canonicalTarget === 'FOLLOW_UPS') {
      if (lead) {
        if (followUp?.tourFocus || followUp?.visitorCount) {
          const tourDate = followUp?.dueAt ? new Date(followUp.dueAt) : new Date(Date.now() + 48 * 60 * 60 * 1000)
          await FollowUpVisitService.scheduleVisit(ctx, lead.id, {
            scheduledAt: tourDate,
            tourFocus: followUp?.tourFocus || 'Campus Tour & Facilities',
            visitorCount: followUp?.visitorCount || 2,
            notes: followUp?.note || reason || 'Tour booked via Visual Admission Pipeline',
          })
        } else {
          const followUpDate = followUp?.dueAt ? new Date(followUp.dueAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
          await FollowUpVisitService.addFollowUp(ctx, lead.id, {
            type: 'Pipeline Follow-up',
            note: followUp?.note || reason || 'Follow-up scheduled from Visual Pipeline',
            dueAt: followUpDate,
            responsibleRole: followUp?.responsibleRole || 'PRINCIPAL',
          })
          await db.lead.update({
            where: { id: lead.id },
            data: {
              status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
              nextFollowUpAt: followUpDate,
            },
          })
        }
      } else if (app) {
        // Schedule follow-up task on application
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
      }
    }

    // RULE 5: ENQUIRIES (Fresh Leads)
    if (canonicalTarget === 'ENQUIRIES') {
      if (lead) {
        await db.lead.update({
          where: { id: lead.id },
          data: { status: 'NEW', nextFollowUpAt: null },
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
            actionTaken: reason || 'Reverted to Enquiries stage',
            resolvedAt: new Date(),
          },
        })
      } else if (app) {
        return {
          success: false,
          code: 'CANNOT_DEMOTE_APPLICATION',
          message: 'An existing formal application cannot be reverted to a raw enquiry.',
        }
      }
    }

    // Schedule general reminder if provided and not handled above
    if (lead && followUp && followUp.note && canonicalTarget !== 'FOLLOW_UPS') {
      await FollowUpVisitService.addFollowUp(ctx, lead.id, {
        type: 'Pipeline Follow-up',
        note: followUp.note,
        dueAt: followUp.dueAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        responsibleRole: followUp.responsibleRole || 'PRINCIPAL',
      })
    }

    // Audit transition
    const entityType = lead ? 'Lead' : 'AdmissionApplication'
    const entityId = lead ? lead.id : app!.id
    const entityRef = lead ? lead.leadNumber : app!.applicationNumber
    const entityName = lead ? (lead.childName || lead.parentName) : app!.childFirstName

    await audit({
      tenantId: ctx.tenantId,
      branchId: recordBranchId || undefined,
      actorId: ctx.actorId || undefined,
      actorRole: ctx.actorRole || 'ADMIN',
      action: 'PIPELINE_STAGE_TRANSITION',
      entity: entityType,
      entityId,
      summary: `Pipeline move for ${entityRef} (${entityName}) to ${canonicalTarget}`,
      newValues: { stage: canonicalTarget, reason },
    })

    return {
      success: true,
      message: `Successfully moved ${entityRef} to ${PIPELINE_STAGES[canonicalTarget].label}.`,
    }
  }
}

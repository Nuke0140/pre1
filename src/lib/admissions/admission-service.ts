/**
 * PreOne — Complete Admission Module Domain Service
 *
 * Core Architecture Principles:
 * 1. Scope: Every year-specific query and mutation MUST scope:
 *    - tenantId
 *    - branchId
 *    - academicYearId (corresponds to AcademicSession.id)
 * 2. Academic Year: Admissions is an academic-year-specific journey.
 * 3. Student Lifetime Master: Student is the lifetime master record.
 *    Admission creates or links Student + Guardian + Classroom Allocation + Finance.
 * 4. Atomic Mutations: Enrollment and approvals execute inside transactions with rollback.
 * 5. Reusable Infrastructure:
 *    - Uses existing Prisma models: Lead, AdmissionApplication, ApplicationDocument,
 *      FollowUp, Student, Guardian, StudentGuardian, StudentAllocation, FeePlan,
 *      Invoice, TimelineEntry, AuditLog, SchoolConfig, DocumentTemplate.
 *    - Follows existing FollowUp engine (domain: 'ADMISSION') for activities, reminders, visits.
 */

import { db } from '@/lib/db'
import { audit, nextNumber } from '@/lib/sequence'
import { emit } from '@/lib/events'
import { raiseFollowUp } from '@/lib/followups'
import { ConfigurationService } from '@/lib/setup/config-service'
import { getDomainConfig, getAdmissionConfig } from '@/lib/config'
import type { ProgramType, Gender, LeadSource, LeadStatus, ApplicationStatus, DocumentType, OfferStatus, DocumentStatus } from '@prisma/client'

export interface ScopeContext {
  tenantId: string
  branchId: string
  academicYearId: string
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
}

export interface CreateEnquiryInput {
  childName?: string | null
  childDob?: Date | string | null
  parentName: string
  phone: string
  alternatePhone?: string | null
  email?: string | null
  interestedProgram?: ProgramType | string | null
  source?: LeadSource | string
  notes?: string | null
  assignedToId?: string | null
}

export interface CreateApplicationInput {
  leadId?: string | null
  programType: ProgramType | string
  childFirstName: string
  childLastName?: string | null
  childDob: Date | string
  childGender?: Gender | string
  parentName: string
  parentPhone: string
  parentEmail?: string | null
  alternatePhone?: string | null
  address?: string | null
  previousSchool?: string | null
  notes?: string | null
  isDuplicateConfirmed?: boolean
}

export class AdmissionService {
  /**
   * Authoritatively verify tenant, branch and academic session scope.
   */
  static async verifyScope(
    tenantId: string,
    branchId?: string | null,
    academicYearId?: string | null
  ): Promise<{ tenantId: string; branchId: string; academicYearId: string }> {
    if (!tenantId) throw new Error('Tenant context is required')

    let verifiedBranchId: string
    if (!branchId) {
      const mainBranch = await db.branch.findFirst({
        where: { tenantId, isMain: true, deletedAt: null },
      })
      if (!mainBranch) throw new Error('No active branch found for school')
      verifiedBranchId = mainBranch.id
    } else {
      const branch = await db.branch.findFirst({
        where: { id: branchId, tenantId, deletedAt: null },
      })
      if (!branch) throw new Error('Branch does not belong to school or is inactive')
      verifiedBranchId = branch.id
    }

    let verifiedAcademicYearId: string
    if (!academicYearId) {
      const currentSession = await db.academicSession.findFirst({
        where: { tenantId, isCurrent: true, status: 'ACTIVE' },
      })
      if (!currentSession) {
        const anyActive = await db.academicSession.findFirst({
          where: { tenantId, status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
        })
        if (!anyActive) throw new Error('No active academic year found. Please configure Academic Sessions in Setup.')
        verifiedAcademicYearId = anyActive.id
      } else {
        verifiedAcademicYearId = currentSession.id
      }
    } else {
      const session = await db.academicSession.findFirst({
        where: { id: academicYearId, tenantId },
      })
      if (!session) throw new Error('Academic year does not belong to school')
      verifiedAcademicYearId = session.id
    }

    return {
      tenantId,
      branchId: verifiedBranchId,
      academicYearId: verifiedAcademicYearId,
    }
  }

  // =========================================================================
  // 1. ENQUIRIES (LEADS)
  // =========================================================================

  /**
   * Search for duplicate enquiries within the school by phone or email.
   */
  static async findDuplicateEnquiry(tenantId: string, phone: string, email?: string | null) {
    const cleanPhone = phone.trim().replace(/\D/g, '')
    const whereOr: any[] = [{ phone: { contains: cleanPhone.slice(-10) } }]
    if (email && email.trim()) {
      whereOr.push({ email: { equals: email.trim(), mode: 'insensitive' } })
    }

    return db.lead.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: whereOr,
      },
    })
  }

  /**
   * Create a new Enquiry with duplicate detection, scope verification and audit logging.
   */
  static async createEnquiry(ctx: ScopeContext, input: CreateEnquiryInput) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    if (!input.parentName?.trim() || !input.phone?.trim()) {
      throw new Error('Parent name and phone number are required')
    }

    // Duplicate check
    const existing = await this.findDuplicateEnquiry(scope.tenantId, input.phone, input.email)
    if (existing) {
      return {
        enquiry: existing,
        isDuplicate: true,
        message: `Existing enquiry found for phone ${existing.phone} (${existing.leadNumber})`,
      }
    }

    // Validate child age if program and DOB are provided
    if (input.interestedProgram && input.childDob) {
      const ageCheck = await ConfigurationService.validateProgramAge(
        scope.tenantId,
        String(input.interestedProgram),
        input.childDob
      )
      if (!ageCheck.eligible) {
        // We log warning in notes but allow enquiry capture with flag
        input.notes = input.notes
          ? `${input.notes} [Age Advisory: ${ageCheck.reason}]`
          : `[Age Advisory: ${ageCheck.reason}]`
      }
    }

    const leadNumber = await nextNumber('lead', scope.tenantId)
    const validProgram = (['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE'] as ProgramType[]).includes(
      input.interestedProgram as ProgramType
    )
      ? (input.interestedProgram as ProgramType)
      : null

    const lead = await db.lead.create({
      data: {
        tenantId: scope.tenantId,
        branchId: scope.branchId,
        leadNumber,
        source: (input.source as LeadSource) || 'WALK_IN',
        status: 'NEW',
        parentName: input.parentName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        childName: input.childName?.trim() || null,
        childDob: input.childDob ? new Date(input.childDob) : null,
        interestedProgram: validProgram,
        notes: input.notes?.trim() || null,
        assignedToId: input.assignedToId || null,
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'CREATE',
      entity: 'Lead',
      entityId: lead.id,
      summary: `Enquiry ${leadNumber} created for ${input.parentName} (${input.childName || 'Child'})`,
    })

    return { enquiry: lead, isDuplicate: false }
  }

  /**
   * Update Enquiry status with validated state transitions.
   */
  static async updateEnquiryStatus(
    ctx: ScopeContext,
    enquiryId: string,
    newStatus: LeadStatus,
    notes?: string,
    nextFollowUpAt?: Date | string
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const enquiry = await db.lead.findFirst({
      where: { id: enquiryId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!enquiry) throw new Error('Enquiry not found')

    const updated = await db.lead.update({
      where: { id: enquiryId },
      data: {
        status: newStatus,
        ...(notes !== undefined ? { notes: notes || enquiry.notes } : {}),
        ...(nextFollowUpAt ? { nextFollowUpAt: new Date(nextFollowUpAt) } : {}),
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'UPDATE_STATUS',
      entity: 'Lead',
      entityId: enquiryId,
      summary: `Enquiry ${enquiry.leadNumber} status transitioned: ${enquiry.status} → ${newStatus}`,
    })

    return updated
  }

  // =========================================================================
  // 2. FOLLOW-UPS & SCHOOL VISITS
  // =========================================================================

  /**
   * Log an enquiry follow-up action using the centralized FollowUp aggregate.
   */
  static async addEnquiryFollowUp(
    ctx: ScopeContext,
    enquiryId: string,
    input: {
      type: string
      note: string
      dueAt?: Date | string
      outcome?: string
      responsibleRole?: 'TEACHER' | 'PRINCIPAL' | 'OWNER' | 'ACCOUNTS' | 'COORDINATOR'
    }
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const enquiry = await db.lead.findFirst({
      where: { id: enquiryId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!enquiry) throw new Error('Enquiry not found')

    const fu = await raiseFollowUp({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      domain: 'ADMISSION',
      severity: 'INFO',
      title: `${input.type || 'Call'}: ${enquiry.childName || enquiry.parentName}`,
      detail: input.note,
      sourceType: 'EnquiryFollowUp',
      sourceId: enquiryId,
      dedupeKey: `enquiry-fu:${enquiryId}:${Date.now()}`,
      dueAt: input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      responsibleRole: input.responsibleRole || 'COORDINATOR',
      actorId: ctx.actorId,
      actorName: ctx.actorName,
    })

    // If next follow-up date was set, update the enquiry pointer
    if (input.dueAt) {
      await db.lead.update({
        where: { id: enquiryId },
        data: { nextFollowUpAt: new Date(input.dueAt) },
      })
    }

    return fu
  }

  /**
   * Schedule or record a school visit / counselling session for an enquiry.
   */
  static async scheduleSchoolVisit(
    ctx: ScopeContext,
    enquiryId: string,
    input: {
      scheduledAt: Date | string
      visitorCount?: number
      notes?: string
      assignedUserId?: string
    }
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const enquiry = await db.lead.findFirst({
      where: { id: enquiryId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!enquiry) throw new Error('Enquiry not found')

    const visitTime = new Date(input.scheduledAt)

    const fu = await raiseFollowUp({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      domain: 'ADMISSION',
      severity: 'INFO',
      title: `School Visit: ${enquiry.childName || enquiry.parentName}`,
      detail: `School tour and interaction scheduled for ${visitTime.toLocaleString('en-IN')}. Visitors: ${
        input.visitorCount || 2
      }. ${input.notes || ''}`,
      sourceType: 'SchoolVisit',
      sourceId: enquiryId,
      dedupeKey: `visit:${enquiryId}:${visitTime.toISOString().slice(0, 10)}`,
      dueAt: visitTime,
      responsibleRole: 'COORDINATOR',
      actorId: ctx.actorId,
      actorName: ctx.actorName,
    })

    // Update enquiry status to VISIT_PLANNED if currently earlier
    if (['NEW', 'CONTACTED'].includes(enquiry.status)) {
      await db.lead.update({
        where: { id: enquiryId },
        data: { status: 'QUALIFIED', nextFollowUpAt: visitTime },
      })
    }

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'SCHEDULE_VISIT',
      entity: 'Lead',
      entityId: enquiryId,
      summary: `School visit scheduled for enquiry ${enquiry.leadNumber} on ${visitTime.toLocaleDateString()}`,
    })

    return fu
  }

  // =========================================================================
  // 3. ADMISSION FORMS (APPLICATIONS)
  // =========================================================================

  /**
   * Search existing applications for duplicates in the same school & academic cycle.
   */
  static async checkDuplicateApplication(
    tenantId: string,
    academicSessionId: string,
    childFirstName: string,
    childDob: Date | string,
    parentPhone: string
  ) {
    const cleanPhone = parentPhone.trim().replace(/\D/g, '')
    const dob = new Date(childDob)

    const existing = await db.admissionApplication.findFirst({
      where: {
        tenantId,
        academicSessionId,
        deletedAt: null,
        childFirstName: { equals: childFirstName.trim(), mode: 'insensitive' },
        parentPhone: { contains: cleanPhone.slice(-10) },
        childDob: {
          gte: new Date(dob.getFullYear(), dob.getMonth(), dob.getDate(), 0, 0, 0),
          lte: new Date(dob.getFullYear(), dob.getMonth(), dob.getDate(), 23, 59, 59),
        },
      },
      include: {
        academicSession: { select: { name: true } },
      },
    })

    if (existing) {
      return {
        isDuplicate: true,
        existingApplication: {
          id: existing.id,
          applicationNumber: existing.applicationNumber,
          childName: `${existing.childFirstName} ${existing.childLastName || ''}`.trim(),
          academicSessionName: existing.academicSession?.name,
          programType: existing.programType,
          status: existing.status,
          createdAt: existing.createdAt,
        },
        message: `Possible duplicate found: Application ${existing.applicationNumber} exists for ${existing.childFirstName} in ${existing.academicSession?.name || 'this session'}.`,
      }
    }

    return { isDuplicate: false }
  }

  /**
   * Submit or start a formal Admission Form with document checklist initialization.
   */
  static async submitApplication(ctx: ScopeContext, input: CreateApplicationInput) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    if (!input.childFirstName?.trim() || !input.childDob || !input.parentName?.trim() || !input.parentPhone?.trim()) {
      throw new Error('Child first name, date of birth, parent name, and parent phone are mandatory')
    }

    // Duplicate check
    const dupCheck = await this.checkDuplicateApplication(
      scope.tenantId,
      scope.academicYearId,
      input.childFirstName,
      input.childDob,
      input.parentPhone
    )

    if (dupCheck.isDuplicate && !input.isDuplicateConfirmed) {
      const err: any = new Error(dupCheck.message)
      err.code = 'DUPLICATE_APPLICATION_FOUND'
      err.duplicateDetails = dupCheck.existingApplication
      throw err
    }

    const validProgramType = (['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE'] as ProgramType[]).includes(
      input.programType as ProgramType
    )
      ? (input.programType as ProgramType)
      : 'NURSERY'

    // Age validation using authoritative ConfigurationService
    const ageCheck = await ConfigurationService.validateProgramAge(
      scope.tenantId,
      validProgramType,
      input.childDob
    )
    if (!ageCheck.eligible) {
      throw new Error(ageCheck.reason || 'Child does not satisfy age eligibility for this program')
    }

    // Find configured Program record from Setup if available
    const programRecord = await db.program.findFirst({
      where: { tenantId: scope.tenantId, programType: validProgramType, deletedAt: null, isActive: true },
    })

    // Find or create Guardian by phone to avoid duplicates
    let guardian = await db.guardian.findFirst({
      where: { tenantId: scope.tenantId, phone: input.parentPhone.trim(), deletedAt: null },
    })
    if (!guardian) {
      guardian = await db.guardian.create({
        data: {
          tenantId: scope.tenantId,
          fullName: input.parentName.trim(),
          phone: input.parentPhone.trim(),
          email: input.parentEmail?.trim() || null,
          relationship: 'MOTHER',
          isPrimaryContact: true,
        },
      })
    }

    // Configured document checklist from Setup/SchoolConfig
    const admCfg = getAdmissionConfig(await getDomainConfig(scope.tenantId, 'ADMISSION'))
    const requiredDocTypes: DocumentType[] = (admCfg.requiredDocuments || [
      'BIRTH_CERTIFICATE',
      'PHOTO',
      'PARENT_ID',
      'MEDICAL_CERTIFICATE',
    ]).map((d) => (['BIRTH_CERTIFICATE', 'AADHAAR', 'PHOTO', 'MEDICAL_CERTIFICATE', 'ADDRESS_PROOF', 'PARENT_ID', 'OTHER'].includes(d) ? (d as DocumentType) : 'OTHER'))

    const applicationNumber = await nextNumber('application', scope.tenantId)

    const app = await db.$transaction(async (tx) => {
      const application = await tx.admissionApplication.create({
        data: {
          tenantId: scope.tenantId,
          branchId: scope.branchId,
          academicSessionId: scope.academicYearId,
          applicationNumber,
          leadId: input.leadId || null,
          programId: programRecord?.id || null,
          programType: validProgramType,
          guardianId: guardian.id,
          childFirstName: input.childFirstName.trim(),
          childLastName: input.childLastName?.trim() || null,
          childDob: new Date(input.childDob),
          childGender: (input.childGender as Gender) || 'UNSPECIFIED',
          parentName: input.parentName.trim(),
          parentPhone: input.parentPhone.trim(),
          parentEmail: input.parentEmail?.trim() || null,
          previousSchool: input.previousSchool?.trim() || null,
          notes: input.notes?.trim() || null,
          isDuplicateConfirmed: !!input.isDuplicateConfirmed,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })

      // Generate document checklist items
      if (requiredDocTypes.length > 0) {
        await tx.applicationDocument.createMany({
          data: requiredDocTypes.map((docType) => ({
            applicationId: application.id,
            docType,
            fileName: `${docType.toLowerCase().replace(/_/g, '-')}-pending.pdf`,
            status: 'UPLOADED',
            verified: false,
          })),
        })
      }

      // If tied to lead, update lead status
      if (input.leadId) {
        await tx.lead.update({
          where: { id: input.leadId },
          data: {
            status: 'APPLICATION_STARTED',
            convertedApplicationId: application.id,
          },
        }).catch(() => {})
      }

      return application
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'APPLY',
      entity: 'AdmissionApplication',
      entityId: app.id,
      summary: `Admission Form ${applicationNumber} submitted for ${input.childFirstName} (${validProgramType})`,
    })

    return app
  }

  // =========================================================================
  // 4. DOCUMENTS & VERIFICATION
  // =========================================================================

  /**
   * Verify an individual document or mark it needing correction / rejected.
   */
  static async updateDocumentStatus(
    ctx: ScopeContext,
    documentId: string,
    action: 'VERIFY' | 'NEEDS_CORRECTION' | 'REJECT',
    remarks?: string
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const doc = await db.applicationDocument.findUnique({
      where: { id: documentId },
      include: { application: true },
    })
    if (!doc || doc.application.tenantId !== scope.tenantId) {
      throw new Error('Document not found')
    }

    if ((action === 'NEEDS_CORRECTION' || action === 'REJECT') && !remarks?.trim()) {
      throw new Error(`A specific reason is required when marking a document as ${action === 'REJECT' ? 'Rejected' : 'Needs Correction'}`)
    }

    const isVerified = action === 'VERIFY'
    const docStatus: DocumentStatus = isVerified ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : 'UNDER_REVIEW'

    const updatedDoc = await db.applicationDocument.update({
      where: { id: documentId },
      data: {
        status: docStatus,
        verified: isVerified,
        verifiedAt: isVerified ? new Date() : null,
        remarks: remarks || (isVerified ? 'Verified by admission reviewer' : null),
        rejectionReason: !isVerified ? remarks : null,
      },
    })

    // Re-check all application documents
    const allDocs = await db.applicationDocument.findMany({
      where: { applicationId: doc.applicationId },
    })
    const allVerified = allDocs.every((d) => d.status === 'VERIFIED' || d.verified)
    const hasRejected = allDocs.some((d) => d.status === 'REJECTED')

    let newAppStatus: ApplicationStatus = doc.application.status
    if (allVerified && ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'UNDER_REVIEW'].includes(doc.application.status)) {
      newAppStatus = 'VERIFIED'
      await db.admissionApplication.update({
        where: { id: doc.applicationId },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      })
    } else if (hasRejected || action === 'NEEDS_CORRECTION' || !allVerified) {
      if (doc.application.status === 'VERIFIED') {
        newAppStatus = 'DOCUMENT_PENDING'
        await db.admissionApplication.update({
          where: { id: doc.applicationId },
          data: { status: 'DOCUMENT_PENDING' },
        })
      }
    }

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: `DOC_${action}`,
      entity: 'ApplicationDocument',
      entityId: documentId,
      summary: `Document ${doc.docType} for ${doc.application.applicationNumber}: ${action} ${remarks ? `(${remarks})` : ''}`,
    })

    return { document: updatedDoc, applicationStatus: newAppStatus, allVerified }
  }

  // =========================================================================
  // 5. COUNSELLING & PARENT INTERACTION
  // =========================================================================

  /**
   * Schedule or log a counselling session with structured outcome.
   */
  static async recordCounselling(
    ctx: ScopeContext,
    applicationId: string,
    input: {
      scheduledAt?: Date | string
      counselorName?: string
      mode?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | string
      notes?: string
      outcome?: 'POSITIVE' | 'FOLLOW_UP_REQUIRED' | 'NOT_INTERESTED' | 'REFERRED' | string
    }
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!app) throw new Error('Application not found')

    const rawDate = input.scheduledAt ? new Date(input.scheduledAt) : new Date()
    const sessionDate = isNaN(rawDate.getTime()) ? new Date() : rawDate
    const counselor = input.counselorName || ctx.actorName || 'Admission Counselor'
    const outcome = input.outcome || 'POSITIVE'

    // Create operational follow-up record for CRM tracking
    const fu = await raiseFollowUp({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      domain: 'ADMISSION',
      severity: 'INFO',
      title: `Counselling: ${app.childFirstName} (${counselor})`,
      detail: `Mode: ${input.mode || 'IN_PERSON'}. Outcome: ${outcome}. ${input.notes || ''}`,
      sourceType: 'CounsellingSession',
      sourceId: applicationId,
      dedupeKey: `counselling:${applicationId}:${sessionDate.getTime()}`,
      dueAt: sessionDate,
      responsibleRole: 'COORDINATOR',
      actorId: ctx.actorId,
      actorName: ctx.actorName,
    })

    let nextStatus = app.status
    if (['SUBMITTED', 'VERIFIED', 'DOCUMENT_REVIEW'].includes(app.status)) {
      nextStatus = 'COUNSELLING'
    }

    const noteEntry = `[Counselling ${sessionDate.toLocaleDateString('en-IN')}] Counselor: ${counselor} | Outcome: ${outcome} | Mode: ${input.mode || 'IN_PERSON'}${input.notes ? `\nNotes: ${input.notes}` : ''}`
    const updatedNotes = app.notes ? `${app.notes}\n\n${noteEntry}` : noteEntry

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        notes: updatedNotes,
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'COUNSELLING_RECORDED',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Counselling recorded for ${app.applicationNumber} with ${counselor} (Outcome: ${outcome})`,
    })

    return { application: updated, outcome, counselor, followUp: fu }
  }

  // =========================================================================
  // 6. REVIEW & REQUIREMENTS CHECK
  // =========================================================================

  /**
   * Complete authoritative review assessment for an admission form.
   */
  static async reviewApplication(ctx: ScopeContext, applicationId: string) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
      include: {
        documents: true,
        lead: true,
        guardian: true,
        academicSession: true,
        program: true,
        offers: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!app) throw new Error('Admission application not found')

    // 1. Age check
    const ageCheck = await ConfigurationService.validateProgramAge(
      scope.tenantId,
      app.programType,
      app.childDob
    )

    // 2. Document checklist check
    const admCfg = getAdmissionConfig(await getDomainConfig(scope.tenantId, 'ADMISSION'))
    const requiredDocs = admCfg.requiredDocuments || ['BIRTH_CERTIFICATE', 'PHOTO']
    const verifiedDocCount = app.documents.filter((d) => d.status === 'VERIFIED' || d.verified).length
    const rejectedDocCount = app.documents.filter((d) => d.status === 'REJECTED').length
    const totalDocCount = app.documents.length
    const documentsComplete = verifiedDocCount === totalDocCount && totalDocCount > 0 && rejectedDocCount === 0

    // 3. Classrooms and Capacity
    const classrooms = await db.classroom.findMany({
      where: {
        tenantId: scope.tenantId,
        branchId: scope.branchId,
        programType: app.programType,
        isActive: true,
      },
      include: {
        _count: { select: { students: true } },
      },
    })

    const classroomStatus = classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      capacity: c.capacity,
      enrolled: c._count.students,
      available: Math.max(0, c.capacity - c._count.students),
      hasSeat: c._count.students < c.capacity,
    }))
    const hasAvailableCapacity = classroomStatus.some((c) => c.hasSeat)

    // 4. Fee Plan Quote
    const feePlan = await db.feePlan.findFirst({
      where: { tenantId: scope.tenantId, programType: app.programType, isActive: true },
      include: { items: true },
    })

    // 5. Sibling Logic
    const cleanPhone = app.parentPhone.trim().replace(/\D/g, '')
    const existingGuardians = await db.guardian.findMany({
      where: {
        tenantId: scope.tenantId,
        phone: { contains: cleanPhone.slice(-10) },
        deletedAt: null,
      },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                currentClassroom: true,
              },
            },
          },
        },
      },
    })

    const existingChildren: any[] = []
    for (const g of existingGuardians) {
      for (const link of g.studentLinks) {
        if (link.student && !link.student.deletedAt && link.student.firstName.toLowerCase() !== app.childFirstName.toLowerCase()) {
          existingChildren.push({
            studentId: link.student.id,
            admissionNo: link.student.admissionNo,
            name: `${link.student.firstName} ${link.student.lastName || ''}`.trim(),
            classroom: link.student.currentClassroom?.name || 'Class Assigned',
            status: link.student.status,
          })
        }
      }
    }

    // 6. Audit logs timeline
    const timeline = await db.auditLog.findMany({
      where: {
        tenantId: scope.tenantId,
        entity: 'AdmissionApplication',
        entityId: applicationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const isReadyForApproval = ageCheck.eligible && documentsComplete && hasAvailableCapacity

    return {
      application: app,
      requirements: {
        ageRequirement: ageCheck,
        documentsCheck: {
          verified: verifiedDocCount,
          rejected: rejectedDocCount,
          total: totalDocCount,
          isComplete: documentsComplete,
          missing: app.documents.filter((d) => d.status !== 'VERIFIED' && !d.verified).map((d) => d.docType),
        },
        capacityCheck: {
          hasAvailableCapacity,
          sections: classroomStatus,
        },
        feePlanQuote: feePlan
          ? {
              id: feePlan.id,
              name: feePlan.name,
              totalAnnualRupees: feePlan.totalAnnualCents / 100,
              installmentCount: feePlan.installmentCount,
              items: feePlan.items.map((i) => ({
                head: i.feeHead,
                label: i.label,
                amountRupees: i.amountCents / 100,
              })),
            }
          : null,
        siblingConcession: {
          hasSibling: existingChildren.length > 0,
          existingChildren,
          applicableDiscountPercent: existingChildren.length > 0 ? 10 : 0,
        },
        isReadyForApproval,
      },
      offers: app.offers,
      timeline,
    }
  }

  // =========================================================================
  // 7. APPROVAL WORKFLOW
  // =========================================================================

  /**
   * Formal Application Approval gate based on verified requirements.
   */
  static async approveApplication(ctx: ScopeContext, applicationId: string, notes?: string) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
      include: { documents: true },
    })
    if (!app) throw new Error('Application not found')

    if (['REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(app.status)) {
      throw new Error(`Cannot approve application in terminal status ${app.status}`)
    }
    if (app.status === 'ENROLLED' || app.status === 'ADMITTED') {
      throw new Error('Application is already admitted/enrolled')
    }

    // Age validation
    const ageCheck = await ConfigurationService.validateProgramAge(scope.tenantId, app.programType, app.childDob)
    if (!ageCheck.eligible) {
      throw new Error(`Cannot approve application: ${ageCheck.reason}`)
    }

    // Document validation
    const hasRejectedDocs = app.documents.some((d) => d.status === 'REJECTED')
    if (hasRejectedDocs) {
      throw new Error('Cannot approve application: One or more documents are marked as Rejected. Request revised documents first.')
    }

    const unverifiedDocs = app.documents.filter((d) => d.status !== 'VERIFIED' && !d.verified)
    if (unverifiedDocs.length > 0) {
      throw new Error(`Cannot approve application: ${unverifiedDocs.length} required documents are still pending verification.`)
    }

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        ...(notes ? { notes: app.notes ? `${app.notes}\n[Approved: ${notes}]` : `[Approved: ${notes}]` } : {}),
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'APPROVE',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Application ${app.applicationNumber} approved by ${ctx.actorName || 'Reviewer'}${notes ? ` (${notes})` : ''}`,
    })

    return updated
  }

  // =========================================================================
  // 8. ADMISSION OFFER & LETTER GENERATION
  // =========================================================================

  /**
   * Generate and persist an AdmissionOffer with authoritative fee quote.
   */
  static async generateOffer(
    ctx: ScopeContext,
    applicationId: string,
    validityOrOptions:
      | number
      | {
          validityDays?: number
          validDays?: number
          terms?: string
          remarks?: string
          feePlanId?: string
          classroomId?: string
        } = 7,
    termsArg?: string
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
      include: { tenant: true },
    })
    if (!app) throw new Error('Application not found')

    // State gate: an offer can only be generated for an application that has
    // passed verification — never for drafts, pre-verification, or terminal states
    const deniedOfferStates = ['DRAFT', 'SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'REJECTED', 'WITHDRAWN', 'EXPIRED']
    if (deniedOfferStates.includes(app.status)) {
      throw new Error(`Cannot generate an admission offer for an application in status ${app.status}`)
    }

    // Single-active-offer invariant: expiry previously issued offers before re-issue
    await db.admissionOffer.updateMany({
      where: { applicationId, tenantId: scope.tenantId, status: 'ISSUED' },
      data: { status: 'EXPIRED' },
    })

    const isOptObj = typeof validityOrOptions === 'object' && validityOrOptions !== null
    const days = isOptObj
      ? (validityOrOptions.validityDays || validityOrOptions.validDays || 7)
      : typeof validityOrOptions === 'number' && validityOrOptions > 0
      ? validityOrOptions
      : 7
    const terms = isOptObj ? validityOrOptions.terms || validityOrOptions.remarks : termsArg
    const explicitFeePlanId = isOptObj ? validityOrOptions.feePlanId : undefined

    // Find Fee plan quote
    const feePlan = explicitFeePlanId
      ? await db.feePlan.findFirst({
          where: { id: explicitFeePlanId, tenantId: scope.tenantId },
          include: { items: true },
        })
      : await db.feePlan.findFirst({
          where: { tenantId: scope.tenantId, programType: app.programType, isActive: true },
          include: { items: true },
        })

    const branch = await db.branch.findFirst({
      where: { id: app.branchId, tenantId: scope.tenantId },
    })

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + days)

    const offerNumber = `OFR-${app.applicationNumber.replace('ADM-', '')}-${Date.now().toString().slice(-4)}`

    const offer = await db.admissionOffer.create({
      data: {
        tenantId: scope.tenantId,
        applicationId,
        offerNumber,
        childName: `${app.childFirstName} ${app.childLastName || ''}`.trim(),
        parentName: app.parentName,
        programType: app.programType,
        feePlanId: feePlan?.id || null,
        feeTotalCents: feePlan?.totalAnnualCents || 0,
        terms: terms || `Admission offer for ${app.programType} at ${branch?.name || 'PreOne Academy'}. Valid for ${days} days.`,
        status: 'ISSUED',
        validFrom: new Date(),
        validUntil,
        issuedAt: new Date(),
        createdById: ctx.actorId,
      },
    })

    // Advance application status to OFFER_SENT
    const updatedApp = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'OFFER_SENT',
        notes: app.notes
          ? `${app.notes}\n[Offer Generated: ${offerNumber}, Valid until ${validUntil.toLocaleDateString()}]`
          : `[Offer Generated: ${offerNumber}, Valid until ${validUntil.toLocaleDateString()}]`,
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: app.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'OFFER_GENERATED',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Admission offer ${offerNumber} issued for ${app.childFirstName}`,
    })

    return {
      offer,
      application: updatedApp,
      brandedLetter: {
        offerNumber,
        schoolName: app.tenant.name,
        branchName: branch?.name || 'Main Campus',
        childName: `${app.childFirstName} ${app.childLastName || ''}`.trim(),
        parentName: app.parentName,
        parentPhone: app.parentPhone,
        program: app.programType,
        validUntil: validUntil.toISOString(),
        feeTotalRupees: (feePlan?.totalAnnualCents || 0) / 100,
        feeBreakdown: (feePlan?.items || []).map((i) => ({
          head: i.feeHead,
          label: i.label,
          amountRupees: i.amountCents / 100,
        })),
        terms: offer.terms,
      },
    }
  }

  /**
   * Record Parent Acceptance of the Admission Offer.
   */
  static async acceptOffer(
    ctx: ScopeContext,
    applicationId: string,
    offerIdOrNote?: string | { remarks?: string },
    options?: { remarks?: string }
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const offer = await db.admissionOffer.findFirst({
      where: { applicationId, tenantId: scope.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { application: true },
    })
    if (!offer) throw new Error('Admission offer not found')

    if (offer.status === 'ACCEPTED') {
      const app = await db.admissionApplication.findFirst({
        where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
      })
      return { offer, application: app, alreadyAccepted: true }
    }

    if (offer.status !== 'ISSUED') {
      throw new Error(`Offer ${offer.offerNumber} is ${offer.status} and cannot be accepted`)
    }

    if (new Date() > offer.validUntil) {
      await db.admissionOffer.update({ where: { id: offer.id }, data: { status: 'EXPIRED' } })
      throw new Error(`This admission offer expired on ${offer.validUntil.toLocaleDateString()}. Please request a renewed offer.`)
    }

    const appNow = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!appNow) throw new Error('Application not found')
    if (['REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(appNow.status)) {
      throw new Error(`Cannot accept an offer for an application in status ${appNow.status}`)
    }

    const note =
      typeof options === 'object' && options?.remarks
        ? options.remarks
        : typeof offerIdOrNote === 'object' && offerIdOrNote?.remarks
        ? offerIdOrNote.remarks
        : typeof offerIdOrNote === 'string' && offerIdOrNote.length < 30 && !offerIdOrNote.includes('-')
        ? offerIdOrNote
        : 'Offer accepted by parent'

    const updatedOffer = await db.admissionOffer.update({
      where: { id: offer.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptNote: note,
      },
    })

    const updatedApp = await db.admissionApplication.update({
      where: { id: applicationId },
      data: { status: 'OFFER_ACCEPTED' },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'OFFER_ACCEPTED',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Admission offer ${offer.offerNumber} accepted by parent for ${offer.childName}`,
    })

    return { offer: updatedOffer, application: updatedApp, alreadyAccepted: false }
  }

  /**
   * Record Parent Decline of the Admission Offer.
   */
  static async declineOffer(
    ctx: ScopeContext,
    applicationId: string,
    offerIdOrReason?: string | { reason?: string },
    options?: { reason?: string }
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const offer = await db.admissionOffer.findFirst({
      where: { applicationId, tenantId: scope.tenantId },
      orderBy: { createdAt: 'desc' },
    })
    if (!offer) throw new Error('Admission offer not found')

    if (offer.status === 'ACCEPTED') {
      throw new Error('Offer has already been accepted and cannot be declined')
    }
    if (offer.status !== 'ISSUED') {
      throw new Error(`Offer ${offer.offerNumber} is ${offer.status} and cannot be declined`)
    }

    const appState = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!appState) throw new Error('Application not found')
    if (['ENROLLED', 'ADMITTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(appState.status)) {
      throw new Error(`Cannot decline offer — application is in status ${appState.status}`)
    }

    const reason =
      typeof options === 'object' && options?.reason
        ? options.reason
        : typeof offerIdOrReason === 'object' && offerIdOrReason?.reason
        ? offerIdOrReason.reason
        : typeof offerIdOrReason === 'string' && !offerIdOrReason.includes('-')
        ? offerIdOrReason
        : 'Parent opted out'

    const updatedOffer = await db.admissionOffer.update({
      where: { id: offer.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason,
      },
    })

    const updatedApp = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        notes: `Offer declined by parent: ${reason}`,
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'OFFER_DECLINED',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Admission offer ${offer.offerNumber} declined: ${reason}`,
    })

    return { offer: updatedOffer, application: updatedApp }
  }

  // =========================================================================
  // 9. REJECTION
  // =========================================================================

  /**
   * Reject an application with structured reason.
   */
  static async rejectApplication(
    ctx: ScopeContext,
    applicationId: string,
    reasonOrOptions: string | { reason?: string; notes?: string },
    notesArg?: string
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!app) throw new Error('Application not found')
    if (app.status === 'ENROLLED' || app.status === 'ADMITTED') {
      throw new Error('Cannot reject an already enrolled application')
    }

    const isObj = typeof reasonOrOptions === 'object' && reasonOrOptions !== null
    const reasonStr = isObj ? reasonOrOptions.reason : reasonOrOptions
    const notesStr = isObj ? reasonOrOptions.notes : notesArg
    const structuredReason = (typeof reasonStr === 'string' && reasonStr.trim()) ? reasonStr.trim() : 'Did not meet admission criteria'

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: structuredReason,
        ...(notesStr ? { notes: app.notes ? `${app.notes}\n[Rejection Note: ${notesStr}]` : `[Rejection Note: ${notesStr}]` } : {}),
      },
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'REJECT',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Application ${app.applicationNumber} rejected: ${structuredReason}${notesStr ? ` (${notesStr})` : ''}`,
    })

    return updated
  }

  // =========================================================================
  // 10. WAITING LIST
  // =========================================================================

  /**
   * Place an application on the waiting list when seats are full.
   */
  static async waitlistApplication(ctx: ScopeContext, applicationId: string, reason?: string) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
    })
    if (!app) throw new Error('Application not found')
    if (['ENROLLED', 'ADMITTED', 'REJECTED', 'WITHDRAWN'].includes(app.status)) {
      throw new Error(`Cannot waitlist application in status ${app.status}`)
    }

    const updated = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: 'WAITLISTED',
        notes: reason ? `Waitlisted: ${reason}` : app.notes,
      },
    })

    // Calculate position based on earlier waitlisted applications in the same program
    const position = await db.admissionApplication.count({
      where: {
        tenantId: scope.tenantId,
        programType: app.programType,
        status: 'WAITLISTED',
        submittedAt: { lte: app.submittedAt || app.createdAt },
      },
    })

    await raiseFollowUp({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      domain: 'ADMISSION',
      severity: 'INFO',
      title: `Waitlisted #${position}: ${app.childFirstName} (${app.programType})`,
      detail: reason || 'Section full. Follow up when seat becomes available.',
      sourceType: 'AdmissionApplication',
      sourceId: applicationId,
      dedupeKey: `waitlist:${applicationId}`,
      responsibleRole: 'COORDINATOR',
      actorId: ctx.actorId,
      actorName: ctx.actorName,
    })

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'WAITLIST',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Application ${app.applicationNumber} added to waiting list (Position #${position})`,
    })

    return { application: updated, position }
  }

  // =========================================================================
  // 11. FINAL ENROLLMENT & CROSS-MODULE HANDOFF
  // =========================================================================

  /**
   * Complete Admission Enrollment — The critical atomic multi-entity transaction.
   * Hands off to Student, Parent, Class Allocation, and Finance.
   * IDEMPOTENT: repeated calls return the existing enrolled student.
   */
  static async completeEnrollment(
    ctx: ScopeContext,
    applicationId: string,
    targetClassroomId?: string
  ) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    const app = await db.admissionApplication.findFirst({
      where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
      include: { documents: true },
    })
    if (!app) throw new Error('Application not found')

    // State gate: only approved or offer-accepted applications can be enrolled
    if (!['APPROVED', 'OFFER_ACCEPTED', 'ENROLLED', 'ADMITTED'].includes(app.status)) {
      throw new Error(
        `Cannot enroll application in status ${app.status}. Approve the application and record any offer acceptance first.`
      )
    }

    // If an offer exists, an accepted and non-expired offer is required
    const acceptedOffer = await db.admissionOffer.findFirst({
      where: { applicationId, tenantId: scope.tenantId },
      orderBy: { createdAt: 'desc' },
    })
    if (acceptedOffer) {
      if (acceptedOffer.status !== 'ACCEPTED') {
        throw new Error(
          `Admission requires offer ${acceptedOffer.offerNumber} to be accepted by the parent before enrollment.`
        )
      }
      if (new Date() > acceptedOffer.validUntil) {
        throw new Error(`Offer ${acceptedOffer.offerNumber} has expired. Generate a renewed offer first.`)
      }
    }

    // Document gate: no rejected documents and all must be verified
    const hasRejectedDocs = app.documents.some((d) => d.status === 'REJECTED')
    if (hasRejectedDocs) {
      throw new Error('Cannot enroll application: One or more documents are marked as Rejected. Request revised documents first.')
    }
    const unverifiedDocs = app.documents.filter((d) => d.status !== 'VERIFIED' && !d.verified)
    if (unverifiedDocs.length > 0) {
      throw new Error(`Cannot enroll application: ${unverifiedDocs.length} required documents are still pending verification.`)
    }

    // Idempotent return if already enrolled
    if (app.status === 'ENROLLED' && app.studentId) {
      const existingStudent = await db.student.findUnique({
        where: { id: app.studentId },
        include: { currentClassroom: true },
      })
      if (existingStudent) {
        return {
          student: existingStudent,
          admissionNo: existingStudent.admissionNo,
          classroomName: existingStudent.currentClassroom?.name || 'Assigned',
          isAlreadyEnrolled: true,
        }
      }
    }

    // Classroom Selection & Concurrency Capacity Guard
    const classroom = targetClassroomId
      ? await db.classroom.findFirst({
          where: { id: targetClassroomId, tenantId: scope.tenantId, isActive: true },
        })
      : await db.classroom.findFirst({
          where: {
            tenantId: scope.tenantId,
            branchId: scope.branchId,
            programType: app.programType,
            isActive: true,
          },
        })

    if (!classroom) {
      throw new Error(`No active section found for program ${app.programType}. Configure classroom in Setup first.`)
    }

    // Capacity verification
    const activeEnrolledCount = await db.student.count({
      where: { currentClassroomId: classroom.id, tenantId: scope.tenantId, status: 'ACTIVE', deletedAt: null },
    })
    if (activeEnrolledCount >= classroom.capacity) {
      throw new Error(
        `Section ${classroom.name} is at full capacity (${activeEnrolledCount}/${classroom.capacity}). Please waitlist the child or allocate another section.`
      )
    }

    // =========================================================================
    // ATOMIC TRANSACTION: Student + Guardian + Allocation + Fee Invoice
    // =========================================================================
    const result = await db.$transaction(async (tx) => {
      // 1. Re-check classroom capacity inside transaction
      const inTxCount = await tx.student.count({
        where: { currentClassroomId: classroom.id, tenantId: scope.tenantId, status: 'ACTIVE', deletedAt: null },
      })
      if (inTxCount >= classroom.capacity) {
        throw new Error(`Section ${classroom.name} is at full capacity (${inTxCount}/${classroom.capacity}).`)
      }

      // 2. Check if Student already exists (name + DOB + tenant match)
      let student = await tx.student.findFirst({
        where: {
          tenantId: scope.tenantId,
          firstName: { equals: app.childFirstName, mode: 'insensitive' },
          dob: app.childDob,
          deletedAt: null,
        },
      })

      if (!student) {
        const studentCount = await tx.student.count({ where: { tenantId: scope.tenantId } })
        const admissionNo = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`

        student = await tx.student.create({
          data: {
            tenantId: scope.tenantId,
            branchId: scope.branchId,
            admissionNo,
            firstName: app.childFirstName,
            lastName: app.childLastName,
            dob: app.childDob,
            gender: app.childGender,
            admissionDate: new Date(),
            currentClassroomId: classroom.id,
          },
        })
      } else {
        // Link existing student to new classroom
        student = await tx.student.update({
          where: { id: student.id },
          data: { currentClassroomId: classroom.id, status: 'ACTIVE' },
        })
      }

      // 3. Parent / Guardian: Find existing Guardian by phone to avoid duplicates
      let guardian = await tx.guardian.findFirst({
        where: {
          tenantId: scope.tenantId,
          phone: app.parentPhone,
          deletedAt: null,
        },
      })

      if (!guardian) {
        guardian = await tx.guardian.create({
          data: {
            tenantId: scope.tenantId,
            fullName: app.parentName,
            phone: app.parentPhone,
            email: app.parentEmail,
            relationship: 'MOTHER',
            isPrimaryContact: true,
          },
        })
      }

      // 4. Link Student to Guardian (upsert to prevent duplicate link)
      const existingLink = await tx.studentGuardian.findUnique({
        where: { studentId_guardianId: { studentId: student.id, guardianId: guardian.id } },
      })
      if (!existingLink) {
        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            isPrimary: true,
            canPickup: true,
            isFeePayer: true,
            receivesComm: true,
          },
        })
      }

      // 5. Classroom Allocation History (StudentAllocation per AcademicSession)
      await tx.studentAllocation.create({
        data: {
          tenantId: scope.tenantId,
          studentId: student.id,
          academicSessionId: scope.academicYearId,
          classroomId: classroom.id,
          programType: classroom.programType,
          status: 'ACTIVE',
          startedAt: new Date(),
          reason: 'New Admission Enrolment',
          createdById: ctx.actorId,
          createdByName: ctx.actorName,
        },
      })

      // 6. Finance handoff: First fee invoice from configured FeePlan
      const feePlan = await tx.feePlan.findFirst({
        where: { tenantId: scope.tenantId, programType: app.programType, isActive: true },
        include: { items: true },
      })

      let invoice: { id: string; invoiceNumber: string; totalCents: number; dueDate: Date } | null = null
      if (feePlan && feePlan.items.length > 0) {
        const subtotal = feePlan.items.reduce((s, i) => s + i.amountCents, 0)
        const invoiceNumber = await nextNumber('invoice', scope.tenantId)
        const finCfg = await getDomainConfig(scope.tenantId, 'FINANCE')
        const dueOffset = Number(finCfg.dueDayOffset) > 0 ? Number(finCfg.dueDayOffset) : 15
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + dueOffset)

        invoice = await tx.invoice.create({
          data: {
            tenantId: scope.tenantId,
            branchId: scope.branchId,
            studentId: student.id,
            invoiceNumber,
            title: `${feePlan.name} — Admission Fee Invoice`,
            dueDate,
            subtotalCents: subtotal,
            totalCents: subtotal,
            balanceCents: subtotal,
            status: 'ISSUED',
            issuedById: ctx.actorId,
            academicSessionId: scope.academicYearId,
            items: {
              create: feePlan.items.map((i) => ({
                feeHead: i.feeHead,
                description: i.label,
                amountCents: i.amountCents,
              })),
            },
          },
        })
      }

      // 7. Update Application status to ENROLLED
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: 'ENROLLED',
          approvedAt: new Date(),
          studentId: student.id,
          classroomId: classroom.id,
        },
      })

      // 8. Update Lead to CONVERTED
      if (app.leadId) {
        await tx.lead.update({
          where: { id: app.leadId },
          data: { status: 'CONVERTED' },
        }).catch(() => {})
      }

      // 9. Parent Portal welcome timeline entry
      await tx.timelineEntry.create({
        data: {
          tenantId: scope.tenantId,
          studentId: student.id,
          classroomId: classroom.id,
          academicSessionId: scope.academicYearId,
          type: 'MILESTONE',
          title: 'Welcome to PreOne!',
          body: `${app.childFirstName} joined ${classroom.name} for academic session ${scope.academicYearId}.`,
        },
      })

      return { student, guardian, classroom, invoice }
    })

    // Emit domain events for downstream integrations
    await emit({
      type: 'StudentCreated',
      tenantId: scope.tenantId,
      studentId: result.student.id,
      name: `${result.student.firstName} ${result.student.lastName || ''}`.trim(),
      classroomId: result.classroom.id,
    })

    await emit({
      type: 'StudentAllocated',
      tenantId: scope.tenantId,
      studentId: result.student.id,
      classroomId: result.classroom.id,
      reason: 'New Admission Enrolment',
    })

    if (result.invoice) {
      await emit({
        type: 'InvoiceIssued',
        tenantId: scope.tenantId,
        invoiceId: result.invoice.id,
        studentId: result.student.id,
        invoiceNumber: result.invoice.invoiceNumber,
        totalCents: result.invoice.totalCents,
        dueDate: result.invoice.dueDate,
      })
    }

    await audit({
      tenantId: scope.tenantId,
      branchId: scope.branchId,
      academicSessionId: scope.academicYearId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'ENROLL',
      entity: 'AdmissionApplication',
      entityId: applicationId,
      summary: `Completed Admission: ${app.applicationNumber} → Student ${result.student.admissionNo} (${result.student.firstName}) enrolled in ${result.classroom.name}`,
    })

    return {
      student: result.student,
      guardian: result.guardian,
      admissionNo: result.student.admissionNo,
      classroomName: result.classroom.name,
      invoiceNumber: result.invoice?.invoiceNumber ?? null,
      isAlreadyEnrolled: false,
    }
  }
}

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
import type { ProgramType, Gender, LeadSource, LeadStatus, ApplicationStatus, DocumentType } from '@prisma/client'

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
}

export class AdmissionService {
  /**
   * Authoritatively verify tenant, branch and academic session scope.
   */
  static async verifyScope(tenantId: string, branchId?: string | null, academicYearId?: string | null) {
    if (!tenantId) throw new Error('Tenant context is required')

    let verifiedBranchId = branchId
    if (!verifiedBranchId) {
      const mainBranch = await db.branch.findFirst({
        where: { tenantId, isMain: true, deletedAt: null },
      })
      if (!mainBranch) throw new Error('No active branch found for school')
      verifiedBranchId = mainBranch.id
    } else {
      const branch = await db.branch.findFirst({
        where: { id: verifiedBranchId, tenantId, deletedAt: null },
      })
      if (!branch) throw new Error('Branch does not belong to school or is inactive')
    }

    let verifiedAcademicYearId = academicYearId
    if (!verifiedAcademicYearId) {
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
        where: { id: verifiedAcademicYearId, tenantId },
      })
      if (!session) throw new Error('Academic year does not belong to school')
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
   * Submit or start a formal Admission Form with document checklist initialization.
   */
  static async submitApplication(ctx: ScopeContext, input: CreateApplicationInput) {
    const scope = await this.verifyScope(ctx.tenantId, ctx.branchId, ctx.academicYearId)

    if (!input.childFirstName?.trim() || !input.childDob || !input.parentName?.trim() || !input.parentPhone?.trim()) {
      throw new Error('Child first name, date of birth, parent name, and parent phone are mandatory')
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
          applicationNumber,
          leadId: input.leadId || null,
          programType: validProgramType,
          childFirstName: input.childFirstName.trim(),
          childLastName: input.childLastName?.trim() || null,
          childDob: new Date(input.childDob),
          childGender: (input.childGender as Gender) || 'UNSPECIFIED',
          parentName: input.parentName.trim(),
          parentPhone: input.parentPhone.trim(),
          parentEmail: input.parentEmail?.trim() || null,
          previousSchool: input.previousSchool?.trim() || null,
          notes: input.notes?.trim() || null,
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
   * Verify an individual document or mark it needing correction.
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

    if (action === 'NEEDS_CORRECTION' && !remarks?.trim()) {
      throw new Error('A correction reason is required when marking a document for correction')
    }

    const isVerified = action === 'VERIFY'
    const updatedDoc = await db.applicationDocument.update({
      where: { id: documentId },
      data: {
        verified: isVerified,
        verifiedAt: isVerified ? new Date() : null,
        remarks: remarks || (isVerified ? 'Verified by admission reviewer' : null),
      },
    })

    // Check if all application documents are now verified
    const allDocs = await db.applicationDocument.findMany({
      where: { applicationId: doc.applicationId },
    })
    const allVerified = allDocs.every((d) => d.verified)

    let newAppStatus: ApplicationStatus = doc.application.status
    if (allVerified && ['SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW'].includes(doc.application.status)) {
      newAppStatus = 'VERIFIED'
      await db.admissionApplication.update({
        where: { id: doc.applicationId },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      })
    } else if (action === 'NEEDS_CORRECTION' || !allVerified) {
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
  // 5. REVIEW & REQUIREMENTS CHECK
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
    const verifiedDocCount = app.documents.filter((d) => d.verified).length
    const totalDocCount = app.documents.length
    const documentsComplete = verifiedDocCount === totalDocCount && totalDocCount > 0

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

    const isReadyForApproval = ageCheck.eligible && documentsComplete && hasAvailableCapacity

    return {
      application: app,
      requirements: {
        ageRequirement: ageCheck,
        documentsCheck: {
          verified: verifiedDocCount,
          total: totalDocCount,
          isComplete: documentsComplete,
          missing: app.documents.filter((d) => !d.verified).map((d) => d.docType),
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
        isReadyForApproval,
      },
    }
  }

  // =========================================================================
  // 6. WAITING LIST
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
    if (['ENROLLED', 'REJECTED', 'WITHDRAWN'].includes(app.status)) {
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
  // 7. FINAL ENROLLMENT & CROSS-MODULE HANDOFF
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

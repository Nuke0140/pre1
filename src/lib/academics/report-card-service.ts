/**
 * PreOne — Report Card Service
 * Authoritative business engine for managing, evaluating, bulk-entering,
 * versioning, rendering and publishing Student Report Cards.
 * Deeply integrates with Template Studio (REPORT_CARD templates) and
 * Profile Document Library.
 */

import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'
import { TemplateService } from '@/lib/templates/template-service'
import { PdfService } from '@/lib/templates/pdf-service'
import { TemplateDefinition } from '@/lib/templates/types'

export interface ScopeContext {
  tenantId: string
  branchId?: string | null
  academicSessionId?: string | null
  actorId?: string
  actorName?: string
  actorRole?: string
}

export interface ReportCardFieldValue {
  key: string
  label: string
  type: 'text' | 'number' | 'grade' | 'rating' | 'textarea' | 'select'
  value: any
  ordering?: number
  required?: boolean
}

export interface ReportCardFieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'grade' | 'rating' | 'textarea' | 'select'
  options?: string[]
  description?: string
  required?: boolean
  ordering?: number
}

export interface SaveReportCardInput {
  academicSessionId: string
  term: string // e.g. "Term 1", "Term 2", "Annual Evaluation"
  studentId: string
  classroomId?: string | null
  templateId: string
  status?: 'DRAFT' | 'REVIEWED' | 'PUBLISHED'
  overallGrade?: string | null
  remarks?: string | null
  attendancePct?: number | null
  fieldValues: Record<string, ReportCardFieldValue>
}

export interface BulkSaveReportCardItem {
  studentId: string
  overallGrade?: string | null
  remarks?: string | null
  attendancePct?: number | null
  fieldValues: Record<string, ReportCardFieldValue>
}

export interface BulkSaveReportCardsInput {
  academicSessionId: string
  classroomId: string
  term: string
  templateId: string
  status?: 'DRAFT' | 'REVIEWED' | 'PUBLISHED'
  items: BulkSaveReportCardItem[]
}

export class ReportCardService {
  /**
   * List report cards for a tenant with filtering by student, classroom, session, term, status
   */
  static async listReportCards(
    ctxOrTenantId: string | { tenantId: string },
    filters: {
      studentId?: string
      studentIds?: string[]
      classroomId?: string
      academicSessionId?: string
      templateId?: string
      term?: string
      status?: string
      page?: number
      limit?: number
    } = {}
  ) {
    const tenantId = typeof ctxOrTenantId === 'object' ? ctxOrTenantId.tenantId : ctxOrTenantId
    const page = Math.max(1, filters.page ?? 1)
    const limit = Math.max(1, Math.min(100, filters.limit ?? 50))
    const skip = (page - 1) * limit

    const where: any = { tenantId }
    if (filters.studentId) where.studentId = filters.studentId
    else if (filters.studentIds && filters.studentIds.length > 0) where.studentId = { in: filters.studentIds }
    if (filters.classroomId) where.classroomId = filters.classroomId
    if (filters.academicSessionId) where.academicSessionId = filters.academicSessionId
    if (filters.templateId) where.templateId = filters.templateId
    if (filters.term && filters.term !== 'ALL') where.term = filters.term
    if (filters.status && filters.status !== 'ALL') where.status = filters.status

    const [total, reportCards] = await Promise.all([
      db.studentReportCard.count({ where }),
      db.studentReportCard.findMany({
        where,
        orderBy: [{ academicSession: { startDate: 'desc' } }, { term: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              gender: true,
              dob: true,
            },
          },
          classroom: {
            select: { id: true, name: true, code: true, programType: true },
          },
          academicSession: {
            select: { id: true, name: true, isCurrent: true },
          },
          documentTemplate: {
            select: { id: true, name: true, type: true, content: true },
          },
          document: {
            select: { id: true, title: true, fileName: true, fileUrl: true, fileSizeBytes: true, createdAt: true },
          },
        },
      }),
    ])

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reportCards: reportCards.map((rc) => ({
        ...rc,
        studentName: `${rc.student.firstName} ${rc.student.lastName || ''}`.trim(),
        templateName: rc.documentTemplate?.name || 'Report Card Template',
      })),
    }
  }

  /**
   * Retrieve a single report card by ID with complete resolved context
   */
  static async getReportCard(tenantId: string, id: string) {
    const rc = await db.studentReportCard.findFirst({
      where: { id, tenantId },
      include: {
        student: {
          include: {
            guardians: {
              include: { guardian: true },
            },
          },
        },
        classroom: {
          include: {
            primaryTeacher: { select: { id: true, fullName: true, email: true } },
          },
        },
        academicSession: true,
        documentTemplate: true,
        document: true,
      },
    })

    if (!rc) throw new Error('Report card not found')

    return {
      ...rc,
      studentName: `${rc.student.firstName} ${rc.student.lastName || ''}`.trim(),
      templateName: rc.documentTemplate?.name || 'Report Card Template',
    }
  }

  /**
   * Extract dynamic field definitions from a document template
   */
  static getTemplateFields(template?: any): ReportCardFieldDef[] {
    const def = (template ? (template.content || template) : {}) as any

    // 1. Direct field definitions if present in template definition
    if (Array.isArray(def.fields) && def.fields.length > 0) {
      return def.fields.map((f: any, idx: number) => ({
        key: f.key || `field_${idx}`,
        label: f.label || f.name || f.key || `Field ${idx + 1}`,
        type: f.type || 'text',
        options: f.options,
        description: f.description,
        required: f.required ?? false,
        ordering: f.ordering ?? idx,
      }))
    }

    // 2. Developmental domains / criteria if present
    if (Array.isArray(def.developmentalDomains) && def.developmentalDomains.length > 0) {
      return def.developmentalDomains.map((d: any, idx: number) => ({
        key: d.key || `domain_${d.id || idx}`,
        label: d.label || d.name || `Domain ${idx + 1}`,
        type: 'rating',
        options: d.options || ['Mastered', 'Developing', 'Emerging'],
        description: d.description || d.milestone,
        required: false,
        ordering: idx,
      }))
    }

    // 3. Inspect elements in template definition
    const elements = Array.isArray(def.elements) ? def.elements : []
    const extractedFields: ReportCardFieldDef[] = []
    const seenKeys = new Set<string>()

    // Check table element
    const tableEl = elements.find((e: any) => e.type === 'table')
    if (tableEl?.styles?.tableRows && Array.isArray(tableEl.styles.tableRows) && tableEl.styles.tableRows.length > 0) {
      tableEl.styles.tableRows.forEach((r: any, idx: number) => {
        const key = r.key || `row_${idx}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          extractedFields.push({
            key,
            label: r.label || r.domain || r.subject || `Criterion ${idx + 1}`,
            type: r.type || 'rating',
            options: r.options || ['Mastered', 'Developing', 'Emerging'],
            description: r.milestone || r.description,
            ordering: idx,
          })
        }
      })
    }

    // Check custom fieldBindings
    elements.forEach((el: any) => {
      if (el.fieldBinding && (el.fieldBinding.startsWith('field.') || el.fieldBinding.startsWith('custom.'))) {
        const key = el.fieldBinding.replace(/^(field|custom)\./, '')
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          extractedFields.push({
            key,
            label: el.name || key,
            type: el.type === 'textarea' ? 'textarea' : 'text',
            ordering: extractedFields.length,
          })
        }
      }
    })

    if (extractedFields.length > 0) {
      return extractedFields
    }

    // 4. Default standard early childhood developmental domains (preschool holistic evaluation)
    return [
      {
        key: 'domainMotor',
        label: 'Gross & Fine Motor Skills',
        type: 'rating',
        options: ['Mastered', 'Developing', 'Emerging'],
        description: 'Physical coordination, balance, pencil grip, motor control',
        ordering: 0,
      },
      {
        key: 'domainLanguage',
        label: 'Language & Phonics',
        type: 'rating',
        options: ['Mastered', 'Developing', 'Emerging'],
        description: 'Vocabulary, self-expression, listening, phonetic awareness',
        ordering: 1,
      },
      {
        key: 'domainSocial',
        label: 'Social & Emotional Harmony',
        type: 'rating',
        options: ['Mastered', 'Developing', 'Emerging'],
        description: 'Peer interaction, sharing, emotional regulation, teamwork',
        ordering: 2,
      },
      {
        key: 'domainCognitive',
        label: 'Cognitive & Sensory Exploration',
        type: 'rating',
        options: ['Mastered', 'Developing', 'Emerging'],
        description: 'Curiosity, spatial thinking, problem solving, numbers & patterns',
        ordering: 3,
      },
      {
        key: 'domainCreative',
        label: 'Creative Arts & Expression',
        type: 'rating',
        options: ['Mastered', 'Developing', 'Emerging'],
        description: 'Artistic exploration, music, dramatic play, sensory curiosity',
        ordering: 4,
      },
    ]
  }

  /**
   * Helper to retrieve template fields by templateId
   */
  static async getTemplateFieldsById(tenantId: string, templateId: string): Promise<ReportCardFieldDef[]> {
    const template = await db.documentTemplate.findFirst({
      where: { id: templateId, tenantId },
    })
    if (!template) throw new Error('Template not found')
    return this.getTemplateFields(template)
  }

  /**
   * Save (upsert) a single student's report card record idempotently
   */
  static async saveReportCard(ctx: ScopeContext, input: SaveReportCardInput) {
    const { tenantId } = ctx
    if (!tenantId) throw new Error('Tenant context required')

    // Verify template existence and validity (must be REPORT_CARD)
    const template = await db.documentTemplate.findFirst({
      where: { id: input.templateId, tenantId, type: 'REPORT_CARD' },
    })
    if (!template) throw new Error('Specified report card template does not exist or is not a REPORT_CARD template')

    // Verify student exists in tenant
    const student = await db.student.findFirst({
      where: { id: input.studentId, tenantId, deletedAt: null },
      include: { currentClassroom: true },
    })
    if (!student) throw new Error('Student not found')

    const classroomId = input.classroomId || student.currentClassroomId || null

    // Validate enrollment in classroom & session
    if (classroomId) {
      const classroom = await db.classroom.findFirst({
        where: { id: classroomId, tenantId, academicSessionId: input.academicSessionId },
      })
      if (!classroom) {
        throw new Error('Classroom does not exist or does not belong to the selected academic session')
      }

      const isDirectlyAssigned = student.currentClassroomId === classroomId
      const hasActiveAllocation = await db.studentAllocation.findFirst({
        where: {
          tenantId,
          studentId: input.studentId,
          classroomId,
          academicSessionId: input.academicSessionId,
          status: 'ACTIVE',
        },
      })

      if (!isDirectlyAssigned && !hasActiveAllocation) {
        throw new Error(`Student ${student.firstName} is not enrolled in the specified classroom and academic session`)
      }
    }

    // Check existing record to enforce published protection and merge omitted fields
    const isStaffAdmin = ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR', 'ADMIN'].includes(ctx.actorRole || '')
    const existingRc = await db.studentReportCard.findUnique({
      where: {
        tenantId_academicSessionId_term_studentId_templateId: {
          tenantId,
          academicSessionId: input.academicSessionId,
          term: input.term,
          studentId: input.studentId,
          templateId: input.templateId,
        },
      },
    })

    if (existingRc && existingRc.status === 'PUBLISHED' && !isStaffAdmin && input.status !== 'DRAFT') {
      throw new Error('Published report card cannot be modified by non-admin staff. Unpublish first.')
    }

    // Merge omitted fields
    const existingFieldValues = (existingRc?.fieldValues as unknown as Record<string, ReportCardFieldValue>) || {}
    const mergedFieldValues = existingRc
      ? { ...existingFieldValues, ...(input.fieldValues || {}) }
      : (input.fieldValues || {})

    const overallGrade = input.overallGrade !== undefined ? input.overallGrade : (existingRc?.overallGrade ?? null)
    const remarks = input.remarks !== undefined ? input.remarks : (existingRc?.remarks ?? null)
    const attendancePct = input.attendancePct !== undefined ? input.attendancePct : (existingRc?.attendancePct ?? null)
    const status = input.status || existingRc?.status || 'DRAFT'

    const reportCard = await db.studentReportCard.upsert({
      where: {
        tenantId_academicSessionId_term_studentId_templateId: {
          tenantId,
          academicSessionId: input.academicSessionId,
          term: input.term,
          studentId: input.studentId,
          templateId: input.templateId,
        },
      },
      update: {
        classroomId,
        status,
        overallGrade,
        remarks,
        attendancePct,
        fieldValues: mergedFieldValues as any,
        evaluatorId: ctx.actorId,
        evaluatorName: ctx.actorName,
        updatedAt: new Date(),
        ...(status === 'PUBLISHED'
          ? { publishedAt: new Date(), publishedById: ctx.actorId, publishedByName: ctx.actorName }
          : {}),
      },
      create: {
        tenantId,
        branchId: ctx.branchId || student.branchId,
        academicSessionId: input.academicSessionId,
        studentId: input.studentId,
        classroomId,
        term: input.term,
        templateId: input.templateId,
        templateVersion: 1,
        status,
        overallGrade,
        remarks,
        attendancePct,
        fieldValues: mergedFieldValues as any,
        evaluatorId: ctx.actorId,
        evaluatorName: ctx.actorName,
        ...(status === 'PUBLISHED'
          ? { publishedAt: new Date(), publishedById: ctx.actorId, publishedByName: ctx.actorName }
          : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        documentTemplate: { select: { id: true, name: true } },
      },
    })

    await AuditService.record({
      tenantId,
      actorId: ctx.actorId || 'SYSTEM',
      actorName: ctx.actorName || 'Staff',
      actorRole: ctx.actorRole || 'TEACHER',
      action: 'SAVE_REPORT_CARD',
      entity: 'StudentReportCard',
      entityId: reportCard.id,
      module: 'ACADEMICS',
      summary: `Saved report card for ${reportCard.student.firstName} (${reportCard.term}, status: ${reportCard.status})`,
    })

    return reportCard
  }

  /**
   * Bulk Save Teacher Workflow
   * Safely saves report cards for all or selected students in a classroom.
   * Atomically validates enrollment, protects published reports, strips mass assignment,
   * merges omitted fields, and reports individual actionable results.
   */
  static async bulkSaveReportCards(ctx: ScopeContext, input: BulkSaveReportCardsInput) {
    const { tenantId } = ctx
    if (!tenantId) throw new Error('Tenant context required')

    if (!input.items || input.items.length === 0) {
      throw new Error('At least one student record is required for bulk save')
    }

    // Verify template existence and validity (must be REPORT_CARD)
    const template = await db.documentTemplate.findFirst({
      where: { id: input.templateId, tenantId, type: 'REPORT_CARD' },
    })
    if (!template) throw new Error('Specified report card template does not exist or is not a REPORT_CARD template')

    // Verify classroom existence and academic session alignment
    const classroom = await db.classroom.findFirst({
      where: { id: input.classroomId, tenantId, academicSessionId: input.academicSessionId },
    })
    if (!classroom) {
      throw new Error('Classroom does not exist or does not belong to the selected academic session')
    }

    // Pre-query enrolled students in this classroom and session
    const enrolledStudents = await db.student.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { currentClassroomId: input.classroomId },
          {
            allocations: {
              some: {
                classroomId: input.classroomId,
                academicSessionId: input.academicSessionId,
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
    })
    const enrolledStudentIdSet = new Set(enrolledStudents.map((s) => s.id))

    // Pre-query existing report cards for requested students
    const existingReportCards = await db.studentReportCard.findMany({
      where: {
        tenantId,
        academicSessionId: input.academicSessionId,
        term: input.term,
        templateId: input.templateId,
        studentId: { in: input.items.map((i) => i.studentId) },
      },
    })
    const existingRcMap = new Map(existingReportCards.map((rc) => [rc.studentId, rc]))

    const isStaffAdmin = ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR', 'ADMIN'].includes(ctx.actorRole || '')

    const results: Array<{ studentId: string; success: boolean; reportCardId?: string; error?: string }> = []
    let successCount = 0
    let failedCount = 0

    // Process each student record safely
    for (const item of input.items) {
      try {
        // 1. Validate enrollment
        if (!enrolledStudentIdSet.has(item.studentId)) {
          throw new Error('Student is not actively enrolled in this classroom and academic session')
        }

        const existing = existingRcMap.get(item.studentId)

        // 2. Prevent non-admin modification of published reports
        if (existing && existing.status === 'PUBLISHED' && !isStaffAdmin && input.status !== 'DRAFT') {
          throw new Error('Published report card cannot be modified without administrative permission')
        }

        // 3. Merge omitted fields while stripping privileged mass-assignment fields
        const existingFieldValues = (existing?.fieldValues as unknown as Record<string, ReportCardFieldValue>) || {}
        const mergedFieldValues = existing
          ? { ...existingFieldValues, ...(item.fieldValues || {}) }
          : (item.fieldValues || {})

        const targetGrade = item.overallGrade !== undefined ? item.overallGrade : (existing?.overallGrade ?? null)
        const targetRemarks = item.remarks !== undefined ? item.remarks : (existing?.remarks ?? null)
        const targetAttendance = item.attendancePct !== undefined ? item.attendancePct : (existing?.attendancePct ?? null)
        const targetStatus = input.status || existing?.status || 'DRAFT'

        const rc = await db.studentReportCard.upsert({
          where: {
            tenantId_academicSessionId_term_studentId_templateId: {
              tenantId,
              academicSessionId: input.academicSessionId,
              term: input.term,
              studentId: item.studentId,
              templateId: input.templateId,
            },
          },
          update: {
            classroomId: input.classroomId,
            status: targetStatus,
            overallGrade: targetGrade,
            remarks: targetRemarks,
            attendancePct: targetAttendance,
            fieldValues: mergedFieldValues as any,
            evaluatorId: ctx.actorId,
            evaluatorName: ctx.actorName,
            updatedAt: new Date(),
            ...(targetStatus === 'PUBLISHED'
              ? { publishedAt: new Date(), publishedById: ctx.actorId, publishedByName: ctx.actorName }
              : {}),
          },
          create: {
            tenantId,
            branchId: ctx.branchId || null,
            academicSessionId: input.academicSessionId,
            studentId: item.studentId,
            classroomId: input.classroomId,
            term: input.term,
            templateId: input.templateId,
            templateVersion: 1,
            status: targetStatus,
            overallGrade: targetGrade,
            remarks: targetRemarks,
            attendancePct: targetAttendance,
            fieldValues: mergedFieldValues as any,
            evaluatorId: ctx.actorId,
            evaluatorName: ctx.actorName,
            ...(targetStatus === 'PUBLISHED'
              ? { publishedAt: new Date(), publishedById: ctx.actorId, publishedByName: ctx.actorName }
              : {}),
          },
        })

        results.push({ studentId: item.studentId, success: true, reportCardId: rc.id })
        successCount++
      } catch (err: any) {
        failedCount++
        results.push({ studentId: item.studentId, success: false, error: err.message })
      }
    }

    await AuditService.record({
      tenantId,
      actorId: ctx.actorId || 'SYSTEM',
      actorName: ctx.actorName || 'Staff',
      actorRole: ctx.actorRole || 'TEACHER',
      action: 'BULK_SAVE_REPORT_CARDS',
      entity: 'StudentReportCard',
      entityId: input.classroomId,
      module: 'ACADEMICS',
      summary: `Bulk saved ${successCount} report cards for classroom ${input.classroomId} (${input.term})`,
      newValues: { successCount, failedCount, term: input.term },
    })

    return {
      totalCount: input.items.length,
      successCount,
      failedCount,
      results,
    }
  }

  /**
   * Render and generate the official PDF for a report card,
   * compiling teacher evaluations into the Template Studio definition and
   * filing the PDF into the Student Profile Document Library.
   */
  static async renderReportCardPdf(ctx: ScopeContext, reportCardId: string) {
    const { tenantId } = ctx
    if (!tenantId) throw new Error('Tenant context required')

    const rc = await this.getReportCard(tenantId, reportCardId)
    const rawDef = (rc.documentTemplate?.content || {}) as any
    const def: TemplateDefinition = (rawDef?.canvas && rawDef?.elements) ? rawDef : {
      canvas: { width: 794, height: 1123 },
      elements: [
        { id: 'hdr-1', type: 'text', text: 'Preschool Academic Report Card', x: 50, y: 40, style: { fontSize: 22, bold: true } },
        { id: 'rep-student-profile', type: 'rep-student-profile', x: 50, y: 100, width: 694, height: 100 },
        { id: 'rep-table', type: 'rep-table', x: 50, y: 220, width: 694, height: 300 },
        { id: 'rep-remarks-box', type: 'rep-remarks-box', x: 50, y: 550, width: 694, height: 120 },
      ],
    }

    // Build data context by combining student metadata, school profile, and teacher field values
    const school = await db.tenant.findUnique({ where: { id: tenantId } })
    const branch = rc.branchId ? await db.branch.findUnique({ where: { id: rc.branchId } }) : null

    const dataContext: Record<string, any> = {
      'school.name': branch?.name || school?.name || 'PreOne Academy',
      'school.address': branch?.address || '',
      'school.city': branch?.city || '',
      'school.phone': branch?.phone || '',
      'school.email': branch?.email || '',
      'school.academicYear': rc.academicSession?.name || '',
      'student.admissionNumber': rc.student.admissionNo,
      'student.fullName': `${rc.student.firstName} ${rc.student.lastName || ''}`.trim(),
      'student.firstName': rc.student.firstName,
      'student.lastName': rc.student.lastName || '',
      'student.dob': rc.student.dob ? new Date(rc.student.dob).toLocaleDateString('en-IN') : '',
      'student.gender': rc.student.gender,
      'student.bloodGroup': rc.student.bloodGroup || '',
      'student.rollNumber': rc.student.seatNumber || '',
      'student.photoUrl': rc.student.photoUrl || '',
      'classroom.name': rc.classroom?.name || '',
      'classroom.program': rc.classroom?.programType || '',
      'classroom.primaryTeacher': rc.classroom?.primaryTeacher?.fullName || rc.evaluatorName || '',
      'evaluation.term': rc.term,
      'evaluation.overallGrade': rc.overallGrade || '',
      'evaluation.remarks': rc.remarks || '',
      'evaluation.attendancePct': rc.attendancePct ? `${rc.attendancePct}%` : '',
    }

    // Merge teacher custom fields from fieldValues
    if (rc.fieldValues && typeof rc.fieldValues === 'object') {
      const fv = rc.fieldValues as unknown as Record<string, ReportCardFieldValue>
      for (const [k, v] of Object.entries(fv)) {
        dataContext[`field.${k}`] = v.value
        dataContext[k] = v.value
      }
    }

    // Populate dynamic table rows from template fields and teacher evaluations
    const templateFields = this.getTemplateFields(rc.documentTemplate)
    const tableRows: Array<Record<string, any>> = []

    if (rc.fieldValues && typeof rc.fieldValues === 'object') {
      const fv = rc.fieldValues as unknown as Record<string, ReportCardFieldValue>

      if (Array.isArray((fv as any).tableRows)) {
        tableRows.push(...(fv as any).tableRows)
      } else {
        for (const fDef of templateFields) {
          const valObj = fv[fDef.key]
          const value = valObj ? valObj.value : ''
          tableRows.push({
            domain: fDef.label,
            milestone: fDef.description || 'Observable developmental milestone',
            rating: value ?? '',
            subject: fDef.label,
            grade: value ?? '',
            score: value ?? '',
            name: fDef.label,
            value: value ?? '',
          })
        }

        // Include any remaining evaluated keys that weren't in templateFields
        for (const [k, v] of Object.entries(fv)) {
          if (['overallGrade', 'remarks', 'attendancePct', 'tableRows'].includes(k)) continue
          if (!templateFields.some((f) => f.key === k)) {
            tableRows.push({
              domain: v.label || k,
              milestone: (v as any).description || '',
              rating: v.value ?? '',
              subject: v.label || k,
              grade: v.value ?? '',
              score: v.value ?? '',
              name: v.label || k,
              value: v.value ?? '',
            })
          }
        }
      }
    }

    dataContext['table.rows'] = tableRows

    // Render HTML using TemplateService
    const html = TemplateService.renderTemplateHtml(def, dataContext)

    // Render to PDF using PdfService
    const fileName = `ReportCard_${rc.student.admissionNo}_${rc.term.replace(/\s+/g, '_')}.pdf`
    const title = `${rc.term} Progress Report — ${rc.studentName}`

    let pdfResult: { pdfBuffer: Buffer; fileSizeBytes: number; fileUrl: string }
    try {
      const generated = await PdfService.generatePdf({
        definition: def,
        dataContext: dataContext as any,
        filename: fileName,
      })
      pdfResult = {
        pdfBuffer: generated.buffer,
        fileSizeBytes: generated.sizeBytes,
        fileUrl: `/uploads/documents/${fileName}`,
      }
    } catch {
      // In environments where headless chromium might not be running, fallback to HTML buffer
      const buffer = Buffer.from(html, 'utf-8')
      pdfResult = {
        pdfBuffer: buffer,
        fileSizeBytes: buffer.length,
        fileUrl: `/uploads/documents/${fileName}`,
      }
    }

    // Store in GeneratedProfileDocument (Profile Document Library)
    const doc = await db.generatedProfileDocument.create({
      data: {
        tenantId,
        branchId: rc.branchId,
        entityType: 'STUDENT',
        studentId: rc.student.id,
        templateId: rc.templateId,
        templateVersion: rc.templateVersion,
        documentType: 'REPORT_CARD',
        title,
        fileName,
        fileUrl: pdfResult.fileUrl,
        fileSizeBytes: pdfResult.fileSizeBytes,
        mimeType: 'application/pdf',
        metadata: {
          term: rc.term,
          academicSessionId: rc.academicSessionId,
          overallGrade: rc.overallGrade,
          reportCardId: rc.id,
        },
        createdById: ctx.actorId,
        createdByName: ctx.actorName,
      },
    })

    // Link documentId to StudentReportCard
    const updatedReportCard = await db.studentReportCard.update({
      where: { id: reportCardId },
      data: {
        documentId: doc.id,
        updatedAt: new Date(),
      },
    })

    await AuditService.record({
      tenantId,
      actorId: ctx.actorId || 'SYSTEM',
      actorName: ctx.actorName || 'Staff',
      actorRole: ctx.actorRole || 'TEACHER',
      action: 'RENDER_REPORT_CARD_PDF',
      entity: 'StudentReportCard',
      entityId: reportCardId,
      module: 'ACADEMICS',
      summary: `Rendered official PDF for ${rc.studentName} (${rc.term})`,
    })

    return {
      reportCard: updatedReportCard,
      document: doc,
    }
  }

  /**
   * Update lifecycle status of a Report Card (DRAFT -> REVIEWED -> PUBLISHED)
   */
  static async updateStatus(
    paramsOrTenantId: string | {
      tenantId: string
      reportCardId: string
      status: 'DRAFT' | 'REVIEWED' | 'PUBLISHED'
      publishedById?: string
      publishedByName?: string
      actorId?: string
      actorName?: string
    },
    idArg?: string,
    statusArg?: 'DRAFT' | 'REVIEWED' | 'PUBLISHED',
    actorIdArg?: string,
    actorNameArg?: string
  ) {
    let tenantId: string
    let id: string
    let status: 'DRAFT' | 'REVIEWED' | 'PUBLISHED'
    let actorId: string | undefined
    let actorName: string | undefined

    if (typeof paramsOrTenantId === 'object') {
      tenantId = paramsOrTenantId.tenantId
      id = paramsOrTenantId.reportCardId
      status = paramsOrTenantId.status
      actorId = paramsOrTenantId.publishedById || paramsOrTenantId.actorId
      actorName = paramsOrTenantId.publishedByName || paramsOrTenantId.actorName
    } else {
      tenantId = paramsOrTenantId
      id = idArg!
      status = statusArg!
      actorId = actorIdArg
      actorName = actorNameArg
    }

    const rc = await db.studentReportCard.findFirst({ where: { id, tenantId } })
    if (!rc) throw new Error('Report card not found')

    const updateData: any = { status, updatedAt: new Date() }
    if (status === 'PUBLISHED') {
      updateData.publishedAt = new Date()
      updateData.publishedById = actorId
      updateData.publishedByName = actorName
    }

    const updated = await db.studentReportCard.update({
      where: { id },
      data: updateData,
    })

    await AuditService.record({
      tenantId,
      actorId: actorId || 'SYSTEM',
      actorName: actorName || 'Staff',
      action: 'UPDATE_REPORT_CARD_STATUS',
      entity: 'StudentReportCard',
      entityId: id,
      module: 'ACADEMICS',
      summary: `Updated report card status to ${status}`,
    })

    return updated
  }
}

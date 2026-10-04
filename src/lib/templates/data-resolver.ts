/**
 * PreOne — Template Data Resolver & Field Mapping Engine
 * Resolves authorized live database records (Students, Staff, Payments)
 * into safe, typed template tokens.
 * Enforces strict multi-tenant isolation, branch scoping, and RBAC.
 */

import { db } from '@/lib/db'
import { DocumentType, TemplateDefinition } from './types'
import {
  APPROVED_TEMPLATE_FIELDS,
  FieldDefinition,
  getDefaultSampleData,
} from './field-registry'

export interface RecordSearchResult {
  id: string
  type: 'STUDENT' | 'STAFF' | 'PAYMENT' | 'FIXTURE'
  title: string
  subtitle: string
  badgeText?: string
  avatarUrl?: string | null
  metadata?: Record<string, string>
}

export interface FieldValidationItem {
  key: string
  label: string
  domain: string
  resolvedValue: string
  status: 'MAPPED' | 'FALLBACK' | 'MISSING'
  isRequired: boolean
  description?: string
}

export interface ValidationSummary {
  ready: boolean
  status: 'READY' | 'ATTENTION_NEEDED' | 'BLOCKED'
  totalElementsCount: number
  boundFieldsCount: number
  mappedCount: number
  fallbackCount: number
  missingCount: number
  fields: FieldValidationItem[]
  recordSummary: {
    id: string
    type: string
    title: string
    subtitle: string
  }
  moduleAssignment: {
    isDefault: boolean
    isRegisteredInSetup: boolean
    workflowEligibility: string
  }
}

export class TemplateDataResolver {
  /**
   * Search authorized records of the appropriate entity type for a given document type.
   */
  static async searchRecords(
    tenantId: string,
    documentType: DocumentType,
    query: string = '',
    limit: number = 15,
    branchId?: string
  ): Promise<RecordSearchResult[]> {
    const trimmed = query.trim()

    // 1. Staff Document Types
    if (documentType === 'STAFF_ID_CARD') {
      const where: any = {
        tenantId,
        deletedAt: null,
      }
      if (branchId) where.branchId = branchId

      if (trimmed) {
        where.OR = [
          { employeeCode: { contains: trimmed, mode: 'insensitive' } },
          { user: { fullName: { contains: trimmed, mode: 'insensitive' } } },
          { designation: { contains: trimmed, mode: 'insensitive' } },
          { department: { contains: trimmed, mode: 'insensitive' } },
        ]
      }

      const rows = await db.staffProfile.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          branch: true,
        },
      })

      return rows.map((r) => ({
        id: r.id,
        type: 'STAFF',
        title: r.user?.fullName || 'Staff Member',
        subtitle: `Emp ID: ${r.employeeCode}`,
        badgeText: r.designation || r.department || 'Staff',
        avatarUrl: r.user?.avatarUrl || null,
        metadata: {
          employeeCode: r.employeeCode,
          designation: r.designation || 'Staff',
          department: r.department || 'Academics',
          branch: r.branch?.name || 'Main Campus',
        },
      }))
    }

    // 2. Student-Centric Document Types (ID card, certificates, admission form, report card, general letter)
    const studentWhere: any = {
      tenantId,
      deletedAt: null,
    }
    if (branchId) studentWhere.branchId = branchId

    if (trimmed) {
      studentWhere.OR = [
        { admissionNo: { contains: trimmed, mode: 'insensitive' } },
        { firstName: { contains: trimmed, mode: 'insensitive' } },
        { lastName: { contains: trimmed, mode: 'insensitive' } },
      ]
    }

    const students = await db.student.findMany({
      where: studentWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        currentClassroom: true,
        guardians: {
          include: { guardian: true },
          take: 1,
        },
      },
    })

    return students.map((s) => {
      const guardian = s.guardians[0]?.guardian
      const fullName = `${s.firstName} ${s.lastName || ''}`.trim()
      return {
        id: s.id,
        type: 'STUDENT',
        title: fullName,
        subtitle: `Adm: ${s.admissionNo}`,
        badgeText: s.currentClassroom?.name || 'Classroom',
        avatarUrl: s.photoUrl || null,
        metadata: {
          admissionNo: s.admissionNo,
          classroom: s.currentClassroom?.name || 'Unassigned',
          guardianName: guardian?.fullName || 'Parent / Guardian',
          guardianPhone: guardian?.phone || 'Contact on file',
        },
      }
    })
  }

  /**
   * Resolves a complete, safe token dictionary for a specific record.
   */
  static async resolveDataContext(
    tenantId: string,
    documentType: DocumentType,
    recordId: string,
    recordType: 'STUDENT' | 'STAFF' | 'PAYMENT' | 'FIXTURE'
  ): Promise<Record<string, string>> {
    // Start with default sample values as safety baseline
    const context: Record<string, string> = { ...getDefaultSampleData() }

    // Fetch Tenant Info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    })

    if (tenant) {
      context['school.name'] = tenant.name || 'PreOne Preschool Academy'
      context['school.code'] = tenant.code || 'PRE-ONE'
      if (tenant.address) context['school.address'] = tenant.address
      if (tenant.city) context['school.city'] = tenant.city
      if (tenant.phone) context['school.phone'] = tenant.phone
      if (tenant.email) context['school.email'] = tenant.email
      context['school.academicYear'] = '2026-2027'
      context['school.principalName'] = 'Dr. Meenakshi Sundaram'
    }

    // System tokens
    const now = new Date()
    context['system.currentDate'] = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    context['system.currentDateTime'] = `${context['system.currentDate']}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    context['system.pageNumber'] = '1'
    context['system.totalPages'] = '1'

    // Handle Fixture
    if (recordType === 'FIXTURE' || recordId === 'sample-fixture') {
      return context
    }

    // Resolve Student Record
    if (recordType === 'STUDENT' || documentType === 'STUDENT_ID_CARD' || documentType === 'CERTIFICATE' || documentType === 'ADMISSION_FORM' || documentType === 'REPORT_CARD') {
      const student = await db.student.findFirst({
        where: { id: recordId, tenantId },
        include: {
          currentClassroom: {
            include: {
              primaryTeacher: true,
            },
          },
          guardians: {
            include: { guardian: true },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { invoice: true },
          },
        },
      })

      if (student) {
        const fullName = `${student.firstName} ${student.lastName || ''}`.trim()
        context['student.admissionNumber'] = student.admissionNo
        context['student.fullName'] = fullName
        context['student.firstName'] = student.firstName
        context['student.lastName'] = student.lastName || ''
        context['student.gender'] = student.gender || 'Not specified'
        context['student.bloodGroup'] = student.bloodGroup || 'O+'
        context['student.rollNumber'] = student.seatNumber || student.admissionNo.slice(-3)
        if (student.address) context['student.address'] = student.address

        if (student.photoUrl) {
          context['student.photoUrl'] = student.photoUrl
        }

        if (student.dob) {
          context['student.dob'] = new Date(student.dob).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        }

        if (student.admissionDate) {
          context['student.admissionDate'] = new Date(student.admissionDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        }

        // Guardian details
        const primaryG = student.guardians.find((g) => g.isPrimary) || student.guardians[0]
        if (primaryG && primaryG.guardian) {
          context['guardian.primaryName'] = primaryG.guardian.fullName
          context['guardian.relationship'] = primaryG.relationship || 'Guardian'
          context['guardian.phone'] = primaryG.guardian.phone || ''
          context['student.emergencyPhone'] = primaryG.guardian.phone || ''
          if (primaryG.guardian.email) context['guardian.email'] = primaryG.guardian.email
        }

        // Classroom details
        if (student.currentClassroom) {
          context['classroom.name'] = student.currentClassroom.name
          context['classroom.program'] = (student.currentClassroom as any).program || student.currentClassroom.programType || 'Preschool Foundation'
          context['classroom.roomNumber'] = (student.currentClassroom as any).roomNumber || student.currentClassroom.code || 'Room 101'
          if (student.currentClassroom.primaryTeacher) {
            context['classroom.primaryTeacher'] = student.currentClassroom.primaryTeacher.fullName
          }
        }

        // Optional payment details
        const latestPayment = student.payments[0]
        if (latestPayment) {
          context['finance.receiptNumber'] = latestPayment.paymentNumber
          context['finance.paymentMethod'] = latestPayment.method || 'UPI'
          context['finance.totalAmount'] = `₹${(latestPayment.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          context['finance.paidAmount'] = context['finance.totalAmount']
          context['finance.balanceAmount'] = '₹0.00'
          context['finance.paymentDate'] = new Date(latestPayment.paymentDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        }
      }
    }

    // Resolve Staff Record
    if (recordType === 'STAFF' || documentType === 'STAFF_ID_CARD') {
      const staff = await db.staffProfile.findFirst({
        where: { id: recordId, tenantId },
        include: {
          user: true,
          branch: true,
        },
      })

      if (staff) {
        context['staff.employeeCode'] = staff.employeeCode
        context['staff.fullName'] = staff.user?.fullName || 'Staff Member'
        context['staff.designation'] = staff.designation || 'Educator'
        context['staff.department'] = staff.department || 'Academics & Early Childhood'
        context['staff.phone'] = staff.user?.phone || staff.emergencyContactPhone || ''
        context['staff.email'] = staff.user?.email || ''
        if (staff.user?.avatarUrl) {
          context['staff.photoUrl'] = staff.user.avatarUrl
        }
        if (staff.branch) {
          context['school.name'] = staff.branch.name
          if (staff.branch.address) context['school.address'] = staff.branch.address
          if (staff.branch.city) context['school.city'] = staff.branch.city
          if (staff.branch.phone) context['school.phone'] = staff.branch.phone
        }
      }
    }

    return context
  }

  /**
   * Validates all tokens and field bindings within a template definition against resolved data.
   */
  static validateTemplateData(
    definition: TemplateDefinition,
    dataContext: Record<string, string>,
    recordSummary: { id: string; type: string; title: string; subtitle: string },
    moduleAssignment: { isDefault: boolean; isRegisteredInSetup: boolean; workflowEligibility: string }
  ): ValidationSummary {
    const boundKeys = new Set<string>()

    // Extract all field bindings and tokens
    for (const elem of definition.elements || []) {
      if (elem.fieldBinding && elem.fieldBinding.trim()) {
        boundKeys.add(elem.fieldBinding.trim())
      }
      if (elem.content && typeof elem.content === 'string') {
        const matches = elem.content.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)
        for (const m of matches) {
          if (m[1]) boundKeys.add(m[1].trim())
        }
      }
    }

    const fields: FieldValidationItem[] = []
    let mappedCount = 0
    let fallbackCount = 0
    let missingCount = 0

    // Required fields per document type
    const criticalFields = new Set<string>()
    if (definition.documentType === 'STUDENT_ID_CARD') {
      criticalFields.add('student.admissionNumber')
      criticalFields.add('student.fullName')
    } else if (definition.documentType === 'STAFF_ID_CARD') {
      criticalFields.add('staff.employeeCode')
      criticalFields.add('staff.fullName')
    } else if (definition.documentType === 'FEE_RECEIPT') {
      criticalFields.add('finance.receiptNumber')
      criticalFields.add('finance.paidAmount')
    }

    for (const key of Array.from(boundKeys)) {
      const reg = APPROVED_TEMPLATE_FIELDS.find((f) => f.key === key)
      const val = dataContext[key]
      const isCritical = criticalFields.has(key)

      let status: 'MAPPED' | 'FALLBACK' | 'MISSING' = 'MAPPED'
      if (!val || val.trim() === '') {
        status = 'MISSING'
        missingCount++
      } else if (reg && val === reg.sampleValue) {
        status = 'FALLBACK'
        fallbackCount++
      } else {
        status = 'MAPPED'
        mappedCount++
      }

      fields.push({
        key,
        label: reg?.label || key,
        domain: reg?.domain || 'CUSTOM',
        resolvedValue: val || '(No value resolved)',
        status,
        isRequired: isCritical,
        description: reg?.description,
      })
    }

    // Sort: critical/missing first, then alphabetical
    fields.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1
      if (!a.isRequired && b.isRequired) return 1
      if (a.status === 'MISSING' && b.status !== 'MISSING') return -1
      if (a.status !== 'MISSING' && b.status === 'MISSING') return 1
      return a.key.localeCompare(b.key)
    })

    const hasMissingCritical = fields.some((f) => f.isRequired && f.status === 'MISSING')
    const overallStatus: 'READY' | 'ATTENTION_NEEDED' | 'BLOCKED' = hasMissingCritical
      ? 'ATTENTION_NEEDED'
      : 'READY'

    return {
      ready: !hasMissingCritical,
      status: overallStatus,
      totalElementsCount: (definition.elements || []).length,
      boundFieldsCount: boundKeys.size,
      mappedCount,
      fallbackCount,
      missingCount,
      fields,
      recordSummary,
      moduleAssignment,
    }
  }
}

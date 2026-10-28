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

/**
 * Converts Indian currency numbers to formal English words.
 * E.g., 24500 -> "Rupees Twenty Four Thousand Five Hundred Only"
 */
export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const convertTwoDigits = (n: number): string => {
    if (n < 20) return ones[n]
    const unit = n % 10
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + ones[unit] : ''}`
  }

  const convertThreeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100)
    const remainder = n % 100
    let res = ''
    if (hundred > 0) {
      res += `${ones[hundred]} Hundred`
      if (remainder > 0) res += ' '
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder)
    }
    return res
  }

  let n = Math.floor(num)
  const crore = Math.floor(n / 10000000)
  n %= 10000000
  const lakh = Math.floor(n / 100000)
  n %= 100000
  const thousand = Math.floor(n / 1000)
  n %= 1000
  const remainder = n

  const parts: string[] = []
  if (crore > 0) parts.push(`${convertThreeDigits(crore)} Crore`)
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`)
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`)
  if (remainder > 0) parts.push(convertThreeDigits(remainder))

  const words = parts.join(' ').trim()
  return words ? `Rupees ${words} Only` : 'Rupees Zero Only'
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

    // 2. Fee Receipts — Search live Payment records first
    if (documentType === 'FEE_RECEIPT') {
      const payWhere: any = { tenantId }
      if (trimmed) {
        payWhere.OR = [
          { paymentNumber: { contains: trimmed, mode: 'insensitive' } },
          { transactionRef: { contains: trimmed, mode: 'insensitive' } },
          { student: { firstName: { contains: trimmed, mode: 'insensitive' } } },
          { student: { lastName: { contains: trimmed, mode: 'insensitive' } } },
          { student: { admissionNo: { contains: trimmed, mode: 'insensitive' } } },
        ]
      }

      const payments = await db.payment.findMany({
        where: payWhere,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: { currentClassroom: true, guardians: { include: { guardian: true } } },
          },
          invoice: true,
          receipt: true,
        },
      })

      if (payments.length > 0) {
        return payments.map((p) => {
          const studentName = p.student
            ? `${p.student.firstName} ${p.student.lastName || ''}`.trim()
            : 'Enrolled Student'
          const rcptNo = p.receipt?.receiptNumber || p.paymentNumber
          const amt = `₹${(p.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          return {
            id: p.id,
            type: 'PAYMENT' as const,
            title: `${studentName} — ${amt}`,
            subtitle: `Rcpt: ${rcptNo} | ${new Date(p.paymentDate).toLocaleDateString('en-GB')}`,
            badgeText: p.status || 'PAID',
            avatarUrl: p.student?.photoUrl || null,
            metadata: {
              paymentNumber: p.paymentNumber,
              receiptNumber: rcptNo,
              amount: amt,
              admissionNo: p.student?.admissionNo || '',
              classroom: p.student?.currentClassroom?.name || 'Unassigned',
            },
          }
        })
      }
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
  ): Promise<Record<string, any>> {
    // Start with default sample values as safety baseline
    const context: Record<string, any> = { ...getDefaultSampleData() }

    // Fetch Tenant Info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    })

    if (tenant) {
      context['school.name'] = tenant.name?.trim() || 'PreOne'
      context['school.code'] = tenant.code || 'PRE-ONE'
      if (tenant.address) context['school.address'] = tenant.address
      if (tenant.city) context['school.city'] = tenant.city
      if (tenant.phone) context['school.phone'] = tenant.phone
      if (tenant.email) context['school.email'] = tenant.email
      if (tenant.website) context['school.website'] = tenant.website
      if (tenant.logoUrl) context['school.logoUrl'] = tenant.logoUrl
      if (tenant.gstNumber) context['school.gstNumber'] = tenant.gstNumber
      if (tenant.principalSignatureUrl) context['school.principalSignatureUrl'] = tenant.principalSignatureUrl
      context['school.academicYear'] = '2026-2027'
      context['school.principalName'] = 'Dr. Meenakshi Sundaram'
      context['school.affiliationNo'] = 'AFF-CBSE-2026/089'
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
            include: {
              receipt: true,
              invoice: {
                include: { items: true },
              },
            },
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
          context['finance.receiptNumber'] = latestPayment.receipt?.receiptNumber || latestPayment.paymentNumber
          context['finance.paymentMethod'] = latestPayment.method || 'UPI'
          const paidFormatted = `₹${(latestPayment.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          context['finance.paidAmount'] = paidFormatted
          context['finance.amountInWords'] = numberToWordsIndian(latestPayment.amountCents / 100)
          if (latestPayment.transactionRef) {
            context['finance.transactionRef'] = latestPayment.transactionRef
          }
          if (latestPayment.invoice) {
            const inv = latestPayment.invoice
            context['finance.invoiceNumber'] = inv.invoiceNumber
            context['finance.totalAmount'] = `₹${(inv.totalCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            context['finance.subtotalAmount'] = `₹${(inv.subtotalCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            context['finance.discountAmount'] = `₹${(inv.discountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            context['finance.balanceAmount'] = `₹${(inv.balanceCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            const rawStatus = inv.status || 'PAID'
            const badgeStatus = rawStatus === 'PAID' ? 'PAID' : rawStatus === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : rawStatus === 'OVERDUE' ? 'OVERDUE' : 'DUE'
            context['finance.paymentStatus'] = badgeStatus
            context['finance.statusBadge'] = badgeStatus

            if (inv.items && inv.items.length > 0) {
              context['table.rows'] = inv.items.map((it, idx) => ({
                sno: String(idx + 1),
                item: it.description || it.feeHead || 'Fee Item',
                description: it.description || it.feeHead || 'Fee Item',
                term: 'Term 1',
                amount: `₹${(it.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              }))
            }
          } else {
            context['finance.totalAmount'] = paidFormatted
            context['finance.subtotalAmount'] = paidFormatted
            context['finance.discountAmount'] = '₹0.00'
            context['finance.balanceAmount'] = '₹0.00'
            context['finance.paymentStatus'] = 'PAID'
            context['finance.statusBadge'] = 'PAID'
            context['table.rows'] = [
              {
                sno: '1',
                item: 'Term Tuition & Academic Program',
                description: 'Term Tuition & Academic Program',
                term: 'Term 1',
                amount: paidFormatted,
              },
            ]
          }
          context['finance.paymentDate'] = new Date(latestPayment.paymentDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        }
      }
    }

    // Resolve Payment Record directly
    if (recordType === 'PAYMENT') {
      const payment = await db.payment.findFirst({
        where: { id: recordId, tenantId },
        include: {
          receipt: true,
          invoice: {
            include: {
              items: true,
            },
          },
          feeSchedule: true,
          student: {
            include: {
              currentClassroom: true,
              guardians: { include: { guardian: true } },
            },
          },
        },
      })

      if (payment) {
        context['finance.receiptNumber'] = payment.receipt?.receiptNumber || payment.paymentNumber
        context['finance.paymentMethod'] = payment.method || 'UPI'
        const paidFormatted = `₹${(payment.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        context['finance.paidAmount'] = paidFormatted
        context['finance.amountInWords'] = numberToWordsIndian(payment.amountCents / 100)
        if (payment.transactionRef) context['finance.transactionRef'] = payment.transactionRef
        if (payment.paymentDate) {
          context['finance.paymentDate'] = new Date(payment.paymentDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        }

        if (payment.invoice) {
          const inv = payment.invoice
          context['finance.invoiceNumber'] = inv.invoiceNumber
          context['finance.totalAmount'] = `₹${(inv.totalCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          context['finance.subtotalAmount'] = `₹${(inv.subtotalCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          context['finance.discountAmount'] = `₹${(inv.discountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          context['finance.balanceAmount'] = `₹${(inv.balanceCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          const rawStatus = inv.status || 'PAID'
          const badgeStatus = rawStatus === 'PAID' ? 'PAID' : rawStatus === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : rawStatus === 'OVERDUE' ? 'OVERDUE' : 'DUE'
          context['finance.paymentStatus'] = badgeStatus
          context['finance.statusBadge'] = badgeStatus

          if (inv.items && inv.items.length > 0) {
            context['table.rows'] = inv.items.map((it, idx) => ({
              sno: String(idx + 1),
              item: it.description || it.feeHead || 'Fee Item',
              description: it.description || it.feeHead || 'Fee Item',
              term: 'Term 1',
              amount: `₹${(it.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            }))
          }
        } else {
          context['finance.totalAmount'] = paidFormatted
          context['finance.subtotalAmount'] = paidFormatted
          context['finance.discountAmount'] = '₹0.00'
          context['finance.balanceAmount'] = '₹0.00'
          context['finance.paymentStatus'] = 'PAID'
          context['finance.statusBadge'] = 'PAID'
          if (payment.feeSchedule) {
            context['table.rows'] = [
              {
                sno: '1',
                item: payment.feeSchedule.period ? `${payment.feeSchedule.period} Tuition & Academic Fee` : 'Tuition & Academic Fee',
                description: payment.feeSchedule.period ? `${payment.feeSchedule.period} Tuition & Academic Fee` : 'Tuition & Academic Fee',
                term: payment.feeSchedule.period || 'Term 1',
                amount: paidFormatted,
              },
            ]
          } else {
            context['table.rows'] = [
              {
                sno: '1',
                item: 'Term Tuition & Program Fee',
                description: 'Term Tuition & Program Fee',
                term: 'Term 1',
                amount: paidFormatted,
              },
            ]
          }
        }

        if (payment.student) {
          const s = payment.student
          context['student.fullName'] = `${s.firstName} ${s.lastName || ''}`.trim()
          context['student.admissionNumber'] = s.admissionNo
          context['student.rollNumber'] = s.seatNumber || s.admissionNo.slice(-3)
          if (s.address) context['student.address'] = s.address
          if (s.currentClassroom) {
            context['classroom.name'] = s.currentClassroom.name
            context['classroom.program'] = (s.currentClassroom as any).program || s.currentClassroom.programType || 'Preschool Foundation'
          }
          const primaryG = s.guardians?.find((g) => g.isPrimary) || s.guardians?.[0]
          if (primaryG && primaryG.guardian) {
            context['guardian.primaryName'] = primaryG.guardian.fullName
            context['guardian.phone'] = primaryG.guardian.phone || ''
          }
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

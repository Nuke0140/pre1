import { db } from '@/lib/db'
import { StaffUserService } from './staff-user-service'
import { FamilyUserService, normalizeRelationship } from './family-user-service'
import { UserRole, Relationship, UserStatus, EmploymentType, Gender, ProgramType } from '@prisma/client'

/**
 * Sanitizes a cell against spreadsheet formula injection (=, +, -, @, \t, \r)
 */
export function sanitizeCsvCell(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""'
  let s = String(val).trim()
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`
  }
  return `"${s.replace(/"/g, '""')}"`
}

export function sanitizeInputCellValue(val: string): string {
  if (!val) return ''
  let cleaned = val.replace(/^["']|["']$/g, '').trim()
  if (/^[=+\-@]/.test(cleaned)) {
    cleaned = cleaned.replace(/^[=+\-@]+/, '').trim()
  }
  return cleaned
}

export function parseCsvString(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim())

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i])
    const rowObj: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j]
      const val = rawValues[j] !== undefined ? sanitizeInputCellValue(rawValues[j]) : ''
      rowObj[h] = val
    }
    rows.push(rowObj)
  }

  return { headers, rows }
}

export interface CsvPreviewRow {
  rowNumber: number
  status: 'VALID' | 'WARNING' | 'BLOCKED'
  action: 'CREATE' | 'LINK' | 'SKIP' | 'BLOCK'
  identifier: string
  name: string
  role: string
  details: string
  errors: string[]
  warnings: string[]
  data: Record<string, any>
}

export interface CsvPreviewResult {
  templateType: 'STAFF' | 'FAMILY'
  totalRows: number
  validRows: number
  warningRows: number
  blockedRows: number
  rows: CsvPreviewRow[]
}

export class UserCsvEngine {
  /**
   * Generates downloadable Staff CSV template
   */
  static getStaffTemplate(): string {
    const headers = [
      'username',
      'fullName',
      'email',
      'phone',
      'role',
      'branchCode',
      'employeeCode',
      'designation',
      'department',
      'joiningDate',
    ]

    const sampleRows = [
      ['ananya.sharma', 'Ananya Sharma', 'ananya.sharma@preschool.com', '+919876543210', 'TEACHER', 'MAIN', 'EMP-2026-01', 'Lead Montessori Teacher', 'Academics', '2026-06-01'],
      ['vikas.nair', 'Vikas Nair', 'vikas.nair@preschool.com', '+919876543211', 'ACCOUNTANT', 'MAIN', 'EMP-2026-02', 'Senior Accountant', 'Finance', '2026-05-15'],
      ['kavita.patil', 'Kavita Patil', 'kavita.patil@preschool.com', '+919876543212', 'HELPER', 'MAIN', 'EMP-2026-03', 'Classroom Assistant', 'Operations', '2026-06-10'],
      ['sunil.verma', 'Sunil Verma', 'sunil.verma@preschool.com', '+919876543213', 'DRIVER', 'MAIN', 'EMP-2026-04', 'School Bus Driver', 'Transport', '2026-05-01'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Generates downloadable Parent CSV template (max 2 per student)
   */
  static getParentTemplate(): string {
    const headers = [
      'username',
      'fullName',
      'email',
      'phone',
      'role',
      'branchCode',
      'studentAdmissionNo',
      'relationship',
      'canPickup',
      'receivesComm',
      'pickupPin',
    ]

    const sampleRows = [
      ['rahul01', 'Rahul Sharma', 'rahul@example.com', '+919876543210', 'PARENT', 'MAIN', 'PRE-1024', 'FATHER', 'true', 'true', '1234'],
      ['rahul01', 'Rahul Sharma', 'rahul@example.com', '+919876543210', 'PARENT', 'MAIN', 'PRE-1031', 'FATHER', 'true', 'true', '1234'],
      ['priya01', 'Priya Sharma', 'priya@example.com', '+919876543211', 'PARENT', 'MAIN', 'PRE-1024', 'MOTHER', 'true', 'true', '5678'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Generates downloadable Guardian CSV template (unlimited per student)
   */
  static getGuardianTemplate(): string {
    const headers = [
      'username',
      'fullName',
      'email',
      'phone',
      'role',
      'branchCode',
      'studentAdmissionNo',
      'relationship',
      'canPickup',
      'receivesComm',
      'pickupPin',
    ]

    const sampleRows = [
      ['sunita01', 'Sunita Sharma', 'sunita@example.com', '+919876543212', 'GUARDIAN', 'MAIN', 'PRE-1024', 'GRANDMOTHER', 'true', 'true', '4321'],
      ['ramesh.uncle', 'Ramesh Uncle', 'ramesh@example.com', '+919876543213', 'GUARDIAN', 'MAIN', 'PRE-1024', 'OTHER', 'true', 'false', '9988'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Generates downloadable Combined Parent + Guardian CSV template
   */
  static getFamilyTemplate(): string {
    const headers = [
      'username',
      'fullName',
      'email',
      'phone',
      'role',
      'branchCode',
      'studentAdmissionNo',
      'relationship',
      'canPickup',
      'receivesComm',
      'pickupPin',
    ]

    const sampleRows = [
      ['rahul01', 'Rahul Sharma', 'rahul@example.com', '+919876543210', 'PARENT', 'MAIN', 'PRE-1024', 'FATHER', 'true', 'true', '1234'],
      ['priya01', 'Priya Sharma', 'priya@example.com', '+919876543211', 'PARENT', 'MAIN', 'PRE-1024', 'MOTHER', 'true', 'true', '5678'],
      ['sunita01', 'Sunita Sharma', 'sunita@example.com', '+919876543212', 'GUARDIAN', 'MAIN', 'PRE-1024', 'GRANDMOTHER', 'true', 'true', '4321'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Preview & Validation for Staff CSV
   */
  static async previewStaffCsv(tenantId: string, csvContent: string): Promise<CsvPreviewResult> {
    const { rows } = parseCsvString(csvContent)
    const previewRows: CsvPreviewRow[] = []

    const seenEmails = new Set<string>()
    const seenPhones = new Set<string>()
    const seenUsernames = new Set<string>()

    const CANONICAL_STAFF_ROLES: UserRole[] = [
      'OWNER',
      'PRINCIPAL',
      'TEACHER',
      'HELPER',
      'ACCOUNTANT',
      'HR',
      'DRIVER',
    ]

    // Fetch branches in tenant for code matching
    const branches = await db.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, code: true, name: true },
    })
    const branchCodeMap = new Map<string, string>(branches.map((b) => [b.code.toUpperCase(), b.id]))

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      const username = r.username?.trim().toLowerCase() || ''
      const fullName = r.fullName?.trim() || ''
      const email = r.email?.trim().toLowerCase() || ''
      const phone = r.phone?.trim() || ''
      const roleStr = (r.role?.trim().toUpperCase() || 'TEACHER') as UserRole
      const branchCode = r.branchCode?.trim().toUpperCase() || ''

      if (!fullName) errors.push('Full name is missing')
      if (!email) {
        errors.push('Email is missing')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format')
      }

      // Check duplicate within CSV file
      if (email) {
        if (seenEmails.has(email)) {
          errors.push(`Duplicate email "${email}" found multiple times in CSV file`)
        } else {
          seenEmails.add(email)
        }
      }

      if (username) {
        if (seenUsernames.has(username)) {
          errors.push(`Duplicate username "${username}" found multiple times in CSV file`)
        } else {
          seenUsernames.add(username)
        }
      }

      if (phone) {
        if (seenPhones.has(phone)) {
          warnings.push(`Shared phone "${phone}" appears multiple times in file`)
        } else {
          seenPhones.add(phone)
        }
      }

      // Check branch
      let branchId: string | null = null
      if (branchCode) {
        if (branchCodeMap.has(branchCode)) {
          branchId = branchCodeMap.get(branchCode)!
        } else {
          errors.push(`Branch code "${branchCode}" not found in this school`)
        }
      }

      // Validate role
      if (roleStr === 'PARENT' || roleStr === 'GUARDIAN') {
        errors.push('Cannot assign PARENT or GUARDIAN role in Staff CSV. Use Family CSV.')
      } else if (!CANONICAL_STAFF_ROLES.includes(roleStr)) {
        errors.push(`Invalid staff role "${roleStr}". Allowed: OWNER, PRINCIPAL, TEACHER, HELPER, ACCOUNTANT, HR, DRIVER.`)
      }

      // Check existing User in DB
      let isExisting = false
      if (email || username) {
        const existing = await db.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
          include: { staffProfile: true },
        })
        if (existing) {
          isExisting = true
          warnings.push(`User already exists in system. Profile will be linked/updated.`)
        }
      }

      const isBlocked = errors.length > 0
      previewRows.push({
        rowNumber: rowNum,
        status: isBlocked ? 'BLOCKED' : warnings.length > 0 ? 'WARNING' : 'VALID',
        action: isBlocked ? 'BLOCK' : isExisting ? 'LINK' : 'CREATE',
        identifier: username || email || `Row ${rowNum}`,
        name: fullName,
        role: roleStr,
        details: `${fullName} (${roleStr}) - ${branchCode || 'All Branches'}`,
        errors,
        warnings,
        data: {
          username: username || undefined,
          fullName,
          email,
          phone,
          role: roleStr,
          branchId,
          designation: r.designation || null,
          department: r.department || null,
          employeeCode: r.employeeCode || null,
          qualification: r.qualification || null,
          employmentType: (r.employmentType?.toUpperCase() as EmploymentType) || 'REGULAR',
          status: (r.status?.toUpperCase() as UserStatus) || 'ACTIVE',
        },
      })
    }

    const blockedCount = previewRows.filter((r) => r.status === 'BLOCKED').length
    const warningCount = previewRows.filter((r) => r.status === 'WARNING').length
    const validCount = previewRows.filter((r) => r.status === 'VALID').length

    return {
      templateType: 'STAFF',
      totalRows: previewRows.length,
      validRows: validCount,
      warningRows: warningCount,
      blockedRows: blockedCount,
      rows: previewRows,
    }
  }

  /**
   * Preview & Validation for Parent / Guardian CSV
   * Supports Multi-Child linking and enforces strict Max 2 Parents rule
   */
  static async previewFamilyCsv(tenantId: string, csvContent: string): Promise<CsvPreviewResult> {
    const { rows } = parseCsvString(csvContent)
    const previewRows: CsvPreviewRow[] = []

    // Track user occurrences across rows for multi-child deduplication
    const seenUserKeys = new Set<string>()
    const seenStudentCaregiverPairs = new Set<string>()

    // Track incoming parent count per student ID to enforce max 2 limit across CSV
    const studentDbParentCount = new Map<string, number>()
    const studentIncomingParents = new Map<string, number>()

    // Preload branches and classrooms for code lookup
    const branches = await db.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, code: true },
    })
    const branchMap = new Map<string, string>(branches.map((b) => [b.code.toUpperCase(), b.id]))

    type ClassroomItem = { id: string; code: string | null; name: string; branchId: string | null }
    const classrooms: ClassroomItem[] = await db.classroom.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, branchId: true },
    })
    const classroomMap = new Map<string, ClassroomItem>(classrooms.map((c) => [(c.code || c.name).toUpperCase(), c]))

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      const username = r.username?.trim().toLowerCase() || ''
      const role = (r.role?.trim().toUpperCase() || 'PARENT') as 'PARENT' | 'GUARDIAN'
      const fullName = r.fullName?.trim() || ''
      const email = r.email?.trim().toLowerCase() || ''
      const phone = r.phone?.trim() || ''
      const relationship = normalizeRelationship(r.relationship)
      const admissionNo = r.studentAdmissionNo?.trim() || ''

      // Child fields if new child creation mode
      const childFirstName = r.childFirstName?.trim() || ''
      const childLastName = r.childLastName?.trim() || ''
      const childDOB = r.childDOB?.trim() || ''
      const childGender = (r.childGender?.trim().toUpperCase() || 'MALE') as Gender
      const program = (r.program?.trim().toUpperCase() || 'NURSERY') as ProgramType
      const branchCode = r.branchCode?.trim().toUpperCase() || ''
      const classroomCode = r.classroomCode?.trim().toUpperCase() || ''

      if (role !== 'PARENT' && role !== 'GUARDIAN') {
        errors.push(`Invalid role "${role}". Must be PARENT or GUARDIAN.`)
      }
      if (!fullName) errors.push('Caregiver full name is missing')
      if (!email) {
        errors.push('Caregiver email is missing')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format')
      }
      if (!phone) errors.push('Caregiver mobile phone is missing')

      const userKey = email || username

      // Check if this same caregiver + student is repeated in the CSV
      if (userKey && admissionNo) {
        const pairKey = `${userKey}::${admissionNo.toUpperCase()}`
        if (seenStudentCaregiverPairs.has(pairKey)) {
          errors.push(`Duplicate entry: Caregiver already linked to student "${admissionNo}" in this CSV`)
        } else {
          seenStudentCaregiverPairs.add(pairKey)
        }
      }

      // Check existing user in database
      let userInDb = false
      if (email || username) {
        const existing = await db.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
        })
        if (existing) {
          userInDb = true
        }
      }

      const isMultiChildLink = seenUserKeys.has(userKey)
      if (userKey) {
        seenUserKeys.add(userKey)
      }

      let targetStudent: any = null
      const isExistingChild = Boolean(admissionNo)

      if (isExistingChild) {
        // Mode 1: Link to Existing Student by Admission Number
        targetStudent = await db.student.findFirst({
          where: { tenantId, admissionNo, deletedAt: null },
          include: { currentClassroom: true },
        })

        if (!targetStudent) {
          errors.push(`Student with Admission No. "${admissionNo}" not found in this school`)
        } else if (role === 'PARENT') {
          // Enforce Max 2 PARENT rule dynamically combining DB count + previous CSV rows
          if (!studentDbParentCount.has(targetStudent.id)) {
            const dbCount = await FamilyUserService.countActiveParentsForStudent(tenantId, targetStudent.id)
            studentDbParentCount.set(targetStudent.id, dbCount)
          }

          const existingCount = studentDbParentCount.get(targetStudent.id)!
          const incomingCount = studentIncomingParents.get(targetStudent.id) || 0

          if (existingCount + incomingCount >= 2) {
            errors.push(
              `Student ${targetStudent.firstName} (${admissionNo}) already has 2 registered Parent accounts. Change role to GUARDIAN.`
            )
          } else {
            studentIncomingParents.set(targetStudent.id, incomingCount + 1)
          }
        }
      } else {
        // Mode 2: Enroll New Student
        if (!childFirstName) errors.push('New child first name is missing (or provide studentAdmissionNo for existing child)')
        if (!childDOB) errors.push('New child DOB is missing (YYYY-MM-DD)')

        if (branchCode && !branchMap.has(branchCode)) {
          errors.push(`Branch code "${branchCode}" not found`)
        }
        if (classroomCode && !classroomMap.has(classroomCode)) {
          errors.push(`Classroom code "${classroomCode}" not found`)
        }
      }

      const branchId = branchCode ? branchMap.get(branchCode) : null
      const classroom = classroomCode ? classroomMap.get(classroomCode) : null

      const isBlocked = errors.length > 0
      const isLinkAction = isMultiChildLink || userInDb

      let rowAction: 'CREATE' | 'LINK' | 'BLOCK' = isBlocked ? 'BLOCK' : isLinkAction ? 'LINK' : 'CREATE'
      let actionDetail = ''

      if (isBlocked) {
        actionDetail = `${fullName} (${role}) - Blocked: ${errors[0]}`
      } else if (isExistingChild) {
        if (isLinkAction) {
          actionDetail = `LINK EXISTING USER + LINK CHILD (${admissionNo})`
        } else {
          actionDetail = `CREATE USER + LINK CHILD (${admissionNo})`
        }
      } else {
        actionDetail = `CREATE USER + ENROLL CHILD (${childFirstName})`
      }

      // Support both receivesComm and receivesCommunication
      const receivesCommValue = r.receivesComm !== undefined ? r.receivesComm : r.receivesCommunication
      const canPickup = r.canPickup?.toLowerCase() !== 'false'
      const receivesComm = receivesCommValue?.toLowerCase() !== 'false'
      const isFeePayer = role === 'PARENT' ? true : r.isFeePayer?.toLowerCase() === 'true'

      previewRows.push({
        rowNumber: rowNum,
        status: isBlocked ? 'BLOCKED' : warnings.length > 0 ? 'WARNING' : 'VALID',
        action: rowAction,
        identifier: username || email || `Row ${rowNum}`,
        name: fullName,
        role,
        details: actionDetail,
        errors,
        warnings,
        data: {
          role,
          username: username || undefined,
          fullName,
          email,
          phone,
          relationship,
          isPrimaryContact: r.isPrimaryContact?.toLowerCase() === 'true',
          childMode: isExistingChild ? 'EXISTING' : 'CREATE',
          existingChild: isExistingChild ? { admissionNo } : undefined,
          newChild: !isExistingChild
            ? {
                firstName: childFirstName,
                lastName: childLastName || undefined,
                dob: childDOB,
                gender: childGender,
                programType: program,
                branchId: branchId || undefined,
                classroomId: classroom?.id || undefined,
                seatNumber: r.seatNo || undefined,
              }
            : undefined,
          permissions: {
            canPickup,
            receivesCommunication: receivesComm,
            isFeePayer,
            pickupPin: r.pickupPin?.trim() || null,
          },
        },
      })
    }

    const blockedCount = previewRows.filter((r) => r.status === 'BLOCKED').length
    const warningCount = previewRows.filter((r) => r.status === 'WARNING').length
    const validCount = previewRows.filter((r) => r.status === 'VALID').length

    return {
      templateType: 'FAMILY',
      totalRows: previewRows.length,
      validRows: validCount,
      warningRows: warningCount,
      blockedRows: blockedCount,
      rows: previewRows,
    }
  }

  /**
   * Executes validated Staff CSV rows
   */
  static async executeStaffImport(
    ctx: { tenantId: string; actorId?: string; actorName?: string; actorRole?: string },
    rows: CsvPreviewRow[]
  ) {
    let createdCount = 0
    let updatedCount = 0
    let blockedCount = 0
    const errors: Array<{ rowNumber: number; message: string }> = []

    for (const row of rows) {
      if (row.status === 'BLOCKED') {
        blockedCount++
        errors.push({ rowNumber: row.rowNumber, message: row.errors.join('; ') })
        continue
      }

      try {
        await StaffUserService.createStaff(
          {
            tenantId: ctx.tenantId,
            actorId: ctx.actorId,
            actorName: ctx.actorName,
            actorRole: ctx.actorRole,
          },
          row.data as any
        )
        if (row.action === 'CREATE') createdCount++
        else updatedCount++
      } catch (err: any) {
        blockedCount++
        errors.push({ rowNumber: row.rowNumber, message: err.message })
      }
    }

    return {
      total: rows.length,
      createdCount,
      updatedCount,
      blockedCount,
      skippedCount: blockedCount,
      errors,
    }
  }

  /**
   * Executes validated Family CSV rows
   */
  static async executeFamilyImport(
    ctx: { tenantId: string; actorId?: string; actorName?: string; actorRole?: string },
    rows: CsvPreviewRow[]
  ) {
    let createdCount = 0
    let linkedCount = 0
    let blockedCount = 0
    const errors: Array<{ rowNumber: number; message: string }> = []

    for (const row of rows) {
      if (row.status === 'BLOCKED') {
        blockedCount++
        errors.push({ rowNumber: row.rowNumber, message: row.errors.join('; ') })
        continue
      }

      try {
        const res = await FamilyUserService.createFamilyUser(
          {
            tenantId: ctx.tenantId,
            actorId: ctx.actorId,
            actorName: ctx.actorName,
            actorRole: ctx.actorRole,
          },
          row.data as any
        )
        if (res.isNewStudent) createdCount++
        else linkedCount++
      } catch (err: any) {
        blockedCount++
        errors.push({ rowNumber: row.rowNumber, message: err.message })
      }
    }

    return {
      total: rows.length,
      createdCount,
      linkedCount,
      blockedCount,
      skippedCount: blockedCount,
      errors,
    }
  }
}

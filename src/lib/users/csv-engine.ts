import crypto from 'crypto'
import { db } from '@/lib/db'
import { StaffUserService } from './staff-user-service'
import { FamilyUserService, normalizeRelationship } from './family-user-service'
import { UserRole, Relationship, UserStatus, EmploymentType, Gender, ProgramType, BloodGroup } from '@prisma/client'
import { normalizeRole, type CanonicalRole, LEGACY_ROLE_MAP } from '@/lib/roles'
import { validatePan, validateAadhaar, validateUan, validateEsi } from './statutory-validation'
import { recordAudit } from '@/lib/audit'
import { resolveRowWithAliases, CANONICAL_STAFF_FIELDS, CANONICAL_FAMILY_FIELDS, parseBooleanCell, isHrFieldHeader } from './canonical-fields'
import { EncryptionService } from '@/lib/security/encryption-service'
import { validateFullName } from './user-validation'

/**
 * Validates password against PreOne password complexity policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function validatePasswordComplexity(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' }
  }
  return { valid: true }
}

/**
 * Sanitizes a cell against spreadsheet formula injection (=, +, -, @, \t, \r)
 */
export function sanitizeCsvCell(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const raw = String(val)
  let s = raw.trim()
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(s)) {
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
  if (!csvContent || !csvContent.trim()) return { headers: [], rows: [] }

  const records: string[][] = []
  let currentRecord: string[] = []
  let currentField = ''
  let insideQuotes = false

  const len = csvContent.length
  for (let i = 0; i < len; i++) {
    const char = csvContent[i]

    if (char === '"') {
      if (insideQuotes && csvContent[i + 1] === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      currentRecord.push(sanitizeInputCellValue(currentField))
      currentField = ''
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvContent[i + 1] === '\n') {
        i++ // Skip \n in \r\n
      }
      currentRecord.push(sanitizeInputCellValue(currentField))
      currentField = ''
      if (currentRecord.some((f) => f.length > 0)) {
        records.push(currentRecord)
      }
      currentRecord = []
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(sanitizeInputCellValue(currentField))
    if (currentRecord.some((f) => f.length > 0)) {
      records.push(currentRecord)
    }
  }

  if (records.length === 0) return { headers: [], rows: [] }

  const rawHeaders = records[0]
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim())

  const rows: Record<string, string>[] = []
  for (let r = 1; r < records.length; r++) {
    const rawValues = records[r]
    const rowObj: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j]
      const val = rawValues[j] !== undefined ? rawValues[j] : ''
      rowObj[h] = val
    }
    rows.push(rowObj)
  }

  return { headers, rows }
}

export interface CsvPreviewRow {
  rowNumber: number
  status: 'VALID' | 'WARNING' | 'BLOCKED'
  action: 'CREATE' | 'LINK' | 'SKIP' | 'BLOCK' | 'DELETE' | 'UPDATE'
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

/**
 * Helper to safely extract statutory identifier values across case variations and aliases
 */
function extractStatutoryValue(row: Record<string, any>, field: 'pan' | 'aadhaar' | 'uan' | 'esi'): string | undefined {
  const aliases: Record<'pan' | 'aadhaar' | 'uan' | 'esi', string[]> = {
    pan: ['pannumber', 'pan_number', 'pan', 'pancard', 'pan_card'],
    aadhaar: ['aadhaarnumber', 'aadhaar_number', 'aadhaar', 'adhar', 'uidai'],
    uan: ['uannumber', 'uan_number', 'uan', 'epf_uan'],
    esi: ['esinumber', 'esi_number', 'esi', 'esic'],
  }
  const allowed = aliases[field]
  for (const [key, val] of Object.entries(row)) {
    if (val === undefined || val === null || val === '') continue
    const cleanKey = key.replace(/^["']|["']$/g, '').trim().toLowerCase().replace(/[\s\-_]+/g, '')
    if (allowed.includes(cleanKey)) {
      const s = String(val).trim()
      if (s) return s
    }
  }
  return undefined
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
      'classroomCode',
      'employeeCode',
      'password',
    ]

    const sampleRows = [
      ['ananya.sharma', 'Ananya Sharma', 'ananya.sharma@preschool.com', '+919876543210', 'TEACHER', 'MAIN', 'NUR-A', 'EMP-2026-01', 'PreOne@2026'],
      ['vikas.nair', 'Vikas Nair', 'vikas.nair@preschool.com', '+919876543211', 'ACCOUNTS', 'MAIN', '', 'EMP-2026-02', 'PreOne@2026'],
      ['kavita.patil', 'Kavita Patil', 'kavita.patil@preschool.com', '+919876543212', 'STAFF', 'MAIN', 'PG-STAR', 'EMP-2026-03', 'PreOne@2026'],
      ['sunil.verma', 'Sunil Verma', 'sunil.verma@preschool.com', '+919876543213', 'DRIVER', 'MAIN', '', 'EMP-2026-04', 'PreOne@2026'],
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
      'fullName',
      'role',
      'relationship',
      'phone',
      'email',
      'occupation',
      'isPrimaryContact',
      'studentAdmissionNo',
      'studentName',
      'studentDateOfBirth',
      'studentGender',
      'studentBranch',
      'studentClass',
      'canPickup',
      'pickupPin',
      'receivesComm',
      'username',
      'status',
    ]

    const sampleRows = [
      ['Rahul Sharma', 'PARENT', 'FATHER', '+919876543210', 'rahul.sharma@example.com', 'Software Engineer', 'YES', 'PRE-2026-0042', '', '', '', '', '', 'YES', '', 'YES', 'rahul.sharma', 'ACTIVE'],
      ['Priya Sharma', 'PARENT', 'MOTHER', '+919876543211', 'priya.sharma@example.com', 'Architect', 'NO', 'PRE-2026-0042', '', '', '', '', '', 'YES', '', 'YES', 'priya.sharma', 'ACTIVE'],
      ['Vikram Joshi', 'PARENT', 'FATHER', '+919876543213', 'vikram.joshi@example.com', 'Financial Analyst', 'YES', '', 'Aarav Joshi', '2022-03-15', 'MALE', 'MAIN', 'NUR-A', 'YES', '', 'YES', 'vikram.joshi', 'ACTIVE'],
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
      'fullName',
      'role',
      'relationship',
      'phone',
      'email',
      'occupation',
      'isPrimaryContact',
      'studentAdmissionNo',
      'studentName',
      'studentDateOfBirth',
      'studentGender',
      'studentBranch',
      'studentClass',
      'canPickup',
      'pickupPin',
      'receivesComm',
      'username',
      'status',
    ]

    const sampleRows = [
      ['Sunita Sharma', 'GUARDIAN', 'GRANDPARENT', '+919876543212', 'sunita.sharma@example.com', 'Retired Professor', 'NO', 'PRE-2026-0042', '', '', '', '', '', 'YES', '4821', 'NO', 'sunita.sharma', 'ACTIVE'],
      ['Ramesh Uncle', 'GUARDIAN', 'UNCLE_AUNT', '+919876543214', 'ramesh.uncle@example.com', 'Business Owner', 'NO', 'PRE-2026-0042', '', '', '', '', '', 'YES', '9988', 'NO', 'ramesh.uncle', 'ACTIVE'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Generates downloadable Canonical Family CSV template (PARENT & GUARDIAN) matching Add Family Member form
   */
  static getFamilyTemplate(): string {
    const headers = [
      'fullName',
      'role',
      'relationship',
      'phone',
      'email',
      'occupation',
      'isPrimaryContact',
      'studentAdmissionNo',
      'studentName',
      'studentDateOfBirth',
      'studentGender',
      'studentBranch',
      'studentClass',
      'canPickup',
      'pickupPin',
      'receivesComm',
      'username',
      'status',
    ]

    const sampleRows = [
      ['Rahul Sharma', 'PARENT', 'FATHER', '+919876543210', 'rahul.sharma@example.com', 'Software Engineer', 'YES', 'PRE-2026-0042', '', '', '', '', '', 'YES', '', 'YES', 'rahul.sharma', 'ACTIVE'],
      ['Priya Sharma', 'PARENT', 'MOTHER', '+919876543211', 'priya.sharma@example.com', 'Architect', 'NO', 'PRE-2026-0042', '', '', '', '', '', 'YES', '', 'YES', 'priya.sharma', 'ACTIVE'],
      ['Sunita Sharma', 'GUARDIAN', 'GRANDPARENT', '+919876543212', 'sunita.sharma@example.com', 'Retired Professor', 'NO', 'PRE-2026-0042', '', '', '', '', '', 'YES', '4821', 'NO', 'sunita.sharma', 'ACTIVE'],
      ['Vikram Joshi', 'PARENT', 'FATHER', '+919876543213', 'vikram.joshi@example.com', 'Financial Analyst', 'YES', '', 'Aarav Joshi', '2022-03-15', 'MALE', 'MAIN', 'NUR-A', 'YES', '', 'YES', 'vikram.joshi', 'ACTIVE'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Preview & Validation for Staff CSV
   */
  static async previewStaffCsv(
    tenantId: string,
    csvContent: string,
    options?: {
      mode?: 'CREATE' | 'UPDATE'
      overwrite?: boolean
      actorContext?: {
        actorBranchId?: string | null
        actorRole?: string
        actorRoles?: string[]
      }
    }
  ): Promise<CsvPreviewResult & { invalidRows?: number; newUsers?: number; existingUsers?: number; errors?: any[] }> {
    const { rows } = parseCsvString(csvContent)
    const previewRows: CsvPreviewRow[] = []

    const seenEmails = new Set<string>()
    const seenPhones = new Set<string>()
    const seenUsernames = new Set<string>()

    const CANONICAL_STAFF_ROLES: CanonicalRole[] = [
      'OWNER',
      'PRINCIPAL',
      'COORDINATOR',
      'TEACHER',
      'STAFF',
      'ACCOUNTS',
      'RECEPTIONIST',
      'DRIVER',
      'ATTENDANT',
    ]

    // Fetch branches and classrooms in tenant for code matching
    const [branches, classrooms] = await Promise.all([
      db.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, code: true, name: true },
      }),
      db.classroom.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, code: true, name: true, branchId: true },
      }),
    ])
    const branchCodeMap = new Map<string, string>(branches.map((b) => [b.code.toUpperCase(), b.id]))
    const classroomCodeMap = new Map(classrooms.map((c) => [c.code.toUpperCase(), c]))
    const classroomNameMap = new Map(classrooms.map((c) => [c.name.toLowerCase(), c]))

    for (let i = 0; i < rows.length; i++) {
      const { canonical: r, unmapped } = resolveRowWithAliases(rows[i], 'STAFF')
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      // Separate unmapped columns into HR-managed fields vs unknown/misspelled columns
      const unmappedKeys = Object.keys(unmapped).filter(
        (k) => k.trim() && !['id', 'createdat', 'updatedat'].includes(k.trim().toLowerCase())
      )
      const hrFieldsFound: string[] = []
      const trulyUnmapped: string[] = []

      for (const k of unmappedKeys) {
        const hrCheck = isHrFieldHeader(k)
        if (hrCheck.isHr) {
          // Statutory fields are validated and imported to StaffProfile, so they are not ignored
          if (['panNumber', 'aadhaarNumber', 'uanNumber', 'esiNumber'].includes(hrCheck.fieldName || '')) {
            continue
          }
          hrFieldsFound.push(k)
        } else {
          trulyUnmapped.push(k)
        }
      }

      for (const hrKey of hrFieldsFound) {
        warnings.push(`Column '${hrKey}' is an HR field managed in the HR Module and was ignored for identity creation.`)
      }

      if (trulyUnmapped.length > 0) {
        warnings.push(`Unmapped column(s): "${trulyUnmapped.join('", "')}". Verify column spelling.`)
      }

      const username = r.username?.trim().toLowerCase() || ''
      const fullName = r.fullName?.trim() || ''
      const email = r.email?.trim().toLowerCase() || ''
      const phone = r.phone?.trim() || ''
      const rawRole = (r.role?.trim().toUpperCase() || 'TEACHER')
      const roleStr = normalizeRole(rawRole) as UserRole
      const branchCode = r.branchCode?.trim().toUpperCase() || ''

      let isExisting = false
      let existingUser: any = null
      if (email || username) {
        existingUser = await db.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
        })
        if (existingUser) {
          isExisting = true
          if (options?.mode === 'CREATE' && options?.overwrite === false) {
            errors.push('An account with this email already exists in system (USER_ALREADY_EXISTS)')
          } else {
            warnings.push(`User already exists in system. Profile will be linked/updated.`)
          }
        }
      }

      const effectiveFullName = fullName || existingUser?.fullName || ''
      if (!effectiveFullName && (options?.mode as string) !== 'DELETE') {
        errors.push('Full name is missing')
      }
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

      if (options?.actorContext?.actorBranchId && branchId && branchId !== options.actorContext.actorBranchId) {
        errors.push('Cannot assign staff to another campus branch')
      }

      // Check classroom assignment
      const rawClassroom = (r.classroomCode || r.classroom || r.assignedClassroom || '')?.trim()
      let classroomId: string | null = null
      let classroomName: string | null = null
      if (rawClassroom) {
        const matched = classroomCodeMap.get(rawClassroom.toUpperCase()) || classroomNameMap.get(rawClassroom.toLowerCase())
        if (matched) {
          classroomId = matched.id
          classroomName = matched.name
        } else {
          warnings.push(`Classroom "${rawClassroom}" not found in this school. Account will be created without classroom assignment.`)
        }
      }

      // Validate role
      const isKnownStaffRole =
        CANONICAL_STAFF_ROLES.includes(rawRole as any) ||
        Boolean(LEGACY_ROLE_MAP[rawRole] && CANONICAL_STAFF_ROLES.includes(LEGACY_ROLE_MAP[rawRole] as any))

      if (rawRole === 'PARENT' || rawRole === 'GUARDIAN' || roleStr === 'PARENT' || roleStr === 'GUARDIAN') {
        errors.push('Cannot assign PARENT or GUARDIAN role in Staff CSV. Use Family CSV.')
      } else if (r.role && !isKnownStaffRole) {
        errors.push(`Invalid staff role "${rawRole}". Allowed: ${CANONICAL_STAFF_ROLES.join(', ')}.`)
      }

      // ── Password Provisioning & Policy Validation ──
      // Check for prohibited pre-hashed passwords from client
      const rawPasswordHash = (r as any).passwordHash || (rows[i] as any)?.passwordHash || (rows[i] as any)?.password_hash
      if (rawPasswordHash) {
        errors.push("Pre-hashed passwords ('passwordHash') are not accepted. Provide plaintext passwords adhering to security policy for server-side hashing.")
      }

      const rawPassword = r.password !== undefined && r.password !== null ? String(r.password).trim() : ''
      let encryptedPasswordToken: string | undefined = undefined

      if (rawPassword) {
        if (rawPassword.startsWith('$2a$') || rawPassword.startsWith('$2b$') || rawPassword.startsWith('$2y$')) {
          errors.push("Pre-hashed passwords ('passwordHash') are not accepted. Provide plaintext passwords adhering to security policy for server-side hashing.")
        } else {
          const pwdPolicy = validatePasswordComplexity(rawPassword)
          if (!pwdPolicy.valid) {
            errors.push(pwdPolicy.error!)
          } else {
            // Valid plaintext password: encrypt structured, authenticated, short-lived token using tenant context and mask in preview
            try {
              const tokenPayload = JSON.stringify({
                p: rawPassword,
                t: tenantId,
                e: (email || username || '').toLowerCase(),
                exp: Date.now() + 2 * 60 * 60 * 1000, // 2-hour lifetime
                n: crypto.randomBytes(8).toString('hex'),
              })
              const enc = EncryptionService.encrypt(tokenPayload, tenantId)
              if (!enc) throw new Error('Encryption failed')
              encryptedPasswordToken = enc
            } catch (err: any) {
              errors.push('Failed to securely process initial password: fail closed')
            }
          }
        }
      }

      // Statutory ID validation if present in CSV
      let validPan: string | undefined = undefined
      let validAadhaar: string | undefined = undefined
      let validUan: string | undefined = undefined
      let validEsi: string | undefined = undefined

      const rawPan = extractStatutoryValue(rows[i], 'pan')
      if (rawPan) {
        const panRes = validatePan(rawPan)
        if (!panRes.valid && panRes.error) {
          errors.push(panRes.error)
        } else if (panRes.valid && panRes.normalized) {
          validPan = panRes.normalized
        }
      }

      const rawAadhaar = extractStatutoryValue(rows[i], 'aadhaar')
      if (rawAadhaar) {
        const aadhaarRes = validateAadhaar(rawAadhaar)
        if (!aadhaarRes.valid && aadhaarRes.error) {
          errors.push(aadhaarRes.error)
        } else if (aadhaarRes.valid && aadhaarRes.normalized) {
          validAadhaar = aadhaarRes.normalized
        }
      }

      const rawUan = extractStatutoryValue(rows[i], 'uan')
      if (rawUan) {
        const uanRes = validateUan(rawUan)
        if (!uanRes.valid && uanRes.error) {
          errors.push(uanRes.error)
        } else if (uanRes.valid && uanRes.normalized) {
          validUan = uanRes.normalized
        }
      }

      const rawEsi = extractStatutoryValue(rows[i], 'esi')
      if (rawEsi) {
        const esiRes = validateEsi(rawEsi)
        if (!esiRes.valid && esiRes.error) {
          errors.push(esiRes.error)
        } else if (esiRes.valid && esiRes.normalized) {
          validEsi = esiRes.normalized
        }
      }

      const isBlocked = errors.length > 0
      previewRows.push(
        (() => {
          const status = isBlocked ? 'BLOCKED' : warnings.length > 0 ? 'WARNING' : 'VALID'
          const action = isBlocked ? 'BLOCK' : (options?.mode as string) === 'DELETE' ? 'DELETE' : isExisting ? 'LINK' : 'CREATE'

          return {
            rowNumber: rowNum,
            status,
            action,
            identifier: email || username || phone,
            name: effectiveFullName,
            role: roleStr,
            details: `Branch: ${branchId || 'Main'}, EmpCode: ${r.employeeCode || 'Auto'}${classroomName ? `, Class: ${classroomName}` : ''}`,
            errors,
            warnings,
            encryptedPassword: encryptedPasswordToken,
            data: {
              username: username || undefined,
              fullName: effectiveFullName,
              email,
              phone,
              role: r.role ? roleStr : undefined,
              branchId,
              classroomId: classroomId || undefined,
              employeeCode: r.employeeCode || null,
              password: encryptedPasswordToken ? '••••••••' : undefined,
              encryptedPassword: encryptedPasswordToken,
              status: (r.status?.toUpperCase() as UserStatus) || 'ACTIVE',
              panNumber: validPan || undefined,
              aadhaarNumber: validAadhaar || undefined,
              uanNumber: validUan || undefined,
              esiNumber: validEsi || undefined,
            },
          }
        })()
      )
    }

    const blockedCount = previewRows.filter((r) => r.status === 'BLOCKED').length
    const warningCount = previewRows.filter((r) => r.status === 'WARNING').length
    const validCount = previewRows.filter((r) => r.status !== 'BLOCKED').length
    const newUsers = previewRows.filter((r) => r.action === 'CREATE').length
    const existingUsers = previewRows.filter((r) => r.action === 'LINK').length

    const allErrors = previewRows.flatMap((r) =>
      r.errors.map((e) => ({
        rowNumber: r.rowNumber,
        identifier: r.identifier,
        message: e,
        errorCode: e.includes('USER_ALREADY_EXISTS') ? 'USER_ALREADY_EXISTS' : 'VALIDATION_ERROR',
      }))
    )

    return {
      templateType: 'STAFF',
      totalRows: previewRows.length,
      validRows: validCount,
      warningRows: warningCount,
      blockedRows: blockedCount,
      invalidRows: blockedCount,
      newUsers,
      existingUsers,
      errors: allErrors,
      rows: previewRows,
    }
  }

  /**
   * Preview & Validation for Parent / Guardian CSV
   * Supports Multi-Child linking and enforces strict Max 2 Parents rule
   */
  /**
   * Preview & Validation for Parent / Guardian CSV
   * Supports Multi-Child linking, authoritative student resolution, and enforces strict Max 2 Parents rule
   */
  static async previewFamilyCsv(
    tenantId: string,
    csvContent: string,
    actorContext?: {
      actorBranchId?: string | null
      actorRole?: string
      actorRoles?: string[]
    }
  ): Promise<CsvPreviewResult> {
    const { rows } = parseCsvString(csvContent)
    const previewRows: CsvPreviewRow[] = []

    // Track user occurrences across rows for multi-child deduplication
    const seenUserKeys = new Set<string>()
    const seenStudentCaregiverPairs = new Set<string>()

    // Track incoming parent count per student ID to enforce max 2 limit across CSV
    const studentDbParentCount = new Map<string, number>()
    const studentIncomingParents = new Map<string, number>()

    // Preload branches and classrooms for code/name lookup
    const branches = await db.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, code: true, name: true },
    })
    const branchMap = new Map<string, string>()
    for (const b of branches) {
      branchMap.set(b.code.toUpperCase(), b.id)
      branchMap.set(b.name.toUpperCase(), b.id)
    }

    type ClassroomItem = { id: string; code: string | null; name: string; branchId: string | null; programType: ProgramType }
    const classrooms: ClassroomItem[] = await db.classroom.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, branchId: true, programType: true },
    })
    const classroomMap = new Map<string, ClassroomItem>()
    for (const c of classrooms) {
      if (c.code) classroomMap.set(c.code.toUpperCase(), c)
      classroomMap.set(c.name.toUpperCase(), c)
    }

    for (let i = 0; i < rows.length; i++) {
      const { canonical: r, unmapped } = resolveRowWithAliases(rows[i], 'FAMILY')
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      // Surface unmapped/unknown columns to prevent silent dropping
      const unmappedKeys = Object.keys(unmapped).filter(
        (k) => k.trim() && !['id', 'createdat', 'updatedat'].includes(k.trim().toLowerCase())
      )
      if (unmappedKeys.length > 0) {
        warnings.push(`Unmapped column(s): "${unmappedKeys.join('", "')}". Verify column spelling.`)
      }

      const photo = r.photo || r.avatarUrl || ''
      const username = r.username?.trim().toLowerCase() || ''
      const role = (r.role?.trim().toUpperCase() || 'PARENT') as 'PARENT' | 'GUARDIAN'
      const fullName = r.name?.trim() || r.fullName?.trim() || ''
      const gender = (r.gender?.trim().toUpperCase() as Gender) || null
      const email = r.email?.trim().toLowerCase() || ''
      const phone = r.phone?.trim() || ''
      const relationship = normalizeRelationship(r.relationship || r.relationToChild)
      const admissionNo = r.studentAdmissionNo?.trim() || r.admissionNo?.trim() || ''
      const studentUsername = r.studentUsername?.trim().toLowerCase() || ''
      const studentName =
        r.studentName?.trim() ||
        r.childName?.trim() ||
        `${r.childFirstName || r.studentFirstName || ''} ${r.childLastName || r.studentLastName || ''}`.trim()
      const studentDateOfBirth = r.studentDateOfBirth?.trim() || r.studentDob?.trim() || r.childDOB?.trim() || ''
      const studentGender = (r.studentGender?.trim().toUpperCase() || r.childGender?.trim().toUpperCase() || 'MALE') as Gender
      const studentBloodGroup = (r.studentBloodGroup?.trim().toUpperCase() || r.bloodGroup?.trim().toUpperCase()) as BloodGroup | undefined
      const branchInput = r.studentBranch?.trim().toUpperCase() || r.branchCode?.trim().toUpperCase() || ''
      const classInput = r.studentClass?.trim().toUpperCase() || r.classroomCode?.trim().toUpperCase() || ''
      const seatNumber = r.studentSeatNumber?.trim() || r.seatNumber?.trim() || r.seatNo?.trim() || ''
      const admissionYear = r.studentAdmissionYear?.trim() || r.admissionYear?.trim() || ''
      const pickupPin = r.pickupPin?.trim() || ''
      const feePayerInput = r.feePayer || r.isFeePayer
      const status = (r.status?.trim().toUpperCase() as UserStatus) || 'ACTIVE'

      if (role !== 'PARENT' && role !== 'GUARDIAN') {
        errors.push(`Invalid role "${role}". Allowed: PARENT or GUARDIAN only.`)
      }
      if (!fullName) {
        errors.push('Caregiver full name is missing')
      } else {
        const nameRes = validateFullName(fullName)
        if (!nameRes.valid) {
          errors.push(nameRes.error!)
        }
      }
      if (!email) {
        errors.push('Caregiver email is missing')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format')
      }
      if (!phone) errors.push('Caregiver mobile phone is missing')
      if (!r.relationship && !r.relationToChild && !r.relation) {
        errors.push('Relationship to child is required')
      }
      if (pickupPin && !/^\d{4,6}$/.test(pickupPin)) {
        errors.push('Pickup PIN must be 4 to 6 numeric digits')
      }

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
      let userInDb: any = null
      if (email || username) {
        userInDb = await db.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
        })
      }

      const isMultiChildLink = seenUserKeys.has(userKey)
      if (userKey) {
        seenUserKeys.add(userKey)
      }

      // Priority 1: studentAdmissionNo; Priority 2: studentUsername
      let targetStudent: any = null
      if (admissionNo) {
        targetStudent = await db.student.findFirst({
          where: { tenantId, admissionNo, deletedAt: null },
          include: { currentClassroom: true },
        })
      }
      if (!targetStudent && studentUsername) {
        targetStudent = await db.student.findFirst({
          where: { tenantId, username: studentUsername, deletedAt: null },
          include: { currentClassroom: true },
        })
      }

      const isExistingChild = Boolean(targetStudent)
      let isAlreadyLinked = false

      if (isExistingChild) {
        if (actorContext?.actorBranchId && targetStudent.branchId !== actorContext.actorBranchId) {
          errors.push('Cannot link student belonging to another campus branch')
        }

        // Mismatch checks — Do NOT silently overwrite existing student data!
        if (studentName) {
          const dbFullName = `${targetStudent.firstName} ${targetStudent.lastName || ''}`.trim().toLowerCase()
          if (dbFullName !== studentName.toLowerCase()) {
            warnings.push(
              `Student name in CSV ("${studentName}") differs from authoritative DB record ("${targetStudent.firstName} ${targetStudent.lastName || ''}"). DB data will not be overwritten.`
            )
          }
        }

        if (studentDateOfBirth && targetStudent.dob) {
          try {
            const csvDob = new Date(studentDateOfBirth).toISOString().slice(0, 10)
            const dbDob = new Date(targetStudent.dob).toISOString().slice(0, 10)
            if (csvDob !== dbDob) {
              warnings.push(
                `Student DOB in CSV ("${csvDob}") differs from existing record ("${dbDob}"). Existing student data will not be overwritten.`
              )
            }
          } catch (e) {
            // invalid date in CSV
          }
        }

        // Check branch boundary for existing student
        const isOwnerOrPlatform = options?.actorRole === 'OWNER' || options?.actorRole === 'PLATFORM_ADMIN'
        const allowedBranches = options?.authorizedBranchIds || (options?.actorBranchId ? [options.actorBranchId] : [])
        if (!isOwnerOrPlatform && allowedBranches.length > 0) {
          if (targetStudent.branchId && !allowedBranches.includes(targetStudent.branchId)) {
            errors.push(`Unauthorized: Student "${targetStudent.firstName}" belongs to another campus branch`)
          }
        }

        // Check if caregiver is already linked to this student
        if (userInDb) {
          const existingLink = await db.studentGuardian.findFirst({
            where: {
              studentId: targetStudent.id,
              guardian: { userId: userInDb.id },
            },
          })
          if (existingLink) {
            isAlreadyLinked = true
            warnings.push(`Caregiver is already linked to this student. Link will be preserved.`)
          }
        }

        // Enforce Max 2 PARENT rule dynamically combining DB count + previous CSV rows
        if (role === 'PARENT' && !isAlreadyLinked) {
          if (!studentDbParentCount.has(targetStudent.id)) {
            const dbCount = await FamilyUserService.countActiveParentsForStudent(tenantId, targetStudent.id, userInDb?.id)
            studentDbParentCount.set(targetStudent.id, dbCount)
          }

          const existingCount = studentDbParentCount.get(targetStudent.id)!
          const incomingCount = studentIncomingParents.get(targetStudent.id) || 0

          if (existingCount + incomingCount >= 2) {
            errors.push(
              `Maximum 2 Parent accounts allowed for this student (Admission No: ${targetStudent.admissionNo}). Please use GUARDIAN role for additional caregivers.`
            )
          } else {
            studentIncomingParents.set(targetStudent.id, incomingCount + 1)
          }
        }
      } else {
        // Mode 2: Enroll New Student
        if (!studentName && !admissionNo) {
          errors.push('Student admission number or new student name is required')
        } else if (!studentName) {
          errors.push(`Student with Admission No. "${admissionNo}" not found in this school (or provide studentName to enroll new child)`)
        }

        if (!studentDateOfBirth) {
          errors.push('New student date of birth is required (YYYY-MM-DD)')
        } else if (isNaN(Date.parse(studentDateOfBirth))) {
          errors.push('Invalid student date of birth format (must be YYYY-MM-DD)')
        }

        if (branchInput && !branchMap.has(branchInput)) {
          errors.push(`Student branch "${branchInput}" not found in this school`)
        }
        if (classInput && !classroomMap.has(classInput)) {
          errors.push(`Student class "${classInput}" not found in this school`)
        }
        if (actorContext?.actorBranchId && branchInput && branchMap.get(branchInput) !== actorContext.actorBranchId) {
          errors.push('Cannot create student in another campus branch')
        }
      }

      const branchId = branchInput ? branchMap.get(branchInput) || null : (actorContext?.actorBranchId || null)
      const classroom = classInput ? classroomMap.get(classInput) || null : null

      // Statutory ID validation if present in CSV
      const rawPan = extractStatutoryValue(rows[i], 'pan')
      if (rawPan) {
        const panRes = validatePan(rawPan)
        if (!panRes.valid && panRes.error) {
          errors.push(panRes.error)
        }
      }

      const rawAadhaar = extractStatutoryValue(rows[i], 'aadhaar')
      if (rawAadhaar) {
        const aadhaarRes = validateAadhaar(rawAadhaar)
        if (!aadhaarRes.valid && aadhaarRes.error) {
          errors.push(aadhaarRes.error)
        }
      }

      const rawUan = extractStatutoryValue(rows[i], 'uan')
      if (rawUan) {
        const uanRes = validateUan(rawUan)
        if (!uanRes.valid && uanRes.error) {
          errors.push(uanRes.error)
        }
      }

      const rawEsi = extractStatutoryValue(rows[i], 'esi')
      if (rawEsi) {
        const esiRes = validateEsi(rawEsi)
        if (!esiRes.valid && esiRes.error) {
          errors.push(esiRes.error)
        }
      }

      const isBlocked = errors.length > 0
      const isLinkAction = isMultiChildLink || Boolean(userInDb)

      let rowAction: 'CREATE' | 'LINK' | 'SKIP' | 'BLOCK' = 'CREATE'
      let actionDetail = ''

      if (isBlocked) {
        rowAction = 'BLOCK'
        actionDetail = `${fullName} (${role}) - Blocked: ${errors[0]}`
      } else if (isAlreadyLinked) {
        rowAction = 'SKIP'
        actionDetail = `SKIP_ALREADY_LINKED: ${fullName} already linked to ${targetStudent.admissionNo}`
      } else if (isExistingChild) {
        if (isLinkAction) {
          rowAction = 'LINK'
          actionDetail = `LINK_EXISTING_USER: Link ${fullName} to ${targetStudent.admissionNo}`
        } else {
          rowAction = 'CREATE'
          actionDetail = `CREATE_RELATIONSHIP: Link new ${role} ${fullName} to ${targetStudent.admissionNo}`
        }
      } else {
        rowAction = 'CREATE'
        actionDetail = `CREATE_STUDENT_AND_FAMILY: Enroll new student "${studentName}" and register ${role}`
      }

      // Name splitting for new child
      const nameParts = studentName.trim().split(/\s+/)
      const childFirstName = nameParts[0] || 'Child'
      const childLastName = nameParts.slice(1).join(' ') || undefined

      const canPickup = parseBooleanCell(r.canPickup, true)
      const receivesComm = parseBooleanCell(r.receivesComm ?? r.receivesCommunication, true)
      const isFeePayer = role === 'PARENT' ? true : parseBooleanCell(feePayerInput ?? r.isFeePayer, false)
      const isPrimaryContact = parseBooleanCell(r.isPrimaryContact, false)

      previewRows.push({
        rowNumber: rowNum,
        status: isBlocked ? 'BLOCKED' : isAlreadyLinked ? 'VALID' : warnings.length > 0 ? 'WARNING' : 'VALID',
        action: rowAction,
        identifier: username || email || `Row ${rowNum}`,
        name: fullName,
        role,
        details: actionDetail,
        errors,
        warnings,
        data: {
          photo: photo || undefined,
          avatarUrl: photo || undefined,
          username: username || undefined,
          fullName,
          gender,
          email,
          phone,
          role,
          relationship,
          occupation: r.occupation?.trim() || null,
          status,
          isPrimaryContact,
          childMode: isExistingChild ? 'EXISTING' : 'CREATE',
          existingChild: isExistingChild ? { admissionNo: targetStudent.admissionNo, studentId: targetStudent.id } : undefined,
          newChild: !isExistingChild
            ? {
                admissionNo: admissionNo || undefined,
                username: studentUsername || undefined,
                firstName: childFirstName,
                lastName: childLastName,
                dob: studentDateOfBirth,
                gender: studentGender,
                bloodGroup: studentBloodGroup,
                programType: classroom?.programType || 'NURSERY',
                branchId: branchId || undefined,
                classroomId: classroom?.id || undefined,
                seatNumber: seatNumber || undefined,
              }
            : undefined,
          permissions: {
            canPickup,
            receivesCommunication: receivesComm,
            isFeePayer,
            pickupPin: pickupPin || null,
          },
        },
      })
    }

    const blockedCount = previewRows.filter((r) => r.status === 'BLOCKED').length
    const warningCount = previewRows.filter((r) => r.status === 'WARNING').length
    const validCount = previewRows.filter((r) => r.status !== 'BLOCKED').length

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
  /**
   * Executes validated Staff CSV rows in safe transactional chunks (default 15 rows per transaction).
   * Supports atomic rollback option for strict enterprise migrations and async progress reporting.
   */
  static async executeStaffImport(
    ctx: {
      tenantId: string
      actorId?: string
      actorName?: string
      actorRole?: string
      actorRoles?: string[]
      actorBranchId?: string | null
    },
    rows: CsvPreviewRow[],
    options?: {
      atomicAllOrNothing?: boolean
      chunkSize?: number
      mode?: 'CREATE' | 'UPDATE' | 'DELETE'
      onProgress?: (progressPct: number, processed: number, total: number) => Promise<void> | void
    }
  ) {
    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0
    let blockedCount = 0
    let skippedCount = 0
    const errors: Array<{ rowNumber: number; identifier?: string; message: string }> = []
    const chunkSize = options?.chunkSize || 15
    const mode = options?.mode || 'CREATE'

    if (mode === 'DELETE') {
      for (const row of rows) {
        if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
          blockedCount++
          continue
        }
        const identifier = row.data?.email || row.identifier
        if (!identifier) {
          blockedCount++
          continue
        }
        const member = await db.tenantUser.findFirst({
          where: {
            tenantId: ctx.tenantId,
            deletedAt: null,
            user: {
              OR: [
                { email: identifier.toLowerCase().trim() },
                { username: identifier.toLowerCase().trim() },
              ],
            },
          },
          include: { user: true },
        })

        if (member) {
          const now = new Date()
          await db.tenantUser.update({
            where: { id: member.id },
            data: { status: 'INACTIVE', deletedAt: now },
          })
          await db.user.update({
            where: { id: member.userId },
            data: { status: 'INACTIVE', deletedAt: now, updatedAt: now },
          })
          deletedCount++
        } else {
          skippedCount++
        }
      }

      await recordAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        actorName: ctx.actorName,
        actorRole: ctx.actorRole,
        action: 'CSV_DELETE',
        entity: 'User',
        entityId: ctx.tenantId,
        module: 'Users',
        severity: 'WARNING',
        summary: `Executed staff CSV deletion: ${deletedCount} user(s) soft-deactivated`,
      })

      return {
        total: rows.length,
        createdCount: 0,
        updatedCount: 0,
        deletedCount,
        blockedCount,
        skippedCount,
        errors,
      }
    }

    const prepareStaffRowData = (row: CsvPreviewRow) => {
      const rowData = { ...row.data }
      let resolvedPassword: string | undefined = undefined

      if (rowData.encryptedPassword) {
        try {
          const decrypted = EncryptionService.decrypt(rowData.encryptedPassword, ctx.tenantId)
          if (!decrypted) {
            throw new Error('Password decryption produced empty string')
          }
          let candidatePwd = decrypted
          try {
            const parsed = JSON.parse(decrypted)
            if (parsed && typeof parsed === 'object' && parsed.p) {
              if (parsed.t && parsed.t !== ctx.tenantId) {
                throw new Error('Tenant mismatch: Encrypted password token belongs to another tenant')
              }
              if (parsed.exp && typeof parsed.exp === 'number' && parsed.exp < Date.now()) {
                throw new Error('Expired password provisioning token. Please re-preview the import file.')
              }
              const rowEmail = (row.data?.email || row.identifier || '').trim().toLowerCase()
              if (parsed.e && rowEmail && parsed.e !== rowEmail) {
                throw new Error('Identifier mismatch: Encrypted password token cannot be replayed for another user')
              }
              candidatePwd = parsed.p
            }
          } catch (jsonErr: any) {
            if (
              jsonErr.message &&
              (jsonErr.message.includes('Tenant mismatch') ||
                jsonErr.message.includes('Expired') ||
                jsonErr.message.includes('Identifier mismatch'))
            ) {
              throw jsonErr
            }
            // Fallback for legacy raw string encrypted values
          }
          const pwdPolicy = validatePasswordComplexity(candidatePwd)
          if (!pwdPolicy.valid) {
            throw new Error(`Row ${row.rowNumber}: ${pwdPolicy.error}`)
          }
          resolvedPassword = candidatePwd
        } catch (decErr: any) {
          throw new Error(`Security fail-closed: Could not decrypt or authenticate credentials for row ${row.rowNumber}: ${decErr.message}`)
        }
      } else if (rowData.password && rowData.password !== '••••••••') {
        if (
          rowData.password.startsWith('$2a$') ||
          rowData.password.startsWith('$2b$') ||
          rowData.password.startsWith('$2y$')
        ) {
          throw new Error(
            `Row ${row.rowNumber}: Pre-hashed passwords are not accepted. Provide plaintext passwords adhering to policy for server-side hashing.`
          )
        }
        const pwdPolicy = validatePasswordComplexity(rowData.password)
        if (!pwdPolicy.valid) {
          throw new Error(`Row ${row.rowNumber}: ${pwdPolicy.error}`)
        }
        resolvedPassword = rowData.password
      }

      delete rowData.encryptedPassword

      // If updating existing staff and no password provided, preserve existing credentials
      if (row.action === 'LINK' && !resolvedPassword) {
        delete rowData.password
      } else if (resolvedPassword) {
        rowData.password = resolvedPassword
      } else {
        delete rowData.password
      }

      return rowData
    }

    if (options?.atomicAllOrNothing) {
      try {
        await db.$transaction(async (tx) => {
          for (const row of rows) {
            if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
              throw new Error(`Row ${row.rowNumber} is invalid: ${row.errors.join('; ')}`)
            }
            if (row.action === 'SKIP') {
              skippedCount++
              continue
            }
            const rowData = prepareStaffRowData(row)
            await StaffUserService.createStaff(
              {
                tenantId: ctx.tenantId,
                actorId: ctx.actorId,
                actorName: ctx.actorName,
                actorRole: ctx.actorRole,
                actorRoles: ctx.actorRoles,
                actorBranchId: ctx.actorBranchId,
              tx
            if (row.action === 'CREATE') createdCount++
            else updatedCount++
          }
        })

        const auditAction = createdCount > 0 && updatedCount === 0 ? 'CSV_CREATE' : 'CSV_UPDATE'
        await recordAudit({
          tenantId: ctx.tenantId,
          actorId: ctx.actorId,
          actorName: ctx.actorName,
          actorRole: ctx.actorRole,
          action: auditAction,
          entity: 'User',
          entityId: ctx.tenantId,
          module: 'Users',
          summary: `Executed staff CSV import (${auditAction}): ${createdCount} created, ${updatedCount} updated`,
        })

        return {
          total: rows.length,
          createdCount,
          updatedCount,
          deletedCount: 0,
          blockedCount: 0,
          skippedCount,
          errors: [],
        }
      } catch (err: any) {
        return {
          total: rows.length,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          blockedCount: rows.length,
          skippedCount: 0,
          errors: [{ rowNumber: 0, message: `Batch rolled back atomically: ${err.message}` }],
        }
      }
    }

    // Default: Process in transactional chunks with row-level error capturing
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      for (const row of chunk) {
        if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
          blockedCount++
          errors.push({
            rowNumber: row.rowNumber,
            identifier: row.identifier,
            message: row.errors.join('; ') || 'Blocked by validation',
          })
          continue
        }

        if (row.action === 'SKIP') {
          skippedCount++
          continue
        }

        try {
          const rowData = prepareStaffRowData(row)
          await StaffUserService.createStaff(
            {
              tenantId: ctx.tenantId,
              actorId: ctx.actorId,
              actorName: ctx.actorName,
              actorRole: ctx.actorRole,
              actorRoles: ctx.actorRoles,
              actorBranchId: ctx.actorBranchId,
            },
            rowData as any
          )
          if (row.action === 'CREATE') createdCount++
          else updatedCount++
        } catch (err: any) {
          blockedCount++
          const safeMessage = err.message || 'Failed to process staff record'
          errors.push({
            rowNumber: row.rowNumber,
            identifier: row.identifier,
            message: safeMessage,
          })
        }
      }

      if (options?.onProgress) {
        const processed = Math.min(rows.length, i + chunk.length)
        const progressPct = Math.round((processed / rows.length) * 100)
        await options.onProgress(progressPct, processed, rows.length)
      }
    }

    const auditAction = createdCount > 0 && updatedCount === 0 ? 'CSV_CREATE' : 'CSV_UPDATE'
    await recordAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: auditAction,
      entity: 'User',
      entityId: ctx.tenantId,
      module: 'Users',
      summary: `Executed staff CSV import (${auditAction}): ${createdCount} created, ${updatedCount} updated`,
    })

    return {
      total: rows.length,
      createdCount,
      updatedCount,
      deletedCount: 0,
      blockedCount,
      skippedCount,
      errors,
    }
  }

  /**
   * Executes validated Family CSV rows in safe transactional chunks.
   */
  static async executeFamilyImport(
    ctx: {
      tenantId: string
      actorId?: string
      actorName?: string
      actorRole?: string
      actorRoles?: string[]
      actorBranchId?: string | null
    },
    rows: CsvPreviewRow[],
    options?: {
      atomicAllOrNothing?: boolean
      chunkSize?: number
      onProgress?: (progressPct: number, processed: number, total: number) => Promise<void> | void
    }
  ) {
    let createdCount = 0
    let linkedCount = 0
    let skippedCount = 0
    let blockedCount = 0
    const errors: Array<{ rowNumber: number; identifier?: string; message: string }> = []
    const chunkSize = options?.chunkSize || 15

    if (options?.atomicAllOrNothing) {
      try {
        await db.$transaction(async () => {
          for (const row of rows) {
            if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
              throw new Error(`Row ${row.rowNumber} is invalid: ${row.errors.join('; ')}`)
            }
            if (row.action === 'SKIP') {
              skippedCount++
              continue
            }
            const res = await FamilyUserService.createFamilyUser(
              {
                tenantId: ctx.tenantId,
                actorId: ctx.actorId,
                actorName: ctx.actorName,
                actorRole: ctx.actorRole,
                actorRoles: ctx.actorRoles,
                actorBranchId: ctx.actorBranchId,
              },
              row.data as any
            )
            if ((res as any).isAlreadyLinked) {
              skippedCount++
            } else if (res.isNewStudent) {
              createdCount++
            } else {
              linkedCount++
            }
          }
        })
        return {
          total: rows.length,
          createdCount,
          linkedCount,
          skippedCount,
          blockedCount: 0,
          errors: [],
        }
      } catch (err: any) {
        return {
          total: rows.length,
          createdCount: 0,
          linkedCount: 0,
          skippedCount: 0,
          blockedCount: rows.length,
          errors: [{ rowNumber: 0, message: `Batch rolled back atomically: ${err.message}` }],
        }
      }
    }

    // Default: Process in safe chunks
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      for (const row of chunk) {
        if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
          blockedCount++
          errors.push({
            rowNumber: row.rowNumber,
            identifier: row.identifier,
            message: row.errors.join('; ') || 'Blocked by validation',
          })
          continue
        }

        if (row.action === 'SKIP') {
          skippedCount++
          continue
        }

        try {
          const res = await FamilyUserService.createFamilyUser(
            {
              tenantId: ctx.tenantId,
              actorId: ctx.actorId,
              actorName: ctx.actorName,
              actorRole: ctx.actorRole,
              actorRoles: ctx.actorRoles,
              actorBranchId: ctx.actorBranchId,
            },
            row.data as any
          )
          if ((res as any).isAlreadyLinked) {
            skippedCount++
          } else if (res.isNewStudent) {
            createdCount++
          } else {
            linkedCount++
          }
        } catch (err: any) {
          blockedCount++
          const safeMessage = err.message || 'Failed to process caregiver record'
          errors.push({
            rowNumber: row.rowNumber,
            identifier: row.identifier,
            message: safeMessage,
          })
        }
      }

      if (options?.onProgress) {
        const processed = Math.min(rows.length, i + chunk.length)
        const progressPct = Math.round((processed / rows.length) * 100)
        await options.onProgress(progressPct, processed, rows.length)
      }
    }

    return {
      total: rows.length,
      createdCount,
      linkedCount,
      skippedCount,
      blockedCount,
      errors,
    }
  }
}

export { UserCsvEngine as CsvEngine }

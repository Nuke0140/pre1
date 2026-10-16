/**
 * PreOne — Classrooms Bulk Spreadsheet Import Service
 *
 * Implements authoritative validation, duplicate resolution, and transactional
 * bulk ingestion of classrooms according to the canonical Classroom schema.
 */

import { db } from '@/lib/db'
import { ProgramType } from '@prisma/client'
import { recordAudit } from '@/lib/audit'
import { parseTabularContent, sanitizeCsvCell, normalizeHeaderKey } from './spreadsheet-parser'

export type DuplicatePolicy = 'SKIP' | 'UPDATE' | 'ERROR'

export interface ClassroomImportRowPreview {
  rowNumber: number
  status: 'VALID' | 'WARNING' | 'BLOCKED'
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'BLOCK'
  identifier: string
  name: string
  code: string
  programType: string
  capacity: number
  branchName: string
  teacherName?: string
  errors: string[]
  warnings: string[]
  data: {
    name: string
    code: string
    programType: ProgramType
    capacity: number
    branchId: string
    primaryTeacherId?: string | null
    academicSessionId: string
    programId?: string | null
  }
}

export interface ClassroomImportPreviewResult {
  module: 'CLASSROOMS'
  totalRows: number
  validRows: number
  warningRows: number
  blockedRows: number
  duplicateRows: number
  duplicatePolicy: DuplicatePolicy
  rows: ClassroomImportRowPreview[]
}

const VALID_PROGRAM_TYPES: Record<string, ProgramType> = {
  PLAYGROUP: 'PLAYGROUP',
  PG: 'PLAYGROUP',
  NURSERY: 'NURSERY',
  NUR: 'NURSERY',
  LKG: 'LKG',
  'JR-KG': 'LKG',
  JR_KG: 'LKG',
  JUNIOR_KG: 'LKG',
  UKG: 'UKG',
  'SR-KG': 'UKG',
  SR_KG: 'UKG',
  SENIOR_KG: 'UKG',
  DAYCARE: 'DAYCARE',
}

export class ClassroomsImportService {
  /**
   * Generates a downloadable CSV template with realistic preschool sample rows.
   */
  static getClassroomsTemplate(): string {
    const headers = [
      'name',
      'code',
      'programType',
      'capacity',
      'branchCode',
      'primaryTeacherEmail',
    ]

    const sampleRows = [
      ['Nursery A (Sunflowers)', 'NUR-A', 'NURSERY', '25', 'MAIN', 'ananya.sharma@preschool.com'],
      ['Playgroup Starlets', 'PG-STAR', 'PLAYGROUP', '20', 'MAIN', 'rahul.patil@preschool.com'],
      ['Junior KG Explorers', 'JR-KG-A', 'LKG', '25', 'MAIN', ''],
      ['Senior KG Achievers', 'SR-KG-A', 'UKG', '25', 'MAIN', ''],
      ['Daycare Sprouts', 'DAYCARE-01', 'DAYCARE', '15', 'MAIN', ''],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Preview & authoritatively validate classrooms spreadsheet data.
   */
  static async preview(
    tenantId: string,
    rawContent: string | Record<string, any>[],
    options?: { duplicatePolicy?: DuplicatePolicy }
  ): Promise<ClassroomImportPreviewResult> {
    const duplicatePolicy: DuplicatePolicy = options?.duplicatePolicy || 'SKIP'

    let rawRows: Record<string, string>[] = []
    if (typeof rawContent === 'string') {
      const parsed = parseTabularContent(rawContent)
      rawRows = parsed.rows
    } else if (Array.isArray(rawContent)) {
      rawRows = rawContent.map((r) => {
        const obj: Record<string, string> = {}
        for (const [k, v] of Object.entries(r)) {
          obj[k] = v !== null && v !== undefined ? String(v).trim() : ''
        }
        return obj
      })
    }

    // 1. Fetch Tenant Context: Branches, Current Academic Session, Existing Classrooms, Teachers
    const [branches, academicSession, existingClassrooms, teachers] = await Promise.all([
      db.branch.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, code: true, name: true, isMain: true },
      }),
      db.academicSession.findFirst({
        where: { tenantId, isCurrent: true },
        orderBy: { createdAt: 'desc' },
      }).then(async (curr) => {
        if (curr) return curr
        return db.academicSession.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        })
      }),
      db.classroom.findMany({
        where: { tenantId },
        select: { id: true, code: true, name: true, branchId: true },
      }),
      db.user.findMany({
        where: {
          memberships: { some: { tenantId, deletedAt: null } },
        },
        select: { id: true, email: true, username: true, fullName: true },
      }),
    ])

    const mainBranch = branches.find((b) => b.isMain) || branches[0]
    const branchCodeMap = new Map(branches.map((b) => [b.code.toUpperCase(), b]))
    const branchNameMap = new Map(branches.map((b) => [b.name.toLowerCase(), b]))
    const existingCodeMap = new Map(existingClassrooms.map((c) => [c.code.toUpperCase(), c]))
    const teacherEmailMap = new Map<string, { id: string; fullName: string; email: string | null }>(
      teachers
        .filter((t): t is typeof t & { email: string } => Boolean(t.email))
        .map((t) => [t.email.toLowerCase().trim(), t])
    )

    const seenCodes = new Set<string>()
    const previewRows: ClassroomImportRowPreview[] = []
    let duplicateCount = 0

    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i]
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      // Normalize field names flexibly
      let name = ''
      let code = ''
      let rawProgramType = ''
      let rawCapacity = ''
      let rawBranch = ''
      let teacherEmail = ''

      for (const [k, v] of Object.entries(r)) {
        const norm = normalizeHeaderKey(k)
        if (norm === 'name' || norm === 'classroomname' || norm === 'classname') name = v.trim()
        else if (norm === 'code' || norm === 'classroomcode' || norm === 'classcode') code = v.trim().toUpperCase()
        else if (norm === 'programtype' || norm === 'grade' || norm === 'program' || norm === 'type') rawProgramType = v.trim().toUpperCase()
        else if (norm === 'capacity' || norm === 'maxstudents' || norm === 'size') rawCapacity = v.trim()
        else if (norm === 'branchcode' || norm === 'branch' || norm === 'campus') rawBranch = v.trim()
        else if (norm === 'primaryteacheremail' || norm === 'teacheremail' || norm === 'teacher') teacherEmail = v.trim().toLowerCase()
      }

      // Validation 1: Required Name
      if (!name) {
        errors.push('Classroom name is required')
      }

      // Validation 2: Program Type
      const progKey = rawProgramType.replace(/[\s_]/g, '-').toUpperCase()
      const resolvedProgramType = VALID_PROGRAM_TYPES[progKey] || VALID_PROGRAM_TYPES[rawProgramType]
      if (!rawProgramType) {
        errors.push('Program type is required (e.g. NURSERY, PLAYGROUP, LKG, UKG, DAYCARE)')
      } else if (!resolvedProgramType) {
        errors.push(`Invalid program type "${rawProgramType}". Allowed: PLAYGROUP, NURSERY, LKG, UKG, DAYCARE`)
      }

      // Validation 3: Capacity
      let capacity = 20
      if (rawCapacity) {
        const parsedCap = parseInt(rawCapacity, 10)
        if (isNaN(parsedCap) || parsedCap <= 0) {
          errors.push('Capacity must be a positive integer')
        } else if (parsedCap > 100) {
          warnings.push(`High capacity (${parsedCap}) for early childhood classroom`)
          capacity = parsedCap
        } else {
          capacity = parsedCap
        }
      }

      // Validation 4: Branch Resolution
      let targetBranch = mainBranch
      if (rawBranch) {
        const found = branchCodeMap.get(rawBranch.toUpperCase()) || branchNameMap.get(rawBranch.toLowerCase())
        if (found) {
          targetBranch = found
        } else {
          errors.push(`Branch "${rawBranch}" not recognized for this school`)
        }
      }

      if (!targetBranch) {
        errors.push('No valid campus branch available in this school')
      }

      // Validation 5: Code generation / uniqueness
      if (!code && name) {
        const pPrefix = resolvedProgramType ? resolvedProgramType.slice(0, 3) : 'CLS'
        const cleanNamePart = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
        code = `${pPrefix}-${cleanNamePart}-${i + 1}`
      }

      if (seenCodes.has(code)) {
        errors.push(`Duplicate classroom code "${code}" repeated within uploaded rows`)
      } else {
        seenCodes.add(code)
      }

      // Validation 6: Conflict against existing database
      const existingInDb = existingCodeMap.get(code)
      let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'BLOCK' = 'CREATE'

      if (existingInDb) {
        duplicateCount++
        if (duplicatePolicy === 'SKIP') {
          action = 'SKIP'
          warnings.push(`Classroom code "${code}" already exists in school. Row will be skipped.`)
        } else if (duplicatePolicy === 'UPDATE') {
          action = 'UPDATE'
          warnings.push(`Classroom code "${code}" already exists in school. Existing classroom will be updated.`)
        } else {
          action = 'BLOCK'
          errors.push(`Classroom code "${code}" already exists in school (conflict error)`)
        }
      }

      // Validation 7: Primary Teacher Lookup
      let primaryTeacherId: string | null = null
      let teacherName: string | undefined = undefined
      if (teacherEmail) {
        const t = teacherEmailMap.get(teacherEmail)
        if (t) {
          primaryTeacherId = t.id
          teacherName = t.fullName
        } else {
          warnings.push(`Teacher with email "${teacherEmail}" not found. Classroom will be created without teacher assignment.`)
        }
      }

      const isBlocked = errors.length > 0
      const status = isBlocked ? 'BLOCKED' : warnings.length > 0 ? 'WARNING' : 'VALID'
      if (isBlocked) action = 'BLOCK'

      previewRows.push({
        rowNumber: rowNum,
        status,
        action,
        identifier: code,
        name,
        code,
        programType: resolvedProgramType || 'NURSERY',
        capacity,
        branchName: targetBranch ? targetBranch.name : 'Main Campus',
        teacherName,
        errors,
        warnings,
        data: {
          name,
          code,
          programType: resolvedProgramType || 'NURSERY',
          capacity,
          branchId: targetBranch?.id || '',
          primaryTeacherId,
          academicSessionId: academicSession?.id || '',
        },
      })
    }

    const validRows = previewRows.filter((r) => r.status === 'VALID').length
    const warningRows = previewRows.filter((r) => r.status === 'WARNING').length
    const blockedRows = previewRows.filter((r) => r.status === 'BLOCKED').length

    return {
      module: 'CLASSROOMS',
      totalRows: previewRows.length,
      validRows,
      warningRows,
      blockedRows,
      duplicateRows: duplicateCount,
      duplicatePolicy,
      rows: previewRows,
    }
  }

  /**
   * Execute transactional ingestion of previewed classroom records.
   */
  static async execute(
    ctx: { tenantId: string; actorId?: string; actorName?: string; actorRole?: string },
    previewRows: ClassroomImportRowPreview[],
    options?: { atomic?: boolean }
  ) {
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const errors: Array<{ rowNumber: number; identifier?: string; message: string }> = []

    // Ensure active academic session exists
    let session = await db.academicSession.findFirst({
      where: { tenantId: ctx.tenantId, isCurrent: true },
    })
    if (!session) {
      session = await db.academicSession.findFirst({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
      })
    }
    if (!session) {
      const start = new Date(new Date().getFullYear(), 3, 1)
      const end = new Date(new Date().getFullYear() + 1, 2, 31)
      session = await db.academicSession.create({
        data: {
          tenantId: ctx.tenantId,
          name: `${start.getFullYear()}-${String(end.getFullYear()).slice(2)}`,
          startDate: start,
          endDate: end,
          status: 'ACTIVE',
          isCurrent: true,
        },
      })
    }

    const processRow = async (row: ClassroomImportRowPreview, tx: any) => {
      if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
        failedCount++
        errors.push({ rowNumber: row.rowNumber, identifier: row.identifier, message: row.errors.join('; ') })
        return
      }

      if (row.action === 'SKIP') {
        skippedCount++
        return
      }

      const { name, code, programType, capacity, branchId, primaryTeacherId } = row.data

      const existing = await tx.classroom.findFirst({
        where: { tenantId: ctx.tenantId, code },
      })

      if (existing) {
        if (row.action === 'UPDATE') {
          await tx.classroom.update({
            where: { id: existing.id },
            data: {
              name,
              capacity,
              programType,
              branchId: branchId || existing.branchId,
              primaryTeacherId: primaryTeacherId !== undefined ? primaryTeacherId : existing.primaryTeacherId,
              isActive: true,
            },
          })
          updatedCount++
        } else {
          skippedCount++
        }
      } else {
        await tx.classroom.create({
          data: {
            tenantId: ctx.tenantId,
            branchId,
            academicSessionId: session!.id,
            name,
            code,
            programType,
            capacity,
            primaryTeacherId: primaryTeacherId || null,
            isActive: true,
          },
        })
        createdCount++
      }
    }

    if (options?.atomic) {
      await db.$transaction(async (tx) => {
        for (const row of previewRows) {
          if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
            throw new Error(`Row ${row.rowNumber} failed: ${row.errors.join('; ')}`)
          }
          await processRow(row, tx)
        }
      })
    } else {
      for (const row of previewRows) {
        try {
          await db.$transaction(async (tx) => {
            await processRow(row, tx)
          })
        } catch (err: any) {
          failedCount++
          errors.push({ rowNumber: row.rowNumber, identifier: row.identifier, message: err.message })
        }
      }
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'BULK_IMPORT_CLASSROOMS',
      entity: 'Classroom',
      entityId: ctx.tenantId,
      module: 'Academics',
      summary: `Spreadsheet Classroom Import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed`,
    })

    return {
      success: true,
      total: previewRows.length,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      errors,
    }
  }
}

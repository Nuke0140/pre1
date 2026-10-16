/**
 * PreOne — Fees Bulk Spreadsheet Import Service
 *
 * Implements authoritative validation, duplicate resolution, and transactional
 * ingestion of fee heads and configuration records into FeeHead and FeeStructure/FeeItem.
 */

import { db } from '@/lib/db'
import { FeeHeadCategory, FeeFrequency, FeeType } from '@prisma/client'
import { recordAudit } from '@/lib/audit'
import { parseTabularContent, sanitizeCsvCell, normalizeHeaderKey } from './spreadsheet-parser'

export type DuplicatePolicy = 'SKIP' | 'UPDATE' | 'ERROR'

export interface FeeImportRowPreview {
  rowNumber: number
  status: 'VALID' | 'WARNING' | 'BLOCKED'
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'BLOCK'
  identifier: string
  name: string
  code: string
  category: FeeHeadCategory
  amount: number
  frequency: FeeFrequency
  feeType: FeeType
  description?: string
  errors: string[]
  warnings: string[]
  data: {
    name: string
    code: string
    category: FeeHeadCategory
    amount: number
    amountCents: number
    frequency: FeeFrequency
    feeType: FeeType
    description?: string | null
    isRefundable: boolean
  }
}

export interface FeeImportPreviewResult {
  module: 'FEES'
  totalRows: number
  validRows: number
  warningRows: number
  blockedRows: number
  duplicateRows: number
  duplicatePolicy: DuplicatePolicy
  rows: FeeImportRowPreview[]
}

const VALID_CATEGORIES: Record<string, FeeHeadCategory> = {
  TUITION: 'TUITION',
  ADMISSION: 'ADMISSION',
  REGISTRATION: 'ADMISSION',
  TRANSPORT: 'TRANSPORT',
  MEALS: 'MEAL',
  MEAL: 'MEAL',
  UNIFORM: 'MATERIALS',
  BOOKS: 'MATERIALS',
  MATERIALS: 'MATERIALS',
  MATERIAL: 'MATERIALS',
  ACTIVITIES: 'ACTIVITY',
  ACTIVITY: 'ACTIVITY',
  DAYCARE: 'OTHER',
  EXAMINATION: 'OTHER',
  EXAM: 'OTHER',
  ANNUAL: 'OTHER',
  FACILITY: 'OTHER',
  LATE_FEE: 'LATE_FEE',
  LATEFEE: 'LATE_FEE',
  DEPOSIT: 'OTHER',
  SECURITY: 'OTHER',
  OTHER: 'OTHER',
}

const VALID_FREQUENCIES: Record<string, FeeFrequency> = {
  ONE_TIME: 'ONE_TIME',
  ONETIME: 'ONE_TIME',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  HALFYEARLY: 'HALF_YEARLY',
  SEMI_ANNUAL: 'HALF_YEARLY',
  YEARLY: 'ANNUALLY',
  ANNUAL: 'ANNUALLY',
  ANNUALLY: 'ANNUALLY',
}

export class FeesImportService {
  /**
   * Generates a clean, downloadable CSV template for fees configuration.
   */
  static getFeesTemplate(): string {
    const headers = [
      'feeHeadName',
      'feeCode',
      'category',
      'amount',
      'frequency',
      'feeType',
      'description',
    ]

    const sampleRows = [
      ['Tuition Fee', 'TUITION', 'TUITION', '15000', 'QUARTERLY', 'REGULAR', 'Quarterly curriculum and tuition fee'],
      ['Admission Registration', 'ADM-REG', 'ADMISSION', '5000', 'ONE_TIME', 'REGULAR', 'One-time non-refundable admission registration'],
      ['Annual Learning Kits & Activities', 'ANN-ACT', 'ACTIVITIES', '7500', 'YEARLY', 'REGULAR', 'Annual Montessori materials and activities'],
      ['Refundable Security Deposit', 'CAUTION-DEP', 'DEPOSIT', '10000', 'ONE_TIME', 'REFUNDABLE_DEPOSIT', 'Refundable caution deposit at admission'],
      ['Daycare Extended Hours', 'DAYCARE-M', 'DAYCARE', '4000', 'MONTHLY', 'REGULAR', 'Monthly daycare and evening care'],
    ]

    return [
      headers.map(sanitizeCsvCell).join(','),
      ...sampleRows.map((r) => r.map(sanitizeCsvCell).join(',')),
    ].join('\r\n')
  }

  /**
   * Preview & authoritatively validate fees spreadsheet data.
   */
  static async preview(
    tenantId: string,
    rawContent: string | Record<string, any>[],
    options?: { duplicatePolicy?: DuplicatePolicy }
  ): Promise<FeeImportPreviewResult> {
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

    // 1. Fetch Existing Fee Heads
    const existingFeeHeads = await db.feeHead.findMany({
      where: { tenantId },
      select: { id: true, code: true, name: true, category: true, isActive: true },
    })

    const existingCodeMap = new Map(existingFeeHeads.map((h) => [h.code.toUpperCase(), h]))
    const existingNameMap = new Map(existingFeeHeads.map((h) => [h.name.toLowerCase().trim(), h]))

    const seenCodes = new Set<string>()
    const previewRows: FeeImportRowPreview[] = []
    let duplicateCount = 0

    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i]
      const rowNum = i + 2
      const errors: string[] = []
      const warnings: string[] = []

      let name = ''
      let code = ''
      let rawCategory = ''
      let rawAmount = ''
      let rawFrequency = ''
      let rawFeeType = ''
      let description = ''

      for (const [k, v] of Object.entries(r)) {
        const norm = normalizeHeaderKey(k)
        if (norm === 'feeheadname' || norm === 'headname' || norm === 'name' || norm === 'feename') name = v.trim()
        else if (norm === 'feecode' || norm === 'code' || norm === 'headcode') code = v.trim().toUpperCase()
        else if (norm === 'category' || norm === 'headcategory' || norm === 'feecategory') rawCategory = v.trim().toUpperCase()
        else if (norm === 'amount' || norm === 'feeamount' || norm === 'cost' || norm === 'price') rawAmount = v.trim()
        else if (norm === 'frequency' || norm === 'period' || norm === 'billingperiod') rawFrequency = v.trim().toUpperCase()
        else if (norm === 'feetype' || norm === 'type') rawFeeType = v.trim().toUpperCase()
        else if (norm === 'description' || norm === 'desc' || norm === 'notes') description = v.trim()
      }

      // Validation 1: Fee Head Name
      if (!name) {
        errors.push('Fee head name is required')
      }

      // Validation 2: Code generation & uniqueness
      if (!code && name) {
        code = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 16)
      }

      if (code) {
        if (seenCodes.has(code)) {
          errors.push(`Duplicate fee code "${code}" repeated within uploaded rows`)
        } else {
          seenCodes.add(code)
        }
      }

      // Validation 3: Category
      const catKey = rawCategory.replace(/[\s-]/g, '_').toUpperCase()
      const resolvedCategory = VALID_CATEGORIES[catKey] || 'OTHER'
      if (rawCategory && !VALID_CATEGORIES[catKey]) {
        warnings.push(`Unrecognized category "${rawCategory}". Using "OTHER".`)
      }

      // Validation 4: Amount
      let amount = 0
      if (!rawAmount) {
        errors.push('Fee amount is required (enter 0 or greater)')
      } else {
        const cleanAmt = rawAmount.replace(/[₹$,\s]/g, '')
        const parsedAmt = parseFloat(cleanAmt)
        if (isNaN(parsedAmt) || parsedAmt < 0) {
          errors.push(`Invalid fee amount "${rawAmount}". Enter a non-negative number.`)
        } else {
          amount = parsedAmt
        }
      }

      // Validation 5: Frequency
      const freqKey = rawFrequency.replace(/[\s-]/g, '_').toUpperCase()
      const resolvedFrequency = VALID_FREQUENCIES[freqKey] || 'ONE_TIME'
      if (rawFrequency && !VALID_FREQUENCIES[freqKey]) {
        warnings.push(`Unrecognized frequency "${rawFrequency}". Defaulted to "ONE_TIME".`)
      }

      // Validation 6: Fee Type
      const isDeposit = rawFeeType.includes('DEPOSIT') || rawFeeType.includes('REFUND') || rawCategory.includes('DEPOSIT')
      const feeType: FeeType = isDeposit ? 'REFUNDABLE_DEPOSIT' : 'REGULAR'
      const isRefundable = isDeposit

      // Validation 7: Duplicate resolution against existing DB
      const existingInDb = existingCodeMap.get(code) || (name ? existingNameMap.get(name.toLowerCase()) : null)
      let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'BLOCK' = 'CREATE'

      if (existingInDb) {
        duplicateCount++
        if (duplicatePolicy === 'SKIP') {
          action = 'SKIP'
          warnings.push(`Fee head "${name || code}" already exists in system. Row will be skipped.`)
        } else if (duplicatePolicy === 'UPDATE') {
          action = 'UPDATE'
          warnings.push(`Fee head "${name || code}" already exists in system. Configuration will be updated.`)
        } else {
          action = 'BLOCK'
          errors.push(`Fee head "${name || code}" already exists in system (conflict error)`)
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
        category: resolvedCategory,
        amount,
        frequency: resolvedFrequency,
        feeType,
        description: description || undefined,
        errors,
        warnings,
        data: {
          name,
          code,
          category: resolvedCategory,
          amount,
          amountCents: Math.round(amount * 100),
          frequency: resolvedFrequency,
          feeType,
          description: description || null,
          isRefundable,
        },
      })
    }

    const validRows = previewRows.filter((r) => r.status === 'VALID').length
    const warningRows = previewRows.filter((r) => r.status === 'WARNING').length
    const blockedRows = previewRows.filter((r) => r.status === 'BLOCKED').length

    return {
      module: 'FEES',
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
   * Execute transactional ingestion of previewed fee records into FeeHead & FeeStructure.
   */
  static async execute(
    ctx: { tenantId: string; actorId?: string; actorName?: string; actorRole?: string },
    previewRows: FeeImportRowPreview[],
    options?: { atomic?: boolean }
  ) {
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const errors: Array<{ rowNumber: number; identifier?: string; message: string }> = []

    // Find or create default active fee structure for tenant
    let defaultStructure = await db.feeStructure.findFirst({
      where: { tenantId: ctx.tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    if (!defaultStructure) {
      defaultStructure = await db.feeStructure.findFirst({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!defaultStructure) {
      defaultStructure = await db.feeStructure.create({
        data: {
          tenantId: ctx.tenantId,
          name: 'Standard Preschool Fee Structure',
          description: 'Auto-initialized standard fee structure from bulk import',
          status: 'ACTIVE',
        },
      })
    }

    const processRow = async (row: FeeImportRowPreview, tx: any) => {
      if (row.status === 'BLOCKED' || row.action === 'BLOCK') {
        failedCount++
        errors.push({ rowNumber: row.rowNumber, identifier: row.identifier, message: row.errors.join('; ') })
        return
      }

      if (row.action === 'SKIP') {
        skippedCount++
        return
      }

      const { name, code, category, amountCents, frequency, feeType, description, isRefundable } = row.data

      // 1. Upsert / Create FeeHead
      const existingHead = await tx.feeHead.findFirst({
        where: { tenantId: ctx.tenantId, code },
      })

      let feeHeadId = ''

      if (existingHead) {
        if (row.action === 'UPDATE') {
          const updated = await tx.feeHead.update({
            where: { id: existingHead.id },
            data: {
              name,
              category,
              description: description || existingHead.description,
              isActive: true,
            },
          })
          feeHeadId = updated.id
          updatedCount++
        } else {
          feeHeadId = existingHead.id
          skippedCount++
          return
        }
      } else {
        const created = await tx.feeHead.create({
          data: {
            tenantId: ctx.tenantId,
            name,
            code,
            category,
            description: description || null,
            isActive: true,
          },
        })
        feeHeadId = created.id
        createdCount++
      }

      // 2. Also ensure FeeItem exists in default FeeStructure for immediate billing availability
      if (defaultStructure && amountCents >= 0) {
        const existingItem = await tx.feeItem.findFirst({
          where: {
            feeStructureId: defaultStructure.id,
            OR: [
              { feeHeadId },
              { name },
            ],
          },
        })

        if (!existingItem) {
          await tx.feeItem.create({
            data: {
              tenantId: ctx.tenantId,
              feeStructureId: defaultStructure.id,
              feeHeadId,
              name,
              description: description || null,
              feeType,
              amountCents,
              frequency,
              isRefundable,
              status: 'ACTIVE',
            },
          })
        } else if (row.action === 'UPDATE') {
          await tx.feeItem.update({
            where: { id: existingItem.id },
            data: {
              name,
              amountCents,
              frequency,
              feeType,
              isRefundable,
              status: 'ACTIVE',
            },
          })
        }
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
      action: 'BULK_IMPORT_FEES',
      entity: 'FeeHead',
      entityId: ctx.tenantId,
      module: 'Fees',
      summary: `Spreadsheet Fees Import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed`,
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

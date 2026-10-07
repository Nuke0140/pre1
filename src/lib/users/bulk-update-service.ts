import { db } from '@/lib/db'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import {
  getBulkFieldConfig,
  getBulkEditableFields,
  validateFieldValue,
  normalizeFieldKey,
  PROTECTED_BULK_FIELDS,
  BulkFieldConfig,
} from './bulk-field-config'
import { NextRequest } from 'next/server'

export interface CsvFieldChange {
  fieldKey: string
  fieldLabel: string
  currentValue: string | null
  newValue: any
  status: 'CHANGE' | 'NO_CHANGE' | 'INVALID'
  error?: string
}

export interface CsvRowValidation {
  rowIndex: number
  identifier: string
  userId?: string
  userName?: string
  status: 'VALID' | 'FAILED' | 'NO_CHANGE'
  error?: string
  fieldChanges: CsvFieldChange[]
}

export interface CsvPreviewReport {
  success: boolean
  totalRows: number
  validRowsCount: number
  failedRowsCount: number
  noChangeRowsCount: number
  selectedFields: Array<{ key: string; label: string }>
  rows: CsvRowValidation[]
  summaryText: string
}

export interface BulkExecutionReport {
  success: boolean
  totalProcessed: number
  updatedCount: number
  failedCount: number
  noChangeCount: number
  results: Array<{
    rowIndex: number
    userId: string
    identifier: string
    userName: string
    status: 'SUCCESS' | 'FAILED' | 'NO_CHANGE'
    error?: string
  }>
}

export interface BulkActorOptions {
  tenantId: string
  actorId: string
  actorName: string
  actorRole: string
  actorBranchId?: string | null
  ipAddress?: string
  userAgent?: string
}

export class BulkUpdateService {
  /**
   * Helper: Parses CSV text into array of array of strings, handling quotes properly.
   */
  public static parseCsvText(csvText: string): string[][] {
    const lines = csvText.split(/\r?\n/)
    const rows: string[][] = []

    for (const rawLine of lines) {
      if (!rawLine || rawLine.trim() === '') continue
      const line = rawLine.trim()
      const row: string[] = []
      let insideQuote = false
      let currentCell = ''

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            currentCell += '"'
            i++
          } else {
            insideQuote = !insideQuote
          }
        } else if (char === ',' && !insideQuote) {
          row.push(currentCell.trim())
          currentCell = ''
        } else {
          currentCell += char
        }
      }
      row.push(currentCell.trim())
      rows.push(row)
    }

    return rows
  }

  /**
   * Generates a dynamic CSV template populated with existing tenant user usernames and selected field columns.
   */
  static async generateDynamicCsvTemplate(options: {
    tenantId: string
    selectedFields: string[]
    userType?: 'STAFF' | 'FAMILY' | 'ALL'
  }): Promise<string> {
    const { tenantId, selectedFields, userType = 'ALL' } = options

    if (!selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      throw new Error('At least one bulk-editable field must be selected to generate a CSV template.')
    }

    // Validate all requested fields
    const validConfigs: BulkFieldConfig[] = []
    for (const rawKey of selectedFields) {
      const norm = normalizeFieldKey(rawKey)
      if (PROTECTED_BULK_FIELDS.includes(norm as any)) {
        throw new Error(`Field '${rawKey}' is protected and cannot be included in bulk template.`)
      }
      const config = getBulkFieldConfig(norm)
      if (!config) {
        throw new Error(`Field '${rawKey}' is not bulk-editable.`)
      }
      validConfigs.push(config)
    }

    // Build header row: username,field1,field2...
    const headerKeys = ['username', ...validConfigs.map((c) => c.key)]
    const csvRows: string[] = [headerKeys.join(',')]

    // Query active tenant users to pre-fill stable identifiers (username)
    let roleCondition: any = {}
    if (userType === 'STAFF') {
      roleCondition = {
        AND: [
          { role: { notIn: ['PARENT', 'GUARDIAN'] } },
          { NOT: { roles: { hasSome: ['PARENT', 'GUARDIAN'] } } },
        ],
      }
    } else if (userType === 'FAMILY') {
      roleCondition = {
        OR: [{ role: { in: ['PARENT', 'GUARDIAN'] } }, { roles: { hasSome: ['PARENT', 'GUARDIAN'] } }],
      }
    }

    const tenantUsers = await db.tenantUser.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...roleCondition,
      },
      include: {
        user: { select: { username: true, email: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    if (tenantUsers.length > 0) {
      for (const tu of tenantUsers) {
        const identifier = tu.user.username || tu.user.email || tu.userId
        const emptyCells = validConfigs.map(() => '')
        csvRows.push([identifier, ...emptyCells].map((val) => (val.includes(',') ? `"${val}"` : val)).join(','))
      }
    } else {
      // Fallback sample rows if no users in tenant yet
      csvRows.push(['staff001', ...validConfigs.map(() => '')].join(','))
      csvRows.push(['staff002', ...validConfigs.map(() => '')].join(','))
      csvRows.push(['staff003', ...validConfigs.map(() => '')].join(','))
    }

    return csvRows.join('\n')
  }

  /**
   * Parses, validates, and builds preview report for an uploaded CSV file.
   */
  static async parseAndValidateCsvUpload(options: {
    tenantId: string
    actor: BulkActorOptions
    csvContent: string
    requestedSelectedFields?: string[]
  }): Promise<CsvPreviewReport> {
    const { tenantId, actor, csvContent } = options

    const parsedRows = this.parseCsvText(csvContent)
    if (parsedRows.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row.')
    }

    const rawHeaders = parsedRows[0].map((h) => h.trim().replace(/^"|"$/g, ''))
    if (rawHeaders.length === 0 || !rawHeaders[0]) {
      throw new Error("Missing required primary identifier column (expected 'username' as first header).")
    }

    // 1. Validate header identifier
    const firstHeader = rawHeaders[0].toLowerCase()
    if (!['username', 'userid', 'user_id', 'employeecode', 'employee_code', 'email'].includes(firstHeader)) {
      throw new Error(`Invalid first header column '${rawHeaders[0]}'. The first CSV column must be 'username'.`)
    }

    // 2. Validate non-identifier header columns against whitelist and protected list
    const fieldConfigsInHeader: { index: number; key: string; config: BulkFieldConfig }[] = []
    const selectedFieldSummary: Array<{ key: string; label: string }> = []

    for (let i = 1; i < rawHeaders.length; i++) {
      const headerName = rawHeaders[i]
      if (!headerName) continue
      const normKey = normalizeFieldKey(headerName)

      // Strict security enforcement: Reject unauthorized or protected columns
      if (PROTECTED_BULK_FIELDS.includes(normKey as any) || PROTECTED_BULK_FIELDS.includes(headerName as any)) {
        throw new Error(`CSV header contains unauthorized protected field: '${headerName}'. Modification rejected.`)
      }

      const config = getBulkFieldConfig(normKey)
      if (!config) {
        throw new Error(`CSV header contains non-bulk-editable field: '${headerName}'.`)
      }

      fieldConfigsInHeader.push({ index: i, key: config.key, config })
      selectedFieldSummary.push({ key: config.key, label: config.label })
    }

    if (fieldConfigsInHeader.length === 0) {
      throw new Error('No valid bulk-editable field columns found in CSV header.')
    }

    // 3. Extract data rows and check duplicate identifiers in CSV
    const dataRows = parsedRows.slice(1)
    const seenIdentifiers = new Map<string, number>()
    const duplicateErrors = new Map<number, string>()

    for (let idx = 0; idx < dataRows.length; idx++) {
      const rowNum = idx + 2 // 1-indexed including header
      const row = dataRows[idx]
      const identifier = row[0]?.trim()
      if (!identifier) continue

      const lowerIdent = identifier.toLowerCase()
      if (seenIdentifiers.has(lowerIdent)) {
        const previousRow = seenIdentifiers.get(lowerIdent)
        duplicateErrors.set(
          rowNum,
          `Duplicate User identifier '${identifier}' found in CSV at line ${rowNum} (previously seen on line ${previousRow}).`
        )
      } else {
        seenIdentifiers.set(lowerIdent, rowNum)
      }
    }

    // 4. Fetch matching users in tenant context
    const allIdentifiers = Array.from(seenIdentifiers.keys())
    const tenantMembers = await db.tenantUser.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        user: {
          include: {
            staffProfile: true,
          },
        },
      },
    })

    // Index tenant members by username, email, userId, employeeCode
    const memberMap = new Map<string, (typeof tenantMembers)[number]>()
    for (const tm of tenantMembers) {
      if (tm.user.username) memberMap.set(tm.user.username.toLowerCase(), tm)
      if (tm.user.email) memberMap.set(tm.user.email.toLowerCase(), tm)
      memberMap.set(tm.userId.toLowerCase(), tm)
      if (tm.user.staffProfile?.employeeCode) {
        memberMap.set(tm.user.staffProfile.employeeCode.toLowerCase(), tm)
      }
    }

    const isActorOwnerOrPlatform = actor.actorRole === 'OWNER' || actor.actorRole === 'PLATFORM_ADMIN'
    const validatedRows: CsvRowValidation[] = []

    // Track unique field claims in this batch to prevent batch-internal collision
    const batchUniqueClaims: Record<string, Set<string>> = {}

    // 5. Evaluate each CSV row
    for (let idx = 0; idx < dataRows.length; idx++) {
      const rowNum = idx + 2
      const row = dataRows[idx]
      const identifier = row[0]?.trim() || ''

      if (!identifier) continue

      const rowValidation: CsvRowValidation = {
        rowIndex: rowNum,
        identifier,
        status: 'VALID',
        fieldChanges: [],
      }

      // Check if duplicate identifier in CSV
      if (duplicateErrors.has(rowNum)) {
        rowValidation.status = 'FAILED'
        rowValidation.error = duplicateErrors.get(rowNum)
        validatedRows.push(rowValidation)
        continue
      }

      // Lookup target user in tenant
      const member = memberMap.get(identifier.toLowerCase())
      if (!member) {
        rowValidation.status = 'FAILED'
        rowValidation.error = `User '${identifier}' not found in this school context.`
        validatedRows.push(rowValidation)
        continue
      }

      rowValidation.userId = member.userId
      rowValidation.userName = member.user.fullName || member.user.email || member.userId

      // Security: Role Protection
      if (member.role === 'OWNER' && !isActorOwnerOrPlatform) {
        rowValidation.status = 'FAILED'
        rowValidation.error = `Cannot modify School Owner account '${rowValidation.userName}'.`
        validatedRows.push(rowValidation)
        continue
      }

      // Security: Branch Scope Isolation
      if (
        actor.actorBranchId &&
        member.branchId &&
        actor.actorBranchId !== member.branchId &&
        !isActorOwnerOrPlatform &&
        actor.actorRole !== 'PRINCIPAL'
      ) {
        rowValidation.status = 'FAILED'
        rowValidation.error = `Cross-branch modification forbidden for '${rowValidation.userName}'.`
        validatedRows.push(rowValidation)
        continue
      }

      // Evaluate field values for this user
      let hasChange = false
      let rowFailed = false

      for (const fCol of fieldConfigsInHeader) {
        const rawVal = row[fCol.index] !== undefined ? row[fCol.index] : ''
        const fieldConfig = fCol.config

        // Get current DB value for comparison
        let currentDbVal: string | null = null
        if (fieldConfig.targetEntity === 'user') {
          if (fieldConfig.key === 'fullName') currentDbVal = member.user.fullName
          else if (fieldConfig.key === 'phone') currentDbVal = member.user.phone
          else if (fieldConfig.key === 'email') currentDbVal = member.user.email
          else if (fieldConfig.key === 'username') currentDbVal = member.user.username
          else if (fieldConfig.key === 'firstName') {
            currentDbVal = member.user.fullName.split(' ')[0] || ''
          } else if (fieldConfig.key === 'lastName') {
            const parts = member.user.fullName.split(' ')
            currentDbVal = parts.length > 1 ? parts.slice(1).join(' ') : ''
          }
        } else if (fieldConfig.targetEntity === 'staffProfile') {
          const sp = member.user.staffProfile
          if (sp) {
            if (fieldConfig.key === 'address') currentDbVal = sp.currentAddress
            else if (fieldConfig.key === 'designation') currentDbVal = sp.designation
            else if (fieldConfig.key === 'department') currentDbVal = sp.department
            else if (fieldConfig.key === 'employmentType') currentDbVal = sp.employmentType
            else if (fieldConfig.key === 'gender') currentDbVal = sp.gender
            else if (fieldConfig.key === 'dateOfBirth') {
              currentDbVal = sp.dateOfBirth ? new Date(sp.dateOfBirth).toISOString().split('T')[0] : null
            }
          }
        } else if (fieldConfig.targetEntity === 'tenantUser') {
          if (fieldConfig.key === 'status') currentDbVal = member.status
          else if (fieldConfig.key === 'branchId') currentDbVal = member.branchId
        }

        // Empty Cell Rule: Empty cell = DO NOT CHANGE THIS FIELD
        if (rawVal === undefined || rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '')) {
          rowValidation.fieldChanges.push({
            fieldKey: fieldConfig.key,
            fieldLabel: fieldConfig.label,
            currentValue: currentDbVal,
            newValue: currentDbVal,
            status: 'NO_CHANGE',
          })
          continue
        }

        // Validate cell value format
        const valRes = validateFieldValue(fieldConfig.key, rawVal)
        if (!valRes.valid) {
          rowFailed = true
          rowValidation.fieldChanges.push({
            fieldKey: fieldConfig.key,
            fieldLabel: fieldConfig.label,
            currentValue: currentDbVal,
            newValue: rawVal,
            status: 'INVALID',
            error: valRes.error,
          })
          continue
        }

        const cleanVal = valRes.cleanValue

        // Check Uniqueness for unique fields (email, username, phone)
        if (fieldConfig.isUnique && cleanVal !== null) {
          const lowerClean = String(cleanVal).toLowerCase()

          // Batch-internal collision check
          if (!batchUniqueClaims[fieldConfig.key]) {
            batchUniqueClaims[fieldConfig.key] = new Set()
          }
          if (batchUniqueClaims[fieldConfig.key].has(lowerClean)) {
            rowFailed = true
            rowValidation.fieldChanges.push({
              fieldKey: fieldConfig.key,
              fieldLabel: fieldConfig.label,
              currentValue: currentDbVal,
              newValue: cleanVal,
              status: 'INVALID',
              error: `Duplicate value '${cleanVal}' for unique field '${fieldConfig.label}' within CSV batch.`,
            })
            continue
          }
          batchUniqueClaims[fieldConfig.key].add(lowerClean)

          // DB uniqueness check (excluding current user)
          const existingOther = await db.user.findFirst({
            where: {
              [fieldConfig.key]: cleanVal,
              id: { not: member.userId },
            },
            select: { id: true },
          })

          if (existingOther) {
            rowFailed = true
            rowValidation.fieldChanges.push({
              fieldKey: fieldConfig.key,
              fieldLabel: fieldConfig.label,
              currentValue: currentDbVal,
              newValue: cleanVal,
              status: 'INVALID',
              error: `${fieldConfig.label} '${cleanVal}' already belongs to another account in database.`,
            })
            continue
          }
        }

        // Compare proposed value against current DB value
        const strCleanVal = String(cleanVal)
        const strCurrVal = currentDbVal !== null ? String(currentDbVal) : ''

        if (strCleanVal === strCurrVal) {
          rowValidation.fieldChanges.push({
            fieldKey: fieldConfig.key,
            fieldLabel: fieldConfig.label,
            currentValue: currentDbVal,
            newValue: cleanVal,
            status: 'NO_CHANGE',
          })
        } else {
          hasChange = true
          rowValidation.fieldChanges.push({
            fieldKey: fieldConfig.key,
            fieldLabel: fieldConfig.label,
            currentValue: currentDbVal,
            newValue: cleanVal,
            status: 'CHANGE',
          })
        }
      }

      if (rowFailed) {
        rowValidation.status = 'FAILED'
        rowValidation.error = rowValidation.fieldChanges.find((f) => f.status === 'INVALID')?.error || 'Row validation failed.'
      } else if (hasChange) {
        rowValidation.status = 'VALID'
      } else {
        rowValidation.status = 'NO_CHANGE'
      }

      validatedRows.push(rowValidation)
    }

    const validRowsCount = validatedRows.filter((r) => r.status === 'VALID').length
    const failedRowsCount = validatedRows.filter((r) => r.status === 'FAILED').length
    const noChangeRowsCount = validatedRows.filter((r) => r.status === 'NO_CHANGE').length

    return {
      success: true,
      totalRows: validatedRows.length,
      validRowsCount,
      failedRowsCount,
      noChangeRowsCount,
      selectedFields: selectedFieldSummary,
      rows: validatedRows,
      summaryText: `Parsed ${validatedRows.length} rows: ${validRowsCount} valid to update, ${failedRowsCount} failed, ${noChangeRowsCount} no changes.`,
    }
  }

  /**
   * Executes the bulk DB update transaction for validated rows.
   */
  static async executeCsvBulkUpdate(options: {
    tenantId: string
    actor: BulkActorOptions
    rows: CsvRowValidation[]
    reason?: string
    req?: NextRequest
  }): Promise<BulkExecutionReport> {
    const { tenantId, actor, rows, reason, req } = options

    const validRows = rows.filter((r) => r.status === 'VALID' && r.userId)
    const results: BulkExecutionReport['results'] = []
    const affectedUserIds: string[] = []

    for (const r of validRows) {
      if (!r.userId) continue
      const userId = r.userId
      const userName = r.userName || r.identifier

      try {
        await db.$transaction(async (tx) => {
          const userUpdates: Record<string, any> = {}
          const staffUpdates: Record<string, any> = {}
          const tenantUpdates: Record<string, any> = {}

          for (const fc of r.fieldChanges) {
            if (fc.status !== 'CHANGE') continue
            const config = getBulkFieldConfig(fc.fieldKey)
            if (!config) continue

            if (config.targetEntity === 'user') {
              if (fc.fieldKey === 'firstName' || fc.fieldKey === 'lastName') {
                // Read current full name and replace appropriate part
                const currentUser = await tx.user.findUnique({
                  where: { id: userId },
                  select: { fullName: true },
                })
                const parts = (currentUser?.fullName || '').split(' ')
                let fn = parts[0] || ''
                let ln = parts.slice(1).join(' ') || ''
                if (fc.fieldKey === 'firstName') fn = String(fc.newValue)
                if (fc.fieldKey === 'lastName') ln = String(fc.newValue)
                userUpdates.fullName = `${fn} ${ln}`.trim()
              } else {
                userUpdates[fc.fieldKey] = fc.newValue
              }
            } else if (config.targetEntity === 'staffProfile') {
              if (fc.fieldKey === 'address') staffUpdates.currentAddress = fc.newValue
              else if (fc.fieldKey === 'dateOfBirth') {
                staffUpdates.dateOfBirth = fc.newValue ? new Date(fc.newValue) : null
              } else {
                staffUpdates[fc.fieldKey] = fc.newValue
              }
            } else if (config.targetEntity === 'tenantUser') {
              tenantUpdates[fc.fieldKey] = fc.newValue
            }
          }

          // Apply updates to User table
          if (Object.keys(userUpdates).length > 0) {
            userUpdates.updatedAt = new Date()
            await tx.user.update({
              where: { id: userId },
              data: userUpdates,
            })
          }

          // Apply updates to TenantUser table
          if (Object.keys(tenantUpdates).length > 0) {
            await tx.tenantUser.updateMany({
              where: { tenantId, userId, deletedAt: null },
              data: tenantUpdates,
            })
          }

          // Apply updates to StaffProfile table
          if (Object.keys(staffUpdates).length > 0) {
            const existingSp = await tx.staffProfile.findFirst({
              where: { tenantId, userId },
              select: { id: true },
            })

            if (existingSp) {
              await tx.staffProfile.update({
                where: { id: existingSp.id },
                data: staffUpdates,
              })
            } else {
              await tx.staffProfile.create({
                data: {
                  tenantId,
                  userId,
                  employeeCode: `EMP-${Date.now().toString().slice(-4)}-${userId.slice(0, 3)}`,
                  ...staffUpdates,
                },
              })
            }
          }
        })

        results.push({
          rowIndex: r.rowIndex,
          userId,
          identifier: r.identifier,
          userName,
          status: 'SUCCESS',
        })
        affectedUserIds.push(userId)
      } catch (err: any) {
        results.push({
          rowIndex: r.rowIndex,
          userId,
          identifier: r.identifier,
          userName,
          status: 'FAILED',
          error: err.message || 'Database transaction error.',
        })
      }
    }

    const updatedCount = results.filter((r) => r.status === 'SUCCESS').length
    const failedCount = results.filter((r) => r.status === 'FAILED').length
    const noChangeCount = rows.filter((r) => r.status === 'NO_CHANGE').length

    // Audit Logging
    const meta = req ? getRequestMeta(req) : { ipAddress: undefined, userAgent: undefined }
    await recordAudit({
      tenantId,
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      action: 'BULK_USER_FIELD_UPDATE',
      entity: 'User',
      module: 'Users',
      severity: failedCount > 0 ? 'WARNING' : 'INFO',
      summary: `Dynamic bulk field update completed: ${updatedCount} updated, ${failedCount} failed, ${noChangeCount} unchanged${reason ? ` (${reason})` : ''}`,
      ipAddress: actor.ipAddress || meta.ipAddress,
      userAgent: actor.userAgent || meta.userAgent,
      newValues: {
        totalRows: rows.length,
        updatedCount,
        failedCount,
        noChangeCount,
        affectedUserIds,
      },
    })

    return {
      success: true,
      totalProcessed: rows.length,
      updatedCount,
      failedCount,
      noChangeCount,
      results,
    }
  }
}

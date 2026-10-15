import { db } from '../db'
import {
  validatePan,
  validateAadhaar,
  validateUan,
  validateEsi,
} from './statutory-validation'
import { recordAudit } from '../audit'

export interface StatutoryViolation {
  field: 'panNumber' | 'aadhaarNumber' | 'uanNumber' | 'esiNumber'
  value: string
  error: string
}

export interface InvalidStatutoryRecord {
  profileId: string
  userId: string
  tenantId: string
  employeeCode: string
  violations: StatutoryViolation[]
}

export interface StatutoryAuditReport {
  totalScanned: number
  validCount: number
  invalidCount: number
  fixedCount: number
  dryRun: boolean
  invalidRecords: InvalidStatutoryRecord[]
}

export class StatutoryBackfillService {
  /**
   * Audits all existing staff profiles with statutory IDs against format and checksum rules.
   */
  static async auditStatutoryRecords(options?: {
    tenantId?: string
  }): Promise<StatutoryAuditReport> {
    const where: any = {
      deletedAt: null,
      OR: [
        { panNumber: { not: null } },
        { aadhaarNumber: { not: null } },
        { uanNumber: { not: null } },
        { esiNumber: { not: null } },
      ],
    }

    if (options?.tenantId) {
      where.tenantId = options.tenantId
    }

    const profiles = await db.staffProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        tenantId: true,
        employeeCode: true,
        panNumber: true,
        aadhaarNumber: true,
        uanNumber: true,
        esiNumber: true,
      },
    })

    const invalidRecords: InvalidStatutoryRecord[] = []
    let validCount = 0

    for (const p of profiles) {
      const violations: StatutoryViolation[] = []

      if (p.panNumber) {
        const res = validatePan(p.panNumber)
        if (!res.valid) {
          violations.push({
            field: 'panNumber',
            value: p.panNumber,
            error: res.error || 'Invalid PAN format',
          })
        }
      }

      if (p.aadhaarNumber) {
        const res = validateAadhaar(p.aadhaarNumber)
        if (!res.valid) {
          violations.push({
            field: 'aadhaarNumber',
            value: p.aadhaarNumber,
            error: res.error || 'Invalid Aadhaar format or checksum',
          })
        }
      }

      if (p.uanNumber) {
        const res = validateUan(p.uanNumber)
        if (!res.valid) {
          violations.push({
            field: 'uanNumber',
            value: p.uanNumber,
            error: res.error || 'Invalid UAN format',
          })
        }
      }

      if (p.esiNumber) {
        const res = validateEsi(p.esiNumber)
        if (!res.valid) {
          violations.push({
            field: 'esiNumber',
            value: p.esiNumber,
            error: res.error || 'Invalid ESI format',
          })
        }
      }

      if (violations.length > 0) {
        invalidRecords.push({
          profileId: p.id,
          userId: p.userId,
          tenantId: p.tenantId,
          employeeCode: p.employeeCode,
          violations,
        })
      } else {
        validCount++
      }
    }

    return {
      totalScanned: profiles.length,
      validCount,
      invalidCount: invalidRecords.length,
      fixedCount: 0,
      dryRun: true,
      invalidRecords,
    }
  }

  /**
   * Sanitizes invalid statutory IDs by clearing corrupted or non-compliant values
   * and auditing the data cleanup action.
   */
  static async sanitizeInvalidRecords(options?: {
    tenantId?: string
    dryRun?: boolean
    actorId?: string
    actorName?: string
  }): Promise<StatutoryAuditReport> {
    const isDryRun = options?.dryRun ?? false
    const auditReport = await this.auditStatutoryRecords({ tenantId: options?.tenantId })

    if (isDryRun || auditReport.invalidRecords.length === 0) {
      return {
        ...auditReport,
        dryRun: isDryRun,
      }
    }

    let fixedCount = 0

    for (const record of auditReport.invalidRecords) {
      const dataToClear: Record<string, null> = {}
      for (const v of record.violations) {
        dataToClear[v.field] = null
      }

      await db.staffProfile.update({
        where: { id: record.profileId },
        data: dataToClear,
      })

      fixedCount++

      // Record audit entry for statutory ID cleanup
      await recordAudit({
        tenantId: record.tenantId,
        actorId: options?.actorId || 'SYSTEM_STATUTORY_BACKFILL',
        actorName: options?.actorName || 'System Statutory Backfill Engine',
        action: 'DATA_CLEANUP',
        entity: 'StaffProfile',
        entityId: record.profileId,
        module: 'Compliance',
        severity: 'WARNING',
        summary: `Sanitized corrupted statutory IDs for staff ${record.employeeCode}: cleared ${record.violations.map((v) => v.field).join(', ')}`,
      })
    }

    return {
      totalScanned: auditReport.totalScanned,
      validCount: auditReport.validCount + fixedCount,
      invalidCount: auditReport.invalidCount,
      fixedCount,
      dryRun: false,
      invalidRecords: auditReport.invalidRecords,
    }
  }
}

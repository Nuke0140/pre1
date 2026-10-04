/**
 * PreOne — Test Diagnostics & Run History
 * Safely tracks template testing outcomes (Pass, Fail, Blocked),
 * performance metrics, and field mapping stats.
 * Preserves audit logs and zero PII leaks.
 */

import { AuditService } from '@/lib/audit/audit-service'
import { DocumentType } from './types'

export type TestStatus = 'PASS' | 'FAIL' | 'BLOCKED'

export interface TestDiagnosticRun {
  id: string
  templateId: string
  templateVersion: number
  documentType: DocumentType
  recordId: string
  recordType: string
  recordIdentifier: string // e.g. "STU-0042" or "EMP-014" - non-PII
  status: TestStatus
  mappedFieldsCount: number
  fallbackFieldsCount: number
  missingFieldsCount: number
  pdfSizeBytes?: number
  pageCount?: number
  generationEngine?: string
  errorCategory?: string
  errorMessage?: string
  testedAt: string
  actorName: string
}

// In-memory tenant-scoped ring buffer for recent test history (holds latest 50 per tenant)
const recentHistoryStore: Map<string, TestDiagnosticRun[]> = new Map()

export class TestDiagnostics {
  /**
   * Records a test run and logs a security audit event.
   */
  static async recordRun(
    tenantId: string,
    run: Omit<TestDiagnosticRun, 'id' | 'testedAt'>,
    actorId?: string
  ): Promise<TestDiagnosticRun> {
    const entry: TestDiagnosticRun = {
      ...run,
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      testedAt: new Date().toISOString(),
    }

    // Keep last 50 in tenant history
    const existing = recentHistoryStore.get(tenantId) || []
    existing.unshift(entry)
    if (existing.length > 50) existing.pop()
    recentHistoryStore.set(tenantId, existing)

    // Security audit log (no PII in summary)
    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'DocumentTemplate',
      entityId: run.templateId,
      module: 'SETTINGS',
      actorId: actorId || 'system',
      actorName: run.actorName || 'User',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Template test run [${run.status}] for ${run.documentType} v${run.templateVersion} against record ${run.recordIdentifier} (PDF size: ${run.pdfSizeBytes || 0} bytes)`,
      severity: run.status === 'PASS' ? 'INFO' : 'WARNING',
    }).catch(() => {})

    return entry
  }

  /**
   * Retrieve recent test history for a specific template.
   */
  static getHistory(tenantId: string, templateId: string): TestDiagnosticRun[] {
    const tenantRuns = recentHistoryStore.get(tenantId) || []
    return tenantRuns.filter((r) => r.templateId === templateId)
  }
}

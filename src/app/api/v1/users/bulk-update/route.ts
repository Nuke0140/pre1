import { NextRequest } from 'next/server'
import { withApi, ok, bad, errAuth } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkUpdateService, CsvRowValidation } from '@/lib/users/bulk-update-service'

/**
 * POST /api/v1/users/bulk-update — Production Execution Endpoint for Bulk User Updates
 */
export const POST = withApi(
  async (req: NextRequest) => {
    const session = await requireApi(req, 'users:write')
    if (isResponse(session)) return session
    if (!session.tenantId) throw errAuth('Tenant context required')

    const body = await req.json()
    const { action, rows, reason } = body as {
      action?: 'EXECUTE_CSV' | 'EXECUTE_SINGLE'
      rows?: CsvRowValidation[]
      reason?: string
    }

    const actor = {
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      actorBranchId: session.branchId,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    if (action === 'EXECUTE_CSV' || Array.isArray(rows)) {
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return bad('No validated rows provided for bulk execution.', 'ROWS_REQUIRED')
      }

      try {
        const report = await BulkUpdateService.executeCsvBulkUpdate({
          tenantId: session.tenantId,
          actor,
          rows,
          reason,
          req,
        })
        return ok(report)
      } catch (err: any) {
        return bad(err.message || 'Failed to execute bulk CSV update.', 'BULK_EXECUTION_FAILED')
      }
    }

    // Fallback: single field batch update
    const { userIds, field, value, mode = 'EXECUTE' } = body as {
      userIds: string[]
      field: string
      value: any
      mode?: 'PREVIEW' | 'EXECUTE'
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return bad('Non-empty userIds array is required.', 'INVALID_USER_IDS')
    }

    if (!field || typeof field !== 'string') {
      return bad('Field parameter is required.', 'FIELD_REQUIRED')
    }

    try {
      const result = await BulkUpdateService.processBulkFieldUpdate({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        actorBranchId: session.branchId,
        userIds,
        fieldKey: field,
        value,
        mode,
        reason,
        req,
      })
      return ok(result)
    } catch (err: any) {
      return bad(err.message || 'Bulk update failed.', 'BULK_UPDATE_FAILED')
    }
  },
  { module: 'users', permission: 'users:write' }
)

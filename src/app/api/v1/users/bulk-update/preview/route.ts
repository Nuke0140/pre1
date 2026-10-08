import { NextRequest } from 'next/server'
import { withApi, ok, bad, errAuth } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkUpdateService } from '@/lib/users/bulk-update-service'

/**
 * POST /api/v1/users/bulk-update/preview — Parses uploaded CSV and returns line-item validation & change preview.
 * Accepts CSV string payload or multipart FormData file.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    const session = await requireApi(req, 'users:write')
    if (isResponse(session)) return session
    if (!session.tenantId) throw errAuth('Tenant context required')

    let csvContent = ''

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return bad('No CSV file uploaded under "file" field.', 'FILE_REQUIRED')
      }
      csvContent = await file.text()
    } else {
      const body = await req.json()
      csvContent = body.csvContent || body.content || ''
    }

    if (!csvContent || csvContent.trim() === '') {
      return bad('CSV file content is empty.', 'EMPTY_CSV')
    }

    try {
      const actor = {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        actorBranchId: session.branchId,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      }

      const report = await BulkUpdateService.parseAndValidateCsvUpload({
        tenantId: session.tenantId,
        actor,
        csvContent,
      })

      return ok(report)
    } catch (err: any) {
      return bad(err.message || 'Failed to parse and validate CSV file.', 'CSV_VALIDATION_FAILED')
    }
  },
  { module: 'users', permission: 'users:write' }
)

import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'

/**
 * POST /api/v1/reports/document-jobs/[id]/retry
 * Retry all failed items in a job.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'reports:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const result = await BulkDocumentService.retryFailed(
      session.tenantId,
      id,
      session.uid,
      session.name
    )
    return ok(result)
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to retry job')
  }
}

import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'

/**
 * GET /api/v1/reports/document-jobs/[id]
 * Retrieve single job status, counters, template details, and record-level item diagnostics.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const url = new URL(req.url)
    const includeItems = url.searchParams.get('includeItems') !== 'false'
    const itemPage = parseInt(url.searchParams.get('itemPage') || '1', 10) || 1
    const itemLimit = parseInt(url.searchParams.get('itemLimit') || '50', 10) || 50

    const job = await BulkDocumentService.getJobById(session.tenantId, id, {
      includeItems,
      itemPage,
      itemLimit,
    })

    if (!job) {
      return Errors.notFound(`Job with ID ${id} not found`)
    }

    return ok(job)
  } catch (err: any) {
    return Errors.system(err.message || 'Failed to retrieve document job')
  }
}

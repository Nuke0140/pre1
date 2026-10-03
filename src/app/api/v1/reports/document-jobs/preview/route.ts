import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'
import { DocumentType } from '@/lib/templates/types'

/**
 * POST /api/v1/reports/document-jobs/preview
 * Preview eligible record count and sample matching records for selected document type and filters.
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    if (!body || !body.documentType) {
      return Errors.validation('documentType is required')
    }

    const population = await BulkDocumentService.resolvePopulation(
      session.tenantId,
      body.documentType as DocumentType,
      body.filters || {}
    )

    return ok({
      totalCount: population.length,
      sampleRecords: population.slice(0, 5),
    })
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to preview job population')
  }
}

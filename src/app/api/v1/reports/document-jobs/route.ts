import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'
import { DocumentType } from '@/lib/templates/types'

/**
 * GET /api/v1/reports/document-jobs
 * List document generation jobs for current tenant with status, documentType, search, and pagination.
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || undefined
    const documentType = url.searchParams.get('documentType') || undefined
    const branchId = url.searchParams.get('branchId') || undefined
    const search = url.searchParams.get('search') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
    const limit = parseInt(url.searchParams.get('limit') || '20', 10) || 20

    const result = await BulkDocumentService.listJobs(session.tenantId, {
      status,
      documentType,
      branchId,
      search,
      page,
      limit,
    })

    return ok(result)
  } catch (err: any) {
    return Errors.system(err.message || 'Failed to list document jobs')
  }
}

/**
 * POST /api/v1/reports/document-jobs
 * Create a new bulk document generation job and start async rendering.
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    if (!body || !body.title || !body.templateId || !body.documentType) {
      return Errors.validation('Title, templateId, and documentType are required')
    }

    const job = await BulkDocumentService.createJob(session.tenantId, {
      title: body.title,
      templateId: body.templateId,
      documentType: body.documentType as DocumentType,
      filters: body.filters || {},
      createdById: session.uid,
      createdByName: session.name,
      autoStart: body.autoStart !== false,
    })

    return ok(job)
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to create bulk document job')
  }
}

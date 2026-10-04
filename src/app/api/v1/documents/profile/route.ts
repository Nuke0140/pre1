import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'

/**
 * GET /api/v1/documents/profile
 * List all generated documents in an entity's profile library (Student or Staff).
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'students:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = new URL(req.url)
    const entityType = url.searchParams.get('entityType') as 'STUDENT' | 'STAFF' | null
    const entityId = url.searchParams.get('entityId')

    if (!entityType || !entityId) {
      return Errors.validation('entityType (STUDENT or STAFF) and entityId are required')
    }

    const docs = await BulkDocumentService.listEntityDocuments(
      session.tenantId,
      entityType,
      entityId
    )

    return ok(docs)
  } catch (err: any) {
    return Errors.system(err.message || 'Failed to list profile documents')
  }
}

/**
 * DELETE /api/v1/documents/profile
 * Delete / soft-delete a generated document from the profile library.
 */
export async function DELETE(req: NextRequest) {
  const session = await requireApi(req, 'reports:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return Errors.validation('Document id is required')
    }

    const result = await BulkDocumentService.deleteDocument(
      session.tenantId,
      id,
      session.uid,
      session.name
    )

    return ok(result)
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to delete profile document')
  }
}

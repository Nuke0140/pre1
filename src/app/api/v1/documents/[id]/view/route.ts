import { NextRequest } from 'next/server'
import { Errors } from '@/lib/api'
import { getSession } from '@/lib/auth-server'
import { BulkDocumentService } from '@/lib/reports/bulk-document-service'
import { AuditService } from '@/lib/audit/audit-service'

/**
 * GET /api/v1/documents/[id]/view
 * Authenticated stream of actual PDF document bytes with inline disposition.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session) return Errors.unauthorized()
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params

    const fileData = await BulkDocumentService.getDocumentForAccess(
      session.tenantId,
      id,
      session
    )

    // Audit view event non-blocking
    AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'GeneratedProfileDocument',
      entityId: id,
      module: 'DOCUMENTS',
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      tenantId: session.tenantId,
      summary: `Viewed document "${fileData.doc.title}"`,
      severity: 'INFO',
      req,
      details: {
        documentType: fileData.doc.documentType,
        entityType: fileData.doc.entityType,
        fileName: fileData.fileName,
      },
    }).catch(() => {})

    return new Response(fileData.fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileData.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileData.fileName)}"`,
        'Content-Length': fileData.fileSizeBytes.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (err: any) {
    if (err.message === 'Document not found') {
      return Errors.notFound(err.message)
    }
    if (
      err.message.includes('permission') ||
      err.message.includes('Unauthorized') ||
      err.message.includes('cross-tenant')
    ) {
      return Errors.forbidden(err.message)
    }
    return Errors.bad(err.message || 'Failed to stream document for viewing')
  }
}

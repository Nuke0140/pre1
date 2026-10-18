import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { S3StorageService } from '@/lib/storage/s3-storage-service'

/**
 * GET /api/v1/applications/[id]/documents/[docId]/view
 * Secure, tenant-scoped document view / download endpoint.
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id, docId } = await params

  try {
    const app = await db.admissionApplication.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: {
        documents: { where: { id: docId } },
      },
    })

    if (!app) return Errors.notFound('Application')

    const doc = app.documents[0]
    if (!doc) return Errors.notFound('Document')

    if (doc.status === 'NOT_UPLOADED') {
      return Errors.validation('Document has not been uploaded yet')
    }

    // 1. Direct binary streaming if requested or stored in mock store
    if (doc.storageKey) {
      const obj = await S3StorageService.getObjectBuffer(doc.storageKey)
      if (obj) {
        return new NextResponse(obj.buffer, {
          status: 200,
          headers: {
            'Content-Type': doc.mimeType || obj.mimeType || 'application/pdf',
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
            'Cache-Control': 'private, max-age=300',
          },
        })
      }

      // Signed URL fallback
      const signedUrl = await S3StorageService.getSignedDownloadUrl(doc.storageKey, 300)
      return NextResponse.redirect(signedUrl)
    }

    if (doc.fileUrl) {
      return NextResponse.redirect(doc.fileUrl)
    }

    return Errors.notFound('Document file content')
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

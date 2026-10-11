import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { S3StorageService } from '@/lib/storage/s3-storage-service'

/**
 * POST /api/v1/uploads/presign
 * Generates an S3 pre-signed upload URL for direct browser-to-S3 uploads.
 * Request Body:
 * {
 *   category: 'avatars' | 'branding' | 'students' | 'documents' | 'staff',
 *   filename: string,
 *   mimeType: string,
 *   sizeBytes: number,
 *   userId?: string
 * }
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant context required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const { category, filename, mimeType, sizeBytes, userId } = body

    if (!category || !['avatars', 'branding', 'students', 'documents', 'staff'].includes(category)) {
      return bad('Valid category (avatars, branding, students, documents, staff) is required', 'INVALID_CATEGORY')
    }

    if (!mimeType || typeof mimeType !== 'string') {
      return bad('mimeType is required', 'INVALID_MIME_TYPE')
    }

    if (!sizeBytes || typeof sizeBytes !== 'number' || sizeBytes <= 0) {
      return bad('sizeBytes is required and must be greater than 0', 'INVALID_SIZE')
    }

    const presigned = await S3StorageService.createPresignedUploadUrl({
      tenantId: session.tenantId,
      category,
      filename,
      mimeType,
      sizeBytes,
      userId: userId || session.uid,
    })

    return ok({
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      fileUrl: presigned.fileUrl,
      expiresIn: presigned.expiresIn,
      isS3: presigned.isS3,
    })
  } catch (err: any) {
    if (err.message && (err.message.includes('Unsupported image format') || err.message.includes('exceeds maximum allowed size'))) {
      return bad(err.message, 'VALIDATION_ERROR')
    }
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

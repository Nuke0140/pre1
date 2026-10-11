import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad } from '@/lib/api'
import { S3StorageService } from '@/lib/storage/s3-storage-service'

/**
 * PUT /api/v1/uploads/mock-s3?key=...
 * Dev/test helper endpoint simulating direct S3 upload when AWS credentials are not configured.
 * Keeps uploaded file buffer in memory and never writes binaries to disk or Git.
 */
async function _PUT(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const key = searchParams.get('key')
  if (!key) {
    return bad('Key query parameter required', 'KEY_REQUIRED')
  }

  const mimeType = req.headers.get('content-type') || 'application/octet-stream'
  const arrayBuffer = await req.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract tenantId and category from key (tenants/{tenantId}/{category}/...)
  const parts = key.split('/')
  const tenantId = parts[1] || 'mock-tenant'
  const category = (parts[2] || 'avatars') as any

  await S3StorageService.uploadBufferToS3({
    tenantId,
    category,
    buffer,
    mimeType,
  })

  return ok({
    uploaded: true,
    key,
    size: buffer.length,
  })
}

export const PUT = withApi(_PUT)

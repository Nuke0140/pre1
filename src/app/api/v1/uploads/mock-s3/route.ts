import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad } from '@/lib/api'
import { S3StorageService } from '@/lib/storage/s3-storage-service'

/**
 * PUT /api/v1/uploads/mock-s3?key=...
 * Dev/test helper endpoint simulating direct S3 upload when AWS credentials are not configured.
 * Keeps uploaded file buffer in memory and never writes binaries to disk or Git.
 */
import path from 'path'
import fs from 'fs'

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

  const result = await S3StorageService.uploadBufferToS3({
    tenantId,
    category,
    buffer,
    mimeType,
    key,
  })

  return ok({
    uploaded: true,
    key,
    size: buffer.length,
    url: result.url,
  })
}

async function _GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const key = searchParams.get('key')
  if (!key) {
    return bad('Key query parameter required', 'KEY_REQUIRED')
  }

  const parts = key.split('/')
  const category = parts[2] || 'avatars'
  const filename = path.basename(key)
  const filePath = path.join(process.cwd(), 'public', 'uploads', category, filename)

  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filename).toLowerCase().replace('.', '')
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg'
    return new Response(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  return bad('File not found', 'NOT_FOUND', 404)
}

export const PUT = withApi(_PUT)
export const GET = withApi(_GET)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { saveUserProfilePhoto, deleteUserProfilePhoto } from '@/lib/storage'
import { recordAudit } from '@/lib/audit'

/**
 * POST /api/v1/users/photo — Upload a user / student avatar photo file
 * Accepts multipart/form-data with "file" or "photo"
 * Returns durable URL (e.g. /uploads/avatars/...) to store in database
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant context required', 'TENANT_REQUIRED')

  try {
    const formData = await req.formData()
    const file = (formData.get('file') || formData.get('photo')) as File | null

    if (!file || typeof file === 'string') {
      return bad('Image file is required under "file" or "photo" field', 'FILE_REQUIRED')
    }

    const mimeType = file.type || 'image/jpeg'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const saved = await saveUserProfilePhoto({
      tenantId: session.tenantId,
      buffer,
      mimeType,
      originalName: file.name || 'avatar.jpg',
    })

    // Audit log
    await recordAudit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'USER_PHOTO_UPLOADED',
      entity: 'User',
      entityId: session.uid,
      module: 'USERS',
      summary: `Uploaded photo: ${saved.url} (${Math.round(saved.size / 1024)} KB)`,
    })

    return ok({
      url: saved.url,
      avatarUrl: saved.url,
      size: saved.size,
      mimeType: saved.mimeType,
      success: true,
      message: 'Photo uploaded successfully',
    })
  } catch (err: any) {
    if (err.message && (err.message.includes('not supported') || err.message.includes('too large'))) {
      return bad(err.message, 'INVALID_PHOTO')
    }
    return serverError(err.message)
  }
}

/**
 * DELETE /api/v1/users/photo — Delete an uploaded avatar photo from disk
 */
async function _DELETE(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant context required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const url = body.url || body.avatarUrl

    if (url && typeof url === 'string') {
      await deleteUserProfilePhoto(url)
    }

    return ok({
      success: true,
      message: 'Photo removed successfully',
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)
export const DELETE = withApi(_DELETE)

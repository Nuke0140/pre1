import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { UserPhotoService } from '@/lib/users/user-photo-service'

/**
 * POST /api/v1/profile/photo — Upload or replace profile photo for currently authenticated staff.
 * Identity is derived strictly from the verified session token.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant context required', 'TENANT_REQUIRED')

  try {
    const formData = await req.formData()
    const file = (formData.get('file') || formData.get('photo')) as File | null

    if (!file || typeof file === 'string') {
      return bad('Image file is required under "file" or "photo" field', 'FILE_REQUIRED')
    }

    const mimeType = file.type || 'image/png'
    const sizeBytes = file.size

    const validation = UserPhotoService.validateImage(mimeType, sizeBytes)
    if (!validation.valid) {
      return bad(validation.error!, 'INVALID_PHOTO')
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    const result = await UserPhotoService.saveSingleUserPhoto({
      userId: session.uid,
      tenantId: session.tenantId,
      fileBuffer,
      mimeType,
      originalFilename: file.name || 'photo.png',
      actor,
    })

    return ok({
      userId: session.uid,
      avatarUrl: result.avatarUrl,
      success: true,
      message: 'Profile photo updated successfully',
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * DELETE /api/v1/profile/photo — Remove profile photo for currently authenticated staff.
 */
async function _DELETE(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant context required', 'TENANT_REQUIRED')

  try {
    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    await UserPhotoService.removeUserPhoto({
      userId: session.uid,
      tenantId: session.tenantId,
      actor,
    })

    return ok({
      userId: session.uid,
      avatarUrl: null,
      success: true,
      message: 'Profile photo removed successfully',
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)
export const DELETE = withApi(_DELETE)

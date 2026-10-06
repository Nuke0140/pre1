import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { UserPhotoService } from '@/lib/users/user-photo-service'

/**
 * POST /api/v1/users/[id]/photo — Upload single profile photo for user
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || typeof file === 'string') {
      return bad('Image file is required under "file" field', 'FILE_REQUIRED')
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
      userId: id,
      tenantId: session.tenantId,
      fileBuffer,
      mimeType,
      originalFilename: file.name || 'photo.png',
      actor,
    })

    return ok({
      userId: id,
      avatarUrl: result.avatarUrl,
      message: 'Profile photo updated successfully',
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * DELETE /api/v1/users/[id]/photo — Remove profile photo for user
 */
async function _DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck

  try {
    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    await UserPhotoService.removeUserPhoto({
      userId: id,
      tenantId: session.tenantId,
      actor,
    })

    return ok({
      userId: id,
      avatarUrl: null,
      message: 'Profile photo removed successfully',
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)
export const DELETE = withApi(_DELETE)

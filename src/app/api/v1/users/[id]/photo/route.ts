import { NextRequest } from 'next/server'
import { ok, bad, errAuth } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { saveUserProfilePhoto, deleteUserProfilePhoto } from '@/lib/storage'
import { recordAudit, getRequestMeta } from '@/lib/audit'

/**
 * POST /api/v1/users/[id]/photo — Securely upload / replace a user's profile photo
 */
export const POST = withApi(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errAuth('Tenant required')

  const { id: targetUserId } = await params

  // Verify user exists and belongs to the caller's tenant
  const tenantUser = await db.tenantUser.findFirst({
    where: {
      userId: targetUserId,
      tenantId: session.tenantId,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  })

  if (!tenantUser) {
    return bad('User not found in your school', 'USER_NOT_FOUND')
  }

  const formData = await req.formData()
  const file = formData.get('photo') || formData.get('file')

  if (!file || !(file instanceof File)) {
    return bad('Please select a valid image file to upload', 'FILE_REQUIRED')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    const saved = await saveUserProfilePhoto({
      tenantId: session.tenantId,
      userId: targetUserId,
      buffer,
      mimeType: file.type,
      originalName: file.name,
    })

    // Delete old avatar if it was stored locally
    if (tenantUser.user.avatarUrl) {
      await deleteUserProfilePhoto(tenantUser.user.avatarUrl)
    }

    // Persist new avatar URL
    await db.user.update({
      where: { id: targetUserId },
      data: { avatarUrl: saved.url },
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      actorId: session.userId,
      actorName: session.fullName || 'Admin',
      actorRole: session.role,
      action: 'USER_PHOTO_UPDATED',
      entity: 'User',
      entityId: targetUserId,
      module: 'USERS',
      summary: `Updated profile photo for ${tenantUser.user.fullName}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: { avatarUrl: saved.url },
    })

    return ok({
      success: true,
      avatarUrl: saved.url,
      size: saved.size,
      mimeType: saved.mimeType,
    })
  } catch (err: any) {
    return bad(err.message || 'Failed to upload photo', 'PHOTO_UPLOAD_FAILED')
  }
})

/**
 * DELETE /api/v1/users/[id]/photo — Remove profile photo and reset to initials fallback
 */
export const DELETE = withApi(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errAuth('Tenant required')

  const { id: targetUserId } = await params

  const tenantUser = await db.tenantUser.findFirst({
    where: {
      userId: targetUserId,
      tenantId: session.tenantId,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  })

  if (!tenantUser) {
    return bad('User not found in your school', 'USER_NOT_FOUND')
  }

  if (tenantUser.user.avatarUrl) {
    await deleteUserProfilePhoto(tenantUser.user.avatarUrl)
    await db.user.update({
      where: { id: targetUserId },
      data: { avatarUrl: null },
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      actorId: session.userId,
      actorName: session.fullName || 'Admin',
      actorRole: session.role,
      action: 'USER_PHOTO_REMOVED',
      entity: 'User',
      entityId: targetUserId,
      module: 'USERS',
      summary: `Removed profile photo for ${tenantUser.user.fullName}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })
  }

  return ok({
    success: true,
    avatarUrl: null,
  })
})

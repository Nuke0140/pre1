import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FastReceivingService } from '@/lib/inventory/fast-receiving-service'
import { normalizeRole } from '@/lib/roles'

/**
 * POST /api/v1/inventory/fast-receive/upload-photo
 * Uploads a delivery box photo or physical delivery receipt.
 * Validates file format (JPG, PNG, WEBP) and maximum size (5MB).
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:receive')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const effectiveRoles = [session.role, ...(session.roles || [])].filter(Boolean).map(normalizeRole)
  const isAuthorizedRole = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN', 'ADMIN'].includes(r)
  )
  const hasPermission = session.permissions?.includes('inventory:receive') || session.permissions?.includes('inventory:write')

  if (!isAuthorizedRole && !hasPermission) {
    return Errors.forbidden('You do not have permission to upload stock delivery photos')
  }

  try {
    const formData = await req.formData()
    const file = (formData.get('photo') || formData.get('file')) as File | null

    if (!file || typeof file === 'string') {
      return bad('Image file is required under "photo" or "file" form field', 'PHOTO_REQUIRED')
    }

    const mimeType = file.type || 'image/jpeg'
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const upload = await FastReceivingService.uploadDeliveryPhoto({
      tenantId: session.tenantId,
      fileBuffer,
      mimeType,
      filename: file.name || 'delivery-box.jpg',
      userId: session.uid,
    })

    return ok({
      photoUrl: upload.photoUrl,
      key: upload.key,
      success: true,
    })
  } catch (err: any) {
    if (err.message && (err.message.includes('Unsupported image format') || err.message.includes('exceeds 5MB'))) {
      return bad(err.message, 'VALIDATION_ERROR')
    }
    return serverError(err.message || 'Failed to upload delivery photo')
  }
}

export const POST = withApi(_POST)

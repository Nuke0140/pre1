import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { UserPhotoService } from '@/lib/users/user-photo-service'

/**
 * POST /api/v1/users/bulk-photos — Bulk Upload User Photos
 * Supports uploading multiple files in multipart/form-data.
 * Matches filenames against userId, username, employeeCode, or student admissionNo.
 * Optional JSON string payload in "mapping" field: { "photo1.jpg": "EMP-014" }
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const formData = await req.formData()
    const rawFiles = formData.getAll('photos') as File[]
    const fallbackFiles = formData.getAll('files') as File[]
    const filesList = [...rawFiles, ...fallbackFiles].filter(
      (f): f is File => f && typeof f !== 'string' && typeof f.arrayBuffer === 'function'
    )

    if (filesList.length === 0) {
      return bad('No photo files provided. Please upload files under "photos" or "files" field.', 'FILES_REQUIRED')
    }

    let csvMapping: Record<string, string> | undefined = undefined
    const rawMapping = formData.get('mapping')
    if (rawMapping && typeof rawMapping === 'string') {
      try {
        csvMapping = JSON.parse(rawMapping)
      } catch {
        return bad('Invalid JSON format in "mapping" field', 'INVALID_MAPPING')
      }
    }

    const filesToProcess = await Promise.all(
      filesList.map(async (f) => ({
        filename: f.name,
        mimeType: f.type || 'image/png',
        buffer: Buffer.from(await f.arrayBuffer()),
      }))
    )

    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    const report = await UserPhotoService.processBulkUserPhotos({
      tenantId: session.tenantId,
      files: filesToProcess,
      csvMapping,
      actor,
    })

    return ok(report)
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type BrandingAssetType = 'logo' | 'banner'

const ALLOWED_MIME_TYPES: Record<BrandingAssetType, string[]> = {
  logo: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
  banner: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
}

const EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
}

const MAX_SIZES: Record<BrandingAssetType, number> = {
  logo: 2 * 1024 * 1024, // 2MB
  banner: 4 * 1024 * 1024, // 4MB
}

/**
 * Validates whether a URL or path is a durable, safe asset reference.
 * Strictly rejects temporary browser object URLs (blob:) and base64 data URIs (data:).
 */
export function isDurableAssetUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return false
  }
  // Must be an absolute path on current origin (e.g. /uploads/branding/...) or a valid web URL
  if (trimmed.startsWith('/uploads/')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return trimmed.startsWith('/')
  }
}

/**
 * Durably saves an uploaded branding asset (logo or banner) to public storage.
 * Returns the durable relative URL (e.g. /uploads/branding/<filename>).
 */
export async function saveBrandingAsset({
  tenantId,
  type,
  buffer,
  mimeType,
  originalName,
}: {
  tenantId: string
  type: BrandingAssetType
  buffer: Buffer
  mimeType: string
  originalName?: string
}): Promise<{ url: string; size: number; mimeType: string }> {
  const normalizedMime = mimeType.toLowerCase().trim()
  const allowed = ALLOWED_MIME_TYPES[type]
  if (!allowed.includes(normalizedMime)) {
    throw new Error(`Invalid file format for ${type}. Allowed: ${allowed.join(', ')}`)
  }

  const maxSize = MAX_SIZES[type]
  if (buffer.length > maxSize) {
    const maxMb = maxSize / (1024 * 1024)
    throw new Error(`File exceeds maximum allowed size of ${maxMb}MB for ${type}.`)
  }

  let ext = EXTENSION_MAP[normalizedMime]
  if (!ext && originalName) {
    const parsedExt = path.extname(originalName).replace('.', '').toLowerCase()
    if (parsedExt) ext = parsedExt
  }
  if (!ext) ext = 'png'

  const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '')
  const randomSuffix = crypto.randomBytes(4).toString('hex')
  const filename = `${sanitizedTenantId}-${type}-${Date.now()}-${randomSuffix}.${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branding')
  await fs.promises.mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, filename)
  await fs.promises.writeFile(filePath, buffer)

  const durableUrl = `/uploads/branding/${filename}`
  return {
    url: durableUrl,
    size: buffer.length,
    mimeType: normalizedMime,
  }
}

/**
 * Safely removes a previously uploaded branding asset from disk if it exists in /uploads/branding.
 */
export async function deleteBrandingAsset(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string') return
  if (!url.startsWith('/uploads/branding/')) return

  try {
    const filename = path.basename(url)
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'branding', filename)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (err) {
    // Non-blocking cleanup error
    console.warn(`Failed to cleanup branding asset at ${url}:`, err)
  }
}

const ALLOWED_STAFF_DOC_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

const DOC_EXTENSION_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
}

const MAX_STAFF_DOC_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Durably saves an uploaded staff verification document to tenant-isolated storage.
 */
export async function saveStaffDocumentFile({
  tenantId,
  staffProfileId,
  docType,
  buffer,
  mimeType,
  originalName,
}: {
  tenantId: string
  staffProfileId: string
  docType: string
  buffer: Buffer
  mimeType: string
  originalName?: string
}): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
  const normalizedMime = mimeType.toLowerCase().trim()
  if (!ALLOWED_STAFF_DOC_MIMES.includes(normalizedMime)) {
    throw new Error(`Invalid file format "${mimeType}". Allowed formats: PDF, JPEG, PNG.`)
  }

  if (buffer.length > MAX_STAFF_DOC_SIZE) {
    throw new Error(`File exceeds maximum allowed size of 5 MB (size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`)
  }

  let ext = DOC_EXTENSION_MAP[normalizedMime]
  if (!ext && originalName) {
    const parsedExt = path.extname(originalName).replace('.', '').toLowerCase()
    if (['pdf', 'jpg', 'jpeg', 'png'].includes(parsedExt)) ext = parsedExt
  }
  if (!ext) ext = 'pdf'

  const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '')
  const sanitizedStaffId = staffProfileId.replace(/[^a-zA-Z0-9_-]/g, '')
  const sanitizedDocType = docType.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
  const randomSuffix = crypto.randomBytes(4).toString('hex')
  const filename = `${sanitizedDocType}-${Date.now()}-${randomSuffix}.${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', 'staff', sanitizedTenantId, sanitizedStaffId)
  await fs.promises.mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, filename)
  await fs.promises.writeFile(filePath, buffer)

  const durableUrl = `/uploads/documents/staff/${sanitizedTenantId}/${sanitizedStaffId}/${filename}`
  const userFacingName = originalName ? path.basename(originalName) : filename

  return {
    url: durableUrl,
    fileName: userFacingName,
    size: buffer.length,
    mimeType: normalizedMime,
  }
}

/**
 * Safely removes an uploaded staff document file from disk if present.
 */
export async function deleteStaffDocumentFile(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string') return
  if (!url.startsWith('/uploads/documents/staff/')) return

  try {
    const relativePath = url.replace('/uploads/documents/staff/', '')
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'documents', 'staff', path.normalize(relativePath))
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (err) {
    console.warn(`Failed to cleanup staff document file at ${url}:`, err)
  }
}


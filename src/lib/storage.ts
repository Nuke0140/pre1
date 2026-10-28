import path from 'path'
import crypto from 'crypto'
import { S3StorageService } from './storage/s3-storage-service'

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
 * Validates actual binary content (magic bytes) to ensure file content matches image MIME type.
 * Rejects disguised executables, scripts, or corrupted files.
 */
export function validateImageContent(buffer: Buffer, mimeType: string): void {
  if (!buffer || buffer.length < 8) {
    throw new Error('Uploaded file is empty or corrupted.')
  }

  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  const isSvg =
    mimeType.includes('svg') &&
    buffer.slice(0, 1024).toString('utf-8').toLowerCase().includes('<svg')

  if (mimeType === 'image/png' && !isPng) {
    throw new Error('Corrupted or invalid PNG image file header.')
  }
  if ((mimeType === 'image/jpeg' || mimeType === 'image/jpg') && !isJpeg) {
    throw new Error('Corrupted or invalid JPEG image file header.')
  }
  if (mimeType === 'image/webp' && !isWebp) {
    throw new Error('Corrupted or invalid WebP image file header.')
  }
  if (mimeType === 'image/svg+xml') {
    if (!isSvg) {
      throw new Error('Corrupted or invalid SVG image file content.')
    }
    const svgContent = buffer.toString('utf-8').toLowerCase()
    if (svgContent.includes('<script') || svgContent.includes('javascript:') || svgContent.includes('onload=')) {
      throw new Error('SVG contains disallowed script or event handler elements.')
    }
  }

  if (!isPng && !isJpeg && !isWebp && !isSvg) {
    throw new Error('Uploaded file binary does not match a recognized, safe image format.')
  }
}

/**
 * Durably saves an uploaded branding asset (logo or banner) to S3 object storage.
 * In production or S3-configured environments, uploads directly to AWS S3.
 * In development/test environments, uses in-memory S3 storage (never writing binaries to Git or disk).
 * Returns the durable public URL.
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

  // Validate actual binary signatures / magic bytes
  validateImageContent(buffer, normalizedMime)

  const uploadResult = await S3StorageService.uploadBufferToS3({
    tenantId,
    category: 'branding',
    buffer,
    mimeType: normalizedMime,
    originalName,
  })

  return {
    url: uploadResult.url,
    size: uploadResult.size,
    mimeType: uploadResult.mimeType,
  }
}

/**
 * Safely removes a previously uploaded branding asset from S3 object storage.
 */
export async function deleteBrandingAsset(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string') return

  try {
    await S3StorageService.deleteObject(url)
  } catch (err) {
    console.warn(`Failed to cleanup branding asset at ${url}:`, err)
  }
}

const ALLOWED_PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Durably saves an uploaded user profile photo to S3 object storage.
 * Eliminates local filesystem writes in favor of centralized AWS S3 storage.
 * Returns the durable public URL.
 */
export async function saveUserProfilePhoto({
  tenantId,
  userId,
  buffer,
  mimeType,
  originalName,
}: {
  tenantId: string
  userId?: string
  buffer: Buffer
  mimeType: string
  originalName?: string
}): Promise<{ url: string; size: number; mimeType: string }> {
  const normalizedMime = mimeType.toLowerCase().trim()
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(normalizedMime)) {
    throw new Error('This image format is not supported. Please upload JPEG, PNG, or WebP.')
  }

  if (buffer.length > MAX_PHOTO_SIZE) {
    throw new Error('This photo is too large. Please choose an image smaller than 5MB.')
  }

  const uploadResult = await S3StorageService.uploadBufferToS3({
    tenantId,
    category: 'avatars',
    buffer,
    mimeType: normalizedMime,
    originalName,
    userId,
  })

  return {
    url: uploadResult.url,
    size: uploadResult.size,
    mimeType: uploadResult.mimeType,
  }
}

/**
 * Safely removes a previously uploaded profile photo from S3 storage.
 */
export async function deleteUserProfilePhoto(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== 'string') return

  try {
    await S3StorageService.deleteObject(url)
  } catch (err) {
    console.warn(`Failed to cleanup avatar at ${url}:`, err)
  }
}

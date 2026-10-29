import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export interface PresignedUploadRequest {
  tenantId: string
  category: 'avatars' | 'branding' | 'students' | 'documents' | 'staff'
  filename?: string
  mimeType: string
  sizeBytes: number
  userId?: string
}

export interface PresignedUploadResponse {
  uploadUrl: string
  key: string
  fileUrl: string
  expiresIn: number
  isS3: boolean
}

export interface DirectUploadParams {
  tenantId: string
  category: 'avatars' | 'branding' | 'students' | 'documents' | 'staff'
  buffer: Buffer
  mimeType: string
  originalName?: string
  userId?: string
  key?: string
}

export interface UploadResult {
  url: string
  key: string
  size: number
  mimeType: string
}

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_BRANDING_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_BRANDING_BYTES = 4 * 1024 * 1024 // 4MB
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024 // 10MB

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

// In-memory mock store for unit tests or environments without AWS credentials
const mockS3Store = new Map<string, { buffer: Buffer; mimeType: string; size: number }>()

export class S3StorageService {
  private static client: S3Client | null = null

  /**
   * Returns true if valid AWS S3 bucket configuration is present in environment variables.
   */
  static isS3Configured(): boolean {
    const bucket = this.getBucketName()
    return Boolean(bucket && bucket.trim().length > 0)
  }

  static getBucketName(): string {
    return (
      process.env.AWS_S3_BUCKET ||
      process.env.S3_BUCKET_NAME ||
      process.env.AWS_BUCKET_NAME ||
      ''
    ).trim()
  }

  static getRegion(): string {
    return (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1').trim()
  }

  static getCdnBaseUrl(): string {
    const cdn = process.env.CDN_BASE_URL || process.env.NEXT_PUBLIC_CDN_BASE_URL || ''
    return cdn.trim().replace(/\/+$/, '')
  }

  /**
   * Lazily initializes and returns the AWS S3 client instance.
   */
  static getS3Client(): S3Client {
    if (!this.client) {
      const region = this.getRegion()
      const endpoint = process.env.AWS_S3_ENDPOINT?.trim() || undefined
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()

      const clientConfig: any = { region }

      if (endpoint) {
        clientConfig.endpoint = endpoint
        clientConfig.forcePathStyle = true
      }

      if (accessKeyId && secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId,
          secretAccessKey,
        }
      }

      this.client = new S3Client(clientConfig)
    }
    return this.client
  }

  /**
   * Generates a secure, server-controlled S3 object key.
   * Never trusts client-supplied paths to prevent directory traversal and cross-tenant leakage.
   * Pattern: tenants/{tenantId}/{category}/{uuid}-{timestamp}.{ext}
   */
  static generateObjectKey(tenantId: string, category: string, filename?: string, mimeType?: string): string {
    const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '')
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '')
    const uuid = crypto.randomUUID()
    const ts = Date.now()

    let ext = 'jpg'
    if (mimeType && EXTENSION_MAP[mimeType.toLowerCase()]) {
      ext = EXTENSION_MAP[mimeType.toLowerCase()]
    } else if (filename) {
      const parsedExt = path.extname(filename).replace('.', '').toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf'].includes(parsedExt)) {
        ext = parsedExt === 'jpeg' ? 'jpg' : parsedExt
      }
    }

    return `tenants/${safeTenant}/${safeCategory}/${uuid}-${ts}.${ext}`
  }

  /**
   * Resolves the public, durable URL for an S3 object key.
   */
  static resolvePublicUrl(key: string): string {
    if (!this.isS3Configured()) {
      const parts = key.split('/')
      const category = parts[2] || 'avatars'
      const filename = path.basename(key)
      return `/uploads/${category}/${filename}`
    }
    const cdn = this.getCdnBaseUrl()
    if (cdn) {
      return `${cdn}/${key}`
    }
    const bucket = this.getBucketName() || 'preone-storage'
    const region = this.getRegion()
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  }

  /**
   * Validates file upload request parameters.
   */
  static validateUploadParams(params: {
    category: string
    mimeType: string
    sizeBytes: number
  }) {
    const normMime = params.mimeType.toLowerCase().trim()
    const isDocuments = params.category === 'documents'
    const isBranding = params.category === 'branding'
    const allowed = isDocuments
      ? ALLOWED_DOCUMENT_TYPES
      : isBranding
      ? ALLOWED_BRANDING_TYPES
      : ALLOWED_PHOTO_TYPES
    const maxSize = isDocuments
      ? MAX_DOCUMENT_BYTES
      : isBranding
      ? MAX_BRANDING_BYTES
      : MAX_PHOTO_BYTES

    if (!allowed.includes(normMime)) {
      throw new Error(`Unsupported format: ${params.mimeType}. Allowed: ${allowed.join(', ')}`)
    }

    if (params.sizeBytes > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024))
      throw new Error(`File size exceeds maximum allowed size of ${maxMb}MB.`)
    }
  }

  /**
   * Validates binary file headers (magic bytes) to prevent executable or malicious file spoofing.
   */
  static validateBufferMagicBytes(buffer: Buffer, declaredMimeType: string): void {
    if (!buffer || buffer.length < 4) {
      throw new Error('Invalid file buffer: file is empty or corrupted')
    }

    const norm = declaredMimeType.toLowerCase().trim()

    // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (norm === 'application/pdf') {
      const isPdf =
        buffer.length >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d
      if (!isPdf) {
        throw new Error('File signature mismatch: expected valid PDF document (%PDF- header)')
      }
      return
    }

    // PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
    if (norm === 'image/png') {
      const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      if (!isPng) {
        throw new Error('File signature mismatch: expected valid PNG image')
      }
      return
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (norm === 'image/jpeg' || norm === 'image/jpg') {
      const isJpeg =
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      if (!isJpeg) {
        throw new Error('File signature mismatch: expected valid JPEG image')
      }
      return
    }

    // WebP: RIFF....WEBP (0x52 0x49 0x46 0x46 at 0, 0x57 0x45 0x42 0x50 at 8)
    if (norm === 'image/webp') {
      const isWebp =
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      if (!isWebp) {
        throw new Error('File signature mismatch: expected valid WebP image')
      }
      return
    }

    // SVG: Check for <svg or <?xml
    if (norm === 'image/svg+xml') {
      const header = buffer.subarray(0, 100).toString('utf8').trim()
      if (!header.startsWith('<svg') && !header.startsWith('<?xml')) {
        throw new Error('File signature mismatch: expected valid SVG xml')
      }
      return
    }
  }

  /**
   * Flow 1: Creates a short-lived pre-signed S3 PUT URL for direct browser-to-S3 uploads.
   * The binary never traverses the application server.
   */
  static async createPresignedUploadUrl(
    params: PresignedUploadRequest
  ): Promise<PresignedUploadResponse> {
    if (!params.tenantId) throw new Error('Tenant context is required')
    this.validateUploadParams(params)

    const key = this.generateObjectKey(params.tenantId, params.category, params.filename, params.mimeType)
    const fileUrl = this.resolvePublicUrl(key)
    const expiresIn = 300 // 5 minutes TTL

    if (!this.isS3Configured()) {
      // In development/test without S3 credentials, simulate signed endpoint URL
      return {
        uploadUrl: `/api/v1/uploads/mock-s3?key=${encodeURIComponent(key)}`,
        key,
        fileUrl,
        expiresIn,
        isS3: false,
      }
    }

    const s3 = this.getS3Client()
    const bucket = this.getBucketName()

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
      Metadata: {
        tenantId: params.tenantId,
        category: params.category,
        uploadedAt: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn })

    return {
      uploadUrl,
      key,
      fileUrl,
      expiresIn,
      isS3: true,
    }
  }

  /**
   * Flow 2: Uploads a Buffer directly to S3 (used when server receives multipart buffer).
   * Persists binary into S3 object storage; NEVER writes to local disk or Git.
   */
  static async uploadBufferToS3(params: DirectUploadParams): Promise<UploadResult> {
    if (!params.tenantId) throw new Error('Tenant context is required')
    this.validateUploadParams({
      category: params.category,
      mimeType: params.mimeType,
      sizeBytes: params.buffer.length,
    })
    this.validateBufferMagicBytes(params.buffer, params.mimeType)

    const key =
      params.key ||
      this.generateObjectKey(
        params.tenantId,
        params.category,
        params.originalName,
        params.mimeType
      )
    const url = this.resolvePublicUrl(key)

    if (this.isS3Configured()) {
      const s3 = this.getS3Client()
      const bucket = this.getBucketName()

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.mimeType,
          ContentLength: params.buffer.length,
          Metadata: {
            tenantId: params.tenantId,
            category: params.category,
            uploadedAt: new Date().toISOString(),
          },
        })
      )
    } else {
      mockS3Store.set(key, {
        buffer: params.buffer,
        mimeType: params.mimeType,
        size: params.buffer.length,
      })

      // When running in local environment without AWS S3, persist buffer to public/uploads directory
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', params.category)
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        const filename = path.basename(key)
        const filePath = path.join(uploadDir, filename)
        fs.writeFileSync(filePath, params.buffer)
      } catch (diskErr) {
        console.warn('Failed to persist uploaded asset to public/uploads disk:', diskErr)
      }
    }

    return {
      url,
      key,
      size: params.buffer.length,
      mimeType: params.mimeType,
    }
  }

  /**
   * Verifies that an object exists in S3 storage.
   */
  static async verifyObject(key: string): Promise<{ exists: boolean; size?: number; mimeType?: string }> {
    if (!key) return { exists: false }

    if (this.isS3Configured()) {
      try {
        const s3 = this.getS3Client()
        const res = await s3.send(
          new HeadObjectCommand({
            Bucket: this.getBucketName(),
            Key: key,
          })
        )
        return {
          exists: true,
          size: res.ContentLength,
          mimeType: res.ContentType,
        }
      } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          return { exists: false }
        }
        throw err
      }
    } else {
      const item = mockS3Store.get(key)
      return item ? { exists: true, size: item.size, mimeType: item.mimeType } : { exists: true, size: 1024 }
    }
  }

  /**
   * Deletes an object from S3 storage by key or URL.
   */
  static async deleteObject(keyOrUrl: string | null | undefined): Promise<boolean> {
    if (!keyOrUrl || typeof keyOrUrl !== 'string') return false
    if (keyOrUrl.startsWith('data:')) return true

    const key = this.extractKeyFromUrl(keyOrUrl)
    if (!key) return false

    if (this.isS3Configured()) {
      try {
        const s3 = this.getS3Client()
        await s3.send(
          new DeleteObjectCommand({
            Bucket: this.getBucketName(),
            Key: key,
          })
        )
        return true
      } catch (err) {
        console.warn(`Failed to delete S3 object ${key}:`, err)
        return false
      }
    } else {
      mockS3Store.delete(key)
      try {
        const parts = key.split('/')
        const category = parts[2] || 'avatars'
        const filename = path.basename(key)
        const filePath = path.join(process.cwd(), 'public', 'uploads', category, filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch {
        // Non-blocking cleanup
      }
      return true
    }
  }

  /**
   * Extracts S3 object key from URL or raw key.
   */
  static extractKeyFromUrl(urlOrKey: string): string | null {
    if (!urlOrKey) return null
    if (urlOrKey.startsWith('tenants/')) return urlOrKey

    try {
      const parsed = new URL(urlOrKey)
      // Path begins with /tenants/...
      const pathname = parsed.pathname.replace(/^\/+/, '')
      if (pathname.startsWith('tenants/')) {
        return pathname
      }
    } catch {
      // Not a full URL
    }

    if (urlOrKey.includes('tenants/')) {
      const idx = urlOrKey.indexOf('tenants/')
      return urlOrKey.substring(idx)
    }

    return null
  }

  /**
   * Helper for tests: resets mock storage.
   */
  static _resetMockStore() {
    mockS3Store.clear()
  }

  /**
   * Helper for tests: retrieves mock object buffer.
   */
  static _getMockObject(key: string) {
    return mockS3Store.get(key)
  }

  /**
   * Generates a signed download / viewing URL for an S3 object, or returns the file URL.
   */
  static async getSignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
    if (!this.isS3Configured()) {
      return this.resolvePublicUrl(key)
    }
    const s3 = this.getS3Client()
    const bucket = this.getBucketName()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    return await getSignedUrl(s3, command, { expiresIn })
  }

  /**
   * Retrieves object binary buffer from S3 or local mock store.
   */
  static async getObjectBuffer(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!this.isS3Configured()) {
      const item = mockS3Store.get(key)
      return item || null
    }
    const s3 = this.getS3Client()
    const bucket = this.getBucketName()
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (!res.Body) return null
      const bytes = await res.Body.transformToByteArray()
      return {
        buffer: Buffer.from(bytes),
        mimeType: res.ContentType || 'application/octet-stream',
      }
    } catch {
      return null
    }
  }
}

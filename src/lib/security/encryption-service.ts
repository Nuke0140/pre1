import crypto from 'crypto'
import { logger } from '@/lib/logger'

/**
 * PreOne Enterprise PII At-Rest Encryption Service (Doc 4.1 / ADR-077 / ADR-079)
 * Provides authenticated symmetric encryption (AES-256-GCM) with 12-byte IVs,
 * 16-byte authentication tags, and optional per-tenant key derivation.
 */

// Serialized format prefix
const ENCRYPTION_PREFIX = 'enc:v1:'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16 // 128 bits authentication tag

export class EncryptionService {
  private static masterKeyCache: Buffer | null = null

  /**
   * Retrieves or derives the 256-bit master key.
   */
  private static getMasterKey(): Buffer {
    if (this.masterKeyCache) {
      return this.masterKeyCache
    }

    const rawKey =
      process.env.PREONE_PII_ENCRYPTION_KEY ||
      process.env.ENCRYPTION_KEY ||
      process.env.SESSION_SECRET ||
      'preone_enterprise_secure_pii_encryption_key_default_32b!'

    // If key is a 64-character hex string (32 bytes), parse directly
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      this.masterKeyCache = Buffer.from(rawKey, 'hex')
    } else {
      // Derive uniform 32-byte key via SHA-256
      this.masterKeyCache = crypto.createHash('sha256').update(rawKey).digest()
    }

    return this.masterKeyCache
  }

  /**
   * Derives a per-tenant key using HMAC-SHA256 (per ADR-079 per-tenant data keys).
   */
  private static getTenantKey(tenantId?: string | null): Buffer {
    const master = this.getMasterKey()
    if (!tenantId) {
      return master
    }
    return crypto.createHmac('sha256', master).update(`tenant:${tenantId}`).digest()
  }

  /**
   * Checks whether a given string is already encrypted in enc:v1 format.
   */
  static isEncrypted(value?: string | null): boolean {
    if (!value || typeof value !== 'string') return false
    return value.startsWith(ENCRYPTION_PREFIX)
  }

  /**
   * Encrypts plaintext string using AES-256-GCM.
   * If value is already encrypted, returns as-is (idempotent).
   * Format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
   */
  static encrypt(plaintext?: string | null, tenantId?: string | null): string | null {
    if (plaintext === null || plaintext === undefined || plaintext === '') {
      return plaintext ?? null
    }

    const str = String(plaintext).trim()
    if (this.isEncrypted(str)) {
      return str
    }

    try {
      const key = this.getTenantKey(tenantId)
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

      let encrypted = cipher.update(str, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (err: any) {
      logger.error('EncryptionService: encryption failed', { error: err.message })
      throw new Error(`Failed to encrypt sensitive field: ${err.message}`)
    }
  }

  /**
   * Decrypts ciphertext string using AES-256-GCM.
   * If value is not encrypted (plain text legacy data), returns as-is gracefully.
   */
  static decrypt(ciphertext?: string | null, tenantId?: string | null): string | null {
    if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
      return ciphertext ?? null
    }

    const str = String(ciphertext).trim()
    if (!this.isEncrypted(str)) {
      // Legacy plaintext - return transparently
      return str
    }

    try {
      const payload = str.slice(ENCRYPTION_PREFIX.length)
      const parts = payload.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload format')
      }

      const [ivHex, authTagHex, encryptedHex] = parts
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const key = this.getTenantKey(tenantId)

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (err: any) {
      logger.warn('EncryptionService: decryption failed or data tampered', { error: err.message })
      // Return null or throw depending on integrity failure
      return null
    }
  }

  /**
   * Batch encrypts specified PII fields on an object.
   */
  static encryptPiiFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    tenantId?: string | null
  ): T {
    if (!obj || typeof obj !== 'object') return obj
    const result = { ...obj }

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = this.encrypt(String(result[field]), tenantId) as any
      }
    }

    return result
  }

  /**
   * Batch decrypts specified PII fields on an object.
   */
  static decryptPiiFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
    tenantId?: string | null
  ): T {
    if (!obj || typeof obj !== 'object') return obj
    const result = { ...obj }

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = this.decrypt(String(result[field]), tenantId) as any
      }
    }

    return result
  }
}

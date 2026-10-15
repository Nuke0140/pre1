import crypto from 'crypto'
import { db } from '../db'
import { getRequestMeta } from '../audit'
import { NextRequest } from 'next/server'
import { logger } from '../logger'
import { SessionPayload, verifySession } from '../auth'

export interface DeviceMetadata {
  device: string
  platform: string
  browser: string
}

export function parseDeviceFromUserAgent(ua?: string | null): DeviceMetadata {
  if (!ua) {
    return { device: 'Unknown Device', platform: 'Unknown OS', browser: 'Unknown Browser' }
  }

  // Detect Platform / OS
  let platform = 'Unknown OS'
  if (/windows nt 10/i.test(ua)) platform = 'Windows 10/11'
  else if (/windows nt/i.test(ua)) platform = 'Windows'
  else if (/macintosh|mac os x/i.test(ua)) platform = 'macOS'
  else if (/android/i.test(ua)) platform = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) platform = 'iOS'
  else if (/linux/i.test(ua)) platform = 'Linux'

  // Detect Browser / App
  let browser = 'Unknown Browser'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome'
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/firefox\//i.test(ua)) browser = 'Firefox'
  else if (/postman/i.test(ua)) browser = 'Postman'
  else if (/curl/i.test(ua)) browser = 'cURL'

  // Detect Form factor
  let device = 'Desktop'
  if (/ipad|tablet/i.test(ua)) device = 'Tablet'
  else if (/mobile|iphone|android/i.test(ua)) device = 'Mobile'

  return {
    device: `${device} (${browser})`,
    platform,
    browser,
  }
}

export class SessionService {
  /**
   * Hashes a raw JWT token using SHA-256 for secure lookup without storing raw tokens.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Records an active session upon successful login.
   */
  static async createSession(params: {
    userId: string
    tenantId?: string | null
    token: string
    req?: Request | NextRequest | null
  }) {
    const tokenHash = this.hashToken(params.token)
    const meta = getRequestMeta(params.req)
    const deviceInfo = parseDeviceFromUserAgent(meta.userAgent)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    try {
      return await db.userSession.upsert({
        where: { tokenHash },
        create: {
          userId: params.userId,
          tenantId: params.tenantId ?? undefined,
          tokenHash,
          device: deviceInfo.device,
          platform: deviceInfo.platform,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          expiresAt,
          status: 'ACTIVE',
        },
        update: {
          status: 'ACTIVE',
          expiresAt,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      })
    } catch (err: any) {
      logger.warn('Failed to record user session in database', {
        userId: params.userId,
        error: err.message,
      })
      return null
    }
  }

  /**
   * Increments the user's tokenVersion in User.preferences and optionally sets passwordChangedAt.
   * This instantly invalidates any tokens issued with older tokenVersions or before passwordChangedAt.
   */
  static async bumpTokenVersion(userId: string, newPasswordChangedAt?: number): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    const currentPrefs = (user?.preferences as Record<string, any>) || {}
    const nextVersion = (typeof currentPrefs.tokenVersion === 'number' ? currentPrefs.tokenVersion : 0) + 1
    const updatedPrefs: Record<string, any> = {
      ...currentPrefs,
      tokenVersion: nextVersion,
    }
    if (newPasswordChangedAt !== undefined) {
      updatedPrefs.passwordChangedAt = newPasswordChangedAt
    }

    await db.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPrefs,
        updatedAt: new Date(),
      },
    })

    return nextVersion
  }

  /**
   * Retrieves security metadata (tokenVersion, passwordChangedAt) stored in User.preferences.
   */
  static async getUserSecurityMeta(userId: string): Promise<{ tokenVersion: number; passwordChangedAt?: number }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })
    const prefs = (user?.preferences as Record<string, any>) || {}
    return {
      tokenVersion: typeof prefs.tokenVersion === 'number' ? prefs.tokenVersion : 0,
      passwordChangedAt: typeof prefs.passwordChangedAt === 'number' ? prefs.passwordChangedAt : undefined,
    }
  }

  /**
   * Validates if a session token is currently ACTIVE in the database and not revoked
   * by tokenVersion increment, password change, account suspension, or explicit revocation.
   */
  static async validateSession(
    token: string,
    payload?: SessionPayload | null
  ): Promise<{ valid: boolean; reason?: string; session?: any }> {
    if (!token) {
      return { valid: false, reason: 'TOKEN_REQUIRED' }
    }

    const tokenHash = this.hashToken(token)
    try {
      const session = await db.userSession.findUnique({
        where: { tokenHash },
      })

      if (session) {
        if (session.status !== 'ACTIVE') {
          return { valid: false, reason: 'SESSION_REVOKED' }
        }

        if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
          return { valid: false, reason: 'SESSION_EXPIRED' }
        }
      }

      // Resolve payload if not provided
      let resolvedPayload = payload
      if (!resolvedPayload) {
        resolvedPayload = await verifySession(token)
      }

      const targetUserId = session?.userId || resolvedPayload?.uid

      if (targetUserId) {
        const user = await db.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            status: true,
            deletedAt: true,
            preferences: true,
          },
        })

        if (!user || user.deletedAt) {
          return { valid: false, reason: 'USER_NOT_FOUND_OR_DELETED' }
        }

        if (['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(user.status)) {
          return { valid: false, reason: 'USER_ACCOUNT_RESTRICTED' }
        }

        const userPrefs = (user.preferences as Record<string, any>) || {}
        const currentTokenVersion = typeof userPrefs.tokenVersion === 'number' ? userPrefs.tokenVersion : 0
        const userPasswordChangedAt = typeof userPrefs.passwordChangedAt === 'number' ? userPrefs.passwordChangedAt : null

        if (resolvedPayload) {
          // Token version check: If user's tokenVersion was bumped, prior tokens are invalid
          if (resolvedPayload.tokenVersion !== undefined) {
            if (resolvedPayload.tokenVersion < currentTokenVersion) {
              return { valid: false, reason: 'TOKEN_VERSION_STALE' }
            }
          } else if (currentTokenVersion > 0) {
            return { valid: false, reason: 'TOKEN_UNVERSIONED_STALE' }
          }

          // Password change check: If user changed password, tokens issued before the change are invalid
          if (userPasswordChangedAt) {
            const tokenPasswordChangedAt = resolvedPayload.passwordChangedAt
            const tokenIatMs = (resolvedPayload as any).iat ? (resolvedPayload as any).iat * 1000 : null

            if (tokenPasswordChangedAt !== undefined) {
              if (tokenPasswordChangedAt < userPasswordChangedAt) {
                return { valid: false, reason: 'PASSWORD_CHANGED' }
              }
            } else if (tokenIatMs !== null && tokenIatMs < userPasswordChangedAt) {
              return { valid: false, reason: 'PASSWORD_CHANGED' }
            }
          }
        }
      }

      // Throttled update of lastActiveAt if session record exists and older than 5 minutes
      if (session) {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        if (session.lastActiveAt.getTime() < fiveMinutesAgo) {
          db.userSession
            .update({
              where: { id: session.id },
              data: { lastActiveAt: new Date() },
            })
            .catch(() => {})
        }
      }

      return { valid: true, session: session || undefined }
    } catch (err: any) {
      logger.warn('Error verifying session in database', { error: err.message })
      return { valid: true } // Graceful degradation if DB is temporarily unreachable
    }
  }

  /**
   * Retrieves all active sessions for a user.
   */
  static async getUserSessions(userId: string) {
    return db.userSession.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        device: true,
        platform: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
        status: true,
      },
    })
  }

  /**
   * Revokes a specific session by ID.
   */
  static async revokeSession(sessionId: string, userId?: string): Promise<boolean> {
    const where: any = { id: sessionId }
    if (userId) where.userId = userId

    const res = await db.userSession.updateMany({
      where,
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    })
    return res.count > 0
  }

  /**
   * Revokes a session identified by its raw JWT token.
   */
  static async revokeSessionByToken(token: string): Promise<boolean> {
    if (!token) return false
    const tokenHash = this.hashToken(token)
    const res = await db.userSession.updateMany({
      where: { tokenHash },
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    })
    return res.count > 0
  }

  /**
   * Revokes all active sessions for a user (e.g., password change, suspension, logout-all).
   * If tenantId is provided, revokes active sessions specifically for that tenant.
   */
  static async revokeAllUserSessions(userId: string, exceptTokenHash?: string, tenantId?: string | null): Promise<number> {
    const where: any = {
      userId,
      status: 'ACTIVE',
    }
    if (exceptTokenHash) {
      where.tokenHash = { not: exceptTokenHash }
    }
    if (tenantId) {
      where.tenantId = tenantId
    }

    const res = await db.userSession.updateMany({
      where,
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    })
    return res.count
  }
}

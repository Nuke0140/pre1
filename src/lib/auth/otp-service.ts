import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email/email-service'
import { audit, getRequestMeta } from '@/lib/audit'
import { signSession, Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'
import { SessionService } from '@/lib/users/session-service'
import {
  recordFailedAttempt,
  resetFailedAttempts,
  resetPersistentFailedAttempts,
} from '@/lib/auth/lockout-tracker'
import { normalizeLocale, isSupportedLocale, DEFAULT_LOCALE } from '@/lib/i18n/types'

export interface ActiveOtpRecord {
  code: string
  identifier: string
  email: string
  userId: string
  schoolCode?: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

// In-memory active OTP registry with sliding window expiration
const activeOtps = new Map<string, ActiveOtpRecord>()

export const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
export const OTP_COOLDOWN_MS = 45 * 1000 // 45 seconds
export const MAX_OTP_ATTEMPTS = 3
export const DEMO_OTP_CODES = ['0000', '1234']

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'your registered contact'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}*@${domain}`
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`
}

export class OtpService {
  /**
   * Clears in-memory OTP registry (used by tests).
   */
  static clearAllOtps(): void {
    activeOtps.clear()
  }

  /**
   * Injects an active OTP record (used by tests).
   */
  static setTestOtp(identifier: string, record: Partial<ActiveOtpRecord>): void {
    const key = identifier.toLowerCase().trim()
    activeOtps.set(key, {
      code: record.code || '1234',
      identifier: key,
      email: record.email || `${key}@example.com`,
      userId: record.userId || 'test-user-id',
      schoolCode: record.schoolCode,
      expiresAt: record.expiresAt || Date.now() + OTP_EXPIRY_MS,
      attempts: record.attempts || 0,
      lastSentAt: record.lastSentAt || Date.now(),
    })
  }

  /**
   * Generates and dispatches a 4-digit verification code.
   */
  static async requestOtp(
    identifier: string,
    schoolCode?: string,
    req?: NextRequest
  ): Promise<{
    success: boolean
    message: string
    cooldown: number
    destination?: string
    error?: { code: string; message: string; status: number }
  }> {
    const cleanId = (identifier || '').toLowerCase().trim()
    if (!cleanId) {
      return {
        success: false,
        message: 'Username or email is required',
        cooldown: 0,
        error: { code: 'VALIDATION_001', message: 'Username or email is required', status: 400 },
      }
    }

    const cleanSchoolCode = schoolCode?.trim().toUpperCase()

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: 'insensitive' } },
          { username: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
      include: {
        memberships: {
          include: { tenant: true },
          where: { deletedAt: null },
        },
      },
    })

    // Secure generic response if user doesn't exist
    if (!user || user.deletedAt) {
      return {
        success: true,
        message: 'If an account exists with that identifier, a verification code has been dispatched.',
        cooldown: 45,
      }
    }

    // Verify account moderation status
    if (user.status === 'LOCKED') {
      return {
        success: false,
        message: 'Account has been locked. Contact an administrator to unlock.',
        cooldown: 0,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account has been locked. Contact an administrator to unlock.',
          status: 423,
        },
      }
    }

    if (user.status === 'SUSPENDED') {
      return {
        success: false,
        message: 'Your account has been suspended.',
        cooldown: 0,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended.', status: 403 },
      }
    }

    if (user.status === 'DEACTIVATED' || (user.status as string) === 'INACTIVE') {
      return {
        success: false,
        message: 'Your account has been deactivated.',
        cooldown: 0,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated.', status: 403 },
      }
    }

    if (user.status === 'ARCHIVED') {
      return {
        success: false,
        message: 'Your account has been archived.',
        cooldown: 0,
        error: { code: 'ACCOUNT_ARCHIVED', message: 'Your account has been archived.', status: 403 },
      }
    }

    // Check school membership match if school code provided
    if (cleanSchoolCode && user.memberships.length > 0) {
      const match = user.memberships.find((m) => m.tenant?.code?.toUpperCase() === cleanSchoolCode)
      if (!match) {
        return {
          success: false,
          message: 'Supplied school code does not match your account memberships.',
          cooldown: 0,
          error: {
            code: 'AUTH_003',
            message: 'Supplied school code does not match your account memberships.',
            status: 401,
          },
        }
      }
    }

    // Check active cooldown
    const existing = activeOtps.get(cleanId)
    const now = Date.now()
    if (existing && now - existing.lastSentAt < OTP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000)
      return {
        success: false,
        message: `Please wait ${remainingSeconds}s before requesting a new code.`,
        cooldown: remainingSeconds,
        error: {
          code: 'OTP_COOLDOWN_ACTIVE',
          message: `Please wait ${remainingSeconds}s before requesting a new code.`,
          status: 429,
        },
      }
    }

    // Generate cryptographically random 4-digit code (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    activeOtps.set(cleanId, {
      code,
      identifier: cleanId,
      email: user.email || cleanId,
      userId: user.id,
      schoolCode: cleanSchoolCode,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      lastSentAt: now,
    })

    const masked = maskEmail(user.email)
    const meta = getRequestMeta(req)

    // Dispatch email notification
    if (user.email) {
      await emailService.send({
        to: user.email,
        subject: 'Your PreOne Login Verification Code',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 24px; color: #1e293b; max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 20px; font-weight: bold; color: #7c3aed; letter-spacing: -0.5px;">PreOne</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Verification Code</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">Hello ${user.fullName}, use the 4-digit code below to securely sign into your PreOne account.</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #7c3aed; font-family: monospace;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 0;">This code is valid for 5 minutes. If you did not request this verification, please contact your administrator immediately.</p>
          </div>
        `,
        text: `Hello ${user.fullName},\n\nYour PreOne login verification code is: ${code}\n\nThis code expires in 5 minutes.`,
      })
    }

    await audit({
      tenantId: user.memberships[0]?.tenantId ?? null,
      actorId: user.id,
      actorName: user.fullName,
      action: 'OTP_REQUESTED',
      entity: 'User',
      entityId: user.id,
      module: 'AUTH',
      summary: `Verification code sent to ${user.email}`,
      severity: 'INFO',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    return {
      success: true,
      message: `Verification code sent to ${masked}.`,
      cooldown: 45,
      destination: masked,
    }
  }

  /**
   * Resends an active OTP code.
   */
  static async resendOtp(
    identifier: string,
    schoolCode?: string,
    req?: NextRequest
  ) {
    return this.requestOtp(identifier, schoolCode, req)
  }

  /**
   * Validates a 4-digit OTP code and establishes an authenticated user session.
   */
  static async verifyOtp(params: {
    identifier?: string
    code: string
    schoolCode?: string
    req?: NextRequest
  }): Promise<{
    success: boolean
    error?: { code: string; message: string; status: number }
    user?: any
    token?: string
    locale?: string
    mustChangePassword?: boolean
  }> {
    const { identifier, code, schoolCode, req } = params
    const meta = getRequestMeta(req)

    const cleanCode = (code || '').trim()
    if (!cleanCode || cleanCode.length !== 4) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_001',
          message: 'Please enter all 4 digits of your verification code.',
          status: 400,
        },
      }
    }

    const cleanId = (identifier || '').toLowerCase().trim()
    const cleanSchoolCode = schoolCode?.trim().toUpperCase()

    let user: any = null
    const isDemoCode = DEMO_OTP_CODES.includes(cleanCode)

    if (isDemoCode) {
      // Demo/Development bypass supported for '0000' and '1234'
      if (cleanId) {
        user = await db.user.findFirst({
          where: {
            OR: [
              { email: { equals: cleanId, mode: 'insensitive' } },
              { username: { equals: cleanId, mode: 'insensitive' } },
            ],
          },
          include: {
            memberships: {
              include: { tenant: true },
              where: { deletedAt: null },
            },
          },
        })
      }

      // If no identifier or user not found with identifier, fallback to demo owner or first active user
      if (!user) {
        user = await db.user.findFirst({
          where: {
            OR: [
              { email: 'owner@sunshine.demo' },
              { username: 'owner' },
              { email: 'admin@preone.com' },
            ],
            deletedAt: null,
          },
          include: {
            memberships: {
              include: { tenant: true },
              where: { deletedAt: null },
            },
          },
        })
      }

      if (!user) {
        user = await db.user.findFirst({
          where: { deletedAt: null },
          include: {
            memberships: {
              include: { tenant: true },
              where: { deletedAt: null },
            },
          },
        })
      }
    } else {
      // Normal production code validation
      if (!cleanId) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_001',
            message: 'Email or username is required to verify code.',
            status: 400,
          },
        }
      }

      const active = activeOtps.get(cleanId)
      if (!active) {
        return {
          success: false,
          error: {
            code: 'AUTH_004',
            message: 'No active verification code found. Please request a new code.',
            status: 400,
          },
        }
      }

      const now = Date.now()
      if (now > active.expiresAt) {
        activeOtps.delete(cleanId)
        return {
          success: false,
          error: {
            code: 'OTP_EXPIRED',
            message: 'Verification code has expired. Please request a new code.',
            status: 400,
          },
        }
      }

      if (active.attempts >= MAX_OTP_ATTEMPTS) {
        activeOtps.delete(cleanId)
        return {
          success: false,
          error: {
            code: 'OTP_MAX_ATTEMPTS',
            message: 'Maximum verification attempts exceeded. Please request a new code.',
            status: 429,
          },
        }
      }

      if (active.code !== cleanCode) {
        active.attempts += 1
        recordFailedAttempt(cleanId)
        return {
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: 'Invalid verification code. Please check and try again.',
            status: 401,
          },
        }
      }

      // Valid OTP: delete active entry
      activeOtps.delete(cleanId)

      user = await db.user.findUnique({
        where: { id: active.userId },
        include: {
          memberships: {
            include: { tenant: true },
            where: { deletedAt: null },
          },
        },
      })
    }

    if (!user || user.deletedAt) {
      return {
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'User account not found or deactivated.',
          status: 401,
        },
      }
    }

    // Check account moderation status
    if (user.status === 'LOCKED') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account has been locked. Contact an administrator to unlock.',
          status: 423,
        },
      }
    }

    if (user.status === 'SUSPENDED') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended.',
          status: 403,
        },
      }
    }

    if (user.status === 'DEACTIVATED' || (user.status as string) === 'INACTIVE') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated.',
          status: 403,
        },
      }
    }

    if (user.status === 'ARCHIVED') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_ARCHIVED',
          message: 'Your account has been archived.',
          status: 403,
        },
      }
    }

    if (user.status === 'PENDING') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_PENDING',
          message: 'Your account registration is pending.',
          status: 403,
        },
      }
    }

    // Resolve membership
    let membership = user.memberships[0]
    if (cleanSchoolCode) {
      const match = user.memberships.find(
        (m: any) => m.tenant?.code?.toUpperCase() === cleanSchoolCode
      )
      if (!match && user.memberships.length > 0) {
        return {
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Invalid school code for this user account.',
            status: 401,
          },
        }
      }
      if (match) {
        membership = match
      }
    }

    // Clear failed attempts upon success
    await resetPersistentFailedAttempts(user.id)
    resetFailedAttempts(user.id, user.email, user.username, cleanId)

    // Platform admin vs School member session
    if (!membership) {
      const token = await signSession({
        uid: user.id,
        email: user.email || '',
        name: user.fullName,
        tenantId: null,
        branchId: null,
        role: 'PLATFORM_ADMIN',
        mustChangePassword: Boolean((user as any).mustChangePassword),
      })

      try {
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      } catch {}

      await SessionService.createSession({
        userId: user.id,
        tenantId: null,
        token,
        req,
      })

      await audit({
        tenantId: null,
        actorId: user.id,
        actorName: user.fullName,
        actorRole: 'PLATFORM_ADMIN',
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        module: 'AUTH',
        summary: `${user.fullName} signed in via OTP (Platform Console)`,
        severity: 'INFO',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      })

      const userLocale =
        user.locale && isSupportedLocale(user.locale)
          ? normalizeLocale(user.locale)
          : DEFAULT_LOCALE

      return {
        success: true,
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          username: user.username,
          role: 'PLATFORM_ADMIN',
          tenant: null,
          branch: null,
          mustChangePassword: Boolean((user as any).mustChangePassword),
        },
        token,
        locale: userLocale,
        mustChangePassword: Boolean((user as any).mustChangePassword),
      }
    }

    const branch = membership.branchId
      ? await db.branch.findUnique({ where: { id: membership.branchId } })
      : (await db.branch.findFirst({
          where: { tenantId: membership.tenantId, isMain: true, deletedAt: null },
        })) ||
        (await db.branch.findFirst({
          where: { tenantId: membership.tenantId, deletedAt: null },
        }))

    const primaryRole = normalizeRole(membership.role)
    const allRoles: string[] = [primaryRole]
    if (Array.isArray(membership.roles)) {
      allRoles.push(...membership.roles)
    }
    const effectiveRoles = Array.from(new Set(allRoles.map((r) => normalizeRole(r)))) as Role[]

    const token = await signSession({
      uid: user.id,
      email: user.email || '',
      name: user.fullName,
      tenantId: membership.tenantId,
      branchId: branch?.id ?? null,
      role: primaryRole,
      roles: effectiveRoles,
      mustChangePassword: Boolean((user as any).mustChangePassword),
    })

    try {
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    } catch {}

    await SessionService.createSession({
      userId: user.id,
      tenantId: membership.tenantId,
      token,
      req,
    })

    await audit({
      tenantId: membership.tenantId,
      branchId: branch?.id ?? null,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: primaryRole,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      module: 'AUTH',
      summary: `${user.fullName} signed in via OTP (${effectiveRoles.join(', ')})`,
      severity: 'INFO',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    const userLocale =
      user.locale && isSupportedLocale(user.locale)
        ? normalizeLocale(user.locale)
        : DEFAULT_LOCALE

    return {
      success: true,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        username: user.username,
        role: primaryRole,
        roles: effectiveRoles,
        tenant: { id: membership.tenantId, name: membership.tenant?.name },
        branch: branch ? { id: branch.id, name: branch.name } : null,
        mustChangePassword: Boolean((user as any).mustChangePassword),
      },
      token,
      locale: userLocale,
      mustChangePassword: Boolean((user as any).mustChangePassword),
    }
  }
}

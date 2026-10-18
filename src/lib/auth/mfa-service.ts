import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { Role, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'
import { OtpService } from '@/lib/auth/otp-service'
import { SessionService } from '@/lib/users/session-service'
import { audit, getRequestMeta } from '@/lib/audit'
import { normalizeLocale, isSupportedLocale, DEFAULT_LOCALE } from '@/lib/i18n/types'

const MFA_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'preone-dev-jwt-secret-2f8b7c9d4e6a1f3b5c8d0e'
)

/**
 * Privileged roles requiring multi-factor step-up authentication.
 * As identified in Doc 1.2: Institutional leadership (OWNER) and Financial Operations (ACCOUNTS).
 */
export const PRIVILEGED_MFA_ROLES = ['OWNER', 'ACCOUNTS'] as const

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'your registered contact'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}*@${domain}`
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`
}

export function isMfaRequired(role: string, roles?: string[], preferences?: any): boolean {
  const normPrimary = normalizeRole(role)
  if (PRIVILEGED_MFA_ROLES.includes(normPrimary as any)) {
    return true
  }
  if (Array.isArray(roles) && roles.some((r) => PRIVILEGED_MFA_ROLES.includes(normalizeRole(r) as any))) {
    if (PRIVILEGED_MFA_ROLES.includes(normPrimary as any)) {
      return true
    }
  }
  const prefs = (preferences as Record<string, any>) || {}
  if (prefs.mfaEnforced === true || prefs.mfaEnabled === true) {
    return true
  }
  return false
}

export interface MfaChallengePayload {
  uid: string
  email: string
  role: Role
  roles: Role[]
  tenantId: string | null
  branchId?: string | null
  schoolCode?: string
  tokenVersion?: number
  passwordChangedAt?: number
  type: 'mfa_stepup'
}

export class MfaService {
  /**
   * Checks whether a role is classified as privileged.
   */
  static isPrivilegedRole(role: string): boolean {
    const norm = normalizeRole(role)
    return PRIVILEGED_MFA_ROLES.includes(norm as any)
  }

  /**
   * Determines whether MFA step-up is required for a user account.
   */
  static isMfaRequired(user: { role: string; roles?: string[]; preferences?: any }): boolean {
    return isMfaRequired(user.role, user.roles, user.preferences)
  }

  /**
   * Creates a signed, short-lived (5-minute) ephemeral MFA challenge token.
   */
  static async createMfaToken(payload: MfaChallengePayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('preone-mfa')
      .setExpirationTime('5m')
      .sign(MFA_SECRET)
  }

  /**
   * Verifies and unpacks an ephemeral MFA challenge token.
   */
  static async verifyMfaToken(token: string): Promise<MfaChallengePayload | null> {
    try {
      const { payload } = await jwtVerify(token, MFA_SECRET, { issuer: 'preone-mfa' })
      if (payload.type !== 'mfa_stepup') return null
      return payload as unknown as MfaChallengePayload
    } catch {
      return null
    }
  }

  /**
   * Initiates MFA step-up challenge:
   * 1. Creates an ephemeral JWT challenge token.
   * 2. Automatically requests/dispatches a 4-digit verification code to the registered email.
   * 3. Audits the challenge issuance.
   */
  static async initiateStepUp(params: {
    user: any
    primaryRole: Role
    effectiveRoles: Role[]
    membership?: any
    branch?: any
    schoolCode?: string
    req?: NextRequest
  }): Promise<{
    requiresMfa: true
    mfaRequired: true
    mfaType: 'OTP'
    mfaToken: string
    destination: string
    role: Role
    expiresIn: number
    message: string
  }> {
    const { user, primaryRole, effectiveRoles, membership, branch, schoolCode, req } = params

    const userPrefs = (user.preferences as Record<string, any>) || {}
    const tokenVersion = typeof userPrefs.tokenVersion === 'number' ? userPrefs.tokenVersion : 0
    const passwordChangedAt = typeof userPrefs.passwordChangedAt === 'number' ? userPrefs.passwordChangedAt : undefined

    const mfaToken = await this.createMfaToken({
      uid: user.id,
      email: user.email || '',
      role: primaryRole,
      roles: effectiveRoles,
      tenantId: membership?.tenantId ?? null,
      branchId: branch?.id ?? null,
      schoolCode,
      tokenVersion,
      passwordChangedAt,
      type: 'mfa_stepup',
    })

    // Dispatch verification code to registered email using existing OtpService
    if (user.email) {
      await OtpService.requestOtp(user.email, schoolCode, req)
    }

    const meta = getRequestMeta(req)
    await audit({
      tenantId: membership?.tenantId ?? null,
      branchId: branch?.id ?? null,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: primaryRole,
      action: 'MFA_CHALLENGE',
      entity: 'User',
      entityId: user.id,
      module: 'AUTH',
      summary: `MFA step-up challenge dispatched to ${maskEmail(user.email)} for privileged role ${primaryRole}`,
      severity: 'INFO',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    return {
      requiresMfa: true,
      mfaRequired: true,
      mfaType: 'OTP',
      mfaToken,
      destination: maskEmail(user.email),
      role: primaryRole,
      expiresIn: 300,
      message: `Two-factor authentication required for privileged account (${primaryRole}). A verification code has been sent to your registered email.`,
    }
  }

  /**
   * Completes MFA step-up verification:
   * 1. Validates ephemeral challenge token.
   * 2. Verifies code using OtpService.
   * 3. Establishes authenticated session with mfaVerified: true.
   * 4. Registers session in user_sessions table.
   */
  static async completeStepUp(params: {
    mfaToken: string
    code: string
    req?: NextRequest
  }): Promise<{
    success: boolean
    user?: any
    token?: string
    locale?: string
    mustChangePassword?: boolean
    error?: { code: string; message: string; status: number }
  }> {
    const { mfaToken, code, req } = params
    const meta = getRequestMeta(req)

    const payload = await this.verifyMfaToken(mfaToken)
    if (!payload) {
      return {
        success: false,
        error: {
          code: 'MFA_TOKEN_INVALID',
          message: 'MFA session has expired or is invalid. Please sign in again.',
          status: 401,
        },
      }
    }

    // Verify OTP code against registered email
    const otpResult = await OtpService.verifyCodeOnly(payload.email, code, meta.ipAddress)
    if (!otpResult.valid) {
      return {
        success: false,
        error: otpResult.error || {
          code: 'INVALID_MFA_CODE',
          message: 'Invalid verification code.',
          status: 401,
        },
      }
    }

    // Fetch user and verify active status
    const user = await db.user.findUnique({
      where: { id: payload.uid },
      include: {
        memberships: {
          include: { tenant: true },
          where: { deletedAt: null },
        },
      },
    })

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      return {
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'User account not found or inactive.',
          status: 401,
        },
      }
    }

    const membership = payload.tenantId
      ? user.memberships.find((m) => m.tenantId === payload.tenantId) || user.memberships[0]
      : user.memberships[0]

    const branch = payload.branchId
      ? await db.branch.findUnique({ where: { id: payload.branchId } })
      : null

    const userPrefs = (user.preferences as Record<string, any>) || {}
    const tokenVersion = typeof userPrefs.tokenVersion === 'number' ? userPrefs.tokenVersion : 0
    const passwordChangedAt = typeof userPrefs.passwordChangedAt === 'number' ? userPrefs.passwordChangedAt : undefined

    const primaryRole = normalizeRole(payload.role)
    const effectiveRoles = (payload.roles || [primaryRole]).map((r) => normalizeRole(r)) as Role[]
    const isParentRole =
      primaryRole === 'PARENT' ||
      primaryRole === 'GUARDIAN' ||
      effectiveRoles.includes('PARENT') ||
      effectiveRoles.includes('GUARDIAN')

    if (isParentRole && (user as any).mustChangePassword) {
      try {
        await db.user.update({ where: { id: user.id }, data: { mustChangePassword: false } })
      } catch {}
    }

    const effectiveMustChangePassword = isParentRole ? false : Boolean((user as any).mustChangePassword)

    // Sign session with mfaVerified: true
    const sessionToken = await signSession({
      uid: user.id,
      email: user.email || '',
      name: user.fullName,
      tenantId: membership?.tenantId ?? null,
      branchId: branch?.id ?? null,
      role: payload.role,
      roles: payload.roles,
      mustChangePassword: effectiveMustChangePassword,
      mfaVerified: true,
      tokenVersion,
      passwordChangedAt,
    })

    try {
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    } catch {}

    // Register session in user_sessions table
    await SessionService.createSession({
      userId: user.id,
      tenantId: membership?.tenantId ?? null,
      token: sessionToken,
      req,
    })

    await audit({
      tenantId: membership?.tenantId ?? null,
      branchId: branch?.id ?? null,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: payload.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      module: 'AUTH',
      summary: `${user.fullName} completed MFA step-up authentication (${payload.role})`,
      severity: 'INFO',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    const userLocale = user.locale && isSupportedLocale(user.locale)
      ? normalizeLocale(user.locale)
      : DEFAULT_LOCALE

    return {
      success: true,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        username: user.username,
        role: payload.role,
        roles: payload.roles,
        tenant: membership?.tenant ? { id: membership.tenantId, name: membership.tenant.name } : null,
        branch: branch ? { id: branch.id, name: branch.name } : null,
        mustChangePassword: effectiveMustChangePassword,
        mfaVerified: true,
      },
      token: sessionToken,
      locale: userLocale,
      mustChangePassword: effectiveMustChangePassword,
    }
  }

  /**
   * Resends an MFA verification code for an active ephemeral token.
   */
  static async resendCode(params: {
    mfaToken?: string
    identifier?: string
    schoolCode?: string
    req?: NextRequest
  }): Promise<{
    success: boolean
    message: string
    cooldown: number
    destination?: string
    error?: { code: string; message: string; status: number }
  }> {
    const { mfaToken, identifier, schoolCode, req } = params
    let targetEmail = identifier

    if (mfaToken) {
      const payload = await this.verifyMfaToken(mfaToken)
      if (payload) {
        targetEmail = payload.email
      }
    }

    if (!targetEmail) {
      return {
        success: false,
        message: 'Identifier or valid MFA session token required to resend code.',
        cooldown: 0,
        error: { code: 'VALIDATION_001', message: 'MFA session or identifier required', status: 400 },
      }
    }

    return OtpService.requestOtp(targetEmail, schoolCode, req)
  }
}

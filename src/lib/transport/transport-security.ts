import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { recordChildEvent } from '@/lib/notify'
import { raiseFollowUp } from '@/lib/followups'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import {
  PickupAuthorizationStatus,
  TransportSecurityEventType,
} from '@prisma/client'

export const TRANSPORT_QR_ISSUER = 'preone-transport'
export const TRANSPORT_QR_AUDIENCE = 'preone-gate'
export const TRANSPORT_QR_PREFIX = 'TPQR_'

export const TRANSPORT_QR_SECRET = new TextEncoder().encode(
  process.env.TRANSPORT_QR_SECRET || process.env.JWT_SECRET || 'preone-dev-jwt-secret-2f8b7c9d4e6a1f3b5c8d0e'
)

export type TransportQrPurpose =
  | 'TRANSPORT_DRIVER'
  | 'TRANSPORT_PICKUP_AUTH'
  | 'TRANSPORT_STUDENT'
  | 'TRANSPORT_GUARDIAN'

export interface TransportQrTokenPayload {
  iss: 'preone-transport'
  aud: 'preone-gate'
  sub: string
  tenantId: string
  branchId?: string | null
  purpose: TransportQrPurpose
  routeId?: string
  vehicleId?: string
  driverId?: string
  studentId?: string
  guardianId?: string
  authId?: string
  jti: string
  iat: number
  exp: number
}

interface ScanRateLimitRecord {
  attempts: number
  lockedUntil: number
  firstAttemptAt: number
}

// In-memory sliding window rate-limiter for QR scanning (per tenant:ip/actor)
const scanRateLimitStore = new Map<string, ScanRateLimitRecord>()
const SCAN_MAX_ATTEMPTS = 30 // 30 scans per minute
const SCAN_WINDOW_MS = 60 * 1000 // 1 minute window
const SCAN_LOCKOUT_MS = 60 * 1000 // 1 minute lockout

export function checkScanRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number; remainingAttempts: number } {
  const now = Date.now()
  const record = scanRateLimitStore.get(key)
  if (!record) {
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: SCAN_MAX_ATTEMPTS }
  }

  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000))
    return { allowed: false, retryAfterSeconds, remainingAttempts: 0 }
  }

  if (now - record.firstAttemptAt > SCAN_WINDOW_MS) {
    scanRateLimitStore.delete(key)
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: SCAN_MAX_ATTEMPTS }
  }

  const remaining = Math.max(0, SCAN_MAX_ATTEMPTS - record.attempts)
  return { allowed: remaining > 0, retryAfterSeconds: 0, remainingAttempts: remaining }
}

export function recordFailedScanAttempt(key: string): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  let record = scanRateLimitStore.get(key)
  if (!record || now - record.firstAttemptAt > SCAN_WINDOW_MS) {
    record = { attempts: 1, lockedUntil: 0, firstAttemptAt: now }
    scanRateLimitStore.set(key, record)
    return { locked: false, retryAfterSeconds: 0 }
  }

  record.attempts++
  if (record.attempts >= SCAN_MAX_ATTEMPTS) {
    record.lockedUntil = now + SCAN_LOCKOUT_MS
    const retryAfterSeconds = Math.ceil(SCAN_LOCKOUT_MS / 1000)
    return { locked: true, retryAfterSeconds }
  }

  return { locked: false, retryAfterSeconds: 0 }
}

export function resetScanRateLimit(key: string): void {
  scanRateLimitStore.delete(key)
}

export interface TransportSecurityContext {
  tenantId: string
  branchId?: string | null
  actorId: string
  actorName: string
  actorRole: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface CreatePickupAuthInput {
  studentId: string
  guardianId?: string
  personName?: string
  authorizedPersonName?: string
  phone?: string
  authorizedPersonPhone?: string
  relationship: string
  reason: string
  validFrom: Date | string
  validUntil: Date | string
  isOneTime?: boolean
  remarks?: string
}

export interface VerifyPinInput {
  guardianId?: string
  userId?: string
  pin: string
  studentId?: string
}

interface PinRateLimitRecord {
  attempts: number
  lockedUntil: number
  firstAttemptAt: number
}

// In-memory sliding window rate-limiter for PIN verification (per tenant:target)
const pinRateLimitStore = new Map<string, PinRateLimitRecord>()
const PIN_MAX_ATTEMPTS = 5
const PIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes window
const PIN_LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes lockout

export function checkPinRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number; remainingAttempts: number } {
  const now = Date.now()
  const record = pinRateLimitStore.get(key)
  if (!record) {
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: PIN_MAX_ATTEMPTS }
  }

  // Check if actively locked out
  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000))
    return { allowed: false, retryAfterSeconds, remainingAttempts: 0 }
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > PIN_WINDOW_MS) {
    pinRateLimitStore.delete(key)
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: PIN_MAX_ATTEMPTS }
  }

  const remaining = Math.max(0, PIN_MAX_ATTEMPTS - record.attempts)
  return { allowed: remaining > 0, retryAfterSeconds: 0, remainingAttempts: remaining }
}

export function recordFailedPinAttempt(key: string): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  let record = pinRateLimitStore.get(key)
  if (!record || now - record.firstAttemptAt > PIN_WINDOW_MS) {
    record = { attempts: 1, lockedUntil: 0, firstAttemptAt: now }
    pinRateLimitStore.set(key, record)
    return { locked: false, retryAfterSeconds: 0 }
  }

  record.attempts++
  if (record.attempts >= PIN_MAX_ATTEMPTS) {
    record.lockedUntil = now + PIN_LOCKOUT_MS
    const retryAfterSeconds = Math.ceil(PIN_LOCKOUT_MS / 1000)
    return { locked: true, retryAfterSeconds }
  }

  return { locked: false, retryAfterSeconds: 0 }
}

export function resetPinRateLimit(key: string): void {
  pinRateLimitStore.delete(key)
}

export class TransportSecurityService {
  /**
   * Derive role-scoped resource boundaries for Driver & Parent/Guardian roles
   */
  static async getRoleScopingFilter(ctx: TransportSecurityContext): Promise<{
    isDriver: boolean
    isParent: boolean
    isAdmin: boolean
    allowedRouteIds: string[] | null // null = unrestricted in tenant
    allowedStudentIds: string[] | null // null = unrestricted in tenant
  }> {
    const roleUpper = (ctx.actorRole || '').toUpperCase()

    if (['OWNER', 'PRINCIPAL', 'COORDINATOR', 'PLATFORM_ADMIN', 'RECEPTIONIST', 'ACCOUNTS'].includes(roleUpper)) {
      return { isDriver: false, isParent: false, isAdmin: true, allowedRouteIds: null, allowedStudentIds: null }
    }

    if (roleUpper === 'DRIVER' || roleUpper === 'TRANSPORT_DRIVER') {
      const staff = await db.staffProfile.findFirst({
        where: { userId: ctx.actorId, tenantId: ctx.tenantId, deletedAt: null },
      })

      const assignedRoutes = await db.transportRoute.findMany({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(staff
            ? {
                OR: [
                  { driverProfileId: staff.id },
                  { attendantProfileId: staff.id },
                ],
              }
            : { id: '__no_access__' }),
        },
        select: { id: true },
      })

      const routeIds = assignedRoutes.map((r) => r.id)

      const assignedStudents = routeIds.length > 0
        ? await db.studentTransportAssignment.findMany({
            where: { tenantId: ctx.tenantId, routeId: { in: routeIds }, status: 'ACTIVE' },
            select: { studentId: true },
          })
        : []

      return {
        isDriver: true,
        isParent: false,
        isAdmin: false,
        allowedRouteIds: routeIds,
        allowedStudentIds: assignedStudents.map((s) => s.studentId),
      }
    }

    if (roleUpper === 'PARENT' || roleUpper === 'GUARDIAN') {
      const guardian = await db.guardian.findFirst({
        where: { userId: ctx.actorId, tenantId: ctx.tenantId, deletedAt: null },
        include: { studentLinks: { select: { studentId: true } } },
      })

      const studentIds = guardian ? guardian.studentLinks.map((s) => s.studentId) : []

      return {
        isDriver: false,
        isParent: true,
        isAdmin: false,
        allowedRouteIds: [],
        allowedStudentIds: studentIds,
      }
    }

    // Default restricted staff view
    return { isDriver: false, isParent: false, isAdmin: false, allowedRouteIds: [], allowedStudentIds: [] }
  }

  /**
   * Validate if actor has authorization to access target student data
   */
  static async validateStudentAccess(ctx: TransportSecurityContext, targetStudentId: string): Promise<boolean> {
    const scope = await this.getRoleScopingFilter(ctx)
    if (!scope.isAdmin && scope.allowedStudentIds !== null && !scope.allowedStudentIds.includes(targetStudentId)) {
      await this.logSecurityEvent(ctx, {
        eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
        studentId: targetStudentId,
        action: 'Access Student Transport Data',
        result: 'BLOCKED',
        reason: `Actor ${ctx.actorName} (${ctx.actorRole}) attempted unauthorized access to student ${targetStudentId}`,
      })
      return false
    }

    // Verify student exists in tenant and branch (if branch context is provided)
    const student = await db.student.findFirst({
      where: { id: targetStudentId, tenantId: ctx.tenantId, deletedAt: null },
      select: { id: true, branchId: true, status: true },
    })
    if (!student) return false
    if (ctx.branchId && student.branchId && student.branchId !== ctx.branchId) {
      return false
    }

    return true
  }
  /**
   * Log a Transport Security Event in `transport_security_events` table
   */
  static async logSecurityEvent(
    ctx: TransportSecurityContext,
    params: {
      eventType: TransportSecurityEventType
      studentId?: string | null
      driverProfileId?: string | null
      vehicleId?: string | null
      routeId?: string | null
      tripId?: string | null
      authorizationId?: string | null
      action: string
      result?: 'SUCCESS' | 'FAILED' | 'REJECTED' | 'BLOCKED'
      reason?: string | null
      metadata?: Record<string, unknown>
    }
  ) {
    try {
      const event = await db.transportSecurityEvent.create({
        data: {
          tenantId: ctx.tenantId,
          branchId: ctx.branchId ?? undefined,
          eventType: params.eventType,
          studentId: params.studentId ?? undefined,
          driverProfileId: params.driverProfileId ?? undefined,
          vehicleId: params.vehicleId ?? undefined,
          routeId: params.routeId ?? undefined,
          tripId: params.tripId ?? undefined,
          authorizationId: params.authorizationId ?? undefined,
          actorId: ctx.actorId || 'system',
          actorName: ctx.actorName || 'System',
          actorRole: ctx.actorRole || 'SYSTEM',
          action: params.action,
          result: params.result ?? 'SUCCESS',
          reason: params.reason ?? undefined,
          ipAddress: ctx.ipAddress ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          metadata: (params.metadata as any) ?? undefined,
        },
      })

      // Record high-level audit entry for security monitoring (never logs PIN plaintext or hashes)
      await recordAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        actorName: ctx.actorName,
        actorRole: ctx.actorRole,
        action: `TRANSPORT_SECURITY_${params.eventType}`,
        entity: 'TransportSecurityEvent',
        entityId: event.id,
        summary: `Transport Security: ${params.action} (${params.result ?? 'SUCCESS'}) - ${params.reason || 'Completed'}`,
        newValues: { ...params },
      })

      return event
    } catch (err: any) {
      console.error('Failed to record TransportSecurityEvent:', err.message)
      return null
    }
  }

  /**
   * Cryptographically hash a PIN using bcrypt with work factor 10.
   */
  static async hashPin(pin: string): Promise<string> {
    if (!pin || !/^\d{4,6}$/.test(pin.trim())) {
      throw new Error('PIN must be 4 to 6 numeric digits')
    }
    return bcrypt.hash(pin.trim(), 10)
  }

  /**
   * Verify a submitted PIN against a stored verifier (bcrypt hash or legacy plaintext).
   * Insecure fallback PINs (1234, 0000) always fail.
   */
  static async verifyPinHash(pin: string, storedVerifier?: string | null): Promise<boolean> {
    if (!pin || !storedVerifier) return false
    const cleanPin = pin.trim()
    const cleanVerifier = storedVerifier.trim()
    if (!cleanPin || !cleanVerifier) return false
    if (cleanPin === '1234' || cleanPin === '0000') return false
    if (cleanVerifier === '1234' || cleanVerifier === '0000') return false

    if (cleanVerifier.startsWith('$2a$') || cleanVerifier.startsWith('$2b$')) {
      return bcrypt.compare(cleanPin, cleanVerifier)
    }
    return cleanVerifier === cleanPin
  }

  /**
   * Reset rate limit state for a key (used in tests or administrative resets).
   */
  static resetPinRateLimit(key: string): void {
    resetPinRateLimit(key)
  }

  /**
   * Verify Guardian/User PIN securely with rate-limiting, child authorization checks & logging.
   * Hardcoded fallback PINs (1234, 0000) and password fallbacks are strictly eliminated.
   */
  static async verifyPin(
    ctx: TransportSecurityContext,
    input: VerifyPinInput
  ): Promise<{ valid: boolean; message: string; code?: string; guardian?: any }> {
    const { guardianId, userId, pin, studentId } = input
    const cleanPin = typeof pin === 'string' ? pin.trim() : ''

    // 1. Rate limiting & progressive abuse prevention
    const rateLimitTarget = guardianId || userId || studentId || ctx.ipAddress || ctx.actorId
    const rateLimitKey = `pin:${ctx.tenantId}:${rateLimitTarget}`
    const rateCheck = checkPinRateLimit(rateLimitKey)
    if (!rateCheck.allowed) {
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'BLOCKED',
        reason: 'Rate limit exceeded: Temporary lockout due to repeated failed PIN attempts.',
      })
      return {
        valid: false,
        message: `Too many failed PIN attempts. Temporary lockout active for ${rateCheck.retryAfterSeconds}s.`,
        code: 'RATE_LIMIT_EXCEEDED',
      }
    }

    // 2. Strict format validation: 4 to 6 numeric digits
    if (!cleanPin || !/^\d{4,6}$/.test(cleanPin)) {
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'FAILED',
        reason: 'Invalid PIN format provided (must be 4-6 numeric digits)',
      })
      return {
        valid: false,
        message: 'Invalid PIN format. PIN must be 4 to 6 numeric digits.',
        code: 'INVALID_PIN_FORMAT',
      }
    }

    // 3. Reject hardcoded insecure fallback PINs unconditionally
    if (cleanPin === '1234' || cleanPin === '0000') {
      recordFailedPinAttempt(rateLimitKey)
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'FAILED',
        reason: 'Attempted verification using rejected fallback PIN',
      })
      return {
        valid: false,
        message: 'Verification failed. Insecure or invalid PIN provided.',
        code: 'INVALID_CREDENTIALS',
      }
    }

    // 4. Resolve Guardian Profile
    let guardian: any = null
    if (guardianId) {
      guardian = await db.guardian.findFirst({
        where: { id: guardianId, tenantId: ctx.tenantId, deletedAt: null },
        include: { user: true, studentLinks: true },
      })
    } else if (userId) {
      guardian = await db.guardian.findFirst({
        where: { userId, tenantId: ctx.tenantId, deletedAt: null },
        include: { user: true, studentLinks: true },
      })
    }

    if (!guardian) {
      recordFailedPinAttempt(rateLimitKey)
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'FAILED',
        reason: 'Guardian record not found for tenant',
      })
      return { valid: false, message: 'Verification failed: Guardian not found.', code: 'GUARDIAN_NOT_FOUND' }
    }

    // 5. If studentId is provided, enforce child pickup authorization & safety rules
    let effectiveStoredPin = guardian.pickupPin
    if (studentId) {
      const studentLink = await db.studentGuardian.findFirst({
        where: { studentId, guardianId: guardian.id },
        include: { student: true },
      })

      if (!studentLink) {
        recordFailedPinAttempt(rateLimitKey)
        await this.logSecurityEvent(ctx, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          studentId,
          action: 'PIN Verification',
          result: 'BLOCKED',
          reason: `Guardian ${guardian.fullName} has no relationship to student ${studentId}`,
        })
        return { valid: false, message: 'Guardian is not authorized for this student.', code: 'NOT_AUTHORIZED' }
      }

      // Multi-branch / Cross-tenant scoping check
      if (studentLink.student.tenantId !== ctx.tenantId) {
        return { valid: false, message: 'Student belongs to a different school tenant.', code: 'TENANT_MISMATCH' }
      }
      if (ctx.branchId && studentLink.student.branchId && studentLink.student.branchId !== ctx.branchId) {
        return { valid: false, message: 'Student belongs to a different school branch.', code: 'BRANCH_MISMATCH' }
      }

      // Check pickup authorization flag & status
      const effectivePickupStatus = studentLink.pickupStatus === 'NOT_AUTHORIZED' && studentLink.canPickup
        ? 'AUTHORIZED'
        : studentLink.pickupStatus
      if (!studentLink.canPickup || effectivePickupStatus === 'NOT_AUTHORIZED') {
        await this.logSecurityEvent(ctx, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          studentId,
          action: 'PIN Verification',
          result: 'BLOCKED',
          reason: `Guardian ${guardian.fullName} pickup authorization revoked for student ${studentId}`,
        })
        return { valid: false, message: 'Pickup authorization is revoked or not authorized for this child.', code: 'NOT_AUTHORIZED' }
      }

      const now = new Date()
      if (studentLink.pickupStatus === 'EXPIRED' || (studentLink.authExpiresAt && new Date(studentLink.authExpiresAt) < now)) {
        return { valid: false, message: 'Pickup authorization for this guardian has expired.', code: 'AUTHORIZATION_EXPIRED' }
      }
      if (studentLink.authStartDate && new Date(studentLink.authStartDate) > now) {
        return { valid: false, message: 'Pickup authorization is not yet active.', code: 'AUTHORIZATION_NOT_ACTIVE' }
      }

      // Student-specific PIN override takes precedence
      if (studentLink.pickupPin && studentLink.pickupPin.trim()) {
        effectiveStoredPin = studentLink.pickupPin.trim()
      }
    }

    // 6. Fail Closed: Unconfigured, empty, or legacy fallback PINs fail closed
    if (!effectiveStoredPin || !effectiveStoredPin.trim() || effectiveStoredPin === '1234' || effectiveStoredPin === '0000') {
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'FAILED',
        reason: `No secure pickup PIN configured for guardian ${guardian.fullName}`,
      })
      return {
        valid: false,
        message: 'No secure pickup PIN configured for this guardian. Please set up a PIN before completing pickup.',
        code: 'PIN_NOT_CONFIGURED',
      }
    }

    // 7. Server-authoritative PIN comparison (bcrypt or legacy plaintext)
    let isMatch = false
    if (effectiveStoredPin.startsWith('$2a$') || effectiveStoredPin.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(cleanPin, effectiveStoredPin)
    } else {
      isMatch = effectiveStoredPin.trim() === cleanPin
    }

    if (!isMatch) {
      const failState = recordFailedPinAttempt(rateLimitKey)
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        studentId: studentId ?? undefined,
        action: 'PIN Verification',
        result: 'FAILED',
        reason: `Incorrect PIN entered for guardian ${guardian.fullName}${failState.locked ? ' (Triggered lockout)' : ''}`,
      })

      // Raise FollowUp security alert if failed
      await raiseFollowUp({
        tenantId: ctx.tenantId,
        branchId: ctx.branchId,
        studentId: studentId ?? undefined,
        domain: 'SAFETY',
        severity: 'WARNING',
        title: `Failed Transport Pickup PIN for Guardian ${guardian.fullName}`,
        detail: `An incorrect pickup PIN was entered for student ${studentId || 'unknown'}. Verification failed.`,
        sourceType: 'TRANSPORT_SECURITY',
        sourceId: guardian.id,
        responsibleRole: 'TEACHER',
      })

      return {
        valid: false,
        message: failState.locked
          ? `Incorrect PIN. Maximum attempts exceeded. Locked out for ${failState.retryAfterSeconds}s.`
          : 'Incorrect PIN provided.',
        code: 'PIN_MISMATCH',
      }
    }

    // Reset rate limit on successful verification
    resetPinRateLimit(rateLimitKey)

    await this.logSecurityEvent(ctx, {
      eventType: 'PIN_VERIFICATION_SUCCESS',
      studentId: studentId ?? undefined,
      action: 'PIN Verification',
      result: 'SUCCESS',
      reason: `PIN verified successfully for guardian ${guardian.fullName}`,
    })

    return { valid: true, message: 'PIN verified successfully', guardian }
  }

  /**
   * Create a Temporary Authorized Pickup Request (Unknown / Alternate Person Workflow)
   */
  static async createPickupAuthorization(
    ctx: TransportSecurityContext,
    input: CreatePickupAuthInput
  ) {
    const student = await db.student.findFirst({
      where: { id: input.studentId, tenantId: ctx.tenantId, deletedAt: null },
    })
    if (!student) throw new Error('Student not found in this school tenant')

    const vFrom = new Date(input.validFrom)
    const vUntil = new Date(input.validUntil)

    if (isNaN(vFrom.getTime()) || isNaN(vUntil.getTime()) || vFrom > vUntil) {
      throw new Error('Invalid date range for pickup authorization')
    }

    const personName = (input.personName || (input as any).authorizedPersonName || '').trim()
    const phone = (input.phone || (input as any).authorizedPersonPhone || '').trim()

    if (!personName) throw new Error('Authorized person name is required')
    if (!phone) throw new Error('Authorized person phone is required')

    const auth = await db.transportPickupAuthorization.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: ctx.branchId ?? student.branchId,
        studentId: input.studentId,
        guardianId: input.guardianId ?? undefined,
        personName,
        phone,
        relationship: (input.relationship || 'Alternate').trim(),
        reason: (input.reason || 'Temporary Authorization').trim(),
        validFrom: vFrom,
        validUntil: vUntil,
        isOneTime: input.isOneTime ?? true,
        status: 'PENDING',
        remarks: input.remarks?.trim() ?? undefined,
      },
    })

    await this.logSecurityEvent(ctx, {
      eventType: 'UNKNOWN_PERSON_DETECTED',
      studentId: input.studentId,
      authorizationId: auth.id,
      action: 'Create Pickup Authorization',
      result: 'SUCCESS',
      reason: `Created temporary pickup authorization for ${auth.personName} (${auth.relationship})`,
    })

    // Notify School Principal / Admin of new authorization request
    await recordChildEvent({
      tenantId: ctx.tenantId,
      studentId: input.studentId,
      type: 'PICKUP',
      title: 'Temporary Pickup Authorization Submitted',
      body: `Pickup authorization requested for ${auth.personName} (${auth.relationship}) to pick up ${student.firstName}. Requires staff approval.`,
    })

    return auth
  }

  /**
   * Approve a Temporary Pickup Authorization (School Staff / Admin workflow)
   */
  static async approvePickupAuthorization(
    ctx: TransportSecurityContext,
    authId: string,
    remarks?: string
  ) {
    const auth = await db.transportPickupAuthorization.findFirst({
      where: { id: authId, tenantId: ctx.tenantId },
      include: { student: true },
    })
    if (!auth) throw new Error('Pickup authorization request not found')

    if (auth.status !== 'PENDING') {
      throw new Error(`Cannot approve authorization with status ${auth.status}`)
    }

    const updated = await db.transportPickupAuthorization.update({
      where: { id: authId },
      data: {
        status: 'APPROVED',
        approvedById: ctx.actorId,
        approvedByName: ctx.actorName,
        approvedAt: new Date(),
        remarks: remarks?.trim() || auth.remarks,
      },
    })

    await this.logSecurityEvent(ctx, {
      eventType: 'AUTHORIZATION_APPROVED',
      studentId: auth.studentId,
      authorizationId: auth.id,
      action: 'Approve Pickup Authorization',
      result: 'SUCCESS',
      reason: `Staff ${ctx.actorName} approved pickup authorization for ${auth.personName}`,
    })

    await recordChildEvent({
      tenantId: ctx.tenantId,
      studentId: auth.studentId,
      type: 'PICKUP',
      title: 'Pickup Authorization Approved',
      body: `Temporary pickup authorization for ${auth.personName} has been approved by ${ctx.actorName}.`,
    })

    return updated
  }

  /**
   * Reject a Temporary Pickup Authorization
   */
  static async rejectPickupAuthorization(
    ctx: TransportSecurityContext,
    authId: string,
    rejectionReason: string
  ) {
    const auth = await db.transportPickupAuthorization.findFirst({
      where: { id: authId, tenantId: ctx.tenantId },
    })
    if (!auth) throw new Error('Pickup authorization request not found')

    const updated = await db.transportPickupAuthorization.update({
      where: { id: authId },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        approvedById: ctx.actorId,
        approvedByName: ctx.actorName,
        approvedAt: new Date(),
      },
    })

    await this.logSecurityEvent(ctx, {
      eventType: 'AUTHORIZATION_REJECTED',
      studentId: auth.studentId,
      authorizationId: auth.id,
      action: 'Reject Pickup Authorization',
      result: 'REJECTED',
      reason: rejectionReason.trim(),
    })

    return updated
  }

  /**
   * Validate if an alternate person is authorized to pick up a student TODAY
   */
  static async validateAlternatePickup(
    ctx: TransportSecurityContext,
    studentId: string,
    personName: string,
    phone: string
  ): Promise<{ authorized: boolean; authorization?: any; message: string }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const auth = await db.transportPickupAuthorization.findFirst({
      where: {
        tenantId: ctx.tenantId,
        studentId,
        status: 'APPROVED',
        validFrom: { lte: today },
        validUntil: { gte: today },
        phone: phone.trim(),
      },
      include: { student: true, guardian: true },
    })

    if (!auth) {
      await this.logSecurityEvent(ctx, {
        eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
        studentId,
        action: 'Validate Alternate Pickup Person',
        result: 'REJECTED',
        reason: `No active approved pickup authorization found for ${personName} (${phone})`,
      })
      return {
        authorized: false,
        message: 'No approved temporary pickup authorization exists for this person today',
      }
    }

    if (auth.isOneTime && auth.status === 'USED') {
      await this.logSecurityEvent(ctx, {
        eventType: 'DUPLICATE_PICKUP_ATTEMPT',
        studentId,
        authorizationId: auth.id,
        action: 'Validate Alternate Pickup Person',
        result: 'REJECTED',
        reason: `One-time pickup authorization ${auth.id} has already been used`,
      })
      return {
        authorized: false,
        message: 'This one-time pickup authorization has already been used',
      }
    }

    return { authorized: true, authorization: auth, message: 'Pickup authorized' }
  }

  /**
   * Record Manual Security Override (Emergency or Network Failure)
   */
  static async recordManualOverride(
    ctx: TransportSecurityContext,
    params: {
      studentId: string
      action: string
      reason: string
      routeId?: string
      vehicleId?: string
      tripId?: string
    }
  ) {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('Manual override justification must be at least 5 characters')
    }

    const event = await this.logSecurityEvent(ctx, {
      eventType: 'MANUAL_OVERRIDE',
      studentId: params.studentId,
      routeId: params.routeId,
      vehicleId: params.vehicleId,
      tripId: params.tripId,
      action: `MANUAL_OVERRIDE: ${params.action}`,
      result: 'SUCCESS',
      reason: params.reason.trim(),
    })

    await raiseFollowUp({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      studentId: params.studentId,
      domain: 'SAFETY',
      severity: 'WARNING',
      title: `Transport Manual Override Recorded by ${ctx.actorName}`,
      detail: `Action: ${params.action}. Justification: ${params.reason}`,
      sourceType: 'TRANSPORT_OVERRIDE',
      sourceId: event?.id || params.studentId,
      responsibleRole: 'PRINCIPAL',
    })

    return event
  }

  /**
   * Set secure Driver PIN (hashed)
   */
  static async setDriverPin(ctx: TransportSecurityContext, driverUserId: string, pin: string) {
    if (!pin || pin.trim().length < 4) {
      throw new Error('Driver PIN must be at least 4 digits')
    }
    const crypto = await import('crypto')
    const pinHash = crypto.createHash('sha256').update(`${ctx.tenantId}:${driverUserId}:${pin.trim()}`).digest('hex')
    await db.user.update({
      where: { id: driverUserId },
      data: { preferences: { driverPinHash: pinHash } as any },
    })
    await this.logSecurityEvent(ctx, {
      eventType: 'PIN_VERIFICATION_SUCCESS',
      action: 'Set Driver PIN',
      result: 'SUCCESS',
      reason: `Updated security PIN for driver user ${driverUserId}`,
    })
    return { success: true }
  }

  /**
   * Verify Driver PIN
   */
  static async verifyDriverPin(ctx: TransportSecurityContext, driverUserId: string, pin: string) {
    if (!pin || !pin.trim()) return { valid: false, message: 'PIN is required' }
    const user = await db.user.findFirst({
      where: { id: driverUserId },
    })
    if (!user) return { valid: false, message: 'Driver not found' }
    const crypto = await import('crypto')
    const pinHash = crypto.createHash('sha256').update(`${ctx.tenantId}:${driverUserId}:${pin.trim()}`).digest('hex')
    const storedHash = (user.preferences as any)?.driverPinHash
    if (!storedHash || storedHash !== pinHash) {
      await this.logSecurityEvent(ctx, {
        eventType: 'PIN_VERIFICATION_FAILED',
        action: 'Driver PIN Verification',
        result: 'FAILED',
        reason: 'Incorrect Driver PIN entered',
      })
      return { valid: false, message: 'Incorrect Driver PIN' }
    }
    await this.logSecurityEvent(ctx, {
      eventType: 'PIN_VERIFICATION_SUCCESS',
      action: 'Driver PIN Verification',
      result: 'SUCCESS',
      reason: 'Driver PIN verified successfully',
    })
    return { valid: true, message: 'Driver PIN verified' }
  }

  /**
   * Cancel a Temporary Pickup Authorization
   */
  static async cancelPickupAuthorization(ctx: TransportSecurityContext, authId: string, remarks?: string) {
    const auth = await db.transportPickupAuthorization.findFirst({
      where: { id: authId, tenantId: ctx.tenantId },
    })
    if (!auth) throw new Error('Pickup authorization request not found')

    return db.transportPickupAuthorization.update({
      where: { id: authId },
      data: {
        status: 'EXPIRED',
        remarks: remarks ? `${auth.remarks || ''}\nCancelled by ${ctx.actorName}: ${remarks}` : auth.remarks,
      },
    })
  }

  /**
   * List Temporary Pickup Authorizations for Tenant with filtering
   */
  static async getPickupAuthorizations(
    ctx: TransportSecurityContext,
    filter?: { studentId?: string; status?: PickupAuthorizationStatus }
  ) {
    return db.transportPickupAuthorization.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(filter?.studentId ? { studentId: filter.studentId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, photoUrl: true } },
        guardian: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * List Security Logs for Tenant with filtering
   */
  static async getSecurityLogs(
    ctx: TransportSecurityContext,
    filter?: { eventType?: TransportSecurityEventType; studentId?: string; driverId?: string; driverProfileId?: string; limit?: number }
  ) {
    const limit = filter?.limit ?? 50
    const driverId = filter?.driverProfileId || filter?.driverId
    return db.transportSecurityEvent.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(filter?.eventType ? { eventType: filter.eventType } : {}),
        ...(filter?.studentId ? { studentId: filter.studentId } : {}),
        ...(driverId ? { driverProfileId: driverId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Generate Cryptographically Signed, Expiring Transport QR Token
   */
  static async generateTransportQrToken(params: {
    tenantId: string
    branchId?: string | null
    purpose: TransportQrPurpose
    sub: string
    routeId?: string
    vehicleId?: string
    driverId?: string
    studentId?: string
    guardianId?: string
    authId?: string
    expiresIn?: string | number
    customSecret?: Uint8Array
  }): Promise<{ token: string; qrPayload: string; expiresAt: Date; jti: string }> {
    const jti = crypto.randomUUID()
    const expDuration = params.expiresIn ?? (
      params.purpose === 'TRANSPORT_DRIVER' ? '12h' :
      params.purpose === 'TRANSPORT_PICKUP_AUTH' ? '24h' : '24h'
    )

    const signer = new SignJWT({
      tenantId: params.tenantId,
      branchId: params.branchId ?? null,
      purpose: params.purpose,
      routeId: params.routeId,
      vehicleId: params.vehicleId,
      driverId: params.driverId,
      studentId: params.studentId,
      guardianId: params.guardianId,
      authId: params.authId,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(TRANSPORT_QR_ISSUER)
      .setAudience(TRANSPORT_QR_AUDIENCE)
      .setSubject(params.sub)
      .setJti(jti)
      .setIssuedAt()

    if (typeof expDuration === 'number') {
      signer.setExpirationTime(expDuration)
    } else {
      signer.setExpirationTime(expDuration)
    }

    const secret = params.customSecret || TRANSPORT_QR_SECRET
    const jwt = await signer.sign(secret)
    const token = `${TRANSPORT_QR_PREFIX}${jwt}`

    let expSeconds: number
    if (typeof expDuration === 'number') {
      expSeconds = expDuration
    } else if (typeof expDuration === 'string') {
      const match = expDuration.match(/^(\d+)([smhd])$/)
      if (match) {
        const val = parseInt(match[1], 10)
        const unit = match[2]
        const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
        expSeconds = Math.floor(Date.now() / 1000) + val * multiplier
      } else {
        expSeconds = Math.floor(Date.now() / 1000) + 86400
      }
    } else {
      expSeconds = Math.floor(Date.now() / 1000) + 86400
    }
    const expiresAt = new Date(expSeconds * 1000)

    return {
      token,
      qrPayload: token,
      expiresAt,
      jti,
    }
  }

  /**
   * Authoritatively Validate Transport QR Token Cryptographic Signature, Expiry, Purpose & Scoping
   */
  static async verifyTransportQrToken(
    tokenString: string,
    options?: {
      expectedTenantId?: string
      expectedBranchId?: string | null
      expectedPurpose?: TransportQrPurpose
      customSecret?: Uint8Array
    }
  ): Promise<{
    valid: boolean
    code: 'VERIFIED' | 'INVALID_TOKEN' | 'UNSIGNED_TOKEN_REJECTED' | 'MALFORMED' | 'SIGNATURE_INVALID' | 'EXPIRED' | 'TENANT_MISMATCH' | 'BRANCH_MISMATCH' | 'PURPOSE_MISMATCH' | 'INVALID_CLAIMS'
    message: string
    payload?: TransportQrTokenPayload
  }> {
    if (!tokenString || typeof tokenString !== 'string') {
      return { valid: false, code: 'INVALID_TOKEN', message: 'QR payload is empty or invalid' }
    }

    const trimmed = tokenString.trim()

    // Immediate fail-closed rejection for legacy or raw unauthenticated formats
    if (
      trimmed.startsWith('TRPQR_') ||
      trimmed.startsWith('STUDENT:') ||
      trimmed.startsWith('GUARDIAN:') ||
      trimmed.startsWith('PARENT:') ||
      trimmed.startsWith('AUTH:') ||
      trimmed.startsWith('DRIVER:') ||
      trimmed.startsWith('{')
    ) {
      return {
        valid: false,
        code: 'UNSIGNED_TOKEN_REJECTED',
        message: 'Unsigned legacy QR format or raw ID is not permitted. All transport QR codes must be cryptographically signed by the server.',
      }
    }

    let jwtString = trimmed
    if (trimmed.startsWith(TRANSPORT_QR_PREFIX)) {
      jwtString = trimmed.substring(TRANSPORT_QR_PREFIX.length)
    }

    // Must be a valid JWT with 3 parts
    const parts = jwtString.split('.')
    if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
      return {
        valid: false,
        code: 'MALFORMED',
        message: 'Malformed QR token format. Expected signed JWT token.',
      }
    }

    try {
      const secret = options?.customSecret || TRANSPORT_QR_SECRET
      const { payload } = await jwtVerify(jwtString, secret, {
        issuer: TRANSPORT_QR_ISSUER,
        audience: TRANSPORT_QR_AUDIENCE,
        algorithms: ['HS256'], // Explicit whitelist preventing algorithm confusion
      })

      const typedPayload = payload as unknown as TransportQrTokenPayload

      // Verify mandatory claims
      if (!typedPayload.tenantId || !typedPayload.purpose || !typedPayload.sub) {
        return {
          valid: false,
          code: 'INVALID_CLAIMS',
          message: 'Token is missing mandatory claims (tenantId, purpose, sub)',
        }
      }

      // Enforce Tenant multi-tenant isolation
      if (options?.expectedTenantId && typedPayload.tenantId !== options.expectedTenantId) {
        return {
          valid: false,
          code: 'TENANT_MISMATCH',
          message: 'QR token belongs to a different school/tenant',
          payload: typedPayload,
        }
      }

      // Enforce Branch isolation if context specifies branch
      if (
        options?.expectedBranchId &&
        typedPayload.branchId &&
        typedPayload.branchId !== options.expectedBranchId
      ) {
        return {
          valid: false,
          code: 'BRANCH_MISMATCH',
          message: 'QR token is not valid for this branch',
          payload: typedPayload,
        }
      }

      // Enforce Purpose binding
      if (options?.expectedPurpose && typedPayload.purpose !== options.expectedPurpose) {
        return {
          valid: false,
          code: 'PURPOSE_MISMATCH',
          message: `QR token purpose mismatch. Expected ${options.expectedPurpose}, received ${typedPayload.purpose}`,
          payload: typedPayload,
        }
      }

      return {
        valid: true,
        code: 'VERIFIED',
        message: 'QR token verified successfully',
        payload: typedPayload,
      }
    } catch (err: any) {
      if (err?.code === 'ERR_JWT_EXPIRED') {
        return {
          valid: false,
          code: 'EXPIRED',
          message: 'Transport QR code has expired. Please present a fresh QR code.',
        }
      }
      if (err?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
        return {
          valid: false,
          code: 'INVALID_CLAIMS',
          message: 'QR token claim validation failed (issuer/audience mismatch).',
        }
      }
      return {
        valid: false,
        code: 'SIGNATURE_INVALID',
        message: 'QR code signature verification failed or token has been tampered with.',
      }
    }
  }

  /**
   * Authoritatively Complete Pickup Handover with Atomic Single-Use Consumption (Replay Protected)
   */
  static async completePickupAuthorization(
    ctx: TransportSecurityContext,
    authId: string
  ): Promise<{ success: boolean; authorization: any; message: string }> {
    const now = new Date()

    // Atomic conditional update prevents race conditions & duplicate consumption
    const updateResult = await db.transportPickupAuthorization.updateMany({
      where: {
        id: authId,
        tenantId: ctx.tenantId,
        status: 'APPROVED',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      data: {
        status: 'USED',
        usedAt: now,
        usedById: ctx.actorId,
        usedByName: ctx.actorName,
      },
    })

    if (updateResult.count === 0) {
      // Investigate why update failed to provide precise, secure feedback
      const existing = await db.transportPickupAuthorization.findFirst({
        where: { id: authId, tenantId: ctx.tenantId },
        include: { student: true },
      })

      if (!existing) {
        throw new Error('NOT_FOUND: Authorization request not found')
      }

      if (existing.status === 'USED') {
        await this.logSecurityEvent(ctx, {
          eventType: 'DUPLICATE_PICKUP_ATTEMPT',
          studentId: existing.studentId,
          authorizationId: existing.id,
          action: 'Complete Handover',
          result: 'BLOCKED',
          reason: 'Replay attempt: One-time pickup authorization has already been consumed',
        })
        throw new Error('ALREADY_USED: This one-time pickup authorization has already been used and cannot be replayed')
      }

      if (existing.status !== 'APPROVED') {
        await this.logSecurityEvent(ctx, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          studentId: existing.studentId,
          authorizationId: existing.id,
          action: 'Complete Handover',
          result: 'BLOCKED',
          reason: `Handover blocked: Authorization status is ${existing.status}`,
        })
        throw new Error(`NOT_APPROVED: Authorization is not approved (Current status: ${existing.status})`)
      }

      if (now < existing.validFrom || now > existing.validUntil) {
        await this.logSecurityEvent(ctx, {
          eventType: 'UNAUTHORIZED_PICKUP_ATTEMPT',
          studentId: existing.studentId,
          authorizationId: existing.id,
          action: 'Complete Handover',
          result: 'BLOCKED',
          reason: 'Handover blocked: Authorization date has expired or is outside valid window',
        })
        throw new Error('EXPIRED: Pickup authorization date has expired or is outside valid window')
      }

      throw new Error('INVALID_STATE: Pickup authorization cannot be completed')
    }

    const updated = await db.transportPickupAuthorization.findUnique({
      where: { id: authId },
      include: { student: true },
    })

    await this.logSecurityEvent(ctx, {
      eventType: 'AUTHORIZATION_APPROVED',
      studentId: updated?.studentId,
      authorizationId: authId,
      action: `Handover Completed (${updated?.actionType || 'PICKUP'})`,
      result: 'SUCCESS',
      reason: `Handover completed for student ${updated?.student?.firstName} to ${updated?.personName} (${updated?.relationship})`,
    })

    return {
      success: true,
      authorization: updated,
      message: `${updated?.actionType || 'PICKUP'} handover completed successfully for ${updated?.student?.firstName}`,
    }
  }
}

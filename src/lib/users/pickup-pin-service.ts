import { db } from '@/lib/db'
import { randomInt } from 'crypto'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import type { SessionPayload } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// Common trivial sequences to avoid during auto-generation
const TRIVIAL_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '2345', '3456', '4567', '5678', '6789', '4321', '5432', '6543', '7654',
  '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777',
  '888888', '999999', '123456', '654321',
])

export interface PickupPinStatus {
  guardianId: string
  userId: string
  fullName: string
  phone: string
  relationship: string
  hasGuardianPin: boolean
  guardianPinMasked: string | null
  students: Array<{
    linkId: string
    studentId: string
    studentName: string
    admissionNo: string
    classroomName?: string | null
    canPickup: boolean
    hasPin: boolean
    pinMasked: string | null
    isInherited: boolean
    relationship: string
  }>
  stats: {
    totalStudents: number
    pickupAuthorized: number
    withPin: number
    missingPin: number
  }
}

export class PickupPinService {
  /**
   * Validates pickup PIN format and non-triviality.
   */
  static validatePin(pin: string): { valid: boolean; error?: string; code?: string } {
    if (!pin || typeof pin !== 'string') {
      return { valid: false, error: 'Pickup PIN is required', code: 'PIN_REQUIRED' }
    }

    const trimmed = pin.trim()
    if (!/^\d{4,6}$/.test(trimmed)) {
      return {
        valid: false,
        error: 'Pickup PIN must be between 4 and 6 numeric digits',
        code: 'INVALID_PIN_FORMAT',
      }
    }

    if (TRIVIAL_PINS.has(trimmed)) {
      return {
        valid: false,
        error: 'PIN is too simple (e.g. repeated or sequential digits). Please choose a more secure PIN.',
        code: 'PIN_TOO_WEAK',
      }
    }

    return { valid: true }
  }

  /**
   * Generates a cryptographically random non-trivial numeric PIN.
   */
  static generateSecurePin(length: number = 4): string {
    const len = length === 6 ? 6 : 4
    const min = len === 6 ? 100000 : 1000
    const max = len === 6 ? 999999 : 9999

    let pin = ''
    let attempts = 0
    do {
      pin = randomInt(min, max + 1).toString()
      attempts++
    } while (TRIVIAL_PINS.has(pin) && attempts < 20)

    return pin
  }

  /**
   * Helper: Resolves Guardian profile by userId, guardianId, or targetId in current tenant.
   */
  static async resolveGuardian(
    tenantId: string,
    params: { userId?: string; guardianId?: string; targetId?: string },
    options: { canPickupOnly?: boolean } = {}
  ) {
    const { userId, guardianId, targetId } = params
    const orConditions: any[] = []
    if (guardianId) orConditions.push({ id: guardianId })
    if (userId) orConditions.push({ userId })
    if (targetId) orConditions.push({ id: targetId }, { userId: targetId })

    if (orConditions.length === 0) return null

    return await db.guardian.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: orConditions,
      },
      include: {
        user: true,
        studentLinks: {
          where: {
            student: {
              tenantId,
              deletedAt: null,
            },
            ...(options.canPickupOnly ? { canPickup: true } : {}),
          },
          include: {
            student: {
              include: {
                currentClassroom: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Retrieves current pickup PIN status, masking secret PIN data.
   */
  static async getPinStatus(params: {
    userId?: string
    guardianId?: string
    targetId?: string
    tenantId: string
    actorSession?: SessionPayload
  }): Promise<PickupPinStatus | null> {
    const { tenantId, userId, actorSession } = params
    const guardian = await this.resolveGuardian(tenantId, params)

    if (!guardian) {
      return null
    }

    const effectiveRoles =
      actorSession?.roles && actorSession.roles.length > 0
        ? actorSession.roles
        : actorSession?.role
        ? [actorSession.role]
        : []
    const isOwnerOrPlatform = effectiveRoles.some((r) => r === 'OWNER' || r === 'PLATFORM_ADMIN')
    const isSelf = actorSession?.uid === guardian.userId || actorSession?.uid === guardian.id

    const visibleLinks =
      isOwnerOrPlatform || isSelf || !actorSession?.branchId
        ? guardian.studentLinks
        : guardian.studentLinks.filter((sl) => sl.student.branchId === actorSession.branchId)

    const students = visibleLinks.map((sl) => {
      const hasDirectPin = Boolean(sl.pickupPin && sl.pickupPin.trim().length > 0)
      const hasGuardianPin = Boolean(guardian.pickupPin && guardian.pickupPin.trim().length > 0)
      const effectiveHasPin = hasDirectPin || hasGuardianPin

      return {
        linkId: sl.id,
        studentId: sl.student.id,
        studentName: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
        admissionNo: sl.student.admissionNo,
        classroomName: sl.student.currentClassroom?.name || null,
        canPickup: sl.canPickup,
        hasPin: effectiveHasPin,
        pinMasked: effectiveHasPin ? '••••' : null,
        isInherited: !hasDirectPin && hasGuardianPin,
        relationship: sl.relationship || guardian.relationship,
      }
    })

    const pickupAuthorized = students.filter((s) => s.canPickup).length
    const withPin = students.filter((s) => s.canPickup && s.hasPin).length

    return {
      guardianId: guardian.id,
      userId: guardian.userId || userId || guardian.id,
      fullName: guardian.fullName,
      phone: guardian.phone,
      relationship: guardian.relationship,
      hasGuardianPin: Boolean(guardian.pickupPin),
      guardianPinMasked: guardian.pickupPin ? '••••' : null,
      students,
      stats: {
        totalStudents: students.length,
        pickupAuthorized,
        withPin,
        missingPin: Math.max(0, pickupAuthorized - withPin),
      },
    }
  }

  /**
   * Regenerates a cryptographically random pickup PIN.
   */
  static async regeneratePin(params: {
    userId?: string
    guardianId?: string
    targetId?: string
    tenantId: string
    actorSession: SessionPayload
    studentId?: string
    syncToAllStudents?: boolean
    pinLength?: number
    reason?: string
    req?: Request | NextRequest | null
  }): Promise<{
    success: boolean
    newPin: string
    target: 'GUARDIAN' | 'STUDENT'
    studentId?: string
    updatedStudentsCount: number
  }> {
    const {
      userId,
      guardianId,
      targetId,
      tenantId,
      actorSession,
      studentId,
      syncToAllStudents = true,
      pinLength = 4,
      reason,
      req,
    } = params

    const guardian = await this.resolveGuardian(tenantId, { userId, guardianId, targetId })

    if (!guardian) {
      throw new Error('Guardian profile not found for this user in current school')
    }

    const newPin = this.generateSecurePin(pinLength)
    const meta = getRequestMeta(req)

    const effectiveRoles =
      actorSession.roles && actorSession.roles.length > 0
        ? actorSession.roles
        : actorSession.role
        ? [actorSession.role]
        : []
    const isActorOwnerOrPlatform = effectiveRoles.some((r) => r === 'OWNER' || r === 'PLATFORM_ADMIN')

    if (studentId) {
      const link = guardian.studentLinks.find((l) => l.studentId === studentId)
      if (!link) {
        throw new Error('Specified student is not linked to this guardian profile')
      }

      if (!isActorOwnerOrPlatform && actorSession.branchId && link.student.branchId !== actorSession.branchId) {
        throw new Error('Unauthorized: Cannot modify pickup PIN for student belonging to another campus branch')
      }

      await db.studentGuardian.update({
        where: { id: link.id },
        data: { pickupPin: newPin },
      })

      await recordAudit({
        tenantId,
        actorId: actorSession.uid,
        actorName: actorSession.name,
        actorRole: actorSession.role,
        action: 'PICKUP_PIN_REGENERATED',
        entity: 'StudentGuardian',
        entityId: link.id,
        module: 'USERS',
        severity: 'INFO',
        summary: `Regenerated pickup PIN for child ${studentId} under guardian ${guardian.fullName}${reason ? `: ${reason}` : ''}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        oldValues: { pickupPin: link.pickupPin ? '••••' : null },
        newValues: { pickupPin: '••••', target: 'STUDENT', studentId },
      })

      return {
        success: true,
        newPin,
        target: 'STUDENT',
        studentId,
        updatedStudentsCount: 1,
      }
    }

    // Guardian-level regeneration
    await db.$transaction(async (tx) => {
      await tx.guardian.update({
        where: { id: guardian.id },
        data: { pickupPin: newPin },
      })

      if (syncToAllStudents) {
        const studentWhere: any = { guardianId: guardian.id }
        if (!isActorOwnerOrPlatform && actorSession.branchId) {
          studentWhere.student = { branchId: actorSession.branchId }
        }
        await tx.studentGuardian.updateMany({
          where: studentWhere,
          data: { pickupPin: newPin },
        })
      }
    })

    const count = syncToAllStudents ? guardian.studentLinks.length : 0

    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'PICKUP_PIN_REGENERATED',
      entity: 'Guardian',
      entityId: guardian.id,
      module: 'USERS',
      severity: 'INFO',
      summary: `Regenerated family pickup PIN for ${guardian.fullName} (synced to ${count} students)${reason ? `: ${reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: { pickupPin: guardian.pickupPin ? '••••' : null },
      newValues: { pickupPin: '••••', target: 'GUARDIAN', syncToAllStudents, count },
    })

    return {
      success: true,
      newPin,
      target: 'GUARDIAN',
      updatedStudentsCount: count,
    }
  }

  /**
   * Resets or sets a custom pickup PIN, or clears existing PINs.
   */
  static async resetPin(params: {
    userId?: string
    guardianId?: string
    targetId?: string
    tenantId: string
    actorSession: SessionPayload
    pin?: string | null
    clear?: boolean
    studentId?: string
    syncToAllStudents?: boolean
    reason?: string
    req?: Request | NextRequest | null
  }): Promise<{
    success: boolean
    cleared: boolean
    target: 'GUARDIAN' | 'STUDENT'
    studentId?: string
    updatedStudentsCount: number
  }> {
    const {
      userId,
      guardianId,
      targetId,
      tenantId,
      actorSession,
      pin,
      clear = false,
      studentId,
      syncToAllStudents = true,
      reason,
      req,
    } = params

    const guardian = await this.resolveGuardian(tenantId, { userId, guardianId, targetId })

    if (!guardian) {
      throw new Error('Guardian profile not found for this user in current school')
    }

    const isClear = clear || pin === null || (typeof pin === 'string' && pin.trim() === '')
    let targetPin: string | null = null

    if (!isClear) {
      const validation = this.validatePin(pin!)
      if (!validation.valid) {
        const err = new Error(validation.error || 'Invalid PIN format')
        ;(err as any).code = validation.code || 'INVALID_PIN_FORMAT'
        throw err
      }
      targetPin = pin!.trim()
    }

    const meta = getRequestMeta(req)
    const auditAction = isClear ? 'PICKUP_PIN_CLEARED' : 'PICKUP_PIN_RESET'

    const effectiveRoles =
      actorSession.roles && actorSession.roles.length > 0
        ? actorSession.roles
        : actorSession.role
        ? [actorSession.role]
        : []
    const isActorOwnerOrPlatform = effectiveRoles.some((r) => r === 'OWNER' || r === 'PLATFORM_ADMIN')

    if (studentId) {
      const link = guardian.studentLinks.find((l) => l.studentId === studentId)
      if (!link) {
        throw new Error('Specified student is not linked to this guardian profile')
      }

      if (!isActorOwnerOrPlatform && actorSession.branchId && link.student.branchId !== actorSession.branchId) {
        throw new Error('Unauthorized: Cannot modify pickup PIN for student belonging to another campus branch')
      }

      await db.studentGuardian.update({
        where: { id: link.id },
        data: { pickupPin: targetPin },
      })

      await recordAudit({
        tenantId,
        actorId: actorSession.uid,
        actorName: actorSession.name,
        actorRole: actorSession.role,
        action: auditAction,
        entity: 'StudentGuardian',
        entityId: link.id,
        module: 'USERS',
        severity: isClear ? 'WARNING' : 'INFO',
        summary: `${isClear ? 'Cleared' : 'Reset'} pickup PIN for child ${studentId} under guardian ${guardian.fullName}${reason ? `: ${reason}` : ''}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        oldValues: { pickupPin: link.pickupPin ? '••••' : null },
        newValues: { pickupPin: targetPin ? '••••' : null, target: 'STUDENT', studentId },
      })

      return {
        success: true,
        cleared: isClear,
        target: 'STUDENT',
        studentId,
        updatedStudentsCount: 1,
      }
    }

    // Guardian-level reset / clear
    await db.$transaction(async (tx) => {
      await tx.guardian.update({
        where: { id: guardian.id },
        data: { pickupPin: targetPin },
      })

      if (syncToAllStudents) {
        const studentWhere: any = { guardianId: guardian.id }
        if (!isActorOwnerOrPlatform && actorSession.branchId) {
          studentWhere.student = { branchId: actorSession.branchId }
        }
        await tx.studentGuardian.updateMany({
          where: studentWhere,
          data: { pickupPin: targetPin },
        })
      }
    })

    const count = syncToAllStudents ? guardian.studentLinks.length : 0

    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: auditAction,
      entity: 'Guardian',
      entityId: guardian.id,
      module: 'USERS',
      severity: isClear ? 'WARNING' : 'INFO',
      summary: `${isClear ? 'Cleared' : 'Reset'} family pickup PIN for ${guardian.fullName} (synced to ${count} students)${reason ? `: ${reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: { pickupPin: guardian.pickupPin ? '••••' : null },
      newValues: { pickupPin: targetPin ? '••••' : null, target: 'GUARDIAN', syncToAllStudents, count },
    })

    return {
      success: true,
      cleared: isClear,
      target: 'GUARDIAN',
      updatedStudentsCount: count,
    }
  }

  /**
   * Auto-provisions missing pickup PINs for guardian and all linked students authorized for pickup.
   */
  static async autoProvisionPins(params: {
    userId?: string
    guardianId?: string
    targetId?: string
    tenantId: string
    actorSession: SessionPayload
    overwriteExisting?: boolean
    req?: Request | NextRequest | null
  }): Promise<{
    success: boolean
    provisionedPin: string
    affectedStudents: number
    alreadyConfigured: boolean
    message: string
  }> {
    const { userId, guardianId, targetId, tenantId, actorSession, overwriteExisting = false, req } = params

    const guardian = await this.resolveGuardian(tenantId, { userId, guardianId, targetId }, { canPickupOnly: true })

    if (!guardian) {
      throw new Error('Guardian profile not found for this user in current school')
    }

    const hasValidExistingPin = Boolean(guardian.pickupPin && guardian.pickupPin.trim().length >= 4)
    const pinToUse = hasValidExistingPin && !overwriteExisting
      ? guardian.pickupPin!.trim()
      : this.generateSecurePin(4)

    let affectedStudents = 0

    await db.$transaction(async (tx) => {
      // 1. Ensure guardian-level PIN is populated
      if (!hasValidExistingPin || overwriteExisting) {
        await tx.guardian.update({
          where: { id: guardian.id },
          data: { pickupPin: pinToUse },
        })
      }

      // 2. Ensure all pickup-authorized student links have a PIN
      for (const link of guardian.studentLinks) {
        if (!link.pickupPin || overwriteExisting) {
          await tx.studentGuardian.update({
            where: { id: link.id },
            data: { pickupPin: pinToUse },
          })
          affectedStudents++
        }
      }
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'PICKUP_PIN_AUTOPROVISIONED',
      entity: 'Guardian',
      entityId: guardian.id,
      module: 'USERS',
      severity: 'INFO',
      summary: `Auto-provisioned pickup PIN for ${guardian.fullName} and ${affectedStudents} student link(s)`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        pickupPin: '••••',
        affectedStudents,
        pinReused: hasValidExistingPin && !overwriteExisting,
      },
    })

    return {
      success: true,
      provisionedPin: pinToUse,
      affectedStudents,
      alreadyConfigured: hasValidExistingPin && !overwriteExisting && affectedStudents === 0,
      message: affectedStudents > 0 || !hasValidExistingPin
        ? `Successfully auto-provisioned pickup PIN for ${guardian.fullName} and ${affectedStudents} child link(s)`
        : `Guardian and all linked students already have active pickup PINs`,
    }
  }

  /**
   * Identifies and purges insecure fallback PINs (e.g. '1234', '0000', '1111') from existing
   * Guardian and StudentGuardian records across a tenant, transitioning them to require explicit re-enrollment.
   */
  static async auditAndMigrateInsecurePins(params: {
    tenantId: string
    actorSession?: SessionPayload
  }): Promise<{
    scannedGuardians: number
    scannedLinks: number
    purgedGuardians: number
    purgedLinks: number
    affectedGuardianIds: string[]
  }> {
    const { tenantId, actorSession } = params
    const INSECURE_PIN_VALUES = ['1234', '0000', '1111', '000000', '123456']

    const guardians = await db.guardian.findMany({
      where: {
        tenantId,
        pickupPin: { in: INSECURE_PIN_VALUES },
      },
      select: { id: true, fullName: true, pickupPin: true },
    })

    const links = await db.studentGuardian.findMany({
      where: {
        student: { tenantId },
        pickupPin: { in: INSECURE_PIN_VALUES },
      },
      select: { id: true, studentId: true, guardianId: true, pickupPin: true },
    })

    const affectedGuardianIds = Array.from(new Set([
      ...guardians.map((g) => g.id),
      ...links.map((l) => l.guardianId),
    ]))

    // Nullify insecure fallback PINs so they fail closed and require explicit re-enrollment
    if (guardians.length > 0) {
      await db.guardian.updateMany({
        where: {
          id: { in: guardians.map((g) => g.id) },
        },
        data: { pickupPin: null },
      })
    }

    if (links.length > 0) {
      await db.studentGuardian.updateMany({
        where: {
          id: { in: links.map((l) => l.id) },
        },
        data: {
          pickupPin: null,
          pickupStatus: 'PENDING',
        },
      })
    }

    if (actorSession && (guardians.length > 0 || links.length > 0)) {
      await recordAudit({
        tenantId,
        actorId: actorSession.uid,
        actorName: actorSession.name,
        actorRole: actorSession.role,
        action: 'INSECURE_PINS_PURGED',
        entity: 'Tenant',
        entityId: tenantId,
        module: 'SECURITY',
        severity: 'CRITICAL',
        summary: `Purged ${guardians.length} insecure guardian PIN(s) and ${links.length} student link PIN(s) requiring explicit re-enrollment.`,
        newValues: {
          purgedGuardians: guardians.length,
          purgedLinks: links.length,
          affectedGuardianIds,
        },
      })
    }

    return {
      scannedGuardians: guardians.length,
      scannedLinks: links.length,
      purgedGuardians: guardians.length,
      purgedLinks: links.length,
      affectedGuardianIds,
    }
  }
}

import { db } from '@/lib/db'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { SessionService } from '@/lib/users/session-service'
import type { SessionPayload } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

export interface DpdpPreviewResult {
  userId: string
  fullName: string
  email: string | null
  phone: string | null
  role: string
  status: string
  hasStaffProfile: boolean
  hasGuardianProfile: boolean
  fieldsToScrub: string[]
  preservedRecords: {
    invoicesCount: number
    paymentsCount: number
    payslipsCount: number
    attendanceCount: number
  }
}

export interface DpdpAnonymizeParams {
  userId: string
  tenantId: string
  actorSession: SessionPayload
  reason: string
  confirmErasure: boolean
  req?: Request | NextRequest | null
}

export interface DpdpAnonymizeResult {
  success: boolean
  userId: string
  anonymizedIdentifier: string
  scrubbedCount: number
  sessionsRevokedCount: number
  message: string
}

export class DpdpService {
  /**
   * Generates a preview of data to be erased and statutory records to be preserved.
   */
  static async previewAnonymization(params: {
    userId: string
    tenantId: string
  }): Promise<DpdpPreviewResult | null> {
    const { userId, tenantId } = params

    const member = await db.tenantUser.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ id: userId }, { userId }],
      },
      include: {
        user: {
          include: {
            guardianProfile: {
              include: {
                studentLinks: true,
              },
            },
          },
        },
        staffProfile: {
          include: {
            bankDetails: true,
          },
        },
      },
    })

    if (!member) {
      return null
    }

    const targetUserId = member.userId
    const sp = member.staffProfile
    const gp = member.user.guardianProfile

    const fieldsToScrub: string[] = [
      'user.fullName',
      'user.email',
      'user.phone',
      'user.username',
      'user.avatarUrl',
    ]

    if (sp) {
      fieldsToScrub.push(
        'staffProfile.panNumber',
        'staffProfile.aadhaarNumber',
        'staffProfile.uanNumber',
        'staffProfile.esiNumber',
        'staffProfile.currentAddress',
        'staffProfile.permanentAddress',
        'staffProfile.emergencyContactName',
        'staffProfile.emergencyContactPhone'
      )
      if (sp.bankDetails) {
        fieldsToScrub.push('staffProfile.bankDetails')
      }
    }

    if (gp) {
      fieldsToScrub.push(
        'guardian.fullName',
        'guardian.phone',
        'guardian.email',
        'guardian.occupation',
        'guardian.pickupPin',
        'studentGuardian.pickupPin'
      )
    }

    // Tally preserved financial/statutory records
    const [invoicesCount, paymentsCount, payslipsCount, attendanceCount] = await Promise.all([
      db.invoice.count({ where: { tenantId } }),
      db.payment.count({ where: { tenantId } }),
      sp ? db.payslip.count({ where: { staffProfileId: sp.id } }) : Promise.resolve(0),
      sp ? db.attendanceStaff.count({ where: { tenantId, staffProfileId: sp.id } }) : Promise.resolve(0),
    ])

    return {
      userId: targetUserId,
      fullName: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
      role: member.role,
      status: member.status,
      hasStaffProfile: Boolean(sp),
      hasGuardianProfile: Boolean(gp),
      fieldsToScrub,
      preservedRecords: {
        invoicesCount,
        paymentsCount,
        payslipsCount,
        attendanceCount,
      },
    }
  }

  /**
   * Executes irreversible anonymization under DPDP Act, 2023.
   */
  static async anonymizeUser(params: DpdpAnonymizeParams): Promise<DpdpAnonymizeResult> {
    const { userId, tenantId, actorSession, reason, confirmErasure, req } = params

    if (!confirmErasure) {
      throw new Error('Explicit confirmation is required to execute DPDP erasure workflow')
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('Justification reason is required and must be at least 5 characters')
    }

    // 1. Resolve target member
    const member = await db.tenantUser.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ id: userId }, { userId }],
      },
      include: {
        user: {
          include: {
            guardianProfile: true,
          },
        },
        staffProfile: true,
      },
    })

    if (!member) {
      throw new Error('Target user not found in this school')
    }

    const targetUserId = member.userId

    // 2. Safeguards: Sole active Owner protection
    if (member.role === 'OWNER') {
      const activeOwners = await db.tenantUser.count({
        where: {
          tenantId,
          role: 'OWNER',
          status: 'ACTIVE',
          deletedAt: null,
          id: { not: member.id },
        },
      })
      if (activeOwners === 0) {
        const err = new Error('Cannot anonymize or erase the sole active Owner of the school')
        ;(err as any).code = 'SOLE_OWNER_PROTECTION'
        throw err
      }
    }

    // 3. Hierarchy protection: Non-owners cannot erase OWNER accounts
    if (member.role === 'OWNER' && actorSession.role !== 'OWNER' && actorSession.role !== 'PLATFORM_ADMIN') {
      const err = new Error('Only school owners can execute DPDP erasure on Owner accounts')
      ;(err as any).code = 'FORBIDDEN'
      throw err
    }

    const shortHash = crypto.randomBytes(4).toString('hex')
    const deidentifiedName = `Anonymized User [${shortHash}]`
    const deidentifiedUsername = `anonymized_${shortHash}_${Date.now().toString().slice(-4)}`
    const deidentifiedEmail = `erased_${shortHash}@anonymized.preone.internal`
    const deidentifiedPhone = `+9100${Date.now().toString().slice(-8)}`

    let scrubbedFieldCount = 0

    // 4. Atomic erasure in database transaction
    await db.$transaction(async (tx) => {
      // Step A: Anonymize User model
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          fullName: deidentifiedName,
          email: deidentifiedEmail,
          phone: null,
          username: deidentifiedUsername,
          avatarUrl: null,
          status: 'ARCHIVED',
          deletedAt: new Date(),
          preferences: null,
        },
      })
      scrubbedFieldCount += 5

      // Step B: Update TenantUser membership
      await tx.tenantUser.update({
        where: { id: member.id },
        data: {
          status: 'ARCHIVED',
          deletedAt: new Date(),
        },
      })

      // Step C: Anonymize StaffProfile (if applicable)
      const sp = await tx.staffProfile.findFirst({
        where: { tenantId, userId: targetUserId },
      })

      if (sp) {
        await tx.staffProfile.update({
          where: { id: sp.id },
          data: {
            panNumber: null,
            aadhaarNumber: null,
            uanNumber: null,
            esiNumber: null,
            currentAddress: null,
            permanentAddress: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            status: 'ARCHIVED',
            deletedAt: new Date(),
          },
        })

        // Wipe staff bank details if present
        await tx.staffBankDetail.deleteMany({
          where: { staffProfileId: sp.id },
        }).catch(() => {})

        scrubbedFieldCount += 9
      }

      // Step D: Anonymize Guardian & Student Links (if applicable)
      const gp = await tx.guardian.findFirst({
        where: { tenantId, userId: targetUserId },
      })

      if (gp) {
        await tx.guardian.update({
          where: { id: gp.id },
          data: {
            fullName: `Anonymized Guardian [${shortHash}]`,
            phone: deidentifiedPhone,
            email: null,
            occupation: null,
            pickupPin: null,
            deletedAt: new Date(),
          },
        })

        await tx.studentGuardian.updateMany({
          where: { guardianId: gp.id },
          data: {
            pickupPin: null,
            canPickup: false,
          },
        })

        scrubbedFieldCount += 6
      }
    })

    // 5. Invalidate all sessions immediately
    let sessionsRevokedCount = 0
    try {
      sessionsRevokedCount = await SessionService.revokeAllUserSessions(targetUserId)
    } catch {
      // Fallback
      const fallback = await db.userSession.updateMany({
        where: { userId: targetUserId, status: 'ACTIVE' },
        data: { status: 'REVOKED' },
      })
      sessionsRevokedCount = fallback.count
    }

    // 6. Record canonical DPDP audit trail entry
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'DPDP_ANONYMIZED_USER',
      entity: 'User',
      entityId: targetUserId,
      module: 'COMPLIANCE',
      severity: 'WARNING',
      summary: `Irreversibly anonymized personal data for user under DPDP Act (Reason: ${reason})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        deidentifiedIdentifier: deidentifiedUsername,
        reason,
        scrubbedFieldCount,
        sessionsRevokedCount,
        statutoryIntegrityPreserved: true,
      },
    })

    return {
      success: true,
      userId: targetUserId,
      anonymizedIdentifier: deidentifiedUsername,
      scrubbedCount: scrubbedFieldCount,
      sessionsRevokedCount,
      message: `User data has been successfully and irreversibly de-identified under DPDP compliance rules`,
    }
  }
}

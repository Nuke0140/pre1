import { db } from '@/lib/db'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserStatus, Prisma } from '@prisma/client'
import { SessionService } from '@/lib/users/session-service'
import { PermissionCache } from '@/lib/cache/permission-cache'
import { NextRequest } from 'next/server'
import { resetFailedAttempts, resetPersistentFailedAttempts } from '@/lib/auth/lockout-tracker'

import { PrimaryContactGuard, PrimaryContactTransfer } from '@/lib/users/primary-contact-guard'

export type LifecycleActionType =
  | 'activate'
  | 'suspend'
  | 'unlock'
  | 'reactivate'
  | 'deactivate'
  | 'archive'

export const LIFECYCLE_ACTION_MAP: Record<LifecycleActionType, UserStatus> = {
  activate: 'ACTIVE',
  suspend: 'SUSPENDED',
  unlock: 'ACTIVE',
  reactivate: 'ACTIVE',
  deactivate: 'DEACTIVATED',
  archive: 'ARCHIVED',
}

export const VALID_LIFECYCLE_TRANSITIONS: Record<string, UserStatus[]> = {
  ACTIVE: ['SUSPENDED', 'LOCKED', 'DEACTIVATED'],
  SUSPENDED: ['ACTIVE', 'DEACTIVATED'],
  LOCKED: ['ACTIVE', 'DEACTIVATED'],
  DEACTIVATED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [], // Terminal state
  // Legacy states backward compatibility
  INACTIVE: ['ACTIVE', 'DEACTIVATED'],
  PENDING: ['ACTIVE', 'DEACTIVATED'],
}

export interface TransitionValidationResult {
  valid: boolean
  error?: string
  code?: string
  statusHttp?: number
}

export interface TransitionStatusParams {
  member: {
    id: string
    userId: string
    role: string
    status: string
    branchId?: string | null
    user: {
      fullName: string
    }
  }
  actorSession: {
    uid: string
    name: string
    role: string
    tenantId?: string | null
  }
  targetStatus?: UserStatus
  action?: LifecycleActionType | string
  reason?: string
  req?: Request | NextRequest | null
  tx?: Prisma.TransactionClient
  alternateGuardianId?: string
  alternateUserId?: string
  nominateAlternateId?: string
  alternateGuardiansByStudent?: Record<string, string>
}

export type TransitionExecutionResult =
  | {
      success: true
      userId: string
      status: UserStatus
      updatedAt?: Date
      unchanged?: boolean
    }
  | {
      success: false
      error: string
      code: string
      statusHttp: number
      details?: Record<string, any>
    }

export class UserLifecycleService {
  /**
   * Resolves target UserStatus from action keyword or explicit status string.
   */
  static resolveTargetStatus(
    action?: string | null,
    explicitStatus?: UserStatus | null
  ): { targetStatus?: UserStatus; error?: string } {
    if (action) {
      const mapped = LIFECYCLE_ACTION_MAP[action.toLowerCase() as LifecycleActionType]
      if (!mapped) {
        return {
          error: `Invalid lifecycle action: ${action}. Allowed: ${Object.keys(LIFECYCLE_ACTION_MAP).join(', ')}`,
        }
      }
      return { targetStatus: mapped }
    }

    if (explicitStatus) {
      return { targetStatus: explicitStatus }
    }

    return { error: 'Either action or status must be provided' }
  }

  /**
   * Validates if a state transition is permitted by policy and the canonical state machine.
   */
  static validateTransition(
    previousStatus: string,
    targetStatus: UserStatus,
    targetRole: string,
    actorRole: string
  ): TransitionValidationResult {
    if (targetRole === 'OWNER' && actorRole !== 'OWNER' && actorRole !== 'PLATFORM_ADMIN') {
      return {
        valid: false,
        error: 'Only owners can modify school owner account status',
        code: 'FORBIDDEN',
        statusHttp: 403,
      }
    }

    if (previousStatus === 'ARCHIVED') {
      return {
        valid: false,
        error: 'Archived user accounts cannot be modified',
        code: 'ACCOUNT_ARCHIVED_IMMUTABLE',
        statusHttp: 400,
      }
    }

    if (previousStatus === targetStatus) {
      return { valid: true }
    }

    const allowed = VALID_LIFECYCLE_TRANSITIONS[previousStatus] || []
    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        error: `Cannot transition user status from ${previousStatus} to ${targetStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        code: 'INVALID_STATE_TRANSITION',
        statusHttp: 400,
      }
    }

    return { valid: true }
  }

  /**
   * Immediately invalidates active sessions and permission cache for restricted lifecycle states.
   * If tenantId is provided and the user has other active memberships, only sessions for that tenant are revoked.
   * If isGlobal is true (or user has no other memberships), all user sessions are revoked.
   */
  static async revokeSessionsIfRestricted(
    userId: string,
    targetStatus: UserStatus,
    tenantId?: string | null,
    isGlobal: boolean = false
  ): Promise<void> {
    if (['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(targetStatus)) {
      if (isGlobal || !tenantId) {
        await SessionService.bumpTokenVersion(userId)
        await SessionService.revokeAllUserSessions(userId)
      } else {
        await SessionService.revokeAllUserSessions(userId, undefined, tenantId)
      }
      PermissionCache.bumpUserVersion(userId)
    }
  }

  /**
   * Records canonical audit log for user lifecycle status transition.
   */
  static async recordLifecycleAudit(params: {
    tenantId?: string | null
    branchId?: string | null
    actorId: string
    actorName: string
    actorRole: string
    member: {
      userId: string
      role: string
      user: { fullName: string }
    }
    previousStatus: string
    targetStatus: UserStatus
    action?: string
    reason?: string
    req?: Request | NextRequest | null
  }): Promise<void> {
    let auditAction = 'UPDATE_USER_STATUS'
    const actionAuditMap: Record<string, string> = {
      suspend: 'USER_SUSPENDED',
      activate: 'USER_ACTIVATED',
      unlock: 'USER_UNLOCKED',
      deactivate: 'USER_DEACTIVATED',
      archive: 'USER_ARCHIVED',
      lock: 'USER_LOCKED',
    }
    if (params.action && actionAuditMap[params.action.toLowerCase()]) {
      auditAction = actionAuditMap[params.action.toLowerCase()]
    } else {
      const statusActionMap: Record<string, string> = {
        ACTIVE: params.previousStatus === 'LOCKED' ? 'USER_UNLOCKED' : 'USER_ACTIVATED',
        SUSPENDED: 'USER_SUSPENDED',
        LOCKED: 'USER_LOCKED',
        DEACTIVATED: 'USER_DEACTIVATED',
        ARCHIVED: 'USER_ARCHIVED',
      }
      auditAction = statusActionMap[params.targetStatus] || 'UPDATE_USER_STATUS'
    }

    const meta = getRequestMeta(params.req)
    await recordAudit({
      tenantId: params.tenantId || null,
      branchId: params.branchId || undefined,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: auditAction,
      entity: 'User',
      entityId: params.member.userId,
      module: 'USERS',
      severity: ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(params.targetStatus)
        ? 'WARNING'
        : 'INFO',
      summary: `Transitioned user ${params.member.user.fullName} (${params.member.role}) from ${params.previousStatus} to ${params.targetStatus}${params.reason ? `: ${params.reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: { status: params.previousStatus },
      newValues: { status: params.targetStatus, action: params.action, reason: params.reason },
    })
  }

  /**
   * Canonical execution entry point for user lifecycle status transitions.
   * Atomically validates, persists status to TenantUser (and User if global/single-tenant),
   * revokes sessions appropriately, and records audit.
   */
  static async transitionUserStatus(params: TransitionStatusParams): Promise<TransitionExecutionResult> {
    const { member, actorSession, action, reason, req, tx: externalTx } = params

    const { targetStatus, error: resolveErr } = this.resolveTargetStatus(action, params.targetStatus)
    if (resolveErr || !targetStatus) {
      return {
        success: false,
        error: resolveErr || 'Status resolution failed',
        code: action ? 'INVALID_ACTION' : 'STATUS_OR_ACTION_REQUIRED',
        statusHttp: 400,
      }
    }

    const previousStatus = member.status as string
    const userGlobalStatus = (member.user as any)?.status as string | undefined

    // Self-suspension protection: admin cannot lock or suspend themselves
    if (member.userId === actorSession.uid && ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(targetStatus)) {
      return {
        success: false,
        error: 'Cannot suspend or deactivate your own account',
        code: 'CANNOT_SUSPEND_SELF',
        statusHttp: 400,
      }
    }

    // Sole active Owner protection: cannot suspend or deactivate the only Owner
    if (member.role === 'OWNER' && ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(targetStatus)) {
      const activeOwners = await db.tenantUser.count({
        where: {
          tenantId: actorSession.tenantId || undefined,
          role: 'OWNER',
          status: 'ACTIVE',
          deletedAt: null,
          id: { not: member.id },
        },
      })
      if (activeOwners === 0) {
        return {
          success: false,
          error: 'Cannot suspend or deactivate the sole active Owner of the school',
          code: 'SOLE_OWNER_PROTECTION',
          statusHttp: 403,
        }
      }
    }

    // Special case for unlock: even if user is already ACTIVE, clear failed attempts and return success
    if (action === 'unlock') {
      await resetPersistentFailedAttempts(member.userId)
      resetFailedAttempts(member.userId, (member.user as any)?.email, (member.user as any)?.username)
      if (previousStatus === 'ACTIVE' && (!userGlobalStatus || userGlobalStatus === 'ACTIVE')) {
        await this.recordLifecycleAudit({
          tenantId: actorSession.tenantId,
          branchId: member.branchId,
          actorId: actorSession.uid,
          actorName: actorSession.name,
          actorRole: actorSession.role,
          member,
          previousStatus,
          targetStatus: 'ACTIVE',
          action: 'unlock',
          reason,
          req,
        })
        return {
          success: true,
          userId: member.userId,
          status: 'ACTIVE',
        }
      }
    }

    if (previousStatus === targetStatus && (!userGlobalStatus || userGlobalStatus === targetStatus)) {
      return {
        success: true,
        userId: member.userId,
        status: member.status as UserStatus,
        unchanged: true,
      }
    }

    const validation = this.validateTransition(
      previousStatus,
      targetStatus,
      member.role,
      actorSession.role
    )
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error!,
        code: validation.code!,
        statusHttp: validation.statusHttp!,
      }
    }

    const isPlatformAdmin = actorSession.role === 'PLATFORM_ADMIN'

    // Primary contact deactivation guard (Doc 3.2): cannot suspend/deactivate primary contact without nominating alternate
    let primaryTransfers: PrimaryContactTransfer[] = []
    if (
      ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED', 'INACTIVE'].includes(targetStatus) &&
      actorSession.tenantId
    ) {
      const guardCheck = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: actorSession.tenantId,
        userId: member.userId,
        targetStatus,
        action: typeof action === 'string' ? action : undefined,
        alternateGuardianId: params.alternateGuardianId,
        alternateUserId: params.alternateUserId,
        nominateAlternateId: params.nominateAlternateId,
        alternateGuardiansByStudent: params.alternateGuardiansByStudent,
        tx: externalTx,
      })

      if (!guardCheck.safe) {
        return {
          success: false,
          error: guardCheck.error || 'Cannot deactivate primary contact without nominating an alternate contact',
          code: guardCheck.code || 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED',
          statusHttp: 409,
          details: { affectedStudents: guardCheck.affectedStudents },
        }
      }
      primaryTransfers = guardCheck.transfers
    }

    // Persist in transaction
    const executeInTx = async (tx: Prisma.TransactionClient) => {
      // 0. Apply nominated primary contact transfers atomically if required
      if (primaryTransfers.length > 0) {
        await PrimaryContactGuard.applyTransfersTx(tx, primaryTransfers, actorSession)
      }

      // 1. Always update the tenant membership status
      const tu = await tx.tenantUser.update({
        where: { id: member.id },
        data: { status: targetStatus },
      })

      // 2. Check if user has other active memberships in other schools/roles
      const otherActiveMemberships = await tx.tenantUser.count({
        where: {
          userId: member.userId,
          id: { not: member.id },
          status: 'ACTIVE',
          deletedAt: null,
        },
      })

      // 3. Update global User.status if:
      // - The actor is PLATFORM_ADMIN (explicit platform-wide control), OR
      // - The targetStatus is ACTIVE / unlocking, OR
      // - The user has NO other active memberships in other tenants
      const shouldUpdateGlobalUser =
        isPlatformAdmin ||
        targetStatus === 'ACTIVE' ||
        otherActiveMemberships === 0

      if (shouldUpdateGlobalUser) {
        await tx.user.update({
          where: { id: member.userId },
          data: { status: targetStatus, updatedAt: new Date() },
        })
      }

      return { tu, isGlobal: shouldUpdateGlobalUser && otherActiveMemberships === 0 }
    }

    const { tu: updatedMember, isGlobal } = externalTx ? await executeInTx(externalTx) : await db.$transaction(executeInTx)

    // Revoke sessions for restricted lifecycle states (tenant-scoped unless global lockout)
    await this.revokeSessionsIfRestricted(
      member.userId,
      targetStatus,
      actorSession.tenantId,
      isGlobal || isPlatformAdmin
    )

    // Clear failed login attempts tracker on account activation or unlock
    if (targetStatus === 'ACTIVE') {
      await resetPersistentFailedAttempts(member.userId)
      resetFailedAttempts(member.userId, (member.user as any)?.email, (member.user as any)?.username)
    }

    // Record canonical audit event
    await this.recordLifecycleAudit({
      tenantId: actorSession.tenantId,
      branchId: member.branchId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      member,
      previousStatus,
      targetStatus,
      action: typeof action === 'string' ? action : undefined,
      reason,
      req,
    })

    return {
      success: true,
      userId: member.userId,
      status: updatedMember.status as UserStatus,
      updatedAt: updatedMember.updatedAt,
    }
  }
}

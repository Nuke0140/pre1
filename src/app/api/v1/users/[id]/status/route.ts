import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserStatus } from '@prisma/client'
import { SessionService } from '@/lib/users/session-service'
import { PermissionCache } from '@/lib/cache/permission-cache'

type ActionType = 'activate' | 'suspend' | 'unlock' | 'reactivate' | 'deactivate' | 'archive'

const ACTION_MAP: Record<ActionType, UserStatus> = {
  activate: 'ACTIVE',
  suspend: 'SUSPENDED',
  unlock: 'ACTIVE',
  reactivate: 'ACTIVE',
  deactivate: 'DEACTIVATED',
  archive: 'ARCHIVED',
}

const VALID_TRANSITIONS: Record<string, UserStatus[]> = {
  ACTIVE: ['SUSPENDED', 'LOCKED', 'DEACTIVATED'],
  SUSPENDED: ['ACTIVE', 'DEACTIVATED'],
  LOCKED: ['ACTIVE', 'DEACTIVATED'],
  DEACTIVATED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [], // Terminal state
  // Legacy states backward compatibility
  INACTIVE: ['ACTIVE', 'DEACTIVATED'],
  PENDING: ['ACTIVE', 'DEACTIVATED'],
}

/** POST /api/v1/users/[id]/status — manage user lifecycle states (UAM-E1) */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    const body = await req.json()
    const { action, status: explicitStatus, reason } = body as {
      action?: ActionType
      status?: UserStatus
      reason?: string
    }

    let targetStatus: UserStatus | undefined = explicitStatus

    if (action) {
      const mapped = ACTION_MAP[action.toLowerCase() as ActionType]
      if (!mapped) {
        return bad(`Invalid lifecycle action: ${action}. Allowed: ${Object.keys(ACTION_MAP).join(', ')}`, 'INVALID_ACTION')
      }
      targetStatus = mapped
    }

    if (!targetStatus) {
      return bad('Either action or status must be provided', 'STATUS_OR_ACTION_REQUIRED')
    }

    const previousStatus = member.status as string

    if (member.role === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
      return forbidden('Only owners can modify school owner account status')
    }

    if (previousStatus === 'ARCHIVED') {
      return bad('Archived user accounts cannot be modified', 'ACCOUNT_ARCHIVED_IMMUTABLE')
    }

    if (previousStatus === targetStatus) {
      return ok({
        userId: member.userId,
        status: member.status,
        message: 'Status already set to requested state',
      })
    }

    const allowed = VALID_TRANSITIONS[previousStatus] || []
    if (!allowed.includes(targetStatus)) {
      return bad(
        `Cannot transition user status from ${previousStatus} to ${targetStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        'INVALID_STATE_TRANSITION'
      )
    }

    // Update in transaction
    const updatedMember = await db.$transaction(async (tx) => {
      const tu = await tx.tenantUser.update({
        where: { id: member.id },
        data: { status: targetStatus },
      })

      await tx.user.update({
        where: { id: member.userId },
        data: { status: targetStatus, updatedAt: new Date() },
      })

      return tu
    })

    // If account was suspended, locked, deactivated, or archived, revoke active sessions immediately
    if (['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(targetStatus)) {
      await SessionService.revokeAllUserSessions(member.userId)
      PermissionCache.bumpUserVersion(member.userId)
    }

    // Determine audit action name
    let auditAction = 'UPDATE_USER_STATUS'
    if (action) {
      auditAction = `USER_${action.toUpperCase()}`
    } else {
      const statusActionMap: Record<string, string> = {
        ACTIVE: previousStatus === 'LOCKED' ? 'USER_UNLOCKED' : 'USER_ACTIVATED',
        SUSPENDED: 'USER_SUSPENDED',
        LOCKED: 'USER_LOCKED',
        DEACTIVATED: 'USER_DEACTIVATED',
        ARCHIVED: 'USER_ARCHIVED',
      }
      auditAction = statusActionMap[targetStatus] || 'UPDATE_USER_STATUS'
    }

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: auditAction,
      entity: 'User',
      entityId: member.userId,
      module: 'USERS',
      severity: ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(targetStatus) ? 'WARNING' : 'INFO',
      summary: `Transitioned user ${member.user.fullName} (${member.role}) from ${previousStatus} to ${targetStatus}${reason ? `: ${reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: { status: previousStatus },
      newValues: { status: targetStatus, action, reason },
    })

    return ok({
      userId: member.userId,
      status: updatedMember.status,
      updatedAt: updatedMember.updatedAt,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

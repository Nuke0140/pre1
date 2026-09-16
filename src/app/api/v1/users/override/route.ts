import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, forbidden, notFound, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanOverride } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus } from '@prisma/client'

export type OverrideAction =
  | 'FORCE_ROLE_ASSIGNMENT'
  | 'FORCE_STATUS_TRANSITION'
  | 'FORCE_BRANCH_TRANSFER'
  | 'FORCE_PASSWORD_RESET'
  | 'EMERGENCY_DEACTIVATE'

interface OverrideRequest {
  action: OverrideAction
  targetUserId: string
  reason: string
  role?: UserRole
  roles?: UserRole[]
  status?: UserStatus
  branchId?: string | null
  password?: string
}

/**
 * POST /api/v1/users/override — Enterprise controlled administrative override
 * Enforces mandatory justification reason, high-privilege authorization, and explicit OVERRIDE_USED auditing.
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:manage')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = (await req.json()) as OverrideRequest
    const { action, targetUserId, reason, role, roles, status, branchId, password } = body

    if (!action || !targetUserId) {
      return bad('action and targetUserId are required', 'MISSING_FIELDS')
    }

    // 1. Enforce override justification requirement and role authority
    const overrideErr = requireCanOverride(session, action, targetUserId, reason)
    if (overrideErr) return overrideErr

    // 2. Fetch target user membership in tenant
    const targetMember = await db.tenantUser.findFirst({
      where: {
        userId: targetUserId,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: {
        user: {
          include: { staffProfile: true },
        },
      },
    })

    if (!targetMember) {
      return notFound('Target user not found in this school')
    }

    const isActorOwnerOrPlatform =
      session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

    // Only OWNER or PLATFORM_ADMIN can override another OWNER
    if (targetMember.role === 'OWNER' && !isActorOwnerOrPlatform) {
      return forbidden('Only school owners can execute administrative overrides on owner accounts')
    }

    const oldValues = {
      role: targetMember.role,
      roles: targetMember.roles,
      status: targetMember.status,
      branchId: targetMember.branchId,
    }

    let newValues: any = {}

    // 3. Execute override inside an atomic transaction
    await db.$transaction(async (tx) => {
      switch (action) {
        case 'FORCE_ROLE_ASSIGNMENT': {
          const targetRoles = roles && roles.length > 0 ? roles : role ? [role] : []
          if (targetRoles.length === 0) {
            throw new Error('At least one role must be provided for FORCE_ROLE_ASSIGNMENT')
          }
          if (targetRoles.includes('PLATFORM_ADMIN')) {
            throw new Error('Cannot assign PLATFORM_ADMIN role')
          }
          if (targetRoles.includes('OWNER') && !isActorOwnerOrPlatform) {
            throw new Error('Only owners can assign OWNER role')
          }

          const primaryRole = role || targetRoles[0]
          await tx.tenantUser.update({
            where: { id: targetMember.id },
            data: {
              role: primaryRole,
              roles: targetRoles,
            },
          })
          newValues = { role: primaryRole, roles: targetRoles }
          break
        }

        case 'FORCE_STATUS_TRANSITION': {
          if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
            throw new Error('Valid status (ACTIVE, INACTIVE, SUSPENDED, PENDING) is required')
          }

          await tx.tenantUser.update({
            where: { id: targetMember.id },
            data: { status },
          })
          await tx.user.update({
            where: { id: targetMember.userId },
            data: { status },
          })
          newValues = { status }
          break
        }

        case 'FORCE_BRANCH_TRANSFER': {
          if (branchId) {
            const branch = await tx.branch.findFirst({
              where: { id: branchId, tenantId: session.tenantId!, deletedAt: null },
            })
            if (!branch) throw new Error('Target campus branch not found')
          }

          await tx.tenantUser.update({
            where: { id: targetMember.id },
            data: { branchId: branchId || null },
          })
          if (targetMember.user.staffProfile) {
            await tx.staffProfile.update({
              where: { id: targetMember.user.staffProfile.id },
              data: { branchId: branchId || null },
            })
          }
          newValues = { branchId: branchId || null }
          break
        }

        case 'FORCE_PASSWORD_RESET': {
          if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters')
          }

          const passwordHash = await bcrypt.hash(password, 10)
          await tx.user.update({
            where: { id: targetMember.userId },
            data: { passwordHash, updatedAt: new Date() },
          })
          newValues = { passwordReset: true }
          break
        }

        case 'EMERGENCY_DEACTIVATE': {
          await tx.tenantUser.update({
            where: { id: targetMember.id },
            data: { status: 'INACTIVE', deletedAt: new Date() },
          })
          await tx.user.update({
            where: { id: targetMember.userId },
            data: { status: 'INACTIVE', updatedAt: new Date() },
          })
          newValues = { status: 'INACTIVE', deactivated: true }
          break
        }

        default:
          throw new Error(`Unsupported override action: ${action}`)
      }
    })

    // 4. Record high-priority OVERRIDE_USED audit log
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: targetMember.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'OVERRIDE_USED',
      entity: 'User',
      entityId: targetMember.userId,
      module: 'Users',
      severity: 'WARNING',
      summary: `Administrative override executed [${action}] on user ${targetMember.user.fullName}: "${reason}"`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues,
      newValues: {
        overrideAction: action,
        reason,
        ...newValues,
      },
    })

    return ok({
      success: true,
      action,
      targetUserId: targetMember.userId,
      userName: targetMember.user.fullName,
      reason,
      oldValues,
      newValues,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

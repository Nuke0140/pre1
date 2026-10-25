import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import {
  requireApi,
  isResponse,
  requireBranchAccess,
  requireCanManageUser,
} from '@/lib/auth-api'
import { db } from '@/lib/db'
import { UserIdentityService } from '@/lib/users/user-identity-service'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { PermissionCache } from '@/lib/cache/permission-cache'

/**
 * GET /api/v1/roles/branch-assignments
 * Lists staff branch assignments across authorized branches.
 * Query params: branchId (filter by branch), staffId (filter by specific member).
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const branchFilter = url.searchParams.get('branchId')
  const staffFilter = url.searchParams.get('staffId')

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const isInstitutionWide = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
  )

  let effectiveBranchId: string | undefined = undefined
  if (!isInstitutionWide && session.branchId) {
    if (branchFilter && branchFilter !== session.branchId) {
      return forbidden('Access denied: branch scope restricted')
    }
    effectiveBranchId = session.branchId
  } else if (branchFilter && branchFilter !== 'ALL') {
    effectiveBranchId = branchFilter
  }

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    // Filter to staff roles only
    role: { notIn: ['PARENT', 'GUARDIAN'] },
  }

  if (effectiveBranchId) {
    where.OR = [
      { branchId: effectiveBranchId },
      { assignedBranches: { some: { branchId: effectiveBranchId } } },
    ]
  }

  if (staffFilter) {
    where.OR = [{ id: staffFilter }, { userId: staffFilter }]
  }

  try {
    const [members, branches] = await Promise.all([
      db.tenantUser.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true },
          },
          staffProfile: {
            select: { employeeCode: true, designation: true, department: true },
          },
          assignedBranches: {
            include: {
              branch: {
                select: { id: true, name: true, code: true, isMain: true, isActive: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.branch.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        select: { id: true, name: true, code: true, isMain: true, isActive: true },
      }),
    ])

    const branchMap = new Map(branches.map((b) => [b.id, b]))

    const assignments = members.map((m) => {
      const primaryBranch = m.branchId ? branchMap.get(m.branchId) || null : null
      const assigned = m.assignedBranches.map((ab) => ({
        id: ab.branch.id,
        name: ab.branch.name,
        code: ab.branch.code,
        isMain: ab.branch.isMain,
        isActive: ab.branch.isActive,
        isPrimary: ab.isPrimary,
      }))

      return {
        id: m.id,
        userId: m.user.id,
        name: m.user.fullName,
        email: m.user.email,
        phone: m.user.phone,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        roles: m.roles && m.roles.length > 0 ? m.roles : [m.role],
        status: m.status,
        employeeCode: m.staffProfile?.employeeCode || null,
        designation: m.staffProfile?.designation || null,
        department: m.staffProfile?.department || null,
        primaryBranchId: m.branchId,
        primaryBranch,
        assignedBranches: assigned,
        isMultiBranch: assigned.length > 1,
      }
    })

    return ok({
      totalCount: assignments.length,
      assignments,
      branches,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/roles/branch-assignments
 * Manages branch assignment additions and primary branch transfers.
 *
 * Body payload:
 * {
 *   action: 'ADD_BRANCH' | 'REMOVE_BRANCH' | 'TRANSFER_PRIMARY',
 *   userId: string,
 *   targetBranchId: string,
 *   retainSourceAccess?: boolean, // for TRANSFER_PRIMARY: if true, old primary branch remains an additional branch
 *   reason?: string,
 * }
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const { action, userId, targetBranchId, retainSourceAccess = true, reason } = body as {
      action?: 'ADD_BRANCH' | 'REMOVE_BRANCH' | 'TRANSFER_PRIMARY'
      userId?: string
      targetBranchId?: string
      retainSourceAccess?: boolean
      reason?: string
    }

    if (!action || !userId || !targetBranchId) {
      return bad('action, userId, and targetBranchId are required', 'MISSING_PARAMETERS')
    }

    if (!['ADD_BRANCH', 'REMOVE_BRANCH', 'TRANSFER_PRIMARY'].includes(action)) {
      return bad(`Unsupported action: ${action}`, 'INVALID_ACTION')
    }

    // 1. Authorize actor over target user and target branch
    const manageCheck = await requireCanManageUser(session, userId)
    if (isResponse(manageCheck)) return manageCheck

    const branchErr = await requireBranchAccess(session, targetBranchId)
    if (branchErr) return branchErr

    // 2. Verify target branch belongs to tenant and is active
    const branch = await db.branch.findFirst({
      where: { id: targetBranchId, tenantId: session.tenantId, deletedAt: null },
    })
    if (!branch) {
      return notFound('Target campus branch not found in this school')
    }
    if (!branch.isActive) {
      return bad(`Branch "${branch.name}" is currently inactive`, 'INACTIVE_BRANCH')
    }

    // 3. Fetch current member state
    const member = await db.tenantUser.findFirst({
      where: { userId, tenantId: session.tenantId, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        staffProfile: true,
        assignedBranches: true,
      },
    })

    if (!member) {
      return notFound('Staff member not found in this school')
    }

    // Protect sole Owner / Principal critical assignments
    const oldPrimaryBranchId = member.branchId
    const existingBranchIds = member.assignedBranches.map((ab) => ab.branchId)

    const meta = getRequestMeta(req)

    // 4. Execute operation inside transaction
    let updatedResult: any = null

    await db.$transaction(async (tx) => {
      let nextPrimaryBranchId: string | null = member.branchId
      let nextBranchIds: string[] = [...existingBranchIds]

      if (action === 'ADD_BRANCH') {
        if (!nextBranchIds.includes(targetBranchId)) {
          nextBranchIds.push(targetBranchId)
        }
        if (!nextPrimaryBranchId) {
          nextPrimaryBranchId = targetBranchId
        }
      } else if (action === 'REMOVE_BRANCH') {
        if (targetBranchId === nextPrimaryBranchId) {
          return bad(
            'Cannot remove the primary branch assignment directly. Transfer primary branch first.',
            'CANNOT_REMOVE_PRIMARY_BRANCH'
          )
        }
        nextBranchIds = nextBranchIds.filter((bId) => bId !== targetBranchId)
      } else if (action === 'TRANSFER_PRIMARY') {
        // If caller doesn't retain source access, remove the old primary branch
        if (!retainSourceAccess && oldPrimaryBranchId) {
          nextBranchIds = nextBranchIds.filter((bId) => bId !== oldPrimaryBranchId)
        }
        if (!nextBranchIds.includes(targetBranchId)) {
          nextBranchIds.push(targetBranchId)
        }
        nextPrimaryBranchId = targetBranchId
      }

      // Update TenantUser primary branch
      await tx.tenantUser.update({
        where: { id: member.id },
        data: { branchId: nextPrimaryBranchId },
      })

      // Update StaffProfile branch if existing
      if (member.staffProfile) {
        await tx.staffProfile.update({
          where: { id: member.staffProfile.id },
          data: { branchId: nextPrimaryBranchId },
        })
      }

      // Synchronize junction records
      await UserIdentityService.syncTenantUserBranches(tx, {
        tenantId: session.tenantId!,
        tenantUserId: member.id,
        primaryBranchId: nextPrimaryBranchId,
        branchIds: nextBranchIds,
      })

      updatedResult = {
        userId,
        userName: member.user.fullName,
        action,
        previousPrimaryBranchId: oldPrimaryBranchId,
        newPrimaryBranchId: nextPrimaryBranchId,
        assignedBranchIds: nextBranchIds,
      }
    })

    // Invalidate user cache
    PermissionCache.bumpUserVersion(member.userId)

    // Record audit
    await recordAudit({
      tenantId: session.tenantId,
      branchId: targetBranchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: action === 'TRANSFER_PRIMARY' ? 'STAFF_BRANCH_TRANSFERRED' : 'STAFF_BRANCH_ASSIGNED',
      entity: 'StaffProfile',
      entityId: member.userId,
      module: 'HR',
      severity: action === 'TRANSFER_PRIMARY' ? 'WARNING' : 'INFO',
      summary:
        action === 'TRANSFER_PRIMARY'
          ? `Transferred ${member.user.fullName} primary branch to ${branch.name}${reason ? ` (Reason: ${reason})` : ''}`
          : `${action === 'ADD_BRANCH' ? 'Added' : 'Removed'} branch ${branch.name} for ${member.user.fullName}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: {
        primaryBranchId: oldPrimaryBranchId,
        assignedBranchIds: existingBranchIds,
      },
      newValues: {
        ...updatedResult,
        reason: reason || null,
      },
    })

    return ok(updatedResult)
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

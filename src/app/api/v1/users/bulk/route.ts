import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserRole } from '@prisma/client'

export type BulkAction =
  | 'ACTIVATE'
  | 'SUSPEND'
  | 'DEACTIVATE'
  | 'ASSIGN_ROLE'
  | 'REMOVE_ROLE'
  | 'CHANGE_BRANCH'
  | 'CHANGE_DESIGNATION'
  | 'ASSIGN_CLASSROOM'
  | 'REVOKE_SESSIONS'

interface BulkRequest {
  action: BulkAction
  userIds: string[]
  role?: UserRole
  isPrimary?: boolean
  branchId?: string | null
  designation?: string
  department?: string
  classroomId?: string
  reason?: string
}

/**
 * POST /api/v1/users/bulk — enterprise batch management
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = (await req.json()) as BulkRequest
    const { action, userIds, role, isPrimary, branchId, designation, department, classroomId, reason } = body

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return bad('Valid action and non-empty userIds array are required', 'INVALID_BULK_REQUEST')
    }

    // 1. Fetch matching TenantUsers in current tenant
    const members = await db.tenantUser.findMany({
      where: {
        userId: { in: userIds },
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: {
        user: {
          include: { staffProfile: true },
        },
      },
    })

    if (members.length === 0) {
      return bad('No matching users found in this school', 'NO_USERS_FOUND')
    }

    const isActorOwnerOrPlatform = session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

    // Separate eligible from protected members
    const eligibleMembers = members.filter((m) => {
      // Non-owners cannot modify OWNER users
      if (m.role === 'OWNER' && !isActorOwnerOrPlatform) return false
      return true
    })

    const skippedUserIds = userIds.filter((uid) => !eligibleMembers.some((m) => m.userId === uid))

    if (eligibleMembers.length === 0) {
      return forbidden('You do not have permission to modify the selected protected user accounts')
    }

    const meta = getRequestMeta(req)
    const affectedUserIds: string[] = []

    // 2. Perform requested bulk action in transaction
    await db.$transaction(async (tx) => {
      switch (action) {
        case 'ACTIVATE': {
          for (const m of eligibleMembers) {
            await tx.tenantUser.update({
              where: { id: m.id },
              data: { status: 'ACTIVE' },
            })
            await tx.user.update({
              where: { id: m.userId },
              data: { status: 'ACTIVE' },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'SUSPEND': {
          for (const m of eligibleMembers) {
            await tx.tenantUser.update({
              where: { id: m.id },
              data: { status: 'SUSPENDED' },
            })
            await tx.user.update({
              where: { id: m.userId },
              data: { status: 'SUSPENDED', updatedAt: new Date() },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'DEACTIVATE': {
          for (const m of eligibleMembers) {
            await tx.tenantUser.update({
              where: { id: m.id },
              data: { status: 'INACTIVE' },
            })
            await tx.user.update({
              where: { id: m.userId },
              data: { status: 'INACTIVE', updatedAt: new Date() },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'ASSIGN_ROLE': {
          if (!role) throw new Error('Role is required for ASSIGN_ROLE')
          if (role === 'PLATFORM_ADMIN') throw new Error('Cannot assign PLATFORM_ADMIN role')
          if (role === 'OWNER' && !isActorOwnerOrPlatform) {
            throw new Error('Only owners can assign OWNER role')
          }

          for (const m of eligibleMembers) {
            const currentRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
            const newRoles = Array.from(new Set([...currentRoles, role]))
            const newPrimaryRole = isPrimary ? role : m.role

            await tx.tenantUser.update({
              where: { id: m.id },
              data: {
                role: newPrimaryRole,
                roles: newRoles,
              },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'REMOVE_ROLE': {
          if (!role) throw new Error('Role is required for REMOVE_ROLE')
          if (role === 'OWNER' && !isActorOwnerOrPlatform) {
            throw new Error('Only owners can remove OWNER role')
          }

          for (const m of eligibleMembers) {
            const currentRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
            const remainingRoles = currentRoles.filter((r) => r !== role)

            if (remainingRoles.length === 0) {
              // Cannot leave user with no roles
              continue
            }

            const newPrimaryRole = m.role === role ? remainingRoles[0] : m.role

            await tx.tenantUser.update({
              where: { id: m.id },
              data: {
                role: newPrimaryRole,
                roles: remainingRoles,
              },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'CHANGE_BRANCH': {
          if (branchId) {
            const branch = await tx.branch.findFirst({
              where: { id: branchId, tenantId: session.tenantId! },
            })
            if (!branch) throw new Error('Selected branch does not exist')
          }

          for (const m of eligibleMembers) {
            await tx.tenantUser.update({
              where: { id: m.id },
              data: { branchId: branchId || null },
            })
            if (m.user.staffProfile) {
              await tx.staffProfile.update({
                where: { id: m.user.staffProfile.id },
                data: { branchId: branchId || null },
              })
            }
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'CHANGE_DESIGNATION': {
          const desig = designation !== undefined ? designation.trim() || null : undefined
          const dept = department !== undefined ? department.trim() || null : undefined

          for (const m of eligibleMembers) {
            if (m.user.staffProfile) {
              await tx.staffProfile.update({
                where: { id: m.user.staffProfile.id },
                data: {
                  ...(desig !== undefined ? { designation: desig } : {}),
                  ...(dept !== undefined ? { department: dept } : {}),
                },
              })
            } else {
              await tx.staffProfile.create({
                data: {
                  tenantId: session.tenantId!,
                  userId: m.userId,
                  employeeCode: `EMP-${Date.now().toString().slice(-4)}-${m.userId.slice(0, 3)}`,
                  designation: desig || null,
                  department: dept || null,
                  branchId: m.branchId,
                },
              })
            }
            affectedUserIds.push(m.userId)
          }
          break
        }

        case 'ASSIGN_CLASSROOM': {
          if (!classroomId) throw new Error('ClassroomId is required for ASSIGN_CLASSROOM')
          const classroom = await tx.classroom.findFirst({
            where: { id: classroomId, tenantId: session.tenantId! },
          })
          if (!classroom) throw new Error('Selected classroom does not exist')

          const teacherMembers = eligibleMembers.filter((m) => {
            const roles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
            return roles.includes('TEACHER')
          })

          if (teacherMembers.length === 0) {
            throw new Error('None of the selected users have the TEACHER role')
          }

          await tx.classroom.update({
            where: { id: classroom.id },
            data: { primaryTeacherId: teacherMembers[0].userId },
          })

          for (const tm of teacherMembers) {
            affectedUserIds.push(tm.userId)
          }
          break
        }

        case 'REVOKE_SESSIONS': {
          for (const m of eligibleMembers) {
            await tx.user.update({
              where: { id: m.userId },
              data: { updatedAt: new Date() },
            })
            affectedUserIds.push(m.userId)
          }
          break
        }

        default:
          throw new Error(`Unsupported bulk action: ${action}`)
      }
    })

    // 3. Record AuditLog
    await recordAudit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: `BULK_${action}`,
      entity: 'User',
      module: 'Users',
      severity: action === 'SUSPEND' || action === 'DEACTIVATE' ? 'WARNING' : 'INFO',
      summary: `Bulk executed ${action} on ${affectedUserIds.length} users${reason ? ` (${reason})` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: { action, affectedUserIds, skippedUserIds, role, branchId, designation, department },
    })

    return ok({
      success: true,
      action,
      updatedCount: affectedUserIds.length,
      affectedUserIds,
      skippedUserIds,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, notFound, bad, serverError, forbidden } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import bcrypt from 'bcryptjs'

/** GET /api/v1/users/[id] — get user details including linked profile and taught classes */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const member = await db.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: {
        user: {
          include: {
            staffProfile: true,
            taughtClasses: {
              select: { id: true, name: true, programType: true, capacity: true },
            },
            guardianProfile: {
              include: {
                studentLinks: {
                  include: {
                    student: {
                      select: { id: true, firstName: true, lastName: true, admissionNo: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!member) return notFound('User not found in this school')

    return ok({
      id: member.id,
      userId: member.user.id,
      fullName: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
      role: member.role,
      status: member.status,
      branchId: member.branchId,
      lastLoginAt: member.user.lastLoginAt,
      createdAt: member.createdAt,
      staffProfile: member.user.staffProfile,
      taughtClasses: member.user.taughtClasses,
      guardianProfile: member.user.guardianProfile
        ? {
            id: member.user.guardianProfile.id,
            relationship: member.user.guardianProfile.relationship,
            students: member.user.guardianProfile.studentLinks.map((sl) => ({
              id: sl.student.id,
              name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
              admissionNo: sl.student.admissionNo,
              canPickup: sl.canPickup,
            })),
          }
        : null,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/** PATCH /api/v1/users/[id] — update user profile, role, scope, or password */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const member = await db.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: { user: true },
    })

    if (!member) return notFound('User not found in this school')

    // Prevent non-owners from editing owners
    if (member.role === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
      return forbidden('Only owners can modify owner accounts')
    }

    const body = await req.json()
    const { fullName, phone, role, status, branchId, classroomId, password } = body

    const oldValues = {
      fullName: member.user.fullName,
      phone: member.user.phone,
      role: member.role,
      status: member.status,
      branchId: member.branchId,
    }

    // Run updates in transaction
    const updatedMember = await db.$transaction(async (tx) => {
      if (fullName || phone !== undefined || password) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            ...(fullName ? { fullName: fullName.trim() } : {}),
            ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
            ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
          },
        })
      }

      const updated = await tx.tenantUser.update({
        where: { id: member.id },
        data: {
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          ...(branchId !== undefined ? { branchId: branchId || null } : {}),
        },
        include: { user: true },
      })

      // If classroomId provided for TEACHER, reassign
      if (classroomId && updated.role === 'TEACHER') {
        await tx.classroom.update({
          where: { id: classroomId, tenantId: session.tenantId! },
          data: { primaryTeacherId: member.userId },
        })
      }

      return updated
    })

    const newValues = {
      fullName: updatedMember.user.fullName,
      phone: updatedMember.user.phone,
      role: updatedMember.role,
      status: updatedMember.status,
      branchId: updatedMember.branchId,
    }

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: updatedMember.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: member.userId,
      module: 'Users',
      summary: `Updated user ${updatedMember.user.fullName} (${updatedMember.role}, ${updatedMember.status})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues,
      newValues,
    })

    return ok({
      id: updatedMember.id,
      userId: updatedMember.user.id,
      fullName: updatedMember.user.fullName,
      email: updatedMember.user.email,
      phone: updatedMember.user.phone,
      role: updatedMember.role,
      status: updatedMember.status,
      branchId: updatedMember.branchId,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/** DELETE /api/v1/users/[id] — deactivate user from school */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const member = await db.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: { user: true },
    })

    if (!member) return notFound('User not found in this school')

    if (member.role === 'OWNER') {
      return forbidden('Cannot delete school owner account')
    }

    // Soft delete membership
    await db.tenantUser.update({
      where: { id: member.id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: member.userId,
      module: 'Users',
      severity: 'WARNING',
      summary: `Deactivated user ${member.user.fullName} from school`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return ok({ deactivated: true })
  } catch (err: any) {
    return serverError(err.message)
  }
}

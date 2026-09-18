import { db } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { StaffCreateInput, validateStaffInput } from './user-validation'
import { UserIdentityService } from './user-identity-service'
import { recordAudit } from '@/lib/audit'

export interface StaffContext {
  tenantId: string
  actorId?: string
  actorName?: string
  actorRole?: string
  actorBranchId?: string | null
  actorRoles?: string[]
  reqMeta?: {
    ipAddress?: string
    userAgent?: string
  }
}

export class StaffUserService {
  /**
   * Authoritative Flow 1: Create or Invite a Staff Member
   */
  static async createStaff(ctx: StaffContext, input: StaffCreateInput) {
    if (!ctx.tenantId) throw new Error('Tenant identifier is required')

    // 1. Validation
    const validation = validateStaffInput(input)
    if (!validation.valid) {
      const err: any = new Error(validation.errors.join(', '))
      err.code = 'VALIDATION_ERROR'
      err.details = validation.errors
      throw err
    }

    const assignedRoles: UserRole[] =
      input.roles && input.roles.length > 0
        ? [...new Set(input.roles)]
        : input.primaryRole
        ? [input.primaryRole]
        : input.role
        ? [input.role]
        : ['TEACHER']

    const primaryRole: UserRole =
      input.primaryRole && assignedRoles.includes(input.primaryRole)
        ? input.primaryRole
        : assignedRoles[0]

    // 2. Role escalation check
    const isOwnerOrPlatform = ctx.actorRole === 'OWNER' || ctx.actorRole === 'PLATFORM_ADMIN'
    const isPrincipal = ctx.actorRole === 'PRINCIPAL'

    for (const r of assignedRoles) {
      if (r === 'PLATFORM_ADMIN') {
        throw new Error('Unauthorized: Cannot assign PLATFORM_ADMIN role')
      }
      if (r === 'OWNER' && !isOwnerOrPlatform) {
        throw new Error('Unauthorized: Only an OWNER can create another OWNER account')
      }
      if (r === 'PRINCIPAL' && !isOwnerOrPlatform && !isPrincipal) {
        throw new Error('Unauthorized: Only an OWNER or PRINCIPAL can create a PRINCIPAL account')
      }
    }

    // 3. Branch restriction check
    if (input.branchId && ctx.actorBranchId && !isOwnerOrPlatform && !isPrincipal) {
      if (input.branchId !== ctx.actorBranchId) {
        throw new Error('Unauthorized: Cannot assign staff to another campus branch')
      }
    }

    const initialStatus: UserStatus = input.status || 'ACTIVE'

    // 4. Atomic transaction
    const result = await db.$transaction(async (tx) => {
      // Step A: Create or resolve User identity
      const { user } = await UserIdentityService.resolveOrCreateUser(tx, {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        username: input.username,
        password: input.password,
        status: initialStatus,
        usernameType: 'STAFF',
      })

      // Step B: Create TenantUser membership
      const membership = await UserIdentityService.createOrUpdateMembership(tx, {
        tenantId: ctx.tenantId,
        userId: user.id,
        role: primaryRole,
        roles: assignedRoles,
        branchId: input.branchId || null,
        status: initialStatus,
      })

      // Step C: Create or update StaffProfile
      let staffProfile = await tx.staffProfile.findUnique({
        where: { userId: user.id },
      })

      const empCode =
        input.employeeCode?.trim() ||
        staffProfile?.employeeCode ||
        `EMP-${Date.now().toString().slice(-6)}`

      if (staffProfile) {
        staffProfile = await tx.staffProfile.update({
          where: { id: staffProfile.id },
          data: {
            employeeCode: empCode,
            designation: input.designation?.trim() || staffProfile.designation,
            department: input.department?.trim() || staffProfile.department,
            qualification: input.qualification?.trim() || staffProfile.qualification,
            employmentType: input.employmentType || staffProfile.employmentType,
            branchId: input.branchId !== undefined ? input.branchId : staffProfile.branchId,
          },
        })
      } else {
        staffProfile = await tx.staffProfile.create({
          data: {
            tenantId: ctx.tenantId,
            userId: user.id,
            employeeCode: empCode,
            designation: input.designation?.trim() || null,
            department: input.department?.trim() || null,
            qualification: input.qualification?.trim() || null,
            employmentType: input.employmentType || 'REGULAR',
            branchId: input.branchId || null,
          },
        })
      }

      // Step D: Classroom binding if TEACHER
      let assignedClassroom: any = null
      if (input.classroomId && assignedRoles.includes('TEACHER')) {
        const room = await tx.classroom.findFirst({
          where: { id: input.classroomId, tenantId: ctx.tenantId },
        })
        if (room) {
          assignedClassroom = await tx.classroom.update({
            where: { id: room.id },
            data: { primaryTeacherId: user.id },
          })
        }
      }

      return {
        user,
        membership,
        staffProfile,
        classroom: assignedClassroom,
      }
    })

    // 5. Emit audit log
    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: input.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'STAFF_CREATED',
      entity: 'StaffProfile',
      entityId: result.user.id,
      module: 'Users',
      summary: `Created staff member ${result.user.fullName} (${result.membership.role}, Emp: ${result.staffProfile.employeeCode})`,
      ipAddress: ctx.reqMeta?.ipAddress,
      userAgent: ctx.reqMeta?.userAgent,
      newValues: {
        userId: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        username: result.user.username,
        role: result.membership.role,
        roles: result.membership.roles,
        employeeCode: result.staffProfile.employeeCode,
        branchId: result.membership.branchId,
        classroomId: result.classroom?.id || null,
      },
    })

    return result
  }
}

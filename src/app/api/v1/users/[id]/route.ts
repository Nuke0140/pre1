import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, notFound, bad, serverError, forbidden, fail } from '@/lib/api'
import {
  requireApi,
  isResponse,
  requireCanManageUser,
  requireBranchAccess,
  requireCanAssignRole,
} from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus, EmploymentType, Gender, BloodGroup, Relationship } from '@prisma/client'
import { normalizeRole } from '@/lib/roles'
import { UserLifecycleService } from '@/lib/users/user-lifecycle-service'
import { UserIdentityService } from '@/lib/users/user-identity-service'
import { SessionService } from '@/lib/users/session-service'
import { PermissionCache } from '@/lib/cache/permission-cache'
import { UsernameService } from '@/lib/users/username-service'
import { normalizeRelationship } from '@/lib/users/family-user-service'
import { normalizeBloodGroup, formatBloodGroup } from '@/lib/users/user-validation'
import { validateStatutoryInputs } from '@/lib/users/statutory-validation'
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY } from '@/lib/auth'
import { resetFailedAttempts, resetPersistentFailedAttempts } from '@/lib/auth/lockout-tracker'
import { EncryptionService } from '@/lib/security/encryption-service'
import { CustomRoleService } from '@/lib/auth/rbac-engine'
import { PrimaryContactGuard } from '@/lib/users/primary-contact-guard'

/** GET /api/v1/users/[id] — get user details including linked profile, roles, and taught classes */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck

  try {
    const member = await db.tenantUser.findFirst({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        OR: [{ userId: id }, { id }],
      },
      include: {
        staffProfile: {
          include: {
            reportingManager: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true, email: true },
                },
              },
            },
            directReports: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true, email: true },
                },
              },
            },
          },
        },
        customRoles: {
          include: {
            customRole: {
              select: { id: true, name: true, code: true, capabilities: true, status: true },
            },
          },
        },
        assignedBranches: {
          include: {
            branch: {
              select: { id: true, name: true, code: true, isMain: true },
            },
          },
        },
        user: {
          include: {
            taughtClasses: {
              select: { id: true, name: true, programType: true, capacity: true },
            },
            guardianProfile: {
              include: {
                studentLinks: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        admissionNo: true,
                        branchId: true,
                        dob: true,
                        gender: true,
                        status: true,
                        photoUrl: true,
                        seatNumber: true,
                        currentClassroom: {
                          select: { id: true, name: true, branchId: true },
                        },
                      },
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

    const assignedRoles: UserRole[] =
      member.roles && member.roles.length > 0 ? member.roles : [member.role]

    const assignedBranches = ((member as any).assignedBranches || []).map((ab: any) => ({
      id: ab.branch.id,
      name: ab.branch.name,
      code: ab.branch.code,
      isMain: ab.branch.isMain,
      isPrimary: ab.isPrimary,
    }))
    const assignedBranchIds = assignedBranches.map((b: any) => b.id)

    const customRoles = ((member as any).customRoles || [])
      .map((cr: any) => cr.customRole)
      .filter((cr: any) => cr && cr.status === 'ACTIVE')
    const customRoleIds = customRoles.map((cr: any) => cr.id)

    let invitationDetails: any = null
    if (member.status === 'PENDING') {
      const inv = await db.userInvitation.findFirst({
        where: { tenantId: session.tenantId, userId: member.userId },
        include: { invitedBy: true },
        orderBy: { createdAt: 'desc' },
      })
      if (inv) {
        const now = new Date()
        const isExpired = now >= inv.expiresAt
        const diffHours = (inv.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        const isExpiringSoon = !isExpired && diffHours <= 24
        const { formatRelativeTime } = await import('@/lib/users/invitation-service')
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        invitationDetails = {
          id: inv.id,
          status: inv.status,
          effectiveStatus: isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING_SOON' : inv.status,
          invitedAt: inv.createdAt.toISOString(),
          invitedAge: formatRelativeTime(inv.createdAt, now),
          expiresAt: inv.expiresAt.toISOString(),
          expiresIn: isExpired ? `Expired ${formatRelativeTime(inv.expiresAt, now)}` : `Expires ${formatRelativeTime(inv.expiresAt, now)}`,
          isExpired,
          isExpiringSoon,
          resendCount: inv.resendCount,
          lastResentAt: inv.lastResentAt ? inv.lastResentAt.toISOString() : null,
          invitedByName: inv.invitedBy?.fullName || 'Administrator',
          inviteUrl: inv.rawToken ? `${origin}/invite?token=${inv.rawToken}` : null,
        }
      }
    }

    let guardianProfilePayload: any = null
    if (member.user.guardianProfile) {
      const gp = member.user.guardianProfile
      const branchIds = Array.from(
        new Set(gp.studentLinks.map((sl: any) => sl.student.branchId).filter(Boolean))
      ) as string[]
      const branches =
        branchIds.length > 0
          ? await db.branch.findMany({
              where: { tenantId: session.tenantId, id: { in: branchIds } },
              select: { id: true, name: true, code: true, isMain: true },
            })
          : []
      const branchMap = new Map(branches.map((b) => [b.id, b]))

      const students = gp.studentLinks.map((sl: any) => {
        const b = branchMap.get(sl.student.branchId)
        return {
          id: sl.student.id,
          name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
          admissionNo: sl.student.admissionNo,
          canPickup: sl.canPickup,
          receivesComm: sl.receivesComm,
          pickupPin: sl.pickupPin ? '••••' : null,
          relationship: sl.relationship || gp.relationship,
          classroom: sl.student.currentClassroom?.name || null,
          branchId: sl.student.branchId,
          branchName: b?.name || null,
          branchCode: b?.code || null,
          dob: sl.student.dob ? sl.student.dob.toISOString() : null,
          gender: sl.student.gender || null,
          status: sl.student.status || 'ACTIVE',
          photoUrl: sl.student.photoUrl || null,
          seatNumber: sl.student.seatNumber || null,
        }
      })

      const uniqueBranchIds = Array.from(new Set(students.map((s: any) => s.branchId).filter(Boolean))) as string[]
      const campuses = uniqueBranchIds.map((bId) => {
        const b = branchMap.get(bId)
        return {
          id: bId,
          name: b?.name || 'Unknown Campus',
          code: b?.code || '',
          studentCount: students.filter((s: any) => s.branchId === bId).length,
        }
      })

      guardianProfilePayload = {
        id: gp.id,
        relationship: gp.relationship,
        occupation: gp.occupation,
        isPrimaryContact: gp.isPrimaryContact,
        pickupPin: gp.pickupPin ? '••••' : null,
        isCrossCampus: uniqueBranchIds.length > 1,
        campusesCount: uniqueBranchIds.length,
        campuses,
        students,
      }
    }

    return ok({
      id: member.id,
      userId: member.user.id,
      fullName: member.user.fullName,
      name: member.user.fullName,
      email: member.user.email,
      phone: member.user.phone,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl,
      locale: member.user.locale,
      role: member.role,
      roles: assignedRoles,
      customRoles,
      customRoleIds,
      status: member.status,
      invitation: invitationDetails,
      branchId: member.branchId,
      assignedBranches,
      assignedBranchIds,
      lastLoginAt: member.user.lastLoginAt,
      createdAt: member.createdAt,
      staffProfile: member.staffProfile
        ? {
            ...member.staffProfile,
            bloodGroup: formatBloodGroup(member.staffProfile.bloodGroup),
            panNumber: EncryptionService.decrypt(member.staffProfile.panNumber, session.tenantId),
            aadhaarNumber: EncryptionService.decrypt(member.staffProfile.aadhaarNumber, session.tenantId),
            uanNumber: EncryptionService.decrypt(member.staffProfile.uanNumber, session.tenantId),
            esiNumber: EncryptionService.decrypt(member.staffProfile.esiNumber, session.tenantId),
            currentAddress: EncryptionService.decrypt(member.staffProfile.currentAddress, session.tenantId),
            permanentAddress: EncryptionService.decrypt(member.staffProfile.permanentAddress, session.tenantId),
            reportingManagerId: member.staffProfile.reportingManagerId,
            reportingManager: member.staffProfile.reportingManager
              ? {
                  id: member.staffProfile.reportingManager.id,
                  userId: member.staffProfile.reportingManager.userId,
                  name: member.staffProfile.reportingManager.user.fullName,
                  fullName: member.staffProfile.reportingManager.user.fullName,
                  designation: member.staffProfile.reportingManager.designation,
                  avatarUrl: member.staffProfile.reportingManager.user.avatarUrl,
                }
              : null,
            directReports: (member.staffProfile.directReports || []).map((dr: any) => ({
              id: dr.id,
              userId: dr.userId,
              name: dr.user?.fullName || 'Staff Member',
              fullName: dr.user?.fullName || 'Staff Member',
              designation: dr.designation,
              department: dr.department,
              avatarUrl: dr.user?.avatarUrl,
            })),
            directReportsCount: member.staffProfile.directReports?.length || 0,
          }
        : null,
      reportingManagerId: member.staffProfile?.reportingManagerId || null,
      reportingManager: member.staffProfile?.reportingManager
        ? {
            id: member.staffProfile.reportingManager.id,
            userId: member.staffProfile.reportingManager.userId,
            name: member.staffProfile.reportingManager.user.fullName,
            designation: member.staffProfile.reportingManager.designation,
            avatarUrl: member.staffProfile.reportingManager.user.avatarUrl,
          }
        : null,
      taughtClasses: member.user.taughtClasses,
      guardianProfile: guardianProfilePayload,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/** PATCH /api/v1/users/[id] — update user profile, roles, scope, designation, staff HR fields, or guardian details */
async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    const body = await req.json()
    const {
      fullName,
      email,
      phone,
      username,
      avatarUrl,
      locale,
      role,
      roles: inputRoles,
      primaryRole,
      status,
      branchId,
      branchIds: inputBranchIds,
      assignedBranchIds: inputAssignedBranchIds,
      customRoleIds,
      classroomId,
      password,
      // Staff Profile fields
      employeeCode,
      designation,
      department,
      qualification,
      employmentType,
      joiningDate,
      dateOfBirth,
      gender,
      maritalStatus,
      bloodGroup,
      currentAddress,
      permanentAddress,
      emergencyContactName,
      emergencyContactPhone,
      panNumber,
      aadhaarNumber,
      uanNumber,
      esiNumber,
      probationEndDate,
      confirmationDate,
      noticePeriodDays,
      reportingManagerId,
      // Guardian Profile fields
      relationship,
      occupation,
      isPrimaryContact,
      pickupPin,
      canPickup,
      receivesComm,
    } = body as {
      fullName?: string
      email?: string | null
      phone?: string | null
      username?: string | null
      avatarUrl?: string | null
      locale?: string
      role?: UserRole
      roles?: UserRole[]
      primaryRole?: UserRole
      status?: any
      branchId?: string | null
      branchIds?: string[]
      assignedBranchIds?: string[]
      customRoleIds?: string[]
      classroomId?: string | null
      password?: string
      employeeCode?: string
      designation?: string | null
      department?: string | null
      qualification?: string | null
      employmentType?: any
      joiningDate?: string | Date | null
      dateOfBirth?: string | Date | null
      gender?: any
      maritalStatus?: string | null
      bloodGroup?: any
      currentAddress?: string | null
      permanentAddress?: string | null
      emergencyContactName?: string | null
      emergencyContactPhone?: string | null
      panNumber?: string | null
      aadhaarNumber?: string | null
      uanNumber?: string | null
      esiNumber?: string | null
      probationEndDate?: string | Date | null
      confirmationDate?: string | Date | null
      noticePeriodDays?: number | null
      reportingManagerId?: string | null
      relationship?: any
      occupation?: string | null
      isPrimaryContact?: boolean
      pickupPin?: string | null
      canPickup?: boolean
      receivesComm?: boolean
    }

    const branchIds = inputBranchIds !== undefined ? inputBranchIds : inputAssignedBranchIds

    // Validate email format and uniqueness if provided
    let cleanEmail: string | undefined = undefined
    if (email !== undefined) {
      if (email && email.trim()) {
        cleanEmail = email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return bad('Invalid email address format', 'INVALID_EMAIL')
        }
        const existingEmailUser = await db.user.findFirst({
          where: { email: cleanEmail, id: { not: member.userId } },
          select: { id: true },
        })
        if (existingEmailUser) {
          return bad('Email address is already in use by another user', 'EMAIL_ALREADY_EXISTS')
        }
      } else {
        cleanEmail = undefined
      }
    }

    // Validate username format and uniqueness if provided
    let cleanUsername: string | undefined = undefined
    if (username !== undefined) {
      if (username && username.trim()) {
        cleanUsername = UsernameService.normalizeUsername(username)
        const formatCheck = UsernameService.isValidUsername(cleanUsername)
        if (!formatCheck.valid) {
          return bad(
            formatCheck.reason ||
              'Username must be 3-30 characters and contain only lowercase letters, numbers, dots, hyphens, and underscores',
            'INVALID_USERNAME'
          )
        }
        const available = await UsernameService.isUsernameAvailable(cleanUsername, 'STAFF', member.userId)
        if (!available) {
          return bad(`Username '${cleanUsername}' is already taken`, 'USERNAME_ALREADY_EXISTS')
        }
      } else {
        cleanUsername = undefined
      }
    }

    // Validate password complexity if provided
    if (password !== undefined && password !== null && password !== '') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return bad(PASSWORD_POLICY.errorMessage, 'INVALID_PASSWORD')
      }
    }

    // Validate Pickup PIN if provided
    if (pickupPin !== undefined && pickupPin !== null && pickupPin.trim() !== '') {
      const pin = pickupPin.trim()
      if (!pin.includes('•') && !/^\d{4,6}$/.test(pin)) {
        return bad('Pickup PIN must be 4 to 6 numeric digits', 'INVALID_PICKUP_PIN')
      }
    }

    // Validate statutory IDs if provided
    const statutoryCheck = validateStatutoryInputs({
      panNumber,
      aadhaarNumber,
      uanNumber,
      esiNumber,
    })
    if (!statutoryCheck.valid) {
      const [firstField, firstErr] = Object.entries(statutoryCheck.errors)[0]
      return bad(firstErr, 'INVALID_STATUTORY_ID', firstField)
    }

    // Lifecycle status mutation validation and canonical routing
    let lifecycleStatusToApply: UserStatus | undefined
    if (status !== undefined) {
      const upperStatus = String(status).toUpperCase() as UserStatus
      if (!['ACTIVE', 'SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(upperStatus)) {
        return bad(
          `Invalid status: ${status}. Allowed: ACTIVE, SUSPENDED, LOCKED, DEACTIVATED, ARCHIVED`,
          'INVALID_STATUS'
        )
      }

      if (upperStatus !== member.status) {
        const validation = UserLifecycleService.validateTransition(
          member.status as string,
          upperStatus,
          member.role,
          session.role
        )
        if (!validation.valid) {
          if (validation.statusHttp === 403) return forbidden(validation.error!)
          return bad(validation.error!, validation.code!)
        }
        lifecycleStatusToApply = upperStatus
      }
    }

    // Determine target roles
    let targetRoles: UserRole[] | undefined
    if (inputRoles && Array.isArray(inputRoles) && inputRoles.length > 0) {
      targetRoles = [...new Set(inputRoles.map((r) => normalizeRole(r) as UserRole))]
    } else if (role) {
      // If role provided but inputRoles omitted, preserve secondary roles if existing, else [role]
      const newPrimary = normalizeRole(role) as UserRole
      const existingSecondaries = (member.roles || []).filter((r) => r !== member.role)
      targetRoles = [...new Set([newPrimary, ...existingSecondaries])]
    }

    if (targetRoles) {
      const roleErr = requireCanAssignRole(session, targetRoles)
      if (roleErr) return roleErr

      // Critical-role protection: prevent removing the sole Owner or sole Principal from the tenant
      if (member.role === 'OWNER' && !targetRoles.includes('OWNER')) {
        const ownerCount = await db.tenantUser.count({
          where: {
            tenantId: session.tenantId,
            role: 'OWNER',
            status: 'ACTIVE',
            deletedAt: null,
            id: { not: member.id },
          },
        })
        if (ownerCount === 0) {
          return forbidden('Cannot remove the sole active Owner of the school')
        }
      }

      if (member.role === 'PRINCIPAL' && !targetRoles.includes('PRINCIPAL')) {
        const principalCount = await db.tenantUser.count({
          where: {
            tenantId: session.tenantId,
            role: 'PRINCIPAL',
            status: 'ACTIVE',
            deletedAt: null,
            id: { not: member.id },
          },
        })
        if (principalCount === 0) {
          return forbidden('Cannot downgrade the sole active Principal of the school')
        }
      }
    }

    // Critical-role protection on status change: cannot deactivate/suspend the sole Owner
    if (lifecycleStatusToApply && ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(lifecycleStatusToApply)) {
      if (member.role === 'OWNER') {
        const ownerCount = await db.tenantUser.count({
          where: {
            tenantId: session.tenantId,
            role: 'OWNER',
            status: 'ACTIVE',
            deletedAt: null,
            id: { not: member.id },
          },
        })
        if (ownerCount === 0) {
          return forbidden('Cannot suspend or deactivate the sole active Owner of the school')
        }
      }
    }

    if (branchId) {
      const branchErr = requireBranchAccess(session, branchId)
      if (branchErr) return branchErr
    }

    const finalPrimaryRole: UserRole | undefined =
      targetRoles
        ? (primaryRole && targetRoles.includes(normalizeRole(primaryRole) as UserRole)
            ? (normalizeRole(primaryRole) as UserRole)
            : (role && targetRoles.includes(normalizeRole(role) as UserRole)
                ? (normalizeRole(role) as UserRole)
                : targetRoles[0]))
        : (role ? (normalizeRole(role) as UserRole) : primaryRole ? (normalizeRole(primaryRole) as UserRole) : undefined)

    const isPlatformAdmin = session.role === 'PLATFORM_ADMIN'
    let isGlobalStatusUpdate = false
    let isPasswordReset = false

    // Date & Number helpers for optional profile attributes
    const parseDateInput = (val: any): Date | null | undefined => {
      if (val === undefined) return undefined
      if (val === null || val === '') return null
      if (typeof val === 'string' && val.includes('•')) return undefined
      const parsed = new Date(val)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    const parseNoticePeriod = (val: any): number | undefined => {
      if (val === undefined) return undefined
      if (val === null || val === '') return 60
      const parsed = parseInt(String(val), 10)
      return isNaN(parsed) ? 60 : Math.max(0, parsed)
    }

    // Primary contact deactivation guard (Doc 3.2): cannot suspend/deactivate primary contact or revoke primary status without nominating alternate
    let primaryTransfers: any[] = []
    const isStatusDeactivation =
      lifecycleStatusToApply &&
      ['SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED', 'INACTIVE'].includes(lifecycleStatusToApply)
    const isPrimaryRevocation = isPrimaryContact === false

    if (isStatusDeactivation || isPrimaryRevocation) {
      const guardCheck = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: session.tenantId!,
        userId: member.userId,
        targetStatus: lifecycleStatusToApply,
        isExplicitPrimaryRevocation: isPrimaryRevocation,
        alternateGuardianId: (body as any).alternateGuardianId || (body as any).nominateAlternateId,
        alternateUserId: (body as any).alternateUserId,
        alternateGuardiansByStudent: (body as any).alternateGuardiansByStudent,
      })

      if (!guardCheck.safe) {
        return fail(
          guardCheck.code || 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED',
          guardCheck.error || 'Cannot deactivate primary contact without nominating an alternate contact',
          409,
          undefined,
          { affectedStudents: guardCheck.affectedStudents }
        )
      }
      primaryTransfers = guardCheck.transfers
    }

    // Resolve reporting manager if provided
    let resolvedReportingManagerId: string | null | undefined = undefined
    if (reportingManagerId !== undefined) {
      if (reportingManagerId === null || reportingManagerId === '') {
        resolvedReportingManagerId = null
      } else {
        const trimmedMgrId = String(reportingManagerId).trim()
        const mgrStaff = await db.staffProfile.findFirst({
          where: {
            tenantId: session.tenantId!,
            deletedAt: null,
            OR: [{ id: trimmedMgrId }, { userId: trimmedMgrId }],
          },
          select: { id: true, userId: true },
        })
        if (!mgrStaff) {
          return bad('Specified reporting manager was not found', 'INVALID_REPORTING_MANAGER')
        }
        if (mgrStaff.userId === member.userId) {
          return bad('Staff member cannot report to themselves', 'CIRCULAR_REPORTING_LINE')
        }
        resolvedReportingManagerId = mgrStaff.id
      }
    }

    // Run updates in atomic transaction
    const updatedMember = await db.$transaction(async (tx) => {
      if (primaryTransfers.length > 0) {
        await PrimaryContactGuard.applyTransfersTx(tx, primaryTransfers, {
          uid: session.uid,
          name: session.name,
          role: session.role,
          tenantId: session.tenantId,
        })
      }

      const hasUserUpdates =
        fullName !== undefined ||
        cleanEmail !== undefined ||
        phone !== undefined ||
        cleanUsername !== undefined ||
        avatarUrl !== undefined ||
        locale !== undefined ||
        password ||
        lifecycleStatusToApply

      if (hasUserUpdates) {
        let shouldUpdateUserStatus = false
        if (lifecycleStatusToApply) {
          const otherActiveMemberships = await tx.tenantUser.count({
            where: {
              userId: member.userId,
              id: { not: member.id },
              status: 'ACTIVE',
              deletedAt: null,
            },
          })
          shouldUpdateUserStatus = isPlatformAdmin || lifecycleStatusToApply === 'ACTIVE' || otherActiveMemberships === 0
          isGlobalStatusUpdate = shouldUpdateUserStatus && otherActiveMemberships === 0
        }

        if (password) {
          isPasswordReset = true
        }

        await tx.user.update({
          where: { id: member.userId },
          data: {
            ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
            ...(cleanEmail !== undefined ? { email: cleanEmail } : {}),
            ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
            ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl ? avatarUrl.trim() : null } : {}),
            ...(locale !== undefined ? { locale: locale.trim() || 'en-IN' } : {}),
            ...(password
              ? {
                  passwordHash: await bcrypt.hash(password, 10),
                  mustChangePassword: true,
                }
              : {}),
            ...(shouldUpdateUserStatus ? { status: lifecycleStatusToApply, updatedAt: new Date() } : {}),
          },
        })
      }

      const updated = await tx.tenantUser.update({
        where: { id: member.id },
        data: {
          ...(finalPrimaryRole ? { role: finalPrimaryRole } : {}),
          ...(targetRoles ? { roles: targetRoles } : {}),
          ...(lifecycleStatusToApply ? { status: lifecycleStatusToApply } : {}),
          ...(branchId !== undefined ? { branchId: branchId || null } : {}),
        },
        include: {
          staffProfile: true,
          user: true,
        },
      })

      if (branchIds !== undefined || branchId !== undefined) {
        await UserIdentityService.syncTenantUserBranches(tx, {
          tenantId: session.tenantId!,
          tenantUserId: member.id,
          primaryBranchId: updated.branchId,
          branchIds: branchIds !== undefined ? branchIds : (updated.branchId ? [updated.branchId] : []),
        })
      }

      const effectiveRoles = updated.roles && updated.roles.length > 0 ? updated.roles : [updated.role]
      const isStaff = effectiveRoles.some((r) =>
        ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST', 'ATTENDANT', 'DRIVER'].includes(normalizeRole(r))
      )

      // Handle StaffProfile updates if staff role or any workforce fields are provided
      const hasStaffFields =
        isStaff ||
        employeeCode !== undefined ||
        designation !== undefined ||
        department !== undefined ||
        qualification !== undefined ||
        employmentType !== undefined ||
        joiningDate !== undefined ||
        dateOfBirth !== undefined ||
        gender !== undefined ||
        maritalStatus !== undefined ||
        bloodGroup !== undefined ||
        currentAddress !== undefined ||
        permanentAddress !== undefined ||
        emergencyContactName !== undefined ||
        emergencyContactPhone !== undefined ||
        panNumber !== undefined ||
        aadhaarNumber !== undefined ||
        uanNumber !== undefined ||
        esiNumber !== undefined ||
        probationEndDate !== undefined ||
        confirmationDate !== undefined ||
        noticePeriodDays !== undefined ||
        reportingManagerId !== undefined

      if (hasStaffFields) {
        const existingProfile = await tx.staffProfile.findUnique({
          where: { tenantId_userId: { tenantId: session.tenantId!, userId: member.userId } },
        })

        const empCode =
          employeeCode?.trim() ||
          existingProfile?.employeeCode ||
          updated.staffProfile?.employeeCode ||
          `EMP-${Date.now().toString().slice(-4)}`

        const parsedDob = parseDateInput(dateOfBirth)
        const parsedJoining = parseDateInput(joiningDate)
        const parsedProbation = parseDateInput(probationEndDate)
        const parsedConfirmation = parseDateInput(confirmationDate)
        const noticePeriod = parseNoticePeriod(noticePeriodDays)

        if (existingProfile) {
          await tx.staffProfile.update({
            where: { id: existingProfile.id },
            data: {
              ...(employeeCode !== undefined ? { employeeCode: empCode } : {}),
              ...(designation !== undefined ? { designation: designation ? designation.trim() : null } : {}),
              ...(department !== undefined ? { department: department ? department.trim() : null } : {}),
              ...(qualification !== undefined ? { qualification: qualification ? qualification.trim() : null } : {}),
              ...(employmentType !== undefined ? { employmentType: employmentType || 'FULL_TIME' } : {}),
              ...(branchId !== undefined ? { branchId: branchId || null } : {}),
              ...(parsedDob !== undefined ? { dateOfBirth: parsedDob } : {}),
              ...(gender !== undefined ? { gender: gender || null } : {}),
              ...(parsedJoining !== undefined ? { joiningDate: parsedJoining } : {}),
              ...(emergencyContactName !== undefined ? { emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null } : {}),
              ...(emergencyContactPhone !== undefined ? { emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null } : {}),
              ...(maritalStatus !== undefined ? { maritalStatus: maritalStatus ? maritalStatus.trim() : null } : {}),
              ...(bloodGroup !== undefined ? { bloodGroup: normalizeBloodGroup(bloodGroup) } : {}),
              ...(currentAddress !== undefined && (currentAddress === null || !currentAddress.includes('•'))
                ? { currentAddress: currentAddress ? EncryptionService.encrypt(currentAddress.trim(), session.tenantId) : null }
                : {}),
              ...(permanentAddress !== undefined && (permanentAddress === null || !permanentAddress.includes('•'))
                ? { permanentAddress: permanentAddress ? EncryptionService.encrypt(permanentAddress.trim(), session.tenantId) : null }
                : {}),
              ...(panNumber !== undefined && (panNumber === null || !panNumber.includes('•'))
                ? { panNumber: statutoryCheck.normalized.panNumber ? EncryptionService.encrypt(statutoryCheck.normalized.panNumber, session.tenantId) : null }
                : {}),
              ...(aadhaarNumber !== undefined && (aadhaarNumber === null || !aadhaarNumber.includes('•'))
                ? { aadhaarNumber: statutoryCheck.normalized.aadhaarNumber ? EncryptionService.encrypt(statutoryCheck.normalized.aadhaarNumber, session.tenantId) : null }
                : {}),
              ...(uanNumber !== undefined && (uanNumber === null || !uanNumber.includes('•'))
                ? { uanNumber: statutoryCheck.normalized.uanNumber ? EncryptionService.encrypt(statutoryCheck.normalized.uanNumber, session.tenantId) : null }
                : {}),
              ...(esiNumber !== undefined && (esiNumber === null || !esiNumber.includes('•'))
                ? { esiNumber: statutoryCheck.normalized.esiNumber ? EncryptionService.encrypt(statutoryCheck.normalized.esiNumber, session.tenantId) : null }
                : {}),
              ...(parsedProbation !== undefined ? { probationEndDate: parsedProbation } : {}),
              ...(parsedConfirmation !== undefined ? { confirmationDate: parsedConfirmation } : {}),
              ...(noticePeriod !== undefined ? { noticePeriodDays: noticePeriod } : {}),
              ...(resolvedReportingManagerId !== undefined ? { reportingManagerId: resolvedReportingManagerId } : {}),
            },
          })
        } else {
          await tx.staffProfile.create({
            data: {
              tenantId: session.tenantId!,
              userId: member.userId,
              employeeCode: empCode,
              designation: designation ? designation.trim() : null,
              department: department ? department.trim() : null,
              qualification: qualification ? qualification.trim() : null,
              employmentType: employmentType || 'FULL_TIME',
              branchId: branchId || null,
              dateOfBirth: parsedDob || null,
              gender: gender || null,
              joiningDate: parsedJoining || null,
              emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null,
              emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
              maritalStatus: maritalStatus ? maritalStatus.trim() : null,
              bloodGroup: normalizeBloodGroup(bloodGroup),
              currentAddress: currentAddress && !currentAddress.includes('•') ? EncryptionService.encrypt(currentAddress.trim(), session.tenantId) : null,
              permanentAddress: permanentAddress && !permanentAddress.includes('•') ? EncryptionService.encrypt(permanentAddress.trim(), session.tenantId) : null,
              panNumber: panNumber && !panNumber.includes('•') && statutoryCheck.normalized.panNumber ? EncryptionService.encrypt(statutoryCheck.normalized.panNumber, session.tenantId) : null,
              aadhaarNumber: aadhaarNumber && !aadhaarNumber.includes('•') && statutoryCheck.normalized.aadhaarNumber ? EncryptionService.encrypt(statutoryCheck.normalized.aadhaarNumber, session.tenantId) : null,
              uanNumber: uanNumber && !uanNumber.includes('•') && statutoryCheck.normalized.uanNumber ? EncryptionService.encrypt(statutoryCheck.normalized.uanNumber, session.tenantId) : null,
              esiNumber: esiNumber && !esiNumber.includes('•') && statutoryCheck.normalized.esiNumber ? EncryptionService.encrypt(statutoryCheck.normalized.esiNumber, session.tenantId) : null,
              probationEndDate: parsedProbation || null,
              confirmationDate: parsedConfirmation || null,
              noticePeriodDays: noticePeriod !== undefined ? noticePeriod : 60,
              reportingManagerId: resolvedReportingManagerId || null,
            },
          })
        }
      }

      // Handle Guardian profile updates if family role or guardian fields are provided
      const isFamily = effectiveRoles.some((r) => ['PARENT', 'GUARDIAN'].includes(normalizeRole(r)))
      const hasGuardianFields =
        isFamily ||
        relationship !== undefined ||
        occupation !== undefined ||
        isPrimaryContact !== undefined ||
        pickupPin !== undefined ||
        canPickup !== undefined ||
        receivesComm !== undefined

      if (hasGuardianFields) {
        let existingGuardian = await tx.guardian.findFirst({
          where: { userId: member.userId, tenantId: session.tenantId! },
        })

        const mappedRel = relationship ? (normalizeRelationship(relationship) as Relationship) : undefined

        if (existingGuardian) {
          existingGuardian = await tx.guardian.update({
            where: { id: existingGuardian.id },
            data: {
              ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
              ...(phone !== undefined ? { phone: phone ? phone.trim() : existingGuardian.phone } : {}),
              ...(cleanEmail !== undefined ? { email: cleanEmail } : {}),
              ...(mappedRel ? { relationship: mappedRel } : {}),
              ...(occupation !== undefined ? { occupation: occupation ? occupation.trim() : null } : {}),
              ...(isPrimaryContact !== undefined ? { isPrimaryContact: Boolean(isPrimaryContact) } : {}),
              ...(pickupPin !== undefined && (pickupPin === null || !pickupPin.includes('•'))
                ? { pickupPin: pickupPin ? pickupPin.trim() : null }
                : {}),
            },
          })
        } else if (isFamily) {
          existingGuardian = await tx.guardian.create({
            data: {
              tenantId: session.tenantId!,
              userId: member.userId,
              fullName: fullName ? fullName.trim() : member.user.fullName,
              phone: phone ? phone.trim() : member.user.phone || '',
              email: cleanEmail !== undefined ? cleanEmail : member.user.email,
              relationship: mappedRel || 'GUARDIAN',
              occupation: occupation ? occupation.trim() : null,
              isPrimaryContact: Boolean(isPrimaryContact),
              pickupPin: pickupPin && !pickupPin.includes('•') ? pickupPin.trim() : null,
            },
          })
        }

        if (existingGuardian && (canPickup !== undefined || receivesComm !== undefined || pickupPin !== undefined)) {
          await tx.studentGuardian.updateMany({
            where: { guardianId: existingGuardian.id },
            data: {
              ...(canPickup !== undefined ? { canPickup: Boolean(canPickup) } : {}),
              ...(receivesComm !== undefined ? { receivesComm: Boolean(receivesComm) } : {}),
              ...(pickupPin !== undefined && (pickupPin === null || !pickupPin.includes('•'))
                ? { pickupPin: pickupPin ? pickupPin.trim() : null }
                : {}),
            },
          })
        }
      }

      // If classroomId provided and user has TEACHER role, assign or unassign as primaryTeacherId
      if (classroomId !== undefined) {
        if (classroomId && effectiveRoles.includes('TEACHER')) {
          await tx.classroom.update({
            where: { id: classroomId, tenantId: session.tenantId! },
            data: { primaryTeacherId: member.userId },
          })
        } else if (!classroomId) {
          await tx.classroom.updateMany({
            where: { primaryTeacherId: member.userId, tenantId: session.tenantId! },
            data: { primaryTeacherId: null },
          })
        }
      }

      return updated
    })

    // Sync dynamic custom roles if provided
    if (customRoleIds !== undefined) {
      await CustomRoleService.syncUserCustomRoles({
        tenantUserId: member.id,
        tenantId: session.tenantId!,
        customRoleIds,
        assignedById: session.uid,
      })
    }

    // If password was reset by administrator, revoke all active sessions for the user and record audit
    if (isPasswordReset) {
      await SessionService.bumpTokenVersion(member.userId, Date.now())
      await SessionService.revokeAllUserSessions(member.userId)
      PermissionCache.bumpUserVersion(member.userId)
      const meta = getRequestMeta(req)
      await recordAudit({
        tenantId: session.tenantId,
        branchId: updatedMember.branchId || undefined,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'ADMIN_PASSWORD_RESET',
        entity: 'User',
        entityId: member.userId,
        module: 'Users',
        severity: 'WARNING',
        summary: `Administrator ${session.name} reset password for user ${updatedMember.user.fullName}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })
    }

    // If lifecycle status changed, invalidate sessions and record canonical lifecycle audit
    if (lifecycleStatusToApply) {
      await UserLifecycleService.revokeSessionsIfRestricted(
        member.userId,
        lifecycleStatusToApply,
        session.tenantId,
        isGlobalStatusUpdate || isPlatformAdmin
      )
      if (lifecycleStatusToApply === 'ACTIVE') {
        await resetPersistentFailedAttempts(member.userId)
        resetFailedAttempts(member.userId, member.user.email, member.user.username)
      }
      await UserLifecycleService.recordLifecycleAudit({
        tenantId: session.tenantId,
        branchId: updatedMember.branchId || undefined,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        member: {
          userId: member.userId,
          role: member.role,
          user: { fullName: member.user.fullName },
        },
        previousStatus: member.status as string,
        targetStatus: lifecycleStatusToApply,
        reason: (body as any)?.reason,
        req,
      })
    }

    const newRoles: UserRole[] =
      updatedMember.roles && updatedMember.roles.length > 0
        ? updatedMember.roles
        : [updatedMember.role]

    // Record user update audit
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
      summary: `Updated user ${updatedMember.user.fullName} (roles: [${newRoles.join(', ')}], primary: ${updatedMember.role}, status: ${updatedMember.status})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        fullName,
        email: cleanEmail,
        phone,
        role: updatedMember.role,
        roles: newRoles,
        status: updatedMember.status,
        branchId: updatedMember.branchId,
        designation,
        employeeCode,
        department,
        qualification,
      },
    })

    // Retrieve fresh and complete user representation matching _GET format
    const refreshed = await db.tenantUser.findUnique({
      where: { id: member.id },
      include: {
        staffProfile: {
          include: {
            reportingManager: {
              include: {
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
            directReports: {
              where: { deletedAt: null },
              include: {
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
          },
        },
        assignedBranches: {
          include: {
            branch: {
              select: { id: true, name: true, code: true, isMain: true },
            },
          },
        },
        user: {
          include: {
            taughtClasses: {
              select: { id: true, name: true, programType: true, capacity: true },
            },
            guardianProfile: {
              include: {
                studentLinks: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        admissionNo: true,
                        branchId: true,
                        dob: true,
                        gender: true,
                        status: true,
                        photoUrl: true,
                        seatNumber: true,
                        currentClassroom: {
                          select: { id: true, name: true, branchId: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!refreshed) return serverError('Failed to retrieve updated member record')

    const assignedRoles: UserRole[] =
      refreshed.roles && refreshed.roles.length > 0 ? refreshed.roles : [refreshed.role]

    const assignedBranches = (refreshed.assignedBranches || []).map((ab: any) => ({
      id: ab.branch.id,
      name: ab.branch.name,
      code: ab.branch.code,
      isMain: ab.branch.isMain,
      isPrimary: ab.isPrimary,
    }))
    const assignedBranchIds = assignedBranches.map((b: any) => b.id)

    let refreshedGuardianProfile: any = null
    if (refreshed.user.guardianProfile) {
      const gp = refreshed.user.guardianProfile
      const branchIds = Array.from(
        new Set(gp.studentLinks.map((sl: any) => sl.student.branchId).filter(Boolean))
      ) as string[]
      const branches =
        branchIds.length > 0
          ? await db.branch.findMany({
              where: { tenantId: session.tenantId, id: { in: branchIds } },
              select: { id: true, name: true, code: true, isMain: true },
            })
          : []
      const branchMap = new Map(branches.map((b) => [b.id, b]))

      const students = gp.studentLinks.map((sl: any) => {
        const b = branchMap.get(sl.student.branchId)
        return {
          id: sl.student.id,
          name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
          admissionNo: sl.student.admissionNo,
          canPickup: sl.canPickup,
          receivesComm: sl.receivesComm,
          pickupPin: sl.pickupPin ? '••••' : null,
          relationship: sl.relationship || gp.relationship,
          classroom: sl.student.currentClassroom?.name || null,
          branchId: sl.student.branchId,
          branchName: b?.name || null,
          branchCode: b?.code || null,
          dob: sl.student.dob ? sl.student.dob.toISOString() : null,
          gender: sl.student.gender || null,
          status: sl.student.status || 'ACTIVE',
          photoUrl: sl.student.photoUrl || null,
          seatNumber: sl.student.seatNumber || null,
        }
      })

      const uniqueBranchIds = Array.from(new Set(students.map((s: any) => s.branchId).filter(Boolean))) as string[]
      const campuses = uniqueBranchIds.map((bId) => {
        const b = branchMap.get(bId)
        return {
          id: bId,
          name: b?.name || 'Unknown Campus',
          code: b?.code || '',
          studentCount: students.filter((s: any) => s.branchId === bId).length,
        }
      })

      refreshedGuardianProfile = {
        id: gp.id,
        relationship: gp.relationship,
        occupation: gp.occupation,
        isPrimaryContact: gp.isPrimaryContact,
        pickupPin: gp.pickupPin ? '••••' : null,
        isCrossCampus: uniqueBranchIds.length > 1,
        campusesCount: uniqueBranchIds.length,
        campuses,
        students,
      }
    }

    return ok({
      id: refreshed.id,
      userId: refreshed.user.id,
      fullName: refreshed.user.fullName,
      email: refreshed.user.email,
      phone: refreshed.user.phone,
      username: refreshed.user.username,
      avatarUrl: refreshed.user.avatarUrl,
      locale: refreshed.user.locale,
      role: refreshed.role,
      roles: assignedRoles,
      status: refreshed.status,
      branchId: refreshed.branchId,
      assignedBranches,
      assignedBranchIds,
      lastLoginAt: refreshed.user.lastLoginAt,
      createdAt: refreshed.createdAt,
      staffProfile: refreshed.staffProfile
        ? {
            ...refreshed.staffProfile,
            bloodGroup: formatBloodGroup(refreshed.staffProfile.bloodGroup),
            reportingManager: refreshed.staffProfile.reportingManager
              ? {
                  id: refreshed.staffProfile.reportingManager.id,
                  userId: refreshed.staffProfile.reportingManager.userId,
                  name: refreshed.staffProfile.reportingManager.user.fullName,
                  fullName: refreshed.staffProfile.reportingManager.user.fullName,
                  designation: refreshed.staffProfile.reportingManager.designation,
                  avatarUrl: refreshed.staffProfile.reportingManager.user.avatarUrl,
                }
              : null,
            directReports: (refreshed.staffProfile.directReports || []).map((dr: any) => ({
              id: dr.id,
              userId: dr.userId,
              name: dr.user?.fullName || 'Staff Member',
              fullName: dr.user?.fullName || 'Staff Member',
              designation: dr.designation,
              department: dr.department,
              avatarUrl: dr.user?.avatarUrl,
            })),
            directReportsCount: refreshed.staffProfile.directReports?.length || 0,
          }
        : null,
      reportingManagerId: refreshed.staffProfile?.reportingManagerId || null,
      reportingManager: refreshed.staffProfile?.reportingManager
        ? {
            id: refreshed.staffProfile.reportingManager.id,
            userId: refreshed.staffProfile.reportingManager.userId,
            name: refreshed.staffProfile.reportingManager.user.fullName,
            designation: refreshed.staffProfile.reportingManager.designation,
            avatarUrl: refreshed.staffProfile.reportingManager.user.avatarUrl,
          }
        : null,
      taughtClasses: refreshed.user.taughtClasses,
      guardianProfile: refreshedGuardianProfile,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/** DELETE /api/v1/users/[id] — deactivate user from school */
async function _DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    if (member.role === 'OWNER') {
      return forbidden('Cannot delete school owner account')
    }

    // Primary contact deactivation guard (Doc 3.2): cannot delete/deactivate primary contact without nominating alternate
    let deleteBody: any = {}
    try {
      deleteBody = await req.json()
    } catch {}
    const searchParams = req.nextUrl.searchParams
    const alternateGuardianId =
      deleteBody.alternateGuardianId ||
      deleteBody.nominateAlternateId ||
      searchParams.get('alternateGuardianId') ||
      searchParams.get('nominateAlternateId')
    const alternateUserId =
      deleteBody.alternateUserId || searchParams.get('alternateUserId')
    const alternateGuardiansByStudent = deleteBody.alternateGuardiansByStudent

    const guardCheck = await PrimaryContactGuard.checkDeactivationSafety({
      tenantId: session.tenantId,
      userId: member.userId,
      targetStatus: 'INACTIVE',
      action: 'delete',
      alternateGuardianId,
      alternateUserId,
      nominateAlternateId: alternateGuardianId,
      alternateGuardiansByStudent,
    })

    if (!guardCheck.safe) {
      return fail(
        guardCheck.code || 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED',
        guardCheck.error || 'Cannot deactivate primary contact without nominating an alternate contact',
        409,
        undefined,
        { affectedStudents: guardCheck.affectedStudents }
      )
    }

    // Soft delete membership and sync user deactivation
    await db.$transaction(async (tx) => {
      if (guardCheck.transfers && guardCheck.transfers.length > 0) {
        await PrimaryContactGuard.applyTransfersTx(tx, guardCheck.transfers, {
          uid: session.uid,
          name: session.name,
          role: session.role,
          tenantId: session.tenantId,
        })
      }

      await tx.tenantUser.update({
        where: { id: member.id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      })
    })

    const otherActiveMemberships = await db.tenantUser.count({
      where: {
        userId: member.userId,
        id: { not: member.id },
        status: 'ACTIVE',
        deletedAt: null,
      },
    })

    const isPlatformAdmin = session.role === 'PLATFORM_ADMIN'
    const isGlobal = isPlatformAdmin || otherActiveMemberships === 0

    if (isGlobal) {
      await db.user.update({
        where: { id: member.userId },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        },
      })
      await SessionService.revokeAllUserSessions(member.userId)
    } else {
      await SessionService.revokeAllUserSessions(member.userId, undefined, session.tenantId)
    }
    PermissionCache.bumpUserVersion(member.userId)

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

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

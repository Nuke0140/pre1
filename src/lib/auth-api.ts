import { NextRequest } from 'next/server'
import { SessionPayload, can } from './auth'
import { ROLE_META, normalizeRole } from './roles'
import { getSession } from './auth-server'
import { Errors, forbidden, notFound, bad } from './api'
import { AuditService } from './audit/audit-service'
import { db } from './db'
import { UserRole } from '@prisma/client'
import { RbacEngine } from './auth/rbac-engine'

/**
 * Guard for API route handlers — returns session or returns an HTTP Error Response.
 * Automatically audits AUTHORIZATION_FAILED on unauthorized access attempts.
 */
export async function requireApi(
  req: NextRequest,
  permission?: string
): Promise<SessionPayload | Response> {
  const session = await getSession(req)
  if (!session) return Errors.unauthorized()

  if (session.tenantId) {
    const tenantExists = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { id: true } })
    if (!tenantExists) {
      return Errors.unauthorized('Invalid or expired session. Please log in again.')
    }
  }

  // Enforce mandatory password change (Phase 2) — non-parent roles only
  const isParentRole =
    session.role === 'PARENT' ||
    session.role === 'GUARDIAN' ||
    session.roles?.includes('PARENT') ||
    session.roles?.includes('GUARDIAN')

  if (!isParentRole && session.mustChangePassword) {
    const path = req.nextUrl?.pathname || ''
    const allowedPaths = ['/api/v1/auth/password', '/api/v1/auth/logout', '/api/v1/auth/me']
    if (!allowedPaths.some((p) => path.startsWith(p))) {
      return Errors.business(
        'PASSWORD_CHANGE_REQUIRED',
        'Mandatory password change required before accessing other features.',
        403
      )
    }
  }

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  let hasPermission = !permission || can(effectiveRoles, permission)
  if (!hasPermission && permission && session.tenantId) {
    const dynamicPerms = await RbacEngine.resolveEffectivePermissions({
      userId: session.uid,
      tenantId: session.tenantId,
      roles: effectiveRoles,
    })
    hasPermission =
      dynamicPerms.includes(permission) ||
      (dynamicPerms.includes('*') && !permission.startsWith('platform:'))
  }

  if (!hasPermission) {
    // Record security event for unauthorized attempt
    await AuditService.recordSecurityEvent({
      action: 'AUTHORIZATION_FAILED',
      entity: 'Permission',
      entityId: permission,
      module: 'AUTH',
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      tenantId: session.tenantId,
      summary: `Authorization denied for roles [${effectiveRoles.join(', ')}]: requires ${permission}`,
      severity: 'WARNING',
      req,
      details: {
        path: req.nextUrl.pathname,
        method: req.method,
        requiredPermission: permission,
        roles: effectiveRoles,
      },
    })

    return Errors.forbidden(`Missing permission: ${permission}`)
  }

  return session
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response
}

/**
 * Validates that the session belongs to an active tenant membership.
 */
export async function requireTenantMembership(
  session: SessionPayload,
  targetTenantId?: string
) {
  if (!session.tenantId) {
    return bad('Tenant identifier required', 'TENANT_REQUIRED')
  }
  if (targetTenantId && session.tenantId !== targetTenantId) {
    return forbidden('Cross-tenant access forbidden')
  }

  const membership = await db.tenantUser.findFirst({
    where: {
      userId: session.uid,
      tenantId: session.tenantId,
      deletedAt: null,
      status: 'ACTIVE',
    },
  })

  if (!membership && session.role !== 'PLATFORM_ADMIN') {
    return forbidden('Active tenant membership required')
  }

  return membership
}

/**
 * Resolves the list of authorized branch IDs for the session user.
 * - OWNER & PLATFORM_ADMIN: Returns 'ALL' (authorized for all branches within their tenant).
 * - PARENT & GUARDIAN: Returns the branches of their linked active children.
 * - Other roles (Admin, Principal, Staff, Teachers, etc.): Returns assigned branchId + multi-branch assignments (TenantUserBranch).
 */
export async function getAuthorizedBranchIds(
  session: SessionPayload
): Promise<string[] | 'ALL'> {
  if (!session.tenantId) {
    return []
  }

  const effectiveRoles =
    session.roles && session.roles.length > 0
      ? session.roles
      : session.role
      ? [session.role]
      : []

  const isOwnerOrPlatform = effectiveRoles.some(
    (r) => r === 'OWNER' || r === 'PLATFORM_ADMIN'
  )
  if (isOwnerOrPlatform) {
    return 'ALL'
  }

  const isParentOrGuardian = effectiveRoles.every(
    (r) => r === 'PARENT' || r === 'GUARDIAN'
  )
  if (isParentOrGuardian) {
    const guardian = await db.guardian.findFirst({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        OR: [{ userId: session.uid }, { id: session.uid }],
      },
      select: {
        studentLinks: {
          where: {
            student: {
              tenantId: session.tenantId,
              deletedAt: null,
            },
          },
          select: {
            student: {
              select: { branchId: true },
            },
          },
        },
      },
    })
    if (!guardian) return []
    const branches = Array.from(
      new Set(
        guardian.studentLinks
          .map((sl) => sl.student.branchId)
          .filter((b): b is string => Boolean(b))
      )
    )
    return branches
  }

  // Non-owner management/staff/teachers:
  const branches = new Set<string>()
  if (session.branchId) {
    branches.add(session.branchId)
  }

  const membership = await db.tenantUser.findFirst({
    where: {
      tenantId: session.tenantId,
      userId: session.uid,
      deletedAt: null,
    },
    select: {
      branchId: true,
      assignedBranches: {
        select: { branchId: true },
      },
    },
  })

  if (membership) {
    if (membership.branchId) branches.add(membership.branchId)
    for (const b of membership.assignedBranches) {
      if (b.branchId) branches.add(b.branchId)
    }
  }

  return Array.from(branches)
}

/**
 * Checks whether the session user is authorized to access or assign the target branch.
 */
export async function isBranchAuthorized(
  session: SessionPayload,
  targetBranchId?: string | null
): Promise<boolean> {
  if (!targetBranchId) return false
  if (!session.tenantId) return false

  const authorized = await getAuthorizedBranchIds(session)
  if (authorized === 'ALL') {
    const b = await db.branch.findFirst({
      where: { id: targetBranchId, tenantId: session.tenantId, deletedAt: null },
      select: { id: true },
    })
    return Boolean(b)
  }

  return authorized.includes(targetBranchId)
}

/**
 * Verifies that the actor has access to the target branch.
 * Owners and Platform Admins have institution-wide multi-campus access within their tenant.
 * All other roles (Principals, Admins, Teachers, Staff) are strictly branch-scoped.
 */
export async function requireBranchAccess(
  session: SessionPayload,
  targetBranchId?: string | null
): Promise<Response | null> {
  if (!targetBranchId) return null
  if (!session.tenantId) return forbidden('Tenant context required')

  const authorized = await isBranchAuthorized(session, targetBranchId)
  if (!authorized) {
    return forbidden('Access denied: branch scope restricted')
  }

  return null
}

/**
 * Verifies that the actor has the authority to manage the target user.
 * - Non-owners cannot edit or delete OWNER accounts.
 * - Non-owners cannot edit PRINCIPAL accounts.
 * - Parents and Guardians can ONLY manage their own identity and profile.
 * - Branch-scoped staff cannot manage users assigned to other branches.
 */
export async function requireCanManageUser(
  session: SessionPayload,
  targetUserId: string
) {
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const effectiveRoles =
    session.roles && session.roles.length > 0
      ? session.roles
      : session.role
      ? [session.role]
      : []

  const isParentOrGuardian = effectiveRoles.every(
    (r) => r === 'PARENT' || r === 'GUARDIAN'
  )
  if (isParentOrGuardian) {
    const isSelf = targetUserId === session.uid
    if (!isSelf) {
      const guardian = await db.guardian.findFirst({
        where: {
          id: targetUserId,
          userId: session.uid,
          tenantId: session.tenantId,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (!guardian) {
        return forbidden(
          'Access denied: parents and guardians may only access their own profile'
        )
      }
    }
  }

  const targetMember = await db.tenantUser.findFirst({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      OR: [{ userId: targetUserId }, { id: targetUserId }],
    },
    include: {
      staffProfile: true,
      user: true,
      assignedBranches: true,
    },
  })

  if (targetMember) {
    const isActorOwnerOrPlatform =
      session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

    // Non-owners cannot modify OWNER users
    if (targetMember.role === 'OWNER' && !isActorOwnerOrPlatform) {
      return forbidden('Only owners can modify owner accounts')
    }

    // Non-owners/principals cannot modify PRINCIPAL accounts
    if (
      targetMember.role === 'PRINCIPAL' &&
      !isActorOwnerOrPlatform &&
      session.role !== 'PRINCIPAL' &&
      !session.roles?.includes('PRINCIPAL')
    ) {
      return forbidden('You do not have permission to modify principal accounts')
    }

    // Branch boundary check
    if (!isActorOwnerOrPlatform) {
      const authorizedBranches = await getAuthorizedBranchIds(session)
      if (authorizedBranches === 'ALL') {
        // Allowed
      } else if (authorizedBranches.length === 0) {
        return forbidden('Access denied: branch scope restricted')
      } else {
        const targetBranchIds = new Set<string>()
        if (targetMember.branchId) targetBranchIds.add(targetMember.branchId)
        if (targetMember.assignedBranches) {
          for (const ab of targetMember.assignedBranches) {
            if (ab.branchId) targetBranchIds.add(ab.branchId)
          }
        }

        const hasOverlap = Array.from(targetBranchIds).some((bId) =>
          authorizedBranches.includes(bId)
        )
        if (!hasOverlap) {
          return forbidden('Cannot manage users belonging to another campus branch')
        }
      }
    }

    return { targetMember, targetGuardian: null }
  }

  // If no TenantUser found, resolve whether targetUserId corresponds to a Guardian in this tenant
  const targetGuardian = await db.guardian.findFirst({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      OR: [{ id: targetUserId }, { userId: targetUserId }],
    },
    include: {
      user: true,
      studentLinks: {
        where: {
          student: {
            tenantId: session.tenantId,
            deletedAt: null,
          },
        },
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
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  })

  if (!targetGuardian) {
    return notFound('User not found in this school')
  }

  // Branch boundary check for guardian (check if any linked student belongs to actor's authorized branches)
  const isActorOwnerOrPlatform =
    session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

  if (!isActorOwnerOrPlatform) {
    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches === 'ALL') {
      // Allowed
    } else if (authorizedBranches.length === 0) {
      return forbidden('Access denied: branch scope restricted')
    } else {
      const guardianBranchIds = targetGuardian.studentLinks
        .map((sl) => sl.student.branchId)
        .filter((b): b is string => Boolean(b))

      const hasBranchAccess = guardianBranchIds.some((bId) =>
        authorizedBranches.includes(bId)
      )
      if (!hasBranchAccess && guardianBranchIds.length > 0) {
        return forbidden('Cannot manage guardians belonging to another campus branch')
      }
    }
  }

  return { targetMember: null, targetGuardian }
}

/**
 * Validates role assignment to prevent privilege escalation.
 */
export function requireCanAssignRole(
  session: SessionPayload,
  targetRoles: UserRole[]
): Response | null {
  const isOwnerOrPlatform =
    session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

  const actorRole = normalizeRole(session.role)
  const actorLevel = ROLE_META[actorRole]?.hierarchyLevel ?? 0

  for (const r of targetRoles) {
    if (r === 'PLATFORM_ADMIN') {
      return forbidden('Cannot assign PLATFORM_ADMIN role')
    }
    if (r === 'OWNER' && !isOwnerOrPlatform) {
      return forbidden('Only owners can assign OWNER role')
    }
    if (
      r === 'PRINCIPAL' &&
      !isOwnerOrPlatform &&
      session.role !== 'PRINCIPAL'
    ) {
      return forbidden('Only owners and principals can assign PRINCIPAL role')
    }

    // General hierarchy: cannot assign a role with higher hierarchy than actor
    const targetNormalized = normalizeRole(r)
    const targetLevel = ROLE_META[targetNormalized]?.hierarchyLevel ?? 0
    if (!isOwnerOrPlatform && targetLevel >= actorLevel) {
      return forbidden(`Insufficient privileges to assign role: ${r}`)
    }
  }

  return null
}

/**
 * Verifies that a teacher has access to a specific classroom.
 */
export async function requireTeacherClassroomAccess(
  session: SessionPayload,
  classroomId: string
): Promise<boolean | Response> {
  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const isSupervisory = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
  )
  if (isSupervisory) return true

  if (!session.tenantId) return forbidden('Tenant context required')

  const classroom = await db.classroom.findFirst({
    where: {
      id: classroomId,
      tenantId: session.tenantId,
      primaryTeacherId: session.uid,
    },
  })

  if (!classroom) {
    return forbidden('Access denied: you are not assigned as educator to this classroom')
  }

  return true
}

/**
 * Verifies that a parent has access to a specific student.
 */
export async function requireGuardianChildAccess(
  session: SessionPayload,
  studentId: string
): Promise<boolean | Response> {
  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const isStaff = effectiveRoles.some((r) =>
    [
      'OWNER',
      'PRINCIPAL',
      'COORDINATOR',
      'TEACHER',
      'STAFF',
      'ACCOUNTS',
      'RECEPTIONIST',
      'ATTENDANT',
      'DRIVER',
      'PLATFORM_ADMIN',
    ].includes(normalizeRole(r))
  )
  if (isStaff) return true

  if (!session.tenantId) return forbidden('Tenant context required')

  const guardian = await db.guardian.findFirst({
    where: {
      userId: session.uid,
      tenantId: session.tenantId,
    },
    include: {
      studentLinks: {
        where: { studentId },
      },
    },
  })

  if (!guardian || guardian.studentLinks.length === 0) {
    return forbidden('Access denied: student is not linked to your guardian profile')
  }

  return true
}

/**
 * Validates authority and required justification for administrative overrides.
 */
export function requireCanOverride(
  session: SessionPayload,
  action: string,
  targetUserId: string,
  reason?: string
): Response | null {
  const canPerformOverride =
    session.role === 'OWNER' ||
    session.role === 'PRINCIPAL' ||
    session.role === 'PLATFORM_ADMIN'

  if (!canPerformOverride) {
    return forbidden('Administrative overrides require OWNER or PRINCIPAL authority')
  }

  if (!reason || reason.trim().length < 5) {
    return bad(
      'Override justification reason is mandatory and must be at least 5 characters',
      'OVERRIDE_REASON_REQUIRED'
    )
  }

  return null
}


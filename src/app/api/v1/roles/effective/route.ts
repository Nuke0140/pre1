import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { RbacEngine, CAPABILITY_CATALOG } from '@/lib/auth/rbac-engine'
import { ROLE_PERMISSIONS, Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'

/**
 * GET /api/v1/roles/effective?userId=...
 * Computes authoritative effective permissions for a user or role preview.
 * Requires 'users:read' permission and strictly respects tenant and branch boundaries.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const targetUserId = url.searchParams.get('userId')
  const proposedPrimaryRole = url.searchParams.get('primaryRole')
  const proposedAdditionalRolesRaw = url.searchParams.get('roles')
  const proposedCustomRoleIdsRaw = url.searchParams.get('customRoleIds')

  if (!targetUserId && !proposedPrimaryRole) {
    return bad('Either userId or primaryRole must be provided', 'INVALID_PARAMETERS')
  }

  let userRecord: any = null
  let memberRecord: any = null

  if (targetUserId) {
    const manageCheck = await requireCanManageUser(session, targetUserId)
    if (isResponse(manageCheck)) return manageCheck

    memberRecord = await db.tenantUser.findFirst({
      where: {
        tenantId: session.tenantId,
        userId: targetUserId,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        customRoles: {
          include: {
            customRole: {
              select: { id: true, name: true, code: true, capabilities: true, status: true },
            },
          },
        },
        assignedBranches: {
          include: {
            branch: { select: { id: true, name: true, code: true, isMain: true } },
          },
        },
      },
    })

    if (!memberRecord) {
      return notFound('User not found in this school')
    }
    userRecord = memberRecord.user
  }

  // Determine roles to evaluate
  const primaryRole = (proposedPrimaryRole || memberRecord?.role || 'STAFF') as Role
  const additionalRoles = proposedAdditionalRolesRaw
    ? proposedAdditionalRolesRaw.split(',').map((r) => r.trim()).filter(Boolean) as Role[]
    : (memberRecord?.roles || []).filter((r: Role) => r !== primaryRole)

  const combinedRoles = Array.from(new Set([primaryRole, ...additionalRoles]))

  // Custom roles
  let customRoleIds: string[] = []
  if (proposedCustomRoleIdsRaw !== null && proposedCustomRoleIdsRaw !== undefined) {
    customRoleIds = proposedCustomRoleIdsRaw.split(',').map((id) => id.trim()).filter(Boolean)
  } else if (memberRecord?.customRoles) {
    customRoleIds = memberRecord.customRoles
      .filter((cr: any) => cr.customRole && cr.customRole.status === 'ACTIVE')
      .map((cr: any) => cr.customRole.id)
  }

  // Fetch custom roles if any
  let customRolesList: any[] = []
  if (customRoleIds.length > 0) {
    customRolesList = await db.customRole.findMany({
      where: {
        id: { in: customRoleIds },
        tenantId: session.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, name: true, code: true, capabilities: true, parentRoleId: true },
    })
  }

  // Calculate permission breakdown with provenance
  const permissionSources: Record<string, string[]> = {}
  const allResolved = new Set<string>()

  // 1. Static permissions from primary and additional roles
  for (const role of combinedRoles) {
    const canonical = normalizeRole(role)
    const perms = ROLE_PERMISSIONS[role] || (ROLE_PERMISSIONS as Record<string, string[]>)[canonical] || []
    for (const p of perms) {
      allResolved.add(p)
      if (!permissionSources[p]) permissionSources[p] = []
      permissionSources[p].push(`Role: ${role}`)
    }
  }

  // 2. Custom role capabilities
  for (const cr of customRolesList) {
    for (const cap of cr.capabilities) {
      allResolved.add(cap)
      if (!permissionSources[cap]) permissionSources[cap] = []
      permissionSources[cap].push(`Custom Role: ${cr.name}`)
    }
    if (cr.parentRoleId) {
      const parent = await db.customRole.findUnique({
        where: { id: cr.parentRoleId },
        select: { name: true, capabilities: true },
      })
      if (parent) {
        for (const pCap of parent.capabilities) {
          allResolved.add(pCap)
          if (!permissionSources[pCap]) permissionSources[pCap] = []
          permissionSources[pCap].push(`Inherited from: ${parent.name}`)
        }
      }
    }
  }

  const isOwner = allResolved.has('*')
  const effectivePermissionsList = Array.from(allResolved)

  // Map to catalog categories
  const moduleBreakdown = CAPABILITY_CATALOG.map((cap) => {
    const granted = isOwner || allResolved.has(cap.id)
    return {
      id: cap.id,
      name: cap.name,
      category: cap.category,
      description: cap.description,
      granted,
      sources: isOwner ? ['Full System Authority (Owner)'] : permissionSources[cap.id] || [],
    }
  })

  return ok({
    userId: targetUserId || null,
    user: userRecord,
    evaluatedRoles: {
      primary: primaryRole,
      additional: additionalRoles,
      combined: combinedRoles,
    },
    evaluatedCustomRoles: customRolesList.map((c) => ({ id: c.id, name: c.name, code: c.code })),
    isFullAccess: isOwner,
    totalGranted: isOwner ? CAPABILITY_CATALOG.length : effectivePermissionsList.length,
    effectivePermissions: effectivePermissionsList,
    moduleBreakdown,
  })
}

export const GET = withApi(_GET)

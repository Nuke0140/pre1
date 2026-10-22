import type { SessionPayload, Role } from '@/lib/auth'

export interface ScopedResource {
  tenantId: string
  branchId?: string | null
}

const INSTITUTION_WIDE_ROLES: Role[] = ['OWNER', 'PLATFORM_ADMIN']

export interface ScopeActor {
  tenantId: string | null
  branchId?: string | null
  role?: Role
  roles?: Role[]
}

export function getActorRoles(actor: ScopeActor): Role[] {
  if (actor.roles && actor.roles.length > 0) return actor.roles
  if (actor.role) return [actor.role]
  return []
}

export function isActorInstitutionWide(actor: ScopeActor): boolean {
  const roles = getActorRoles(actor)
  return roles.some((role) => INSTITUTION_WIDE_ROLES.includes(role))
}

/**
 * Canonical object-level security helpers.
 *
 * Order enforced by callers:
 *   session -> tenant -> branch -> object ownership -> permission -> operation
 *
 * Tenant is mandatory. Branch is enforced for branch-scoped roles.
 * Object-specific ownership (parent child, teacher classroom, etc.) remains
 * the responsibility of the domain/service layer.
 */
export function isInstitutionWide(session: SessionPayload): boolean {
  const roles = session.roles && session.roles.length > 0 ? session.roles : (session.role ? [session.role] : [])
  return roles.some((role) => INSTITUTION_WIDE_ROLES.includes(role))
}

export function tenantScopedWhere<T extends Record<string, unknown>>(
  field: string,
  id: string,
  tenantId: string,
  extra?: T
) {
  return {
    ...extra,
    [field]: id,
    tenantId,
  }
}

export function tenantScopedIdWhere<T extends Record<string, unknown>>(
  id: string,
  tenantId: string,
  extra?: T
) {
  return tenantScopedWhere('id', id, tenantId, extra)
}

export function assertTenantScope(session: { tenantId?: string | null }, resource: ScopedResource): void {
  if (!session.tenantId) {
    throw new Error('Tenant context is required')
  }

  if (resource.tenantId !== session.tenantId) {
    throw new Error('Unauthorized: cross-tenant resource access')
  }
}

export function assertBranchScope(
  session: SessionPayload,
  resourceBranchId?: string | null
): void {
  // If the resource is not bound to a specific branch, or actor has institution-wide privileges
  if (!resourceBranchId || isInstitutionWide(session)) return

  // Branch-scoped role attempting to access a branch-bound resource:
  const allowed = new Set<string>()
  if (session.branchId) allowed.add(session.branchId)
  if ((session as any).assignedBranchIds) {
    for (const b of (session as any).assignedBranchIds) if (b) allowed.add(b)
  }
  if ((session as any).assignedBranches) {
    for (const b of (session as any).assignedBranches) {
      if (typeof b === 'string') allowed.add(b)
      else if (b && b.branchId) allowed.add(b.branchId)
    }
  }

  // Missing branch assignment on the actor is an explicit DENY (fail-closed, not default-allow)
  if (allowed.size === 0) {
    throw new Error('Unauthorized: branch-scoped actor missing branch assignment')
  }

  if (!allowed.has(resourceBranchId)) {
    throw new Error('Unauthorized: resource belongs to another branch')
  }
}

export function assertActorResourceScope(
  actor: ScopeActor,
  resource: ScopedResource
): void {
  if (!actor.tenantId) throw new Error('Tenant context is required')
  if (resource.tenantId !== actor.tenantId) {
    throw new Error('Unauthorized: cross-tenant resource access')
  }
  if (!resource.branchId || isActorInstitutionWide(actor)) return

  // Branch-scoped actor attempting to access branch-bound resource
  const allowed = new Set<string>()
  if (actor.branchId) allowed.add(actor.branchId)
  if ((actor as any).assignedBranchIds) {
    for (const b of (actor as any).assignedBranchIds) if (b) allowed.add(b)
  }
  if ((actor as any).assignedBranches) {
    for (const b of (actor as any).assignedBranches) {
      if (typeof b === 'string') allowed.add(b)
      else if (b && b.branchId) allowed.add(b.branchId)
    }
  }

  if (allowed.size === 0) {
    throw new Error('Unauthorized: branch-scoped actor missing branch assignment')
  }

  if (!allowed.has(resource.branchId)) {
    throw new Error('Unauthorized: resource belongs to another branch')
  }
}

/**
 * Combined tenant + branch boundary for an already-loaded resource.
 * Use this before ownership checks and before mutations.
 */
export function assertResourceScope(
  session: SessionPayload,
  resource: ScopedResource
): void {
  assertTenantScope(session, resource)
  assertBranchScope(session, resource.branchId)
}

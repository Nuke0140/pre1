import type { SessionPayload, Role } from '@/lib/auth'

export interface ScopedResource {
  tenantId: string
  branchId?: string | null
}

const INSTITUTION_WIDE_ROLES: Role[] = ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN']

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
  // Missing branch assignment on the actor is an explicit DENY (fail-closed, not default-allow)
  if (!session.branchId) {
    throw new Error('Unauthorized: branch-scoped actor missing branch assignment')
  }

  if (session.branchId !== resourceBranchId) {
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
  if (!actor.branchId) {
    throw new Error('Unauthorized: branch-scoped actor missing branch assignment')
  }

  if (actor.branchId !== resource.branchId) {
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

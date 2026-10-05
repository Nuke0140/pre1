import type { SessionPayload, Role } from '@/lib/auth'

export interface ScopedResource {
  tenantId: string
  branchId?: string | null
}

const INSTITUTION_WIDE_ROLES: Role[] = ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN']

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
  const roles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
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

export interface ScopeActor {
  tenantId: string | null
  branchId?: string | null
  role: Role
}

export function assertActorResourceScope(
  actor: ScopeActor,
  resource: ScopedResource
): void {
  if (!actor.tenantId) throw new Error('Tenant context is required')
  if (resource.tenantId !== actor.tenantId) {
    throw new Error('Unauthorized: cross-tenant resource access')
  }
  if (!resource.branchId || isInstitutionWide({ ...actor, uid: '', email: '', name: '' } as SessionPayload)) return
  if (actor.branchId && actor.branchId !== resource.branchId) {
    throw new Error('Unauthorized: resource belongs to another branch')
  }
}

export function assertTenantScope(session: SessionPayload, resource: ScopedResource): void {
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
  if (!resourceBranchId || isInstitutionWide(session)) return

  if (session.branchId && session.branchId !== resourceBranchId) {
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

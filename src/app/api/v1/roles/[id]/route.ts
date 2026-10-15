import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { CustomRoleService } from '@/lib/auth/rbac-engine'

/**
 * GET /api/v1/roles/[id]
 * Retrieves full custom role details with capabilities and assigned school members.
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const role = await CustomRoleService.getRole(id, session.tenantId)
    if (!role) {
      return notFound('Custom role not found in this school')
    }

    return ok(role)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * PATCH /api/v1/roles/[id]
 * Updates custom dynamic role name, description, capabilities, or parent hierarchy.
 */
async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const { name, description, capabilities, parentRoleId, status } = body as {
      name?: string
      description?: string
      capabilities?: string[]
      parentRoleId?: string | null
      status?: string
    }

    const updated = await CustomRoleService.updateRole({
      id,
      tenantId: session.tenantId,
      name,
      description,
      capabilities,
      parentRoleId,
      status,
      actorSession: session,
      req,
    })

    return ok(updated)
  } catch (err: any) {
    if (err.code === 'INVALID_CAPABILITIES') {
      return bad(err.message, 'INVALID_CAPABILITIES')
    }
    return bad(err.message, 'ROLE_UPDATE_FAILED')
  }
}

/**
 * DELETE /api/v1/roles/[id]
 * Soft-deletes a custom dynamic role and disassociates assignments.
 */
async function _DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:delete')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const force = url.searchParams.get('force') === 'true'

  try {
    const result = await CustomRoleService.deleteRole({
      id,
      tenantId: session.tenantId,
      force,
      actorSession: session,
      req,
    })

    return ok(result)
  } catch (err: any) {
    if (err.code === 'ROLE_HAS_ASSIGNED_USERS') {
      return bad(err.message, 'ROLE_HAS_ASSIGNED_USERS')
    }
    return bad(err.message, 'ROLE_DELETION_FAILED')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

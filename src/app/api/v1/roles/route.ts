import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, conflict, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { CustomRoleService } from '@/lib/auth/rbac-engine'

/**
 * GET /api/v1/roles
 * Lists custom dynamic roles for the current school tenant.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'ACTIVE'
  const query = url.searchParams.get('q') || ''

  try {
    const roles = await CustomRoleService.listRoles(session.tenantId, {
      status,
      query,
    })

    return ok(roles)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/roles
 * Creates a new custom dynamic role with defined capabilities and optional parent inheritance.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const { name, code, description, capabilities, parentRoleId } = body as {
      name?: string
      code?: string
      description?: string
      capabilities?: string[]
      parentRoleId?: string | null
    }

    if (!name || name.trim().length < 2) {
      return bad('Role name is required and must be at least 2 characters', 'NAME_REQUIRED')
    }

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return bad('At least one capability is required for a custom role', 'CAPABILITIES_REQUIRED')
    }

    const created = await CustomRoleService.createRole({
      tenantId: session.tenantId,
      name: name.trim(),
      code: code?.trim(),
      description: description?.trim(),
      capabilities,
      parentRoleId: parentRoleId || null,
      actorSession: session,
      req,
    })

    return ok(created)
  } catch (err: any) {
    if (err.code === 'ROLE_CODE_CONFLICT') {
      return conflict(err.message)
    }
    if (err.code === 'INVALID_CAPABILITIES') {
      return bad(err.message, 'INVALID_CAPABILITIES')
    }
    return bad(err.message, 'ROLE_CREATION_FAILED')
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

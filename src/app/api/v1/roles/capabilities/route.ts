import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { CAPABILITY_CATALOG } from '@/lib/auth/rbac-engine'

/**
 * GET /api/v1/roles/capabilities
 * Returns the authoritative capability catalog grouped by functional module (ADR-063).
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  // Group capabilities by category
  const categories: Record<string, typeof CAPABILITY_CATALOG> = {}
  for (const cap of CAPABILITY_CATALOG) {
    if (!categories[cap.category]) {
      categories[cap.category] = []
    }
    categories[cap.category].push(cap)
  }

  return ok({
    totalCount: CAPABILITY_CATALOG.length,
    capabilities: CAPABILITY_CATALOG,
    categories,
  })
}

export const GET = withApi(_GET)

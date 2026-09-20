import { NextRequest } from 'next/server'
import { ok, withApi, errPermission, errValidation } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { RouteStatus } from '@prisma/client'

/**
 * GET /api/v1/transport/routes — List configured routes with stops and assignments
 * POST /api/v1/transport/routes — Create new route with stops
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const sp = req.nextUrl.searchParams
  const status = (sp.get('status') as RouteStatus) || undefined
  const branchId = sp.get('branchId') || undefined

  const routes = await TransportService.listRoutes(
    {
      tenantId: session.tenantId,
      branchId: session.branchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    },
    { status, branchId }
  )
  return ok(routes)
}, { module: 'transport' })

export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'transport:write')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const body = await req.json()
  const { code, name, description, vehicleId, driverProfileId, attendantProfileId, branchId, stops } = body

  if (!code || !name) {
    throw errValidation('code and name are required', !code ? 'code' : 'name')
  }

  const route = await TransportService.createRoute(
    {
      tenantId: session.tenantId,
      branchId: session.branchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    },
    {
      code,
      name,
      description,
      vehicleId,
      driverProfileId,
      attendantProfileId,
      branchId,
      stops,
    }
  )
  return ok(route, undefined, 201)
}, { module: 'transport' })

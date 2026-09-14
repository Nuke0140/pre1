import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { RouteStatus } from '@prisma/client'

/**
 * GET /api/v1/transport/routes â€” List configured routes with stops and assignments
 * POST /api/v1/transport/routes â€” Create new route with stops
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
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
  } catch (e: any) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'transport:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const body = await req.json()
    const { code, name, description, vehicleId, driverProfileId, attendantProfileId, branchId, stops } = body

    if (!code || !name) {
      return bad('code and name are required')
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
  } catch (e: any) {
    return bad(e.message)
  }
}

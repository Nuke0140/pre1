import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { VehicleStatus } from '@prisma/client'

/**
 * GET /api/v1/transport/vehicles â€” List vehicles in fleet
 * POST /api/v1/transport/vehicles â€” Register new vehicle
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const sp = req.nextUrl.searchParams
    const status = (sp.get('status') as VehicleStatus) || undefined
    const search = sp.get('search') || undefined
    const branchId = sp.get('branchId') || undefined

    const vehicles = await TransportService.listVehicles(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      { status, search, branchId }
    )
    return ok(vehicles)
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
    const { registrationNumber, vehicleType, capacity, makeModel, notes, branchId } = body

    if (!registrationNumber || !capacity) {
      return bad('registrationNumber and capacity are required')
    }

    const vehicle = await TransportService.createVehicle(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        registrationNumber,
        vehicleType,
        capacity: Number(capacity),
        makeModel,
        notes,
        branchId,
      }
    )
    return ok(vehicle, undefined, 201)
  } catch (e: any) {
    return bad(e.message)
  }
}

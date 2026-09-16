import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { db } from '@/lib/db'
import { TripStatus } from '@prisma/client'

/**
 * GET /api/v1/transport/trips â€” List trips for a given date / route
 * POST /api/v1/transport/trips â€” Start or schedule an operational trip
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const sp = req.nextUrl.searchParams
    const dateStr = sp.get('date')
    const routeId = sp.get('routeId') || undefined
    const status = (sp.get('status') as TripStatus) || undefined

    const dateObj = dateStr ? new Date(dateStr) : new Date()
    dateObj.setHours(0, 0, 0, 0)
    const nextDate = new Date(dateObj)
    nextDate.setDate(nextDate.getDate() + 1)

    const trips = await db.transportTrip.findMany({
      where: {
        tenantId: session.tenantId,
        ...(session.branchId ? { branchId: session.branchId } : {}),
        tripDate: { gte: dateObj, lt: nextDate },
        ...(routeId ? { routeId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        route: { select: { id: true, code: true, name: true } },
        vehicle: true,
        driverProfile: { include: { user: { select: { id: true, fullName: true, phone: true } } } },
        attendantProfile: { include: { user: { select: { id: true, fullName: true, phone: true } } } },
        manifest: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNo: true,
                photoUrl: true,
                guardians: {
                  select: {
                    id: true,
                    relationship: true,
                    isPrimary: true,
                    canPickup: true,
                    guardian: {
                      select: { id: true, fullName: true, phone: true, relationship: true, userId: true },
                    },
                  },
                },
              },
            },
            stop: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(trips)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'transport:trip')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const body = await req.json()
    const { routeId, tripDate, tripType, vehicleId, driverProfileId, attendantProfileId } = body

    if (!routeId || !tripType) {
      return bad('routeId and tripType (MORNING or EVENING) are required')
    }

    const trip = await TransportService.startTrip(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        routeId,
        tripDate: tripDate ? new Date(tripDate) : new Date(),
        tripType,
        vehicleId,
        driverProfileId,
        attendantProfileId,
      }
    )

    return ok(trip, undefined, 201)
  } catch (e: any) {
    return bad(e.message)
  }
}

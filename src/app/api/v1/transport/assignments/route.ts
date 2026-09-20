import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { TransportAssignmentStatus } from '@prisma/client'

/**
 * GET /api/v1/transport/assignments â€” List student transport assignments
 * POST /api/v1/transport/assignments â€” Assign a student to route & stops
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const sp = req.nextUrl.searchParams
    const routeId = sp.get('routeId') || undefined
    const studentId = sp.get('studentId') || undefined
    const status = (sp.get('status') as TransportAssignmentStatus) || undefined
    const branchId = sp.get('branchId') || undefined

    const assignments = await TransportService.listAssignments(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      { routeId, studentId, status, branchId }
    )
    return ok(assignments)
  } catch (e: any) {
    return Errors.system(e)
  }
}

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'transport:assign')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const body = await req.json()
    const {
      studentId,
      routeId,
      pickupStopId,
      dropStopId,
      tripType,
      startDate,
      endDate,
      monthlyFeeCents,
      generateFeeInvoice,
    } = body

    if (!studentId || !routeId || !pickupStopId || !dropStopId) {
      return bad('studentId, routeId, pickupStopId, and dropStopId are required')
    }

    const assignment = await TransportService.assignStudent(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        studentId,
        routeId,
        pickupStopId,
        dropStopId,
        tripType,
        startDate,
        endDate,
        monthlyFeeCents: monthlyFeeCents ? Number(monthlyFeeCents) : 0,
        generateFeeInvoice: Boolean(generateFeeInvoice),
      }
    )
    return ok(assignment, undefined, 201)
  } catch (e: any) {
    return bad(e.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

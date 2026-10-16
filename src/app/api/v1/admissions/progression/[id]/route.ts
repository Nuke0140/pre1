import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionProgressionService } from '@/lib/admissions/progression-service'

/**
 * GET /api/v1/admissions/progression/[id]
 * Evaluates the 1-click progression eligibility for an admission lead or application.
 * Returns currentStage, nextStage, isEligible, missingFields, blockedReasons, and authoritative payment status.
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id: recordId } = await params
  if (!recordId) return Errors.badRequest('recordId parameter is required')

  const sp = req.nextUrl.searchParams
  const branchId = sp.get('branchId') || session.branchId || ''
  const academicYearId = sp.get('academicYearId') || sp.get('academicSessionId') || ''

  const ctx = {
    tenantId: session.tenantId,
    branchId,
    academicYearId,
    actorId: session.uid,
    actorName: session.name,
    actorRole: session.role,
  }

  try {
    const evaluation = await AdmissionProgressionService.evaluateProgression(ctx, recordId)
    return ok(evaluation)
  } catch (err: any) {
    if (err.message && err.message.includes('not found in this tenant')) {
      return fail('NOT_FOUND_001', err.message, 404)
    }
    return fail('BAD_REQUEST', err.message || 'Failed to evaluate progression eligibility', 400)
  }
}

/**
 * POST /api/v1/admissions/progression/[id]
 * Executes the 1-click stage promotion:
 *   Enquiry -> Application -> Offer -> Fee Received -> Enrolled Student
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id: recordId } = await params
  if (!recordId) return Errors.badRequest('recordId parameter is required')

  const body = await req.json().catch(() => ({}))

  const ctx = {
    tenantId: session.tenantId,
    branchId: body.branchId || session.branchId || '',
    academicYearId: body.academicYearId || body.academicSessionId || '',
    actorId: session.uid,
    actorName: session.name,
    actorRole: session.role,
  }

  try {
    const result = await AdmissionProgressionService.promoteNextStage(ctx, recordId, {
      classroomId: body.classroomId,
      seatNumber: body.seatNumber,
      academicSessionId: body.academicSessionId,
      validityDays: body.validityDays,
      terms: body.terms,
      feePlanId: body.feePlanId,
      notes: body.notes,
      forceFeeReceived: Boolean(body.forceFeeReceived),
      offlinePayment: body.offlinePayment,
    })

    return ok(result, undefined, 201)
  } catch (err: any) {
    if (err.message && err.message.includes('not found in this tenant')) {
      return fail('NOT_FOUND_001', err.message, 404)
    }
    return fail('PROMOTION_FAILED', err.message || 'Failed to promote admission record', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

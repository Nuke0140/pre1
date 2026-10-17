import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { WelcomeKitService } from '@/lib/inventory/welcome-kit-service'

/**
 * GET /api/v1/inventory/welcome-kits/eligibility
 * Checks student eligibility, active status, branch match, and previous kit issuances.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const branchId = searchParams.get('branchId') || session.branchId || undefined

    if (!studentId) {
      return Errors.badRequest('Student ID is required to check welcome kit eligibility.')
    }

    const eligibility = await WelcomeKitService.checkStudentEligibility(
      session.tenantId,
      studentId,
      branchId
    )

    return ok(eligibility)
  } catch (err: any) {
    return bad(err.message, 'STUDENT_ELIGIBILITY_CHECK_FAILED')
  }
}

export const GET = withApi(_GET)

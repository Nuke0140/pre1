import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { StudentService } from '@/lib/students/student-service'

/**
 * GET /api/v1/students/dashboard — Student directory dashboard statistics
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'students:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const requestedBranchId = searchParams.get('branchId') || undefined
    const academicSessionId = searchParams.get('academicSessionId') || undefined

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const authorizedBranches = await getAuthorizedBranchIds(session)
    if (authorizedBranches !== 'ALL' && authorizedBranches.length === 0) {
      return ok({
        totalEnrolled: 0,
        activeStudents: 0,
        unassignedStudents: 0,
        withdrawnStudents: 0,
        programBreakdown: {},
        genderDistribution: {},
      })
    }

    const branchIds = requestedBranchId
      ? undefined
      : authorizedBranches === 'ALL'
      ? undefined
      : authorizedBranches

    const stats = await StudentService.getStudentDashboardStats(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        academicSessionId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        assignedBranchIds: authorizedBranches === 'ALL' ? undefined : authorizedBranches,
      },
      { branchId: requestedBranchId, branchIds, academicSessionId }
    )

    return ok(stats)
  } catch (e: any) {
    return Errors.business('DASHBOARD_STATS_FAILED', e.message || 'Failed to calculate student dashboard statistics', 500)
  }
}

export const GET = withApi(_GET)

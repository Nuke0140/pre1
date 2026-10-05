import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AppraisalService } from '@/lib/hr/appraisal-service'
import { AppraisalStatus } from '@prisma/client'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const statsOnly = sp.get('stats') === 'true'

    if (statsOnly) {
      const dashboardStats = await AppraisalService.getDashboardStats(session.tenantId)
      return ok(dashboardStats)
    }

    const employeeId = sp.get('employeeId') || undefined
    const status = (sp.get('status') as AppraisalStatus) || undefined
    const reviewPeriod = sp.get('reviewPeriod') || undefined
    const reviewerId = sp.get('reviewerId') || undefined

    const appraisals = await AppraisalService.listAppraisals(session.tenantId, {
      employeeId,
      status,
      reviewPeriod,
      reviewerId,
    })

    return ok(appraisals)
  } catch (e: any) {
    return Errors.system(e)
  }
}

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      employeeId,
      reviewPeriod,
      reviewStartDate,
      reviewEndDate,
      appraisalDate,
      reviewerId,
      rating,
      performanceStatus,
      strengths,
      areasForImprovement,
      goals,
      achievements,
      reviewerComments,
      employeeComments,
      increaseType,
      increasePercentage,
      increaseAmount,
      effectiveDate,
    } = body

    if (!employeeId || !reviewPeriod || !reviewerId) {
      return Errors.validation('employeeId, reviewPeriod, and reviewerId are required')
    }

    const newAppraisal = await AppraisalService.createAppraisal(session.tenantId, {
      employeeId,
      reviewPeriod,
      reviewStartDate,
      reviewEndDate,
      appraisalDate,
      reviewerId,
      rating,
      performanceStatus,
      strengths,
      areasForImprovement,
      goals,
      achievements,
      reviewerComments,
      employeeComments,
      increaseType,
      increasePercentage,
      increaseAmount,
      effectiveDate,
      actorUserId: session.id,
    })

    return ok(newAppraisal)
  } catch (e: any) {
    return Errors.badRequest(e.message || 'Failed to create appraisal')
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

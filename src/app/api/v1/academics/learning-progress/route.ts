import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AcademicService } from '@/lib/academics/academic-service'

/**
 * GET /api/v1/academics/learning-progress?studentId=...&activityIds=...
 * Retrieve student learning progress for activities
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'academics:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const activityIdsParam = searchParams.get('activityIds')

  if (!studentId) {
    return Errors.validation('studentId is required')
  }

  const activityIds = activityIdsParam ? activityIdsParam.split(',').filter(Boolean) : undefined

  try {
    const records = await AcademicService.getActivityProgress(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      studentId,
      activityIds
    )

    return ok(records)
  } catch (e: any) {
    if (e.message?.includes('Unauthorized')) {
      return Errors.forbidden(e.message)
    }
    return Errors.business('PROGRESS_FETCH_FAILED', e.message || 'Failed to fetch progress', 400)
  }
}

/**
 * POST /api/v1/academics/learning-progress
 * Record or update student progress on a learning activity (Courses, Poems, Stories)
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { activityId, studentId, playbackPositionSecs, progressPercentage, status } = body

    if (!activityId || !studentId) {
      return Errors.validation('activityId and studentId are required')
    }

    const progress = await AcademicService.recordActivityProgress(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        activityId,
        studentId,
        playbackPositionSecs,
        progressPercentage,
        status,
      }
    )

    return ok(progress)
  } catch (e: any) {
    if (e.message?.includes('Unauthorized')) {
      return Errors.forbidden(e.message)
    }
    return Errors.business('PROGRESS_UPDATE_FAILED', e.message || 'Failed to record progress', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

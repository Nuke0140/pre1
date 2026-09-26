import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id: activityId } = await params
  if (!activityId) {
    return Errors.badRequest('Activity ID is required')
  }

  try {
    const body = await req.json()
    const { status, notes, title, startTime, endTime } = body

    const updated = await DailyDiaryService.updateActivity(session, activityId, {
      status,
      notes,
      title,
      startTime,
      endTime,
    })

    return ok(updated)
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
      return Errors.forbidden(err.message)
    }
    return Errors.badRequest(err.message || 'Failed to update activity')
  }
}

export const PATCH = withApi(_PATCH)

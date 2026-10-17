import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'
import { isoDate } from '@/lib/format'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'attendance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { searchParams } = new URL(req.url)
  const classroomId = searchParams.get('classroomId')
  const targetDate = searchParams.get('targetDate') || isoDate()

  if (!classroomId) {
    return Errors.badRequest('classroomId is required')
  }

  try {
    const routine = await DailyDiaryService.getPreviousDayRoutine(session, classroomId, targetDate)
    return ok(routine)
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
      return Errors.forbidden(err.message)
    }
    return Errors.badRequest(err.message || 'Failed to fetch previous routine')
  }
}

export const GET = withApi(_GET)

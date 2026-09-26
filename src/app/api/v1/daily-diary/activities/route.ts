import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'
import { isoDate } from '@/lib/format'

async function _POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.tenantId) return Errors.unauthorized('Session required')

  try {
    const body = await req.json()
    const { classroomId, date, title, activityType, startTime, endTime, teacherId, description } = body

    if (!classroomId || !title) {
      return Errors.badRequest('classroomId and title are required')
    }

    const dateStr = date || isoDate()
    const activity = await DailyDiaryService.createActivity(session, {
      classroomId,
      dateStr,
      title,
      activityType,
      startTime,
      endTime,
      teacherId,
      description,
    })

    return ok(activity)
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to create daily activity')
  }
}

export const POST = withApi(_POST)

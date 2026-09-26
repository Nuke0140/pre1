import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'
import { isoDate } from '@/lib/format'

async function _GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.tenantId) return Errors.unauthorized('Session required')

  const { searchParams } = new URL(req.url)
  const classroomId = searchParams.get('classroomId')
  const startDate = searchParams.get('startDate') || isoDate()
  const endDate = searchParams.get('endDate') || isoDate()
  const studentId = searchParams.get('studentId') || undefined

  if (!classroomId) {
    return Errors.badRequest('classroomId is required')
  }

  try {
    const history = await DailyDiaryService.getHistory(session, classroomId, startDate, endDate, studentId)
    return ok(history)
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to fetch history')
  }
}

export const GET = withApi(_GET)

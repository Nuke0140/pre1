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
  const dateStr = searchParams.get('date') || isoDate()

  if (!classroomId) {
    return Errors.badRequest('classroomId is required')
  }

  try {
    const overview = await DailyDiaryService.getOverview(session, classroomId, dateStr)
    return ok(overview)
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to fetch overview')
  }
}

export const GET = withApi(_GET)

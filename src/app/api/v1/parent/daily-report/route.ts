import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'
import { isoDate } from '@/lib/format'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId') || searchParams.get('studentId')
  const dateStr = searchParams.get('date') || isoDate()

  if (!childId) {
    return Errors.badRequest('childId is required')
  }

  try {
    const reportData = await DailyDiaryService.getParentDailyReport(session, childId, dateStr)
    return ok(reportData)
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN_GUARDIAN_ACCESS') || err.message?.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
      return Errors.forbidden(err.message)
    }
    return Errors.badRequest(err.message || 'Failed to retrieve daily report')
  }
}

export const GET = withApi(_GET)

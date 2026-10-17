import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { classroomId, dateStr, studentIds, summaryOverrides } = body

    if (!classroomId || !dateStr) {
      return Errors.badRequest('classroomId and dateStr are required')
    }

    const result = await DailyDiaryService.publishDailyReports(session, {
      classroomId,
      dateStr,
      studentIds,
      summaryOverrides,
    })
    return ok(result)
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
      return Errors.forbidden(err.message)
    }
    return Errors.badRequest(err.message || 'Failed to publish daily reports')
  }
}

export const POST = withApi(_POST)

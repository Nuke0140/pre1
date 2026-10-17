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
    const { classroomId, studentId, dateStr, summaryText } = body

    if (!classroomId || !studentId || !dateStr) {
      return Errors.badRequest('classroomId, studentId, and dateStr are required')
    }

    const updated = await DailyDiaryService.updateReportDraft(session, {
      classroomId,
      studentId,
      dateStr,
      summaryText: summaryText || '',
    })
    return ok(updated)
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
      return Errors.forbidden(err.message)
    }
    return Errors.badRequest(err.message || 'Failed to update report draft')
  }
}

export const POST = withApi(_POST)

import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

async function _POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.tenantId) return Errors.unauthorized('Session required')

  try {
    const body = await req.json()
    const { studentId, classroomId, narrative, category, concern, activityId } = body

    if (!studentId || !classroomId || !narrative) {
      return Errors.badRequest('studentId, classroomId, and narrative are required')
    }

    const obs = await DailyDiaryService.createObservation(session, {
      studentId,
      classroomId,
      narrative,
      category,
      concern,
      activityId,
    })

    return ok(obs)
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to create observation')
  }
}

export const POST = withApi(_POST)

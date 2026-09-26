import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

async function _GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.tenantId) return Errors.unauthorized('Session required')

  try {
    const context = await DailyDiaryService.getContext(session)
    return ok(context)
  } catch (err: any) {
    return Errors.internal(err.message || 'Failed to fetch Daily Diary context')
  }
}

export const GET = withApi(_GET)

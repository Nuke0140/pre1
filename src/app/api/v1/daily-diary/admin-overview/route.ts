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
  const dateStr = searchParams.get('date') || isoDate()
  const branchId = searchParams.get('branchId') || undefined

  try {
    const data = await DailyDiaryService.getAdminSchoolOverview(session, dateStr, branchId)
    return ok(data)
  } catch (err: any) {
    return Errors.internal(err.message || 'Failed to fetch admin school overview')
  }
}

export const GET = withApi(_GET)

import { NextRequest } from 'next/server'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { MyHrService } from '@/lib/hr/my-hr-service'

export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const monthStr = req.nextUrl.searchParams.get('month')
  const yearStr = req.nextUrl.searchParams.get('year')
  const month = monthStr ? parseInt(monthStr, 10) : undefined
  const year = yearStr ? parseInt(yearStr, 10) : undefined

  const attendance = await MyHrService.getMyAttendance(session.tenantId, session.userId, month, year)
  return ok(attendance)
})

import { NextRequest } from 'next/server'
import { ok, withApi, errPermission, errBadRequest } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { MyHrService } from '@/lib/hr/my-hr-service'

export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const leaveData = await MyHrService.getMyLeave(session.tenantId, session.userId)
  return ok(leaveData)
})

export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const body = await req.json()
  if (!body.leaveTypeId || !body.startDate || !body.endDate || !body.reason) {
    throw errBadRequest('leaveTypeId, startDate, endDate, and reason are required')
  }

  const result = await MyHrService.applyMyLeave(session.tenantId, session.userId, body)
  return ok(result, { status: 201 })
})

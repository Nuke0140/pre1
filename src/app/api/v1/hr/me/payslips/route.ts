import { NextRequest } from 'next/server'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { MyHrService } from '@/lib/hr/my-hr-service'

export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const payslips = await MyHrService.getMyPayslips(session.tenantId, session.userId)
  return ok(payslips)
})

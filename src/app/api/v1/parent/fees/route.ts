import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const childrenFees = await FeeService.getParentChildrenFees(session.tenantId, session.uid)
    return ok(childrenFees)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

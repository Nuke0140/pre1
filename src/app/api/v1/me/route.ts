import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'

export const GET = withApi(async (req: NextRequest) => {
  const session = await getSession(req)
  if (!session) return Errors.unauthorized()
  return ok({
    userId: session.uid,
    name: session.name,
    email: session.email,
    role: session.role,
    tenantId: session.tenantId,
    branchId: session.branchId,
  })
}, { module: 'auth' })

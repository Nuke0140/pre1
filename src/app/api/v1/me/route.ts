import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return Errors.unauthorized()
  return ok({
    userId: session.uid,
    name: session.name,
    email: session.email,
    role: session.role,
    tenantId: session.tenantId,
    branchId: session.branchId,
  })
}

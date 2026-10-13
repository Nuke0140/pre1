import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { ok, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { db } from '@/lib/db'

export const GET = withApi(async (req: NextRequest) => {
  const session = await getSession(req)
  if (!session) return Errors.unauthorized()

  if (session.tenantId) {
    const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { id: true } })
    if (!tenant) return Errors.unauthorized('Tenant session invalid or expired')
  }

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]

  return ok({
    userId: session.uid,
    name: session.name,
    email: session.email,
    role: session.role,
    roles: effectiveRoles,
    tenantId: session.tenantId,
    branchId: session.branchId,
  })
}, { module: 'auth' })

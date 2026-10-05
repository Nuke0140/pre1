import { NextRequest } from 'next/server'
import { ok, withApi, errPermission, errBadRequest } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SalaryComponentService } from '@/lib/hr/salary-component-service'

export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const components = await SalaryComponentService.getSalaryComponents(session.tenantId)
  return ok(components)
})

export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const body = await req.json()
  if (!body.name || !body.code || !body.type) {
    throw errBadRequest('Name, code, and type are required')
  }

  const actor = {
    id: session.userId,
    name: session.user?.fullName || 'HR Admin',
    role: session.role || 'ADMIN',
  }

  const comp = await SalaryComponentService.createSalaryComponent(session.tenantId, body, actor)
  return ok(comp, { status: 201 })
})

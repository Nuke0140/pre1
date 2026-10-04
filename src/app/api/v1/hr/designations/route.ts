import { NextRequest } from 'next/server'
import { ok, withApi, errPermission, errBadRequest } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { DesignationService } from '@/lib/hr/designation-service'

export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const search = req.nextUrl.searchParams.get('search') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined

  const designations = await DesignationService.getDesignations(session.tenantId, { search, status })
  return ok(designations)
})

export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const body = await req.json()
  if (!body.name || !body.code) throw errBadRequest('Name and code are required')

  const actor = {
    id: session.userId,
    name: session.user?.fullName || 'HR Admin',
    role: session.role || 'ADMIN',
  }

  const desig = await DesignationService.createDesignation(session.tenantId, body, actor)
  return ok(desig, { status: 201 })
})

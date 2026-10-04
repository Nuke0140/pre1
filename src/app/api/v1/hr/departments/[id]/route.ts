import { NextRequest } from 'next/server'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { DepartmentService } from '@/lib/hr/department-service'

export const PATCH = withApi(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const { id } = await params
  const body = await req.json()
  const actor = {
    id: session.userId,
    name: session.user?.fullName || 'HR Admin',
    role: session.role || 'ADMIN',
  }

  const updated = await DepartmentService.updateDepartment(session.tenantId, id, body, actor)
  return ok(updated)
})

export const DELETE = withApi(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const { id } = await params
  const actor = {
    id: session.userId,
    name: session.user?.fullName || 'HR Admin',
    role: session.role || 'ADMIN',
  }

  const result = await DepartmentService.deleteDepartment(session.tenantId, id, actor)
  return ok(result)
})

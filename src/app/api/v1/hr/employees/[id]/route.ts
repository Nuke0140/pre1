import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withApi, errPermission, errNotFound } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { StaffService } from '@/lib/hr/staff-service'

/**
 * GET /api/v1/hr/employees/[id] — Retrieve single Employee profile
 * PATCH /api/v1/hr/employees/[id] — Update Employee profile
 * DELETE /api/v1/hr/employees/[id] — Soft-delete / deactivate Employee
 */
export const GET = withApi(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context found in active session')

  const { id } = await params
  const profile = await StaffService.getStaffById(session.tenantId, id)
  if (!profile) throw errNotFound('Employee not found')

  return ok(profile)
})

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

  const updated = await StaffService.updateStaff(session.tenantId, id, body, actor)
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

  const result = await StaffService.deleteStaff(session.tenantId, id, actor)
  return ok(result)
})

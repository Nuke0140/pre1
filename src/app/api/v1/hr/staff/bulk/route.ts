import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { StaffService } from '@/lib/hr/staff-service'

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const updates = Array.isArray(body)
      ? body
      : Array.isArray(body.updates)
      ? body.updates
      : Array.isArray(body.items)
      ? body.items
      : null

    if (!updates || updates.length === 0) {
      return Errors.validation('A non-empty updates array is required')
    }

    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      branchId: session.branchId,
    }

    const result = await StaffService.bulkUpdateStaffProfiles(
      session.tenantId,
      updates,
      actor
    )

    return ok(result)
  } catch (e: any) {
    return Errors.validation(e.message || 'Failed to process bulk staff updates')
  }
}

export const POST = withApi(_POST)

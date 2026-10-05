import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AppraisalService } from '@/lib/hr/appraisal-service'

async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const appraisal = await AppraisalService.getAppraisalById(session.tenantId, id)
    if (!appraisal) {
      return Errors.notFound('Appraisal record not found')
    }
    return ok(appraisal)
  } catch (e: any) {
    return Errors.system(e)
  }
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json()

    const updated = await AppraisalService.updateAppraisal(session.tenantId, id, {
      ...body,
      actorUserId: session.id,
    })

    return ok(updated)
  } catch (e: any) {
    return Errors.badRequest(e.message || 'Failed to update appraisal')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)

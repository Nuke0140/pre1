import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AppraisalService } from '@/lib/hr/appraisal-service'

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const submitted = await AppraisalService.submitAppraisal(session.tenantId, id, session.id)
    return ok(submitted)
  } catch (e: any) {
    return Errors.badRequest(e.message || 'Failed to submit appraisal')
  }
}

export const POST = withApi(_POST)

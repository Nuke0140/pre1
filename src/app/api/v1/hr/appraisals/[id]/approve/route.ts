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
    const body = await req.json().catch(() => ({}))
    const { reviewerComments } = body || {}

    const approved = await AppraisalService.approveAppraisal(
      session.tenantId,
      id,
      session.id,
      reviewerComments
    )

    return ok(approved)
  } catch (e: any) {
    return Errors.badRequest(e.message || 'Failed to approve appraisal')
  }
}

export const POST = withApi(_POST)

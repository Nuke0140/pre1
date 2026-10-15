import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { DpdpService } from '@/lib/security/dpdp-service'

/**
 * GET /api/v1/users/[id]/anonymize
 * Preview fields to be scrubbed and compliance records preserved under DPDP erasure workflow.
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck

  try {
    const preview = await DpdpService.previewAnonymization({
      userId: id,
      tenantId: session.tenantId,
    })

    if (!preview) {
      return notFound('User not found in this school')
    }

    return ok(preview)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/users/[id]/anonymize
 * Executes permanent, irreversible DPDP anonymization & erasure pipeline.
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:delete')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck

  try {
    const body = await req.json().catch(() => ({}))
    const { reason, confirmErasure } = body as {
      reason?: string
      confirmErasure?: boolean
    }

    if (!confirmErasure) {
      return bad(
        'Explicit confirmation is required (confirmErasure: true) to execute permanent DPDP erasure',
        'CONFIRMATION_REQUIRED'
      )
    }

    if (!reason || reason.trim().length < 5) {
      return bad(
        'Erasure justification reason is required and must be at least 5 characters',
        'REASON_REQUIRED'
      )
    }

    const result = await DpdpService.anonymizeUser({
      userId: id,
      tenantId: session.tenantId,
      actorSession: session,
      reason: reason.trim(),
      confirmErasure: true,
      req,
    })

    return ok(result)
  } catch (err: any) {
    if (err.code === 'SOLE_OWNER_PROTECTION') {
      return forbidden(err.message)
    }
    if (err.code === 'FORBIDDEN') {
      return forbidden(err.message)
    }
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

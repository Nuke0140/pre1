import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionsPipelineService, type PipelineStageKey } from '@/lib/admissions/pipeline-service'
import { normalizePipelineStageKey, ORDERED_PIPELINE_STAGES } from '@/lib/admissions/pipeline-constants'

/**
 * PATCH /api/v1/admissions/pipeline/[id]/stage
 * Transition a specific prospect card to a target stage.
 * RBAC: 'admissions:write'
 */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id: cardId } = await params
  if (!cardId) return Errors.badRequest('cardId parameter is required')

  const body = await req.json().catch(() => ({}))
  const { targetStage, reason, followUp } = body

  if (!targetStage) {
    return Errors.badRequest('targetStage is required')
  }

  const normalizedTarget = normalizePipelineStageKey(targetStage)
  if (!ORDERED_PIPELINE_STAGES.includes(normalizedTarget)) {
    return Errors.badRequest(`Invalid targetStage: ${targetStage}`)
  }

  const ctx = {
    tenantId: session.tenantId,
    branchId: body.branchId || session.branchId,
    academicYearId: body.academicYearId,
    actorId: session.uid,
    actorName: (session as any).name || (session as any).email || 'Staff User',
    actorRole: session.role,
  }

  try {
    const result = await AdmissionsPipelineService.transitionStage(ctx, {
      cardId,
      targetStage,
      reason,
      followUp,
    })

    if (!result.success) {
      return fail((result as any).code || 'BAD_REQUEST', result.message || 'Stage transition rejected', 400, undefined, {
        requireAction: (result as any).requireAction,
        code: (result as any).code,
      })
    }

    return ok(result)
  } catch (err: any) {
    if (err.message && err.message.includes('not found in this tenant')) {
      return fail('NOT_FOUND_001', err.message, 404)
    }
    return fail('BAD_REQUEST', err.message || 'Failed to update pipeline stage', 400)
  }
}

export const PATCH = withApi(_PATCH)

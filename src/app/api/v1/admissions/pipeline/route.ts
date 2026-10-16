import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'
import { AdmissionsPipelineService, type PipelineStageKey } from '@/lib/admissions/pipeline-service'

/**
 * GET /api/v1/admissions/pipeline
 * Fetch the 5-stage Visual Admission Pipeline board data with summary metrics and filters.
 * RBAC: 'admissions:read'
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const sp = req.nextUrl.searchParams
  const requestedBranchId = sp.get('branchId')
  const requestedSessionId = sp.get('academicYearId') || sp.get('academicSessionId')
  const searchQuery = sp.get('search') || sp.get('q')
  const programFilter = sp.get('program')
  const stageFilter = sp.get('stage')
  const followUpFilter = sp.get('followUpStatus') as any
  const assignedStaffId = sp.get('assignedStaffId')
  const includeArchived = sp.get('includeArchived') === 'true'

  const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
  if (branchScope.mode === 'NO_BRANCH_ACCESS') {
    return Errors.forbidden('No authorized branch access for active user')
  }

  try {
    const result = await AdmissionsPipelineService.getPipelineData(
      session.tenantId,
      branchScope,
      {
        academicSessionId: requestedSessionId,
        searchQuery,
        programFilter,
        stageFilter,
        followUpFilter,
        assignedStaffId,
        includeArchived,
      }
    )

    return ok(result)
  } catch (err: any) {
    return fail('BAD_REQUEST', err.message || 'Failed to fetch pipeline', 500)
  }
}

/**
 * POST /api/v1/admissions/pipeline
 * Move a prospect between pipeline stages with business rule validation and audit logging.
 * RBAC: 'admissions:write'
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const body = await req.json().catch(() => ({}))
  const { cardId, targetStage, reason, followUp } = body

  if (!cardId) {
    return Errors.badRequest('cardId is required')
  }
  if (!targetStage) {
    return Errors.badRequest('targetStage is required')
  }

  const validStages: PipelineStageKey[] = [
    'NEW_LEADS',
    'TOUR_BOOKED',
    'APPLICATION_SHARED',
    'OFFER_PENDING_FEE',
    'ENROLLED_PLACED',
  ]
  if (!validStages.includes(targetStage)) {
    return Errors.badRequest(`Invalid targetStage: ${targetStage}`)
  }

  const ctx = {
    tenantId: session.tenantId,
    branchId: body.branchId || session.branchId,
    academicYearId: body.academicYearId,
    actorId: session.id,
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

export const GET = withApi(_GET)
export const POST = withApi(_POST)

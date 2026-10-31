import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { can } from '@/lib/auth'
import {
  evaluateStepDependencies,
  executePrerequisiteResolution,
  type ResolutionActionType,
} from '@/lib/setup/dependency-resolver'
import { type StepKey } from '@/lib/setup/steps'

/**
 * GET /api/v1/setup/dependencies/resolve?stepKey=classroom&branchId=...
 * Returns real-time dependency diagnostic for a step, explaining why it is blocked,
 * missing prerequisites in order, why required, and smart pre-filled defaults.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const stepKey = searchParams.get('stepKey') as StepKey
    const branchId = searchParams.get('branchId')

    if (!stepKey) {
      return Errors.validation('stepKey query parameter is required')
    }

    const permissions = can(session.roles?.length ? session.roles : session.role, 'settings:write')
      ? ['settings:write', 'settings:read']
      : ['settings:read']

    const resolution = await evaluateStepDependencies(
      session.tenantId,
      stepKey,
      branchId,
      permissions
    )

    return ok(resolution)
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/setup/dependencies/resolve
 * 1-Click Prerequisite Resolution endpoint
 * Body: { targetStep: 'classroom', actionType: 'QUICK_CREATE_YEAR', payload: { ... }, branchId?: string }
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { targetStep, actionType, payload, branchId } = body

    if (!targetStep || !actionType || !payload) {
      return Errors.validation('targetStep, actionType, and payload are required')
    }

    const actor = {
      id: session.uid || 'unknown_user',
      name: session.name || 'Administrator',
    }

    const result = await executePrerequisiteResolution(
      session.tenantId,
      actor,
      actionType as ResolutionActionType,
      payload
    )

    // Re-evaluate the target step's dependencies immediately after creation
    const permissions = can(session.roles?.length ? session.roles : session.role, 'settings:write')
      ? ['settings:write', 'settings:read']
      : ['settings:read']

    const updatedResolution = await evaluateStepDependencies(
      session.tenantId,
      targetStep as StepKey,
      branchId,
      permissions
    )

    return ok({
      success: true,
      message: result.message,
      createdId: result.createdId,
      resolvedStepKey: result.stepKey,
      updatedResolution,
    }, undefined, 201)
  } catch (e: any) {
    if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
      return Errors.conflict(e.message)
    }
    if (e.message?.includes('required') || e.message?.includes('Invalid')) {
      return Errors.validation(e.message)
    }
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

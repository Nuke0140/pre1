import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BranchCopyService, type ConflictStrategy } from '@/lib/setup/branch-copy-service'
import { syncSetup } from '@/lib/setup/engine'
import type { CopyableCategory } from '@/lib/setup/scope-model'

/**
 * POST /api/v1/setup/branches/copy
 * Authoritatively executes configuration cloning from source branch to destination branch.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { sourceBranchId, destinationBranchId, categories, conflictStrategy } = body

    if (!sourceBranchId || !destinationBranchId) {
      return Errors.validation('sourceBranchId and destinationBranchId are required')
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return Errors.validation('At least one configuration category must be selected')
    }

    const result = await BranchCopyService.executeBranchCopy(
      session.tenantId,
      {
        id: session.uid,
        name: session.name,
        role: session.role,
      },
      {
        sourceBranchId,
        destinationBranchId,
        categories: categories as CopyableCategory[],
        conflictStrategy: (conflictStrategy as ConflictStrategy) || 'SKIP',
      }
    )

    // Trigger immediate setup sync to refresh readiness metrics for the destination branch
    try {
      await syncSetup(session.tenantId, { id: session.uid, name: session.name }, destinationBranchId)
    } catch (syncErr) {
      console.warn('[setup/branches/copy] Setup sync notice after copy:', syncErr)
    }

    return ok(result)
  } catch (err: any) {
    if (err.message && (err.message.includes('required') || err.message.includes('same') || err.message.includes('does not exist'))) {
      return Errors.validation(err.message)
    }
    return Errors.system(err)
  }
}

export const POST = withApi(_POST)

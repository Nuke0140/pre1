import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BranchCopyService } from '@/lib/setup/branch-copy-service'
import type { CopyableCategory } from '@/lib/setup/scope-model'

/**
 * POST /api/v1/setup/branches/copy-preview
 * Previews what records will be created, updated, or conflicted when copying setup between branches.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { sourceBranchId, destinationBranchId, categories } = body

    if (!sourceBranchId || !destinationBranchId) {
      return Errors.validation('sourceBranchId and destinationBranchId are required')
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return Errors.validation('At least one configuration category must be selected')
    }

    const preview = await BranchCopyService.previewBranchCopy(session.tenantId, {
      sourceBranchId,
      destinationBranchId,
      categories: categories as CopyableCategory[],
    })

    return ok(preview)
  } catch (err: any) {
    if (err.message && (err.message.includes('required') || err.message.includes('same') || err.message.includes('does not exist'))) {
      return Errors.validation(err.message)
    }
    return Errors.system(err)
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FastReceivingService } from '@/lib/inventory/fast-receiving-service'

/**
 * GET /api/v1/inventory/fast-receive/lookup
 * Scanned barcode or SKU lookup for fast mobile stock intake.
 * Query params:
 * - code: scanned barcode or SKU or name search string
 * - branchId: optional branch identifier (defaults to user's branch)
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code') || searchParams.get('q') || ''
    const branchId = searchParams.get('branchId') || session.branchId || null

    if (!code.trim()) {
      return bad('A barcode, SKU, or search term is required', 'CODE_REQUIRED')
    }

    const result = await FastReceivingService.lookupItemByBarcodeOrSku({
      tenantId: session.tenantId,
      code: code.trim(),
      branchId,
    })

    return ok(result)
  } catch (err: any) {
    return bad(err.message || 'Failed to lookup item by barcode', 'LOOKUP_FAILED')
  }
}

export const GET = withApi(_GET)

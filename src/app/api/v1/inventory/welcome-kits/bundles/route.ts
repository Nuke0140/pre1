import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { WelcomeKitService } from '@/lib/inventory/welcome-kit-service'

/**
 * GET /api/v1/inventory/welcome-kits/bundles
 * Returns available welcome kit bundles or detailed breakdown with live stock availability.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const bundleIdOrCode = searchParams.get('bundleId') || searchParams.get('bundleCode')
    const branchId = searchParams.get('branchId') || session.branchId || undefined
    const locationId = searchParams.get('locationId') || undefined
    const uniformSize = searchParams.get('uniformSize') || undefined

    if (bundleIdOrCode) {
      const details = await WelcomeKitService.getWelcomeKitDetails(
        session.tenantId,
        bundleIdOrCode,
        {
          branchId,
          locationId,
          uniformSize,
        }
      )
      return ok(details)
    }

    const bundles = await WelcomeKitService.listWelcomeKits(session.tenantId, branchId)
    return ok({ bundles })
  } catch (err: any) {
    return bad(err.message, 'WELCOME_KIT_BUNDLES_FAILED')
  }
}

export const GET = withApi(_GET)

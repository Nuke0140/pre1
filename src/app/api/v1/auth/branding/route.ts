import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { getEffectiveBranding } from '@/lib/branding-service'
import { PREONE_BRANDING_DEFAULTS } from '@/lib/branding-types'

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim().toUpperCase()

  try {
    let tenant = null

    if (code) {
      tenant = await db.tenant.findUnique({
        where: { code, deletedAt: null },
      })
    }

    // Fail-closed tenant isolation: If no code provided or no tenant found for that code,
    // do NOT fall back to arbitrary database tenants. Return neutral PreOne default branding.
    if (!tenant) {
      return ok({
        ...PREONE_BRANDING_DEFAULTS,
        schoolName: 'PreOne',
        schoolCode: '',
      })
    }

    const branding = await getEffectiveBranding(tenant.id)
    return ok(branding)
  } catch {
    return ok({
      ...PREONE_BRANDING_DEFAULTS,
      schoolName: 'PreOne',
      schoolCode: '',
    })
  }
}

export const GET = withApi(_GET)

import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { getEffectiveBranding } from '@/lib/branding-service'
import { PREONE_BRANDING_DEFAULTS } from '@/lib/branding-types'
import { resolveTenantContext } from '@/lib/auth/tenant-resolver'

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim() || searchParams.get('tenant')?.trim()

  try {
    const tenant = await resolveTenantContext(req, code)

    // Fail-closed tenant isolation: If no tenant found for that host or code,
    // do NOT fall back to arbitrary database tenants. Return neutral PreOne default branding.
    if (!tenant) {
      return ok({
        ...PREONE_BRANDING_DEFAULTS,
        schoolName: 'PreOne',
        schoolCode: '',
        campusName: null,
        school: {
          id: null,
          name: 'PreOne',
          code: '',
          logoUrl: null,
          campusName: null,
        },
        theme: {
          primaryColor: PREONE_BRANDING_DEFAULTS.primaryColor,
          secondaryColor: PREONE_BRANDING_DEFAULTS.accentColor,
          accentColor: PREONE_BRANDING_DEFAULTS.accentColor,
        },
      })
    }

    const branding = await getEffectiveBranding(tenant.id)
    return ok({
      ...branding,
      campusName: tenant.campusName,
      school: {
        id: tenant.id,
        name: tenant.name?.trim() || branding.schoolName,
        code: tenant.code || branding.schoolCode,
        logoUrl: branding.logoUrl,
        campusName: tenant.campusName,
      },
      theme: {
        primaryColor: branding.primaryColor,
        secondaryColor: branding.accentColor,
        accentColor: branding.accentColor,
      },
    })
  } catch {
    return ok({
      ...PREONE_BRANDING_DEFAULTS,
      schoolName: 'PreOne',
      schoolCode: '',
      campusName: null,
      school: {
        id: null,
        name: 'PreOne',
        code: '',
        logoUrl: null,
        campusName: null,
      },
      theme: {
        primaryColor: PREONE_BRANDING_DEFAULTS.primaryColor,
        secondaryColor: PREONE_BRANDING_DEFAULTS.accentColor,
        accentColor: PREONE_BRANDING_DEFAULTS.accentColor,
      },
    })
  }
}

export const GET = withApi(_GET)

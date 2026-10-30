import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { getSession } from '@/lib/auth-server'
import { getEffectiveBranding } from '@/lib/branding-service'
import { PREONE_BRANDING_DEFAULTS } from '@/lib/branding-types'
import { resolveTenantContext } from '@/lib/auth/tenant-resolver'

/**
 * GET /api/v1/branding
 * Centralized, role-agnostic branding endpoint for all authenticated personas and public surfaces.
 * Returns effective school logo, name, campus name, and theme tokens.
 */
async function _GET(req: NextRequest) {
  try {
    // 1. Try authenticated session first
    const session = await getSession(req)
    if (session?.tenantId) {
      const branding = await getEffectiveBranding(session.tenantId, session.branchId)
      return ok({
        ...branding,
        school: {
          id: branding.schoolId || session.tenantId,
          name: branding.schoolName || '',
          code: branding.schoolCode || '',
          logoUrl: branding.logoUrl,
          campusName: branding.campusName || null,
        },
        theme: {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.accentColor,
          accentColor: branding.accentColor,
        },
      })
    }

    // 2. Try subdomain / host resolution
    const tenant = await resolveTenantContext(req)
    if (tenant) {
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
    }

    // 3. Fallback to default neutral PreOne branding
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

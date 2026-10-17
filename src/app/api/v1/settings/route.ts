import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, fail, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SettingsService } from '@/lib/settings/settings-service'
import { ConfigDomain } from '@prisma/client'
import { isPreOneError } from '@/lib/errors'

/**
 * GET /api/v1/settings
 * Aggregates complete effective settings for the authenticated tenant.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const settings = await SettingsService.getEffectiveSettings(session.tenantId)
    return ok(settings)
  } catch (e: any) {
    if (isPreOneError(e) && e.isOperational()) {
      return fail(e.code, e.userMessage, e.httpStatus, e.field, e.details)
    }
    return Errors.system(e)
  }
}

/**
 * PUT /api/v1/settings
 * Updates domain configuration or school profile.
 */
async function _PUT(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { domain, data, profile } = body as {
      domain?: ConfigDomain
      data?: Record<string, any>
      profile?: Record<string, any>
    }

    const actor = {
      id: session.uid,
      name: session.name,
      role: session.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    }

    if (profile) {
      const updatedProfile = await SettingsService.updateSchoolProfile(session.tenantId, profile, actor)
      return ok({ profile: updatedProfile })
    }

    if (domain && data) {
      const updatedConfig = await SettingsService.updateDomainConfig(session.tenantId, domain, data, actor)
      return ok({ domain, data: updatedConfig.data })
    }

    return Errors.validation('Either domain + data or profile object is required')
  } catch (e: any) {
    if (isPreOneError(e) && e.isOperational()) {
      return fail(e.code, e.userMessage, e.httpStatus, e.field, e.details)
    }
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PUT = withApi(_PUT)

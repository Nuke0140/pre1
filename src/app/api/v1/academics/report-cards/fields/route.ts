import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { can } from '@/lib/auth'
import { ReportCardService } from '@/lib/academics/report-card-service'

/**
 * GET /api/v1/academics/report-cards/fields — Retrieve dynamic evaluation fields for a template
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const hasAccess = can(effectiveRoles, 'students:read') || can(effectiveRoles, 'academics:read')
  if (!hasAccess) {
    return Errors.forbidden('Missing permission: students:read or academics:read')
  }

  const { searchParams } = new URL(req.url)
  const templateId = searchParams.get('templateId')

  if (!templateId) {
    return Errors.validation('templateId query parameter is required')
  }

  try {
    const fields = await ReportCardService.getTemplateFieldsById(session.tenantId, templateId)
    return ok({ fields })
  } catch (err: any) {
    return Errors.bad(err.message || 'Failed to fetch template fields')
  }
}

export const GET = withApi(_GET)

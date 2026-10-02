import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TemplateService } from '@/lib/templates/template-service'
import { DocumentType, PageFormat } from '@/lib/templates/types'

/** GET /api/v1/templates — list templates with search, type and status filters */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || undefined
    const status = url.searchParams.get('status') || undefined
    const search = url.searchParams.get('search') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
    const limit = parseInt(url.searchParams.get('limit') || '50', 10) || 50

    const result = await TemplateService.listTemplates(session.tenantId, {
      type,
      status,
      search,
      page,
      limit,
    })

    return ok(result)
  } catch (e: any) {
    return Errors.system(e.message || e)
  }
}

/** POST /api/v1/templates — create a new template draft (preset or blank canvas) */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    if (!body || !body.name || !body.type) {
      return Errors.validation('Template name and type are required')
    }

    const template = await TemplateService.createTemplate(session.tenantId, {
      name: body.name,
      type: body.type as DocumentType,
      presetKey: body.presetKey,
      format: body.format as PageFormat,
      createdByName: session.name,
      actorId: session.uid,
    })

    return ok(template)
  } catch (e: any) {
    return Errors.bad(e.message || 'Failed to create template')
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

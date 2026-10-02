import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TemplateService } from '@/lib/templates/template-service'

/** GET /api/v1/templates/[id] — fetch template detail */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const template = await TemplateService.getTemplateById(session.tenantId, id)
    if (!template) {
      return Errors.notFound('Template not found')
    }
    return ok(template)
  } catch (e: any) {
    return Errors.system(e.message || e)
  }
}

/** PATCH /api/v1/templates/[id] — update template definition or metadata */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json()
    const updated = await TemplateService.updateTemplate(session.tenantId, id, {
      name: body.name,
      type: body.type,
      isDefault: body.isDefault,
      definition: body.definition,
      updatedByName: session.name,
      actorId: session.uid,
    })
    return ok(updated)
  } catch (e: any) {
    return Errors.bad(e.message || 'Failed to update template')
  }
}

/** DELETE /api/v1/templates/[id] — delete template */
async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    await TemplateService.deleteTemplate(session.tenantId, id)
    return ok({ success: true, id })
  } catch (e: any) {
    return Errors.bad(e.message || 'Failed to delete template')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

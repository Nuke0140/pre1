import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TemplateService } from '@/lib/templates/template-service'
import { TemplateDefinition } from '@/lib/templates/types'

/** GET /api/v1/templates/[id]/render — render HTML document with sample data */
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
    if (!template) return Errors.notFound('Template not found')

    const html = TemplateService.renderTemplateHtml(template.definition)

    // Check if client expects HTML or JSON
    const accept = req.headers.get('accept') || ''
    if (accept.includes('text/html')) {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    return ok({ html })
  } catch (e: any) {
    return Errors.system(e.message || e)
  }
}

/** POST /api/v1/templates/[id]/render — render HTML with optional custom data context or live definition */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    let definition: TemplateDefinition
    if (body.definition) {
      definition = body.definition
    } else {
      const template = await TemplateService.getTemplateById(session.tenantId, id)
      if (!template) return Errors.notFound('Template not found')
      definition = template.definition
    }

    const html = TemplateService.renderTemplateHtml(definition, body.context)

    return ok({ html })
  } catch (e: any) {
    return Errors.system(e.message || e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

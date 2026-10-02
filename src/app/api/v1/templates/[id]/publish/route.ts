import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TemplateService } from '@/lib/templates/template-service'

/** POST /api/v1/templates/[id]/publish — publish template version */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const updated = await TemplateService.publishTemplate(
      session.tenantId,
      id,
      session.name,
      session.uid
    )
    return ok(updated)
  } catch (e: any) {
    return Errors.bad(e.message || 'Failed to publish template')
  }
}

export const POST = withApi(_POST)

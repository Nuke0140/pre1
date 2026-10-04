import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TemplateService } from '@/lib/templates/template-service'
import { db } from '@/lib/db'

/** POST /api/v1/templates/[id]/assign — assign as active module default and sync setup registry */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const template = await TemplateService.getTemplateById(session.tenantId, id)
    if (!template) return Errors.notFound('Template not found')

    // 1. Unset other templates of same type
    await db.documentTemplate.updateMany({
      where: {
        tenantId: session.tenantId,
        type: template.type,
        id: { not: id },
      },
      data: { isDefault: false },
    })

    // 2. Set this template as default
    const updated = await db.documentTemplate.update({
      where: { id },
      data: { isDefault: true },
    })

    // 3. Sync with SchoolConfig.DOCUMENT_TEMPLATES
    await TemplateService.syncSetupConfig(session.tenantId, template.type)

    return ok({
      success: true,
      template: updated,
      message: `Template "${updated.name}" is now designated as the active default for ${template.type}.`,
    })
  } catch (e: any) {
    return Errors.system(e.message || 'Failed to assign template')
  }
}

export const POST = withApi(_POST)

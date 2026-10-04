import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportCardService } from '@/lib/academics/report-card-service'

/**
 * POST /api/v1/academics/report-cards/bulk — Teacher bulk evaluation entry workflow
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { academicSessionId, classroomId, term, templateId, status, items } = body

    if (!academicSessionId || !classroomId || !term || !templateId || !Array.isArray(items)) {
      return Errors.validation('academicSessionId, classroomId, term, templateId, and items array are required')
    }

    const result = await ReportCardService.bulkSaveReportCards(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        academicSessionId,
        classroomId,
        term,
        templateId,
        status: status || 'DRAFT',
        items,
      }
    )

    return ok(result)
  } catch (err: any) {
    return Errors.business('BULK_REPORT_CARD_SAVE_FAILED', err.message || 'Failed to bulk save report cards', 422)
  }
}

export const POST = withApi(_POST)

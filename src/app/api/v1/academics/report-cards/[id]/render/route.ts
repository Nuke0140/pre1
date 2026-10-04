import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportCardService } from '@/lib/academics/report-card-service'

/**
 * POST /api/v1/academics/report-cards/[id]/render — Compile and render official PDF
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const result = await ReportCardService.renderReportCardPdf(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id
    )

    return ok(result)
  } catch (err: any) {
    return Errors.business('REPORT_CARD_RENDER_FAILED', err.message || 'Failed to render report card PDF', 422)
  }
}

export const POST = withApi(_POST)

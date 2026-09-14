import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ExportFormat, ScopeContext } from '@/lib/reports/report-types'

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:export')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant context required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { reportId, format = 'CSV', options = {} } = body

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'reportId is required' }, { status: 400 })
    }

    const ctx: ScopeContext = {
      tenantId: session.tenantId,
      branchId: options.branchId || session.branchId,
      actorId: session.uid,
      actorName: session.name || 'User',
      actorRole: session.role,
      roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
    }

    const exportData = await ReportService.exportReport(
      reportId,
      format.toUpperCase() as ExportFormat,
      options,
      ctx
    )

    return new Response(exportData.content, {
      status: 200,
      headers: {
        'Content-Type': exportData.contentType,
        'Content-Disposition': `attachment; filename="${exportData.filename}"`,
      },
    })
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: err.message }, { status })
  }
}

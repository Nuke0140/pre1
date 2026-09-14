import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ScopeContext } from '@/lib/reports/report-types'

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session

  try {
    const body = await req.json()
    const { reportId, options = {} } = body

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'reportId is required' }, { status: 400 })
    }

    const ctx: ScopeContext = {
      tenantId: session.tenantId ?? '',
      branchId: options.branchId || session.branchId,
      academicSessionId: options.academicSessionId || null,
      actorId: session.uid,
      actorName: session.name || 'User',
      actorRole: session.role,
      roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
    }

    const result = await ReportService.queryReport(reportId, options, ctx)
    return NextResponse.json({ success: true, report: result })
  } catch (err: any) {
    const status = err.message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: err.message }, { status })
  }
}

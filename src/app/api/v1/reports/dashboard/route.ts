import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ScopeContext } from '@/lib/reports/report-types'

export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session

  const searchParams = req.nextUrl.searchParams
  if (!session.tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant context is required' }, { status: 401 })
  }
  const branchId = searchParams.get('branchId') || session.branchId
  const academicSessionId = searchParams.get('academicSessionId')

  const ctx: ScopeContext = {
    tenantId: session.tenantId,
    branchId,
    academicSessionId,
    actorId: session.uid,
    actorName: session.name || 'User',
    actorRole: session.role,
    roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
  }

  try {
    const kpis = await ReportService.getDashboardKPIs(ctx)
    return NextResponse.json({ success: true, kpis })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

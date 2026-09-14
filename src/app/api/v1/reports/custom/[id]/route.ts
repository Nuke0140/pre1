import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ScopeContext } from '@/lib/reports/report-types'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'reports:custom')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant context required' }, { status: 401 })
  }

  const { id } = await params
  const ctx: ScopeContext = {
    tenantId: session.tenantId,
    branchId: session.branchId,
    actorId: session.uid,
    actorName: session.name || 'User',
    actorRole: session.role,
    roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
  }

  try {
    await ReportService.deleteCustomReport(id, ctx)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

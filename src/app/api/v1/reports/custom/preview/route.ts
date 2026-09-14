import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ScopeContext } from '@/lib/reports/report-types'

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:custom')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant context required' }, { status: 401 })
  }

  try {
    const payload = await req.json()
    if (!payload.source || !payload.fields || payload.fields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source and at least one field are required' },
        { status: 400 }
      )
    }

    const ctx: ScopeContext = {
      tenantId: session.tenantId,
      branchId: session.branchId,
      actorId: session.uid,
      actorName: session.name || 'User',
      actorRole: session.role,
      roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
    }

    const preview = await ReportService.previewCustomReport(payload, ctx)
    return NextResponse.json({ success: true, preview })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

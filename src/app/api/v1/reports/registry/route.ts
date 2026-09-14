import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ReportService } from '@/lib/reports/report-service'
import { ScopeContext } from '@/lib/reports/report-types'

export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session

  const ctx: ScopeContext = {
    tenantId: session.tenantId ?? '',
    branchId: session.branchId,
    actorId: session.uid,
    actorName: session.name || 'User',
    actorRole: session.role,
    roles: session.roles && session.roles.length > 0 ? session.roles : [session.role],
  }

  const registry = ReportService.getRegistry(ctx)
  return NextResponse.json({ success: true, reports: registry })
}

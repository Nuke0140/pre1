import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/audit-logs — immutable audit trail (audit:read) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'audit:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = req.nextUrl
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const moduleFilter = url.searchParams.get('module') || undefined
    const actionFilter = url.searchParams.get('action') || undefined
    const severityFilter = url.searchParams.get('severity') || undefined
    const pageSize = 50

    const where: Record<string, unknown> = {
      tenantId: session.tenantId,
      ...(moduleFilter ? { module: moduleFilter } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(severityFilter ? { severity: severityFilter } : {}),
    }

    const [total, logs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    return ok(logs, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
  } catch (e) {
    return Errors.system(e)
  }
}

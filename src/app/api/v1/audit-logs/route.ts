import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** GET /api/v1/audit-logs — immutable audit trail (audit:read) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'audit:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
    const pageSize = 50
    const [total, logs] = await Promise.all([
      db.auditLog.count({ where: { tenantId: session.tenantId } }),
      db.auditLog.findMany({
        where: { tenantId: session.tenantId },
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

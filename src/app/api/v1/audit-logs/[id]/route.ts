import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/**
 * GET /api/v1/audit-logs/[id]
 * Fetch single immutable audit log record with human-readable resolution.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'audit:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const log = await db.auditLog.findFirst({
      where: {
        id,
        tenantId: session.tenantId,
      },
    })

    if (!log) {
      return Errors.notFound('Audit log record not found')
    }

    // Resolve branch and academic session names if available
    let branchName: string | null = null
    let academicSessionName: string | null = null

    if (log.branchId) {
      const branch = await db.branch.findUnique({
        where: { id: log.branchId },
        select: { name: true },
      })
      branchName = branch?.name ?? null
    }

    if (log.academicSessionId) {
      const sessionRec = await db.academicSession.findUnique({
        where: { id: log.academicSessionId },
        select: { name: true },
      })
      academicSessionName = sessionRec?.name ?? null
    }

    return ok({
      ...log,
      branchName,
      academicSessionName,
    })
  } catch (e) {
    return Errors.system(e)
  }
}

/**
 * Strict Immutability Protection: Rejects any attempt to modify or delete audit logs.
 */
export async function PATCH() {
  return Errors.business('IMMUTABLE_LOG', 'Audit logs cannot be modified or updated', 405)
}

export async function PUT() {
  return Errors.business('IMMUTABLE_LOG', 'Audit logs cannot be modified or updated', 405)
}

export async function DELETE() {
  return Errors.business('IMMUTABLE_LOG', 'Audit logs cannot be deleted', 405)
}

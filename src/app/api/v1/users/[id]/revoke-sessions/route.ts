import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'

/** POST /api/v1/users/[id]/revoke-sessions  sign out all devices & revoke active sessions */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    if (member.role === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
      return forbidden('Only owners can revoke sessions of school owner')
    }

    // Touch user updatedAt to invalidate cached tokens / trigger session re-auth
    await db.user.update({
      where: { id: member.userId },
      data: { updatedAt: new Date() },
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'REVOKE_SESSIONS',
      entity: 'User',
      entityId: member.userId,
      module: 'Users',
      severity: 'WARNING',
      summary: `Revoked all active sessions for user ${member.user.fullName}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return ok({ revoked: true, userId: member.userId })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

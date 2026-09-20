import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserStatus } from '@prisma/client'

/** POST /api/v1/users/[id]/status — manage user lifecycle (ACTIVE, SUSPENDED, INACTIVE, PENDING) */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    const body = await req.json()
    const { status, reason } = body as { status?: UserStatus; reason?: string }

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return bad('Valid status is required (ACTIVE, INACTIVE, SUSPENDED, PENDING)', 'INVALID_STATUS')
    }

    if (member.role === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
      return forbidden('Only owners can modify school owner account status')
    }

    const previousStatus = member.status

    const validTransitions: Record<UserStatus, UserStatus[]> = {
      PENDING: ['ACTIVE', 'INACTIVE'],
      ACTIVE: ['SUSPENDED', 'INACTIVE'],
      SUSPENDED: ['ACTIVE', 'INACTIVE'],
      INACTIVE: ['ACTIVE', 'PENDING'],
    }

    if (previousStatus === status) {
      return ok({ userId: member.userId, status: member.status, message: 'Status already set' })
    }

    if (!validTransitions[previousStatus]?.includes(status)) {
      return bad(`Cannot transition user status from ${previousStatus} to ${status}`, 'INVALID_STATE_TRANSITION')
    }

    // Update TenantUser status inside transaction
    const updatedMember = await db.$transaction(async (tx) => {
      const tu = await tx.tenantUser.update({
        where: { id: member.id },
        data: { status },
      })

      // If SUSPENDED or INACTIVE, also reflect on User account and revoke active sessions
      if (['SUSPENDED', 'INACTIVE'].includes(status)) {
        await tx.user.update({
          where: { id: member.userId },
          data: { status, updatedAt: new Date() },
        })
      } else if (status === 'ACTIVE') {
        await tx.user.update({
          where: { id: member.userId },
          data: { status: 'ACTIVE' },
        })
      }

      return tu
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: status === 'SUSPENDED' ? 'SUSPEND_USER' : status === 'ACTIVE' ? 'ACTIVATE_USER' : 'UPDATE_USER_STATUS',
      entity: 'User',
      entityId: member.userId,
      module: 'Users',
      severity: status === 'SUSPENDED' ? 'WARNING' : 'INFO',
      summary: `Changed user ${member.user.fullName} status from ${previousStatus} to ${status}${reason ? `: ${reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: { status: previousStatus },
      newValues: { status, reason },
    })

    return ok({
      userId: member.userId,
      status: updatedMember.status,
      updatedAt: updatedMember.updatedAt,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

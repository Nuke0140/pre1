import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, fail, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { InvitationService } from '@/lib/users/invitation-service'

/**
 * GET /api/v1/users/invitations
 * Lists invitations for the active school with computed age, expiry, and status KPIs.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined
  const search = url.searchParams.get('search') || undefined
  const origin = req.headers.get('origin') || undefined

  try {
    const result = await InvitationService.listInvitations({
      tenantId: session.tenantId,
      status,
      search,
      origin,
    })

    return ok({
      invitations: result.invitations,
      total: result.invitations.length,
      kpis: result.kpis,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/users/invitations
 * Resends, revokes/cancels, or activates an invitation.
 */
async function _POST(req: NextRequest) {
  // Rate limit invitation operations (resend / cancel / activate) to 25/min per IP
  const rl = await checkRateLimit(req, {
    windowMs: 60 * 1000,
    max: 25,
    keyPrefix: 'user_invitations',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many invitation requests. Please wait before retrying.')
  }

  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json().catch(() => ({}))
    const { action, userId, invitationId } = body as {
      action: 'resend' | 'cancel' | 'revoke' | 'activate'
      userId?: string
      invitationId?: string
    }

    if (!action || (!userId && !invitationId)) {
      return bad('Action ("resend", "cancel", "revoke", or "activate") and userId or invitationId are required', 'INVALID_INVITATION_ACTION')
    }

    const origin = req.headers.get('origin') || undefined

    if (action === 'resend') {
      const result = await InvitationService.resendInvitation({
        tenantId: session.tenantId,
        userId,
        invitationId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        origin,
        req,
      })
      return ok(result)
    }

    if (action === 'cancel' || action === 'revoke') {
      const result = await InvitationService.revokeInvitation({
        tenantId: session.tenantId,
        userId,
        invitationId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        req,
      })
      return ok(result)
    }

    if (action === 'activate') {
      const member = await db.tenantUser.findFirst({
        where: {
          tenantId: session.tenantId,
          ...(userId ? { userId } : {}),
          ...(invitationId ? { invitations: { some: { id: invitationId } } } : {}),
          deletedAt: null,
        },
        include: { user: true },
      })

      if (!member) return notFound('User invitation or record not found')

      if (member.status !== 'PENDING') {
        return bad(`User is not in PENDING state (current: ${member.status})`, 'USER_NOT_PENDING')
      }

      await db.$transaction(async (tx) => {
        await tx.tenantUser.update({
          where: { id: member.id },
          data: { status: 'ACTIVE' },
        })
        await tx.user.update({
          where: { id: member.userId },
          data: { status: 'ACTIVE' },
        })
        await tx.userInvitation.updateMany({
          where: { tenantId: session.tenantId!, userId: member.userId },
          data: { status: 'ACCEPTED', acceptedAt: new Date() },
        })
      })

      const meta = getRequestMeta(req)
      await recordAudit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'ACTIVATE_INVITATION',
        entity: 'User',
        entityId: member.userId,
        module: 'Users',
        severity: 'INFO',
        summary: `Activated invited user ${member.user.fullName} (${member.user.email})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return ok({ success: true, message: `User ${member.user.email} successfully activated` })
    }

    return bad('Invalid action specified', 'INVALID_INVITATION_ACTION')
  } catch (err: any) {
    const status = err.httpStatus || err.status || err.statusCode
    if (status && status < 500) {
      return fail(err.code || 'INVITATION_ERROR', err.userMessage || err.message, status)
    }
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

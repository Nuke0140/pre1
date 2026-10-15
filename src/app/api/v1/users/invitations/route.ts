import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { emailService } from '@/lib/email/email-service'

/**
 * GET /api/v1/users/invitations — list pending invitations
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const pendingMembers = await db.tenantUser.findMany({
      where: {
        tenantId: session.tenantId,
        status: 'PENDING',
        deletedAt: null,
      },
      include: {
        staffProfile: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const invitations = pendingMembers.map((m) => ({
      id: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      phone: m.user.phone,
      role: m.role,
      roles: m.roles && m.roles.length > 0 ? m.roles : [m.role],
      branchId: m.branchId,
      designation: m.staffProfile?.designation || null,
      invitedAt: m.createdAt,
      status: m.status,
    }))

    return ok({
      invitations,
      total: invitations.length,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/users/invitations — resend or cancel pending invitation
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
    const body = await req.json()
    const { action, userId } = body as { action: 'resend' | 'cancel' | 'activate'; userId: string }

    if (!action || !userId || !['resend', 'cancel', 'activate'].includes(action)) {
      return bad('Action ("resend", "cancel", or "activate") and userId are required', 'INVALID_INVITATION_ACTION')
    }

    const member = await db.tenantUser.findFirst({
      where: {
        userId,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: { user: true },
    })

    if (!member) return notFound('User invitation or record not found')

    if ((action === 'activate' || action === 'cancel') && member.status !== 'PENDING') {
      return bad(`User is not in PENDING state (current: ${member.status})`, 'USER_NOT_PENDING')
    }

    if (action === 'resend' && member.status !== 'PENDING' && member.status !== 'ACTIVE') {
      return bad(`Cannot resend credentials or invitation to a ${member.status.toLowerCase()} user`, 'INVALID_USER_STATUS')
    }

    const meta = getRequestMeta(req)

    if (action === 'activate') {
      await db.$transaction(async (tx) => {
        await tx.tenantUser.update({
          where: { id: member.id },
          data: { status: 'ACTIVE' },
        })
        await tx.user.update({
          where: { id: member.userId },
          data: { status: 'ACTIVE' },
        })
      })

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
    } else if (action === 'resend') {
      if (!member.user.email) {
        return bad('User does not have an email address configured', 'MISSING_EMAIL')
      }

      // Touch user and membership
      await db.$transaction(async (tx) => {
        await tx.tenantUser.update({
          where: { id: member.id },
          data: { updatedAt: new Date() },
        })
        await tx.user.update({
          where: { id: member.userId },
          data: { updatedAt: new Date() },
        })
      })

      const isPending = member.status === 'PENDING'
      const origin = req.headers.get('origin') || 'http://localhost:3000'

      await emailService.send({
        to: member.user.email,
        subject: isPending ? 'Welcome to PreOne — Staff Invitation' : 'Welcome to PreOne — Account Access',
        html: `<div style="font-family:sans-serif;padding:24px;"><h2>Welcome to PreOne</h2><p>Hello ${member.user.fullName},</p><p>You have ${isPending ? 'been invited to join' : 'an active account in'} the school workspace as a <strong>${member.role}</strong>.</p><p>Please log in using your registered credentials at <a href="${origin}/auth/login">${origin}/auth/login</a>.</p></div>`,
        text: `Hello ${member.user.fullName},\n\nYou have ${isPending ? 'been invited to join' : 'an active account in'} PreOne as a ${member.role}.\n\nPlease log in at ${origin}/auth/login.`,
        tenantId: session.tenantId,
      })

      await recordAudit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: isPending ? 'RESEND_INVITATION' : 'RESEND_WELCOME',
        entity: 'User',
        entityId: member.userId,
        module: 'Users',
        severity: 'INFO',
        summary: `Resent ${isPending ? 'invitation' : 'welcome email'} to ${member.user.fullName} (${member.user.email})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return ok({
        success: true,
        message: `${isPending ? 'Invitation' : 'Welcome email'} successfully resent to ${member.user.email}`,
      })
    } else {
      // cancel -> mark INACTIVE or soft delete
      await db.$transaction(async (tx) => {
        await tx.tenantUser.update({
          where: { id: member.id },
          data: { status: 'INACTIVE', deletedAt: new Date() },
        })
      })

      await recordAudit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'CANCEL_INVITATION',
        entity: 'User',
        entityId: member.userId,
        module: 'Users',
        severity: 'INFO',
        summary: `Cancelled invitation for ${member.user.fullName} (${member.user.email})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return ok({ success: true, message: `Invitation cancelled for ${member.user.email}` })
    }
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

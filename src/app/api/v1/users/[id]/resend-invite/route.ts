import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { emailService } from '@/lib/email/email-service'

/**
 * POST /api/v1/users/[id]/resend-invite
 * Row-level admin action: resends invitation (for pending users) or welcome/access instructions (for active users).
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    if (!member.user.email) {
      return bad('User does not have an email address configured', 'MISSING_EMAIL')
    }

    if (member.status !== 'PENDING' && member.status !== 'ACTIVE') {
      return bad(
        `Cannot resend credentials or invitation to a ${member.status.toLowerCase()} user`,
        'INVALID_USER_STATUS'
      )
    }

    // Touch user and membership timestamps
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

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
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
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

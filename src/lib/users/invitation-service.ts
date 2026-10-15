import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { emailService } from '@/lib/email/email-service'
import { PASSWORD_POLICY } from '@/lib/auth'
import { errBusiness, errNotFound, errValidation } from '@/lib/errors'
import { UserRole } from '@prisma/client'

export const INVITATION_TTL_DAYS = 7
export const EXPIRING_SOON_HOURS = 24

export interface InvitationListItem {
  id: string
  invitationId: string
  userId: string
  membershipId: string | null
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
  roles: string[]
  branchId: string | null
  branchName: string | null
  designation: string | null
  invitedById: string | null
  invitedByName: string | null
  invitedAt: string
  invitedAge: string
  expiresAt: string
  expiresIn: string
  isExpired: boolean
  isExpiringSoon: boolean
  effectiveStatus: 'PENDING' | 'EXPIRING_SOON' | 'EXPIRED' | 'ACCEPTED' | 'REVOKED'
  status: string
  resendCount: number
  lastResentAt: string | null
  inviteUrl: string | null
}

export interface InvitationKpis {
  total: number
  pending: number
  expiringSoon: number
  expired: number
  accepted: number
}

/**
 * Format relative duration string ("3 days ago", "just now", "in 5 days")
 */
export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const isPast = diffMs >= 0
  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000)

  if (absDiffSec < 60) return isPast ? 'just now' : 'in less than a minute'
  const mins = Math.floor(absDiffSec / 60)
  if (mins < 60) return isPast ? `${mins}m ago` : `in ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return isPast ? 'yesterday' : 'in 1 day'
  if (days < 30) return isPast ? `${days} days ago` : `in ${days} days`
  const months = Math.floor(days / 30)
  return isPast ? `${months}mo ago` : `in ${months}mo`
}

/**
 * Invitation Lifecycle & Token Service (PreOne Doc 1.3)
 */
export class InvitationService {
  /**
   * Generates a cryptographically secure random token and its SHA-256 hash.
   */
  static generateToken(): { rawToken: string; tokenHash: string } {
    const rawToken = `inv_${crypto.randomBytes(32).toString('hex')}`
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    return { rawToken, tokenHash }
  }

  /**
   * Hash a raw token for database lookup.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex')
  }

  /**
   * Creates or registers an invitation token for a newly onboarded user.
   */
  static async createInvitation(params: {
    tenantId: string
    userId: string
    tenantUserId?: string
    email: string
    role: UserRole
    invitedById?: string
    origin?: string
    sendEmail?: boolean
  }) {
    const { tenantId, userId, tenantUserId, email, role, invitedById, origin, sendEmail = true } = params
    const { rawToken, tokenHash } = this.generateToken()
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000)

    const invitation = await db.userInvitation.create({
      data: {
        tenantId,
        userId,
        tenantUserId,
        email: email.trim().toLowerCase(),
        role,
        tokenHash,
        rawToken,
        status: 'PENDING',
        expiresAt,
        invitedById,
        resendCount: 0,
      },
      include: {
        user: true,
        tenant: true,
      },
    })

    const baseOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseOrigin}/invite?token=${rawToken}`

    if (sendEmail) {
      await emailService.send({
        to: invitation.email,
        subject: `Welcome to ${invitation.tenant.name} — Staff Invitation`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="margin-bottom: 24px;">
              <span style="display:inline-block; background: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 4px 10px; border-radius: 6px;">PreOne Workspace</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
              You have been invited to join ${invitation.tenant.name}
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Hello <strong>${invitation.user.fullName}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              An administrator has invited you to access the school workspace as a <strong>${role}</strong>. Please click the button below to set up your password and activate your account.
            </p>
            <div style="margin: 28px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
                Accept Invitation &amp; Set Password
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              This invitation link is valid for <strong>${INVITATION_TTL_DAYS} days</strong> (expires on ${expiresAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}).
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
              Direct link: <a href="${inviteUrl}" style="color: #7c3aed;">${inviteUrl}</a>
            </p>
          </div>
        `,
        text: `Hello ${invitation.user.fullName},\n\nYou have been invited to join ${invitation.tenant.name} as a ${role}.\n\nPlease accept your invitation and set your password at: ${inviteUrl}\n\nThis link will expire in ${INVITATION_TTL_DAYS} days.`,
        tenantId,
      })
    }

    return {
      invitation,
      rawToken,
      inviteUrl,
    }
  }

  /**
   * Resends an invitation with a refreshed token and extended expiry.
   */
  static async resendInvitation(params: {
    tenantId: string
    userId?: string
    invitationId?: string
    actorId: string
    actorName: string
    actorRole: string
    origin?: string
    req?: Request | null
  }) {
    const { tenantId, userId, invitationId, actorId, actorName, actorRole, origin, req } = params

    // 1. Locate existing invitation or pending membership
    let invitation = await db.userInvitation.findFirst({
      where: {
        tenantId,
        ...(invitationId ? { id: invitationId } : { userId }),
      },
      include: {
        user: true,
        tenant: true,
        tenantUser: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // If no explicit UserInvitation record exists yet, locate TenantUser in PENDING state and backfill
    if (!invitation && userId) {
      const member = await db.tenantUser.findFirst({
        where: { tenantId, userId, deletedAt: null },
        include: { user: true, tenant: true },
      })
      if (member) {
        if (!member.user.email) {
          throw errValidation('User does not have an email address configured', 'email')
        }
        const created = await this.createInvitation({
          tenantId,
          userId: member.userId,
          tenantUserId: member.id,
          email: member.user.email,
          role: member.role,
          invitedById: actorId,
          origin,
          sendEmail: false,
        })
        invitation = await db.userInvitation.findUnique({
          where: { id: created.invitation.id },
          include: { user: true, tenant: true, tenantUser: true },
        })
      }
    }

    if (!invitation) {
      throw errNotFound('Invitation or pending member was not found', 'INVITATION_NOT_FOUND')
    }

    // If user is ACTIVE or invitation is ACCEPTED, send welcome email
    if (invitation.status === 'ACCEPTED' || invitation.tenantUser?.status === 'ACTIVE') {
      const baseOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await emailService.send({
        to: invitation.email,
        subject: 'Welcome to PreOne — Account Access',
        html: `<div style="font-family:sans-serif;padding:24px;"><h2>Welcome to PreOne</h2><p>Hello ${invitation.user.fullName},</p><p>You have an active account in the school workspace as a <strong>${invitation.role}</strong>.</p><p>Please log in using your registered credentials at <a href="${baseOrigin}/auth/login">${baseOrigin}/auth/login</a>.</p></div>`,
        text: `Hello ${invitation.user.fullName},\n\nYou have an active account in PreOne as a ${invitation.role}.\n\nPlease log in at ${baseOrigin}/auth/login.`,
        tenantId,
      })

      const meta = getRequestMeta(req)
      await recordAudit({
        tenantId,
        actorId,
        actorName,
        actorRole,
        action: 'RESEND_WELCOME',
        entity: 'User',
        entityId: invitation.userId,
        module: 'Users',
        severity: 'INFO',
        summary: `Resent welcome email to ${invitation.user.fullName} (${invitation.email})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return {
        success: true,
        message: `Welcome email successfully resent to ${invitation.email}`,
        resendCount: invitation.resendCount,
        expiresAt: invitation.expiresAt.toISOString(),
        rawToken: null,
        inviteUrl: null,
      }
    }

    // 2. Generate new token and 7-day expiry
    const { rawToken, tokenHash } = this.generateToken()
    const newExpiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000)

    const updated = await db.userInvitation.update({
      where: { id: invitation.id },
      data: {
        tokenHash,
        rawToken,
        status: 'PENDING',
        expiresAt: newExpiresAt,
        lastResentAt: new Date(),
        resendCount: { increment: 1 },
      },
      include: {
        user: true,
        tenant: true,
      },
    })

    // Touch user and membership
    if (invitation.tenantUserId) {
      await db.tenantUser.update({
        where: { id: invitation.tenantUserId },
        data: { updatedAt: new Date() },
      }).catch(() => {})
    }

    const baseOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseOrigin}/invite?token=${rawToken}`

    // 3. Dispatch refreshed invitation email
    await emailService.send({
      to: updated.email,
      subject: `[Reminder] Invitation to join ${updated.tenant.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="margin-bottom: 24px;">
            <span style="display:inline-block; background: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 4px 10px; border-radius: 6px;">PreOne Workspace</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
            New Invitation Link for ${updated.tenant.name}
          </h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Hello <strong>${updated.user.fullName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Here is your updated invitation link to access <strong>${updated.tenant.name}</strong> as a <strong>${updated.role}</strong>.
          </p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);">
              Activate Account &amp; Set Password
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            This link is valid for <strong>${INVITATION_TTL_DAYS} days</strong> (expires on ${newExpiresAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}).
          </p>
        </div>
      `,
      text: `Hello ${updated.user.fullName},\n\nHere is your refreshed invitation to join ${updated.tenant.name} as a ${updated.role}.\n\nPlease set your password at: ${inviteUrl}\n\nExpires on: ${newExpiresAt.toISOString()}`,
      tenantId,
    })

    // 4. Audit event
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId,
      actorName,
      actorRole,
      action: 'RESEND_INVITATION',
      entity: 'User',
      entityId: updated.userId,
      module: 'Users',
      severity: 'INFO',
      summary: `Resent invitation to ${updated.user.fullName} (${updated.email}) [resend #${updated.resendCount}]`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        resendCount: updated.resendCount,
        expiresAt: newExpiresAt.toISOString(),
      },
    })

    return {
      success: true,
      message: `Invitation successfully resent to ${updated.email}`,
      resendCount: updated.resendCount,
      expiresAt: updated.expiresAt.toISOString(),
      rawToken,
      inviteUrl,
    }
  }

  /**
   * Revokes or cancels an invitation.
   */
  static async revokeInvitation(params: {
    tenantId: string
    userId?: string
    invitationId?: string
    actorId: string
    actorName: string
    actorRole: string
    req?: Request | null
  }) {
    const { tenantId, userId, invitationId, actorId, actorName, actorRole, req } = params

    const invitation = await db.userInvitation.findFirst({
      where: {
        tenantId,
        ...(invitationId ? { id: invitationId } : { userId }),
      },
      include: { user: true },
    })

    if (!invitation) {
      // Check if there is a pending tenantUser to cancel
      if (userId) {
        const tu = await db.tenantUser.findFirst({
          where: { tenantId, userId, deletedAt: null },
          include: { user: true },
        })
        if (tu) {
          await db.tenantUser.update({
            where: { id: tu.id },
            data: { status: 'INACTIVE', deletedAt: new Date() },
          })
          return { success: true, message: `Invitation cancelled for ${tu.user.email}` }
        }
      }
      throw errNotFound('Invitation record not found', 'INVITATION_NOT_FOUND')
    }

    await db.$transaction(async (tx) => {
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'REVOKED' },
      })

      if (invitation.tenantUserId) {
        await tx.tenantUser.update({
          where: { id: invitation.tenantUserId },
          data: { status: 'INACTIVE', deletedAt: new Date() },
        })
      }
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId,
      actorName,
      actorRole,
      action: 'REVOKE_INVITATION',
      entity: 'UserInvitation',
      entityId: invitation.id,
      module: 'Users',
      severity: 'INFO',
      summary: `Revoked invitation for ${invitation.user.fullName} (${invitation.email})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return {
      success: true,
      message: `Invitation revoked for ${invitation.email}`,
    }
  }

  /**
   * Verifies an invitation token for the public onboarding screen.
   */
  static async verifyInvitation(token: string) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invitation token is missing' }
    }

    const tokenHash = this.hashToken(token)
    const invitation = await db.userInvitation.findFirst({
      where: { tokenHash },
      include: {
        user: true,
        tenant: true,
      },
    })

    if (!invitation) {
      return { valid: false, error: 'Invalid or unrecognized invitation link' }
    }

    if (invitation.status === 'REVOKED') {
      return { valid: false, error: 'This invitation has been cancelled by the school administration.' }
    }

    if (invitation.status === 'ACCEPTED') {
      return { valid: false, error: 'This invitation has already been accepted. Please sign in with your credentials.' }
    }

    const now = new Date()
    const isExpired = now >= invitation.expiresAt

    if (isExpired) {
      // Mark as expired in DB if not yet set
      if (invitation.status !== 'EXPIRED') {
        await db.userInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        }).catch(() => {})
      }
      return {
        valid: false,
        isExpired: true,
        error: `This invitation expired on ${invitation.expiresAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}. Please request a new invite from your school administrator.`,
        schoolName: invitation.tenant.name,
      }
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        fullName: invitation.user.fullName,
        username: invitation.user.username,
        role: invitation.role,
        schoolName: invitation.tenant.name,
        schoolCode: invitation.tenant.code,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    }
  }

  /**
   * Accepts the invitation, validates password, and activates account.
   */
  static async acceptInvitation(params: {
    token: string
    password: string
    username?: string
    req?: Request | null
  }) {
    const { token, password, username, req } = params

    const verify = await this.verifyInvitation(token)
    if (!verify.valid || !verify.invitation) {
      throw errBusiness('INVALID_INVITATION', verify.error || 'Invitation is invalid or expired')
    }

    // Password validation
    if (!password || password.length < 8) {
      throw errValidation(PASSWORD_POLICY.errorMessage, 'password')
    }

    const tokenHash = this.hashToken(token)
    const invitation = await db.userInvitation.findFirst({
      where: { tokenHash },
      include: { tenant: true, user: true, tenantUser: true },
    })

    if (!invitation) {
      throw errNotFound('Invitation not found', 'INVITATION_NOT_FOUND')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await db.$transaction(async (tx) => {
      // 1. Update user
      await tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          ...(username?.trim() ? { username: username.trim().toLowerCase() } : {}),
        },
      })

      // 2. Activate membership
      if (invitation.tenantUserId) {
        await tx.tenantUser.update({
          where: { id: invitation.tenantUserId },
          data: { status: 'ACTIVE' },
        })
      } else {
        await tx.tenantUser.updateMany({
          where: { tenantId: invitation.tenantId, userId: invitation.userId },
          data: { status: 'ACTIVE' },
        })
      }

      // 3. Mark invitation accepted
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      })
    })

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: invitation.tenantId,
      actorId: invitation.userId,
      actorName: invitation.user.fullName,
      actorRole: invitation.role,
      action: 'ACCEPT_INVITATION',
      entity: 'UserInvitation',
      entityId: invitation.id,
      module: 'Users',
      severity: 'INFO',
      summary: `Accepted invitation and activated account for ${invitation.user.fullName} (${invitation.email})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return {
      success: true,
      message: 'Account successfully activated! You may now sign in.',
      email: invitation.email,
    }
  }

  /**
   * Lists invitations for a school tenant with computed age, expiry countdown, and status.
   */
  static async listInvitations(params: {
    tenantId: string
    status?: string
    search?: string
    origin?: string
  }): Promise<{ invitations: InvitationListItem[]; kpis: InvitationKpis }> {
    const { tenantId, status, search, origin } = params
    const baseOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const now = new Date()

    // 1. Fetch invitations with related users, inviter, and staff profile
    const rawInvitations = await db.userInvitation.findMany({
      where: {
        tenantId,
        ...(status && status !== 'ALL'
          ? status === 'EXPIRED'
            ? { OR: [{ status: 'EXPIRED' }, { status: 'PENDING', expiresAt: { lte: now } }] }
            : status === 'PENDING'
            ? { status: 'PENDING', expiresAt: { gt: now } }
            : { status: status as any }
          : {}),
      },
      include: {
        user: true,
        invitedBy: true,
        tenantUser: {
          include: {
            staffProfile: true,
            assignedBranches: {
              include: { branch: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Also check for any pending TenantUsers that do not yet have a UserInvitation row (graceful backfill)
    const pendingMembersWithoutInvite = await db.tenantUser.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        deletedAt: null,
        invitations: { none: {} },
      },
      include: {
        user: true,
        staffProfile: true,
        assignedBranches: { include: { branch: true } },
      },
    })

    // Lazily create UserInvitation for legacy pending members
    for (const pm of pendingMembersWithoutInvite) {
      if (pm.user.email) {
        await this.createInvitation({
          tenantId,
          userId: pm.userId,
          tenantUserId: pm.id,
          email: pm.user.email,
          role: pm.role,
          origin,
          sendEmail: false,
        }).catch(() => {})
      }
    }

    // Re-fetch all if backfill happened
    const allInvitations = pendingMembersWithoutInvite.length > 0
      ? await db.userInvitation.findMany({
          where: { tenantId },
          include: {
            user: true,
            invitedBy: true,
            tenantUser: {
              include: {
                staffProfile: true,
                assignedBranches: { include: { branch: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : rawInvitations

    let kpis: InvitationKpis = {
      total: allInvitations.length,
      pending: 0,
      expiringSoon: 0,
      expired: 0,
      accepted: 0,
    }

    const items: InvitationListItem[] = allInvitations.map((inv) => {
      const isExpired = now >= inv.expiresAt
      const diffHours = (inv.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      const isExpiringSoon = !isExpired && diffHours <= EXPIRING_SOON_HOURS && inv.status === 'PENDING'

      let effectiveStatus: 'PENDING' | 'EXPIRING_SOON' | 'EXPIRED' | 'ACCEPTED' | 'REVOKED' = 'PENDING'
      if (inv.status === 'ACCEPTED') {
        effectiveStatus = 'ACCEPTED'
        kpis.accepted++
      } else if (inv.status === 'REVOKED') {
        effectiveStatus = 'REVOKED'
      } else if (isExpired || inv.status === 'EXPIRED') {
        effectiveStatus = 'EXPIRED'
        kpis.expired++
      } else if (isExpiringSoon) {
        effectiveStatus = 'EXPIRING_SOON'
        kpis.expiringSoon++
        kpis.pending++
      } else {
        effectiveStatus = 'PENDING'
        kpis.pending++
      }

      const invitedAge = formatRelativeTime(inv.createdAt, now)
      const expiresIn = isExpired
        ? `Expired ${formatRelativeTime(inv.expiresAt, now)}`
        : `Expires ${formatRelativeTime(inv.expiresAt, now)}`

      const primaryBranch = inv.tenantUser?.assignedBranches?.find((b) => b.isPrimary)?.branch ||
        inv.tenantUser?.assignedBranches?.[0]?.branch

      const inviteUrl = inv.rawToken ? `${baseOrigin}/invite?token=${inv.rawToken}` : null

      return {
        id: inv.id,
        invitationId: inv.id,
        userId: inv.userId,
        membershipId: inv.tenantUserId,
        fullName: inv.user.fullName,
        email: inv.email,
        phone: inv.user.phone,
        avatarUrl: inv.user.avatarUrl,
        role: inv.role,
        roles: inv.tenantUser?.roles && inv.tenantUser.roles.length > 0 ? inv.tenantUser.roles : [inv.role],
        branchId: inv.tenantUser?.branchId || null,
        branchName: primaryBranch?.name || null,
        designation: inv.tenantUser?.staffProfile?.designation || null,
        invitedById: inv.invitedById,
        invitedByName: inv.invitedBy?.fullName || 'Administrator',
        invitedAt: inv.createdAt.toISOString(),
        invitedAge,
        expiresAt: inv.expiresAt.toISOString(),
        expiresIn,
        isExpired,
        isExpiringSoon,
        effectiveStatus,
        status: inv.status,
        resendCount: inv.resendCount,
        lastResentAt: inv.lastResentAt ? inv.lastResentAt.toISOString() : null,
        inviteUrl,
      }
    })

    // Filter by search query if provided
    let filtered = items
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.fullName.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q) ||
          (i.designation && i.designation.toLowerCase().includes(q))
      )
    }

    // Filter by status if query was provided
    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        filtered = filtered.filter((i) => i.effectiveStatus === 'PENDING' || i.effectiveStatus === 'EXPIRING_SOON')
      } else if (status === 'EXPIRED') {
        filtered = filtered.filter((i) => i.effectiveStatus === 'EXPIRED')
      } else {
        filtered = filtered.filter((i) => i.effectiveStatus === status)
      }
    }

    return {
      invitations: filtered,
      kpis,
    }
  }
}

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { SessionService } from '@/lib/users/session-service'
import { PermissionCache } from '@/lib/cache/permission-cache'
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY } from '@/lib/auth'
import { emailService } from '@/lib/email/email-service'

function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%^&*'
  let pwd = ''
  pwd += upper[crypto.randomInt(upper.length)]
  pwd += lower[crypto.randomInt(lower.length)]
  pwd += digits[crypto.randomInt(digits.length)]
  pwd += special[crypto.randomInt(special.length)]
  const all = upper + lower + digits + special
  for (let i = 0; i < 8; i++) {
    pwd += all[crypto.randomInt(all.length)]
  }
  return pwd
}

/**
 * POST /api/v1/users/[id]/reset-password
 * Row-level admin action: resets password, enforces mustChangePassword,
 * invalidates existing sessions, and returns the temporary password.
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
    const body = await req.json().catch(() => ({}))
    const { password, sendEmail = true, mustChangePassword = true, reason } = body as {
      password?: string
      sendEmail?: boolean
      mustChangePassword?: boolean
      reason?: string
    }

    let rawPassword = password
    if (rawPassword !== undefined) {
      if (typeof rawPassword !== 'string' || rawPassword.length < MIN_PASSWORD_LENGTH) {
        return bad(PASSWORD_POLICY.copy, 'INVALID_PASSWORD_POLICY', 'password')
      }
    } else {
      rawPassword = generateTemporaryPassword()
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10)

    // Update user password and set mustChangePassword flag
    await db.user.update({
      where: { id: member.userId },
      data: {
        passwordHash,
        mustChangePassword: mustChangePassword !== false,
        updatedAt: new Date(),
      },
    })

    // Immediately revoke all existing sessions and bump tokenVersion
    await SessionService.bumpTokenVersion(member.userId, Date.now())
    await SessionService.revokeAllUserSessions(member.userId)
    PermissionCache.bumpUserVersion(member.userId)

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'ADMIN_PASSWORD_RESET',
      entity: 'User',
      entityId: member.userId,
      module: 'Users',
      severity: 'WARNING',
      summary: `Administrator ${session.name} reset password for user ${member.user.fullName}${reason ? `: ${reason}` : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    let emailSent = false
    if (sendEmail && member.user.email) {
      const origin = req.headers.get('origin') || 'http://localhost:3000'
      try {
        await emailService.send({
          to: member.user.email,
          subject: 'PreOne Account — Password Reset by Administrator',
          html: `<div style="font-family:sans-serif;padding:24px;"><h2>Password Reset Notification</h2><p>Hello ${member.user.fullName},</p><p>Your PreOne password has been reset by an administrator.</p><p>Temporary Password: <code>${rawPassword}</code></p><p>Please sign in at <a href="${origin}/auth/login">${origin}/auth/login</a> and change your password.</p></div>`,
          text: `Hello ${member.user.fullName},\n\nYour PreOne password has been reset by an administrator.\n\nTemporary Password: ${rawPassword}\n\nPlease sign in at ${origin}/auth/login.`,
          tenantId: session.tenantId,
        })
        emailSent = true
      } catch {
        // Non-fatal if email provider is mocked or offline
      }
    }

    return ok({
      success: true,
      userId: member.userId,
      temporaryPassword: rawPassword,
      mustChangePassword: true,
      emailSent,
      message: `Password reset successfully for ${member.user.fullName}`,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const POST = withApi(_POST)

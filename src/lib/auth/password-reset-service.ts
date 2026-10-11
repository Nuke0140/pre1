import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email/email-service'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'preone-dev-jwt-secret-2f8b7c9d4e6a1f3b5c8d0e'
)

export interface RequestResetResult {
  success: boolean
  message: string
}

export interface VerifyTokenResult {
  valid: boolean
  userId?: string
  email?: string
  error?: string
}

export class PasswordResetService {
  /**
   * Hashes a reset token for secure lookup and single-use invalidation.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Generates a signed, single-use, 1-hour expiration password reset token.
   */
  static async generateResetToken(user: { id: string; email: string; passwordHash: string }): Promise<string> {
    // Incorporate the first 16 chars of current passwordHash as a key derivation component;
    // this ensures that once the password changes, any previously issued tokens are automatically invalidated.
    const entropy = crypto.randomBytes(32).toString('hex')
    return new SignJWT({
      uid: user.id,
      email: user.email,
      entropy,
      sig: user.passwordHash.slice(0, 16),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('preone-auth')
      .setExpirationTime('1h')
      .sign(RESET_SECRET)
  }

  /**
   * Validates a password reset token.
   */
  static async verifyResetToken(token: string): Promise<VerifyTokenResult> {
    try {
      const { payload } = await jwtVerify(token, RESET_SECRET, { issuer: 'preone-auth' })
      const uid = payload.uid as string
      const sig = payload.sig as string

      const user = await db.user.findUnique({
        where: { id: uid },
        select: { id: true, email: true, passwordHash: true, status: true },
      })

      if (!user) {
        return { valid: false, error: 'User does not exist' }
      }

      if (user.status === 'LOCKED' || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
        return { valid: false, error: `Account is ${user.status.toLowerCase()}` }
      }

      // Check signature against current password hash to guarantee single-use
      if (user.passwordHash.slice(0, 16) !== sig) {
        return { valid: false, error: 'Reset token has already been used' }
      }

      return { valid: true, userId: user.id, email: user.email || '' }
    } catch {
      return { valid: false, error: 'Reset link is invalid or expired' }
    }
  }

  /**
   * Handles user password reset request with generic response (prevents account enumeration).
   */
  static async requestPasswordReset(identifier: string, origin = 'http://localhost:3000'): Promise<RequestResetResult> {
    const cleanId = identifier.trim().toLowerCase()
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: cleanId }, { username: cleanId }],
      },
      select: { id: true, email: true, fullName: true, passwordHash: true, status: true },
    })

    // Generic response regardless of whether user exists
    const genericResponse: RequestResetResult = {
      success: true,
      message: 'If an account exists with that identifier, a reset link has been dispatched.',
    }

    if (!user || !user.email || user.status !== 'ACTIVE') {
      return genericResponse
    }

    const token = await this.generateResetToken({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    })

    const resetLink = `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`

    // Dispatch via central email service
    await emailService.send({
      to: user.email,
      subject: 'PreOne Password Reset Request',
      html: `
        <div style="font-family:sans-serif;padding:24px;color:#1e293b;">
          <h2 style="color:#4f46e5;">PreOne Password Assistance</h2>
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p style="margin:24px 0;">
            <a href="${resetLink}" style="background-color:#4f46e5;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Reset Password</a>
          </p>
          <p style="color:#64748b;font-size:12px;">This link will expire in 1 hour. If you did not request this change, you can safely ignore this email.</p>
        </div>
      `,
      text: `Hello ${user.fullName},\n\nReset your PreOne password using this link: ${resetLink}\n\nThis link expires in 1 hour.`,
    })

    await audit({
      tenantId: null,
      actorId: user.id,
      actorName: user.fullName,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'User',
      entityId: user.id,
      module: 'AUTH',
      summary: `Password reset requested for ${user.email}`,
      severity: 'INFO',
    })

    return genericResponse
  }

  /**
   * Resets password using a verified token.
   */
  static async completePasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const verification = await this.verifyResetToken(token)
    if (!verification.valid || !verification.userId) {
      throw new Error(verification.error || 'Invalid or expired token')
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    // Atomically update password and reset mustChangePassword flag
    await db.user.update({
      where: { id: verification.userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    })

    // Invalidate all active sessions for this user
    await db.userSession.updateMany({
      where: { userId: verification.userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    })

    await audit({
      tenantId: null,
      actorId: verification.userId,
      actorName: verification.email || 'User',
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: verification.userId,
      module: 'AUTH',
      summary: `Password reset successfully completed for user ${verification.userId}`,
      severity: 'WARNING',
    })

    return {
      success: true,
      message: 'Password successfully updated. Please sign in with your new password.',
    }
  }
}

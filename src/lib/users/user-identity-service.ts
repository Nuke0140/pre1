import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { UsernameService, UsernameType, normalizeUsername } from './username-service'

export interface BaseIdentityOptions {
  fullName: string
  email?: string | null
  phone?: string | null
  username?: string
  password?: string
  status?: UserStatus
  usernameType: UsernameType
  avatarUrl?: string | null
  locale?: string
  mustChangePassword?: boolean
}

export interface TenantMembershipOptions {
  tenantId: string
  userId: string
  role: UserRole
  roles: UserRole[]
  branchId?: string | null
  branchIds?: string[]
  status: UserStatus
}

export class UserIdentityService {
  /**
   * Normalizes an email address.
   */
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Normalizes a phone number string.
   */
  static normalizePhone(phone?: string | null): string | null {
    if (!phone) return null
    const cleaned = phone.trim().replace(/[^\d+]/g, '')
    return cleaned || null
  }

  /**
   * Hashes a plaintext password using bcrypt with 10 salt rounds.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Resolves or creates a base User identity record.
   * Runs within an existing Prisma transaction client or standalone db.
   */
  static async resolveOrCreateUser(
    tx: Prisma.TransactionClient,
    opts: BaseIdentityOptions
  ): Promise<{ user: any; isNewUser: boolean }> {
    const emailNorm = opts.email && opts.email.trim() ? this.normalizeEmail(opts.email) : null
    const phoneNorm = this.normalizePhone(opts.phone)
    const initialStatus: UserStatus = opts.status || 'ACTIVE'

    let user: any = null
    if (emailNorm) {
      user = await tx.user.findUnique({
        where: { email: emailNorm },
      })
    }
    if (!user && opts.username?.trim()) {
      user = await tx.user.findUnique({
        where: { username: opts.username.trim().toLowerCase() },
      })
    }

    // Determine unique username
    let username = opts.username ? normalizeUsername(opts.username) : undefined
    if (user && user.username) {
      username = user.username
    } else if (!username) {
      username = await UsernameService.generateUniqueUsername({
        name: opts.fullName,
        type: opts.usernameType,
      })
    } else {
      // Validate provided username
      const available = await UsernameService.isUsernameAvailable(username, opts.usernameType)
      if (!available) {
        username = await UsernameService.generateUniqueUsername({
          name: opts.fullName,
          type: opts.usernameType,
          preferred: username,
        })
      }
    }

    // Determine password hash using CSPRNG when generated
    const isParentRole = opts.usernameType === 'PARENT' || opts.usernameType === 'GUARDIAN'
    const isGeneratedPassword = !opts.password || opts.password.trim().length < 8
    let rawPassword = opts.password ? opts.password.trim() : ''
    if (isGeneratedPassword) {
      const entropy = typeof crypto?.randomBytes === 'function'
        ? crypto.randomBytes(6).toString('hex')
        : 'S3cure' + Date.now().toString(36)
      rawPassword = `PreOne@${entropy}`
    }
    const passwordHash = await this.hashPassword(rawPassword)

    const effectiveMustChangePassword = opts.mustChangePassword !== undefined
      ? (isParentRole ? false : opts.mustChangePassword)
      : (isParentRole ? false : isGeneratedPassword)

    if (!user) {
      user = await tx.user.create({
        data: {
          email: emailNorm,
          username,
          phone: phoneNorm,
          fullName: opts.fullName.trim(),
          avatarUrl: opts.avatarUrl?.trim() || null,
          passwordHash,
          mustChangePassword: effectiveMustChangePassword,
          status: initialStatus,
          ...(opts.locale ? { locale: opts.locale } : {}),
        },
      })
      return { user, isNewUser: true }
    } else {
      // Update phone if previously unset
      const needsNameUpdate = Boolean(opts.fullName?.trim()) && user.fullName !== opts.fullName.trim()
      const needsPhoneUpdate = !user.phone && phoneNorm
      const needsUsernameUpdate = !user.username && username
      const needsAvatarUpdate = !user.avatarUrl && opts.avatarUrl?.trim()
      const needsLocaleUpdate = Boolean(opts.locale) && user.locale !== opts.locale
      const needsPasswordFlagClear = isParentRole && user.mustChangePassword

      if (needsNameUpdate || needsPhoneUpdate || needsUsernameUpdate || needsAvatarUpdate || needsLocaleUpdate || needsPasswordFlagClear) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            ...(needsNameUpdate ? { fullName: opts.fullName.trim() } : {}),
            ...(needsPhoneUpdate ? { phone: phoneNorm } : {}),
            ...(needsUsernameUpdate ? { username } : {}),
            ...(needsAvatarUpdate ? { avatarUrl: opts.avatarUrl!.trim() } : {}),
            ...(needsLocaleUpdate ? { locale: opts.locale } : {}),
            ...(needsPasswordFlagClear ? { mustChangePassword: false } : {}),
          },
        })
      }

      return { user, isNewUser: false }
    }
  }

  /**
   * Creates or activates a TenantUser membership record and syncs multi-branch assignments.
   */
  static async createOrUpdateMembership(
    tx: Prisma.TransactionClient,
    opts: TenantMembershipOptions
  ): Promise<any> {
    const existingMembership = await tx.tenantUser.findFirst({
      where: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        deletedAt: null,
      },
    })

    let membership: any
    if (existingMembership) {
      // Merge roles if membership exists
      const mergedRoles = [...new Set([...existingMembership.roles, ...opts.roles])]
      membership = await tx.tenantUser.update({
        where: { id: existingMembership.id },
        data: {
          role: opts.role,
          roles: mergedRoles,
          status: opts.status,
          ...(opts.branchId !== undefined ? { branchId: opts.branchId } : {}),
        },
      })
    } else {
      membership = await tx.tenantUser.create({
        data: {
          tenantId: opts.tenantId,
          userId: opts.userId,
          role: opts.role,
          roles: opts.roles,
          branchId: opts.branchId || null,
          status: opts.status,
        },
      })
    }

    if (opts.branchIds !== undefined || opts.branchId !== undefined) {
      await UserIdentityService.syncTenantUserBranches(tx, {
        tenantId: opts.tenantId,
        tenantUserId: membership.id,
        primaryBranchId: membership.branchId,
        branchIds: opts.branchIds !== undefined ? opts.branchIds : (membership.branchId ? [membership.branchId] : []),
      })
    }

    return membership
  }

  /**
   * Synchronizes multi-branch assignments in TenantUserBranch junction table (Doc 2.2 P2 Audit)
   */
  static async syncTenantUserBranches(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: string
      tenantUserId: string
      primaryBranchId?: string | null
      branchIds?: string[]
    }
  ): Promise<void> {
    const { tenantId, tenantUserId, primaryBranchId, branchIds } = params

    const distinctBranches = new Set<string>()
    if (primaryBranchId) distinctBranches.add(primaryBranchId)
    if (Array.isArray(branchIds)) {
      for (const id of branchIds) {
        if (id && typeof id === 'string' && id.trim()) {
          distinctBranches.add(id.trim())
        }
      }
    }

    // Remove obsolete junction records
    await (tx as any).tenantUserBranch.deleteMany({
      where: {
        tenantUserId,
        branchId: { notIn: Array.from(distinctBranches) },
      },
    })

    // Upsert current branches
    for (const bId of distinctBranches) {
      const isPrimary = Boolean(primaryBranchId && bId === primaryBranchId)
      await (tx as any).tenantUserBranch.upsert({
        where: {
          tenantUserId_branchId: {
            tenantUserId,
            branchId: bId,
          },
        },
        create: {
          tenantId,
          tenantUserId,
          branchId: bId,
          isPrimary,
        },
        update: {
          isPrimary,
        },
      })
    }
  }
}

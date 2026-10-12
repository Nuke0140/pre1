import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'
import { audit, getRequestMeta } from '@/lib/audit'
import { SessionService } from '@/lib/users/session-service'

import {
  getFailedAttempts,
  recordFailedAttempt,
  resetFailedAttempts,
  recordPersistentFailedAttempt,
  getPersistentFailedAttempts,
  resetPersistentFailedAttempts,
  MAX_CONSECUTIVE_FAILURES,
} from '@/lib/auth/lockout-tracker'

export const POST = withApi(
  async (req: NextRequest) => {
    try {
      const meta = getRequestMeta(req)
      const body = await req.json().catch(() => null)
      const {
        identifier,
        email,
        username,
        password,
        schoolCode,
      } = (body || {}) as {
        identifier?: string
        email?: string
        username?: string
        password?: string
        schoolCode?: string
      }

      const loginId = (identifier || email || username || '').toLowerCase().trim()
      if (!loginId || !password) {
        return Errors.validation('Username or email and password are required')
      }

      const cleanSchoolCode = schoolCode?.trim().toUpperCase()

      // Find user by either email or username (UAM-E7, UAM-E13)
      const user = await db.user.findFirst({
        where: {
          OR: [{ email: loginId }, { username: loginId }],
        },
        include: {
          memberships: {
            include: { tenant: true },
            where: { deletedAt: null },
          },
        },
      })

      if (!user || user.deletedAt) {
        recordFailedAttempt(loginId)
        await audit({
          tenantId: null,
          actorName: loginId,
          action: 'LOGIN_FAILED',
          entity: 'User',
          module: 'AUTH',
          summary: `Failed login attempt for ${loginId} (user not found)`,
          severity: 'WARNING',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          requestId: meta.requestId,
        })
        return Errors.business('AUTH_003', 'Invalid credentials', 401)
      }

      // For resolved users, persistent database tracking is authoritative across all serverless instances
      const currentFailures = await getPersistentFailedAttempts(user.id)

      // Resolve targeted school membership if schoolCode was specified
      let membership = user.memberships[0]
      if (cleanSchoolCode) {
        const matchingMembership = user.memberships.find(
          (m) => m.tenant?.code?.toUpperCase() === cleanSchoolCode
        )
        if (!matchingMembership && user.memberships.length > 0) {
          // Cross-tenant mismatch protection: user doesn't belong to the supplied school code
          await recordPersistentFailedAttempt(user.id)
          recordFailedAttempt(user.id)
          recordFailedAttempt(loginId)
          await audit({
            tenantId: user.memberships[0]?.tenantId ?? null,
            actorId: user.id,
            actorName: user.fullName,
            action: 'LOGIN_FAILED',
            entity: 'User',
            entityId: user.id,
            module: 'AUTH',
            summary: `Login rejected for ${loginId}: school code ${cleanSchoolCode} does not match user memberships`,
            severity: 'WARNING',
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            requestId: meta.requestId,
          })
          return Errors.business('AUTH_003', 'Invalid credentials or school code', 401)
        }
        if (matchingMembership) {
          membership = matchingMembership
        }
      }

      // Check account status
      if (user.status === 'LOCKED') {
        return Errors.business(
          'ACCOUNT_LOCKED',
          'Account has been locked after 5 consecutive failed login attempts. Contact an administrator to unlock.',
          423
        )
      }

      if (user.status === 'SUSPENDED') {
        return Errors.business('ACCOUNT_SUSPENDED', 'Your account has been suspended.', 403)
      }

      if (user.status === 'DEACTIVATED' || (user.status as string) === 'INACTIVE') {
        return Errors.business('ACCOUNT_DEACTIVATED', 'Your account has been deactivated.', 403)
      }

      if (user.status === 'ARCHIVED') {
        return Errors.business('ACCOUNT_ARCHIVED', 'Your account has been archived.', 403)
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        // Authoritative atomic sliding-window increment in PostgreSQL
        const nextFailures = await recordPersistentFailedAttempt(user.id)

        // Check auto-lock threshold
        if (nextFailures >= MAX_CONSECUTIVE_FAILURES) {
          await db.$transaction([
            db.user.update({
              where: { id: user.id },
              data: { status: 'LOCKED', updatedAt: new Date() },
            }),
            db.tenantUser.updateMany({
              where: { userId: user.id, deletedAt: null },
              data: { status: 'LOCKED', updatedAt: new Date() },
            }),
          ])
          await SessionService.revokeAllUserSessions(user.id)

          await audit({
            tenantId: membership?.tenantId ?? null,
            actorId: user.id,
            actorName: user.fullName,
            action: 'ACCOUNT_LOCKED',
            entity: 'User',
            entityId: user.id,
            module: 'AUTH',
            summary: `User ${user.fullName} locked after ${nextFailures} failed login attempts`,
            severity: 'CRITICAL',
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            requestId: meta.requestId,
            newValues: { status: 'LOCKED', consecutiveFailures: nextFailures },
          })

          return Errors.business(
            'ACCOUNT_LOCKED',
            'Account has been locked after 5 consecutive failed login attempts. Contact an administrator to unlock.',
            423
          )
        }

        await audit({
          tenantId: membership?.tenantId ?? null,
          actorId: user.id,
          actorName: user.fullName,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          module: 'AUTH',
          summary: `Failed login attempt for ${loginId} (invalid password - attempt ${nextFailures}/${MAX_CONSECUTIVE_FAILURES})`,
          severity: 'WARNING',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          requestId: meta.requestId,
          newValues: { consecutiveFailures: nextFailures },
        })

        return Errors.business('AUTH_003', 'Invalid credentials', 401)
      }

      // Successful login -> clear failure tracker for user ID and login identifiers
      await resetPersistentFailedAttempts(user.id)
      resetFailedAttempts(user.id, user.email, user.username, loginId)

      if (membership) {
        if (membership.status === 'SUSPENDED') {
          return Errors.business('ACCOUNT_SUSPENDED', 'Your account has been suspended.', 403)
        }
        if (membership.status === 'DEACTIVATED' || (membership.status as string) === 'INACTIVE') {
          return Errors.business('ACCOUNT_DEACTIVATED', 'Your account has been deactivated.', 403)
        }
        if (membership.status === 'ARCHIVED') {
          return Errors.business('ACCOUNT_ARCHIVED', 'Your account has been archived.', 403)
        }
        if (membership.status === 'LOCKED') {
          return Errors.business(
            'ACCOUNT_LOCKED',
            'Account has been locked after 5 consecutive failed login attempts. Contact an administrator to unlock.',
            423
          )
        }
      }

      // No school membership -> platform-level staff (client onboarding console)
      if (!membership) {
        const token = await signSession({
          uid: user.id,
          email: user.email || '',
          name: user.fullName,
          tenantId: null,
          branchId: null,
          role: 'PLATFORM_ADMIN',
          mustChangePassword: Boolean((user as any).mustChangePassword),
        })
        // Resilient post-auth updates
        try {
          await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        } catch (dbErr) {
          // Non-fatal: lastLoginAt update failure should not break active login
        }

        // Register session in user_sessions table
        const sessionRecord = await SessionService.createSession({
          userId: user.id,
          tenantId: null,
          token,
          req,
        })

        if (!sessionRecord) {
          return Errors.system(new Error('Failed to establish user session'))
        }

        await audit({
          tenantId: null,
          actorId: user.id,
          actorName: user.fullName,
          actorRole: 'PLATFORM_ADMIN',
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          module: 'AUTH',
          summary: `${user.fullName} signed into Platform Console`,
          severity: 'INFO',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          requestId: meta.requestId,
        })

        const res = ok({
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
            username: user.username,
            role: 'PLATFORM_ADMIN',
            tenant: null,
            branch: null,
            mustChangePassword: Boolean((user as any).mustChangePassword),
          },
        })
        res.cookies.set(SESSION_COOKIE, token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: SESSION_MAX_AGE,
          path: '/',
        })
        return res
      }

      const branch = membership.branchId
        ? await db.branch.findUnique({ where: { id: membership.branchId } })
        : await db.branch.findFirst({ where: { tenantId: membership.tenantId, isMain: true } })

      const primaryRole = normalizeRole(membership.role)
      const allRoles: string[] = [primaryRole]
      if (Array.isArray(membership.roles)) {
        allRoles.push(...membership.roles)
      }
      const effectiveRoles = Array.from(new Set(allRoles.map((r) => normalizeRole(r)))) as Role[]

      const token = await signSession({
        uid: user.id,
        email: user.email || '',
        name: user.fullName,
        tenantId: membership.tenantId,
        branchId: branch?.id ?? null,
        role: primaryRole,
        roles: effectiveRoles,
        mustChangePassword: Boolean((user as any).mustChangePassword),
      })

      // Resilient post-auth updates
      try {
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      } catch (dbErr) {
        // Non-fatal: lastLoginAt update failure should not break active login
      }

      // Register session in user_sessions table
      const sessionRecord = await SessionService.createSession({
        userId: user.id,
        tenantId: membership.tenantId,
        token,
        req,
      })

      if (!sessionRecord) {
        return Errors.system(new Error('Failed to establish user session'))
      }

      await audit({
        tenantId: membership.tenantId,
        branchId: branch?.id ?? null,
        actorId: user.id,
        actorName: user.fullName,
        actorRole: primaryRole,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        module: 'AUTH',
        summary: `${user.fullName} signed in (${effectiveRoles.join(', ')})`,
        severity: 'INFO',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      })

      const res = ok({
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          username: user.username,
          role: primaryRole,
          roles: effectiveRoles,
          tenant: { id: membership.tenantId, name: membership.tenant.name },
          branch: branch ? { id: branch.id, name: branch.name } : null,
          mustChangePassword: Boolean((user as any).mustChangePassword),
        },
      })

      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })
      return res
    } catch (e) {
      return Errors.system(e)
    }
  },
  { module: 'auth' }
)

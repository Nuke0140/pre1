import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, Role } from '@/lib/auth'
import { audit } from '@/lib/sequence'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { email, password } = (body || {}) as { email?: string; password?: string }
    if (!email || !password) {
      return Errors.validation('Email and password are required')
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: { tenant: true },
          where: { deletedAt: null },
        },
      },
    })

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      return Errors.business('AUTH_003', 'Invalid email or password', 401)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return Errors.business('AUTH_003', 'Invalid email or password', 401)
    }

    const membership = user.memberships[0]

    // No school membership → platform-level staff (client onboarding console).
    if (!membership) {
      const token = await signSession({
        uid: user.id,
        email: user.email,
        name: user.fullName,
        tenantId: null,
        branchId: null,
        role: 'PLATFORM_ADMIN',
      })
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

      const res = ok({
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: 'PLATFORM_ADMIN',
          tenant: null,
          branch: null,
        },
      })
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })
      return res
    }

    const branch = membership.branchId
      ? await db.branch.findUnique({ where: { id: membership.branchId } })
      : await db.branch.findFirst({ where: { tenantId: membership.tenantId, isMain: true } })

    const token = await signSession({
      uid: user.id,
      email: user.email,
      name: user.fullName,
      tenantId: membership.tenantId,
      branchId: branch?.id ?? null,
      role: membership.role as Role,
    })

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await audit({
      tenantId: membership.tenantId,
      actorId: user.id,
      actorName: user.fullName,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      summary: `${user.fullName} signed in`,
    })

    const res = ok({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: membership.role,
        tenant: { id: membership.tenantId, name: membership.tenant.name },
        branch: branch ? { id: branch.id, name: branch.name } : null,
      },
    })

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return res
  } catch (e) {
    return Errors.system(e)
  }
}

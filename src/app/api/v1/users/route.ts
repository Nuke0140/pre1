import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** GET /api/v1/users — staff directory (users:read) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const members = await db.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    })
    return ok(
      members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.fullName,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        status: m.status,
        lastLoginAt: m.user.lastLoginAt,
      }))
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/users — invite staff user with role (users:write) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { fullName, email, password, role, phone } = body as {
      fullName: string
      email: string
      password: string
      role: 'PRINCIPAL' | 'COORDINATOR' | 'TEACHER' | 'ACCOUNTS' | 'RECEPTION'
      phone?: string
    }
    if (!fullName || !email || !password || !role) {
      return Errors.validation('fullName, email, password and role are required')
    }
    if (role === 'PLATFORM_ADMIN' || role === 'OWNER' || role === 'PARENT') {
      return Errors.forbidden('Cannot assign this role here')
    }

    const exists = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) {
      // already a user → add membership
      const tenantIds = await db.tenantUser.findMany({
        where: { userId: exists.id },
        select: { tenantId: true },
      })
      if (tenantIds.some((t) => t.tenantId === session.tenantId)) {
        return Errors.conflict('User already belongs to this school')
      }
      const m = await db.tenantUser.create({
        data: { tenantId: session.tenantId, userId: exists.id, role },
      })
      return ok({ membershipId: m.id, reused: true }, undefined, 201)
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        phone: phone || null,
        passwordHash: await bcrypt.hash(password, 10),
        status: 'ACTIVE',
      },
    })
    const membership = await db.tenantUser.create({
      data: { tenantId: session.tenantId, userId: user.id, role },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      summary: `Staff added: ${fullName} (${role})`,
    })

    return ok({ userId: user.id, membershipId: membership.id }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

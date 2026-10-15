import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { SessionService } from '@/lib/users/session-service'
import { PermissionCache } from '@/lib/cache/permission-cache'

/**
 * GET /api/v1/users/[id]/sessions — list active sessions & connected devices for target user (Admin)
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    const rawSessions = await SessionService.getUserSessions(member.userId)

    const sessions = rawSessions.map((s) => ({
      id: s.id,
      device: s.device,
      platform: s.platform,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      status: s.status,
    }))

    return ok(sessions)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * DELETE /api/v1/users/[id]/sessions — revoke a specific session (per-device) or all sessions (Admin)
 * Query: ?sessionId=<id> or JSON body: { sessionId: "<id>" }
 */
async function _DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember: member } = manageCheck

  try {
    if (member.role === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
      return forbidden('Only owners can revoke sessions of school owner')
    }

    const url = new URL(req.url)
    let sessionId = url.searchParams.get('sessionId')

    if (!sessionId && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json()
        sessionId = body?.sessionId || null
      } catch {
        // empty body
      }
    }

    const meta = getRequestMeta(req)

    if (sessionId) {
      // Per-device revocation
      const revoked = await SessionService.revokeSession(sessionId, member.userId)
      if (!revoked) {
        return notFound('Session not found or already revoked')
      }

      await recordAudit({
        tenantId: session.tenantId,
        branchId: member.branchId || undefined,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'REVOKE_DEVICE_SESSION',
        entity: 'UserSession',
        entityId: sessionId,
        module: 'USERS',
        severity: 'WARNING',
        summary: `Revoked device session (${sessionId}) for user ${member.user.fullName}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        newValues: { sessionId, userId: member.userId },
      })

      return ok({ revoked: true, sessionId, userId: member.userId })
    }

    // Nuclear revocation: all devices
    await SessionService.bumpTokenVersion(member.userId)
    const revokedCount = await SessionService.revokeAllUserSessions(member.userId)
    PermissionCache.bumpUserVersion(member.userId)

    await db.user.update({
      where: { id: member.userId },
      data: { updatedAt: new Date() },
    })

    await recordAudit({
      tenantId: session.tenantId,
      branchId: member.branchId || undefined,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'REVOKE_SESSIONS',
      entity: 'User',
      entityId: member.userId,
      module: 'USERS',
      severity: 'WARNING',
      summary: `Revoked all active sessions (${revokedCount}) for user ${member.user.fullName}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: { revokedSessionsCount: revokedCount },
    })

    return ok({ revoked: true, userId: member.userId, revokedCount })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const DELETE = withApi(_DELETE)

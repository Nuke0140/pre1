import { NextRequest } from 'next/server'
import { SessionPayload, can } from './auth'
import { getSession } from './auth-server'
import { Errors } from './api'
import { AuditService } from './audit/audit-service'

/**
 * Guard for API route handlers — returns session or returns an HTTP Error Response.
 * Automatically audits AUTHORIZATION_FAILED on unauthorized access attempts.
 */
export async function requireApi(
  req: NextRequest,
  permission?: string
): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) return Errors.unauthorized()

  if (permission && !can(session.role, permission)) {
    // Record security event for unauthorized attempt
    await AuditService.recordSecurityEvent({
      action: 'AUTHORIZATION_FAILED',
      entity: 'Permission',
      entityId: permission,
      module: 'AUTH',
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      tenantId: session.tenantId,
      summary: `Authorization denied for role ${session.role}: requires ${permission}`,
      severity: 'WARNING',
      req,
      details: {
        path: req.nextUrl.pathname,
        method: req.method,
        requiredPermission: permission,
      },
    })

    return Errors.forbidden(`Missing permission: ${permission}`)
  }

  return session
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response
}

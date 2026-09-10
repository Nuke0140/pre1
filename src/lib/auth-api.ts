import { NextRequest } from 'next/server'
import { SessionPayload, can } from './auth'
import { getSession } from './auth-server'
import { Errors } from './api'

/** Guard for API route handlers — returns session or throws a Response. */
export async function requireApi(
  _req: NextRequest,
  permission?: string
): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) return Errors.unauthorized()
  if (permission && !can(session.role, permission)) {
    return Errors.forbidden(`Missing permission: ${permission}`)
  }
  return session
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response
}

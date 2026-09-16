import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE, SessionPayload } from './auth'

/** Server-only: read the session from cookies (server components / route handlers) or request headers. */
export async function getSession(req?: Request | null): Promise<SessionPayload | null> {
  // 1. Try Authorization: Bearer <token>
  if (req) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()
      const session = await verifySession(token)
      if (session) return session
    }

    // 2. Try Cookie header directly from request
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`))
      if (match && match[1]) {
        const session = await verifySession(decodeURIComponent(match[1]))
        if (session) return session
      }
    }
  }

  // 3. Fallback to next/headers cookies()
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    return verifySession(token)
  } catch {
    return null
  }
}

import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE, SessionPayload } from './auth'

/** Server-only: read the session from cookies (server components / route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { SESSION_COOKIE } from '@/lib/auth'
import { SessionService } from '@/lib/users/session-service'

export const POST = withApi(async (req: NextRequest) => {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await SessionService.revokeSessionByToken(token)
    } catch {
      // Non-fatal
    }
  }
  const res = ok({ loggedOut: true })
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
  return res
}, { module: 'auth' })

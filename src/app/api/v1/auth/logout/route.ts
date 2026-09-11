import { ok } from '@/lib/api'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  const res = ok({ loggedOut: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return res
}

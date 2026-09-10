import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = ['/api/v1/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const isProtectedPage = pathname.startsWith('/app') || pathname.startsWith('/onboard')
  const isProtectedApi =
    pathname.startsWith('/api/v1/') && !pathname.startsWith('/api/v1/auth/login')

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySession(token) : null

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_001', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/onboard/:path*', '/api/v1/:path*'],
}

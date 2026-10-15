import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/branding',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/otp',
  '/api/v1/auth/otp/send',
  '/api/v1/auth/otp/verify',
  '/api/v1/auth/otp/resend',
  '/api/v1/auth/mfa',
  '/api/v1/auth/invitation',
  '/api/v1/health',
  '/api/health',
  '/api/v1/version',
  '/api/version',
  '/api/v1/operations/health',
  '/api/v1/public',
  '/api/v1/webhooks',
]

function resolveTraceId(req: NextRequest): string {
  const incoming = req.headers.get('x-trace-id') || req.headers.get('traceparent')
  if (incoming && incoming.startsWith('PRE-')) {
    return incoming
  }
  return 'PRE-' + Math.random().toString(16).substring(2, 10).toUpperCase().padEnd(8, '0')
}

function applySecurityHeaders<T extends NextResponse>(res: T, traceId: string): T {
  res.headers.set('X-Trace-Id', traceId)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const traceId = resolveTraceId(req)

  // Propagate traceId through request headers for downstream API routes & components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-trace-id', traceId)

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    return applySecurityHeaders(res, traceId)
  }

  const isProtectedPage = pathname.startsWith('/app') || pathname.startsWith('/onboard')
  const isProtectedApi =
    pathname.startsWith('/api/v1/') && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    return applySecurityHeaders(res, traceId)
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySession(token) : null

  if (!session) {
    if (isProtectedApi) {
      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
          traceId,
        },
        {
          status: 401,
          headers: {
            'X-Trace-Id': traceId,
            'X-API-Version': '1.0.0',
          },
        }
      )
      return applySecurityHeaders(res, traceId)
    }
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('next', pathname)
    const redirectRes = NextResponse.redirect(url)
    return applySecurityHeaders(redirectRes, traceId)
  }

  // If user must change password, restrict browser page access to /app/change-password
  if (session.mustChangePassword && isProtectedPage && !pathname.startsWith('/app/change-password')) {
    const url = req.nextUrl.clone()
    url.pathname = '/app/change-password'
    url.search = ''
    const redirectRes = NextResponse.redirect(url)
    return applySecurityHeaders(redirectRes, traceId)
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  return applySecurityHeaders(res, traceId)
}

export const config = {
  matcher: ['/app/:path*', '/onboard/:path*', '/api/v1/:path*'],
}

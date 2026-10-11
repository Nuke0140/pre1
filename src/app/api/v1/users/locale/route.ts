import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { isSupportedLocale, normalizeLocale } from '@/lib/i18n/types'
import { cookies } from 'next/headers'

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { locale } = body

    if (!locale || !isSupportedLocale(locale)) {
      return NextResponse.json({ success: false, error: 'Invalid or unsupported locale' }, { status: 400 })
    }

    const normLocale = normalizeLocale(locale)

    // Update user locale in database
    await db.user.update({
      where: { id: session.uid },
      data: { locale: normLocale },
    })

    // Also set locale cookie for immediate server-side rendering
    const cookieStore = await cookies()
    cookieStore.set('preone_locale', normLocale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
    })

    return NextResponse.json({
      success: true,
      data: { locale: normLocale },
    })
  } catch (err: any) {
    console.error('[locale-update] Error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 })
  }
}

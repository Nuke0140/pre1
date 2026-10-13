import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { OnboardClient } from './OnboardClient'
import { ToastProvider } from '@/components/preone/Toast'
import { I18nProvider } from '@/lib/i18n/context'
import { DEFAULT_LOCALE, isSupportedLocale, normalizeLocale } from '@/lib/i18n/types'

export default async function OnboardPage() {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role !== 'PLATFORM_ADMIN') redirect('/app/dashboard')

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { locale: true },
  })

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('preone_locale')?.value
  const initialLocale = user?.locale && isSupportedLocale(user.locale)
    ? normalizeLocale(user.locale)
    : cookieLocale && isSupportedLocale(cookieLocale)
      ? normalizeLocale(cookieLocale)
      : DEFAULT_LOCALE

  const tenants = await db.tenant.findMany({
    include: { _count: { select: { students: true, branches: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <I18nProvider initialLocale={initialLocale}>
      <ToastProvider>
      <OnboardClient
        user={{ name: session.name, email: session.email }}
        tenants={tenants.map((t) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          city: t.city,
          status: t.status,
          plan: t.subscriptionPlan,
          students: t._count.students,
          branches: t._count.branches,
          onboardedAt: t.onboardedAt ? t.onboardedAt.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </ToastProvider>
  </I18nProvider>
)
}

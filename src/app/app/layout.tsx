import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { AppShell } from '@/components/shell/AppShell'
import { ToastProvider } from '@/components/preone/Toast'
import { getEffectiveBranding } from '@/lib/branding-service'
import { I18nProvider } from '@/lib/i18n/context'
import { normalizeLocale } from '@/lib/i18n/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role === 'PLATFORM_ADMIN') redirect('/onboard')

  let tenantName = 'PreOne'
  let branchName: string | null = null
  let branding = undefined
  let initialLocale = 'en-IN'

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { locale: true },
  })
  if (user?.locale) {
    initialLocale = user.locale
  }

  if (session.tenantId) {
    const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } })
    if (!tenant) {
      redirect('/')
    }
    branding = await getEffectiveBranding(session.tenantId)
    tenantName = branding?.schoolName || tenant.name || 'PreOne'

    if (!user?.locale && tenant.locale) {
      initialLocale = tenant.locale
    }

    if (session.branchId) {
      const branch = await db.branch.findUnique({ where: { id: session.branchId } })
      branchName = branch?.name ?? null
    }
  }

  const primary = branding?.primaryColor || '#7C3AED'
  const accent = branding?.accentColor || '#3B82F6'

  const dynamicThemeCss = `
    :root {
      --preone-primary: ${primary};
      --preone-primary-hover: color-mix(in srgb, ${primary} 85%, black);
      --preone-primary-active: color-mix(in srgb, ${primary} 70%, black);
      --preone-primary-soft: color-mix(in srgb, ${primary} 10%, white);
      --preone-primary-muted: color-mix(in srgb, ${primary} 40%, white);
      --primary: ${primary};
      --primary-hover: color-mix(in srgb, ${primary} 85%, black);
      --primary-active: color-mix(in srgb, ${primary} 70%, black);
      --primary-light: color-mix(in srgb, ${primary} 10%, white);
      --accent: ${accent};
      --accent-light: color-mix(in srgb, ${accent} 12%, white);
      --po-primary: ${primary};
      --po-primary-dark: color-mix(in srgb, ${primary} 85%, black);
      --po-primary-soft: color-mix(in srgb, ${primary} 12%, white);
      --canvas-wash-primary: color-mix(in srgb, ${primary} 7.5%, transparent);
      --canvas-wash-secondary: color-mix(in srgb, ${accent} 2.5%, transparent);
      --canvas-wash-accent: color-mix(in srgb, #34D399 1.5%, transparent);
      --card-hover-border: ${primary};
      --brand-ambient-wash: radial-gradient(1200px 520px at 50% -80px, var(--canvas-wash-primary) 0%, transparent 100%),
        radial-gradient(800px 400px at 85% -40px, var(--canvas-wash-secondary) 0%, transparent 100%),
        radial-gradient(900px 450px at 15% 100%, var(--canvas-wash-accent) 0%, transparent 100%);
    }
    [data-theme="dark"],
    .dark {
      --primary-dark: color-mix(in srgb, ${primary} 85%, #FFFFFF 15%);
      --primary-hover-dark: color-mix(in srgb, ${primary} 75%, #FFFFFF 25%);
      --preone-primary: var(--primary-dark);
      --preone-primary-hover: var(--primary-hover-dark);
      --preone-primary-soft: color-mix(in srgb, ${primary} 20%, transparent);
      --preone-primary-muted: color-mix(in srgb, ${primary} 26%, #151D2E);
      --primary: var(--primary-dark);
      --primary-hover: var(--primary-hover-dark);
      --primary-light: color-mix(in srgb, ${primary} 20%, transparent);
      --accent: color-mix(in srgb, ${accent} 85%, #FFFFFF 15%);
      --accent-light: color-mix(in srgb, ${accent} 20%, transparent);
      --canvas-wash-primary: color-mix(in srgb, var(--primary-dark) 9.5%, transparent);
      --canvas-wash-secondary: color-mix(in srgb, ${accent} 2.5%, transparent);
      --canvas-wash-accent: color-mix(in srgb, #34D399 1.5%, transparent);
      --card-hover-border: var(--primary-dark);
      --brand-ambient-wash: radial-gradient(1200px 520px at 50% -80px, var(--canvas-wash-primary) 0%, transparent 100%),
        radial-gradient(800px 420px at 85% -40px, var(--canvas-wash-secondary) 0%, transparent 100%),
        radial-gradient(900px 450px at 15% 100%, var(--canvas-wash-accent) 0%, transparent 100%);
    }
  `

  return (
    <I18nProvider initialLocale={initialLocale}>
      <ToastProvider>
        <style dangerouslySetInnerHTML={{ __html: dynamicThemeCss }} />
        <AppShell
          user={{
            name: session.name,
            email: session.email,
            role: session.role,
            tenantName,
            branchName,
          }}
          branding={branding}
        >
          {children}
        </AppShell>
      </ToastProvider>
    </I18nProvider>
  )
}

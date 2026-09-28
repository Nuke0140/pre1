import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { AppShell } from '@/components/shell/AppShell'
import { ToastProvider } from '@/components/preone/Toast'
import { getEffectiveBranding } from '@/lib/branding-service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role === 'PLATFORM_ADMIN') redirect('/onboard')

  let tenantName = 'PreOne'
  let branchName: string | null = null
  let branding = undefined

  if (session.tenantId) {
    branding = await getEffectiveBranding(session.tenantId)
    tenantName = branding.schoolName || 'PreOne'

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
      --po-primary-ultra-soft: color-mix(in srgb, ${primary} 5%, white);
      --card-hover-border: ${primary};
    }
  `

  return (
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
  )
}

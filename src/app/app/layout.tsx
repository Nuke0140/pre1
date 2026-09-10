import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { AppShell } from '@/components/shell/AppShell'
import { ToastProvider } from '@/components/preone/Toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role === 'PLATFORM_ADMIN') redirect('/onboard')

  let tenantName = 'PreOne'
  let branchName: string | null = null
  if (session.tenantId) {
    const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } })
    tenantName = tenant?.name ?? 'PreOne'
    const branch = session.branchId
      ? await db.branch.findUnique({ where: { id: session.branchId } })
      : null
    branchName = branch?.name ?? null
  }

  return (
    <ToastProvider>
      <AppShell
        user={{
          name: session.name,
          email: session.email,
          role: session.role,
          tenantName,
          branchName,
        }}
      >
        {children}
      </AppShell>
    </ToastProvider>
  )
}

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { HomeClient } from './HomeClient'

export default async function HomePage() {
  const session = await getSession()
  if (!session?.tenantId) redirect('/')

  let tenantName = 'PreOne'
  if (session.tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    })
    tenantName = tenant?.name ?? 'PreOne'
  }

  return (
    <HomeClient
      role={session.role}
      user={{
        name: session.name,
        role: session.role,
        tenantName,
      }}
    />
  )
}
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { getEffectiveBranding } from '@/lib/branding-service'
import { HomeClient } from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getSession()
  if (!session?.tenantId) redirect('/')

  const branding = await getEffectiveBranding(session.tenantId, session.branchId)
  const tenantName = branding.schoolName || 'PreOne'
  const campusName = branding.campusName || null

  return (
    <HomeClient
      role={session.role}
      branding={branding}
      user={{
        name: session.name,
        role: session.role,
        tenantName,
        branchName: campusName,
      }}
    />
  )
}

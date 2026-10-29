import { getSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { can } from '@/lib/auth'
import { LearningClient } from './LearningClient'

export default async function LearningPage() {
  const session = await getSession()
  if (!session?.tenantId) redirect('/')

  const roles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  if (!can(roles, 'academics:read')) {
    redirect('/app/dashboard')
  }

  return <LearningClient session={session} />
}

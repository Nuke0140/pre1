import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { HomeClient } from './HomeClient'

export default async function HomePage() {
  const session = await getSession()
  if (!session?.tenantId) redirect('/')

  return <HomeClient role={session.role} />
}
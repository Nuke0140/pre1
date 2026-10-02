import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { CommunicationClient } from './CommunicationClient'

export const metadata = {
  title: 'Announcements — PreOne Preschool OS',
  description: 'School-wide and classroom broadcasts, circulars, and community communications',
}

export default async function CommunicationPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return <CommunicationClient session={session as any} />
}

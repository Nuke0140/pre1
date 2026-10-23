import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { can } from '@/lib/auth'
import ReportsClient from './ReportsClient'

export const metadata: Metadata = {
  title: 'Reports & Analytics | PreOne',
  description: 'Executive MIS, operational dashboards, exports, and custom report builder',
}

export default async function ReportsPage() {
  const session = await getSession()
  if (!session) {
    redirect('/')
  }

  const roles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  if (!can(roles, 'reports:read')) {
    redirect('/app/dashboard')
  }

  return <ReportsClient />
}


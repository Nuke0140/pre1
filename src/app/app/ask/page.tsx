import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth-server'
import { can } from '@/lib/auth'
import { db } from '@/lib/db'
import AskClient from '@/components/ai/AskClient'

export const metadata: Metadata = { title: 'PreO AI · Ask your school | PreOne' }

export default async function AskPage() {
  const session = await getSession()
  if (!session?.tenantId) redirect('/')
  const roles = (session.roles?.length ? session.roles : [session.role]) as any[]
  if (!can(roles, 'reports:read')) redirect('/app/home')

  const canPickBranch = roles.some((r) => r === 'OWNER' || r === 'PRINCIPAL')
  const [tenant, branches] = await Promise.all([
    db.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true } }),
    db.branch.findMany({
      where: { tenantId: session.tenantId, deletedAt: null, ...(canPickBranch || !session.branchId ? {} : { id: session.branchId }) },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  const defaultBranchId = canPickBranch ? (branches.length > 1 ? 'ALL' : branches[0]?.id ?? 'ALL') : session.branchId ?? branches[0]?.id ?? 'ALL'

  return (
    <AskClient
      userName={session.name || 'there'}
      schoolName={tenant?.name || 'your school'}
      branches={branches}
      canPickBranch={canPickBranch}
      defaultBranchId={defaultBranchId}
    />
  )
}

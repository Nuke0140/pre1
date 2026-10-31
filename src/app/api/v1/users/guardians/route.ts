import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds } from '@/lib/auth-api'

/** GET /api/v1/users/guardians — fetch guardians available for account linking */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const url = new URL(req.url)
  const branchFilter = url.searchParams.get('branchId') || url.searchParams.get('branch')

  const authorizedBranches = await getAuthorizedBranchIds(session)
  const isInstitutionWide = authorizedBranches === 'ALL' || authorizedBranches === null

  let effectiveBranchIds: string[] | undefined = undefined

  if (!isInstitutionWide && Array.isArray(authorizedBranches)) {
    if (branchFilter && branchFilter !== 'ALL') {
      if (!authorizedBranches.includes(branchFilter)) {
        throw errPermission('Access denied: branch scope restricted')
      }
      effectiveBranchIds = [branchFilter]
    } else {
      effectiveBranchIds = authorizedBranches
    }
  } else if (branchFilter && branchFilter !== 'ALL') {
    effectiveBranchIds = [branchFilter]
  }

  const whereClause: any = {
    tenantId: session.tenantId,
    deletedAt: null,
  }

  if (effectiveBranchIds) {
    whereClause.studentLinks = {
      some: {
        student: {
          tenantId: session.tenantId,
          branchId: { in: effectiveBranchIds },
          deletedAt: null,
        },
      },
    }
  }

  const guardians = await db.guardian.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, email: true, status: true } },
      studentLinks: {
        where: effectiveBranchIds
          ? {
              student: {
                tenantId: session.tenantId,
                branchId: { in: effectiveBranchIds },
                deletedAt: null,
              },
            }
          : undefined,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true, branchId: true },
          },
        },
      },
    },
    orderBy: { fullName: 'asc' },
    take: 200,
  })

  return ok(
    guardians.map((g) => {
      const visibleLinks = effectiveBranchIds
        ? g.studentLinks.filter((sl) => effectiveBranchIds.includes(sl.student.branchId))
        : g.studentLinks

      return {
        id: g.id,
        fullName: g.fullName,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email,
        hasAccount: !!g.userId,
        linkedUser: g.user ? { id: g.user.id, email: g.user.email, status: g.user.status } : null,
        children: visibleLinks.map((sl) => ({
          id: sl.student.id,
          name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
          admissionNo: sl.student.admissionNo,
          canPickup: sl.canPickup,
          branchId: sl.student.branchId,
        })),
      }
    })
  )
}, { module: 'users' })

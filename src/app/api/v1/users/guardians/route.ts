import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/users/guardians — fetch guardians available for account linking */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const url = new URL(req.url)
  const branchFilter = url.searchParams.get('branchId') || url.searchParams.get('branch')

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const isInstitutionWide = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
  )

  let effectiveBranchId: string | undefined = undefined
  if (!isInstitutionWide && session.branchId) {
    if (branchFilter && branchFilter !== session.branchId) {
      throw errPermission('Access denied: branch scope restricted')
    }
    effectiveBranchId = session.branchId
  } else if (branchFilter && branchFilter !== 'ALL') {
    effectiveBranchId = branchFilter
  }

  const whereClause: any = {
    tenantId: session.tenantId,
    deletedAt: null,
  }

  if (effectiveBranchId) {
    whereClause.studentLinks = {
      some: {
        student: {
          tenantId: session.tenantId,
          branchId: effectiveBranchId,
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
        where: effectiveBranchId
          ? {
              student: {
                tenantId: session.tenantId,
                branchId: effectiveBranchId,
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
    guardians.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      relationship: g.relationship,
      phone: g.phone,
      email: g.email,
      hasAccount: !!g.userId,
      linkedUser: g.user ? { id: g.user.id, email: g.user.email, status: g.user.status } : null,
      children: g.studentLinks.map((sl) => ({
        id: sl.student.id,
        name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
        admissionNo: sl.student.admissionNo,
        canPickup: sl.canPickup,
      })),
    }))
  )
}, { module: 'users' })

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

  const effectiveRoles =
    session.roles && session.roles.length > 0
      ? session.roles
      : session.role
      ? [session.role]
      : []

  const isParentOrGuardian = effectiveRoles.every(
    (r) => r === 'PARENT' || r === 'GUARDIAN'
  )

  const url = new URL(req.url)
  const branchParam = url.searchParams.get('branchId') || url.searchParams.get('branch')

  const authorizedBranches = await getAuthorizedBranchIds(session)
  const isInstitutionWide = authorizedBranches === 'ALL'

  let targetBranchSet: string[] | null = null

  if (isParentOrGuardian) {
    // Parents/guardians are strictly limited to their own profile
    const ownGuardian = await db.guardian.findFirst({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        OR: [{ userId: session.uid }, { id: session.uid }],
      },
      include: {
        user: { select: { id: true, email: true, status: true } },
        studentLinks: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, admissionNo: true, branchId: true },
            },
          },
        },
      },
    })

    if (!ownGuardian) return ok([])

    return ok([
      {
        id: ownGuardian.id,
        fullName: ownGuardian.fullName,
        relationship: ownGuardian.relationship,
        phone: ownGuardian.phone,
        email: ownGuardian.email,
        hasAccount: !!ownGuardian.userId,
        linkedUser: ownGuardian.user
          ? { id: ownGuardian.user.id, email: ownGuardian.user.email, status: ownGuardian.user.status }
          : null,
        children: ownGuardian.studentLinks.map((sl) => ({
          id: sl.student.id,
          name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
          admissionNo: sl.student.admissionNo,
          canPickup: sl.canPickup,
          branchId: sl.student.branchId,
        })),
      },
    ])
  }

  if (!isInstitutionWide) {
    if (branchParam) {
      if (!authorizedBranches.includes(branchParam)) {
        throw errPermission('Access denied: branch scope restricted')
      }
      targetBranchSet = [branchParam]
    } else {
      targetBranchSet = authorizedBranches
    }
  } else if (branchParam && branchParam !== 'ALL') {
    targetBranchSet = [branchParam]
  }

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
  }

  if (targetBranchSet) {
    if (targetBranchSet.length === 0) {
      return ok([])
    }
    where.studentLinks = {
      some: {
        student: {
          tenantId: session.tenantId,
          branchId: { in: targetBranchSet },
          deletedAt: null,
        },
      },
    }
  }

  const guardians = await db.guardian.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, status: true } },
      studentLinks: {
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
      const visibleLinks = targetBranchSet
        ? g.studentLinks.filter((sl) => targetBranchSet.includes(sl.student.branchId))
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

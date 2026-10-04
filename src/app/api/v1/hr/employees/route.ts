import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withApi, errPermission, errBadRequest } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { StaffService } from '@/lib/hr/staff-service'

/**
 * GET /api/v1/hr/employees — Search & Filter Employee Directory (Server-side paginated & tenant-isolated)
 * POST /api/v1/hr/employees — Create Canonical Employee
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

  // Automatically reconcile any staff-role user missing a StaffProfile
  await StaffService.reconcileExistingStaffUsers(session.tenantId)

  const sp = req.nextUrl.searchParams
  const search = sp.get('search') || ''
  const branchId = sp.get('branchId') || undefined
  const departmentId = sp.get('departmentId') || undefined
  const designationId = sp.get('designationId') || undefined
  const employmentType = sp.get('employmentType') || undefined
  const status = sp.get('status') || undefined
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20', 10)))
  const skip = (page - 1) * limit

  const whereClause: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(designationId ? { designationId } : {}),
    ...(employmentType ? { employmentType: employmentType as any } : {}),
    ...(status ? { status: status as any } : {}),
  }

  if (search) {
    whereClause.OR = [
      { employeeCode: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { designation: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [total, items] = await Promise.all([
    db.staffProfile.count({ where: whereClause }),
    db.staffProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, status: true } },
        branch: { select: { id: true, name: true, code: true } },
        departmentRef: { select: { id: true, name: true, code: true } },
        designationRef: { select: { id: true, name: true, code: true } },
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return ok({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

  const body = await req.json()
  if (!body.employeeCode) {
    throw errBadRequest('Employee code is required')
  }

  const actor = {
    id: session.userId,
    name: session.user?.fullName || 'HR Admin',
    role: session.role || 'ADMIN',
  }

  const result = await StaffService.createStaff(
    {
      tenantId: session.tenantId,
      ...body,
    },
    actor
  )

  return ok(result, { status: 201 })
})

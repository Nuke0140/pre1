import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserRole } from '@prisma/client'

/** Sanitize cell against spreadsheet formula injection (=, +, -, @, \t, \r) */
function sanitizeCsvCell(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const raw = String(val)
  let s = raw.trim()
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(s)) {
    s = `'${s}`
  }
  return `"${s.replace(/"/g, '""')}"`
}

interface ExportParams {
  userIds?: string[]
  role?: string
  branchId?: string
  status?: string
  userType?: string
  search?: string
}

async function executeExport(req: NextRequest, params: ExportParams) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  const tenantId = session.tenantId || (session.role === 'PLATFORM_ADMIN' ? req.nextUrl.searchParams.get('tenantId') : null)
  if (!tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const { userIds, role, branchId, status, userType, search } = params

    // Enforce branch scope if session user is restricted to a specific branch
    const isInstitutionWide = ['OWNER', 'PLATFORM_ADMIN'].includes(session.role)
    let effectiveBranchId: string | undefined = undefined
    if (!isInstitutionWide && session.branchId) {
      if (branchId && branchId !== session.branchId) {
        return bad('Access denied: branch scope restricted', 'BRANCH_RESTRICTED')
      }
      effectiveBranchId = session.branchId
    } else if (branchId && branchId !== 'ALL') {
      effectiveBranchId = branchId
    }

    const cleanUserType = userType ? userType.toUpperCase() : undefined
    const cleanRole = role && role !== 'ALL' ? (role.toUpperCase() as UserRole) : undefined
    const cleanStatus = status && status !== 'ALL' ? status.toUpperCase() : undefined

    // Build Prisma query
    const where: any = {
      tenantId,
      deletedAt: null,
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      ...(cleanStatus ? { status: cleanStatus } : {}),
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    }

    // Role and userType scoping
    if (cleanUserType === 'STAFF') {
      // All staff (teachers, administrators, attendants, drivers, etc.)
      where.AND = [
        { role: { notIn: ['PARENT', 'GUARDIAN'] } },
        { NOT: { roles: { hasSome: ['PARENT', 'GUARDIAN'] } } },
      ]
      if (cleanRole && cleanRole !== 'STAFF') {
        where.OR = [{ role: cleanRole }, { roles: { has: cleanRole } }]
      }
    } else if (cleanUserType === 'PARENT') {
      where.OR = [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }]
    } else if (cleanUserType === 'GUARDIAN') {
      where.OR = [{ role: 'GUARDIAN' }, { roles: { has: 'GUARDIAN' } }]
    } else if (cleanUserType === 'FAMILY') {
      where.OR = [
        { role: { in: ['PARENT', 'GUARDIAN'] } },
        { roles: { hasSome: ['PARENT', 'GUARDIAN'] } },
      ]
    } else if (cleanRole) {
      if (cleanRole === 'STAFF') {
        // Legacy role=STAFF treated as all staff if userType was omitted
        where.AND = [
          { role: { notIn: ['PARENT', 'GUARDIAN'] } },
          { NOT: { roles: { hasSome: ['PARENT', 'GUARDIAN'] } } },
        ]
      } else {
        where.OR = [{ role: cleanRole }, { roles: { has: cleanRole } }]
      }
    }

    // Search query filtering
    if (search && search.trim()) {
      const q = search.trim()
      where.user = {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { username: { contains: q, mode: 'insensitive' } },
          { staffProfile: { employeeCode: { contains: q, mode: 'insensitive' } } },
          { staffProfile: { designation: { contains: q, mode: 'insensitive' } } },
        ],
      }
    }

    const [branches, members] = await Promise.all([
      db.branch.findMany({
        where: { tenantId },
        select: { id: true, name: true, code: true },
      }),
      db.tenantUser.findMany({
        where,
        include: {
          user: {
            include: {
              staffProfile: true,
              guardianProfile: {
                include: {
                  studentLinks: {
                    include: {
                      student: {
                        select: { firstName: true, lastName: true, admissionNo: true },
                      },
                    },
                  },
                },
              },
              taughtClasses: {
                select: { name: true, code: true },
              },
            },
          },
          tenant: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
    ])

    const branchMap = new Map(branches.map((b) => [b.id, `${b.name} (${b.code})`]))

    const headers = [
      'User ID',
      'Full Name',
      'Username',
      'Email',
      'Phone',
      'Primary Role',
      'All Roles',
      'Status',
      'Campus Branch',
      'Branch ID',
      'Employee Code',
      'Designation',
      'Department',
      'Employment Type',
      'Assigned Classrooms',
      'Linked Students',
      'Created At',
      'Last Login',
    ]

    const rows = members.map((m) => {
      const assignedRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
      const taughtClasses = m.user.taughtClasses?.map((c) => c.name).join('; ') || ''
      const linkedStudents =
        m.user.guardianProfile?.studentLinks
          ?.map((sl) => `${sl.student.firstName} ${sl.student.lastName || ''} (${sl.student.admissionNo})`.trim())
          .join('; ') || ''
      const branchDisplay = (m.branchId && branchMap.get(m.branchId)) || m.branchId || 'All Campuses'

      return [
        sanitizeCsvCell(m.userId),
        sanitizeCsvCell(m.user.fullName),
        sanitizeCsvCell(m.user.username),
        sanitizeCsvCell(m.user.email),
        sanitizeCsvCell(m.user.phone),
        sanitizeCsvCell(m.role),
        sanitizeCsvCell(assignedRoles.join(', ')),
        sanitizeCsvCell(m.status),
        sanitizeCsvCell(branchDisplay),
        sanitizeCsvCell(m.branchId),
        sanitizeCsvCell(m.user.staffProfile?.employeeCode),
        sanitizeCsvCell(m.user.staffProfile?.designation),
        sanitizeCsvCell(m.user.staffProfile?.department),
        sanitizeCsvCell(m.user.staffProfile?.employmentType),
        sanitizeCsvCell(taughtClasses),
        sanitizeCsvCell(linkedStudents),
        sanitizeCsvCell(m.createdAt.toISOString()),
        sanitizeCsvCell(m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : ''),
      ].join(',')
    })

    // Prepend UTF-8 BOM (\uFEFF) for universal spreadsheet compatibility (Excel, Sheets, Numbers)
    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n')

    // Determine filename
    const dateStr = new Date().toISOString().slice(0, 10)
    let filePrefix = 'preone_users_export'
    if (cleanUserType === 'STAFF') filePrefix = 'preone_staff_directory'
    else if (cleanUserType === 'PARENT') filePrefix = 'preone_parents_directory'
    else if (cleanUserType === 'GUARDIAN') filePrefix = 'preone_guardians_directory'
    else if (cleanUserType === 'FAMILY') filePrefix = 'preone_family_directory'
    else if (cleanRole) filePrefix = `preone_${cleanRole.toLowerCase()}_export`

    const filename = `${filePrefix}_${dateStr}.csv`

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'EXPORT_USERS_CSV',
      entity: 'User',
      module: 'Users',
      severity: 'INFO',
      summary: `Exported ${members.length} user records to CSV (${filename})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: { count: members.length, filename, userType: cleanUserType, role: cleanRole },
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * GET /api/v1/users/export — secure browser CSV download endpoint
 */
async function _GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const userIdsParam = sp.get('userIds')
  const params: ExportParams = {
    userIds: userIdsParam ? userIdsParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    role: sp.get('role') || undefined,
    branchId: sp.get('branchId') || undefined,
    status: sp.get('status') || undefined,
    userType: sp.get('userType') || undefined,
    search: sp.get('search') || sp.get('q') || undefined,
  }
  return executeExport(req, params)
}

/**
 * POST /api/v1/users/export — programmatic / filter payload CSV export
 */
async function _POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const sp = req.nextUrl.searchParams

  const params: ExportParams = {
    userIds: body.userIds || (sp.get('userIds') ? sp.get('userIds')!.split(',').filter(Boolean) : undefined),
    role: body.role || sp.get('role') || undefined,
    branchId: body.branchId || sp.get('branchId') || undefined,
    status: body.status || sp.get('status') || undefined,
    userType: body.userType || sp.get('userType') || undefined,
    search: body.search || body.q || sp.get('search') || sp.get('q') || undefined,
  }
  return executeExport(req, params)
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'

/**
 * GET /api/v1/transport/eligible-staff â€” Fetches active StaffProfile records eligible as Driver or Attendant
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'transport:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  try {
    const staff = await db.staffProfile.findMany({
      where: {
        tenantId: session.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
        user: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        branch: { select: { id: true, name: true, code: true } },
        tenantUser: { select: { role: true, roles: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Strictly filter for staff related to transport (Driver, Attendant, Transport staff)
    // Teachers, school owners, directors, and non-transport staff are excluded
    const transportStaff = staff.filter((s) => {
      const des = (s.designation || '').toLowerCase().trim()
      const dept = (s.department || '').toLowerCase().trim()
      const role = s.tenantUser?.role
      const roles = s.tenantUser?.roles || []

      // 1. Explicit Transport Roles
      if (role === 'DRIVER' || role === 'ATTENDANT') return true
      if (roles.includes('DRIVER') || roles.includes('ATTENDANT')) return true

      // 2. Transport designation keywords (e.g., Driver, Attendant, Conductor, Bus Driver)
      const transportKeywords = ['driver', 'attendant', 'conductor', 'chaperone', 'transport', 'pilot', 'bus']
      if (transportKeywords.some((kw) => des.includes(kw))) return true

      // 3. Transport department keywords
      const transportDepts = ['transport', 'transportation', 'logistics', 'fleet']
      if (transportDepts.some((kw) => dept.includes(kw))) return true

      return false
    })

    return ok(
      transportStaff.map((s) => ({
        id: s.id,
        userId: s.userId,
        employeeCode: s.employeeCode,
        fullName: s.user.fullName,
        email: s.user.email,
        phone: s.user.phone,
        designation: s.designation || 'Driver',
        department: s.department || 'Transport',
        role: s.tenantUser?.role || 'DRIVER',
        branchId: s.branchId,
        branchName: s.branch?.name || null,
      }))
    )
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

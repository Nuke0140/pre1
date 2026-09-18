import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SCHOOL_ROLES, SchoolRole, ROLE_PERMISSIONS } from '@/lib/auth'

const ROLE_METADATA: Record<SchoolRole, { label: string; description: string; category: 'EXECUTIVE' | 'ACADEMIC' | 'OPERATIONS' | 'PORTAL' }> = {
  OWNER: {
    label: 'Owner / Trust Head',
    description: 'Full institutional control across all branches, finance, and system settings',
    category: 'EXECUTIVE',
  },
  PRINCIPAL: {
    label: 'Principal / Center Head',
    description: 'Complete academic, admissions, operational, and staff management',
    category: 'EXECUTIVE',
  },
  TEACHER: {
    label: 'Teacher / Educator',
    description: 'Assigned classroom management, daily student attendance, activities, and logs',
    category: 'ACADEMIC',
  },
  HELPER: {
    label: 'Helper / Support Staff',
    description: 'Classroom assistance, child care, facility maintenance, and operational tasks',
    category: 'OPERATIONS',
  },
  ACCOUNTANT: {
    label: 'Accountant / Finance',
    description: 'Fee invoicing, collections, discounts, receipts, and financial audits',
    category: 'OPERATIONS',
  },
  HR: {
    label: 'HR / Personnel Manager',
    description: 'Workforce records, onboarding, staff lifecycle, payroll processing, and leave approval',
    category: 'OPERATIONS',
  },
  DRIVER: {
    label: 'Driver / Transport Operator',
    description: 'Route navigation, student boarding/drop verification, and vehicle logs',
    category: 'OPERATIONS',
  },
  PARENT: {
    label: 'Parent',
    description: 'Student daily timeline, notices, fee payments, and school communication',
    category: 'PORTAL',
  },
  GUARDIAN: {
    label: 'Guardian / Authorized Caregiver',
    description: 'Authorized pickup, child diary, updates, and verified attendance access',
    category: 'PORTAL',
  },
}

/**
 * GET /api/v1/users/roles — roles directory with user counts and permission matrix
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    // Count active users per role
    const members = await db.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: { role: true, roles: true },
    })

    const roleCounts: Record<SchoolRole, number> = {
      OWNER: 0,
      PRINCIPAL: 0,
      TEACHER: 0,
      HELPER: 0,
      ACCOUNTANT: 0,
      HR: 0,
      DRIVER: 0,
      PARENT: 0,
      GUARDIAN: 0,
    }

    for (const m of members) {
      const allRoles = (m.roles && m.roles.length > 0 ? m.roles : [m.role]) as SchoolRole[]
      for (const r of allRoles) {
        if (roleCounts[r] !== undefined) {
          roleCounts[r]++
        }
      }
    }

    const rolesList = SCHOOL_ROLES.map((role) => {
      const meta = ROLE_METADATA[role] || {
        label: role,
        description: 'System role',
        category: 'OPERATIONS',
      }
      const permissions = ROLE_PERMISSIONS[role] || []

      return {
        role,
        label: meta.label,
        description: meta.description,
        category: meta.category,
        userCount: roleCounts[role] || 0,
        permissionCount: permissions.includes('*') ? 'All School Permissions' : permissions.length,
        permissions,
      }
    })

    return ok({
      roles: rolesList,
      totalRoles: rolesList.length,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ROLE_PERMISSIONS, Role } from '@/lib/auth'

const ROLE_METADATA: Record<Role, { label: string; description: string; category: 'EXECUTIVE' | 'ACADEMIC' | 'OPERATIONS' | 'PORTAL' }> = {
  PLATFORM_ADMIN: {
    label: 'Platform Administrator',
    description: 'Global infrastructure and multi-tenant management plane',
    category: 'EXECUTIVE',
  },
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
  COORDINATOR: {
    label: 'Academic Coordinator',
    description: 'Curriculum oversight, teacher management, class schedules, and attendance',
    category: 'ACADEMIC',
  },
  TEACHER: {
    label: 'Teacher / Educator',
    description: 'Assigned classroom management, daily student attendance, activities, and logs',
    category: 'ACADEMIC',
  },
  ACCOUNTS: {
    label: 'Finance / Accounts',
    description: 'Fee invoicing, collections, discounts, receipts, and financial audits',
    category: 'OPERATIONS',
  },
  RECEPTION: {
    label: 'Front Desk / Reception',
    description: 'Parent enquiries, admissions desk, visitor tracking, and general notifications',
    category: 'OPERATIONS',
  },
  PARENT: {
    label: 'Parent / Guardian',
    description: 'Student daily timeline, notices, fee payments, and school communication',
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

    const roleCounts: Record<string, number> = {
      OWNER: 0,
      PRINCIPAL: 0,
      COORDINATOR: 0,
      TEACHER: 0,
      ACCOUNTS: 0,
      RECEPTION: 0,
      PARENT: 0,
      PLATFORM_ADMIN: 0,
    }

    for (const m of members) {
      const allRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
      for (const r of allRoles) {
        if (roleCounts[r] !== undefined) {
          roleCounts[r]++
        }
      }
    }

    const rolesList = (Object.keys(ROLE_PERMISSIONS) as Role[]).map((role) => {
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

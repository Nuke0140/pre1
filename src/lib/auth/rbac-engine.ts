import { db } from '@/lib/db'
import { ROLE_PERMISSIONS, Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { PermissionCache } from '@/lib/cache/permission-cache'
import { logger } from '@/lib/logger'
import type { SessionPayload } from '@/lib/auth'

/**
 * Authoritative System Capabilities Catalog (ADR-063)
 * Granular permissions that can be composed into custom dynamic roles.
 */
export interface CapabilityDefinition {
  id: string
  name: string
  category: string
  description: string
}

export const CAPABILITY_CATALOG: CapabilityDefinition[] = [
  // Students & Academics
  { id: 'students:read', name: 'View Students', category: 'STUDENTS', description: 'Browse student records, admissions, and enrollment lists' },
  { id: 'students:write', name: 'Manage Students', category: 'STUDENTS', description: 'Create and update student profiles, photos, and enrollments' },
  { id: 'academics:read', name: 'View Academics', category: 'ACADEMICS', description: 'View curriculum, lessons, assessments, and learning observations' },
  { id: 'academics:write', name: 'Manage Academics', category: 'ACADEMICS', description: 'Record observations, manage learning activities and lesson plans' },
  { id: 'academics:approve', name: 'Approve Academics', category: 'ACADEMICS', description: 'Sign off on term assessments, report cards, and curricula' },

  // Admissions
  { id: 'admissions:read', name: 'View Admissions', category: 'ADMISSIONS', description: 'Review prospective admissions leads, inquiries, and application stages' },
  { id: 'admissions:write', name: 'Process Admissions', category: 'ADMISSIONS', description: 'Update application statuses, schedule tours, and convert leads' },
  { id: 'admissions:approve', name: 'Admit Students', category: 'ADMISSIONS', description: 'Issue official admission offers and approve student enrollment' },

  // Attendance
  { id: 'attendance:read', name: 'View Attendance', category: 'ATTENDANCE', description: 'Inspect daily check-in/out logs and attendance dashboards' },
  { id: 'attendance:mark', name: 'Mark Attendance', category: 'ATTENDANCE', description: 'Record morning attendance, temperatures, and afternoon departure check-outs' },
  { id: 'attendance:approve', name: 'Approve Attendance', category: 'ATTENDANCE', description: 'Authorize monthly payroll-linked attendance summaries and corrections' },

  // Finance & Billing
  { id: 'finance:read', name: 'View Finance', category: 'FINANCE', description: 'View tuition fee schedules, student invoices, receipts, and ledger summaries' },
  { id: 'finance:write', name: 'Manage Billing', category: 'FINANCE', description: 'Generate fee invoices, apply discounts, and record offline fee payments' },

  // Operations & Daily Care
  { id: 'operations:read', name: 'View Operations', category: 'OPERATIONS', description: 'Monitor live campus command center and exception follow-up alerts' },
  { id: 'operations:write', name: 'Manage Operations', category: 'OPERATIONS', description: 'Acknowledge operational incidents, complete follow-up tasks, and manage pickups' },

  // Communication & Timeline
  { id: 'communication:read', name: 'View Communications', category: 'COMMUNICATION', description: 'Access parent announcements, circulars, and messaging history' },
  { id: 'communication:broadcast', name: 'Send Broadcasts', category: 'COMMUNICATION', description: 'Draft and publish school-wide bulletins and emergency alerts' },
  { id: 'timeline:read', name: 'View Timeline', category: 'COMMUNICATION', description: 'Review student daily diaries, feeding, nap, and milestone posts' },

  // Inventory & Procurement
  { id: 'inventory:read', name: 'View Inventory', category: 'INVENTORY', description: 'Browse stock balances, asset catalogs, and warehouse item registries' },
  { id: 'inventory:write', name: 'Manage Inventory', category: 'INVENTORY', description: 'Add inventory items, categories, and adjust stock levels' },
  { id: 'inventory:request', name: 'Request Supplies', category: 'INVENTORY', description: 'Submit purchase requisitions and classroom material supply requests' },
  { id: 'inventory:order', name: 'Place Purchase Orders', category: 'INVENTORY', description: 'Issue authorized purchase orders to vendors and suppliers' },
  { id: 'inventory:receive', name: 'Receive Deliveries', category: 'INVENTORY', description: 'Accept stock deliveries, verify quantities, and log warehouse entries' },
  { id: 'inventory:issue', name: 'Issue Supplies', category: 'INVENTORY', description: 'Disburse school assets and consumable stationery to classrooms' },
  { id: 'inventory:adjust', name: 'Adjust Stock', category: 'INVENTORY', description: 'Audit stock counts, log damage write-offs, and cycle-count variances' },
  { id: 'inventory:approve', name: 'Approve Requisitions', category: 'INVENTORY', description: 'Authorize large purchase requisitions and departmental expense budgets' },

  // Human Resources & Payroll
  { id: 'hr:read', name: 'View HR Records', category: 'HR', description: 'Access staff directories, leave balances, and qualification records' },
  { id: 'hr:write', name: 'Manage Workforce', category: 'HR', description: 'Maintain staff employment records, contracts, and statutory profiles' },
  { id: 'hr:approve', name: 'Approve Leave', category: 'HR', description: 'Sanction employee leave applications and verify overtime requests' },
  { id: 'payroll:process', name: 'Process Payroll', category: 'HR', description: 'Calculate monthly payroll, generate payslips, and disburse salaries' },
  { id: 'hr:self', name: 'Employee Self-Service', category: 'HR', description: 'View own payslips, apply for personal leaves, and update emergency contacts' },

  // Transport & Fleet
  { id: 'transport:read', name: 'View Transport', category: 'TRANSPORT', description: 'Track bus routes, pickup stops, and vehicle assignments' },
  { id: 'transport:write', name: 'Manage Transport', category: 'TRANSPORT', description: 'Configure transit routes, manage vehicles, and assign drivers' },
  { id: 'transport:assign', name: 'Assign Bus Riders', category: 'TRANSPORT', description: 'Allocate students to morning and evening school bus routes' },
  { id: 'transport:trip', name: 'Manage Trips', category: 'TRANSPORT', description: 'Start and complete scheduled morning/evening transit runs' },
  { id: 'transport:board', name: 'Log Boarding', category: 'TRANSPORT', description: 'Check in students boarding school buses at neighborhood pickup points' },
  { id: 'transport:drop', name: 'Log Drop-off', category: 'TRANSPORT', description: 'Confirm student handoff to authorized guardians at drop points' },
  { id: 'transport:incident', name: 'Log Fleet Incidents', category: 'TRANSPORT', description: 'Report transit delays, breakdowns, or route safety anomalies' },

  // Reports & Analytics
  { id: 'reports:read', name: 'View Reports', category: 'REPORTS', description: 'View operational summaries, attendance statistics, and fee collections' },
  { id: 'reports:write', name: 'Create Custom Reports', category: 'REPORTS', description: 'Design and configure custom tabular reports and KPI metrics' },
  { id: 'reports:export', name: 'Export Data', category: 'REPORTS', description: 'Download CSV and Excel audit sheets for accounting and compliance' },
  { id: 'reports:custom', name: 'Advanced Analytics', category: 'REPORTS', description: 'Access deep pedagogical trends and multi-branch comparative graphs' },

  // User Administration & Security
  { id: 'users:read', name: 'View Users & RBAC', category: 'USERS', description: 'Inspect user accounts, campus branch mappings, and assigned roles' },
  { id: 'users:write', name: 'Manage Users & Roles', category: 'USERS', description: 'Provision staff accounts, assign roles, and configure dynamic capabilities' },
  { id: 'users:delete', name: 'Delete & De-identify Users', category: 'USERS', description: 'Execute DPDP data erasure workflows and permanent account deactivations' },
  { id: 'audit:read', name: 'Inspect Audit Logs', category: 'USERS', description: 'Audit administrative mutations, security logins, and permission changes' },

  // School Settings
  { id: 'settings:read', name: 'View Settings', category: 'SETTINGS', description: 'View campus details, academic sessions, and operational configurations' },
  { id: 'settings:write', name: 'Update Settings', category: 'SETTINGS', description: 'Configure school profile, academic calendar, and campus policies' },
]

export const ALL_CAPABILITY_IDS = new Set(CAPABILITY_CATALOG.map((c) => c.id))

/**
 * Cache for user dynamic effective permissions to meet <5ms hot-path requirement (ADR-067/ADR-068).
 */
interface CachedPermissions {
  version: number
  permissions: Set<string>
  cachedAt: number
}

const permissionCache = new Map<string, CachedPermissions>()
const CACHE_TTL_MS = 60 * 1000 // 60 seconds TTL

export class RbacEngine {
  /**
   * Validates capabilities against the system catalog.
   * Enforces privilege escalation guard (ADR-064): custom roles cannot grant
   * capabilities not present in the system catalog.
   */
  static validateCapabilities(capabilities: string[]): {
    valid: boolean
    invalidCapabilities: string[]
  } {
    if (!Array.isArray(capabilities)) {
      return { valid: false, invalidCapabilities: ['capabilities must be an array'] }
    }
    const invalid = capabilities.filter((cap) => !ALL_CAPABILITY_IDS.has(cap))
    return {
      valid: invalid.length === 0,
      invalidCapabilities: invalid,
    }
  }

  /**
   * Enforces single-parent acyclic inheritance (ADR-064).
   * Verifies that setting parentRoleId does not create a cycle.
   */
  static async checkInheritanceCycle(
    roleId: string | null,
    proposedParentRoleId: string | null,
    tenantId: string
  ): Promise<boolean> {
    if (!proposedParentRoleId) return true
    if (roleId && roleId === proposedParentRoleId) {
      throw new Error('A role cannot inherit from itself (cycle detected)')
    }

    // Walk ancestor chain
    let currentId: string | null = proposedParentRoleId
    const visited = new Set<string>()

    while (currentId) {
      if (roleId && currentId === roleId) {
        throw new Error('Cyclic role inheritance detected: proposed parent already inherits from this role')
      }
      if (visited.has(currentId)) {
        throw new Error('Cyclic role inheritance detected in existing parent chain')
      }
      visited.add(currentId)

      const parent: { parentRoleId: string | null } | null = await db.customRole.findUnique({
        where: { id: currentId },
        select: { parentRoleId: true },
      })

      currentId = parent?.parentRoleId || null
    }

    return true
  }

  /**
   * Effective Permission Resolver (ADR-067)
   * Flattens a principal's static system roles + dynamic DB custom roles + inherited parent capabilities
   * into a unified, deduplicated permission set.
   */
  static async resolveEffectivePermissions(params: {
    userId: string
    tenantId?: string | null
    roles?: Role[]
  }): Promise<string[]> {
    const { userId, tenantId, roles } = params

    const cacheKey = `${userId}:${tenantId || 'global'}`
    const currentVersion = PermissionCache.getUserVersion(userId)
    const cached = permissionCache.get(cacheKey)

    if (cached && cached.version === currentVersion && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return Array.from(cached.permissions)
    }

    const effectivePermissions = new Set<string>()

    // 1. Resolve static system role permissions (from session / UserRole)
    const systemRoles = roles && roles.length > 0 ? roles : []
    for (const r of systemRoles) {
      const normalized = normalizeRole(r)
      const perms = ROLE_PERMISSIONS[r] || (ROLE_PERMISSIONS as Record<string, string[]>)[normalized] || []
      for (const p of perms) {
        effectivePermissions.add(p)
      }
    }

    // 2. Resolve dynamic DB custom roles (scoped to active tenant)
    if (tenantId) {
      try {
        const member = await db.tenantUser.findFirst({
          where: {
            userId,
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          include: {
            customRoles: {
              include: {
                customRole: {
                  include: {
                    parentRole: true,
                  },
                },
              },
            },
          },
        })

        if (member) {
          // If member has primary system role not already in systemRoles
          if (!systemRoles.includes(member.role as any)) {
            const memberPerms =
              ROLE_PERMISSIONS[member.role] ||
              (ROLE_PERMISSIONS as Record<string, string[]>)[normalizeRole(member.role)] ||
              []
            for (const p of memberPerms) {
              effectivePermissions.add(p)
            }
          }

          for (const assignment of member.customRoles) {
            const customRole = assignment.customRole
            if (customRole && customRole.status === 'ACTIVE' && !customRole.deletedAt) {
              // Direct capabilities
              for (const cap of customRole.capabilities) {
                if (ALL_CAPABILITY_IDS.has(cap)) {
                  effectivePermissions.add(cap)
                }
              }

              // Single-level inherited parent capabilities
              if (
                customRole.parentRole &&
                customRole.parentRole.status === 'ACTIVE' &&
                !customRole.parentRole.deletedAt
              ) {
                for (const parentCap of customRole.parentRole.capabilities) {
                  if (ALL_CAPABILITY_IDS.has(parentCap)) {
                    effectivePermissions.add(parentCap)
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        logger.error('RbacEngine: failed resolving DB custom roles', { error: err.message, userId, tenantId })
      }
    }

    // Cache the resolved result
    permissionCache.set(cacheKey, {
      version: currentVersion,
      permissions: effectivePermissions,
      cachedAt: Date.now(),
    })

    return Array.from(effectivePermissions)
  }

  /**
   * Invalidates permission cache for a user or entire tenant (ADR-069).
   */
  static invalidateUserCache(userId: string): void {
    PermissionCache.bumpUserVersion(userId)
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key)
      }
    }
  }

  static invalidateTenantCache(tenantId: string): void {
    for (const key of permissionCache.keys()) {
      if (key.endsWith(`:${tenantId}`)) {
        permissionCache.delete(key)
      }
    }
  }
}

/**
 * CustomRoleService manages CRUD lifecycle of tenant-scoped custom roles (ADR-064).
 */
export class CustomRoleService {
  /**
   * Lists all custom dynamic roles for a tenant.
   */
  static async listRoles(tenantId: string, options?: { status?: string; query?: string }) {
    const where: any = {
      tenantId,
      deletedAt: null,
    }

    if (options?.status && options.status !== 'ALL') {
      where.status = options.status
    }

    if (options?.query && options.query.trim()) {
      const q = options.query.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const roles = await db.customRole.findMany({
      where,
      include: {
        parentRole: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { assignedUsers: true, childRoles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return roles.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      code: r.code,
      description: r.description,
      isSystem: r.isSystem,
      status: r.status,
      parentRoleId: r.parentRoleId,
      parentRole: r.parentRole,
      capabilities: r.capabilities,
      capabilitiesCount: r.capabilities.length,
      assignedUsersCount: r._count.assignedUsers,
      childRolesCount: r._count.childRoles,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  }

  /**
   * Retrieves a specific custom role with assigned members.
   */
  static async getRole(id: string, tenantId: string) {
    const role = await db.customRole.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        parentRole: {
          select: { id: true, name: true, code: true, capabilities: true },
        },
        childRoles: {
          where: { deletedAt: null },
          select: { id: true, name: true, code: true },
        },
        assignedUsers: {
          include: {
            tenantUser: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    })

    if (!role) return null

    // Compute effective flattened capabilities
    const effectiveSet = new Set<string>(role.capabilities)
    if (role.parentRole?.capabilities) {
      for (const cap of role.parentRole.capabilities) {
        effectiveSet.add(cap)
      }
    }

    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      status: role.status,
      parentRoleId: role.parentRoleId,
      parentRole: role.parentRole,
      childRoles: role.childRoles,
      capabilities: role.capabilities,
      inheritedCapabilities: role.parentRole?.capabilities || [],
      effectiveCapabilities: Array.from(effectiveSet),
      assignedUsers: role.assignedUsers.map((au) => ({
        tenantUserId: au.tenantUserId,
        userId: au.tenantUser.user.id,
        fullName: au.tenantUser.user.fullName,
        email: au.tenantUser.user.email,
        avatarUrl: au.tenantUser.user.avatarUrl,
        assignedAt: au.assignedAt.toISOString(),
      })),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }
  }

  /**
   * Creates a new custom dynamic role.
   */
  static async createRole(params: {
    tenantId: string
    name: string
    code?: string
    description?: string
    capabilities: string[]
    parentRoleId?: string | null
    actorSession: SessionPayload
    req?: Request | null
  }) {
    const { tenantId, name, code, description, capabilities, parentRoleId, actorSession, req } = params

    if (!name || name.trim().length < 2) {
      throw new Error('Role name is required and must be at least 2 characters')
    }

    const cleanCode = (code || name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')

    // 1. Check duplicate code within tenant
    const existing = await db.customRole.findFirst({
      where: { tenantId, code: cleanCode, deletedAt: null },
    })
    if (existing) {
      const err = new Error(`Role code "${cleanCode}" already exists in this school`)
      ;(err as any).code = 'ROLE_CODE_CONFLICT'
      throw err
    }

    // 2. Validate capabilities (Privilege escalation guard - ADR-064)
    const capCheck = RbacEngine.validateCapabilities(capabilities)
    if (!capCheck.valid) {
      const err = new Error(`Invalid capabilities: ${capCheck.invalidCapabilities.join(', ')}`)
      ;(err as any).code = 'INVALID_CAPABILITIES'
      throw err
    }

    // 3. Validate parent role if provided
    if (parentRoleId) {
      const parent = await db.customRole.findFirst({
        where: { id: parentRoleId, tenantId, deletedAt: null },
      })
      if (!parent) {
        throw new Error('Parent role not found in this school')
      }
      await RbacEngine.checkInheritanceCycle(null, parentRoleId, tenantId)
    }

    const newRole = await db.customRole.create({
      data: {
        tenantId,
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
        capabilities,
        parentRoleId: parentRoleId || null,
        status: 'ACTIVE',
      },
    })

    // Audit log
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'CUSTOM_ROLE_CREATED',
      entity: 'CustomRole',
      entityId: newRole.id,
      module: 'AUTH',
      severity: 'INFO',
      summary: `Created custom dynamic role "${newRole.name}" (${newRole.code}) with ${capabilities.length} capabilities`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        id: newRole.id,
        name: newRole.name,
        code: newRole.code,
        capabilities,
        parentRoleId,
      },
    })

    return newRole
  }

  /**
   * Updates an existing custom dynamic role.
   */
  static async updateRole(params: {
    id: string
    tenantId: string
    name?: string
    description?: string
    capabilities?: string[]
    parentRoleId?: string | null
    status?: string
    actorSession: SessionPayload
    req?: Request | null
  }) {
    const { id, tenantId, name, description, capabilities, parentRoleId, status, actorSession, req } = params

    const existing = await db.customRole.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { assignedUsers: { select: { tenantUser: { select: { userId: true } } } } },
    })

    if (!existing) {
      throw new Error('Custom role not found')
    }

    const updates: any = {}

    if (name !== undefined) {
      if (name.trim().length < 2) {
        throw new Error('Role name must be at least 2 characters')
      }
      updates.name = name.trim()
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null
    }

    if (status !== undefined) {
      updates.status = status
    }

    if (capabilities !== undefined) {
      const capCheck = RbacEngine.validateCapabilities(capabilities)
      if (!capCheck.valid) {
        const err = new Error(`Invalid capabilities: ${capCheck.invalidCapabilities.join(', ')}`)
        ;(err as any).code = 'INVALID_CAPABILITIES'
        throw err
      }
      updates.capabilities = capabilities
    }

    if (parentRoleId !== undefined) {
      if (parentRoleId) {
        await RbacEngine.checkInheritanceCycle(id, parentRoleId, tenantId)
        updates.parentRoleId = parentRoleId
      } else {
        updates.parentRoleId = null
      }
    }

    const updated = await db.customRole.update({
      where: { id },
      data: updates,
    })

    // Invalidate permission cache for all users assigned to this role
    for (const au of existing.assignedUsers) {
      RbacEngine.invalidateUserCache(au.tenantUser.userId)
    }

    // Audit log
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'CUSTOM_ROLE_UPDATED',
      entity: 'CustomRole',
      entityId: id,
      module: 'AUTH',
      severity: 'INFO',
      summary: `Updated custom dynamic role "${updated.name}" (${updated.code})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: {
        name: existing.name,
        capabilities: existing.capabilities,
        parentRoleId: existing.parentRoleId,
        status: existing.status,
      },
      newValues: updates,
    })

    return updated
  }

  /**
   * Deletes (soft-deletes) a custom dynamic role.
   */
  static async deleteRole(params: {
    id: string
    tenantId: string
    force?: boolean
    actorSession: SessionPayload
    req?: Request | null
  }) {
    const { id, tenantId, force, actorSession, req } = params

    const role = await db.customRole.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { assignedUsers: true, childRoles: true } },
        assignedUsers: { select: { tenantUser: { select: { userId: true } } } },
      },
    })

    if (!role) {
      throw new Error('Custom role not found')
    }

    if (role._count.childRoles > 0) {
      throw new Error('Cannot delete role: other custom roles inherit from it. Reassign child roles first.')
    }

    if (role._count.assignedUsers > 0 && !force) {
      const err = new Error(
        `Cannot delete role: ${role._count.assignedUsers} user(s) are currently assigned to this role.`
      )
      ;(err as any).code = 'ROLE_HAS_ASSIGNED_USERS'
      throw err
    }

    // Soft delete role and clear assignments
    await db.$transaction(async (tx) => {
      await tx.tenantUserCustomRole.deleteMany({
        where: { customRoleId: id },
      })

      await tx.customRole.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          deletedAt: new Date(),
        },
      })
    })

    // Invalidate permission cache
    for (const au of role.assignedUsers) {
      RbacEngine.invalidateUserCache(au.tenantUser.userId)
    }

    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId,
      actorId: actorSession.uid,
      actorName: actorSession.name,
      actorRole: actorSession.role,
      action: 'CUSTOM_ROLE_DELETED',
      entity: 'CustomRole',
      entityId: id,
      module: 'AUTH',
      severity: 'WARNING',
      summary: `Deleted custom dynamic role "${role.name}" (${role.code})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValues: {
        id: role.id,
        name: role.name,
        code: role.code,
        assignedCount: role._count.assignedUsers,
      },
    })

    return { success: true, id }
  }

  /**
   * Assigns or synchronizes custom dynamic roles to a TenantUser.
   */
  static async syncUserCustomRoles(params: {
    tenantUserId: string
    tenantId: string
    customRoleIds: string[]
    assignedById?: string
  }) {
    const { tenantUserId, tenantId, customRoleIds, assignedById } = params

    // Verify all roles belong to this tenant and are active
    if (customRoleIds.length > 0) {
      const validRoles = await db.customRole.findMany({
        where: {
          id: { in: customRoleIds },
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      })

      if (validRoles.length !== customRoleIds.length) {
        throw new Error('One or more custom roles are invalid or do not belong to this school')
      }
    }

    const member = await db.tenantUser.findUnique({
      where: { id: tenantUserId },
      select: { userId: true },
    })

    if (!member) {
      throw new Error('School member not found')
    }

    await db.$transaction(async (tx) => {
      // Remove obsolete assignments
      await tx.tenantUserCustomRole.deleteMany({
        where: {
          tenantUserId,
          customRoleId: { notIn: customRoleIds },
        },
      })

      // Add new assignments
      for (const roleId of customRoleIds) {
        await tx.tenantUserCustomRole.upsert({
          where: {
            tenantUserId_customRoleId: {
              tenantUserId,
              customRoleId: roleId,
            },
          },
          create: {
            tenantUserId,
            customRoleId: roleId,
            assignedById,
          },
          update: {},
        })
      }
    })

    // Invalidate user cache
    RbacEngine.invalidateUserCache(member.userId)
  }
}

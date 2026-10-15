import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { normalizeRole, ROLE_META } from '@/lib/roles'

export interface OrgHierarchyNode {
  id: string // staffProfile.id
  userId: string
  tenantUserId: string
  fullName: string
  name: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  roles: string[]
  designation: string
  department: string
  employeeCode: string
  employmentType: string
  status: string
  branchId: string | null
  branchName: string | null
  reportingManagerId: string | null
  reportingManagerName: string | null
  directReportsCount: number
  children: OrgHierarchyNode[]
}

/**
 * GET /api/v1/users/org-hierarchy — Visual Org Chart & Reporting Hierarchy (Doc 5.2)
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get('branchId')
  const departmentFilter = searchParams.get('department')
  const query = searchParams.get('q')?.trim().toLowerCase()

  try {
    // 1. Fetch all active workforce members in this school
    const staffMembers = await db.tenantUser.findMany({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'PENDING'] },
        user: { deletedAt: null },
        staffProfile: { deletedAt: null },
        ...(branchId && branchId !== 'ALL' ? { branchId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        staffProfile: {
          include: {
            branch: {
              select: { id: true, name: true, code: true },
            },
            reportingManager: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { user: { fullName: 'asc' } },
      ],
    })

    // 2. Transform into lightweight Node objects
    const nodeMap = new Map<string, OrgHierarchyNode>() // key: staffProfile.id
    const userToProfileMap = new Map<string, string>() // key: userId -> staffProfile.id
    const departmentStats: Record<string, number> = {}

    for (const m of staffMembers) {
      if (!m.staffProfile) continue

      const sp = m.staffProfile
      const u = m.user
      const dept = sp.department?.trim() || 'General'
      departmentStats[dept] = (departmentStats[dept] || 0) + 1

      const node: OrgHierarchyNode = {
        id: sp.id,
        userId: u.id,
        tenantUserId: m.id,
        fullName: u.fullName,
        name: u.fullName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        role: m.role,
        roles: m.roles && m.roles.length > 0 ? m.roles : [m.role],
        designation: sp.designation?.trim() || ROLE_META[normalizeRole(m.role)]?.label || m.role,
        department: dept,
        employeeCode: sp.employeeCode,
        employmentType: sp.employmentType,
        status: m.status,
        branchId: sp.branchId || m.branchId || null,
        branchName: sp.branch?.name || null,
        reportingManagerId: sp.reportingManagerId,
        reportingManagerName: sp.reportingManager?.user?.fullName || null,
        directReportsCount: 0,
        children: [],
      }

      nodeMap.set(sp.id, node)
      userToProfileMap.set(u.id, sp.id)
    }

    // 3. Connect nodes based on explicit reportingManagerId first
    const explicitChildrenIds = new Set<string>()

    for (const node of nodeMap.values()) {
      if (node.reportingManagerId && nodeMap.has(node.reportingManagerId)) {
        const managerNode = nodeMap.get(node.reportingManagerId)!
        if (managerNode.id !== node.id) {
          managerNode.children.push(node)
          explicitChildrenIds.add(node.id)
        }
      }
    }

    // 4. For nodes without explicit manager, arrange them by canonical hierarchy levels
    // OWNER (1) -> PRINCIPAL (2) -> COORDINATOR (3) -> TEACHER/STAFF/ACCOUNTS (4) -> ATTENDANT/DRIVER (5)
    const owners = Array.from(nodeMap.values()).filter((n) => normalizeRole(n.role) === 'OWNER')
    const principals = Array.from(nodeMap.values()).filter((n) => normalizeRole(n.role) === 'PRINCIPAL')
    const coordinators = Array.from(nodeMap.values()).filter((n) => normalizeRole(n.role) === 'COORDINATOR')

    // Find main school head (first owner or first principal)
    const topLeader = owners[0] || principals[0]

    for (const node of nodeMap.values()) {
      if (explicitChildrenIds.has(node.id)) continue
      if (node.id === topLeader?.id) continue

      const norm = normalizeRole(node.role)

      if (norm === 'OWNER') {
        // Co-owners stay at root
        continue
      } else if (norm === 'PRINCIPAL') {
        if (owners.length > 0) {
          owners[0].children.push(node)
          explicitChildrenIds.add(node.id)
        }
      } else if (norm === 'COORDINATOR') {
        if (principals.length > 0) {
          principals[0].children.push(node)
          explicitChildrenIds.add(node.id)
        } else if (owners.length > 0) {
          owners[0].children.push(node)
          explicitChildrenIds.add(node.id)
        }
      } else if (['TEACHER', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST'].includes(norm)) {
        if (coordinators.length > 0) {
          // Assign to coordinator
          coordinators[0].children.push(node)
          explicitChildrenIds.add(node.id)
        } else if (principals.length > 0) {
          principals[0].children.push(node)
          explicitChildrenIds.add(node.id)
        } else if (topLeader) {
          topLeader.children.push(node)
          explicitChildrenIds.add(node.id)
        }
      } else if (['ATTENDANT', 'DRIVER'].includes(norm)) {
        // Operational staff report to Coordinator or Principal
        if (coordinators.length > 0) {
          coordinators[0].children.push(node)
          explicitChildrenIds.add(node.id)
        } else if (principals.length > 0) {
          principals[0].children.push(node)
          explicitChildrenIds.add(node.id)
        } else if (topLeader) {
          topLeader.children.push(node)
          explicitChildrenIds.add(node.id)
        }
      }
    }

    // 5. Update direct reports counts recursively
    const updateCounts = (n: OrgHierarchyNode) => {
      n.children.sort((a, b) => a.name.localeCompare(b.name))
      n.directReportsCount = n.children.length
      n.children.forEach(updateCounts)
    }

    // 6. Gather root nodes
    let rootNodes = Array.from(nodeMap.values()).filter((n) => !explicitChildrenIds.has(n.id))

    // If multiple unlinked roots exist, place them under topLeader if appropriate,
    // or keep top leaders at root level
    if (rootNodes.length === 0 && topLeader) {
      rootNodes = [topLeader]
    }

    rootNodes.forEach(updateCounts)

    // Apply department or query filters if specified
    const allFlatNodes = Array.from(nodeMap.values())
    const filteredFlatNodes = allFlatNodes.filter((n) => {
      if (departmentFilter && departmentFilter !== 'ALL' && n.department.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false
      }
      if (query) {
        const matchName = n.name.toLowerCase().includes(query)
        const matchCode = n.employeeCode.toLowerCase().includes(query)
        const matchDesig = n.designation.toLowerCase().includes(query)
        const matchRole = n.role.toLowerCase().includes(query)
        return matchName || matchCode || matchDesig || matchRole
      }
      return true
    })

    return ok({
      roots: rootNodes,
      allNodes: filteredFlatNodes,
      totalStaff: nodeMap.size,
      departments: departmentStats,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)

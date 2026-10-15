import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface UserActivityQuery {
  targetIdentifier: string
  tenantId: string
  perspective?: 'ALL' | 'TARGET' | 'ACTOR'
  module?: string
  severity?: string
  search?: string
  page?: number
  limit?: number
}

export interface UserActivityItem {
  id: string
  action: string
  entity: string
  entityId?: string | null
  module?: string | null
  summary?: string | null
  severity: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
  actor: {
    id?: string | null
    name?: string | null
    role?: string | null
  }
  oldValues?: any
  newValues?: any
  perspective: 'TARGET' | 'ACTOR' | 'BOTH'
}

export interface UserActivityResponse {
  userId: string
  tenantUserId: string
  targetIds: string[]
  actorIds: string[]
  items: UserActivityItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  counts: {
    total: number
    asTarget: number
    asActor: number
  }
}

export class UserActivityService {
  /**
   * Resolves all possible identifier aliases for a given user within a tenant.
   */
  static async resolveUserAliases(identifier: string, tenantId: string) {
    const member = await db.tenantUser.findFirst({
      where: {
        tenantId,
        OR: [{ id: identifier }, { userId: identifier }],
      },
      include: {
        staffProfile: true,
        user: {
          include: {
            guardianProfile: true,
          },
        },
      },
    })

    if (!member) {
      return null
    }

    const userId = member.userId
    const tenantUserId = member.id
    const guardianId = member.user?.guardianProfile?.id
    const staffProfileId = member.staffProfile?.id

    const targetIds = Array.from(
      new Set([userId, tenantUserId, guardianId, staffProfileId].filter(Boolean) as string[])
    )
    const actorIds = Array.from(new Set([userId, tenantUserId].filter(Boolean) as string[]))

    return {
      member,
      userId,
      tenantUserId,
      targetIds,
      actorIds,
    }
  }

  /**
   * Reads per-user activity trail with perspective filtering and pagination.
   */
  static async getUserActivityTrail(query: UserActivityQuery): Promise<UserActivityResponse | null> {
    const {
      targetIdentifier,
      tenantId,
      perspective = 'ALL',
      module,
      severity,
      search,
      page = 1,
      limit = 30,
    } = query

    const resolved = await this.resolveUserAliases(targetIdentifier, tenantId)
    if (!resolved) {
      return null
    }

    const { userId, tenantUserId, targetIds, actorIds } = resolved

    // Build perspective filter
    let perspectiveFilter: Prisma.AuditLogWhereInput = {}
    if (perspective === 'TARGET') {
      perspectiveFilter = { entityId: { in: targetIds } }
    } else if (perspective === 'ACTOR') {
      perspectiveFilter = { actorId: { in: actorIds } }
    } else {
      perspectiveFilter = {
        OR: [{ entityId: { in: targetIds } }, { actorId: { in: actorIds } }],
      }
    }

    const andConditions: Prisma.AuditLogWhereInput[] = [
      { tenantId },
      perspectiveFilter,
    ]

    if (module && module !== 'ALL') {
      andConditions.push({ module })
    }

    if (severity && severity !== 'ALL') {
      andConditions.push({ severity: severity as any })
    }

    if (search && search.trim()) {
      const q = search.trim()
      andConditions.push({
        OR: [
          { summary: { contains: q, mode: 'insensitive' } },
          { action: { contains: q, mode: 'insensitive' } },
          { actorName: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    const baseWhere: Prisma.AuditLogWhereInput = {
      AND: andConditions,
    }

    const skip = Math.max(0, (page - 1) * limit)

    // Parallel execution for paginated logs + counts
    const [rawLogs, total, asTargetCount, asActorCount] = await Promise.all([
      db.auditLog.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where: baseWhere }),
      db.auditLog.count({
        where: {
          tenantId,
          entityId: { in: targetIds },
        },
      }),
      db.auditLog.count({
        where: {
          tenantId,
          actorId: { in: actorIds },
        },
      }),
    ])

    const items: UserActivityItem[] = rawLogs.map((log) => {
      let oldValues = null
      let newValues = null

      try {
        if (log.oldValues) {
          oldValues = typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues
        }
      } catch {
        oldValues = log.oldValues
      }

      try {
        if (log.newValues) {
          newValues = typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues
        }
      } catch {
        newValues = log.newValues
      }

      const isTarget = Boolean(log.entityId && targetIds.includes(log.entityId))
      const isActor = Boolean(log.actorId && actorIds.includes(log.actorId))
      const itemPerspective: 'TARGET' | 'ACTOR' | 'BOTH' =
        isTarget && isActor ? 'BOTH' : isTarget ? 'TARGET' : 'ACTOR'

      return {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        module: log.module,
        summary: log.summary,
        severity: log.severity,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        actor: {
          id: log.actorId,
          name: log.actorName,
          role: log.actorRole,
        },
        oldValues,
        newValues,
        perspective: itemPerspective,
      }
    })

    return {
      userId,
      tenantUserId,
      targetIds,
      actorIds,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        total: total,
        asTarget: asTargetCount,
        asActor: asActorCount,
      },
    }
  }
}

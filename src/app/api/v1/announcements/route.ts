import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'
import { normalizeRole } from '@/lib/roles'
import { can } from '@/lib/auth'
import { Prisma } from '@prisma/client'

/** GET /api/v1/announcements — list and filter broadcasts with pagination */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'communication:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('search')?.trim() || ''
    const statusParam = (url.searchParams.get('status') || 'PUBLISHED').toUpperCase()
    const typeParam = url.searchParams.get('type')?.trim() || ''
    const audienceParam = url.searchParams.get('audience')?.trim() || ''
    const sortParam = url.searchParams.get('sort')?.toLowerCase() === 'asc' ? 'asc' : 'desc'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const rawRoles = [session.role, ...(session.roles || [])].filter(Boolean)
    const roles = rawRoles.map(normalizeRole)
    const isParentOnly = roles.length > 0 && roles.every((r) => r === 'PARENT' || r === 'GUARDIAN')
    const canBroadcast = can(roles, 'communication:broadcast') || can(roles, 'communication:write')

    // Base conditions
    const whereConditions: Prisma.AnnouncementWhereInput[] = [
      { tenantId: session.tenantId },
    ]

    // Branch scoping
    if (session.branchId) {
      whereConditions.push({
        OR: [{ branchId: null }, { branchId: session.branchId }],
      })
    }

    // Role-specific scoping & status restriction
    if (isParentOnly) {
      // Parents can strictly ONLY see PUBLISHED announcements
      whereConditions.push({ status: 'PUBLISHED' })
      whereConditions.push({ NOT: { audience: 'ALL_STAFF' } })

      const userId = session.uid || (session as any).userId
      if (!userId) {
        whereConditions.push({
          OR: [{ audience: 'SCHOOL_WIDE' }, { audience: 'ALL_PARENTS' }],
        })
      } else {
        const linkedGuardians = await db.guardian.findMany({
          where: { tenantId: session.tenantId, userId, deletedAt: null },
          select: {
            studentLinks: {
              select: {
                student: { select: { currentClassroomId: true, branchId: true } },
              },
            },
          },
        })

        const allLinks = linkedGuardians.flatMap((g) => g.studentLinks || [])
        const classroomIds = Array.from(
          new Set(allLinks.map((l) => l.student?.currentClassroomId).filter(Boolean))
        ) as string[]
        const branchIds = Array.from(
          new Set(allLinks.map((l) => l.student?.branchId).filter(Boolean))
        ) as string[]

        whereConditions.push({
          OR: [
            { audience: 'SCHOOL_WIDE' },
            { audience: 'ALL_PARENTS' },
            ...(branchIds.length > 0 ? [{ audience: 'BRANCH_PARENTS' as const, branchId: { in: branchIds } }] : []),
            ...(classroomIds.length > 0 ? [{ audience: 'CLASS_PARENTS' as const, classroomId: { in: classroomIds } }] : []),
          ],
        })
      }
    } else if (!canBroadcast) {
      // Staff without broadcast privileges (e.g. Teacher, Staff, Accounts) strictly see PUBLISHED only
      whereConditions.push({ status: 'PUBLISHED' })
    } else {
      // Authorized staff/admin: Support status filtering
      if (statusParam && statusParam !== 'ALL') {
        const validStatuses = ['PUBLISHED', 'DRAFT', 'CANCELLED']
        if (validStatuses.includes(statusParam)) {
          whereConditions.push({ status: statusParam as any })
        } else {
          whereConditions.push({ status: 'PUBLISHED' })
        }
      }
    }

    // Category / Type filter
    if (typeParam && typeParam !== 'ALL') {
      whereConditions.push({ type: typeParam as any })
    }

    // Audience filter
    if (audienceParam && audienceParam !== 'ALL') {
      whereConditions.push({ audience: audienceParam as any })
    }

    // Fulltext search on Title and Body
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    const where: Prisma.AnnouncementWhereInput = { AND: whereConditions }

    // Execute query and total count in parallel
    const branchScope = session.branchId ? { OR: [{ branchId: null }, { branchId: session.branchId }] } : {}

    const [announcements, total, countPublished, countDrafts, countCancelled] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: [{ publishedAt: sortParam }, { id: sortParam }],
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
      db.announcement.count({ where: { tenantId: session.tenantId, ...branchScope, status: 'PUBLISHED' } }),
      canBroadcast
        ? db.announcement.count({ where: { tenantId: session.tenantId, ...branchScope, status: 'DRAFT' } })
        : Promise.resolve(0),
      canBroadcast
        ? db.announcement.count({ where: { tenantId: session.tenantId, ...branchScope, status: 'CANCELLED' } })
        : Promise.resolve(0),
    ])

    // Resolve author metadata for display
    const authorIds = Array.from(new Set(announcements.map((a) => a.authorId).filter(Boolean))) as string[]
    const authors = authorIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, fullName: true, email: true },
        })
      : []
    const authorMap = new Map(authors.map((u) => [u.id, u.fullName || u.email]))

    // Resolve classroom names for CLASS_PARENTS
    const classroomIds = Array.from(new Set(announcements.map((a) => a.classroomId).filter(Boolean))) as string[]
    const classrooms = classroomIds.length > 0
      ? await db.classroom.findMany({
          where: { id: { in: classroomIds } },
          select: { id: true, name: true, code: true },
        })
      : []
    const classroomMap = new Map(classrooms.map((c) => [c.id, c.name]))

    const enriched = announcements.map((a) => ({
      ...a,
      authorName: a.authorId ? authorMap.get(a.authorId) || 'Staff' : null,
      classroomName: a.classroomId ? classroomMap.get(a.classroomId) || null : null,
    }))

    return ok(enriched, {
      total,
      page,
      limit,
      hasMore: total > skip + announcements.length,
      counts: {
        published: countPublished,
        drafts: countDrafts,
        cancelled: countCancelled,
      },
    })
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/announcements — broadcast or draft (communication:broadcast) */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'communication:broadcast')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      title,
      body: text,
      type,
      audience,
      classroomId,
      branchId,
      status: requestedStatus,
    } = body as {
      title?: string
      body?: string
      type?: 'GENERAL' | 'HOLIDAY' | 'EMERGENCY' | 'EVENT' | 'ACHIEVEMENT' | 'IMPORTANT' | 'FEE_REMINDER' | 'ACADEMIC'
      audience?: 'ALL_PARENTS' | 'BRANCH_PARENTS' | 'CLASS_PARENTS' | 'ALL_STAFF' | 'SCHOOL_WIDE'
      classroomId?: string
      branchId?: string
      status?: 'PUBLISHED' | 'DRAFT'
    }

    const trimmedTitle = title?.trim()
    const trimmedText = text?.trim()

    if (!trimmedTitle) return Errors.validation('Announcement title is required')
    if (!trimmedText) return Errors.validation('Message body is required')

    const VALID_TYPES = [
      'GENERAL',
      'HOLIDAY',
      'EMERGENCY',
      'EVENT',
      'ACHIEVEMENT',
      'IMPORTANT',
      'FEE_REMINDER',
      'ACADEMIC',
    ]
    const VALID_AUDIENCES = ['SCHOOL_WIDE', 'ALL_PARENTS', 'CLASS_PARENTS', 'ALL_STAFF', 'BRANCH_PARENTS']

    const announcementType = type && VALID_TYPES.includes(type) ? type : 'GENERAL'
    const announcementAudience = audience && VALID_AUDIENCES.includes(audience) ? audience : 'SCHOOL_WIDE'
    const status = requestedStatus === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'

    // Conditional Classroom Validation
    let validatedClassroomId: string | null = null
    if (announcementAudience === 'CLASS_PARENTS') {
      if (!classroomId) {
        return Errors.validation('Classroom is required when targeting class parents')
      }
      const classroom = await db.classroom.findFirst({
        where: { id: classroomId, tenantId: session.tenantId, isActive: true },
      })
      if (!classroom) {
        return Errors.validation('Selected classroom does not exist or is inactive')
      }
      validatedClassroomId = classroom.id
    }

    // Branch targeting
    let validatedBranchId: string | null = null
    const targetBranch = branchId || session.branchId
    if (announcementAudience === 'BRANCH_PARENTS') {
      if (targetBranch) {
        const branch = await db.branch.findFirst({
          where: { id: targetBranch, tenantId: session.tenantId, isActive: true },
        })
        if (branch) validatedBranchId = branch.id
      }
    } else if (session.branchId) {
      validatedBranchId = session.branchId
    }

    const announcement = await db.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          tenantId: session.tenantId,
          branchId: validatedBranchId || undefined,
          title: trimmedTitle,
          body: trimmedText,
          type: announcementType,
          audience: announcementAudience,
          classroomId: validatedClassroomId || undefined,
          authorId: session.uid,
          status,
          publishedAt: new Date(),
        },
      })

      // Fan-out to parent timelines ONLY when PUBLISHED and for eligible family audiences (NEVER for DRAFT or ALL_STAFF)
      if (status === 'PUBLISHED' && announcementAudience !== 'ALL_STAFF') {
        const students = await tx.student.findMany({
          where: {
            tenantId: session.tenantId!,
            status: 'ACTIVE',
            deletedAt: null,
            ...(announcementAudience === 'CLASS_PARENTS' && validatedClassroomId
              ? { currentClassroomId: validatedClassroomId }
              : {}),
            ...(announcementAudience === 'BRANCH_PARENTS' && validatedBranchId
              ? { branchId: validatedBranchId }
              : {}),
          },
          select: { id: true },
          take: 500,
        })

        if (students.length > 0) {
          await tx.timelineEntry.createMany({
            data: students.map((s) => ({
              tenantId: session.tenantId!,
              studentId: s.id,
              classroomId: validatedClassroomId || undefined,
              type: 'NOTE',
              title: `Announcement: ${trimmedTitle}`,
              body: trimmedText,
            })),
          })
        }
      }

      return created
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: status === 'DRAFT' ? 'CREATE_DRAFT' : 'CREATE',
      entity: 'Announcement',
      entityId: announcement.id,
      summary: `${status === 'DRAFT' ? 'Saved draft' : 'Broadcast'} "${trimmedTitle}" (${announcementType}) to ${announcementAudience}`,
    })

    return ok({ announcementId: announcement.id, status: announcement.status }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

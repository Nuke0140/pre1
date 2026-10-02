import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'
import { normalizeRole } from '@/lib/roles'
import { can } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

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

/** GET /api/v1/announcements/[id] — fetch single announcement detail */
async function _GET(req: NextRequest, ctx: RouteContext) {
  const session = await requireApi(req, 'communication:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await ctx.params
  if (!id) return Errors.validation('Announcement ID is required')

  try {
    const announcement = await db.announcement.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!announcement) {
      return Errors.notFound('Announcement not found')
    }

    // Branch isolation for branch-scoped sessions
    if (session.branchId && announcement.branchId && announcement.branchId !== session.branchId) {
      return Errors.forbidden('Announcement is scoped to a different branch')
    }

    const rawRoles = [session.role, ...(session.roles || [])].filter(Boolean)
    const roles = rawRoles.map(normalizeRole)
    const isParentOnly = roles.length > 0 && roles.every((r) => r === 'PARENT' || r === 'GUARDIAN')
    const canBroadcast = can(roles, 'communication:broadcast') || can(roles, 'communication:write')

    // Restrict drafts and non-published notices to authorized broadcasters
    if (announcement.status !== 'PUBLISHED' && !canBroadcast) {
      return Errors.forbidden('Access restricted to published announcements')
    }

    // Role-based security checks for parents
    if (isParentOnly) {
      if (announcement.status !== 'PUBLISHED') {
        return Errors.forbidden('Access restricted to published announcements')
      }
      if (announcement.audience === 'ALL_STAFF') {
        return Errors.forbidden('Access restricted')
      }

      const userId = session.uid || (session as any).userId
      if (announcement.audience === 'CLASS_PARENTS' || announcement.audience === 'BRANCH_PARENTS') {
        if (!userId) return Errors.forbidden('Parent profile required')

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
        const classroomIds = allLinks.map((l) => l.student?.currentClassroomId).filter(Boolean)
        const branchIds = allLinks.map((l) => l.student?.branchId).filter(Boolean)

        if (announcement.audience === 'CLASS_PARENTS' && (!announcement.classroomId || !classroomIds.includes(announcement.classroomId))) {
          return Errors.forbidden('Announcement is scoped to a different classroom')
        }
        if (announcement.audience === 'BRANCH_PARENTS' && (!announcement.branchId || !branchIds.includes(announcement.branchId))) {
          return Errors.forbidden('Announcement is scoped to a different branch')
        }
      }
    }

    // Resolve author name
    let authorName: string | null = null
    if (announcement.authorId) {
      const author = await db.user.findUnique({
        where: { id: announcement.authorId },
        select: { fullName: true, email: true },
      })
      if (author) authorName = author.fullName || author.email
    }

    // Resolve classroom name
    let classroomName: string | null = null
    if (announcement.classroomId) {
      const classroom = await db.classroom.findUnique({
        where: { id: announcement.classroomId },
        select: { name: true },
      })
      if (classroom) classroomName = classroom.name
    }

    return ok({
      ...announcement,
      authorName: authorName || 'Staff',
      classroomName,
    })
  } catch (e) {
    return Errors.system(e)
  }
}

/** PATCH /api/v1/announcements/[id] — update draft/published, publish draft, or cancel notice */
async function _PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await requireApi(req, 'communication:broadcast')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await ctx.params
  if (!id) return Errors.validation('Announcement ID is required')

  try {
    const existing = await db.announcement.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return Errors.notFound('Announcement not found')
    }

    // Branch isolation for branch-scoped sessions
    if (session.branchId && existing.branchId && existing.branchId !== session.branchId) {
      return Errors.forbidden('Announcement is scoped to a different branch')
    }

    const body = await req.json()
    const {
      title,
      body: text,
      type,
      audience,
      classroomId,
      branchId,
      status: targetStatus,
      action,
    } = body as {
      title?: string
      body?: string
      type?: string
      audience?: string
      classroomId?: string
      branchId?: string
      status?: 'PUBLISHED' | 'DRAFT' | 'CANCELLED'
      action?: 'PUBLISH' | 'CANCEL' | 'SAVE'
    }

    // 1. Determine action: Cancellation
    if (action === 'CANCEL' || targetStatus === 'CANCELLED') {
      if (existing.status === 'CANCELLED') {
        return ok(existing)
      }
      const updated = await db.announcement.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
        },
      })

      await audit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        action: 'CANCEL',
        entity: 'Announcement',
        entityId: existing.id,
        summary: `Cancelled notice "${existing.title}"`,
      })

      return ok(updated)
    }

    // State Transition Guards
    if (existing.status === 'CANCELLED') {
      return Errors.validation('Cancelled notices cannot be edited or published')
    }

    if (existing.status === 'PUBLISHED' && targetStatus === 'DRAFT') {
      return Errors.validation('Published announcements cannot be reverted to draft status')
    }

    // 2. Compute updated fields
    const updatedTitle = title !== undefined ? title.trim() : existing.title
    const updatedBody = text !== undefined ? text.trim() : existing.body
    const updatedType = type && VALID_TYPES.includes(type) ? (type as any) : existing.type
    const updatedAudience = audience && VALID_AUDIENCES.includes(audience) ? (audience as any) : existing.audience

    if (!updatedTitle) return Errors.validation('Announcement title cannot be empty')
    if (!updatedBody) return Errors.validation('Message body cannot be empty')

    // Classroom validation
    let validatedClassroomId = existing.classroomId
    if (updatedAudience === 'CLASS_PARENTS') {
      const targetClassroomId = classroomId !== undefined ? classroomId : existing.classroomId
      if (!targetClassroomId) {
        return Errors.validation('Classroom is required when targeting class parents')
      }
      const classroom = await db.classroom.findFirst({
        where: { id: targetClassroomId, tenantId: session.tenantId, isActive: true },
      })
      if (!classroom) {
        return Errors.validation('Selected classroom does not exist or is inactive')
      }
      validatedClassroomId = classroom.id
    } else if (audience !== undefined && updatedAudience !== 'CLASS_PARENTS') {
      validatedClassroomId = null
    }

    // Branch targeting
    let validatedBranchId = existing.branchId
    if (updatedAudience === 'BRANCH_PARENTS') {
      const targetBranch = branchId || existing.branchId || session.branchId
      if (targetBranch) {
        const branch = await db.branch.findFirst({
          where: { id: targetBranch, tenantId: session.tenantId, isActive: true },
        })
        if (branch) validatedBranchId = branch.id
      }
    }

    // 3. Determine if this is a PUBLISH action
    const isPublishingDraft =
      (action === 'PUBLISH' || targetStatus === 'PUBLISHED') && existing.status === 'DRAFT'

    let updated: any = null

    if (isPublishingDraft) {
      const txResult = await db.$transaction(async (tx) => {
        // Atomic status transition from DRAFT to PUBLISHED
        const updateResult = await tx.announcement.updateMany({
          where: { id: existing.id, status: 'DRAFT', tenantId: session.tenantId! },
          data: {
            title: updatedTitle,
            body: updatedBody,
            type: updatedType,
            audience: updatedAudience,
            classroomId: validatedClassroomId,
            branchId: validatedBranchId,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        })

        if (updateResult.count === 0) {
          // Already published by a concurrent request
          const current = await tx.announcement.findUnique({ where: { id: existing.id } })
          return { announcement: current, alreadyPublished: true }
        }

        // Fan-out to parent timelines ONLY when PUBLISHED and for eligible family audiences (NEVER for ALL_STAFF)
        if (updatedAudience !== 'ALL_STAFF') {
          const students = await tx.student.findMany({
            where: {
              tenantId: session.tenantId!,
              status: 'ACTIVE',
              deletedAt: null,
              ...(updatedAudience === 'CLASS_PARENTS' && validatedClassroomId
                ? { currentClassroomId: validatedClassroomId }
                : {}),
              ...(updatedAudience === 'BRANCH_PARENTS' && validatedBranchId
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
                title: `Announcement: ${updatedTitle}`,
                body: updatedBody,
              })),
            })
          }
        }

        const current = await tx.announcement.findUnique({ where: { id: existing.id } })
        return { announcement: current, alreadyPublished: false }
      })

      updated = txResult.announcement

      if (!txResult.alreadyPublished) {
        await audit({
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          action: 'PUBLISH',
          entity: 'Announcement',
          entityId: existing.id,
          summary: `Published draft "${updatedTitle}" (${updatedType}) to ${updatedAudience}`,
        })
      }

      return ok(updated)
    }

    const newStatus = targetStatus === 'DRAFT' ? 'DRAFT' : existing.status

    updated = await db.announcement.update({
      where: { id: existing.id },
      data: {
        title: updatedTitle,
        body: updatedBody,
        type: updatedType,
        audience: updatedAudience,
        classroomId: validatedClassroomId,
        branchId: validatedBranchId,
        status: newStatus,
      },
    })

    // Audit log for regular update
    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: existing.id,
      summary: `Updated notice "${updatedTitle}" (${updatedType})`,
    })

    return ok(updated)
  } catch (e) {
    return Errors.system(e)
  }
}

/** DELETE /api/v1/announcements/[id] — discard draft or soft-cancel notice */
async function _DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await requireApi(req, 'communication:broadcast')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await ctx.params
  if (!id) return Errors.validation('Announcement ID is required')

  try {
    const existing = await db.announcement.findFirst({
      where: { id, tenantId: session.tenantId },
    })

    if (!existing) {
      return Errors.notFound('Announcement not found')
    }

    // Branch isolation for branch-scoped sessions
    if (session.branchId && existing.branchId && existing.branchId !== session.branchId) {
      return Errors.forbidden('Announcement is scoped to a different branch')
    }

    if (existing.status === 'DRAFT') {
      // Un-published drafts can be discarded completely
      await db.announcement.delete({
        where: { id: existing.id },
      })

      await audit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        action: 'DISCARD_DRAFT',
        entity: 'Announcement',
        entityId: existing.id,
        summary: `Discarded draft announcement "${existing.title}"`,
      })

      return ok({ id: existing.id, discarded: true })
    }

    if (existing.status === 'CANCELLED') {
      return ok({ id: existing.id, cancelled: true, status: 'CANCELLED' })
    }

    // Published notices should not be physically destroyed to protect audit trail; mark CANCELLED
    const cancelled = await db.announcement.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CANCEL',
      entity: 'Announcement',
      entityId: existing.id,
      summary: `Cancelled announcement "${existing.title}"`,
    })

    return ok({ id: existing.id, cancelled: true, status: cancelled.status })
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

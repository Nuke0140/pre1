import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { assertResourceScope, tenantScopedIdWhere } from '@/lib/security/resource-scope'
import { audit } from '@/lib/sequence'

/**
 * GET /api/v1/observations/[id] — Retrieve single observation
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const observation = await db.observation.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId),
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        classroom: { select: { id: true, name: true, branchId: true } },
      },
    })

    if (!observation) return Errors.notFound('Observation')

    assertResourceScope(session, {
      tenantId: observation.tenantId,
      branchId: observation.classroom?.branchId,
    })

    return ok(observation)
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * PATCH /api/v1/observations/[id] — Update observation details
 */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const observation = await db.observation.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId),
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { branchId: true } },
      },
    })

    if (!observation) return Errors.notFound('Observation')

    assertResourceScope(session, {
      tenantId: observation.tenantId,
      branchId: observation.classroom?.branchId,
    })

    // Check teacher ownership
    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isInstitutionAdmin = effectiveRoles.some((r) => ['OWNER', 'PRINCIPAL', 'ADMIN', 'PLATFORM_ADMIN'].includes(r))
    if (!isInstitutionAdmin && effectiveRoles.includes('TEACHER')) {
      if (observation.teacherId && observation.teacherId !== session.uid) {
        return Errors.forbidden('You can only edit observations you authored')
      }
    }

    const body = await req.json().catch(() => ({}))
    const { narrative, milestoneTags, category, concern, observedAt } = body

    if (narrative !== undefined) {
      if (!narrative.trim()) {
        return Errors.validation('Observation narrative cannot be empty', 'narrative')
      }
      if (narrative.trim().length < 10) {
        return Errors.validation('Observation narrative must be at least 10 characters', 'narrative')
      }
    }

    if (concern !== undefined && !['NORMAL', 'PROGRESS', 'NEEDS_ATTENTION', 'URGENT'].includes(concern)) {
      return Errors.validation('concern must be NORMAL, PROGRESS, NEEDS_ATTENTION or URGENT')
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.observation.update({
        where: { id },
        data: {
          ...(narrative !== undefined ? { narrative: narrative.trim() } : {}),
          ...(milestoneTags !== undefined ? { milestoneTags: milestoneTags?.trim() || null } : {}),
          ...(category !== undefined ? { category: category?.trim() || null } : {}),
          ...(concern !== undefined ? { concern } : {}),
          ...(observedAt !== undefined ? { observedAt: new Date(observedAt) } : {}),
        },
      })

      // If narrative was updated, update any synchronized timeline entries
      if (narrative !== undefined) {
        await tx.timelineEntry.updateMany({
          where: { observationId: id },
          data: { body: narrative.trim() },
        })
      }

      return result
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'UPDATE',
      entity: 'Observation',
      entityId: id,
      summary: `Updated observation for ${observation.student.firstName}`,
    })

    return ok(updated)
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * DELETE /api/v1/observations/[id] — Delete observation
 */
async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const observation = await db.observation.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId),
      include: {
        student: { select: { firstName: true } },
        classroom: { select: { branchId: true } },
      },
    })

    if (!observation) return Errors.notFound('Observation')

    assertResourceScope(session, {
      tenantId: observation.tenantId,
      branchId: observation.classroom?.branchId,
    })

    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isInstitutionAdmin = effectiveRoles.some((r) => ['OWNER', 'PRINCIPAL', 'ADMIN', 'PLATFORM_ADMIN'].includes(r))
    if (!isInstitutionAdmin && effectiveRoles.includes('TEACHER')) {
      if (observation.teacherId && observation.teacherId !== session.uid) {
        return Errors.forbidden('You can only delete observations you authored')
      }
    }

    await db.$transaction(async (tx) => {
      await tx.timelineEntry.deleteMany({ where: { observationId: id } })
      await tx.observation.delete({ where: { id } })
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'DELETE',
      entity: 'Observation',
      entityId: id,
      summary: `Deleted observation for ${observation.student.firstName}`,
    })

    return ok({ success: true, message: 'Observation deleted' })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

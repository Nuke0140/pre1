import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** GET /api/v1/observations — list (teacher sees own; principal sees all) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'academics:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const observations = await db.observation.findMany({
      where: {
        tenantId: session.tenantId,
        ...(session.role === 'TEACHER' ? { teacherId: session.uid } : {}),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        classroom: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    })
    return ok(
      observations.map((o) => ({
        id: o.id,
        studentName: `${o.student.firstName} ${o.student.lastName || ''}`.trim(),
        studentId: o.studentId,
        classroom: o.classroom?.name ?? null,
        narrative: o.narrative,
        milestoneTags: o.milestoneTags,
        status: o.status,
        observedAt: o.observedAt,
        publishedAt: o.publishedAt,
      }))
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/observations — record observation (min 20 chars per PRD) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'academics:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { studentId, narrative, milestoneTags } = body as {
      studentId: string
      narrative: string
      milestoneTags?: string
    }
    if (!studentId || !narrative) {
      return Errors.validation('studentId and narrative are required')
    }
    if (narrative.trim().length < 20) {
      return Errors.validation('Observation narrative must be at least 20 characters', 'narrative')
    }

    const student = await db.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId },
    })
    if (!student) return Errors.notFound('Student')

    const observation = await db.observation.create({
      data: {
        tenantId: session.tenantId,
        studentId,
        classroomId: student.currentClassroomId,
        teacherId: session.uid,
        narrative: narrative.trim(),
        milestoneTags: milestoneTags || null,
        status: 'DRAFT',
      },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Observation',
      entityId: observation.id,
      summary: `Observation recorded for ${student.firstName}`,
    })

    return ok({ observationId: observation.id }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

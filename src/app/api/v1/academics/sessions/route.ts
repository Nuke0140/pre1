import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/academics/sessions — alias for /api/v1/academic-years */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sessions = await db.academicSession.findMany({
      where: { tenantId: session.tenantId },
      include: { _count: { select: { classrooms: true, calendarEvents: true } } },
      orderBy: { startDate: 'desc' },
    })
    return ok(sessions.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      isCurrent: s.isCurrent,
      classrooms: s._count.classrooms,
      calendarEvents: s._count.calendarEvents,
    })))
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

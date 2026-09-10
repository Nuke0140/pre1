import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** PATCH /api/v1/programs/{id} — update / deactivate program */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  const { id } = await params

  try {
    const program = await db.program.findFirst({ where: { id, tenantId: session.tenantId, deletedAt: null } })
    if (!program) return Errors.notFound('Program')
    const body = await req.json()
    const allowed = ['name', 'description', 'ageMinMonths', 'ageMaxMonths', 'durationMonths', 'capacity', 'isActive'] as const
    const data: Record<string, unknown> = {}
    for (const k of allowed) if (k in body) {
      const v = body[k]
      data[k] = v === '' ? null : (['ageMinMonths', 'ageMaxMonths', 'durationMonths', 'capacity'].includes(k) ? Number(v) : v)
    }
    if (Object.keys(data).length === 0) return Errors.validation('No editable fields provided')

    const updated = await db.program.update({ where: { id }, data })
    await audit({
      tenantId: session.tenantId, actorId: session.uid, actorName: session.name,
      action: 'UPDATE', entity: 'Program', entityId: id,
      summary: `Updated program ${updated.name}: ${Object.keys(data).join(', ')}`,
    })
    return ok({ id: updated.id, name: updated.name, isActive: updated.isActive })
  } catch (e) {
    return Errors.system(e)
  }
}

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'
import { raiseFollowUp } from '@/lib/followups'
import { registerIntegrations } from '@/lib/integrations'

/**
 * POST /api/v1/applications/{id}/waitlist — capacity-aware admission path
 * (Spec §9/Scenario 5). WAITLISTED is an existing ApplicationStatus value.
 * Body: { reason? } — audited; follow-up keeps the waitlist visible until resolved.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  registerIntegrations()

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const app = await db.admissionApplication.findFirst({ where: { id, tenantId: session.tenantId } })
    if (!app) return Errors.notFound('Application')
    if (['ENROLLED', 'REJECTED', 'WITHDRAWN'].includes(app.status)) {
      return Errors.conflict(`Cannot waitlist an application in status ${app.status}`)
    }

    const updated = await db.admissionApplication.update({
      where: { id },
      data: { status: 'WAITLISTED', notes: body.reason ? `Waitlisted: ${body.reason}` : app.notes },
    })

    await raiseFollowUp({
      tenantId: session.tenantId,
      domain: 'ADMISSION',
      severity: 'INFO',
      title: `Application ${app.applicationNumber} waitlisted`,
      detail: body.reason || 'Section full or admission deferred — follow up for waitlist offer.',
      sourceType: 'AdmissionApplication',
      sourceId: id,
      dedupeKey: `waitlist:${id}`,
      responsibleRole: 'COORDINATOR',
      actorId: session.uid,
      actorName: session.name,
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'WAITLIST',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `${app.applicationNumber} waitlisted${body.reason ? ` — ${body.reason}` : ''}`,
    })

    return ok({ id: updated.id, status: updated.status })
  } catch (e) {
    return Errors.system(e)
  }
}

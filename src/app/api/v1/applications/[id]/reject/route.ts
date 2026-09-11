import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** POST /api/v1/applications/{id}/reject */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:approve')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const reason: string = body.reason || 'Did not meet admission criteria'

    const app = await db.admissionApplication.findUnique({ where: { id } })
    if (!app) return Errors.notFound('Application')
    if (app.status === 'ENROLLED') {
      return Errors.conflict('Cannot reject an enrolled application')
    }

    await db.admissionApplication.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'REJECT',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `Rejected ${app.applicationNumber}: ${reason}`,
    })

    return ok({ status: 'REJECTED' })
  } catch (e) {
    return Errors.system(e)
  }
}

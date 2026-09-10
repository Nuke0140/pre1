import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/** PATCH /api/v1/leads/{id} — update status/notes (pipeline move) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const body = await req.json()
    const { status, notes, nextFollowUpAt } = body
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(nextFollowUpAt ? { nextFollowUpAt: new Date(nextFollowUpAt) } : {}),
      },
    })
    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'UPDATE',
      entity: 'Lead',
      entityId: id,
      summary: `Lead ${lead.leadNumber} → ${status || 'updated'}`,
    })
    return ok(lead)
  } catch {
    return Errors.notFound('Lead')
  }
}

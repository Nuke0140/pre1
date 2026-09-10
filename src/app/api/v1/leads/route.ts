import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'

/** GET /api/v1/leads — CRM pipeline (crm:read → admissions staff) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const leads = await db.lead.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return ok(leads)
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/leads — capture a lead (walk-in / call / website) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { parentName, phone, source, childName, childDob, interestedProgram, notes, email } = body
    if (!parentName || !phone) {
      return Errors.validation('parentName and phone are required')
    }

    const leadNumber = await nextNumber('lead', session.tenantId)
    const lead = await db.lead.create({
      data: {
        tenantId: session.tenantId,
        leadNumber,
        parentName,
        phone,
        email: email || null,
        source: source || 'WALK_IN',
        childName: childName || null,
        childDob: childDob ? new Date(childDob) : null,
        interestedProgram: interestedProgram || null,
        notes: notes || null,
      },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Lead',
      entityId: lead.id,
      summary: `New lead ${leadNumber}: ${parentName}`,
    })

    return ok(lead, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

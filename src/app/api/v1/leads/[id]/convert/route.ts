import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'

/** POST /api/v1/leads/{id}/convert — Lead → Admission Application */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const lead = await db.lead.findUnique({ where: { id } })
    if (!lead || lead.deletedAt) return Errors.notFound('Lead')
    if (lead.status === 'CONVERTED') {
      return Errors.conflict('Lead is already converted')
    }

    const applicationNumber = await nextNumber('application', session.tenantId)
    const branch = await db.branch.findFirst({
      where: { tenantId: session.tenantId, isMain: true },
    })
    if (!branch) return Errors.notFound('Branch')

    const application = await db.$transaction(async (tx) => {
      const app = await tx.admissionApplication.create({
        data: {
          tenantId: session.tenantId!,
          branchId: branch.id,
          applicationNumber,
          leadId: lead.id,
          programType: lead.interestedProgram || 'NURSERY',
          childFirstName: lead.childName || lead.parentName.split(' ')[0] || 'Child',
          childDob: lead.childDob || new Date(new Date().getFullYear() - 3, 0, 1),
          childGender: 'UNSPECIFIED',
          parentName: lead.parentName,
          parentPhone: lead.phone,
          parentEmail: lead.email,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'APPLICATION_STARTED', convertedApplicationId: app.id },
      })
      return app
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CONVERT',
      entity: 'Lead',
      entityId: lead.id,
      summary: `Lead ${lead.leadNumber} converted to application ${applicationNumber}`,
    })

    return ok({ applicationId: application.id, applicationNumber }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

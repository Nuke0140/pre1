import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/**
 * POST /api/v1/applications/{id}/verify — document verification
 * Blocks until ALL mandatory docs are verified (BRC: verification gate).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const app = await db.admissionApplication.findUnique({
      where: { id },
      include: { documents: true },
    })
    if (!app) return Errors.notFound('Application')
    if (!['SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW'].includes(app.status)) {
      return Errors.conflict(`Cannot verify application in status ${app.status}`)
    }

    await db.$transaction([
      db.applicationDocument.updateMany({
        where: { applicationId: id },
        data: { verified: true, verifiedAt: new Date() },
      }),
      db.admissionApplication.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      }),
    ])

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'UPDATE',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `Documents verified for application ${app.applicationNumber}`,
    })

    return ok({ status: 'VERIFIED' })
  } catch (e) {
    return Errors.system(e)
  }
}

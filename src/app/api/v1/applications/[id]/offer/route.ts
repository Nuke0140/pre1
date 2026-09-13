import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/applications/[id]/offer — Generate Admission Offer
 * Resolves child, guardian, school profile, program, and fee quote.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const app = await db.admissionApplication.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: { tenant: true },
    })
    if (!app) return Errors.notFound('Application')

    // Find Fee plan quote
    const feePlan = await db.feePlan.findFirst({
      where: { tenantId: session.tenantId, programType: app.programType, isActive: true },
      include: { items: true },
    })

    const branch = await db.branch.findFirst({
      where: { id: app.branchId, tenantId: session.tenantId },
    })

    const validityDays = body.validityDays ? Number(body.validityDays) : 7
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validityDays)

    const offerNumber = `OFR-${app.applicationNumber.replace('ADM-', '')}`

    const offerData = {
      offerNumber,
      schoolName: app.tenant.name,
      branchName: branch?.name || 'Main Branch',
      childName: `${app.childFirstName} ${app.childLastName || ''}`.trim(),
      parentName: app.parentName,
      program: app.programType,
      validUntil: validUntil.toISOString(),
      feeTotalRupees: (feePlan?.totalAnnualCents || 0) / 100,
      feeBreakdown: (feePlan?.items || []).map((i) => ({
        label: i.label,
        amountRupees: i.amountCents / 100,
      })),
      instructions: 'Please accept this offer within the validity period to guarantee your child seat.',
    }

    // Update application notes/metadata
    await db.admissionApplication.update({
      where: { id },
      data: {
        notes: app.notes
          ? `${app.notes}\n[Offer Generated: ${offerNumber}, Valid until ${validUntil.toLocaleDateString()}]`
          : `[Offer Generated: ${offerNumber}, Valid until ${validUntil.toLocaleDateString()}]`,
      },
    })

    await audit({
      tenantId: session.tenantId,
      branchId: app.branchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'OFFER_GENERATED',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `Admission offer ${offerNumber} generated for ${app.childFirstName}`,
    })

    return ok(offerData)
  } catch (e: any) {
    return Errors.system(e)
  }
}

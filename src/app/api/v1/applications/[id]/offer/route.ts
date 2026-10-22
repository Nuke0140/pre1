import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/applications/[id]/offer — Generate and persist Admission Offer
 * Resolves child, guardian, school profile, program, and fee quote.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  const app = await db.admissionApplication.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { branchId: true },
  })
  if (!app) return Errors.notFound('Application not found')

  const branchErr = await requireBranchAccess(session, app.branchId)
  if (branchErr) return branchErr
  const body = await req.json().catch(() => ({}))

  try {
    const validityDays = body.validityDays ? Number(body.validityDays) : 7
    const terms = body.terms || undefined

    const result = await AdmissionService.generateOffer(
      {
        tenantId: session.tenantId,
        branchId: body.branchId || session.branchId || '',
        academicYearId: body.academicYearId || '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      {
        validityDays,
        terms,
        feePlanId: body.feePlanId || undefined,
      }
    )

    return ok(result, undefined, 201)
  } catch (e: any) {
    return Errors.business('OFFER_GENERATION_FAILED', e.message || 'Failed to generate admission offer', 422)
  }
}

export const POST = withApi(_POST)

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * GET /api/v1/applications/[id] — Full review & detail summary for an admission form
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params
  const sp = req.nextUrl.searchParams
  const rawBranchId = sp.get('branchId')
  const branchId =
    rawBranchId && rawBranchId !== '__ALL_BRANCHES__' && rawBranchId.toLowerCase() !== 'all'
      ? rawBranchId
      : (session.branchId || '')
  const rawAcademicYearId = sp.get('academicYearId')
  const academicYearId =
    rawAcademicYearId && rawAcademicYearId !== '__ALL_SESSIONS__' && rawAcademicYearId.toLowerCase() !== 'all'
      ? rawAcademicYearId
      : ''

  try {
    const reviewData = await AdmissionService.reviewApplication(
      {
        tenantId: session.tenantId,
        branchId: branchId || '',
        academicYearId: academicYearId || '',
        actorId: session.uid,
        actorName: session.name,
      },
      id
    )

    return ok(reviewData)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('ADMISSION_REVIEW_FAILED', e.message || 'Failed to review application')
  }
}

/**
 * PATCH /api/v1/applications/[id] — Update draft notes, child, or parent details
 */
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const body = await req.json()
    const app = await db.admissionApplication.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
    })
    if (!app) return Errors.notFound('Application')

    if (app.status === 'ENROLLED' || app.status === 'ADMITTED') {
      return Errors.conflict('Cannot modify an already enrolled application')
    }

    const updated = await AdmissionService.updateApplication(
      {
        tenantId: session.tenantId,
        branchId: session.branchId || app.branchId,
        academicYearId: app.academicSessionId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      body
    )

    return ok(updated)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('APPLICATION_UPDATE_FAILED', e.message || 'Failed to update application', 422)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)

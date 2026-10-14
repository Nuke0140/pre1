import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { tenantScopedIdWhere, assertResourceScope } from '@/lib/security/resource-scope'

/**
 * POST /api/v1/applications/{id}/verify — Document Verification & Correction
 * Body: { documentId?: string, action?: 'VERIFY' | 'NEEDS_CORRECTION', remarks?: string }
 * If documentId is omitted, verifies all pending documents for the application.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const { documentId, action, remarks } = body

    if (documentId) {
      const res = await AdmissionService.updateDocumentStatus(
        {
          tenantId: session.tenantId,
          branchId: session.branchId || '',
          academicYearId: '',
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        documentId,
        action || 'VERIFY',
        remarks
      )
      return ok(res)
    }

    // Verify all docs for this application
    const { db } = await import('@/lib/db')
    const { audit } = await import('@/lib/sequence')
    const { getDomainConfig, getAdmissionConfig } = await import('@/lib/config')

    const app = await db.admissionApplication.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId, { deletedAt: null }),
      include: { documents: true },
    })
    if (!app) return Errors.notFound('Application')

    assertResourceScope(session, { tenantId: app.tenantId, branchId: app.branchId })

    const admCfg = getAdmissionConfig(await getDomainConfig(session.tenantId, 'ADMISSION'))
    const requiredDocTypes: string[] = admCfg.requiredDocuments || ['BIRTH_CERTIFICATE', 'PHOTO']

    // Only verify documents that are actually uploaded
    const uploadedDocs = app.documents.filter((d) => d.status === 'UPLOADED' || (d.fileName && !d.fileName.endsWith('-pending.pdf') && d.status !== 'NOT_UPLOADED'))

    if (uploadedDocs.length === 0) {
      return Errors.business('NO_UPLOADED_DOCUMENTS', 'No uploaded documents available to verify. Please upload mandatory documents first.', 422)
    }

    const uploadedDocIds = uploadedDocs.map((d) => d.id)

    await db.applicationDocument.updateMany({
      where: { id: { in: uploadedDocIds } },
      data: { status: 'VERIFIED', verified: true, verifiedAt: new Date(), rejectionReason: null },
    })

    // Check mandatory documents completeness
    const missingRequired = requiredDocTypes.filter((reqType) => {
      const match = app.documents.find((d) => d.docType === reqType && (uploadedDocIds.includes(d.id) || d.verified || d.status === 'VERIFIED'))
      return !match
    })

    const allMandatoryVerified = missingRequired.length === 0

    if (allMandatoryVerified) {
      await db.admissionApplication.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      })
    }

    await audit({
      tenantId: session.tenantId,
      branchId: app.branchId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: 'DOC_VERIFY_ALL',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `Verified ${uploadedDocs.length} uploaded document(s) for application ${app.applicationNumber}`,
    })

    return ok({
      status: allMandatoryVerified ? 'VERIFIED' : app.status,
      allMandatoryVerified,
      missingRequired,
      verifiedCount: uploadedDocs.length,
    })
  } catch (e: any) {
    return Errors.business('VERIFICATION_FAILED', e.message || 'Failed to verify documents', 422)
  }
}

export const POST = withApi(_POST)

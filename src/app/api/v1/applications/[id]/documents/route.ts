import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { getDomainConfig, getAdmissionConfig } from '@/lib/config'
import { DocumentType } from '@prisma/client'

/**
 * GET /api/v1/applications/[id]/documents — List documents with mandatory policy flags
 */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const app = await db.admissionApplication.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: { documents: true },
    })
    if (!app) return Errors.notFound('Application')

    const admCfg = getAdmissionConfig(await getDomainConfig(session.tenantId, 'ADMISSION'))
    const requiredDocTypes: string[] = admCfg.requiredDocuments || ['BIRTH_CERTIFICATE', 'PHOTO']

    const docs = app.documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      fileName: d.fileName,
      status: d.status,
      verified: d.verified,
      verifiedAt: d.verifiedAt,
      uploadedAt: d.uploadedAt,
      rejectionReason: d.rejectionReason,
      remarks: d.remarks,
      isMandatory: requiredDocTypes.includes(d.docType),
    }))

    return ok({ documents: docs, requiredDocTypes })
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/applications/[id]/documents — Attach an uploaded document
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
    const body = await req.json()
    const { docType, fileName, remarks } = body

    if (!docType || !fileName) {
      return Errors.validation('Both docType and fileName are required to attach a document')
    }

    const doc = await AdmissionService.attachDocument(
      {
        tenantId: session.tenantId,
        branchId: session.branchId || '',
        academicYearId: '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      {
        docType: docType as DocumentType,
        fileName,
        remarks,
      }
    )

    return ok(doc, undefined, 201)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('DOCUMENT_ATTACH_FAILED', e.message || 'Failed to attach document', 422)
  }
}

/**
 * DELETE /api/v1/applications/[id]/documents — Remove or reset an uploaded document
 */
async function _DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const sp = req.nextUrl.searchParams
    const documentId = sp.get('documentId')
    if (!documentId) {
      return Errors.validation('documentId parameter is required to remove a document')
    }

    const doc = await AdmissionService.removeDocument(
      {
        tenantId: session.tenantId,
        branchId: session.branchId || '',
        academicYearId: '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      documentId
    )

    return ok(doc)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('DOCUMENT_REMOVE_FAILED', e.message || 'Failed to remove document', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
export const DELETE = withApi(_DELETE)

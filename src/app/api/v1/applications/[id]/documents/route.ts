import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { getDomainConfig, getAdmissionConfig } from '@/lib/config'
import { DocumentType } from '@prisma/client'
import { S3StorageService } from '@/lib/storage/s3-storage-service'

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

  const app = await db.admissionApplication.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { branchId: true },
  })
  if (!app) return Errors.notFound('Application')

  const branchErr = await requireBranchAccess(session, app.branchId)
  if (branchErr) return branchErr

  try {
    const app = await db.admissionApplication.findFirst({
      where: { id, tenantId: session.tenantId, deletedAt: null },
      include: { documents: true },
    })
    if (!app) return Errors.notFound('Application')

    const branchErr = await requireBranchAccess(session, app.branchId)
    if (branchErr) return branchErr

    const admCfg = getAdmissionConfig(await getDomainConfig(session.tenantId, 'ADMISSION'))
    const requiredDocTypes: string[] = admCfg.requiredDocuments || ['BIRTH_CERTIFICATE', 'PHOTO']

    const docs = app.documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      status: d.status,
      verified: d.verified,
      verifiedAt: d.verifiedAt,
      verifiedByName: d.verifiedByName,
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
 * POST /api/v1/applications/[id]/documents — Attach an uploaded document (JSON or Multipart)
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
  if (!app) return Errors.notFound('Application')

  const branchErr = await requireBranchAccess(session, app.branchId)
  if (branchErr) return branchErr

  try {
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const docType = (formData.get('docType') as string) || 'OTHER'
      const remarks = (formData.get('remarks') as string) || undefined

      if (!file) {
        return Errors.validation('File is required in multipart upload')
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const uploadRes = await S3StorageService.uploadBufferToS3({
        tenantId: session.tenantId,
        category: 'documents',
        buffer,
        mimeType: file.type || 'application/pdf',
        originalName: file.name,
        userId: session.uid,
      })

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
          fileName: file.name,
          fileUrl: uploadRes.url,
          storageKey: uploadRes.key,
          fileSize: uploadRes.size,
          mimeType: uploadRes.mimeType,
          remarks,
          uploadedById: session.uid,
        }
      )

      return ok(doc, undefined, 201)
    }

    const body = await req.json()
    const { docType, fileName, fileUrl, storageKey, fileSize, mimeType, remarks } = body

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
        fileUrl,
        storageKey,
        fileSize,
        mimeType,
        remarks,
        uploadedById: session.uid,
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
 * PATCH /api/v1/applications/[id]/documents — Review/Verify/Reject an uploaded document
 */
async function _PATCH(
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
  if (!app) return Errors.notFound('Application')

  const branchErr = await requireBranchAccess(session, app.branchId)
  if (branchErr) return branchErr

  try {
    const body = await req.json()
    const { documentId, action, notes } = body

    if (!documentId || !action || !['VERIFY', 'REJECT', 'NEEDS_CORRECTION'].includes(action)) {
      return Errors.validation('documentId and valid action (VERIFY | REJECT | NEEDS_CORRECTION) are required')
    }

    const doc = await AdmissionService.verifyDocument(
      {
        tenantId: session.tenantId,
        branchId: session.branchId || '',
        academicYearId: '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      documentId,
      action,
      notes
    )

    return ok(doc)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('DOCUMENT_VERIFY_FAILED', e.message || 'Failed to verify document', 422)
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

  const app = await db.admissionApplication.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { branchId: true },
  })
  if (!app) return Errors.notFound('Application')

  const branchErr = await requireBranchAccess(session, app.branchId)
  if (branchErr) return branchErr

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
export const PATCH = withApi(_PATCH)
export const DELETE = withApi(_DELETE)

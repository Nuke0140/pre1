import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { saveStaffDocumentFile, deleteStaffDocumentFile } from '@/lib/storage'
import { AuditService } from '@/lib/audit/audit-service'
import type { StaffDocumentType } from '@prisma/client'

/**
 * POST /api/v1/hr/documents/upload — Secure Binary Multipart Upload for Staff Verification Documents
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context found in active session')

  try {
    const formData = await req.formData()
    const rawDocType = ((formData.get('docType') as string) || 'OTHER').toUpperCase()
    let docType: StaffDocumentType = 'OTHER'
    if (['RESUME', 'ID_PROOF', 'ADDRESS_PROOF', 'POLICE_VERIFICATION', 'MEDICAL_FITNESS', 'ECCE_CERTIFICATE', 'DEGREE_CERTIFICATE', 'OFFER_LETTER', 'EXPERIENCE_LETTER', 'OTHER'].includes(rawDocType)) {
      docType = rawDocType as StaffDocumentType
    } else if (rawDocType === 'AADHAAR' || rawDocType === 'PAN') {
      docType = 'ID_PROOF'
    } else if (rawDocType === 'RELIEVING_LETTER' || rawDocType === 'EXPERTISE_PROOF') {
      docType = 'EXPERIENCE_LETTER'
    }

    const staffProfileId = (formData.get('staffProfileId') as string) || ''
    const documentNumber = (formData.get('documentNumber') as string) || null

    if (!file || !(file instanceof File)) {
      return Errors.validation('A valid file (PDF, JPEG, or PNG) is required.')
    }
    if (!staffProfileId) {
      return Errors.validation('staffProfileId is required.')
    }

    // 1. Tenant Scope & Ownership / Permission Verification
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: staffProfileId,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: { user: { select: { fullName: true } } },
    })

    if (!staffProfile) {
      return Errors.notFound('Staff profile not found in this school')
    }

    // Access control: User must either be managing their own profile OR have hr:write role permission
    const isSelf = staffProfile.userId === session.userId
    const isHRAuthorized = session.roles ? session.roles.some((r: string) => ['ADMIN', 'PRINCIPAL', 'HR_MANAGER'].includes(r)) : false

    if (!isSelf && !isHRAuthorized) {
      return Errors.forbidden('Unauthorized: You can only upload documents for your own profile or as an authorized HR manager.')
    }

    // 2. Read File Buffer & Validate
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      return Errors.validation('Uploaded file is empty.')
    }

    // 3. Durably Save File using Storage Abstraction
    let savedFile
    try {
      savedFile = await saveStaffDocumentFile({
        tenantId: session.tenantId,
        staffProfileId: staffProfile.id,
        docType,
        buffer,
        mimeType: file.type || 'application/pdf',
        originalName: file.name,
      })
    } catch (storageErr: any) {
      return Errors.badRequest(storageErr.message || 'File upload failed validation.')
    }

    // 4. Create StaffDocument DB Record (Transaction with cleanup rollback)
    let staffDoc
    try {
      staffDoc = await db.staffDocument.create({
        data: {
          tenantId: session.tenantId,
          staffProfileId: staffProfile.id,
          docType,
          documentNumber,
          fileUrl: savedFile.url,
          fileName: savedFile.fileName,
          verificationStatus: 'PENDING',
        },
      })
    } catch (dbErr: any) {
      // Rollback: remove orphan file from storage
      await deleteStaffDocumentFile(savedFile.url)
      throw dbErr
    }

    // 5. Record Audit Log
    await AuditService.record({
      tenantId: session.tenantId,
      branchId: staffProfile.branchId,
      actorId: session.id,
      actorName: session.name || 'User',
      actorRole: session.role || 'STAFF',
      action: 'STAFF_DOCUMENT_UPLOADED',
      entity: 'StaffDocument',
      entityId: staffDoc.id,
      module: 'HR',
      summary: `Uploaded ${docType} document (${savedFile.fileName}) for ${staffProfile.user.fullName}`,
      severity: 'INFO',
    })

    return ok(staffDoc)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

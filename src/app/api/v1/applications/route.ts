import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'

/** GET /api/v1/applications — admission pipeline */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const apps = await db.admissionApplication.findMany({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        ...(status ? { status: status as 'SUBMITTED' } : {}),
      },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    })
    return ok(
      apps.map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        childName: `${a.childFirstName} ${a.childLastName || ''}`.trim(),
        childDob: a.childDob,
        childGender: a.childGender,
        programType: a.programType,
        parentName: a.parentName,
        parentPhone: a.parentPhone,
        parentEmail: a.parentEmail,
        status: a.status,
        submittedAt: a.submittedAt || a.createdAt,
        documents: a.documents.map((d) => ({
          id: d.id, docType: d.docType, fileName: d.fileName, verified: d.verified,
        })),
      }))
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/applications — parent-facing application or reception entry */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      childFirstName, childLastName, childDob, childGender,
      programType, parentName, parentPhone, parentEmail, previousSchool, leadId,
    } = body

    if (!childFirstName || !childDob || !parentName || !parentPhone) {
      return Errors.validation('childFirstName, childDob, parentName and parentPhone are required')
    }

    const branch = await db.branch.findFirst({
      where: { tenantId: session.tenantId, isMain: true },
    })
    if (!branch) return Errors.notFound('Branch')

    const applicationNumber = await nextNumber('application', session.tenantId)
    const app = await db.admissionApplication.create({
      data: {
        tenantId: session.tenantId,
        branchId: branch.id,
        applicationNumber,
        leadId: leadId || null,
        programType: programType || 'NURSERY',
        childFirstName,
        childLastName: childLastName || null,
        childDob: new Date(childDob),
        childGender: childGender || 'UNSPECIFIED',
        parentName,
        parentPhone,
        parentEmail: parentEmail || null,
        previousSchool: previousSchool || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    // mandatory doc checklist (BRC §Eligibility)
    await db.applicationDocument.createMany({
      data: [
        { applicationId: app.id, docType: 'BIRTH_CERTIFICATE', fileName: 'birth-certificate.pdf' },
        { applicationId: app.id, docType: 'PHOTO', fileName: 'child-photo.jpg' },
        { applicationId: app.id, docType: 'PARENT_ID', fileName: 'parent-id.pdf' },
        { applicationId: app.id, docType: 'MEDICAL_CERTIFICATE', fileName: 'medical-fitness.pdf' },
      ],
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'AdmissionApplication',
      entityId: app.id,
      summary: `Application ${applicationNumber} for ${childFirstName}`,
    })

    return ok({ applicationId: app.id, applicationNumber }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

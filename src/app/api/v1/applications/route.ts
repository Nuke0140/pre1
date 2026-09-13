import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * GET /api/v1/applications — Admission Forms list
 * Required Scopes: tenantId (from session), branchId, academicYearId
 * Filters: status, programType, search (child/parent/phone/applicationNumber)
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const branchId = sp.get('branchId') || session.branchId
    const academicYearId = sp.get('academicYearId') || sp.get('academicSessionId')
    const status = sp.get('status')
    const programType = sp.get('programType')
    const search = sp.get('q')?.trim()

    const scope = await AdmissionService.verifyScope(session.tenantId, branchId, academicYearId)

    const where: any = {
      tenantId: scope.tenantId,
      deletedAt: null,
      branchId: scope.branchId,
      ...(status ? { status } : {}),
      ...(programType ? { programType } : {}),
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { childFirstName: { contains: search, mode: 'insensitive' } },
        { childLastName: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search } },
      ]
    }

    const apps = await db.admissionApplication.findMany({
      where,
      include: {
        documents: true,
        lead: { select: { leadNumber: true, source: true } },
      },
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
        verifiedAt: a.verifiedAt,
        approvedAt: a.approvedAt,
        studentId: a.studentId,
        classroomId: a.classroomId,
        leadNumber: a.lead?.leadNumber ?? null,
        documents: a.documents.map((d) => ({
          id: d.id,
          docType: d.docType,
          fileName: d.fileName,
          verified: d.verified,
          remarks: d.remarks,
        })),
      })),
      {
        total: apps.length,
        scope: {
          tenantId: scope.tenantId,
          branchId: scope.branchId,
          academicYearId: scope.academicYearId,
        },
      }
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/applications — Submit or start an Admission Form
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      branchId,
      academicYearId,
      childFirstName,
      childLastName,
      childDob,
      childGender,
      programType,
      parentName,
      parentPhone,
      parentEmail,
      alternatePhone,
      address,
      previousSchool,
      leadId,
      notes,
    } = body

    const app = await AdmissionService.submitApplication(
      {
        tenantId: session.tenantId,
        branchId: branchId || session.branchId,
        academicYearId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        leadId,
        programType: programType || 'NURSERY',
        childFirstName,
        childLastName,
        childDob,
        childGender,
        parentName,
        parentPhone,
        parentEmail,
        alternatePhone,
        address,
        previousSchool,
        notes,
      }
    )

    return ok({ id: app.id, applicationNumber: app.applicationNumber }, undefined, 201)
  } catch (e: any) {
    return Errors.business('ADMISSION_SUBMIT_FAILED', e.message || 'Failed to submit admission form', 422)
  }
}

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, withApi, errPermission, errValidation } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { resolveAuthorizedBranchScope, ALL_BRANCHES_ID } from '@/lib/admissions/branch-context'

/**
 * GET /api/v1/applications — Admission Forms list
 * Supports: Single branch (branchId=<id>) OR All Branches (branchId=__ALL_BRANCHES__)
 * Filters: status, programType, search (child/parent/phone/applicationNumber)
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

  const sp = req.nextUrl.searchParams
  const requestedBranchId = sp.get('branchId')
  const academicYearId = sp.get('academicYearId') || sp.get('academicSessionId')
  const status = sp.get('status')
  const programType = sp.get('programType')
  const search = sp.get('q')?.trim()

  const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
  if (branchScope.mode === 'NO_BRANCH_ACCESS') {
    throw errPermission('No authorized branch access for active user')
  }

  const where: any = {
    tenantId: branchScope.tenantId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(programType ? { programType } : {}),
    ...(academicYearId ? { academicSessionId: academicYearId } : {}),
  }

  if (branchScope.mode === 'SINGLE_BRANCH') {
    where.branchId = branchScope.selectedBranchId
  } else {
    where.branchId = { in: branchScope.authorizedBranchIds }
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
      offers: { select: { id: true, offerNumber: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const branchMap = new Map(branchScope.branches.map((b) => [b.id, b]))

  return ok(
    apps.map((a) => {
      const b = branchMap.get(a.branchId)
      return {
        id: a.id,
        applicationNumber: a.applicationNumber,
        branchId: a.branchId,
        branchName: b ? b.name : 'Main Campus',
        branchCode: b?.code,
        childName: `${a.childFirstName} ${a.childLastName || ''}`.trim(),
        childFirstName: a.childFirstName,
        childLastName: a.childLastName,
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
        leadId: a.leadId,
        offers: a.offers,
        documents: a.documents.map((d) => ({
          id: d.id,
          docType: d.docType,
          fileName: d.fileName,
          status: d.status,
          verified: d.verified,
          remarks: d.remarks,
          rejectionReason: d.rejectionReason,
        })),
      }
    }),
    {
      total: apps.length,
      scope: {
        tenantId: branchScope.tenantId,
        mode: branchScope.mode,
        selectedBranchId: branchScope.selectedBranchId,
        authorizedBranchIds: branchScope.authorizedBranchIds,
        academicYearId,
      },
    }
  )
}, { module: 'admissions' })

/**
 * POST /api/v1/applications — Submit or start an Admission Form
 */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

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
    isDuplicateConfirmed,
    childFullName,
    bloodGroup,
    emergencyContact,
    relationship,
    medicalNotes,
    meetingNotes,
    additionalGuardians,
  } = body

  // Enforce specific valid target branch
  const targetBranchId = branchId || session.branchId
  if (!targetBranchId || targetBranchId === ALL_BRANCHES_ID || targetBranchId === 'all') {
    throw errValidation('Target branch is required to create an application. Please select a specific campus.')
  }

  const branchScope = await resolveAuthorizedBranchScope(session, targetBranchId)
  if (!branchScope.authorizedBranchIds.includes(targetBranchId)) {
    throw errPermission('Selected branch is not in your authorized scope')
  }

  const app = await AdmissionService.submitApplication(
    {
      tenantId: session.tenantId,
      branchId: targetBranchId,
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
      isDuplicateConfirmed: !!isDuplicateConfirmed,
      childFullName,
      bloodGroup,
      emergencyContact,
      relationship,
      medicalNotes,
      meetingNotes,
      additionalGuardians,
    }
  )

  return ok({ id: app.id, applicationNumber: app.applicationNumber }, undefined, 201)
}, { module: 'admissions' })

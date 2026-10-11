import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { resolveAuthorizedBranchScope, ALL_BRANCHES_ID } from '@/lib/admissions/branch-context'

/**
 * GET /api/v1/leads — Enquiries list
 * Supports: Single branch (branchId=<id>) OR All Branches (branchId=__ALL_BRANCHES__ or omitted for multi-branch users)
 * Filters: status, interestedProgram, source, search
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const requestedBranchId = sp.get('branchId')
    const academicYearId = sp.get('academicYearId') || sp.get('academicSessionId')
    const status = sp.get('status')
    const program = sp.get('program') || sp.get('interestedProgram')
    const source = sp.get('source')
    const search = sp.get('q')?.trim()

    // Server-side authoritative branch scoping
    const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return Errors.forbidden('No authorized branch access for active user')
    }

    const where: any = {
      tenantId: branchScope.tenantId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(program ? { interestedProgram: program } : {}),
      ...(source ? { source } : {}),
    }

    if (branchScope.mode === 'SINGLE_BRANCH') {
      where.branchId = branchScope.selectedBranchId
    } else {
      // ALL_BRANCHES mode: query records within authorized branch IDs or null branch leads
      where.OR = [
        { branchId: { in: branchScope.authorizedBranchIds } },
        { branchId: null },
      ]
    }

    if (search) {
      const searchConditions = [
        { leadNumber: { contains: search, mode: 'insensitive' } },
        { childName: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Attach originating branch metadata for table & detail views
    const branchMap = new Map(branchScope.branches.map((b) => [b.id, b]))
    const enrichedLeads = leads.map((l) => {
      const b = l.branchId ? branchMap.get(l.branchId) : null
      return {
        ...l,
        branchName: b ? b.name : (branchScope.branches.length === 1 ? branchScope.branches[0].name : 'Main Campus'),
        branchCode: b?.code,
      }
    })

    return ok(enrichedLeads, {
      total: enrichedLeads.length,
      scope: {
        tenantId: branchScope.tenantId,
        mode: branchScope.mode,
        selectedBranchId: branchScope.selectedBranchId,
        authorizedBranchIds: branchScope.authorizedBranchIds,
        academicYearId,
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/leads — Capture a new Enquiry with duplicate detection
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      parentName,
      phone,
      source,
      childName,
      childDob,
      interestedProgram,
      notes,
      email,
      branchId,
      academicYearId,
      assignedToId,
      childGender,
      previousSchool,
      relationship,
      parentPhotoUrl,
      enquiryDate,
      overrideDuplicate,
    } = body

    // Validate that branchId is provided and authorized
    const targetBranchId = branchId || session.branchId
    if (!targetBranchId || targetBranchId === ALL_BRANCHES_ID || targetBranchId === 'all') {
      return Errors.validation('Target branch is required to register an enquiry. Please select a specific campus.')
    }

    const branchScope = await resolveAuthorizedBranchScope(session, targetBranchId)
    if (!branchScope.authorizedBranchIds.includes(targetBranchId)) {
      return Errors.forbidden('Selected target branch is not in your authorized scope')
    }

    // Program mapping validation against target branch if program is provided
    if (interestedProgram) {
      const prog = await db.program.findFirst({
        where: {
          tenantId: session.tenantId,
          programType: interestedProgram,
          deletedAt: null,
          isActive: true,
        },
        include: {
          branchMappings: {
            where: { branchId: targetBranchId, deletedAt: null, isActive: true },
          },
        },
      })
      if (prog && prog.branchMappings.length === 0) {
        // If branch mappings exist for this program, ensure target branch is mapped
        const totalMappings = await db.programBranch.count({
          where: { programId: prog.id, tenantId: session.tenantId, deletedAt: null, isActive: true },
        })
        if (totalMappings > 0) {
          return Errors.validation(`Program ${prog.name} is not offered at the selected branch campus`)
        }
      }
    }

    const result = await AdmissionService.createEnquiry(
      {
        tenantId: session.tenantId,
        branchId: targetBranchId,
        academicYearId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        parentName,
        phone,
        email,
        childName,
        childDob,
        interestedProgram,
        source,
        notes,
        assignedToId,
        childGender,
        previousSchool,
        relationship,
        parentPhotoUrl,
        enquiryDate,
        overrideDuplicate,
      }
    )

    if (result.isDuplicate) {
      return ok(result.enquiry, { warning: result.message, isDuplicate: true }, 200)
    }

    return ok(result.enquiry, undefined, 201)
  } catch (e: any) {
    return Errors.business('ENQUIRY_CREATE_FAILED', e.message || 'Failed to capture enquiry', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)


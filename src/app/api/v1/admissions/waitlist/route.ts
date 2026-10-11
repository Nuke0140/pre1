import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { WaitingListService } from '@/lib/admissions/waiting-list-service'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { resolveAuthorizedBranchScope, ALL_BRANCHES_ID } from '@/lib/admissions/branch-context'

/**
 * GET /api/v1/admissions/waitlist
 * List waiting list entries with filters, dynamic queue ranking, and program capacity summaries.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const requestedBranchId = sp.get('branchId')
    const academicSessionId = sp.get('academicSessionId') || sp.get('academicYearId') || ''
    const programType = sp.get('programType') || sp.get('program') || undefined
    const status = sp.get('status') || undefined
    const priority = sp.get('priority') || undefined
    const search = sp.get('q')?.trim() || undefined
    const limit = parseInt(sp.get('limit') || '50', 10)
    const offset = parseInt(sp.get('offset') || '0', 10)

    const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return Errors.forbidden('No authorized branch access for active user')
    }

    const result = await WaitingListService.listWaitingList(
      {
        tenantId: session.tenantId,
        branchId: branchScope.selectedBranchId || '',
        academicYearId: academicSessionId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        branchId: branchScope.mode === 'SINGLE_BRANCH' ? branchScope.selectedBranchId! : undefined,
        branchIds: branchScope.mode === 'ALL_BRANCHES' ? branchScope.authorizedBranchIds : undefined,
        academicSessionId: academicSessionId || undefined,
        programType,
        status,
        priority,
        search,
        limit,
        offset,
      } as any
    )

    const branchMap = new Map(branchScope.branches.map((b) => [b.id, b]))
    const enrichedEntries = result.entries.map((e) => {
      const b = branchMap.get(e.branchId)
      return {
        ...e,
        branchName: b ? b.name : 'Main Campus',
        branchCode: b?.code,
      }
    })

    return ok(enrichedEntries, {
      total: result.total,
      capacitySummaries: result.capacitySummaries,
      scope: {
        tenantId: branchScope.tenantId,
        mode: branchScope.mode,
        selectedBranchId: branchScope.selectedBranchId,
        authorizedBranchIds: branchScope.authorizedBranchIds,
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/admissions/waitlist
 * Create a new waiting list entry from an application with duplicate idempotency.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { applicationId, reason, reasonNotes, priority, notes } = body

    if (!applicationId) {
      return Errors.business('MISSING_APPLICATION_ID', 'Application ID is required', 400)
    }

    if (!reason) {
      return Errors.business('MISSING_REASON', 'A valid waiting list reason is mandatory', 400)
    }

    if (reason === 'OTHER' && (!reasonNotes || !reasonNotes.trim())) {
      return Errors.business('MISSING_REASON_NOTES', 'Reason notes are required when reason is OTHER', 400)
    }

    const result = await WaitingListService.addToWaitingList(
      {
        tenantId: session.tenantId,
        branchId: body.branchId || session.branchId || '',
        academicYearId: body.academicSessionId || body.academicYearId || '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        applicationId,
        reason,
        reasonNotes,
        priority,
        notes,
      }
    )

    return ok(result.entry, {
      queuePosition: result.position,
      isExisting: result.isExisting,
    }, result.isExisting ? 200 : 201)
  } catch (e: any) {
    return Errors.business('WAITLIST_CREATE_FAILED', e.message || 'Failed to place on waiting list', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

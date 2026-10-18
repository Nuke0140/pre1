import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'
import { CapacityService } from '@/lib/admissions/capacity-service'

/**
 * GET /api/v1/admissions/capacity
 * Returns live, scoped classroom seat availability and aggregated program capacity.
 * Accessible with admissions:read or settings:read permissions.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const requestedBranchId = sp.get('branchId')
    const academicSessionId = sp.get('academicSessionId') || undefined
    const programType = sp.get('programType') || undefined
    const classroomId = sp.get('classroomId') || undefined

    const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return ok({
        classrooms: [],
        programs: [],
        summary: {
          totalCapacity: 0,
          totalOccupied: 0,
          totalAvailableSeats: 0,
          totalWaitlist: 0,
        },
      })
    }

    // 1. Single classroom direct lookup
    if (classroomId) {
      const classroomMetrics = await CapacityService.getClassroomCapacity(
        branchScope.tenantId,
        classroomId
      )
      if (!classroomMetrics) {
        return Errors.notFound('Classroom not found')
      }
      return ok({ classroom: classroomMetrics })
    }

    // 2. Multi-classroom list lookup with branch authorization
    const branchFilter =
      branchScope.mode === 'SINGLE_BRANCH'
        ? { branchId: branchScope.selectedBranchId }
        : { branchIds: branchScope.authorizedBranchIds }

    const classrooms = await CapacityService.getClassroomsCapacityList({
      tenantId: branchScope.tenantId,
      ...branchFilter,
      academicSessionId,
      programType,
    })

    // 3. Program summaries
    const programs = await CapacityService.getProgramCapacitySummary({
      tenantId: branchScope.tenantId,
      ...branchFilter,
      academicSessionId,
    })

    const totalCapacity = classrooms.reduce((s, c) => s + c.capacity, 0)
    const totalOccupied = classrooms.reduce((s, c) => s + c.totalOccupied, 0)
    const totalAvailableSeats = classrooms.reduce((s, c) => s + c.availableSeats, 0)
    const totalWaitlist = classrooms.reduce((s, c) => s + c.waitlistCount, 0)

    return ok({
      classrooms,
      programs,
      summary: {
        totalCapacity,
        totalOccupied,
        totalAvailableSeats,
        totalWaitlist,
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

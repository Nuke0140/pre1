import { NextRequest } from 'next/server'
import { withApi } from '@/lib/with-api'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'

/**
 * GET /api/v1/parent/attendance
 * Fetches filtered student attendance history and dynamic summary metrics for a parent's linked child.
 * Supports:
 * - Specific single date
 * - Date range (startDate to endDate)
 * - Quick period filters (today, this_week, this_month, all, custom)
 * - Status filter (ALL, PRESENT, ABSENT, LATE, HALF_DAY, LATE_OR_HALF_DAY)
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const tenantId = session.tenantId
    const url = new URL(req.url)
    const studentId = url.searchParams.get('studentId')
    const dateParam = url.searchParams.get('date')
    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')
    const periodParam = url.searchParams.get('period') || 'all'
    const statusParam = (url.searchParams.get('status') || 'ALL').toUpperCase()

    if (!studentId) {
      return Errors.badRequest('studentId is required')
    }

    // 1. Authorize: Check that this student is linked to the logged-in parent/guardian in this tenant
    const guardian = await db.guardian.findFirst({
      where: {
        userId: session.uid,
        tenantId,
        deletedAt: null,
        studentLinks: {
          some: { studentId },
        },
      },
      select: { id: true },
    })

    if (!guardian) {
      return Errors.forbidden('You are not authorized to view attendance for this student')
    }

    const todayStr = isoDate()
    let startDateStr: string | null = null
    let endDateStr: string | null = null

    // Determine effective date range
    if (dateParam && dateParam.trim() !== '') {
      startDateStr = dateParam.trim()
      endDateStr = dateParam.trim()
    } else if (periodParam === 'today') {
      startDateStr = todayStr
      endDateStr = todayStr
    } else if (periodParam === 'this_week') {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday
      const diffToMon = (dayOfWeek + 6) % 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - diffToMon)
      startDateStr = isoDate(monday)
      endDateStr = todayStr
    } else if (periodParam === 'this_month') {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startDateStr = isoDate(firstOfMonth)
      endDateStr = todayStr
    } else if (periodParam === 'custom' || startDateParam || endDateParam) {
      startDateStr = startDateParam ? startDateParam.trim() : null
      endDateStr = endDateParam ? endDateParam.trim() : null
    }

    // Validate date bounds if both provided
    if (startDateStr && endDateStr && startDateStr > endDateStr) {
      return Errors.badRequest('Invalid date range: Start date cannot be after End date')
    }

    // Build database query for the date window
    const wherePeriod: any = {
      tenantId,
      studentId,
    }

    if (startDateStr && endDateStr) {
      wherePeriod.date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr),
      }
    } else if (startDateStr) {
      wherePeriod.date = { gte: new Date(startDateStr) }
    } else if (endDateStr) {
      wherePeriod.date = { lte: new Date(endDateStr) }
    }

    // Fetch all attendance records within the selected period
    const periodRecords = await db.attendance.findMany({
      where: wherePeriod,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        status: true,
        markedAt: true,
        notes: true,
      },
    })

    // Calculate period summary metrics
    const totalDays = periodRecords.length
    const presentDays = periodRecords.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.status)).length
    const absentDays = periodRecords.filter((r) => r.status === 'ABSENT').length
    const lateDays = periodRecords.filter((r) => r.status === 'LATE').length
    const halfDays = periodRecords.filter((r) => r.status === 'HALF_DAY').length
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    // Filter by attendance status if requested
    let filteredRecords = periodRecords
    if (statusParam && statusParam !== 'ALL') {
      if (statusParam === 'PRESENT') {
        filteredRecords = periodRecords.filter((r) => r.status === 'PRESENT')
      } else if (statusParam === 'ABSENT') {
        filteredRecords = periodRecords.filter((r) => r.status === 'ABSENT')
      } else if (statusParam === 'LATE') {
        filteredRecords = periodRecords.filter((r) => r.status === 'LATE')
      } else if (statusParam === 'HALF_DAY') {
        filteredRecords = periodRecords.filter((r) => r.status === 'HALF_DAY')
      } else if (statusParam === 'LATE_OR_HALF_DAY') {
        filteredRecords = periodRecords.filter((r) => ['LATE', 'HALF_DAY'].includes(r.status))
      }
    }

    return ok({
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        attendanceRate,
      },
      records: filteredRecords.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        status: r.status,
        markedAt: r.markedAt ? r.markedAt.toISOString() : null,
        notes: r.notes || null,
      })),
      filter: {
        period: periodParam,
        date: dateParam || null,
        startDate: startDateStr,
        endDate: endDateStr,
        status: statusParam,
        totalCount: filteredRecords.length,
      },
    })
  } catch (err: any) {
    return Errors.badRequest(err.message || 'Failed to fetch attendance records')
  }
}

export const GET = withApi(_GET)

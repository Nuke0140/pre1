import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import type { FeeScheduleStatus } from '@prisma/client'

/**
 * GET /api/v1/fee-schedules
 * Operational endpoint for Finance module to list student fee schedules, dues, and overdue follow-ups.
 * Query params:
 *   branchId?: string
 *   programId?: string
 *   classroomId?: string
 *   status?: FeeScheduleStatus | 'ALL'
 *   overdueOnly?: 'true' | 'false'
 *   search?: string (student name or admissionNo)
 *   page?: number (default: 1)
 *   pageSize?: number (default: 50)
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const branchId = sp.get('branchId') || undefined
    const programId = sp.get('programId') || undefined
    const classroomId = sp.get('classroomId') || undefined
    const statusParam = sp.get('status')
    const overdueOnly = sp.get('overdueOnly') === 'true'
    const search = sp.get('search')?.trim() || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '50', 10)))

    // Sync overdue statuses automatically
    await FeeService.syncOverdueSchedules(session.tenantId)

    // Build filter query
    const where: any = {
      tenantId: session.tenantId,
    }

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as FeeScheduleStatus
    } else if (overdueOnly) {
      where.status = 'OVERDUE'
    }

    if (classroomId) {
      where.classroomId = classroomId
    }

    if (branchId) {
      where.student = {
        ...where.student,
        branchId,
      }
    }

    if (programId) {
      where.classroom = {
        ...where.classroom,
        programId,
      }
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNo: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [total, schedules, branches] = await Promise.all([
      db.studentFeeSchedule.count({ where }),
      db.studentFeeSchedule.findMany({
        where,
        include: {
          feeItem: { select: { id: true, name: true, feeType: true, frequency: true } },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              branchId: true,
            },
          },
          classroom: {
            select: {
              id: true,
              name: true,
              code: true,
              program: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { student: { firstName: 'asc' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.branch.findMany({
        where: { tenantId: session.tenantId },
        select: { id: true, name: true, code: true },
      }),
    ])

    const branchMap = new Map(branches.map((b) => [b.id, b]))

    // Calculate aggregate summary for the filtered scope
    const aggregates = await db.studentFeeSchedule.aggregate({
      where,
      _sum: {
        amountDueCents: true,
        amountPaidCents: true,
        remainingAmountCents: true,
      },
    })

    const totalDueCents = aggregates._sum.amountDueCents || 0
    const totalPaidCents = aggregates._sum.amountPaidCents || 0
    const totalRemainingCents = aggregates._sum.remainingAmountCents || 0

    return ok(
      schedules.map((sc) => ({
        id: sc.id,
        studentId: sc.studentId,
        studentName: `${sc.student.firstName} ${sc.student.lastName || ''}`.trim(),
        admissionNo: sc.student.admissionNo,
        branchId: sc.student.branchId,
        branchName: sc.student.branchId ? (branchMap.get(sc.student.branchId)?.name ?? '—') : '—',
        classroomId: sc.classroomId,
        classroomName: sc.classroom?.name ?? '—',
        programName: sc.classroom?.program?.name ?? '—',
        feeItemId: sc.feeItemId,
        itemName: sc.feeItem.name,
        feeType: sc.feeType,
        period: sc.period,
        dueDate: sc.dueDate,
        amountDueCents: sc.amountDueCents,
        amountDueRupees: (sc.amountDueCents / 100).toFixed(2),
        amountPaidCents: sc.amountPaidCents,
        amountPaidRupees: (sc.amountPaidCents / 100).toFixed(2),
        remainingCents: sc.remainingAmountCents,
        remainingRupees: (sc.remainingAmountCents / 100).toFixed(2),
        status: sc.status,
        isRefundable: sc.isRefundable,
      })),
      {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          totalDueCents,
          totalDueRupees: totalDueCents / 100,
          totalPaidCents,
          totalPaidRupees: totalPaidCents / 100,
          totalRemainingCents,
          totalRemainingRupees: totalRemainingCents / 100,
        },
      }
    )
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

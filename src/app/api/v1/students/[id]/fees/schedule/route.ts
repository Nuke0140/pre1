import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import { db } from '@/lib/db'

async function _GET(req: NextRequest, ctx: { params?: Promise<{ id: string }> | { id: string } }) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const params = ctx.params instanceof Promise ? await ctx.params : ctx.params
    const studentId = params?.id || (params as any)?.studentId
    if (!studentId) return Errors.validation('Student ID is required')

    if (session.role === 'PARENT' || session.role === 'GUARDIAN') {
      const guardian = await db.guardian.findFirst({
        where: { userId: session.uid, tenantId: session.tenantId },
        include: { studentLinks: true },
      })
      const isLinked = guardian?.studentLinks.some((link) => link.studentId === studentId)
      if (!isLinked) {
        return Errors.forbidden('Access denied: You are not authorized to view this student’s fee schedule')
      }
    }

    await FeeService.syncOverdueSchedules(session.tenantId, studentId)

    const schedules = await db.studentFeeSchedule.findMany({
      where: { tenantId: session.tenantId, studentId },
      include: { feeItem: true },
      orderBy: { dueDate: 'asc' },
    })

    return ok(schedules.map((sc) => ({
      id: sc.id,
      itemName: sc.feeItem.name,
      feeType: sc.feeType,
      period: sc.period,
      amountDueRupees: (sc.amountDueCents / 100).toFixed(2),
      amountPaidRupees: (sc.amountPaidCents / 100).toFixed(2),
      remainingRupees: (sc.remainingAmountCents / 100).toFixed(2),
      dueDate: sc.dueDate,
      status: sc.status,
      isRefundable: sc.isRefundable,
    })))
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

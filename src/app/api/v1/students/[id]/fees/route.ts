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

    // Authorization check: If parent/guardian, verify child ownership!
    if (session.role === 'PARENT' || session.role === 'GUARDIAN') {
      const guardian = await db.guardian.findFirst({
        where: { userId: session.uid, tenantId: session.tenantId },
        include: { studentLinks: true },
      })
      const isLinked = guardian?.studentLinks.some((link) => link.studentId === studentId)
      if (!isLinked) {
        return Errors.forbidden('Access denied: You are not authorized to view this student’s financial records')
      }
    }

    // Sync overdue statuses first
    await FeeService.syncOverdueSchedules(session.tenantId, studentId)

    const financialSummary = await FeeService.getStudentFinancialSummary(session.tenantId, studentId)
    const deposits = await FeeService.getStudentDeposits(session.tenantId, studentId)

    return ok({
      ...financialSummary,
      deposits: deposits.map((d) => ({
        id: d.id,
        name: d.name,
        totalRupees: (d.totalAmountCents / 100).toFixed(2),
        refundedRupees: (d.refundedAmountCents / 100).toFixed(2),
        adjustedRupees: (d.adjustedAmountCents / 100).toFixed(2),
        remainingRupees: (d.remainingAmountCents / 100).toFixed(2),
        status: d.status,
      })),
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

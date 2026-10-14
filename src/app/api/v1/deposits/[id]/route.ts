import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

async function _GET(req: NextRequest, ctx: { params?: Promise<{ id: string }> | { id: string } }) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const params = ctx.params instanceof Promise ? await ctx.params : ctx.params
    const id = params?.id
    if (!id) return Errors.notFound('Deposit record not found')

    const deposit = await db.studentDeposit.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        refunds: true,
      },
    })

    if (!deposit) {
      return Errors.notFound('Deposit record not found')
    }

    return ok({
      id: deposit.id,
      studentId: deposit.studentId,
      studentName: deposit.student ? `${deposit.student.firstName} ${deposit.student.lastName || ''}`.trim() : 'N/A',
      admissionNo: deposit.student?.admissionNo ?? 'N/A',
      name: deposit.name,
      totalRupees: ((deposit.totalAmountCents ?? 0) / 100).toFixed(2),
      refundedRupees: ((deposit.refundedAmountCents ?? 0) / 100).toFixed(2),
      adjustedRupees: ((deposit.adjustedAmountCents ?? 0) / 100).toFixed(2),
      remainingRupees: ((deposit.remainingAmountCents ?? 0) / 100).toFixed(2),
      status: deposit.status,
      notes: deposit.notes,
      refunds: deposit.refunds || [],
      createdAt: deposit.createdAt,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

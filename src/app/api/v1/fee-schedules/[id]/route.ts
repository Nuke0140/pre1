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
    if (!id) return Errors.notFound('Fee schedule item not found')

    const sc = await db.studentFeeSchedule.findFirst({
      where: { id, tenantId: session.tenantId },
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
    })

    if (!sc) {
      return Errors.notFound('Fee schedule item not found')
    }

    return ok({
      id: sc.id,
      studentId: sc.studentId,
      studentName: sc.student ? `${sc.student.firstName} ${sc.student.lastName || ''}`.trim() : '—',
      admissionNo: sc.student?.admissionNo ?? '—',
      branchId: sc.student?.branchId ?? null,
      classroomId: sc.classroomId,
      classroomName: sc.classroom?.name ?? '—',
      programName: sc.classroom?.program?.name ?? '—',
      feeItemId: sc.feeItemId,
      itemName: sc.feeItem?.name ?? 'Fee',
      feeType: sc.feeType,
      period: sc.period,
      dueDate: sc.dueDate,
      amountDueCents: sc.amountDueCents ?? 0,
      amountDueRupees: ((sc.amountDueCents ?? 0) / 100).toFixed(2),
      amountPaidCents: sc.amountPaidCents ?? 0,
      amountPaidRupees: ((sc.amountPaidCents ?? 0) / 100).toFixed(2),
      remainingCents: sc.remainingAmountCents ?? 0,
      remainingRupees: ((sc.remainingAmountCents ?? 0) / 100).toFixed(2),
      status: sc.status,
      isRefundable: sc.isRefundable ?? false,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

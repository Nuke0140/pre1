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
    if (!id) return Errors.notFound('Payment record not found')

    const p = await db.payment.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        invoice: { select: { invoiceNumber: true, title: true } },
        feeSchedule: { include: { feeItem: true } },
        receipt: { select: { id: true, receiptNumber: true, issuedAt: true } },
      },
    })

    if (!p) {
      return Errors.notFound('Payment record not found')
    }

    return ok({
      id: p.id,
      paymentNumber: p.paymentNumber,
      amountCents: p.amountCents ?? 0,
      amountRupees: ((p.amountCents ?? 0) / 100).toFixed(2),
      method: p.method,
      status: p.status,
      transactionRef: p.transactionRef,
      notes: p.notes,
      paymentDate: p.paymentDate,
      studentName: p.student ? `${p.student.firstName} ${p.student.lastName || ''}`.trim() : 'N/A',
      admissionNo: p.student?.admissionNo ?? 'N/A',
      invoiceNumber: p.invoice?.invoiceNumber ?? null,
      feeItemName: p.feeSchedule?.feeItem?.name ?? null,
      receiptId: p.receipt?.id ?? null,
      receiptNumber: p.receipt?.receiptNumber ?? null,
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

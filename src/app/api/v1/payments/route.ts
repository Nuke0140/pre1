import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId') || undefined
    const method = sp.get('method') || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(sp.get('pageSize') || '50'))

    const where: any = {
      tenantId: session.tenantId,
      ...(studentId ? { studentId } : {}),
      ...(method ? { method: method as any } : {}),
    }

    const [total, payments] = await Promise.all([
      db.payment.count({ where }),
      db.payment.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          invoice: { select: { invoiceNumber: true, title: true } },
          feeSchedule: { include: { feeItem: true } },
          receipt: { select: { id: true, receiptNumber: true, issuedAt: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return ok(
      payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amountCents: p.amountCents,
        amountRupees: (p.amountCents / 100).toFixed(2),
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
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (e: any) {
    return Errors.system(e)
  }
}

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { feeScheduleId, invoiceId, studentId, amountCents, amountRupees, method, paymentDate, transactionRef, notes } = body

    const cents = amountCents ? Math.round(amountCents) : amountRupees ? Math.round(amountRupees * 100) : 0
    if (!cents || cents <= 0 || !method) {
      return Errors.validation('Valid positive amount and payment method are required')
    }

    if (feeScheduleId && studentId) {
      const result = await FeeService.recordFeeSchedulePayment(
        {
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        {
          feeScheduleId,
          studentId,
          amountCents: cents,
          method,
          paymentDate,
          transactionRef,
          notes,
        }
      )
      return ok(result, undefined, 201)
    } else if (invoiceId) {
      const payment = await FeeService.initiatePayment(
        {
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        {
          invoiceId,
          amountCents: cents,
          method,
          transactionRef,
          notes,
        }
      )
      const verified = await FeeService.verifyPayment(
        {
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        { paymentId: payment.id }
      )
      return ok(verified, undefined, 201)
    }

    return Errors.validation('Either feeScheduleId + studentId or invoiceId is required')
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

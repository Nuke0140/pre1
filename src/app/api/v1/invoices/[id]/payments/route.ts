import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'

/**
 * POST /api/v1/invoices/{id}/payments — record a payment against an invoice.
 * Generates receipt (RCT-{FY}-{SEQ}) within the flow (PRD: auto receipt ≤60s).
 * Invoice invariant: paid + balance = total (BRC Financial).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const body = await req.json()
    const { amountCents, method, transactionRef, notes } = body as {
      amountCents: number
      method: 'CASH' | 'CHEQUE' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'BANK_TRANSFER' | 'ONLINE'
      transactionRef?: string
      notes?: string
    }
    if (!amountCents || amountCents <= 0 || !method) {
      return Errors.validation('amountCents (>0) and method are required')
    }

    const invoice = await db.invoice.findUnique({ where: { id }, include: { student: true } })
    if (!invoice) return Errors.notFound('Invoice')
    if (['CANCELLED', 'WRITTEN_OFF'].includes(invoice.status)) {
      return Errors.conflict(`Cannot pay a ${invoice.status.toLowerCase()} invoice`)
    }
    if (amountCents > invoice.balanceCents) {
      return Errors.business(
        'BUSINESS_OVERPAY',
        `Amount exceeds balance (₹${invoice.balanceCents / 100}). Balance is ₹${invoice.balanceCents / 100}.`
      )
    }
    // IT §269ST: cash > ₹50,000 rejected
    if (method === 'CASH' && amountCents > 5000000) {
      return Errors.business('BUSINESS_CASH_LIMIT', 'Cash payments above ₹50,000 are not allowed (IT §269ST)')
    }

    const paymentNumber = await nextNumber('payment', session.tenantId!)
    const receiptNumber = await nextNumber('receipt', session.tenantId!)

    const result = await db.$transaction(async (tx) => {
      const paidCents = invoice.paidCents + amountCents
      const balanceCents = invoice.totalCents - paidCents
      const newStatus: 'PARTIALLY_PAID' | 'PAID' = balanceCents === 0 ? 'PAID' : 'PARTIALLY_PAID'

      const payment = await tx.payment.create({
        data: {
          tenantId: session.tenantId!,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          paymentNumber,
          amountCents,
          method,
          transactionRef: transactionRef || null,
          notes: notes || null,
          status: 'SUCCESS',
          receivedById: session.uid,
        },
      })

      const receipt = await tx.receipt.create({
        data: { paymentId: payment.id, receiptNumber, amountCents },
      })

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidCents, balanceCents, status: newStatus, paidAt: newStatus === 'PAID' ? new Date() : null },
      })

      return { payment, receipt, newStatus }
    })

    // timeline entry for parent
    await db.timelineEntry.create({
      data: {
        tenantId: session.tenantId!,
        studentId: invoice.studentId,
        type: 'NOTE',
        title: `Fee payment received — ${paymentNumber}`,
        body: `₹${amountCents / 100} received via ${method}. Receipt ${receiptNumber} issued.`,
      },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Payment',
      entityId: result.payment.id,
      summary: `Payment ${paymentNumber} ₹${amountCents / 100} for invoice ${invoice.invoiceNumber} — receipt ${receiptNumber}`,
    })

    return ok({
      paymentId: result.payment.id,
      paymentNumber,
      receiptNumber,
      status: result.newStatus,
    }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'
import { emit } from '@/lib/events'
import { registerIntegrations } from '@/lib/integrations'
import { tenantScopedWhere, tenantScopedIdWhere, assertResourceScope } from '@/lib/security/resource-scope'

/**
 * POST /api/v1/invoices/{id}/payments — record a payment against an invoice.
 * Generates receipt (RCT-{FY}-{SEQ}) within the flow (PRD: auto receipt ≤60s).
 * Invoice invariant: paid + balance = total (BRC Financial).
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  const { id } = await params
  registerIntegrations()

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

    const idempotencyKey = req.headers.get('idempotency-key') || transactionRef || null
    const invoice = await db.invoice.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId!),
      include: { student: true },
    })
    if (!invoice) return Errors.notFound('Invoice')
    assertResourceScope(session, {
      tenantId: invoice.tenantId,
      branchId: invoice.student?.branchId,
    })
    if (['CANCELLED', 'WRITTEN_OFF'].includes(invoice.status)) {
      return Errors.conflict(`Cannot pay a ${invoice.status.toLowerCase()} invoice`)
    }
    // IT §269ST: cash > ₹50,000 rejected
    if (method === 'CASH' && amountCents > 5000000) {
      return Errors.business('BUSINESS_CASH_LIMIT', 'Cash payments above ₹50,000 are not allowed (IT §269ST)')
    }

    if (!idempotencyKey) {
      return Errors.validation('transactionRef or Idempotency-Key is required for payment writes')
    }

    // Fast-path existing idempotency key: return the exact prior result without
    // allocating new sequence numbers or emitting duplicate side effects.
    const existingPayment = await db.payment.findUnique({
      where: {
        tenantId_transactionRef: {
          tenantId: session.tenantId!,
          transactionRef: idempotencyKey,
        },
      },
      include: { receipt: true, invoice: true },
    })
    if (existingPayment) {
      const sameRequest =
        existingPayment.invoiceId === invoice.id &&
        existingPayment.amountCents === amountCents &&
        existingPayment.method === method
      if (!sameRequest) {
        return Errors.conflict('Idempotency-Key / transactionRef was already used with a different payment request')
      }
      return ok({
        paymentId: existingPayment.id,
        paymentNumber: existingPayment.paymentNumber,
        receiptNumber: existingPayment.receipt?.receiptNumber ?? null,
        status: existingPayment.invoice?.status === 'PAID' ? 'PAID' : 'PARTIALLY_PAID',
        idempotent: true,
      })
    }

    const paymentNumber = await nextNumber('payment', session.tenantId!)
    const receiptNumber = await nextNumber('receipt', session.tenantId!)

    let created: {
      payment: any
      receipt: any
      newStatus: 'PARTIALLY_PAID' | 'PAID'
      idempotent: boolean
    }
    try {
      created = await db.$transaction(async (tx) => {
        // Serialize all payment mutations for this invoice.
        await tx.$queryRaw`
          SELECT 1 FROM "invoices"
          WHERE "id" = ${id} AND "tenantId" = ${session.tenantId}
          FOR UPDATE
        `

        const lockedInvoice = await tx.invoice.findFirst({
          where: tenantScopedIdWhere(id, session.tenantId!),
          include: { student: true },
        })
        if (!lockedInvoice) throw new Error('Invoice not found')

        const existing = await tx.payment.findUnique({
          where: {
            tenantId_transactionRef: {
              tenantId: session.tenantId!,
              transactionRef: idempotencyKey,
            },
          },
          include: { receipt: true, invoice: true },
        })
        if (existing) {
          const sameRequest =
            existing.invoiceId === lockedInvoice.id &&
            existing.amountCents === amountCents &&
            existing.method === method
          if (!sameRequest) {
            throw new Error('IDEMPOTENCY_CONFLICT')
          }
          return {
            payment: existing,
            receipt: existing.receipt,
            newStatus: existing.invoice?.status === 'PAID' ? 'PAID' : 'PARTIALLY_PAID',
            idempotent: true,
          }
        }

        if (amountCents > lockedInvoice.balanceCents) {
          throw new Error(
            `BUSINESS_OVERPAY: Amount exceeds balance (₹${lockedInvoice.balanceCents / 100}). Balance is ₹${lockedInvoice.balanceCents / 100}.`
          )
        }

        const paidCents = lockedInvoice.paidCents + amountCents
        const balanceCents = lockedInvoice.totalCents - paidCents
        const newStatus: 'PARTIALLY_PAID' | 'PAID' = balanceCents === 0 ? 'PAID' : 'PARTIALLY_PAID'

        const payment = await tx.payment.create({
          data: {
            tenantId: session.tenantId!,
            invoiceId: lockedInvoice.id,
            studentId: lockedInvoice.studentId,
            paymentNumber,
            amountCents,
            method,
            transactionRef: idempotencyKey,
            notes: notes || null,
            status: 'SUCCESS',
            receivedById: session.uid,
          },
        })

        const receipt = await tx.receipt.create({
          data: { paymentId: payment.id, receiptNumber, amountCents, tenantId: session.tenantId! },
        })

        await tx.invoice.update({
          where: { id: lockedInvoice.id },
          data: { paidCents, balanceCents, status: newStatus },
        })

        return { payment, receipt, newStatus, idempotent: false }
      })
    } catch (e: any) {
      if (e?.message === 'IDEMPOTENCY_CONFLICT') {
        return Errors.conflict('Idempotency-Key / transactionRef was already used with a different payment request')
      }
      if (e?.message?.startsWith('BUSINESS_OVERPAY:')) {
        return Errors.business('BUSINESS_OVERPAY', e.message.replace('BUSINESS_OVERPAY: ', ''))
      }
      if (e?.code === 'P2002') {
        const existing = await db.payment.findUnique({
          where: {
            tenantId_transactionRef: {
              tenantId: session.tenantId!,
              transactionRef: idempotencyKey,
            },
          },
          include: { receipt: true, invoice: true },
        })
        if (existing) {
          const sameRequest = existing.invoiceId === invoice.id && existing.amountCents === amountCents && existing.method === method
          if (!sameRequest) {
            return Errors.conflict('Idempotency-Key / transactionRef was already used with a different payment request')
          }
          return ok({
            paymentId: existing.id,
            paymentNumber: existing.paymentNumber,
            receiptNumber: existing.receipt?.receiptNumber ?? null,
            status: existing.invoice?.status === 'PAID' ? 'PAID' : 'PARTIALLY_PAID',
            idempotent: true,
          })
        }
      }
      throw e
    }

    const result = created
    if (result.idempotent) {
      return ok({
        paymentId: result.payment.id,
        paymentNumber: result.payment.paymentNumber,
        receiptNumber: result.receipt?.receiptNumber ?? null,
        status: result.newStatus,
        idempotent: true,
      })
    }

    await db.timelineEntry.create({
      data: {
        tenantId: session.tenantId!,
        studentId: invoice.studentId,
        type: 'NOTE',
        title: `Fee payment received — ${result.payment.paymentNumber}`,
        body: `₹${result.payment.amountCents / 100} received via ${method}. Receipt ${result.receipt.receiptNumber} issued.`,
      },
    })

    await emit({
      type: 'PaymentReceived',
      tenantId: session.tenantId!,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      paymentNumber: result.payment.paymentNumber,
      amountCents: result.payment.amountCents,
      fullyPaid: result.newStatus === 'PAID',
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Payment',
      entityId: result.payment.id,
      summary: `Payment ${result.payment.paymentNumber} ₹${result.payment.amountCents / 100} for invoice ${invoice.invoiceNumber} — receipt ${result.receipt.receiptNumber}`,
    })

    return ok({
      paymentId: result.payment.id,
      paymentNumber: result.payment.paymentNumber,
      receiptNumber: result.receipt.receiptNumber,
      status: result.newStatus,
      idempotent: false,
    }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

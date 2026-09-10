import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/invoices/{id} — invoice detail with items + payments */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            firstName: true, lastName: true, admissionNo: true,
            currentClassroom: { select: { name: true } },
          },
        },
        items: true,
        payments: { include: { receipt: true }, orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!invoice) return Errors.notFound('Invoice')

    return ok({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      student: {
        name: `${invoice.student.firstName} ${invoice.student.lastName || ''}`.trim(),
        admissionNo: invoice.student.admissionNo,
        classroom: invoice.student.currentClassroom?.name,
      },
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items.map((i) => ({
        feeHead: i.feeHead, description: i.description, amountCents: i.amountCents,
      })),
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      balanceCents: invoice.balanceCents,
      status: invoice.status,
      notes: invoice.notes,
      payments: invoice.payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amountCents: p.amountCents,
        method: p.method,
        status: p.status,
        paymentDate: p.paymentDate,
        receiptNumber: p.receipt?.receiptNumber ?? null,
      })),
    })
  } catch (e) {
    return Errors.system(e)
  }
}

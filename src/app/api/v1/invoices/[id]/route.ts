import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit } from '@/lib/audit'
import { tenantScopedIdWhere, assertResourceScope } from '@/lib/security/resource-scope'
import { requireGuardianChildAccess } from '@/lib/auth-api'

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  const { id } = await params

  try {
    const invoice = await db.invoice.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId),
      include: {
        student: {
          select: {
            firstName: true, lastName: true, admissionNo: true, branchId: true,
            currentClassroom: { select: { name: true } },
          },
        },
        items: true,
        payments: { include: { receipt: true }, orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!invoice) return Errors.notFound('Invoice')

    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isParent = effectiveRoles.includes('PARENT')
    const isGuardian = effectiveRoles.includes('GUARDIAN')
    const isStaffFinance = effectiveRoles.some((r) => ['OWNER', 'PRINCIPAL', 'ACCOUNTANT'].includes(r))
    const isFamily = (isParent || isGuardian) && !isStaffFinance

    if (isFamily) {
      const childAccess = await requireGuardianChildAccess(session, invoice.studentId)
      if (childAccess instanceof Response) return childAccess
    } else {
      assertResourceScope(session, {
        tenantId: invoice.tenantId,
        branchId: invoice.student.branchId,
      })
    }

    const maskFinance = isGuardian && !isParent && !isStaffFinance

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
      items: maskFinance ? [] : invoice.items.map((i) => ({
        feeHead: i.feeHead, description: i.description, amountCents: i.amountCents,
      })),
      subtotalCents: maskFinance ? 0 : invoice.subtotalCents,
      discountCents: maskFinance ? 0 : invoice.discountCents,
      totalCents: maskFinance ? 0 : invoice.totalCents,
      paidCents: maskFinance ? 0 : invoice.paidCents,
      balanceCents: maskFinance ? 0 : invoice.balanceCents,
      status: invoice.status,
      notes: maskFinance ? null : invoice.notes,
      payments: maskFinance ? [] : invoice.payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        amountCents: p.amountCents,
        method: p.method,
        status: p.status,
        paymentDate: p.paymentDate,
        receiptId: p.receipt?.id ?? null,
        receiptNumber: p.receipt?.receiptNumber ?? null,
      })),
    })
  } catch (e) {
    return Errors.system(e)
  }
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  const { id } = await params

  try {
    const body = await req.json()
    const { action, reason, notes } = body

    const existing = await db.invoice.findFirst({
      where: tenantScopedIdWhere(id, session.tenantId),
      include: { student: { select: { branchId: true } } },
    })
    if (!existing) return Errors.notFound('Invoice')

    assertResourceScope(session, {
      tenantId: existing.tenantId,
      branchId: existing.student?.branchId,
    })

    if (action === 'VOID' || action === 'CANCEL') {
      if (existing.paidCents > 0) {
        return Errors.conflict('Cannot void an invoice with recorded payments')
      }

      const updated = await db.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: [existing.notes, `Voided by ${session.name}: ${reason || 'Administrative void'}`].filter(Boolean).join('. '),
        },
      })

      await recordAudit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'VOID_INVOICE',
        entity: 'Invoice',
        entityId: id,
        module: 'Fees',
        summary: `Voided invoice ${existing.invoiceNumber}: ${reason || 'N/A'}`,
      })

      return ok(updated)
    }

    if (notes) {
      const updated = await db.invoice.update({
        where: { id },
        data: { notes },
      })
      return ok(updated)
    }

    return Errors.validation('Invalid patch action')
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)

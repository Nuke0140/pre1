import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId') || undefined
    const method = sp.get('method') || undefined
    const requestedBranchId = sp.get('branchId') || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(sp.get('pageSize') || '50'))

    // Server-side branch authorization
    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isInstitutionWide = effectiveRoles.some((r) =>
      ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
    )

    let branchFilter: any = undefined
    if (isInstitutionWide) {
      if (requestedBranchId && requestedBranchId !== 'ALL' && requestedBranchId !== '__ALL_BRANCHES__') {
        branchFilter = requestedBranchId
      }
    } else {
      const allowedBranchIds = await getAuthorizedBranchIds(session)
      // Fail-closed if no branch assignments exist for non-institution-wide staff
      if (!allowedBranchIds || allowedBranchIds.length === 0) {
        return ok([], { page, pageSize, total: 0, totalPages: 0 })
      }

      if (requestedBranchId && requestedBranchId !== 'ALL' && requestedBranchId !== '__ALL_BRANCHES__') {
        if (!allowedBranchIds.includes(requestedBranchId)) {
          return Errors.forbidden('Access denied: branch scope restricted')
        }
        branchFilter = requestedBranchId
      } else {
        branchFilter = { in: allowedBranchIds }
      }
    }

    const where: any = {
      tenantId: session.tenantId,
      ...(studentId ? { studentId } : {}),
      ...(method ? { method: method as any } : {}),
      ...(branchFilter ? { student: { branchId: branchFilter } } : {}),
    }

    const [total, payments] = await Promise.all([
      db.payment.count({ where }),
      db.payment.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true, branchId: true } },
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

    if (studentId) {
      const st = await db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { branchId: true } })
      if (!st) return Errors.notFound('Student')
      const branchCheck = await requireBranchAccess(session, st.branchId)
      if (branchCheck) return branchCheck
    }
    if (invoiceId) {
      const inv = await db.invoice.findFirst({ where: { id: invoiceId, tenantId: session.tenantId }, select: { branchId: true } })
      if (!inv) return Errors.notFound('Invoice')
      const branchCheck = await requireBranchAccess(session, inv.branchId)
      if (branchCheck) return branchCheck
    }

    if (feeScheduleId && studentId) {
      // Validate that student belongs to actor's branch scope for non-institution-wide staff
      const student = await db.student.findFirst({
        where: { id: studentId, tenantId: session.tenantId, deletedAt: null },
        select: { id: true, branchId: true },
      })
      if (!student) return Errors.notFound('Student')

      const allowedBranchIds = await getAuthorizedBranchIds(session)
      if (allowedBranchIds && !allowedBranchIds.includes(student.branchId)) {
        return Errors.forbidden('Access denied: cannot record payments for students outside assigned campus')
      }

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
      // Validate that invoice belongs to student within actor's branch scope for non-institution-wide staff
      const invoice = await db.invoice.findFirst({
        where: { id: invoiceId, tenantId: session.tenantId, deletedAt: null },
        select: { id: true, student: { select: { branchId: true } } },
      })
      if (!invoice) return Errors.notFound('Invoice')

      const allowedBranchIds = await getAuthorizedBranchIds(session)
      if (allowedBranchIds && invoice.student && !allowedBranchIds.includes(invoice.student.branchId)) {
        return Errors.forbidden('Access denied: cannot record payments for students outside assigned campus')
      }

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

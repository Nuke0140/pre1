import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'

/** GET /api/v1/invoices — list w/ filters (studentId, status) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId')
    const status = sp.get('status')
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(sp.get('pageSize') || '50'))

    const where = {
      tenantId: session.tenantId,
      deletedAt: null,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status: status as 'ISSUED' } : {}),
    }

    const [total, invoices] = await Promise.all([
      db.invoice.count({ where }),
      db.invoice.findMany({
        where,
        include: {
          student: {
            select: {
              firstName: true, lastName: true, admissionNo: true,
              guardians: { include: { guardian: { select: { fullName: true } } }, where: { isFeePayer: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return ok(
      invoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        title: i.title,
        studentName: `${i.student.firstName} ${i.student.lastName || ''}`.trim(),
        admissionNo: i.student.admissionNo,
        feePayer: i.student.guardians[0]?.guardian.fullName ?? null,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        subtotalCents: i.subtotalCents,
        totalCents: i.totalCents,
        paidCents: i.paidCents,
        balanceCents: i.balanceCents,
        status: i.status,
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/invoices — create manual invoice (finance:write) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { studentId, title, dueDate, lineItems } = body as {
      studentId: string
      title?: string
      dueDate: string
      lineItems: { description: string; amountCents: number; feeHead?: string }[]
    }
    if (!studentId || !dueDate || !Array.isArray(lineItems) || lineItems.length === 0) {
      return Errors.validation('studentId, dueDate and lineItems[] are required')
    }

    const student = await db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId } })
    if (!student) return Errors.notFound('Student')

    const subtotal = lineItems.reduce((s, i) => s + Math.round(i.amountCents), 0)
    const invoiceNumber = await nextNumber('invoice', session.tenantId)

    const invoice = await db.invoice.create({
      data: {
        tenantId: session.tenantId,
        branchId: student.branchId,
        studentId,
        invoiceNumber,
        title: title || 'Fee Invoice',
        dueDate: new Date(dueDate),
        subtotalCents: subtotal,
        totalCents: subtotal,
        balanceCents: subtotal,
        status: 'ISSUED',
        issuedById: session.uid,
        items: {
          create: lineItems.map((i) => ({
            feeHead: (i.feeHead as 'TUITION') || 'OTHER',
            description: i.description,
            amountCents: Math.round(i.amountCents),
          })),
        },
      },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      summary: `Invoice ${invoiceNumber} raised for ${student.firstName}`,
    })

    return ok({ invoiceId: invoice.id, invoiceNumber }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}

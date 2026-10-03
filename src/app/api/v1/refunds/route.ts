import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import { db } from '@/lib/db'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId') || undefined

    const refunds = await db.refund.findMany({
      where: {
        tenantId: session.tenantId,
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        deposit: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(refunds.map((r) => ({
      id: r.id,
      amountCents: r.amountCents,
      amountRupees: (r.amountCents / 100).toFixed(2),
      refundDate: r.refundDate,
      refundMode: r.refundMode,
      reference: r.reference,
      reason: r.reason,
      studentName: r.student ? `${r.student.firstName} ${r.student.lastName || ''}`.trim() : 'N/A',
      admissionNo: r.student?.admissionNo ?? 'N/A',
      depositName: r.deposit?.name ?? 'Deposit',
    })))
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
    const { depositId, feeScheduleId, studentId, amountCents, amountRupees, refundMode, reference, reason } = body

    const cents = amountCents ? Math.round(amountCents) : amountRupees ? Math.round(amountRupees * 100) : 0
    if (!studentId || !cents || cents <= 0 || !reason) {
      return Errors.validation('studentId, positive amount, and reason are required')
    }

    const result = await FeeService.processRefund(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        depositId,
        feeScheduleId,
        studentId,
        amountCents: cents,
        refundMode,
        reference,
        reason,
      }
    )

    return ok(result, undefined, 201)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)

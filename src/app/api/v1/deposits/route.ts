import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import type { DepositStatus } from '@prisma/client'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId') || undefined
    const status = (sp.get('status') as DepositStatus) || undefined

    const deposits = await FeeService.getStudentDeposits(session.tenantId, studentId, status)

    return ok(deposits.map((d) => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.student ? `${d.student.firstName} ${d.student.lastName || ''}`.trim() : 'N/A',
      admissionNo: d.student?.admissionNo ?? 'N/A',
      name: d.name,
      totalRupees: (d.totalAmountCents / 100).toFixed(2),
      refundedRupees: (d.refundedAmountCents / 100).toFixed(2),
      adjustedRupees: (d.adjustedAmountCents / 100).toFixed(2),
      remainingRupees: (d.remainingAmountCents / 100).toFixed(2),
      status: d.status,
      notes: d.notes,
      refunds: d.refunds,
      createdAt: d.createdAt,
    })))
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)

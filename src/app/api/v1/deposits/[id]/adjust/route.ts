import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

async function _POST(req: NextRequest, ctx: { params?: Promise<{ id: string }> | { id: string } }) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const params = ctx.params instanceof Promise ? await ctx.params : ctx.params
    const depositId = params?.id
    if (!depositId) return Errors.validation('Deposit ID is required')

    const body = await req.json()
    const { studentId, adjustmentAmountCents, adjustmentAmountRupees, reason } = body

    const cents = adjustmentAmountCents
      ? Math.round(adjustmentAmountCents)
      : adjustmentAmountRupees
      ? Math.round(adjustmentAmountRupees * 100)
      : 0

    if (!studentId || !cents || cents <= 0 || !reason) {
      return Errors.validation('studentId, positive adjustment amount, and reason are required')
    }

    const updated = await FeeService.adjustDeposit(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        depositId,
        studentId,
        adjustmentAmountCents: cents,
        reason,
      }
    )

    return ok(updated)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

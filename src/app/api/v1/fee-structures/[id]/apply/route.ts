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
    const id = params?.id
    if (!id) return Errors.validation('Structure ID is required')

    let classroomId: string | undefined = undefined
    try {
      const body = await req.json()
      classroomId = body.classroomId
    } catch {
      // Empty body allowed
    }

    const result = await FeeService.applyFeeStructureToClass(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      classroomId
    )

    return ok(result)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

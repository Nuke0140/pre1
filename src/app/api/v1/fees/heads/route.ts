import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const activeOnly = sp.get('activeOnly') !== 'false'
    const feeHeads = await FeeService.getFeeHeads(session.tenantId, activeOnly)
    return ok(feeHeads)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { name, code, category, description, sortOrder } = body
    if (!name || typeof name !== 'string') {
      return Errors.validation('name is required')
    }

    const feeHead = await FeeService.createFeeHead(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      { name, code, category, description, sortOrder }
    )

    return ok(feeHead, undefined, 201)
  } catch (e: any) {
    return Errors.system(e)
  }
}

import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { studentId } = body
    if (!studentId) return Errors.validation('studentId is required')

    const siblingResult = await FeeService.calculateSiblingDiscount(session.tenantId, studentId)
    return ok(siblingResult)
  } catch (e: any) {
    return Errors.system(e)
  }
}

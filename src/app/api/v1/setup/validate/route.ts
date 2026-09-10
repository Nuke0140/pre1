import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { validateAndRecord } from '@/lib/setup/validate'
import { syncSetup } from '@/lib/setup/engine'

/** POST /api/v1/setup/validate — run + persist a SETUP_VALIDATION run */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const result = await validateAndRecord(session.tenantId, 'SETUP_VALIDATION', {
      id: session.uid, name: session.name,
    })
    if (!result) return Errors.notFound('Tenant')
    const payload = await syncSetup(session.tenantId, { id: session.uid, name: session.name })
    return ok({ ...result, setupStatus: payload?.status })
  } catch (e) {
    return Errors.system(e)
  }
}

/** GET /api/v1/setup/validate — latest validation runs */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  try {
    const runs = await (await import('@/lib/db')).db.schoolSetupValidationRun.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return ok(runs)
  } catch (e) {
    return Errors.system(e)
  }
}

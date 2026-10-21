import { NextRequest } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { ok, Errors } from '@/lib/api'
import { executeAction, previewAction, type AiAction, type Executed } from '@/lib/ai/actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ponytail: per-process idempotency cache; move to a DB table if multiple instances run
const done = new Map<string, { at: number; result: Executed }>()

/** POST /api/v1/ai/actions { mode: 'preview' | 'execute', action, key } */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const body = await req.json().catch(() => null)
  const action = body?.action as AiAction | undefined
  if (!action || typeof action !== 'object' || typeof (action as any).type !== 'string') return Errors.validation('action is required')
  const s = {
    tenantId: session.tenantId,
    branchId: session.role === 'OWNER' ? null : session.branchId ?? null,
    uid: session.uid,
    name: session.name,
    role: session.role,
    roles: (session.roles?.length ? session.roles : [session.role]) as any[],
  }

  if (body?.mode === 'execute') {
    const key = String(body?.key ?? '').slice(0, 64)
    if (!/^[a-z0-9-]{8,64}$/i.test(key)) return Errors.validation('key is required for execute')
    const cacheKey = `${session.tenantId}:${session.uid}:${key}`
    const prior = done.get(cacheKey)
    if (prior) return ok({ ...prior.result, replayed: true })
    const result = await executeAction(s, action, key)
    if (result.ok) done.set(cacheKey, { at: Date.now(), result })
    for (const [k, v] of done) if (Date.now() - v.at > 6 * 3600_000) done.delete(k)
    return ok(result)
  }
  return ok(await previewAction(s, action))
}

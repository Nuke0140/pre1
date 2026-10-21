import { NextRequest } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { Errors } from '@/lib/api'
import { db } from '@/lib/db'
import { buildSchoolContext } from '@/lib/ai/school-context'
import { runClaude } from '@/lib/ai/claude-runner'
import { SYSTEM_PROMPT, buildPrompt, type ChatTurn } from '@/lib/ai/prompt'
import { fallbackAnswer } from '@/lib/ai/fallback'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BRANCH_WIDE_ROLES = new Set(['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'])

/**
 * POST /api/v1/ai/chat — Server-Sent Events stream.
 * events: status {label}, delta {text}, done {fallback}, error {message}
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'reports:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const body = await req.json().catch(() => null)
  const question = String(body?.question ?? '').trim().slice(0, 2000)
  if (!question) return Errors.validation('question is required')
  const history: ChatTurn[] = Array.isArray(body?.history)
    ? body.history
        .filter((t: any) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string')
        .map((t: any) => ({ role: t.role, content: t.content }))
    : []

  const roles = (session.roles?.length ? session.roles : [session.role]) as any[]
  // Leaders may pick any branch of their school; everyone else is pinned to their own branch.
  let branchId: string | null = session.branchId ?? null
  if (roles.some((r) => BRANCH_WIDE_ROLES.has(r))) {
    branchId = null
    if (typeof body?.branchId === 'string' && body.branchId !== 'ALL') {
      const b = await db.branch.findFirst({ where: { id: body.branchId, tenantId: session.tenantId }, select: { id: true } })
      if (!b) return Errors.forbidden('Branch not in your school')
      branchId = b.id
    }
  }

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }
      try {
        send('status', { label: 'Checking your access', detail: roles.join(', ') })
        const ctx = await buildSchoolContext({ tenantId: session.tenantId!, branchId, roles })
        const students = ctx.sessionTotals.reduce((s, x) => Math.max(s, x.students), 0)
        send('status', {
          label: `Reading ${ctx.academicSessions.length} academic years`,
          detail: `${ctx.scope} · ${ctx.bySessionBranchProgram.length} cohorts · up to ${students} students/year`,
        })
        send('status', { label: 'Thinking', detail: 'Crunching enrolments, fees, attendance and learning outcomes' })

        let gotText = false
        try {
          await runClaude({
            system: SYSTEM_PROMPT,
            prompt: buildPrompt(ctx, history, question, session.name ?? 'there', session.role),
            signal: req.signal,
            onDelta: (text) => {
              gotText = true
              send('delta', { text })
            },
          })
          send('done', { fallback: false })
        } catch (err: any) {
          if (req.signal.aborted) return
          console.error('[PreO AI] Claude run failed:', err?.message)
          if (!gotText) {
            send('delta', { text: fallbackAnswer(ctx, question) })
            send('done', { fallback: true })
          } else {
            send('error', { message: 'The answer was interrupted. Please try again.' })
          }
        }

        audit({
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
          action: 'AI_QUERY',
          entity: 'AiChat',
          module: 'REPORTS',
          summary: question.slice(0, 200),
        }).catch(() => {})
      } catch (err: any) {
        console.error('[PreO AI] failed:', err)
        send('error', { message: 'PreO AI could not read your school data right now.' })
      } finally {
        try { controller.close() } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

import crypto from 'crypto'
import { db } from '@/lib/db'

export const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'preone_n8n_hmac_secret_2026_secure'
export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || null

export interface N8nEventPayload {
  eventId: string
  eventType: string
  tenantId: string
  branchId?: string | null
  locale?: string
  timestamp: string
  data: Record<string, any>
}

/**
 * Generate HMAC-SHA256 signature for outgoing payload.
 */
export function generateHmacSignature(payload: string, secret: string = N8N_WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verify HMAC-SHA256 signature for incoming n8n webhook/callback.
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string = N8N_WEBHOOK_SECRET): boolean {
  try {
    const computed = generateHmacSignature(payload, secret)
    return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(signature, 'utf8'))
  } catch {
    return false
  }
}

/**
 * Dispatches an event to n8n webhook orchestrator with HMAC signature, retry tracking, and idempotency.
 * Fire-and-forget: does not block the calling business transaction.
 */
export async function dispatchN8nEvent(params: {
  eventId?: string
  eventType: string
  tenantId: string
  branchId?: string | null
  locale?: string
  data: Record<string, any>
}): Promise<{ eventId: string; status: string }> {
  const eventId = params.eventId || crypto.randomUUID()
  const locale = params.locale || 'en-IN'

  const eventPayload: N8nEventPayload = {
    eventId,
    eventType: params.eventType,
    tenantId: params.tenantId,
    branchId: params.branchId ?? null,
    locale,
    timestamp: new Date().toISOString(),
    data: params.data,
  }

  // Record into IntegrationEvent table
  try {
    // Idempotency check: If already SUCCESS, do not duplicate outbound side-effects
    const existing = await db.integrationEvent.findUnique({
      where: { eventId },
    })

    if (existing && (existing.status === 'SUCCESS' || existing.status === 'DEAD_LETTER')) {
      console.info(`[n8n] Event ${eventId} already in terminal state ${existing.status}. Skipping outbound dispatch.`)
      return { eventId, status: existing.status }
    }

    await db.integrationEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        tenantId: params.tenantId,
        branchId: params.branchId ?? null,
        eventType: params.eventType,
        locale,
        status: 'PENDING',
        payload: eventPayload as any,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    })
  } catch (err) {
    console.warn('[n8n] Failed to record IntegrationEvent in DB:', err)
  }

  // If n8n webhook URL is not configured or in test mode, mark as recorded and return
  if (!N8N_WEBHOOK_URL) {
    console.info(`[n8n] Event ${params.eventType} recorded with id ${eventId} (N8N_WEBHOOK_URL not configured).`)
    return { eventId, status: 'PENDING' }
  }

  // Asynchronous outbound dispatch
  const payloadString = JSON.stringify(eventPayload)
  const signature = generateHmacSignature(payloadString)

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PreOne-Signature': signature,
        'X-PreOne-Event': params.eventType,
        'X-PreOne-Event-Id': eventId,
        'X-PreOne-Tenant-Id': params.tenantId,
      },
      body: payloadString,
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (response.ok) {
      await db.integrationEvent.update({
        where: { eventId },
        data: {
          status: 'SUCCESS',
          lastErrorCode: null,
        },
      }).catch(() => {})
      return { eventId, status: 'SUCCESS' }
    } else {
      const errText = await response.text().catch(() => 'Unknown error')
      await db.integrationEvent.update({
        where: { eventId },
        data: {
          status: 'FAILED',
          lastErrorCode: `HTTP_${response.status}: ${errText.slice(0, 100)}`,
        },
      }).catch(() => {})
      return { eventId, status: 'FAILED' }
    }
  } catch (err: any) {
    console.error(`[n8n] Outbound dispatch failed for event ${eventId}:`, err?.message || err)
    
    // Check attempt count for DEAD_LETTER threshold
    const cur = await db.integrationEvent.findUnique({
      where: { eventId },
      select: { attemptCount: true },
    }).catch(() => null)

    const attempts = cur?.attemptCount ?? 1
    const isDeadLetter = attempts >= 3

    await db.integrationEvent.update({
      where: { eventId },
      data: {
        status: isDeadLetter ? 'DEAD_LETTER' : 'RETRYING',
        lastErrorCode: err?.message || 'Network error',
        nextRetryAt: isDeadLetter ? null : new Date(Date.now() + 60 * 1000), // Retry in 1 min
      },
    }).catch(() => {})
    return { eventId, status: isDeadLetter ? 'DEAD_LETTER' : 'RETRYING' }
  }
}

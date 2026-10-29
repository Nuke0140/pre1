import { NextRequest, NextResponse } from 'next/server'
import { verifyHmacSignature } from '@/lib/integrations/n8n'
import { db } from '@/lib/db'
import { getTranslation } from '@/lib/i18n'
import { SupportedLocale } from '@/lib/i18n/types'

// Resilient memory cache for callback idempotency (L1 fast lookup)
const processedCallbacks = new Map<string, { status: string; tenantId: string; processedAt: string }>()

/**
 * Exposed for testing to simulate process restarts or multi-instance cache miss.
 */
export function _testClearCallbackCache() {
  processedCallbacks.clear()
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-preone-signature')
  const eventId = req.headers.get('x-preone-event-id')
  const eventType = req.headers.get('x-preone-event')
  const tenantId = req.headers.get('x-preone-tenant-id')

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        error: 'HMAC_SIGNATURE_INVALID',
        message: getTranslation('errors.HMAC_SIGNATURE_INVALID', 'en-IN'),
      },
      { status: 401 }
    )
  }

  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json(
      { success: false, error: 'INVALID_INPUT', message: 'Could not read request body' },
      { status: 400 }
    )
  }

  // Verify HMAC-SHA256 signature
  const isValid = verifyHmacSignature(rawBody, signature)
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'HMAC_SIGNATURE_INVALID',
        message: getTranslation('errors.HMAC_SIGNATURE_INVALID', 'en-IN'),
      },
      { status: 401 }
    )
  }

  let body: any = {}
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { success: false, error: 'INVALID_INPUT', message: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  const resolvedEventId = eventId || body.eventId
  if (!resolvedEventId) {
    return NextResponse.json(
      {
        success: false,
        error: 'EVENT_ID_REQUIRED',
        message: getTranslation('errors.EVENT_ID_REQUIRED', 'en-IN'),
      },
      { status: 400 }
    )
  }

  const targetTenantId = tenantId || body.tenantId
  if (!targetTenantId) {
    return NextResponse.json(
      {
        success: false,
        error: 'TENANT_MISMATCH',
        message: getTranslation('errors.TENANT_MISMATCH', 'en-IN'),
      },
      { status: 400 }
    )
  }

  const tenant = await db.tenant.findUnique({ where: { id: targetTenantId } })
  if (!tenant) {
    return NextResponse.json(
      {
        success: false,
        error: 'TENANT_MISMATCH',
        message: getTranslation('errors.TENANT_MISMATCH', 'en-IN'),
      },
      { status: 404 }
    )
  }

  const cacheKey = `${targetTenantId}:${resolvedEventId}`

  // 1. L1 Fast-path: In-memory cache check
  const existingCache = processedCallbacks.get(cacheKey)
  if (existingCache && existingCache.status === 'SUCCESS') {
    return NextResponse.json(
      {
        success: true,
        data: {
          eventId: resolvedEventId,
          status: 'ALREADY_PROCESSED',
          message: 'Callback already processed idempotently',
        },
      },
      { status: 200 }
    )
  }

  // 2. L2 Persistent source of truth: NotificationDeliveryLog (survives restarts & multi-container)
  try {
    const existingLog = await db.notificationDeliveryLog.findFirst({
      where: {
        tenantId: targetTenantId,
        eventId: resolvedEventId,
        eventType: 'N8N_CALLBACK',
      },
    })

    if (existingLog && existingLog.status === 'SUCCESS') {
      // Repopulate L1 cache
      processedCallbacks.set(cacheKey, {
        status: 'SUCCESS',
        tenantId: targetTenantId,
        processedAt: existingLog.createdAt.toISOString(),
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            eventId: resolvedEventId,
            status: 'ALREADY_PROCESSED',
            message: 'Callback already processed idempotently',
          },
        },
        { status: 200 }
      )
    }
  } catch (err) {
    console.warn('[n8n callback] Persistent delivery log check warning:', err)
  }

  // 3. Optional integrationEvent check
  let existingEvent: any = null
  try {
    if ((db as any).integrationEvent) {
      existingEvent = await (db as any).integrationEvent.findUnique({
        where: { eventId: resolvedEventId },
      })
    }
  } catch {}

  if (existingEvent && existingEvent.status === 'SUCCESS' && existingEvent.response) {
    processedCallbacks.set(cacheKey, {
      status: 'SUCCESS',
      tenantId: targetTenantId,
      processedAt: new Date().toISOString(),
    })
    return NextResponse.json(
      {
        success: true,
        data: {
          eventId: resolvedEventId,
          status: 'ALREADY_PROCESSED',
          message: 'Callback already processed idempotently',
        },
      },
      { status: 200 }
    )
  }

  const locale = (body.locale || existingEvent?.locale || 'en-IN') as SupportedLocale

  // Record into L1 memory cache
  processedCallbacks.set(cacheKey, {
    status: 'SUCCESS',
    tenantId: targetTenantId,
    processedAt: new Date().toISOString(),
  })

  // Record into L2 persistent database log
  try {
    await db.notificationDeliveryLog.create({
      data: {
        tenantId: targetTenantId,
        eventId: resolvedEventId,
        eventType: 'N8N_CALLBACK',
        channel: 'WEBHOOK',
        recipientType: 'SYSTEM',
        recipientId: 'n8n',
        title: `n8n callback: ${eventType || body.eventType || 'N8N_CALLBACK'}`,
        body: JSON.stringify(body).slice(0, 1000),
        status: 'SUCCESS',
        metadata: {
          result: body.result ?? null,
          processedAt: new Date().toISOString(),
          payload: body,
        },
      },
    })
  } catch (err) {
    console.warn('[n8n callback] Could not write persistent delivery log:', err)
  }

  // Update IntegrationEvent status to SUCCESS if table exists
  try {
    if ((db as any).integrationEvent) {
      await (db as any).integrationEvent.upsert({
        where: { eventId: resolvedEventId },
        create: {
          eventId: resolvedEventId,
          tenantId: targetTenantId,
          branchId: body.branchId ?? null,
          eventType: eventType || body.eventType || 'N8N_CALLBACK',
          locale,
          status: 'SUCCESS',
          payload: body,
          response: {
            processedAt: new Date().toISOString(),
            status: 'OK',
            result: body.result ?? null,
          },
          lastAttemptAt: new Date(),
        },
        update: {
          status: 'SUCCESS',
          response: {
            processedAt: new Date().toISOString(),
            status: 'OK',
            result: body.result ?? null,
          },
          lastAttemptAt: new Date(),
        },
      })
    }
  } catch {}

  return NextResponse.json({
    success: true,
    data: {
      eventId: resolvedEventId,
      status: 'SUCCESS',
      message: getTranslation('common.success', locale),
    },
  })
}

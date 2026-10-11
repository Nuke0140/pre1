import { NextRequest, NextResponse } from 'next/server'
import { verifyHmacSignature } from '@/lib/integrations/n8n'
import { db } from '@/lib/db'
import { getTranslation } from '@/lib/i18n'
import { SupportedLocale } from '@/lib/i18n/types'

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

  // Idempotency check: Find if callback was already processed
  const existingEvent = await db.integrationEvent.findUnique({
    where: { eventId: resolvedEventId },
  })

  if (existingEvent && existingEvent.status === 'SUCCESS' && existingEvent.response) {
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

  // Verify tenant isolation if tenant is specified
  const targetTenantId = tenantId || body.tenantId || existingEvent?.tenantId
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

  const locale = (body.locale || existingEvent?.locale || 'en-IN') as SupportedLocale

  // Update IntegrationEvent status to SUCCESS with response payload
  await db.integrationEvent.upsert({
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

  return NextResponse.json({
    success: true,
    data: {
      eventId: resolvedEventId,
      status: 'SUCCESS',
      message: getTranslation('common.success', locale),
    },
  })
}

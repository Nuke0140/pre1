import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { ok, Errors } from '@/lib/api'
import { FeeService } from '@/lib/fees/fee-service'
import { db } from '@/lib/db'

function verifyGatewaySignature(rawBody: string, providedSignature?: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  // In production, signature verification is strictly mandatory
  if (!secret) {
    if (isProduction) {
      return false
    }
    // In non-production, allow tests/local mocks without secret only if signature is mock-valid or omitted
    return true
  }

  if (!providedSignature) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    return (
      providedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))
    )
  } catch {
    return false
  }
}

async function _POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return Errors.validation('Invalid JSON payload in payment webhook')
    }

    const { tenantId: bodyTenantId, paymentNumber, transactionRef, gatewayStatus, signature: bodySignature } = body

    if (!paymentNumber && !transactionRef) {
      return Errors.validation('paymentNumber or transactionRef is required')
    }

    // Cryptographic webhook verification
    const headerSignature =
      req.headers.get('x-gateway-signature') ||
      req.headers.get('x-razorpay-signature') ||
      req.headers.get('x-signature')
    const signature = headerSignature || bodySignature

    if (!verifyGatewaySignature(rawBody, signature)) {
      return Errors.unauthorized('Invalid or unverified payment gateway webhook signature')
    }

    // Authoritatively resolve payment and tenant from the persisted payment record (prevent tenantId spoofing)
    const payment = await db.payment.findFirst({
      where: paymentNumber
        ? { paymentNumber }
        : { transactionRef: transactionRef! },
      include: { tenant: true },
    })

    if (!payment) {
      return Errors.notFound('Payment record')
    }

    // Enforce that incoming tenantId, if supplied, strictly matches the authoritative payment record
    if (bodyTenantId && bodyTenantId !== payment.tenantId) {
      return Errors.forbidden('Provided tenantId does not match authoritative payment record')
    }

    const tenantId = payment.tenantId

    // Verify idempotently
    const result = await FeeService.verifyPayment(
      {
        tenantId,
        actorId: 'system-webhook',
        actorName: 'Payment Gateway Webhook',
        actorRole: 'SYSTEM',
      },
      {
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        transactionRef: payment.transactionRef || undefined,
        gatewayStatus: gatewayStatus || 'SUCCESS',
        gatewaySignature: signature,
      }
    )

    return ok(result)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const POST = withApi(_POST)

import { describe, it, expect, beforeAll } from 'bun:test'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { POST as paymentWebhook } from '@/app/api/v1/payments/webhook/route'
import { db } from '@/lib/db'

describe('Payment Webhook Cryptographic Verification & Tenant Integrity Audit', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let invoice: any
  let payment: any
  const secret = 'test-payment-webhook-secret-32-chars-long!'

  beforeAll(async () => {
    testTenant = await db.tenant.create({
      data: {
        code: `WH-TEST-${ts.slice(-6)}`,
        name: `Webhook Test Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    const branch = await db.branch.create({
      data: {
        tenantId: testTenant.id,
        name: 'Main Campus',
        code: `BR-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    const student = await db.student.create({
      data: {
        tenantId: testTenant.id,
        branchId: branch.id,
        admissionNo: `STU-WH-${ts.slice(-6)}`,
        firstName: 'Test',
        lastName: 'Payer',
        gender: 'MALE',
        dob: new Date('2022-01-01'),
        status: 'ACTIVE',
      },
    })

    invoice = await db.invoice.create({
      data: {
        tenantId: testTenant.id,
        branchId: branch.id,
        invoiceNumber: `INV-WH-${ts.slice(-6)}`,
        studentId: student.id,
        subtotalCents: 100000,
        taxCents: 0,
        totalCents: 100000,
        balanceCents: 100000,
        dueDate: new Date(Date.now() + 86400000),
        status: 'ISSUED',
      },
    })

    payment = await db.payment.create({
      data: {
        tenantId: testTenant.id,
        invoiceId: invoice.id,
        paymentNumber: `PAY-WH-${ts.slice(-6)}`,
        transactionRef: `tx_${ts}`,
        amountCents: 100000,
        method: 'ONLINE',
        status: 'PENDING',
      },
    })
  })

  it('rejects unauthenticated webhook when signature is missing and secret is configured', async () => {
    const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET
    try {
      process.env.PAYMENT_WEBHOOK_SECRET = secret

      const payload = JSON.stringify({
        paymentNumber: payment.paymentNumber,
        gatewayStatus: 'SUCCESS',
      })

      const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      const res = await paymentWebhook(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_001')
    } finally {
      process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
    }
  })

  it('rejects forged or altered HMAC signature', async () => {
    const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET
    try {
      process.env.PAYMENT_WEBHOOK_SECRET = secret

      const payload = JSON.stringify({
        paymentNumber: payment.paymentNumber,
        gatewayStatus: 'SUCCESS',
      })

      const forgedSignature = crypto
        .createHmac('sha256', 'wrong-secret-key')
        .update(payload)
        .digest('hex')

      const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-signature': forgedSignature,
        },
        body: payload,
      })

      const res = await paymentWebhook(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.success).toBe(false)
    } finally {
      process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
    }
  })

  it('fails closed in production environment when webhook secret is not configured', async () => {
    const originalEnv = process.env.NODE_ENV
    const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET
    try {
      process.env.NODE_ENV = 'production'
      delete process.env.PAYMENT_WEBHOOK_SECRET
      delete process.env.RAZORPAY_WEBHOOK_SECRET

      const payload = JSON.stringify({
        paymentNumber: payment.paymentNumber,
        gatewayStatus: 'SUCCESS',
      })

      const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      const res = await paymentWebhook(req)
      expect(res.status).toBe(401)
    } finally {
      process.env.NODE_ENV = originalEnv
      process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
    }
  })

  it('rejects webhook when body tenantId does not match authoritative payment record (anti-spoofing)', async () => {
    const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET
    try {
      process.env.PAYMENT_WEBHOOK_SECRET = secret

      const payload = JSON.stringify({
        tenantId: 'spoofed-attacker-tenant-id',
        paymentNumber: payment.paymentNumber,
        gatewayStatus: 'SUCCESS',
      })

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

      const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-signature': validSignature,
        },
        body: payload,
      })

      const res = await paymentWebhook(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error.code).toBe('PERMISSION_001')
      expect(data.error.message).toContain('Provided tenantId does not match authoritative payment record')
    } finally {
      process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
    }
  })

  it('verifies payment with valid HMAC signature and authoritatively marks payment SUCCESS and issues receipt', async () => {
    const originalSecret = process.env.PAYMENT_WEBHOOK_SECRET
    try {
      process.env.PAYMENT_WEBHOOK_SECRET = secret

      const payload = JSON.stringify({
        paymentNumber: payment.paymentNumber,
        gatewayStatus: 'SUCCESS',
      })

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

      const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-signature': validSignature,
        },
        body: payload,
      })

      const res = await paymentWebhook(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.payment.status).toBe('SUCCESS')
      expect(data.data.receipt).toBeDefined()

      // Idempotency check: repeated webhook invocation returns existing verified receipt
      const repeatReq = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-signature': validSignature,
        },
        body: payload,
      })
      const repeatRes = await paymentWebhook(repeatReq)
      expect(repeatRes.status).toBe(200)
      const repeatData = await repeatRes.json()
      expect(repeatData.success).toBe(true)
      expect(repeatData.data.alreadyVerified).toBe(true)
    } finally {
      process.env.PAYMENT_WEBHOOK_SECRET = originalSecret
    }
  })
})

import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import {
  buildSnsStringToSign,
  verifySnsMessageSignature,
  type SnsMessage,
} from '@/lib/email/sns-verifier'
import { createSesWebhookHandler } from '@/lib/email/ses-webhook-handler'

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

function signedBounce(messageId: string, sesMessageId = 'ses-message-123'): SnsMessage {
  const payload: SnsMessage = {
    Type: 'Notification',
    MessageId: messageId,
    TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-bounces',
    Message: JSON.stringify({
      notificationType: 'Bounce',
      bounce: {
        bounceType: 'Permanent',
        bounceSubType: 'General',
        bouncedRecipients: [{
          emailAddress: 'bounce-test@example.invalid',
          action: 'failed',
          diagnosticCode: 'smtp; 550 user unknown',
        }],
      },
      mail: { messageId: sesMessageId },
    }),
    Timestamp: '2026-10-11T00:00:00.000Z',
    SignatureVersion: '1',
    Signature: '',
    SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/test.pem',
  }
  const canonical = buildSnsStringToSign(payload)
  if (!canonical) throw new Error('Unable to build SNS canonical string')
  const signer = crypto.createSign('RSA-SHA1')
  signer.update(canonical, 'utf8')
  payload.Signature = signer.sign(privateKey, 'base64')
  return payload
}

function createHarness() {
  const rows: any[] = []
  const originalDelivery = { tenantId: 'tenant-test-1' }
  const db: any = {
    notificationDeliveryLog: {
      findFirst: async ({ where }: any) => {
        const key = where.metadata.path[0]
        const value = where.metadata.equals
        if (key === 'snsMessageId') {
          return rows.find((row) => row.metadata?.snsMessageId === value) || null
        }
        if (key === 'providerMessageId' && value === 'ses-message-123') return originalDelivery
        return null
      },
      create: async ({ data }: any) => {
        rows.push(data)
        return data
      },
    },
    tenant: { findFirst: async () => null },
  }
  const handler = createSesWebhookHandler({
    db,
    verifySignature: (message) => verifySnsMessageSignature(message, { certOverride: publicKey }),
    logger: { warn() {}, info() {}, error() {} },
    env: { SNS_SES_TOPIC_ARN: 'arn:aws:sns:ap-south-1:123456789012:ses-bounces' },
  })
  const request = (payload: SnsMessage) => new NextRequest('http://localhost/api/v1/webhooks/ses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { rows, handler, request }
}

describe('SES webhook handler security regression tests', () => {
  it('processes a validly signed bounce and writes it under the correlated tenant', async () => {
    const { rows, handler, request } = createHarness()
    const response = await handler(request(signedBounce('sns-bounce-valid-1')))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      success: true,
      data: { status: 'BOUNCE_PROCESSED', count: 1 },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].tenantId).toBe('tenant-test-1')
    expect(rows[0].metadata.snsMessageId).toBe('sns-bounce-valid-1')
  })

  it('rejects a replay of the same signed SNS message without writing twice', async () => {
    const { rows, handler, request } = createHarness()
    const payload = signedBounce('sns-bounce-replay-1')
    const first = await handler(request(payload))
    const replay = await handler(request(payload))
    expect(first.status).toBe(200)
    expect(replay.status).toBe(200)
    expect(await replay.json()).toMatchObject({
      success: true,
      data: { status: 'DUPLICATE_IGNORED', messageId: 'sns-bounce-replay-1' },
    })
    expect(rows).toHaveLength(1)
  })

  it('fails closed if no SNS topic allowlist is configured', async () => {
    const { request } = createHarness()
    const payload = signedBounce('sns-no-allowlist-1')
    const noAllowlistHandler = createSesWebhookHandler({
      db: {
        notificationDeliveryLog: {
          findFirst: async () => { throw new Error('DB should not be called') },
          create: async () => { throw new Error('DB should not be called') },
        },
        tenant: { findFirst: async () => null },
      } as any,
      verifySignature: async () => { throw new Error('Signature verification should not be called') },
      logger: { warn() {}, info() {}, error() {} },
      env: {},
    })
    const response = await noAllowlistHandler(request(payload))
    expect(response.status).toBe(403)
  })

  it('does not attribute an uncorrelated SES event to an arbitrary tenant', async () => {
    const { handler, request } = createHarness()
    const payload = signedBounce('sns-unmatched-1', 'unknown-ses-message-id')
    const response = await handler(request(payload))
    expect(response.status).toBeGreaterThanOrEqual(500)
  })
})

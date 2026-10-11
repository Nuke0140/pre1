import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { AmazonSesProvider } from '@/lib/email/ses-provider'
import {
  isValidSnsSigningCertUrl,
  buildSnsStringToSign,
  verifySnsMessageSignature,
  SnsMessage,
} from '@/lib/email/sns-verifier'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { POST as handleSesWebhook } from '@/app/api/v1/webhooks/ses/route'

// Generate a real in-memory RSA keypair for testing cryptographic verification
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

// Helper to sign an SNS payload
function signSnsPayload(msg: SnsMessage): string {
  const stringToSign = buildSnsStringToSign(msg)
  if (!stringToSign) throw new Error('Failed to build string to sign')
  const signer = crypto.createSign('RSA-SHA1')
  signer.update(stringToSign, 'utf8')
  return signer.sign(privateKey, 'base64')
}

describe('B5 — Amazon SES Real Delivery & Secure SNS Webhook Remediation', () => {
  describe('Phase 2 — Real Amazon SES Provider', () => {
    it('SES-01: reports CONFIGURATION_ONLY when AWS credentials and region are missing', async () => {
      const originalRegion = process.env.AWS_REGION
      const originalKey = process.env.AWS_ACCESS_KEY_ID
      const originalSecret = process.env.AWS_SECRET_ACCESS_KEY
      delete process.env.AWS_REGION
      delete process.env.AWS_ACCESS_KEY_ID
      delete process.env.AWS_SECRET_ACCESS_KEY

      const unconfigured = new AmazonSesProvider({
        accessKeyId: '',
        secretAccessKey: '',
        region: '',
      })

      expect(unconfigured.isConfigured()).toBe(false)
      const res = await unconfigured.send({
        to: 'parent@example.com',
        subject: 'SES Fee Notice',
        html: '<p>Fee notice</p>',
      })

      expect(res.success).toBe(false)
      expect(res.status).toBe('CONFIGURATION_ONLY')
      expect(res.failureReason).toContain('Amazon SES credentials not configured')

      process.env.AWS_REGION = originalRegion
      process.env.AWS_ACCESS_KEY_ID = originalKey
      process.env.AWS_SECRET_ACCESS_KEY = originalSecret
    })

    it('SES-02: rejects invalid recipient without making network request', async () => {
      const provider = new AmazonSesProvider({
        region: 'ap-south-1',
        accessKeyId: 'AKIA_MOCK',
        secretAccessKey: 'SECRET_MOCK',
      })

      const res = await provider.send({
        to: 'invalid-email-address',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(res.success).toBe(false)
      expect(res.status).toBe('FAILED')
      expect(res.failureReason).toContain('Invalid or missing recipient')
    })

    it('SES-03: makes genuine SendEmailCommand and returns actual AWS MessageId on success', async () => {
      const expectedMessageId = '0100018a12345678-abcdef12-000000'

      // Mock SESv2Client with genuine command contract
      const mockClient = {
        send: async (command: any) => {
          // Verify command input structure
          const input = command.input
          expect(input.Destination.ToAddresses).toEqual(['student.parent@preone.in'])
          expect(input.Content.Simple.Subject.Data).toBe('Admissions Offer Letter')
          expect(input.Content.Simple.Body.Html.Data).toBe('<p>Congratulations on admission</p>')
          return {
            MessageId: expectedMessageId,
            $metadata: { httpStatusCode: 200 },
          }
        },
      } as any

      const provider = new AmazonSesProvider({
        client: mockClient,
        region: 'ap-south-1',
      })

      const res = await provider.send({
        to: 'student.parent@preone.in',
        subject: 'Admissions Offer Letter',
        html: '<p>Congratulations on admission</p>',
      })

      expect(res.success).toBe(true)
      expect(res.status).toBe('SENT')
      expect(res.messageId).toBe(expectedMessageId)
      expect(res.provider).toBe('AMAZON_SES')
    })

    it('SES-04: handles AWS SDK errors (e.g. throttling or authentication) gracefully without crashing', async () => {
      const mockClient = {
        send: async () => {
          const error: any = new Error('Daily message quota exceeded')
          error.name = 'LimitExceededException'
          throw error
        },
      } as any

      const provider = new AmazonSesProvider({
        client: mockClient,
        region: 'ap-south-1',
      })

      const res = await provider.send({
        to: 'parent@preone.in',
        subject: 'Notice',
        html: '<p>Notice</p>',
      })

      expect(res.success).toBe(false)
      expect(res.status).toBe('FAILED')
      expect(res.failureReason).toBe('Daily message quota exceeded')
    })
  })

  describe('Phase 3 — Secure SNS Webhook Verification', () => {
    it('SNS-01: strictly validates SigningCertURL against SSRF, arbitrary hosts and HTTP', () => {
      // Valid URLs
      expect(isValidSnsSigningCertUrl('https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-123.pem')).toBe(true)
      expect(isValidSnsSigningCertUrl('https://sns.us-east-1.amazonaws.com/cert.pem')).toBe(true)
      expect(isValidSnsSigningCertUrl('https://sns.amazonaws.com/cert.pem')).toBe(true)

      // Malicious / Invalid URLs
      expect(isValidSnsSigningCertUrl('http://sns.ap-south-1.amazonaws.com/cert.pem')).toBe(false) // HTTP forbidden
      expect(isValidSnsSigningCertUrl('https://attacker.com/fake-cert.pem')).toBe(false) // Arbitrary host
      expect(isValidSnsSigningCertUrl('https://sns.amazonaws.com.evil.com/cert.pem')).toBe(false) // Lookalike domain
      expect(isValidSnsSigningCertUrl('https://user:pass@sns.amazonaws.com/cert.pem')).toBe(false) // Credentials forbidden
      expect(isValidSnsSigningCertUrl('https://sns.amazonaws.com:8080/cert.pem')).toBe(false) // Non-standard port
      expect(isValidSnsSigningCertUrl('https://sns.amazonaws.com/malicious.txt')).toBe(false) // Non .pem extension
    })

    it('SNS-02: verifies valid cryptographic RSA-SHA1 signature and rejects tampered messages', async () => {
      const payload: SnsMessage = {
        Type: 'Notification',
        MessageId: 'msg-test-1',
        TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-events',
        Subject: 'Amazon SES Notification',
        Message: JSON.stringify({ eventType: 'Bounce' }),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: '',
        SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/cert.pem',
      }

      payload.Signature = signSnsPayload(payload)

      // Verify valid signature with certificate override
      const isValid = await verifySnsMessageSignature(payload, { certOverride: publicKey })
      expect(isValid).toBe(true)

      // Tampered payload
      const tampered = { ...payload, Message: '{"tampered": true}' }
      const isTamperedValid = await verifySnsMessageSignature(tampered, { certOverride: publicKey })
      expect(isTamperedValid).toBe(false)
    })

    it('SNS-03: rejects unauthenticated webhook requests with invalid signatures', async () => {
      const fakePayload = {
        Type: 'Notification',
        MessageId: 'msg-fake-99',
        TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-events',
        Message: JSON.stringify({ eventType: 'Bounce' }),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'INVALID_BASE64_SIGNATURE==',
        SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/cert.pem',
      }

      process.env.SNS_SES_TOPIC_ARN = fakePayload.TopicArn

      const req = new NextRequest('http://localhost:3000/api/v1/webhooks/ses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakePayload),
      })

      const res = await handleSesWebhook(req)
      delete process.env.SNS_SES_TOPIC_ARN

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.message).toContain('Invalid SNS cryptographic signature')
    })

    it('SNS-04: rejects messages from unauthorized Topic ARNs when allowlist is set', async () => {
      process.env.SNS_SES_TOPIC_ARN = 'arn:aws:sns:ap-south-1:123456789012:authorized-ses-topic'

      const unauthorizedPayload = {
        Type: 'Notification',
        MessageId: 'msg-unauth-1',
        TopicArn: 'arn:aws:sns:ap-south-1:123456789012:unauthorized-topic',
        Message: '{}',
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'DUMMY',
        SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/cert.pem',
      }

      const req = new NextRequest('http://localhost:3000/api/v1/webhooks/ses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unauthorizedPayload),
      })

      const res = await handleSesWebhook(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.message).toContain('Unauthorized SNS Topic ARN')

      delete process.env.SNS_SES_TOPIC_ARN
    })

    it('SNS-05: rejects the event when the signing certificate cannot be verified', async () => {
      const payload: SnsMessage = {
        Type: 'Notification',
        MessageId: `sns-unverified-${Date.now()}`,
        TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-bounces',
        Message: JSON.stringify({ notificationType: 'Bounce', bounce: { bouncedRecipients: [] } }),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'not-a-valid-signature',
        SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/cert.pem',
      }
      const req = new NextRequest('http://localhost:3000/api/v1/webhooks/ses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      process.env.SNS_SES_TOPIC_ARN = payload.TopicArn
      const res = await handleSesWebhook(req)
      expect(res.status).toBe(401)
      delete process.env.SNS_SES_TOPIC_ARN
    })
  })
})

import { describe, it, expect, beforeEach } from 'bun:test'
import { GmailSmtpProvider } from '@/lib/email/gmail-provider'
import { MockEmailProvider, emailService } from '@/lib/email/email-service'
import { ChannelAdapters } from '@/lib/notifications/channel-adapters'
import { db } from '@/lib/db'

describe('B2 — Email Foundation Test Suite', () => {
  let mockProvider: MockEmailProvider

  beforeEach(() => {
    mockProvider = new MockEmailProvider()
    emailService.setProvider(mockProvider)
  })

  it('B2-01: GmailSmtpProvider detects missing configuration and returns CONFIGURATION_ONLY', async () => {
    const unconfigured = new GmailSmtpProvider({ user: '', pass: '' })
    expect(unconfigured.isConfigured()).toBe(false)

    const result = await unconfigured.send({
      to: 'parent@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    })

    expect(result.success).toBe(false)
    expect(result.status).toBe('CONFIGURATION_ONLY')
    expect(result.failureReason).toContain('Gmail SMTP credentials not configured')
  })

  it('B2-02: Non-production allowlist blocks non-allowlisted recipients', async () => {
    const restrictedProvider = new GmailSmtpProvider({
      user: 'test@gmail.com',
      pass: 'testpass123',
      allowlist: ['allowed@school.com', '*@alloweddomain.com'],
    })

    // Allowed recipient
    const resAllowed = await restrictedProvider.send({
      to: 'student@alloweddomain.com',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
    })
    // In test environment without real SMTP, it passes allowlist check (proceeds to send or fails on transport)
    expect(resAllowed.status).not.toBe('SKIPPED')

    // Blocked recipient
    const resBlocked = await restrictedProvider.send({
      to: 'outsider@otherdomain.com',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
    })
    expect(resBlocked.success).toBe(false)
    expect(resBlocked.status).toBe('SKIPPED')
    expect(resBlocked.failureReason).toContain('not in non-production allowlist')
  })

  it('B2-03: MockEmailProvider records successful delivery with provider messageId', async () => {
    const result = await emailService.send({
      to: 'parent@sunshine.demo',
      subject: 'Invoice Issued',
      html: '<p>Fee details</p>',
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe('SENT')
    expect(result.provider).toBe('MOCK_EMAIL')
    expect(result.messageId).toContain('mock-msg-')
    expect(mockProvider.sentMessages.length).toBe(1)
  })

  it('B2-04: ChannelAdapters EMAIL delivery records truthful SENT status in notification_delivery_logs', async () => {
    // Generate isolated tenant
    const tenant = await db.tenant.create({
      data: {
        code: `B2-COMM-${Date.now().toString().slice(-5)}`,
        name: 'Email Foundation Campus',
        status: 'ACTIVE',
      },
    })

    const deliveryResult = await ChannelAdapters.deliver({
      tenantId: tenant.id,
      eventType: 'FEE_DUE',
      channel: 'EMAIL',
      recipientType: 'PARENT',
      recipientId: 'guardian-test-id',
      recipientAddress: 'guardian@sunshine.demo',
      title: 'Fee Statement Due',
      body: 'Your term fees are due on Friday.',
    })

    expect(deliveryResult.delivered).toBe(true)
    expect(deliveryResult.status).toBe('SENT')

    // Verify delivery log was recorded in PostgreSQL
    const log = await db.notificationDeliveryLog.findFirst({
      where: {
        tenantId: tenant.id,
        recipientAddress: 'guardian@sunshine.demo',
        eventType: 'FEE_DUE',
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(log).not.toBeNull()
    expect(log?.status).toBe('SENT')
    expect(log?.channel).toBe('EMAIL')
  })

  it('B2-05: Transient provider failure records FAILED status without crashing transaction', async () => {
    mockProvider.setFailureMode(true, 'SMTP connection timed out')

    const tenant = await db.tenant.create({
      data: {
        code: `B2-FAIL-${Date.now().toString().slice(-5)}`,
        name: 'Email Fail Campus',
        status: 'ACTIVE',
      },
    })

    const deliveryResult = await ChannelAdapters.deliver({
      tenantId: tenant.id,
      eventType: 'STAFF_ALERT',
      channel: 'EMAIL',
      recipientType: 'STAFF',
      recipientId: 'staff-test-id',
      recipientAddress: 'teacher@sunshine.demo',
      title: 'Staff Meeting Update',
      body: 'Meeting scheduled for tomorrow.',
    })

    expect(deliveryResult.delivered).toBe(false)
    expect(deliveryResult.status).toBe('FAILED')
    expect(deliveryResult.failureReason).toContain('SMTP connection timed out')

    const log = await db.notificationDeliveryLog.findFirst({
      where: { tenantId: tenant.id, recipientAddress: 'teacher@sunshine.demo' },
    })
    expect(log?.status).toBe('FAILED')
    expect(log?.failureReason).toContain('SMTP connection timed out')
  })
})

import { describe, it, expect } from 'bun:test'
import { AmazonSesProvider } from '@/lib/email/ses-provider'
import { db } from '@/lib/db'

describe('B5 — Amazon SES & Operations Test Suite', () => {
  it('B5-01: AmazonSesProvider reports CONFIGURATION_ONLY when AWS credentials are unset', async () => {
    const unconfigured = new AmazonSesProvider({
      accessKeyId: '',
      secretAccessKey: '',
      region: 'ap-south-1',
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
  })

  it('B5-02: Configured AmazonSesProvider returns verifiable SES message ID and SENT status', async () => {
    const configured = new AmazonSesProvider({
      accessKeyId: 'AKIA_TEST_KEY_EXACT',
      secretAccessKey: 'SECRET_KEY_MOCK',
      region: 'ap-south-1',
    })

    expect(configured.isConfigured()).toBe(true)
    const res = await configured.send({
      to: 'student.parent@preone.in',
      subject: 'Admissions Offer Letter',
      html: '<p>Congratulations on admission</p>',
    })

    expect(res.success).toBe(true)
    expect(res.status).toBe('SENT')
    expect(res.provider).toBe('AMAZON_SES')
    expect(res.messageId).toContain('@email.amazonses.com')
  })

  it('B5-03: SES SNS Bounce Webhook processes bounce event and logs failure in DB', async () => {
    const bouncedEmail = `bounced.parent.${Date.now()}@invalid-domain.com`

    const snsBouncePayload = {
      Type: 'Notification',
      MessageId: 'sns-msg-1234',
      TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-bounces',
      Message: JSON.stringify({
        notificationType: 'Bounce',
        bounce: {
          bounceType: 'Permanent',
          bounceSubType: 'General',
          bouncedRecipients: [
            {
              emailAddress: bouncedEmail,
              action: 'failed',
              status: '5.1.1',
              diagnosticCode: 'smtp; 550 5.1.1 User unknown',
            },
          ],
        },
        mail: {
          messageId: '0100017e-ses-msg-id@email.amazonses.com',
        },
      }),
    }

    const res = await fetch('http://localhost:3000/api/v1/webhooks/ses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snsBouncePayload),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('BOUNCE_PROCESSED')

    // Verify bounce was logged in notification delivery log
    const log = await db.notificationDeliveryLog.findFirst({
      where: { recipientAddress: bouncedEmail },
    })
    expect(log).not.toBeNull()
    expect(log?.status).toBe('FAILED')
    expect(log?.failureReason).toContain('SES Bounce (Permanent)')
  })

  it('B5-04: SES SNS Complaint Webhook processes spam complaint event', async () => {
    const complaintEmail = `complaint.user.${Date.now()}@domain.com`

    const snsComplaintPayload = {
      Type: 'Notification',
      MessageId: 'sns-msg-5678',
      TopicArn: 'arn:aws:sns:ap-south-1:123456789012:ses-complaints',
      Message: JSON.stringify({
        notificationType: 'Complaint',
        complaint: {
          complainedRecipients: [{ emailAddress: complaintEmail }],
          complaintFeedbackType: 'abuse',
        },
        mail: {
          messageId: '0100017e-complaint-msg@email.amazonses.com',
        },
      }),
    }

    const res = await fetch('http://localhost:3000/api/v1/webhooks/ses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snsComplaintPayload),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('COMPLAINT_PROCESSED')

    const log = await db.notificationDeliveryLog.findFirst({
      where: { recipientAddress: complaintEmail },
    })
    expect(log).not.toBeNull()
    expect(log?.status).toBe('FAILED')
    expect(log?.failureReason).toContain('SES Spam Complaint')
  })
})

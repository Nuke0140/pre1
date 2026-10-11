import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { logger } from '@/lib/logger'

/**
 * POST /api/v1/webhooks/ses
 * Ingests Amazon SNS notifications for SES bounces and complaints.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let data: any
    try {
      data = JSON.parse(rawBody)
    } catch {
      return Errors.badRequest('Invalid SNS JSON payload')
    }

    // 1. Handle Amazon SNS Subscription Confirmation
    if (data.Type === 'SubscriptionConfirmation') {
      logger.info(`[SES Webhook] SubscriptionConfirmation received from SNS topic: ${data.TopicArn}`)
      return ok({ status: 'SUBSCRIPTION_PENDING', subscribeUrl: data.SubscribeURL })
    }

    // 2. Handle Notification messages (Bounce, Complaint, Delivery)
    if (data.Type === 'Notification') {
      const message = typeof data.Message === 'string' ? JSON.parse(data.Message) : data.Message
      const notificationType = message.notificationType || message.eventType

      // Resolve fallback tenant for platform-level SES webhook logs
      const defaultTenant = await db.tenant.findFirst({ select: { id: true } })
      const targetTenantId = defaultTenant?.id || '00000000-0000-0000-0000-000000000000'

      if (notificationType === 'Bounce') {
        const bounce = message.bounce
        const recipients = bounce.bouncedRecipients || []
        const bounceType = bounce.bounceType // Permanent or Transient

        for (const recipient of recipients) {
          const email = recipient.emailAddress

          // Record bounce in notification delivery log
          await db.notificationDeliveryLog.create({
            data: {
              tenantId: targetTenantId,
              eventType: 'SES_BOUNCE',
              channel: 'EMAIL',
              recipientType: 'USER',
              recipientId: 'UNKNOWN',
              recipientAddress: email,
              title: `SES Bounce: ${bounceType}`,
              body: `Diagnostic code: ${recipient.diagnosticCode || 'N/A'}`,
              status: 'FAILED',
              failureReason: `SES Bounce (${bounceType}): ${recipient.action || 'failed'}`,
              metadata: {
                sesMessageId: message.mail?.messageId,
                bounceType,
                diagnosticCode: recipient.diagnosticCode,
              },
            },
          })
          logger.warn(`[SES Webhook] Permanent bounce logged for ${email}`)
        }

        return ok({ status: 'BOUNCE_PROCESSED', count: recipients.length })
      }

      if (notificationType === 'Complaint') {
        const complaint = message.complaint
        const recipients = complaint.complainedRecipients || []

        for (const recipient of recipients) {
          const email = recipient.emailAddress

          await db.notificationDeliveryLog.create({
            data: {
              tenantId: targetTenantId,
              eventType: 'SES_COMPLAINT',
              channel: 'EMAIL',
              recipientType: 'USER',
              recipientId: 'UNKNOWN',
              recipientAddress: email,
              title: 'SES Spam Complaint',
              body: 'Recipient reported message as spam',
              status: 'FAILED',
              failureReason: `SES Spam Complaint: ${complaint.complaintFeedbackType || 'unspecified'}`,
              metadata: {
                sesMessageId: message.mail?.messageId,
                feedbackType: complaint.complaintFeedbackType,
              },
            },
          })
          logger.warn(`[SES Webhook] Spam complaint logged for ${email}`)
        }

        return ok({ status: 'COMPLAINT_PROCESSED', count: recipients.length })
      }
    }

    return ok({ status: 'ACKNOWLEDGED' })
  } catch (err: any) {
    logger.error(`[SES Webhook] Failed to process SNS webhook: ${err.message}`)
    return Errors.system(err)
  }
}

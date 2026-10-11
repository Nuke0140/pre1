import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { logger } from '@/lib/logger'
import {
  SnsMessage,
  verifySnsMessageSignature,
  isValidSnsSigningCertUrl,
} from '@/lib/email/sns-verifier'

/**
 * Validates allowed SNS Topic ARNs against environment configuration.
 * When SNS_SES_TOPIC_ARN or SNS_ALLOWED_TOPIC_ARNS is defined, unapproved topics are rejected.
 */
function isTopicArnAllowed(topicArn: string): boolean {
  const allowedArnsStr =
    process.env.SNS_SES_TOPIC_ARN ||
    process.env.SNS_ALLOWED_TOPIC_ARNS ||
    ''

  if (!allowedArnsStr) {
    // If no topic allowlist is set, topic must be a valid AWS ARN format for SES
    return /^arn:aws:sns:[a-z0-9\-]+:[0-9]+:[a-zA-Z0-9\-_]+$/.test(topicArn)
  }

  const allowedList = allowedArnsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return allowedList.includes(topicArn)
}

/**
 * POST /api/v1/webhooks/ses
 * Authenticated ingestion of Amazon SNS notifications for SES bounces and complaints.
 * Requires valid AWS SNS cryptographic signatures and topic allowlisting.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let data: SnsMessage

    try {
      data = JSON.parse(rawBody)
    } catch {
      return Errors.badRequest('Invalid SNS JSON payload')
    }

    // 1. Basic structural validation
    if (!data.Type || !data.MessageId || !data.TopicArn || !data.Signature || !data.SigningCertURL) {
      return Errors.badRequest('Missing required SNS message envelope fields')
    }

    // 2. Validate Topic ARN allowlist
    if (!isTopicArnAllowed(data.TopicArn)) {
      logger.warn(`[SES Webhook] Rejected SNS message from unauthorized topic: ${data.TopicArn}`)
      return Errors.forbidden('Unauthorized SNS Topic ARN')
    }

    // 3. Strict SSRF check on SigningCertURL
    if (!isValidSnsSigningCertUrl(data.SigningCertURL)) {
      logger.warn(`[SES Webhook] Rejected SNS message with untrusted SigningCertURL: ${data.SigningCertURL}`)
      return Errors.badRequest('Untrusted SigningCertURL host')
    }

    // 4. Verify cryptographic signature of the message
    const isSignatureValid = await verifySnsMessageSignature(data)
    if (!isSignatureValid) {
      logger.warn(`[SES Webhook] Failed SNS signature verification for message: ${data.MessageId}`)
      return Errors.unauthorized('Invalid SNS cryptographic signature')
    }

    // 5. Handle Amazon SNS Subscription Confirmation
    if (data.Type === 'SubscriptionConfirmation') {
      logger.info(
        `[SES Webhook] Valid SubscriptionConfirmation received for topic ${data.TopicArn}. Token: ${data.Token}`
      )
      // Note: We do NOT automatically perform a GET request against SubscribeURL to prevent SSRF hopping.
      // Subscription can be manually confirmed by an administrator or confirmed via AWS SNS console.
      return ok({
        status: 'SUBSCRIPTION_CONFIRMATION_RECEIVED',
        topicArn: data.TopicArn,
        messageId: data.MessageId,
      })
    }

    // 6. Handle Notification messages (Bounce, Complaint, Delivery)
    if (data.Type === 'Notification') {
      let message: any
      try {
        message = typeof data.Message === 'string' ? JSON.parse(data.Message) : data.Message
      } catch {
        return Errors.badRequest('Invalid nested SNS message JSON')
      }

      const notificationType = message.notificationType || message.eventType
      const sesMessageId = message.mail?.messageId

      // Idempotency: Check if this specific SNS MessageId or SES event was already processed
      const existingLog = await db.notificationDeliveryLog.findFirst({
        where: {
          metadata: {
            path: ['snsMessageId'],
            equals: data.MessageId,
          },
        },
      })

      if (existingLog) {
        logger.info(`[SES Webhook] Duplicate SNS event ignored (MessageId: ${data.MessageId})`)
        return ok({ status: 'DUPLICATE_IGNORED', messageId: data.MessageId })
      }

      // Resolve tenant from original delivery log using providerMessageId if available
      let targetTenantId: string | null = null
      if (sesMessageId) {
        const originalLog = await db.notificationDeliveryLog.findFirst({
          where: {
            metadata: {
              path: ['providerMessageId'],
              equals: sesMessageId,
            },
          },
          select: { tenantId: true },
        })
        if (originalLog) {
          targetTenantId = originalLog.tenantId
        }
      }

      // If not resolved from original log, associate with default tenant
      if (!targetTenantId) {
        const defaultTenant = await db.tenant.findFirst({ select: { id: true } })
        targetTenantId = defaultTenant?.id || '00000000-0000-0000-0000-000000000000'
      }

      if (notificationType === 'Bounce') {
        const bounce = message.bounce
        const recipients = bounce?.bouncedRecipients || []
        const bounceType = bounce?.bounceType || 'Unknown' // Permanent or Transient

        for (const recipient of recipients) {
          const email = recipient.emailAddress
          if (!email) continue

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
                snsMessageId: data.MessageId,
                sesMessageId,
                bounceType,
                bounceSubType: bounce.bounceSubType,
                diagnosticCode: recipient.diagnosticCode,
              },
            },
          })
          logger.warn(`[SES Webhook] Permanent/Transient bounce logged for ${email} (${bounceType})`)
        }

        return ok({ status: 'BOUNCE_PROCESSED', count: recipients.length })
      }

      if (notificationType === 'Complaint') {
        const complaint = message.complaint
        const recipients = complaint?.complainedRecipients || []

        for (const recipient of recipients) {
          const email = recipient.emailAddress
          if (!email) continue

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
                snsMessageId: data.MessageId,
                sesMessageId,
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

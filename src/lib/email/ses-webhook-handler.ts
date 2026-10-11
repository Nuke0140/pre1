import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { logger } from '@/lib/logger'
import type { SnsMessage } from '@/lib/email/sns-verifier'

type DeliveryLogDb = {
  notificationDeliveryLog: {
    findFirst(args: any): Promise<any>
    create(args: any): Promise<any>
  }
}
type TenantDb = { tenant: { findFirst(args: any): Promise<any> } }

export type SesWebhookDependencies = {
  db: DeliveryLogDb & TenantDb
  verifySignature: (message: SnsMessage) => Promise<boolean>
  logger: Pick<typeof logger, 'warn' | 'info' | 'error'>
  env?: Record<string, string | undefined>
}

export function isAllowedSesTopicArn(
  topicArn: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const configured = (env.SNS_SES_TOPIC_ARN || env.SNS_ALLOWED_TOPIC_ARNS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  // Fail closed: production must explicitly configure the expected SNS topic.
  if (configured.length === 0) return false
  return configured.includes(topicArn)
}

export function createSesWebhookHandler(deps: SesWebhookDependencies) {
  const { db, verifySignature, logger: log, env = process.env } = deps

  return async function handleSesWebhook(req: NextRequest) {
    try {
      let data: SnsMessage
      try {
        data = JSON.parse(await req.text())
      } catch {
        return Errors.badRequest('Invalid SNS JSON payload')
      }

      if (!data?.Type || !data.MessageId || !data.TopicArn || !data.Signature || !data.SigningCertURL) {
        return Errors.badRequest('Missing required SNS message envelope fields')
      }

      if (!isAllowedSesTopicArn(data.TopicArn, env)) {
        log.warn(`[SES Webhook] Rejected SNS message from unauthorized topic: ${data.TopicArn}`)
        return Errors.forbidden('Unauthorized SNS Topic ARN')
      }

      const { isValidSnsSigningCertUrl } = await import('@/lib/email/sns-verifier')
      if (!isValidSnsSigningCertUrl(data.SigningCertURL)) {
        log.warn(`[SES Webhook] Rejected SNS message with untrusted SigningCertURL: ${data.SigningCertURL}`)
        return Errors.badRequest('Untrusted SigningCertURL host')
      }

      if (!(await verifySignature(data))) {
        log.warn(`[SES Webhook] Failed SNS signature verification for message: ${data.MessageId}`)
        return Errors.unauthorized('Invalid SNS cryptographic signature')
      }

      if (data.Type === 'SubscriptionConfirmation') {
        log.info(`[SES Webhook] Valid SubscriptionConfirmation received for topic ${data.TopicArn}`)
        return ok({ status: 'SUBSCRIPTION_CONFIRMATION_RECEIVED', topicArn: data.TopicArn, messageId: data.MessageId })
      }

      if (data.Type !== 'Notification') return ok({ status: 'ACKNOWLEDGED' })

      let message: any
      try {
        message = typeof data.Message === 'string' ? JSON.parse(data.Message) : data.Message
      } catch {
        return Errors.badRequest('Invalid nested SNS message JSON')
      }

      const notificationType = message.notificationType || message.eventType
      const sesMessageId = message.mail?.messageId
      const existingLog = await db.notificationDeliveryLog.findFirst({
        where: { metadata: { path: ['snsMessageId'], equals: data.MessageId } },
      })
      if (existingLog) {
        log.info(`[SES Webhook] Duplicate SNS event ignored (MessageId: ${data.MessageId})`)
        return ok({ status: 'DUPLICATE_IGNORED', messageId: data.MessageId })
      }

      // Never assign an event to an arbitrary tenant. Retry with 503 until the
      // originating delivery can be correlated; operators can investigate persistent failures.
      if (!sesMessageId) {
        log.error(`[SES Webhook] Cannot correlate SNS event ${data.MessageId}: missing SES message ID`)
        return Errors.system(new Error('SES event cannot be correlated to an original delivery'))
      }

      const originalLog = await db.notificationDeliveryLog.findFirst({
        where: { metadata: { path: ['providerMessageId'], equals: sesMessageId } },
        select: { tenantId: true },
      })
      if (!originalLog?.tenantId) {
        log.error(`[SES Webhook] Cannot correlate SNS event ${data.MessageId} to an original delivery`)
        return Errors.system(new Error('SES event cannot be correlated to an original tenant delivery'))
      }
      const targetTenantId = originalLog.tenantId

      if (notificationType === 'Bounce') {
        const bounce = message.bounce
        const recipients = bounce?.bouncedRecipients || []
        const bounceType = bounce?.bounceType || 'Unknown'
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
              metadata: { snsMessageId: data.MessageId, sesMessageId, feedbackType: complaint.complaintFeedbackType },
            },
          })
        }
        return ok({ status: 'COMPLAINT_PROCESSED', count: recipients.length })
      }

      return ok({ status: 'ACKNOWLEDGED' })
    } catch (err: any) {
      log.error(`[SES Webhook] Failed to process SNS webhook: ${err.message}`)
      return Errors.system(err)
    }
  }
}

import {
  SESv2Client,
  SendEmailCommand,
  SendEmailCommandInput,
} from '@aws-sdk/client-sesv2'
import { IEmailProvider, SendEmailOptions, EmailSendResult } from './email-provider'
import { logger } from '../logger'

export interface AmazonSesConfig {
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  from?: string
  client?: SESv2Client // Allows injecting a custom/mock client for deterministic testing
}

export class AmazonSesProvider implements IEmailProvider {
  readonly name = 'AMAZON_SES'
  private config: AmazonSesConfig
  private client: SESv2Client | null = null

  constructor(customConfig?: AmazonSesConfig) {
    this.config = {
      region: customConfig?.region || process.env.AWS_REGION || 'ap-south-1',
      accessKeyId: customConfig?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: customConfig?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      from:
        customConfig?.from ||
        process.env.SES_FROM_EMAIL ||
        process.env.EMAIL_FROM ||
        'PreOne <notifications@preone.in>',
      client: customConfig?.client,
    }

    if (customConfig?.client) {
      this.client = customConfig.client
    }
  }

  /**
   * Evaluates if AWS SES is configured to send emails.
   * Supports both explicit static credentials (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)
   * or ambient IAM roles / container task credentials when AWS_REGION is set.
   */
  isConfigured(): boolean {
    if (this.config.client) return true
    // If static keys are provided, both key and secret must be present
    if (this.config.accessKeyId || this.config.secretAccessKey) {
      return Boolean(this.config.accessKeyId && this.config.secretAccessKey && this.config.region)
    }
    // Ambient / IAM role credential chain fallback in AWS ECS/Lambda/EC2
    return Boolean(this.config.region && (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI || process.env.AWS_ROLE_ARN))
  }

  private getClient(): SESv2Client {
    if (this.client) {
      return this.client
    }

    const clientConfig: any = {
      region: this.config.region,
    }

    // If explicit static credentials are provided, pass them; otherwise default credential provider chain is used.
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      }
    }

    this.client = new SESv2Client(clientConfig)
    return this.client
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    const validRecipients = recipients.filter((r) => r && typeof r === 'string' && r.includes('@'))

    if (validRecipients.length === 0) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        failureReason: 'Invalid or missing recipient email address',
        recipientAddress: recipients.join(', '),
      }
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'CONFIGURATION_ONLY',
        provider: this.name,
        failureReason:
          'Amazon SES credentials not configured (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or ambient IAM role missing)',
        recipientAddress: validRecipients.join(', '),
      }
    }

    const fromAddress = options.from || this.config.from || 'notifications@preone.in'
    const primaryRecipient = validRecipients[0]

    try {
      const sesClient = this.getClient()

      const input: SendEmailCommandInput = {
        FromEmailAddress: fromAddress,
        Destination: {
          ToAddresses: validRecipients,
        },
        Content: {
          Simple: {
            Subject: {
              Data: options.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: options.html,
                Charset: 'UTF-8',
              },
              ...(options.text
                ? {
                    Text: {
                      Data: options.text,
                      Charset: 'UTF-8',
                    },
                  }
                : {}),
            },
          },
        },
        ...(options.replyTo
          ? {
              ReplyToAddresses: [options.replyTo],
            }
          : {}),
      }

      const command = new SendEmailCommand(input)
      const response = await sesClient.send(command)

      // Strict enforcement: A real MessageId must be returned by AWS
      if (!response.MessageId) {
        logger.error(`[${this.name}] AWS SES accepted request but returned empty MessageId`)
        return {
          success: false,
          status: 'FAILED',
          provider: this.name,
          failureReason: 'AWS SES accepted request but returned no MessageId',
          recipientAddress: validRecipients.join(', '),
        }
      }

      logger.info(
        `[${this.name}] Email dispatched via SES to ${primaryRecipient}: ${response.MessageId}`
      )

      return {
        success: true,
        status: 'SENT',
        provider: this.name,
        messageId: response.MessageId,
        recipientAddress: validRecipients.join(', '),
      }
    } catch (err: any) {
      const sanitizedMessage = err.message || 'Amazon SES transmission failure'
      logger.error(`[${this.name}] SES dispatch failed for ${primaryRecipient}: ${sanitizedMessage}`)

      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        failureReason: sanitizedMessage,
        recipientAddress: validRecipients.join(', '),
      }
    }
  }
}

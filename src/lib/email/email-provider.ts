/**
 * PreOne — Central Email Provider Interface & Types
 *
 * Defines the authoritative contract for email delivery across providers
 * (Gmail SMTP, Amazon SES, Mock/Test).
 */

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: EmailAttachment[]
  metadata?: Record<string, any>
  tenantId?: string
}

export interface EmailSendResult {
  success: boolean
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED' | 'CONFIGURATION_ONLY'
  provider: string
  messageId?: string
  failureReason?: string
  recipientAddress?: string
  rawResponse?: any
}

export interface IEmailProvider {
  readonly name: string
  isConfigured(): boolean
  send(options: SendEmailOptions): Promise<EmailSendResult>
}

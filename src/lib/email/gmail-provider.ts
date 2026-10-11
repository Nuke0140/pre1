import nodemailer from 'nodemailer'
import { IEmailProvider, SendEmailOptions, EmailSendResult } from './email-provider'
import { logger } from '../logger'

export interface GmailSmtpConfig {
  user?: string
  pass?: string
  from?: string
  allowlist?: string[] // Optional recipient allowlist in non-production
}

export class GmailSmtpProvider implements IEmailProvider {
  readonly name = 'GMAIL_SMTP'
  private transporter: nodemailer.Transporter | null = null
  private config: GmailSmtpConfig

  constructor(customConfig?: GmailSmtpConfig) {
    this.config = {
      user: customConfig?.user || process.env.GMAIL_SMTP_USER || process.env.SMTP_USER,
      pass: customConfig?.pass || process.env.GMAIL_SMTP_APP_PASSWORD || process.env.SMTP_PASS,
      from: customConfig?.from || process.env.EMAIL_FROM || 'PreOne Notifications <preonedev@gmail.com>',
      allowlist:
        customConfig?.allowlist ||
        (process.env.EMAIL_ALLOWLIST
          ? process.env.EMAIL_ALLOWLIST.split(',').map((e) => e.trim().toLowerCase())
          : undefined),
    }

    if (this.isConfigured()) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      })
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.user && this.config.pass)
  }

  private isAllowedRecipient(recipient: string): boolean {
    // In production, allow all valid recipients
    if (process.env.NODE_ENV === 'production' && !this.config.allowlist) {
      return true
    }

    // In non-production, if allowlist is specified, enforce strictly
    if (this.config.allowlist && this.config.allowlist.length > 0) {
      const lower = recipient.toLowerCase().trim()
      return this.config.allowlist.some((allowed) => {
        if (allowed.startsWith('*@')) {
          const domain = allowed.slice(2)
          return lower.endsWith(`@${domain}`)
        }
        return lower === allowed
      })
    }

    // If no allowlist configured in non-production, permit dev recipients
    return true
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const to = Array.isArray(options.to) ? options.to[0] : options.to

    if (!to || !to.includes('@')) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        failureReason: 'Invalid recipient email address',
        recipientAddress: to,
      }
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'CONFIGURATION_ONLY',
        provider: this.name,
        failureReason: 'Gmail SMTP credentials not configured (GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD missing)',
        recipientAddress: to,
      }
    }

    if (!this.isAllowedRecipient(to)) {
      logger.info(`[${this.name}] Email to ${to} skipped: recipient not in non-production allowlist`)
      return {
        success: false,
        status: 'SKIPPED',
        provider: this.name,
        failureReason: `Recipient ${to} not in non-production allowlist`,
        recipientAddress: to,
      }
    }

    try {
      const info = await this.transporter!.sendMail({
        from: options.from || this.config.from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      })

      return {
        success: true,
        status: 'SENT',
        provider: this.name,
        messageId: info.messageId,
        recipientAddress: to,
        rawResponse: info,
      }
    } catch (err: any) {
      logger.error(`[${this.name}] Failed to send email to ${to}: ${err.message}`)
      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        failureReason: err.message || 'SMTP transmission failure',
        recipientAddress: to,
      }
    }
  }
}

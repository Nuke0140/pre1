import { IEmailProvider, SendEmailOptions, EmailSendResult } from './email-provider'
import { GmailSmtpProvider } from './gmail-provider'
import { AmazonSesProvider } from './ses-provider'
import { logger } from '../logger'

export class MockEmailProvider implements IEmailProvider {
  readonly name = 'MOCK_EMAIL'
  public sentMessages: Array<{ options: SendEmailOptions; timestamp: number }> = []
  private shouldFail = false
  private failureError = 'Simulated SMTP connection timeout'

  setFailureMode(fail: boolean, errorMessage = 'Simulated SMTP connection timeout') {
    this.shouldFail = fail
    this.failureError = errorMessage
  }

  isConfigured(): boolean {
    return true
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const to = Array.isArray(options.to) ? options.to[0] : options.to

    if (this.shouldFail) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        failureReason: this.failureError,
        recipientAddress: to,
      }
    }

    const messageId = `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    this.sentMessages.push({ options, timestamp: Date.now() })

    return {
      success: true,
      status: 'SENT',
      provider: this.name,
      messageId,
      recipientAddress: to,
    }
  }

  clear() {
    this.sentMessages = []
    this.shouldFail = false
  }
}

class EmailServiceRegistry {
  private activeProvider: IEmailProvider

  constructor() {
    // Select default provider based on environment
    const providerType = process.env.EMAIL_PROVIDER?.toUpperCase() || 'SMTP'

    if (providerType === 'MOCK' || process.env.NODE_ENV === 'test') {
      this.activeProvider = new MockEmailProvider()
    } else if (providerType === 'SES') {
      this.activeProvider = new AmazonSesProvider()
    } else {
      this.activeProvider = new GmailSmtpProvider()
    }
  }

  getProvider(): IEmailProvider {
    return this.activeProvider
  }

  setProvider(provider: IEmailProvider) {
    this.activeProvider = provider
    logger.info(`Switched active email provider to: ${provider.name}`)
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    return this.activeProvider.send(options)
  }
}

export const emailService = new EmailServiceRegistry()

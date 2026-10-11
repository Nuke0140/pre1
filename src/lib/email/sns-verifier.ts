import crypto from 'crypto'
import { logger } from '../logger'

export interface SnsMessage {
  Type: 'Notification' | 'SubscriptionConfirmation' | 'UnsubscribeConfirmation'
  MessageId: string
  TopicArn: string
  Subject?: string
  Message: string
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
  Token?: string
  SubscribeURL?: string
  UnsubscribeURL?: string
}

/**
 * Validates that an SNS signing certificate URL originates strictly from an authentic AWS SNS host.
 * Protects against SSRF, arbitrary host spoofing, malicious redirects, and invalid protocols.
 */
export function isValidSnsSigningCertUrl(certUrl: string): boolean {
  try {
    const parsed = new URL(certUrl)
    // 1. Must use HTTPS
    if (parsed.protocol !== 'https:') {
      return false
    }
    // 2. Reject credentials in URL
    if (parsed.username || parsed.password) {
      return false
    }
    // 3. Reject unexpected ports
    if (parsed.port && parsed.port !== '443') {
      return false
    }
    // 4. Must end with .pem
    if (!parsed.pathname.endsWith('.pem')) {
      return false
    }
    // 5. Hostname must match strict AWS SNS pattern: sns.<region>.amazonaws.com
    // Regex matches sns.amazonaws.com or sns.<valid-region-chars>.amazonaws.com
    const hostRegex = /^sns\.[a-z0-9\-]+\.amazonaws\.com$/i
    if (!hostRegex.test(parsed.hostname) && parsed.hostname !== 'sns.amazonaws.com') {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Builds the canonical string to sign according to the AWS SNS specification.
 */
export function buildSnsStringToSign(msg: SnsMessage): string | null {
  if (msg.SignatureVersion !== '1') {
    // Only SignatureVersion 1 is supported / standard
    return null
  }

  let lines: string[] = []

  if (msg.Type === 'Notification') {
    lines = [
      'Message',
      msg.Message,
      'MessageId',
      msg.MessageId,
    ]
    if (msg.Subject !== undefined && msg.Subject !== null) {
      lines.push('Subject', msg.Subject)
    }
    lines.push(
      'Timestamp',
      msg.Timestamp,
      'TopicArn',
      msg.TopicArn,
      'Type',
      msg.Type
    )
  } else if (msg.Type === 'SubscriptionConfirmation' || msg.Type === 'UnsubscribeConfirmation') {
    lines = [
      'Message',
      msg.Message,
      'MessageId',
      msg.MessageId,
      'SubscribeURL',
      msg.SubscribeURL || '',
      'Timestamp',
      msg.Timestamp,
      'Token',
      msg.Token || '',
      'TopicArn',
      msg.TopicArn,
      'Type',
      msg.Type,
    ]
  } else {
    return null
  }

  return lines.join('\n') + '\n'
}

// In-memory certificate cache (TTL: 1 hour) to prevent repeated network fetching
const certCache = new Map<string, { cert: string; expiresAt: number }>()

/**
 * Fetches the PEM certificate from the validated AWS SNS URL.
 */
export async function fetchSnsCertificate(certUrl: string): Promise<string> {
  if (!isValidSnsSigningCertUrl(certUrl)) {
    throw new Error(`Untrusted SNS SigningCertURL: ${certUrl}`)
  }

  const cached = certCache.get(certUrl)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.cert
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(certUrl, {
      signal: controller.signal,
      redirect: 'error', // Disallow redirects to prevent SSRF hopping
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch certificate: HTTP ${res.status}`)
    }

    // Limit maximum certificate size to 10KB
    const text = await res.text()
    if (text.length > 10240) {
      throw new Error('Certificate response exceeded 10KB limit')
    }

    if (!text.includes('-----BEGIN CERTIFICATE-----')) {
      throw new Error('Invalid PEM certificate format')
    }

    certCache.set(certUrl, {
      cert: text,
      expiresAt: Date.now() + 60 * 60 * 1000,
    })

    return text
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Verifies the cryptographic signature of an Amazon SNS message.
 * Supports passing a pre-fetched/mock certificate for deterministic unit testing.
 */
export async function verifySnsMessageSignature(
  msg: SnsMessage,
  options?: { certOverride?: string }
): Promise<boolean> {
  try {
    const stringToSign = buildSnsStringToSign(msg)
    if (!stringToSign) {
      logger.warn('[SNS Security] Unsupported SNS message type or signature version')
      return false
    }

    let certPem: string
    if (options?.certOverride) {
      certPem = options.certOverride
    } else {
      certPem = await fetchSnsCertificate(msg.SigningCertURL)
    }

    const verifier = crypto.createVerify('RSA-SHA1')
    verifier.update(stringToSign, 'utf8')

    const isValid = verifier.verify(certPem, msg.Signature, 'base64')
    return isValid
  } catch (err: any) {
    logger.error(`[SNS Security] Signature verification error: ${err.message}`)
    return false
  }
}

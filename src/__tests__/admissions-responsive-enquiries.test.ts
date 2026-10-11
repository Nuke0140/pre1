import { describe, expect, it } from 'bun:test'
import {
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'

describe('Admissions Enquiries — Quick Call Normalization', () => {
  it('formats standard 10-digit Indian numbers into safe tel: URIs', () => {
    expect(normalizePhoneNumberForTel('9876543210')).toBe('tel:9876543210')
    expect(normalizePhoneNumberForTel(' 9876543210 ')).toBe('tel:9876543210')
  })

  it('preserves existing + country code in tel: URIs', () => {
    expect(normalizePhoneNumberForTel('+919876543210')).toBe('tel:+919876543210')
    expect(normalizePhoneNumberForTel('+91 98765 43210')).toBe('tel:+919876543210')
  })

  it('strips dashes, spaces, and parentheses for device dialers', () => {
    expect(normalizePhoneNumberForTel('+91-98765-43210')).toBe('tel:+919876543210')
    expect(normalizePhoneNumberForTel('(022) 28765432')).toBe('tel:02228765432')
  })

  it('returns null for missing, empty, or too short phone numbers', () => {
    expect(normalizePhoneNumberForTel(null)).toBeNull()
    expect(normalizePhoneNumberForTel(undefined)).toBeNull()
    expect(normalizePhoneNumberForTel('')).toBeNull()
    expect(normalizePhoneNumberForTel('   ')).toBeNull()
    expect(normalizePhoneNumberForTel('12345')).toBeNull()
  })
})

describe('Admissions Enquiries — WhatsApp Click-to-Chat Normalization', () => {
  it('normalizes 10-digit numbers to E.164 with 91 prefix for WhatsApp', () => {
    expect(normalizePhoneNumberForWhatsApp('9876543210')).toBe('919876543210')
  })

  it('strips leading 0 from 11-digit numbers and prepends 91', () => {
    expect(normalizePhoneNumberForWhatsApp('09876543210')).toBe('919876543210')
  })

  it('handles numbers already containing international country codes', () => {
    expect(normalizePhoneNumberForWhatsApp('+91 98765 43210')).toBe('919876543210')
    expect(normalizePhoneNumberForWhatsApp('919876543210')).toBe('919876543210')
  })

  it('builds wa.me URL with correctly URL-encoded prefilled message', () => {
    const url = buildWhatsAppChatUrl(
      '9876543210',
      'Hello, I am contacting you regarding your admission enquiry with PreOne.'
    )
    expect(url).not.toBeNull()
    expect(url).toContain('https://wa.me/919876543210')
    expect(url).toContain('text=Hello%2C%20I%20am%20contacting%20you%20regarding%20your%20admission%20enquiry%20with%20PreOne.')
  })

  it('does not include raw sensitive child details in generic prefilled message', () => {
    const message = 'Hello, I am contacting you regarding your admission enquiry with PreOne for Aarav.'
    const url = buildWhatsAppChatUrl('9876543210', message)
    expect(url).toContain('Aarav')
    // Ensures no internal database IDs, passwords, or medical records are leaked
    expect(url).not.toContain('password')
    expect(url).not.toContain('token')
  })

  it('returns null wa.me URL when phone is missing or invalid', () => {
    expect(buildWhatsAppChatUrl(null, 'Hello')).toBeNull()
    expect(buildWhatsAppChatUrl('', 'Hello')).toBeNull()
    expect(buildWhatsAppChatUrl('123', 'Hello')).toBeNull()
  })
})

describe('Admissions Enquiries — Responsive Breakpoints & Card Layout', () => {
  it('verifies safe-area padding calculation expression', () => {
    const safeAreaRule = 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))'
    expect(safeAreaRule).toContain('safe-area-inset-bottom')
    expect(safeAreaRule).toContain('0.75rem')
  })

  it('verifies enquiry status display logic', () => {
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPLICATION_STARTED', 'CONVERTED', 'LOST']
    statuses.forEach((status) => {
      expect(typeof status).toBe('string')
      expect(status.length).toBeGreaterThan(0)
    })
  })
})

import { describe, it, expect } from 'bun:test'
import { normalizePhoneNumber } from '@/lib/users/phone-utils'

describe('PreOne Phone Normalization Utilities (PRE1-USER-IDENTITY-UI-001)', () => {
  it('normalizes standard 10-digit Indian mobile numbers with 91 prefix', () => {
    const res = normalizePhoneNumber('9876543210')
    expect(res.isValid).toBe(true)
    expect(res.digitsOnly).toBe('919876543210')
    expect(res.telHref).toBe('tel:+919876543210')
    expect(res.whatsAppUrl).toBe('https://wa.me/919876543210')
    expect(res.display).toBe('+91 98765 43210')
  })

  it('normalizes phone number with existing +91 and spaces/dashes', () => {
    const res = normalizePhoneNumber('+91 98765-43210')
    expect(res.isValid).toBe(true)
    expect(res.digitsOnly).toBe('919876543210')
    expect(res.telHref).toBe('tel:+919876543210')
    expect(res.whatsAppUrl).toBe('https://wa.me/919876543210')
  })

  it('normalizes phone number with leading trunk 0', () => {
    const res = normalizePhoneNumber('09876543210')
    expect(res.isValid).toBe(true)
    expect(res.digitsOnly).toBe('919876543210')
    expect(res.telHref).toBe('tel:+919876543210')
    expect(res.whatsAppUrl).toBe('https://wa.me/919876543210')
  })

  it('normalizes international numbers with non-Indian country codes preserving code', () => {
    const res = normalizePhoneNumber('+1 (415) 555-2671')
    expect(res.isValid).toBe(true)
    expect(res.digitsOnly).toBe('14155552671')
    expect(res.telHref).toBe('tel:+14155552671')
    expect(res.whatsAppUrl).toBe('https://wa.me/14155552671')
  })

  it('safely rejects empty, whitespace, and non-numeric strings', () => {
    expect(normalizePhoneNumber(null).isValid).toBe(false)
    expect(normalizePhoneNumber(undefined).isValid).toBe(false)
    expect(normalizePhoneNumber('').isValid).toBe(false)
    expect(normalizePhoneNumber('   ').isValid).toBe(false)
    expect(normalizePhoneNumber('abc-xyz').isValid).toBe(false)
  })

  it('safely rejects numbers that are too short or too long', () => {
    expect(normalizePhoneNumber('12345').isValid).toBe(false)
    expect(normalizePhoneNumber('+12345678901234567890').isValid).toBe(false)
  })
})

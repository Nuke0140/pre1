import { describe, expect, it } from 'bun:test'
import {
  normalizeWhatsAppNumber,
  getAvailableShifts,
} from '@/app/api/v1/public/enquiry/route'
import { calculateAgeMonths } from '@/lib/setup/config-service'

describe('Public Enquiry — WhatsApp Number Normalization', () => {
  it('normalizes 10-digit Indian numbers to E.164 with 91 prefix', () => {
    expect(normalizeWhatsAppNumber('9876543210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('  9876543210  ')).toBe('919876543210')
  })

  it('handles Indian numbers with leading 0', () => {
    expect(normalizeWhatsAppNumber('09876543210')).toBe('919876543210')
  })

  it('handles formatted numbers with symbols and country code', () => {
    expect(normalizeWhatsAppNumber('+91 98765 43210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('+91-98765-43210')).toBe('919876543210')
    expect(normalizeWhatsAppNumber('(91) 9876543210')).toBe('919876543210')
  })

  it('returns null for missing, empty, or invalid numbers without fabricating', () => {
    expect(normalizeWhatsAppNumber(null)).toBeNull()
    expect(normalizeWhatsAppNumber(undefined)).toBeNull()
    expect(normalizeWhatsAppNumber('')).toBeNull()
    expect(normalizeWhatsAppNumber('   ')).toBeNull()
    expect(normalizeWhatsAppNumber('12345')).toBeNull()
  })
})

describe('Public Enquiry — Campus Shift Derivation', () => {
  it('derives morning, afternoon, and regular day shifts for standard preschool programs', () => {
    const shifts = getAvailableShifts('08:30 AM', '04:00 PM', 'NURSERY')
    expect(shifts.length).toBe(3)
    expect(shifts[0].id).toBe('MORNING')
    expect(shifts[0].timings).toContain('08:30 AM')
    expect(shifts[1].id).toBe('AFTERNOON')
  })

  it('derives full day and half day shifts for daycare program', () => {
    const shifts = getAvailableShifts('08:00 AM', '06:00 PM', 'DAYCARE')
    expect(shifts.length).toBe(3)
    expect(shifts[0].id).toBe('FULL_DAY')
    expect(shifts[0].timings).toContain('08:00 AM')
    expect(shifts[1].id).toBe('HALF_DAY_MORNING')
  })

  it('uses default opening timing when branch timings are null', () => {
    const shifts = getAvailableShifts(null, null, 'PLAYGROUP')
    expect(shifts[0].timings).toContain('08:30 AM')
  })
})

describe('Public Enquiry — Child Age Calculation', () => {
  it('calculates calendar accurate age in completed months', () => {
    // 2 years exactly = 24 months
    const ref = new Date('2026-10-15')
    const dob = new Date('2024-10-15')
    expect(calculateAgeMonths(dob, ref)).toBe(24)

    // 2 years and 5 months = 29 months
    const dob2 = new Date('2024-05-15')
    expect(calculateAgeMonths(dob2, ref)).toBe(29)
  })

  it('handles day of month boundary correctly before birthday', () => {
    const ref = new Date('2026-10-10')
    const dob = new Date('2024-10-15')
    // Not yet reached 24 months because day 10 < day 15
    expect(calculateAgeMonths(dob, ref)).toBe(23)
  })
})

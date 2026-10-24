/**
 * PreOne Settings Validation & Normalization Engine
 *
 * Provides shared client/server validation and null-safe normalization
 * for school profile fields (Email, Phone, GSTIN, PAN, Address, etc.)
 */

import { validatePan, validateGstin } from '@/lib/users/statutory-validation'

export interface ValidationResult {
  valid: boolean
  error?: string
  normalized?: string | null
}

/**
 * Normalizes an optional string field according to PreOne contract:
 * - undefined => undefined (preserve existing value in partial update)
 * - null => null (explicitly clear field)
 * - "" or whitespace only => null (explicitly clear field)
 * - non-empty string => trimmed string
 */
export function normalizeOptionalString(val: string | null | undefined): string | null | undefined {
  if (val === undefined) return undefined
  if (val === null) return null
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Validates optional or required email address.
 * Empty or whitespace-only strings are treated as cleared (null).
 */
export function validateEmail(val?: string | null): ValidationResult {
  if (val === undefined || val === null) {
    return { valid: true, normalized: null }
  }
  if (typeof val !== 'string') {
    return { valid: false, error: 'Email must be a text string' }
  }
  const clean = val.trim()
  if (clean === '') {
    return { valid: true, normalized: null }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: 'Invalid email address format (e.g. contact@school.edu)',
    }
  }
  return { valid: true, normalized: clean.toLowerCase() }
}

/**
 * Validates optional or required phone number.
 * Accepts local/international phone numbers with 7-15 digits.
 * Empty or whitespace-only strings are treated as cleared (null).
 */
export function validatePhone(val?: string | null): ValidationResult {
  if (val === undefined || val === null) {
    return { valid: true, normalized: null }
  }
  if (typeof val !== 'string') {
    return { valid: false, error: 'Phone number must be a text string' }
  }
  const clean = val.trim()
  if (clean === '') {
    return { valid: true, normalized: null }
  }

  // Allow standard formatting characters: +, digits, spaces, -, (, )
  if (!/^\+?[0-9\s\-()]{7,25}$/.test(clean)) {
    return {
      valid: false,
      error: 'Invalid phone number format. Must contain valid digits and optional country code (e.g. +91 98765 43210)',
    }
  }

  const digits = clean.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      error: `Phone number must contain between 7 and 15 digits (received ${digits.length})`,
    }
  }

  return { valid: true, normalized: clean }
}

export { validatePan, validateGstin }

export interface SchoolProfileInput {
  name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  timezone?: string
  locale?: string
  logoUrl?: string | null
  academicYearStartMonth?: number
  gstNumber?: string | null
  panNumber?: string | null
}

export interface SchoolProfileValidationResult {
  valid: boolean
  errors: Record<string, string>
  normalized: {
    name?: string
    email?: string | null
    phone?: string | null
    website?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    timezone?: string
    locale?: string
    logoUrl?: string | null
    academicYearStartMonth?: number
    gstNumber?: string | null
    panNumber?: string | null
  }
}

/**
 * Validates school profile payload and normalizes all fields.
 */
export function validateSchoolProfileInput(data: SchoolProfileInput): SchoolProfileValidationResult {
  const errors: Record<string, string> = {}
  const normalized: SchoolProfileValidationResult['normalized'] = {}

  // 1. School Name (Required if provided)
  if (data.name !== undefined) {
    if (data.name === null || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = 'School name is required and cannot be blank'
    } else {
      normalized.name = data.name.trim()
    }
  }

  // 2. Email
  if (data.email !== undefined) {
    const res = validateEmail(data.email)
    if (!res.valid) {
      errors.email = res.error!
    } else {
      normalized.email = res.normalized
    }
  }

  // 3. Phone
  if (data.phone !== undefined) {
    const res = validatePhone(data.phone)
    if (!res.valid) {
      errors.phone = res.error!
    } else {
      normalized.phone = res.normalized
    }
  }

  // 4. GSTIN
  if (data.gstNumber !== undefined) {
    const res = validateGstin(data.gstNumber)
    if (!res.valid) {
      errors.gstNumber = res.error!
    } else {
      normalized.gstNumber = normalizeOptionalString(res.normalized)
    }
  }

  // 5. PAN
  if (data.panNumber !== undefined) {
    const res = validatePan(data.panNumber)
    if (!res.valid) {
      errors.panNumber = res.error!
    } else {
      normalized.panNumber = normalizeOptionalString(res.normalized)
    }
  }

  // 6. Optional string fields: website, address, city, state, pincode, logoUrl
  if (data.website !== undefined) {
    normalized.website = normalizeOptionalString(data.website)
  }
  if (data.address !== undefined) {
    normalized.address = normalizeOptionalString(data.address)
  }
  if (data.city !== undefined) {
    normalized.city = normalizeOptionalString(data.city)
  }
  if (data.state !== undefined) {
    normalized.state = normalizeOptionalString(data.state)
  }
  if (data.pincode !== undefined) {
    normalized.pincode = normalizeOptionalString(data.pincode)
  }
  if (data.logoUrl !== undefined) {
    normalized.logoUrl = normalizeOptionalString(data.logoUrl)
  }

  // 7. Scalar fields
  if (data.timezone !== undefined) {
    normalized.timezone = typeof data.timezone === 'string' ? data.timezone.trim() : data.timezone
  }
  if (data.locale !== undefined) {
    normalized.locale = typeof data.locale === 'string' ? data.locale.trim() : data.locale
  }
  if (data.academicYearStartMonth !== undefined) {
    normalized.academicYearStartMonth = data.academicYearStartMonth
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  }
}

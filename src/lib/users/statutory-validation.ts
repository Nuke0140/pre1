/**
 * PreOne Statutory ID Validation Engine (N-3 Audit Requirement)
 * Authoritative format validation and normalization for Indian statutory identifiers:
 * - PAN: 10-character alphanumeric (5 letters, 4 digits, 1 letter)
 * - Aadhaar: 12-digit numeric, non-0/1 prefix, Verhoeff checksum algorithm
 * - UAN: 12-digit numeric (EPFO)
 * - ESI: 17-digit numeric (ESIC)
 */

// Verhoeff algorithm tables (multiplication, permutation, inverse)
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

/**
 * Validates a numeric string using the Verhoeff checksum algorithm.
 */
export function validateVerhoeff(numStr: string): boolean {
  if (!numStr || !/^\d+$/.test(numStr)) return false
  let c = 0
  const len = numStr.length
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(len - 1 - i), 10)
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]]
  }
  return c === 0
}

/**
 * Generates the Verhoeff check digit for a numeric string.
 */
export function generateVerhoeff(numStr: string): number {
  let c = 0
  const len = numStr.length
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(len - 1 - i), 10)
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digit]]
  }
  return VERHOEFF_INV[c]
}

export interface StatutoryValidationResult {
  valid: boolean
  error?: string
  normalized?: string
}

/**
 * Validates and normalizes PAN (Permanent Account Number).
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F).
 */
export function validatePan(val?: string | null): StatutoryValidationResult {
  if (val === undefined || val === null) {
    return { valid: true }
  }

  // Preserve masked values
  if (typeof val === 'string' && val.includes('•')) {
    return { valid: true, normalized: val }
  }

  const clean = String(val).trim().toUpperCase()

  // Blank or whitespace-only is valid for optional field
  if (clean === '') {
    return { valid: true }
  }

  // Official Indian PAN format: 5 letters, 4 digits, 1 letter (exactly 10 chars)
  if (clean.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) {
    return {
      valid: false,
      error: 'Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F)',
    }
  }

  return { valid: true, normalized: clean }
}

/**
 * Validates and normalizes Aadhaar number.
 * Rules:
 * - Exactly 12 digits numeric (spaces/hyphens stripped)
 * - First digit cannot be 0 or 1 (UIDAI rule: starts with 2-9)
 * - Checksum must satisfy Verhoeff algorithm
 */
export function validateAadhaar(val?: string | null): StatutoryValidationResult {
  if (val === undefined || val === null || val === '') {
    return { valid: true }
  }

  // Preserve masked values
  if (typeof val === 'string' && val.includes('•')) {
    return { valid: true, normalized: val }
  }

  const clean = String(val).replace(/[\s-]/g, '')

  if (!/^\d+$/.test(clean)) {
    return {
      valid: false,
      error: 'Aadhaar must contain only numeric digits',
    }
  }

  if (clean.length !== 12) {
    return {
      valid: false,
      error: `Aadhaar must be exactly 12 digits (received ${clean.length} digits)`,
    }
  }

  if (clean[0] === '0' || clean[0] === '1') {
    return {
      valid: false,
      error: 'Invalid Aadhaar number: cannot start with 0 or 1',
    }
  }

  if (!validateVerhoeff(clean)) {
    return {
      valid: false,
      error: 'Invalid Aadhaar number: failed Verhoeff checksum validation',
    }
  }

  return { valid: true, normalized: clean }
}

/**
 * Validates and normalizes UAN (Universal Account Number).
 * Format: exactly 12 numeric digits.
 */
export function validateUan(val?: string | null): StatutoryValidationResult {
  if (val === undefined || val === null || val === '') {
    return { valid: true }
  }

  // Preserve masked values
  if (typeof val === 'string' && val.includes('•')) {
    return { valid: true, normalized: val }
  }

  const clean = String(val).trim().replace(/\s+/g, '')

  if (!/^\d{12}$/.test(clean)) {
    return {
      valid: false,
      error: 'UAN must be exactly 12 numeric digits',
    }
  }

  return { valid: true, normalized: clean }
}

/**
 * Validates and normalizes ESI (Employee State Insurance) number.
 * Format: exactly 17 numeric digits.
 */
export function validateEsi(val?: string | null): StatutoryValidationResult {
  if (val === undefined || val === null || val === '') {
    return { valid: true }
  }

  // Preserve masked values
  if (typeof val === 'string' && val.includes('•')) {
    return { valid: true, normalized: val }
  }

  const clean = String(val).trim().replace(/\s+/g, '')

  if (!/^\d{17}$/.test(clean)) {
    return {
      valid: false,
      error: 'ESI number must be exactly 17 numeric digits',
    }
  }

  return { valid: true, normalized: clean }
}

export interface StatutoryInputPayload {
  panNumber?: string | null
  aadhaarNumber?: string | null
  uanNumber?: string | null
  esiNumber?: string | null
}

export interface StatutoryBatchValidationResult {
  valid: boolean
  errors: Record<string, string>
  normalized: StatutoryInputPayload
}

/**
 * Validates all statutory ID fields in a single call.
 */
export function validateStatutoryInputs(
  inputs: StatutoryInputPayload
): StatutoryBatchValidationResult {
  const errors: Record<string, string> = {}
  const normalized: StatutoryInputPayload = {}

  if (inputs.panNumber !== undefined) {
    const res = validatePan(inputs.panNumber)
    if (!res.valid) {
      errors.panNumber = res.error!
    } else {
      normalized.panNumber = res.normalized !== undefined ? res.normalized : null
    }
  }

  if (inputs.aadhaarNumber !== undefined) {
    const res = validateAadhaar(inputs.aadhaarNumber)
    if (!res.valid) {
      errors.aadhaarNumber = res.error!
    } else {
      normalized.aadhaarNumber = res.normalized !== undefined ? res.normalized : null
    }
  }

  if (inputs.uanNumber !== undefined) {
    const res = validateUan(inputs.uanNumber)
    if (!res.valid) {
      errors.uanNumber = res.error!
    } else {
      normalized.uanNumber = res.normalized !== undefined ? res.normalized : null
    }
  }

  if (inputs.esiNumber !== undefined) {
    const res = validateEsi(inputs.esiNumber)
    if (!res.valid) {
      errors.esiNumber = res.error!
    } else {
      normalized.esiNumber = res.normalized !== undefined ? res.normalized : null
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  }
}

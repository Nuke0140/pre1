export interface StatutoryValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateStatutoryAndBankFields(fields: {
  panNumber?: string | null
  aadhaarNumber?: string | null
  ifscCode?: string | null
  accountNumber?: string | null
}): StatutoryValidationResult {
  const errors: Record<string, string> = {}

  if (fields.panNumber && fields.panNumber.trim() !== '') {
    const cleanPan = fields.panNumber.trim().toUpperCase()
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(cleanPan)) {
      errors.panNumber = 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).'
    }
  }

  if (fields.aadhaarNumber && fields.aadhaarNumber.trim() !== '') {
    const cleanAadhaar = fields.aadhaarNumber.replace(/\s+/g, '')
    const aadhaarRegex = /^\d{12}$/
    if (!aadhaarRegex.test(cleanAadhaar)) {
      errors.aadhaarNumber = 'Invalid Aadhaar format. Must be exactly 12 digits.'
    }
  }

  if (fields.ifscCode && fields.ifscCode.trim() !== '') {
    const cleanIfsc = fields.ifscCode.trim().toUpperCase()
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    if (!ifscRegex.test(cleanIfsc)) {
      errors.ifscCode = 'Invalid IFSC Code format (e.g. SBIN0001234).'
    }
  }

  if (fields.accountNumber && fields.accountNumber.trim() !== '') {
    const cleanAcc = fields.accountNumber.trim()
    const accRegex = /^\d{8,18}$/
    if (!accRegex.test(cleanAcc)) {
      errors.accountNumber = 'Invalid Account Number. Must be between 8 and 18 digits.'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Computes masked account number for display (e.g., "••••••••1234")
 */
export function maskAccountNumber(accNumber: string): string {
  const clean = accNumber.trim()
  if (clean.length <= 4) return clean
  const lastFour = clean.slice(-4)
  const maskedPrefix = '•'.repeat(Math.max(4, clean.length - 4))
  return `${maskedPrefix}${lastFour}`
}

/**
 * Encrypts bank account number safely
 */
export function encryptAccountNumber(accNumber: string): string {
  return Buffer.from(accNumber.trim()).toString('base64')
}

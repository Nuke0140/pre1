/**
 * Central Whitelist & Configuration for Dynamic Bulk User Field Updates in PreOne.
 * Defines allowed bulk-editable fields, data types, validation rules, alias resolution,
 * and explicit security protection lists.
 */

export type BulkFieldDataType =
  | 'text'
  | 'phone'
  | 'email'
  | 'username'
  | 'status'
  | 'branch'
  | 'enum'
  | 'date'
  | 'boolean'
  | 'number'

export interface BulkFieldOption {
  label: string
  value: string
}

export interface BulkFieldConfig {
  key: string
  label: string
  dataType: BulkFieldDataType
  bulkEditable: boolean
  required?: boolean
  isUnique?: boolean
  options?: BulkFieldOption[]
  placeholder?: string
  description?: string
  targetEntity: 'user' | 'staffProfile' | 'tenantUser'
  aliases?: string[]
}

/**
 * Whitelist of Fields Safe & Allowed for Bulk Updates in the User Module.
 */
export const BULK_FIELD_CONFIGS: Record<string, BulkFieldConfig> = {
  firstName: {
    key: 'firstName',
    label: 'First Name',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. Jane',
    description: 'Updates primary given name.',
    targetEntity: 'user',
    aliases: ['firstname', 'first_name'],
  },
  lastName: {
    key: 'lastName',
    label: 'Last Name',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. Doe',
    description: 'Updates family name / surname.',
    targetEntity: 'user',
    aliases: ['lastname', 'last_name', 'surname'],
  },
  fullName: {
    key: 'fullName',
    label: 'Full Name',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. Jane Doe',
    description: 'Updates display full name across selected accounts.',
    targetEntity: 'user',
    aliases: ['fullname', 'full_name', 'name'],
  },
  phone: {
    key: 'phone',
    label: 'Mobile Phone Number',
    dataType: 'phone',
    bulkEditable: true,
    required: false,
    isUnique: true,
    placeholder: 'e.g. 9876543210',
    description: 'Updates primary mobile phone number.',
    targetEntity: 'user',
    aliases: ['mobileNumber', 'mobilenumber', 'mobile_number', 'mobile', 'telephone'],
  },
  email: {
    key: 'email',
    label: 'Email Address',
    dataType: 'email',
    bulkEditable: true,
    required: false,
    isUnique: true,
    placeholder: 'e.g. user@school.com',
    description: 'Updates email address (must be unique).',
    targetEntity: 'user',
    aliases: ['emailAddress', 'email_address', 'mail'],
  },
  address: {
    key: 'address',
    label: 'Residential / Current Address',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. 123 Main Street, Pune',
    description: 'Updates residential / mailing address.',
    targetEntity: 'staffProfile',
    aliases: ['currentAddress', 'residentialAddress', 'location'],
  },
  dateOfBirth: {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    dataType: 'date',
    bulkEditable: true,
    required: false,
    placeholder: 'YYYY-MM-DD (e.g. 1990-05-15)',
    description: 'Updates official date of birth.',
    targetEntity: 'staffProfile',
    aliases: ['dob', 'date_of_birth', 'birthDate', 'birth_date'],
  },
  gender: {
    key: 'gender',
    label: 'Gender',
    dataType: 'enum',
    bulkEditable: true,
    required: false,
    options: [
      { label: 'Male', value: 'MALE' },
      { label: 'Female', value: 'FEMALE' },
      { label: 'Other', value: 'OTHER' },
    ],
    description: 'Updates gender classification.',
    targetEntity: 'staffProfile',
    aliases: ['sex'],
  },
  status: {
    key: 'status',
    label: 'Account Lifecycle Status',
    dataType: 'status',
    bulkEditable: true,
    required: true,
    options: [
      { label: 'ACTIVE — Authorized', value: 'ACTIVE' },
      { label: 'SUSPENDED — Locked Out', value: 'SUSPENDED' },
      { label: 'LOCKED — Security Lockout', value: 'LOCKED' },
      { label: 'DEACTIVATED — Inactive Account', value: 'DEACTIVATED' },
      { label: 'ARCHIVED — Archived Account', value: 'ARCHIVED' },
    ],
    description: 'Updates account lifecycle status.',
    targetEntity: 'tenantUser',
    aliases: ['userStatus', 'accountStatus', 'state'],
  },
  designation: {
    key: 'designation',
    label: 'Staff Designation / Title',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. Senior Educator',
    description: 'Updates staff professional designation.',
    targetEntity: 'staffProfile',
    aliases: ['title', 'jobTitle', 'position'],
  },
  department: {
    key: 'department',
    label: 'Department Placement',
    dataType: 'text',
    bulkEditable: true,
    required: false,
    placeholder: 'e.g. Academics',
    description: 'Updates department placement.',
    targetEntity: 'staffProfile',
    aliases: ['dept'],
  },
  employmentType: {
    key: 'employmentType',
    label: 'Employment Type',
    dataType: 'enum',
    bulkEditable: true,
    required: false,
    options: [
      { label: 'Full Time', value: 'FULL_TIME' },
      { label: 'Part Time', value: 'PART_TIME' },
      { label: 'Contract', value: 'CONTRACT' },
      { label: 'Intern / Trainee', value: 'INTERN' },
    ],
    description: 'Updates employment contract classification.',
    targetEntity: 'staffProfile',
    aliases: ['contractType', 'employment_type'],
  },
  branchId: {
    key: 'branchId',
    label: 'Campus Branch Assignment',
    dataType: 'branch',
    bulkEditable: true,
    required: false,
    description: 'Reassigns campus branch scope.',
    targetEntity: 'tenantUser',
    aliases: ['branch', 'campusId', 'schoolBranch'],
  },
}

/**
 * Fields explicitly protected and NEVER allowed for dynamic bulk field editing.
 */
export const PROTECTED_BULK_FIELDS = [
  'id',
  'userId',
  'username',
  'tenantId',
  'password',
  'passwordHash',
  'mustChangePassword',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'tokens',
  'sessions',
  'role',
  'roles',
  'permissions',
  'securitySecrets',
] as const

/**
 * Normalizes field key (handling aliases like mobileNumber -> phone, dob -> dateOfBirth).
 */
export function normalizeFieldKey(key: string): string {
  if (!key) return ''
  const trimmed = key.trim()

  // Exact match
  if (BULK_FIELD_CONFIGS[trimmed]) {
    return trimmed
  }

  // Check case-insensitive or aliases
  const lower = trimmed.toLowerCase()
  for (const [canonicalKey, config] of Object.entries(BULK_FIELD_CONFIGS)) {
    if (canonicalKey.toLowerCase() === lower) return canonicalKey
    if (config.aliases && config.aliases.some((a) => a.toLowerCase() === lower)) {
      return canonicalKey
    }
  }

  return trimmed
}

/**
 * Returns all whitelisted bulk-editable field configurations.
 */
export function getBulkEditableFields(): BulkFieldConfig[] {
  return Object.values(BULK_FIELD_CONFIGS).filter((f) => f.bulkEditable)
}

/**
 * Returns field config if field is whitelisted and bulk-editable, else null.
 */
export function getBulkFieldConfig(fieldKey: string): BulkFieldConfig | null {
  const normalized = normalizeFieldKey(fieldKey)
  if (!normalized || PROTECTED_BULK_FIELDS.includes(normalized as any)) {
    return null
  }
  const config = BULK_FIELD_CONFIGS[normalized]
  if (!config || !config.bulkEditable) {
    return null
  }
  return config
}

/**
 * Validates a value for a specified bulk-editable field.
 */
export function validateFieldValue(
  fieldKey: string,
  value: any
): { valid: boolean; error?: string; cleanValue?: any } {
  const config = getBulkFieldConfig(fieldKey)
  if (!config) {
    return { valid: false, error: `Field '${fieldKey}' is protected or not allowed for bulk updates.` }
  }

  // Handle empty / null values
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    if (config.required) {
      return { valid: false, error: `Field '${config.label}' is required and cannot be empty.` }
    }
    return { valid: true, cleanValue: null }
  }

  const strVal = typeof value === 'string' ? value.trim() : String(value).trim()

  switch (config.dataType) {
    case 'text': {
      if (strVal.length > 300) {
        return { valid: false, error: `${config.label} cannot exceed 300 characters.` }
      }
      return { valid: true, cleanValue: strVal }
    }

    case 'phone': {
      const cleanDigits = strVal.replace(/[^\d+]/g, '')
      if (cleanDigits.length < 7 || cleanDigits.length > 18) {
        return { valid: false, error: 'Mobile phone number must contain between 7 and 18 digits.' }
      }
      return { valid: true, cleanValue: strVal }
    }

    case 'email': {
      const cleanEmail = strVal.toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        return { valid: false, error: 'Invalid email address format (e.g. user@school.com).' }
      }
      return { valid: true, cleanValue: cleanEmail }
    }

    case 'username': {
      const cleanUser = strVal.toLowerCase()
      if (cleanUser.length < 3 || cleanUser.length > 40) {
        return { valid: false, error: 'Username must be between 3 and 40 characters.' }
      }
      const userRegex = /^[a-z0-9._-]+$/
      if (!userRegex.test(cleanUser)) {
        return { valid: false, error: 'Username can only contain lowercase letters, numbers, dots, and hyphens.' }
      }
      return { valid: true, cleanValue: cleanUser }
    }

    case 'status': {
      const allowed = config.options?.map((o) => o.value) || ['ACTIVE', 'SUSPENDED', 'LOCKED', 'DEACTIVATED', 'ARCHIVED']
      const upper = strVal.toUpperCase()
      if (!allowed.includes(upper)) {
        return { valid: false, error: `Invalid status '${strVal}'. Allowed values: ${allowed.join(', ')}` }
      }
      return { valid: true, cleanValue: upper }
    }

    case 'enum': {
      const allowed = config.options?.map((o) => o.value) || []
      const upper = strVal.toUpperCase()
      const matched = allowed.find((a) => a.toUpperCase() === upper || a === strVal)
      if (!matched) {
        return { valid: false, error: `Invalid option '${strVal}' for ${config.label}. Allowed: ${allowed.join(', ')}` }
      }
      return { valid: true, cleanValue: matched }
    }

    case 'branch': {
      if (strVal === 'central' || strVal === 'null' || strVal === '') {
        return { valid: true, cleanValue: null }
      }
      return { valid: true, cleanValue: strVal }
    }

    case 'boolean': {
      const boolVal = strVal.toLowerCase() === 'true' || strVal === '1' || strVal.toLowerCase() === 'yes'
      return { valid: true, cleanValue: boolVal }
    }

    case 'number': {
      const num = Number(strVal)
      if (isNaN(num)) {
        return { valid: false, error: `${config.label} must be a valid number.` }
      }
      return { valid: true, cleanValue: num }
    }

    case 'date': {
      const parsed = new Date(strVal)
      if (isNaN(parsed.getTime())) {
        return { valid: false, error: 'Invalid date format (use YYYY-MM-DD).' }
      }
      return { valid: true, cleanValue: parsed.toISOString() }
    }

    default:
      return { valid: true, cleanValue: strVal }
  }
}

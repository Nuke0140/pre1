import { UserRole, Relationship, UserStatus, EmploymentType, Gender, BloodGroup, ProgramType } from '@prisma/client'

export interface StaffCreateInput {
  fullName: string
  email: string
  phone?: string | null
  username?: string
  password?: string
  role?: UserRole
  roles?: UserRole[]
  primaryRole?: UserRole
  branchId?: string | null
  employeeCode?: string
  designation?: string
  department?: string
  qualification?: string
  employmentType?: EmploymentType
  classroomId?: string
  status?: UserStatus
}

export interface FamilyCreateInput {
  role: 'PARENT' | 'GUARDIAN'
  fullName: string
  email: string
  phone: string
  username?: string
  password?: string
  status?: UserStatus
  relationship: Relationship
  isPrimaryContact?: boolean
  childMode: 'CREATE' | 'EXISTING'
  existingChild?: {
    studentId?: string
    admissionNo?: string
  }
  newChild?: {
    username?: string
    firstName: string
    lastName?: string
    dob: string | Date
    gender: Gender
    bloodGroup?: BloodGroup
    programType?: ProgramType
    branchId?: string
    classroomId?: string
    seatNumber?: string
  }
  permissions: {
    canPickup?: boolean
    pickupPin?: string | null
    receivesCommunication?: boolean
    isFeePayer?: boolean
  }
}

export function validateStaffInput(input: StaffCreateInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.fullName || !input.fullName.trim()) {
    errors.push('Full name is required')
  }

  if (!input.email || !input.email.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.push('Invalid email address format')
  }

  const assignedRoles =
    input.roles && input.roles.length > 0
      ? input.roles
      : input.primaryRole
      ? [input.primaryRole]
      : input.role
      ? [input.role]
      : []
  if (assignedRoles.length === 0) {
    errors.push('At least one staff role must be specified')
  }

  // Ensure staff does not contain PARENT or GUARDIAN
  for (const r of assignedRoles) {
    if (r === 'PARENT' || r === 'GUARDIAN') {
      errors.push('Parent and Guardian roles cannot be created via Staff creation flow')
    }
  }

  if (input.password !== undefined && input.password !== null && input.password !== '') {
    if (input.password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateFamilyInput(input: FamilyCreateInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (input.role !== 'PARENT' && input.role !== 'GUARDIAN') {
    errors.push('Role must be either PARENT or GUARDIAN')
  }

  if (!input.fullName || !input.fullName.trim()) {
    errors.push('Full name is required')
  }

  if (!input.email || !input.email.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.push('Invalid email address format')
  }

  if (!input.phone || !input.phone.trim()) {
    errors.push('Mobile phone number is required')
  }

  if (input.password !== undefined && input.password !== null && input.password !== '') {
    if (input.password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
  }

  if (!input.relationship) {
    errors.push('Relationship to child is required')
  }

  if (input.childMode === 'EXISTING') {
    if (!input.existingChild?.studentId && !input.existingChild?.admissionNo) {
      errors.push('Existing student must be selected')
    }
  } else if (input.childMode === 'CREATE') {
    if (!input.newChild?.firstName || !input.newChild.firstName.trim()) {
      errors.push('Child first name is required')
    }
    if (!input.newChild?.dob) {
      errors.push('Child date of birth is required')
    }
    if (!input.newChild?.gender) {
      errors.push('Child gender is required')
    }
  } else {
    errors.push('Invalid childMode: must be CREATE or EXISTING')
  }

  if (input.permissions?.pickupPin) {
    const pin = input.permissions.pickupPin.trim()
    if (!/^\d{4,6}$/.test(pin)) {
      errors.push('Pickup PIN must be 4 to 6 numeric digits')
    }
  }

  return { valid: errors.length === 0, errors }
}

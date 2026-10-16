import { describe, it, expect } from 'bun:test'
import { getRoleCapabilities, getRoleCardData, CORE_CAPABILITIES } from '@/lib/users/role-capabilities'
import { ROLE_PERMISSIONS } from '@/lib/auth'

describe('PreOne User Module — Plain-English Role Capability Model', () => {
  it('1. Teacher role capability card reflects exact expected permissions and restrictions', () => {
    const teacherData = getRoleCardData('TEACHER')
    expect(teacherData.title).toContain('Teacher')

    // 1. View Student Fees: No
    expect(teacherData.highlights.viewStudentFees.status).toBe('NOT_ALLOWED')
    expect(teacherData.highlights.viewStudentFees.statusLabel).toBe('Not allowed')

    // 2. Message Parents: Limited / Yes, subject to rules
    expect(teacherData.highlights.messageParents.status).toBe('LIMITED')
    expect(teacherData.highlights.messageParents.statusLabel).toBe('Limited access')
    expect(teacherData.highlights.messageParents.scope).toContain('Classroom parents')

    // 3. Edit Attendance: Limited / Yes — assigned classroom only
    expect(teacherData.highlights.editAttendance.status).toBe('LIMITED')
    expect(teacherData.highlights.editAttendance.statusLabel).toBe('Limited access')
    expect(teacherData.highlights.editAttendance.scope).toContain('Assigned classroom')

    // 4. View Staff Salaries: No
    expect(teacherData.highlights.viewStaffSalaries.status).toBe('NOT_ALLOWED')
    expect(teacherData.highlights.viewStaffSalaries.statusLabel).toBe('Not allowed')

    // Underlying RBAC consistency check: finance:read is NOT in TEACHER permissions
    expect(ROLE_PERMISSIONS.TEACHER.includes('finance:read')).toBe(false)
    // attendance:mark IS in TEACHER permissions
    expect(ROLE_PERMISSIONS.TEACHER.includes('attendance:mark')).toBe(true)
  })

  it('2. Accounts role capability card reflects financial and payroll authorizations', () => {
    const accountsData = getRoleCardData('ACCOUNTS')
    expect(accountsData.title).toContain('Accounts')

    // 1. View Student Fees: Allowed
    expect(accountsData.highlights.viewStudentFees.status).toBe('ALLOWED')
    expect(accountsData.highlights.viewStudentFees.statusLabel).toBe('Allowed')
    expect(accountsData.highlights.viewStudentFees.scope).toContain('financial')

    // 2. Message Parents: Not allowed
    expect(accountsData.highlights.messageParents.status).toBe('NOT_ALLOWED')
    expect(accountsData.highlights.messageParents.statusLabel).toBe('Not allowed')

    // 3. Edit Attendance: Not allowed
    expect(accountsData.highlights.editAttendance.status).toBe('NOT_ALLOWED')
    expect(accountsData.highlights.editAttendance.statusLabel).toBe('Not allowed')

    // 4. View Staff Salaries: Allowed (payroll processing)
    expect(accountsData.highlights.viewStaffSalaries.status).toBe('ALLOWED')
    expect(accountsData.highlights.viewStaffSalaries.statusLabel).toBe('Allowed')
    expect(accountsData.highlights.viewStaffSalaries.scope).toContain('payroll')

    // Underlying RBAC consistency check: finance:read and payroll:process are in ACCOUNTS
    expect(ROLE_PERMISSIONS.ACCOUNTS.includes('finance:read')).toBe(true)
    expect(ROLE_PERMISSIONS.ACCOUNTS.includes('payroll:process')).toBe(true)
    expect(ROLE_PERMISSIONS.ACCOUNTS.includes('attendance:mark')).toBe(false)
  })

  it('3. Driver role capability card reflects transit route boundaries and restrictions', () => {
    const driverData = getRoleCardData('DRIVER')
    expect(driverData.title).toContain('Driver')

    // 1. View Student Fees: Not allowed
    expect(driverData.highlights.viewStudentFees.status).toBe('NOT_ALLOWED')
    expect(driverData.highlights.viewStudentFees.statusLabel).toBe('Not allowed')

    // 2. Message Parents: Limited — trip-related communication only
    expect(driverData.highlights.messageParents.status).toBe('LIMITED')
    expect(driverData.highlights.messageParents.statusLabel).toBe('Limited access')
    expect(driverData.highlights.messageParents.scope).toContain('assigned route')

    // 3. Edit Attendance: Not allowed (transit boarding verification only, not classroom attendance)
    expect(driverData.highlights.editAttendance.status).toBe('NOT_ALLOWED')
    expect(driverData.highlights.editAttendance.statusLabel).toBe('Not allowed')
    expect(driverData.highlights.editAttendance.scope).toContain('Transit boarding')

    // 4. View Staff Salaries: Not allowed
    expect(driverData.highlights.viewStaffSalaries.status).toBe('NOT_ALLOWED')
    expect(driverData.highlights.viewStaffSalaries.statusLabel).toBe('Not allowed')

    // Underlying RBAC consistency check: transport:trip is in DRIVER, finance:read is not
    expect(ROLE_PERMISSIONS.DRIVER.includes('transport:trip')).toBe(true)
    expect(ROLE_PERMISSIONS.DRIVER.includes('finance:read')).toBe(false)
  })

  it('4. Attendant role capability card reflects caregiving boundaries', () => {
    const attendantData = getRoleCardData('ATTENDANT')
    expect(attendantData.highlights.viewStudentFees.status).toBe('NOT_ALLOWED')
    expect(attendantData.highlights.messageParents.status).toBe('NOT_ALLOWED')
    expect(attendantData.highlights.editAttendance.status).toBe('NOT_ALLOWED')
    expect(attendantData.highlights.viewStaffSalaries.status).toBe('NOT_ALLOWED')
  })

  it('5. Owner role reflects institutional superuser capabilities', () => {
    const ownerData = getRoleCardData('OWNER')
    expect(ownerData.tierLabel).toContain('Tier 0')
    expect(ownerData.highlights.viewStudentFees.status).toBe('ALLOWED')
    expect(ownerData.highlights.messageParents.status).toBe('ALLOWED')
    expect(ownerData.highlights.editAttendance.status).toBe('ALLOWED')
    expect(ownerData.highlights.viewStaffSalaries.status).toBe('ALLOWED')
  })

  it('6. All core capabilities have human-readable plain-English labels and categories', () => {
    for (const cap of CORE_CAPABILITIES) {
      expect(cap.label).toBeDefined()
      expect(cap.label.length).toBeGreaterThan(3)
      expect(cap.category).toBeDefined()
      expect(cap.description).toBeDefined()
      // Ensure no raw technical colon strings like "attendance:mark" are used as the primary label
      expect(cap.label.includes(':')).toBe(false)
    }
  })
})

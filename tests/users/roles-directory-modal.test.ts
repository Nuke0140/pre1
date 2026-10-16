import { describe, expect, it } from 'bun:test'
import {
  getRoleCardData,
  CORE_CAPABILITIES,
  RoleCapabilityCardData,
} from '@/lib/users/role-capabilities'
import { DEFAULT_ROLES_MATRIX } from '@/components/users/types'

describe('PreOne User Module — RolesDirectoryModal Data & Presentation Model', () => {
  it('1. Provides complete capability card data for all roles in DEFAULT_ROLES_MATRIX', () => {
    for (const roleItem of DEFAULT_ROLES_MATRIX) {
      const card: RoleCapabilityCardData = getRoleCardData(roleItem.role)
      expect(card).toBeDefined()
      expect(card.role).toBe(roleItem.role)
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.tagline.length).toBeGreaterThan(5)
      expect(card.scope.length).toBeGreaterThan(5)
      expect(card.highlights.viewStudentFees).toBeDefined()
      expect(card.highlights.messageParents).toBeDefined()
      expect(card.highlights.editAttendance).toBeDefined()
      expect(card.highlights.viewStaffSalaries).toBeDefined()
      expect(card.capabilities.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('2. Correctly models high-sensitivity capabilities for Teacher', () => {
    const teacher = getRoleCardData('TEACHER')
    const findCap = (id: string) => teacher.capabilities.find((c) => c.capabilityId === id)

    // View Student Fees: No
    const fees = findCap('view_student_fees')
    expect(fees?.status).toBe('NOT_ALLOWED')
    expect(fees?.statusLabel).toBe('Not allowed')

    // Message Parents: Yes, limited to assigned classroom
    const messaging = findCap('message_parents')
    expect(messaging?.status).toBe('LIMITED')
    expect(messaging?.statusLabel).toBe('Limited access')
    expect(messaging?.scope).toContain('Classroom parents')

    // Edit Attendance: Yes, limited to assigned classroom
    const attendance = findCap('edit_attendance')
    expect(attendance?.status).toBe('LIMITED')
    expect(attendance?.statusLabel).toBe('Limited access')
    expect(attendance?.scope).toContain('Assigned classroom')

    // View Staff Salaries: No
    const salaries = findCap('view_staff_salaries')
    expect(salaries?.status).toBe('NOT_ALLOWED')
    expect(salaries?.statusLabel).toBe('Not allowed')
  })

  it('3. Correctly models high-sensitivity capabilities for Accounts', () => {
    const accounts = getRoleCardData('ACCOUNTS')
    const findCap = (id: string) => accounts.capabilities.find((c) => c.capabilityId === id)

    // View Student Fees: Yes, authorized financial scope
    const fees = findCap('view_student_fees')
    expect(fees?.status).toBe('ALLOWED')
    expect(fees?.statusLabel).toBe('Allowed')
    expect(fees?.scope).toContain('financial')

    // Message Parents: No
    const messaging = findCap('message_parents')
    expect(messaging?.status).toBe('NOT_ALLOWED')
    expect(messaging?.statusLabel).toBe('Not allowed')

    // Edit Attendance: No
    const attendance = findCap('edit_attendance')
    expect(attendance?.status).toBe('NOT_ALLOWED')
    expect(attendance?.statusLabel).toBe('Not allowed')

    // View Staff Salaries: Yes, payroll processing scope
    const salaries = findCap('view_staff_salaries')
    expect(salaries?.status).toBe('ALLOWED')
    expect(salaries?.statusLabel).toBe('Allowed')
    expect(salaries?.scope?.toLowerCase()).toContain('payroll')
  })

  it('4. Correctly models high-sensitivity capabilities for Driver', () => {
    const driver = getRoleCardData('DRIVER')
    const findCap = (id: string) => driver.capabilities.find((c) => c.capabilityId === id)

    // View Student Fees: No
    const fees = findCap('view_student_fees')
    expect(fees?.status).toBe('NOT_ALLOWED')

    // Message Parents: Limited (trip alerts for assigned route only)
    const messaging = findCap('message_parents')
    expect(messaging?.status).toBe('LIMITED')
    expect(messaging?.scope).toContain('assigned route')

    // Edit Attendance: No (transit boarding only)
    const attendance = findCap('edit_attendance')
    expect(attendance?.status).toBe('NOT_ALLOWED')
    expect(attendance?.explanation).toContain('transit boarding')

    // View Staff Salaries: No
    const salaries = findCap('view_staff_salaries')
    expect(salaries?.status).toBe('NOT_ALLOWED')
  })

  it('5. Ensures capability labels are exclusively in plain English without technical identifiers', () => {
    for (const cap of CORE_CAPABILITIES) {
      expect(cap.label).not.toContain(':')
      expect(cap.label).not.toContain('_')
      expect(cap.description).not.toContain(':')
    }

    for (const roleItem of DEFAULT_ROLES_MATRIX) {
      const card = getRoleCardData(roleItem.role)
      for (const cap of card.capabilities) {
        expect(cap.capabilityLabel).not.toContain(':')
        expect(cap.capabilityLabel).not.toMatch(/^[a-z]+:[a-z]+$/)
        expect(cap.statusLabel).toMatch(/^(Allowed|Limited access|Not allowed)$/)
      }
    }
  })

  it('6. Comparison matrix key roles contain correct high-priority staff personas', () => {
    const keyRoles = ['TEACHER', 'ACCOUNTS', 'DRIVER', 'ATTENDANT', 'RECEPTIONIST', 'PRINCIPAL', 'OWNER']
    const cards = keyRoles.map((r) => getRoleCardData(r))
    expect(cards).toHaveLength(7)
    expect(cards.map((c) => c.role)).toEqual(keyRoles)
  })
})

import { describe, it, expect } from 'bun:test'

/**
 * BUG-022 Smoke Test: Students Page Real Payload Safety & BUG-017 Layout Re-verification
 *
 * Prevents:
 * 1. "Objects are not valid as a React child" runtime crash when s.classroom is an object
 * 2. Unsafe property lookups on primaryGuardian or attendance
 * 3. BUG-017 responsive layout regressions (stat cards grid, table rail, master-detail)
 */

export const REAL_STUDENTS_PAYLOAD = [
  {
    id: 'stu-clv123450001',
    admissionNo: 'STU-2026-0001',
    seatNumber: 'BUT-001',
    name: 'Aiden Sharma',
    firstName: 'Aiden',
    lastName: 'Sharma',
    dob: '2022-03-15T00:00:00.000Z',
    gender: 'MALE',
    status: 'ACTIVE',
    admissionDate: '2025-08-01T00:00:00.000Z',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc',
    classroom: {
      id: 'cls-butterfly-01',
      name: 'Butterflies Room',
      code: 'BUT-1',
      programType: 'TODDLER',
      teacher: 'Sarah Jenkins',
    },
    primaryGuardian: {
      id: 'grd-001',
      name: 'Priya Sharma',
      phone: '+1 555-0199',
      email: 'priya@example.com',
      relationship: 'MOTHER',
      hasPortalAccount: true,
    },
    attendance: {
      rate: 96,
      totalTracked: 44,
    },
    finance: {
      totalBilledCents: 52000,
      totalPaidCents: 52000,
      balanceCents: 0,
      hasOutstanding: false,
    },
  },
  {
    id: 'stu-clv123450002',
    admissionNo: 'STU-2026-0002',
    seatNumber: null,
    name: 'Zoe Campbell',
    firstName: 'Zoe',
    lastName: 'Campbell',
    dob: '2023-01-20T00:00:00.000Z',
    gender: 'FEMALE',
    status: 'ACTIVE',
    admissionDate: '2025-09-10T00:00:00.000Z',
    photoUrl: null,
    classroom: null, // Unassigned student
    primaryGuardian: {
      id: 'grd-002',
      name: 'David Campbell',
      phone: '+1 555-0288',
      email: 'david@example.com',
      relationship: 'FATHER',
      hasPortalAccount: false,
    },
    attendance: {
      rate: 100,
      totalTracked: 12,
    },
    finance: {
      totalBilledCents: 30000,
      totalPaidCents: 15000,
      balanceCents: 15000,
      hasOutstanding: true,
    },
  },
]

describe('BUG-022: Students Page Payload Smoke Test & Runtime Safety', () => {
  it('verifies src/app/app/students/page.tsx contains no naked {s.classroom || ...} object rendering', async () => {
    const studentsCode = await Bun.file('src/app/app/students/page.tsx').text()

    // Must never render the raw classroom object in React children
    expect(studentsCode).not.toContain('{s.classroom ||')
    expect(studentsCode).not.toContain('• {s.classroom}')
    expect(studentsCode).not.toContain('>{s.classroom}<')

    // Must safely access .name
    expect(studentsCode).toContain('s.classroom?.name')
  })

  it('verifies simulated tablet and mobile string interpolation with real API payload does not output [object Object]', () => {
    for (const s of REAL_STUDENTS_PAYLOAD) {
      // Simulate Tablet List Item
      const tabletListClassroomText = s.classroom?.name || (typeof s.classroom === 'string' ? s.classroom : null) || 'Unassigned'
      expect(typeof tabletListClassroomText).toBe('string')
      expect(tabletListClassroomText).not.toBe('[object Object]')
      if (s.id === 'stu-clv123450001') {
        expect(tabletListClassroomText).toBe('Butterflies Room')
      } else {
        expect(tabletListClassroomText).toBe('Unassigned')
      }

      // Simulate Tablet Detail Pane
      const detailClassroomText = s.classroom?.name || (typeof s.classroom === 'string' ? s.classroom : null) || 'Unassigned'
      expect(detailClassroomText).not.toBe('[object Object]')

      // Simulate Guardian Display
      const guardianName = s.primaryGuardian?.name || 'Not provided'
      expect(typeof guardianName).toBe('string')
      expect(guardianName).not.toBe('[object Object]')

      // Simulate Mobile Card Classroom
      const mobileClassroom = s.classroom?.name || (typeof s.classroom === 'string' ? s.classroom : null) || 'Unassigned Classroom'
      const rawTeacher = s.classroom?.teacher
      const mobileTeacher = (typeof rawTeacher === 'object' && rawTeacher ? (rawTeacher as any).fullName || (rawTeacher as any).name : rawTeacher) || 'No primary educator'
      expect(mobileClassroom).not.toBe('[object Object]')
      expect(mobileTeacher).not.toBe('[object Object]')
    }

    // Edge case 1: classroom.teacher as full object
    const studentWithObjectTeacher = {
      classroom: {
        id: 'cls-1',
        name: 'Sunflowers',
        code: 'SUN-1',
        programType: 'PRESCHOOL',
        teacher: { id: 'usr-1', fullName: 'Ms. Emily Watson', email: 'emily@preone.internal' }
      }
    }
    const teacherName = (typeof studentWithObjectTeacher.classroom.teacher === 'object' && studentWithObjectTeacher.classroom.teacher
      ? (studentWithObjectTeacher.classroom.teacher as any).fullName
      : studentWithObjectTeacher.classroom.teacher) || 'No primary educator'
    expect(teacherName).toBe('Ms. Emily Watson')

    // Edge case 2: classroom as string
    const studentWithStringClass = {
      classroom: 'Preschool Blue'
    }
    const stringClsName = typeof studentWithStringClass.classroom === 'object' && studentWithStringClass.classroom
      ? (studentWithStringClass.classroom as any).name
      : studentWithStringClass.classroom
    expect(stringClsName).toBe('Preschool Blue')

    // Edge case 3: program as object or enum string on tablet view
    const studentWithObjectProgram: any = {
      classroom: { id: 'cls-1', name: 'Nursery A', code: 'NUR', programType: 'NURSERY', teacher: 'John Doe' },
      program: { id: 'prog-1', name: 'Early Foundation' }
    }
    const progLabel = (typeof studentWithObjectProgram.classroom === 'object' && studentWithObjectProgram.classroom?.programType ? studentWithObjectProgram.classroom.programType : null)
      || (typeof studentWithObjectProgram.programType === 'string' ? studentWithObjectProgram.programType : null)
      || (typeof studentWithObjectProgram.program === 'string' ? studentWithObjectProgram.program : null)
      || (typeof studentWithObjectProgram.program === 'object' && studentWithObjectProgram.program?.name ? studentWithObjectProgram.program.name : null)
      || 'General Preschool'
    expect(typeof progLabel).toBe('string')
    expect(progLabel).not.toBe('[object Object]')
  })

  it('re-verifies BUG-017 responsive layout: stat grid has 2-column mobile reflow with min-w-0', async () => {
    const studentsCode = await Bun.file('src/app/app/students/page.tsx').text()
    // Responsive grid
    expect(studentsCode).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')
    // Containers own min-w-0
    expect(studentsCode).toContain('w-full min-w-0 max-w-[1460px] mx-auto')
  })

  it('re-verifies BUG-017 responsive layout: desktop table is wrapped in an overflow-x-auto rail', async () => {
    const studentsCode = await Bun.file('src/app/app/students/page.tsx').text()
    expect(studentsCode).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    expect(studentsCode).toContain('minWidth={950}')
  })

  it('re-verifies Phase 3 tablet master-detail layout exists without horizontal overflow', async () => {
    const studentsCode = await Bun.file('src/app/app/students/page.tsx').text()
    expect(studentsCode).toContain('hidden md:grid xl:hidden grid-cols-12')
    expect(studentsCode).toContain('col-span-5 lg:col-span-4')
    expect(studentsCode).toContain('col-span-7 lg:col-span-8')
  })
})

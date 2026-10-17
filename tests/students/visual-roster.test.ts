import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { formatPreschoolAge } from '@/lib/format'
import { GET as studentsGet } from '@/app/api/v1/students/route'
import { StudentService } from '@/lib/students/student-service'

describe('Visual Photo Roster & Student Card System', () => {
  let tenant: any
  let branch: any
  let classroomNurseryA: any
  let classroomNurseryB: any
  let adminUser: any
  let teacherUser: any
  let guardianA: any
  let guardianB: any
  let student1: any
  let student2: any
  let student3DuplicateName: any
  let student4NoPhoto: any
  let student5NoGuardian: any

  let cookieAdmin: string
  let cookieTeacher: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant
    tenant = await db.tenant.create({
      data: {
        name: `Roster Test School ${ts}`,
        code: `RTS-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Campus Branch
    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: `Blossom Campus ${ts}`,
        code: `BLO-${ts.slice(-3)}`,
        isMain: true,
        isActive: true,
      },
    })

    // 3. Setup Staff Users (Admin & Teacher)
    adminUser = await db.user.create({
      data: {
        email: `admin_${ts}@preone.test`,
        username: `admin_${ts}`,
        fullName: 'Principal Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        branchId: branch.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    teacherUser = await db.user.create({
      data: {
        email: `teacher_${ts}@preone.test`,
        username: `teacher_${ts}`,
        fullName: 'Teacher Blossom',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        branchId: branch.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })

    // 4. Setup Academic Session and Classrooms (Teacher assigned to Nursery A only)
    const academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `AY ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })

    classroomNurseryA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: `Nursery-A ${ts}`,
        code: 'NUR-A',
        programType: 'NURSERY',
        primaryTeacherId: teacherUser.id,
        academicSessionId: academicSession.id,
        isActive: true,
      },
    })

    classroomNurseryB = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: `Nursery-B ${ts}`,
        code: 'NUR-B',
        programType: 'NURSERY',
        academicSessionId: academicSession.id,
        isActive: true,
      },
    })

    // 5. Setup Guardians
    guardianA = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Priya Sharma',
        phone: '+91 98765 43210',
        email: `priya_${ts}@example.com`,
        relationship: 'MOTHER',
      },
    })

    guardianB = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Vikram Patel',
        phone: '+91 91234 56789',
        email: `vikram_${ts}@example.com`,
        relationship: 'FATHER',
      },
    })

    // 6. Setup Students with diverse attributes:
    // Student 1: Aarav Sharma (Photo present, primary guardian, Nursery A)
    student1 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomNurseryA.id,
        admissionNo: `STU-${ts.slice(-3)}-001`,
        seatNumber: 'NUR-01',
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2023-08-15'), // Exactly 3y 2m as of Oct 2026
        gender: 'MALE',
        photoUrl: 'https://images.unsplash.com/photo-child-1.jpg',
        status: 'ACTIVE',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: student1.id,
        guardianId: guardianA.id,
        isPrimary: true,
        relationship: 'MOTHER',
      },
    })

    // Student 2: Ananya Patel (In Nursery B, different room)
    student2 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomNurseryB.id,
        admissionNo: `STU-${ts.slice(-3)}-002`,
        seatNumber: 'NUR-02',
        firstName: 'Ananya',
        lastName: 'Patel',
        dob: new Date('2022-10-15'), // 4y 0m as of Oct 2026
        gender: 'FEMALE',
        photoUrl: 'https://images.unsplash.com/photo-child-2.jpg',
        status: 'ACTIVE',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: student2.id,
        guardianId: guardianB.id,
        isPrimary: true,
        relationship: 'FATHER',
      },
    })

    // Student 3: Aarav Patel (Duplicate first name 'Aarav' to test recognition disambiguation)
    student3DuplicateName = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomNurseryA.id,
        admissionNo: `STU-${ts.slice(-3)}-003`,
        seatNumber: 'NUR-03',
        firstName: 'Aarav',
        lastName: 'Patel',
        dob: new Date('2021-03-10'), // 5y 7m as of Oct 2026
        gender: 'MALE',
        photoUrl: 'https://images.unsplash.com/photo-child-3.jpg',
        status: 'ACTIVE',
      },
    })

    // Student 4: Kabir Verma (Missing photo, unassigned classroom)
    student4NoPhoto = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: null,
        admissionNo: `STU-${ts.slice(-3)}-004`,
        firstName: 'Kabir',
        lastName: 'Verma',
        dob: new Date('2024-02-15'),
        gender: 'MALE',
        photoUrl: null,
        status: 'ACTIVE',
      },
    })

    // Student 5: Meera Sen (No guardian on file, missing DOB)
    student5NoGuardian = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomNurseryA.id,
        admissionNo: `STU-${ts.slice(-3)}-005`,
        firstName: 'Meera',
        lastName: 'Sen',
        dob: new Date('2023-01-01'),
        gender: 'FEMALE',
        photoUrl: null,
        status: 'ACTIVE',
      },
    })

    // Generate authenticated test session cookies
    cookieAdmin = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    cookieTeacher = await signSession({
      uid: teacherUser.id,
      email: teacherUser.email,
      name: teacherUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })
  })

  // ── 1. Preschool Age Calculation Unit Tests ──
  describe('1. Preschool-format Age Calculation (formatPreschoolAge)', () => {
    const fixedNow = new Date('2026-10-17T12:00:00Z')

    it('1.1: Calculates "3y 2m" accurately from 2023-08-15', () => {
      const age = formatPreschoolAge('2023-08-15', fixedNow)
      expect(age).toBe('3y 2m')
    })

    it('1.2: Calculates "4y 0m" accurately from 2022-10-10', () => {
      const age = formatPreschoolAge('2022-10-10', fixedNow)
      expect(age).toBe('4y 0m')
    })

    it('1.3: Calculates "5y 7m" accurately from 2021-03-10', () => {
      const age = formatPreschoolAge('2021-03-10', fixedNow)
      expect(age).toBe('5y 7m')
    })

    it('1.4: Calculates infant/toddler months format ("8m") when under 1 year', () => {
      const age = formatPreschoolAge('2026-02-15', fixedNow)
      expect(age).toBe('8m')
    })

    it('1.5: Handles birth day not yet reached in the current month', () => {
      // Born on Oct 25 -> 25th has not occurred yet on Oct 17 -> completed months is 11, age 3y 11m
      const age = formatPreschoolAge('2022-10-25', fixedNow)
      expect(age).toBe('3y 11m')
    })

    it('1.6: Gracefully returns "—" for missing, empty or invalid DOB', () => {
      expect(formatPreschoolAge('')).toBe('—')
      expect(formatPreschoolAge(null)).toBe('—')
      expect(formatPreschoolAge(undefined)).toBe('—')
      expect(formatPreschoolAge('not-a-valid-date')).toBe('—')
    })

    it('1.7: Handles future date of birth without negative or nonsensical output', () => {
      expect(formatPreschoolAge('2030-01-01', fixedNow)).toBe('0m')
    })
  })

  // ── 2. Visual Photo Roster API Contract & Data Verification ──
  describe('2. Authoritative Roster Data & Card Content', () => {
    it('2.1: GET /api/v1/students returns real student records with photoUrl, names, classroom and primary guardian', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?branchId=${branch.id}`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)

      const aaravSharma = json.data.find((s: any) => s.id === student1.id)
      expect(aaravSharma).toBeDefined()
      expect(aaravSharma.firstName).toBe('Aarav')
      expect(aaravSharma.lastName).toBe('Sharma')
      expect(aaravSharma.name).toBe('Aarav Sharma')
      expect(aaravSharma.admissionNo).toBe(student1.admissionNo)
      expect(aaravSharma.photoUrl).toBe('https://images.unsplash.com/photo-child-1.jpg')
      expect(aaravSharma.classroom.name).toContain('Nursery-A')
      expect(aaravSharma.primaryGuardian.name).toBe('Priya Sharma')
      expect(aaravSharma.primaryGuardian.phone).toBe('+91 98765 43210')
      expect(aaravSharma.primaryGuardian.isPrimary).toBe(true)
    })

    it('2.2: Disambiguates duplicate first names through last name, admissionNo and seatNumber', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?branchId=${branch.id}&q=Aarav`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      const aaravs = json.data.filter((s: any) => s.firstName === 'Aarav')
      expect(aaravs.length).toBe(2)

      const [aarav1, aarav2] = aaravs
      expect(aarav1.name).not.toBe(aarav2.name)
      expect(aarav1.admissionNo).not.toBe(aarav2.admissionNo)
      expect(aarav1.id).not.toBe(aarav2.id)
    })

    it('2.3: Handles missing photo gracefully with null photoUrl (fallback triggered in UI)', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?branchId=${branch.id}&q=Kabir`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      const kabir = json.data.find((s: any) => s.id === student4NoPhoto.id)
      expect(kabir).toBeDefined()
      expect(kabir.photoUrl).toBeNull()
      expect(kabir.classroom).toBeNull() // Unassigned classroom fallback
    })

    it('2.4: Handles missing guardian gracefully with null primaryGuardian', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?branchId=${branch.id}&q=Meera`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      const meera = json.data.find((s: any) => s.id === student5NoGuardian.id)
      expect(meera).toBeDefined()
      expect(meera.primaryGuardian).toBeNull()
      expect(meera.dob).toBeDefined()
    })
  })

  // ── 3. Teacher Scope & Privacy Enforcement ──
  describe('3. Teacher Authorization Scope & Data Privacy', () => {
    it('3.1: Teacher only sees students from their assigned classroom (Nursery A)', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?branchId=${branch.id}`,
        { headers: { Cookie: `preone_session=${cookieTeacher}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      // Nursery A has student1, student3DuplicateName, student5NoGuardian
      const studentIds = json.data.map((s: any) => s.id)
      expect(studentIds).toContain(student1.id)
      expect(studentIds).toContain(student3DuplicateName.id)
      expect(studentIds).toContain(student5NoGuardian.id)

      // Student 2 is in Nursery B (unassigned to this teacher) -> MUST NOT be in roster
      expect(studentIds).not.toContain(student2.id)
      // Student 4 is unassigned to any classroom -> MUST NOT be in teacher's roster
      expect(studentIds).not.toContain(student4NoPhoto.id)
    })

    it('3.2: Teacher cannot query another classroom roster directly', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?classroomId=${classroomNurseryB.id}`,
        { headers: { Cookie: `preone_session=${cookieTeacher}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      // Teacher querying Nursery B gets empty array
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(0)
    })
  })

  // ── 4. Unified Data Filtering Across Views ──
  describe('4. Search and Filter Consistency', () => {
    it('4.1: Searching by guardian phone finds the corresponding student in the roster', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?q=98765`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      expect(json.data.some((s: any) => s.id === student1.id)).toBe(true)
    })

    it('4.2: Filtering by classroom returns only students enrolled in that class', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students?classroomId=${classroomNurseryA.id}`,
        { headers: { Cookie: `preone_session=${cookieAdmin}` } }
      )
      const res = await studentsGet(req)
      const json = await res.json()

      expect(json.data.every((s: any) => s.classroom?.id === classroomNurseryA.id)).toBe(true)
      expect(json.data.some((s: any) => s.id === student2.id)).toBe(false)
    })
  })
})

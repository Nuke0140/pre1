import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { formatPreschoolAge } from '@/lib/format'
import { buildWhatsAppChatUrl, normalizePhoneNumberForTel } from '@/lib/contact-utils'
import { GET as studentSummaryGet } from '@/app/api/v1/students/[id]/summary/route'
import { StudentService } from '@/lib/students/student-service'

describe('Student 360 Slide-Over Drawer — Backend & Data Contracts', () => {
  let tenant: any
  let branch: any
  let classroom: any
  let adminUser: any
  let teacherUser: any
  let parentUser: any
  let guardian: any
  let student: any
  let studentNoAllergies: any

  let cookieAdmin: string
  let cookieTeacher: string
  let cookieParent: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        name: `360 Test Academy ${ts}`,
        code: `360-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: `PreOne Central ${ts}`,
        code: `CEN-${ts.slice(-3)}`,
        isMain: true,
        isActive: true,
      },
    })

    // 2. Setup Staff Users
    adminUser = await db.user.create({
      data: {
        email: `admin360_${ts}@preone.test`,
        username: `admin360_${ts}`,
        fullName: 'Dr. Principal Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'PRINCIPAL',
      },
    })

    teacherUser = await db.user.create({
      data: {
        email: `teacher360_${ts}@preone.test`,
        username: `teacher360_${ts}`,
        fullName: 'Ms. Emily Vance',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        role: 'TEACHER',
      },
    })

    parentUser = await db.user.create({
      data: {
        email: `parent360_${ts}@preone.test`,
        username: `parent360_${ts}`,
        fullName: 'Mr. David Miller',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: parentUser.id,
        role: 'PARENT',
      },
    })

    // 3. Setup Academic Session & Classroom
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

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: 'Little Explorers A',
        code: `LEA-${ts.slice(-3)}`,
        programType: 'NURSERY',
        capacity: 20,
        primaryTeacherId: teacherUser.id,
        academicSessionId: academicSession.id,
      },
    })

    // 4. Setup Guardian
    guardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Mr. David Miller',
        phone: '9876543210',
        email: `david_${ts}@preone.test`,
        relationship: 'FATHER',
        isPrimaryContact: true,
        userId: parentUser.id,
      },
    })

    // 5. Setup Student with Peanut Allergy & Specific Blood Group
    student = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-360-1`,
        seatNumber: 'S-01',
        firstName: 'Leo',
        lastName: 'Miller',
        dob: new Date('2023-04-15'),
        gender: 'MALE',
        status: 'ACTIVE',
        bloodGroup: 'O_POSITIVE',
        allergies: 'Severe Peanut & Tree Nut allergy',
        emergencyMedicalInstructions: 'Use EpiPen located in nurse kit immediately upon exposure',
        currentClassroomId: classroom.id,
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        isPrimary: true,
        canPickup: true,
        relationship: 'FATHER',
      },
    })

    // 6. Setup Student without allergies
    studentNoAllergies = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-360-2`,
        seatNumber: 'S-02',
        firstName: 'Mia',
        lastName: 'Sharma',
        dob: new Date('2023-08-10'),
        gender: 'FEMALE',
        status: 'ACTIVE',
        bloodGroup: 'B_POSITIVE',
        allergies: null,
        currentClassroomId: classroom.id,
      },
    })

    // 7. Setup Today's Attendance for Leo
    const today = new Date()
    const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    await db.attendance.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        classroomId: classroom.id,
        studentId: student.id,
        date: todayDateOnly,
        status: 'PRESENT',
        markedAt: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15, 0)),
        notes: 'Arrived happily with father',
      },
    })

    // 8. Setup Invoices for Leo (1 Paid, 1 Outstanding)
    await db.invoice.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        studentId: student.id,
        invoiceType: 'STUDENT_FEE',
        invoiceNumber: `INV-PAID-${ts}`,
        dueDate: new Date(Date.now() + 86400000),
        subtotalCents: 500000,
        totalCents: 500000,
        paidCents: 500000,
        balanceCents: 0,
        status: 'PAID',
      },
    })

    await db.invoice.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        studentId: student.id,
        invoiceType: 'STUDENT_FEE',
        invoiceNumber: `INV-DUE-${ts}`,
        dueDate: new Date(Date.now() + 86400000 * 5),
        subtotalCents: 1500000,
        totalCents: 1500000,
        paidCents: 500000,
        balanceCents: 1000000,
        status: 'PARTIALLY_PAID',
      },
    })

    // 9. Generate Authentication Cookies
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

    cookieParent = await signSession({
      uid: parentUser.id,
      email: parentUser.email,
      name: parentUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })
  })

  it('1. Fetches high-speed summary for 360 drawer with identity and classroom details', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
        actorRoles: ['PRINCIPAL'],
      },
      student.id
    )

    expect(summary.student.id).toBe(student.id)
    expect(summary.student.name).toBe('Leo Miller')
    expect(summary.student.admissionNo).toBe('ADM-360-1')
    expect(summary.student.seatNumber).toBe('S-01')
    expect(summary.student.classroom?.name).toBe('Little Explorers A')
    expect(summary.student.classroom?.teacher).toBe('Ms. Emily Vance')
  })

  it('2. Returns health details, blood group, allergies, and emergency medical instructions', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
      },
      student.id
    )

    expect(summary.health.bloodGroup).toBe('O_POSITIVE')
    expect(summary.health.allergies).toContain('Severe Peanut & Tree Nut allergy')
    expect(summary.health.emergencyMedicalInstructions).toContain('EpiPen')

    // Child with no allergies returns null allergies
    const summaryNoAllergies = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
      },
      studentNoAllergies.id
    )
    expect(summaryNoAllergies.health.allergies).toBeNull()
  })

  it('3. Authoritatively returns today attendance snapshot and arrival time', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
      },
      student.id
    )

    expect(summary.todayAttendance).not.toBeNull()
    expect(summary.todayAttendance?.status).toBe('PRESENT')
    expect(summary.todayAttendance?.notes).toBe('Arrived happily with father')
    expect(new Date(summary.todayAttendance!.markedAt).toISOString()).toContain('T09:15:00')

    // Student without attendance today returns null
    const summaryNoAtt = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
      },
      studentNoAllergies.id
    )
    expect(summaryNoAtt.todayAttendance).toBeNull()
  })

  it('4. Aggregates fee balance accurately for authorized roles (Admin / Principal)', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
        actorRoles: ['PRINCIPAL'],
      },
      student.id
    )

    expect(summary.finance.isRestricted).toBe(false)
    expect(summary.finance.totalBilledCents).toBe(2000000) // 5000 + 15000 = 20000 INR = 2,000,000 paise
    expect(summary.finance.totalPaidCents).toBe(1000000)   // 5000 + 5000 = 10,000 INR = 1,000,000 paise
    expect(summary.finance.balanceCents).toBe(1000000)     // 10,000 INR remaining
    expect(summary.finance.hasOutstanding).toBe(true)
  })

  it('5. Protects fee data when actor lacks financial permissions (Teacher)', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: teacherUser.id,
        actorRole: 'TEACHER',
        actorRoles: ['TEACHER'],
      },
      student.id
    )

    expect(summary.finance.isRestricted).toBe(true)
    expect(summary.finance.balanceCents).toBe(0)
    expect(summary.finance.hasOutstanding).toBe(false)
  })

  it('6. Primary guardian contact links normalize telephone and WhatsApp E.164 formatting', async () => {
    const summary = await StudentService.getStudentSummary(
      {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: adminUser.id,
        actorRole: 'PRINCIPAL',
      },
      student.id
    )

    expect(summary.primaryGuardian).not.toBeNull()
    expect(summary.primaryGuardian?.name).toBe('Mr. David Miller')
    expect(summary.primaryGuardian?.relationship).toBe('FATHER')
    expect(summary.primaryGuardian?.phone).toBe('9876543210')

    const tel = normalizePhoneNumberForTel(summary.primaryGuardian?.phone)
    expect(tel).toBe('tel:9876543210')

    const wa = buildWhatsAppChatUrl(summary.primaryGuardian?.phone, 'Hello Mr. David Miller')
    expect(wa).toBe('https://wa.me/919876543210?text=Hello%20Mr.%20David%20Miller')
  })

  it('7. Formats preschool-friendly age with years and months', () => {
    // 3 years 2 months reference test
    const refDate = new Date('2026-06-15')
    const age = formatPreschoolAge(student.dob, refDate)
    expect(age).toBe('3y 2m')

    // Infant under 1 year
    const infantDob = new Date('2025-10-15')
    const infantAge = formatPreschoolAge(infantDob, refDate)
    expect(infantAge).toBe('8m')
  })

  it('8. Enforces multi-tenant isolation on summary route', async () => {
    // Attempting to query student from an unrelated tenant must fail
    const otherTenant = await db.tenant.create({
      data: {
        name: `Other School ${ts}`,
        code: `OTH-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    const otherUser = await db.user.create({
      data: {
        email: `other_${ts}@preone.test`,
        username: `other_${ts}`,
        fullName: 'Other Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    const otherCookie = await signSession({
      uid: otherUser.id,
      email: otherUser.email,
      name: otherUser.fullName,
      tenantId: otherTenant.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    const req = new NextRequest(`http://localhost:3000/api/v1/students/${student.id}/summary`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${otherCookie}`,
      },
    })

    const res = await studentSummaryGet(req, {
      params: Promise.resolve({ id: student.id }),
    })

    expect(res.status).toBe(404)
  })

  it('9. GET /api/v1/students/[id]/summary returns 200 with summary contract', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/students/${student.id}/summary`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieAdmin}`,
      },
    })

    const res = await studentSummaryGet(req, {
      params: Promise.resolve({ id: student.id }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.student.name).toBe('Leo Miller')
    expect(json.data.todayAttendance.status).toBe('PRESENT')
    expect(json.data.finance.balanceCents).toBe(1000000)
  })
})

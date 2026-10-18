import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import {
  formatGuardianCallLabel,
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'
import { StudentService } from '@/lib/students/student-service'
import { GET as studentSummaryGet } from '@/app/api/v1/students/[id]/summary/route'
import { GET as studentsListGet } from '@/app/api/v1/students/route'

describe('1-Click "Call Mom" / WhatsApp Emergency Contact Actions', () => {
  let tenant: any
  let branch: any
  let academicSession: any
  let classroom: any
  let adminUser: any
  let teacherUser: any
  let momGuardian: any
  let dadGuardian: any
  let emergencyAuntGuardian: any
  let studentWithMomPrimary: any
  let studentWithDadPrimaryAndAuntEmergency: any
  let studentWithoutPhone: any

  let cookieAdmin: string
  let cookieTeacher: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        name: `Emergency Contact School ${ts}`,
        code: `ECS-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: `Main Campus ${ts}`,
        code: `MC-${ts.slice(-3)}`,
        isMain: true,
        isActive: true,
      },
    })

    // 2. Setup Academic Session & Classroom
    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `AY ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `admin_ec_${ts}@preone.test`,
        username: `admin_ec_${ts}`,
        fullName: 'Principal Admin',
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
        email: `teacher_ec_${ts}@preone.test`,
        username: `teacher_ec_${ts}`,
        fullName: 'Teacher Sarah',
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

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: 'Sunflower Playgroup',
        code: `SUN-${ts.slice(-3)}`,
        programType: 'PLAYGROUP',
        capacity: 15,
        primaryTeacherId: teacherUser.id,
        academicSessionId: academicSession.id,
      },
    })

    // 3. Setup Guardians (Mom, Dad, Aunt)
    momGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Priya Sharma',
        phone: '9876543210',
        email: `priya_${ts}@test.com`,
        relationship: 'MOTHER',
        isPrimaryContact: true,
      },
    })

    dadGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Rajesh Verma',
        phone: '9123456789',
        email: `rajesh_${ts}@test.com`,
        relationship: 'FATHER',
        isPrimaryContact: true,
      },
    })

    emergencyAuntGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Anita Verma',
        phone: '9988776655',
        email: `anita_${ts}@test.com`,
        relationship: 'OTHER',
      },
    })

    // 4. Student 1: Mom is Primary Guardian
    studentWithMomPrimary = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-MOM-1`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2023-05-10'),
        gender: 'MALE',
        status: 'ACTIVE',
        currentClassroomId: classroom.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentWithMomPrimary.id,
        guardianId: momGuardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
        isEmergencyContact: true,
        emergencyPriority: 1,
      },
    })

    // 5. Student 2: Dad is Primary Guardian, Aunt Anita is Emergency Contact (Priority 1)
    studentWithDadPrimaryAndAuntEmergency = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-DAD-2`,
        firstName: 'Ananya',
        lastName: 'Verma',
        dob: new Date('2023-03-20'),
        gender: 'FEMALE',
        status: 'ACTIVE',
        currentClassroomId: classroom.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentWithDadPrimaryAndAuntEmergency.id,
        guardianId: dadGuardian.id,
        relationship: 'FATHER',
        isPrimary: true,
        isEmergencyContact: false,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentWithDadPrimaryAndAuntEmergency.id,
        guardianId: emergencyAuntGuardian.id,
        relationship: 'OTHER',
        isPrimary: false,
        isEmergencyContact: true,
        emergencyPriority: 1,
      },
    })

    // 6. Student 3: Guardian with missing/invalid phone number
    const guardianNoPhone = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Sunil Kumar',
        phone: '', // No phone
        relationship: 'GUARDIAN',
      },
    })
    studentWithoutPhone = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-NOPHONE-3`,
        firstName: 'Kabir',
        lastName: 'Kumar',
        dob: new Date('2023-01-15'),
        gender: 'MALE',
        status: 'ACTIVE',
        currentClassroomId: classroom.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentWithoutPhone.id,
        guardianId: guardianNoPhone.id,
        relationship: 'GUARDIAN',
        isPrimary: true,
      },
    })

    // 7. Cookies
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

  describe('Relationship-Aware Labeling (formatGuardianCallLabel)', () => {
    it('1. Displays "Call Mom · Priya" when verified relationship is MOTHER', () => {
      const label = formatGuardianCallLabel({
        name: 'Priya Sharma',
        relationship: 'MOTHER',
      })
      expect(label).toBe('Call Mom · Priya')
    })

    it('2. Displays "Call Dad · Rajesh" when verified relationship is FATHER', () => {
      const label = formatGuardianCallLabel({
        name: 'Rajesh Verma',
        relationship: 'FATHER',
      })
      expect(label).toBe('Call Dad · Rajesh')
    })

    it('3. Displays "Call Grandparent · Ramesh" when verified relationship is GRANDPARENT', () => {
      const label = formatGuardianCallLabel({
        name: 'Ramesh Patel',
        relationship: 'GRANDPARENT',
      })
      expect(label).toBe('Call Grandparent · Ramesh')
    })

    it('4. Uses compact label "Call Mom" or "Call Dad" when compact option is specified', () => {
      expect(formatGuardianCallLabel({ name: 'Priya Sharma', relationship: 'MOTHER' }, { compact: true })).toBe('Call Mom')
      expect(formatGuardianCallLabel({ name: 'Rajesh Verma', relationship: 'FATHER' }, { compact: true })).toBe('Call Dad')
    })

    it('5. Distinguishes emergency contact label when flagged as emergency', () => {
      const label = formatGuardianCallLabel(
        { name: 'Anita Verma', relationship: 'OTHER' },
        { isEmergency: true }
      )
      expect(label).toBe('Call Contact · Anita')

      const neutralEmergency = formatGuardianCallLabel(
        { name: 'Dr. Rao', relationship: null },
        { isEmergency: true }
      )
      expect(label).toBe('Call Contact · Anita')
    })
  })

  describe('Phone and WhatsApp URL Validation & Safety', () => {
    it('6. Normalizes phone numbers to standard tel: protocol', () => {
      expect(normalizePhoneNumberForTel('9876543210')).toBe('tel:9876543210')
      expect(normalizePhoneNumberForTel('+91 98765 43210')).toBe('tel:+919876543210')
      expect(normalizePhoneNumberForTel('09876543210')).toBe('tel:09876543210')
      expect(normalizePhoneNumberForTel('')).toBeNull()
      expect(normalizePhoneNumberForTel(null)).toBeNull()
      expect(normalizePhoneNumberForTel('123')).toBeNull() // Too short
    })

    it('7. Converts Indian numbers to E.164 with 91 prefix for WhatsApp', () => {
      expect(normalizePhoneNumberForWhatsApp('9876543210')).toBe('919876543210')
      expect(normalizePhoneNumberForWhatsApp('09876543210')).toBe('919876543210')
      expect(normalizePhoneNumberForWhatsApp('+919876543210')).toBe('919876543210')
      expect(normalizePhoneNumberForWhatsApp('')).toBeNull()
    })

    it('8. Builds safe, neutral WhatsApp click-to-chat links without sensitive medical data', () => {
      const url = buildWhatsAppChatUrl(
        '9876543210',
        'Hello, this is the preschool contacting you regarding Aarav. Please contact us when available.'
      )
      expect(url).toBe(
        'https://wa.me/919876543210?text=Hello%2C%20this%20is%20the%20preschool%20contacting%20you%20regarding%20Aarav.%20Please%20contact%20us%20when%20available.'
      )
    })
  })

  describe('Backend Authoritative Contact Resolution & Security Scope', () => {
    it('9. GET /api/v1/students returns primaryGuardian and emergencyContact in roster records', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/students?search=Verma`, {
        method: 'GET',
        headers: { cookie: `preone_session=${cookieAdmin}` },
      })

      const res = await studentsListGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)

      const student = json.data.find((s: any) => s.admissionNo === 'ADM-DAD-2')
      expect(student).toBeDefined()
      expect(student.primaryGuardian.name).toBe('Rajesh Verma')
      expect(student.primaryGuardian.relationship).toBe('FATHER')
      expect(student.emergencyContact.name).toBe('Anita Verma')
      expect(student.emergencyContact.isEmergencyContact).toBe(true)
    })

    it('10. GET /api/v1/students/[id]/summary returns distinct emergency contact alongside primary guardian', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/students/${studentWithDadPrimaryAndAuntEmergency.id}/summary`,
        {
          method: 'GET',
          headers: { cookie: `preone_session=${cookieAdmin}` },
        }
      )

      const res = await studentSummaryGet(req, {
        params: Promise.resolve({ id: studentWithDadPrimaryAndAuntEmergency.id }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.primaryGuardian.name).toBe('Rajesh Verma')
      expect(json.data.primaryGuardian.relationship).toBe('FATHER')
      expect(json.data.emergencyContact.name).toBe('Anita Verma')
      expect(json.data.emergencyContact.phone).toBe('9988776655')
    })

    it('11. Handles missing phone numbers gracefully with null fallbacks', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/students/${studentWithoutPhone.id}/summary`,
        {
          method: 'GET',
          headers: { cookie: `preone_session=${cookieAdmin}` },
        }
      )

      const res = await studentSummaryGet(req, {
        params: Promise.resolve({ id: studentWithoutPhone.id }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.primaryGuardian.name).toBe('Sunil Kumar')
      expect(normalizePhoneNumberForTel(json.data.primaryGuardian.phone)).toBeNull()
      expect(normalizePhoneNumberForWhatsApp(json.data.primaryGuardian.phone)).toBeNull()
    })

    it('12. Enforces multi-tenant isolation: unauthorized tenant receives 404', async () => {
      const anotherTenant = await db.tenant.create({
        data: {
          name: `Rogue School ${ts}`,
          code: `ROG-${ts.slice(-4)}`,
          status: 'ACTIVE',
        },
      })
      const rogueUser = await db.user.create({
        data: {
          email: `rogue_${ts}@preone.test`,
          fullName: 'Rogue User',
          status: 'ACTIVE',
          passwordHash: '$2b$10$hashedtestpasswordstringhere',
        },
      })
      const rogueCookie = await signSession({
        uid: rogueUser.id,
        email: rogueUser.email,
        name: rogueUser.fullName,
        tenantId: anotherTenant.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
      })

      const req = new NextRequest(
        `http://localhost:3000/api/v1/students/${studentWithMomPrimary.id}/summary`,
        {
          method: 'GET',
          headers: { cookie: `preone_session=${rogueCookie}` },
        }
      )

      const res = await studentSummaryGet(req, {
        params: Promise.resolve({ id: studentWithMomPrimary.id }),
      })

      expect(res.status).toBe(404)
    })
  })
})

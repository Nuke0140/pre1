import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as usersCsvPost, GET as usersCsvGet } from '@/app/api/v1/users/csv/route'
import { GET as usersExportGet } from '@/app/api/v1/users/export/route'
import bcrypt from 'bcryptjs'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { CANONICAL_FAMILY_FIELDS, resolveRowWithAliases } from '@/lib/users/canonical-fields'
import { CsvEngine } from '@/lib/users/csv-engine'

describe('PreOne Users Module: Family CSV/Worksheet Parity with Add Family Member Form', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let classroom: any
  let existingStudent: any
  let ownerUser: any
  let cookieOwner: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `FAM-PAR-${ts.slice(-5)}`,
        name: `Family Parity Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        code: `MAIN-${ts.slice(-4)}`,
        name: 'Main Campus',
        isMain: true,
      },
    })

    const session = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Session 2026-${ts.slice(-4)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: session.id,
        name: 'Nursery Blue',
        code: `NUR-BLU-${ts.slice(-4)}`,
        programType: 'NURSERY',
        capacity: 25,
      },
    })

    await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Nursery Program',
        code: `NUR-${ts.slice(-4)}`,
        programType: 'NURSERY',
        ageMinMonths: 24,
        ageMaxMonths: 72,
        capacity: 30,
        isActive: true,
        branchMappings: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            capacity: 30,
            isActive: true,
          },
        },
      },
    })

    existingStudent = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroom.id,
        admissionNo: `PRE-${ts.slice(-4)}-01`,
        firstName: 'Anaya',
        lastName: 'Deshmukh',
        dob: new Date('2021-06-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)
    ownerUser = await db.user.create({
      data: {
        email: `fam.parity.owner.${ts}@preone.test`,
        username: `fam_parity_${ts}`,
        fullName: 'Family Parity Admin',
        passwordHash,
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })

    const token = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant.id,
      role: 'OWNER',
      roles: ['OWNER'],
      branchId: branch.id,
    })
    cookieOwner = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax`
  })

  describe('1. Authoritative Canonical Field Contract & Template Alignment', () => {
    it('CANONICAL_FAMILY_FIELDS matches Add Family Member form field requirements', () => {
      const keys = CANONICAL_FAMILY_FIELDS.map((f) => f.key)

      // Step 1: Caregiver Details
      expect(keys).toContain('fullName')
      expect(keys).toContain('role')
      expect(keys).toContain('relationship')
      expect(keys).toContain('phone')
      expect(keys).toContain('email')
      expect(keys).toContain('occupation')
      expect(keys).toContain('isPrimaryContact')

      // Step 2: Child Connection (Mode 1 & Mode 2)
      expect(keys).toContain('studentAdmissionNo')
      expect(keys).toContain('studentName')
      expect(keys).toContain('studentDateOfBirth')
      expect(keys).toContain('studentGender')
      expect(keys).toContain('studentBranch')
      expect(keys).toContain('studentClass')

      // Step 3: Permissions & PIN
      expect(keys).toContain('canPickup')
      expect(keys).toContain('pickupPin')
      expect(keys).toContain('receivesComm')

      // Portal Credentials & Status
      expect(keys).toContain('username')
      expect(keys).toContain('status')

      // Sensitive fields: pickupPin is strictly NOT exportable
      const pinField = CANONICAL_FAMILY_FIELDS.find((f) => f.key === 'pickupPin')
      expect(pinField?.importable).toBe(true)
      expect(pinField?.exportable).toBe(false)
    })

    it('CsvEngine.getFamilyTemplate() generates template with canonical 18 headers matching Add Form', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv?template=family', {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersCsvGet(req)
      expect(res.status).toBe(200)

      const csv = await res.text()
      const firstLine = csv.split('\r\n')[0]
      const headers = firstLine.split(',').map((h) => h.replace(/^["']|["']$/g, ''))

      expect(headers).toEqual([
        'fullName',
        'role',
        'relationship',
        'phone',
        'email',
        'occupation',
        'isPrimaryContact',
        'studentAdmissionNo',
        'studentName',
        'studentDateOfBirth',
        'studentGender',
        'studentBranch',
        'studentClass',
        'canPickup',
        'pickupPin',
        'receivesComm',
        'username',
        'status',
      ])
    })
  })

  describe('2. Validation Rules Parity with Add Family Form', () => {
    it('validates invalid caregiver full names, missing phone, missing relationship, and invalid PIN', async () => {
      const invalidRows = [
        'fullName,role,relationship,phone,email,pickupPin',
        'A,PARENT,FATHER,9876543210,test1@preone.test,1234', // Name too short (<2 chars)
        '12345,PARENT,MOTHER,9876543210,test2@preone.test,1234', // Numeric name
        'Valid Name,PARENT,,9876543210,test3@preone.test,1234', // Missing relationship
        'Valid Name,PARENT,FATHER,,test4@preone.test,1234', // Missing phone
        'Valid Name,PARENT,FATHER,9876543210,test5@preone.test,12', // PIN too short (< 4 digits)
        'Valid Name,PARENT,FATHER,9876543210,test6@preone.test,1234567', // PIN too long (> 6 digits)
        'Valid Name,PARENT,FATHER,9876543210,test7@preone.test,ABCD', // Non-numeric PIN
      ].join('\n')

      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'preview',
          type: 'FAMILY',
          csv: invalidRows,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      const data = json.data
      expect(data.rows.length).toBe(7)

      // Row 0: Name too short
      expect(data.rows[0].status).toBe('BLOCKED')
      expect(data.rows[0].errors.some((e: string) => e.includes('at least 2 characters'))).toBe(true)

      // Row 1: Numeric name
      expect(data.rows[1].status).toBe('BLOCKED')
      expect(data.rows[1].errors.some((e: string) => e.includes('numeric'))).toBe(true)

      // Row 2: Missing relationship
      expect(data.rows[2].status).toBe('BLOCKED')
      expect(data.rows[2].errors.some((e: string) => e.includes('Relationship to child is required'))).toBe(true)

      // Row 3: Missing phone
      expect(data.rows[3].status).toBe('BLOCKED')
      expect(data.rows[3].errors.some((e: string) => e.includes('Caregiver mobile phone is missing'))).toBe(true)

      // Row 4: PIN too short
      expect(data.rows[4].status).toBe('BLOCKED')
      expect(data.rows[4].errors.some((e: string) => e.includes('Pickup PIN must be 4 to 6 numeric digits'))).toBe(true)

      // Row 5: PIN too long
      expect(data.rows[5].status).toBe('BLOCKED')
      expect(data.rows[5].errors.some((e: string) => e.includes('Pickup PIN must be 4 to 6 numeric digits'))).toBe(true)

      // Row 6: Non-numeric PIN
      expect(data.rows[6].status).toBe('BLOCKED')
      expect(data.rows[6].errors.some((e: string) => e.includes('Pickup PIN must be 4 to 6 numeric digits'))).toBe(true)
    })
  })

  describe('3. Mode 1 — Link to Existing Student (Admission Number)', () => {
    it('imports family member and links to existing student with permissions and PIN', async () => {
      const email = `suresh.deshmukh.${ts}@preone.test`
      const csv = [
        'fullName,role,relationship,phone,email,occupation,isPrimaryContact,studentAdmissionNo,canPickup,pickupPin,receivesComm',
        `Suresh Deshmukh,PARENT,FATHER,+91 98220 11223,${email},Civil Engineer,YES,${existingStudent.admissionNo},YES,5839,YES`,
      ].join('\n')

      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'execute',
          type: 'FAMILY',
          csv,
          async: false,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)

      // Verify in DB
      const guardian = await db.guardian.findFirst({
        where: { tenantId: tenant.id, email },
        include: {
          user: true,
          studentLinks: {
            include: { student: true },
          },
        },
      })

      expect(guardian).not.toBeNull()
      expect(guardian?.fullName).toBe('Suresh Deshmukh')
      expect(guardian?.relationship).toBe('FATHER')
      expect(guardian?.occupation).toBe('Civil Engineer')
      expect(guardian?.isPrimaryContact).toBe(true)
      expect(guardian?.pickupPin).toBe('5839')
      expect(guardian?.studentLinks.length).toBe(1)
      expect(guardian?.studentLinks[0].student.admissionNo).toBe(existingStudent.admissionNo)
      expect(guardian?.studentLinks[0].canPickup).toBe(true)
      expect(guardian?.studentLinks[0].receivesComm).toBe(true)
    })
  })

  describe('4. Mode 2 — New Child Registration during Family Import', () => {
    it('creates new student and guardian association when studentName and DOB are provided', async () => {
      const parentEmail = `meera.kulkarni.${ts}@preone.test`
      const childName = `Ishaan Kulkarni ${ts.slice(-3)}`
      const csv = [
        'fullName,role,relationship,phone,email,occupation,studentName,studentDateOfBirth,studentGender,studentBranch,studentClass,canPickup,pickupPin',
        `Meera Kulkarni,PARENT,MOTHER,+91 98220 99887,${parentEmail},Pediatrician,${childName},2022-04-10,MALE,${branch.code},${classroom.name},YES,7294`,
      ].join('\n')

      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'execute',
          type: 'FAMILY',
          csv,
          async: false,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)

      // Verify new student was created
      const student = await db.student.findFirst({
        where: { tenantId: tenant.id, firstName: 'Ishaan' },
        include: { currentClassroom: true },
      })

      expect(student).not.toBeNull()
      expect(student?.gender).toBe('MALE')
      expect(student?.status).toBe('ACTIVE')
      expect(student?.branchId).toBe(branch.id)
      expect(student?.currentClassroomId).toBe(classroom.id)

      // Verify guardian was linked to new student
      const guardian = await db.guardian.findFirst({
        where: { tenantId: tenant.id, email: parentEmail },
        include: { studentLinks: true },
      })
      expect(guardian).not.toBeNull()
      expect(guardian?.relationship).toBe('MOTHER')
      expect(guardian?.pickupPin).toBe('7294')
      expect(guardian?.studentLinks.length).toBe(1)
      expect(guardian?.studentLinks[0].studentId).toBe(student!.id)
      expect(guardian?.studentLinks[0].canPickup).toBe(true)
    })
  })

  describe('5. Backward Compatibility with Legacy Headers', () => {
    it('resolves legacy headers: name, gender, feePayer, seatNumber, admissionYear', () => {
      const rawRow = {
        name: 'Legacy Guardian',
        gender: 'FEMALE',
        phone: '+919988776655',
        email: 'legacy@example.com',
        role: 'GUARDIAN',
        relation: 'GRANDPARENT',
        feePayer: 'YES',
        studentSeatNumber: 'SEAT-10',
        studentAdmissionYear: '2025',
      }

      const { canonical } = resolveRowWithAliases(rawRow, 'FAMILY')
      expect(canonical.fullName).toBe('Legacy Guardian')
      expect(canonical.gender).toBe('FEMALE')
      expect(canonical.phone).toBe('+919988776655')
      expect(canonical.relationship).toBe('GRANDPARENT')
      expect(canonical.isFeePayer).toBe('YES')
      expect(canonical.studentSeatNumber).toBe('SEAT-10')
      expect(canonical.studentAdmissionYear).toBe('2025')
    })
  })

  describe('6. CSV Export Security & Non-Login Guardian Ingestion', () => {
    it('exports both login and non-login guardians while strictly omitting gate PIN', async () => {
      // Create a non-login guardian directly
      const nonLoginGuardian = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          fullName: 'Ajay Uncle (Emergency Pickup)',
          relationship: 'OTHER',
          phone: '+91 91234 56789',
          email: `ajay.uncle.${ts}@preone.test`,
          occupation: 'Consultant',
          isPrimaryContact: false,
          pickupPin: '9911',
          userId: null, // non-login guardian
          studentLinks: {
            create: {
              studentId: existingStudent.id,
              relationship: 'OTHER',
              canPickup: true,
              receivesComm: false,
              isFeePayer: false,
            },
          },
        },
      })

      const req = new NextRequest('http://localhost:3000/api/v1/users/export?userType=FAMILY', {
        headers: { Cookie: cookieOwner },
      })

      const res = await usersExportGet(req)
      expect(res.status).toBe(200)

      const csv = await res.text()

      // Header checks
      expect(csv).toContain('Full Name')
      expect(csv).toContain('Relationship to Child')
      expect(csv).toContain('Primary Contact')
      expect(csv).toContain('Authorized for Pickup')
      expect(csv).toContain('Receives Communications')
      expect(csv).toContain('Fee Payer')
      expect(csv).toContain('Linked Students')

      // Non-login guardian included
      expect(csv).toContain('Ajay Uncle (Emergency Pickup)')
      expect(csv).toContain('OTHER')

      // Login parent included
      expect(csv).toContain('Suresh Deshmukh')

      // Strictly no PIN or sensitive data
      expect(csv).not.toContain('9911')
      expect(csv).not.toContain('5839')
      expect(csv).not.toContain('7294')
      expect(csv).not.toContain('pickupPin')
      expect(csv).not.toContain('Pickup Gate PIN')
      expect(csv).not.toContain('passwordHash')
    })
  })
})

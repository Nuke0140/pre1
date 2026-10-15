import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { GET as userGet, PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('PreOne Users Module — Complete Add, View & Edit Field Parity', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let classroom: any
  let adminUser: any
  let adminCookie: string

  beforeAll(async () => {
    // 1. Setup Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        code: `PARITY-${ts.slice(-6)}`,
        name: `Parity Test Academy ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'South Branch',
        code: `SB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    const sessionRecord = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Academic Year ${ts.slice(-4)}`,
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
        academicSessionId: sessionRecord.id,
        name: `Toddlers Alpha ${ts.slice(-4)}`,
        code: `TA-${ts.slice(-4)}`,
        capacity: 15,
        programType: 'PLAYGROUP',
      },
    })

    await db.program.create({
      data: {
        tenantId: tenant.id,
        code: `PG-${ts.slice(-4)}`,
        name: 'Playgroup Program',
        programType: 'PLAYGROUP',
        ageMinMonths: 12,
        ageMaxMonths: 60,
      },
    })

    // 2. Setup Super Admin
    adminUser = await db.user.create({
      data: {
        email: `admin.parity.${ts}@preone.test`,
        fullName: 'Super Administrator',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            role: 'OWNER',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    adminCookie = `${SESSION_COOKIE}=${token}`
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: STAFF CREATION FIELD COVERAGE (POST /api/v1/users)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Phase 1: Staff User Add & Persistence Parity', () => {
    let createdStaffUser: any

    it('creates staff user with exhaustive profile, HR, address, and statutory fields', async () => {
      const email = `staff.full.${ts}@preone.test`
      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          fullName: 'Dr. Katherine Pulaski',
          email,
          phone: '+91 99887 76655',
          username: `dr.pulaski.${ts.slice(-4)}`,
          password: 'Password@123',
          locale: 'mr',
          primaryRole: 'TEACHER',
          additionalRoles: ['COORDINATOR'],
          branchId: branch.id,
          employeeCode: `MED-${ts.slice(-4)}`,
          designation: 'Senior Medical Educator',
          department: 'Health & Learning',
          employmentType: 'FULL_TIME',
          qualification: 'M.D. Pediatrics, Montessori Certified',
          joiningDate: '2026-06-01',
          dateOfBirth: '1988-10-15',
          gender: 'FEMALE',
          maritalStatus: 'MARRIED',
          bloodGroup: 'B+',
          emergencyContactName: 'Jack Crusher',
          emergencyContactPhone: '+91 99887 11223',
          currentAddress: 'Flat 402, Enterprise Heights, Bandra West, Mumbai',
          permanentAddress: 'Ancestral Villa, Pune City, Maharashtra',
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '998877665548',
          uanNumber: '100998877665',
          esiNumber: '31998877665544332',
          probationEndDate: '2026-11-30',
          confirmationDate: '2026-12-01',
          noticePeriodDays: 45,
          classroomId: classroom.id,
        }),
      })

      const res = await usersPost(req)
      const json = await res.json()
      if (res.status !== 201) console.error('STAFF POST /api/v1/users failed:', json)
      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data).toBeDefined()
      createdStaffUser = json.data

      // Verify database record
      const dbStaff = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId: createdStaffUser.userId || createdStaffUser.id },
        include: {
          user: true,
          staffProfile: true,
        },
      })

      expect(dbStaff).toBeDefined()
      expect(dbStaff?.user.fullName).toBe('Dr. Katherine Pulaski')
      expect(dbStaff?.user.phone).toBe('+91 99887 76655')
      expect(dbStaff?.user.locale).toBe('mr')
      expect(dbStaff?.staffProfile).toBeDefined()

      const sp = dbStaff!.staffProfile!
      expect(sp.employeeCode).toBe(`MED-${ts.slice(-4)}`)
      expect(sp.designation).toBe('Senior Medical Educator')
      expect(sp.department).toBe('Health & Learning')
      expect(sp.employmentType).toBe('FULL_TIME')
      expect(sp.qualification).toBe('M.D. Pediatrics, Montessori Certified')
      expect(sp.gender).toBe('FEMALE')
      expect(sp.maritalStatus).toBe('MARRIED')
      expect(sp.bloodGroup).toBe('B_POSITIVE')
      expect(sp.emergencyContactName).toBe('Jack Crusher')
      expect(sp.emergencyContactPhone).toBe('+91 99887 11223')
      expect(sp.currentAddress).toContain('Bandra West')
      expect(sp.permanentAddress).toContain('Pune City')
      expect(sp.panNumber).toBe('ABCDE1234F')
      expect(sp.aadhaarNumber).toBe('998877665548')
      expect(sp.uanNumber).toBe('100998877665')
      expect(sp.esiNumber).toBe('31998877665544332')
      expect(sp.noticePeriodDays).toBe(45)

      // Verify classroom assignment
      const dbClass = await db.classroom.findUnique({ where: { id: classroom.id } })
      expect(dbClass?.primaryTeacherId).toBe(createdStaffUser.userId || createdStaffUser.id)
    })

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 2: VIEW USER COMPLETE FIELD COVERAGE (GET /api/v1/users/[id])
    // ─────────────────────────────────────────────────────────────────────────
    it('returns all profile, demographic, address, statutory, and HR fields in View User', async () => {
      const userId = createdStaffUser.userId || createdStaffUser.id
      const req = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'GET',
        headers: { Cookie: adminCookie },
      })

      const res = await userGet(req, { params: Promise.resolve({ id: userId }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      const data = json.data

      // Identity & Core fields
      expect(data.name).toBe('Dr. Katherine Pulaski')
      expect(data.phone).toBe('+91 99887 76655')
      expect(data.locale).toBe('mr')
      expect(data.role).toBe('TEACHER')
      expect(data.roles).toContain('COORDINATOR')

      // Security: Password Hash MUST NEVER be returned
      expect(data.passwordHash).toBeUndefined()
      expect(data.password).toBeUndefined()

      // Staff Profile complete field coverage
      const sp = data.staffProfile
      expect(sp).toBeDefined()
      expect(sp.employeeCode).toBe(`MED-${ts.slice(-4)}`)
      expect(sp.designation).toBe('Senior Medical Educator')
      expect(sp.department).toBe('Health & Learning')
      expect(sp.employmentType).toBe('FULL_TIME')
      expect(sp.qualification).toBe('M.D. Pediatrics, Montessori Certified')
      expect(sp.gender).toBe('FEMALE')
      expect(sp.maritalStatus).toBe('MARRIED')
      expect(sp.bloodGroup).toBe('B+')
      expect(sp.emergencyContactName).toBe('Jack Crusher')
      expect(sp.emergencyContactPhone).toBe('+91 99887 11223')
      expect(sp.currentAddress).toContain('Bandra West')
      expect(sp.permanentAddress).toContain('Pune City')
      expect(sp.panNumber).toBe('ABCDE1234F')
      expect(sp.aadhaarNumber).toBe('998877665548')
      expect(sp.uanNumber).toBe('100998877665')
      expect(sp.esiNumber).toBe('31998877665544332')
      expect(sp.noticePeriodDays).toBe(45)

      // Assigned classrooms
      expect(data.taughtClasses).toBeDefined()
      expect(data.taughtClasses.length).toBeGreaterThanOrEqual(1)
      expect(data.taughtClasses[0].id).toBe(classroom.id)
    })

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 3: EDIT USER COMPLETE FIELD COVERAGE (PATCH /api/v1/users/[id])
    // ─────────────────────────────────────────────────────────────────────────
    it('updates all staff profile fields and reflects them immediately in View User', async () => {
      const userId = createdStaffUser.userId || createdStaffUser.id
      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          fullName: 'Dr. Katherine Pulaski-McCoy',
          phone: '+91 98765 00112',
          locale: 'hi',
          designation: 'Head of Pediatric Learning',
          department: 'Executive Academics',
          qualification: 'Ph.D. Early Childhood Education, M.D.',
          employmentType: 'CONTRACT',
          joiningDate: '2026-07-01',
          dateOfBirth: '1987-09-20',
          gender: 'FEMALE',
          maritalStatus: 'DIVORCED',
          bloodGroup: 'AB+',
          emergencyContactName: 'Leonard McCoy',
          emergencyContactPhone: '+91 98765 99887',
          currentAddress: 'Penthouse 12, Nariman Point, Mumbai',
          permanentAddress: 'Heritage Bungalow, Lonavala, Maharashtra',
          panNumber: 'WXYZP9876Q',
          aadhaarNumber: '212233445569',
          uanNumber: '200112233445',
          esiNumber: '41122334455667788',
          probationEndDate: '2026-10-31',
          confirmationDate: '2026-11-01',
          noticePeriodDays: 60,
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(patchRes.status).toBe(200)
      const patchJson = await patchRes.json()
      expect(patchJson.success).toBe(true)

      // Query database directly to confirm persistence
      const dbStaff = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId },
        include: { staffProfile: true, user: true },
      })

      expect(dbStaff?.user.fullName).toBe('Dr. Katherine Pulaski-McCoy')
      expect(dbStaff?.user.phone).toBe('+91 98765 00112')
      expect(dbStaff?.user.locale).toBe('hi')

      const sp = dbStaff!.staffProfile!
      expect(sp.designation).toBe('Head of Pediatric Learning')
      expect(sp.department).toBe('Executive Academics')
      expect(sp.qualification).toBe('Ph.D. Early Childhood Education, M.D.')
      expect(sp.employmentType).toBe('CONTRACT')
      expect(sp.maritalStatus).toBe('DIVORCED')
      expect(sp.bloodGroup).toBe('AB_POSITIVE')
      expect(sp.emergencyContactName).toBe('Leonard McCoy')
      expect(sp.emergencyContactPhone).toBe('+91 98765 99887')
      expect(sp.currentAddress).toContain('Nariman Point')
      expect(sp.permanentAddress).toContain('Lonavala')
      expect(sp.panNumber).toBe('WXYZP9876Q')
      expect(sp.aadhaarNumber).toBe('212233445569')
      expect(sp.noticePeriodDays).toBe(60)
    })

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 4: PARTIAL UPDATE FIELD PRESERVATION
    // ─────────────────────────────────────────────────────────────────────────
    it('preserves existing omitted fields when performing a partial update', async () => {
      const userId = createdStaffUser.userId || createdStaffUser.id

      // Only update designation and phone — omit PAN, Aadhaar, emergency contacts, addresses
      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          designation: 'Principal Faculty Director',
          phone: '+91 91111 22222',
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(patchRes.status).toBe(200)

      // Verify that omitted fields are untouched
      const dbStaff = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId },
        include: { staffProfile: true, user: true },
      })

      expect(dbStaff?.user.phone).toBe('+91 91111 22222')
      expect(dbStaff?.staffProfile?.designation).toBe('Principal Faculty Director')

      // All untouched fields MUST be strictly preserved
      expect(dbStaff?.user.fullName).toBe('Dr. Katherine Pulaski-McCoy')
      expect(dbStaff?.user.locale).toBe('hi')
      expect(dbStaff?.staffProfile?.panNumber).toBe('WXYZP9876Q')
      expect(dbStaff?.staffProfile?.aadhaarNumber).toBe('212233445569')
      expect(dbStaff?.staffProfile?.emergencyContactName).toBe('Leonard McCoy')
      expect(dbStaff?.staffProfile?.emergencyContactPhone).toBe('+91 98765 99887')
      expect(dbStaff?.staffProfile?.bloodGroup).toBe('AB_POSITIVE')
      expect(dbStaff?.staffProfile?.currentAddress).toContain('Nariman Point')
      expect(dbStaff?.staffProfile?.noticePeriodDays).toBe(60)
    })

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 5: MULTI-ROLE PRESERVATION & ASSIGNMENT
    // ─────────────────────────────────────────────────────────────────────────
    it('preserves existing secondary roles when updating primary role and supports explicit multi-roles', async () => {
      const userId = createdStaffUser.userId || createdStaffUser.id

      // Update primary role to PRINCIPAL with roles: ['PRINCIPAL', 'TEACHER', 'COORDINATOR']
      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          role: 'PRINCIPAL',
          roles: ['PRINCIPAL', 'TEACHER', 'COORDINATOR'],
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(patchRes.status).toBe(200)

      const dbMembership = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId },
      })

      expect(dbMembership?.role).toBe('PRINCIPAL')
      expect(dbMembership?.roles).toContain('TEACHER')
      expect(dbMembership?.roles).toContain('COORDINATOR')
      expect(dbMembership?.roles).toContain('PRINCIPAL')
    })

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 6: EXPLICIT NULL CLEARING
    // ─────────────────────────────────────────────────────────────────────────
    it('supports clearing nullable fields by explicitly sending null', async () => {
      const userId = createdStaffUser.userId || createdStaffUser.id

      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          panNumber: null,
          qualification: null,
          emergencyContactPhone: null,
          permanentAddress: null,
          noticePeriodDays: null,
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(patchRes.status).toBe(200)

      const dbStaff = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId },
        include: { staffProfile: true },
      })

      const sp = dbStaff!.staffProfile!
      expect(sp.panNumber).toBeNull()
      expect(sp.qualification).toBeNull()
      expect(sp.emergencyContactPhone).toBeNull()
      expect(sp.permanentAddress).toBeNull()
      expect(sp.noticePeriodDays).toBe(60)

      // Verify that non-nullified fields still remain
      expect(sp.emergencyContactName).toBe('Leonard McCoy')
      expect(sp.aadhaarNumber).toBe('212233445569')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 7: FAMILY USER FIELD PARITY (Caregiver, Pickup & Junction)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Phase 2: Family User Add, View & Edit Parity', () => {
    let familyUser: any

    it('creates family user with occupation, isPrimaryContact, locale, and pickupPin', async () => {
      const email = `family.parity.${ts}@preone.test`
      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          fullName: 'Vikramaditya Roy',
          email,
          phone: '+91 91234 56789',
          username: `vikram.roy.${ts.slice(-4)}`,
          password: 'Password@123',
          role: 'PARENT',
          relationship: 'FATHER',
          occupation: 'Principal Aerospace Engineer',
          isPrimaryContact: true,
          locale: 'bn',
          canPickup: true,
          pickupPin: '4321',
          receivesComm: true,
          childMode: 'CREATE',
          newChild: {
            firstName: 'Aarav',
            lastName: 'Roy',
            dob: '2023-08-15',
            gender: 'MALE',
            branchId: branch.id,
            classroomId: classroom.id,
          },
        }),
      })

      const res = await usersPost(req)
      const json = await res.json()
      if (res.status !== 201) console.error('FAMILY POST /api/v1/users failed:', json)
      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      familyUser = json.data

      // Check View User response
      const viewReq = new NextRequest(`http://localhost/api/v1/users/${familyUser.userId || familyUser.id}`, {
        method: 'GET',
        headers: { Cookie: adminCookie },
      })
      const viewRes = await userGet(viewReq, { params: Promise.resolve({ id: familyUser.userId || familyUser.id }) })
      expect(viewRes.status).toBe(200)
      const viewJson = await viewRes.json()

      const gp = viewJson.data.guardianProfile
      expect(gp).toBeDefined()
      expect(gp.relationship).toBe('FATHER')
      expect(gp.occupation).toBe('Principal Aerospace Engineer')
      expect(gp.isPrimaryContact).toBe(true)
      expect(viewJson.data.locale).toBe('bn')

      // Verify PIN masking
      expect(gp.pickupPin).toBe('••••')
    })

    it('edits family user occupation, primary contact status, pickup rights, and PIN', async () => {
      const userId = familyUser.userId || familyUser.id
      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          fullName: 'Vikramaditya Roy, Ph.D.',
          occupation: 'Chief Scientist & Professor',
          isPrimaryContact: false,
          locale: 'en',
          canPickup: false,
          pickupPin: '9876',
          receivesComm: true,
        }),
      })

      const patchRes = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(patchRes.status).toBe(200)

      // Query database directly
      const dbGuardian = await db.guardian.findFirst({
        where: { tenantId: tenant.id, userId },
        include: { studentLinks: true },
      })

      expect(dbGuardian).toBeDefined()
      expect(dbGuardian?.occupation).toBe('Chief Scientist & Professor')
      expect(dbGuardian?.isPrimaryContact).toBe(false)

      const studentJunction = dbGuardian?.studentLinks[0]
      expect(studentJunction?.canPickup).toBe(false)
      expect(studentJunction?.pickupPin).toBe('9876')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 8: SECURITY & VALIDATION CONSTRAINTS
  // ───────────────────────────────────────────────────────────────────────────
  describe('Phase 3: Validation & Security Constraints', () => {
    it('rejects invalid pickup PIN formats that are not 4-6 digits', async () => {
      const userId = adminUser.id
      const patchReq = new NextRequest(`http://localhost/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          pickupPin: '12', // Too short
        }),
      })

      const res = await userPatch(patchReq, { params: Promise.resolve({ id: userId }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      const errorMsg = typeof json.error === 'object' ? json.error?.message : String(json.error || json.message)
      expect(errorMsg).toContain('PIN')
    })

    it('rejects update requests for nonexistent users with 404', async () => {
      const patchReq = new NextRequest('http://localhost/api/v1/users/nonexistent-id-00000000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          fullName: 'Ghost User',
        }),
      })

      const res = await userPatch(patchReq, { params: Promise.resolve({ id: 'nonexistent-id-00000000' }) })
      expect(res.status).toBe(404)
    })
  })
})

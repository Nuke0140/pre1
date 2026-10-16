import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { GET as progressionGet, POST as progressionPost } from '@/app/api/v1/admissions/progression/[id]/route'
import { AdmissionProgressionService } from '@/lib/admissions/progression-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('PreOne Admission Module: Zero-Retype 1-Click Progression', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchB1: string
  let academicSessionA: string
  let classroomA1: string
  let classroomFull: string
  let teacherUserA: any
  let adminCookieA: string
  let noWriteCookieA: string
  let adminCookieB: string

  let testLeadA: any
  let testAppA: any
  let testLeadIncomplete: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant A
    const tA = await db.tenant.create({
      data: {
        name: `Progression School A ${ts}`,
        code: `PRG_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    // 2. Create Tenant B (cross-tenant security tests)
    const tB = await db.tenant.create({
      data: {
        name: `Progression School B ${ts}`,
        code: `PRG_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 3. Branches
    const br1 = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus',
        code: `BR_PRG1_${ts}`,
        isMain: true,
      },
    })
    branchA1 = br1.id

    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Branch B',
        code: `BR_PRGB_${ts}`,
        isMain: true,
      },
    })
    branchB1 = brB.id

    // 4. Academic Session
    const sessA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })
    academicSessionA = sessA.id

    // 4b. Program
    await db.program.create({
      data: {
        tenantId: tenantA,
        name: 'Nursery Program',
        code: `PROG_NUR_${ts}`,
        programType: 'NURSERY',
        isActive: true,
      },
    })

    // 5. Teachers & Classrooms
    const teacherUser = await db.user.create({
      data: {
        email: `teacher_prg_${ts}@preone.local`,
        fullName: 'Lead Teacher Priya',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    teacherUserA = teacherUser

    const cl1 = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        name: 'Nursery Bluebirds',
        code: `NUR_BLU_${ts}`,
        programType: 'NURSERY',
        capacity: 25,
        isActive: true,
        primaryTeacherId: teacherUser.id,
      },
    })
    classroomA1 = cl1.id

    const clFull = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        name: 'Nursery Robins (Full)',
        code: `NUR_ROB_${ts}`,
        programType: 'NURSERY',
        capacity: 1,
        isActive: true,
        primaryTeacherId: teacherUser.id,
      },
    })
    classroomFull = clFull.id

    // Fill the classroom to capacity
    await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `STU-FULL-${ts}`,
        firstName: 'Existing',
        lastName: 'Student',
        gender: 'MALE',
        dob: new Date('2022-01-01'),
        currentClassroomId: classroomFull,
        status: 'ACTIVE',
      },
    })

    // 6. Users & Session Tokens
    const adminUserA = await db.user.create({
      data: {
        email: `admin_prg_${ts}@preone.local`,
        fullName: 'Admin Principal',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: adminUserA.id,
        role: 'OWNER',
        roles: ['OWNER'],
        branchId: branchA1,
      },
    })
    const tokenAdminA = await signSession({
      uid: adminUserA.id,
      tenantId: tenantA,
      role: 'OWNER',
      roles: ['OWNER'],
      email: adminUserA.email,
      branchId: branchA1,
    })
    adminCookieA = `${SESSION_COOKIE}=${tokenAdminA}`

    const staffNoWriteUser = await db.user.create({
      data: {
        email: `viewer_prg_${ts}@preone.local`,
        fullName: 'Read Only Staff',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: staffNoWriteUser.id,
        role: 'STAFF',
        roles: ['STAFF'], // STAFF has admissions:read but NOT admissions:write in preone rbac
        branchId: branchA1,
      },
    })
    const tokenNoWrite = await signSession({
      uid: staffNoWriteUser.id,
      tenantId: tenantA,
      role: 'STAFF',
      roles: ['STAFF'],
      email: staffNoWriteUser.email,
      branchId: branchA1,
    })
    noWriteCookieA = `${SESSION_COOKIE}=${tokenNoWrite}`

    const adminUserB = await db.user.create({
      data: {
        email: `admin_b_prg_${ts}@preone.local`,
        fullName: 'Tenant B Admin',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB,
        userId: adminUserB.id,
        role: 'OWNER',
        roles: ['OWNER'],
        branchId: branchB1,
      },
    })
    const tokenAdminB = await signSession({
      uid: adminUserB.id,
      tenantId: tenantB,
      role: 'OWNER',
      roles: ['OWNER'],
      email: adminUserB.email,
      branchId: branchB1,
    })
    adminCookieB = `${SESSION_COOKIE}=${tokenAdminB}`

    // 7. Seed Test Lead
    testLeadA = await db.lead.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        leadNumber: `LEAD-${ts}-1`,
        childName: 'Aarav Sharma',
        childDob: new Date('2022-04-10'),
        parentName: 'Rohan Sharma',
        phone: '+919876543210',
        email: 'rohan.sharma@example.com',
        interestedProgram: 'NURSERY',
        status: 'NEW',
        source: 'WALK_IN',
      },
    })

    // Lead with missing phone (incomplete information)
    testLeadIncomplete = await db.lead.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        leadNumber: `LEAD-INCOMP-${ts}`,
        childName: 'Incomplete Lead',
        parentName: 'Parent Y',
        phone: '',
        status: 'NEW',
        source: 'WALK_IN',
      },
    })
  })

  // =========================================================================
  // 1. EVALUATION TESTS (GET /api/v1/admissions/progression/[id])
  // =========================================================================
  it('1. GET /api/v1/admissions/progression/[id] correctly evaluates an Enquiry lead', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${testLeadA.id}`, {
      headers: { cookie: adminCookieA },
    })

    const res = await progressionGet(req, { params: Promise.resolve({ id: testLeadA.id }) })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.data.kind).toBe('LEAD')
    expect(data.data.currentStage).toBe('ENQUIRY')
    expect(data.data.nextStage).toBe('APPLICATION')
    expect(data.data.canPromote).toBe(true)
    expect(data.data.isEligible).toBe(true)
    expect(data.data.candidateDetails.childFullName).toBe('Aarav Sharma')
    expect(data.data.candidateDetails.parentPhone).toBe('+919876543210')
  })

  it('2. GET blocks promotion with actionable reason if lead has missing required phone', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${testLeadIncomplete.id}`, {
      headers: { cookie: adminCookieA },
    })

    const res = await progressionGet(req, { params: Promise.resolve({ id: testLeadIncomplete.id }) })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.data.canPromote).toBe(false)
    expect(data.data.blockedReasons.length).toBeGreaterThan(0)
    expect(data.data.missingFields).toContain('phone')
  })

  // =========================================================================
  // 2. STAGE 1: ENQUIRY -> APPLICATION (Zero Retype)
  // =========================================================================
  let createdApplicationId: string
  it('3. POST /api/v1/admissions/progression/[id] converts Enquiry to Application carrying all candidate details', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${testLeadA.id}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        academicSessionId: academicSessionA,
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: testLeadA.id }) })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.data.success).toBe(true)
    expect(data.data.sourceStage).toBe('ENQUIRY')
    expect(data.data.targetStage).toBe('APPLICATION')
    expect(data.data.applicationId).toBeDefined()

    createdApplicationId = data.data.applicationId

    // Verify database record has all fields retained without retyping
    const app = await db.admissionApplication.findUnique({
      where: { id: createdApplicationId },
    })
    expect(app).toBeDefined()
    expect(app?.childFirstName).toBe('Aarav')
    expect(app?.childLastName).toBe('Sharma')
    expect(app?.parentName).toBe('Rohan Sharma')
    expect(app?.parentPhone).toBe('+919876543210')
    expect(app?.programType).toBe('NURSERY')
    expect(app?.branchId).toBe(branchA1)

    // Verify lead was marked CONVERTED
    const updatedLead = await db.lead.findUnique({ where: { id: testLeadA.id } })
    expect(updatedLead?.status).toBe('CONVERTED')
  })

  // =========================================================================
  // 3. STAGE 2: APPLICATION -> OFFER (Document Checklist Gate)
  // =========================================================================
  it('4a. Rejects promoting Application to Offer when mandatory documents are unverified', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validityDays: 14,
        notes: 'Offered priority admission',
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(422)

    const data = await res.json()
    expect(data.error.message).toContain('required documents are still pending verification')
  })

  it('4b. POST promotes Application to Offer once mandatory documents are verified', async () => {
    // Staff verifies required documents in database
    await db.applicationDocument.updateMany({
      where: { applicationId: createdApplicationId },
      data: { status: 'VERIFIED', verified: true },
    })

    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validityDays: 14,
        notes: 'Offered priority admission',
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.data.success).toBe(true)
    expect(data.data.sourceStage).toBe('APPLICATION')
    expect(data.data.targetStage).toBe('OFFER')

    // Verify Offer record created in DB
    const offers = await db.admissionOffer.findMany({
      where: { applicationId: createdApplicationId },
    })
    expect(offers.length).toBeGreaterThan(0)
    expect(offers[0].status).toBe('ISSUED')
  })

  // =========================================================================
  // 4. STAGE 3: OFFER -> FEE RECEIVED (Authoritative Payment Gate)
  // =========================================================================
  it('5. Rejects moving Offer to FEE_RECEIVED when payment is unverified without transaction', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // No offlinePayment provided
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(422)

    const err = await res.json()
    expect(err.error.code).toBe('PROMOTION_FAILED')
    expect(err.error.message).toContain('payment')
  })

  it('6. Allows transition to FEE_RECEIVED when authoritative offline payment is recorded', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offlinePayment: {
          amountRupees: 25000,
          method: 'UPI',
          transactionRef: 'UPI-TXN-123456',
        },
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.data.success).toBe(true)
    expect(data.data.sourceStage).toBe('OFFER')
    expect(data.data.targetStage).toBe('FEE_RECEIVED')
    expect(data.data.receiptNumber).toBeDefined()

    // Verify real Payment and Receipt entries exist in DB
    const receipt = await db.receipt.findFirst({
      where: { tenantId: tenantA, receiptNumber: data.data.receiptNumber },
      include: { payment: true },
    })
    expect(receipt).toBeDefined()
    expect(receipt?.amountCents).toBe(2500000)
    expect(receipt?.payment.method).toBe('UPI')
    expect(receipt?.payment.status).toBe('SUCCESS')
  })

  // =========================================================================
  // 5. STAGE 4: FEE RECEIVED -> ENROLLED STUDENT (Celebration & Placement)
  // =========================================================================
  it('7. Rejects enrollment if selected classroom is full (capacity constraint)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classroomId: classroomFull,
        seatNumber: 'S-99',
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(422)

    const err = await res.json()
    expect(err.error.message).toContain('capacity')
  })

  let finalizedStudentId: string
  it('8. Successfully finalizes enrollment into available classroom with seat and welcome kit', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classroomId: classroomA1,
        seatNumber: 'A-01',
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.data.success).toBe(true)
    expect(data.data.sourceStage).toBe('FEE_RECEIVED')
    expect(data.data.targetStage).toBe('ENROLLED')
    expect(data.data.studentId).toBeDefined()
    expect(data.data.admissionNo).toBeDefined()
    expect(data.data.welcomeKit).toBeDefined()
    expect(data.data.welcomeKit.status).toBe('GENERATED')

    finalizedStudentId = data.data.studentId

    // Verify Canonical Student Record & Guardian profile
    const student = await db.student.findUnique({
      where: { id: finalizedStudentId },
      include: {
        guardians: { include: { guardian: true } },
        currentClassroom: true,
      },
    })
    expect(student).toBeDefined()
    expect(student?.firstName).toBe('Aarav')
    expect(student?.lastName).toBe('Sharma')
    expect(student?.currentClassroomId).toBe(classroomA1)
    expect(student?.status).toBe('ACTIVE')

    // Verify Guardian was linked without retyping
    expect(student?.guardians.length).toBeGreaterThan(0)
    const primaryG = student?.guardians[0].guardian
    expect(primaryG.fullName).toBe('Rohan Sharma')
    expect(primaryG.phone).toBe('+919876543210')

    // Verify Application status is ENROLLED
    const updatedApp = await db.admissionApplication.findUnique({
      where: { id: createdApplicationId },
    })
    expect(updatedApp?.status).toBe('ENROLLED')
    expect(updatedApp?.studentId).toBe(finalizedStudentId)
  })

  // =========================================================================
  // 6. IDEMPOTENCY & CONCURRENCY
  // =========================================================================
  it('9. Idempotency: Retrying enrollment on an already enrolled application returns clean handled result', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classroomId: classroomA1,
        seatNumber: 'A-01',
      }),
    })

    const res = await progressionPost(req, { params: Promise.resolve({ id: createdApplicationId }) })
    // Either handles with 201 isAlreadyProcessed or terminal stage notice
    if (res.status === 201) {
      const data = await res.json()
      expect(data.data.studentId).toBe(finalizedStudentId)
      expect(data.data.isAlreadyProcessed).toBe(true)
    } else {
      expect(res.status).toBe(422)
    }

    // Verify no duplicate student was created
    const studentCount = await db.student.count({
      where: {
        tenantId: tenantA,
        firstName: 'Aarav',
        lastName: 'Sharma',
      },
    })
    expect(studentCount).toBe(1)
  })

  // =========================================================================
  // 7. SECURITY & AUTHORIZATION (Cross-tenant & RBAC)
  // =========================================================================
  it('10. Security: Tenant B cannot evaluate or promote Tenant A admissions (Multi-tenant isolation)', async () => {
    const getReq = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      headers: { cookie: adminCookieB },
    })
    const getRes = await progressionGet(getReq, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(getRes.status).toBe(404)

    const postReq = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: { cookie: adminCookieB },
    })
    const postRes = await progressionPost(postReq, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(postRes.status).toBe(404)
  })

  it('11. Security: User without admissions:write cannot execute stage promotion (RBAC enforcement)', async () => {
    const postReq = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${createdApplicationId}`, {
      method: 'POST',
      headers: {
        cookie: noWriteCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classroomId: classroomA1,
      }),
    })

    const postRes = await progressionPost(postReq, { params: Promise.resolve({ id: createdApplicationId }) })
    expect(postRes.status).toBe(403)
  })
})

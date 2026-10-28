import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as getPayments, POST as createPayment } from '@/app/api/v1/payments/route'
import { GET as getAdmissionProgression, POST as postAdmissionProgression } from '@/app/api/v1/admissions/progression/[id]/route'
import { GET as getBranches } from '@/app/api/v1/branches/route'
import { UserRole } from '@prisma/client'

/**
 * PRE1-BRANCH-ISOLATION-001: P1 Remediation Regression Test Suite
 *
 * Verifies fixes for:
 * 1. F-ISO-01: Branch-scoped staff cannot list or record payments for foreign branches.
 * 2. F-ISO-02: Branch-scoped staff cannot retrieve or promote admission progression for foreign branch records.
 * 3. F-ISO-03: GET /api/v1/branches database failure fails closed without leaking mock data.
 * 4. Multi-branch staff assignment support.
 * 5. Owner/Principal multi-campus authority within tenant.
 * 6. Cross-tenant rejection.
 */

describe('PRE1-BRANCH-ISOLATION-001: P1 Remediation Suite', () => {
  const timestamp = Date.now()
  const tenantACode = `TENANT_A_${timestamp}`
  const tenantBCode = `TENANT_B_${timestamp}`

  let tenantAId = ''
  let tenantBId = ''
  let branchA1Id = ''
  let branchA2Id = ''
  let branchB1Id = ''

  let ownerAToken = ''
  let accountsA1Token = ''
  let accountsMultiToken = ''
  let receptionistA1Token = ''
  let ownerBToken = ''

  let studentA1Id = ''
  let studentA2Id = ''
  let studentB1Id = ''

  let feeScheduleA1Id = ''
  let feeScheduleA2Id = ''

  let leadA1Id = ''
  let leadA2Id = ''

  beforeAll(async () => {
    // 1. Create Tenant A with 2 branches
    const tenantA = await db.tenant.create({
      data: { name: 'Acme School A', code: tenantACode, status: 'ACTIVE' },
    })
    tenantAId = tenantA.id

    const branchA1 = await db.branch.create({
      data: { tenantId: tenantAId, name: 'Branch A1', code: `BA1_${timestamp}`, isMain: true },
    })
    branchA1Id = branchA1.id

    const branchA2 = await db.branch.create({
      data: { tenantId: tenantAId, name: 'Branch A2', code: `BA2_${timestamp}`, isMain: false },
    })
    branchA2Id = branchA2.id

    // 2. Create Tenant B with 1 branch
    const tenantB = await db.tenant.create({
      data: { name: 'Beta School B', code: tenantBCode, status: 'ACTIVE' },
    })
    tenantBId = tenantB.id

    const branchB1 = await db.branch.create({
      data: { tenantId: tenantBId, name: 'Branch B1', code: `BB1_${timestamp}`, isMain: true },
    })
    branchB1Id = branchB1.id

    // 3. Create Users
    // Owner A
    const userOwnerA = await db.user.create({
      data: { email: `owner_a_${timestamp}@test.pre1`, fullName: 'Owner A', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userOwnerA.id, role: 'OWNER', status: 'ACTIVE' },
    })
    ownerAToken = await signSession({
      uid: userOwnerA.id,
      email: userOwnerA.email!,
      name: userOwnerA.fullName,
      tenantId: tenantAId,
      role: 'OWNER',
    })

    // Accounts A1 (Single branch: A1)
    const userAccA1 = await db.user.create({
      data: { email: `acc_a1_${timestamp}@test.pre1`, fullName: 'Accounts A1', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userAccA1.id, role: 'ACCOUNTS', branchId: branchA1Id, status: 'ACTIVE' },
    })
    accountsA1Token = await signSession({
      uid: userAccA1.id,
      email: userAccA1.email!,
      name: userAccA1.fullName,
      tenantId: tenantAId,
      branchId: branchA1Id,
      role: 'ACCOUNTS',
    })

    // Accounts Multi (Assigned to A1 & A2)
    const userAccMulti = await db.user.create({
      data: { email: `acc_multi_${timestamp}@test.pre1`, fullName: 'Accounts Multi', passwordHash: 'hash' },
    })
    const tuMulti = await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userAccMulti.id, role: 'ACCOUNTS', branchId: branchA1Id, status: 'ACTIVE' },
    })
    // Attach multi-branch junction records
    await db.tenantUserBranch.createMany({
      data: [
        { tenantId: tenantAId, tenantUserId: tuMulti.id, branchId: branchA1Id, isPrimary: true },
        { tenantId: tenantAId, tenantUserId: tuMulti.id, branchId: branchA2Id, isPrimary: false },
      ],
    })
    accountsMultiToken = await signSession({
      uid: userAccMulti.id,
      email: userAccMulti.email!,
      name: userAccMulti.fullName,
      tenantId: tenantAId,
      branchId: branchA1Id,
      role: 'ACCOUNTS',
    })

    // Receptionist A1 (Single branch: A1)
    const userRecA1 = await db.user.create({
      data: { email: `rec_a1_${timestamp}@test.pre1`, fullName: 'Receptionist A1', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userRecA1.id, role: 'RECEPTIONIST', branchId: branchA1Id, status: 'ACTIVE' },
    })
    receptionistA1Token = await signSession({
      uid: userRecA1.id,
      email: userRecA1.email!,
      name: userRecA1.fullName,
      tenantId: tenantAId,
      branchId: branchA1Id,
      role: 'RECEPTIONIST',
    })

    // Owner B
    const userOwnerB = await db.user.create({
      data: { email: `owner_b_${timestamp}@test.pre1`, fullName: 'Owner B', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantBId, userId: userOwnerB.id, role: 'OWNER', status: 'ACTIVE' },
    })
    ownerBToken = await signSession({
      uid: userOwnerB.id,
      email: userOwnerB.email!,
      name: userOwnerB.fullName,
      tenantId: tenantBId,
      role: 'OWNER',
    })

    // 4. Create Students & FeeSchedules
    const studentA1 = await db.student.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA1Id,
        firstName: 'Child',
        lastName: 'A1',
        admissionNo: `ADM_A1_${timestamp}`,
        dob: new Date('2021-01-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })
    studentA1Id = studentA1.id

    const studentA2 = await db.student.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA2Id,
        firstName: 'Child',
        lastName: 'A2',
        admissionNo: `ADM_A2_${timestamp}`,
        dob: new Date('2021-02-01'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })
    studentA2Id = studentA2.id

    const studentB1 = await db.student.create({
      data: {
        tenantId: tenantBId,
        branchId: branchB1Id,
        firstName: 'Child',
        lastName: 'B1',
        admissionNo: `ADM_B1_${timestamp}`,
        dob: new Date('2021-03-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })
    studentB1Id = studentB1.id

    // Payments in Branch A1, A2, B1
    await db.payment.create({
      data: {
        tenantId: tenantAId,
        studentId: studentA1Id,
        paymentNumber: `PAY_A1_${timestamp}`,
        amountCents: 150000,
        method: 'UPI',
        status: 'SUCCESS',
        transactionRef: `REF_A1_${timestamp}`,
        paymentDate: new Date(),
      },
    })

    await db.payment.create({
      data: {
        tenantId: tenantAId,
        studentId: studentA2Id,
        paymentNumber: `PAY_A2_${timestamp}`,
        amountCents: 250000,
        method: 'CASH',
        status: 'SUCCESS',
        transactionRef: `REF_A2_${timestamp}`,
        paymentDate: new Date(),
      },
    })

    await db.payment.create({
      data: {
        tenantId: tenantBId,
        studentId: studentB1Id,
        paymentNumber: `PAY_B1_${timestamp}`,
        amountCents: 350000,
        method: 'ONLINE',
        status: 'SUCCESS',
        transactionRef: `REF_B1_${timestamp}`,
        paymentDate: new Date(),
      },
    })

    // 5. Create Leads for Admission Progression
    const leadA1 = await db.lead.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA1Id,
        leadNumber: `LEAD_A1_${timestamp}`,
        childName: 'Candidate A1',
        parentName: 'Parent A1',
        phone: '9876543210',
        status: 'NEW',
      },
    })
    leadA1Id = leadA1.id

    const leadA2 = await db.lead.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA2Id,
        leadNumber: `LEAD_A2_${timestamp}`,
        childName: 'Candidate A2',
        parentName: 'Parent A2',
        phone: '9876543211',
        status: 'NEW',
      },
    })
    leadA2Id = leadA2.id
  })

  afterAll(async () => {
    // Cleanup synthetic fixtures
    await db.payment.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.lead.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.student.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.tenantUserBranch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.tenantUser.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } }).catch(() => {})
    await db.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } }).catch(() => {})
  })

  // ──────────────────────────────────────────────────────────────────────────
  // F-ISO-01: PAYMENTS API BRANCH ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('F-ISO-01: Payments API Branch Scoping', () => {
    it('Branch A1 Accounts user only sees Branch A1 payments and cannot see Branch A2 payments', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/payments', {
        headers: { cookie: `preone_session=${accountsA1Token}` },
      })
      const res = await getPayments(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      // Must only return Branch A1 payment
      expect(json.data.length).toBe(1)
      expect(json.data[0].studentName).toContain('Child A1')
    })

    it('Branch A1 Accounts user is rejected when requesting ?branchId=BranchA2 with 403 Forbidden', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/payments?branchId=${branchA2Id}`, {
        headers: { cookie: `preone_session=${accountsA1Token}` },
      })
      const res = await getPayments(req)
      expect(res.status).toBe(403)
    })

    it('Multi-branch staff assigned to A1 and A2 sees both branch payments', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/payments', {
        headers: { cookie: `preone_session=${accountsMultiToken}` },
      })
      const res = await getPayments(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(2)
      const studentNames = json.data.map((p: any) => p.studentName)
      expect(studentNames).toContain('Child A1')
      expect(studentNames).toContain('Child A2')
    })

    it('Owner A has institution-wide scope and sees all branches in Tenant A', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/payments', {
        headers: { cookie: `preone_session=${ownerAToken}` },
      })
      const res = await getPayments(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(2)
    })

    it('Owner B cannot see Tenant A payments (Cross-Tenant Quarantine)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/payments', {
        headers: { cookie: `preone_session=${ownerBToken}` },
      })
      const res = await getPayments(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].studentName).toContain('Child B1')
    })

    it('Branch A1 Accounts user is rejected when recording payment for Branch A2 student (403 Forbidden)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/payments', {
        method: 'POST',
        headers: {
          cookie: `preone_session=${accountsA1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeScheduleId: 'dummy-schedule-id',
          studentId: studentA2Id,
          amountRupees: 500,
          method: 'UPI',
        }),
      })
      const res = await createPayment(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error.message).toContain('Access denied')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // F-ISO-02: ADMISSION PROGRESSION API BRANCH ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('F-ISO-02: Admission Progression API Branch Scoping', () => {
    it('Branch A1 Receptionist can evaluate progression for Branch A1 lead', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${leadA1Id}`, {
        headers: { cookie: `preone_session=${receptionistA1Token}` },
      })
      const res = await getAdmissionProgression(req, { params: Promise.resolve({ id: leadA1Id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.currentStage).toBe('ENQUIRY')
      expect(json.data.nextStage).toBe('APPLICATION')
    })

    it('Branch A1 Receptionist is blocked from evaluating Branch A2 lead (403 Forbidden)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${leadA2Id}`, {
        headers: { cookie: `preone_session=${receptionistA1Token}` },
      })
      const res = await getAdmissionProgression(req, { params: Promise.resolve({ id: leadA2Id }) })
      expect(res.status).toBe(403)
    })

    it('Branch A1 Receptionist cannot bypass branch boundary by passing ?branchId=BranchA2 in query string', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${leadA2Id}?branchId=${branchA2Id}`, {
        headers: { cookie: `preone_session=${receptionistA1Token}` },
      })
      const res = await getAdmissionProgression(req, { params: Promise.resolve({ id: leadA2Id }) })
      expect(res.status).toBe(403)
    })

    it('Branch A1 Receptionist is blocked from promoting Branch A2 lead in POST (403 Forbidden)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${leadA2Id}`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${receptionistA1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId: branchA2Id }),
      })
      const res = await postAdmissionProgression(req, { params: Promise.resolve({ id: leadA2Id }) })
      expect(res.status).toBe(403)
    })

    it('Owner A can evaluate admission progression across all campuses in Tenant A', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/progression/${leadA2Id}`, {
        headers: { cookie: `preone_session=${ownerAToken}` },
      })
      const res = await getAdmissionProgression(req, { params: Promise.resolve({ id: leadA2Id }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.currentStage).toBe('ENQUIRY')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // F-ISO-03: BRANCHES API ERROR SANITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('F-ISO-03: Branches API Error Handling', () => {
    it('GET /api/v1/branches returns tenant branches on success without synthetic demo leaks', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/branches', {
        headers: { cookie: `preone_session=${ownerAToken}` },
      })
      const res = await getBranches(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(2)
      // Verify no hardcoded demo fallback in success payload
      const codes = json.data.map((b: any) => b.code)
      expect(codes).not.toContain('MAIN')
    })

    it('GET /api/v1/branches fails closed with 500 system error on database exception rather than returning mock data', async () => {
      const origFindMany = db.branch.findMany
      try {
        db.branch.findMany = (() => Promise.reject(new Error('Simulated DB network partition'))) as any
        const req = new NextRequest('http://localhost:3000/api/v1/branches', {
          headers: { cookie: `preone_session=${ownerAToken}` },
        })
        const res = await getBranches(req)
        expect(res.status).toBe(500)
        const json = await res.json()
        expect(json.success).toBe(false)
        expect(json.error).toBeDefined()
        // Ensure mock sunshine data is NEVER returned
        const text = JSON.stringify(json)
        expect(text).not.toContain('sunshine')
        expect(text).not.toContain('Sunshine Preschool')
      } finally {
        db.branch.findMany = origFindMany
      }
    })
  })
})

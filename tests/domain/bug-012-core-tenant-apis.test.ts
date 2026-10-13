import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { healthMetrics } from '@/lib/logger'

// Route Handlers under test
import { GET as setupStatusGet } from '@/app/api/v1/setup/status/route'
import { GET as setupDependenciesGet } from '@/app/api/v1/setup/dependencies/route'
import { GET as studentsGet } from '@/app/api/v1/students/route'
import { GET as studentsDashboardGet } from '@/app/api/v1/students/dashboard/route'
import { GET as feeStructuresGet } from '@/app/api/v1/fee-structures/route'
import { GET as depositsGet } from '@/app/api/v1/deposits/route'
import { GET as paymentsGet } from '@/app/api/v1/payments/route'
import { GET as feeSchedulesGet } from '@/app/api/v1/fee-schedules/route'

describe('BUG-012: Core Authenticated Tenant Data APIs Regression Suite', () => {
  const ts = Date.now().toString()

  // Tenant 1: Seeded with academic session, branch, class, student, fee structure
  let tenant1: any
  let branch1: any
  let session1: any
  let classroom1: any
  let student1: any
  let feeStructure1: any
  let feeItem1: any
  let feeSchedule1: any
  let deposit1: any
  let payment1: any
  let user1: any
  let token1: string

  // Tenant 2: Completely uninitialized (no academic session, 0 branches, 0 students)
  let tenant2: any
  let user2: any
  let token2: string

  beforeAll(async () => {
    // 1. Initialize Tenant 1 (Configured)
    tenant1 = await db.tenant.create({
      data: {
        code: `BUG12-CFG-${ts.slice(-5)}`,
        name: `Configured Preschool ${ts.slice(-5)}`,
        status: 'ACTIVE',
      },
    })

    branch1 = await db.branch.create({
      data: {
        tenantId: tenant1.id,
        name: 'Main Campus',
        code: `MC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    session1 = await db.academicSession.create({
      data: {
        tenantId: tenant1.id,
        name: `Academic Year ${ts.slice(-4)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    classroom1 = await db.classroom.create({
      data: {
        tenantId: tenant1.id,
        branchId: branch1.id,
        academicSessionId: session1.id,
        name: `Nursery A ${ts.slice(-4)}`,
        code: `NUR-${ts.slice(-4)}`,
        capacity: 20,
        programType: 'PLAYGROUP',
        isActive: true,
      },
    })

    user1 = await db.user.create({
      data: {
        email: `admin-cfg-${ts.slice(-5)}@example.com`,
        fullName: 'Principal Config',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant1.id,
            branchId: branch1.id,
            role: 'OWNER',
          },
        },
      },
    })

    token1 = await signSession({
      uid: user1.id,
      email: user1.email,
      name: user1.fullName,
      role: 'OWNER',
      tenantId: tenant1.id,
      branchId: branch1.id,
    })

    student1 = await db.student.create({
      data: {
        tenantId: tenant1.id,
        branchId: branch1.id,
        currentClassroomId: classroom1.id,
        admissionNo: `ADM-${ts.slice(-5)}`,
        firstName: 'Ananya',
        lastName: 'Sharma',
        dob: new Date('2022-05-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    feeStructure1 = await db.feeStructure.create({
      data: {
        tenantId: tenant1.id,
        branchId: branch1.id,
        academicSessionId: session1.id,
        classroomId: classroom1.id,
        name: 'Standard Nursery Fee',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-01'),
        effectiveTo: new Date('2027-03-31'),
      },
    })

    feeItem1 = await db.feeItem.create({
      data: {
        tenantId: tenant1.id,
        feeStructureId: feeStructure1.id,
        name: 'Tuition Fee Term 1',
        feeType: 'REGULAR',
        amountCents: 1500000,
        frequency: 'ONE_TIME',
      },
    })

    feeSchedule1 = await db.studentFeeSchedule.create({
      data: {
        tenantId: tenant1.id,
        studentId: student1.id,
        feeStructureId: feeStructure1.id,
        feeItemId: feeItem1.id,
        period: 'TERM_1',
        dueDate: new Date('2026-06-01'),
        amountDueCents: 1500000,
        amountPaidCents: 500000,
        remainingAmountCents: 1000000,
        status: 'PARTIALLY_PAID',
      },
    })

    deposit1 = await db.studentDeposit.create({
      data: {
        tenantId: tenant1.id,
        studentId: student1.id,
        name: 'Caution Deposit',
        totalAmountCents: 1000000,
        refundedAmountCents: 0,
        remainingAmountCents: 1000000,
        status: 'HELD',
      },
    })

    payment1 = await db.payment.create({
      data: {
        tenantId: tenant1.id,
        studentId: student1.id,
        paymentNumber: `PAY-${ts.slice(-5)}`,
        amountCents: 500000,
        method: 'UPI',
        status: 'SUCCESS',
        paymentDate: new Date(),
      },
    })

    // 2. Initialize Tenant 2 (Brand New / Uninitialized)
    tenant2 = await db.tenant.create({
      data: {
        code: `BUG12-NEW-${ts.slice(-5)}`,
        name: `Brand New Preschool ${ts.slice(-5)}`,
        status: 'ACTIVE',
      },
    })

    user2 = await db.user.create({
      data: {
        email: `admin-new-${ts.slice(-5)}@example.com`,
        fullName: 'Principal New',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant2.id,
            role: 'OWNER',
          },
        },
      },
    })

    token2 = await signSession({
      uid: user2.id,
      email: user2.email,
      name: user2.fullName,
      role: 'OWNER',
      tenantId: tenant2.id,
    })
  })

  afterAll(async () => {
    // Cleanup created test records
    const tenantIds = [tenant1?.id, tenant2?.id].filter(Boolean)
    if (tenantIds.length > 0) {
      await db.payment.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.studentDeposit.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.studentFeeSchedule.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.feeItem.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.feeStructure.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.student.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.classroom.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.academicSession.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.tenantUser.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.user.deleteMany({ where: { id: { in: [user1?.id, user2?.id].filter(Boolean) } } }).catch(() => {})
      await db.branch.deleteMany({ where: { tenantId: { in: tenantIds } } }).catch(() => {})
      await db.tenant.deleteMany({ where: { id: { in: tenantIds } } }).catch(() => {})
    }
  })

  function createAuthRequest(url: string, token?: string) {
    const headers = new Headers()
    if (token) {
      headers.set('Cookie', `${SESSION_COOKIE}=${token}`)
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      headers,
    })
  }

  describe('Scenario 1: Configured Tenant with Active Academic Session & Data', () => {
    it('1. GET /api/v1/setup/status returns 200 with setup phases and steps', async () => {
      const req = createAuthRequest('/api/v1/setup/status', token1)
      const res = await setupStatusGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.steps).toBeDefined()
      expect(Array.isArray(json.data.steps)).toBe(true)
      expect(json.data.steps.length).toBeGreaterThan(0)
    })

    it('2. GET /api/v1/setup/dependencies returns 200 with summary counts', async () => {
      const req = createAuthRequest('/api/v1/setup/dependencies', token1)
      const res = await setupDependenciesGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.summary).toBeDefined()
      expect(json.data.summary.branches).toBe(1)
      expect(json.data.summary.academicYears).toBe(1)
      expect(json.data.summary.classes).toBe(1)
      expect(json.data.summary.students).toBe(1)
    })

    it('3. GET /api/v1/students returns 200 with populated student list and pagination', async () => {
      const req = createAuthRequest('/api/v1/students', token1)
      const res = await studentsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].id).toBe(student1.id)
      expect(json.data[0].firstName).toBe('Ananya')
      expect(json.meta).toBeDefined()
      expect(json.meta.total).toBe(1)
    })

    it('4. Data parity: listStudents and students/dashboard counts are strictly aligned', async () => {
      const listReq = createAuthRequest('/api/v1/students', token1)
      const listRes = await studentsGet(listReq)
      const listJson = await listRes.json()

      const dashReq = createAuthRequest('/api/v1/students/dashboard', token1)
      const dashRes = await studentsDashboardGet(dashReq)
      const dashJson = await dashRes.json()

      expect(dashRes.status).toBe(200)
      expect(dashJson.success).toBe(true)
      expect(dashJson.data.totalStudents).toBe(listJson.meta.total)
      expect(dashJson.data.totalStudents).toBe(listJson.data.length)
    })

    it('5. GET /api/v1/fee-structures returns 200 with configured fee structures', async () => {
      const req = createAuthRequest('/api/v1/fee-structures', token1)
      const res = await feeStructuresGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].name).toBe('Standard Nursery Fee')
      expect(json.data[0].items.length).toBe(1)
    })

    it('6. GET /api/v1/deposits returns 200 with deposit records', async () => {
      const req = createAuthRequest('/api/v1/deposits', token1)
      const res = await depositsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].id).toBe(deposit1.id)
      expect(json.data[0].studentName).toBe('Ananya Sharma')
    })

    it('7. GET /api/v1/payments returns 200 with payment transactions', async () => {
      const req = createAuthRequest('/api/v1/payments', token1)
      const res = await paymentsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].id).toBe(payment1.id)
      expect(json.data[0].paymentNumber).toBe(payment1.paymentNumber)
    })

    it('8. GET /api/v1/fee-schedules returns 200 with student fee installments', async () => {
      const req = createAuthRequest('/api/v1/fee-schedules', token1)
      const res = await feeSchedulesGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
      expect(json.data[0].studentName).toBe('Ananya Sharma')
    })
  })

  describe('Scenario 2: Uninitialized Tenant with NO Academic Session & 0 Records', () => {
    it('1. GET /api/v1/setup/status does NOT crash (returns 200 with initial steps)', async () => {
      const req = createAuthRequest('/api/v1/setup/status', token2)
      const res = await setupStatusGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(['NOT_STARTED', 'BLOCKED', 'IN_PROGRESS']).toContain(json.data.status)
      expect(json.data.progress).toBe(0)
      expect(json.data.steps.length).toBeGreaterThan(0)
    })

    it('2. GET /api/v1/setup/dependencies returns 200 with zero summary counts', async () => {
      const req = createAuthRequest('/api/v1/setup/dependencies', token2)
      const res = await setupDependenciesGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.summary.branches).toBe(0)
      expect(json.data.summary.academicYears).toBe(0)
      expect(json.data.summary.classes).toBe(0)
      expect(json.data.summary.students).toBe(0)
    })

    it('3. GET /api/v1/students does NOT throw 500 SYSTEM_001; returns empty array []', async () => {
      const req = createAuthRequest('/api/v1/students', token2)
      const res = await studentsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(0)
      expect(json.meta).toBeDefined()
      expect(json.meta.total).toBe(0)
    })

    it('4. GET /api/v1/students/dashboard returns 200 with zero counts for uninitialized tenant', async () => {
      const req = createAuthRequest('/api/v1/students/dashboard', token2)
      const res = await studentsDashboardGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.totalStudents).toBe(0)
      expect(json.data.activeStudents).toBe(0)
      expect(json.data.averageAttendanceRate).toBeDefined()
    })

    it('5. GET /api/v1/fee-structures returns 200 with empty array []', async () => {
      const req = createAuthRequest('/api/v1/fee-structures', token2)
      const res = await feeStructuresGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(0)
    })

    it('6. GET /api/v1/deposits returns 200 with empty array []', async () => {
      const req = createAuthRequest('/api/v1/deposits', token2)
      const res = await depositsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(0)
    })

    it('7. GET /api/v1/payments returns 200 with empty array []', async () => {
      const req = createAuthRequest('/api/v1/payments', token2)
      const res = await paymentsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(0)
    })

    it('8. GET /api/v1/fee-schedules returns 200 with empty array []', async () => {
      const req = createAuthRequest('/api/v1/fee-schedules', token2)
      const res = await feeSchedulesGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(0)
    })
  })

  describe('Scenario 3: Security & Multi-Tenant Data Isolation', () => {
    it('1. Unauthenticated request without session returns 401 AUTH_001', async () => {
      const req = createAuthRequest('/api/v1/students')
      const res = await studentsGet(req)
      expect(res.status).toBe(401)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('AUTH_001')
    })

    it('2. Tenant 2 cannot see Tenant 1 data (strict tenant isolation)', async () => {
      // Query students as Tenant 2
      const stReq = createAuthRequest('/api/v1/students', token2)
      const stRes = await studentsGet(stReq)
      const stJson = await stRes.json()
      expect(stJson.data.length).toBe(0)

      // Query fee structures as Tenant 2
      const fsReq = createAuthRequest('/api/v1/fee-structures', token2)
      const fsRes = await feeStructuresGet(fsReq)
      const fsJson = await fsRes.json()
      expect(fsJson.data.length).toBe(0)

      // Query deposits as Tenant 2
      const depReq = createAuthRequest('/api/v1/deposits', token2)
      const depRes = await depositsGet(depReq)
      const depJson = await depRes.json()
      expect(depJson.data.length).toBe(0)

      // Query payments as Tenant 2
      const payReq = createAuthRequest('/api/v1/payments', token2)
      const payRes = await paymentsGet(payReq)
      const payJson = await payRes.json()
      expect(payJson.data.length).toBe(0)
    })
  })

  describe('Scenario 4: Endpoint Observability & 5xx Alerting', () => {
    it('HealthMetricsAggregator records endpoint requests and detects elevated 5xx error rates', () => {
      // Record requests to meet the min requests threshold (5)
      healthMetrics.recordRequest('/api/v1/students', 'GET', 200, 45)
      healthMetrics.recordRequest('/api/v1/students', 'GET', 200, 50)
      healthMetrics.recordRequest('/api/v1/students', 'GET', 500, 150)
      healthMetrics.recordRequest('/api/v1/students', 'GET', 500, 200)
      healthMetrics.recordRequest('/api/v1/students', 'GET', 500, 180)

      const snapshot = healthMetrics.getSnapshot()
      expect(snapshot.endpointMetrics).toBeDefined()

      const studentMetric = snapshot.endpointMetrics['GET /api/v1/students']
      expect(studentMetric).toBeDefined()
      expect(studentMetric.totalRequests).toBeGreaterThanOrEqual(5)
      expect(studentMetric.serverErrors5xx).toBeGreaterThanOrEqual(3)
      expect(studentMetric.elevated5xxAlert).toBe(true)
    })
  })
})

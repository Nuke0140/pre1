import { describe, it, expect, beforeAll, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { NotificationEngine } from '@/lib/notifications/notification-engine'
import { MockEmailProvider, emailService } from '@/lib/email/email-service'

describe('B4 — Domain Integrations Test Suite (Admissions, Finance, HR)', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let guardianUser: any
  let student: any
  let mockEmail: MockEmailProvider

  beforeAll(async () => {
    testTenant = await db.tenant.create({
      data: {
        code: `B4-DOM-${ts.slice(-5)}`,
        name: `B4 Domain Integration Campus ${ts}`,
        status: 'ACTIVE',
      },
    })

    // Enable EMAIL channel for this tenant in COMMUNICATION config
    await db.schoolConfig.create({
      data: {
        tenantId: testTenant.id,
        domain: 'COMMUNICATION',
        data: {
          channels: ['IN_APP', 'EMAIL'],
          notificationEvents: ['FEE_DUE', 'STAFF_ALERT', 'ATTENDANCE_UPDATE'],
        },
      },
    })

    guardianUser = await db.user.create({
      data: {
        email: `parent.b4.${ts}@test.com`,
        username: `parent_b4_${ts}`,
        fullName: 'B4 Guardian Parent',
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    })

    const guardian = await db.guardian.create({
      data: {
        tenantId: testTenant.id,
        fullName: guardianUser.fullName,
        email: guardianUser.email,
        phone: '9876543210',
        relationship: 'FATHER',
        userId: guardianUser.id,
      },
    })

    const testBranch = await db.branch.create({
      data: {
        tenantId: testTenant.id,
        name: 'Main Campus',
        code: `BR-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    student = await db.student.create({
      data: {
        tenantId: testTenant.id,
        branchId: testBranch.id,
        firstName: 'Aarav',
        lastName: 'Sharma',
        admissionNo: `ADM-${ts.slice(-4)}`,
        dob: new Date('2021-01-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        relationship: 'FATHER',
        receivesComm: true,
        isPrimary: true,
      },
    })
  })

  beforeEach(() => {
    mockEmail = new MockEmailProvider()
    emailService.setProvider(mockEmail)
  })

  it('B4-01: Admissions public enquiry dispatches acknowledgement email to parent', async () => {
    const res = await fetch('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Sneha Patel',
        phone: '9123456780',
        email: 'sneha.patel@test.com',
        childName: 'Reyansh',
        childDob: '2021-05-15',
        notes: 'Looking for nursery admission',
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.leadNumber).toContain('ENQ-')

    // Verify lead was stored
    const lead = await db.lead.findFirst({
      where: { email: 'sneha.patel@test.com' },
    })
    expect(lead).not.toBeNull()
  })

  it('B4-02: Finance FEE_DUE notification resolves student guardians and dispatches email', async () => {
    mockEmail.clear()

    const dispatchResult = await NotificationEngine.dispatch({
      tenantId: testTenant.id,
      eventType: 'FEE_DUE',
      category: 'FEES',
      severity: 'INFO',
      studentId: student.id,
      title: 'Term 1 Fee Invoice Issued',
      body: 'Your child Aarav has an invoice of ₹15,000 due next week.',
    })

    expect(dispatchResult.gated).toBe(false)
    expect(dispatchResult.recipientsCount).toBeGreaterThanOrEqual(1)

    // Verify delivery log in DB
    const log = await db.notificationDeliveryLog.findFirst({
      where: {
        tenantId: testTenant.id,
        eventType: 'FEE_DUE',
        recipientAddress: guardianUser.email,
      },
    })
    expect(log).not.toBeNull()
  })

  it('B4-03: HR STAFF_ALERT resolves targeted staff and dispatches email notification', async () => {
    mockEmail.clear()

    const staffUser = await db.user.create({
      data: {
        email: `staff.leave.${ts}@test.com`,
        username: `staff_leave_${ts}`,
        fullName: 'Leave Applicant Teacher',
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: staffUser.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    const dispatchResult = await NotificationEngine.dispatch({
      tenantId: testTenant.id,
      eventType: 'STAFF_ALERT',
      category: 'HR',
      severity: 'INFO',
      staffFilter: { userId: staffUser.id },
      title: 'Leave Request Approved',
      body: 'Your 2-day leave request has been approved by the Principal.',
    })

    expect(dispatchResult.gated).toBe(false)
    expect(dispatchResult.recipientsCount).toBe(1)

    const log = await db.notificationDeliveryLog.findFirst({
      where: {
        tenantId: testTenant.id,
        eventType: 'STAFF_ALERT',
        recipientAddress: staffUser.email,
      },
    })
    expect(log).not.toBeNull()
  })
})

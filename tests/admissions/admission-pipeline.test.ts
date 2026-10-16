import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { GET as pipelineGet, POST as pipelinePost } from '@/app/api/v1/admissions/pipeline/route'
import { PATCH as cardStagePatch } from '@/app/api/v1/admissions/pipeline/[id]/stage/route'
import { AdmissionsPipelineService } from '@/lib/admissions/pipeline-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('PreOne Visual Admission Pipeline (Kanban Board)', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchA2: string
  let branchB1: string
  let academicSessionA: string
  let adminCookieA: string
  let staffNoAccessCookie: string
  let adminCookieB: string

  let lead1: any
  let lead2: any
  let app1: any
  let appEnrolled: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant A
    const tA = await db.tenant.create({
      data: {
        name: `Pipeline School A ${ts}`,
        code: `SCH_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    // 2. Create Tenant B (for cross-tenant security tests)
    const tB = await db.tenant.create({
      data: {
        name: `Pipeline School B ${ts}`,
        code: `SCH_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 3. Branches for Tenant A
    const br1 = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus',
        code: `BR_A1_${ts}`,
        isMain: true,
      },
    })
    branchA1 = br1.id

    const br2 = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'North Campus',
        code: `BR_A2_${ts}`,
        isMain: false,
      },
    })
    branchA2 = br2.id

    // Branch for Tenant B
    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Campus B',
        code: `BR_B1_${ts}`,
        isMain: true,
      },
    })
    branchB1 = brB.id

    // Academic Session for Tenant A
    const sessA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    })
    academicSessionA = sessA.id

    // Users & Session Tokens
    const adminUserA = await db.user.create({
      data: {
        email: `admin_a_${ts}@preone.local`,
        fullName: 'Admin User A',
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
    const tokenA = await signSession({
      uid: adminUserA.id,
      tenantId: tenantA,
      role: 'OWNER',
      roles: ['OWNER'],
      email: adminUserA.email,
      branchId: branchA1,
    })
    adminCookieA = `${SESSION_COOKIE}=${tokenA}`

    const staffUserNoWrite = await db.user.create({
      data: {
        email: `teacher_${ts}@preone.local`,
        fullName: 'Teacher User',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: staffUserNoWrite.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branchA1,
      },
    })
    const tokenStaff = await signSession({
      uid: staffUserNoWrite.id,
      tenantId: tenantA,
      role: 'TEACHER',
      roles: ['TEACHER'],
      email: staffUserNoWrite.email,
      branchId: branchA1,
    })
    staffNoAccessCookie = `${SESSION_COOKIE}=${tokenStaff}`

    const adminUserB = await db.user.create({
      data: {
        email: `admin_b_${ts}@preone.local`,
        fullName: 'Admin User B',
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
    const tokenB = await signSession({
      uid: adminUserB.id,
      tenantId: tenantB,
      role: 'OWNER',
      roles: ['OWNER'],
      email: adminUserB.email,
      branchId: branchB1,
    })
    adminCookieB = `${SESSION_COOKIE}=${tokenB}`

    // 4. Create Seed Records for Tenant A
    // Lead 1: New Lead
    lead1 = await db.lead.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        leadNumber: `ENQ-A1-${ts}`,
        parentName: 'Sarah Jenkins',
        phone: '+15551234567',
        childName: 'Emma Jenkins',
        childDob: new Date('2022-04-15'),
        interestedProgram: 'PLAYGROUP',
        status: 'NEW',
      },
    })

    // Lead 2: Booked Tour
    lead2 = await db.lead.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        leadNumber: `ENQ-A2-${ts}`,
        parentName: 'David Miller',
        phone: '+15559876543',
        childName: 'Lucas Miller',
        childDob: new Date('2021-08-20'),
        interestedProgram: 'NURSERY',
        status: 'QUALIFIED',
        nextFollowUpAt: new Date(Date.now() + 86400000),
      },
    })
    await db.followUp.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        domain: 'ADMISSION',
        severity: 'INFO',
        title: 'School Visit: Lucas Miller',
        detail: JSON.stringify({ visitStatus: 'SCHEDULED', tourFocus: 'Classroom & Play Area' }),
        sourceType: 'SchoolVisit',
        sourceId: lead2.id,
        dueAt: new Date(Date.now() + 86400000),
        status: 'OPEN',
      },
    })

    // Application 1: Application Shared / In Review
    app1 = await db.admissionApplication.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        applicationNumber: `APP-A1-${ts}`,
        childFirstName: 'Noah',
        childLastName: 'Taylor',
        childDob: new Date('2021-02-10'),
        childGender: 'MALE',
        parentName: 'Robert Taylor',
        parentPhone: '+15554567890',
        programType: 'UKG',
        status: 'UNDER_REVIEW',
      },
    })

    // Application Enrolled: Enrolled & Placed
    appEnrolled = await db.admissionApplication.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        applicationNumber: `APP-ENR-${ts}`,
        childFirstName: 'Mia',
        childLastName: 'Clark',
        childDob: new Date('2020-05-12'),
        childGender: 'FEMALE',
        parentName: 'Laura Clark',
        parentPhone: '+15556789012',
        programType: 'UKG',
        status: 'ENROLLED',
        studentId: 'STU-MOCK-ID',
      },
    })
  })

  it('1. GET /api/v1/admissions/pipeline returns cards correctly grouped into 5 stages', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/pipeline?branchId=${branchA1}`, {
      headers: { cookie: adminCookieA },
    })

    const res = await pipelineGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.stages).toBeDefined()

    const { stages, metrics } = json.data

    // Check Stage 1: New Leads contains lead1
    const newLeads = stages.NEW_LEADS
    expect(newLeads.some((c: any) => c.id === lead1.id)).toBe(true)

    // Check Stage 2: Campus Tour Booked contains lead2
    const tours = stages.TOUR_BOOKED
    expect(tours.some((c: any) => c.id === lead2.id)).toBe(true)

    // Check Stage 3: Application Shared contains app1
    const appsShared = stages.APPLICATION_SHARED
    expect(appsShared.some((c: any) => c.id === app1.id)).toBe(true)

    // Check Stage 5: Enrolled & Placed contains appEnrolled
    const enrolled = stages.ENROLLED_PLACED
    expect(enrolled.some((c: any) => c.id === appEnrolled.id)).toBe(true)

    // Verify summary metrics
    expect(metrics.totalActive).toBeGreaterThanOrEqual(4)
    expect(metrics.newLeads).toBeGreaterThanOrEqual(1)
    expect(metrics.toursBooked).toBeGreaterThanOrEqual(1)
    expect(metrics.applicationsShared).toBeGreaterThanOrEqual(1)
    expect(metrics.enrolledPlaced).toBeGreaterThanOrEqual(1)
  })

  it('2. POST /api/v1/admissions/pipeline safely moves New Lead to Campus Tour Booked', async () => {
    const tourTime = new Date(Date.now() + 172800000).toISOString()
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        cardId: lead1.id,
        targetStage: 'TOUR_BOOKED',
        followUp: {
          dueAt: tourTime,
          note: 'Scheduled visit for Wednesday morning',
          tourFocus: 'Playground & Safety',
          visitorCount: 3,
        },
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    // Verify database was updated
    const updatedLead = await db.lead.findUnique({ where: { id: lead1.id } })
    expect(updatedLead?.status).toBe('QUALIFIED')
    expect(updatedLead?.nextFollowUpAt).toBeDefined()

    // Verify SchoolVisit follow-up was created
    const visitTask = await db.followUp.findFirst({
      where: {
        tenantId: tenantA,
        sourceType: 'SchoolVisit',
        sourceId: lead1.id,
      },
    })
    expect(visitTask).toBeDefined()
    expect(visitTask?.status).toBe('OPEN')
  })

  it('3. Rejects illegal transition to ENROLLED_PLACED directly via drag-and-drop', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        cardId: app1.id,
        targetStage: 'ENROLLED_PLACED',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    const requireAction = json.error.requireAction || json.error.details?.requireAction
    expect(requireAction).toBe('COMPLETE_ENROLLMENT')
    expect(json.error.message).toContain('Direct card movement to "Enrolled & Placed" is not permitted')
  })

  it('4. Rejects moving an enquiry directly to OFFER_PENDING_FEE without an application', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        cardId: lead2.id,
        targetStage: 'OFFER_PENDING_FEE',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    const requireAction = json.error.requireAction || json.error.details?.requireAction
    expect(requireAction).toBe('CREATE_APPLICATION')
  })

  it('5. Rejects moving an application to OFFER_PENDING_FEE if no offer has been generated', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        cardId: app1.id,
        targetStage: 'OFFER_PENDING_FEE',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    const requireAction = json.error.requireAction || json.error.details?.requireAction
    expect(requireAction).toBe('GENERATE_OFFER')
  })

  it('6. Allows moving to OFFER_PENDING_FEE once an offer is generated', async () => {
    // Generate an offer for app1
    await db.admissionOffer.create({
      data: {
        tenantId: tenantA,
        applicationId: app1.id,
        offerNumber: `OFF-${Date.now()}`,
        childName: 'Noah Taylor',
        parentName: 'Robert Taylor',
        programType: 'UKG',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 7 * 86400000),
      },
    })

    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        cardId: app1.id,
        targetStage: 'OFFER_PENDING_FEE',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const updatedApp = await db.admissionApplication.findUnique({ where: { id: app1.id } })
    expect(updatedApp?.status).toBe('OFFER_SENT')
  })

  it('7. PATCH /api/v1/admissions/pipeline/[id]/stage updates lead to APPLICATION_SHARED', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/pipeline/${lead2.id}/stage`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieA,
      },
      body: JSON.stringify({
        targetStage: 'APPLICATION_SHARED',
        reason: 'Application link sent via WhatsApp',
      }),
    })

    const res = await cardStagePatch(req, { params: Promise.resolve({ id: lead2.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const updatedLead = await db.lead.findUnique({ where: { id: lead2.id } })
    expect(updatedLead?.status).toBe('APPLICATION_STARTED')
  })

  it('8. Cross-tenant isolation prevents Tenant B from accessing or updating Tenant A records', async () => {
    // Attempt to move Tenant A's lead1 using Tenant B's credentials
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: adminCookieB,
      },
      body: JSON.stringify({
        cardId: lead1.id,
        targetStage: 'TOUR_BOOKED',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(404) // Not found in this tenant
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('not found in this tenant')
  })

  it('9. Unauthorized user without admissions:write cannot execute stage transitions', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/admissions/pipeline', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: staffNoAccessCookie,
      },
      body: JSON.stringify({
        cardId: lead1.id,
        targetStage: 'TOUR_BOOKED',
      }),
    })

    const res = await pipelinePost(req)
    expect(res.status).toBe(403)
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { LeadService } from '@/lib/admissions/lead-service'
import { FollowUpVisitService } from '@/lib/admissions/followup-visit-service'
import { POST as leadsPost } from '@/app/api/v1/leads/route'
import { POST as startAppPost } from '@/app/api/v1/leads/[id]/start-application/route'
import { POST as followUpsPost } from '@/app/api/v1/leads/[id]/follow-ups/route'
import { POST as convertPost } from '@/app/api/v1/leads/[id]/convert/route'
import { POST as lostPost } from '@/app/api/v1/leads/[id]/lost/route'
import { GET as visitsGet } from '@/app/api/v1/visits/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

/**
 * PreOne — Admissions CRM End-to-End Workflow & Life-Cycle Test Suite
 *
 * Enforces the complete business workflow:
 * 1. Enquiry created & persisted -> status NEW, zero applications
 * 2. Staff assignment & schedule follow-up -> status CONTACTED, in-app notification sent, zero applications
 * 3. Follow-up activities tracked in workspace -> activity logged, queues updated
 * 4. Lead qualifies (Green / Positive) -> status QUALIFIED, eligible for conversion
 * 5. Explicit Move to Application -> exactly 1 application created with zero re-entry, status CONVERTED, duplicate-safe
 * 6. Lost leads workflow -> status LOST, canonical reason preserved, open tasks closed, audited in reports
 */
describe('Admissions CRM End-to-End Workflow & Life-Cycle', () => {
  let tenantId: string
  let branchId: string
  let academicYearId: string
  let counselorUser: any
  let adminCookie: string
  let testProgram: any

  beforeAll(async () => {
    // 1. Create isolated Tenant
    const tenant = await db.tenant.create({
      data: {
        name: `CRM Workflow Test Tenant ${Date.now()}`,
        code: `CRM_${Date.now()}`,
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    // 2. Create Branch
    const branch = await db.branch.create({
      data: {
        tenantId,
        name: 'CRM Workflow Campus',
        code: `BR_${Date.now()}`,
        isMain: true,
      },
    })
    branchId = branch.id

    // 3. Create Academic Session
    const session = await db.academicSession.create({
      data: {
        tenantId,
        name: '2026-2027 Academic Year',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })
    academicYearId = session.id

    // 4. Create Counselor Staff User
    counselorUser = await db.user.create({
      data: {
        email: `counselor_${Date.now()}@preone.test`,
        fullName: 'Kavita Sharma (Admissions Counselor)',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId,
        userId: counselorUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    // 5. Create Program
    testProgram = await db.program.create({
      data: {
        tenantId,
        name: 'Toddler Playgroup',
        code: `TOD_${Date.now()}`,
        programType: 'PLAYGROUP',
        ageMinMonths: 18,
        ageMaxMonths: 36,
        capacity: 30,
      },
    })

    await db.programBranch.create({
      data: {
        tenantId,
        programId: testProgram.id,
        branchId,
      },
    })

    // 6. Generate mock auth session cookie for counselor
    const token = await signSession({
      uid: counselorUser.id,
      email: counselorUser.email,
      name: counselorUser.fullName,
      tenantId,
      branchId,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })
    adminCookie = `${SESSION_COOKIE}=${token}`
  })

  afterAll(async () => {
    try {
      await db.inAppNotification.deleteMany({ where: { tenantId } })
      await db.followUp.deleteMany({ where: { tenantId } })
      await db.admissionApplication.deleteMany({ where: { tenantId } })
      await db.lead.deleteMany({ where: { tenantId } })
      await db.programBranch.deleteMany({ where: { tenantId } })
      await db.program.deleteMany({ where: { tenantId } })
      await db.academicSession.deleteMany({ where: { tenantId } })
      await db.tenantUser.deleteMany({ where: { tenantId } })
      await db.user.deleteMany({ where: { id: counselorUser.id } })
      await db.branch.deleteMany({ where: { tenantId } })
      await db.tenant.deleteMany({ where: { id: tenantId } })
    } catch {
      // Best-effort cleanup
    }
  }, 15000)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Enquiry Creation & Persistence (NEW status, NO Application)
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 1: Enquiry is created and persisted with status NEW and ZERO premature applications', async () => {
    const reqCreate = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        branchId,
        childName: 'Aarav Gupta',
        childDob: '2024-02-15',
        parentName: 'Vikram Gupta',
        phone: '9876541122',
        email: 'vikram.gupta@example.com',
        programId: testProgram.id,
        source: 'PHONE',
        notes: 'Parent inquiring about toddler daycare and preschool curriculum.',
      }),
    })

    const resCreate = await leadsPost(reqCreate)
    expect(resCreate.status).toBe(201)
    const jsonCreate = await resCreate.json()
    expect(jsonCreate.success).toBe(true)

    const leadId = jsonCreate.data.id
    expect(leadId).toBeTruthy()
    expect(jsonCreate.data.leadNumber).toMatch(/^(ENQ|LEAD)-/)
    expect(jsonCreate.data.status).toBe('NEW')

    // Verify in DB that no application was created
    const leadInDb = await db.lead.findUnique({ where: { id: leadId } })
    expect(leadInDb?.status).toBe('NEW')
    expect(leadInDb?.convertedApplicationId).toBeNull()

    const applicationsCount = await db.admissionApplication.count({ where: { tenantId, leadId } })
    expect(applicationsCount).toBe(0)
  }, 25000)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Staff Assignment & Initial Follow-up (CONTACTED, NO Application, In-App Notification)
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 2: Assigning staff moves lead to CONTACTED, schedules follow-up, creates notification, and NEVER creates an application', async () => {
    // Fetch newly created lead
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9876541122' } })
    expect(lead).toBeTruthy()

    const scheduledDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const reqAssign = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/start-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        branchId,
        academicYearId,
        assignedStaffId: counselorUser.id,
        followUpDate: scheduledDate,
        followUpType: 'Phone Call',
        followUpNotes: 'Discuss Toddler program timings, batch availability, and schedule a tour.',
      }),
    })

    const resAssign = await startAppPost(reqAssign, { params: Promise.resolve({ id: lead!.id }) })
    expect(resAssign.status).toBe(201)
    const jsonAssign = await resAssign.json()
    expect(jsonAssign.success).toBe(true)

    // Critical assertion: NO premature application created!
    expect(jsonAssign.data.applicationId).toBeFalsy()
    expect(jsonAssign.data.applicationNumber).toBeFalsy()
    expect(jsonAssign.data.status).toBe('CONTACTED')
    expect(jsonAssign.data.assignedToId).toBe(counselorUser.id)
    expect(jsonAssign.data.followUpId).toBeTruthy()

    // Verify in DB: lead status is CONTACTED, convertedApplicationId is null
    const updatedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(updatedLead?.status).toBe('CONTACTED')
    expect(updatedLead?.convertedApplicationId).toBeNull()
    expect(updatedLead?.assignedToId).toBe(counselorUser.id)

    // Still exactly 0 applications in DB
    const applicationsCount = await db.admissionApplication.count({ where: { tenantId, leadId: lead!.id } })
    expect(applicationsCount).toBe(0)

    // Verify FollowUp task in DB
    const followUp = await db.followUp.findUnique({ where: { id: jsonAssign.data.followUpId } })
    expect(followUp?.status).toBe('OPEN')
    expect(followUp?.assignedToId).toBe(counselorUser.id)
    expect(followUp?.sourceType).toBe('EnquiryFollowUp')
    expect(followUp?.sourceId).toBe(lead!.id)

    // Verify In-App Notification was created for counselorUser
    const notifications = await db.inAppNotification.findMany({
      where: { tenantId, userId: counselorUser.id },
    })
    expect(notifications.length).toBeGreaterThanOrEqual(1)
    const notif = notifications.find((n) => n.metadata && (n.metadata as any).leadId === lead!.id)
    expect(notif).toBeTruthy()
    expect(notif?.category).toBe('ADMISSION')
    expect(notif?.title).toContain('Aarav Gupta')
  }, 25000)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Follow-ups Workspace Queue & Activity Tracking (CALLBACK_REQUESTED)
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 3: Lead appears in Follow-ups workspace queue and tracks outreach interaction history', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9876541122' } })

    // 1. Check Follow-up queue
    const reqQueue = new NextRequest(`http://localhost:3000/api/v1/visits?branchId=${branchId}&queue=ALL_OPEN`, {
      headers: { cookie: adminCookie },
    })
    const resQueue = await visitsGet(reqQueue)
    const jsonQueue = await resQueue.json()
    expect(jsonQueue.success).toBe(true)

    const queueItem = jsonQueue.data.items.find((i: any) => i.lead?.id === lead!.id)
    expect(queueItem).toBeTruthy()
    expect(queueItem.lead.status).toBe('CONTACTED')
    expect(queueItem.assignedStaffName).toBe(counselorUser.fullName)

    // 2. Log first outreach: Parent requested callback tomorrow
    const nextCallDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const reqFollowUp1 = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        type: 'Phone Call',
        note: 'Spoke with father Vikram. Requested callback tomorrow after 5 PM.',
        outcome: 'CALLBACK_REQUESTED',
        dueAt: nextCallDate,
        followUpId: queueItem.id,
      }),
    })

    const resFollowUp1 = await followUpsPost(reqFollowUp1, { params: Promise.resolve({ id: lead!.id }) })
    expect(resFollowUp1.status).toBe(201)

    // Previous task resolved, new activity scheduled
    const previousTask = await db.followUp.findUnique({ where: { id: queueItem.id } })
    expect(previousTask?.status).toBe('RESOLVED')
    expect(previousTask?.outcome).toBe('CALLBACK_REQUESTED')

    // Lead remains in CONTACTED with updated next follow-up date
    const refreshedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(refreshedLead?.status).toBe('CONTACTED')
    expect(refreshedLead?.convertedApplicationId).toBeNull()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Lead Qualification (Green / Positive)
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 4: Positive interaction qualifies the lead (QUALIFIED / Green) without creating premature application', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9876541122' } })

    // Log second outreach: Parent is delighted, confirmed interest
    const reqFollowUp2 = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        type: 'Phone Call',
        note: 'Father confirmed keen interest in Toddler Playgroup. Ready to submit application dossier.',
        outcome: 'CONNECTED_INTERESTED',
      }),
    })

    const resFollowUp2 = await followUpsPost(reqFollowUp2, { params: Promise.resolve({ id: lead!.id }) })
    expect(resFollowUp2.status).toBe(201)

    // Lead transitions to QUALIFIED
    const qualifiedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(qualifiedLead?.status).toBe('QUALIFIED')
    // Still NO premature application!
    expect(qualifiedLead?.convertedApplicationId).toBeNull()

    const applicationsCount = await db.admissionApplication.count({ where: { tenantId, leadId: lead!.id } })
    expect(applicationsCount).toBe(0)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Explicit "Move to Application" Conversion (CONVERTED, Duplicate-Safe)
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 5: Explicit conversion creates exactly one Application with zero data re-entry, marks lead CONVERTED, and prevents duplicates', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9876541122' } })
    expect(lead?.status).toBe('QUALIFIED')

    // Call /api/v1/leads/:id/convert
    const reqConvert = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        branchId,
        academicYearId,
        programId: testProgram.id,
      }),
    })

    const resConvert = await convertPost(reqConvert, { params: Promise.resolve({ id: lead!.id }) })
    expect(resConvert.status).toBe(201)
    const jsonConvert = await resConvert.json()
    expect(jsonConvert.success).toBe(true)
    expect(jsonConvert.data.applicationId).toBeTruthy()
    expect(jsonConvert.data.applicationNumber).toMatch(/^(APP|ADM)-/)

    const applicationId = jsonConvert.data.applicationId

    // 1. Verify AdmissionApplication record has complete zero-re-entry data
    const appInDb = await db.admissionApplication.findUnique({ where: { id: applicationId } })
    expect(appInDb).toBeTruthy()
    expect(appInDb?.childFirstName).toBe('Aarav')
    expect(appInDb?.childLastName).toBe('Gupta')
    expect(appInDb?.parentName).toBe('Vikram Gupta')
    expect(appInDb?.parentPhone).toBe('9876541122')
    expect(appInDb?.programId).toBe(testProgram.id)
    expect(appInDb?.branchId).toBe(branchId)

    // 2. Verify Lead status is CONVERTED and convertedApplicationId is set
    const convertedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(convertedLead?.status).toBe('CONVERTED')
    expect(convertedLead?.convertedApplicationId).toBe(applicationId)

    // 3. Verify open follow-ups for this lead were marked RESOLVED
    const openTasks = await db.followUp.findMany({
      where: { tenantId, sourceId: lead!.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    })
    expect(openTasks.length).toBe(0)

    // 4. Duplicate prevention test: Converting a second time must NOT create a second application
    const reqDuplicateConvert = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ branchId }),
    })

    const resDuplicateConvert = await convertPost(reqDuplicateConvert, { params: Promise.resolve({ id: lead!.id }) })
    const jsonDup = await resDuplicateConvert.json()
    expect(jsonDup.success).toBe(true)
    // Same application returned idempotently
    expect(jsonDup.data.applicationId).toBe(applicationId)

    // Verify exactly 1 application exists in DB
    const totalAppsForLead = await db.admissionApplication.count({ where: { tenantId, leadId: lead!.id } })
    expect(totalAppsForLead).toBe(1)
  }, 25000)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 6: Lost Leads Lifecycle & Canonical Reason Tracking
  // ──────────────────────────────────────────────────────────────────────────
  it('Step 6: Marking a lead LOST persists canonical reason, closes open tasks, retains record in DB, and removes from active queue', async () => {
    // 1. Create a fresh lead that will not proceed
    const lostLead = await db.lead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `ENQ-LOST-${Date.now()}`,
        parentName: 'Ramesh Sharma',
        phone: '9123459988',
        childName: 'Rohan Sharma',
        status: 'NEW',
        assignedToId: counselorUser.id,
      },
    })

    // Assign follow-up
    await LeadService.startApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: counselorUser.id,
        actorName: counselorUser.fullName,
        actorRole: 'TEACHER',
      },
      lostLead.id,
      {
        assignedStaffId: counselorUser.id,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        followUpNotes: 'Inquire about admission decision.',
      }
    )

    // Verify task is OPEN
    const openTaskBefore = await db.followUp.findFirst({
      where: { tenantId, sourceId: lostLead.id, status: 'OPEN' },
    })
    expect(openTaskBefore).toBeTruthy()

    // 2. Mark Lost via API with canonical reason
    const reqLost = new NextRequest(`http://localhost:3000/api/v1/leads/${lostLead.id}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        lostReason: 'FEES_TOO_HIGH',
        notes: 'Parent found fee structure above family budget.',
      }),
    })

    const resLost = await lostPost(reqLost, { params: Promise.resolve({ id: lostLead.id }) })
    expect(resLost.status).toBe(200)

    // 3. Verify lead is marked LOST, NOT deleted from DB
    const leadInDb = await db.lead.findUnique({ where: { id: lostLead.id } })
    expect(leadInDb).toBeTruthy()
    expect(leadInDb?.status).toBe('LOST')
    expect(leadInDb?.deletedAt).toBeNull()
    expect(leadInDb?.notes).toContain('[Lost: FEES_TOO_HIGH | Parent found fee structure above family budget.]')

    // 4. Verify open follow-up task was CLOSED
    const openTaskAfter = await db.followUp.findFirst({
      where: { tenantId, sourceId: lostLead.id, status: 'OPEN' },
    })
    expect(openTaskAfter).toBeNull()

    const closedTask = await db.followUp.findFirst({
      where: { tenantId, sourceId: lostLead.id, status: 'CLOSED' },
    })
    expect(closedTask).toBeTruthy()
    expect(closedTask?.outcome).toContain('FEES_TOO_HIGH')

    // 5. Verify the lost lead does NOT appear in active ALL_OPEN follow-up queue
    const queueData = await FollowUpVisitService.listWorkspaceQueues(tenantId, {
      branchId,
      queue: 'ALL_OPEN',
    })
    const isPresentInActiveQueue = queueData.items.some((item) => item.sourceId === lostLead.id)
    expect(isPresentInActiveQueue).toBe(false)
  })
})

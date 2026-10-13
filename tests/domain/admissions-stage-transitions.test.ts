import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as leadsPost, GET as leadsGet } from '@/app/api/v1/leads/route'
import { POST as startAppPost } from '@/app/api/v1/leads/[id]/start-application/route'
import { POST as convertPost } from '@/app/api/v1/leads/[id]/convert/route'
import { GET as summaryGet } from '@/app/api/v1/admissions/summary/route'
import { GET as visitsGet } from '@/app/api/v1/visits/route'
import { GET as appsGet } from '@/app/api/v1/applications/route'
import { POST as publicEnquiryPost } from '@/app/api/v1/public/enquiry/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

/**
 * PreOne Admissions — Stage Transitions & Lifecycle Deduplication Regression Test Suite
 *
 * Verifies the mandatory rule:
 * Exactly ONE authoritative active stage per prospect at any time.
 *
 * Stage 1: Enquiries (NEW, uncontacted, unconverted)
 * Stage 2: Follow-ups (CONTACTED/QUALIFIED/NURTURE, unconverted)
 * Stage 3: Applications (CONVERTED prospect / active application)
 */
describe('Admissions Stage Transitions & Lifecycle Deduplication', () => {
  let tenantId: string
  let branchId: string
  let schoolCode: string
  let academicYearId: string
  let adminUser: any
  let adminCookie: string
  let program: any

  beforeAll(async () => {
    const ts = Date.now()
    schoolCode = `ST_${ts}`

    // 1. Create Tenant
    const tenant = await db.tenant.create({
      data: {
        name: `Stage Transitions Tenant ${ts}`,
        code: schoolCode,
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    // 2. Create Branch
    const branch = await db.branch.create({
      data: {
        tenantId,
        name: 'Main Campus',
        code: `BR_${ts}`,
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

    // 4. Create Program
    program = await db.program.create({
      data: {
        tenantId,
        name: 'Playgroup Juniors',
        code: `PG_${ts}`,
        programType: 'PLAYGROUP',
        isActive: true,
      },
    })

    await db.programBranch.create({
      data: {
        tenantId,
        programId: program.id,
        branchId,
      },
    })

    // 5. Create Staff/Admin User
    adminUser = await db.user.create({
      data: {
        email: `principal_${ts}@preone.test`,
        username: `principal_${ts}`,
        fullName: 'Principal Meera',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId,
        userId: adminUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId,
      branchId,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      orgId: tenantId,
    })
    adminCookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly`
  })

  // Helper to fetch ribbon summary counts
  async function fetchSummary() {
    const req = new NextRequest(`http://localhost:3000/api/v1/admissions/summary?branchId=${branchId}`, {
      headers: { cookie: adminCookie },
    })
    const res = await summaryGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    return json.data
  }

  // Helper to fetch active enquiries list
  async function fetchActiveEnquiries() {
    const req = new NextRequest(`http://localhost:3000/api/v1/leads?branchId=${branchId}&status=ACTIVE`, {
      headers: { cookie: adminCookie },
    })
    const res = await leadsGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    return json.data as any[]
  }

  // Helper to fetch active follow-ups queue
  async function fetchFollowUpsQueue() {
    const req = new NextRequest(`http://localhost:3000/api/v1/visits?branchId=${branchId}&queue=ALL_OPEN`, {
      headers: { cookie: adminCookie },
    })
    const res = await visitsGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    return json.data
  }

  // Helper to fetch applications list
  async function fetchApplications() {
    const req = new NextRequest(`http://localhost:3000/api/v1/applications?branchId=${branchId}`, {
      headers: { cookie: adminCookie },
    })
    const res = await appsGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    return json.data as any[]
  }

  it(
    'Requirement 1 & 3: Complete Lifecycle Scenario for a Single Prospect (1 → 0 → 0 -> 0 → 1 → 0 -> 0 → 0 → 1)',
    async () => {
    // 0. Verify initial baseline counts
    const baseline = await fetchSummary()
    expect(baseline.counts.enquiries).toBe(0)
    expect(baseline.counts['follow-ups']).toBe(0)
    expect(baseline.counts.applications).toBe(0)

    // =========================================================================
    // STEP 1: New Enquiry Created
    // Expected: Enquiries: 1, Follow-ups: 0, Applications: 0
    // =========================================================================
    const createReq = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        parentName: 'Aarav Sharma Parent',
        phone: '9811100001',
        email: 'aarav.sharma@example.com',
        childName: 'Aarav Sharma',
        branchId,
        programId: program.id,
        programType: 'PLAYGROUP',
        source: 'WALK_IN',
        notes: 'Interested in morning batch transport',
      }),
    })
    const createRes = await leadsPost(createReq)
    const createJson = await createRes.json()
    expect(createJson.success).toBe(true)
    const leadId = createJson.data.id

    // Check Counts
    const step1Summary = await fetchSummary()
    expect(step1Summary.counts.enquiries).toBe(1)
    expect(step1Summary.counts['follow-ups']).toBe(0)
    expect(step1Summary.counts.applications).toBe(0)

    // Check Lists
    const step1Enquiries = await fetchActiveEnquiries()
    expect(step1Enquiries.length).toBe(1)
    expect(step1Enquiries[0].id).toBe(leadId)

    const step1FollowUps = await fetchFollowUpsQueue()
    expect(step1FollowUps.counts.allOpen).toBe(0)
    expect(step1FollowUps.items.length).toBe(0)

    const step1Apps = await fetchApplications()
    expect(step1Apps.length).toBe(0)

    // =========================================================================
    // STEP 2: Move to Follow-ups
    // Expected: Enquiries: 0, Follow-ups: 1, Applications: 0
    // =========================================================================
    const moveReq = new NextRequest(`http://localhost:3000/api/v1/leads/${leadId}/start-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        assignedStaffId: adminUser.id,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        followUpType: 'Phone Call',
        followUpNotes: 'Discuss curriculum and transport route',
      }),
    })
    const moveRes = await startAppPost(moveReq, { params: Promise.resolve({ id: leadId }) })
    const moveJson = await moveRes.json()
    expect(moveJson.success).toBe(true)
    expect(moveJson.data.status).toBe('CONTACTED')

    // Check Counts
    const step2Summary = await fetchSummary()
    expect(step2Summary.counts.enquiries).toBe(0)
    expect(step2Summary.counts['follow-ups']).toBe(1)
    expect(step2Summary.counts.applications).toBe(0)

    // Check Lists
    const step2Enquiries = await fetchActiveEnquiries()
    expect(step2Enquiries.length).toBe(0) // Record removed from active enquiries

    const step2FollowUps = await fetchFollowUpsQueue()
    expect(step2FollowUps.counts.allOpen).toBe(1) // Record appears in follow-ups queue
    expect(step2FollowUps.items.length).toBe(1)
    expect(step2FollowUps.items[0].lead.id).toBe(leadId)

    const step2Apps = await fetchApplications()
    expect(step2Apps.length).toBe(0) // No premature application created

    // =========================================================================
    // STEP 3: Convert to Application
    // Expected: Enquiries: 0, Follow-ups: 0, Applications: 1
    // =========================================================================
    const convertReq = new NextRequest(`http://localhost:3000/api/v1/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ branchId }),
    })
    const convertRes = await convertPost(convertReq, { params: Promise.resolve({ id: leadId }) })
    const convertJson = await convertRes.json()
    expect(convertJson.success).toBe(true)
    const applicationId = convertJson.data.applicationId || convertJson.data.application?.id || convertJson.data.id
    expect(applicationId).toBeDefined()

    // Check Counts
    const step3Summary = await fetchSummary()
    expect(step3Summary.counts.enquiries).toBe(0)
    expect(step3Summary.counts['follow-ups']).toBe(0)
    expect(step3Summary.counts.applications).toBe(1)

    // Check Lists
    const step3Enquiries = await fetchActiveEnquiries()
    expect(step3Enquiries.length).toBe(0) // Absent from Enquiries

    const step3FollowUps = await fetchFollowUpsQueue()
    expect(step3FollowUps.counts.allOpen).toBe(0) // Absent from Follow-ups
    expect(step3FollowUps.items.length).toBe(0)

    const step3Apps = await fetchApplications()
    expect(step3Apps.length).toBe(1) // Appears in Applications only!
    expect(step3Apps[0].id).toBe(applicationId)
    expect(step3Apps[0].leadId).toBe(leadId)

    // Check DB Integrity: History and links preserved
    const dbLead = await db.lead.findUnique({ where: { id: leadId } })
    expect(dbLead?.status).toBe('CONVERTED')
    expect(dbLead?.convertedApplicationId).toBe(applicationId)
  }, 15000)

  it('Requirement 2: Multiple follow-up tasks for 1 prospect NEVER multiply queue rows or inflate counts', async () => {
    // Create Lead 2
    const createRes = await leadsPost(
      new NextRequest('http://localhost:3000/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({
          parentName: 'Neha Kulkarni',
          phone: '9811100002',
          childName: 'Ananya Kulkarni',
          branchId,
          programId: program.id,
          programType: 'PLAYGROUP',
          source: 'PHONE',
        }),
      })
    )
    const lead2Id = (await createRes.json()).data.id

    // Move Lead 2 to Follow-ups (Task 1)
    await startAppPost(
      new NextRequest(`http://localhost:3000/api/v1/leads/${lead2Id}/start-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({
          assignedStaffId: adminUser.id,
          followUpDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          followUpNotes: 'Initial outreach call',
        }),
      }),
      { params: Promise.resolve({ id: lead2Id }) }
    )

    // Insert Task 2 (School Visit Task) for the same lead
    await db.followUp.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: academicYearId,
        domain: 'ADMISSION',
        severity: 'INFO',
        title: 'Campus Tour: Ananya Kulkarni',
        detail: 'Scheduled campus walkthrough',
        sourceType: 'SchoolVisit',
        sourceId: lead2Id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'OPEN',
        assignedToId: adminUser.id,
      },
    })

    // Insert Task 3 (Document collection reminder) for the same lead
    await db.followUp.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: academicYearId,
        domain: 'ADMISSION',
        severity: 'INFO',
        title: 'Collect Birth Certificate: Ananya Kulkarni',
        detail: 'Collect DOB proof from parent',
        sourceType: 'EnquiryFollowUp',
        sourceId: lead2Id,
        dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: 'OPEN',
        assignedToId: adminUser.id,
      },
    })

    // Verify raw tasks in DB = 3
    const totalTasksInDb = await db.followUp.count({
      where: { tenantId, sourceId: lead2Id, status: 'OPEN' },
    })
    expect(totalTasksInDb).toBe(3)

    // Check Follow-up Queue Workspace: Must deduplicate to EXACTLY 1 card for this prospect!
    const queueData = await fetchFollowUpsQueue()
    const matchingItems = queueData.items.filter((item: any) => item.lead.id === lead2Id)
    expect(matchingItems.length).toBe(1)
    expect(queueData.counts.allOpen).toBe(1)

    // Ribbon count must be 1 (not 3)
    const summary = await fetchSummary()
    expect(summary.counts['follow-ups']).toBe(1)
  })

  it('Requirement 4: Conversion Idempotency prevents duplicate applications on retry or concurrent clicks', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9811100002' } })
    expect(lead).not.toBeNull()

    // First conversion request
    const req1 = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ branchId }),
    })
    const res1 = await convertPost(req1, { params: Promise.resolve({ id: lead!.id }) })
    const json1 = await res1.json()
    expect(json1.success).toBe(true)
    const app1Id = json1.data.applicationId || json1.data.application?.id || json1.data.id
    expect(app1Id).toBeDefined()

    // Retry / Second conversion request (simulate double-click or network retry)
    const req2 = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ branchId }),
    })
    const res2 = await convertPost(req2, { params: Promise.resolve({ id: lead!.id }) })
    const json2 = await res2.json()
    expect(json2.success).toBe(true)

    // Both must point to the same canonical application!
    const app2Id = json2.data.applicationId || json2.data.application?.id || json2.data.id
    expect(app2Id).toBe(app1Id)

    // DB count of applications for this lead must be exactly 1
    const appCount = await db.admissionApplication.count({
      where: { tenantId, leadId: lead!.id, deletedAt: null },
    })
    expect(appCount).toBe(1)
  })

  it('Requirement 5: Public Enquiry Ingestion enters Stage 1 only and respects duplicate protection', async () => {
    // 1. Submit public enquiry
    const publicReq = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        branchId,
        parentName: 'Public Parent Rajesh',
        phone: '9811100003',
        childName: 'Tanmay Rajesh',
        childDob: '2023-01-15',
        interestedProgram: 'Playgroup Juniors',
        notes: 'Submitted via website landing page',
        consentGiven: true,
      }),
    })
    const publicRes = await publicEnquiryPost(publicReq)
    const publicJson = await publicRes.json()
    expect(publicJson.success).toBe(true)

    // Lead must exist in DB with status NEW
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9811100003' } })
    expect(lead).not.toBeNull()
    expect(lead?.status).toBe('NEW')

    // Must be in Enquiries list ONLY
    const activeEnquiries = await fetchActiveEnquiries()
    const found = activeEnquiries.find((l) => l.id === lead!.id)
    expect(found).toBeDefined()

    // Must NOT be in Follow-ups queue
    const followUpsQueue = await fetchFollowUpsQueue()
    const foundInFU = followUpsQueue.items.find((item: any) => item.lead.id === lead!.id)
    expect(foundInFU).toBeUndefined()

    // 2. Resubmitting with same phone number should trigger duplicate protection
    const retryReq = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        branchId,
        parentName: 'Public Parent Rajesh',
        phone: '9811100003',
        childName: 'Tanmay Rajesh',
        childDob: '2023-01-15',
        interestedProgram: 'Playgroup Juniors',
        notes: 'Second submission test',
        consentGiven: true,
      }),
    })
    const retryRes = await publicEnquiryPost(retryReq)
    const retryJson = await retryRes.json()
    expect(retryJson.success).toBe(true)
    expect(retryJson.data.isExisting).toBe(true)

    // Total leads with this phone in DB must remain exactly 1!
    const leadCount = await db.lead.count({ where: { tenantId, phone: '9811100003' } })
    expect(leadCount).toBe(1)
  })
})

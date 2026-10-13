import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as leadsPost } from '@/app/api/v1/leads/route'
import { POST as startAppPost } from '@/app/api/v1/leads/[id]/start-application/route'
import { POST as convertPost } from '@/app/api/v1/leads/[id]/convert/route'
import { POST as lostPost } from '@/app/api/v1/leads/[id]/lost/route'
import { GET as summaryGet } from '@/app/api/v1/admissions/summary/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

/**
 * PreOne Admissions Lifecycle Count Consistency & Data Integrity Test Suite
 *
 * Verifies count consistency, transactional integrity, and idempotency across:
 * Enquiries → Follow-ups → Applications lifecycle
 */
describe('Admissions Lifecycle Count Consistency & Synchronization', () => {
  let tenantId: string
  let branchAId: string
  let branchBId: string
  let academicYearId: string
  let adminUser: any
  let adminCookie: string
  let programA: any

  beforeAll(async () => {
    const timestamp = Date.now()

    // 1. Create Isolated Tenant
    const tenant = await db.tenant.create({
      data: {
        name: `Lifecycle Counts Tenant ${timestamp}`,
        code: `LC_${timestamp}`,
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    // 2. Create Branch A and Branch B
    const branchA = await db.branch.create({
      data: {
        tenantId,
        name: 'Main Campus A',
        code: `BR_A_${timestamp}`,
        isMain: true,
      },
    })
    branchAId = branchA.id

    const branchB = await db.branch.create({
      data: {
        tenantId,
        name: 'Secondary Campus B',
        code: `BR_B_${timestamp}`,
        isMain: false,
      },
    })
    branchBId = branchB.id

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

    // 4. Create Admin User
    adminUser = await db.user.create({
      data: {
        email: `admin_${timestamp}@preone.test`,
        username: `admin_${timestamp}`,
        fullName: 'Admissions Director',
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
      branchId: branchAId,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })
    adminCookie = `${SESSION_COOKIE}=${token}`

    // 5. Create Program
    programA = await db.program.create({
      data: {
        tenantId,
        name: 'Nursery Stars',
        code: `NUR_${timestamp}`,
        programType: 'NURSERY',
        ageMinMonths: 30,
        ageMaxMonths: 48,
        isActive: true,
      },
    })

    await db.programBranch.create({
      data: {
        tenantId,
        programId: programA.id,
        branchId: branchAId,
      },
    })

    await db.programBranch.create({
      data: {
        tenantId,
        programId: programA.id,
        branchId: branchBId,
      },
    })
  })

  afterAll(async () => {
    try {
      await Promise.allSettled([
        db.inAppNotification.deleteMany({ where: { tenantId } }),
        db.followUp.deleteMany({ where: { tenantId } }),
        db.applicationDocument.deleteMany({ where: { application: { tenantId } } }),
        db.admissionApplication.deleteMany({ where: { tenantId } }),
        db.lead.deleteMany({ where: { tenantId } }),
        db.programBranch.deleteMany({ where: { tenantId } }),
      ])
      await Promise.allSettled([
        db.program.deleteMany({ where: { tenantId } }),
        db.academicSession.deleteMany({ where: { tenantId } }),
        db.tenantUser.deleteMany({ where: { tenantId } }),
        db.branch.deleteMany({ where: { tenantId } }),
      ])
      await db.user.delete({ where: { id: adminUser.id } }).catch(() => {})
      await db.tenant.deleteMany({ where: { id: tenantId } }).catch(() => {})
    } catch {
      // Best-effort cleanup
    }
  }, 30000)

  // Helper function to query canonical admissions summary
  async function fetchSummary(branchId?: string) {
    const url = branchId
      ? `http://localhost:3000/api/v1/admissions/summary?branchId=${branchId}`
      : 'http://localhost:3000/api/v1/admissions/summary'
    const req = new NextRequest(url, {
      method: 'GET',
      headers: { cookie: adminCookie },
    })
    const res = await summaryGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    return json.data
  }

  it('Test A: Baseline counts are zero for new tenant', async () => {
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(0)
    expect(summary.counts['follow-ups']).toBe(0)
    expect(summary.counts.applications).toBe(0)
    expect(summary.counts.admitted).toBe(0)
  })

  it('Test B: Enquiry creation increments enquiries count without premature follow-ups or applications', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        parentName: 'Sanjay Mehta',
        phone: '9822100001',
        email: 'sanjay.mehta@example.com',
        childName: 'Aryan Mehta',
        branchId: branchAId,
        programId: programA.id,
        programType: 'NURSERY',
        source: 'PHONE',
      }),
    })
    const res = await leadsPost(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('NEW')

    // Verify database counts
    const appsInDb = await db.admissionApplication.count({ where: { tenantId } })
    expect(appsInDb).toBe(0)

    // Verify canonical summary
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(1)
    expect(summary.counts['follow-ups']).toBe(0)
    expect(summary.counts.applications).toBe(0)
  })

  it('Test C: Transition to Follow-up keeps enquiry active, schedules follow-up task, and NEVER creates premature application', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9822100001' } })
    expect(lead).not.toBeNull()

    const req = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/start-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        assignedStaffId: adminUser.id,
        followUpType: 'Phone Call',
        followUpNotes: 'Discuss transport and morning session availability',
      }),
    })
    const res = await startAppPost(req, { params: Promise.resolve({ id: lead!.id }) })
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('CONTACTED')
    expect(json.data.followUpId).toBeDefined()

    // Verify database integrity
    const updatedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(updatedLead?.status).toBe('CONTACTED')
    expect(updatedLead?.convertedApplicationId).toBeNull()

    const appsInDb = await db.admissionApplication.count({ where: { tenantId } })
    expect(appsInDb).toBe(0)

    const followUpsInDb = await db.followUp.count({ where: { tenantId, sourceId: lead!.id, status: 'OPEN' } })
    expect(followUpsInDb).toBe(1)

    // Verify canonical summary:
    // Lead transitioned from ENQUIRY to FOLLOW_UP stage:
    // enquiries: 0, follow-ups: 1, applications: 0!
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(0)
    expect(summary.counts['follow-ups']).toBe(1)
    expect(summary.counts.applications).toBe(0)
  })

  it('Test D: Transition from Follow-up to Application atomically converts lead, creates exactly 1 application, resolves follow-up, and updates all counts', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9822100001' } })
    expect(lead).not.toBeNull()

    const req = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        branchId: branchAId,
      }),
    })
    const res = await convertPost(req, { params: Promise.resolve({ id: lead!.id }) })
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.applicationId).toBeDefined()
    expect(json.data.applicationNumber).toBeDefined()

    // Verify database state:
    // 1. Lead is CONVERTED
    const convertedLead = await db.lead.findUnique({ where: { id: lead!.id } })
    expect(convertedLead?.status).toBe('CONVERTED')
    expect(convertedLead?.convertedApplicationId).toBe(json.data.applicationId)

    // 2. Application exists and links back to lead
    const application = await db.admissionApplication.findUnique({ where: { id: json.data.applicationId } })
    expect(application).not.toBeNull()
    expect(application?.leadId).toBe(lead!.id)
    expect(application?.childFirstName).toBe('Aryan')
    expect(application?.parentPhone).toBe('9822100001')

    // 3. Open follow-ups resolved
    const openFollowUps = await db.followUp.count({ where: { tenantId, sourceId: lead!.id, status: 'OPEN' } })
    expect(openFollowUps).toBe(0)

    // 4. Verify canonical summary:
    // Enquiries count: 0 (converted lead is removed from active enquiries list)
    // Follow-ups count: 0 (task resolved)
    // Applications count: 1 (new application created)
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(0)
    expect(summary.counts['follow-ups']).toBe(0)
    expect(summary.counts.applications).toBe(1)
  })

  it('Test E: Idempotency on repeated conversion calls prevents duplicate applications', async () => {
    const lead = await db.lead.findFirst({ where: { tenantId, phone: '9822100001' } })
    expect(lead).not.toBeNull()

    // Call convert again on the same lead
    const req = new NextRequest(`http://localhost:3000/api/v1/leads/${lead!.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        branchId: branchAId,
      }),
    })
    const res = await convertPost(req, { params: Promise.resolve({ id: lead!.id }) })
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.applicationId).toBe(lead!.convertedApplicationId)

    // Exactly 1 application must exist in the database
    const totalApps = await db.admissionApplication.count({ where: { tenantId, leadId: lead!.id } })
    expect(totalApps).toBe(1)

    // Summary counts remain stable
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(0)
    expect(summary.counts['follow-ups']).toBe(0)
    expect(summary.counts.applications).toBe(1)
  })

  it('Test F: Multi-record progression across stages calculates distinct counts without double-counting', async () => {
    // Lead 2: Will remain in Enquiry stage (status NEW)
    const req2 = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        parentName: 'Priya Sharma',
        phone: '9822100002',
        childName: 'Ananya Sharma',
        branchId: branchAId,
        programId: programA.id,
        programType: 'NURSERY',
        source: 'WEBSITE',
      }),
    })
    await leadsPost(req2)

    // Lead 3: Will advance to Follow-up stage (status CONTACTED)
    const req3 = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        parentName: 'Rohan Patil',
        phone: '9822100003',
        childName: 'Vihaan Patil',
        branchId: branchAId,
        programId: programA.id,
        programType: 'NURSERY',
        source: 'PHONE',
      }),
    })
    const res3 = await leadsPost(req3)
    const json3 = await res3.json()
    const lead3Id = json3.data.id

    // Advance Lead 3 to follow-up
    await startAppPost(
      new NextRequest(`http://localhost:3000/api/v1/leads/${lead3Id}/start-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ assignedStaffId: adminUser.id }),
      }),
      { params: Promise.resolve({ id: lead3Id }) }
    )

    // Now in Branch A:
    // Lead 1: Converted to Application -> In Applications (1)
    // Lead 2: NEW Enquiry -> In Enquiries (1)
    // Lead 3: CONTACTED Enquiry with Open Follow-up -> In Follow-ups (1)
    // Expected ribbon counts:
    // enquiries: 1 (Lead 2)
    // follow-ups: 1 (Lead 3)
    // applications: 1 (Lead 1)
    const summary = await fetchSummary(branchAId)
    expect(summary.counts.enquiries).toBe(1)
    expect(summary.counts['follow-ups']).toBe(1)
    expect(summary.counts.applications).toBe(1)
    expect(summary.counts.reports).toBe(3) // 1 enquiry + 1 follow-up + 1 application
  })

  it('Test G: Tenant and Branch Isolation preserves count integrity', async () => {
    // Create an enquiry in Branch B
    const reqBranchB = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        parentName: 'Vikram Joshi',
        phone: '9822100004',
        childName: 'Tanvi Joshi',
        branchId: branchBId,
        programId: programA.id,
        programType: 'NURSERY',
        source: 'WALK_IN',
      }),
    })
    await leadsPost(reqBranchB)

    // Branch A counts must remain unaffected:
    // Lead 2 is in Enquiries (1), Lead 3 is in Follow-ups (1), Lead 1 is in Applications (1)
    const summaryA = await fetchSummary(branchAId)
    expect(summaryA.counts.enquiries).toBe(1)
    expect(summaryA.counts['follow-ups']).toBe(1)
    expect(summaryA.counts.applications).toBe(1)

    // Branch B counts should only reflect Branch B data
    const summaryB = await fetchSummary(branchBId)
    expect(summaryB.counts.enquiries).toBe(1)
    expect(summaryB.counts['follow-ups']).toBe(0)
    expect(summaryB.counts.applications).toBe(0)
  })

  it('Test H: Marking an enquiry LOST closes follow-up tasks and removes from active counts', async () => {
    const lead3 = await db.lead.findFirst({ where: { tenantId, phone: '9822100003' } })
    expect(lead3).not.toBeNull()

    const reqLost = new NextRequest(`http://localhost:3000/api/v1/leads/${lead3!.id}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        lostReason: 'FEES_TOO_HIGH',
        notes: 'Parent opted for school closer to residence',
      }),
    })
    const resLost = await lostPost(reqLost, { params: Promise.resolve({ id: lead3!.id }) })
    const jsonLost = await resLost.json()
    expect(jsonLost.success).toBe(true)

    // Verify lead status in DB is LOST
    const updatedLead3 = await db.lead.findUnique({ where: { id: lead3!.id } })
    expect(updatedLead3?.status).toBe('LOST')

    // Verify follow-up task was closed
    const openFollowUps = await db.followUp.count({ where: { tenantId, sourceId: lead3!.id, status: 'OPEN' } })
    expect(openFollowUps).toBe(0)

    // Branch A counts:
    // Lead 1: Application (1)
    // Lead 2: NEW Enquiry (1)
    // Lead 3: LOST (0 in active enquiries, 0 in follow-ups)
    const summaryA = await fetchSummary(branchAId)
    expect(summaryA.counts.enquiries).toBe(1) // Only Lead 2 remains active
    expect(summaryA.counts['follow-ups']).toBe(0) // No open follow-ups
    expect(summaryA.counts.applications).toBe(1) // Lead 1 application
  })
})

import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { NextRequest } from 'next/server'
import { POST as leadsPost, GET as leadsGet } from '@/app/api/v1/leads/route'
import { POST as publicEnquiryPost, GET as publicEnquiryGet } from '@/app/api/v1/public/enquiry/route'
import { signToken } from '@/lib/jwt'

describe('End-to-End Verification: Enquiry Form Persistence & Branch/Program Flow', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branchA: any
  let branchB: any
  let universalProgram: any
  let mappedProgramA: any
  let adminUser: any
  let adminToken: string
  let adminCookie: string

  beforeAll(async () => {
    // 1. Create test tenant
    tenant = await db.tenant.create({
      data: {
        code: `ENQ-${ts.slice(-6)}`,
        name: `Enquiry Test Academy ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Create 2 branches
    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'South Campus',
        code: `SC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'North Campus',
        code: `NC-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    // 3. Create programs
    // Universal program (no specific branch mappings => offered universally)
    universalProgram = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Playgroup Explorers',
        code: `PG-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        capacity: 25,
      },
    })

    // Mapped program (only offered at branchA)
    mappedProgramA = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Nursery Scholars',
        code: `NUR-${ts.slice(-4)}`,
        programType: 'NURSERY',
        capacity: 20,
      },
    })
    await db.programBranch.create({
      data: {
        tenantId: tenant.id,
        programId: mappedProgramA.id,
        branchId: branchA.id,
      },
    })

    // 4. Create active academic session
    await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Session 2026-${ts.slice(-2)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    // 5. Create admin user & session token
    adminUser = await db.user.create({
      data: {
        email: `principal.enq.${ts}@test.com`,
        username: `principal_enq_${ts}`,
        fullName: 'Principal Meenakshi',
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    adminToken = await signToken({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branchA.id,
      roles: ['PRINCIPAL'],
    })
    adminCookie = `auth-token=${adminToken}`
  })

  // ── Test 1: Public Enquiry GET respects branch filtering and universal programs ──
  it('E2E-01: Public enquiry API loads branches and dynamically filters programs per branch', async () => {
    // Check branchA programs
    const reqA = new NextRequest(`http://localhost:3000/api/v1/public/enquiry?schoolCode=${tenant.code}&branchId=${branchA.id}`)
    const resA = await publicEnquiryGet(reqA)
    expect(resA.status).toBe(200)
    const jsonA = await resA.json()
    expect(jsonA.success).toBe(true)
    expect(jsonA.data.branches.length).toBe(2)
    // Both universal program and mappedProgramA should be returned for branchA
    const progIdsA = jsonA.data.programs.map((p: any) => p.id)
    expect(progIdsA).toContain(universalProgram.id)
    expect(progIdsA).toContain(mappedProgramA.id)

    // Check branchB programs (mappedProgramA should NOT be returned)
    const reqB = new NextRequest(`http://localhost:3000/api/v1/public/enquiry?schoolCode=${tenant.code}&branchId=${branchB.id}`)
    const resB = await publicEnquiryGet(reqB)
    expect(resB.status).toBe(200)
    const jsonB = await resB.json()
    expect(jsonB.success).toBe(true)
    const progIdsB = jsonB.data.programs.map((p: any) => p.id)
    expect(progIdsB).toContain(universalProgram.id)
    expect(progIdsB).not.toContain(mappedProgramA.id)
  })

  // ── Test 2: Internal Enquiry submission via /api/v1/leads persists in PostgreSQL ──
  it('E2E-02: Internal enquiry form creates and persists lead in PostgreSQL with program & branch', async () => {
    const parentPhone = `98${ts.slice(-8)}`
    const req = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        parentName: 'Rohan Deshmukh',
        phone: parentPhone,
        email: 'rohan.deshmukh@example.com',
        childName: 'Vihaan Deshmukh',
        childDob: '2023-01-15',
        branchId: branchA.id,
        interestedProgram: mappedProgramA.code, // Passed as program code from select element
        source: 'WALK_IN',
        notes: 'Inquired about playgroup and nursery admissions for upcoming session',
      }),
    })

    const res = await leadsPost(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.leadNumber).toContain('ENQ-')
    expect(json.data.parentName).toBe('Rohan Deshmukh')
    expect(json.data.phone).toBe(parentPhone)

    // Verify record in PostgreSQL directly via Prisma
    const persisted = await db.lead.findUnique({
      where: { id: json.data.id },
    })
    expect(persisted).not.toBeNull()
    expect(persisted?.parentName).toBe('Rohan Deshmukh')
    expect(persisted?.phone).toBe(parentPhone)
    expect(persisted?.branchId).toBe(branchA.id)
    expect(persisted?.interestedProgram).toBe('NURSERY')
    expect(persisted?.status).toBe('NEW')
  })

  // ── Test 3: Newly created enquiry appears immediately in Admissions Ledger query ──
  it('E2E-03: Admissions enquiry ledger GET returns newly submitted enquiry', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/leads?branchId=${branchA.id}`, {
      headers: { cookie: adminCookie },
    })
    const res = await leadsGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    const found = json.data.find((l: any) => l.parentName === 'Rohan Deshmukh')
    expect(found).toBeDefined()
    expect(found.branchName).toBe('South Campus')
  })

  // ── Test 4: Duplicate Phone Detection surfaces clean warning and allows override ──
  it('E2E-04: Duplicate phone returns duplicate warning payload with isDuplicate flag in both data and meta', async () => {
    const parentPhone = `98${ts.slice(-8)}` // Same phone as E2E-02
    const reqDuplicate = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        parentName: 'Rohan Deshmukh (Repeat)',
        phone: parentPhone,
        branchId: branchA.id,
        interestedProgram: mappedProgramA.code,
        source: 'PHONE',
        overrideDuplicate: false,
      }),
    })

    const resDup = await leadsPost(reqDuplicate)
    expect(resDup.status).toBe(200)
    const jsonDup = await resDup.json()
    expect(jsonDup.success).toBe(true)
    expect(jsonDup.data.isDuplicate).toBe(true)
    expect(jsonDup.meta?.isDuplicate).toBe(true)
    expect(jsonDup.data.leadNumber).toContain('ENQ-')

    // Now test with overrideDuplicate: true -> creates another lead successfully
    const reqOverride = new NextRequest('http://localhost:3000/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({
        parentName: 'Rohan Deshmukh Sibling',
        phone: parentPhone,
        childName: 'Ananya Deshmukh',
        branchId: branchA.id,
        interestedProgram: universalProgram.programType,
        source: 'PHONE',
        overrideDuplicate: true,
      }),
    })

    const resOverride = await leadsPost(reqOverride)
    expect(resOverride.status).toBe(201)
    const jsonOverride = await resOverride.json()
    expect(jsonOverride.success).toBe(true)
    expect(jsonOverride.data.childName).toBe('Ananya Deshmukh')
  })

  // ── Test 5: Public Online Form submission persists in database ──
  it('E2E-05: Public online form POST reliably creates lead and stores in database', async () => {
    const onlinePhone = `97${ts.slice(-8)}`
    const req = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: tenant.code,
        branchId: branchB.id,
        parentName: 'Deepa Kulkarni',
        phone: onlinePhone,
        email: 'deepa.kulkarni@example.com',
        childName: 'Advik Kulkarni',
        childDob: '2023-05-20',
        interestedProgram: universalProgram.code, // Program code
        notes: 'Interested in day care facilities along with playgroup',
      }),
    })

    const res = await publicEnquiryPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.leadNumber).toContain('ENQ-')

    // Verify in database
    const publicLead = await db.lead.findFirst({
      where: {
        tenantId: tenant.id,
        phone: onlinePhone,
      },
    })
    expect(publicLead).not.toBeNull()
    expect(publicLead?.parentName).toBe('Deepa Kulkarni')
    expect(publicLead?.childName).toBe('Advik Kulkarni')
    expect(publicLead?.branchId).toBe(branchB.id)
    expect(publicLead?.interestedProgram).toBe('PLAYGROUP')
    expect(publicLead?.source).toBe('WEBSITE')
  })
})

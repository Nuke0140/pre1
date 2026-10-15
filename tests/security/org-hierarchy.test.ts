import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { GET as orgHierarchyGet } from '@/app/api/v1/users/org-hierarchy/route'
import { POST as userPost, GET as usersGet } from '@/app/api/v1/users/route'
import { PATCH as userPatch, GET as userGet } from '@/app/api/v1/users/[id]/route'
import bcrypt from 'bcryptjs'
import { signSession } from '@/lib/auth'

describe('Org Hierarchy & Reporting Manager (Doc 5.2 / P3 Sprint)', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let owner: any
  let ownerMember: any
  let ownerStaff: any
  let cookieOwner: string

  let principalUser: any
  let principalMember: any
  let principalStaff: any

  let coordinatorUser: any
  let coordinatorMember: any
  let coordinatorStaff: any

  let teacherUser: any
  let teacherMember: any
  let teacherStaff: any

  let helperUser: any
  let helperMember: any
  let helperStaff: any

  beforeAll(async () => {
    // 1. Create Tenant and Branch
    tenant = await db.tenant.create({
      data: {
        code: `ORG-${ts.slice(-5)}`,
        name: `Org Hierarchy Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `ORG-MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    const passwordHash = await bcrypt.hash('Preone@123', 10)

    // 2. Owner (Top leader)
    owner = await db.user.create({
      data: {
        email: `owner.org.${ts}@test.com`,
        fullName: 'Dr. Arthur Founder',
        phone: `+9198${ts.slice(-8)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    ownerMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })
    ownerStaff = await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        employeeCode: `EMP-OWN-${ts.slice(-4)}`,
        designation: 'School Founder & Chairman',
        department: 'Administration',
        employmentType: 'FULL_TIME',
        branchId: branch.id,
      },
    })

    cookieOwner = await signSession({
      uid: owner.id,
      email: owner.email,
      name: owner.fullName,
      role: 'OWNER',
      roles: ['OWNER'],
      tenantId: tenant.id,
      branchId: branch.id,
    })

    // 3. Principal (reports to Owner)
    principalUser = await db.user.create({
      data: {
        email: `principal.org.${ts}@test.com`,
        fullName: 'Mrs. Beatrice Principal',
        phone: `+9197${ts.slice(-8)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    principalMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: principalUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })
    principalStaff = await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: principalUser.id,
        employeeCode: `EMP-PRI-${ts.slice(-4)}`,
        designation: 'Head of School',
        department: 'Academics',
        employmentType: 'FULL_TIME',
        branchId: branch.id,
        reportingManagerId: ownerStaff.id,
      },
    })

    // 4. Coordinator (reports to Principal)
    coordinatorUser = await db.user.create({
      data: {
        email: `coordinator.org.${ts}@test.com`,
        fullName: 'Mr. Charles Coordinator',
        phone: `+9196${ts.slice(-8)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    coordinatorMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: coordinatorUser.id,
        role: 'COORDINATOR',
        roles: ['COORDINATOR'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })
    coordinatorStaff = await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: coordinatorUser.id,
        employeeCode: `EMP-COO-${ts.slice(-4)}`,
        designation: 'Academic Coordinator',
        department: 'Academics',
        employmentType: 'FULL_TIME',
        branchId: branch.id,
        reportingManagerId: principalStaff.id,
      },
    })

    // 5. Teacher (reports to Coordinator)
    teacherUser = await db.user.create({
      data: {
        email: `teacher.org.${ts}@test.com`,
        fullName: 'Ms. Danielle Teacher',
        phone: `+9195${ts.slice(-8)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    teacherMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })
    teacherStaff = await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        employeeCode: `EMP-TEA-${ts.slice(-4)}`,
        designation: 'Kindergarten Lead Teacher',
        department: 'Academics',
        employmentType: 'FULL_TIME',
        branchId: branch.id,
        reportingManagerId: coordinatorStaff.id,
      },
    })

    // 6. Support Staff / Helper (unassigned manager initially for fallback testing)
    helperUser = await db.user.create({
      data: {
        email: `helper.org.${ts}@test.com`,
        fullName: 'Mr. Ethan Helper',
        phone: `+9194${ts.slice(-8)}`,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    helperMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: helperUser.id,
        role: 'STAFF',
        roles: ['STAFF'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })
    helperStaff = await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: helperUser.id,
        employeeCode: `EMP-HLP-${ts.slice(-4)}`,
        designation: 'Classroom Care Attendant',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        branchId: branch.id,
        // reportingManagerId is null deliberately
      },
    })
  })

  it('1. GET /api/v1/users/org-hierarchy returns authenticated tree with roots and department stats', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users/org-hierarchy', {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwner}`,
      },
    })

    const res = await orgHierarchyGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.roots).toBeDefined()
    expect(json.data.roots.length).toBeGreaterThan(0)
    expect(json.data.totalStaff).toBe(5)

    // Department breakdown
    expect(json.data.departments['Academics']).toBe(3)
    expect(json.data.departments['Administration']).toBe(1)
    expect(json.data.departments['Operations']).toBe(1)

    // Verify tree connections
    const ownerNode = json.data.roots.find((r: any) => r.id === ownerStaff.id)
    expect(ownerNode).toBeDefined()
    expect(ownerNode.name).toBe('Dr. Arthur Founder')
    expect(ownerNode.children.some((c: any) => c.id === principalStaff.id)).toBe(true)

    // Verify Principal has Coordinator as direct report
    const principalNode = ownerNode.children.find((c: any) => c.id === principalStaff.id)
    expect(principalNode).toBeDefined()
    expect(principalNode.directReportsCount).toBeGreaterThan(0)
    expect(principalNode.children.some((c: any) => c.id === coordinatorStaff.id)).toBe(true)

    // Verify Coordinator has Teacher as direct report
    const coordinatorNode = principalNode.children.find((c: any) => c.id === coordinatorStaff.id)
    expect(coordinatorNode).toBeDefined()
    expect(coordinatorNode.children.some((c: any) => c.id === teacherStaff.id)).toBe(true)
  })

  it('2. GET /api/v1/users/[id] returns reportingManager and directReports details', async () => {
    // Check Principal: reports to Owner, has Coordinator as direct report
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${principalMember.id}`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await userGet(req, { params: Promise.resolve({ id: principalMember.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.reportingManager).toBeDefined()
    expect(json.data.reportingManager.name).toBe('Dr. Arthur Founder')
    expect(json.data.reportingManager.designation).toBe('School Founder & Chairman')

    expect(json.data.staffProfile.directReports).toBeDefined()
    expect(json.data.staffProfile.directReportsCount).toBe(1)
    expect(json.data.staffProfile.directReports[0].name).toBe('Mr. Charles Coordinator')
  })

  it('3. PATCH /api/v1/users/[id] prevents self-reporting (circular reporting line)', async () => {
    // Try to set coordinator to report to themselves
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${coordinatorMember.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        reportingManagerId: coordinatorUser.id,
      }),
    })

    const res = await userPatch(req, { params: Promise.resolve({ id: coordinatorMember.id }) })
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CIRCULAR_REPORTING_LINE')
    expect(json.error.message).toContain('themselves')
  })

  it('4. PATCH /api/v1/users/[id] reassigns reporting manager successfully', async () => {
    // Reassign Helper to report to Coordinator
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${helperMember.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        reportingManagerId: coordinatorStaff.id,
      }),
    })

    const res = await userPatch(req, { params: Promise.resolve({ id: helperMember.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.reportingManager).toBeDefined()
    expect(json.data.reportingManager.id).toBe(coordinatorStaff.id)
    expect(json.data.reportingManager.name).toBe('Mr. Charles Coordinator')

    // Verify Coordinator's direct reports count is now 2 (Teacher + Helper)
    const reqCoord = new NextRequest(`http://localhost:3000/api/v1/users/${coordinatorMember.id}`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })
    const resCoord = await userGet(reqCoord, { params: Promise.resolve({ id: coordinatorMember.id }) })
    const jsonCoord = await resCoord.json()
    expect(jsonCoord.data.staffProfile.directReportsCount).toBe(2)
  })

  it('5. PATCH /api/v1/users/[id] clears reporting manager when set to null', async () => {
    // Clear Helper's reporting manager
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${helperMember.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        reportingManagerId: null,
      }),
    })

    const res = await userPatch(req, { params: Promise.resolve({ id: helperMember.id }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.reportingManager).toBeNull()
    expect(json.data.reportingManagerId).toBeNull()
  })

  it('6. POST /api/v1/users creates new staff with reportingManagerId wired', async () => {
    const newStaffEmail = `new.teacher.${ts}@test.com`
    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwner}`,
      },
      body: JSON.stringify({
        fullName: 'Ms. Emily NewTeacher',
        email: newStaffEmail,
        phone: `+9193${ts.slice(-8)}`,
        username: `emily.teacher.${ts.slice(-4)}`,
        password: 'Preone@123',
        role: 'TEACHER',
        branchId: branch.id,
        designation: 'Primary Art Teacher',
        department: 'Academics',
        reportingManagerId: principalStaff.id,
      }),
    })

    const res = await userPost(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.reportingManagerId).toBe(principalStaff.id)
    expect(json.data.reportingManager).toBeDefined()
    expect(json.data.reportingManager.name).toBe('Mrs. Beatrice Principal')
  })

  it('7. GET /api/v1/users/org-hierarchy filters by department and query', async () => {
    // Query filter
    const req = new NextRequest('http://localhost:3000/api/v1/users/org-hierarchy?q=Arthur', {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const res = await orgHierarchyGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.allNodes.length).toBe(1)
    expect(json.data.allNodes[0].name).toBe('Dr. Arthur Founder')

    // Department filter
    const reqDept = new NextRequest('http://localhost:3000/api/v1/users/org-hierarchy?department=Operations', {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieOwner}` },
    })

    const resDept = await orgHierarchyGet(reqDept)
    expect(resDept.status).toBe(200)
    const jsonDept = await resDept.json()
    expect(jsonDept.data.allNodes.length).toBe(1)
    expect(jsonDept.data.allNodes[0].department).toBe('Operations')
  })
})

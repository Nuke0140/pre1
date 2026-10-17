import { describe, it, expect, beforeAll, spyOn } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { GET as studentsGet } from '@/app/api/v1/inventory/welcome-kits/students/route'
import { StudentStatus } from '@prisma/client'
import fs from 'fs'
import path from 'path'

describe('QA-006: Welcome-Kit Student Search (GET /api/v1/inventory/welcome-kits/students)', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchB1: string
  let classroomA: string

  let principalCookieA: string
  let staffCookieA: string
  let unauthorizedCookieA: string

  let activeStudentA1: any
  let activeStudentA2: any
  let activeStudentA3: any
  let inactiveStudentA: any
  let transferredStudentA: any
  let activeStudentB: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenants
    const tA = await db.tenant.create({
      data: {
        name: `WelcomeKit Test School A ${ts}`,
        code: `WK_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    const tB = await db.tenant.create({
      data: {
        name: `WelcomeKit Test School B ${ts}`,
        code: `WK_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 2. Branches
    const brA = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus A',
        code: `BR_A_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchA1 = brA.id

    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Main Campus B',
        code: `BR_B_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchB1 = brB.id

    // 3. Academic Session & Classroom
    const sesA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })

    const clsA = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: sesA.id,
        name: 'Sunflower Nursery',
        code: `CLS_A_${ts}`,
        programType: 'NURSERY',
        capacity: 30,
      },
    })
    classroomA = clsA.id

    // 4. Students in Tenant A
    activeStudentA1 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-WK1-${ts}`,
        firstName: 'Vivaan',
        lastName: 'Kapoor',
        dob: new Date('2023-01-10'),
        gender: 'MALE',
        status: StudentStatus.ACTIVE,
        currentClassroomId: classroomA,
      },
    })

    activeStudentA2 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-WK2-${ts}`,
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        dob: new Date('2023-03-15'),
        gender: 'FEMALE',
        status: StudentStatus.ACTIVE,
        currentClassroomId: classroomA,
      },
    })

    activeStudentA3 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-WK3-${ts}`,
        firstName: 'Reyansh',
        lastName: 'Singhania',
        dob: new Date('2023-06-20'),
        gender: 'MALE',
        status: StudentStatus.ACTIVE,
        currentClassroomId: classroomA,
      },
    })

    inactiveStudentA = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-INACTIVE-${ts}`,
        firstName: 'Rohan',
        lastName: 'Inactive',
        dob: new Date('2023-02-12'),
        gender: 'MALE',
        status: StudentStatus.INACTIVE,
        currentClassroomId: classroomA,
      },
    })

    transferredStudentA = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-TRANS-${ts}`,
        firstName: 'Ishaan',
        lastName: 'Transferred',
        dob: new Date('2023-04-18'),
        gender: 'MALE',
        status: StudentStatus.TRANSFERRED,
        currentClassroomId: classroomA,
      },
    })

    // Student in Tenant B (for cross-tenant isolation testing)
    activeStudentB = await db.student.create({
      data: {
        tenantId: tenantB,
        branchId: branchB1,
        admissionNo: `ADM-B-${ts}`,
        firstName: 'Vivaan', // Same first name as A1 to verify tenant isolation
        lastName: 'Kapoor',
        dob: new Date('2023-01-10'),
        gender: 'MALE',
        status: StudentStatus.ACTIVE,
      },
    })

    // 5. Create Users in DB
    const principalUserA = await db.user.create({
      data: {
        email: `principal.wk.a.${ts}@preone.test`,
        fullName: 'Principal User',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    const staffUserA = await db.user.create({
      data: {
        email: `staff.wk.a.${ts}@preone.test`,
        fullName: 'Staff User',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    const unauthorizedUserA = await db.user.create({
      data: {
        email: `driver.wk.a.${ts}@preone.test`,
        fullName: 'Driver User',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    // Auth Sessions & Cookies
    principalCookieA = await signSession({
      uid: principalUserA.id,
      email: principalUserA.email,
      name: principalUserA.fullName,
      tenantId: tenantA,
      branchId: branchA1,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    staffCookieA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      name: staffUserA.fullName,
      tenantId: tenantA,
      branchId: branchA1,
      role: 'STAFF',
      roles: ['STAFF'],
    })

    unauthorizedCookieA = await signSession({
      uid: unauthorizedUserA.id,
      email: unauthorizedUserA.email,
      name: unauthorizedUserA.fullName,
      tenantId: tenantA,
      branchId: branchA1,
      role: 'DRIVER',
      roles: ['DRIVER'],
    })
  })

  // 1. Successful search: valid request returns HTTP 200 and expected shape
  it('1. returns HTTP 200 and a paginated list of eligible students for a valid request', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/welcome-kits/students', {
      method: 'GET',
      headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
    })

    const res = await studentsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.students)).toBe(true)
    expect(json.data.students.length).toBeGreaterThanOrEqual(3)

    // Verify student shape
    const s = json.data.students.find((item: any) => item.id === activeStudentA1.id)
    expect(s).toBeDefined()
    expect(s.admissionNo).toBe(activeStudentA1.admissionNo)
    expect(s.fullName).toBe('Vivaan Kapoor')
    expect(s.firstName).toBe('Vivaan')
    expect(s.status).toBe(StudentStatus.ACTIVE)
    expect(s.classroom).toBeDefined()
    expect(s.classroom.name).toBe('Sunflower Nursery')
    expect(s.hasPreviousKit).toBe(false)
  })

  // 2. Status filtering: Prisma query uses only valid StudentStatus enum values
  it('2. filters by StudentStatus.ACTIVE and excludes INACTIVE and TRANSFERRED students', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/welcome-kits/students', {
      method: 'GET',
      headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
    })

    const res = await studentsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    const studentIds = json.data.students.map((item: any) => item.id)

    expect(studentIds).toContain(activeStudentA1.id)
    expect(studentIds).toContain(activeStudentA2.id)
    expect(studentIds).toContain(activeStudentA3.id)
    expect(studentIds).not.toContain(inactiveStudentA.id)
    expect(studentIds).not.toContain(transferredStudentA.id)
  })

  // 3. Type safety: No `as any` remains in the route file
  it('3. ensures type-safety: route file contains no "as any" cast', () => {
    const routeFilePath = path.resolve(
      __dirname,
      '../../src/app/api/v1/inventory/welcome-kits/students/route.ts'
    )
    const fileContent = fs.readFileSync(routeFilePath, 'utf-8')
    expect(fileContent).not.toContain('as any')
  })

  // 4. Pagination: parameters and metadata work correctly
  it('4. supports pagination parameters (page, pageSize) and returns metadata', async () => {
    // Page 1, pageSize = 2
    const req1 = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?page=1&pageSize=2',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )

    const res1 = await studentsGet(req1)
    expect(res1.status).toBe(200)

    const json1 = await res1.json()
    expect(json1.success).toBe(true)
    expect(json1.data.students.length).toBe(2)
    expect(json1.data.pagination).toBeDefined()
    expect(json1.data.pagination.page).toBe(1)
    expect(json1.data.pagination.pageSize).toBe(2)
    expect(json1.data.pagination.total).toBeGreaterThanOrEqual(3)
    expect(json1.data.pagination.totalPages).toBe(Math.ceil(json1.data.pagination.total / 2))

    // Page 2, pageSize = 2
    const req2 = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?page=2&pageSize=2',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )

    const res2 = await studentsGet(req2)
    expect(res2.status).toBe(200)

    const json2 = await res2.json()
    expect(json2.data.students.length).toBeGreaterThanOrEqual(1)
    expect(json2.data.pagination.page).toBe(2)

    // Ensure page 1 and page 2 returned different students
    const page1Ids = json1.data.students.map((item: any) => item.id)
    const page2Ids = json2.data.students.map((item: any) => item.id)
    for (const id of page2Ids) {
      expect(page1Ids).not.toContain(id)
    }
  })

  // 5. Search behavior: search by supported student identifiers/name
  it('5. searches eligible students by firstName, lastName, or admissionNo', async () => {
    // Search by firstName
    const reqFirst = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?q=Ananya',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resFirst = await studentsGet(reqFirst)
    const jsonFirst = await resFirst.json()
    expect(resFirst.status).toBe(200)
    expect(jsonFirst.data.students.some((s: any) => s.id === activeStudentA2.id)).toBe(true)
    expect(jsonFirst.data.students.some((s: any) => s.id === activeStudentA1.id)).toBe(false)

    // Search by lastName
    const reqLast = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?q=Deshmukh',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resLast = await studentsGet(reqLast)
    const jsonLast = await resLast.json()
    expect(resLast.status).toBe(200)
    expect(jsonLast.data.students.some((s: any) => s.id === activeStudentA2.id)).toBe(true)

    // Search by admissionNo
    const reqAdm = new NextRequest(
      `http://localhost:3000/api/v1/inventory/welcome-kits/students?q=${activeStudentA3.admissionNo}`,
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resAdm = await studentsGet(reqAdm)
    const jsonAdm = await resAdm.json()
    expect(resAdm.status).toBe(200)
    expect(jsonAdm.data.students.length).toBe(1)
    expect(jsonAdm.data.students[0].id).toBe(activeStudentA3.id)
  })

  // 6. No results: returns empty paginated list without server error
  it('6. returns empty paginated results with HTTP 200 when no student matches', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?q=NONEXISTENT_QUERY_99999',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )

    const res = await studentsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.students).toEqual([])
    expect(json.data.pagination.total).toBe(0)
    expect(json.data.pagination.totalPages).toBe(0)
  })

  // 7. Database failure: simulated unexpected failure returns HTTP 500
  it('7. returns HTTP 500 when an unexpected database error occurs', async () => {
    const origCount = db.student.count
    ;(db.student as any).count = async () => {
      throw new Error('Connection pool exhausted / Postgres internal failure')
    }

    try {
      const req = new NextRequest(
        'http://localhost:3000/api/v1/inventory/welcome-kits/students',
        {
          method: 'GET',
          headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
        }
      )

      const res = await studentsGet(req)
      expect(res.status).toBe(500)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('STUDENT_SEARCH_FAILED')
      // Ensure no raw SQL or internal message leaked to client
      expect(json.error.message).not.toContain('Connection pool')
      expect(json.error.message).toContain('unexpected error')
    } finally {
      ;(db.student as any).count = origCount
    }
  })

  // 8. Client errors: malformed query parameters return HTTP 400
  it('8. returns HTTP 400 for malformed query parameters (e.g. invalid page, pageSize, status)', async () => {
    // Malformed page
    const reqInvalidPage = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?page=-1',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resPage = await studentsGet(reqInvalidPage)
    expect(resPage.status).toBe(400)
    const jsonPage = await resPage.json()
    expect(jsonPage.success).toBe(false)
    expect(jsonPage.error.field).toBe('page')

    // Malformed pageSize
    const reqInvalidSize = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?pageSize=abc',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resSize = await studentsGet(reqInvalidSize)
    expect(resSize.status).toBe(400)
    const jsonSize = await resSize.json()
    expect(jsonSize.success).toBe(false)
    expect(jsonSize.error.field).toBe('pageSize')

    // Invalid status enum parameter
    const reqInvalidStatus = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students?status=INVALID_STATUS_VALUE',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resStatus = await studentsGet(reqInvalidStatus)
    expect(resStatus.status).toBe(400)
    const jsonStatus = await resStatus.json()
    expect(jsonStatus.success).toBe(false)
    expect(jsonStatus.error.field).toBe('status')
  })

  // 9. Authorization and tenant isolation
  it('9. enforces authentication, role permissions, and tenant isolation', async () => {
    // Unauthenticated request -> 401
    const reqUnauth = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students',
      { method: 'GET' }
    )
    const resUnauth = await studentsGet(reqUnauth)
    expect(resUnauth.status).toBe(401)

    // Unauthorized role (DRIVER has no inventory:read permission) -> 403
    const reqDriver = new NextRequest(
      'http://localhost:3000/api/v1/inventory/welcome-kits/students',
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${unauthorizedCookieA}` },
      }
    )
    const resDriver = await studentsGet(reqDriver)
    expect(resDriver.status).toBe(403)

    // Cross-tenant isolation: Tenant A cannot see Tenant B's student
    const reqTenantA = new NextRequest(
      `http://localhost:3000/api/v1/inventory/welcome-kits/students?q=${activeStudentB.admissionNo}`,
      {
        method: 'GET',
        headers: { cookie: `${SESSION_COOKIE}=${principalCookieA}` },
      }
    )
    const resTenantA = await studentsGet(reqTenantA)
    const jsonTenantA = await resTenantA.json()
    expect(resTenantA.status).toBe(200)
    expect(jsonTenantA.data.students.length).toBe(0)
  })

  // 10. Staff with inventory:read permission can access
  it('10. allows STAFF user with inventory:read permission to search eligible students', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/welcome-kits/students', {
      method: 'GET',
      headers: { cookie: `${SESSION_COOKIE}=${staffCookieA}` },
    })

    const res = await studentsGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.students.length).toBeGreaterThanOrEqual(3)
  })
})

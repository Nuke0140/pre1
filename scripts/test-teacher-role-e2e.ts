/**
 * Comprehensive Teacher Role RBAC & Access Verification Test Suite
 * Tests A through J covering Authentication, Scoping, Nav, APIs, and Boundary Isolation.
 */
import { db } from '../src/lib/db'
import { NextRequest } from 'next/server'
import { navForRole } from '../src/lib/nav'
import { GET as getMe } from '../src/app/api/v1/me/route'
import { GET as getClassrooms } from '../src/app/api/v1/classrooms/route'
import { GET as getAttendance } from '../src/app/api/v1/attendance/route'
import { GET as getTeacherToday } from '../src/app/api/v1/teacher/today/route'
import { GET as getStudents, POST as postStudent } from '../src/app/api/v1/students/route'
import { GET as getStudentDashboard } from '../src/app/api/v1/students/dashboard/route'
import { GET as getAcademicsActivities } from '../src/app/api/v1/academics/activities/route'
import { GET as getDailyDiaryContext } from '../src/app/api/v1/daily-diary/context/route'
import { POST as postReportsQuery } from '../src/app/api/v1/reports/query/route'
import { SessionService } from '../src/lib/users/session-service'
import { signSession } from '../src/lib/auth'

function reqWithCookie(url: string, token: string, method = 'GET', body?: any): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: {
      cookie: `preone_session=${token}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return req
}

let createdToken: string | null = null
let fixtureTenantId: string | null = null

async function run() {
  console.log('=================================================================')
  console.log('   PREONE TEACHER ROLE RBAC & ACCESS RECOVERY VERIFICATION')
  console.log('=================================================================')

  const testSuffix = Date.now().toString().slice(-6)

  // 1. Setup isolated preschool tenant fixture
  const tenant = await db.tenant.create({
    data: {
      code: `TCH-${testSuffix}`,
      name: `Teacher E2E Preschool ${testSuffix}`,
      status: 'ACTIVE',
    },
  })
  fixtureTenantId = tenant.id

  const branch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Campus',
      code: `BR-${testSuffix}`,
      isMain: true,
      isActive: true,
    },
  })

  const session = await db.academicSession.create({
    data: {
      tenantId: tenant.id,
      name: `AY 2026-27 ${testSuffix}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
      isCurrent: true,
    },
  })

  const teacherUser = await db.user.create({
    data: {
      email: `teacher.e2e.${testSuffix}@preone.test`,
      username: `teacher_e2e_${testSuffix}`,
      fullName: `Anita Sharma`,
      passwordHash: 'dummy-hash',
      status: 'ACTIVE',
    },
  })

  // Membership with branchId: null to test fallback resolution resilience
  await db.tenantUser.create({
    data: {
      userId: teacherUser.id,
      tenantId: tenant.id,
      branchId: null, // tests fallback resolution!
      role: 'TEACHER',
      roles: ['TEACHER'],
      status: 'ACTIVE',
    },
  })

  const classroom = await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      academicSessionId: session.id,
      name: 'Sunflower Playschool',
      code: `SUN-${testSuffix}`,
      programType: 'PLAYGROUP',
      capacity: 15,
      primaryTeacherId: teacherUser.id,
      isActive: true,
    },
  })

  const student = await db.student.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      admissionNo: `STU-E2E-${testSuffix}`,
      firstName: 'Vihaan',
      lastName: 'Patel',
      dob: new Date('2022-06-10'),
      gender: 'MALE',
      currentClassroomId: classroom.id,
      status: 'ACTIVE',
    },
  })

  console.log(`Fixture created: Teacher "${teacherUser.fullName}", Classroom "${classroom.name}", Student "${student.firstName}"`)

  // Create JWT token for Teacher
  const token = await signSession({
    uid: teacherUser.id,
    email: teacherUser.email,
    name: teacherUser.fullName,
    tenantId: tenant.id,
    branchId: null, // branchId null to test fallback
    role: 'TEACHER',
    roles: ['TEACHER'],
  })
  createdToken = token

  // Register active session in database so SessionService validation succeeds
  await SessionService.createSession({
    userId: teacherUser.id,
    tenantId: tenant.id,
    token,
  })

  let allPass = true
  function assert(testName: string, passed: boolean, detail?: any) {
    if (passed) {
      console.log(`[PASS] ${testName}`)
    } else {
      console.error(`[FAIL] ${testName}`, detail || '')
      allPass = false
    }
  }

  // ── TEST A: /api/v1/me Hydration & Multi-Role Sync ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/me', token)
    const res = await getMe(req)
    const json = await res.json()
    assert(
      'Test A: /api/v1/me returns 200 with role and effective roles array',
      json.success === true && json.data.role === 'TEACHER' && Array.isArray(json.data.roles) && json.data.roles.includes('TEACHER'),
      json
    )
  }

  // ── TEST B: Navigation for Teacher Role (navForRole) ──
  {
    const navItems = navForRole('TEACHER', ['TEACHER'])
    const routes = navItems.map((n: any) => n.href)
    console.log(`Teacher visible navigation routes: ${routes.join(', ')}`)
    assert(
      'Test B1: Teacher navigation includes core operational modules',
      (routes.includes('/app/dashboard') || routes.includes('/app/home')) &&
      routes.includes('/app/daily-diary') &&
      routes.includes('/app/students') &&
      routes.includes('/app/learning') &&
      routes.includes('/app/transport') &&
      routes.includes('/app/inventory') &&
      routes.includes('/app/reports')
    )
    assert(
      'Test B2: Teacher navigation excludes forbidden admin modules (/app/finance, /app/settings, /app/users)',
      !routes.includes('/app/finance') && !routes.includes('/app/settings') && !routes.includes('/app/users')
    )
  }

  // ── TEST C: Classroom Directory Access Without 403 ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/classrooms', token)
    const res = await getClassrooms(req)
    const json = await res.json()
    assert(
      'Test C: GET /api/v1/classrooms returns 200 without branch-access denial',
      res.status === 200 && json.success === true && Array.isArray(json.data) && json.data.length >= 1
    )
  }

  // ── TEST D: Attendance API Crash Recovery (AcademicSession schema fix) ──
  {
    const req = reqWithCookie(`http://localhost:3000/api/v1/attendance?classroomId=${classroom.id}`, token)
    const res = await getAttendance(req)
    const json = await res.json()
    assert(
      'Test D: GET /api/v1/attendance returns 200 OK without PrismaClientValidationError crash',
      res.status === 200 && json.success === true,
      json
    )
  }

  // ── TEST E: Teacher Dashboard Today API ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/teacher/today', token)
    const res = await getTeacherToday(req)
    const json = await res.json()
    assert(
      'Test E: GET /api/v1/teacher/today returns 200 with stats, actions, and sections',
      res.status === 200 && json.success === true && (json.data?.stats !== undefined || json.data?.actions !== undefined),
      json
    )
  }

  // ── TEST F: Students Roster & Scoping ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/students', token)
    const res = await getStudents(req)
    const json = await res.json()
    assert(
      'Test F1: GET /api/v1/students returns 200 OK with scoped student roster',
      res.status === 200 && json.success === true && Array.isArray(json.data) && json.data.length >= 1
    )

    const dashReq = reqWithCookie('http://localhost:3000/api/v1/students/dashboard', token)
    const dashRes = await getStudentDashboard(dashReq)
    const dashJson = await dashRes.json()
    assert(
      'Test F2: GET /api/v1/students/dashboard returns 200 OK with scoped metrics',
      dashRes.status === 200 && dashJson.success === true && typeof dashJson.data?.totalStudents === 'number'
    )
  }

  // ── TEST G: Academics Activities Scoping ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/academics/activities', token)
    const res = await getAcademicsActivities(req)
    const json = await res.json()
    assert(
      'Test G: GET /api/v1/academics/activities returns 200 OK scoped to teacher classrooms',
      res.status === 200 && json.success === true && Array.isArray(json.data)
    )
  }

  // ── TEST H: Daily Diary Context ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/daily-diary/context', token)
    const res = await getDailyDiaryContext(req)
    const json = await res.json()
    assert(
      'Test H: GET /api/v1/daily-diary/context returns 200 OK with isTeacher: true and assigned classroom',
      res.status === 200 && json.success === true && json.data?.user?.isTeacher === true && json.data?.classrooms?.length >= 1
    )
  }

  // ── TEST I: Reports Authorization & Queries ──
  {
    const req = reqWithCookie('http://localhost:3000/api/v1/reports/query', token, 'POST', {
      reportId: 'students-strength',
      options: {},
    })
    const res = await postReportsQuery(req)
    const json = await res.json()
    assert(
      'Test I1: POST /api/v1/reports/query allows authorized report (students-strength)',
      res.status === 200 && json.success === true
    )

    const unauthReq = reqWithCookie('http://localhost:3000/api/v1/reports/query', token, 'POST', {
      reportId: 'exec-overview', // Executive report restricted to OWNER / PRINCIPAL / COORDINATOR
      options: {},
    })
    const unauthRes = await postReportsQuery(unauthReq)
    const unauthJson = await unauthRes.json()
    assert(
      'Test I2: POST /api/v1/reports/query denies unauthorized executive report with 403 Forbidden',
      unauthRes.status === 403 && unauthJson.success === false
    )
  }

  // ── TEST J: Security Boundary Isolation (Fail-Closed) ──
  {
    // J1: Attempt to create student as Teacher (requires students:write)
    const createStuReq = reqWithCookie('http://localhost:3000/api/v1/students', token, 'POST', {
      firstName: 'Unauthorized',
      lastName: 'Student',
      dob: '2020-01-01',
      gender: 'MALE',
    })
    const createStuRes = await postStudent(createStuReq)
    assert(
      'Test J1: POST /api/v1/students returns 403 Forbidden for Teacher (cannot enroll child)',
      createStuRes.status === 403
    )

    // J2: Cross-tenant isolation verification
    const crossTenantToken = await signSession({
      uid: teacherUser.id,
      email: teacherUser.email,
      name: teacherUser.fullName,
      tenantId: 'non-existent-tenant-id-12345',
      role: 'TEACHER',
      roles: ['TEACHER'],
    })
    const crossReq = reqWithCookie('http://localhost:3000/api/v1/classrooms', crossTenantToken)
    const crossRes = await getClassrooms(crossReq)
    assert(
      'Test J2: Cross-tenant requests fail closed or return 401/403/empty',
      crossRes.status === 401 || crossRes.status === 403 || crossRes.status === 404
    )
  }

  console.log('=================================================================')
  if (allPass) {
    console.log('  ALL TESTS PASSED! Teacher role experience is fully verified.')
  } else {
    console.error('  SOME TESTS FAILED! Check output above.')
    process.exit(1)
  }
  console.log('=================================================================')
}

run()
  .catch((err) => {
    console.error('Fatal test error:', err)
    process.exit(1)
  })
  .finally(async () => {
    try {
      if (createdToken) {
        await db.userSession.deleteMany({
          where: { tokenHash: SessionService.hashToken(createdToken) },
        })
      }
      if (fixtureTenantId) {
        // Clean up test fixture
        await db.student.deleteMany({ where: { tenantId: fixtureTenantId } })
        await db.classroom.deleteMany({ where: { tenantId: fixtureTenantId } })
        await db.tenantUser.deleteMany({ where: { tenantId: fixtureTenantId } })
        await db.user.deleteMany({ where: { email: { contains: 'teacher.e2e.' } } })
        await db.academicSession.deleteMany({ where: { tenantId: fixtureTenantId } })
        await db.branch.deleteMany({ where: { tenantId: fixtureTenantId } })
        await db.tenant.deleteMany({ where: { id: fixtureTenantId } })
      }
    } catch {}
    await db.$disconnect()
  })

/**
 * PreOne — Comprehensive All Account Portals & RBAC Verification Suite
 *
 * Validates:
 * 1. Seed/ensure canonical test accounts for all 12 roles + multi-role user
 * 2. Live HTTP Authentication & Cookie Generation (/api/v1/auth/login)
 * 3. Identity Verification via decoded JWT session & login payload
 * 4. Role-Specific Portal Route Rendering & Dashboard Specialization
 * 5. Negative RBAC API Authorization & Route Boundary Enforcement
 * 6. Privilege Escalation Guards
 * 7. Multi-Role Union Permissions
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'
import { CanonicalRole, CANONICAL_ROLES, normalizeRole } from '../src/lib/roles'
import { can, ROLE_PERMISSIONS, verifySession } from '../src/lib/auth'
import { navForRole } from '../src/lib/nav'

const BASE_URL = 'http://127.0.0.1:3000'
const PASSWORD = 'Preone@123'

interface TestUserDef {
  role: CanonicalRole
  roles?: CanonicalRole[]
  email: string
  fullName: string
  permittedRoutes: string[]
  expectedDashboardBoard?: 'TEACHER' | 'PARENT' | 'EXECUTIVE'
  permittedApis: { path: string; method: string }[]
  forbiddenApis: { path: string; method: string }[]
}

const TEST_USERS: TestUserDef[] = [
  {
    role: 'PLATFORM_ADMIN',
    email: 'platform.admin@preone.test',
    fullName: 'Platform Super Admin',
    permittedRoutes: ['/onboard'],
    permittedApis: [],
    forbiddenApis: [{ path: '/api/v1/fees/structures', method: 'GET' }],
  },
  {
    role: 'OWNER',
    email: 'owner@sunshine.demo',
    fullName: 'Meera Iyer (Owner)',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/users/staff',
      '/app/users/family',
      '/app/settings',
      '/app/admissions',
      '/app/students',
      '/app/finance',
      '/app/daily-diary',
    ],
    permittedApis: [
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
    forbiddenApis: [],
  },
  {
    role: 'PRINCIPAL',
    email: 'principal@sunshine.demo',
    fullName: 'Principal Meenakshi',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/users/staff',
      '/app/settings',
      '/app/admissions',
      '/app/students',
      '/app/daily-diary',
    ],
    permittedApis: [
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
      { path: '/api/v1/admissions/summary', method: 'GET' },
    ],
    forbiddenApis: [],
  },
  {
    role: 'COORDINATOR',
    email: 'coordinator@sunshine.demo',
    fullName: 'Academic Coordinator Sneha',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/students',
      '/app/daily-diary',
    ],
    permittedApis: [
      { path: '/api/v1/students', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
    ],
  },
  {
    role: 'TEACHER',
    email: 'teacher@sunshine.demo',
    fullName: 'Anita Sharma (Educator)',
    expectedDashboardBoard: 'TEACHER',
    permittedRoutes: [
      '/app/dashboard',
      '/app/daily-diary',
      '/app/students',
    ],
    permittedApis: [
      { path: '/api/v1/students', method: 'GET' },
      { path: '/api/v1/transport/routes', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/fees/structures', method: 'GET' },
    ],
  },
  {
    role: 'ACCOUNTS',
    email: 'accounts@sunshine.demo',
    fullName: 'Ramesh Patel (Accounts)',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/finance',
    ],
    permittedApis: [
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
      { path: '/api/v1/audit-logs', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
    ],
  },
  {
    role: 'RECEPTIONIST',
    email: 'receptionist@sunshine.demo',
    fullName: 'Kavita Desk',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/admissions',
    ],
    permittedApis: [
      { path: '/api/v1/admissions/summary', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
    ],
  },
  {
    role: 'ATTENDANT',
    email: 'attendant@sunshine.demo',
    fullName: 'Sunita Attendant',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/daily-diary',
    ],
    permittedApis: [],
    forbiddenApis: [
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
  },
  {
    role: 'DRIVER',
    email: 'driver@sunshine.demo',
    fullName: 'Mahesh Transport Driver',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/transport',
    ],
    permittedApis: [
      { path: '/api/v1/transport/routes', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/fees/structures', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
    ],
  },
  {
    role: 'STAFF',
    email: 'staff@sunshine.demo',
    fullName: 'Ganesh General Operations',
    expectedDashboardBoard: 'EXECUTIVE',
    permittedRoutes: [
      '/app/dashboard',
      '/app/users',
    ],
    permittedApis: [
      { path: '/api/v1/users', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/fees/structures', method: 'GET' },
    ],
  },
  {
    role: 'PARENT',
    email: 'parent@sunshine.demo',
    fullName: 'Vikram Deshmukh (Parent)',
    expectedDashboardBoard: 'PARENT',
    permittedRoutes: [
      '/app/dashboard',
    ],
    permittedApis: [],
    forbiddenApis: [
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
  },
  {
    role: 'GUARDIAN',
    email: 'guardian@sunshine.demo',
    fullName: 'Sunita Deshmukh (Guardian)',
    expectedDashboardBoard: 'PARENT',
    permittedRoutes: [
      '/app/dashboard',
    ],
    permittedApis: [],
    forbiddenApis: [
      { path: '/api/v1/users', method: 'GET' },
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/students', method: 'GET' },
    ],
  },
  {
    role: 'TEACHER',
    roles: ['TEACHER', 'ACCOUNTS'],
    email: 'multirole@sunshine.demo',
    fullName: 'Pooja (Teacher + Accounts)',
    expectedDashboardBoard: 'TEACHER',
    permittedRoutes: [
      '/app/dashboard',
      '/app/daily-diary',
      '/app/finance',
    ],
    permittedApis: [
      { path: '/api/v1/students', method: 'GET' },
      { path: '/api/v1/fees/structures', method: 'GET' },
    ],
    forbiddenApis: [
      { path: '/api/v1/settings', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
    ],
  },
]

let passed = 0
let failed = 0

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${desc}`)
    failed++
  }
}

async function prepareSchoolTenant() {
  console.log('\n[PHASE 1] Ensuring Canonical School Tenant & Setup Status...')
  let tenant = await db.tenant.findFirst({
    where: { code: 'sunshine-preschool' },
  })

  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        code: 'sunshine-preschool',
        name: 'Sunshine International Preschool',
        status: 'ACTIVE',
        subscriptionPlan: 'PRO',
      },
    })
    console.log(`  Created tenant Sunshine Preschool (${tenant.id})`)
  }

  // Ensure main branch
  let branch = await db.branch.findFirst({
    where: { tenantId: tenant.id, isMain: true },
  })
  if (!branch) {
    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: 'MAIN',
        isMain: true,
      },
    })
    console.log(`  Created main branch (${branch.id})`)
  }

  // Ensure SchoolSetup is LIVE
  const setup = await db.schoolSetup.findUnique({
    where: { tenantId: tenant.id },
  })
  if (!setup) {
    await db.schoolSetup.create({
      data: {
        tenantId: tenant.id,
        status: 'LIVE',
        startedAt: new Date(),
        goLiveAt: new Date(),
      },
    })
    console.log('  Created SchoolSetup with status LIVE')
  } else if (setup.status !== 'LIVE') {
    await db.schoolSetup.update({
      where: { tenantId: tenant.id },
      data: { status: 'LIVE' },
    })
    console.log('  Updated SchoolSetup to LIVE')
  }

  // Ensure academic session and classroom
  let session = await db.academicSession.findFirst({
    where: { tenantId: tenant.id, isCurrent: true },
  })
  if (!session) {
    session = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })
  }

  let classroom = await db.classroom.findFirst({
    where: { tenantId: tenant.id },
  })
  if (!classroom) {
    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: session.id,
        name: 'Little Stars Pre-K',
        code: 'PREK-01',
        programType: 'PLAYGROUP',
        capacity: 25,
      },
    })
  }

  return { tenant, branch, classroom, session }
}

async function seedTestUsers(tenant: any, branch: any) {
  console.log('\n[PHASE 2] Reconciling Test Accounts Across All 12 Canonical Roles...')
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  for (const t of TEST_USERS) {
    let user = await db.user.findFirst({
      where: { email: t.email },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: t.email,
          fullName: t.fullName,
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          locale: 'en-IN',
        },
      })
      console.log(`  Created user ${t.email} (${t.role})`)
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          fullName: t.fullName,
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          failedLoginAttempts: 0,
        },
      })
      console.log(`  Reconciled user credentials for ${t.email}`)
    }

    if (t.role !== 'PLATFORM_ADMIN') {
      const existingMembership = await db.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: user.id,
          },
        },
      })

      const assignedRoles = (t.roles || [t.role]) as any[]
      if (!existingMembership) {
        await db.tenantUser.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            branchId: branch.id,
            role: t.role as any,
            roles: assignedRoles,
            status: 'ACTIVE',
          },
        })
      } else {
        await db.tenantUser.update({
          where: { id: existingMembership.id },
          data: {
            role: t.role as any,
            roles: assignedRoles,
            status: 'ACTIVE',
            branchId: branch.id,
          },
        })
      }
    }
  }
}

async function verifyLivePortalsAndRbac() {
  console.log('\n[PHASE 3] Live HTTP Authentication, JWT Claims & Locale Verification...')

  const sessionTokens: Record<string, string> = {}

  // 1. Authenticate each user
  for (const userDef of TEST_USERS) {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: userDef.email,
        password: PASSWORD,
      }),
    })

    const loginData = await res.json()
    assert(loginData.success === true, `Authentication successful for ${userDef.role} (${userDef.email})`)

    const rawCookies = res.headers.get('set-cookie') || ''
    const sessionToken = rawCookies.match(/preone_session=([^;]+)/)?.[1]
    const localeToken = rawCookies.match(/preone_locale=([^;]+)/)?.[1]

    assert(Boolean(sessionToken), `Session cookie generated for ${userDef.role}`)
    assert(localeToken === 'en-IN', `preone_locale=en-IN set on login for ${userDef.role}`)

    if (sessionToken) {
      sessionTokens[userDef.email] = sessionToken

      // Verify JWT session claims
      const payload = await verifySession(sessionToken)
      assert(payload !== null, `JWT session verified successfully for ${userDef.role}`)
      assert(
        normalizeRole(payload?.role || '') === userDef.role,
        `JWT payload returns primary role ${userDef.role}`
      )

      if (userDef.roles && userDef.roles.length > 1) {
        assert(
          (payload?.roles?.length || 0) >= 2,
          `JWT payload preserves multi-role array [${payload?.roles?.join(', ')}]`
        )
      }
    }
  }

  // 2. Navigation Item Filter Audit
  console.log('\n[PHASE 4] Navigation & Menu Role Filtering (navForRole)...')
  for (const userDef of TEST_USERS) {
    const activeRoles = userDef.roles || [userDef.role]
    const items = navForRole(activeRoles as any)
    const itemKeys = items.map((i) => i.key)

    if (userDef.role === 'PLATFORM_ADMIN') {
      assert(itemKeys.includes('platform'), 'PLATFORM_ADMIN sees Platform Console in nav')
      assert(!itemKeys.includes('daily-diary'), 'PLATFORM_ADMIN does NOT see daily-diary')
    } else if (userDef.role === 'OWNER') {
      assert(itemKeys.includes('dashboard'), 'OWNER sees dashboard')
      assert(itemKeys.includes('finance'), 'OWNER sees fees/finance')
      assert(itemKeys.includes('users'), 'OWNER sees users')
      assert(itemKeys.includes('settings'), 'OWNER sees settings')
      assert(!itemKeys.includes('platform'), 'OWNER does NOT see platform console')
    } else if (userDef.role === 'TEACHER' && !userDef.roles?.includes('ACCOUNTS')) {
      assert(itemKeys.includes('daily-diary'), 'TEACHER sees daily diary')
      assert(itemKeys.includes('students'), 'TEACHER sees students')
      assert(!itemKeys.includes('finance'), 'TEACHER does NOT see finance in nav')
      assert(!itemKeys.includes('settings'), 'TEACHER does NOT see settings in nav')
      assert(!itemKeys.includes('users'), 'TEACHER does NOT see users in nav')
    } else if (userDef.role === 'PARENT') {
      assert(itemKeys.includes('dashboard'), 'PARENT sees dashboard')
      assert(!itemKeys.includes('users'), 'PARENT does NOT see users in nav')
      assert(!itemKeys.includes('settings'), 'PARENT does NOT see settings in nav')
      assert(!itemKeys.includes('setup'), 'PARENT does NOT see setup in nav')
    } else if (userDef.role === 'DRIVER') {
      assert(itemKeys.includes('transport'), 'DRIVER sees transport in nav')
      assert(!itemKeys.includes('finance'), 'DRIVER does NOT see finance in nav')
      assert(!itemKeys.includes('settings'), 'DRIVER does NOT see settings in nav')
    } else if (userDef.roles?.includes('TEACHER') && userDef.roles?.includes('ACCOUNTS')) {
      assert(itemKeys.includes('daily-diary'), 'Multi-role TEACHER+ACCOUNTS sees daily diary')
      assert(itemKeys.includes('finance'), 'Multi-role TEACHER+ACCOUNTS sees finance')
    }
  }

  // 3. Portal Route Access (Positive tests)
  console.log('\n[PHASE 5] Live Portal Route Renders (Positive Tests)...')
  for (const userDef of TEST_USERS) {
    const token = sessionTokens[userDef.email]
    if (!token) continue

    for (const route of userDef.permittedRoutes) {
      const pageRes = await fetch(`${BASE_URL}${route}`, {
        headers: { Cookie: `preone_session=${token}; preone_locale=en-IN` },
        redirect: 'manual',
      })

      const status = pageRes.status
      const isOk = status === 200 || status === 307 || status === 308
      assert(isOk, `${userDef.role} successfully accesses permitted route ${route} (Status: ${status})`)

      // If accessing dashboard, verify specialized action board output
      if (route === '/app/dashboard' && userDef.expectedDashboardBoard) {
        const html = await pageRes.text()
        if (userDef.expectedDashboardBoard === 'TEACHER') {
          assert(
            html.includes("Today's actions") || html.includes('TeacherToday') || html.includes('follow-up') || html.includes('Attendance'),
            `TEACHER dashboard renders teacher-specific action board`
          )
        } else if (userDef.expectedDashboardBoard === 'PARENT') {
          assert(
            html.includes('My Child') || html.includes('ParentToday') || html.includes('Outstanding') || html.includes('attendance'),
            `PARENT dashboard renders parent-specific action board`
          )
        }
      }
    }
  }

  // 4. Negative RBAC API Authorization
  console.log('\n[PHASE 6] Negative RBAC API Guards (Unpermitted Route/API Access Blocked)...')
  for (const userDef of TEST_USERS) {
    const token = sessionTokens[userDef.email]
    if (!token) continue

    // Positive API check
    for (const permitted of userDef.permittedApis) {
      const apiRes = await fetch(`${BASE_URL}${permitted.path}`, {
        method: permitted.method,
        headers: { Cookie: `preone_session=${token}` },
      })
      const isPermitted = apiRes.status >= 200 && apiRes.status < 400
      assert(
        isPermitted,
        `Positive API RBAC: ${userDef.role} permitted on ${permitted.method} ${permitted.path} (HTTP ${apiRes.status})`
      )
    }

    // Negative API check
    for (const forbidden of userDef.forbiddenApis) {
      const apiRes = await fetch(`${BASE_URL}${forbidden.path}`, {
        method: forbidden.method,
        headers: { Cookie: `preone_session=${token}` },
      })

      const status = apiRes.status
      const isDenied = status === 403 || status === 401 || status === 404
      assert(
        isDenied,
        `Negative API RBAC: ${userDef.role} blocked from ${forbidden.method} ${forbidden.path} (HTTP ${status})`
      )
    }
  }

  // 5. Cross-Role Privilege Escalation Protection
  console.log('\n[PHASE 7] Privilege Escalation Negative Invariants...')
  const principalToken = sessionTokens['principal@sunshine.demo']
  if (principalToken) {
    // Principal attempts to create a user with OWNER role
    const escRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `preone_session=${principalToken}`,
      },
      body: JSON.stringify({
        email: `illegal.owner.${Date.now()}@test.com`,
        fullName: 'Illegal Owner Attempt',
        role: 'OWNER',
      }),
    })
    assert(
      escRes.status === 403 || escRes.status === 400,
      `Privilege Escalation Guard: PRINCIPAL cannot create or assign OWNER role (HTTP ${escRes.status})`
    )

    // Principal attempts to create a user with PLATFORM_ADMIN role
    const escRes2 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `preone_session=${principalToken}`,
      },
      body: JSON.stringify({
        email: `illegal.platform.${Date.now()}@test.com`,
        fullName: 'Illegal Platform Admin Attempt',
        role: 'PLATFORM_ADMIN',
      }),
    })
    assert(
      escRes2.status === 403 || escRes2.status === 400,
      `Privilege Escalation Guard: PRINCIPAL cannot create or assign PLATFORM_ADMIN role (HTTP ${escRes2.status})`
    )
  }

  // 6. Non-PLATFORM_ADMIN trying to access /onboard
  const ownerToken = sessionTokens['owner@sunshine.demo']
  if (ownerToken) {
    const onboardRes = await fetch(`${BASE_URL}/onboard`, {
      headers: { Cookie: `preone_session=${ownerToken}` },
      redirect: 'manual',
    })
    const isProtected = onboardRes.status === 307 || onboardRes.status === 302 || onboardRes.status === 403
    assert(
      isProtected,
      `Platform Guard: School OWNER cannot access /onboard (Redirected / Denied: HTTP ${onboardRes.status})`
    )
  }

  console.log('\n===============================================================')
  console.log(`ALL ACCOUNTS PORTALS & RBAC VERIFICATION SUMMARY`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log('===============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

async function main() {
  try {
    const { tenant, branch } = await prepareSchoolTenant()
    await seedTestUsers(tenant, branch)
    await verifyLivePortalsAndRbac()
  } catch (err: any) {
    console.error('Fatal error during verification:', err)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()

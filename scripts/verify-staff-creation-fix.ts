import { db } from '../src/lib/db'
import { signSession } from '../src/lib/auth'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`)
    process.exitCode = 1
  }
}

async function runVerification() {
  console.log('================================================================')
  console.log('🧪 PREONE: ADMIN USER/STAFF CREATION PRODUCTION BUG VERIFICATION')
  console.log('================================================================')

  const admin = await db.user.findFirst({ where: { email: 'admin@preone.com' } })
  if (!admin) {
    console.error('Fatal: Admin user admin@preone.com not found.')
    process.exit(1)
  }

  const adminMembership = await db.tenantUser.findFirst({
    where: { userId: admin.id },
  })
  if (!adminMembership) {
    console.error('Fatal: Admin tenant membership not found.')
    process.exit(1)
  }

  const tenantId = adminMembership.tenantId
  const branches = await db.branch.findMany({ where: { tenantId } })
  const defaultBranchId = branches[0]?.id || null

  const adminToken = await signSession({
    uid: admin.id,
    sub: admin.id,
    email: admin.email,
    name: admin.fullName,
    role: adminMembership.role,
    tenantId,
    branchId: null,
    permissions: ['*'],
  })
  const adminCookie = `preone_session=${adminToken}`

  const createdUserIds: string[] = []

  try {
    // =========================================================================
    // REQUIREMENT 1: VERIFY FIX FOR AUTO-GENERATED PASSWORD (EMPTY PASSWORD)
    // =========================================================================
    console.log('\n--- 1. STAFF CREATION WITH AUTO-GENERATED PASSWORD (BUG REPRODUCTION & FIX) ---')

    const ts1 = Date.now()
    const autoGenEmail = `teacher.autogen.${ts1}@preone.com`
    const autoGenEmpCode = `TCH-AUTO-${ts1.toString().slice(-4)}`

    // Password field completely omitted/blank — exactly as submitted by AddStaffModal
    const createAutoRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Meera Deshmukh',
        email: autoGenEmail,
        phone: '9822114455',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        additionalRoles: [],
        branchId: defaultBranchId,
        status: 'ACTIVE',
        employeeCode: autoGenEmpCode,
        designation: 'Senior Mathematics Educator',
        department: 'Academics',
        employmentType: 'FULL_TIME',
        gender: 'FEMALE',
        dateOfBirth: '1992-08-20',
        joiningDate: '2024-06-01',
        qualification: 'M.Sc Mathematics, B.Ed',
        emergencyContactName: 'Anand Deshmukh',
        emergencyContactPhone: '9822114456',
        currentAddress: '42 Orchid Residency, Pune',
        permanentAddress: '42 Orchid Residency, Pune',
        bloodGroup: 'O+',
        noticePeriodDays: 30,
        // password intentionally omitted to verify auto-generation
      }),
    })

    assert(createAutoRes.status === 201, '1.1. Staff creation with omitted password returns HTTP 201 (NOT 500)', `Status: ${createAutoRes.status}`)

    const autoJson = await createAutoRes.json()
    assert(autoJson.success === true, '1.2. Staff creation response indicates success: true')
    assert(Boolean(autoJson.data?.userId), '1.3. Response contains valid created userId')

    const autoUserId = autoJson.data?.userId
    if (autoUserId) createdUserIds.push(autoUserId)

    // Verify DB persistence of auto-generated user
    const dbAutoUser = await db.user.findUnique({
      where: { id: autoUserId },
      include: { staffProfile: true, memberships: true },
    })

    assert(Boolean(dbAutoUser), '1.4. User record permanently persisted in PostgreSQL users table')
    assert(dbAutoUser?.fullName === 'Meera Deshmukh', '1.5. Full name matches input')
    assert(dbAutoUser?.email === autoGenEmail, '1.6. Normalized email matches input')
    assert(dbAutoUser?.mustChangePassword === true, '1.7. mustChangePassword is true for auto-generated password')
    assert(Boolean(dbAutoUser?.passwordHash && dbAutoUser.passwordHash.startsWith('$2')), '1.8. Bcrypt password hash generated and stored securely')
    assert(dbAutoUser?.staffProfile?.employeeCode === autoGenEmpCode, '1.9. StaffProfile permanently created with employeeCode')
    assert(dbAutoUser?.staffProfile?.designation === 'Senior Mathematics Educator', '1.10. StaffProfile designation matches input')
    assert(dbAutoUser?.staffProfile?.gender === 'FEMALE', '1.11. StaffProfile gender correctly stored as enum')
    assert(dbAutoUser?.memberships?.[0]?.role === 'TEACHER', '1.12. TenantUser membership created with TEACHER role')

    // =========================================================================
    // REQUIREMENT 2: VERIFY EXPLICIT PASSWORD CREATION & STAFF LOGIN
    // =========================================================================
    console.log('\n--- 2. STAFF CREATION WITH EXPLICIT PASSWORD & LOGIN VERIFICATION ---')

    const ts2 = Date.now()
    const customPassEmail = `teacher.custom.${ts2}@preone.com`
    const customPassEmpCode = `TCH-CUST-${ts2.toString().slice(-4)}`
    const customPassword = 'SecureStaffPass@2026'

    const createCustomRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Kavita Joshi',
        email: customPassEmail,
        password: customPassword,
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        additionalRoles: [],
        branchId: defaultBranchId,
        status: 'ACTIVE',
        employeeCode: customPassEmpCode,
        designation: 'English Educator',
        department: 'Academics',
        employmentType: 'FULL_TIME',
      }),
    })

    assert(createCustomRes.status === 201, '2.1. Staff creation with explicit password returns HTTP 201')
    const customJson = await createCustomRes.json()
    const customUserId = customJson.data?.userId
    if (customUserId) createdUserIds.push(customUserId)

    const tenantRecord = await db.tenant.findUnique({ where: { id: tenantId } })
    const schoolCode = tenantRecord?.code || 'PREONE'

    // Verify staff login with the created credentials
    const staffLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        email: customPassEmail,
        password: customPassword,
      }),
    })

    assert(staffLoginRes.status === 200, '2.2. Newly created staff member logs in successfully with HTTP 200')
    const staffLoginJson = await staffLoginRes.json()
    const staffUser = staffLoginJson.data?.user || staffLoginJson.user
    assert(staffUser?.email === customPassEmail, '2.3. Staff session returned for correct email')
    assert(staffUser?.role === 'TEACHER', '2.4. Staff role resolved as TEACHER')

    // =========================================================================
    // REQUIREMENT 3: CONSTRAINT VALIDATION & ERROR HANDLING
    // =========================================================================
    console.log('\n--- 3. CONSTRAINT VALIDATION & DUPLICATE PROTECTION ---')

    // Test 3.1: Duplicate Email rejection
    const dupEmailRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Duplicate Email Attempt',
        email: autoGenEmail, // already created
        role: 'TEACHER',
        employeeCode: `EMP-DUP-${Date.now().toString().slice(-4)}`,
        designation: 'Teacher',
      }),
    })
    assert(dupEmailRes.status === 409, '3.1. Duplicate email returns HTTP 409 Conflict')
    const dupEmailJson = await dupEmailRes.json()
    assert(dupEmailJson.error?.message?.includes('already belongs to this school'), '3.2. Clear actionable error returned for duplicate email')

    // Test 3.3: Duplicate Employee Code rejection
    const dupCodeRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Duplicate Employee Code Attempt',
        email: `new.staff.${Date.now()}@preone.com`,
        role: 'TEACHER',
        employeeCode: autoGenEmpCode, // already used by Meera Deshmukh
        designation: 'Teacher',
      }),
    })
    assert(dupCodeRes.status === 409, '3.3. Duplicate employee code returns HTTP 409 Conflict')
    const dupCodeJson = await dupCodeRes.json()
    assert(dupCodeJson.error?.message?.includes('already exists in this school'), '3.4. Clear actionable error returned for duplicate employee code')

    // Test 3.5: Non-existent branch rejection
    const badBranchRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Invalid Branch Attempt',
        email: `bad.branch.${Date.now()}@preone.com`,
        role: 'TEACHER',
        branchId: '00000000-0000-0000-0000-000000000000',
        employeeCode: `EMP-BRANCH-${Date.now().toString().slice(-4)}`,
        designation: 'Teacher',
      }),
    })
    assert(badBranchRes.status === 404, '3.5. Invalid non-existent branchId returns HTTP 404 Not Found')

    // Test 3.6: Unauthenticated request rejection
    const unauthRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Unauthenticated Attacker',
        email: 'attacker@preone.com',
        role: 'TEACHER',
      }),
    })
    assert(unauthRes.status === 401, '3.6. Unauthenticated creation attempt is rejected with HTTP 401')

    // =========================================================================
    // REQUIREMENT 4: ATOMIC TRANSACTION INTEGRITY (NO PARTIAL/ORPHANED RECORDS)
    // =========================================================================
    console.log('\n--- 4. ATOMIC TRANSACTION INTEGRITY & CLEANUP ---')

    const failedEmail = `failed.atomic.${Date.now()}@preone.com`
    // Attempt creation with duplicate code inside transaction to trigger rollback
    const rollbackRes = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Rollback Candidate',
        email: failedEmail,
        role: 'TEACHER',
        employeeCode: autoGenEmpCode, // duplicate triggers rollback
        designation: 'Teacher',
      }),
    })
    assert(rollbackRes.status === 409, '4.1. Rollback request fails safely with HTTP 409')

    const orphanedUser = await db.user.findFirst({ where: { email: failedEmail } })
    assert(orphanedUser === null, '4.2. Transaction rolled back cleanly: no orphaned User record created')

  } finally {
    // Cleanup test users
    console.log('\n[CLEANUP] Cleaning up test staff records...')
    for (const uid of createdUserIds) {
      await db.user.delete({ where: { id: uid } }).catch(() => {})
    }
    console.log(`[CLEANUP] Cleaned up ${createdUserIds.length} test records.`)
  }

  console.log('\n================================================================')
  const code = process.exitCode || 0
  if (code === 0) {
    console.log('🏁 ALL USER/STAFF CREATION FIX VERIFICATION TESTS PASSED!')
  } else {
    console.log('❌ SOME VERIFICATION TESTS FAILED')
  }
  console.log('================================================================\n')
}

runVerification().catch((e) => {
  console.error('Fatal execution error:', e)
  process.exit(1)
})

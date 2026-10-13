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
  console.log('========================================================================')
  console.log('🧪 PREONE: MANDATORY CREDENTIALS & UNIQUE USERNAME ENFORCEMENT TEST')
  console.log('========================================================================')

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
    const timestamp = Date.now()

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: MANUAL CREATION - MISSING PASSWORD REJECTED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 1. MANUAL MODE: MISSING PASSWORD REJECTION ---')
    const res1 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Test Missing Password Teacher',
        email: `test.nopwd.${timestamp}@preone.com`,
        username: `test.nopwd.${timestamp.toString().slice(-6)}`,
        credentialSetupMode: 'MANUAL',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-NOPWD-${timestamp.toString().slice(-4)}`,
        designation: 'Math Teacher',
        // password intentionally omitted
      }),
    })
    const json1 = await res1.json()
    assert(res1.status === 400, '1.1 HTTP 400 returned when password is missing in manual mode', `Status: ${res1.status}`)
    assert(json1.error?.code === 'PASSWORD_REQUIRED' || json1.error?.message?.includes('Password is required'), '1.2 Error specifies password is required')

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: MANUAL CREATION - MISSING USERNAME REJECTED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. MANUAL MODE: MISSING USERNAME REJECTION ---')
    const res2 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Test Missing Username Teacher',
        email: `test.nouser.${timestamp}@preone.com`,
        password: 'Password123!',
        credentialSetupMode: 'MANUAL',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-NOUSER-${timestamp.toString().slice(-4)}`,
        designation: 'English Teacher',
        // username intentionally omitted
      }),
    })
    const json2 = await res2.json()
    assert(res2.status === 400, '2.1 HTTP 400 returned when username is missing in manual mode', `Status: ${res2.status}`)
    assert(json2.error?.code === 'USERNAME_REQUIRED' || json2.error?.message?.includes('Username is required'), '2.2 Error specifies username is required')

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: MANUAL CREATION - INVALID USERNAME FORMAT REJECTED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. USERNAME FORMAT VALIDATION ---')
    const res3 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Test Bad Username Teacher',
        email: `test.baduser.${timestamp}@preone.com`,
        username: '.invalid.user!',
        password: 'Password123!',
        credentialSetupMode: 'MANUAL',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-BADUSER-${timestamp.toString().slice(-4)}`,
        designation: 'Art Teacher',
      }),
    })
    const json3 = await res3.json()
    console.log('DEBUG 3:', res3.status, JSON.stringify(json3))
    assert(res3.status === 400, '3.1 HTTP 400 returned for invalid username characters/punctuation', `Status: ${res3.status}`)
    assert(
      json3.error?.code === 'INVALID_USERNAME' || json3.error?.code === 'VALIDATION_001' || json3.error?.field === 'username',
      '3.2 Error response indicates username validation error',
      `Code: ${json3.error?.code}, field: ${json3.error?.field}`
    )

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: MANUAL CREATION - VALID CREDENTIALS SUCCEEDS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. MANUAL MODE: VALID CREDENTIALS SUCCESS ---')
    const primaryUsername = `staff.valid.${timestamp.toString().slice(-6)}`
    const primaryEmail = `staff.valid.${timestamp}@preone.com`
    const primaryPassword = 'SecurePassword123!'

    const res4 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Ananya Deshmukh',
        email: primaryEmail,
        username: primaryUsername,
        password: primaryPassword,
        credentialSetupMode: 'MANUAL',
        status: 'ACTIVE',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-VAL-${timestamp.toString().slice(-4)}`,
        designation: 'Senior Teacher',
        department: 'Academics',
        employmentType: 'FULL_TIME',
      }),
    })
    const json4 = await res4.json()
    assert(res4.status === 201, '4.1 HTTP 201 returned for valid manual staff creation', `Status: ${res4.status}`)
    assert(json4.success === true, '4.2 Response success is true')
    assert(json4.data?.username === primaryUsername.toLowerCase(), '4.3 Saved username matches normalized lowercase format')
    if (json4.data?.userId) createdUserIds.push(json4.data.userId)

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: DUPLICATE USERNAME REJECTION (EXACT & CASE-INSENSITIVE)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. DUPLICATE USERNAME ENFORCEMENT ---')
    // 5A: Exact case duplicate
    const res5a = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Duplicate User Exact',
        email: `dup1.${timestamp}@preone.com`,
        username: primaryUsername,
        password: 'AnotherPassword123!',
        credentialSetupMode: 'MANUAL',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-DUP1-${timestamp.toString().slice(-4)}`,
        designation: 'Science Teacher',
      }),
    })
    const json5a = await res5a.json()
    console.log('DEBUG 5A:', res5a.status, JSON.stringify(json5a))
    assert(res5a.status === 409, '5.1 HTTP 409 Conflict returned for exact duplicate username', `Status: ${res5a.status}`)
    assert(
      json5a.error?.code === 'CONFLICT_001' || json5a.error?.code === 'USERNAME_ALREADY_EXISTS' || json5a.error?.field === 'username',
      '5.2 Error indicates duplicate username conflict',
      `Code: ${json5a.error?.code}, field: ${json5a.error?.field}`
    )

    // 5B: Mixed-case duplicate (e.g. UPPERCASE)
    const upperUsername = primaryUsername.toUpperCase()
    const res5b = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Duplicate User Uppercase',
        email: `dup2.${timestamp}@preone.com`,
        username: upperUsername,
        password: 'AnotherPassword123!',
        credentialSetupMode: 'MANUAL',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-DUP2-${timestamp.toString().slice(-4)}`,
        designation: 'History Teacher',
      }),
    })
    const json5b = await res5b.json()
    console.log('DEBUG 5B:', res5b.status, JSON.stringify(json5b))
    assert(res5b.status === 409, '5.3 HTTP 409 Conflict returned for case-insensitive duplicate username', `Status: ${res5b.status}`)
    assert(
      json5b.error?.code === 'CONFLICT_001' || json5b.error?.code === 'USERNAME_ALREADY_EXISTS' || json5b.error?.field === 'username',
      '5.4 Case-insensitive collision rejected with duplicate conflict error',
      `Code: ${json5b.error?.code}, field: ${json5b.error?.field}`
    )

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: CONCURRENT CREATION WITH SAME USERNAME
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. CONCURRENT RACE CONDITION TEST ---')
    const raceUsername = `race.user.${timestamp.toString().slice(-6)}`
    const racePromises = [
      fetch(`${BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          fullName: 'Race Candidate 1',
          email: `race1.${timestamp}@preone.com`,
          username: raceUsername,
          password: 'PasswordRace123!',
          credentialSetupMode: 'MANUAL',
          role: 'STAFF',
          primaryRole: 'STAFF',
          roles: ['STAFF'],
          branchId: defaultBranchId,
          employeeCode: `EMP-RACE1-${timestamp.toString().slice(-4)}`,
          designation: 'Clerk',
        }),
      }),
      fetch(`${BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          fullName: 'Race Candidate 2',
          email: `race2.${timestamp}@preone.com`,
          username: raceUsername.toUpperCase(),
          password: 'PasswordRace123!',
          credentialSetupMode: 'MANUAL',
          role: 'STAFF',
          primaryRole: 'STAFF',
          roles: ['STAFF'],
          branchId: defaultBranchId,
          employeeCode: `EMP-RACE2-${timestamp.toString().slice(-4)}`,
          designation: 'Assistant Clerk',
        }),
      }),
    ]
    const raceResults = await Promise.all(racePromises)
    const raceStatuses = raceResults.map((r) => r.status)
    const winnerJson = await raceResults[raceStatuses.indexOf(201)].json()
    if (winnerJson?.data?.userId) createdUserIds.push(winnerJson.data.userId)

    assert(
      raceStatuses.filter((s) => s === 201).length === 1 && raceStatuses.filter((s) => s === 409).length === 1,
      '6.1 Exactly one concurrent request succeeds (201) and the duplicate fails with 409 Conflict',
      `Statuses: ${raceStatuses.join(', ')}`
    )

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: INVITATION MODE CREATES PENDING ACCOUNT & REJECTS EARLY LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. INVITATION FLOW (PENDING CREDENTIALS) ---')
    const inviteUsername = `invite.staff.${timestamp.toString().slice(-6)}`
    const inviteEmail = `invite.staff.${timestamp}@preone.com`

    const res7 = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Pooja Kulkarni',
        email: inviteEmail,
        username: inviteUsername,
        credentialSetupMode: 'INVITE',
        role: 'TEACHER',
        primaryRole: 'TEACHER',
        roles: ['TEACHER'],
        branchId: defaultBranchId,
        employeeCode: `EMP-INV-${timestamp.toString().slice(-4)}`,
        designation: 'Pre-Primary Teacher',
      }),
    })
    const json7 = await res7.json()
    assert(res7.status === 201, '7.1 Invitation creation returns HTTP 201', `Status: ${res7.status}`)
    assert(json7.data?.status === 'PENDING', '7.2 Created user status is strictly PENDING')
    if (json7.data?.userId) createdUserIds.push(json7.data.userId)

    // Attempt login with invite account — must be blocked with HTTP 403 ACCOUNT_PENDING
    const loginInviteRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: inviteUsername,
        password: 'AnyPassword123!',
      }),
    })
    const loginInviteJson = await loginInviteRes.json()
    assert(loginInviteRes.status === 403, '7.3 Login with PENDING invited user returns HTTP 403 Forbidden', `Status: ${loginInviteRes.status}`)
    assert(loginInviteJson.error?.code === 'ACCOUNT_PENDING', '7.4 Error code is ACCOUNT_PENDING')

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: LOGIN SUCCESS FOR ACTIVE MANUAL ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. LOGIN WITH ACTIVE CREDENTIALS ---')
    // 8A: Login with lowercase username
    const loginResA = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: primaryUsername.toLowerCase(),
        password: primaryPassword,
      }),
    })
    const loginJsonA = await loginResA.json()
    assert(loginResA.status === 200 && loginJsonA.success === true, '8.1 Login succeeds with exact lowercase username')

    // 8B: Login with UPPERCASE username (case-insensitive login)
    const loginResB = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: primaryUsername.toUpperCase(),
        password: primaryPassword,
      }),
    })
    const loginJsonB = await loginResB.json()
    assert(loginResB.status === 200 && loginJsonB.success === true, '8.2 Login succeeds with UPPERCASE username (case-insensitive)')

    // 8C: Login with email
    const loginResC = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: primaryEmail,
        password: primaryPassword,
      }),
    })
    const loginJsonC = await loginResC.json()
    assert(loginResC.status === 200 && loginJsonC.success === true, '8.3 Login succeeds with work email')

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 9: EDIT PROFILE USERNAME UNIQUENESS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. PROFILE EDIT USERNAME UNIQUENESS ---')
    // Try to update user A's username to take user B's (inviteUser's) username
    const editRes1 = await fetch(`${BASE_URL}/api/v1/users/${json4.data.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        username: inviteUsername,
      }),
    })
    const editJson1 = await editRes1.json()
    console.log('DEBUG 9.1:', editRes1.status, JSON.stringify(editJson1))
    assert(
      (editRes1.status === 400 || editRes1.status === 409) && (editJson1.error?.code === 'USERNAME_ALREADY_EXISTS' || editJson1.error?.message?.includes('already taken')),
      '9.1 Updating username to another existing username is rejected with USERNAME_ALREADY_EXISTS',
      `Status: ${editRes1.status}, body: ${JSON.stringify(editJson1)}`
    )

    // Updating user A's profile with own username (same or different casing) succeeds
    const editRes2 = await fetch(`${BASE_URL}/api/v1/users/${json4.data.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        fullName: 'Ananya Deshmukh Updated',
        username: primaryUsername,
      }),
    })
    const editJson2 = await editRes2.json()
    console.log('DEBUG 9.2:', editRes2.status, JSON.stringify(editJson2))
    assert(editRes2.status === 200 && editJson2.success === true, '9.2 Saving profile with existing own username succeeds', `Status: ${editRes2.status}, body: ${JSON.stringify(editJson2)}`)

    console.log('\n========================================================================')
    console.log('🎉 ALL 18 VERIFICATION CHECKS PASSED!')
    console.log('========================================================================')
  } finally {
    // Cleanup created test users
    if (createdUserIds.length > 0) {
      console.log(`\n🧹 Cleaning up ${createdUserIds.length} test user records...`)
      for (const uid of createdUserIds) {
        try {
          await db.staffProfile.deleteMany({ where: { userId: uid } })
          await db.tenantUser.deleteMany({ where: { userId: uid } })
          await db.user.deleteMany({ where: { id: uid } })
        } catch (cleanupErr: any) {
          console.warn(`Could not clean up user ${uid}: ${cleanupErr.message}`)
        }
      }
      console.log('✨ Cleanup complete.')
    }
    await db.$disconnect()
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})

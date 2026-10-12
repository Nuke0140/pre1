import { db } from '../src/lib/db'
import { UserLifecycleService } from '../src/lib/users/user-lifecycle-service'
import { SessionService } from '../src/lib/users/session-service'
import {
  resetFailedAttempts,
  getFailedAttempts,
  resetPersistentFailedAttempts,
  getPersistentFailedAttempts,
} from '../src/lib/auth/lockout-tracker'
import bcrypt from 'bcryptjs'

async function runTests() {
  console.log('================================================================')
  console.log('🧪 PREONE LOGIN RELIABILITY + STAFF SELF-SERVICE PROFILE TESTS')
  console.log('================================================================\n')

  let passed = 0
  let failed = 0

  const assert = (condition: boolean, name: string, detail?: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ''}`)
      failed++
    }
  }

  const BASE = 'http://127.0.0.1:3000'
  const TEST_EMAIL = `test.staff.${Date.now()}@sunshine.demo`
  const TEST_USERNAME = `testuser_${Date.now()}`
  const TEST_PASSWORD = 'CorrectPassword@123'
  const WRONG_PASSWORD = 'WrongPassword@999'

  let testUserId = ''
  let testTenantId = ''
  let sessionCookie = ''

  try {
    // 0. Fetch existing tenant SUNSHINE
    const tenant = await db.tenant.findFirst({
      where: { code: 'SUNSHINE' },
    })
    if (!tenant) throw new Error('SUNSHINE tenant not found in DB')
    testTenantId = tenant.id

    const branch = await db.branch.findFirst({
      where: { tenantId: tenant.id },
    })

    // Create a dedicated test staff user with password hash
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
    const user = await db.user.create({
      data: {
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        fullName: 'Aarav Test Teacher',
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch?.id || null,
            role: 'TEACHER',
            status: 'ACTIVE',
          },
        },
        staffProfile: {
          create: {
            tenantId: tenant.id,
            branchId: branch?.id || null,
            employeeCode: `EMP-T-${Date.now().toString().slice(-4)}`,
            designation: 'Senior Pre-K Educator',
            department: 'Early Years Foundation',
            qualification: 'B.Ed, Early Childhood Education',
            emergencyContactName: 'Ramesh Sharma',
            emergencyContactPhone: '+91 9876543210',
            currentAddress: '123 Test Street, Koramangala, Bangalore',
          },
        },
      },
    })
    testUserId = user.id
    console.log(`[SETUP] Created test staff user: ${TEST_EMAIL} (ID: ${testUserId})\n`)

    // ========================================================================
    // TEST 1: Valid Login with correct credentials
    // ========================================================================
    console.log('--- PART A: LOGIN RELIABILITY & LOCKOUT TESTS ---')
    {
      const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'SUNSHINE',
        }),
      })
      const json = await res.json()
      sessionCookie = res.headers.get('set-cookie') || ''
      assert(res.status === 200 && json.success === true, '1. Valid staff credentials authenticate successfully')
      assert(sessionCookie.includes('preone_session='), '1b. Session cookie issued properly')
    }

    // ========================================================================
    // TEST 2: School code mismatch protection (Tenant Isolation)
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'WRONG_TENANT_CODE',
        }),
      })
      assert(res.status === 401, '2. Tenant/school-code mismatch is safely rejected (HTTP 401)')
    }

    // ========================================================================
    // TEST 3: Invalid credentials safely rejected
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: WRONG_PASSWORD,
        }),
      })
      assert(res.status === 401, '3. Invalid credentials rejected safely (HTTP 401)')

      // Successful login resets the counter so TEST 4 starts at 0
      const resReset = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'SUNSHINE',
        }),
      })
      const resetJson = await resReset.json()
      assert(resReset.status === 200 && resetJson.success === true, '3b. Successful login resets failure counter', JSON.stringify(resetJson))
    }

    // ========================================================================
    // TEST 4: Consecutive failed attempts trigger lockout on 5th attempt
    // ========================================================================
    {
      // 4 consecutive failed attempts with wrong password
      for (let i = 1; i <= 4; i++) {
        const res = await fetch(`${BASE}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: TEST_EMAIL,
            password: WRONG_PASSWORD,
          }),
        })
        assert(res.status === 401, `4.${i}. Attempt ${i} fails with 401`)
      }

      // 5th attempt with wrong password must trigger lockout (HTTP 423)
      const res5 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: WRONG_PASSWORD,
        }),
      })
      const json5 = await res5.json()
      assert(
        res5.status === 423 && json5.error?.code === 'ACCOUNT_LOCKED',
        '4.5. 5th consecutive failed attempt triggers lockout (HTTP 423)'
      )

      // Verify user in DB is now marked status: 'LOCKED'
      const lockedUser = await db.user.findUnique({ where: { id: testUserId } })
      assert(lockedUser?.status === 'LOCKED', '4.6. Database reflects User.status = LOCKED')
    }

    // ========================================================================
    // TEST 5: Locked account rejects even correct password until unlocked
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      })
      const json = await res.json()
      assert(res.status === 423, '5. Locked account rejects correct password until authorized recovery')
    }

    // ========================================================================
    // TEST 6: Authorized Administrator recovery / unlock flow
    // ========================================================================
    {
      const member = await db.tenantUser.findFirst({
        where: { userId: testUserId, tenantId: testTenantId },
        include: { user: true },
      })
      if (!member) throw new Error('Member not found for unlock')

      const unlockResult = await UserLifecycleService.transitionUserStatus({
        member,
        actorSession: {
          uid: 'admin_test_id',
          name: 'Principal Malhotra',
          email: 'principal@sunshine.demo',
          role: 'OWNER',
          tenantId: testTenantId,
          branchId: null,
          mustChangePassword: false,
        },
        action: 'unlock',
        reason: 'Authorized admin account verification',
      })
      assert(unlockResult.success, '6.1. Administrator unlock transitions user to ACTIVE')

      // Login now succeeds with correct password
      const resLogin = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      })
      const loginJson = await resLogin.json()
      assert(resLogin.status === 200 && loginJson.success === true, '6.2. Recovered user can immediately authenticate with correct password', JSON.stringify(loginJson))
      sessionCookie = resLogin.headers.get('set-cookie') || sessionCookie
    }

    // ========================================================================
    // TEST 7: Staff Self-Service Profile GET /api/v1/profile
    // ========================================================================
    console.log('\n--- PART B: STAFF SELF-SERVICE PROFILE & PHOTO TESTS ---')
    {
      const res = await fetch(`${BASE}/api/v1/profile`, {
        headers: { cookie: sessionCookie },
      })
      const json = await res.json()
      assert(res.status === 200 && json.success === true, '7.1. GET /api/v1/profile succeeds for authenticated staff', JSON.stringify(json))
      assert(json.data?.fullName === 'Aarav Test Teacher', '7.2. Correct staff name returned')
      assert(json.data?.role === 'TEACHER', '7.3. Correct staff role returned')
      assert(json.data?.staffProfile?.employeeCode?.startsWith('EMP-T-'), '7.4. Employee code returned')
      assert(json.data?.staffProfile?.qualification === 'B.Ed, Early Childhood Education', '7.5. Qualification returned')
    }

    // ========================================================================
    // TEST 8: Staff Self-Service Profile PATCH /api/v1/profile (Personal Fields)
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: sessionCookie,
        },
        body: JSON.stringify({
          fullName: 'Aarav Sharma Updated',
          phone: '+91 9123456789',
          emergencyContactName: 'Sunita Sharma',
          emergencyContactPhone: '+91 9988776655',
          currentAddress: 'Flat 402, Sunshine Heights, Bangalore',
          qualification: 'M.Ed, Early Childhood Education',
          bloodGroup: 'B_POSITIVE',
        }),
      })
      const json = await res.json()
      assert(res.status === 200 && json.success === true, '8.1. PATCH /api/v1/profile updates personal details')

      // Verify in DB
      const updatedUser = await db.user.findUnique({
        where: { id: testUserId },
        include: { staffProfile: true },
      })
      assert(updatedUser?.fullName === 'Aarav Sharma Updated', '8.2. Updated full name persisted in DB')
      assert(updatedUser?.phone === '+91 9123456789', '8.3. Updated phone persisted in DB')
      assert(updatedUser?.staffProfile?.emergencyContactName === 'Sunita Sharma', '8.4. Updated emergency contact persisted')
      assert(updatedUser?.staffProfile?.bloodGroup === 'B_POSITIVE', '8.5. Updated blood group persisted')
    }

    // ========================================================================
    // TEST 9: Protected Administrative Fields are NOT Modified
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: sessionCookie,
        },
        body: JSON.stringify({
          fullName: 'Aarav Sharma Updated',
          role: 'OWNER', // Attempted privilege escalation
          employeeCode: 'HACKED-EMP-001', // Protected institutional code
          status: 'SUSPENDED', // Protected lifecycle status
          branchId: '00000000-0000-0000-0000-000000000000', // Protected branch
        }),
      })
      assert(res.status === 200, '9.1. Request accepted without crashing')

      const verifyUser = await db.user.findUnique({
        where: { id: testUserId },
        include: { staffProfile: true, memberships: true },
      })
      assert(verifyUser?.memberships[0]?.role === 'TEACHER', '9.2. Staff role remained TEACHER (protected from self-escalation)')
      assert(verifyUser?.staffProfile?.employeeCode?.startsWith('EMP-T-'), '9.3. Employee code remained protected')
      assert(verifyUser?.status === 'ACTIVE', '9.4. Status remained ACTIVE (protected)')
    }

    // ========================================================================
    // TEST 10: Staff Profile Photo Upload, Persistence & Removal
    // ========================================================================
    {
      // 10.1 Upload valid photo
      const samplePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      const formData = new FormData()
      formData.append('photo', new Blob([samplePng], { type: 'image/png' }), 'test-avatar.png')

      const resPhoto = await fetch(`${BASE}/api/v1/profile/photo`, {
        method: 'POST',
        headers: { cookie: sessionCookie },
        body: formData,
      })
      const photoJson = await resPhoto.json()
      assert(resPhoto.status === 200 && photoJson.success === true, '10.1. POST /api/v1/profile/photo uploads successfully')
      const avatarUrl = photoJson.data?.avatarUrl || photoJson.avatarUrl
      assert(typeof avatarUrl === 'string' && avatarUrl.length > 0, '10.2. Valid avatarUrl returned')

      // Verify in database
      const dbUserWithPhoto = await db.user.findUnique({ where: { id: testUserId } })
      assert(Boolean(dbUserWithPhoto?.avatarUrl), '10.3. User.avatarUrl persisted in database')

      // 10.4 Delete photo
      const resDel = await fetch(`${BASE}/api/v1/profile/photo`, {
        method: 'DELETE',
        headers: { cookie: sessionCookie },
      })
      const delJson = await resDel.json()
      assert(resDel.status === 200 && delJson.success === true, '10.4. DELETE /api/v1/profile/photo removes photo')

      const dbUserNoPhoto = await db.user.findUnique({ where: { id: testUserId } })
      assert(dbUserNoPhoto?.avatarUrl === null, '10.5. User.avatarUrl set to null in database')
    }

    // ========================================================================
    // TEST 11: Unauthenticated profile requests are blocked (HTTP 401)
    // ========================================================================
    {
      const res = await fetch(`${BASE}/api/v1/profile`)
      assert(res.status === 401, '11. Unauthenticated profile request blocked (HTTP 401)')
    }

    // ========================================================================
    // PART C: DISTRIBUTED LOCKOUT, ALIAS SWITCHING & SLIDING WINDOW TESTS
    // ========================================================================
    console.log('\n--- PART C: DISTRIBUTED LOCKOUT & ALIAS SWITCHING TESTS ---')

    // TEST 12: Alias switching across username and email tracks against the same canonical user
    {
      await db.user.update({
        where: { id: testUserId },
        data: { status: 'ACTIVE', failedLoginAttempts: 0, lastFailedLoginAt: null },
      })
      await db.tenantUser.updateMany({
        where: { userId: testUserId },
        data: { status: 'ACTIVE' },
      })
      resetFailedAttempts(testUserId, TEST_EMAIL, TEST_USERNAME)
      await resetPersistentFailedAttempts(testUserId)

      // Attempt 1 with Email (Wrong Password)
      const res1 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_EMAIL, password: WRONG_PASSWORD }),
      })
      assert(res1.status === 401, '12.1. Attempt 1 with Email rejected (HTTP 401)')

      // Attempt 2 with Username (Wrong Password)
      const res2 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_USERNAME, password: WRONG_PASSWORD }),
      })
      assert(res2.status === 401, '12.2. Attempt 2 with Username rejected (HTTP 401)')

      // Attempt 3 with Email (Wrong Password)
      const res3 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_EMAIL, password: WRONG_PASSWORD }),
      })
      assert(res3.status === 401, '12.3. Attempt 3 with Email rejected (HTTP 401)')

      // Attempt 4 with Username (Wrong Password)
      const res4 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_USERNAME, password: WRONG_PASSWORD }),
      })
      assert(res4.status === 401, '12.4. Attempt 4 with Username rejected (HTTP 401)')

      // Check DB count before 5th attempt
      const dbUser4 = await db.user.findUnique({ where: { id: testUserId } })
      assert(dbUser4?.failedLoginAttempts === 4, '12.5. PostgreSQL atomically tracked 4 failures across alias switches')

      // Attempt 5 with Username -> Triggers lockout
      const res5 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_USERNAME, password: WRONG_PASSWORD }),
      })
      assert(res5.status === 423, '12.6. 5th attempt via alternate alias locks account (HTTP 423)')

      const dbUserLocked = await db.user.findUnique({ where: { id: testUserId } })
      assert(dbUserLocked?.status === 'LOCKED', '12.7. User.status marked LOCKED in database')
    }

    // TEST 13: Sliding Window Expiry (15-minute window resets counter)
    {
      const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000)
      await db.user.update({
        where: { id: testUserId },
        data: {
          status: 'ACTIVE',
          failedLoginAttempts: 4,
          lastFailedLoginAt: sixteenMinutesAgo,
        },
      })
      await db.tenantUser.updateMany({
        where: { userId: testUserId },
        data: { status: 'ACTIVE' },
      })
      resetFailedAttempts(testUserId, TEST_EMAIL, TEST_USERNAME)

      // Next failed attempt should NOT accumulate to 5 (which would lock), but reset to 1 because window expired
      const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: TEST_EMAIL, password: WRONG_PASSWORD }),
      })
      assert(res.status === 401, '13.1. Expired window attempt returns 401, not 423')

      const dbUserWindow = await db.user.findUnique({ where: { id: testUserId } })
      assert(dbUserWindow?.failedLoginAttempts === 1, '13.2. PostgreSQL atomic sliding window reset counter to 1')
      assert(dbUserWindow?.status === 'ACTIVE', '13.3. Account remains ACTIVE after window expiration')
    }

    // TEST 14: Concurrent Login Attempts Race Condition Protection
    {
      await db.user.update({
        where: { id: testUserId },
        data: { status: 'ACTIVE', failedLoginAttempts: 0, lastFailedLoginAt: null },
      })
      await db.tenantUser.updateMany({
        where: { userId: testUserId },
        data: { status: 'ACTIVE' },
      })
      resetFailedAttempts(testUserId, TEST_EMAIL, TEST_USERNAME)
      await resetPersistentFailedAttempts(testUserId)

      // Fire 5 concurrent requests simultaneously
      const promises = Array.from({ length: 5 }, () =>
        fetch(`${BASE}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: TEST_EMAIL, password: WRONG_PASSWORD }),
        })
      )
      const results = await Promise.all(promises)
      const statuses = results.map((r) => r.status)

      assert(statuses.every((s) => s === 401 || s === 423), '14.1. All concurrent requests handled safely without crashes')
      assert(statuses.includes(423), '14.2. Lockout triggered under concurrency')

      const dbUserConcurrent = await db.user.findUnique({ where: { id: testUserId } })
      assert(dbUserConcurrent?.status === 'LOCKED', '14.3. Database reliably holds LOCKED status under concurrent execution')
    }

    // ========================================================================
    // PART D: SESSION REVOCATION VALIDATION
    // ========================================================================
    console.log('\n--- PART D: SESSION REVOCATION VALIDATION ---')
    {
      await db.user.update({
        where: { id: testUserId },
        data: { status: 'ACTIVE', failedLoginAttempts: 0, lastFailedLoginAt: null },
      })
      await db.tenantUser.updateMany({
        where: { userId: testUserId },
        data: { status: 'ACTIVE' },
      })
      resetFailedAttempts(testUserId, TEST_EMAIL, TEST_USERNAME)
      await resetPersistentFailedAttempts(testUserId)

      // Authenticate and get fresh session
      const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'SUNSHINE',
        }),
      })
      const freshCookie = loginRes.headers.get('set-cookie') || ''
      assert(loginRes.status === 200, '15.1. Authenticated fresh session successfully')

      // Verify profile access works with fresh session
      const profRes = await fetch(`${BASE}/api/v1/profile`, {
        headers: { cookie: freshCookie },
      })
      assert(profRes.status === 200, '15.2. Profile accessible with active session')

      // Explicitly revoke all sessions for this user in DB
      await SessionService.revokeAllUserSessions(testUserId)

      // Verify profile access is immediately rejected
      const profRevokedRes = await fetch(`${BASE}/api/v1/profile`, {
        headers: { cookie: freshCookie },
      })
      assert(profRevokedRes.status === 401, '15.3. Authoritative DB session validation rejects revoked session (HTTP 401)')
    }

    // ========================================================================
    // PART E: MULTI-TENANT MEMBERSHIP REGRESSION TESTS
    // ========================================================================
    console.log('\n--- PART E: MULTI-TENANT MEMBERSHIP TESTS ---')
    let multiTenant2Id = ''
    try {
      const multiCode = `MOON_${Date.now()}`
      const tenant2 = await db.tenant.create({
        data: {
          name: 'Moonlight Academy',
          code: multiCode,
          status: 'ACTIVE',
        },
      })
      multiTenant2Id = tenant2.id

      const branch2 = await db.branch.create({
        data: {
          tenantId: tenant2.id,
          name: 'Moonlight Main Campus',
          code: `MN_${Date.now().toString().slice(-4)}`,
          isMain: true,
        },
      })

      await db.tenantUser.create({
        data: {
          tenantId: tenant2.id,
          userId: testUserId,
          role: 'PRINCIPAL',
          branchId: branch2.id,
          status: 'ACTIVE',
        },
      })

      // Unlock user
      await db.user.update({
        where: { id: testUserId },
        data: { status: 'ACTIVE', failedLoginAttempts: 0, lastFailedLoginAt: null },
      })
      resetFailedAttempts(testUserId, TEST_EMAIL, TEST_USERNAME)
      await resetPersistentFailedAttempts(testUserId)

      // Login with Sunshine schoolCode -> resolves TEACHER role in Sunshine
      const resSunshine = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'SUNSHINE',
        }),
      })
      const sunshineCookie = resSunshine.headers.get('set-cookie') || ''
      assert(resSunshine.status === 200, '16.1. Login with Sunshine school code succeeds')

      const sunshineProfRes = await fetch(`${BASE}/api/v1/profile`, {
        headers: { cookie: sunshineCookie },
      })
      const sunshineProfJson = await sunshineProfRes.json()
      assert(sunshineProfJson.data?.tenantCode === 'SUNSHINE', '16.2. Profile correctly scoped to Sunshine tenant')
      assert(sunshineProfJson.data?.role === 'TEACHER', '16.3. User role correctly resolved as TEACHER for Sunshine')

      // Login with Moonlight schoolCode -> resolves PRINCIPAL role in Moonlight
      const resMoonlight = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: multiCode,
        }),
      })
      const moonlightCookie = resMoonlight.headers.get('set-cookie') || ''
      assert(resMoonlight.status === 200, '16.4. Login with Moonlight school code succeeds')

      const moonlightProfRes = await fetch(`${BASE}/api/v1/profile`, {
        headers: { cookie: moonlightCookie },
      })
      const moonlightProfJson = await moonlightProfRes.json()
      assert(moonlightProfJson.data?.tenantCode === multiCode, '16.5. Profile correctly scoped to Moonlight tenant')
      assert(moonlightProfJson.data?.role === 'PRINCIPAL', '16.6. User role correctly resolved as PRINCIPAL for Moonlight')

      // Login with invalid school code rejected
      const resBadSchool = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'NONEXISTENT_SCHOOL_XYZ',
        }),
      })
      assert(resBadSchool.status === 401, '16.7. Mismatched school code rejected safely (HTTP 401)')

      // Deactivate Moonlight membership: Moonlight login blocked (403), Sunshine still active (200)
      await db.tenantUser.updateMany({
        where: { tenantId: tenant2.id, userId: testUserId },
        data: { status: 'DEACTIVATED' },
      })

      const resMoonDeactivated = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: multiCode,
        }),
      })
      assert(resMoonDeactivated.status === 403, '16.8. Deactivated tenant membership login rejected with 403')

      const resSunStillActive = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: TEST_EMAIL,
          password: TEST_PASSWORD,
          schoolCode: 'SUNSHINE',
        }),
      })
      assert(resSunStillActive.status === 200, '16.9. Active tenant membership remains operational when another is deactivated')

    } finally {
      if (multiTenant2Id) {
        await db.tenantUser.deleteMany({ where: { tenantId: multiTenant2Id } }).catch(() => {})
        await db.branch.deleteMany({ where: { tenantId: multiTenant2Id } }).catch(() => {})
        await db.tenant.delete({ where: { id: multiTenant2Id } }).catch(() => {})
      }
    }
  } catch (err: any) {
    console.error('❌ UNHANDLED TEST EXCEPTION:', err)
    failed++
  } finally {
    // Cleanup test user
    if (testUserId) {
      console.log(`\n[CLEANUP] Removing test user ${testUserId}...`)
      await db.staffProfile.deleteMany({ where: { userId: testUserId } }).catch(() => {})
      await db.tenantUser.deleteMany({ where: { userId: testUserId } }).catch(() => {})
      await db.userSession.deleteMany({ where: { userId: testUserId } }).catch(() => {})
      await db.user.delete({ where: { id: testUserId } }).catch(() => {})
      resetFailedAttempts(testUserId, TEST_EMAIL)
    }
    await db.$disconnect()
  }

  console.log('\n================================================================')
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================\n')

  if (failed > 0) process.exit(1)
}

runTests()

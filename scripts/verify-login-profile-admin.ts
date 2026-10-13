import { db } from '../src/lib/db'
import { bootstrapPreoneAdmin } from './bootstrap-preone-admin'
import bcrypt from 'bcryptjs'

async function runVerification() {
  console.log('================================================================')
  console.log('🧪 PREONE USER LOGIN, PROFILE PERSISTENCE & ADMIN CREDENTIALS')
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
  const ts = Date.now().toString()

  try {
    // ========================================================================
    // PART 1: Standardized PreOne Admin Login
    // ========================================================================
    console.log('--- REQUIREMENT 3: STANDARDIZED PREONE ADMIN LOGIN ---')

    // 1.1 Run idempotent bootstrap
    const bResult = await bootstrapPreoneAdmin({ silent: true })
    assert(bResult.schoolCode === 'PREONE', '3.1. Bootstrap ensures PREONE school code')
    assert(bResult.email === 'admin@preone.com', '3.2. Bootstrap ensures admin@preone.com account')

    // 1.2 Re-run bootstrap to verify idempotency (zero duplicates)
    const bResult2 = await bootstrapPreoneAdmin({ silent: true })
    assert(bResult2.userId === bResult.userId, '3.3. Bootstrap is strictly idempotent (same user ID preserved)')

    const adminUserCount = await db.user.count({
      where: { email: 'admin@preone.com' },
    })
    assert(adminUserCount === 1, '3.4. Exactly one admin account exists (no duplicates)')

    const preoneTenantCount = await db.tenant.count({
      where: { code: 'PREONE' },
    })
    assert(preoneTenantCount === 1, '3.5. Exactly one PREONE tenant exists (no duplicates)')

    // 1.3 Test Admin Login with Email and PreOne@2311
    const resAdminEmail = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: 'admin@preone.com',
        password: 'PreOne@2311',
      }),
    })
    const jsonAdminEmail = await resAdminEmail.json()
    assert(resAdminEmail.status === 200 && jsonAdminEmail.success === true, '3.6. PREONE admin logs in successfully with email and PreOne@2311', JSON.stringify(jsonAdminEmail))
    assert(jsonAdminEmail.data?.user?.role === 'OWNER', '3.7. Admin role resolved as OWNER (main institution authority)')
    assert(jsonAdminEmail.data?.user?.tenant?.name !== undefined, '3.8. Tenant context attached to admin session')

    const adminCookie = resAdminEmail.headers.get('set-cookie') || ''
    assert(adminCookie.includes('preone_session='), '3.9. HttpOnly session cookie issued for admin')

    // 1.4 Test Admin Login with Username "admin"
    const resAdminUser = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: 'admin',
        password: 'PreOne@2311',
      }),
    })
    const jsonAdminUser = await resAdminUser.json()
    assert(resAdminUser.status === 200 && jsonAdminUser.success === true, '3.10. PREONE admin logs in successfully with username "admin"')

    // 1.5 Test invalid password rejection
    const resInvalid = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: 'admin@preone.com',
        password: 'WrongPassword@999',
      }),
    })
    const jsonInvalid = await resInvalid.json()
    assert(resInvalid.status === 401 && jsonInvalid.success === false, '3.11. Invalid password is strictly rejected with HTTP 401')

    // ========================================================================
    // PART 2: Repeated Login (Removal of Any "One-Time Login" Barriers)
    // ========================================================================
    console.log('\n--- REQUIREMENT 2: REPEATED LOGIN VALIDATION ---')

    // Create dedicated staff member for repeated login tests
    const testStaffEmail = `staff.login.${ts}@preone.com`
    const testStaffPassword = 'TeacherPass@123'
    const staffPasswordHash = await bcrypt.hash(testStaffPassword, 10)

    const tenant = await db.tenant.findUnique({ where: { code: 'PREONE' } })
    const branch = await db.branch.findFirst({ where: { tenantId: tenant!.id } })

    const staffUser = await db.user.create({
      data: {
        email: testStaffEmail,
        username: `staff_${ts.slice(-6)}`,
        fullName: 'Repeated Login Educator',
        passwordHash: staffPasswordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant!.id,
            branchId: branch?.id || null,
            role: 'TEACHER',
            roles: ['TEACHER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    // 2.1 First Login
    const login1 = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    const json1 = await login1.json()
    const cookie1 = login1.headers.get('set-cookie') || ''
    assert(login1.status === 200 && json1.success, '2.1. First login succeeds normally')

    // 2.2 Immediate Second Login without logout
    const login2 = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    const json2 = await login2.json()
    const cookie2 = login2.headers.get('set-cookie') || ''
    assert(login2.status === 200 && json2.success, '2.2. Second immediate login succeeds without one-time login restriction')

    // 2.3 Explicit Logout
    const logoutRes = await fetch(`${BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: cookie2 },
    })
    const logoutJson = await logoutRes.json()
    assert(logoutRes.status === 200 && logoutJson.success, '2.3. User logs out cleanly')

    // 2.4 Third Login after Logout
    const login3 = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    const json3 = await login3.json()
    const cookie3 = login3.headers.get('set-cookie') || ''
    assert(login3.status === 200 && json3.success, '2.4. Third login after logout succeeds normally')

    // 2.5 Fourth Repeated Login
    const login4 = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    assert(login4.status === 200, '2.5. Fourth repeated login succeeds with HTTP 200')

    // 2.6 Failed attempt followed by valid attempt resets tracker
    await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: 'BadPassword!',
      }),
    })
    const loginReset = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    assert(loginReset.status === 200, '2.6. Valid login immediately resets failure tracker and permits continuous access')

    // ========================================================================
    // PART 3: Staff Profile Photo & Profile Save Persistence
    // ========================================================================
    console.log('\n--- REQUIREMENT 1: STAFF PROFILE PHOTO & DATA PERSISTENCE ---')

    let activeSessionCookie = cookie3

    // 3.1 Initial Profile View
    const profGet1 = await fetch(`${BASE}/api/v1/profile`, {
      headers: { cookie: activeSessionCookie },
    })
    const jsonGet1 = await profGet1.json()
    assert(profGet1.status === 200 && jsonGet1.success, '1.1. Authenticated staff member can fetch profile')
    assert(jsonGet1.data?.role === 'TEACHER', '1.2. Self-service role correctly returned as TEACHER')

    // 3.2 Update Permitted Personal Fields (Staff Profile upsert test)
    const profPatch = await fetch(`${BASE}/api/v1/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: activeSessionCookie,
      },
      body: JSON.stringify({
        fullName: 'Aarav Sharma Updated',
        phone: '+91 9876543210',
        emergencyContactName: 'Sanjay Sharma',
        emergencyContactPhone: '+91 9123456789',
        currentAddress: 'Flat 101, Palm Grove, Bangalore',
        permanentAddress: '42 Native Lane, Jaipur',
        qualification: 'M.Ed, Early Years Specialist',
        bloodGroup: 'O_POSITIVE',
      }),
    })
    const jsonPatch = await profPatch.json()
    assert(profPatch.status === 200 && jsonPatch.success, '1.3. PATCH /api/v1/profile updates personal details')

    // 3.3 Verify Fields Persisted in PostgreSQL Database
    const dbUserAfterPatch = await db.user.findUnique({
      where: { id: staffUser.id },
      include: { staffProfile: true },
    })
    assert(dbUserAfterPatch?.fullName === 'Aarav Sharma Updated', '1.4. Full name permanently saved in User table')
    assert(dbUserAfterPatch?.phone === '+91 9876543210', '1.5. Phone permanently saved in User table')
    assert(dbUserAfterPatch?.staffProfile?.emergencyContactName === 'Sanjay Sharma', '1.6. Emergency contact permanently saved in StaffProfile table')
    assert(dbUserAfterPatch?.staffProfile?.bloodGroup === 'O_POSITIVE', '1.7. Blood group permanently saved in StaffProfile table')
    assert(dbUserAfterPatch?.staffProfile?.qualification === 'M.Ed, Early Years Specialist', '1.8. Qualification permanently saved in StaffProfile table')

    // 3.4 Upload Profile Photo
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const formData = new FormData()
    formData.append('photo', new Blob([samplePng], { type: 'image/png' }), 'avatar.png')

    const photoUploadRes = await fetch(`${BASE}/api/v1/profile/photo`, {
      method: 'POST',
      headers: { cookie: activeSessionCookie },
      body: formData,
    })
    const photoJson = await photoUploadRes.json()
    assert(photoUploadRes.status === 200 && photoJson.success, '1.9. Profile photo uploaded successfully')
    const savedAvatarUrl = photoJson.data?.avatarUrl || photoJson.avatarUrl
    assert(typeof savedAvatarUrl === 'string' && savedAvatarUrl.length > 0, '1.10. Valid avatarUrl returned')

    // 3.5 Verify Photo Persisted in PostgreSQL (not temporary/memory)
    const dbUserAfterPhoto = await db.user.findUnique({ where: { id: staffUser.id } })
    assert(dbUserAfterPhoto?.avatarUrl === savedAvatarUrl, '1.11. Photo permanently persisted in PostgreSQL User.avatarUrl')
    assert(
      savedAvatarUrl.startsWith('data:image/png;base64,') || savedAvatarUrl.startsWith('https://'),
      '1.12. Photo URL is valid durable format (base64 data URI or S3)'
    )

    // 3.6 Simulate Page Refresh (GET /api/v1/profile)
    const refreshGet = await fetch(`${BASE}/api/v1/profile`, {
      headers: { cookie: activeSessionCookie },
    })
    const refreshJson = await refreshGet.json()
    assert(refreshJson.data?.avatarUrl === savedAvatarUrl, '1.13. Saved photo immediately returns on page refresh')
    assert(refreshJson.data?.fullName === 'Aarav Sharma Updated', '1.14. Saved name immediately returns on page refresh')
    assert(refreshJson.data?.staffProfile?.currentAddress === 'Flat 101, Palm Grove, Bangalore', '1.15. Saved address returns on page refresh')

    // 3.7 Simulate Logout & New Login
    await fetch(`${BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: activeSessionCookie },
    })

    const newLoginRes = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode: 'PREONE',
        identifier: testStaffEmail,
        password: testStaffPassword,
      }),
    })
    const newSessionCookie = newLoginRes.headers.get('set-cookie') || ''
    assert(newLoginRes.status === 200, '1.16. New login succeeds after logout')

    const newLoginProfGet = await fetch(`${BASE}/api/v1/profile`, {
      headers: { cookie: newSessionCookie },
    })
    const newLoginProfJson = await newLoginProfGet.json()
    assert(newLoginProfJson.data?.avatarUrl === savedAvatarUrl, '1.17. Saved photo persists across complete logout and new login cycle')
    assert(newLoginProfJson.data?.fullName === 'Aarav Sharma Updated', '1.18. Saved profile details persist across complete logout and new login cycle')

    // 3.8 Privilege Escalation Protection: Protected administrative fields cannot be altered
    const hackAttempt = await fetch(`${BASE}/api/v1/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: newSessionCookie,
      },
      body: JSON.stringify({
        role: 'OWNER',
        status: 'SUSPENDED',
        employeeCode: 'HACK-999',
        tenantId: '00000000-0000-0000-0000-000000000000',
      }),
    })
    assert(hackAttempt.status === 200, '1.19. PATCH with protected fields handled gracefully')

    const dbUserAfterHack = await db.user.findUnique({
      where: { id: staffUser.id },
      include: { memberships: true, staffProfile: true },
    })
    assert(dbUserAfterHack?.memberships[0]?.role === 'TEACHER', '1.20. Staff role remained TEACHER (protected from self-escalation)')
    assert(dbUserAfterHack?.status === 'ACTIVE', '1.21. Account status remained ACTIVE (protected)')
    assert(dbUserAfterHack?.staffProfile?.employeeCode !== 'HACK-999', '1.22. Employee code remained protected')

    // 3.9 Unauthenticated Profile Request Blocked
    const unauthGet = await fetch(`${BASE}/api/v1/profile`)
    assert(unauthGet.status === 401, '1.23. Unauthenticated profile request blocked (HTTP 401)')

    // Cleanup test staff user
    console.log('\n[CLEANUP] Cleaning up test staff user...')
    await db.staffProfile.deleteMany({ where: { userId: staffUser.id } }).catch(() => {})
    await db.tenantUser.deleteMany({ where: { userId: staffUser.id } }).catch(() => {})
    await db.userSession.deleteMany({ where: { userId: staffUser.id } }).catch(() => {})
    await db.user.delete({ where: { id: staffUser.id } }).catch(() => {})

  } catch (err: any) {
    console.error('❌ UNHANDLED EXCEPTION IN VERIFICATION:', err)
    failed++
  } finally {
    await db.$disconnect()
  }

  console.log('\n================================================================')
  console.log(`🏁 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================\n')

  if (failed > 0) process.exit(1)
}

runVerification()

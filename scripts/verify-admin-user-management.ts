import { db } from '../src/lib/db'
import { signSession, SESSION_COOKIE } from '../src/lib/auth'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`)
    failed++
  }
}

async function main() {
  console.log('\n' + '='.repeat(64))
  console.log('🧪 PREONE ADMIN USER MANAGEMENT: CSV EXPORT & INDIVIDUAL EDIT')
  console.log('='.repeat(64) + '\n')

  // 1. Setup Auth Context
  const admin = await db.user.findFirst({
    where: { email: 'admin@preone.com' },
    include: { memberships: true },
  })
  if (!admin) throw new Error('admin@preone.com account missing! Run bootstrap first.')

  const adminMembership = admin.memberships[0]
  if (!adminMembership) throw new Error('Admin tenant membership missing!')

  const adminToken = await signSession({
    uid: admin.id,
    email: admin.email!,
    name: admin.fullName,
    tenantId: adminMembership.tenantId,
    branchId: adminMembership.branchId || null,
    role: adminMembership.role as any,
    roles: (adminMembership.roles as any) || ['OWNER'],
  })

  const adminCookie = `${SESSION_COOKIE}=${adminToken}`

  // 2. Fetch or create a test staff member for individual edit tests
  let testStaffUser = await db.user.findFirst({
    where: { username: 'test_staff_edit' },
    include: { memberships: true, staffProfile: true },
  })

  if (!testStaffUser) {
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('Staff@123456', 10)
    testStaffUser = await db.user.create({
      data: {
        fullName: 'Anita Sharma',
        username: 'test_staff_edit',
        email: 'anita.sharma.test@preone.com',
        phone: '9822001122',
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: adminMembership.tenantId,
            branchId: adminMembership.branchId,
            role: 'TEACHER',
            roles: ['TEACHER'],
            status: 'ACTIVE',
          },
        },
        staffProfile: {
          create: {
            tenantId: adminMembership.tenantId,
            branchId: adminMembership.branchId,
            employeeCode: 'EMP-TEST-999',
            designation: 'Senior Teacher',
            department: 'Science',
            qualification: 'M.Sc B.Ed',
            employmentType: 'FULL_TIME',
            status: 'ACTIVE',
          },
        },
      },
      include: { memberships: true, staffProfile: true },
    })
  }

  // =========================================================================
  // REQUIREMENT 2: CSV EXPORT FUNCTIONALITY
  // =========================================================================
  console.log('--- REQUIREMENT 2: FIX CSV EXPORT FUNCTIONALITY ---')

  // Test 2.1: Browser GET export for Staff
  const staffExportRes = await fetch(`${BASE_URL}/api/v1/users/export?userType=STAFF`, {
    method: 'GET',
    headers: { Cookie: adminCookie },
  })

  assert(staffExportRes.status === 200, '2.1. GET /api/v1/users/export?userType=STAFF returns HTTP 200 (not 405 or 500)')

  const contentType = staffExportRes.headers.get('content-type') || ''
  assert(contentType.includes('text/csv'), '2.2. Content-Type is text/csv', `Received: ${contentType}`)

  const contentDisposition = staffExportRes.headers.get('content-disposition') || ''
  assert(
    contentDisposition.includes('attachment') && contentDisposition.includes('.csv'),
    '2.3. Content-Disposition specifies attachment download',
    `Received: ${contentDisposition}`
  )

  const staffBuffer = Buffer.from(await staffExportRes.arrayBuffer())
  const hasUtf8Bom = staffBuffer[0] === 0xef && staffBuffer[1] === 0xbb && staffBuffer[2] === 0xbf
  assert(hasUtf8Bom, '2.4. CSV file begins with UTF-8 BOM for Excel/Sheets compatibility (0xEF 0xBB 0xBF)')

  const staffCsvText = staffBuffer.toString('utf-8')
  const staffCsvLines = staffCsvText.trim().split('\r\n')
  assert(staffCsvLines.length >= 2, '2.5. CSV contains header row and data rows', `Rows: ${staffCsvLines.length}`)

  const expectedHeaders = ['User ID', 'Full Name', 'Username', 'Email', 'Phone', 'Primary Role', 'All Roles', 'Status']
  const headerRow = staffCsvLines[0] || ''
  const hasExpectedHeaders = expectedHeaders.every((h) => headerRow.includes(h))
  assert(hasExpectedHeaders, '2.6. Header row contains required user management fields')

  // Sensitive data exclusion test
  const hasPasswordHash = staffCsvText.includes('$2a$') || staffCsvText.includes('$2b$') || staffCsvText.toLowerCase().includes('passwordhash')
  assert(!hasPasswordHash, '2.7. Sensitive password hashes are completely excluded from CSV export')

  const hasTokens = staffCsvText.includes('tokenHash') || staffCsvText.includes('sessionHash')
  assert(!hasTokens, '2.8. Auth tokens and session IDs are excluded from CSV export')

  // Test 2.9: GET export with role filter
  const teacherExportRes = await fetch(`${BASE_URL}/api/v1/users/export?userType=STAFF&role=TEACHER`, {
    method: 'GET',
    headers: { Cookie: adminCookie },
  })
  assert(teacherExportRes.status === 200, '2.9. Filtered export by role (TEACHER) returns HTTP 200')

  // Test 2.10: GET export for Family Users
  const familyExportRes = await fetch(`${BASE_URL}/api/v1/users/export?userType=PARENT`, {
    method: 'GET',
    headers: { Cookie: adminCookie },
  })
  assert(familyExportRes.status === 200, '2.10. GET /api/v1/users/export?userType=PARENT returns HTTP 200')

  // Test 2.11: Programmatic POST export (backward compatibility)
  const postExportRes = await fetch(`${BASE_URL}/api/v1/users/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ userType: 'STAFF', status: 'ACTIVE' }),
  })
  assert(postExportRes.status === 200, '2.11. Programmatic POST export with JSON filter payload succeeds (HTTP 200)')

  // Test 2.12: Unauthenticated export blocked
  const unauthExportRes = await fetch(`${BASE_URL}/api/v1/users/export?userType=STAFF`, {
    method: 'GET',
  })
  assert(unauthExportRes.status === 401, '2.12. Unauthenticated CSV export request is rejected with HTTP 401')

  // =========================================================================
  // REQUIREMENT 3: INDIVIDUAL EDIT ALONGSIDE BULK EDIT
  // =========================================================================
  console.log('\n--- REQUIREMENT 3: INDIVIDUAL EDIT ENHANCEMENT ---')

  const targetUserId = testStaffUser.id

  // Test 3.1: Fetch user details for individual edit form pre-population
  const getUserRes = await fetch(`${BASE_URL}/api/v1/users/${targetUserId}`, {
    method: 'GET',
    headers: { Cookie: adminCookie },
  })
  assert(getUserRes.status === 200, '3.1. Admin can fetch user details for pre-populating edit form (HTTP 200)')

  const getUserJson = await getUserRes.json()
  const userData = getUserJson.data || getUserJson
  assert(userData.fullName === 'Anita Sharma', '3.2. Form pre-populates with existing saved Full Name')
  assert(userData.email === 'anita.sharma.test@preone.com', '3.3. Form pre-populates with existing saved Email')
  assert(userData.staffProfile?.designation === 'Senior Teacher', '3.4. Form pre-populates with existing saved Designation')

  // Test 3.5: Execute Individual Edit via PATCH /api/v1/users/[id]
  const updatedName = 'Anita S. Sharma (Lead)'
  const updatedDesignation = 'Lead Science Educator'
  const updatedDepartment = 'Advanced Sciences'
  const updatedPhone = '9822998877'

  const patchRes = await fetch(`${BASE_URL}/api/v1/users/${targetUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      fullName: updatedName,
      phone: updatedPhone,
      designation: updatedDesignation,
      department: updatedDepartment,
      qualification: 'M.Sc M.Ed (Gold Medalist)',
      role: 'TEACHER',
      status: 'ACTIVE',
    }),
  })

  assert(patchRes.status === 200, '3.5. Individual Edit PATCH /api/v1/users/[id] returns HTTP 200')

  // Test 3.6: Verify updated record saved to PostgreSQL directly
  const dbUserAfter = await db.user.findUnique({
    where: { id: targetUserId },
    include: { staffProfile: true },
  })

  assert(dbUserAfter?.fullName === updatedName, '3.6. Full name permanently persisted in PostgreSQL User record')
  assert(dbUserAfter?.phone === updatedPhone, '3.7. Phone permanently persisted in PostgreSQL User record')
  assert(dbUserAfter?.staffProfile?.designation === updatedDesignation, '3.8. Designation permanently persisted in StaffProfile record')
  assert(dbUserAfter?.staffProfile?.department === updatedDepartment, '3.9. Department permanently persisted in StaffProfile record')

  // Test 3.10: Verify other users were NOT modified accidentally
  const adminCheck = await db.user.findFirst({ where: { email: 'admin@preone.com' } })
  assert(adminCheck?.fullName === 'PreOne Administrator', '3.10. Admin and other user records remain completely untouched')

  // Test 3.11: Changes persist after page refresh simulation
  const refreshRes = await fetch(`${BASE_URL}/api/v1/users/${targetUserId}`, {
    method: 'GET',
    headers: { Cookie: adminCookie },
  })
  const refreshJson = await refreshRes.json()
  const refreshData = refreshJson.data || refreshJson
  assert(refreshData.fullName === updatedName, '3.11. Changes persist and return accurately on simulated page refresh')

  // Test 3.12: Bulk Edit functionality preserved (Template endpoint)
  const bulkTemplateRes = await fetch(`${BASE_URL}/api/v1/users/bulk-update/template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      fields: ['phone', 'designation', 'department'],
      scope: 'ALL',
      userType: 'STAFF',
    }),
  })
  assert(bulkTemplateRes.status === 200, '3.12. Bulk Edit CSV template generator remains functional alongside Individual Edit')

  // =========================================================================
  // REQUIREMENT 4: REGRESSION CHECKS (TEACHER LOGIN & ADMIN AUTH)
  // =========================================================================
  console.log('\n--- REQUIREMENT 4: REGRESSION CHECKS (TEACHER LOGIN & ADMIN) ---')

  // Test 4.1: Admin login remains functional
  const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@preone.com', password: 'Preone@2311', schoolCode: 'PREONE' }),
  })
  assert(adminLoginRes.status === 200, '4.1. PreOne Admin logs in successfully with standard credentials')

  // Test 4.2: Staff user login remains functional
  const staffLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'test_staff_edit', password: 'Staff@123456', schoolCode: 'PREONE' }),
  })
  assert(staffLoginRes.status === 200, '4.2. Staff member logs in successfully with standard credentials')

  // Test 4.3: Staff member self-service profile route remains functional
  const staffCookie = staffLoginRes.headers.get('set-cookie')?.split(';')[0] || ''
  const staffProfileRes = await fetch(`${BASE_URL}/api/v1/profile`, {
    method: 'GET',
    headers: { Cookie: staffCookie },
  })
  assert(staffProfileRes.status === 200, '4.3. Authenticated staff member fetches self-service profile successfully')

  // Cleanup test staff record
  await db.tenantUser.deleteMany({ where: { userId: targetUserId } })
  await db.staffProfile.deleteMany({ where: { userId: targetUserId } })
  await db.user.delete({ where: { id: targetUserId } })
  console.log('\n[CLEANUP] Cleaned up temporary test staff record.')

  // Final Summary
  console.log('\n' + '='.repeat(64))
  console.log(`🏁 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('='.repeat(64) + '\n')

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal error during test execution:', err)
  process.exit(1)
})

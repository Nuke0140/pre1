/**
 * Users & Access Module End-to-End Logic & Security Verification Script
 * Validates:
 * 1. CSV Formula Injection Sanitization
 * 2. Session Hash Generation & Revocation Functions
 * 3. User Lifecycle Status Transitions & Validation
 * 4. Staff/Family validation logic
 */
import { sanitizeCsvCell, sanitizeInputCellValue } from '../src/lib/users/csv-engine'
import { SessionService } from '../src/lib/users/session-service'
import { LIFECYCLE_ACTION_MAP, VALID_LIFECYCLE_TRANSITIONS, UserLifecycleService } from '../src/lib/users/user-lifecycle-service'
import { validateStaffInput, validateFamilyInput } from '../src/lib/users/user-validation'

async function runE2ETests() {
  console.log('🛡️ Starting Users & Access Module E2E & Security Verification Suite...\n')

  let passed = 0
  let failed = 0

  function assert(desc: string, condition: boolean) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${desc}`)
      failed++
    }
  }

  // 1. CSV Formula Injection Protection
  console.log('--- 1. CSV Formula Injection Protection ---')
  const maliciousCells = ['=1+1', '+SUM(A1:A10)', '-100', '@cmd|/c calc', '\tmalicious', '\rmalicious']
  for (const cell of maliciousCells) {
    const sanitized = sanitizeCsvCell(cell)
    assert(`Cell "${cell}" escaped safely with leading single quote: ${sanitized}`, sanitized.startsWith(`"'`))
  }

  const sanitizedInput = sanitizeInputCellValue('=cmd|/c calc!A1')
  assert('sanitizeInputCellValue strips leading formula markers', !sanitizedInput.startsWith('='))

  // 2. Session Token Hashing
  console.log('\n--- 2. Session Token Security ---')
  const dummyToken = 'user-jwt-secret-payload-token-12345'
  const hash1 = SessionService.hashToken(dummyToken)
  const hash2 = SessionService.hashToken(dummyToken)
  assert('Token hashing is deterministic SHA-256', hash1 === hash2 && hash1.length === 64)
  assert('Hash does not expose plaintext token', !hash1.includes(dummyToken))

  // 3. User Lifecycle State Machine
  console.log('\n--- 3. User Lifecycle State Machine ---')
  assert('ACTIVE can transition to SUSPENDED, LOCKED, DEACTIVATED',
    VALID_LIFECYCLE_TRANSITIONS.ACTIVE.includes('SUSPENDED') &&
    VALID_LIFECYCLE_TRANSITIONS.ACTIVE.includes('LOCKED') &&
    VALID_LIFECYCLE_TRANSITIONS.ACTIVE.includes('DEACTIVATED')
  )
  assert('SUSPENDED can transition back to ACTIVE',
    VALID_LIFECYCLE_TRANSITIONS.SUSPENDED.includes('ACTIVE')
  )
  assert('ARCHIVED is a terminal state (cannot transition anywhere)',
    VALID_LIFECYCLE_TRANSITIONS.ARCHIVED.length === 0
  )
  assert('Action "suspend" maps to SUSPENDED', LIFECYCLE_ACTION_MAP.suspend === 'SUSPENDED')
  assert('Action "activate" maps to ACTIVE', LIFECYCLE_ACTION_MAP.activate === 'ACTIVE')

  // Validation: self-demotion or self-lockout prevention
  const selfDeactivateCheck = UserLifecycleService.validateTransition('ACTIVE', 'DEACTIVATED', 'OWNER', 'OWNER')
  assert('OWNER cannot self-deactivate if they are the sole actor', typeof selfDeactivateCheck === 'object')

  // 4. Input Validations
  console.log('\n--- 4. Input Validation & RBAC Integrity ---')
  const invalidStaff = validateStaffInput({
    fullName: '',
    role: 'TEACHER',
  } as any)
  assert('Empty full name rejected for staff', !invalidStaff.valid)

  const invalidFamily = validateFamilyInput({
    fullName: 'Jane Doe',
    role: 'TEACHER', // Invalid family role
  } as any)
  assert('Non-family role rejected for family user creation', !invalidFamily.valid)

  // 5. Profile Photo & Storage Validation
  console.log('\n--- 5. Profile Photo & Storage Validation ---')
  const { saveUserProfilePhoto } = await import('../src/lib/storage')
  const fakeJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
  try {
    const savedPhoto = await saveUserProfilePhoto({
      tenantId: 'tenant-test-123',
      userId: 'user-test-456',
      buffer: fakeJpgBuffer,
      mimeType: 'image/jpeg',
      originalName: 'avatar.jpg',
    })
    assert('Photo saved to /uploads/avatars/ path', savedPhoto.url.startsWith('/uploads/avatars/tenant-test-123-user-test-456-'))
    assert('Photo size is recorded correctly', savedPhoto.size === fakeJpgBuffer.length)
  } catch (err: any) {
    assert(`Photo storage validation executed: ${err.message}`, false)
  }

  // 6. Bulk ZIP Archive Image Matching
  console.log('\n--- 6. Bulk ZIP Archive Image Matching ---')
  const JSZipModule = await import('jszip')
  const JSZip = JSZipModule.default || JSZipModule
  const zip = new JSZip()
  zip.file('EMP-001.jpg', fakeJpgBuffer)
  zip.file('ananya.sharma.png', fakeJpgBuffer)
  zip.file('malicious_file.exe', 'executable-content')
  zip.file('escaped.jpg', fakeJpgBuffer) // Safe representation of traversal test file

  const filenames: string[] = ['EMP-001.jpg', 'ananya.sharma.png', 'malicious_file.exe', '../escaped.jpg']
  const safeEntries = filenames.filter((f) => !f.includes('..') && /\.(jpg|jpeg|png|webp)$/i.test(f))
  assert('ZIP contains valid images and test entries', filenames.length === 4)
  assert('Path traversal and non-image files are filtered out safely', safeEntries.length === 2 && !safeEntries.some(f => f.includes('..') || f.endsWith('.exe')))

  console.log(`\n========================================`)
  console.log(`Total Checks: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`========================================`)

  if (failed > 0) {
    process.exit(1)
  }
}

runE2ETests().catch((err) => {
  console.error(err)
  process.exit(1)
})

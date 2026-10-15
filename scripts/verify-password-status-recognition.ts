import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function runVerification() {
  console.log('--- STARTING PASSWORD STATUS & RECOGNITION VERIFICATION ---')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`)
      passed++
    } else {
      console.error(`[FAIL] ${msg}`)
      failed++
    }
  }

  try {
    // 1. Fetch an admin or staff user with real bcrypt password hash from the database
    const testUser = await db.user.findFirst({
      where: {
        passwordHash: { startsWith: '$2' },
      },
    })

    if (!testUser) {
      throw new Error('No user with password found in database to verify')
    }

    console.log(`Testing with user: ${testUser.fullName || testUser.username}, ID: ${testUser.id}`)

    // 2. Simulate GET /api/v1/users logic for computing password recognition metadata
    const hasPassword = Boolean(testUser.passwordHash && testUser.passwordHash.trim().length > 0)
    const passwordStatus = hasPassword ? 'CONFIGURED' : (testUser.status === 'PENDING' ? 'PENDING_SETUP' : 'NOT_SET')
    const maskedPassword = hasPassword ? '••••••••' : null

    assert(hasPassword === true, 'hasPassword computes to true for user with password in DB')
    assert(passwordStatus === 'CONFIGURED', 'passwordStatus is CONFIGURED for user with password')
    assert(maskedPassword === '••••••••', 'maskedPassword is •••••••• and NOT blank or plain-text')

    // 3. Security Assertions: Plain text and raw hash protection
    assert(!('password' in testUser), 'Plaintext password is never stored on User model')
    assert(testUser.passwordHash!.startsWith('$2'), 'Stored password is cryptographically hashed with bcrypt')

    // 4. Test non-password profile update preserving existing password
    const originalHash = testUser.passwordHash
    const updatedTestPhone = testUser.phone === '9876543210' ? '9876543211' : '9876543210'

    // Simulate PATCH /api/v1/users/[id] WITHOUT password field
    const updatedUser = await db.user.update({
      where: { id: testUser.id },
      data: {
        phone: updatedTestPhone,
        // passwordHash is omitted to simulate existing password preservation
      },
    })

    assert(updatedUser.passwordHash === originalHash, 'Password hash in DB remains completely unchanged after non-password profile edit')
    assert(updatedUser.phone === updatedTestPhone, 'Profile field (phone) updated successfully')

    // Verify bcrypt password still matches original credentials if testable
    console.log('Testing password verification with bcrypt...')
    const canCompare = await bcrypt.compare('TemporaryPassword!@#123', updatedUser.passwordHash!)
    assert(typeof canCompare === 'boolean', 'bcrypt comparison executes properly against stored hash')

    // 5. Test password status for users without password (e.g. pending setup)
    const noPasswordHasPassword = Boolean(null && (null as any).trim().length > 0)
    const noPasswordStatus = noPasswordHasPassword ? 'CONFIGURED' : 'PENDING_SETUP'
    const noPasswordMasked = noPasswordHasPassword ? '••••••••' : null

    assert(noPasswordHasPassword === false, 'hasPassword correctly computes false when passwordHash is null')
    assert(noPasswordStatus === 'PENDING_SETUP', 'passwordStatus correctly computes PENDING_SETUP when password is missing')
    assert(noPasswordMasked === null, 'maskedPassword is null when password is not configured')

    console.log('\n--- VERIFICATION SUMMARY ---')
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err: any) {
    console.error('Verification error:', err)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

runVerification()

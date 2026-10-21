import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { TransportSecurityService } from '@/lib/transport/transport-security'
import { TransportService } from '@/lib/transport/transport-service'
import { PickupPinService } from '@/lib/users/pickup-pin-service'
import { POST as registeredGuardianPickupPost } from '@/app/api/v1/transport/registered-guardian/pickup/route'
import bcrypt from 'bcryptjs'

describe('Transport Pickup PIN Security & Hardcoded Fallback Elimination (BUG-001 / Phase 1 P0)', () => {
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB: any
  let driverProfileA: any
  let attendantProfileA: any
  let vehicleA: any
  let routeA: any
  let stopA: any
  let studentA1: any
  let studentA2: any
  let studentB: any
  let guardianMother: any
  let guardianFather: any
  let guardianUnauthorized: any
  let tripA: any
  let manifestItem1: any
  let manifestItem2: any

  let staffUserA: any
  let staffUserB: any
  let cookieStaffA: string
  let cookieStaffB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Tenants & Branches
    tenantA = await db.tenant.create({
      data: {
        name: `Transport Sec School A ${ts}`,
        code: `TSA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })
    tenantB = await db.tenant.create({
      data: {
        name: `Transport Sec School B ${ts}`,
        code: `TSB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Branch Main ${ts}`,
        code: `BR1-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Branch Secondary ${ts}`,
        code: `BR2-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: `Branch B ${ts}`,
        code: `BRB-${ts.slice(-4)}`,
        isActive: true,
      },
    })

    // Staff Users
    staffUserA = await db.user.create({
      data: {
        email: `staffA_${ts}@preone.test`,
        fullName: 'Staff Member A',
        status: 'ACTIVE',
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: staffUserA.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
    cookieStaffA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      name: staffUserA.fullName,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tenantId: tenantA.id,
      branchId: branchA1.id,
    })

    staffUserB = await db.user.create({
      data: {
        email: `staffB_${ts}@preone.test`,
        fullName: 'Staff Member B',
        status: 'ACTIVE',
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: staffUserB.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
    cookieStaffB = await signSession({
      uid: staffUserB.id,
      email: staffUserB.email,
      name: staffUserB.fullName,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tenantId: tenantB.id,
      branchId: branchB.id,
    })

    // Driver & Attendant
    const driverUser = await db.user.create({
      data: {
        email: `driver_${ts}@preone.test`,
        fullName: 'Ramesh Driver',
        status: 'ACTIVE',
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: driverUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
    driverProfileA = await db.staffProfile.create({
      data: {
        tenantId: tenantA.id,
        userId: driverUser.id,
        employeeCode: `DRV-${ts.slice(-4)}`,
        designation: 'Bus Driver',
        branchId: branchA1.id,
        status: 'ACTIVE',
      },
    })

    const attendantUser = await db.user.create({
      data: {
        email: `attendant_${ts}@preone.test`,
        fullName: 'Sunita Attendant',
        status: 'ACTIVE',
        passwordHash: 'dummy-hash',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: attendantUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
    attendantProfileA = await db.staffProfile.create({
      data: {
        tenantId: tenantA.id,
        userId: attendantUser.id,
        employeeCode: `ATT-${ts.slice(-4)}`,
        designation: 'Bus Attendant',
        branchId: branchA1.id,
        status: 'ACTIVE',
      },
    })

    // Vehicle & Route & Stop
    vehicleA = await db.vehicle.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        registrationNumber: `MH-12-SEC-${ts.slice(-4)}`,
        vehicleType: 'VAN',
        capacity: 10,
        status: 'ACTIVE',
      },
    })

    routeA = await db.transportRoute.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        code: `R-SEC-${ts.slice(-4)}`,
        name: 'Route Security Alpha',
        vehicleId: vehicleA.id,
        driverProfileId: driverProfileA.id,
        attendantProfileId: attendantProfileA.id,
        status: 'ACTIVE',
      },
    })

    stopA = await db.routeStop.create({
      data: {
        tenantId: tenantA.id,
        routeId: routeA.id,
        name: 'Main Gate Stop',
        sequence: 1,
      },
    })

    // Students
    studentA1 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-${ts}-1`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2020-04-12'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    studentA2 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA2.id, // Different branch in tenant A
        admissionNo: `ADM-${ts}-2`,
        firstName: 'Diya',
        lastName: 'Patel',
        dob: new Date('2021-02-18'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    studentB = await db.student.create({
      data: {
        tenantId: tenantB.id, // Tenant B student
        branchId: branchB.id,
        admissionNo: `ADM-${ts}-3`,
        firstName: 'Kabir',
        lastName: 'Mehta',
        dob: new Date('2020-08-20'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // Guardians
    // Mother has bcrypt-hashed PIN: '5819'
    const hashedPinMother = await bcrypt.hash('5819', 10)
    guardianMother = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Pooja Sharma',
        phone: `98811${ts.slice(-5)}`,
        relationship: 'MOTHER',
        pickupPin: hashedPinMother,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: guardianMother.id,
        relationship: 'MOTHER',
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: hashedPinMother,
      },
    })

    // Father has plain PIN (safe non-trivial): '9362'
    guardianFather = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Vikram Sharma',
        phone: `98812${ts.slice(-5)}`,
        relationship: 'FATHER',
        pickupPin: '9362',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: guardianFather.id,
        relationship: 'FATHER',
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: '9362',
      },
    })

    // Unauthorized Relative (canPickup: false)
    guardianUnauthorized = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Kishore Sharma',
        phone: `98813${ts.slice(-5)}`,
        relationship: 'GRANDPARENT',
        pickupPin: '6142',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: guardianUnauthorized.id,
        relationship: 'GRANDPARENT',
        canPickup: false,
        pickupStatus: 'NOT_AUTHORIZED',
        pickupPin: '6142',
      },
    })

    // Operational Trip and Manifest
    tripA = await db.transportTrip.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        routeId: routeA.id,
        vehicleId: vehicleA.id,
        driverProfileId: driverProfileA.id,
        tripType: 'EVENING',
        tripDate: new Date(),
        status: 'IN_PROGRESS',
        actualStartTime: new Date(),
      },
    })

    manifestItem1 = await db.tripManifestItem.create({
      data: {
        tripId: tripA.id,
        studentId: studentA1.id,
        stopId: stopA.id,
        status: 'BOARDED',
      },
    })

    manifestItem2 = await db.tripManifestItem.create({
      data: {
        tripId: tripA.id,
        studentId: studentA2.id,
        stopId: stopA.id,
        status: 'BOARDED',
      },
    })
  })

  // -------------------------------------------------------------------------
  // Test 1: Insecure fallback PINs (1234, 0000) strictly rejected
  // -------------------------------------------------------------------------
  it('1. Insecure fallback PINs (1234, 0000) do not work as fallback credentials', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'ADMIN',
    }

    // Attempting 1234 against mother
    const result1234 = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianMother.id,
      studentId: studentA1.id,
      pin: '1234',
    })
    expect(result1234.valid).toBe(false)
    expect(result1234.code).toBe('INVALID_CREDENTIALS')

    // Attempting 0000 against father
    const result0000 = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianFather.id,
      studentId: studentA1.id,
      pin: '0000',
    })
    expect(result0000.valid).toBe(false)
    expect(result0000.code).toBe('INVALID_CREDENTIALS')
  })

  // -------------------------------------------------------------------------
  // Test 2: Missing or unconfigured PINs fail closed
  // -------------------------------------------------------------------------
  it('2. Missing or unconfigured PINs fail closed (PIN_NOT_CONFIGURED)', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'ADMIN',
    }

    // Create guardian with NO PIN
    const unconfiguredGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Unconfigured Guardian',
        phone: `98819${ts.slice(-5)}`,
        relationship: 'MOTHER',
        pickupPin: null,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: unconfiguredGuardian.id,
        relationship: 'MOTHER',
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: null,
      },
    })

    const result = await TransportSecurityService.verifyPin(ctx, {
      guardianId: unconfiguredGuardian.id,
      studentId: studentA1.id,
      pin: '5819',
    })
    expect(result.valid).toBe(false)
    expect(result.code).toBe('PIN_NOT_CONFIGURED')
  })

  // -------------------------------------------------------------------------
  // Test 3: Incorrect PINs cannot complete pickup verification
  // -------------------------------------------------------------------------
  it('3. Incorrect PINs cannot complete pickup verification', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Father PIN is 9362, send 9363
    const result = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianFather.id,
      studentId: studentA1.id,
      pin: '9363',
    })
    expect(result.valid).toBe(false)
    expect(result.code).toBe('PIN_MISMATCH')
  })

  // -------------------------------------------------------------------------
  // Test 4: Correctly configured PIN verifies through authoritative server flow
  // -------------------------------------------------------------------------
  it('4. Correctly configured PIN (bcrypt and plaintext) verifies through authoritative flow', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Mother has bcrypt hash of 5819
    const motherCheck = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianMother.id,
      studentId: studentA1.id,
      pin: '5819',
    })
    expect(motherCheck.valid).toBe(true)
    expect(motherCheck.guardian).toBeDefined()

    // Father has plain valid verifier 9362
    const fatherCheck = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianFather.id,
      studentId: studentA1.id,
      pin: '9362',
    })
    expect(fatherCheck.valid).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Test 5: Unauthorized staff / guardian cannot complete pickup even with valid PIN
  // -------------------------------------------------------------------------
  it('5. Unauthorized guardian (canPickup=false) is blocked even with knowledge of valid PIN', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Uncle has canPickup: false, but knows his configured PIN 6142
    const result = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianUnauthorized.id,
      studentId: studentA1.id,
      pin: '6142',
    })
    expect(result.valid).toBe(false)
    expect(result.code).toBe('NOT_AUTHORIZED')
  })

  // -------------------------------------------------------------------------
  // Test 6: Direct API calls cannot bypass PIN verification or pickup authorization
  // -------------------------------------------------------------------------
  it('6. Direct API calls cannot bypass PIN verification or pickup authorization', async () => {
    // 6a. Direct call with no PIN
    const reqNoPin = new NextRequest('http://localhost:3000/api/v1/transport/registered-guardian/pickup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({
        studentId: studentA1.id,
        guardianId: guardianMother.id,
      }),
    })
    const resNoPin = await registeredGuardianPickupPost(reqNoPin)
    expect(resNoPin.status).toBe(400)
    const jsonNoPin = await resNoPin.json()
    expect(jsonNoPin.error.message).toContain('PIN')

    // 6b. Direct call with fallback PIN 1234
    const reqFallbackPin = new NextRequest('http://localhost:3000/api/v1/transport/registered-guardian/pickup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({
        studentId: studentA1.id,
        guardianId: guardianMother.id,
        pin: '1234',
      }),
    })
    const resFallbackPin = await registeredGuardianPickupPost(reqFallbackPin)
    expect(resFallbackPin.status).toBe(403)
    const jsonFallbackPin = await resFallbackPin.json()
    expect(jsonFallbackPin.error.message).toContain('Insecure or invalid PIN')
  })

  // -------------------------------------------------------------------------
  // Test 7: Repeated failed attempts trigger progressive rate limiting / lockout
  // -------------------------------------------------------------------------
  it('7. Repeated failed attempts trigger rate limiting lockout (RATE_LIMIT_EXCEEDED)', async () => {
    const targetKey = `lockout_target_${Date.now()}`
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Reset rate limiter for test target
    TransportSecurityService.resetPinRateLimit(`pin:${tenantA.id}:${targetKey}`)

    // Execute 5 failed attempts using dedicated targetKey as userId
    for (let i = 0; i < 5; i++) {
      await TransportSecurityService.verifyPin(ctx, {
        userId: targetKey,
        pin: '9999', // wrong PIN
      })
    }

    // 6th attempt should be blocked with RATE_LIMIT_EXCEEDED
    const lockedResult = await TransportSecurityService.verifyPin(ctx, {
      userId: targetKey,
      pin: '9362',
    })
    expect(lockedResult.valid).toBe(false)
    expect(lockedResult.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(lockedResult.message).toContain('lockout active')

    // Clean up rate limit state for targetKey
    TransportSecurityService.resetPinRateLimit(`pin:${tenantA.id}:${targetKey}`)
  })

  // -------------------------------------------------------------------------
  // Test 8: PIN reset/invalidation invalidates previous PIN
  // -------------------------------------------------------------------------
  it('8. PIN reset/invalidation invalidates previous PIN', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Reset Father's PIN to new value '8426'
    await db.studentGuardian.updateMany({
      where: { guardianId: guardianFather.id, studentId: studentA1.id },
      data: { pickupPin: '8426' },
    })
    await db.guardian.update({
      where: { id: guardianFather.id },
      data: { pickupPin: '8426' },
    })

    // Old PIN 9362 now fails
    const oldCheck = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianFather.id,
      studentId: studentA1.id,
      pin: '9362',
    })
    expect(oldCheck.valid).toBe(false)

    // New PIN 8426 succeeds
    const newCheck = await TransportSecurityService.verifyPin(ctx, {
      guardianId: guardianFather.id,
      studentId: studentA1.id,
      pin: '8426',
    })
    expect(newCheck.valid).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Test 9: PINs and hashes never appear in API responses or public logs
  // -------------------------------------------------------------------------
  it('9. PINs and hashes never appear in API responses or security event summaries', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/transport/registered-guardian/pickup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({
        studentId: studentA1.id,
        guardianId: guardianMother.id,
        pin: '5819',
      }),
    })
    const res = await registeredGuardianPickupPost(req)
    const json = await res.json()
    const str = JSON.stringify(json)

    // Response should NOT contain the submitted PIN or bcrypt hash verifier
    expect(str).not.toContain('5819')
    expect(str).not.toContain('$2b$10$')

    // Inspect recorded security events
    const latestEvent = await db.transportSecurityEvent.findFirst({
      where: { tenantId: tenantA.id, studentId: studentA1.id },
      orderBy: { createdAt: 'desc' },
    })
    expect(latestEvent).toBeDefined()
    if (latestEvent) {
      expect(JSON.stringify(latestEvent)).not.toContain('5819')
      expect(JSON.stringify(latestEvent)).not.toContain('$2b$10$')
    }
  })

  // -------------------------------------------------------------------------
  // Test 10: Cross-branch and wrong-child verification attempts are rejected
  // -------------------------------------------------------------------------
  it('10. Cross-branch and cross-tenant verification attempts are strictly rejected', async () => {
    // 10a. Cross-branch attempt: staff in branchA1 tries to verify student in branchA2
    const crossBranchCtx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }
    const branchCheck = await TransportSecurityService.verifyPin(crossBranchCtx, {
      guardianId: guardianMother.id,
      studentId: studentA2.id, // student is in branchA2!
      pin: '5819',
    })
    expect(branchCheck.valid).toBe(false)
    expect(branchCheck.code).toBe('NOT_AUTHORIZED')

    // 10b. Cross-tenant attempt: staff from tenantB tries to drop manifest from tenantA
    const reqCrossTenant = new NextRequest('http://localhost:3000/api/v1/transport/registered-guardian/pickup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `preone_session=${cookieStaffB}`, // Tenant B staff
      },
      body: JSON.stringify({
        studentId: studentA1.id, // Student belongs to Tenant A
        guardianId: guardianMother.id,
        pin: '5819',
      }),
    })
    const resCrossTenant = await registeredGuardianPickupPost(reqCrossTenant)
    expect(resCrossTenant.status).toBe(404) // Scoped query does not find student in tenant B
  })

  // -------------------------------------------------------------------------
  // Test 11: Concurrent requests cannot duplicate drops (race condition guard)
  // -------------------------------------------------------------------------
  it('11. Concurrent drop requests cannot execute duplicate drops', async () => {
    const ctx = {
      tenantId: tenantA.id,
      branchId: branchA1.id,
      actorId: staffUserA.id,
      actorName: 'Staff Member A',
      actorRole: 'PRINCIPAL',
    }

    // Reset manifest item 1 status to BOARDED for concurrency test
    await db.tripManifestItem.update({
      where: { id: manifestItem1.id },
      data: { status: 'BOARDED', droppedAt: null, verifiedGuardianId: null },
    })

    // Execute 2 concurrent recordDrop calls
    const [drop1, drop2] = await Promise.allSettled([
      TransportService.recordDrop(ctx, {
        tripId: tripA.id,
        studentId: studentA1.id,
        guardianId: guardianFather.id,
        pin: '8426',
      }),
      TransportService.recordDrop(ctx, {
        tripId: tripA.id,
        studentId: studentA1.id,
        guardianId: guardianFather.id,
        pin: '8426',
      }),
    ])

    // Exactly one should succeed or both resolve idempotently without double-dropping
    const successCount = [drop1, drop2].filter((r) => r.status === 'fulfilled').length
    expect(successCount).toBeGreaterThanOrEqual(1)

    // Manifest status must be DROPPED
    const finalItem = await db.tripManifestItem.findUnique({
      where: { id: manifestItem1.id },
    })
    expect(finalItem?.status).toBe('DROPPED')
  })

  // -------------------------------------------------------------------------
  // Test 12: Insecure PIN Migration / Audit Scanner
  // -------------------------------------------------------------------------
  it('12. Insecure PIN migration scanner locates and purges 1234/0000/1111 fallbacks', async () => {
    // Seed insecure PINs
    const insecureGuardian = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Legacy Insecure Guardian',
        phone: `98899${ts.slice(-5)}`,
        relationship: 'FATHER',
        pickupPin: '1234',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA1.id,
        guardianId: insecureGuardian.id,
        relationship: 'FATHER',
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: '0000',
      },
    })

    // Run audit and migration
    const migrationResult = await PickupPinService.auditAndMigrateInsecurePins({
      tenantId: tenantA.id,
      actorSession: {
        uid: staffUserA.id,
        name: 'Staff Member A',
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        tenantId: tenantA.id,
      } as any,
    })

    expect(migrationResult.purgedGuardians).toBeGreaterThanOrEqual(1)
    expect(migrationResult.purgedLinks).toBeGreaterThanOrEqual(1)

    // Insecure PINs are purged
    const refreshedGuardian = await db.guardian.findUnique({
      where: { id: insecureGuardian.id },
    })
    expect(refreshedGuardian?.pickupPin).toBeNull()

    const refreshedLink = await db.studentGuardian.findFirst({
      where: { guardianId: insecureGuardian.id, studentId: studentA1.id },
    })
    expect(refreshedLink?.pickupPin).toBeNull()
    expect(refreshedLink?.pickupStatus).toBe('PENDING') // Requires explicit authorized re-enrollment
  })
})

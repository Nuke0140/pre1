import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import {
  TransportSecurityService,
  TRANSPORT_QR_SECRET,
  TRANSPORT_QR_ISSUER,
  TRANSPORT_QR_AUDIENCE,
  resetScanRateLimit,
} from '@/lib/transport/transport-security'
import { TransportService } from '@/lib/transport/transport-service'
import { POST as scanPost } from '@/app/api/v1/transport/scan/route'
import { POST as generateQrPost } from '@/app/api/v1/transport/qr/generate/route'
import { GET as getAuthQrGet } from '@/app/api/v1/transport/authorizations/[id]/qr/route'
import { POST as completeAuthPost } from '@/app/api/v1/transport/authorizations/[id]/complete/route'
import { SignJWT } from 'jose'

describe('Transport QR Token Security & Cryptographic Enforcement (BUG-002 / Phase 1 P0)', () => {
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB: any
  let driverUserA: any
  let driverProfileA: any
  let vehicleA: any
  let routeA: any
  let studentA: any
  let studentB: any
  let guardianA: any
  let staffUserA: any
  let staffUserB: any
  let cookieStaffA: string
  let cookieStaffB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Tenants & Branches
    tenantA = await db.tenant.create({
      data: {
        name: `QR Sec School A ${ts}`,
        code: `QRA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })
    tenantB = await db.tenant.create({
      data: {
        name: `QR Sec School B ${ts}`,
        code: `QRB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Branch Main ${ts}`,
        code: `BR1-${ts.slice(-4)}`,
      },
    })
    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Branch North ${ts}`,
        code: `BR2-${ts.slice(-4)}`,
      },
    })
    branchB = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: `Branch Campus B ${ts}`,
        code: `BRB-${ts.slice(-4)}`,
      },
    })

    // 2. Staff User A & Staff User B
    staffUserA = await db.user.create({
      data: {
        email: `staff.a.${ts}@example.com`,
        fullName: 'Staff Officer A',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'PRINCIPAL',
          },
        },
      },
    })
    staffUserB = await db.user.create({
      data: {
        email: `staff.b.${ts}@example.com`,
        fullName: 'Staff Officer B',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        memberships: {
          create: {
            tenantId: tenantB.id,
            branchId: branchB.id,
            role: 'PRINCIPAL',
          },
        },
      },
    })

    cookieStaffA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      name: staffUserA.fullName,
      tenantId: tenantA.id,
      branchId: branchA1.id,
      role: 'PRINCIPAL',
    })

    cookieStaffB = await signSession({
      uid: staffUserB.id,
      email: staffUserB.email,
      name: staffUserB.fullName,
      tenantId: tenantB.id,
      branchId: branchB.id,
      role: 'PRINCIPAL',
    })

    // 3. Driver and Vehicle for Tenant A
    driverUserA = await db.user.create({
      data: {
        email: `driver.${ts}@example.com`,
        fullName: 'Ramesh Driver',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'DRIVER',
          },
        },
      },
    })

    driverProfileA = await db.staffProfile.create({
      data: {
        tenantId: tenantA.id,
        userId: driverUserA.id,
        employeeCode: `EMP-DRV-${ts.slice(-4)}`,
        designation: 'Transport Driver',
        status: 'ACTIVE',
      },
    })

    vehicleA = await db.vehicle.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        registrationNumber: `MH-12-QR-${ts.slice(-4)}`,
        capacity: 30,
        status: 'ACTIVE',
      },
    })

    routeA = await db.transportRoute.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        name: `Route 101 ${ts}`,
        code: `R101-${ts.slice(-4)}`,
        vehicleId: vehicleA.id,
        driverProfileId: driverProfileA.id,
        status: 'ACTIVE',
      },
    })

    // 4. Students
    studentA = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        firstName: 'Ananya',
        lastName: 'Sharma',
        admissionNo: `ADM-A-${ts.slice(-4)}`,
        dob: new Date('2022-05-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    studentB = await db.student.create({
      data: {
        tenantId: tenantB.id,
        branchId: branchB.id,
        firstName: 'Vivaan',
        lastName: 'Verma',
        admissionNo: `ADM-B-${ts.slice(-4)}`,
        dob: new Date('2022-08-20'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // 5. Guardian in Tenant A
    const guardianUser = await db.user.create({
      data: {
        email: `mother.${ts}@example.com`,
        fullName: 'Sunita Sharma',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'PARENT',
          },
        },
      },
    })

    guardianA = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: guardianUser.id,
        fullName: 'Sunita Sharma',
        phone: '9876543210',
        relationship: 'MOTHER',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: studentA.id,
        guardianId: guardianA.id,
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
      },
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Positive Driver QR Token Issuance & Verification
  // ──────────────────────────────────────────────────────────────────────────
  it('1. Generates and authoritatively validates cryptographically signed Driver QR token', async () => {
    // Generate signed token via TransportService
    const genResult = await TransportService.generateDriverQRToken(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      { routeId: routeA.id, vehicleId: vehicleA.id }
    )

    expect(genResult.token).toBeDefined()
    expect(genResult.token.startsWith('TPQR_')).toBe(true)

    // Scan the token via POST /api/v1/transport/scan
    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: genResult.token }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(true)
    expect(json.data.scanType).toBe('TRANSPORT_DRIVER')
    expect(json.data.status).toBe('VERIFIED')
    expect(json.data.route.id).toBe(routeA.id)
    expect(json.data.vehicle.id).toBe(vehicleA.id)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Forged Signature Rejection
  // ──────────────────────────────────────────────────────────────────────────
  it('2. Strictly rejects tokens with forged or modified cryptographic signatures', async () => {
    // Sign a token using an attacker secret
    const attackerSecret = new TextEncoder().encode('attacker-forged-secret-not-trusted-by-server')
    const forgedToken = await new SignJWT({
      tenantId: tenantA.id,
      purpose: 'TRANSPORT_DRIVER',
      routeId: routeA.id,
      vehicleId: vehicleA.id,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(TRANSPORT_QR_ISSUER)
      .setAudience(TRANSPORT_QR_AUDIENCE)
      .setSubject(routeA.id)
      .setExpirationTime('1h')
      .sign(attackerSecret)

    const payload = `TPQR_${forgedToken}`

    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: payload }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(false)
    expect(json.data.status).toBe('SIGNATURE_INVALID')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Expired QR Token Rejection
  // ──────────────────────────────────────────────────────────────────────────
  it('3. Strictly rejects expired QR tokens', async () => {
    // Generate an expired token (expired 60 seconds ago)
    const expiredJwt = await new SignJWT({
      tenantId: tenantA.id,
      purpose: 'TRANSPORT_DRIVER',
      routeId: routeA.id,
      vehicleId: vehicleA.id,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(TRANSPORT_QR_ISSUER)
      .setAudience(TRANSPORT_QR_AUDIENCE)
      .setSubject(routeA.id)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(TRANSPORT_QR_SECRET)

    const payload = `TPQR_${expiredJwt}`

    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: payload }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(false)
    expect(json.data.status).toBe('EXPIRED')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Legacy Unsigned TRPQR_ Format Rejection
  // ──────────────────────────────────────────────────────────────────────────
  it('4. Rejects legacy unsigned base64 TRPQR_ tokens immediately', async () => {
    const rawLegacyPayload = `${tenantA.id}:${routeA.id}:${vehicleA.id}:${staffUserA.id}:${Date.now()}:nonce123`
    const legacyToken = `TRPQR_${Buffer.from(rawLegacyPayload).toString('base64')}`

    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: legacyToken }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(false)
    expect(json.data.status).toBe('UNSIGNED_TOKEN_REJECTED')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Raw / Unauthenticated String & JSON Rejection
  // ──────────────────────────────────────────────────────────────────────────
  it('5. Rejects raw strings (STUDENT:id, GUARDIAN:id, AUTH:id) and raw JSON without signature', async () => {
    const testCases = [
      `STUDENT:${studentA.id}`,
      `GUARDIAN:${guardianA.id}`,
      `AUTH:cm_some_fake_auth`,
      `DRIVER:${driverUserA.id}`,
      JSON.stringify({ type: 'STUDENT', id: studentA.id }),
      studentA.id,
    ]

    for (const testCase of testCases) {
      const req = new NextRequest('http://localhost/api/v1/transport/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieStaffA}`,
        },
        body: JSON.stringify({ qrPayload: testCase }),
      })

      const res = await scanPost(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.valid).toBe(false)
      expect(['UNSIGNED_TOKEN_REJECTED', 'MALFORMED']).toContain(json.data.status)
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Cross-Tenant Isolation Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  it('6. Strictly rejects cross-tenant QR tokens (TENANT_MISMATCH)', async () => {
    // Generate valid signed token for Tenant B
    const tokenB = await TransportSecurityService.generateTransportQrToken({
      tenantId: tenantB.id,
      branchId: branchB.id,
      purpose: 'TRANSPORT_STUDENT',
      sub: studentB.id,
      studentId: studentB.id,
      expiresIn: '24h',
    })

    // Staff member from Tenant A attempts to scan it
    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: tokenB.token }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(false)
    expect(json.data.status).toBe('TENANT_MISMATCH')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Cross-Branch Isolation Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  it('7. Rejects QR tokens scoped to another branch (BRANCH_MISMATCH)', async () => {
    // Create token scoped to Branch A2
    const tokenBranch2 = await TransportSecurityService.generateTransportQrToken({
      tenantId: tenantA.id,
      branchId: branchA2.id,
      purpose: 'TRANSPORT_STUDENT',
      sub: studentA.id,
      studentId: studentA.id,
      expiresIn: '24h',
    })

    // Staff User A belongs to Branch A1
    const req = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: tokenBranch2.token }),
    })

    const res = await scanPost(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.valid).toBe(false)
    expect(json.data.status).toBe('BRANCH_MISMATCH')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Purpose Binding Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  it('8. Enforces token purpose binding and rejects purpose mismatches', async () => {
    // Generate driver token
    const driverToken = await TransportSecurityService.generateTransportQrToken({
      tenantId: tenantA.id,
      branchId: branchA1.id,
      purpose: 'TRANSPORT_DRIVER',
      sub: routeA.id,
      routeId: routeA.id,
      vehicleId: vehicleA.id,
    })

    // Attempt direct verification expecting TRANSPORT_STUDENT
    const check = await TransportSecurityService.verifyTransportQrToken(driverToken.token, {
      expectedTenantId: tenantA.id,
      expectedPurpose: 'TRANSPORT_STUDENT',
    })

    expect(check.valid).toBe(false)
    expect(check.code).toBe('PURPOSE_MISMATCH')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Temporary Pickup Authorization: Signed QR Issuance & Verification
  // ──────────────────────────────────────────────────────────────────────────
  it('9. Issues signed QR code for approved temporary pickup authorization and validates at gate', async () => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)

    // Create pickup authorization for Uncle Rahul
    const auth = await TransportSecurityService.createPickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      {
        studentId: studentA.id,
        personName: 'Uncle Rahul',
        phone: '9811223344',
        relationship: 'Uncle',
        reason: 'Parent out of town',
        validFrom: today,
        validUntil: tomorrow,
        isOneTime: true,
      }
    )

    // Approve authorization
    await TransportSecurityService.approvePickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      auth.id
    )

    // Fetch signed QR token via GET /api/v1/transport/authorizations/:id/qr
    const qrReq = new NextRequest(`http://localhost/api/v1/transport/authorizations/${auth.id}/qr`, {
      method: 'GET',
      headers: { cookie: `preone_session=${cookieStaffA}` },
    })

    const qrRes = await getAuthQrGet(qrReq, { params: Promise.resolve({ id: auth.id }) })
    const qrJson = await qrRes.json()

    expect(qrJson.success).toBe(true)
    expect(qrJson.data.token).toBeDefined()
    expect(qrJson.data.token.startsWith('TPQR_')).toBe(true)

    // Scan at Gate via POST /api/v1/transport/scan
    const scanReq = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: qrJson.data.token }),
    })

    const scanRes = await scanPost(scanReq)
    const scanJson = await scanRes.json()

    expect(scanJson.success).toBe(true)
    expect(scanJson.data.valid).toBe(true)
    expect(scanJson.data.scanType).toBe('AUTHORIZATION')
    expect(scanJson.data.status).toBe('APPROVED')
    expect(scanJson.data.authorization.personName).toBe('Uncle Rahul')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Single-Use Replay Protection for One-Time Authorizations
  // ──────────────────────────────────────────────────────────────────────────
  it('10. Prevents replaying consumed one-time pickup authorization tokens (ALREADY_USED)', async () => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)

    const auth = await TransportSecurityService.createPickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      {
        studentId: studentA.id,
        personName: 'Aunt Priya',
        phone: '9822334455',
        relationship: 'Aunt',
        reason: 'One-time emergency pickup',
        validFrom: today,
        validUntil: tomorrow,
        isOneTime: true,
      }
    )

    await TransportSecurityService.approvePickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      auth.id
    )

    // Generate signed QR
    const qrData = await TransportSecurityService.generateTransportQrToken({
      tenantId: tenantA.id,
      branchId: branchA1.id,
      purpose: 'TRANSPORT_PICKUP_AUTH',
      sub: auth.id,
      authId: auth.id,
      studentId: studentA.id,
    })

    // First completion succeeds
    const completeReq1 = new NextRequest(`http://localhost/api/v1/transport/authorizations/${auth.id}/complete`, {
      method: 'POST',
      headers: { cookie: `preone_session=${cookieStaffA}` },
    })

    const completeRes1 = await completeAuthPost(completeReq1, { params: Promise.resolve({ id: auth.id }) })
    const completeJson1 = await completeRes1.json()
    expect(completeJson1.success).toBe(true)

    // Second completion fails (replay blocked)
    const completeReq2 = new NextRequest(`http://localhost/api/v1/transport/authorizations/${auth.id}/complete`, {
      method: 'POST',
      headers: { cookie: `preone_session=${cookieStaffA}` },
    })
    const completeRes2 = await completeAuthPost(completeReq2, { params: Promise.resolve({ id: auth.id }) })
    expect(completeRes2.status).toBe(403)

    // Rescanning at Gate is blocked with ALREADY_USED
    const rescanReq = new NextRequest('http://localhost/api/v1/transport/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieStaffA}`,
      },
      body: JSON.stringify({ qrPayload: qrData.token }),
    })

    const rescanRes = await scanPost(rescanReq)
    const rescanJson = await rescanRes.json()

    expect(rescanJson.success).toBe(true)
    expect(rescanJson.data.valid).toBe(false)
    expect(rescanJson.data.status).toBe('ALREADY_USED')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Concurrency Race Condition Safety
  // ──────────────────────────────────────────────────────────────────────────
  it('11. Ensures atomic consumption prevents concurrent double-handover race condition', async () => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)

    const auth = await TransportSecurityService.createPickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      {
        studentId: studentA.id,
        personName: 'Grandpa Mohan',
        phone: '9833445566',
        relationship: 'Grandfather',
        reason: 'Pickup authorization',
        validFrom: today,
        validUntil: tomorrow,
        isOneTime: true,
      }
    )

    await TransportSecurityService.approvePickupAuthorization(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      auth.id
    )

    // Fire 2 concurrent completion requests simultaneously
    const reqFactory = () =>
      new NextRequest(`http://localhost/api/v1/transport/authorizations/${auth.id}/complete`, {
        method: 'POST',
        headers: { cookie: `preone_session=${cookieStaffA}` },
      })

    const [res1, res2] = await Promise.all([
      completeAuthPost(reqFactory(), { params: Promise.resolve({ id: auth.id }) }),
      completeAuthPost(reqFactory(), { params: Promise.resolve({ id: auth.id }) }),
    ])

    const statuses = [res1.status, res2.status]
    // Exactly one must succeed (200) and the other must be rejected (403 replay detected)
    expect(statuses.filter((s) => s === 200).length).toBe(1)
    expect(statuses.filter((s) => s === 403).length).toBe(1)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Rate Limiting on Scan Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  it('12. Prevents scanner abuse by enforcing sliding-window rate limit (HTTP 429)', async () => {
    // Generate valid token
    const token = await TransportSecurityService.generateTransportQrToken({
      tenantId: tenantA.id,
      branchId: branchA1.id,
      purpose: 'TRANSPORT_DRIVER',
      sub: routeA.id,
      routeId: routeA.id,
      vehicleId: vehicleA.id,
    })

    const fakeIp = `192.168.100.${Math.floor(Math.random() * 200 + 10)}`

    // Reset rate limiter for test
    const rateLimitKey = `scan:${tenantA.id}:${staffUserA.id}:${fakeIp}`
    resetScanRateLimit(rateLimitKey)

    let rateLimited = false
    // Perform 35 rapid invalid scans to trigger rate limiter
    for (let i = 0; i < 35; i++) {
      const req = new NextRequest('http://localhost/api/v1/transport/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieStaffA}`,
          'x-forwarded-for': fakeIp,
        },
        body: JSON.stringify({ qrPayload: 'INVALID_CORRUPT_TOKEN_123' }),
      })

      const res = await scanPost(req)
      if (res.status === 429) {
        rateLimited = true
        const json = await res.json()
        expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED')
        break
      }
    }

    expect(rateLimited).toBe(true)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Audit and Security Event Trail
  // ──────────────────────────────────────────────────────────────────────────
  it('13. Logs security events for all scan and authorization attempts without leaking secrets', async () => {
    const logs = await TransportSecurityService.getSecurityLogs(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        actorId: staffUserA.id,
        actorName: staffUserA.fullName,
        actorRole: 'PRINCIPAL',
      },
      { limit: 20 }
    )

    expect(logs.length).toBeGreaterThan(0)
    for (const log of logs) {
      // Ensure private keys, signing secrets or tokens are never leaked into event summaries/reasons
      expect(log.reason).not.toContain(process.env.JWT_SECRET || 'preone-dev-jwt-secret')
      expect(log.action).toBeDefined()
      expect(log.result).toBeDefined()
    }
  })
})

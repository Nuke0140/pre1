import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as pickupPinGet, POST as pickupPinPost } from '@/app/api/v1/users/[id]/pickup-pin/route'
import { PickupPinService } from '@/lib/users/pickup-pin-service'

describe('Pickup PIN Lifecycle & Security (reset/regenerate/auto-provision — Doc N-5)', () => {
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let teacherA: any
  let parentUserA: any
  let guardianRecordA: any
  let student1: any
  let student2: any
  let link1: any
  let link2: any
  let cookieOwnerA: string
  let cookieTeacherA: string
  let cookieTenantB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        name: `Pickup PIN School A ${ts}`,
        code: `PIN-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Tenant B (for cross-tenant checks)
    tenantB = await db.tenant.create({
      data: {
        name: `Pickup PIN School B ${ts}`,
        code: `PNB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 3. Setup Owner A
    ownerA = await db.user.create({
      data: {
        email: `owner_${ts}@pickuppin.com`,
        username: `owner_${ts}`,
        fullName: 'Owner Principal A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // 4. Setup Teacher A (lacking users:write)
    teacherA = await db.user.create({
      data: {
        email: `teacher_${ts}@pickuppin.com`,
        username: `teacher_${ts}`,
        fullName: 'Teacher A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    cookieTeacherA = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })

    // 5. Setup Tenant B admin
    const adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@pickuppin.com`,
        username: `adminB_${ts}`,
        fullName: 'Admin School B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: adminB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieTenantB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })

    // 6. Setup Parent User & Guardian Profile in Tenant A
    parentUserA = await db.user.create({
      data: {
        email: `parent_${ts}@pickuppin.com`,
        username: `parent_${ts}`,
        fullName: 'Ramesh Sharma',
        phone: `+9198${ts.slice(-8)}`,
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: parentUserA.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    guardianRecordA = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: parentUserA.id,
        fullName: parentUserA.fullName,
        phone: parentUserA.phone!,
        email: parentUserA.email,
        relationship: 'FATHER',
        isPrimaryContact: true,
        pickupPin: null, // Initially unconfigured
      },
    })

    const branchA = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Main Campus ${ts}`,
        code: `BR-${ts.slice(-3)}`,
        isMain: true,
      },
    })

    // 7. Setup 2 Students linked to this Guardian
    student1 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA.id,
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('2020-05-15'),
        admissionNo: `ADM-1-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    student2 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA.id,
        firstName: 'Ananya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dob: new Date('2021-08-20'),
        admissionNo: `ADM-2-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    link1 = await db.studentGuardian.create({
      data: {
        studentId: student1.id,
        guardianId: guardianRecordA.id,
        relationship: 'FATHER',
        canPickup: true,
        pickupPin: null,
      },
    })

    link2 = await db.studentGuardian.create({
      data: {
        studentId: student2.id,
        guardianId: guardianRecordA.id,
        relationship: 'FATHER',
        canPickup: true,
        pickupPin: null,
      },
    })
  })

  // ──────────────────────────────────────────────────────────
  // 1. PIN STATUS & METRICS
  // ──────────────────────────────────────────────────────────
  it('1. GET /api/v1/users/[id]/pickup-pin returns unconfigured status when no PIN is set', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await pickupPinGet(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data || json
    expect(data.hasGuardianPin).toBe(false)
    expect(data.guardianPinMasked).toBeNull()
    expect(data.students.length).toBe(2)
    expect(data.stats.totalStudents).toBe(2)
    expect(data.stats.pickupAuthorized).toBe(2)
    expect(data.stats.withPin).toBe(0)
    expect(data.stats.missingPin).toBe(2)
  })

  // ──────────────────────────────────────────────────────────
  // 2. AUTO-PROVISIONING
  // ──────────────────────────────────────────────────────────
  it('2. POST /api/v1/users/[id]/pickup-pin with action: auto-provision populates secure PIN across family', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'auto-provision',
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data || json
    expect(data.action).toBe('auto-provision')
    expect(typeof data.provisionedPin).toBe('string')
    expect(data.provisionedPin.length).toBe(4)
    expect(data.affectedStudents).toBe(2)

    // Verify DB persistence
    const updatedGuardian = await db.guardian.findUnique({ where: { id: guardianRecordA.id } })
    expect(updatedGuardian?.pickupPin).toBe(data.provisionedPin)

    const links = await db.studentGuardian.findMany({ where: { guardianId: guardianRecordA.id } })
    for (const l of links) {
      expect(l.pickupPin).toBe(data.provisionedPin)
    }

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        entityId: guardianRecordA.id,
        action: 'PICKUP_PIN_AUTOPROVISIONED',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  it('3. Auto-provisioned PIN avoids trivial repeated digits or simple sequences', () => {
    const pin = PickupPinService.generateSecurePin(4)
    expect(pin.length).toBe(4)
    expect(/^[0-9]{4}$/.test(pin)).toBe(true)

    const validation = PickupPinService.validatePin(pin)
    expect(validation.valid).toBe(true)

    // Rejection of known trivial pins
    expect(PickupPinService.validatePin('0000').valid).toBe(false)
    expect(PickupPinService.validatePin('1111').valid).toBe(false)
    expect(PickupPinService.validatePin('1234').valid).toBe(false)
  })

  // ──────────────────────────────────────────────────────────
  // 3. REGENERATE ACTION
  // ──────────────────────────────────────────────────────────
  it('4. POST /api/v1/users/[id]/pickup-pin with action: regenerate rotates PIN and updates audit log', async () => {
    const previousGuardian = await db.guardian.findUnique({ where: { id: guardianRecordA.id } })
    const oldPin = previousGuardian?.pickupPin

    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'regenerate',
        syncToAllStudents: true,
        reason: 'Periodic security rotation',
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data || json
    expect(data.action).toBe('regenerate')
    expect(typeof data.newPin).toBe('string')
    expect(data.newPin).not.toBe(oldPin)
    expect(data.updatedStudentsCount).toBe(2)

    // Check DB
    const refreshed = await db.guardian.findUnique({ where: { id: guardianRecordA.id } })
    expect(refreshed?.pickupPin).toBe(data.newPin)

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        entityId: guardianRecordA.id,
        action: 'PICKUP_PIN_REGENERATED',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.actorId).toBe(ownerA.id)
  })

  // ──────────────────────────────────────────────────────────
  // 4. RESET / CUSTOM PIN ACTION
  // ──────────────────────────────────────────────────────────
  it('5. POST /api/v1/users/[id]/pickup-pin with action: reset sets valid custom PIN', async () => {
    const customPin = '8392'
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'reset',
        pin: customPin,
        syncToAllStudents: true,
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const refreshed = await db.guardian.findUnique({ where: { id: guardianRecordA.id } })
    expect(refreshed?.pickupPin).toBe(customPin)

    const audit = await db.auditLog.findFirst({
      where: {
        entityId: guardianRecordA.id,
        action: 'PICKUP_PIN_RESET',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  it('6. POST /api/v1/users/[id]/pickup-pin with action: reset rejects invalid non-numeric or short PINs', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'reset',
        pin: '12', // Too short
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error?.code || json.code).toBe('INVALID_PIN_FORMAT')
  })

  it('7. POST /api/v1/users/[id]/pickup-pin with action: reset rejects weak trivial PIN', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'reset',
        pin: '0000', // Trivial weak PIN
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error?.code || json.code).toBe('PIN_TOO_WEAK')
  })

  // ──────────────────────────────────────────────────────────
  // 5. CLEAR ACTION & STUDENT-SPECIFIC OVERRIDE
  // ──────────────────────────────────────────────────────────
  it('8. Student-specific PIN override: Setting distinct PIN for student1 leaves student2 intact', async () => {
    const child1Pin = '9412'
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'reset',
        studentId: student1.id,
        pin: child1Pin,
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)

    const l1 = await db.studentGuardian.findUnique({ where: { id: link1.id } })
    const l2 = await db.studentGuardian.findUnique({ where: { id: link2.id } })

    expect(l1?.pickupPin).toBe(child1Pin)
    expect(l2?.pickupPin).not.toBe(child1Pin)
  })

  it('9. POST /api/v1/users/[id]/pickup-pin with action: clear resets PIN to null', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieOwnerA}`,
      },
      body: JSON.stringify({
        action: 'clear',
        syncToAllStudents: true,
      }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(200)

    const refreshed = await db.guardian.findUnique({ where: { id: guardianRecordA.id } })
    expect(refreshed?.pickupPin).toBeNull()

    const links = await db.studentGuardian.findMany({ where: { guardianId: guardianRecordA.id } })
    for (const l of links) {
      expect(l.pickupPin).toBeNull()
    }

    const audit = await db.auditLog.findFirst({
      where: {
        entityId: guardianRecordA.id,
        action: 'PICKUP_PIN_CLEARED',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  // ──────────────────────────────────────────────────────────
  // 6. RBAC & TENANT ISOLATION GUARDS
  // ──────────────────────────────────────────────────────────
  it('10. Unprivileged teacher lacking users:write is rejected with 401/403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieTeacherA}`,
      },
      body: JSON.stringify({ action: 'regenerate' }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect([401, 403]).toContain(res.status)
  })

  it('11. Cross-tenant pickup PIN administration is blocked with 404', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/pickup-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieTenantB}`,
      },
      body: JSON.stringify({ action: 'regenerate' }),
    })

    const res = await pickupPinPost(req, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(res.status).toBe(404)
  })
})

import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { StudentService } from '@/lib/students/student-service'
import { OperationPolicies } from '@/lib/operations/operation-policies'

describe('Pickup Security & Guardians Test Suite', () => {
  let tenant: any
  let branch: any
  let session: any
  let student: any
  let guardianMother: any
  let guardianFather: any
  let guardianNanny: any

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'PICKUP-SEC-TEST' },
      create: {
        code: 'PICKUP-SEC-TEST',
        name: 'Pickup Security Test School',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'MAIN-SEC',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'MAIN-SEC',
        name: 'Main Campus',
        isActive: true,
      },
      update: {},
    })

    session = await db.academicSession.findFirst({
      where: { tenantId: tenant.id },
    })
    if (!session) {
      session = await db.academicSession.create({
        data: {
          tenantId: tenant.id,
          name: '2026-2027',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
          status: 'ACTIVE',
        },
      })
    }

    // 2. Create student
    const rand = Math.floor(Math.random() * 100000)
    student = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `SEC-${rand}`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2022-05-15'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // 3. Create guardians
    guardianMother = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Priya Sharma',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'MOTHER',
        pickupPin: '5432',
      },
    })

    guardianFather = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Rajesh Sharma',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'FATHER',
      },
    })

    guardianNanny = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Sunita Bai',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: 'OTHER',
      },
    })
  })

  it('1. Linking a guardian does NOT automatically grant pickup authorization', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-user',
      actorName: 'School Admin',
      actorRole: 'OWNER',
    }

    // Link Father as Primary & Emergency contact without pickup rights
    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianFather.id,
      isPrimary: true,
      isEmergencyContact: true,
      emergencyPriority: 1,
      canPickup: false,
      pickupStatus: 'NOT_AUTHORIZED',
    })

    // Profile check
    const profile = await StudentService.getStudentProfile(ctx, student.id)
    const fatherLink = profile.guardians.find((g: any) => g.id === guardianFather.id)

    expect(fatherLink).toBeDefined()
    expect(fatherLink.isPrimary).toBe(true)
    expect(fatherLink.isEmergencyContact).toBe(true)
    expect(fatherLink.canPickup).toBe(false)
    expect(fatherLink.pickupStatus).toBe('NOT_AUTHORIZED')

    // Gate check: Gate release must block Father from collecting child
    const gateCheck = await OperationPolicies.verifyPickupPerson(tenant.id, student.id, {
      guardianId: guardianFather.id,
    })

    expect(gateCheck.authorized).toBe(false)
    expect(gateCheck.status).toBe('NOT_MATCH')
    expect(gateCheck.reason).toContain('Not Authorized')
  })

  it('2. Enforces explicit AUTHORIZED status for gate release', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-user',
      actorName: 'School Admin',
      actorRole: 'OWNER',
    }

    // Link Mother with full pickup authorization
    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianMother.id,
      isPrimary: false,
      isEmergencyContact: true,
      emergencyPriority: 2,
      canPickup: true,
      pickupStatus: 'AUTHORIZED',
    })

    const gateCheck = await OperationPolicies.verifyPickupPerson(
      tenant.id,
      student.id,
      {
        guardianId: guardianMother.id,
        pin: '5432',
      },
      '5432'
    )

    expect(gateCheck.authorized).toBe(true)
    expect(gateCheck.status).toBe('MATCH')
    expect(gateCheck.guardianName).toBe('Priya Sharma')
  })

  it('3. Enforces authorization expiry dates', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-user',
      actorName: 'School Admin',
      actorRole: 'OWNER',
    }

    // Authorize Nanny with yesterday as expiration date
    const yesterday = new Date(Date.now() - 86400000)
    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianNanny.id,
      pickupStatus: 'AUTHORIZED',
      canPickup: true,
      authExpiresAt: yesterday,
    })

    const gateCheck = await OperationPolicies.verifyPickupPerson(tenant.id, student.id, {
      guardianId: guardianNanny.id,
    })

    expect(gateCheck.authorized).toBe(false)
    expect(gateCheck.status).toBe('NOT_MATCH')
    expect(gateCheck.reason).toContain('expired')
  })

  it('4. Enforces authorized days of week', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-user',
      actorName: 'School Admin',
      actorRole: 'OWNER',
    }

    // Find a day that is NOT today
    const now = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const todayIndex = now.getDay()
    const notTodayIndex = (todayIndex + 2) % 7
    const notTodayName = days[notTodayIndex]

    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianNanny.id,
      pickupStatus: 'AUTHORIZED',
      canPickup: true,
      pickupDays: notTodayName,
    })

    const gateCheck = await OperationPolicies.verifyPickupPerson(tenant.id, student.id, {
      guardianId: guardianNanny.id,
    })

    expect(gateCheck.authorized).toBe(false)
    expect(gateCheck.status).toBe('NOT_MATCH')
    expect(gateCheck.reason).toContain('not authorized on')
  })

  it('5. Protects PIN privacy and verifies configured PIN status', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-user',
      actorName: 'School Admin',
      actorRole: 'OWNER',
    }

    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianMother.id,
      pickupStatus: 'AUTHORIZED',
      canPickup: true,
    })

    const profile = await StudentService.getStudentProfile(ctx, student.id)
    const motherData = profile.guardians.find((g: any) => g.id === guardianMother.id)

    expect(motherData).toBeDefined()
    expect(motherData.hasPickupPin).toBe(true)
    expect(motherData.pickupPinMasked).toBe('••••')
    // Plaintext PIN must NEVER be exposed in the profile response
    expect((motherData as any).pickupPin).toBeUndefined()
  })

  it('6. Supports temporary/alternate pickup authorization (TransportPickupAuthorization)', async () => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 86400000)

    // Create an approved temporary pickup person (e.g. Uncle / Driver)
    const tempAuth = await db.transportPickupAuthorization.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        studentId: student.id,
        personName: 'Ramesh Uncle',
        phone: '+919999888877',
        relationship: 'UNCLE',
        reason: 'Parents traveling out of town',
        validFrom: today,
        validUntil: tomorrow,
        status: 'APPROVED',
        approvedByName: 'Principal Ananya',
      },
    })

    const gateCheck = await OperationPolicies.verifyPickupPerson(tenant.id, student.id, {
      phone: '+919999888877',
    })

    expect(gateCheck.authorized).toBe(true)
    expect(gateCheck.status).toBe('MATCH')
    expect(gateCheck.guardianName).toBe('Ramesh Uncle')
    expect(gateCheck.relationship).toBe('UNCLE')
  })

  it('7. MANAGE_PICKUP action creates immutable audit log', async () => {
    const ctx = {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: 'admin-123',
      actorName: 'Vice Principal',
      actorRole: 'PRINCIPAL',
    }

    // Link first
    await StudentService.manageGuardians(ctx, student.id, {
      action: 'LINK',
      guardianId: guardianMother.id,
      canPickup: false,
      pickupStatus: 'NOT_AUTHORIZED',
    })

    // Now update via MANAGE_PICKUP
    await StudentService.manageGuardians(ctx, student.id, {
      action: 'MANAGE_PICKUP',
      guardianId: guardianMother.id,
      pickupStatus: 'RESTRICTED',
      pickupRestrictions: 'Must show physical gate pass and Aadhaar card',
      pickupTimeWindow: '01:45 PM – 02:15 PM',
      verifiedByName: 'Vice Principal',
    })

    const auditEntry = await db.auditLog.findFirst({
      where: {
        tenantId: tenant.id,
        action: 'PICKUP_AUTHORIZATION_UPDATED',
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(auditEntry).toBeDefined()
    expect(auditEntry?.actorName).toBe('Vice Principal')
    expect(auditEntry?.summary).toContain('RESTRICTED')
  })
})

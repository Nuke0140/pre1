import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { GET as usersGet } from '@/app/api/v1/users/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { StaffUserService } from '@/lib/users/staff-user-service'

describe('PreOne Users Module — Add Staff Classroom Assignment Directly from /app/users', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branchA: any
  let branchB: any
  let academicSession: any
  let classroomA: any
  let classroomB: any
  let adminUser: any
  let adminCookie: string

  beforeAll(async () => {
    // 1. Setup Tenant & Branches
    tenant = await db.tenant.create({
      data: {
        code: `CLS-T-${ts.slice(-6)}`,
        name: `Classroom Assign Academy ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'North Campus',
        code: `NC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'South Campus',
        code: `SC-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Session 2026-${ts.slice(-4)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    classroomA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicSessionId: academicSession.id,
        name: `Sunshine Nursery A-${ts.slice(-4)}`,
        code: `SN-A-${ts.slice(-4)}`,
        capacity: 20,
        programType: 'NURSERY',
        isActive: true,
      },
    })

    classroomB = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchB.id,
        academicSessionId: academicSession.id,
        name: `Blossom Playgroup B-${ts.slice(-4)}`,
        code: `BP-B-${ts.slice(-4)}`,
        capacity: 15,
        programType: 'PLAYGROUP',
        isActive: true,
      },
    })

    // 2. Setup Super Admin
    adminUser = await db.user.create({
      data: {
        email: `admin.cls.${ts}@preone.test`,
        fullName: 'Classroom Test Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branchA.id,
            role: 'OWNER',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branchA.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    adminCookie = `${SESSION_COOKIE}=${token}`
  })

  afterAll(async () => {
    // Cleanup created data
    try {
      await db.classroom.deleteMany({ where: { tenantId: tenant.id } })
      await db.staffProfile.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenantUserBranch.deleteMany({ where: { tenantUser: { tenantId: tenant.id } } })
      await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
      await db.academicSession.deleteMany({ where: { tenantId: tenant.id } })
      await db.branch.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenant.delete({ where: { id: tenant.id } })
    } catch {
      // Ignore cleanup error in test tear-down
    }
  })

  it('1. Successfully creates a Teacher and assigns directly to a classroom in one atomic operation', async () => {
    const payload = {
      fullName: 'Aarav Patel',
      email: `aarav.patel.${ts}@preone.test`,
      role: 'TEACHER',
      primaryRole: 'TEACHER',
      roles: ['TEACHER'],
      branchId: branchA.id,
      employeeCode: `TCH-${ts.slice(-4)}-01`,
      designation: 'Primary Lead Teacher',
      department: 'Academics',
      classroomId: classroomA.id,
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.fullName).toBe('Aarav Patel')
    expect(json.data.role).toBe('TEACHER')
    expect(json.data.classroom).toBeDefined()
    expect(json.data.classroom.id).toBe(classroomA.id)
    expect(json.data.classroom.name).toBe(classroomA.name)
    expect(json.data.taughtClasses).toBeDefined()
    expect(json.data.taughtClasses.length).toBe(1)
    expect(json.data.taughtClasses[0].id).toBe(classroomA.id)

    // Verify DB persistence: Classroom.primaryTeacherId
    const updatedRoom = await db.classroom.findUnique({
      where: { id: classroomA.id },
    })
    expect(updatedRoom?.primaryTeacherId).toBe(json.data.userId)
  })

  it('2. Successfully creates an Attendant and assigns to classroom caregiving roster', async () => {
    const payload = {
      fullName: 'Sunita Bai',
      email: `sunita.bai.${ts}@preone.test`,
      role: 'ATTENDANT',
      primaryRole: 'ATTENDANT',
      roles: ['ATTENDANT'],
      branchId: branchA.id,
      employeeCode: `ATT-${ts.slice(-4)}-01`,
      designation: 'Classroom Care Attendant',
      department: 'Caregiving',
      classroomId: classroomA.id,
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.fullName).toBe('Sunita Bai')
    expect(json.data.role).toBe('ATTENDANT')
    expect(json.data.classroom).toBeDefined()
    expect(json.data.classroom.id).toBe(classroomA.id)

    // Attendant assignment must NOT overwrite the primary teacher
    const room = await db.classroom.findUnique({
      where: { id: classroomA.id },
    })
    // Primary teacher should still be Aarav Patel, not Sunita Bai
    expect(room?.primaryTeacherId).not.toBe(json.data.userId)

    // Attendant assignment is stored in User preferences and profile department
    const attendantUser = await db.user.findUnique({
      where: { id: json.data.userId },
    })
    const prefs = attendantUser?.preferences as any
    expect(prefs?.assignedClassroomId).toBe(classroomA.id)
    expect(prefs?.assignedClassroomName).toBe(classroomA.name)
    expect(prefs?.classroomRole).toBe('ATTENDANT')
  })

  it('3. Rejects assigning a second primary teacher to an occupied classroom without explicit reassignment confirmation (409 Conflict)', async () => {
    const payload = {
      fullName: 'Vikram Mehta',
      email: `vikram.mehta.${ts}@preone.test`,
      role: 'TEACHER',
      primaryRole: 'TEACHER',
      roles: ['TEACHER'],
      branchId: branchA.id,
      employeeCode: `TCH-${ts.slice(-4)}-02`,
      designation: 'Senior Teacher',
      department: 'Academics',
      classroomId: classroomA.id, // Already occupied by Aarav Patel
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
      // reassignClassroom is false / omitted
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(409)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('already has a primary teacher assigned')
    expect(json.error.message).toContain('Aarav Patel')

    // Verify DB wasn't modified
    const room = await db.classroom.findUnique({
      where: { id: classroomA.id },
      include: { primaryTeacher: true },
    })
    expect(room?.primaryTeacher?.fullName).toBe('Aarav Patel')
  })

  it('4. Successfully reassigns primary teacher position when reassignClassroom: true is confirmed', async () => {
    const payload = {
      fullName: 'Vikram Mehta Confirmed',
      email: `vikram.confirmed.${ts}@preone.test`,
      role: 'TEACHER',
      primaryRole: 'TEACHER',
      roles: ['TEACHER'],
      branchId: branchA.id,
      employeeCode: `TCH-${ts.slice(-4)}-03`,
      designation: 'Senior Teacher',
      department: 'Academics',
      classroomId: classroomA.id,
      reassignClassroom: true, // Explicit confirmation
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)

    // Verify DB primary teacher has been updated to Vikram
    const updatedRoom = await db.classroom.findUnique({
      where: { id: classroomA.id },
      include: { primaryTeacher: true },
    })
    expect(updatedRoom?.primaryTeacherId).toBe(json.data.userId)
    expect(updatedRoom?.primaryTeacher?.fullName).toBe('Vikram Mehta Confirmed')
  })

  it('5. Ignores classroomId if role is non-classroom (e.g. ACCOUNTS)', async () => {
    const payload = {
      fullName: 'Ramesh Accounts',
      email: `ramesh.accounts.${ts}@preone.test`,
      role: 'ACCOUNTS',
      primaryRole: 'ACCOUNTS',
      roles: ['ACCOUNTS'],
      branchId: branchA.id,
      employeeCode: `ACC-${ts.slice(-4)}-01`,
      designation: 'Accountant',
      department: 'Finance',
      classroomId: classroomB.id, // non-classroom role should not be assigned
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.data.classroom).toBeNull()
    expect(json.data.taughtClasses.length).toBe(0)

    const roomB = await db.classroom.findUnique({
      where: { id: classroomB.id },
    })
    expect(roomB?.primaryTeacherId).toBeNull()
  })

  it('6. Rejects classroom assignment when classroom belongs to a different campus branch', async () => {
    const payload = {
      fullName: 'Branch Mismatch Teacher',
      email: `mismatch.teacher.${ts}@preone.test`,
      role: 'TEACHER',
      primaryRole: 'TEACHER',
      roles: ['TEACHER'],
      branchId: branchA.id, // Branch A
      employeeCode: `TCH-${ts.slice(-4)}-04`,
      designation: 'Teacher',
      department: 'Academics',
      classroomId: classroomB.id, // Belongs to Branch B!
      credentialSetupMode: 'MANUAL',
      password: 'PreOne@SecurePass123',
    }

    const req = new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(payload),
    })

    const res = await usersPost(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('does not belong to the selected campus branch')
  })

  it('7. Roster synchronization: GET /api/v1/users returns assigned classroom and taughtClasses', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users?branchId=${branchA.id}&role=TEACHER`, {
      method: 'GET',
      headers: {
        Cookie: adminCookie,
      },
    })

    const res = await usersGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)

    const items = json.data?.items || json.data || []
    const vikram = items.find((u: any) => u.fullName === 'Vikram Mehta Confirmed')
    expect(vikram).toBeDefined()
  })

  it('8. StaffUserService.createStaff service method parity check', async () => {
    const serviceResult = await StaffUserService.createStaff(
      {
        tenantId: tenant.id,
        actorId: adminUser.id,
        actorName: 'Admin',
        actorRole: 'OWNER',
        actorBranchId: branchB.id,
      },
      {
        fullName: 'Service Layer Teacher',
        email: `service.teacher.${ts}@preone.test`,
        primaryRole: 'TEACHER',
        branchId: branchB.id,
        employeeCode: `TCH-${ts.slice(-4)}-99`,
        designation: 'Lead Educator',
        department: 'Academics',
        classroomId: classroomB.id,
        password: 'PreOne@SecurePass123',
      }
    )

    expect(serviceResult.user).toBeDefined()
    expect(serviceResult.classroom).toBeDefined()
    expect(serviceResult.classroom.id).toBe(classroomB.id)

    const updatedRoomB = await db.classroom.findUnique({
      where: { id: classroomB.id },
    })
    expect(updatedRoomB?.primaryTeacherId).toBe(serviceResult.user.id)
  })
})

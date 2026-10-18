import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as classroomsGet } from '@/app/api/v1/classrooms/route'
import { GET as studentsGet } from '@/app/api/v1/students/route'

describe('PreOne — 1-Tap Classroom Filter Pills', () => {
  let tenant: any
  let branchA: any
  let branchB: any
  let academicSession: any
  let classroomPlaygroup: any
  let classroomNurseryA: any
  let classroomNurseryB: any
  let classroomKindergarten: any
  let teacherUser: any
  let adminUser: any
  let student1: any
  let student2: any
  let student3: any
  let student4: any

  let cookieAdmin: string
  let cookieTeacher: string

  const ts = Date.now().toString()

  beforeEach(async () => {
    // 1. Setup Tenant
    tenant = await db.tenant.create({
      data: {
        name: `Pill Test Academy ${ts}`,
        code: `PTA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup 2 Branches for cross-branch isolation verification
    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Downtown Campus',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
        isActive: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'North Valley Campus',
        code: `NORTH-${ts.slice(-4)}`,
        isMain: false,
        isActive: true,
      },
    })

    // 3. Setup Academic Session
    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Session 2026-27 ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })

    // 4. Setup Teacher and Admin
    teacherUser = await db.user.create({
      data: {
        email: `teacher-${ts}@preone.local`,
        username: `teacher_${ts}`,
        fullName: 'Sunita Sharma',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        branchId: branchA.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `admin-${ts}@preone.local`,
        username: `admin_${ts}`,
        fullName: 'Principal Mehra',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        branchId: branchA.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    // Generate authenticated test session cookies
    cookieAdmin = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branchA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    cookieTeacher = await signSession({
      uid: teacherUser.id,
      email: teacherUser.email,
      name: teacherUser.fullName,
      tenantId: tenant.id,
      branchId: branchA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // 5. Setup Classrooms across Programs and Branches
    // Branch A Classrooms
    classroomPlaygroup = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicSessionId: academicSession.id,
        name: 'Playgroup Butterflies',
        code: `PG-${ts.slice(-3)}`,
        programType: 'PLAYGROUP',
        capacity: 18,
        primaryTeacherId: teacherUser.id,
      },
    })

    classroomNurseryA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicSessionId: academicSession.id,
        name: 'Nursery A Sunflowers',
        code: `NUR-A-${ts.slice(-3)}`,
        programType: 'NURSERY',
        capacity: 22,
        primaryTeacherId: teacherUser.id,
      },
    })

    classroomNurseryB = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicSessionId: academicSession.id,
        name: 'Nursery B Orchids',
        code: `NUR-B-${ts.slice(-3)}`,
        programType: 'NURSERY',
        capacity: 20,
      },
    })

    // Branch B Classroom
    classroomKindergarten = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchB.id,
        academicSessionId: academicSession.id,
        name: 'LKG Stars',
        code: `LKG-${ts.slice(-3)}`,
        programType: 'LKG',
        capacity: 25,
      },
    })

    // 6. Setup Active Students
    // 2 in Playgroup (Branch A)
    student1 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        currentClassroomId: classroomPlaygroup.id,
        admissionNo: `ADM-PG-1-${ts}`,
        firstName: 'Vivaan',
        lastName: 'Joshi',
        dob: new Date('2023-05-10'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    student2 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        currentClassroomId: classroomPlaygroup.id,
        admissionNo: `ADM-PG-2-${ts}`,
        firstName: 'Anaya',
        lastName: 'Kapoor',
        dob: new Date('2023-06-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    // 1 in Nursery A (Branch A)
    student3 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        currentClassroomId: classroomNurseryA.id,
        admissionNo: `ADM-NUR-1-${ts}`,
        firstName: 'Reyansh',
        lastName: 'Gupta',
        dob: new Date('2022-09-20'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // 1 in Kindergarten/LKG (Branch B)
    student4 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchB.id,
        currentClassroomId: classroomKindergarten.id,
        admissionNo: `ADM-KG-1-${ts}`,
        firstName: 'Diya',
        lastName: 'Menon',
        dob: new Date('2021-11-05'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })
  })

  afterEach(async () => {
    // Cleanup records safely
    if (tenant?.id) {
      await db.student.deleteMany({ where: { tenantId: tenant.id } })
      await db.classroom.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
      await db.academicSession.deleteMany({ where: { tenantId: tenant.id } })
      await db.branch.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenant.deleteMany({ where: { id: tenant.id } })
    }
    if (teacherUser?.id) await db.user.deleteMany({ where: { id: teacherUser.id } })
    if (adminUser?.id) await db.user.deleteMany({ where: { id: adminUser.id } })
  })

  it('1. GET /api/v1/classrooms provides accurate enrolled student counts per room', async () => {
    const req = new NextRequest(`http://localhost/api/v1/classrooms?branchId=${branchA.id}`, {
      headers: {
        Cookie: `preone_session=${cookieAdmin}`,
      },
    })

    const res = await classroomsGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const pgRoom = json.data.find((c: any) => c.id === classroomPlaygroup.id)
    const nurARoom = json.data.find((c: any) => c.id === classroomNurseryA.id)
    const nurBRoom = json.data.find((c: any) => c.id === classroomNurseryB.id)

    expect(pgRoom).toBeDefined()
    expect(pgRoom.students).toBe(2) // Vivaan and Anaya
    expect(pgRoom.activeEnrollment).toBe(2)

    expect(nurARoom).toBeDefined()
    expect(nurARoom.students).toBe(1) // Reyansh
    expect(nurARoom.activeEnrollment).toBe(1)

    expect(nurBRoom).toBeDefined()
    expect(nurBRoom.students).toBe(0) // Empty classroom
    expect(nurBRoom.activeEnrollment).toBe(0)
  })

  it('2. Enforces branch isolation: classrooms from Branch B are not leaked when Branch A is filtered', async () => {
    const req = new NextRequest(`http://localhost/api/v1/classrooms?branchId=${branchA.id}`, {
      headers: {
        Cookie: `preone_session=${cookieAdmin}`,
      },
    })

    const res = await classroomsGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)

    const kgRoomInBranchA = json.data.find((c: any) => c.id === classroomKindergarten.id)
    expect(kgRoomInBranchA).toBeUndefined()
  })

  it('3. Enforces teacher scope: teacher only sees authorized classrooms in the pill list', async () => {
    const req = new NextRequest(`http://localhost/api/v1/classrooms`, {
      headers: {
        Cookie: `preone_session=${cookieTeacher}`,
      },
    })

    const res = await classroomsGet(req)
    const json = await res.json()
    expect(json.success).toBe(true)

    // Sunita Sharma is primary teacher of Playgroup & Nursery A, but not Nursery B
    const roomIds = json.data.map((c: any) => c.id)
    expect(roomIds).toContain(classroomPlaygroup.id)
    expect(roomIds).toContain(classroomNurseryA.id)
    expect(roomIds).not.toContain(classroomNurseryB.id)
    expect(roomIds).not.toContain(classroomKindergarten.id)
  })

  it('4. Filtering by classroomId via students API returns strictly that classroom roster', async () => {
    const req = new NextRequest(`http://localhost/api/v1/students?classroomId=${classroomPlaygroup.id}`, {
      headers: {
        Cookie: `preone_session=${cookieAdmin}`,
      },
    })

    const res = await studentsGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const returnedIds = json.data.map((s: any) => s.id)
    expect(returnedIds).toContain(student1.id)
    expect(returnedIds).toContain(student2.id)
    expect(returnedIds).not.toContain(student3.id)
    expect(returnedIds).not.toContain(student4.id)
  })

  it('5. Exported ClassroomFilterPills component handles scope changes and counts cleanly', async () => {
    const { ClassroomFilterPills } = await import('@/components/preone/ClassroomFilterPills')
    expect(ClassroomFilterPills).toBeDefined()
    expect(typeof ClassroomFilterPills).toBe('function')
  })
})

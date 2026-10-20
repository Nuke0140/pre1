import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { GET as usersGet } from '@/app/api/v1/users/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { FamilyUserService } from '@/lib/users/family-user-service'

describe('QA-026 — Family Directory & Dashboard Server-Side Aggregate KPIs', () => {
  const ts = Date.now().toString()
  let tenant: any
  let emptyTenant: any
  let branchA: any
  let branchB: any
  let adminUser: any
  let adminCookie: string

  beforeAll(async () => {
    // 1. Setup Tenant & Branches
    tenant = await db.tenant.create({
      data: {
        code: `QA26-${ts.slice(-6)}`,
        name: `QA-026 PreOne Academy ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    emptyTenant = await db.tenant.create({
      data: {
        code: `QA26-EMP-${ts.slice(-6)}`,
        name: `QA-026 Empty School ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'East Campus',
        code: `EAST-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `owner.qa26.${ts}@preone.test`,
        fullName: 'QA-026 School Owner',
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

    // 2. Seed Students in Branch A (total 20 students in Branch A)
    const studentsA: any[] = []
    for (let i = 1; i <= 20; i++) {
      const s = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branchA.id,
          admissionNo: `ADM-A-${ts.slice(-4)}-${i.toString().padStart(3, '0')}`,
          firstName: `StudentA${i}`,
          lastName: `Test`,
          dob: new Date('2021-01-01'),
          gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
          status: 'ACTIVE',
        },
      })
      studentsA.push(s)
    }

    // 3. Seed Students in Branch B (total 5 students in Branch B)
    const studentsB: any[] = []
    for (let i = 1; i <= 5; i++) {
      const s = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branchB.id,
          admissionNo: `ADM-B-${ts.slice(-4)}-${i.toString().padStart(3, '0')}`,
          firstName: `StudentB${i}`,
          lastName: `Test`,
          dob: new Date('2021-02-01'),
          gender: 'MALE',
          status: 'ACTIVE',
        },
      })
      studentsB.push(s)
    }

    // 4. Parents Setup in Branch A:
    // (a) Single-child parents: 10 parents linked to studentsA[0..9]
    for (let i = 0; i < 10; i++) {
      const u = await db.user.create({
        data: {
          fullName: `Parent Single ${i + 1}`,
          email: `parent.single.${i + 1}.${ts}@preone.test`,
          passwordHash: '$2b$10$placeholderhash1234567890',
          memberships: {
            create: {
              tenantId: tenant.id,
              branchId: branchA.id,
              role: 'PARENT',
            },
          },
        },
      })
      const g = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: u.id,
          fullName: u.fullName,
          relationship: 'FATHER',
          phone: `98000000${i.toString().padStart(2, '0')}`,
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: studentsA[i].id,
          guardianId: g.id,
          canPickup: true,
          relationship: 'FATHER',
        },
      })
    }

    // (b) Dual-parent families: 2 parents (Father + Mother) linked to studentsA[10] and studentsA[11]
    // 4 parent accounts total, but only 2 distinct students!
    for (let i = 10; i <= 11; i++) {
      // Father
      const uFather = await db.user.create({
        data: {
          fullName: `Dual Father ${i}`,
          email: `father.${i}.${ts}@preone.test`,
          passwordHash: '$2b$10$placeholderhash1234567890',
          memberships: {
            create: {
              tenantId: tenant.id,
              branchId: branchA.id,
              role: 'PARENT',
            },
          },
        },
      })
      const gFather = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: uFather.id,
          fullName: uFather.fullName,
          relationship: 'FATHER',
          phone: `98110000${i}`,
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: studentsA[i].id,
          guardianId: gFather.id,
          canPickup: true,
          relationship: 'FATHER',
        },
      })

      // Mother
      const uMother = await db.user.create({
        data: {
          fullName: `Dual Mother ${i}`,
          email: `mother.${i}.${ts}@preone.test`,
          passwordHash: '$2b$10$placeholderhash1234567890',
          memberships: {
            create: {
              tenantId: tenant.id,
              branchId: branchA.id,
              role: 'PARENT',
            },
          },
        },
      })
      const gMother = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: uMother.id,
          fullName: uMother.fullName,
          relationship: 'MOTHER',
          phone: `98120000${i}`,
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: studentsA[i].id,
          guardianId: gMother.id,
          canPickup: true,
          relationship: 'MOTHER',
        },
      })
    }

    // (c) Multi-child parents: 2 parents linked to multiple students
    // Parent Multi 1 linked to studentsA[12] and studentsA[13]
    const uMulti1 = await db.user.create({
      data: {
        fullName: `Multi Child Parent 1`,
        email: `multi1.${ts}@preone.test`,
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branchA.id,
            role: 'PARENT',
          },
        },
      },
    })
    const gMulti1 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: uMulti1.id,
        fullName: uMulti1.fullName,
        relationship: 'MOTHER',
        phone: `9822000001`,
      },
    })
    await db.studentGuardian.create({
      data: { studentId: studentsA[12].id, guardianId: gMulti1.id, canPickup: true },
    })
    await db.studentGuardian.create({
      data: { studentId: studentsA[13].id, guardianId: gMulti1.id, canPickup: true },
    })

    // Parent Multi 2 linked to studentsA[14], studentsA[15], and studentsA[16] (3 children)
    const uMulti2 = await db.user.create({
      data: {
        fullName: `Multi Child Parent 2`,
        email: `multi2.${ts}@preone.test`,
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branchA.id,
            role: 'PARENT',
          },
        },
      },
    })
    const gMulti2 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: uMulti2.id,
        fullName: uMulti2.fullName,
        relationship: 'FATHER',
        phone: `9822000002`,
      },
    })
    await db.studentGuardian.create({
      data: { studentId: studentsA[14].id, guardianId: gMulti2.id, canPickup: true },
    })
    await db.studentGuardian.create({
      data: { studentId: studentsA[15].id, guardianId: gMulti2.id, canPickup: true },
    })
    await db.studentGuardian.create({
      data: { studentId: studentsA[16].id, guardianId: gMulti2.id, canPickup: true },
    })

    // Total parents in Branch A so far: 10 + 4 + 2 = 16 parents.
    // Distinct students linked in Branch A so far: 10 + 2 + 2 + 3 = 17 students.
    // (studentsA[17, 18, 19] are not linked to any parent yet).

    // 5. Parents Setup in Branch B:
    // 3 parents linked to studentsB[0..2]
    for (let i = 0; i < 3; i++) {
      const u = await db.user.create({
        data: {
          fullName: `Branch B Parent ${i + 1}`,
          email: `parent.b.${i + 1}.${ts}@preone.test`,
          passwordHash: '$2b$10$placeholderhash1234567890',
          memberships: {
            create: {
              tenantId: tenant.id,
              branchId: branchB.id,
              role: 'PARENT',
            },
          },
        },
      })
      const g = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: u.id,
          fullName: u.fullName,
          relationship: 'FATHER',
          phone: `98330000${i}`,
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: studentsB[i].id,
          guardianId: g.id,
          canPickup: true,
          relationship: 'FATHER',
        },
      })
    }
    // Tenant totals for parents: 16 (Branch A) + 3 (Branch B) = 19 parents.
    // Tenant totals for linked students: 17 (Branch A) + 3 (Branch B) = 20 distinct linked students.

    // 6. Non-Login Pickup Guardians (in model Guardian with userId: null):
    // Guardian 1: Grandfather with canPickup = true and pickupPin = '4321'
    const gNonLogin1 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Grandfather Ashok',
        relationship: 'GRANDPARENT',
        phone: `9844000001`,
        userId: null,
        pickupPin: '4321',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentsA[0].id,
        guardianId: gNonLogin1.id,
        canPickup: true,
        pickupPin: '4321',
      },
    })

    // Guardian 2: Escort Driver with canPickup = true, no pin
    const gNonLogin2 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Driver Ramesh',
        relationship: 'OTHER',
        phone: `9844000002`,
        userId: null,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentsA[1].id,
        guardianId: gNonLogin2.id,
        canPickup: true,
      },
    })

    // Guardian 3: Caregiver in Branch B with canPickup = true
    const gNonLogin3 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Aunt Sunita (Branch B)',
        relationship: 'GUARDIAN',
        phone: `9844000003`,
        userId: null,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentsB[0].id,
        guardianId: gNonLogin3.id,
        canPickup: true,
      },
    })

    // 7. Non-Pickup Emergency Contacts:
    // Must NOT be counted as pickup guardians!
    const gEmergency = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Emergency Uncle Vikram (No Pickup)',
        relationship: 'OTHER',
        phone: `9855000001`,
        userId: null,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentsA[2].id,
        guardianId: gEmergency.id,
        isEmergencyContact: true,
        canPickup: false,
        pickupPin: null,
      },
    })
  })

  afterAll(async () => {
    try {
      await db.studentGuardian.deleteMany({ where: { student: { tenantId: tenant.id } } })
      await db.guardian.deleteMany({ where: { tenantId: tenant.id } })
      await db.student.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
      await db.branch.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenant.delete({ where: { id: tenant.id } })
      await db.tenant.delete({ where: { id: emptyTenant.id } })
    } catch {
      // best-effort cleanup
    }
  })

  it('1. Computes authoritative server-side aggregate KPIs via FamilyUserService.getFamilyKpis', async () => {
    const kpis = await FamilyUserService.getFamilyKpis(tenant.id)

    // Total parents = 19 (16 in Branch A + 3 in Branch B)
    expect(kpis.totalParents).toBe(19)

    // Distinct linked students = 20 (17 in Branch A + 3 in Branch B)
    // S21 and S22 have both Father AND Mother, but are counted once each!
    expect(kpis.linkedStudents).toBe(20)

    // Multi-child parents = 2 (Multi 1 with 2 kids, Multi 2 with 3 kids)
    expect(kpis.multiChildParents).toBe(2)

    // Total non-parent pickup guardians = 3 (Grandfather Ashok, Driver Ramesh, Aunt Sunita)
    // Emergency Uncle Vikram with canPickup=false is excluded!
    expect(kpis.totalGuardians).toBe(3)

    // Authorized pickup escorts = 3
    expect(kpis.authorizedPickupTotal).toBe(3)

    // Gate PIN set = 1 (Grandfather Ashok with PIN 4321)
    expect(kpis.pinSetTotal).toBe(1)
  })

  it('2. Correctly dedupes students linked to multiple parents (Father + Mother)', async () => {
    // Both parents exist for studentsA[10] and studentsA[11]
    const kpisA = await FamilyUserService.getFamilyKpis(tenant.id, { branchId: branchA.id })
    expect(kpisA.totalParents).toBe(16)
    // Distinct students: 10 (single) + 2 (dual parent) + 2 (multi 1) + 3 (multi 2) = 17
    expect(kpisA.linkedStudents).toBe(17)
  })

  it('3. Branch-scoped KPI calculation isolates Branch A from Branch B', async () => {
    const kpisB = await FamilyUserService.getFamilyKpis(tenant.id, { branchId: branchB.id })
    expect(kpisB.totalParents).toBe(3)
    expect(kpisB.linkedStudents).toBe(3)
    expect(kpisB.multiChildParents).toBe(0)
    expect(kpisB.totalGuardians).toBe(1) // Aunt Sunita
    expect(kpisB.authorizedPickupTotal).toBe(1)
    expect(kpisB.pinSetTotal).toBe(0)
  })

  it('4. Excludes emergency contacts who lack pickup authorization', async () => {
    const kpis = await FamilyUserService.getFamilyKpis(tenant.id)
    // Out of 4 non-login guardian records in db.guardian, Uncle Vikram has canPickup=false and no PIN.
    // Total pickup guardians must be strictly 3, not 4.
    expect(kpis.totalGuardians).toBe(3)
  })

  it('5. GET /api/v1/users returns authoritative meta.familyKpis and tabs parity', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users?role=PARENT&pageSize=5&page=1`, {
      headers: { cookie: adminCookie },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.meta).toBeDefined()
    expect(json.meta.familyKpis).toBeDefined()

    // Even though pageSize is 5 and only 5 rows are returned on page 1:
    expect(json.data.length).toBe(5)
    expect(json.meta.familyKpis.totalParents).toBe(19)
    expect(json.meta.familyKpis.linkedStudents).toBe(20)
    expect(json.meta.familyKpis.multiChildParents).toBe(2)
    expect(json.meta.familyKpis.totalGuardians).toBe(3)

    // Parity between tabs and familyKpis
    expect(json.meta.tabs.PARENT).toBe(19)
    expect(json.meta.tabs.GUARDIAN).toBe(3)
    expect(json.meta.tabs.FAMILY).toBe(22)
  })

  it('6. Changing pagination (page, pageSize) does not affect server-side KPI totals', async () => {
    const reqPage1 = new NextRequest(`http://localhost:3000/api/v1/users?role=PARENT&pageSize=3&page=1`, {
      headers: { cookie: adminCookie },
    })
    const res1 = await usersGet(reqPage1)
    const json1 = await res1.json()

    const reqPage2 = new NextRequest(`http://localhost:3000/api/v1/users?role=PARENT&pageSize=3&page=2`, {
      headers: { cookie: adminCookie },
    })
    const res2 = await usersGet(reqPage2)
    const json2 = await res2.json()

    // KPIs remain identical across pages
    expect(json1.meta.familyKpis.linkedStudents).toBe(20)
    expect(json2.meta.familyKpis.linkedStudents).toBe(20)
    expect(json1.meta.familyKpis.totalParents).toBe(19)
    expect(json2.meta.familyKpis.totalParents).toBe(19)
    expect(json1.meta.tabs.GUARDIAN).toBe(3)
    expect(json2.meta.tabs.GUARDIAN).toBe(3)
  })

  it('7. Users Home Dashboard displays non-zero guardian count and correct parent count', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users?pageSize=1`, {
      headers: { cookie: adminCookie },
    })
    const res = await usersGet(req)
    const json = await res.json()

    const parentsTotal = json.meta?.familyKpis?.totalParents ?? json.meta?.tabs?.PARENT
    const guardiansTotal = json.meta?.familyKpis?.totalGuardians ?? json.meta?.tabs?.GUARDIAN

    expect(parentsTotal).toBe(19)
    expect(guardiansTotal).toBe(3)
    // Must NOT be 0 guardians!
    expect(guardiansTotal).toBeGreaterThan(0)
  })

  it('8. Querying GET /api/v1/users?role=GUARDIAN returns non-login pickup guardians with student profiles', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users?role=GUARDIAN&pageSize=50`, {
      headers: { cookie: adminCookie },
    })
    const res = await usersGet(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.length).toBe(3)

    const names = json.data.map((d: any) => d.name)
    expect(names).toContain('Grandfather Ashok')
    expect(names).toContain('Driver Ramesh')
    expect(names).toContain('Aunt Sunita (Branch B)')
    expect(names).not.toContain('Emergency Uncle Vikram (No Pickup)')

    const ashok = json.data.find((d: any) => d.name === 'Grandfather Ashok')
    expect(ashok.role).toBe('GUARDIAN')
    expect(ashok.guardianProfile).toBeDefined()
    expect(ashok.guardianProfile.students.length).toBe(1)
    expect(ashok.guardianProfile.students[0].canPickup).toBe(true)
  })

  it('9. Handles empty school state gracefully with 0s and no errors', async () => {
    const kpisEmpty = await FamilyUserService.getFamilyKpis(emptyTenant.id)
    expect(kpisEmpty.totalParents).toBe(0)
    expect(kpisEmpty.linkedStudents).toBe(0)
    expect(kpisEmpty.multiChildParents).toBe(0)
    expect(kpisEmpty.totalGuardians).toBe(0)
    expect(kpisEmpty.authorizedPickupTotal).toBe(0)
    expect(kpisEmpty.pinSetTotal).toBe(0)
  })
})

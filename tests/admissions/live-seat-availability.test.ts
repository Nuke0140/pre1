import { describe, it, expect, beforeAll } from 'bun:test'
import {
  computeCapacityMetrics,
  aggregateProgramCapacity,
  CapacityService,
} from '@/lib/admissions/capacity-service'
import { db } from '@/lib/db'
import { GET as getCapacityApi } from '@/app/api/v1/admissions/capacity/route'
import { NextRequest } from 'next/server'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('Live Seat Availability & Urgency Badges', () => {
  let tenantA: string
  let tenantB: string
  let branchA: string
  let branchB: string
  let sessionA: string
  let sessionB: string
  let adminCookieA: string
  let adminCookieB: string

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant A
    const tA = await db.tenant.create({
      data: {
        name: `Seat School A ${ts}`,
        code: `SEAT_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    // 2. Create Tenant B
    const tB = await db.tenant.create({
      data: {
        name: `Seat School B ${ts}`,
        code: `SEAT_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 3. Branches
    const brA = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus A',
        code: `BR_A_${ts}`,
        isMain: true,
      },
    })
    branchA = brA.id

    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Main Campus B',
        code: `BR_B_${ts}`,
        isMain: true,
      },
    })
    branchB = brB.id

    // 4. Academic Sessions
    const sessA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })
    sessionA = sessA.id

    const sessB = await db.academicSession.create({
      data: {
        tenantId: tenantB,
        name: `2026-2027 B ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })
    sessionB = sessB.id

    // 5. Admin Users & Session tokens
    const userA = await db.user.create({
      data: {
        email: `admin_seat_a_${ts}@preone.local`,
        fullName: 'Principal A',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: userA.id,
        role: 'OWNER',
        roles: ['OWNER'],
        branchId: branchA,
      },
    })
    const tokenA = await signSession({
      uid: userA.id,
      tenantId: tenantA,
      role: 'OWNER',
      roles: ['OWNER'],
      email: userA.email,
      branchId: branchA,
    })
    adminCookieA = `${SESSION_COOKIE}=${tokenA}`

    const userB = await db.user.create({
      data: {
        email: `admin_seat_b_${ts}@preone.local`,
        fullName: 'Principal B',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB,
        userId: userB.id,
        role: 'OWNER',
        roles: ['OWNER'],
        branchId: branchB,
      },
    })
    const tokenB = await signSession({
      uid: userB.id,
      tenantId: tenantB,
      role: 'OWNER',
      roles: ['OWNER'],
      email: userB.email,
      branchId: branchB,
    })
    adminCookieB = `${SESSION_COOKIE}=${tokenB}`
  })

  // =========================================================================
  // 1. PURE CALCULATION & THRESHOLD DETERMINATION
  // =========================================================================
  describe('computeCapacityMetrics', () => {
    it('determines AVAILABLE status when remaining seats exceed limitedThreshold (> 3)', () => {
      const metrics = computeCapacityMetrics({
        classroomId: 'c-1',
        classroomName: 'Nursery A',
        branchId: 'b-1',
        capacity: 20,
        enrolledCount: 12, // 8 seats left
      })

      expect(metrics.status).toBe('AVAILABLE')
      expect(metrics.availableSeats).toBe(8)
      expect(metrics.totalOccupied).toBe(12)
      expect(metrics.statusLabel).toBe('8 seats left')
      expect(metrics.occupancySummary).toBe('12/20 occupied')
      expect(metrics.canEnroll).toBe(true)
    })

    it('determines LIMITED urgency status when remaining seats are 3 or fewer (1..3)', () => {
      const metrics3 = computeCapacityMetrics({
        classroomId: 'c-2',
        classroomName: 'Playgroup Morning',
        branchId: 'b-1',
        capacity: 20,
        enrolledCount: 17, // 3 seats left
      })

      expect(metrics3.status).toBe('LIMITED')
      expect(metrics3.availableSeats).toBe(3)
      expect(metrics3.statusLabel).toBe('3 seats left')
      expect(metrics3.occupancySummary).toBe('17/20 occupied')
      expect(metrics3.canEnroll).toBe(true)

      const metrics1 = computeCapacityMetrics({
        classroomId: 'c-3',
        classroomName: 'Playgroup Afternoon',
        branchId: 'b-1',
        capacity: 20,
        enrolledCount: 19, // 1 seat left
      })

      expect(metrics1.status).toBe('LIMITED')
      expect(metrics1.availableSeats).toBe(1)
      expect(metrics1.statusLabel).toBe('1 seat left')
      expect(metrics1.occupancySummary).toBe('19/20 occupied')
      expect(metrics1.canEnroll).toBe(true)
    })

    it('determines WAITLIST_ONLY status when classroom is at capacity (0 available seats and waitlist enabled)', () => {
      const metrics = computeCapacityMetrics({
        classroomId: 'c-4',
        classroomName: 'Daycare Infant',
        branchId: 'b-1',
        capacity: 15,
        enrolledCount: 15, // 0 seats left
        options: { enableWaitlistWhenFull: true },
      })

      expect(metrics.status).toBe('WAITLIST_ONLY')
      expect(metrics.availableSeats).toBe(0)
      expect(metrics.statusLabel).toBe('Full · Waitlist only')
      expect(metrics.occupancySummary).toBe('15/15 occupied')
      expect(metrics.canEnroll).toBe(false)
      expect(metrics.isWaitlistEligible).toBe(true)
    })

    it('determines FULL status when classroom is at capacity and waitlist is disabled', () => {
      const metrics = computeCapacityMetrics({
        classroomId: 'c-5',
        classroomName: 'Daycare Toddler',
        branchId: 'b-1',
        capacity: 10,
        enrolledCount: 10,
        options: { enableWaitlistWhenFull: false },
      })

      expect(metrics.status).toBe('FULL')
      expect(metrics.availableSeats).toBe(0)
      expect(metrics.statusLabel).toBe('Full')
      expect(metrics.canEnroll).toBe(false)
    })

    it('accounts for pending reservations in totalOccupied and availableSeats', () => {
      const metrics = computeCapacityMetrics({
        classroomId: 'c-6',
        classroomName: 'Kindergarten K1',
        branchId: 'b-1',
        capacity: 25,
        enrolledCount: 20,
        pendingCount: 3, // 20 + 3 = 23 occupied => 2 seats left
      })

      expect(metrics.totalOccupied).toBe(23)
      expect(metrics.availableSeats).toBe(2)
      expect(metrics.status).toBe('LIMITED')
      expect(metrics.statusLabel).toBe('2 seats left')
      expect(metrics.occupancySummary).toBe('23/25 occupied')
    })

    it('returns UNCONFIGURED status when capacity is zero or invalid', () => {
      const metrics = computeCapacityMetrics({
        classroomId: 'c-7',
        classroomName: 'Unconfigured Room',
        branchId: 'b-1',
        capacity: 0,
        enrolledCount: 0,
      })

      expect(metrics.status).toBe('UNCONFIGURED')
      expect(metrics.statusLabel).toBe('Capacity not set')
      expect(metrics.canEnroll).toBe(false)
    })
  })

  // =========================================================================
  // 2. PROGRAM-LEVEL AGGREGATION
  // =========================================================================
  describe('aggregateProgramCapacity', () => {
    it('aggregates multiple classroom sections correctly for a program', () => {
      const sectionA = computeCapacityMetrics({
        classroomId: 'c-a',
        classroomName: 'Nursery A',
        programType: 'NURSERY',
        branchId: 'b-1',
        capacity: 20,
        enrolledCount: 17, // 3 seats left
      })
      const sectionB = computeCapacityMetrics({
        classroomId: 'c-b',
        classroomName: 'Nursery B',
        programType: 'NURSERY',
        branchId: 'b-1',
        capacity: 20,
        enrolledCount: 15, // 5 seats left
      })

      const programSummary = aggregateProgramCapacity('NURSERY', 'Nursery Program', [
        sectionA,
        sectionB,
      ])

      expect(programSummary.totalCapacity).toBe(40)
      expect(programSummary.totalOccupied).toBe(32)
      expect(programSummary.totalAvailableSeats).toBe(8)
      expect(programSummary.sectionCount).toBe(2)
      expect(programSummary.status).toBe('AVAILABLE')
      expect(programSummary.statusLabel).toBe('8 seats left')
      expect(programSummary.occupancySummary).toBe('32/40 occupied')
    })

    it('reports WAITLIST_ONLY when all sections of a program are full', () => {
      const sectionA = computeCapacityMetrics({
        classroomId: 'c-a',
        classroomName: 'Playgroup A',
        programType: 'PLAYGROUP',
        branchId: 'b-1',
        capacity: 15,
        enrolledCount: 15,
      })
      const sectionB = computeCapacityMetrics({
        classroomId: 'c-b',
        classroomName: 'Playgroup B',
        programType: 'PLAYGROUP',
        branchId: 'b-1',
        capacity: 15,
        enrolledCount: 15,
      })

      const summary = aggregateProgramCapacity('PLAYGROUP', 'Playgroup', [sectionA, sectionB])

      expect(summary.totalCapacity).toBe(30)
      expect(summary.totalAvailableSeats).toBe(0)
      expect(summary.status).toBe('WAITLIST_ONLY')
      expect(summary.statusLabel).toBe('Full · Waitlist only')
      expect(summary.occupancySummary).toBe('30/30 occupied')
    })
  })

  // =========================================================================
  // 3. DATABASE CONCURRENCY GUARD & AUTHORITATIVE QUERIES
  // =========================================================================
  describe('CapacityService Database Guard', () => {
    it('assertClassroomCapacity throws CLASSROOM_FULL when active students reach capacity', async () => {
      const classroom = await db.classroom.create({
        data: {
          id: `room-cap-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Micro Section',
          code: `MS-${Date.now()}`,
          programType: 'PLAYGROUP',
          capacity: 2,
        },
      })

      // Add 2 active students
      await db.student.createMany({
        data: [
          {
            tenantId: tenantA,
            branchId: branchA,
            admissionNo: `ADM-${Date.now()}-1`,
            firstName: 'Student',
            lastName: 'One',
            gender: 'MALE',
            dob: new Date('2022-01-01'),
            currentClassroomId: classroom.id,
            status: 'ACTIVE',
          },
          {
            tenantId: tenantA,
            branchId: branchA,
            admissionNo: `ADM-${Date.now()}-2`,
            firstName: 'Student',
            lastName: 'Two',
            gender: 'FEMALE',
            dob: new Date('2022-01-01'),
            currentClassroomId: classroom.id,
            status: 'ACTIVE',
          },
        ],
      })

      // In transaction: assertClassroomCapacity must reject placement
      await expect(
        db.$transaction(async (tx) => {
          return CapacityService.assertClassroomCapacity(tx, {
            tenantId: tenantA,
            classroomId: classroom.id,
          })
        })
      ).rejects.toThrow('reached maximum capacity')
    })

    it('assertClassroomCapacity succeeds when classroom has available seats', async () => {
      const classroom = await db.classroom.create({
        data: {
          id: `room-open-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Open Section',
          code: `OS-${Date.now()}`,
          programType: 'NURSERY',
          capacity: 20,
        },
      })

      const result = await db.$transaction(async (tx) => {
        return CapacityService.assertClassroomCapacity(tx, {
          tenantId: tenantA,
          classroomId: classroom.id,
        })
      })

      expect(result.classroom.id).toBe(classroom.id)
      expect(result.activeCount).toBe(0)
    })

    it('ignores inactive, withdrawn, or soft-deleted students in capacity calculation', async () => {
      const classroom = await db.classroom.create({
        data: {
          id: `room-filter-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Filter Section',
          code: `FS-${Date.now()}`,
          programType: 'NURSERY',
          capacity: 10,
        },
      })

      // Create 1 active student and 2 inactive/deleted students
      await db.student.createMany({
        data: [
          {
            tenantId: tenantA,
            branchId: branchA,
            admissionNo: `ADM-ACT-${Date.now()}`,
            firstName: 'Active',
            lastName: 'Child',
            gender: 'FEMALE',
            dob: new Date('2022-01-01'),
            currentClassroomId: classroom.id,
            status: 'ACTIVE',
          },
          {
            tenantId: tenantA,
            branchId: branchA,
            admissionNo: `ADM-INACT-${Date.now()}`,
            firstName: 'Inactive',
            lastName: 'Child',
            gender: 'MALE',
            dob: new Date('2022-01-01'),
            currentClassroomId: classroom.id,
            status: 'INACTIVE',
          },
          {
            tenantId: tenantA,
            branchId: branchA,
            admissionNo: `ADM-DEL-${Date.now()}`,
            firstName: 'Deleted',
            lastName: 'Child',
            gender: 'MALE',
            dob: new Date('2022-01-01'),
            currentClassroomId: classroom.id,
            status: 'ACTIVE',
            deletedAt: new Date(),
          },
        ],
      })

      const metrics = await CapacityService.getClassroomCapacity(tenantA, classroom.id)

      expect(metrics).not.toBeNull()
      expect(metrics?.enrolledCount).toBe(1) // Only active non-deleted student!
      expect(metrics?.availableSeats).toBe(9) // 10 - 1 = 9
      expect(metrics?.status).toBe('AVAILABLE')
    })
  })

  // =========================================================================
  // 4. API ENDPOINT (GET /api/v1/admissions/capacity)
  // =========================================================================
  describe('GET /api/v1/admissions/capacity API', () => {
    it('returns structured capacity metrics scoped to authorized branch and tenant', async () => {
      await db.classroom.create({
        data: {
          id: `room-api-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Sunflowers Room',
          code: `SUN-${Date.now()}`,
          programType: 'PLAYGROUP',
          capacity: 15,
        },
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/admissions/capacity?branchId=${branchA}`, {
        headers: {
          Cookie: adminCookieA,
        },
      })

      const res = await getCapacityApi(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data.classrooms)).toBe(true)
      expect(json.data.classrooms.length).toBeGreaterThanOrEqual(1)

      const cls = json.data.classrooms.find((c: any) => c.name === 'Sunflowers Room')
      expect(cls).toBeDefined()
      expect(cls.capacity).toBe(15)
      expect(cls.availableSeats).toBe(15)
      expect(cls.status).toBe('AVAILABLE')
      expect(cls.statusLabel).toBe('15 seats left')

      expect(Array.isArray(json.data.programs)).toBe(true)
      const prog = json.data.programs.find((p: any) => p.programType === 'PLAYGROUP')
      expect(prog).toBeDefined()
      expect(prog.totalCapacity).toBeGreaterThanOrEqual(15)
      expect(prog.sectionCount).toBeGreaterThanOrEqual(1)
    })

    it('returns single classroom capacity when classroomId parameter is specified', async () => {
      const room = await db.classroom.create({
        data: {
          id: `room-single-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Bluebells Room',
          code: `BLU-${Date.now()}`,
          programType: 'NURSERY',
          capacity: 18,
        },
      })

      const req = new NextRequest(
        `http://localhost:3000/api/v1/admissions/capacity?classroomId=${room.id}`,
        {
          headers: {
            Cookie: adminCookieA,
          },
        }
      )

      const res = await getCapacityApi(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.classroom).toBeDefined()
      expect(json.data.classroom.id).toBe(room.id)
      expect(json.data.classroom.name).toBe('Bluebells Room')
      expect(json.data.classroom.capacity).toBe(18)
    })

    it('enforces multi-tenant isolation so Tenant B cannot view Tenant A classroom capacity', async () => {
      const roomA = await db.classroom.create({
        data: {
          id: `room-a-${Date.now()}`,
          tenantId: tenantA,
          branchId: branchA,
          academicSessionId: sessionA,
          name: 'Private Section A',
          code: `PRIV_A_${Date.now()}`,
          programType: 'NURSERY',
          capacity: 20,
        },
      })

      // Request from Tenant B session for Tenant A's classroom
      const req = new NextRequest(
        `http://localhost:3000/api/v1/admissions/capacity?classroomId=${roomA.id}`,
        {
          headers: {
            Cookie: adminCookieB,
          },
        }
      )

      const res = await getCapacityApi(req)
      // Should not find or disclose Tenant A's classroom to Tenant B
      expect(res.status).toBe(404)
    })
  })
})

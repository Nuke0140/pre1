import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as activityGet } from '@/app/api/v1/users/[id]/activity/route'
import { GET as timelineGet } from '@/app/api/v1/users/[id]/security-timeline/route'
import { recordAudit } from '@/lib/audit'

describe('Per-User Activity Trail Read Model (Doc N-6)', () => {
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let teacherA: any
  let staffTargetA: any
  let memberTargetA: any
  let cookieOwnerA: string
  let cookieTeacherA: string
  let cookieTenantB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        name: `Activity Trail School A ${ts}`,
        code: `ACT-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Tenant B
    tenantB = await db.tenant.create({
      data: {
        name: `Activity Trail School B ${ts}`,
        code: `ACB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 3. Setup Owner A
    ownerA = await db.user.create({
      data: {
        email: `owner_${ts}@activitytrail.com`,
        username: `owner_${ts}`,
        fullName: 'Activity Owner A',
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

    // 4. Setup Teacher A (unprivileged)
    teacherA = await db.user.create({
      data: {
        email: `teacher_${ts}@activitytrail.com`,
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

    // 5. Setup Tenant B Admin
    const adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@activitytrail.com`,
        username: `adminB_${ts}`,
        fullName: 'Admin B',
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

    // 6. Setup Staff Target in Tenant A
    staffTargetA = await db.user.create({
      data: {
        email: `staffTarget_${ts}@activitytrail.com`,
        username: `staffTarget_${ts}`,
        fullName: 'Vikram Malhotra',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    memberTargetA = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: staffTargetA.id,
        role: 'COORDINATOR',
        status: 'ACTIVE',
      },
    })

    // 7. Seed specific audit records
    // Event 1: TARGET event (Admin resets staff's password)
    await recordAudit({
      tenantId: tenantA.id,
      actorId: ownerA.id,
      actorName: ownerA.fullName,
      actorRole: 'OWNER',
      action: 'ADMIN_PASSWORD_RESET',
      entity: 'User',
      entityId: staffTargetA.id,
      module: 'USERS',
      severity: 'WARNING',
      summary: `Admin reset temporary password for ${staffTargetA.fullName}`,
      oldValues: { mustChangePassword: false },
      newValues: { mustChangePassword: true },
    })

    // Event 2: TARGET event (Admin suspends staff's account)
    await recordAudit({
      tenantId: tenantA.id,
      actorId: ownerA.id,
      actorName: ownerA.fullName,
      actorRole: 'OWNER',
      action: 'USER_SUSPENDED',
      entity: 'User',
      entityId: staffTargetA.id,
      module: 'USERS',
      severity: 'WARNING',
      summary: `Suspended account access for ${staffTargetA.fullName}`,
      oldValues: { status: 'ACTIVE' },
      newValues: { status: 'SUSPENDED' },
    })

    // Event 3: ACTOR event (Staff member approved a classroom observation)
    await recordAudit({
      tenantId: tenantA.id,
      actorId: staffTargetA.id,
      actorName: staffTargetA.fullName,
      actorRole: 'COORDINATOR',
      action: 'OBSERVATION_APPROVED',
      entity: 'Observation',
      entityId: `obs_${ts}`,
      module: 'ACADEMIC',
      severity: 'INFO',
      summary: `${staffTargetA.fullName} approved classroom milestone observation`,
      newValues: { status: 'APPROVED' },
    })

    // Event 4: ACTOR event (Staff member updated attendance record)
    await recordAudit({
      tenantId: tenantA.id,
      actorId: staffTargetA.id,
      actorName: staffTargetA.fullName,
      actorRole: 'COORDINATOR',
      action: 'ATTENDANCE_OVERRIDE',
      entity: 'Attendance',
      entityId: `att_${ts}`,
      module: 'OPERATIONS',
      severity: 'INFO',
      summary: `${staffTargetA.fullName} submitted attendance correction`,
      newValues: { status: 'PRESENT' },
    })
  })

  // ──────────────────────────────────────────────────────────
  // 1. MULTI-ID RESOLUTION & PERSPECTIVE TRAIL
  // ──────────────────────────────────────────────────────────
  it('1. GET /api/v1/users/[id]/activity resolves all events using User.id', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data || json
    expect(data.userId).toBe(staffTargetA.id)
    expect(data.items.length).toBeGreaterThanOrEqual(4)
    expect(data.counts.asTarget).toBe(2)
    expect(data.counts.asActor).toBe(2)
  })

  it('2. GET /api/v1/users/[id]/activity resolves all events using TenantUser.id alias', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${memberTargetA.id}/activity`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: memberTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    const data = json.data || json
    expect(data.tenantUserId).toBe(memberTargetA.id)
    expect(data.items.length).toBeGreaterThanOrEqual(4)
  })

  it('3. GET /api/v1/users/[id]/activity with perspective: TARGET returns only events affecting the user', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity?perspective=TARGET`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.items.length).toBe(2)
    for (const item of data.items) {
      expect(['TARGET', 'BOTH']).toContain(item.perspective)
      expect(['ADMIN_PASSWORD_RESET', 'USER_SUSPENDED']).toContain(item.action)
    }
  })

  it('4. GET /api/v1/users/[id]/activity with perspective: ACTOR returns only events performed by the user', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity?perspective=ACTOR`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.items.length).toBe(2)
    for (const item of data.items) {
      expect(['ACTOR', 'BOTH']).toContain(item.perspective)
      expect(['OBSERVATION_APPROVED', 'ATTENDANCE_OVERRIDE']).toContain(item.action)
    }
  })

  // ──────────────────────────────────────────────────────────
  // 2. SEARCH & SEVERITY FILTERING
  // ──────────────────────────────────────────────────────────
  it('5. Filters activity trail by search keyword', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity?search=observation`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.items.length).toBe(1)
    expect(data.items[0].action).toBe('OBSERVATION_APPROVED')
  })

  it('6. Filters activity trail by severity level', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity?severity=WARNING`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.items.length).toBe(2)
    for (const item of data.items) {
      expect(item.severity).toBe('WARNING')
    }
  })

  // ──────────────────────────────────────────────────────────
  // 3. PAGINATION & SECURITY TIMELINE BACKWARD PARITY
  // ──────────────────────────────────────────────────────────
  it('7. Handles pagination limits properly', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity?limit=2&page=1`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.items.length).toBe(2)
    expect(data.pagination.limit).toBe(2)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('8. GET /api/v1/users/[id]/security-timeline maintains backward compatibility', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/security-timeline`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieOwnerA}`,
      },
    })

    const res = await timelineGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json.data || json

    expect(data.userId).toBe(staffTargetA.id)
    expect(data.timeline.length).toBeGreaterThanOrEqual(4)
  })

  // ──────────────────────────────────────────────────────────
  // 4. RBAC & TENANT BOUNDARY CHECKS
  // ──────────────────────────────────────────────────────────
  it('9. Unprivileged user lacking users:read is rejected with 401/403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieTeacherA}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect([401, 403]).toContain(res.status)
  })

  it('10. Cross-tenant user activity lookup is blocked with 404', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTargetA.id}/activity`, {
      method: 'GET',
      headers: {
        cookie: `preone_session=${cookieTenantB}`,
      },
    })

    const res = await activityGet(req, { params: Promise.resolve({ id: staffTargetA.id }) })
    expect(res.status).toBe(404)
  })
})

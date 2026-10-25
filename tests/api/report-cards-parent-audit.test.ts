import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { GET as getReportCards } from '@/app/api/v1/academics/report-cards/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { db } from '@/lib/db'

describe('Academics Report Cards Parent Path Audit (G-04)', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let branch: any
  let parentUser: any
  let sessionToken: string

  beforeAll(async () => {
    testTenant = await db.tenant.create({
      data: {
        code: `RC-TEST-${ts.slice(-6)}`,
        name: `Report Cards Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: testTenant.id,
        name: 'Main Campus',
        code: `BR-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    parentUser = await db.user.create({
      data: {
        email: `parent.${ts}@example.com`,
        username: `parent_${ts}`,
        fullName: 'Parent Test User',
        passwordHash: 'dummyHashForParentAudit',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: testTenant.id,
        userId: parentUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })

    sessionToken = await signSession({
      uid: parentUser.id,
      email: parentUser.email,
      name: parentUser.fullName,
      tenantId: testTenant.id,
      branchId: branch.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })
  })

  it('G-04: PARENT querying report cards executes successfully without crashing on db.guardianStudent', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/academics/report-cards', {
      headers: {
        cookie: `${SESSION_COOKIE}=${sessionToken}`,
      },
    })

    const res = await getReportCards(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.reportCards).toBeDefined()
    expect(Array.isArray(json.data.reportCards)).toBe(true)
    expect(json.data.total).toBe(0)
  })
})

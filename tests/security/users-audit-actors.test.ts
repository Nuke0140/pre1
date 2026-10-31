import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as updateCustomFields } from '@/app/api/v1/users/custom-fields/route'

describe('P1-01: Session Audit Actors Verification', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let adminUser: any
  let adminToken: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `ACT-${ts.slice(-6)}`,
        name: `Audit Actor School ${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `B-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `actor.admin.${ts}@preone.test`,
        fullName: 'Audit Actor SuperAdmin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'OWNER',
            roles: ['OWNER'],
            branchId: branch.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    adminToken = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })
  })

  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { tenantId: tenant.id } })
    await db.schoolConfig.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
    await db.user.deleteMany({ where: { id: adminUser.id } })
    await db.branch.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenant.deleteMany({ where: { id: tenant.id } })
  })

  it('custom-fields POST records audit log with correct actorId (session.uid) and actorName (session.name)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users/custom-fields', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        action: 'REPLACE_ALL',
        fields: [
          {
            id: 'cf_test',
            name: 'Blood Group Verified',
            key: 'blood_group_verified',
            type: 'TEXT',
            appliesTo: 'FAMILY',
            required: false,
          },
        ],
      }),
    })

    const res = await updateCustomFields(req)
    expect(res.status).toBe(200)

    // Verify audit log has correct actorId and actorName (not undefined or 'Admin' fallback)
    const auditRecord = await db.auditLog.findFirst({
      where: {
        tenantId: tenant.id,
        action: 'CUSTOM_FIELDS_UPDATED',
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(auditRecord).toBeDefined()
    expect(auditRecord?.actorId).toBe(adminUser.id)
    expect(auditRecord?.actorName).toBe('Audit Actor SuperAdmin')
  })
})

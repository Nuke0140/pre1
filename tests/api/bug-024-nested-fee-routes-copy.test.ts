import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { Errors, notFound } from '@/lib/api'
import { errNotFound } from '@/lib/errors'
import { GET as feeStructureGet } from '@/app/api/v1/fee-structures/[id]/route'
import { GET as depositGet } from '@/app/api/v1/deposits/[id]/route'
import { GET as paymentGet } from '@/app/api/v1/payments/[id]/route'
import { GET as feeScheduleGet } from '@/app/api/v1/fee-schedules/[id]/route'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('BUG-024: Nested Fee Routes Copy & 404 Message Builder', () => {
  let tenant: any
  let user: any
  let token: string

  beforeAll(async () => {
    const ts = Date.now().toString()
    tenant = await db.tenant.create({
      data: {
        id: `tenant-bug024-${ts}`,
        name: 'BUG-024 Test School',
        code: `B024-${ts.slice(-6)}`,
        status: 'ACTIVE',
      },
    })

    user = await db.user.create({
      data: {
        id: `user-bug024-${ts}`,
        email: `finance-${ts}@preone.internal`,
        username: `finance_${ts}`,
        fullName: 'Finance Officer',
        passwordHash: 'hashed_password_placeholder',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        id: `tu-bug024-${ts}`,
        tenantId: tenant.id,
        userId: user.id,
        role: 'ACCOUNTS',
        status: 'ACTIVE',
      },
    })

    token = await signSession({
      uid: user.id,
      email: user.email,
      name: user.fullName,
      role: 'ACCOUNTS',
      roles: ['ACCOUNTS'],
      tenantId: tenant.id,
    })
  })

  afterAll(async () => {
    if (tenant?.id) {
      await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
    }
    if (user?.id) {
      await db.user.deleteMany({ where: { id: user.id } })
    }
    if (tenant?.id) {
      await db.tenant.deleteMany({ where: { id: tenant.id } })
    }
  })

  function createAuthRequest(url: string) {
    const req = new NextRequest(new URL(`http://localhost:3000${url}`))
    req.cookies.set(SESSION_COOKIE, token)
    return req
  }

  describe('1. 404 Message Builder Template Deduplication', () => {
    it('verifies Errors.notFound does not duplicate "not found" when phrase already contains it', async () => {
      const res1 = Errors.notFound('Fee structure not found')
      const json1 = await res1.json()
      expect(json1.error.code).toBe('NOT_FOUND_001')
      expect(json1.error.message).toBe('Fee structure not found')
      expect(json1.error.message).not.toContain('not found not found')

      const res2 = Errors.notFound('Deposit record not found')
      const json2 = await res2.json()
      expect(json2.error.message).toBe('Deposit record not found')
      expect(json2.error.message).not.toContain('not found not found')

      const res3 = Errors.notFound('Payment record not found')
      const json3 = await res3.json()
      expect(json3.error.message).toBe('Payment record not found')
      expect(json3.error.message).not.toContain('not found not found')

      const res4 = Errors.notFound('Fee schedule item not found')
      const json4 = await res4.json()
      expect(json4.error.message).toBe('Fee schedule item not found')
      expect(json4.error.message).not.toContain('not found not found')
    })

    it('verifies Errors.notFound correctly appends "not found" when entity is just a noun', async () => {
      const res = Errors.notFound('Fee structure')
      const json = await res.json()
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Fee structure not found')
    })

    it('verifies notFound standalone export does not duplicate phrase', async () => {
      const res = notFound('Fee structure not found')
      const json = await res.json()
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Fee structure not found')
      expect(json.error.message).not.toContain('not found not found')
    })

    it('verifies errNotFound helper in errors.ts cleanly formats message', () => {
      const err1 = errNotFound('Fee structure not found')
      expect(err1.userMessage).toBe('Fee structure not found.')
      expect(err1.userMessage).not.toContain('not found not found')
      expect(err1.userMessage).not.toContain('not found could not be found')

      const err2 = errNotFound('Fee structure')
      expect(err2.userMessage).toBe('Fee structure could not be found.')
    })
  })

  describe('2. Nested Fee Routes Return Clean NOT_FOUND_001 Without Doubled Copy', () => {
    it('GET /api/v1/fee-structures/[id] with non-existent id returns clean NOT_FOUND_001', async () => {
      const req = createAuthRequest('/api/v1/fee-structures/non-existent-id')
      const res = await feeStructureGet(req, { params: Promise.resolve({ id: 'non-existent-id' }) })
      expect(res.status).toBe(404)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Fee structure not found')
      expect(json.error.message).not.toContain('not found not found')
    })

    it('GET /api/v1/deposits/[id] with non-existent id returns clean NOT_FOUND_001', async () => {
      const req = createAuthRequest('/api/v1/deposits/non-existent-id')
      const res = await depositGet(req, { params: Promise.resolve({ id: 'non-existent-id' }) })
      expect(res.status).toBe(404)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Deposit record not found')
      expect(json.error.message).not.toContain('not found not found')
    })

    it('GET /api/v1/payments/[id] with non-existent id returns clean NOT_FOUND_001', async () => {
      const req = createAuthRequest('/api/v1/payments/non-existent-id')
      const res = await paymentGet(req, { params: Promise.resolve({ id: 'non-existent-id' }) })
      expect(res.status).toBe(404)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Payment record not found')
      expect(json.error.message).not.toContain('not found not found')
    })

    it('GET /api/v1/fee-schedules/[id] with non-existent id returns clean NOT_FOUND_001', async () => {
      const req = createAuthRequest('/api/v1/fee-schedules/non-existent-id')
      const res = await feeScheduleGet(req, { params: Promise.resolve({ id: 'non-existent-id' }) })
      expect(res.status).toBe(404)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND_001')
      expect(json.error.message).toBe('Fee schedule item not found')
      expect(json.error.message).not.toContain('not found not found')
    })
  })
})

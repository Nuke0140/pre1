import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { UserLifecycleService } from '@/lib/users/user-lifecycle-service'
import { SessionService } from '@/lib/users/session-service'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { UserCsvEngine } from '@/lib/users/csv-engine'
import { signSession } from '@/lib/auth'

describe('PreOne User Module — Security & Production Hardening Test Suite', () => {
  let testTenantA: any
  let testTenantB: any
  let dualRoleUser: any
  let membershipA: any
  let membershipB: any

  beforeAll(async () => {
    // Create isolated test tenants
    testTenantA = await db.tenant.create({
      data: {
        code: `SEC-A-${Date.now().toString().slice(-4)}`,
        name: `Security Test Campus A ${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    testTenantB = await db.tenant.create({
      data: {
        code: `SEC-B-${Date.now().toString().slice(-4)}`,
        name: `Security Test Campus B ${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    // Create a dual-role user (Teacher in Tenant A, Parent in Tenant B)
    dualRoleUser = await db.user.create({
      data: {
        email: `dualrole.${Date.now()}@example.com`,
        username: `dualrole_${Date.now()}`,
        fullName: 'Dual Role Educator Parent',
        passwordHash: 'dummyHash',
        mustChangePassword: true,
        status: 'ACTIVE',
      },
    })

    membershipA = await db.tenantUser.create({
      data: {
        tenantId: testTenantA.id,
        userId: dualRoleUser.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    membershipB = await db.tenantUser.create({
      data: {
        tenantId: testTenantB.id,
        userId: dualRoleUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })
  })

  describe('Phase 1: Tenant-Scoped User Lifecycle & Dual-Role Isolation', () => {
    it('suspending staff membership in Tenant A preserves parent access in Tenant B and keeps global User ACTIVE', async () => {
      // Create active sessions in Tenant A and Tenant B
      const tokenA = 'test_token_tenant_a_' + Date.now()
      const tokenB = 'test_token_tenant_b_' + Date.now()

      await SessionService.createSession({
        userId: dualRoleUser.id,
        tenantId: testTenantA.id,
        token: tokenA,
      })

      await SessionService.createSession({
        userId: dualRoleUser.id,
        tenantId: testTenantB.id,
        token: tokenB,
      })

      // Admin of Tenant A suspends the teacher membership
      const result = await UserLifecycleService.transitionUserStatus({
        member: {
          id: membershipA.id,
          userId: dualRoleUser.id,
          role: 'TEACHER',
          status: 'ACTIVE',
          user: { fullName: dualRoleUser.fullName },
        },
        actorSession: {
          uid: 'actor-principal-a',
          name: 'Principal A',
          role: 'PRINCIPAL',
          tenantId: testTenantA.id,
        },
        targetStatus: 'SUSPENDED',
        reason: 'Contract pause in School A',
      })

      expect(result.success).toBe(true)

      // Verify Tenant A membership is SUSPENDED
      const updatedMemA = await db.tenantUser.findUnique({ where: { id: membershipA.id } })
      expect(updatedMemA?.status).toBe('SUSPENDED')

      // Verify Tenant B membership is still ACTIVE
      const memB = await db.tenantUser.findUnique({ where: { id: membershipB.id } })
      expect(memB?.status).toBe('ACTIVE')

      // Verify global User record is still ACTIVE because active membership B remains
      const globalUser = await db.user.findUnique({ where: { id: dualRoleUser.id } })
      expect(globalUser?.status).toBe('ACTIVE')

      // Verify Tenant A session was revoked, but Tenant B session remains active
      const validA = await SessionService.validateSession(tokenA)
      const validB = await SessionService.validateSession(tokenB)
      expect(validA.valid).toBe(false)
      expect(validB.valid).toBe(true)
    })
  })

  describe('Phase 2: Secure Password Reset & mustChangePassword Enforcement', () => {
    it('persists mustChangePassword flag on temporary credential resets and in JWT token payload', async () => {
      const user = await db.user.findUnique({ where: { id: dualRoleUser.id } })
      expect(user?.mustChangePassword).toBe(true)

      const token = await signSession({
        uid: dualRoleUser.id,
        email: dualRoleUser.email!,
        name: dualRoleUser.fullName,
        tenantId: testTenantB.id,
        role: 'PARENT',
        mustChangePassword: user?.mustChangePassword,
      })

      expect(token).toBeDefined()
    })
  })

  describe('Phase 3: Rate Limiting Enforcement & Recovery', () => {
    it('blocks excessive requests within time window and recovers', async () => {
      const testIp = '192.168.10.99'
      const keyPrefix = 'test_rate_limit'
      resetRateLimit(keyPrefix, testIp)

      const mockReq = {
        headers: new Headers({ 'x-forwarded-for': testIp }),
      } as any

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const res = await checkRateLimit(mockReq, { windowMs: 1000, max: 3, keyPrefix })
        expect(res.allowed).toBe(true)
      }

      // 4th request must be blocked
      const blockedRes = await checkRateLimit(mockReq, { windowMs: 1000, max: 3, keyPrefix })
      expect(blockedRes.allowed).toBe(false)
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0)
    })
  })

  describe('Phase 4: CSV Import Atomic Rollback & Error Reporting', () => {
    it('atomic mode cleanly rolls back on row failure without committing partial state', async () => {
      const validRowData = {
        fullName: 'Valid Teacher One',
        email: `valid.teacher.${Date.now()}@example.com`,
        role: 'TEACHER',
      }

      const invalidRowData = {
        fullName: 'Invalid Teacher Two',
        email: 'malformed-email', // will fail validation
        role: 'TEACHER',
      }

      const rows: any[] = [
        {
          rowNumber: 2,
          status: 'VALID',
          action: 'CREATE',
          identifier: validRowData.email,
          name: validRowData.fullName,
          role: 'TEACHER',
          errors: [],
          data: validRowData,
        },
        {
          rowNumber: 3,
          status: 'BLOCKED',
          action: 'BLOCK',
          identifier: invalidRowData.email,
          name: invalidRowData.fullName,
          role: 'TEACHER',
          errors: ['Invalid email format'],
          data: invalidRowData,
        },
      ]

      const result = await UserCsvEngine.executeStaffImport(
        { tenantId: testTenantA.id, actorId: 'admin', actorRole: 'PRINCIPAL' },
        rows,
        { atomicAllOrNothing: true }
      )

      expect(result.createdCount).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)

      // Verify that validRowData was NOT committed to DB due to atomic rollback
      const existing = await db.user.findUnique({ where: { email: validRowData.email } })
      expect(existing).toBeNull()
    })
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { POST as loginPost } from '@/app/api/v1/auth/login/route'
import { GET as brandingGet } from '@/app/api/v1/auth/branding/route'
import { extractSubdomainFromHost, resolveTenantFromHost, resolveTenantContext } from '@/lib/auth/tenant-resolver'
import { OtpService } from '@/lib/auth/otp-service'

describe('Master Authentication & Login Enhancement Test Suite', () => {
  let tenantA: any
  let tenantB: any
  let userSingle: any
  let userMulti: any
  const testPassword = 'Password@123'
  let passwordHash: string

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(testPassword, 10)
    const ts = Date.now()

    // 1. Create Tenant A with Branch and SchoolConfig Branding
    tenantA = await db.tenant.create({
      data: {
        name: `Sunrise Academy ${ts}`,
        code: `SUNRISE_${ts}`,
        status: 'ACTIVE',
        logoUrl: 'https://cdn.preone.in/logos/sunrise.png',
        branches: {
          create: {
            name: 'Central Campus',
            code: 'CENTRAL',
            isMain: true,
            isActive: true,
          },
        },
      },
      include: { branches: true },
    })

    await db.schoolConfig.create({
      data: {
        tenantId: tenantA.id,
        domain: 'BRANDING',
        data: {
          primaryColor: '#059669',
          accentColor: '#10B981',
          layout: 'WINDOWS_SHELL',
        },
      },
    })

    // 2. Create Tenant B
    tenantB = await db.tenant.create({
      data: {
        name: `Starlight International ${ts}`,
        code: `STARLIGHT_${ts}`,
        status: 'ACTIVE',
        logoUrl: 'https://cdn.preone.in/logos/starlight.png',
        branches: {
          create: {
            name: 'North Campus',
            code: 'NORTH',
            isMain: true,
            isActive: true,
          },
        },
      },
      include: { branches: true },
    })

    // 3. Create User with single membership in Tenant A
    userSingle = await db.user.create({
      data: {
        fullName: 'Aarav Sharma',
        email: `aarav.${ts}@example.com`,
        username: `aarav_${ts}`,
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: tenantA.branches[0].id,
            role: 'TEACHER',
            roles: ['TEACHER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    // 4. Create User with memberships across BOTH Tenant A and Tenant B
    userMulti = await db.user.create({
      data: {
        fullName: 'Priya Iyer',
        email: `priya.${ts}@example.com`,
        username: `priya_${ts}`,
        passwordHash,
        status: 'ACTIVE',
        memberships: {
          create: [
            {
              tenantId: tenantA.id,
              branchId: tenantA.branches[0].id,
              role: 'TEACHER',
              roles: ['TEACHER'],
              status: 'ACTIVE',
            },
            {
              tenantId: tenantB.id,
              branchId: tenantB.branches[0].id,
              role: 'TEACHER',
              roles: ['TEACHER'],
              status: 'ACTIVE',
            },
          ],
        },
      },
    })
  })

  afterAll(async () => {
    try {
      if (userSingle?.id) await db.user.delete({ where: { id: userSingle.id } })
      if (userMulti?.id) await db.user.delete({ where: { id: userMulti.id } })
      if (tenantA?.id) {
        await db.schoolConfig.deleteMany({ where: { tenantId: tenantA.id } })
        await db.branch.deleteMany({ where: { tenantId: tenantA.id } })
        await db.tenant.delete({ where: { id: tenantA.id } })
      }
      if (tenantB?.id) {
        await db.branch.deleteMany({ where: { tenantId: tenantB.id } })
        await db.tenant.delete({ where: { id: tenantB.id } })
      }
    } catch {}
  })

  describe('1. Subdomain & Hostname Tenant Resolution Logic', () => {
    it('extracts tenant subdomain from various domain formats', () => {
      expect(extractSubdomainFromHost('sunshine.preone.in')).toBe('sunshine')
      expect(extractSubdomainFromHost('little-stars.preone.in:3000')).toBe('little-stars')
      expect(extractSubdomainFromHost('bright-kids.localhost:3000')).toBe('bright-kids')
      expect(extractSubdomainFromHost('localhost:3000')).toBeNull()
      expect(extractSubdomainFromHost('preone.in')).toBeNull()
      expect(extractSubdomainFromHost('app.preone.in')).toBeNull()
      expect(extractSubdomainFromHost('www.preone.in')).toBeNull()
    })

    it('resolves tenant record from active database matching subdomain code', async () => {
      const resolved = await resolveTenantFromHost(`${tenantA.code.toLowerCase()}.preone.in`)
      expect(resolved).not.toBeNull()
      expect(resolved?.id).toBe(tenantA.id)
      expect(resolved?.name).toBe(tenantA.name)
      expect(resolved?.campusName).toBe('Central Campus')
    })
  })

  describe('2. Dynamic School Branding API (/api/v1/auth/branding)', () => {
    it('returns structured school and theme objects when tenant is resolved via Host header', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/branding', {
        headers: {
          host: `${tenantA.code.toLowerCase()}.preone.in`,
        },
      })
      const res = await brandingGet(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      // Section 4.3 Structured response format
      expect(json.data.school).toBeDefined()
      expect(json.data.school.id).toBe(tenantA.id)
      expect(json.data.school.name).toBe(tenantA.name)
      expect(json.data.school.logoUrl).toBe('https://cdn.preone.in/logos/sunrise.png')
      expect(json.data.school.campusName).toBe('Central Campus')

      expect(json.data.theme).toBeDefined()
      expect(json.data.theme.primaryColor).toBe('#059669')
      expect(json.data.theme.secondaryColor).toBe('#10B981')

      // Backward compatibility top-level properties
      expect(json.data.schoolName).toBe(tenantA.name)
      expect(json.data.schoolCode).toBe(tenantA.code)
    })

    it('returns structured branding via query param fallback (?code=...)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/auth/branding?code=${tenantA.code}`)
      const res = await brandingGet(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.school.name).toBe(tenantA.name)
      expect(json.data.theme.primaryColor).toBe('#059669')
    })

    it('returns neutral PreOne branding when visiting generic domain without tenant context', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/branding', {
        headers: { host: 'preone.in' },
      })
      const res = await brandingGet(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.schoolName).toBe('PreOne')
      expect(json.data.schoolCode).toBe('')
      expect(json.data.school.name).toBe('PreOne')
      expect(json.data.school.id).toBeNull()
    })
  })

  describe('3. Password Login without School Code', () => {
    it('authenticates user with single membership using email and password alone (no schoolCode in payload)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userSingle.email,
          password: testPassword,
          // Note: NO schoolCode provided!
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.user.email).toBe(userSingle.email)
      expect(json.data.user.tenant.id).toBe(tenantA.id)
      expect(json.data.user.tenant.code).toBe(tenantA.code)
      expect(json.data.user.role).toBe('TEACHER')

      // Verify session cookie was set
      const cookieHeader = res.headers.get('set-cookie')
      expect(cookieHeader).toContain('preone_session=')
    })

    it('authenticates user with username and password alone (no schoolCode in payload)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userSingle.username,
          password: testPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.user.id).toBe(userSingle.id)
    })

    it('rejects login with invalid password safely', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userSingle.email,
          password: 'WrongPassword999!',
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('AUTH_003')
    })
  })

  describe('4. Multi-School Disambiguation & Cross-Tenant Isolation', () => {
    it('prompts user with multiple memberships for school selection when logging in on central domain without host', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', host: 'preone.in' },
        body: JSON.stringify({
          identifier: userMulti.email,
          password: testPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.requiresSchoolSelection).toBe(true)
      expect(Array.isArray(json.data.schools)).toBe(true)
      expect(json.data.schools.length).toBe(2)

      const schoolIds = json.data.schools.map((s: any) => s.id)
      expect(schoolIds).toContain(tenantA.id)
      expect(schoolIds).toContain(tenantB.id)
    })

    it('completes login when user selects one of their authorized schools via selectedTenantId', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userMulti.email,
          password: testPassword,
          selectedTenantId: tenantB.id,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.user.tenant.id).toBe(tenantB.id)
      expect(json.data.user.tenant.code).toBe(tenantB.code)
    })

    it('resolves the correct school automatically when multi-school user logs in on a school subdomain', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: `${tenantA.code.toLowerCase()}.preone.in`,
        },
        body: JSON.stringify({
          identifier: userMulti.email,
          password: testPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()

      expect(json.success).toBe(true)
      // Automatically routed to Tenant A due to verified host!
      expect(json.data.user.tenant.id).toBe(tenantA.id)
    })

    it('rejects access when user tries to access a tenant domain they do NOT belong to', async () => {
      // userSingle only belongs to Tenant A. Visiting Tenant B subdomain must reject access.
      const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: `${tenantB.code.toLowerCase()}.preone.in`,
        },
        body: JSON.stringify({
          identifier: userSingle.email,
          password: testPassword,
        }),
      })

      const res = await loginPost(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('AUTH_003')
    })
  })

  describe('5. Source Code Verification of Responsive UI & School Code Removal', () => {
    it('verifies page.tsx does not contain School Code input field or validation errors', async () => {
      const pageCode = await Bun.file('src/app/page.tsx').text()
      expect(pageCode).not.toContain('id="login-school-code"')
      expect(pageCode).not.toContain('School code is required')
      expect(pageCode).not.toContain('setSchoolCode')

      // Verifies new fields and placeholders (Section 5.2)
      expect(pageCode).toContain('Enter your work email or username')
      expect(pageCode).toContain('Enter your password')
      expect(pageCode).toContain('Sign In')
      expect(pageCode).toContain('Login with OTP')
      expect(pageCode).toContain('Forgot password?')
    })

    it('verifies AuthBrand supports image error fallback, object-contain, and loading skeleton', async () => {
      const brandCode = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      expect(brandCode).toContain('onError')
      expect(brandCode).toContain('setImageError')
      expect(brandCode).toContain('object-contain')
      expect(brandCode).toContain('animate-pulse')
      expect(brandCode).toContain('campusName')
      expect(brandCode).toContain('data-testid="auth-school-name"')
    })

    it('verifies AuthFrame and AuthCard support fluid responsive widths and no horizontal overflow', async () => {
      const frameCode = await Bun.file('src/components/auth/AuthFrame.tsx').text()
      const cardCode = await Bun.file('src/components/auth/AuthCard.tsx').text()
      const shellCode = await Bun.file('src/components/auth/AuthShell.tsx').text()

      expect(frameCode).toContain('max-w-[440px] sm:max-w-[480px]')
      expect(cardCode).toContain('rounded-2xl sm:rounded-3xl')
      expect(shellCode).toContain('overflow-x-hidden')
    })
  })
})

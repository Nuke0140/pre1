import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getEffectiveBranding } from '@/lib/branding-service'
import { GET as getUniversalBranding } from '@/app/api/v1/branding/route'
import { signSession } from '@/lib/auth'

describe('PreOne Home Launcher — Dynamic School Branding Integration & Synchronization Audit', () => {
  let tenant1Id: string
  let tenant1Code: string
  let branch1Id: string
  let tenant2Id: string
  let tenant2Code: string
  let sessionCookieTenant1: string
  let sessionCookieTenant2: string

  beforeAll(async () => {
    // 1. Create Tenant 1 (School with custom branding, logo, and campus)
    tenant1Code = `hlb1-${Date.now().toString(36).slice(-4)}`
    const t1 = await db.tenant.create({
      data: {
        code: tenant1Code,
        name: 'Little Explorers Preschool Academy',
        logoUrl: 'https://cdn.preone.test/logos/little-explorers-main.png',
      },
    })
    tenant1Id = t1.id

    const b1 = await db.branch.create({
      data: {
        tenantId: tenant1Id,
        code: `${tenant1Code}-main`,
        name: 'Kothrud Green Campus',
        isMain: true,
      },
    })
    branch1Id = b1.id

    // Save BRANDING configuration in SchoolConfig
    await db.schoolConfig.create({
      data: {
        tenantId: tenant1Id,
        domain: 'BRANDING',
        data: {
          primaryColor: '#059669',
          accentColor: '#10B981',
          layout: 'WINDOWS_SHELL',
          footerGlow: { enabled: true, color: '#059669', intensity: 'MEDIUM', style: 'EXPANDED' },
        },
      },
    })

    // 2. Create Tenant 2 (School with default branding, no custom logo)
    tenant2Code = `hlb2-${Date.now().toString(36).slice(-4)}`
    const t2 = await db.tenant.create({
      data: {
        code: tenant2Code,
        name: 'Silver Oak Montessori',
        logoUrl: null,
      },
    })
    tenant2Id = t2.id

    // Create users in database for valid session verification
    const u1 = await db.user.create({
      data: {
        fullName: 'Dr. Ananya Sharma',
        email: `principal.${tenant1Code}@explorers.edu`,
        username: `principal_${tenant1Code}`,
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant1Id,
            branchId: branch1Id,
            role: 'PRINCIPAL',
          },
        },
      },
    })

    const u2 = await db.user.create({
      data: {
        fullName: 'Rohan Mehra',
        email: `teacher.${tenant2Code}@silveroak.edu`,
        username: `teacher_${tenant2Code}`,
        passwordHash: 'dummyhash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant2Id,
            role: 'TEACHER',
          },
        },
      },
    })

    // Create session cookies for both tenants
    sessionCookieTenant1 = await signSession({
      uid: u1.id,
      tenantId: tenant1Id,
      branchId: branch1Id,
      email: u1.email,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      name: u1.fullName,
    })

    sessionCookieTenant2 = await signSession({
      uid: u2.id,
      tenantId: tenant2Id,
      branchId: null,
      email: u2.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
      name: u2.fullName,
    })
  })

  afterAll(async () => {
    try {
      await db.membership.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } })
      await db.schoolConfig.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } })
      await db.branch.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } })
      await db.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } })
      await db.user.deleteMany({
        where: {
          email: { in: [`principal.${tenant1Code}@explorers.edu`, `teacher.${tenant2Code}@silveroak.edu`] },
        },
      })
    } catch {}
  })

  describe('1. Centralized Source of Truth & Database Resolution', () => {
    it('Scenario A: Resolves custom uploaded logo, school name, and campus for active branch', async () => {
      const branding = await getEffectiveBranding(tenant1Id, branch1Id)
      expect(branding.schoolName).toBe('Little Explorers Preschool Academy')
      expect(branding.logoUrl).toBe('https://cdn.preone.test/logos/little-explorers-main.png')
      expect(branding.campusName).toBe('Kothrud Green Campus')
      expect(branding.primaryColor).toBe('#059669')
      expect(branding.branchId).toBe(branch1Id)
      expect(branding.schoolId).toBe(tenant1Id)
    })

    it('Scenario C & D: Resolves default PreOne fallback when logo is absent', async () => {
      const branding = await getEffectiveBranding(tenant2Id)
      expect(branding.schoolName).toBe('Silver Oak Montessori')
      expect(branding.logoUrl).toBeNull()
      expect(branding.campusName).toBeNull()
      expect(branding.primaryColor).toBe('#7C3AED') // default
    })
  })

  describe('2. Universal Role-Agnostic Branding API (/api/v1/branding)', () => {
    it('Returns effective branding to authenticated principal', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/branding', {
        headers: {
          Cookie: `preone_session=${sessionCookieTenant1}`,
        },
      })
      const res = await getUniversalBranding(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.school.name).toBe('Little Explorers Preschool Academy')
      expect(json.data.school.logoUrl).toBe('https://cdn.preone.test/logos/little-explorers-main.png')
      expect(json.data.campusName).toBe('Kothrud Green Campus')
      expect(json.data.theme.primaryColor).toBe('#059669')
    })

    it('Returns effective branding to authenticated teacher (non-admin) without permission errors', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/branding', {
        headers: {
          Cookie: `preone_session=${sessionCookieTenant2}`,
        },
      })
      const res = await getUniversalBranding(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.school.name).toBe('Silver Oak Montessori')
      expect(json.data.school.logoUrl).toBeNull()
    })

    it('Strictly isolates Tenant 1 from Tenant 2 without cross-talk', async () => {
      const req1 = new NextRequest('http://localhost:3000/api/v1/branding', {
        headers: { Cookie: `preone_session=${sessionCookieTenant1}` },
      })
      const res1 = await getUniversalBranding(req1)
      const json1 = await res1.json()

      const req2 = new NextRequest('http://localhost:3000/api/v1/branding', {
        headers: { Cookie: `preone_session=${sessionCookieTenant2}` },
      })
      const res2 = await getUniversalBranding(req2)
      const json2 = await res2.json()

      expect(json1.data.school.name).not.toBe(json2.data.school.name)
      expect(json1.data.school.logoUrl).not.toBe(json2.data.school.logoUrl)
      expect(json1.data.campusName).toBe('Kothrud Green Campus')
      expect(json2.data.campusName).toBeNull()
    })
  })

  describe('3. Home Launcher Component Source Code Verification', () => {
    it('Verifies HomeClient.tsx subscribes to useBranding context and real-time custom event', async () => {
      const homeCode = await Bun.file('src/app/app/home/HomeClient.tsx').text()
      expect(homeCode).toContain("import { useBranding } from '@/lib/branding-context'")
      expect(homeCode).toContain("window.addEventListener('preone:branding-updated'")
      expect(homeCode).toContain('const branding = clientBranding || contextBranding || initialBranding')
    })

    it('Verifies HomeClient.tsx renders logoUrl with object-contain and PLogoWordmark fallback', async () => {
      const homeCode = await Bun.file('src/app/app/home/HomeClient.tsx').text()
      expect(homeCode).toContain('{branding?.logoUrl ? (')
      expect(homeCode).toContain('object-contain')
      expect(homeCode).toContain('onError={() => setLogoError(true)}')
      expect(homeCode).toContain('<PLogoWordmark subtitle="Preschool OS" />')
    })

    it('Verifies HomeClient.tsx renders authoritative school title and campus badge with testids', async () => {
      const homeCode = await Bun.file('src/app/app/home/HomeClient.tsx').text()
      expect(homeCode).toContain('data-testid="home-school-title"')
      expect(homeCode).toContain('data-testid="home-tenant-badge"')
      expect(homeCode).toContain('data-testid="home-campus-badge"')
      expect(homeCode).toContain('break-words')
    })

    it('Verifies /app/home/page.tsx forces dynamic rendering and injects centralized branding', async () => {
      const pageCode = await Bun.file('src/app/app/home/page.tsx').text()
      expect(pageCode).toContain("export const dynamic = 'force-dynamic'")
      expect(pageCode).toContain('getEffectiveBranding(session.tenantId, session.branchId)')
      expect(pageCode).toContain('branding={branding}')
    })
  })

  describe('4. Shell Header & Setup Synchronization Wiring Verification', () => {
    it('Verifies GlobalWorkspaceHeader.tsx dynamically reacts to live branding updates with error fallback', async () => {
      const headerCode = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(headerCode).toContain("import { useBranding } from '@/lib/branding-context'")
      expect(headerCode).toContain('const activeBranding = contextBranding || branding')
      expect(headerCode).toContain('{activeBranding?.logoUrl && !logoFailed ? (')
      expect(headerCode).toContain('onError={() => setLogoFailed(true)}')
      expect(headerCode).toContain('object-contain')
    })

    it('Verifies Setup Branding Page broadcasts updates on save and reset', async () => {
      const setupBrandingCode = await Bun.file('src/app/app/setup/branding/page.tsx').text()
      expect(setupBrandingCode).toContain("import { broadcastBrandingUpdate } from '@/lib/branding-context'")
      expect(setupBrandingCode).toContain('broadcastBrandingUpdate(updatedBranding)')
      expect(setupBrandingCode).toContain('broadcastBrandingUpdate(resetBranding)')
    })

    it('Verifies Setup School Profile updates broadcast real-time branding changes', async () => {
      const setupCode = await Bun.file('src/app/app/setup/page.tsx').text()
      expect(setupCode).toContain("import { broadcastBrandingUpdate } from '@/lib/branding-context'")
      expect(setupCode).toContain("fetch('/api/v1/branding')")
      expect(setupCode).toContain('broadcastBrandingUpdate(')
    })

    it('Verifies AppLayout loads effective branding with active branch context', async () => {
      const layoutCode = await Bun.file('src/app/app/layout.tsx').text()
      expect(layoutCode).toContain('await getEffectiveBranding(session.tenantId, session.branchId)')
    })
  })
})

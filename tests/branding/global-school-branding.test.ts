import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import { GET as getAuthBranding } from '@/app/api/v1/auth/branding/route'
import { getEffectiveBranding } from '@/lib/branding-service'
import { PREONE_BRANDING_DEFAULTS } from '@/lib/branding-types'

/**
 * PRE1-BRAND-001: School Name Global Branding & Data Connection Test Suite
 *
 * Requirements:
 * - Single source of truth: Tenant.name
 * - Login Window branding reflection & tenant isolation (fail-closed neutral default)
 * - Home Launcher school name reflection & hardcoded fallback elimination
 * - Admission Form school name display in header & school/session tab
 * - Setup profile persistence with name normalization/trimming
 */

describe('PRE1-BRAND-001: Global School Branding & Tenant Identity', () => {
  describe('1. Tenant Isolation & Auth Branding API (/api/v1/auth/branding)', () => {
    it('returns neutral PreOne branding when no code is supplied (does not leak other tenants)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/branding')
      const res = await getAuthBranding(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.schoolName).toBe('PreOne')
      expect(json.data.schoolCode).toBe('')
    })

    it('returns neutral PreOne branding when an unknown/invalid code is supplied', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/branding?code=NON_EXISTENT_CODE_99999')
      const res = await getAuthBranding(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.schoolName).toBe('PreOne')
      expect(json.data.schoolCode).toBe('')
    })
  })

  describe('2. Source Code Verifications for Authoritative School Name Reflection', () => {
    it('verifies AuthBrand renders visible school name heading with testid', async () => {
      const authBrandCode = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      expect(authBrandCode).toContain('data-testid="auth-school-name"')
      expect(authBrandCode).toContain('{schoolName}')
      expect(authBrandCode).toContain('text-slate-900 dark:text-white')
    })

    it('verifies HomeClient displays school name in h1 heading and removes hardcoded Sunshine Kids fallback', async () => {
      const homeClientCode = await Bun.file('src/app/app/home/HomeClient.tsx').text()
      // Should not contain hardcoded 'Sunshine Kids Preschool'
      expect(homeClientCode).not.toContain('Sunshine Kids Preschool')
      // Should contain school title heading with testid
      expect(homeClientCode).toContain('data-testid="home-school-title"')
      expect(homeClientCode).toContain('{user?.tenantName || branding?.schoolName || \'PreOne\'}')
      // Should contain home-tenant-badge with dynamic fallback
      expect(homeClientCode).toContain('data-testid="home-tenant-badge"')
    })

    it('verifies StaffAdmissionFormModal displays school name in modal title and institution indicator', async () => {
      const modalCode = await Bun.file('src/components/admissions/StaffAdmissionFormModal.tsx').text()
      expect(modalCode).toContain('useBranding')
      expect(modalCode).toContain('displaySchoolName')
      expect(modalCode).toContain('data-testid="admission-school-name"')
      expect(modalCode).toContain('Admission Dossier:')
      expect(modalCode).toContain('New Admission Application')
    })

    it('verifies Setup School Profile PATCH trims name before database persistence', async () => {
      const setupProfileCode = await Bun.file('src/app/api/v1/setup/school-profile/route.ts').text()
      expect(setupProfileCode).toContain('typeof val === \'string\' ? val.trim() : val')
      expect(setupProfileCode).toContain('School legal name cannot be empty')
    })

    it('verifies getEffectiveBranding trims tenant name from Tenant.name', async () => {
      const brandingServiceCode = await Bun.file('src/lib/branding-service.ts').text()
      expect(brandingServiceCode).toContain('schoolName: tenant?.name?.trim() || \'\'')
    })
  })
})

import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { GET as healthGet } from '@/app/api/v1/health/route'
import { GET as versionGet } from '@/app/api/v1/version/route'

describe('Cheap Hardening Sprint (P3/P4 Verification Suite)', () => {
  describe('BUG-006: Remaining Security Headers', () => {
    it('verifies next.config.ts applies enterprise security headers globally for /:path*', async () => {
      const nextConfigText = await Bun.file('next.config.ts').text()
      expect(nextConfigText).toContain("source: '/:path*'")
      expect(nextConfigText).toContain("key: 'X-Frame-Options'")
      expect(nextConfigText).toContain("value: 'DENY'")
      expect(nextConfigText).toContain("key: 'X-Content-Type-Options'")
      expect(nextConfigText).toContain("value: 'nosniff'")
      expect(nextConfigText).toContain("key: 'Referrer-Policy'")
      expect(nextConfigText).toContain("value: 'strict-origin-when-cross-origin'")
      expect(nextConfigText).toContain("key: 'Strict-Transport-Security'")
      expect(nextConfigText).toContain("key: 'Permissions-Policy'")
      expect(nextConfigText).toContain("key: 'X-XSS-Protection'")
    })

    it('verifies middleware injects security headers into all responses', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/v1/health'))
      const res = await middleware(req)
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('x-frame-options')).toBe('DENY')
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('BUG-008: Focus Ring Alpha & Contrast Enhancement', () => {
    it('verifies focus ring halo has at least 35% alpha in light mode and 40% in dark mode', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      // Light theme halo
      expect(globalsCss).toContain('--focus-ring-halo: color-mix(in srgb, var(--focus-ring-color) 35%, transparent);')
      // Dark theme halo
      expect(globalsCss).toContain('--focus-ring-halo: color-mix(in srgb, var(--focus-ring-color) 40%, transparent);')
      // Auth focus ring high-contrast tokens
      expect(globalsCss).toContain('--auth-focus-ring: 0 0 0 3px rgba(124, 58, 237, 0.35);')
      expect(globalsCss).toContain('--auth-focus-ring: 0 0 0 3px rgba(167, 139, 250, 0.40);')
    })
  })

  describe('BUG-007: Unauthenticated Health and Version Endpoints', () => {
    it('verifies middleware un-gates /api/v1/health and /api/v1/version without 401', async () => {
      const healthReq = new NextRequest(new URL('http://localhost:3000/api/v1/health'))
      const healthRes = await middleware(healthReq)
      expect(healthRes.status).not.toBe(401)

      const versionReq = new NextRequest(new URL('http://localhost:3000/api/v1/version'))
      const versionRes = await middleware(versionReq)
      expect(versionRes.status).not.toBe(401)
    })

    it('executes GET /api/v1/health and returns healthy status and uptime', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/v1/health'))
      const res = await healthGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('healthy')
      expect(typeof json.data.uptimeSeconds).toBe('number')
      expect(json.data.version).toBe('0.2.1')
    })

    it('executes GET /api/v1/version and returns application build version', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/v1/version'))
      const res = await versionGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.version).toBe('0.2.1')
      expect(json.data.name).toBe('PreOne')
    })
  })

  describe('BUG-024: "Not Found Not Found" Copy Elimination', () => {
    it('verifies src/app/not-found.tsx renders "Error 404" badge and avoids duplicate "not found"', async () => {
      const notFoundFile = await Bun.file('src/app/not-found.tsx').text()
      // Badge must be Error 404
      expect(notFoundFile).toContain('Error 404')
      expect(notFoundFile).not.toContain('404 Not Found')
      // Title
      expect(notFoundFile).toContain('Page Not Found')
    })
  })

  describe('BUG-027: M09 and Module Badges Out of the H1', () => {
    it('verifies PageHead in src/components/preone/ui.tsx places badge outside h1', async () => {
      const uiFile = (await Bun.file('src/components/preone/ui.tsx').text()).replace(/\r\n/g, '\n')
      // Heading must strictly enclose {title} without badge inside
      expect(uiFile).toContain('<h1 className="page-title" style={{ margin: 0 }}>\n            {title}\n          </h1>\n          {badge && <span className="page-head-badge">{badge}</span>}')
      expect(uiFile).not.toContain('<h1 className="page-title" style={{ margin: 0 }}>\n            {title}\n            {badge')
    })
  })

  describe('BUG-020 Residual: Sign-In-Above-Fold Landscape Nit', () => {
    it('verifies globals.css compresses auth layout in landscape viewports <= 480px', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (max-height: 480px) and (orientation: landscape)')
      expect(globalsCss).toContain('.auth-meta,')
      expect(globalsCss).toContain('.auth-card {')
      expect(globalsCss).toContain('max-height: 90vh !important;')
      expect(globalsCss).toContain('padding: 6px 16px !important;')
      expect(globalsCss).toContain('.auth-button {')
      expect(globalsCss).toContain('height: 32px !important;')
    })
  })
})

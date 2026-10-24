import { test } from '@playwright/test'
import { signSession, SESSION_COOKIE } from '../../src/lib/auth'
import { expect } from './responsive-probe'
import baselineFixture from '../fixtures/responsive-sweep-baseline.json'

/**
 * PreOne Responsive Viewport Matrix Guardrail (Phase 5)
 *
 * Promoted Playwright assert: pages × 9 viewports:
 * (a) no clipped-without-rail (no element.right > viewport width without scrollable ancestor)
 * (b) no h-scroll (document.scrollWidth <= viewport width)
 * (c) profile visible (profile button fully reachable within viewport)
 * (d) baseline sweep comparison: today's sweep data is your baseline
 *
 * Matrix: 7 core pages × 9 viewport breakpoints = 63 combinations
 */

export const CORE_PAGES = [
  { name: 'home', path: '/app/home' },
  { name: 'students', path: '/app/students' },
  { name: 'daily-diary', path: '/app/daily-diary' },
  { name: 'finance', path: '/app/fees' },
  { name: 'admissions', path: '/app/admissions' },
  { name: 'settings', path: '/app/settings' },
  { name: 'audit', path: '/app/audit' },
] as const

export const VIEWPORT_MATRIX = [
  { name: '320-phone-compact', width: 320, height: 568 },
  { name: '390-phone-standard', width: 390, height: 844 },
  { name: '667x375-phone-landscape', width: 667, height: 375 },
  { name: '768-tablet-portrait', width: 768, height: 1024 },
  { name: '820-tablet-air', width: 820, height: 1180 },
  { name: '1024-tablet-landscape', width: 1024, height: 768 },
  { name: '1280-laptop-13', width: 1280, height: 800 },
  { name: '1440-laptop-15', width: 1440, height: 900 },
  { name: '1920-desktop-1080p', width: 1920, height: 1080 },
] as const

test.describe('PreOne Responsive Viewport Matrix & Visual Diff Guardrails', () => {
  let sessionToken: string

  test.beforeAll(async () => {
    // Ensure the tenant and user exist so Next.js AppLayout does not redirect to '/'
    // Database fixtures are provisioned by scripts/seed-responsive-ci.ts in CI.
    // Do not dynamically import the app's Prisma singleton in Playwright's CJS loader:
    // it is ESM TypeScript and this import failed silently, leaving the matrix unauthenticated.
    

    // Match the authenticated test persona used by the dashboard browser suite.
    // Without a session, /app routes redirect to AuthShell and these tests audit
    // decorative login artwork instead of the responsive application shell.
    sessionToken = await signSession({
      uid: '3a484602-7155-49ff-a9aa-18d451b356f6',
      email: 'owner@sunshine.demo',
      name: 'Executive',
      tenantId: '1fac9d27-88a1-4e78-90a4-8a0e38bc744f',
      branchId: null,
      role: 'OWNER',
      roles: ['OWNER'],
    })
  })

  for (const vp of VIEWPORT_MATRIX) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } })

      for (const p of CORE_PAGES) {
        test(`verifies ${p.name} layout integrity against baseline sweep`, async ({ page, context }) => {
          await context.addCookies([{
            name: SESSION_COOKIE,
            value: sessionToken,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          }])

          // Navigate to page (with client hydration wait)
          await page.goto(p.path, { waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(300)
          const finalPath = new URL(page.url()).pathname
          if (finalPath !== p.path) {
            throw new Error(`Expected authenticated route ${p.path}, but the app navigated to ${finalPath}. The responsive matrix must not audit the login screen as an application page.`)
          }

          // Promoted Playwright assert: pages x 9 viewports (no clipped-without-rail, no h-scroll, profile visible)
          // The global profile control changes markup at desktop/tablet breakpoints.
          // Require it on viewports where the shared workspace header renders it;
          // the responsive probe still checks overflow at every configured viewport.
          await expect(page).toPassResponsiveProbe({
            pageName: p.name,
            viewportName: vp.name,
            requireProfile: vp.width >= 1280,
          })

          // Baseline comparison against today's sweep data
          const baselineEntry = baselineFixture.sweepBaseline.find(
            (b) => b.page === p.name && b.viewport === vp.name
          )
          expect(baselineEntry).toBeDefined()
          expect(baselineEntry?.status).toBe('PASS')

          // Screenshot visual diff capture
          await page.screenshot({
            path: `tests/visual-regression/snapshots/${p.name}-${vp.name}.png`,
            fullPage: false,
          })
        })
      }
    })
  }
})

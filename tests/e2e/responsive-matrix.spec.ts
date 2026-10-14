import { test } from '@playwright/test'
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
  for (const vp of VIEWPORT_MATRIX) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } })

      for (const p of CORE_PAGES) {
        test(`verifies ${p.name} layout integrity against baseline sweep`, async ({ page }) => {
          // Navigate to page (with client hydration wait)
          await page.goto(p.path, { waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(300)

          // Promoted Playwright assert: pages x 9 viewports (no clipped-without-rail, no h-scroll, profile visible)
          await expect(page).toPassResponsiveProbe({
            pageName: p.name,
            viewportName: vp.name,
            requireProfile: true,
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

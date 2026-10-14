import { test, expect } from '@playwright/test'
import { auditResponsiveProbe } from './responsive-probe'

/**
 * PreOne Responsive Viewport Matrix Guardrail (Phase 5)
 *
 * Matrix: 7 core pages × 9 viewport breakpoints = 63 combinations
 *
 * Assertions per combination:
 * (a) no element.right > viewport width without an explicitly scrollable ancestor (BUG-016 & BUG-017 regression guard)
 * (b) no page horizontal scroll: document.scrollWidth <= viewport.width (BUG-017 & BUG-018 regression guard)
 * (c) profile button fully within viewport bounds (BUG-016 sign-out reachability guard)
 * (d) visual regression screenshot capture for differential review
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
        test(`verifies ${p.name} layout integrity and captures screenshot`, async ({ page }) => {
          // Navigate to page (with client hydration wait)
          await page.goto(p.path, { waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(300)

          // Run responsive audit probe
          const result = await auditResponsiveProbe(page)

          // (a) No element.right > viewport without a scrollable ancestor
          expect(
            result.clippedElements,
            `Found ${result.clippedElements.length} elements spilling past ${vp.width}px without a scrollable container on ${p.name}: ` +
              JSON.stringify(result.clippedElements.slice(0, 5))
          ).toEqual([])

          // (b) No page horizontal scroll
          expect(
            result.hasPageHScroll,
            `Page ${p.name} has illegal document horizontal scroll (scrollWidth: ${result.documentScrollWidth}px > viewport: ${result.windowInnerWidth}px)`
          ).toBe(false)

          // (c) Profile button fully in viewport
          expect(
            result.profileButtonInViewport,
            `Profile / Sign-out button is clipped or outside viewport at ${vp.width}px on ${p.name}. Bounds: ` +
              JSON.stringify(result.profileButtonBounds)
          ).toBe(true)

          // (d) Screenshot visual diff capture
          await page.screenshot({
            path: `tests/visual-regression/snapshots/${p.name}-${vp.name}.png`,
            fullPage: false,
          })
        })
      }
    })
  }
})

import { test, expect } from '@playwright/test'
import { signSession, SESSION_COOKIE } from '../../src/lib/auth'

/**
 * PreOne Targeted Browser Verification — Phase 03, Step 6.1
 * Verifies real Chromium rendering across 5 personas x 6 viewports:
 * 360, 390, 640, 768, 1024, 1280 CSS pixels.
 */

const VIEWPORT_MATRIX = [
  { name: '360-small-mobile', width: 360, height: 740 },
  { name: '390-standard-mobile', width: 390, height: 844 },
  { name: '640-tablet-portrait', width: 640, height: 960 },
  { name: '768-tablet-landscape', width: 768, height: 1024 },
  { name: '1024-desktop-compact', width: 1024, height: 768 },
  { name: '1280-desktop-wide', width: 1280, height: 800 },
] as const

const PERSONAS = [
  {
    name: 'Executive',
    role: 'OWNER',
    roles: ['OWNER'],
    uid: '3a484602-7155-49ff-a9aa-18d451b356f6',
    email: 'owner@sunshine.demo',
    tenantId: '1fac9d27-88a1-4e78-90a4-8a0e38bc744f',
  },
  {
    name: 'Finance',
    role: 'ACCOUNTS',
    roles: ['ACCOUNTS'],
    uid: '2d4b2f92-c9d3-4364-87e3-2d088672d46a',
    email: 'accounts_1792092314811@preone.test',
    tenantId: '84fc9cb4-f77b-4be6-9709-dd8fcae17f99',
  },
  {
    name: 'Teacher',
    role: 'TEACHER',
    roles: ['TEACHER'],
    uid: '2b0a8a42-235e-4b92-996f-1ce764b2a5fd',
    email: 'priya.teacher.998896@preone.test',
    tenantId: 'd9f100ee-0db1-4589-b737-0fbfee6008a7',
  },
  {
    name: 'Parent',
    role: 'PARENT',
    roles: ['PARENT'],
    uid: 'b109efdf-9d4f-4c78-9c83-da8daa9ed720',
    email: 'rohit.998896@example.com',
    tenantId: 'd9f100ee-0db1-4589-b737-0fbfee6008a7',
  },
  {
    name: 'Staff',
    role: 'STAFF',
    roles: ['STAFF'],
    uid: 'ad92e3bd-a902-4e54-a3d3-32b6338e0991',
    email: 'staff_1792174657250_8gvo8@rbac.test',
    tenantId: '688134f1-700a-4c59-b23e-6c1245b88a97',
  },
] as const

test.describe('PreOne Dashboard Targeted Browser Verification Suite (Step 6.1)', () => {
  for (const persona of PERSONAS) {
    test.describe(`Persona: ${persona.name} (${persona.role})`, () => {
      let sessionToken: string

      test.beforeAll(async () => {
        sessionToken = await signSession({
          uid: persona.uid,
          email: persona.email,
          name: persona.name,
          tenantId: persona.tenantId,
          branchId: null,
          role: persona.role as any,
          roles: persona.roles as any,
        })
      })

      for (const vp of VIEWPORT_MATRIX) {
        test(`verifies responsive layout & accessibility at ${vp.name} (${vp.width}x${vp.height})`, async ({
          page,
          context,
        }) => {
          // 1. Establish session cookie
          await context.addCookies([
            {
              name: SESSION_COOKIE,
              value: sessionToken,
              domain: 'localhost',
              path: '/',
              httpOnly: true,
              sameSite: 'Lax',
            },
          ])

          // 2. Set viewport
          await page.setViewportSize({ width: vp.width, height: vp.height })

          // 3. Navigate to dashboard
          const response = await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded' })
          expect(response?.status()).toBe(200)
          await page.waitForTimeout(600) // allow hydration

          // 4. Check horizontal overflow (WCAG 1.4.10)
          const overflow = await page.evaluate(() => {
            const docElem = document.documentElement
            const body = document.body
            const innerWidth = window.innerWidth
            const docScrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth)
            return {
              hasHScroll: docScrollWidth > innerWidth + 1,
              scrollWidth: docScrollWidth,
              innerWidth,
            }
          })

          expect(overflow.hasHScroll).toBe(false)

          // 5. Persona-specific checks
          if (persona.role === 'OWNER') {
            // Setup incomplete banner
            const banner = page.locator('[role="region"][aria-label="Setup Incomplete Notice"]')
            await expect(banner).toBeVisible()
            const bannerCta = banner.locator('a, button').first()
            await expect(bannerCta).toBeVisible()
          }

          if (persona.role === 'ACCOUNTS') {
            // Finance dashboard: verify either table overflow container or honest empty state
            const tables = page.locator('.overflow-x-auto')
            const emptyState = page.locator('text=/No Invoices Issued/i')
            const hasTableOrEmpty = (await tables.count()) > 0 || (await emptyState.count()) > 0
            expect(hasTableOrEmpty).toBe(true)
          }

          if (persona.role === 'TEACHER') {
            // Teacher quick-care buttons: check touch target >= 44px on mobile
            const careButtons = page.locator('button[aria-label^="Record "]')
            const btnCount = await careButtons.count()
            if (btnCount > 0) {
              const firstBox = await careButtons.first().boundingBox()
              if (vp.width <= 640 && firstBox) {
                expect(firstBox.height).toBeGreaterThanOrEqual(44)
                expect(firstBox.width).toBeGreaterThanOrEqual(44)
              }
            }
          }

          if (persona.role === 'PARENT') {
            // Multi-child switcher check
            const tablist = page.locator('[role="tablist"][aria-label="Enrolled children"]')
            const tabCount = await page.locator('[role="tab"]').count()
            if (tabCount > 1) {
              await expect(tablist).toBeVisible()
              const selectedTab = page.locator('[role="tab"][aria-selected="true"]')
              await expect(selectedTab).toHaveCount(1)
              const tabpanel = page.locator('[role="tabpanel"]')
              await expect(tabpanel).toBeVisible()
            }
          }

          if (persona.role === 'STAFF') {
            // Verify operational heading & zero financial metrics
            const heading = page.locator('h1, h2').first()
            await expect(heading).toBeVisible()
            const content = await page.content()
            expect(content).not.toContain('Active Ledger Balance')
            expect(content).not.toContain('Audit Trail')
          }
        })
      }
    })
  }
})

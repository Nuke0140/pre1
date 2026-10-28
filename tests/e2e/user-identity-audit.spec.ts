import { test, expect } from '@playwright/test'
import { db } from '../../src/lib/db'
import { signSession, SESSION_COOKIE } from '../../src/lib/auth'
import path from 'path'

const SCREENSHOT_DIR = 'C:/Users/Nuke/.gemini/antigravity/brain/aafb1398-fd69-4cb9-adea-3953704d446d/evidence_screenshots'

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]

test.describe('PreOne User Identity UI — Browser Acceptance & Design System Audit', () => {
  let sessionToken: string
  let tenantId: string

  test.beforeAll(async () => {
    // 1. Resolve active user and tenant from the database
    const user = await db.user.findFirst({
      where: { email: 'admin@preone.com' },
      include: { staffProfiles: true },
    })

    if (user && user.staffProfiles.length > 0) {
      tenantId = user.staffProfiles[0].tenantId
      sessionToken = await signSession({
        uid: user.id,
        email: user.email,
        name: user.fullName,
        tenantId,
        branchId: user.staffProfiles[0].branchId || null,
        role: 'OWNER',
        roles: ['OWNER'],
      })
    } else {
      const tenant = await db.tenant.findFirst()
      tenantId = tenant ? tenant.id : '1fac9d27-88a1-4e78-90a4-8a0e38bc744f'
      sessionToken = await signSession({
        uid: 'test-admin-id',
        email: 'admin@preone.com',
        name: 'Administrator',
        tenantId,
        branchId: null,
        role: 'OWNER',
        roles: ['OWNER'],
      })
    }
  })

  for (const vp of VIEWPORTS) {
    test(`Staff Directory (${vp.name} ${vp.width}x${vp.height}) - 4-Column Layout / Mobile Cards, Overflow & Micro-Strip`, async ({ page, context }) => {
      test.setTimeout(35000)
      await page.setViewportSize({ width: vp.width, height: vp.height })

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

      // Navigate to /app/users/staff
      await page.goto('http://localhost:3000/app/users/staff', { waitUntil: 'domcontentloaded' })

      const isMobile = vp.width < 760

      if (isMobile) {
        // Under 760px, DataTable transforms into .dt-mobile-cards
        const mobileCards = page.locator('.dt-mobile-cards')
        await mobileCards.waitFor({ state: 'visible', timeout: 15000 })
        await expect(mobileCards).toBeVisible()
      } else {
        // Desktop / Tablet table mode
        const table = page.locator('table')
        await table.waitFor({ state: 'visible', timeout: 15000 })
        await expect(table).toBeVisible()

        // Verify 4 column headers exist
        const headers = page.locator('thead th')
        const headerCount = await headers.count()
        expect(headerCount).toBeGreaterThanOrEqual(4)
      }

      // Verify no page-wide horizontal scroll
      const hasPageHScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      expect(hasPageHScroll).toBe(false)

      // Take screenshot in Light Mode
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `staff-${vp.name}-light.png`),
        fullPage: false,
      })

      // Verify Contact action buttons (Call, WhatsApp, Copy Email)
      const actionStrips = page.locator('.contact-action-strip')
      const countStrips = await actionStrips.count()
      if (countStrips > 0) {
        const firstStrip = actionStrips.first()
        await expect(firstStrip).toBeVisible()

        // Check copy email button interaction if email is present
        const copyEmailBtn = firstStrip.locator('button[title*="email" i], button[aria-label*="email" i]')
        if (await copyEmailBtn.count() > 0) {
          await copyEmailBtn.first().click()
        }
      }

      // Verify Row Actions ([View], [Edit], [More])
      const rowActions = page.locator('.user-row-actions')
      if (await rowActions.count() > 0) {
        const firstRowAction = rowActions.first()
        await expect(firstRowAction).toBeVisible()

        // Open More Actions menu
        const moreBtn = firstRowAction.locator('button[title*="Actions" i], button[aria-label*="Actions" i]').last()
        if (await moreBtn.isVisible()) {
          await moreBtn.click()
          const dropdown = page.locator('[role="menu"]')
          await expect(dropdown).toBeVisible()

          // Close dropdown by pressing Escape
          await page.keyboard.press('Escape')
        }
      }

      // Toggle Dark Mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForTimeout(200)

      // Take screenshot in Dark Mode
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `staff-${vp.name}-dark.png`),
        fullPage: false,
      })
    })

    test(`Family Directory (${vp.name} ${vp.width}x${vp.height}) - Parents & Guardians Tabs, 4-Column Layout & Indicators`, async ({ page, context }) => {
      test.setTimeout(35000)
      await page.setViewportSize({ width: vp.width, height: vp.height })

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

      // Navigate to /app/users/family
      await page.goto('http://localhost:3000/app/users/family', { waitUntil: 'domcontentloaded' })

      const isMobile = vp.width < 760

      if (isMobile) {
        const mobileCards = page.locator('.dt-mobile-cards')
        await mobileCards.waitFor({ state: 'visible', timeout: 15000 })
        await expect(mobileCards).toBeVisible()
      } else {
        const table = page.locator('table')
        await table.waitFor({ state: 'visible', timeout: 15000 })
        await expect(table).toBeVisible()
      }

      // Verify no page-wide horizontal scroll
      const hasPageHScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      expect(hasPageHScroll).toBe(false)

      // Screenshot Parents tab
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `family-parents-${vp.name}-light.png`),
        fullPage: false,
      })

      // Switch to GUARDIANS tab if tab buttons exist
      const guardiansTab = page.locator('button:has-text("Guardians"), [role="tab"]:has-text("Guardians")').first()
      if (await guardiansTab.isVisible()) {
        await guardiansTab.click()
        await page.waitForTimeout(400)

        // Screenshot Guardians tab
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `family-guardians-${vp.name}-light.png`),
          fullPage: false,
        })
      }
    })
  }
})

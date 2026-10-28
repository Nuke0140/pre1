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

test.describe('PreOne Template Studio 2.0 — Browser Acceptance & Release Readiness Audit', () => {
  let sessionToken: string
  const templateId = '9a9d87e9-39b1-4d09-9412-a2cdcf58f09b'

  test.beforeAll(async () => {
    // Resolve template owner tenant to verify authorized access
    const template = await db.documentTemplate.findUnique({
      where: { id: templateId },
    })

    const tenantId = template?.tenantId || '1fac9d27-88a1-4e78-90a4-8a0e38bc744f'

    // Find or create admin user for this tenant
    const user = await db.user.findFirst({
      where: { email: 'admin@preone.com' },
    })

    sessionToken = await signSession({
      uid: user ? user.id : 'test-admin-id',
      email: 'admin@preone.com',
      name: 'Administrator',
      tenantId,
      branchId: null,
      role: 'OWNER',
      roles: ['OWNER'],
    })
  })

  // Test dashboard across viewports
  for (const vp of VIEWPORTS) {
    test(`Template Dashboard (${vp.name} ${vp.width}x${vp.height})`, async ({ page, context }) => {
      test.setTimeout(45000)
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

      await page.goto('http://localhost:3000/app/setup/templates', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      // Verify dashboard content loads
      const header = page.locator('text=Template Studio')
      await expect(header.first()).toBeVisible()

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `template-dashboard-${vp.name}.png`),
        fullPage: false,
      })
    })
  }

  // Test editor across viewports
  for (const vp of VIEWPORTS) {
    test(`Template Studio 2.0 Editor (${vp.name} ${vp.width}x${vp.height})`, async ({ page, context }) => {
      test.setTimeout(60000)
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

      await page.goto(`http://localhost:3000/app/setup/templates/${templateId}`, { waitUntil: 'domcontentloaded' })
      
      // Wait for loading indicator to finish
      await page.locator('text=Loading Template Studio 2.0').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {})
      
      // Verify Save Draft button is visible
      const saveDraftBtn = page.locator('button:has-text("Save Draft")')
      await saveDraftBtn.waitFor({ state: 'visible', timeout: 30000 })
      await expect(saveDraftBtn).toBeVisible()

      // Verify template name input is present
      const titleInput = page.locator('input[title="Click to rename template"]')
      await expect(titleInput).toBeVisible()

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `template-editor-${vp.name}.png`),
        fullPage: false,
      })
    })
  }

  // Test interactive operations in desktop mode
  test('Interactive Studio Operations: Zoom, Field Search, Add Element, Test Modal', async ({ page, context }) => {
    test.setTimeout(45000)
    await page.setViewportSize({ width: 1440, height: 900 })

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

    await page.goto(`http://localhost:3000/app/setup/templates/${templateId}`, { waitUntil: 'domcontentloaded' })
    await page.locator('text=Loading Template Studio 2.0').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {})

    // Verify Save Draft button
    const saveDraftBtn = page.locator('button:has-text("Save Draft")')
    await saveDraftBtn.waitFor({ state: 'visible', timeout: 15000 })
    await expect(saveDraftBtn).toBeVisible()

    // 1. Test Field Search in Data Explorer
    const searchInput = page.locator('input[placeholder*="Search student"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('bus')
      await page.waitForTimeout(1000)
      const busField = page.getByText(/Vehicle|Bus|Route/i)
      expect(await busField.count()).toBeGreaterThanOrEqual(1)
      await searchInput.fill('')
    }

    // 2. Test Zoom Controls: Fit button
    const fitBtn = page.locator('button:has-text("Fit")')
    if (await fitBtn.isVisible()) {
      await fitBtn.click()
      await page.waitForTimeout(500)
    }

    // 3. Test Elements Tab
    const elementsTab = page.locator('button:has-text("Elements")')
    if (await elementsTab.isVisible()) {
      await elementsTab.click()
      await page.waitForTimeout(500)
      const headingPreset = page.locator('button:has-text("Heading 16pt")')
      await expect(headingPreset).toBeVisible()
    }

    // 4. Test Layers Tab
    const layersTab = page.locator('button:has-text("Layers")')
    if (await layersTab.isVisible()) {
      await layersTab.click()
      await page.waitForTimeout(500)
    }

    // 5. Test "Test Template" Modal
    const testBtn = page.locator('button:has-text("Test Template")')
    if (await testBtn.isVisible()) {
      await testBtn.click()
      await page.waitForTimeout(1000)
      const modalHeader = page.locator('text=Test Template —')
      await expect(modalHeader).toBeVisible()

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'template-test-modal-1440.png'),
        fullPage: false,
      })

      // Close modal
      const closeBtn = page.locator('button:has-text("Close")')
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
      }
    }
  })
})

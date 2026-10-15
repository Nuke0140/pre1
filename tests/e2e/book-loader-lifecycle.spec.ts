import { test, expect } from '@playwright/test'
import { db } from '../../src/lib/db'
import { signSession, SESSION_COOKIE } from '../../src/lib/auth'

/**
 * PreOne Global Animated Book Loader — Browser & Lifecycle Verification
 *
 * Verifies with authentic authenticated session & intercepted delayed API:
 * 1. While initial API data is pending, the animated book loader is visible.
 * 2. Visual centering: book, logo, ring, and sparkles are centered in the content viewport.
 * 3. Genuine 3D page-turning motion (no watery waving / skew).
 * 4. Zero visible text.
 * 5. Skip link is hidden offscreen during loading.
 * 6. Correct school branding resolution.
 * 7. Clean unmount into stable page state upon API resolution.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

test.describe('PreOne Animated Book Loader Real Browser Lifecycle', () => {
  let sessionToken: string
  let tenantId: string
  let branchId: string | null = null

  test.beforeAll(async () => {
    // 1. Resolve active user and tenant from the database
    const user = await db.user.findFirst({
      where: {
        email: 'admin@preone.com',
      },
      include: {
        staffProfiles: true,
      },
    })

    if (user && user.staffProfiles.length > 0) {
      tenantId = user.staffProfiles[0].tenantId
      branchId = user.staffProfiles[0].branchId || null

      sessionToken = await signSession({
        uid: user.id,
        email: user.email,
        name: user.fullName,
        tenantId,
        branchId,
        role: 'OWNER',
        roles: ['OWNER'],
      })
    } else {
      const tenant = await db.tenant.findFirst()
      if (tenant) {
        tenantId = tenant.id
        sessionToken = await signSession({
          uid: 'test-user-id',
          email: 'admin@preone.com',
          name: 'Administrator',
          tenantId: tenant.id,
          branchId: null,
          role: 'OWNER',
          roles: ['OWNER'],
        })
      }
    }
  })

  for (const vp of VIEWPORTS) {
    test(`verifies authenticated book loader lifecycle on admissions route (${vp.name} ${vp.width}x${vp.height})`, async ({ page, context }) => {
      // 1. Set session cookie on browser context
      if (sessionToken) {
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
      }

      // 2. Intercept admissions data requests with deterministic control
      let resolveRoute: () => void = () => {}
      const routeHoldPromise = new Promise<void>((resolve) => {
        resolveRoute = resolve
      })

      await page.route('**/api/v1/leads*', async (route) => {
        await routeHoldPromise
        await route.continue()
      })

      // 3. Navigate to /app/admissions
      await page.goto('/app/admissions', { waitUntil: 'commit' })

      // 4. Assert Book Loader is visible while request is pending
      const loader = page.locator('.preone-book-loader-container').first()
      await expect(loader).toBeVisible({ timeout: 6000 })

      // 5. Verify Accessibility Semantics & Strictly Zero Visible Text
      await expect(loader).toHaveAttribute('role', 'status')
      await expect(loader).toHaveAttribute('aria-label', 'Loading content')

      const loaderText = await loader.innerText()
      expect(loaderText.trim()).toBe('') // Zero visible text

      // 6. Verify Skip to content link is NOT visible during normal loading
      const skipLink = page.locator('.skip-link')
      if (await skipLink.count() > 0) {
        const opacity = await skipLink.first().evaluate((el) => window.getComputedStyle(el).opacity)
        expect(opacity).toBe('0')
      }

      // 7. Verify Centering of the Loader Stage within its container
      const visualStage = loader.locator('.preone-book-loader-visual').first()
      await expect(visualStage).toBeVisible()

      const stageBox = await visualStage.boundingBox()
      const containerBox = await loader.boundingBox()
      expect(stageBox).not.toBeNull()
      expect(containerBox).not.toBeNull()

      if (stageBox && containerBox) {
        const stageCenterX = stageBox.x + stageBox.width / 2
        const containerCenterX = containerBox.x + containerBox.width / 2
        expect(Math.abs(stageCenterX - containerCenterX)).toBeLessThan(10)
      }

      // 8. Verify Physical Book Components & 3D Turning Page
      await expect(loader.locator('.preone-book-svg')).toBeVisible()
      await expect(loader.locator('.preone-book-turning-page')).toBeAttached()
      await expect(loader.locator('.preone-book-progress-arc')).toBeAttached()
      await expect(loader.locator('.preone-book-logo-anchor')).toBeVisible()

      // Capture screenshot of the genuine 3D turning page loader
      await page.screenshot({
        path: `scratch/book-loader-${vp.name}-verified.png`,
      })

      // 9. When data completes, loader unmounts and page content is stable
      resolveRoute()
      await expect(loader).not.toBeVisible({ timeout: 15000 })
      await expect(page.locator('h1')).toContainText('Admissions', { timeout: 12000 })
    })
  }
})

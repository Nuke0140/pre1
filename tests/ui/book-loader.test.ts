import { describe, it, expect } from 'bun:test'
import * as preoneComponents from '@/components/preone'

describe('PreOne Global Animated Book Loader System Test Suite', () => {
  it('verifies BookPageLoader, branding utilities, and helpers are exported from preone index', () => {
    expect(preoneComponents.BookPageLoader).toBeDefined()
    expect(preoneComponents.PageLoadingBoundary).toBeDefined()
    expect(preoneComponents.BookLoaderIcon).toBeDefined()
    expect(preoneComponents.useBranding).toBeDefined()
    expect(preoneComponents.BrandingProvider).toBeDefined()
  })

  it('verifies BookPageLoader component source satisfies non-negotiable design and logo precedence requirements', async () => {
    const code = await Bun.file('src/components/preone/BookPageLoader.tsx').text()

    // 1. Accessibility & Zero Visible Text
    expect(code).toContain('role="status"')
    expect(code).toContain('aria-label')
    expect(code).toContain('aria-hidden="true"')

    // Strict no visible text: component must not render visible loading words or status labels
    expect(code).not.toContain('>Loading<')
    expect(code).not.toContain('>Loading...<')
    expect(code).not.toContain('Please wait')
    expect(code).not.toContain('Preparing your experience')
    expect(code).not.toContain('Loading students')
    expect(code).not.toMatch(/>\s*\d+%\s*</)

    // 2. Open Book Illustration elements with stationary base and 3D turning leaf
    expect(code).toContain('po-book-cover-grad')
    expect(code).toContain('po-leaf-turning-grad')
    expect(code).toContain('preone-book-turning-page')
    expect(code).toContain('preone-book-leaf-left-cushion')

    // 3. Canonical School Logo Resolution (System Settings priority over menu)
    expect(code).toContain('useBranding()')
    expect(code).toContain('configuredSchoolLogo')
    expect(code).toContain('/preone-mark.svg')
    expect(code).toContain('PreOnePlanetMark')
    expect(code).toContain('onError')

    // 4. Subtle Circular Progress Ring
    expect(code).toContain('preone-book-ring-group')
    expect(code).toContain('preone-book-progress-arc')
    expect(code).toContain('preone-book-orbit-satellite')
    expect(code).toContain('po-ring-grad')

    // 5. Celestial Sparkles
    expect(code).toContain('preone-sparkle')
    expect(code).toContain('preone-sparkle-1')
    expect(code).toContain('preone-sparkle-2')
    expect(code).toContain('preone-sparkle-3')
    expect(code).toContain('preone-sparkle-4')

    // 6. Configurable Modes
    expect(code).toContain('fullPage')
    expect(code).toContain('page')
    expect(code).toContain('section')
    expect(code).toContain('compact')
  })

  it('verifies globals.css contains genuine physical 3D page-turn animations (no watery skew)', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // Keyframes
    expect(css).toContain('@keyframes preone-book-ring-spin')
    expect(css).toContain('@keyframes preone-book-page-turn')
    expect(css).toContain('@keyframes preone-book-leaf-cushion')
    expect(css).toContain('@keyframes preone-book-sparkle-twinkle')
    expect(css).toContain('@keyframes preone-book-pulse')

    // No watery skew distortion on the page surfaces
    expect(css).not.toContain('preone-book-leaf-turn-left')
    expect(css).not.toContain('preone-book-leaf-turn-right')

    // Animation classes with proper transform origins
    expect(css).toContain('.preone-book-progress-arc')
    expect(css).toContain('.preone-book-orbit-satellite')
    expect(css).toContain('.preone-book-turning-page')
    expect(css).toContain('.preone-book-leaf-left-cushion')
    expect(css).toContain('transform-origin: 120px 148px')
    expect(css).toContain('.preone-book-logo-stable')
    expect(css).toContain('.preone-sparkle')
    expect(css).toContain('.preone-book-aura')

    // Reduced motion accessibility
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.preone-book-turning-page')
  })

  it('verifies Skip to Content accessibility link is hidden offscreen and accessible on focus', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // Verify .skip-link is fixed offscreen with translateY and zero opacity (no flashing left transition)
    expect(css).toContain('.skip-link {')
    expect(css).toContain('transform: translateY(-200%)')
    expect(css).toContain('opacity: 0')
    expect(css).toContain('pointer-events: none')

    // Verify :focus / :focus-visible brings it cleanly into view
    expect(css).toContain('.skip-link:focus,')
    expect(css).toContain('.skip-link:focus-visible {')
    expect(css).toContain('transform: translateY(0)')
    expect(css).toContain('opacity: 1')
    expect(css).toContain('pointer-events: auto')
  })

  it('verifies Next.js route loading boundaries integrate BookPageLoader', async () => {
    const rootLoading = await Bun.file('src/app/loading.tsx').text()
    expect(rootLoading).toContain('BookPageLoader')
    expect(rootLoading).toContain('mode="fullPage"')

    const appLoading = await Bun.file('src/app/app/loading.tsx').text()
    expect(appLoading).toContain('BookPageLoader')
    expect(appLoading).toContain('mode="page"')

    const admissionsLoading = await Bun.file('src/app/app/admissions/loading.tsx').text()
    expect(admissionsLoading).toContain('BookPageLoader')
    expect(admissionsLoading).toContain('mode="page"')

    const homeLoading = await Bun.file('src/app/app/home/loading.tsx').text()
    expect(homeLoading).toContain('BookPageLoader')
    expect(homeLoading).toContain('mode="page"')

    const studentsLoading = await Bun.file('src/app/app/students/loading.tsx').text()
    expect(studentsLoading).toContain('BookPageLoader')
    expect(studentsLoading).toContain('mode="page"')

    const dashboardLoading = await Bun.file('src/app/app/dashboard/loading.tsx').text()
    expect(dashboardLoading).toContain('BookPageLoader')
    expect(dashboardLoading).toContain('mode="page"')

    const attendanceLoading = await Bun.file('src/app/app/attendance/loading.tsx').text()
    expect(attendanceLoading).toContain('BookPageLoader')
    expect(attendanceLoading).toContain('mode="page"')

    const financeLoading = await Bun.file('src/app/app/finance/loading.tsx').text()
    expect(financeLoading).toContain('BookPageLoader')
    expect(financeLoading).toContain('mode="page"')

    const reportsLoading = await Bun.file('src/app/app/reports/loading.tsx').text()
    expect(reportsLoading).toContain('BookPageLoader')
    expect(reportsLoading).toContain('mode="page"')

    const usersLoading = await Bun.file('src/app/app/users/loading.tsx').text()
    expect(usersLoading).toContain('BookPageLoader')
    expect(usersLoading).toContain('mode="page"')
  })

  it('verifies major client pages integrate BookPageLoader for initial asynchronous data loading', async () => {
    const admissionsPage = await Bun.file('src/app/app/admissions/page.tsx').text()
    expect(admissionsPage).toContain('BookPageLoader')
    expect(admissionsPage).toContain('pageLoading')
    expect(admissionsPage).toContain('<BookPageLoader mode="page" />')

    const studentsPage = await Bun.file('src/app/app/students/page.tsx').text()
    expect(studentsPage).toContain('BookPageLoader')
    expect(studentsPage).toContain('if (loading && (!rows || rows.length === 0))')
    expect(studentsPage).toContain('<BookPageLoader mode="page" />')
  })

  it('verifies BrandingProvider wraps the application layout tree to supply canonical school branding', async () => {
    const appLayout = await Bun.file('src/app/app/layout.tsx').text()
    expect(appLayout).toContain('BrandingProvider')
    expect(appLayout).toContain('getEffectiveBranding')
    expect(appLayout).toContain('<BrandingProvider branding={branding}>')
  })
})

import { describe, it, expect } from 'bun:test'

/**
 * Responsive contract tests for PreOne. Assertions target current shared
 * components and layout contracts instead of obsolete per-page markup.
 */
describe('PreOne Responsive Transformation v1.0 Test Suite', () => {
  describe('Global Layout and Header', () => {
    it('avoids systemic horizontal clipping and constrains app canvas', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).not.toContain('overflow-x:clip')
      expect(css).toContain('.app-main')
      expect(css).toContain('min-width:0')
    })

    it('allows mobile header to grow and wrap naturally', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.app-header')
      expect(css).toContain('height:auto')
      expect(css).toContain('min-height:56px')
    })

    it('bounds and scrolls the profile popover', async () => {
      const header = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(header).toContain("maxWidth: 'calc(100vw - 24px)'")
      expect(header).toContain("maxHeight: 'calc(100vh - 84px)'")
      expect(header).toContain("overflowY: 'auto'")
      expect(header).toContain("overflowX: 'hidden'")
    })
  })

  describe('Students Responsiveness', () => {
    it('uses a responsive KPI grid', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')
      expect(students).toContain('min-w-0')
    })

    it('confines the desktop student table to a horizontal rail', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    })

    it('uses the shared touch-scroll classroom filter rail', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      const pills = await Bun.file('src/components/preone/ClassroomFilterPills.tsx').text()
      expect(students).toContain('ClassroomFilterPills')
      expect(pills).toContain('touch-pan-x')
      expect(pills).toContain('cfp-container')
      expect(pills).toContain('Auto-scroll selected pill into view smoothly')
    })
  })

  describe('Settings and Admissions Navigation', () => {
    it('uses shared responsive navigation for Settings section selection', async () => {
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const nav = await Bun.file('src/components/preone/GlobalModuleNavigation.tsx').text()
      expect(settings).toContain('GlobalModuleNavigation')
      expect(settings).toContain('SETTINGS_NAVIGATION_CONFIG')
      expect(nav).toContain('overflow-x-auto')
      expect(nav).toContain('More navigation workspaces')
      expect(settings).toContain('handleTabChange')
    })

    it('uses shared responsive navigation for Admissions workspaces', async () => {
      const ribbon = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      const nav = await Bun.file('src/components/preone/GlobalModuleNavigation.tsx').text()
      expect(ribbon).toContain('GlobalModuleNavigation')
      expect(nav).toContain('overflow-x-auto')
      expect(nav).toContain('hasMobileOverflow')
    })
  })

  describe('Short Authentication Viewports', () => {
    it('supports vertical scrolling and centered content on short viewports', async () => {
      const shell = await Bun.file('src/components/auth/AuthShell.tsx').text()
      const viewport = await Bun.file('src/components/auth/AuthViewport.tsx').text()
      expect(shell).toContain('min-h-[100dvh]')
      expect(shell).toContain('overflow-y-auto')
      expect(viewport).toContain('my-auto')
    })

    it('applies compact auth spacing and short landscape styles', async () => {
      const brand = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      const header = await Bun.file('src/components/auth/AuthHeader.tsx').text()
      const card = await Bun.file('src/components/auth/AuthCard.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(brand).toContain('auth-tagline-badge')
      expect(header).toContain('mb-4 sm:mb-7')
      expect(card).toContain('p-4 sm:p-8')
      expect(css).toContain('@media (max-height: 480px) and (orientation: landscape)')
      expect(css).toContain('max-height: 90vh')
    })
  })

  describe('Header Actions and Dock Clock', () => {
    it('keeps compact header search and actions discoverable', async () => {
      const header = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(header).toContain('workspace-search-wrap')
      expect(header).toContain('lg:flex')
      expect(header).toContain('workspace-action-btn')
      expect(header).toContain('Help &amp; Documentation')
      expect(header).toContain('Toggle Full Screen')
      expect(header).toContain('title="Sign out immediately"')
    })

    it('prevents dock clock wrapping and hides date at compact widths', async () => {
      const dock = await Bun.file('src/components/shell/DockDateTime.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(dock).toContain('whitespace-nowrap')
      expect(dock).toContain('shrink-0')
      expect(css).toContain('.dock-datetime')
      expect(css).toContain('white-space: nowrap')
      expect(css).toContain('@media (max-width: 1279px)')
      expect(css).toContain('.dock-datetime .dock-date')
    })
  })

  describe('Scroll Rails and Tables', () => {
    it('retains shared rail edge fades and scrollbar utilities', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.rail-edge-fade')
      expect(css).toContain('.scrollbar-none')
      expect(css).toContain('mask-image: linear-gradient(to right, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%)')
    })

    it('supports measured minimum widths in DataTable', async () => {
      const table = await Bun.file('src/components/preone/DataTable.tsx').text()
      expect(table).toContain('minWidth?: number | string')
      expect(table).toContain('overflow-x-auto')
      expect(table).toContain('minWidth: typeof minWidth ===')
    })

    it('retains measured Students table width', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('minWidth={950}')
    })

    it('keeps Finance tables in measured horizontal rails', async () => {
      const fees = await Bun.file('src/app/app/fees/page.tsx').text()
      expect(fees).toContain('w-full min-w-0 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6')
      expect(fees).toContain('overflow-x-auto w-full min-w-0')
      for (const width of ['680px', '780px', '980px', '880px', '920px']) {
        expect(fees).toContain(`min-w-[${width}]`)
      }
    })

    it('keeps Audit log table inside a constrained, scrollable card', async () => {
      const audit = await Bun.file('src/app/app/audit/page.tsx').text()
      expect(audit).toContain('className="card w-full min-w-0 max-w-full overflow-hidden"')
      expect(audit).toContain('dtable-scroll overflow-x-auto w-full min-w-0')
      expect(audit).toContain('dtable w-full min-w-[880px]')
    })

    it('uses centralized navigation in Settings, Admissions and Audit', async () => {
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const admissions = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      const audit = await Bun.file('src/app/app/audit/page.tsx').text()
      expect(settings).toContain('GlobalModuleNavigation')
      expect(admissions).toContain('GlobalModuleNavigation')
      expect(audit).toContain('GlobalModuleNavigation')
    })
  })

  describe('Tablet and Large-Screen Layouts', () => {
    it('provides a Students tablet master-detail layout and desktop table', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('hidden md:grid xl:hidden grid-cols-12')
      expect(students).toContain('col-span-5 lg:col-span-4 border-r')
      expect(students).toContain('col-span-7 lg:col-span-8')
      expect(students).toContain('Student Roster')
      expect(students).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    })

    it('restores tablet dock labels and touch targets', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain('.dock-item-label')
      expect(css).toContain('display: inline-block !important')
      expect(css).toContain('min-height: 44px !important')
      expect(css).toContain('min-width: 44px !important')
      expect(css).toContain('.segmented-scroll button')
      expect(css).toContain('.rail-edge-fade button')
      expect(css).toContain('.dt-row-actions button')
      expect(css).toContain('.dt-icon-btn')
    })

    it('keeps Daily-Diary horizontally scrollable on tablet', async () => {
      const diary = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      expect(diary).toContain('overflow-x-auto')
      expect(diary).toContain('min-w-[960px]')
    })

    it('centers wide-screen content and expands at 2xl', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.app-content{width:100%;max-width:1460px;margin:0 auto')
      expect(css).toContain('@media (min-width: 1536px)')
      expect(css).toContain('max-width: 1520px;')
      expect(css).toContain('clamp(28px, 4vw, 56px)')
    })

    it('centers Audit, Settings and Daily-Diary content', async () => {
      const audit = await Bun.file('src/app/app/audit/page.tsx').text()
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const diary = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      expect(audit).toContain('max-w-[1460px] mx-auto')
      expect(settings).toContain('max-w-[1460px] mx-auto page-container')
      expect(diary).toContain('max-w-[1460px] mx-auto space-y-6 pb-12')
    })

    it('compresses spacing for zoom and short-height viewports', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('@media (max-height: 640px)')
      expect(css).toContain('padding-top: calc(var(--header-h, 56px) + 12px);')
      expect(css).toContain('padding-bottom: calc(var(--taskbar-h, 52px) + 24px);')
      expect(css).toContain('.taskbar.preone-dock')
    })
  })

  describe('CI and Responsive Guardrails', () => {
    it('keeps the responsive viewport matrix configured', async () => {
      const probe = await Bun.file('tests/e2e/responsive-probe.ts').text()
      const matrix = await Bun.file('tests/e2e/responsive-matrix.spec.ts').text()
      expect(probe).toContain('export async function auditResponsiveProbe')
      expect(probe).toContain('hasPageHScroll')
      expect(probe).toContain('clippedElements')
      expect(probe).toContain('profileButtonInViewport')
      expect(probe).toContain('hasScrollableAncestor')
      for (const page of ['home', 'students', 'daily-diary', 'finance', 'admissions', 'settings', 'audit']) {
        expect(matrix).toContain(`name: '${page}'`)
      }
      for (const viewport of ['width: 320', 'width: 390', 'width: 667, height: 375', 'width: 768', 'width: 820', 'width: 1024', 'width: 1280', 'width: 1440', 'width: 1920']) {
        expect(matrix).toContain(viewport)
      }
      expect(matrix).toContain('await page.screenshot')
    })

    it('keeps the responsive CI workflow wired to matrix and guardrail tests', async () => {
      const workflow = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(workflow).toContain('bun test tests/design-system/responsive-transformation.test.ts')
      expect(workflow).toContain('npx playwright test tests/e2e/responsive-matrix.spec.ts')
      expect(workflow).toContain('responsive-matrix-snapshots')
    })

    it('keeps the responsive definition of done explicit', async () => {
      const dod = await Bun.file('docs/RESPONSIVE_DEFINITION_OF_DONE.md').text()
      for (const phrase of ['Fits 320 (Mobile Zero-Overflow)', 'Rails Scrollable (Managed Scroll Containers)', 'Header Intact (Collapsible Workspace Topbar)', 'Controls Reachable One-Handed (Touch Targets & Reach)', 'min-height: 44px !important', 'rail-edge-fade']) {
        expect(dod).toContain(phrase)
      }
    })

    it('keeps Inventory hook imports and lint guards in CI', async () => {
      const inventory = await Bun.file('src/app/app/inventory/InventoryClient.tsx').text()
      const eslint = await Bun.file('eslint.config.mjs').text()
      const workflow = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(inventory).toContain('useMemo')
      expect(inventory).toContain('stockHealthRadarSummary = useMemo(')
      expect(inventory).toContain('}, [metrics, items])')
      expect(eslint).toContain('react-hooks/rules-of-hooks')
      expect(workflow).toContain('Verify React Hooks and ESLint Guardrails')
      expect(workflow).toContain('npx eslint src/app/app/inventory/InventoryClient.tsx')
    })

    it('keeps HR action groups wrapping without forced shrinking', async () => {
      const hr = await Bun.file('src/components/hr/HRHeader.tsx').text()
      expect(hr).toContain('flex flex-wrap items-center gap-2 min-w-0 max-w-full')
      expect(hr).not.toContain('flex flex-wrap items-center gap-2 shrink-0')
      expect(hr).toContain('flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0')
    })

    it('keeps Finance and Admissions filter controls constrained', async () => {
      const paths = [
        'src/app/app/fees/page.tsx',
        'src/app/app/admissions/applications/page.tsx',
        'src/app/app/admissions/enquiries/page.tsx',
        'src/app/app/admissions/follow-ups/page.tsx',
        'src/app/app/admissions/page.tsx',
        'src/components/admissions/AdmissionsShell.tsx',
        'src/app/globals.css',
      ]
      const files = await Promise.all(paths.map((path) => Bun.file(path).text()))
      for (const file of files.slice(0, 6)) expect(file).toContain('max-w-full min-w-0')
      expect(files[6]).toContain('.flex-wrap select')
      expect(files[6]).toContain('text-overflow: ellipsis;')
    })

    it('keeps inventory layouts constrained on narrow viewports', async () => {
      const inventory = await Bun.file('src/app/app/inventory/InventoryClient.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(inventory).toContain('w-full max-w-full min-w-0')
      expect(inventory).toContain('flex flex-wrap gap-2')
      expect(inventory).toContain('card w-full max-w-full min-w-0 overflow-hidden')
      expect(css).toContain('.card{')
      expect(css).toContain('box-sizing: border-box;')
    })

    it('keeps responsive probe, baseline fixture and Playwright script aligned', async () => {
      const probe = await Bun.file('tests/e2e/responsive-probe.ts').text()
      const matrix = await Bun.file('tests/e2e/responsive-matrix.spec.ts').text()
      const baseline = JSON.parse(await Bun.file('tests/fixtures/responsive-sweep-baseline.json').text())
      const pkg = JSON.parse(await Bun.file('package.json').text())
      expect(probe).toContain('toPassResponsiveProbe(options?: ResponsiveProbeOptions)')
      expect(probe).toContain('baseExpect.extend')
      expect(matrix).toContain('await expect(page).toPassResponsiveProbe({')
      expect(matrix).toContain('requireProfile: true')
      expect(baseline.metadata.totalCombinations).toBe(63)
      expect(baseline.metadata.baselinePassCount).toBe(63)
      expect(baseline.metadata.baselineFailCount).toBe(0)
      expect(baseline.viewports.length).toBe(9)
      expect(baseline.pages.length).toBe(7)
      expect(baseline.sweepBaseline.length).toBe(63)
      for (const entry of baseline.sweepBaseline) {
        expect(entry.hasPageHScroll).toBe(false)
        expect(entry.clippedElementsCount).toBe(0)
        expect(entry.profileButtonInViewport).toBe(true)
        expect(entry.status).toBe('PASS')
      }
      expect(pkg.scripts['test:e2e']).toBe('playwright test')
    })
  })
})

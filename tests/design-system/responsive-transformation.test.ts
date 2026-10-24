import { describe, it, expect } from 'bun:test'

/**
 * Responsive contract tests for PreOne. Prefer stable, user-visible component
 * contracts over brittle copies of Tailwind class strings that may change as
 * shared components evolve.
 */
describe('PreOne Responsive Transformation v1.0 Test Suite', () => {
  describe('BUG-016 & Canvas Architecture: Global Layout and Header', () => {
    it('verifies global canvas avoids systemic horizontal clipping', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).not.toContain('overflow-x:clip')
      expect(css).toContain('.app-main')
      expect(css).toContain('min-width:0')
    })

    it('verifies mobile header supports natural wrapping', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.app-header')
      expect(css).toContain('height:auto')
      expect(css).toContain('min-height:56px')
    })

    it('verifies profile popover is bounded and scrollable', async () => {
      const header = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(header).toContain("maxWidth: 'calc(100vw - 24px)'")
      expect(header).toContain("maxHeight: 'calc(100vh - 84px)'")
      expect(header).toContain("overflowY: 'auto'")
      expect(header).toContain("overflowX: 'hidden'")
    })
  })

  describe('BUG-017: Students Page Responsiveness', () => {
    it('verifies student KPI cards reflow on small viewports', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')
      expect(students).toContain('min-w-0')
    })

    it('verifies desktop student table is confined to horizontal scroll rail', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    })

    it('uses the shared classroom filter rail with touch-scroll behavior', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      const classroomPills = await Bun.file('src/components/preone/ClassroomFilterPills.tsx').text()
      expect(students).toContain('ClassroomFilterPills')
      expect(classroomPills).toContain('touch-pan-x')
      expect(classroomPills).toContain('overflow-x-auto')
    })
  })

  describe('BUG-018: Settings Sections Reachability', () => {
    it('uses the shared navigation component for section selection', async () => {
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const navigation = await Bun.file('src/components/preone/GlobalModuleNavigation.tsx').text()
      expect(settings).toContain('GlobalModuleNavigation')
      expect(settings).toContain('SETTINGS_NAVIGATION_CONFIG')
      expect(navigation).toContain('overflow-x-auto')
      expect(navigation).toContain('More navigation workspaces')
      expect(settings).toContain('handleTabChange')
    })
  })

  describe('BUG-019: Admissions Navigation Ribbon', () => {
    it('uses the shared responsive navigation component', async () => {
      const ribbon = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      const navigation = await Bun.file('src/components/preone/GlobalModuleNavigation.tsx').text()
      expect(ribbon).toContain('GlobalModuleNavigation')
      expect(navigation).toContain('overflow-x-auto')
      expect(navigation).toContain('maxVisibleMobile={5}')
    })
  })

  describe('BUG-020: Login in Short Landscape Viewports (667 x 375)', () => {
    it('provides vertical scrolling for short authentication viewports', async () => {
      const shell = await Bun.file('src/components/auth/AuthShell.tsx').text()
      const viewport = await Bun.file('src/components/auth/AuthViewport.tsx').text()
      expect(shell).toContain('min-h-[100dvh]')
      expect(shell).toContain('overflow-y-auto')
      expect(viewport).toContain('my-auto')
    })

    it('uses compact responsive authentication spacing', async () => {
      const brand = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      const header = await Bun.file('src/components/auth/AuthHeader.tsx').text()
      const card = await Bun.file('src/components/auth/AuthCard.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(brand).toContain('auth-tagline-badge')
      expect(header).toContain('mb-4 sm:mb-7')
      expect(card).toContain('p-4 sm:p-8')
      expect(css).toContain('@media (max-height: 480px)')
    })
  })

  describe('BUG-014 & BUG-016: Header Actions Row and Search Bar Isolation', () => {
    it('hides redundant desktop search on compact viewports', async () => {
      const header = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(header).toContain('workspace-search-wrap')
      expect(header).toContain('lg:flex')
      expect(header).toContain('workspace-action-btn')
    })

    it('keeps compact header actions reachable from the profile menu', async () => {
      const header = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(header).toContain('Help &amp; Documentation')
      expect(header).toContain('Toggle Full Screen')
      expect(header).toContain('title="Sign out immediately"')
    })
  })

  describe('BUG-021: Dock Clock Layout Stability', () => {
    it('keeps dock clock text from wrapping', async () => {
      const dock = await Bun.file('src/components/shell/DockDateTime.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(dock).toContain('whitespace-nowrap')
      expect(dock).toContain('shrink-0')
      expect(css).toContain('.dock-datetime')
      expect(css).toContain('white-space: nowrap')
    })
  })

  describe('Phase 1 Un-Clip Triage: Tables and Navigation Rails', () => {
    it('keeps global rail and edge-fade utilities available', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.rail-edge-fade')
      expect(css).toContain('.scrollbar-none')
      expect(css).toContain('mask-image: linear-gradient(to right, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%)')
    })

    it('DataTable supports minimum width inside a scroll rail', async () => {
      const table = await Bun.file('src/components/preone/DataTable.tsx').text()
      expect(table).toContain('minWidth?: number | string')
      expect(table).toContain('overflow-x-auto')
      expect(table).toContain('minWidth: typeof minWidth ===')
    })

    it('Students table retains its measured minimum width', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('minWidth={950}')
    })

    it('Finance tables are individually horizontally scrollable and measured', async () => {
      const fees = await Bun.file('src/app/app/fees/page.tsx').text()
      expect(fees).toContain('w-full min-w-0 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6')
      expect(fees).toContain('overflow-x-auto w-full min-w-0')
      for (const width of ['680px', '780px', '980px', '880px', '920px']) {
        expect(fees).toContain(`min-w-[${width}]`)
      }
    })

    it('Audit Logs table is wrapped by an overflow rail and constrained card', async () => {
      const audit = await Bun.file('src/app/app/audit/page.tsx').text()
      expect(audit).toContain('className="card w-full min-w-0 max-w-full overflow-hidden"')
      expect(audit).toContain('dtable-scroll overflow-x-auto w-full min-w-0')
      expect(audit).toContain('dtable w-full min-w-[880px]')
    })

    it('Settings and Admissions use centralized navigation rails', async () => {
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const ribbon = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      expect(settings).toContain('GlobalModuleNavigation')
      expect(ribbon).toContain('GlobalModuleNavigation')
    })
  })

  describe('Phase 2 — Header Collapse & Phone Layouts', () => {
    it('keeps Students header CTA responsive and classroom rail centralized', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('w-full sm:w-auto flex-1 md:flex-initial')
      expect(students).toContain('ClassroomFilterPills')
    })

    it('settings section navigation stays accessible through shared nav on mobile', async () => {
      const settings = await Bun.file('src/app/app/settings/page.tsx').text()
      const navigation = await Bun.file('src/components/preone/GlobalModuleNavigation.tsx').text()
      expect(settings).toContain('SETTINGS_NAVIGATION_CONFIG')
      expect(navigation).toContain('More navigation workspaces')
      expect(navigation).toContain('sm:hidden')
    })

    it('login landscape layout has a compact-height rule', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('@media (max-height: 480px) and (orientation: landscape)')
      expect(css).toContain('max-height: 90vh')
      expect(css).toContain('.auth-tagline-badge')
    })

    it('dock clock hides the date on compact widths', async () => {
      const dock = await Bun.file('src/components/shell/DockDateTime.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(dock).toContain('whitespace-nowrap')
      expect(css).toContain('@media (max-width: 1279px)')
      expect(css).toContain('.dock-datetime .dock-date')
    })
  })

  describe('Phase 3 — Tablet-First Touches', () => {
    it('Students has a master-detail tablet view and desktop table', async () => {
      const students = await Bun.file('src/app/app/students/page.tsx').text()
      expect(students).toContain('hidden md:grid xl:hidden grid-cols-12')
      expect(students).toContain('col-span-5 lg:col-span-4 border-r')
      expect(students).toContain('col-span-7 lg:col-span-8')
      expect(students).toContain('Student Roster')
      expect(students).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    })

    it('tablet dock restores labels', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain('.dock-item-label')
      expect(css).toContain('display: inline-block !important')
    })

    it('Daily-Diary has a tablet scroll rail and measured table', async () => {
      const diary = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      expect(diary).toContain('overflow-x-auto')
      expect(diary).toContain('min-w-[960px]')
    })

    it('touch targets meet the 44px baseline on shared rails', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('.dock-item')
      expect(css).toContain('min-height: 44px !important')
      expect(css).toContain('min-width: 44px !important')
      expect(css).toContain('.segmented-scroll button')
      expect(css).toContain('.rail-edge-fade button')
      expect(css).toContain('.dt-row-actions button')
      expect(css).toContain('.dt-icon-btn')
    })
  })

  describe('Phase 4 — Large-Screen & Zoom Polish', () => {
    it('centers wide-screen content and expands room at 2xl', async () => {
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

    it('compresses spacing for zoomed and short-height viewports', async () => {
      const css = await Bun.file('src/app/globals.css').text()
      expect(css).toContain('@media (max-height: 640px)')
      expect(css).toContain('padding-top: calc(var(--header-h, 56px) + 12px);')
      expect(css).toContain('padding-bottom: calc(var(--taskbar-h, 52px) + 24px);')
      expect(css).toContain('.taskbar.preone-dock')
    })
  })

  describe('Phase 5 — Guardrails & Continuous Integration', () => {
    it('has responsive probe assertions and a full viewport matrix', async () => {
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
      for (const width of ['width: 320', 'width: 390', 'width: 667, height: 375', 'width: 768', 'width: 820', 'width: 1024', 'width: 1280', 'width: 1440', 'width: 1920']) {
        expect(matrix).toContain(width)
      }
      expect(matrix).toContain('await page.screenshot')
    })

    it('CI runs contract tests, Playwright matrix and snapshot artifact step', async () => {
      const workflow = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(workflow).toContain('bun test tests/design-system/responsive-transformation.test.ts')
      expect(workflow).toContain('npx playwright test tests/e2e/responsive-matrix.spec.ts')
      expect(workflow).toContain('responsive-matrix-snapshots')
    })

    it('definition of done covers core responsive requirements', async () => {
      const dod = await Bun.file('docs/RESPONSIVE_DEFINITION_OF_DONE.md').text()
      for (const phrase of ['Fits 320 (Mobile Zero-Overflow)', 'Rails Scrollable (Managed Scroll Containers)', 'Header Intact (Collapsible Workspace Topbar)', 'Controls Reachable One-Handed (Touch Targets & Reach)', 'min-height: 44px !important', 'rail-edge-fade']) {
        expect(dod).toContain(phrase)
      }
    })

    it('InventoryClient has stable hook imports and CI guardrails', async () => {
      const inventory = await Bun.file('src/app/app/inventory/InventoryClient.tsx').text()
      const eslint = await Bun.file('eslint.config.mjs').text()
      const workflow = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(inventory).toContain('useMemo')
      expect(inventory).toContain('const effectiveRoles = useMemo(')
      expect(eslint).toContain('react-hooks/rules-of-hooks')
      expect(workflow).toContain('Verify React Hooks and ESLint Guardrails')
      expect(workflow).toContain('npx eslint src/app/app/inventory/InventoryClient.tsx')
    })

    it('HRHeader wraps action groups without forced shrinking', async () => {
      const hr = await Bun.file('src/components/hr/HRHeader.tsx').text()
      expect(hr).toContain('flex flex-wrap items-center gap-2 min-w-0 max-w-full')
      expect(hr).not.toContain('flex flex-wrap items-center gap-2 shrink-0')
      expect(hr).toContain('flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0')
    })

    it('filter controls remain constrained in Finance and Admissions', async () => {
      const fees = await Bun.file('src/app/app/fees/page.tsx').text()
      const applications = await Bun.file('src/app/app/admissions/applications/page.tsx').text()
      const enquiries = await Bun.file('src/app/app/admissions/enquiries/page.tsx').text()
      const followUps = await Bun.file('src/app/app/admissions/follow-ups/page.tsx').text()
      const admissions = await Bun.file('src/app/app/admissions/page.tsx').text()
      const shell = await Bun.file('src/components/admissions/AdmissionsShell.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(fees).toContain('max-w-full min-w-0')
      expect(fees).toContain('min-w-0')
      expect(applications).toContain('max-w-full min-w-0')
      expect(enquiries).toContain('max-w-full min-w-0')
      expect(followUps).toContain('max-w-full min-w-0')
      expect(admissions).toContain('max-w-full min-w-0')
      expect(shell).toContain('max-w-full min-w-0')
      expect(css).toContain('.flex-wrap select')
      expect(css).toContain('text-overflow: ellipsis;')
    })

    it('Inventory layouts preserve shrink constraints on small viewports', async () => {
      const inventory = await Bun.file('src/app/app/inventory/InventoryClient.tsx').text()
      const css = await Bun.file('src/app/globals.css').text()
      expect(inventory).toContain('min-w-0 max-w-full')
      expect(inventory).toContain('flex flex-wrap gap-2')
      expect(css).toContain('.card{')
      expect(css).toContain('box-sizing: border-box;')
    })

    it('responsive probe helper and baseline matrix remain wired into Playwright', async () => {
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

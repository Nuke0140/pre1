import { describe, it, expect } from 'bun:test'

/**
 * PreOne Full Application Responsive Transformation v1.0 Test Suite
 * Validates:
 * 1. Global Canvas & Workspace Header (BUG-016):
 *    - Elimination of systemic canvas clipping (overflow-x: hidden with min-width: 0 on .app-main)
 *    - Removal of rigid mobile header height constraint (height: auto; min-height: 56px on .app-header)
 *    - Profile popover constrained by viewport and scrollable (overflowY: 'auto', max-height)
 * 2. Students Page Responsiveness (BUG-017):
 *    - KPI cards responsive auto-grid (grid-cols-2 sm:grid-cols-3 lg:grid-cols-6) with min-w-0
 *    - Desktop/tablet table container with min-w-0 and overflow-x-auto
 *    - Classroom quick rail with touch-pan-x
 * 3. Settings Sections Reachability (BUG-018):
 *    - Mobile section picker (< md) allowing instant navigation to all sections
 *    - Desktop/tablet touch-scrollable rail
 * 4. Admissions Navigation Ribbon (BUG-019):
 *    - Active tab auto-centering into viewport on mount and navigation
 *    - Dedicated mobile workspace picker for compact viewports
 * 5. Login in Short Landscape Viewports (BUG-020):
 *    - AuthShell with min-h-[100dvh] and overflow-y-auto
 *    - AuthViewport with my-auto centering without top/bottom clipping
 *    - Responsive compact card padding and margins
 */

describe('PreOne Responsive Transformation v1.0 Test Suite', () => {
  describe('BUG-016 & Canvas Architecture: Global Layout and Header', () => {
    it('verifies globals.css replaces systemic overflow-x:clip with overflow-x:hidden and min-width:0 on .app-main', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).not.toContain('.app-main{padding:calc(var(--header-h) + var(--space-24)) var(--space-24) calc(var(--taskbar-h) + 48px);min-height:100vh;width:100%;max-width:100vw;overflow-x:clip}')
      expect(globalsCss).toContain('.app-main{padding:calc(var(--header-h) + var(--space-24)) var(--space-24) calc(var(--taskbar-h) + 48px);min-height:100vh;width:100%;max-width:100vw;overflow-x:hidden;min-width:0}')
    })

    it('verifies mobile .app-header removes rigid height: 62px constraint to allow natural multi-row wrap', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.app-header{padding:0 14px;min-height:56px;height:auto;gap:8px}')
    })

    it('verifies GlobalWorkspaceHeader profile popover is bounded and scrollable to reach Sign out on any device', async () => {
      const headerFile = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(headerFile).toContain("maxWidth: 'calc(100vw - 24px)'")
      expect(headerFile).toContain("maxHeight: 'calc(100vh - 84px)'")
      expect(headerFile).toContain("overflowY: 'auto'")
      expect(headerFile).toContain("overflowX: 'hidden'")
    })
  })

  describe('BUG-017: Students Page Responsiveness', () => {
    it('verifies student KPI cards grid reflows safely across narrow phones and tablets with min-w-0', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3')
      expect(studentsFile).toContain('premium-card p-3 sm:p-4 min-w-0')
    })

    it('verifies desktop student table wrapper has min-w-0 and overflow-x-auto (xl-only with md-lg master-detail)', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('<div className="hidden xl:block w-full min-w-0 overflow-x-auto">')
    })

    it('verifies classroom quick-switch rail supports smooth touch gestures with touch-pan-x', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('pt-1 pb-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 touch-pan-x')
    })
  })

  describe('BUG-018: Settings Sections Reachability', () => {
    it('verifies SettingsControlCenter renders mobile section select picker (< md) covering all sections', async () => {
      const settingsFile = await Bun.file('src/app/app/settings/page.tsx').text()
      expect(settingsFile).toContain('id="settings-section-select"')
      expect(settingsFile).toContain("value={activeTab}")
      expect(settingsFile).toContain("1. School Profile & Localization")
      expect(settingsFile).toContain("13. My User Preferences & Glow")
    })

    it('verifies desktop and tablet tab rail includes touch-pan-x and segmented-scroll', async () => {
      const settingsFile = await Bun.file('src/app/app/settings/page.tsx').text()
      expect(settingsFile).toContain('hidden md:block segmented-scroll overflow-x-auto touch-pan-x')
    })
  })

  describe('BUG-019: Admissions Navigation Ribbon', () => {
    it('verifies AdmissionsNavigationRibbon auto-scrolls the active tab into view', async () => {
      const ribbonFile = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      expect(ribbonFile).toContain('scrollIntoView')
      expect(ribbonFile).toContain("inline: 'center'")
      expect(ribbonFile).toContain('navContainerRef')
      expect(ribbonFile).toContain('activeTabRef')
    })

    it('verifies AdmissionsNavigationRibbon provides mobile workspace select picker for compact viewports', async () => {
      const ribbonFile = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      expect(ribbonFile).toContain('id="admissions-module-select"')
      expect(ribbonFile).toContain('sm:hidden w-full')
    })
  })

  describe('BUG-020: Login in Short Landscape Viewports (667 x 375)', () => {
    it('verifies AuthShell enables full vertical scrolling with min-h-[100dvh] and overflow-y-auto', async () => {
      const shellFile = await Bun.file('src/components/auth/AuthShell.tsx').text()
      expect(shellFile).toContain('min-h-[100dvh]')
      expect(shellFile).toContain('overflow-y-auto')
    })

    it('verifies AuthViewport uses my-auto to prevent top and bottom clipping on short viewports', async () => {
      const viewportFile = await Bun.file('src/components/auth/AuthViewport.tsx').text()
      expect(viewportFile).toContain('my-auto')
    })

    it('verifies AuthBrand and AuthHeader use responsive margins for compact viewports', async () => {
      const brandFile = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      expect(brandFile).toContain('mb-4 sm:mb-6')

      const headerFile = await Bun.file('src/components/auth/AuthHeader.tsx').text()
      expect(headerFile).toContain('mb-4 sm:mb-7')
    })

    it('verifies AuthCard applies responsive padding', async () => {
      const cardFile = await Bun.file('src/components/auth/AuthCard.tsx').text()
      expect(cardFile).toContain('p-4 sm:p-8 xs:p-6')
    })

    it('verifies globals.css defines compact rules for short-height viewports (<= 540px)', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (max-height: 540px)')
      expect(globalsCss).toContain('.auth-card')
      expect(globalsCss).toContain('.auth-brand')
    })
  })

  describe('BUG-014 & BUG-016: Header Actions Row and Search Bar Isolation', () => {
    it('verifies globals.css hides top desktop search bar on mobile to prevent duplicate search (BUG-014)', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.workspace-header-main-row .workspace-search-wrap')
      expect(globalsCss).toContain('display: none !important')
    })

    it('verifies globals.css enforces display: none !important for hidden action buttons on mobile (BUG-016)', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.workspace-action-btn.hidden')
      expect(globalsCss).toContain('.workspace-actions-group .hidden')
    })
  })

  describe('BUG-021: Dock Clock Layout Stability', () => {
    it('verifies DockDateTime includes whitespace-nowrap and shrink-0 to prevent text wrapping', async () => {
      const dockFile = await Bun.file('src/components/shell/DockDateTime.tsx').text()
      expect(dockFile).toContain('whitespace-nowrap')
      expect(dockFile).toContain('shrink-0')

      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.dock-datetime')
      expect(globalsCss).toContain('white-space: nowrap')
      expect(globalsCss).toContain('flex-shrink: 0')
    })
  })

  describe('Phase 1 Un-Clip Triage: Silent Clip Elimination, Daily-Diary Table Rails, and Edge-Fade Navigation', () => {
    it('verifies globals.css replaces silent .home overflow-x:clip with overflow-x:hidden and adds rail-edge-fade & scrollbar-none', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).not.toContain('.home{\n  width:100%;\n  min-width:0;\n  display:flex;\n  flex-direction:column;\n  overflow-x:clip;')
      expect(globalsCss).toContain('.rail-edge-fade')
      expect(globalsCss).toContain('.scrollbar-none')
      expect(globalsCss).toContain('mask-image: linear-gradient(to right, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%)')
    })

    it('verifies DataTable component architecture supports minWidth and wraps table in an overflow-x-auto rail', async () => {
      const dataTableFile = await Bun.file('src/components/preone/DataTable.tsx').text()
      expect(dataTableFile).toContain('minWidth?: number | string')
      expect(dataTableFile).toContain('<div className="dtable-scroll overflow-x-auto w-full min-w-0">')
      expect(dataTableFile).toContain('minWidth: typeof minWidth ===')
    })

    it('verifies Students page sets explicit minWidth on DataTable to enforce measured horizontal scroll rail', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('minWidth={950}')
    })

    it('verifies Finance page has responsive parent/admin containers, scrollable tabs, and all 5 tables in measured min-width rails', async () => {
      const feesFile = await Bun.file('src/app/app/fees/page.tsx').text()
      // Outer containers
      expect(feesFile).toContain('w-full min-w-0 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6')
      // Admin tab navigation
      expect(feesFile).toContain('space-x-6 w-full min-w-0 overflow-x-auto scrollbar-none touch-pan-x whitespace-nowrap')
      // Measured tables
      expect(feesFile).toContain('min-w-[680px]')
      expect(feesFile).toContain('min-w-[780px]')
      expect(feesFile).toContain('min-w-[980px]')
      expect(feesFile).toContain('min-w-[880px]')
      expect(feesFile).toContain('min-w-[920px]')
    })

    it('verifies Audit Logs page wraps category views and table in responsive un-clipped rails', async () => {
      const auditFile = await Bun.file('src/app/app/audit/page.tsx').text()
      expect(auditFile).toContain('className="w-full min-w-0 max-w-full overflow-x-auto touch-pan-x scrollbar-none"')
      expect(auditFile).toContain('className="card w-full min-w-0 max-w-full overflow-hidden"')
      expect(auditFile).toContain('className="dtable-scroll overflow-x-auto w-full min-w-0"')
      expect(auditFile).toContain('className="dtable w-full min-w-[880px]"')
    })

    it('verifies Settings and Admissions ribbons integrate rail-edge-fade and auto scroll-into-view', async () => {
      const settingsFile = await Bun.file('src/app/app/settings/page.tsx').text()
      expect(settingsFile).toContain('rail-edge-fade scrollbar-none')
      expect(settingsFile).toContain('tabRailRef')
      expect(settingsFile).toContain('scrollIntoView')

      const ribbonFile = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      expect(ribbonFile).toContain('rail-edge-fade scrollbar-none')
    })
  })

  describe('Phase 2 — Header Collapse & Phone Layouts', () => {
    it('verifies responsive topbar collapses desktop search to hidden lg:flex and provides single search icon button for < lg', async () => {
      const headerFile = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(headerFile).toContain('className="workspace-search-wrap hidden lg:flex"')
      expect(headerFile).toContain('className="workspace-action-btn lg:hidden"')
      expect(headerFile).not.toContain('<div className="workspace-search-mobile-row md:hidden">')
    })

    it('verifies topbar actions collapse Help, Full-Screen, and Language below lg and moves them into profile menu', async () => {
      const headerFile = await Bun.file('src/components/shell/GlobalWorkspaceHeader.tsx').text()
      expect(headerFile).toContain('className="hidden lg:inline-flex"')
      expect(headerFile).toContain('className="hidden lg:block"')
      // Profile menu mobile additions
      expect(headerFile).toContain('className="lg:hidden"')
      expect(headerFile).toContain('Help &amp; Documentation')
      expect(headerFile).toContain('Toggle Full Screen')
      // Pinned 1-tap sign out
      expect(headerFile).toContain('title="Sign out immediately"')
    })

    it('verifies Students page header card stacks on mobile with full-width CTA and edge-fade classroom rail', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('w-full sm:w-auto flex-1 md:flex-initial')
      expect(studentsFile).toContain('touch-pan-x rail-edge-fade')
    })

    it('verifies SearchFilterBar active chips use touch-friendly edge-fade rail', async () => {
      const sfbFile = await Bun.file('src/components/preone/SearchFilterBar.tsx').text()
      expect(sfbFile).toContain('className="sfb-chips-rail rail-edge-fade scrollbar-none touch-pan-x"')
    })

    it('verifies Settings 18-tab rail becomes a Select dropdown picker with Section: ActiveName below md', async () => {
      const settingsFile = await Bun.file('src/app/app/settings/page.tsx').text()
      expect(settingsFile).toContain('Section:')
      expect(settingsFile).toContain('id="settings-section-select"')
      expect(settingsFile).toContain('md:hidden')
    })

    it('verifies login landscape defines @media (max-height: 480px) and (orientation: landscape) with <= 90vh compact card and hidden badge', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (max-height: 480px) and (orientation: landscape)')
      expect(globalsCss).toContain('max-height: 90vh !important')
      expect(globalsCss).toContain('.auth-tagline-badge')

      const brandFile = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      expect(brandFile).toContain('auth-tagline-badge')
    })

    it('verifies dock clock is time-only below xl (< 1280px) and preserves whitespace-nowrap', async () => {
      const dockFile = await Bun.file('src/components/shell/DockDateTime.tsx').text()
      expect(dockFile).toContain('hidden xl:inline')
      expect(dockFile).toContain('whitespace-nowrap')

      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (max-width: 1279px)')
      expect(globalsCss).toContain('.dock-datetime .dock-date')
      expect(globalsCss).toContain('display: none !important')
    })
  })

  describe('Phase 3 — Tablet-First Touches (768px – 1180px)', () => {
    it('verifies Students master-detail layout exists at md-lg (hidden md:grid xl:hidden) and table is xl-only', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('hidden md:grid xl:hidden grid-cols-12')
      expect(studentsFile).toContain('col-span-5 lg:col-span-4 border-r')
      expect(studentsFile).toContain('col-span-7 lg:col-span-8')
      expect(studentsFile).toContain('Student Roster')
      expect(studentsFile).toContain('hidden xl:block w-full min-w-0 overflow-x-auto')
    })

    it('verifies dock labels are restored on tablets at md (>= 768px)', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (min-width: 768px)')
      expect(globalsCss).toContain('.dock-item-label')
      expect(globalsCss).toContain('display: inline-block !important')
    })

    it('verifies Daily-Diary table includes rail-edge-fade and touch-pan-x for discoverable scrolling on portrait tablet', async () => {
      const ddFile = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      expect(ddFile).toContain('className="hidden md:block overflow-x-auto w-full min-w-0 rail-edge-fade scrollbar-none touch-pan-x"')
      expect(ddFile).toContain('min-w-[960px]')
    })

    it('verifies touch-target pass enforces >= 44px on dock chips, tab rails, and table action buttons', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.dock-item')
      expect(globalsCss).toContain('min-height: 44px !important')
      expect(globalsCss).toContain('min-width: 44px !important')
      expect(globalsCss).toContain('.segmented-scroll button')
      expect(globalsCss).toContain('.rail-edge-fade button')
      expect(globalsCss).toContain('.dt-row-actions button')
      expect(globalsCss).toContain('.dt-icon-btn')
    })
  })

  describe('Phase 4 — Large-Screen & Zoom Polish (1920px & WCAG 1.4.10 Reflow)', () => {
    it('verifies global app-content enforces max-width: 1460px and margin: 0 auto for 1920px centering', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.app-content{width:100%;max-width:1460px;margin:0 auto')
    })

    it('verifies Audit Logs page is wrapped in a centered max-w-[1460px] mx-auto container', async () => {
      const auditFile = await Bun.file('src/app/app/audit/page.tsx').text()
      expect(auditFile).toContain('w-full min-w-0 max-w-[1460px] mx-auto')
    })

    it('verifies Settings page is centered with max-w-[1460px] mx-auto', async () => {
      const settingsFile = await Bun.file('src/app/app/settings/page.tsx').text()
      expect(settingsFile).toContain('w-full min-w-0 max-w-[1460px] mx-auto page-container')
    })

    it('verifies Daily-Diary page is centered with max-w-[1460px] mx-auto', async () => {
      const ddFile = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      expect(ddFile).toContain('w-full min-w-0 max-w-[1460px] mx-auto space-y-6 pb-12')
    })

    it('verifies 2xl density bump provides roomier paddings and expands max-width to 1520px at min-width: 1536px', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (min-width: 1536px)')
      expect(globalsCss).toContain('max-width: 1520px;')
      expect(globalsCss).toContain('clamp(28px, 4vw, 56px)')
    })

    it('verifies WCAG 1.4.10 zoom reflow on short viewports (max-height: 640px) compresses padding and controls', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (max-height: 640px)')
      expect(globalsCss).toContain('padding-top: calc(var(--header-h, 56px) + 12px);')
      expect(globalsCss).toContain('padding-bottom: calc(var(--taskbar-h, 52px) + 24px);')
      expect(globalsCss).toContain('.taskbar.preone-dock')
    })
  })

  describe('Phase 5 — Guardrails & Continuous Integration (Playwright Matrix & DoD)', () => {
    it('verifies responsive audit probe tests for (a) element overflow without scrollable ancestor, (b) page h-scroll, and (c) profile button', async () => {
      const probeFile = await Bun.file('tests/e2e/responsive-probe.ts').text()
      expect(probeFile).toContain('export async function auditResponsiveProbe')
      expect(probeFile).toContain('hasPageHScroll')
      expect(probeFile).toContain('clippedElements')
      expect(probeFile).toContain('profileButtonInViewport')
      expect(probeFile).toContain('hasScrollableAncestor')
    })

    it('verifies Playwright viewport matrix covers all 7 core pages across all 9 standard viewports', async () => {
      const matrixFile = await Bun.file('tests/e2e/responsive-matrix.spec.ts').text()
      // 7 core pages
      expect(matrixFile).toContain("name: 'home'")
      expect(matrixFile).toContain("name: 'students'")
      expect(matrixFile).toContain("name: 'daily-diary'")
      expect(matrixFile).toContain("name: 'finance'")
      expect(matrixFile).toContain("name: 'admissions'")
      expect(matrixFile).toContain("name: 'settings'")
      expect(matrixFile).toContain("name: 'audit'")
      // 9 standard viewports
      expect(matrixFile).toContain('width: 320')
      expect(matrixFile).toContain('width: 390')
      expect(matrixFile).toContain('width: 667, height: 375')
      expect(matrixFile).toContain('width: 768')
      expect(matrixFile).toContain('width: 820')
      expect(matrixFile).toContain('width: 1024')
      expect(matrixFile).toContain('width: 1280')
      expect(matrixFile).toContain('width: 1440')
      expect(matrixFile).toContain('width: 1920')
      // Visual regression screenshots
      expect(matrixFile).toContain('await page.screenshot')
    })

    it('verifies CI workflow executes Playwright viewport matrix and unit test suite', async () => {
      const workflowFile = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(workflowFile).toContain('bun test tests/design-system/responsive-transformation.test.ts')
      expect(workflowFile).toContain('npx playwright test tests/e2e/responsive-matrix.spec.ts')
      expect(workflowFile).toContain('responsive-matrix-snapshots')
    })

    it('verifies Definition of Done document specifies fits 320, rails scrollable, header intact, controls reachable one-handed', async () => {
      const dodFile = await Bun.file('docs/RESPONSIVE_DEFINITION_OF_DONE.md').text()
      expect(dodFile).toContain('Fits 320 (Mobile Zero-Overflow)')
      expect(dodFile).toContain('Rails Scrollable (Managed Scroll Containers)')
      expect(dodFile).toContain('Header Intact (Collapsible Workspace Topbar)')
      expect(dodFile).toContain('Controls Reachable One-Handed (Touch Targets & Reach)')
      expect(dodFile).toContain('min-height: 44px !important')
      expect(dodFile).toContain('rail-edge-fade')
    })

    it('verifies BUG-023 fix: InventoryClient imports useMemo and CI workflow enforces React Hooks ESLint guardrail', async () => {
      const inventoryClient = await Bun.file('src/app/app/inventory/InventoryClient.tsx').text()
      expect(inventoryClient).toContain("import React, { useCallback, useEffect, useMemo, useState } from 'react'")
      expect(inventoryClient).toContain('const effectiveRoles = useMemo(')

      const eslintConfig = await Bun.file('eslint.config.mjs').text()
      expect(eslintConfig).toContain('"react-hooks/rules-of-hooks": "error"')

      const workflowFile = await Bun.file('.github/workflows/responsive-matrix.yml').text()
      expect(workflowFile).toContain('Verify React Hooks and ESLint Guardrails')
      expect(workflowFile).toContain('npx eslint src/app/app/inventory/InventoryClient.tsx')
    })
  })
})





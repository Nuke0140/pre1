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

    it('verifies desktop/tablet student table wrapper has min-w-0 and overflow-x-auto', async () => {
      const studentsFile = await Bun.file('src/app/app/students/page.tsx').text()
      expect(studentsFile).toContain('<div className="hidden md:block w-full min-w-0 overflow-x-auto">')
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
})


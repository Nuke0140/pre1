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
  })
})

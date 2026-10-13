import { describe, it, expect } from 'bun:test'

/**
 * PreOne Anti-Patterns Audit & Remediation Test Suite
 * Validates:
 * 1. Excessive Glass & Blur: Elimination of repeated backdrop-blur on dashboard KPI cards
 * 2. Layout-Triggering Animations: Chart hover transitions use composite/paint properties instead of layout
 * 3. Overly Playful Admin UI: Standardized active indicators without playful sparkles on routine navigation
 * 4. Micro-Interaction Optimization: High-frequency action buttons use targeted composited properties
 * 5. Reduced-Motion Integrity: prefers-reduced-motion block covers animations and transitions repository-wide
 * 6. Typography & Contrast: Metadata card labels use legible sizes (>= 12px) and semantic tokens
 */

describe('PreOne Anti-Patterns Audit & Remediation Test Suite', () => {
  describe('Anti-Pattern 1: Excessive Glass and Blur', () => {
    it('verifies daily-diary KPI cards do not layer repeated backdrop-blur-md filters', async () => {
      const dailyDiaryFile = await Bun.file('src/app/app/daily-diary/page.tsx').text()
      // The 7 overview KPI cards must use solid/elevated surface tokens (bg-card), not repeated backdrop-blur-md
      expect(dailyDiaryFile).not.toContain('backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm')
      expect(dailyDiaryFile).toContain('bg-card p-4 rounded-2xl border border-border/80 shadow-xs')
    })
  })

  describe('Anti-Pattern 2: Layout-Triggering Animations', () => {
    it('verifies Chart.tsx uses paint & transform properties instead of transition: all on SVG elements', async () => {
      const chartFile = await Bun.file('src/components/preone/Chart.tsx').text()
      // Should not have generic transition: all on circles and rects
      expect(chartFile).not.toContain("style={{ transition: 'all 0.15s ease' }}")
      // Should use paint/composite properties
      expect(chartFile).toContain("transition: 'r 0.15s ease, fill 0.15s ease, stroke-width 0.15s ease'")
    })
  })

  describe('Anti-Pattern 3: Overly Playful Admin UI', () => {
    it('verifies AdmissionsNavigationRibbon standardizes active indicators without playful sparkles on confirmed admissions', async () => {
      const ribbonFile = await Bun.file('src/components/admissions/AdmissionsNavigationRibbon.tsx').text()
      // Should not render an animated Lucide Sparkle as a tab active indicator
      expect(ribbonFile).not.toContain('<Sparkles size={12} className="text-emerald-500 animate-pulse shrink-0" />')
      // Active indicator should be standardized
      expect(ribbonFile).toContain('rounded-full ${theme.activeDot} animate-pulse shrink-0')
    })
  })

  describe('Anti-Pattern 4 & 5: High-Frequency Interactions & Reduced-Motion', () => {
    it('verifies FastRollCall action buttons use targeted transition properties rather than transition-all', async () => {
      const rollCallFile = await Bun.file('src/components/preone/FastRollCall.tsx').text()
      expect(rollCallFile).toContain('transition-[color,background-color,border-color,transform,box-shadow]')
    })

    it('verifies global reduced-motion overrides cover all animations and transitions', async () => {
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('@media (prefers-reduced-motion: reduce)')
      expect(globalsCss).toContain('animation-duration: 0.01ms !important;')
      expect(globalsCss).toContain('transition-duration: 0.01ms !important;')
    })
  })

  describe('Anti-Pattern 6: Small Text and Insufficient Contrast', () => {
    it('verifies User360Drawer metadata labels use readable 12px font and semantic muted tokens', async () => {
      const drawerFile = await Bun.file('src/components/users/User360Drawer.tsx').text()
      expect(drawerFile).toContain('text-muted-foreground block text-xs font-semibold uppercase tracking-wider')
      expect(drawerFile).not.toContain('text-gray-400 block text-[10px] uppercase">Employee Code</span>')
    })
  })
})

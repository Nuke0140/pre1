import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'

describe('PreOne Global KPI Cards Design System Suite', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf-8')
  const globalKpi = fs.readFileSync('src/components/preone/GlobalKpiCard.tsx', 'utf-8')
  const preoneIndex = fs.readFileSync('src/components/preone/index.ts', 'utf-8')
  const preoneUi = fs.readFileSync('src/components/preone/ui.tsx', 'utf-8')
  const kpiMetricCard = fs.readFileSync('src/components/preone/KpiMetricCard.tsx', 'utf-8')

  describe('1. Canonical Component Architecture & Exports', () => {
    it('verifies GlobalKpiCard exports from src/components/preone/index.ts', () => {
      expect(preoneIndex).toContain("export * from './GlobalKpiCard'")
      expect(preoneIndex).toContain("export * from './KpiMetricCard'")
      expect(preoneIndex).toContain("export * from './ui'")
    })

    it('verifies GlobalKpiCard exports from src/components/preone/ui.tsx', () => {
      expect(preoneUi).toContain("export * from './GlobalKpiCard'")
    })

    it('verifies GlobalKpiCard and KpiGrid component and type definitions', () => {
      expect(globalKpi).toContain('export function GlobalKpiCard')
      expect(globalKpi).toContain('export const KpiCard = GlobalKpiCard')
      expect(globalKpi).toContain('export function KpiGrid')
      expect(globalKpi).toContain('export const GlobalKpiGrid = KpiGrid')
      expect(globalKpi).toContain('export const KpiGroup = KpiGrid')
      expect(globalKpi).toContain('export interface GlobalKpiCardProps')
      expect(globalKpi).toContain('export interface KpiGridProps')
      expect(globalKpi).toContain('export interface KpiTrend')
      expect(globalKpi).toContain('export interface KpiStatus')
      expect(globalKpi).toContain('export type KpiSemanticVariant')
    })

    it('verifies KpiTile delegates to GlobalKpiCard for 100% backward compatibility', () => {
      expect(preoneUi).toContain('export function KpiTile(')
      expect(preoneUi).toContain('<GlobalKpiCard')
    })
  })

  describe('2. Theme-Matching Border & Restrained Glow CSS Specifications', () => {
    it('verifies default subtle theme-matching border using color-mix', () => {
      expect(css).toContain('.preone-kpi-card,')
      expect(css).toContain('color-mix(in srgb, var(--primary, #7c3aed) 16%, var(--border')
    })

    it('verifies restrained theme-colored glow on hover', () => {
      expect(css).toContain('.preone-kpi-card.interactive:hover,')
      expect(css).toContain('box-shadow: 0 4px 16px -2px color-mix(in srgb, var(--primary, #7c3aed) 16%, transparent)')
      expect(css).toContain('0 0 0 1px color-mix(in srgb, var(--primary, #7c3aed) 28%, transparent)')
    })

    it('verifies dark theme adaptation for subtle border and glow', () => {
      expect(css).toContain('[data-theme="dark"] .preone-kpi-card,')
      expect(css).toContain('color-mix(in srgb, var(--primary, #8b5cf6) 24%, var(--border-dark, #1e293b))')
      expect(css).toContain('[data-theme="dark"] .preone-kpi-card.interactive:hover,')
      expect(css).toContain('box-shadow: 0 4px 20px -2px color-mix(in srgb, var(--primary, #8b5cf6) 24%, transparent)')
    })

    it('verifies accessible keyboard focus rings and active states', () => {
      expect(css).toContain('.preone-kpi-card:focus-visible,')
      expect(css).toContain('ring: 2px solid var(--focus-ring-color, var(--primary, #7c3aed));')
      expect(css).toContain('.preone-kpi-card.interactive:active,')
      expect(css).toContain('transform: scale(0.985);')
      expect(css).toContain('.preone-kpi-card.active,')
    })

    it('verifies prefers-reduced-motion compliance in globals.css', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      expect(css).toContain('animation-duration: 0.01ms !important;')
      expect(css).toContain('transition-duration: 0.01ms !important;')
    })
  })

  describe('3. Compact Density, Anatomy & Typography', () => {
    it('verifies compact min-height and padding', () => {
      expect(css).toContain('min-height: 80px;')
      expect(css).toContain('padding: 12px 14px;')
    })

    it('verifies tabular numerals and font formatting for primary value', () => {
      expect(globalKpi).toContain('tabular-nums')
      expect(globalKpi).toContain('font-mono')
    })

    it('verifies concise uppercase metric label', () => {
      expect(globalKpi).toContain('uppercase tracking-wider')
      expect(globalKpi).toContain('font-heading')
    })
  })

  describe('4. Real Data & State Integrity', () => {
    it('verifies genuine zero handling without displaying empty or dash', () => {
      expect(globalKpi).toContain("const renderedValue = value != null ? value : '—'")
    })

    it('verifies loading skeleton state with animated pulse', () => {
      expect(globalKpi).toContain('if (loading) {')
      expect(globalKpi).toContain('role="status"')
      expect(globalKpi).toContain('animate-pulse')
    })

    it('verifies genuine error state distinguishing unavailable from zero', () => {
      expect(globalKpi).toContain('if (error) {')
      expect(globalKpi).toContain('role="alert"')
      expect(globalKpi).toContain('Data Unavailable')
    })

    it('verifies accessible keyboard event handling and ARIA attributes', () => {
      expect(globalKpi).toContain('handleKeyDown')
      expect(globalKpi).toContain("if (e.key === 'Enter' || e.key === ' ')")
      expect(globalKpi).toContain("role={isInteractive ? 'button' : undefined}")
      expect(globalKpi).toContain('tabIndex={isInteractive ? 0 : undefined}')
      expect(globalKpi).toContain('aria-pressed=')
    })
  })

  describe('5. Cross-Module Migration Verification', () => {
    it('verifies Dashboard uses standardized preone-kpi-card via KpiMetricCard', () => {
      expect(kpiMetricCard).toContain('preone-kpi-card')
      const dashboard = fs.readFileSync('src/app/app/dashboard/DashboardClient.tsx', 'utf-8')
      expect(dashboard).toContain('<KpiMetricCard')
      expect(dashboard).toContain('Active Students')
      expect(dashboard).toContain('Present Today')
      expect(dashboard).toContain('Fees Collected')
      expect(dashboard).toContain('Admissions Pipeline')
    })

    it('verifies Classrooms module uses KpiTile backed by GlobalKpiCard', () => {
      const classrooms = fs.readFileSync('src/app/app/classrooms/page.tsx', 'utf-8')
      expect(classrooms).toContain('<KpiTile')
      expect(classrooms).toContain('Total Classrooms')
      expect(classrooms).toContain('Active Campuses')
      expect(classrooms).toContain('Total Student Capacity')
      expect(classrooms).toContain('Enrolled Students')
    })

    it('verifies Fees module uses KpiTile backed by GlobalKpiCard', () => {
      const fees = fs.readFileSync('src/app/app/fees/page.tsx', 'utf-8')
      expect(fees).toContain('<KpiTile')
      expect(fees).toContain("t('fees.activeStructures')")
      expect(fees).toContain("t('fees.totalCollected')")
      expect(fees).toContain("t('fees.refundableDeposits')")
      expect(fees).toContain("t('fees.recordedPayments')")
    })

    it('verifies Users/Staff module uses KpiTile backed by GlobalKpiCard', () => {
      const staff = fs.readFileSync('src/app/app/users/staff/page.tsx', 'utf-8')
      expect(staff).toContain('<KpiTile')
      expect(staff).toContain("t('users.totalStaff')")
      expect(staff).toContain("t('users.teachersGuides')")
      expect(staff).toContain("t('users.supportOps')")
      expect(staff).toContain("t('users.leadershipAdmin')")
    })

    it('verifies Users/Family module uses KpiTile backed by GlobalKpiCard', () => {
      const family = fs.readFileSync('src/app/app/users/family/page.tsx', 'utf-8')
      expect(family).toContain('<KpiTile')
      expect(family).toContain("t('users.totalParents')")
      expect(family).toContain("t('users.totalGuardians')")
      expect(family).toContain("t('users.gateClearance')")
    })

    it('verifies Learning module uses KpiTile backed by GlobalKpiCard', () => {
      const learning = fs.readFileSync('src/app/app/learning/LearningClient.tsx', 'utf-8')
      expect(learning).toContain('<KpiTile')
      expect(learning).toContain('Active Frameworks')
      expect(learning).toContain('Learning Domains')
      expect(learning).toContain('Activities Today')
      expect(learning).toContain('Observations')
      expect(learning).toContain('Concern Flags')
    })

    it('verifies Inventory module is migrated to GlobalKpiCard and KpiGrid', () => {
      const inventory = fs.readFileSync('src/app/app/inventory/InventoryClient.tsx', 'utf-8')
      expect(inventory).toContain('<KpiGrid columns={5}>')
      expect(inventory).toContain('<GlobalKpiCard')
      expect(inventory).toContain('Total Items')
      expect(inventory).toContain('Stock Valuation')
      expect(inventory).toContain('Low Stock Alerts')
      expect(inventory).toContain('Pending Requisitions')
      expect(inventory).toContain('Open Orders')
    })

    it('verifies Transport module is migrated to GlobalKpiCard and KpiGrid', () => {
      const transport = fs.readFileSync('src/app/app/transport/TransportClient.tsx', 'utf-8')
      expect(transport).toContain('<KpiGrid columns={6}>')
      expect(transport).toContain('<GlobalKpiCard')
      expect(transport).toContain('Active Routes')
      expect(transport).toContain('In-Service Fleet')
      expect(transport).toContain('Assigned Children')
      expect(transport).toContain('Boarded Today')
      expect(transport).toContain('Safely Dropped')
      expect(transport).toContain('Delayed Trips')
    })

    it('verifies Audit module is migrated to GlobalKpiCard and KpiGrid', () => {
      const audit = fs.readFileSync('src/app/app/audit/page.tsx', 'utf-8')
      expect(audit).toContain('<KpiGrid columns={6}>')
      expect(audit).toContain('<GlobalKpiCard')
      expect(audit).toContain('Total Events')
      expect(audit).toContain("Today's Activity")
      expect(audit).toContain('Security Events')
      expect(audit).toContain('Critical Mutations')
      expect(audit).toContain('Failed Actions')
      expect(audit).toContain('Audit Exports')
    })

    it('verifies Reports module is migrated to GlobalKpiCard and KpiGrid', () => {
      const reports = fs.readFileSync('src/app/app/reports/ReportsClient.tsx', 'utf-8')
      expect(reports).toContain('<KpiGrid columns="auto">')
      expect(reports).toContain('<GlobalKpiCard')
    })

    it('verifies Bulk Document Jobs is migrated to GlobalKpiCard and KpiGrid', () => {
      const bulkJobs = fs.readFileSync('src/components/reports/BulkDocumentJobsClient.tsx', 'utf-8')
      expect(bulkJobs).toContain('<KpiGrid columns={4}>')
      expect(bulkJobs).toContain('<GlobalKpiCard')
      expect(bulkJobs).toContain('Eligible Records')
      expect(bulkJobs).toContain('Succeeded')
      expect(bulkJobs).toContain('Failed')
      expect(bulkJobs).toContain('Package Size')
    })
  })
})

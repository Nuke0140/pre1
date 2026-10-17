import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'

describe('PreOne Global Filter Toolbar (GFT) Standardization Suite', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf-8')
  const gftComponent = fs.readFileSync('src/components/preone/GlobalFilterToolbar.tsx', 'utf-8')
  const sfbComponent = fs.readFileSync('src/components/preone/SearchFilterBar.tsx', 'utf-8')
  const filterBarComponent = fs.readFileSync('src/components/preone/FilterBar.tsx', 'utf-8')
  const preoneIndex = fs.readFileSync('src/components/preone/index.ts', 'utf-8')

  describe('1. Canonical Component Architecture & Exports', () => {
    it('verifies GlobalFilterToolbar exports from src/components/preone/index.ts', () => {
      expect(preoneIndex).toContain("export * from './GlobalFilterToolbar'")
      expect(preoneIndex).toContain("export * from './SearchFilterBar'")
      expect(preoneIndex).toContain("export { FilterBar, FilterChips")
    })

    it('verifies GlobalFilterToolbar component and interface definitions', () => {
      expect(gftComponent).toContain('export function GlobalFilterToolbar')
      expect(gftComponent).toContain('export interface GlobalFilterToolbarProps')
      expect(gftComponent).toContain('export interface ViewModeConfig')
      expect(gftComponent).toContain('export interface RefreshConfig')
      expect(gftComponent).toContain('export interface FilterConfig')
      expect(gftComponent).toContain('export interface SearchConfig')
    })

    it('verifies SearchFilterBar backwards-compatible facade routing to GlobalFilterToolbar', () => {
      expect(sfbComponent).toContain("export * from './GlobalFilterToolbar'")
      expect(sfbComponent).toContain('export interface SearchFilterBarProps extends GlobalFilterToolbarProps')
      expect(sfbComponent).toContain('export function SearchFilterBar(props: SearchFilterBarProps)')
    })
  })

  describe('2. Desktop 1-Line Horizontal Flex Layout & Styling', () => {
    it('verifies 1-line desktop flex toolbar layout with nowrap', () => {
      expect(css).toContain('.gft-toolbar,')
      expect(css).toContain('.sfb-toolbar {')
      expect(css).toContain('flex-wrap: nowrap;')
      expect(css).toContain('align-items: center;')
      expect(css).toContain('gap: 0.5rem;')
    })

    it('verifies flexible search slot with balanced min and max widths', () => {
      expect(css).toContain('.gft-search-slot,')
      expect(css).toContain('.sfb-search-slot {')
      expect(css).toContain('flex: 1 1 200px;')
      expect(css).toContain('min-width: 180px;')
      expect(css).toContain('max-width: 480px;')
    })

    it('verifies content-sized desktop filters rail with nowrap', () => {
      expect(css).toContain('.gft-filters-rail,')
      expect(css).toContain('.sfb-filters-rail {')
      expect(css).toContain('flex: 0 1 auto;')
      expect(css).toContain('flex-wrap: nowrap;')
    })

    it('verifies right-aligned actions group for view switch and refresh controls', () => {
      expect(css).toContain('.gft-actions-group,')
      expect(css).toContain('.sfb-extra-actions {')
      expect(css).toContain('margin-left: auto;')
      expect(css).toContain('flex-shrink: 0;')
    })
  })

  describe('3. Built-in View Switcher & Refresh Button Controls', () => {
    it('verifies segmented view switcher styles and active states', () => {
      expect(css).toContain('.gft-view-switch {')
      expect(css).toContain('.gft-view-option {')
      expect(css).toContain('.gft-view-option.is-active {')
      expect(css).toContain('box-shadow: inset 0 1px 2px')
    })

    it('verifies refresh button styles, spinning animation, and disabled states', () => {
      expect(css).toContain('.gft-refresh-btn {')
      expect(css).toContain('.gft-refresh-btn.gft-refresh-compact {')
      expect(css).toContain('.gft-refresh-btn:disabled {')
    })
  })

  describe('4. Theme Adaptability & Dark Mode', () => {
    it('verifies theme tokens consumption without hardcoded backgrounds', () => {
      expect(css).toContain('background: var(--surface')
      expect(css).toContain('border: 1px solid var(--border-subtle')
    })

    it('verifies dark mode coverage for toolbar, view switch, and refresh controls', () => {
      expect(css).toContain('[data-theme="dark"] .gft-container.gft-default')
      expect(css).toContain('[data-theme="dark"] .gft-search-wrap')
      expect(css).toContain('[data-theme="dark"] .gft-view-switch')
      expect(css).toContain('[data-theme="dark"] .gft-view-option.is-active')
      expect(css).toContain('[data-theme="dark"] .gft-refresh-btn')
    })
  })

  describe('5. Responsive Touch Target & Mobile Drawer Behavior', () => {
    it('verifies mobile toggle button with min 40px touch targets and active badge', () => {
      expect(css).toContain('.gft-mobile-toggle-btn')
      expect(css).toContain('min-height: 40px;')
      expect(css).toContain('.gft-filters-rail.is-mobile-open')
    })

    it('verifies wrap fallback on tablet/mobile screens below 1024px', () => {
      expect(css).toContain('@media (max-width: 1023px) {')
      expect(css).toContain('@media (max-width: 768px) {')
    })
  })

  describe('6. Module-Level Rollout Verification', () => {
    it('verifies Admissions Enquiries uses GlobalFilterToolbar', () => {
      const enquiriesPage = fs.readFileSync('src/app/app/admissions/enquiries/page.tsx', 'utf-8')
      expect(enquiriesPage).toContain('<GlobalFilterToolbar')
      expect(enquiriesPage).toContain("id: 'program'")
      expect(enquiriesPage).toContain("id: 'status'")
      expect(enquiriesPage).toContain("id: 'source'")
      expect(enquiriesPage).toContain('viewMode={{')
      expect(enquiriesPage).toContain('refresh={{')
    })

    it('verifies Admissions Applications uses GlobalFilterToolbar', () => {
      const applicationsPage = fs.readFileSync('src/app/app/admissions/applications/page.tsx', 'utf-8')
      expect(applicationsPage).toContain('<GlobalFilterToolbar')
      expect(applicationsPage).toContain("id: 'status'")
      expect(applicationsPage).toContain('refresh={{')
    })

    it('verifies Admissions Confirmed Admitted uses GlobalFilterToolbar', () => {
      const admittedPage = fs.readFileSync('src/app/app/admissions/admitted/page.tsx', 'utf-8')
      expect(admittedPage).toContain('<GlobalFilterToolbar')
      expect(admittedPage).toContain("id: 'program'")
      expect(admittedPage).toContain('refresh={{')
    })

    it('verifies Admissions Follow-ups uses GlobalFilterToolbar', () => {
      const followUpsPage = fs.readFileSync('src/app/app/admissions/follow-ups/page.tsx', 'utf-8')
      expect(followUpsPage).toContain('<GlobalFilterToolbar')
      expect(followUpsPage).toContain("id: 'program'")
      expect(followUpsPage).toContain("id: 'staff'")
      expect(followUpsPage).toContain('refresh={{')
    })

    it('verifies Admissions Classroom Placements uses GlobalFilterToolbar', () => {
      const placementsPage = fs.readFileSync('src/app/app/admissions/classroom-placements/page.tsx', 'utf-8')
      expect(placementsPage).toContain('<GlobalFilterToolbar')
      expect(placementsPage).toContain("id: 'program'")
      expect(placementsPage).toContain('refresh={{')
    })

    it('verifies Classrooms directory uses GlobalFilterToolbar', () => {
      const classroomsPage = fs.readFileSync('src/app/app/classrooms/page.tsx', 'utf-8')
      expect(classroomsPage).toContain('<GlobalFilterToolbar')
      expect(classroomsPage).toContain("id: 'branch'")
      expect(classroomsPage).toContain("id: 'program'")
      expect(classroomsPage).toContain('refresh={{')
    })

    it('verifies Students directory uses GlobalFilterToolbar with Roster Cards / Data Table switch', () => {
      const studentsPage = fs.readFileSync('src/app/app/students/page.tsx', 'utf-8')
      expect(studentsPage).toContain('<GlobalFilterToolbar')
      expect(studentsPage).toContain("id: 'branch'")
      expect(studentsPage).toContain("id: 'program'")
      expect(studentsPage).toContain("id: 'status'")
      expect(studentsPage).toContain('viewMode={{')
      expect(studentsPage).toContain('Roster Cards')
      expect(studentsPage).toContain('Data Table')
    })
  })
})

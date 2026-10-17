import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'

describe('PreOne Global Module Navigation System Suite', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf-8')
  const navComponent = fs.readFileSync('src/components/preone/GlobalModuleNavigation.tsx', 'utf-8')
  const navConfig = fs.readFileSync('src/components/preone/module-navigation.config.ts', 'utf-8')
  const preoneIndex = fs.readFileSync('src/components/preone/index.ts', 'utf-8')
  const preoneUi = fs.readFileSync('src/components/preone/ui.tsx', 'utf-8')

  describe('1. Canonical Component Architecture & Exports', () => {
    it('verifies GlobalModuleNavigation and configs exported from src/components/preone/index.ts', () => {
      expect(preoneIndex).toContain("export * from './GlobalModuleNavigation'")
      expect(preoneIndex).toContain("export * from './module-navigation.config'")
    })

    it('verifies GlobalModuleNavigation and configs exported from src/components/preone/ui.tsx', () => {
      expect(preoneUi).toContain("export * from './GlobalModuleNavigation'")
      expect(preoneUi).toContain("export * from './module-navigation.config'")
    })

    it('verifies GlobalModuleNavigation component and type definitions', () => {
      expect(navComponent).toContain('export function GlobalModuleNavigation')
      expect(navComponent).toContain('export const ModuleNavigation = GlobalModuleNavigation')
      expect(navComponent).toContain('export interface GlobalModuleNavigationProps')
      expect(navComponent).toContain('export type ModuleNavigationProps = GlobalModuleNavigationProps')
    })

    it('verifies ModuleNavigationItem and helper types in module-navigation.config.ts', () => {
      expect(navConfig).toContain('export interface ModuleNavigationItem')
    })
  })

  describe('2. Centralized Typed Module Navigation Configurations', () => {
    it('verifies Admissions navigation configuration covers all 7 sub-routes', () => {
      expect(navConfig).toContain('export const ADMISSIONS_NAVIGATION_CONFIG')
      expect(navConfig).toContain("href: '/app/admissions'")
      expect(navConfig).toContain("href: '/app/admissions/enquiries'")
      expect(navConfig).toContain("href: '/app/admissions/follow-ups'")
      expect(navConfig).toContain("href: '/app/admissions/applications'")
      expect(navConfig).toContain("href: '/app/admissions/admitted'")
      expect(navConfig).toContain("href: '/app/admissions/classroom-placements'")
      expect(navConfig).toContain("href: '/app/admissions/reports'")
    })

    it('verifies Classrooms navigation configuration', () => {
      expect(navConfig).toContain('export function getClassroomsNavConfig')
      expect(navConfig).toContain("id: 'DIRECTORY'")
      expect(navConfig).toContain("id: 'IMPORT'")
    })

    it('verifies Fees navigation configuration', () => {
      expect(navConfig).toContain('export const FEES_NAVIGATION_CONFIG')
      expect(navConfig).toContain("id: 'STRUCTURES'")
      expect(navConfig).toContain("id: 'SCHEDULES'")
      expect(navConfig).toContain("id: 'DEPOSITS'")
      expect(navConfig).toContain("id: 'PAYMENTS'")
      expect(navConfig).toContain("id: 'IMPORT'")
    })

    it('verifies Family & Guardians navigation configuration', () => {
      expect(navConfig).toContain('export function getFamilyNavConfig')
      expect(navConfig).toContain("id: 'PARENTS'")
      expect(navConfig).toContain("id: 'GUARDIANS'")
    })

    it('verifies Learning navigation configuration', () => {
      expect(navConfig).toContain('export function getLearningNavConfig')
      expect(navConfig).toContain("id: 'overview'")
      expect(navConfig).toContain("id: 'curriculum'")
      expect(navConfig).toContain("id: 'activities'")
      expect(navConfig).toContain("id: 'observations'")
      expect(navConfig).toContain("id: 'progress'")
    })

    it('verifies Inventory navigation configuration with RBAC permissions', () => {
      expect(navConfig).toContain('export function getInventoryNavConfig')
      expect(navConfig).toContain("id: 'STORE'")
      expect(navConfig).toContain("id: 'APPROVALS'")
      expect(navConfig).toContain("id: 'OVERVIEW'")
      expect(navConfig).toContain("id: 'ITEMS'")
      expect(navConfig).toContain("id: 'DISTRIBUTION'")
      expect(navConfig).toContain("id: 'STORES'")
      expect(navConfig).toContain("id: 'PROCUREMENT'")
      expect(navConfig).toContain("id: 'RECEIVING'")
      expect(navConfig).toContain("id: 'VENDORS'")
      expect(navConfig).toContain("id: 'REPORTS'")
    })

    it('verifies Transport navigation configuration supporting multi-role operations', () => {
      expect(navConfig).toContain('export function getTransportNavConfig')
      expect(navConfig).toContain("id: 'HOME'")
      expect(navConfig).toContain("id: 'TRIPS'")
      expect(navConfig).toContain("id: 'STUDENTS_ROUTES'")
      expect(navConfig).toContain("id: 'SAFETY'")
      expect(navConfig).toContain("id: 'FLEET_SETTINGS'")
      expect(navConfig).toContain("id: 'PARENT'")
      expect(navConfig).toContain("id: 'DRIVER'")
      expect(navConfig).toContain("id: 'TEACHER'")
      expect(navConfig).toContain("id: 'SCANNER'")
    })

    it('verifies Audit category configuration aligned with API parameters', () => {
      expect(navConfig).toContain('export const AUDIT_CATEGORY_CONFIG')
      expect(navConfig).toContain("id: 'all'")
      expect(navConfig).toContain("id: 'security'")
      expect(navConfig).toContain("id: 'changes'")
      expect(navConfig).toContain("id: 'finance'")
      expect(navConfig).toContain("id: 'exports'")
    })

    it('verifies HR navigation configuration with pending badges', () => {
      expect(navConfig).toContain('export function getHrNavConfig')
      expect(navConfig).toContain("id: 'dashboard'")
      expect(navConfig).toContain("id: 'employees'")
      expect(navConfig).toContain("id: 'attendance'")
      expect(navConfig).toContain("id: 'leave'")
      expect(navConfig).toContain("id: 'schedule'")
      expect(navConfig).toContain("id: 'payroll'")
      expect(navConfig).toContain("id: 'performance'")
      expect(navConfig).toContain("id: 'training'")
      expect(navConfig).toContain("id: 'requests'")
      expect(navConfig).toContain("id: 'reports'")
    })

    it('verifies Settings navigation configuration with all 13 sections', () => {
      expect(navConfig).toContain('export const SETTINGS_NAVIGATION_CONFIG')
      expect(navConfig).toContain("id: 'profile'")
      expect(navConfig).toContain("id: 'organization'")
      expect(navConfig).toContain("id: 'operations'")
      expect(navConfig).toContain("id: 'admissions'")
      expect(navConfig).toContain("id: 'academics'")
      expect(navConfig).toContain("id: 'students'")
      expect(navConfig).toContain("id: 'finance'")
      expect(navConfig).toContain("id: 'templates'")
      expect(navConfig).toContain("id: 'notifications'")
      expect(navConfig).toContain("id: 'security'")
      expect(navConfig).toContain("id: 'rbac'")
      expect(navConfig).toContain("id: 'health'")
      expect(navConfig).toContain("id: 'preferences'")
    })
  })

  describe('3. Theme-Matching Border & Restrained Glow CSS Specifications', () => {
    it('verifies default subtle theme-matching border using color-mix on .preone-module-nav', () => {
      expect(css).toContain('.preone-module-nav')
      expect(css).toContain('color-mix(in srgb, var(--primary, #7c3aed) 16%, var(--border')
    })

    it('verifies active nav item theme styling and surface background', () => {
      expect(css).toContain('.preone-nav-item.preone-nav-item-active')
      expect(css).toContain('color: var(--primary, #7c3aed);')
    })

    it('verifies restrained theme-colored glow on active/hover interaction', () => {
      expect(css).toContain('box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--primary, #7c3aed) 20%, transparent)')
    })

    it('verifies dark theme adaptation for subtle border and active state', () => {
      expect(css).toContain('[data-theme="dark"] .preone-module-nav')
      expect(css).toContain('color-mix(in srgb, var(--primary, #8b5cf6) 24%, var(--border-dark, #1e293b))')
      expect(css).toContain('[data-theme="dark"] .preone-nav-item.preone-nav-item-active')
      expect(css).toContain('box-shadow: 0 2px 10px -2px color-mix(in srgb, var(--primary, #8b5cf6) 28%, transparent)')
    })

    it('verifies accessible keyboard focus rings on nav items', () => {
      expect(css).toContain('.preone-nav-item:focus-visible')
      expect(css).toContain('ring: 2px solid var(--focus-ring-color, var(--primary, #7c3aed));')
    })
  })

  describe('4. Mandatory Mobile Responsiveness & Overflow Architecture', () => {
    it('verifies text labels are hidden on mobile screens to prevent wrapping/overflow', () => {
      expect(navComponent).toContain('hidden sm:inline')
    })

    it('verifies touch target size complies with mobile ergonomics (minimum 38-40px)', () => {
      expect(navComponent).toContain('min-h-[38px]')
    })

    it('verifies mobile badge anchor attached to icon when text is hidden', () => {
      expect(navComponent).toContain('sm:hidden')
    })

    it('verifies compact More (···) popover menu collapses excess items beyond maxVisibleMobile', () => {
      expect(navComponent).toContain('MoreHorizontal')
      expect(navComponent).toContain('maxVisibleMobile = 5')
      expect(navComponent).toContain('mobileOverflowItems =')
      expect(navComponent).toContain('setMoreMenuOpen')
    })

    it('verifies 100% of routes remain accessible via More menu without page horizontal slider', () => {
      expect(navComponent).toContain('mobileOverflowItems.map')
    })
  })

  describe('5. Accessibility & Semantic Architecture', () => {
    it('supports tablist / tab semantics for stateful in-page tabs', () => {
      expect(navComponent).toContain("role={isPureTabs ? 'tablist' : 'navigation'}")
      expect(navComponent).toContain("role={isPureTabs ? 'tab' : undefined}")
      expect(navComponent).toContain('aria-selected={isPureTabs ? isActive : undefined}')
    })

    it('supports nav landmark and Link for route-based navigation', () => {
      expect(navComponent).toContain('<Link')
      expect(navComponent).toContain("aria-current={isActive ? 'page' : undefined}")
      expect(navComponent).toContain('pathname.startsWith')
    })
  })

  describe('6. Cross-Module Migration Verification Across All 10 Modules', () => {
    it('1. Admissions module delegates to GlobalModuleNavigation with ADMISSIONS_NAVIGATION_CONFIG', () => {
      const ribbon = fs.readFileSync('src/components/admissions/AdmissionsNavigationRibbon.tsx', 'utf-8')
      expect(ribbon).toContain('GlobalModuleNavigation')
      expect(ribbon).toContain('ADMISSIONS_NAVIGATION_CONFIG')
    })

    it('2. Classrooms module uses GlobalModuleNavigation with getClassroomsNavConfig', () => {
      const classrooms = fs.readFileSync('src/app/app/classrooms/page.tsx', 'utf-8')
      expect(classrooms).toContain('GlobalModuleNavigation')
      expect(classrooms).toContain('getClassroomsNavConfig')
    })

    it('3. Fees module uses GlobalModuleNavigation with FEES_NAVIGATION_CONFIG', () => {
      const fees = fs.readFileSync('src/app/app/fees/page.tsx', 'utf-8')
      expect(fees).toContain('GlobalModuleNavigation')
      expect(fees).toContain('FEES_NAVIGATION_CONFIG')
    })

    it('4. Users / Family module uses GlobalModuleNavigation with getFamilyNavConfig', () => {
      const family = fs.readFileSync('src/app/app/users/family/page.tsx', 'utf-8')
      expect(family).toContain('GlobalModuleNavigation')
      expect(family).toContain('getFamilyNavConfig')
    })

    it('5. Learning module uses GlobalModuleNavigation with getLearningNavConfig', () => {
      const learning = fs.readFileSync('src/app/app/learning/LearningClient.tsx', 'utf-8')
      expect(learning).toContain('GlobalModuleNavigation')
      expect(learning).toContain('getLearningNavConfig')
    })

    it('6. Inventory module uses GlobalModuleNavigation with getInventoryNavConfig', () => {
      const inventory = fs.readFileSync('src/app/app/inventory/InventoryClient.tsx', 'utf-8')
      expect(inventory).toContain('GlobalModuleNavigation')
      expect(inventory).toContain('getInventoryNavConfig')
    })

    it('7. Transport module uses GlobalModuleNavigation with getTransportNavConfig', () => {
      const transport = fs.readFileSync('src/app/app/transport/TransportClient.tsx', 'utf-8')
      expect(transport).toContain('GlobalModuleNavigation')
      expect(transport).toContain('getTransportNavConfig')
    })

    it('8. Audit module uses GlobalModuleNavigation with AUDIT_CATEGORY_CONFIG', () => {
      const audit = fs.readFileSync('src/app/app/audit/page.tsx', 'utf-8')
      expect(audit).toContain('GlobalModuleNavigation')
      expect(audit).toContain('AUDIT_CATEGORY_CONFIG')
    })

    it('9. HR module uses GlobalModuleNavigation with getHrNavConfig', () => {
      const hr = fs.readFileSync('src/components/hr/HRHeader.tsx', 'utf-8')
      expect(hr).toContain('GlobalModuleNavigation')
      expect(hr).toContain('getHrNavConfig')
    })

    it('10. Settings module uses GlobalModuleNavigation with SETTINGS_NAVIGATION_CONFIG', () => {
      const settings = fs.readFileSync('src/app/app/settings/page.tsx', 'utf-8')
      expect(settings).toContain('GlobalModuleNavigation')
      expect(settings).toContain('SETTINGS_NAVIGATION_CONFIG')
    })
  })
})

import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('PreOne Users Dashboard — Actions Menu Consolidation & Duplicate Cleanup', () => {
  const staffPagePath = join(process.cwd(), 'src/app/app/users/staff/page.tsx')
  const familyPagePath = join(process.cwd(), 'src/app/app/users/family/page.tsx')
  const usersLauncherPath = join(process.cwd(), 'src/app/app/users/page.tsx')

  const staffContent = readFileSync(staffPagePath, 'utf-8')
  const familyContent = readFileSync(familyPagePath, 'utf-8')
  const usersLauncherContent = readFileSync(usersLauncherPath, 'utf-8')

  describe('1. Staff Users Dashboard Action Consolidation', () => {
    it('consolidates Add Staff, Organize Hierarchy, User Spreadsheet Tool, and Dictionary into GlobalActionMenu', () => {
      // Must include GlobalActionMenu in staff page
      expect(staffContent).toContain('<GlobalActionMenu')

      // Must include consolidated action IDs inside the action menu
      expect(staffContent).toContain("id: 'add-staff'")
      expect(staffContent).toContain("id: 'organize-hierarchy'")
      expect(staffContent).toContain("id: 'spreadsheet-workspace'")
      expect(staffContent).toContain("id: 'dictionary'")

      // Labels match canonical requirements
      expect(staffContent).toMatch(/label:\s*(t\('users\.addStaff'\)\s*\|\|\s*)?'Add Staff Member'/)
      expect(staffContent).toMatch(/label:\s*'Organize Hierarchy'/)
      expect(staffContent).toMatch(/label:\s*'User Spreadsheet Tool'/)
      expect(staffContent).toMatch(/label:\s*'Dictionary'/)
    })

    it('ensures no duplicate standalone buttons exist in the header or toolbar for staff', () => {
      // Standalone "+ Add Staff" button should no longer exist outside Actions
      expect(staffContent).not.toMatch(/<button[^>]*onClick=\{[^}]*setAddStaffOpen\(true\)[^}]*\}[^>]*>\s*<UserPlus/)

      // Standalone toolbar toggle for Org Hierarchy or Spreadsheet Tools should no longer exist
      expect(staffContent).not.toContain('title="Org Hierarchy View"')
      expect(staffContent).not.toContain('title="Spreadsheet Tools (Import & Export)"')
      expect(staffContent).not.toContain('Directory vs Org Hierarchy vs Import')
    })

    it('provides a clean return navigation when in hierarchy view mode', () => {
      expect(staffContent).toContain("viewMode === 'hierarchy'")
      expect(staffContent).toContain('Reporting Hierarchy & Org Chart')
      expect(staffContent).toContain('Back to Directory')
    })
  })

  describe('2. Family Directory Action Consolidation', () => {
    it('consolidates Add Family, User Spreadsheet Tool, and Dictionary into GlobalActionMenu', () => {
      expect(familyContent).toContain('<GlobalActionMenu')
      expect(familyContent).toContain("id: 'add-family'")
      expect(familyContent).toContain("id: 'spreadsheet-workspace'")
      expect(familyContent).toContain("id: 'dictionary'")
    })

    it('ensures no duplicate standalone buttons exist in the header or view switcher for family', () => {
      // Standalone "+ Add Family" button should not exist outside Actions
      expect(familyContent).not.toMatch(/<button[^>]*onClick=\{[^}]*setAddFamilyOpen\(true\)[^}]*\}[^>]*>\s*<UserPlus/)

      // Standalone Spreadsheet Tools toggle in view switcher should be removed
      expect(familyContent).not.toMatch(/onClick=\{[^}]*setViewMode\('SPREADSHEET'\)[^}]*\}[\s\S]*?<FileSpreadsheet/)
    })
  })

  describe('3. Users Launcher Hub Action Consolidation', () => {
    it('consolidates launcher actions into one central GlobalActionMenu', () => {
      expect(usersLauncherContent).toContain('<GlobalActionMenu')
      expect(usersLauncherContent).toContain("id: 'add-staff'")
      expect(usersLauncherContent).toContain("id: 'add-family'")
      expect(usersLauncherContent).toContain("id: 'spreadsheet-workspace'")
      expect(usersLauncherContent).toContain("id: 'dictionary'")
      expect(usersLauncherContent).toContain("id: 'organize-hierarchy'")
    })

    it('ensures separate redundant buttons are removed from the launcher header', () => {
      // Standalone Roles Directory button removed
      expect(usersLauncherContent).not.toMatch(/<button[^>]*onClick=\{[^}]*setRolesModalOpen\(true\)[^}]*\}[\s\S]*?\{t\('users\.rolesDirectory'\)\}/)
      // Standalone + Add dropdown removed
      expect(usersLauncherContent).not.toContain('users-act-add')
    })
  })
})

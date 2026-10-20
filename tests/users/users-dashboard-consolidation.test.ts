import { describe, it, expect } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('PreOne — Users Dashboard Action Consolidation & Clean UX Test Suite', () => {
  const usersPagePath = join(process.cwd(), 'src/app/app/users/page.tsx')
  const staffPagePath = join(process.cwd(), 'src/app/app/users/staff/page.tsx')
  const orgPagePath = join(process.cwd(), 'src/app/app/users/organization/page.tsx')
  const updatesPagePath = join(process.cwd(), 'src/app/app/users/updates/page.tsx')
  const photosPagePath = join(process.cwd(), 'src/app/app/users/photos/page.tsx')

  const usersContent = readFileSync(usersPagePath, 'utf-8')
  const staffContent = readFileSync(staffPagePath, 'utf-8')

  describe('1. Staff Users Dashboard Primary Actions Consolidation', () => {
    it('consolidates the five primary management actions into the centralized Actions button (/app/users/staff)', () => {
      // 1. Add Staff
      expect(staffContent).toContain("id: 'add-staff'")
      expect(staffContent).toContain('Add Staff Member')

      // 2. Organization Setup
      expect(staffContent).toContain("id: 'organization-setup'")
      expect(staffContent).toContain('Organization Setup')
      expect(staffContent).toContain("href: '/app/users/organization'")

      // 3. User Spreadsheet
      expect(staffContent).toContain("id: 'spreadsheet-workspace'")
      expect(staffContent).toContain('User Spreadsheet Tool')
      expect(staffContent).toContain("href: '/app/users/staff?tab=import'")

      // 4. Staff Updates
      expect(staffContent).toContain("id: 'staff-updates'")
      expect(staffContent).toContain('Staff Updates')
      expect(staffContent).toContain("href: '/app/users/updates'")

      // 5. Photo Management
      expect(staffContent).toContain("id: 'photo-management'")
      expect(staffContent).toContain('Photo Management')
      expect(staffContent).toContain("href: '/app/users/photos'")
    })

    it('ensures redundant in-page action grids are removed to prevent duplicate UI', () => {
      // Redundant in-page card grid should not exist since actions are in the Action button
      expect(staffContent).not.toContain('id="action-add-staff"')
      expect(staffContent).not.toContain('id="action-org-setup"')
      expect(staffContent).not.toContain('id="action-spreadsheet"')
      expect(staffContent).not.toContain('id="action-staff-updates"')
      expect(staffContent).not.toContain('id="action-photo-management"')
    })

    it('maintains clear, concise descriptions and consistent iconography for each action in the Actions menu', () => {
      expect(staffContent).toContain('Onboard a new educator or staff member')
      expect(staffContent).toContain('Reporting hierarchy & roles dictionary')
      expect(staffContent).toContain('Bulk import and export staff via spreadsheet')
      expect(staffContent).toContain('Individual staff edits & bulk field updates')
      expect(staffContent).toContain('Individual portrait & ZIP bulk photo upload')
    })

    it('ensures /app/users launcher is clean and does not contain the staff action grid', () => {
      expect(usersContent).not.toContain('id="action-add-staff"')
      expect(usersContent).not.toContain('id="action-org-setup"')
      expect(usersContent).not.toContain('id="action-spreadsheet"')
      expect(usersContent).not.toContain('id="action-staff-updates"')
      expect(usersContent).not.toContain('id="action-photo-management"')

      // Confirms /app/users contains the directory launcher cards
      expect(usersContent).toContain('Staff Directory')
      expect(usersContent).toContain('Family Directory')
      expect(usersContent).toContain('href="/app/users/staff"')
      expect(usersContent).toContain('href="/app/users/family"')
    })
  })

  describe('2. Organization Setup Workspace (Hierarchy + Dictionary)', () => {
    it('verifies organization setup page exists and combines hierarchy and dictionary', () => {
      expect(existsSync(orgPagePath)).toBe(true)
      const orgContent = readFileSync(orgPagePath, 'utf-8')

      // Contains both internal tabs
      expect(orgContent).toContain('id="tab-org-hierarchy"')
      expect(orgContent).toContain('id="tab-org-dictionary"')
      expect(orgContent).toContain('Organization Hierarchy')
      expect(orgContent).toContain('Dictionary')

      // Integrates both views
      expect(orgContent).toContain('<OrgHierarchyView')
      expect(orgContent).toContain('<RolesDirectoryView')

      // Preserves return navigation
      expect(orgContent).toContain('Back to Users Dashboard')
      expect(orgContent).toContain('href="/app/users"')
    })
  })

  describe('3. Staff Updates Workspace (Individual Edit + Bulk Field Update)', () => {
    it('verifies staff updates page exists and combines individual edit and bulk update', () => {
      expect(existsSync(updatesPagePath)).toBe(true)
      const updatesContent = readFileSync(updatesPagePath, 'utf-8')

      // Contains both internal tabs
      expect(updatesContent).toContain('id="tab-individual-edit"')
      expect(updatesContent).toContain('id="tab-bulk-update"')
      expect(updatesContent).toContain('Individual Edit')
      expect(updatesContent).toContain('Bulk Update')

      // Integrates EditUserModal and BulkUpdateFieldView
      expect(updatesContent).toContain('<EditUserModal')
      expect(updatesContent).toContain('<BulkUpdateFieldView')

      // Preserves return navigation
      expect(updatesContent).toContain('Back to Users Dashboard')
      expect(updatesContent).toContain('href="/app/users"')
    })

    it('displays prominent caution banner for bulk update mode', () => {
      const bulkViewPath = join(process.cwd(), 'src/components/users/BulkUpdateFieldView.tsx')
      const bulkViewContent = readFileSync(bulkViewPath, 'utf-8')
      expect(bulkViewContent).toContain('Caution: Bulk Update Workflow')
      expect(bulkViewContent).toContain('Changes applied here update multiple staff accounts simultaneously')
    })

    it('verifies BulkUpdateFieldView groups by targetEntity and uses stable unique keys across outer and nested maps', () => {
      const bulkViewPath = join(process.cwd(), 'src/components/users/BulkUpdateFieldView.tsx')
      const bulkViewContent = readFileSync(bulkViewPath, 'utf-8')
      expect(bulkViewContent).toContain("f.targetEntity === 'user'")
      expect(bulkViewContent).toContain("f.targetEntity === 'tenantUser'")
      expect(bulkViewContent).toContain('key={cat || `category-${catIdx}`}')
      expect(bulkViewContent).toContain('key={f.key}')
      expect(bulkViewContent).toContain('key={s.key}')
    })
  })

  describe('4. Photo Management Workspace (Individual Upload + Bulk Photo Upload)', () => {
    it('verifies photo management page exists and combines individual and bulk upload', () => {
      expect(existsSync(photosPagePath)).toBe(true)
      const photosContent = readFileSync(photosPagePath, 'utf-8')

      // Contains both internal tabs
      expect(photosContent).toContain('id="tab-individual-photo"')
      expect(photosContent).toContain('id="tab-bulk-photo"')
      expect(photosContent).toContain('Individual Upload')
      expect(photosContent).toContain('Bulk Upload')

      // Integrates ZipPhotoUploadView
      expect(photosContent).toContain('<ZipPhotoUploadView')

      // Preserves individual portrait uploader with size and type constraints
      expect(photosContent).toContain('image/jpeg,image/png,image/webp')
      expect(photosContent).toContain('5 * 1024 * 1024')

      // Preserves return navigation
      expect(photosContent).toContain('Back to Users Dashboard')
      expect(photosContent).toContain('href="/app/users"')
    })
  })

  describe('5. Staff Directory Actions Alignment & Backward Compatibility', () => {
    it('aligns GlobalActionMenu in Staff Directory with the consolidated action structure', () => {
      expect(staffContent).toContain("id: 'add-staff'")
      expect(staffContent).toContain("id: 'organization-setup'")
      expect(staffContent).toContain("id: 'spreadsheet-workspace'")
      expect(staffContent).toContain("id: 'staff-updates'")
      expect(staffContent).toContain("id: 'photo-management'")

      // Legacy compatibility actions preserved
      expect(staffContent).toContain("id: 'organize-hierarchy'")
      expect(staffContent).toContain("id: 'dictionary'")
    })

    it('preserves spreadsheet workspace and org hierarchy view modes inside staff directory', () => {
      expect(staffContent).toContain('<SpreadsheetImportWorkspace')
      expect(staffContent).toContain('<OrgHierarchyView')
    })
  })

  describe('6. Add Staff Modal Clean Up (/app/users/staff)', () => {
    const addStaffModalPath = join(process.cwd(), 'src/components/users/AddStaffModal.tsx')

    it('removes Preferred Language dropdown and statutory/emergency advisory notice from Add Staff modal', () => {
      const addStaffContent = readFileSync(addStaffModalPath, 'utf-8')
      expect(addStaffContent).not.toContain('Preferred Language')
      expect(addStaffContent).not.toContain('Personal, emergency contact, and statutory details')
      expect(addStaffContent).not.toContain('LOCALES')
      // Confirms essential identity and placement fields remain intact
      expect(addStaffContent).toContain('Full Name')
      expect(addStaffContent).toContain('Work Email')
      expect(addStaffContent).toContain('Mobile Phone')
      expect(addStaffContent).toContain('Staff Profile Photo')
    })
  })
})

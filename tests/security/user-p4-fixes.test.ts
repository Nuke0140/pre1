import { describe, it, expect } from 'bun:test'
import { enIN } from '@/lib/i18n/locales/en-IN'
import { hiIN } from '@/lib/i18n/locales/hi-IN'
import { mrIN } from '@/lib/i18n/locales/mr-IN'
import { validateFullName, validateStaffInput, validateFamilyInput } from '@/lib/users/user-validation'
import { CANONICAL_STAFF_ROLES, CANONICAL_FAMILY_ROLES } from '@/components/users/types'
import { CANONICAL_ROLES, ROLE_META } from '@/lib/roles'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('PreOne P4 Production Hardening & Bug Fixes (N-7, N-8, N-9, N-10, Doc 5.4)', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. i18n Key Leak Fix (N-7: common.moreActions)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('N-7: i18n Dictionary Integrity (common.moreActions)', () => {
    it('defines moreActions in en-IN common dictionary', () => {
      expect((enIN.common as any).moreActions).toBe('More Actions')
    })

    it('defines moreActions in hi-IN common dictionary', () => {
      expect((hiIN.common as any).moreActions).toBe('अधिक क्रियाएं')
    })

    it('defines moreActions in mr-IN common dictionary', () => {
      expect((mrIN.common as any).moreActions).toBe('अधिक कृती')
    })

    it('contains no unkeyed common.moreActions leak in staff or family directory pages', () => {
      const staffPageCode = readFileSync(join(process.cwd(), 'src/app/app/users/staff/page.tsx'), 'utf-8')
      const familyPageCode = readFileSync(join(process.cwd(), 'src/app/app/users/family/page.tsx'), 'utf-8')

      expect(staffPageCode).toContain("t('common.moreActions') || 'More Actions'")
      expect(familyPageCode).toContain("t('common.moreActions') || 'More Actions'")
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Branch-UUID Leak Guard (N-8)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('N-8: Branch-UUID Leak Elimination in User360Drawer', () => {
    it('ensures User360Drawer does not output raw UUID slice fragments', () => {
      const drawerCode = readFileSync(join(process.cwd(), 'src/components/users/User360Drawer.tsx'), 'utf-8')

      // Assert that neither slice(-6) leak exists anywhere in User360Drawer
      expect(drawerCode).not.toContain('user.branchId.slice(-6)')
      expect(drawerCode).not.toContain('Branch ID: ${user.branchId.slice(-6)}')
      expect(drawerCode).not.toContain('Single Campus Branch (${user.branchId.slice(-6)})')

      // Assert relationship-scoping logic is in place for family roles
      expect(drawerCode).toContain('Relationship-Scoped (Linked Wards)')
      expect(drawerCode).toContain('Relationship-Scoped: Linked across student campus enrollments')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Roles and Hub Count Alignment (N-9)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('N-9: Roles and Hub Count Consistency', () => {
    it('confirms exactly 9 canonical staff workforce roles', () => {
      expect(CANONICAL_STAFF_ROLES).toHaveLength(9)
      expect(CANONICAL_STAFF_ROLES).toEqual([
        'OWNER',
        'PRINCIPAL',
        'COORDINATOR',
        'TEACHER',
        'STAFF',
        'ACCOUNTS',
        'RECEPTIONIST',
        'ATTENDANT',
        'DRIVER',
      ])
    })

    it('confirms 2 canonical family roles', () => {
      expect(CANONICAL_FAMILY_ROLES).toEqual(['PARENT', 'GUARDIAN'])
    })

    it('confirms setup staff roles include all canonical staff roles including OWNER', () => {
      const setupStepCode = readFileSync(join(process.cwd(), 'src/app/app/setup/[step]/page.tsx'), 'utf-8')
      expect(setupStepCode).toContain("'OWNER'")
      expect(setupStepCode).toContain("'PRINCIPAL'")
      expect(setupStepCode).toContain("'COORDINATOR'")
      expect(setupStepCode).toContain("'TEACHER'")
      expect(setupStepCode).toContain("'STAFF'")
      expect(setupStepCode).toContain("'ACCOUNTS'")
      expect(setupStepCode).toContain("'RECEPTIONIST'")
      expect(setupStepCode).toContain("'DRIVER'")
      expect(setupStepCode).toContain("'ATTENDANT'")
    })

    it('removes misleading hardcoded 9 count in roles directory subtitle', () => {
      expect(enIN.users.rolesDirectorySub).not.toContain('9 RBAC roles')
      expect(enIN.users.rolesDirectorySub).toContain('Canonical RBAC roles')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Name Formatting Validation & Duplicate Hints (N-10 / Doc 5.4)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('N-10 / Doc 5.4: Name Formatting Validation', () => {
    it('accepts valid full names with alphabetic characters', () => {
      expect(validateFullName('Priya Sharma').valid).toBe(true)
      expect(validateFullName('Dr. Rajesh K. Joshi').valid).toBe(true)
      expect(validateFullName("Liam O'Connor").valid).toBe(true)
      expect(validateFullName('Mary-Jane Watson').valid).toBe(true)
      expect(validateFullName('आरोही पाटील').valid).toBe(true) // Unicode Hindi/Marathi
    })

    it('rejects empty or whitespace-only names', () => {
      expect(validateFullName('').valid).toBe(false)
      expect(validateFullName('   ').valid).toBe(false)
      expect(validateFullName(null as any).valid).toBe(false)
    })

    it('rejects single character names', () => {
      const res = validateFullName('A')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Full name must be at least 2 characters')
    })

    it('rejects names composed purely of numeric digits', () => {
      const res = validateFullName('12345')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Full name cannot be purely numeric digits')
    })

    it('rejects names with purely special characters', () => {
      const res = validateFullName('---!!!@@@')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Full name must contain at least 2 alphabetic letters')
    })

    it('enforces validateFullName in validateStaffInput', () => {
      const invalidStaff = validateStaffInput({
        fullName: '12345',
        email: 'staff@school.com',
      } as any)
      expect(invalidStaff.valid).toBe(false)
      expect(invalidStaff.errors).toContain('Full name cannot be purely numeric digits')

      const validStaff = validateStaffInput({
        fullName: 'Anita Deshmukh',
        email: 'anita@school.com',
      } as any)
      expect(validStaff.valid).toBe(true)
    })

    it('enforces validateFullName in validateFamilyInput', () => {
      const invalidFamily = validateFamilyInput({
        role: 'PARENT',
        fullName: '99999',
        email: 'parent@home.com',
        phone: '9876543210',
        relationship: 'FATHER',
        childMode: 'EXISTING',
        existingChild: { studentId: 'student-123' },
      } as any)
      expect(invalidFamily.valid).toBe(false)
      expect(invalidFamily.errors).toContain('Full name cannot be purely numeric digits')

      const validFamily = validateFamilyInput({
        role: 'PARENT',
        fullName: 'Rohan Sharma',
        email: 'rohan@home.com',
        phone: '9876543210',
        relationship: 'FATHER',
        childMode: 'EXISTING',
        existingChild: { studentId: 'student-123' },
      } as any)
      expect(validFamily.valid).toBe(true)
    })

    it('validates child first name in validateFamilyInput for childMode CREATE', () => {
      const invalidChild = validateFamilyInput({
        role: 'PARENT',
        fullName: 'Rohan Sharma',
        email: 'rohan@home.com',
        phone: '9876543210',
        relationship: 'FATHER',
        childMode: 'CREATE',
        newChild: {
          firstName: '12345',
          dob: '2023-01-01',
          gender: 'FEMALE',
        },
      } as any)
      expect(invalidChild.valid).toBe(false)
      expect(invalidChild.errors.some((e) => e.includes('Child first name'))).toBe(true)
    })

    it('checks duplicate hint UI integration in AddStaffModal and AddFamilyModal', () => {
      const addStaffCode = readFileSync(join(process.cwd(), 'src/components/users/AddStaffModal.tsx'), 'utf-8')
      const addFamilyCode = readFileSync(join(process.cwd(), 'src/components/users/AddFamilyModal.tsx'), 'utf-8')

      expect(addStaffCode).toContain('duplicateHint')
      expect(addStaffCode).toContain('Notice: An account matching')
      expect(addFamilyCode).toContain('duplicateHint')
      expect(addFamilyCode).toContain('Notice: An account matching')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ZIP Mismatch Resolver (Doc 5.4 / N-10)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Doc 5.4 / N-10: ZIP Photo Mismatch Resolver', () => {
    it('verifies ZipPhotoUploadModal renders interactive mismatch resolver selector', () => {
      const zipModalCode = readFileSync(join(process.cwd(), 'src/components/users/ZipPhotoUploadModal.tsx'), 'utf-8')

      expect(zipModalCode).toContain('candidateUsers')
      expect(zipModalCode).toContain('handleAssignUser')
      expect(zipModalCode).toContain('🔍 Match to user...')
      expect(zipModalCode).toContain('Manual Match')
      expect(zipModalCode).toContain('assignments')
    })

    it('verifies zip route parses manual assignments and matches files to assigned users', () => {
      const zipRouteCode = readFileSync(join(process.cwd(), 'src/app/api/v1/users/photos/zip/route.ts'), 'utf-8')

      expect(zipRouteCode).toContain("formData.get('assignments')")
      expect(zipRouteCode).toContain('userIdToUser')
      expect(zipRouteCode).toContain('candidateUsers')
      expect(zipRouteCode).toContain('assignedUserId')
    })
  })
})

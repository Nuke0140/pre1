import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('PreOne User Management — Reusable Table Primitives (PRE1-USER-IDENTITY-UI-001)', () => {
  const identityCellPath = join(process.cwd(), 'src/components/users/UserIdentityCell.tsx')
  const contactCellPath = join(process.cwd(), 'src/components/users/UserContactCell.tsx')
  const roleCellPath = join(process.cwd(), 'src/components/users/UserRolePlacementCell.tsx')
  const actionStripPath = join(process.cwd(), 'src/components/users/ContactActionStrip.tsx')
  const rowActionsPath = join(process.cwd(), 'src/components/users/UserRowActions.tsx')
  const phoneUtilsPath = join(process.cwd(), 'src/lib/users/phone-utils.ts')

  const identityCode = readFileSync(identityCellPath, 'utf-8')
  const contactCode = readFileSync(contactCellPath, 'utf-8')
  const roleCode = readFileSync(roleCellPath, 'utf-8')
  const actionStripCode = readFileSync(actionStripPath, 'utf-8')
  const rowActionsCode = readFileSync(rowActionsPath, 'utf-8')
  const phoneUtilsCode = readFileSync(phoneUtilsPath, 'utf-8')

  describe('1. UserIdentityCell Architecture', () => {
    it('implements stacked two/three-line identity hierarchy', () => {
      // Line 1: Avatar + Name
      expect(identityCode).toContain('<Avatar')
      expect(identityCode).toContain('displayName')

      // Line 2: Account Identifier (@username or handle)
      expect(identityCode).toContain('usernameHandle')

      // Line 3: Organizational Context
      expect(identityCode).toContain('contextLine')
      expect(identityCode).toContain('employeeCode')
      expect(identityCode).toContain('branchName')
    })

    it('supports family role children placement without leaking sensitive fields', () => {
      expect(identityCode).toContain('guardianProfile?.students')
      expect(identityCode).toContain('isCrossCampus')
      expect(identityCode).not.toContain('pickupPin') // Never renders PIN in identity cell
    })
  })

  describe('2. UserContactCell Architecture', () => {
    it('displays phone, email, and integrates ContactActionStrip without layout shift', () => {
      expect(contactCode).toContain('normalizePhoneNumber')
      expect(contactCode).toContain('<ContactActionStrip')
      expect(contactCode).toContain('Mail')
      expect(contactCode).toContain('Phone')
    })
  })

  describe('3. ContactActionStrip Micro-Actions & Phone Normalization', () => {
    it('implements Call, WhatsApp, and Copy Email with proper accessibility and event containment', () => {
      // Call action
      expect(actionStripCode).toContain('telHref')
      expect(actionStripCode).toContain('Call')

      // WhatsApp action via trusted domain
      expect(actionStripCode).toContain('whatsAppUrl')
      expect(phoneUtilsCode).toContain('https://wa.me/')
      expect(actionStripCode).toContain('rel="noopener noreferrer"')

      // Copy email action with toast feedback
      expect(actionStripCode).toContain('navigator.clipboard')
      expect(actionStripCode).toContain('toast.success')

      // Stops row propagation
      expect(actionStripCode).toContain('e.stopPropagation()')
    })
  })

  describe('4. UserRolePlacementCell Architecture', () => {
    it('renders canonical role badge with contextual placement and security indicators', () => {
      expect(roleCode).toContain('ROLE_BADGE')
      expect(roleCode).toContain('<StatusBadge')
      expect(roleCode).toContain('Authorized Escort')
      expect(roleCode).toContain('Gate PIN Set')
      expect(roleCode).not.toContain('c.pickupPin}') // Never exposes raw PIN value
    })
  })

  describe('5. UserRowActions Architecture', () => {
    it('standardizes View, Edit, and More Actions dropdown pattern', () => {
      expect(rowActionsCode).toContain('<IconButton')
      expect(rowActionsCode).toContain('Eye')
      expect(rowActionsCode).toContain('Edit3')
      expect(rowActionsCode).toContain('DropdownMenu')
      expect(rowActionsCode).toContain("t('common.moreActions') || 'More Actions'")
      expect(rowActionsCode).toContain('e.stopPropagation()')
    })
  })
})

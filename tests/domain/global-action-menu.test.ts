import { describe, it, expect } from 'bun:test'
import { SEMANTIC_CATEGORY_STYLES } from '@/components/ui/action-menu.tokens'
import type { ActionItem, ActionGroup, SemanticActionCategory } from '@/components/ui/action-menu.types'

describe('GlobalActionMenu Architecture & Tokens', () => {
  it('provides complete semantic category styles for all standard operations', () => {
    const requiredCategories: SemanticActionCategory[] = [
      'export',
      'import',
      'settings',
      'audit',
      'view',
      'edit',
      'create',
      'approve',
      'warning',
      'danger',
      'general',
    ]

    for (const cat of requiredCategories) {
      expect(SEMANTIC_CATEGORY_STYLES[cat]).toBeDefined()
      expect(SEMANTIC_CATEGORY_STYLES[cat].container).toBeDefined()
      expect(SEMANTIC_CATEGORY_STYLES[cat].icon).toBeDefined()
      expect(typeof SEMANTIC_CATEGORY_STYLES[cat].container).toBe('string')
      expect(typeof SEMANTIC_CATEGORY_STYLES[cat].icon).toBe('string')
    }
  })

  it('correctly maps export to emerald and import to purple theme styles', () => {
    expect(SEMANTIC_CATEGORY_STYLES.export.container).toContain('emerald')
    expect(SEMANTIC_CATEGORY_STYLES.import.container).toContain('purple')
    expect(SEMANTIC_CATEGORY_STYLES.settings.container).toContain('amber')
    expect(SEMANTIC_CATEGORY_STYLES.audit.container).toContain('slate')
    expect(SEMANTIC_CATEGORY_STYLES.danger.container).toContain('rose')
  })

  it('handles strongly typed ActionItem definitions including optional Marathi helper text', () => {
    const action: ActionItem = {
      id: 'export-staff',
      label: 'Export Staff List',
      helperText: 'स्टाफची यादी डाउनलोड करा',
      category: 'export',
      groupId: 'data',
      permission: 'users:read',
      visible: true,
      disabled: false,
    }

    expect(action.id).toBe('export-staff')
    expect(action.label).toBe('Export Staff List')
    expect(action.helperText).toBe('स्टाफची यादी डाउनलोड करा')
    expect(action.category).toBe('export')
    expect(action.groupId).toBe('data')
    expect(action.permission).toBe('users:read')
  })

  it('filters actions correctly when permission checks are evaluated', () => {
    const actions: ActionItem[] = [
      { id: '1', label: 'View Profile', permission: 'users:read' },
      { id: '2', label: 'Delete User', permission: 'users:delete', destructive: true },
      { id: '3', label: 'Export Roster', visible: false },
    ]

    const allowedPermissions = new Set(['users:read'])
    const hasPermission = (perm: string) => allowedPermissions.has(perm)

    const filtered = actions.filter((act) => {
      if (act.visible === false) return false
      if (act.permission && !hasPermission(act.permission)) return false
      return true
    })

    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('1')
  })

  it('organizes items into structured sections and strips empty groups', () => {
    const groups: ActionGroup[] = [
      { id: 'data', label: 'DATA OPERATIONS' },
      { id: 'management', label: 'MANAGEMENT' },
      { id: 'audit', label: 'AUDIT' },
    ]

    const activeActions: ActionItem[] = [
      { id: 'exp', label: 'Export', groupId: 'data' },
      { id: 'imp', label: 'Import', groupId: 'data' },
      { id: 'role', label: 'Roles Directory', groupId: 'management' },
    ]

    const sections = groups
      .map((g) => ({
        group: g,
        items: activeActions.filter((a) => a.groupId === g.id),
      }))
      .filter((s) => s.items.length > 0)

    expect(sections.length).toBe(2)
    expect(sections[0].group.id).toBe('data')
    expect(sections[0].items.length).toBe(2)
    expect(sections[1].group.id).toBe('management')
    expect(sections[1].items.length).toBe(1)
    // Empty 'audit' group was removed cleanly
    expect(sections.some((s) => s.group.id === 'audit')).toBe(false)
  })
})

import * as React from 'react'

export type SemanticActionCategory =
  | 'export'      // Download, export CSV/PDF/Excel -> Soft emerald/green
  | 'import'      // Upload, import CSV/data -> Soft purple/violet
  | 'settings'    // Configure, manage preferences -> Soft amber/orange
  | 'audit'       // View history, audit log, ledger -> Neutral slate/gray
  | 'view'        // Inspect, view details, 360 profile -> Neutral blue/indigo
  | 'edit'        // Modify, update fields, rename -> Blue or neutral
  | 'create'      // Add new, create record -> Primary purple
  | 'approve'     // Verify, confirm, approve -> Soft emerald/green
  | 'warning'     // Review, flag, request info -> Soft amber
  | 'danger'      // Delete, deactivate, withdraw -> Soft rose/red
  | 'general'     // Miscellaneous, uncategorized -> Neutral slate

export interface ActionItem {
  /** Stable unique identifier for the action */
  id: string
  /** Primary label in English */
  label: string
  /** Optional concise Marathi helper text */
  helperText?: string
  /** Icon element (e.g. from Lucide) */
  icon?: React.ReactNode
  /** Semantic category that governs icon styling, or override with category */
  category?: SemanticActionCategory
  /** Optional grouping identifier when actions are structured in groups */
  groupId?: string
  /** Optional permission key required to view or execute (e.g. 'users:write') */
  permission?: string
  /** Explicit visibility toggle (if false, item is omitted) */
  visible?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Tooltip or explanation for disabled state */
  disabledReason?: string
  /** Loading/busy spinner state */
  loading?: boolean
  /** Action click callback */
  onClick?: () => void | Promise<void>
  /** If navigation action, link target */
  href?: string
  /** Download attribute if href is a file download */
  download?: boolean | string
  /** Link target attribute */
  target?: string
  /** If true, item will be treated as dangerous/destructive */
  destructive?: boolean
  /** Custom extra CSS classes */
  className?: string
}

export interface ActionGroup {
  /** Unique group identifier */
  id: string
  /** Group section header title (e.g. 'Data Operations') */
  label?: string
  /** Group section Marathi helper / subtitle */
  helperText?: string
}

export interface GlobalActionMenuProps {
  /** Trigger button text. Defaults to 'Actions' */
  label?: string
  /** Optional icon for trigger button. Defaults to a crisp 2x2 grid icon or Lucide Sparkles/Sliders */
  triggerIcon?: React.ReactNode
  /** Array of actions */
  actions: ActionItem[]
  /** Optional groups definitions */
  groups?: ActionGroup[]
  /** Alignment of dropdown panel relative to trigger. Defaults to 'end' */
  align?: 'start' | 'end' | 'center'
  /** Side offset in pixels. Defaults to 6 */
  sideOffset?: number
  /** Size variant for trigger. Defaults to 'default' */
  size?: 'default' | 'sm' | 'compact'
  /** Disabled state for the entire action menu trigger */
  disabled?: boolean
  /** Loading state for the trigger */
  loading?: boolean
  /** Additional class for trigger button */
  className?: string
  /** Additional class for dropdown menu content panel */
  contentClassName?: string
  /** Accessible label for trigger */
  'aria-label'?: string
  /** Active user roles or role string for automatic permission filtering */
  userRole?: string | string[]
  /** Custom permission check function if needed */
  hasPermission?: (permission: string) => boolean
}

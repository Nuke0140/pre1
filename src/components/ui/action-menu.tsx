'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ActionItem,
  ActionGroup,
  GlobalActionMenuProps,
  SemanticActionCategory,
} from './action-menu.types'
import { SEMANTIC_CATEGORY_STYLES } from './action-menu.tokens'
import { ChevronDown, Loader2, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export * from './action-menu.types'
export * from './action-menu.tokens'

/**
 * PreOne Canonical Global Action Menu Component
 *
 * Implements the approved Enterprise-wide Action Menu design standard:
 * - Refined, compact 'Actions' toolbar trigger with subtle border and chevron
 * - High-contrast floating dropdown surface with specular highlights
 * - Semantic icon badge backgrounds (export green, import purple, settings amber, audit slate)
 * - Clear primary label with optional localized helper text
 * - Grouped sections with subtle dividers
 * - Role and permission-aware filtering
 * - Loading, disabled, and keyboard navigation support
 */
export function GlobalActionMenu({
  label = 'Actions',
  triggerIcon,
  actions,
  groups,
  align = 'end',
  sideOffset = 6,
  size = 'default',
  disabled = false,
  loading = false,
  className = '',
  contentClassName = '',
  'aria-label': ariaLabel,
  userRole,
  hasPermission,
}: GlobalActionMenuProps) {
  const { locale } = useI18n()
  const isEnglish = locale === 'en-IN'
  const containsDevanagari = (text?: string) => Boolean(text && /[\u0900-\u097F]/.test(text))

  // 1. Filter actions by visibility and permissions
  const filteredActions = React.useMemo(() => {
    return actions.filter((act) => {
      // Explicit visibility flag
      if (act.visible === false) return false

      // Optional permission check
      if (act.permission && hasPermission) {
        if (!hasPermission(act.permission)) return false
      }

      return true
    })
  }, [actions, hasPermission])

  // 2. Partition actions into groups or flat list
  const structuredSections = React.useMemo(() => {
    if (!groups || groups.length === 0) {
      // Check if any actions have groupId
      const uniqueGroupIds = Array.from(new Set(filteredActions.map((a) => a.groupId).filter(Boolean))) as string[]
      if (uniqueGroupIds.length === 0) {
        return [{ group: null, items: filteredActions }]
      }
      return uniqueGroupIds.map((gId) => ({
        group: { id: gId, label: gId.toUpperCase() },
        items: filteredActions.filter((a) => a.groupId === gId),
      }))
    }

    // Explicit groups defined
    const sections: { group: ActionGroup | null; items: ActionItem[] }[] = []

    // Items with no group or unmapped group
    const unmappedItems = filteredActions.filter((a) => !a.groupId || !groups.some((g) => g.id === a.groupId))
    if (unmappedItems.length > 0) {
      sections.push({ group: null, items: unmappedItems })
    }

    // Registered groups
    for (const g of groups) {
      const gItems = filteredActions.filter((a) => a.groupId === g.id)
      if (gItems.length > 0) {
        sections.push({ group: g, items: gItems })
      }
    }

    return sections
  }, [filteredActions, groups])

  // If all actions are filtered out, do not render trigger unless explicitly disabled
  if (filteredActions.length === 0 && !disabled) {
    return null
  }

  // Trigger size styles
  const sizeStyles = {
    default: 'h-9 px-3.5 text-xs gap-2',
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    compact: 'h-8 px-2 text-xs gap-1',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || loading}
          aria-label={ariaLabel || label}
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-xl',
            'border border-border/80 dark:border-border/60 bg-white dark:bg-slate-900',
            'text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/80',
            'hover:border-primary/40 dark:hover:border-primary/40',
            'shadow-xs hover:[box-shadow:var(--shadow-1)] transition-all duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary',
            'disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
            sizeStyles[size],
            className
          )}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : triggerIcon ? (
            <span className="shrink-0 text-slate-500 dark:text-slate-400">{triggerIcon}</span>
          ) : (
            <LayoutGrid className="w-3.5 h-3.5 text-primary shrink-0" />
          )}

          <span className="truncate">{label}</span>

          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-70 group-data-[state=open]:rotate-180 transition-transform duration-150" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'w-64 sm:w-72 p-1.5 rounded-2xl border border-border/70 dark:border-border/50',
          'bg-white/98 dark:bg-slate-900/98 backdrop-blur-md',
          '[box-shadow:var(--shadow-2)]',
          'z-50',
          contentClassName
        )}
      >
        {structuredSections.map((section, sIndex) => {
          return (
            <React.Fragment key={section.group?.id || `sec-${sIndex}`}>
              {sIndex > 0 && <DropdownMenuSeparator className="-mx-1 my-1 bg-border/50" />}

              {section.group?.label && (
                <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  <span>{section.group.label}</span>
                  {section.group.helperText && !(isEnglish && containsDevanagari(section.group.helperText)) && (
                    <span className="text-[9.5px] font-normal normal-case opacity-75">
                      {section.group.helperText}
                    </span>
                  )}
                </DropdownMenuLabel>
              )}

              {section.items.map((action) => {
                const category = action.category || 'general'
                const catStyle = SEMANTIC_CATEGORY_STYLES[category] || SEMANTIC_CATEGORY_STYLES.general

                const content = (
                  <div className="flex items-start gap-2.5 w-full py-0.5">
                    {/* Semantic Icon Pill */}
                    {action.icon && (
                      <div
                        className={cn(
                          'w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          catStyle.container
                        )}
                        aria-hidden="true"
                      >
                        {action.loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className={cn('[&_svg]:size-3.5', catStyle.icon)}>
                            {action.icon}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Labels */}
                    <div className="flex-1 min-w-0 text-left">
                      <div
                        className={cn(
                          'text-xs font-semibold leading-tight truncate',
                          action.destructive
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-foreground'
                        )}
                      >
                        {action.label}
                      </div>

                      {/* Optional helper text (suppressed if Devanagari in English mode) */}
                      {action.helperText && !(isEnglish && containsDevanagari(action.helperText)) && (
                        <div className="text-[11px] text-muted-foreground leading-normal mt-0.5 font-normal truncate">
                          {action.helperText}
                        </div>
                      )}

                      {/* Disabled explanation if provided */}
                      {action.disabled && action.disabledReason && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 leading-normal mt-0.5 font-medium">
                          {action.disabledReason}
                        </div>
                      )}
                    </div>
                  </div>
                )

                if (action.href) {
                  return (
                    <DropdownMenuItem
                      key={action.id}
                      asChild
                      disabled={action.disabled || action.loading}
                      className={cn(
                        'cursor-pointer rounded-xl px-2.5 py-1.5 focus:bg-slate-100 dark:focus:bg-slate-800/80',
                        action.disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
                        action.className
                      )}
                    >
                      {action.download ? (
                        <a
                          href={action.href}
                          download={action.download}
                          className="w-full"
                          target={action.target}
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          href={action.href}
                          className="w-full"
                          target={action.target}
                        >
                          {content}
                        </Link>
                      )}
                    </DropdownMenuItem>
                  )
                }

                return (
                  <DropdownMenuItem
                    key={action.id}
                    disabled={action.disabled || action.loading}
                    onClick={() => {
                      if (!action.disabled && !action.loading) {
                        action.onClick?.()
                      }
                    }}
                    className={cn(
                      'cursor-pointer rounded-xl px-2.5 py-1.5 focus:bg-slate-100 dark:focus:bg-slate-800/80',
                      action.disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
                      action.className
                    )}
                  >
                    {content}
                  </DropdownMenuItem>
                )
              })}
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Standard alias for GlobalActionMenu
 */
export const ActionMenu = GlobalActionMenu

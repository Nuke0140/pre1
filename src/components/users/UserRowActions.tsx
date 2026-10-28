'use client'

import React from 'react'
import { Eye, Edit3, MoreHorizontal } from 'lucide-react'
import { IconButton } from '@/components/preone/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/lib/i18n'
import { UserRecord } from './types'

export interface UserRowActionItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

export interface UserRowActionsProps {
  user: UserRecord
  onView: (u: UserRecord) => void
  onEdit: (u: UserRecord) => void
  moreActions?: UserRowActionItem[]
  children?: React.ReactNode
  viewLabel?: string
  editLabel?: string
  className?: string
}

export function UserRowActions({
  user,
  onView,
  onEdit,
  moreActions = [],
  children,
  viewLabel,
  editLabel,
  className = '',
}: UserRowActionsProps) {
  const { t } = useI18n()
  const moreActionsLabel = t('common.moreActions') || 'More Actions'

  return (
    <div
      className={`user-row-actions dt-actions-row flex items-center gap-1 justify-end ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. View 360 Action */}
      <IconButton
        icon={<Eye size={15} />}
        label={viewLabel || t('users.view360Profile') || 'View 360 Profile'}
        onClick={() => onView(user)}
      />

      {/* 2. Edit Action */}
      <IconButton
        icon={<Edit3 size={15} />}
        label={editLabel || t('users.editStaff') || 'Edit User'}
        onClick={() => onEdit(user)}
      />

      {/* 3. More Actions Dropdown */}
      {(moreActions.length > 0 || children) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="dt-icon-btn p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              title={moreActionsLabel}
              aria-label={moreActionsLabel}
            >
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border border-border/80 bg-popover z-50">
            {children ? (
              children
            ) : (
              moreActions.map((action, idx) => (
                <React.Fragment key={action.key || idx}>
                  {action.separator && <DropdownMenuSeparator className="my-1 border-t border-border/60" />}
                  <DropdownMenuItem
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium ${
                      action.danger ? 'text-rose-600 dark:text-rose-400 focus:text-rose-600' : ''
                    }`}
                  >
                    {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

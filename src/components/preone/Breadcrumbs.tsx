'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}

export interface BreadcrumbsProps {
  items: Crumb[]
  className?: string
  showHomeIcon?: boolean
  compact?: boolean
  maxItems?: number
}

export function Breadcrumbs({
  items,
  className,
  showHomeIcon = true,
  compact = false,
  maxItems = 4,
}: BreadcrumbsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!items || items.length === 0) {
    return null
  }

  // Determine whether collapsing is active
  const shouldCollapse = maxItems > 0 && items.length > maxItems && !isExpanded

  type DisplayEntry =
    | { type: 'crumb'; crumb: Crumb; index: number; isLast: boolean }
    | { type: 'collapsed'; count: number }

  let displayList: DisplayEntry[] = []

  if (shouldCollapse) {
    // Always show root item
    displayList.push({ type: 'crumb', crumb: items[0], index: 0, isLast: false })

    // Collapsed placeholder
    const hiddenCount = items.length - 3
    if (hiddenCount > 0) {
      displayList.push({ type: 'collapsed', count: hiddenCount })
      // Show nearest parent (index: items.length - 2)
      displayList.push({ type: 'crumb', crumb: items[items.length - 2], index: items.length - 2, isLast: false })
    } else {
      displayList.push({ type: 'collapsed', count: 1 })
    }

    // Always show current page (last item)
    displayList.push({ type: 'crumb', crumb: items[items.length - 1], index: items.length - 1, isLast: true })
  } else {
    displayList = items.map((crumb, idx) => ({
      type: 'crumb' as const,
      crumb,
      index: idx,
      isLast: idx === items.length - 1,
    }))
  }

  return (
    <nav
      className={`breadcrumbs${compact ? ' bc-compact' : ''}${className ? ` ${className}` : ''}`}
      aria-label="Breadcrumb"
    >
      <ol className="bc-list">
        {displayList.map((entry, i) => {
          const isFirstItem = i === 0

          if (entry.type === 'collapsed') {
            return (
              <React.Fragment key="collapsed-crumbs">
                <li className="bc-sep" aria-hidden="true">
                  <ChevronRight size={13} strokeWidth={2} />
                </li>
                <li className="bc-item">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="bc-collapsed-btn"
                    aria-label={`Show ${entry.count} hidden breadcrumb items`}
                    title="Show hidden items"
                  >
                    <MoreHorizontal size={14} aria-hidden="true" />
                  </button>
                </li>
              </React.Fragment>
            )
          }

          const { crumb, isLast, index } = entry
          const isRoot = index === 0

          // Resolve Home icon for root item if applicable
          const isHomeItem =
            isRoot &&
            (crumb.href === '/app' ||
              crumb.href === '/app/home' ||
              crumb.label.trim().toLowerCase() === 'home' ||
              crumb.label.trim().toLowerCase() === 'dashboard')

          const iconNode =
            crumb.icon ||
            (isHomeItem && showHomeIcon ? (
              <Home className="bc-home-icon" size={14} aria-hidden="true" />
            ) : null)

          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {!isFirstItem && (
                <li className="bc-sep" aria-hidden="true">
                  <ChevronRight size={13} strokeWidth={2} />
                </li>
              )}
              <li className={`bc-item${isRoot ? ' bc-item-root' : ''}`}>
                {isLast || (!crumb.href && !crumb.onClick) ? (
                  <span
                    className={`bc-current${isLast ? ' is-active' : ''}`}
                    aria-current={isLast ? 'page' : undefined}
                    title={crumb.label}
                  >
                    {iconNode}
                    <span className="bc-label">{crumb.label}</span>
                  </span>
                ) : crumb.href ? (
                  <Link
                    href={crumb.href}
                    onClick={crumb.onClick}
                    className="bc-link"
                    title={crumb.label}
                  >
                    {iconNode}
                    <span className="bc-label">{crumb.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="bc-link bc-btn-link"
                    title={crumb.label}
                  >
                    {iconNode}
                    <span className="bc-label">{crumb.label}</span>
                  </button>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
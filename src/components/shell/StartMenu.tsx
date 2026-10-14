'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Search, X, LogOut, Sparkles, User } from 'lucide-react'
import type { Role } from '@/lib/auth'
import { homeModules, type HomeModule, SEMANTIC_THEME_TOKENS } from '@/lib/modules'
import { Avatar } from '@/components/preone/ui'
import type { ShellUser } from './AppShell'
import { useI18n } from '@/lib/i18n/context'

export interface StartMenuProps {
  isOpen: boolean
  onClose: () => void
  user: ShellUser
  onLogout: () => void
  onOpenMyProfile?: () => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
  menuRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * PreOne Global Start Menu / Application Launcher
 *
 * Reusable, theme-aware, RBAC-aware launcher opened from the bottom nav Start orb.
 * Visual Architecture: Windows Start Menu + Fluent Metro + PreOne Preschool OS.
 *
 * Structure:
 * - Fixed Search Header with real-time RBAC filtering
 * - Subtle decorative preschool banner illustration
 * - Scrollable Content:
 *   - Pinned modules grid (6 columns on desktop)
 *   - All sections directory (2 columns)
 * - Fixed Account Footer with user profile and sign out
 */
export function StartMenu({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenMyProfile,
  triggerRef,
  menuRef: externalMenuRef,
}: StartMenuProps) {
  const [query, setQuery] = useState('')
  const internalMenuRef = useRef<HTMLDivElement>(null)
  const menuRef = externalMenuRef || internalMenuRef
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  // Helper to get localized module label
  const getModuleLabel = useCallback(
    (key: string, defaultLabel: string) => {
      const keyMap: Record<string, string> = {
        home: 'nav.home',
        dashboard: 'nav.dashboard',
        'daily-diary': 'nav.dailyDiary',
        users: 'nav.users',
        hr: 'nav.hr',
        setup: 'nav.setup',
        admissions: 'nav.admissions',
        students: 'nav.students',
        learning: 'nav.learning',
        'preo-learning': 'nav.learning',
        preo_learning: 'nav.learning',
        transport: 'nav.transport',
        inventory: 'nav.inventory',
        finance: 'nav.finance',
        fees: 'nav.finance',
        reports: 'nav.reports',
        reports_analytics: 'nav.reports',
        communication: 'nav.communication',
        announcements: 'nav.communication',
        settings: 'nav.settings',
        audit: 'nav.audit',
        audit_logs: 'nav.audit',
        platform: 'nav.platform',
      }
      const navKey = keyMap[key]
      return navKey ? t(navKey) : defaultLabel
    },
    [t]
  )

  // Canonical authorized modules for user's role
  const allModules = useMemo<HomeModule[]>(() => {
    return homeModules(user.role).map((m) => ({
      ...m,
      label: getModuleLabel(m.key, m.label),
    }))
  }, [user.role, getModuleLabel])

  // Real-time RBAC-filtered search against name, description, and key
  const filteredModules = useMemo<HomeModule[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allModules

    return allModules.filter((m) => {
      const matchName = m.label.toLowerCase().includes(q)
      const matchDesc = m.description.toLowerCase().includes(q)
      const matchKey = m.key.toLowerCase().includes(q)

      // Keyword aliases (e.g. "fee" -> Fees, "staff" -> Users, HR, "student" -> Students, Daily Diary, Admissions)
      const matchAlias =
        (q.includes('fee') && (m.key === 'finance' || m.key === 'home')) ||
        (q.includes('staff') && (m.key === 'users' || m.key === 'hr')) ||
        (q.includes('teacher') && (m.key === 'users' || m.key === 'hr' || m.key === 'daily-diary')) ||
        (q.includes('student') && (m.key === 'students' || m.key === 'daily-diary' || m.key === 'admissions')) ||
        (q.includes('bus') && m.key === 'transport') ||
        (q.includes('diary') && m.key === 'daily-diary') ||
        (q.includes('activity') && m.key === 'daily-diary') ||
        (q.includes('timetable') && m.key === 'daily-diary') ||
        (q.includes('bill') && m.key === 'finance')

      return matchName || matchDesc || matchKey || matchAlias
    })
  }, [allModules, query])


  // Focus management: when opening, focus search input on desktop with fine pointer only.
  // On mobile/touch devices, do NOT auto-focus to prevent the virtual keyboard from irritatingly popping up.
  useEffect(() => {
    if (isOpen) {
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)

      if (!isMobile) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
        return () => clearTimeout(timer)
      }
    } else {
      triggerRef?.current?.focus()
    }
  }, [isOpen, triggerRef])

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  // Escape key closes menu
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, handleClose])

  // Outside click detection
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [isOpen, handleClose, triggerRef, menuRef])

  const userInitials = useMemo(() => {
    return user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('')
  }, [user.name])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="startmenu"
      role="dialog"
      aria-modal="true"
      aria-label="Start Menu"
    >
      {/* ── Fixed Search & Illustration Header ── */}
      <div className="sm-head">
        <div className="sm-search-row">
          <div className="sm-search">
            <Search size={16} aria-hidden="true" />
            <input
              suppressHydrationWarning
              ref={searchInputRef}
              type="text"
              placeholder="Search modules…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search modules"
            />
            {query && (
              <button
                type="button"
                className="sm-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="sm-body">
        {/* Search Empty State */}
        {filteredModules.length === 0 && (
          <div className="sm-empty-state">
            <p className="sm-empty-title">No modules match “{query}”</p>
            <p className="sm-empty-sub">Try searching with a different keyword</p>
          </div>
        )}

        {/* All Sections Directory */}
        {filteredModules.length > 0 && (
          <>
            <div className="sm-section-header">
              <span className="sm-title">ALL SECTIONS</span>
            </div>

            <div className="sm-list">
              {filteredModules.map((m) => {
                const Icon = m.icon
                const theme = SEMANTIC_THEME_TOKENS[m.semanticTheme] || SEMANTIC_THEME_TOKENS.lavender
                const imageSrc = m.animation ? m.animation.replace(/\.json$/, '.webp') : null
                return (
                  <Link
                    key={`all-${m.key}`}
                    href={m.href}
                    prefetch={true}
                    className="nav-item"
                    role="menuitem"
                    onClick={onClose}
                  >
                    <span
                      className="sm-list-icon"
                      style={{
                        backgroundColor: imageSrc ? 'transparent' : theme.iconBg,
                        color: theme.iconColor,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={m.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transform: 'scale(1.22)',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <Icon size={15} />
                      )}
                    </span>
                    <span className="sm-list-text">{m.label}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Fixed Account Footer ── */}
      <div className="sm-foot">
        <div className="sm-user">
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <div className="who">
            <b>{user.name}</b>
            <span>{user.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenMyProfile?.()
            }}
            className="btn btn-ghost btn-sm sm-logout-btn"
            title="View & Edit My Profile"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <User size={14} aria-hidden="true" style={{ color: 'var(--primary)' }} />
            <span>My Profile</span>
          </button>
          <Link
            href="/app/settings?tab=preferences"
            onClick={onClose}
            className="btn btn-ghost btn-sm sm-logout-btn"
            title="Appearance & Glow Preferences"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Sparkles size={14} aria-hidden="true" style={{ color: 'var(--primary)' }} />
            <span>Theme &amp; Glow</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm sm-logout-btn"
            onClick={() => {
              onClose()
              onLogout()
            }}
            aria-label="Sign out"
          >
            <LogOut size={14} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

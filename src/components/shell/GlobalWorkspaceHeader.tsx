'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Inbox,
  UserPlus,
  Ban,
  ChevronRight,
  ChevronDown,
  Languages,
  Globe,
  User,
  LogOut,
  Sparkles,
  HelpCircle,
  Maximize2,
} from 'lucide-react'
import { enumLabel, timeAgo } from '@/lib/format'
import type { Role } from '@/lib/auth'
import { FullscreenButton } from './FullscreenButton'
import { HelpButton } from './HelpButton'
import { Avatar } from '@/components/preone/ui'
import type { BrandingConfig } from '@/lib/branding-types'
import { useI18n } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/i18n/types'

export interface GlobalWorkspaceHeaderProps {
  user: {
    name: string
    email: string
    role: Role
    tenantName: string
    branchName: string | null
    avatarUrl?: string | null
  }
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenSearch: () => void
  // Notifications
  unreadCount: number
  notifOpen: boolean
  onToggleNotif: () => void
  notifications: any[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  bellBtnRef: React.RefObject<HTMLButtonElement | null>
  notifRef: React.RefObject<HTMLDivElement | null>
  // Attention / Inbox
  attentionTotal: number
  attention: { invited: number; suspended: number }
  attnOpen: boolean
  onToggleAttn: () => void
  onDismissAttn: () => void
  attnBtnRef: React.RefObject<HTMLButtonElement | null>
  attnRef: React.RefObject<HTMLDivElement | null>
  // Help
  onOpenHelp: () => void
  // Profile
  avatarRef: React.RefObject<HTMLButtonElement | null>
  onOpenProfile: () => void
  onOpenMyProfile?: () => void
  onLogout?: () => void
  pathname?: string
  branding?: BrandingConfig
}

/**
 * PreOne OS — Global Workspace Top Bar
 *
 * Implements the approved PreOne Top Bar Design:
 * - Left: Subtle celestial sparkle identity link back to workspace home
 * - Center: Flexible command search bar with platform shortcut badge (⌘K / Ctrl+K)
 * - Right: Utility actions group (Help, Full Screen, Theme, Inbox, Alerts) + Profile
 * - Fluid scroll compression & calm enterprise elevation
 */
export function GlobalWorkspaceHeader({
  user,
  branding,
  theme,
  onToggleTheme,
  onOpenSearch,
  unreadCount,
  notifOpen,
  onToggleNotif,
  notifications,
  onMarkRead,
  onMarkAllRead,
  bellBtnRef,
  notifRef,
  attentionTotal,
  attention,
  attnOpen,
  onToggleAttn,
  onDismissAttn,
  attnBtnRef,
  attnRef,
  onOpenHelp,
  avatarRef,
  onOpenProfile,
  onOpenMyProfile,
  onLogout,
}: GlobalWorkspaceHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { locale, setLocale, t } = useI18n()

  // Close language and profile popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false)
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target) &&
        avatarRef.current &&
        !avatarRef.current.contains(target)
      ) {
        setProfileMenuOpen(false)
      }
    }
    if (langOpen || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [langOpen, profileMenuOpen, avatarRef])

  // Scroll compression detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  // OS detection for keyboard shortcut rendering
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent))
    }
  }, [])

  const roleLabel = enumLabel(user.role)
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  const renderSearchBar = () => (
    <div
      className="workspace-search-bar"
      onClick={onOpenSearch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenSearch()
        }
      }}
      aria-label="Global search (Press ⌘K / Ctrl+K to open)"
    >
      <div className="workspace-search-left">
        <Search className="workspace-search-icon" aria-hidden="true" />
        <span className="workspace-search-placeholder">
          {t('header.searchPlaceholder')}
        </span>
      </div>
      <kbd className="workspace-search-kbd">
        <span className="opacity-75">{isMac ? '⌘' : 'Ctrl'}</span>K
      </kbd>
    </div>
  )

  return (
    <div className="workspace-header-wrapper">
      <header
        className={`workspace-header workspace-floating-surface premium-header app-header ${scrolled ? 'scrolled' : ''}`}
      >
        {/* ── Main Horizontal Row (Desktop: Full Row / Mobile: Top Utility Row) ── */}
        <div className="workspace-header-main-row">
          {/* ── Left Area: Subtle PreOne Celestial Sparkle Identity ── */}
          <div className="workspace-header-left">
            <Link
              href="/app/home"
              prefetch={true}
              className="workspace-sparkle-anchor"
              aria-label="PreOne OS Home"
              title="PreOne OS Home"
            >
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={user.tenantName || 'School Logo'}
                  className="h-6 w-6 object-contain rounded drop-shadow-xs transition-transform duration-200 hover:scale-105"
                />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transform-gpu transition-transform duration-200 hover:rotate-12"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
                    fill="url(#workspaceHeaderSparkleGrad)"
                  />
                  <circle cx="18.5" cy="5.5" r="1.5" fill="#F59E0B" />
                  <circle cx="5.5" cy="18.5" r="1.2" fill="#38BDF8" opacity="0.85" />
                  <defs>
                    <linearGradient
                      id="workspaceHeaderSparkleGrad"
                      x1="2"
                      y1="2"
                      x2="22"
                      y2="22"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#9333EA" />
                      <stop offset="0.5" stopColor="#7C3AED" />
                      <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </Link>
          </div>

          {/* ── Center Area: Workspace Global Command Search Bar (Desktop ≥ lg) ── */}
          <div className="workspace-search-wrap hidden lg:flex">
            {renderSearchBar()}
          </div>

          {/* ── Right Area: Action Group + Dividers + User Profile ── */}
          <div className="workspace-actions-group">
            {/* Mobile / Tablet (< lg) Single Search Icon Button — BUG-014 root fix */}
            <button
              suppressHydrationWarning
              type="button"
              className="workspace-action-btn lg:hidden"
              aria-label="Open global search (⌘K)"
              title="Search (⌘K)"
              onClick={onOpenSearch}
            >
              <Search size={16} aria-hidden="true" />
              <span className="workspace-action-label" style={{ display: 'none' }}>Search</span>
            </button>

            {/* 1. Help Button (≥ lg; below lg available in Profile menu) */}
            <HelpButton onClick={onOpenHelp} className="hidden lg:inline-flex" />

            {/* 2. Full Screen Button (≥ lg; below lg available in Profile menu) */}
            <FullscreenButton className="hidden lg:inline-flex" />

            {/* 2.5 Language Selector (≥ lg; below lg available in Profile menu) */}
            <div ref={langRef} className="hidden lg:block" style={{ position: 'relative' }}>
              <button
                suppressHydrationWarning
                type="button"
                className={`workspace-action-btn ${langOpen ? 'active' : ''}`}
                aria-label={t('header.language')}
                title={t('header.language')}
                onClick={() => setLangOpen((prev) => !prev)}
              >
                <Languages size={16} aria-hidden="true" />
                <span className="workspace-action-label">
                  {locale === 'hi-IN' ? 'हिंदी' : locale === 'mr-IN' ? 'मराठी' : 'EN'}
                </span>
              </button>

              {langOpen && (
                <div
                  role="menu"
                  className="dropdown-menu absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('header.language')}
                  </div>
                  {SUPPORTED_LOCALES.map((loc) => {
                    const isSelected = locale === loc.code
                    return (
                      <button
                        key={loc.code}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setLocale(loc.code)
                          setLangOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{loc.nativeName}</span>
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. Theme Toggle Button */}
            <button
              suppressHydrationWarning
              type="button"
              className="workspace-action-btn"
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              onClick={onToggleTheme}
            >
              {theme === 'light' ? (
                <Moon size={16} aria-hidden="true" />
              ) : (
                <Sun size={16} aria-hidden="true" />
              )}
              <span className="workspace-action-label">{t('header.theme')}</span>
            </button>


        {/* 4. Inbox (Needs Attention) Action & Popover */}
        <div style={{ position: 'relative' }}>
          <button
            suppressHydrationWarning
            ref={attnBtnRef}
            type="button"
            className={`workspace-action-btn ${attnOpen ? 'active' : ''}`}
            aria-label="Inbox & Attention"
            aria-haspopup="dialog"
            aria-expanded={attnOpen}
            title={
              attentionTotal > 0
                ? `${attentionTotal} item${attentionTotal === 1 ? '' : 's'} need attention`
                : 'Inbox'
            }
            onClick={onToggleAttn}
          >
            <Inbox size={16} aria-hidden="true" />
            <span className="workspace-action-label">Inbox</span>
            {attentionTotal > 0 && (
              <span className="workspace-badge badge-amber">
                {attentionTotal > 99 ? '99+' : attentionTotal}
              </span>
            )}
          </button>

          {attnOpen && (
            <div ref={attnRef} className="workspace-popover" role="dialog" aria-label="Needs attention">
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Inbox size={15} />
                  <b style={{ fontSize: 13.5 }}>Needs attention</b>
                  {attentionTotal > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        flexShrink: 0,
                        background: 'var(--warning-strong, var(--warning))',
                        color: 'var(--text-inverse, #ffffff)',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    >
                      {attentionTotal}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11.5, padding: '2px 6px' }}
                  onClick={onDismissAttn}
                >
                  Dismiss
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, maxHeight: 340 }}>
                {attentionTotal === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center' }} className="txt-muted">
                    <p style={{ fontSize: 13 }}>You're all caught up</p>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/app/users?tab=PENDING"
                      onClick={onDismissAttn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span className="tico g-purple" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <UserPlus size={14} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>
                          Pending invitations
                        </span>
                        <span className="txt-muted" style={{ fontSize: 11, display: 'block' }}>
                          Awaiting enrolment or password setup
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          flexShrink: 0,
                          background: 'var(--warning-strong, #d97706)',
                          color: '#fff',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {attention.invited}
                      </span>
                      <ChevronRight size={14} className="txt-muted" style={{ flexShrink: 0 }} />
                    </Link>
                    <Link
                      href="/app/users?status=SUSPENDED"
                      onClick={onDismissAttn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span className="tico g-orange" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <Ban size={14} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>
                          Suspended accounts
                        </span>
                        <span className="txt-muted" style={{ fontSize: 11, display: 'block' }}>
                          Portal access blocked until reactivated
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          flexShrink: 0,
                          background: 'var(--warning-strong, #d97706)',
                          color: '#fff',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {attention.suspended}
                      </span>
                      <ChevronRight size={14} className="txt-muted" style={{ flexShrink: 0 }} />
                    </Link>
                  </>
                )}
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href="/app/users"
                  onClick={onDismissAttn}
                  style={{
                    fontSize: 12,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Open Users &amp; Access →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 5. Alerts (Notifications) Action & Popover */}
        <div style={{ position: 'relative' }}>
          <button
            suppressHydrationWarning
            ref={bellBtnRef}
            type="button"
            className={`workspace-action-btn ${notifOpen ? 'active' : ''}`}
            aria-label="Alerts and Notifications"
            title={
              unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'Alerts'
            }
            onClick={onToggleNotif}
          >
            <Bell size={16} aria-hidden="true" />
            <span className="workspace-action-label">Alerts</span>
            {unreadCount > 0 && (
              <span className="workspace-badge badge-primary">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div ref={notifRef} className="workspace-popover" role="dialog" aria-label="Notifications">
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={15} />
                  <b style={{ fontSize: 13.5 }}>Notifications</b>
                  {unreadCount > 0 && (
                    <span className="badge b-blue" style={{ fontSize: 11 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11.5, padding: '2px 6px' }}
                    onClick={onMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, maxHeight: 340 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center' }} className="txt-muted">
                    <p style={{ fontSize: 13 }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && onMarkRead(n.id)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: n.isRead ? 500 : 600 }}>
                          {n.title}
                        </span>
                        <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>
                          {n.category}
                        </span>
                      </div>
                      <p
                        className="txt-muted"
                        style={{ fontSize: 12, marginTop: 3, lineHeight: 1.35 }}
                      >
                        {n.body}
                      </p>
                      <span
                        className="txt-muted"
                        style={{ fontSize: 10.5, marginTop: 4, display: 'block' }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href="/app/settings"
                  onClick={onToggleNotif}
                  style={{
                    fontSize: 12,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Manage notification settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 6. Subtle Divider */}
        <div className="workspace-header-divider" aria-hidden="true" />

        {/* 7. Authenticated User Profile & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            suppressHydrationWarning
            ref={avatarRef}
            type="button"
            className={`workspace-profile-btn ${profileMenuOpen ? 'active' : ''}`}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-label="Open user profile menu"
            aria-expanded={profileMenuOpen}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="workspace-profile-info">
              <b className="workspace-profile-name">{user.name}</b>
              <span className="workspace-profile-role">{roleLabel}</span>
            </div>
            <ChevronDown
              size={13}
              className={`workspace-profile-chevron transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              className="workspace-popover"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 270,
                maxWidth: 'calc(100vw - 24px)',
                maxHeight: 'calc(100vh - 84px)',
                padding: 0,
                zIndex: 100,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
              role="menu"
              aria-label="Profile options"
            >
              {/* Account Overview Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name}
                      </div>
                      <div className="txt-muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  {/* Immediate 1-tap Sign out button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      onLogout?.()
                    }}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6,
                      flexShrink: 0,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                    title="Sign out immediately"
                  >
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ fontSize: 10, fontWeight: 600 }}>{roleLabel}</span>
                  {user.branchName && (
                    <span className="badge" style={{ fontSize: 10 }}>{user.branchName}</span>
                  )}
                </div>
              </div>

              {/* Action Links */}
              <div style={{ padding: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    onOpenMyProfile?.()
                  }}
                  className="dropdown-item"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    color: 'inherit',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <User size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>My Profile</div>
                    <div className="txt-muted" style={{ fontSize: 10.5 }}>View &amp; edit personal details and photo</div>
                  </div>
                </button>

                <Link
                  href="/app/settings?tab=preferences"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 12.5,
                    color: 'inherit',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <Sparkles size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>Theme &amp; Glow</div>
                    <div className="txt-muted" style={{ fontSize: 10.5 }}>Appearance &amp; preferences</div>
                  </div>
                </Link>

                {/* Mobile tools that collapsed from topbar into profile menu below lg */}
                <div className="lg:hidden">
                  <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '4px 0' }} />

                  {/* Language Selector (< lg) */}
                  <div style={{ padding: '6px 10px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      {t('header.language')}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {SUPPORTED_LOCALES.map((loc) => {
                        const isSelected = locale === loc.code
                        return (
                          <button
                            key={loc.code}
                            type="button"
                            onClick={() => setLocale(loc.code)}
                            className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                          >
                            {loc.nativeName}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Help & Documentation (< lg) */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      onOpenHelp()
                    }}
                    className="dropdown-item"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      color: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <HelpCircle size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Help &amp; Documentation</div>
                      <div className="txt-muted" style={{ fontSize: 10.5 }}>Keyboard shortcuts &amp; guides</div>
                    </div>
                  </button>

                  {/* Full Screen Toggle (< lg) */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                        if (document.documentElement.requestFullscreen) {
                          document.documentElement.requestFullscreen()
                        } else if ((document.documentElement as any).webkitRequestFullscreen) {
                          (document.documentElement as any).webkitRequestFullscreen()
                        }
                      } else {
                        if (document.exitFullscreen) {
                          document.exitFullscreen()
                        } else if ((document as any).webkitExitFullscreen) {
                          (document as any).webkitExitFullscreen()
                        }
                      }
                    }}
                    className="dropdown-item"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      color: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <Maximize2 size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Toggle Full Screen</div>
                      <div className="txt-muted" style={{ fontSize: 10.5 }}>Maximize canvas view</div>
                    </div>
                  </button>
                </div>

                <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    onLogout?.()
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    color: 'var(--danger)',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <LogOut size={15} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
</div>
  )
}

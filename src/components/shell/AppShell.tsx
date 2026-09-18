'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Bell, Sun, Moon, LogOut, ChevronRight, Clock3, Inbox, UserPlus, Ban, Keyboard, X,
} from 'lucide-react'
import { PLogoMark, PLogoWordmark } from '@/components/preone/PLogo'
import { Avatar } from '@/components/preone/ui'
import { navForRole, NavItem } from '@/lib/nav'
import { Role } from '@/lib/auth'
import { enumLabel, timeAgo } from '@/lib/format'
import { GlobalSearchModal } from '@/components/shell/GlobalSearchModal'
import { RouteProgress } from '@/components/preone/RouteProgress'

export interface ShellUser {
  name: string
  email: string
  role: Role
  tenantName: string
  branchName: string | null
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [clock, setClock] = useState({ time: '', date: '' })
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)
  const headerSearchRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)

  // Notification center state
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifOpen, setNotifOpen] = useState<boolean>(false)
  const [attention, setAttention] = useState<{ invited: number; suspended: number }>({ invited: 0, suspended: 0 })
  const [attnOpen, setAttnOpen] = useState<boolean>(false)
  const [shortcutOpen, setShortcutOpen] = useState<boolean>(false)
  const bellBtnRef = useRef<HTMLButtonElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const attnBtnRef = useRef<HTMLButtonElement>(null)
  const attnRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications?limit=10').then((r) => r.json())
      if (res.success && res.data) {
        setNotifications(res.data.items || [])
        setUnreadCount(res.data.unreadCount || 0)
      }
    } catch {
      // quiet failure in shell
    }
  }, [])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // quiet
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark-all-read', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // quiet
    }
  }

  // Poll unread notification count on mount & every 30s
  useEffect(() => {
    const checkCount = async () => {
      try {
        const res = await fetch('/api/v1/notifications/unread-count').then((r) => r.json())
        if (res.success && typeof res.data?.count === 'number') {
          setUnreadCount(res.data.count)
        }
      } catch {
        // quiet
      }
    }
    checkCount()
    const timer = setInterval(checkCount, 30000)
    return () => clearInterval(timer)
  }, [])

  // Poll users KPIs for the "needs attention" panel (quiet fail for non-privileged roles)
  useEffect(() => {
    const loadAttention = async () => {
      try {
        const res = await fetch('/api/v1/users?pageSize=1').then((r) => r.json())
        if (res.success && res.meta?.kpis) {
          setAttention({
            invited: res.meta.kpis.pending || 0,
            suspended: res.meta.kpis.suspended || 0,
          })
        }
      } catch {
        // quiet
      }
    }
    loadAttention()
    const timer = setInterval(loadAttention, 60000)
    return () => clearInterval(timer)
  }, [])

  const nav = useMemo(() => navForRole(user.role), [user.role])


  // theme boot + persistence (reads localStorage once on mount)
  useEffect(() => {
    const t = (localStorage.getItem('preone-theme') as 'light' | 'dark') || 'light'
    document.documentElement.setAttribute('data-theme', t)
    queueMicrotask(() => setTheme(t))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('preone-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  // live clock (taskbar)
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock({
        time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      })
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  // keyboard: Ctrl/⌘+K opens global search modal; Esc closes; / opens start menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMenuOpen(false)
        setSearchModalOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchModalOpen(false)
        setAttnOpen(false)
        setShortcutOpen(false)
      } else if (e.key === '/' && !inInput && !searchModalOpen) {
        e.preventDefault()
        setMenuOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      } else if (e.key === '?' && !inInput) {
        e.preventDefault()
        setSearchModalOpen(false)
        setMenuOpen(false)
        setShortcutOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchModalOpen])

  // close menu, search modal, notifications & attention panel on navigation
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMenuOpen(false)
    setSearchModalOpen(false)
    setNotifOpen(false)
    setAttnOpen(false)
    setShortcutOpen(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname])

  // close the start menu and notification popover when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!target || !target.isConnected) return

      if (menuOpen) {
        if (!menuRef.current?.contains(target) &&
            !startBtnRef.current?.contains(target) &&
            !headerSearchRef.current?.contains(target) &&
            !avatarRef.current?.contains(target)) {
          setMenuOpen(false)
        }
      }

      if (notifOpen) {
        if (!notifRef.current?.contains(target) &&
            !bellBtnRef.current?.contains(target)) {
          setNotifOpen(false)
        }
      }

      if (attnOpen) {
        if (!attnRef.current?.contains(target) &&
            !attnBtnRef.current?.contains(target)) {
          setAttnOpen(false)
        }
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [menuOpen, notifOpen, attnOpen])

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }, [router])

  const q = query.trim().toLowerCase()
  const filteredTiles = q ? nav.filter((n) => n.label.toLowerCase().includes(q)) : nav

  const roleLabel = enumLabel(user.role)
  const initials = user.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
  const attentionTotal = attention.invited + attention.suspended

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <RouteProgress />
      {/* ── Header ── */}
      <header className="app-header">
        {pathname !== '/app/home' && pathname !== '/app' && (
          <Link href="/app" className="h-logo" aria-label="PreOne home">
            <PLogoWordmark />
          </Link>
        )}
        <div className="h-spacer" />
        <div className="h-search" onClick={() => setSearchModalOpen(true)} style={{ cursor: 'pointer' }}>
          <Search />
          <input
            suppressHydrationWarning
            ref={headerSearchRef}
            placeholder="Search students, staff, invoices, classes…"
            onFocus={(e) => {
              e.preventDefault()
              setSearchModalOpen(true)
            }}
            readOnly
            aria-label="Global search"
            style={{ cursor: 'pointer' }}
          />
          <kbd>⌘K</kbd>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            suppressHydrationWarning
            ref={bellBtnRef}
            className="h-icbtn"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((v) => !v)
              if (!notifOpen) loadNotifications()
            }}
          >
            <Bell />
            {unreadCount > 0 && <span className="cnt">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          {notifOpen && (
            <div
              ref={notifRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(340px, calc(100vw - 20px))',
                maxWidth: 'calc(100vw - 20px)',
                maxHeight: 440,
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={15} />
                  <b style={{ fontSize: 13.5 }}>Notifications</b>
                  {unreadCount > 0 && <span className="badge b-blue" style={{ fontSize: 11 }}>{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11.5, padding: '2px 6px' }}
                    onClick={markAllRead}
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
                      onClick={() => !n.isRead && markRead(n.id)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border, #f1f5f9)',
                        backgroundColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: n.isRead ? 500 : 600 }}>{n.title}</span>
                        <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>{n.category}</span>
                      </div>
                      <p className="txt-muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.35 }}>{n.body}</p>
                      <span className="txt-muted" style={{ fontSize: 10.5, marginTop: 4, display: 'block' }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid var(--border, #e2e8f0)',
                  backgroundColor: 'var(--bg-subtle, #f8fafc)',
                  textAlign: 'center',
                }}
              >
                <Link
                  href="/app/settings"
                  onClick={() => setNotifOpen(false)}
                  style={{ fontSize: 12, color: 'var(--primary, #6366f1)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Manage notification settings →
                </Link>
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            suppressHydrationWarning
            ref={attnBtnRef}
            className="h-icbtn"
            aria-label="Needs attention"
            aria-haspopup="dialog"
            aria-expanded={attnOpen}
            title={attentionTotal > 0 ? `${attentionTotal} item${attentionTotal === 1 ? '' : 's'} need attention` : 'Needs attention'}
            onClick={() => setAttnOpen((v) => !v)}
          >
            <Inbox />
            {attentionTotal > 0 && <span className="cnt cnt-amber">{attentionTotal > 99 ? '99+' : attentionTotal}</span>}
          </button>

          {attnOpen && (
            <div
              ref={attnRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(340px, calc(100vw - 20px))',
                maxWidth: 'calc(100vw - 20px)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Inbox size={15} />
                  <b style={{ fontSize: 13.5 }}>Needs attention</b>
                  {attentionTotal > 0 && (
                    <span style={{
                      fontSize: 11, flexShrink: 0, background: 'var(--warning-strong, #d97706)', color: '#fff',
                      borderRadius: 999, padding: '2px 8px', fontWeight: 700, lineHeight: 1.3,
                    }}>{attentionTotal}</span>
                  )}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 11.5, padding: '2px 6px' }} onClick={() => setAttnOpen(false)}>
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
                      onClick={() => setAttnOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
                        borderBottom: '1px solid var(--border, #f1f5f9)', textDecoration: 'none', color: 'inherit',
                      }}
                    >
                      <span className="tico g-purple" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <UserPlus size={14} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>Pending invitations</span>
                        <span className="txt-muted" style={{ fontSize: 11, display: 'block' }}>Awaiting enrolment or password setup</span>
                      </span>
                      <span style={{
                          fontSize: 11, flexShrink: 0, background: 'var(--warning-strong, #d97706)', color: '#fff',
                          borderRadius: 999, padding: '2px 8px', fontWeight: 700, lineHeight: 1.3,
                        }}>{attention.invited}</span>
                      <ChevronRight size={14} className="txt-muted" style={{ flexShrink: 0 }} />
                    </Link>
                    <Link
                      href="/app/users?status=SUSPENDED"
                      onClick={() => setAttnOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
                        borderBottom: '1px solid var(--border, #f1f5f9)', textDecoration: 'none', color: 'inherit',
                      }}
                    >
                      <span className="tico g-orange" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <Ban size={14} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>Suspended accounts</span>
                        <span className="txt-muted" style={{ fontSize: 11, display: 'block' }}>Portal access blocked until reactivated</span>
                      </span>
                      <span style={{
                          fontSize: 11, flexShrink: 0, background: 'var(--warning-strong, #d97706)', color: '#fff',
                          borderRadius: 999, padding: '2px 8px', fontWeight: 700, lineHeight: 1.3,
                        }}>{attention.suspended}</span>
                      <ChevronRight size={14} className="txt-muted" style={{ flexShrink: 0 }} />
                    </Link>
                  </>
                )}
              </div>

              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border, #e2e8f0)',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                textAlign: 'center',
              }}>
                <Link
                  href="/app/users"
                  onClick={() => setAttnOpen(false)}
                  style={{ fontSize: 12, color: 'var(--primary, #6366f1)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Open Users &amp; Access →
                </Link>
              </div>
            </div>
          )}
        </div>
        <button suppressHydrationWarning className="h-avatar" ref={avatarRef} onClick={() => setMenuOpen(true)} aria-label="Open start menu">
          <span className="avatar sm a-p">{initials}</span>
          <span className="who">
            <b>{user.name}</b>
            <span>{roleLabel}</span>
          </span>
        </button>
      </header>

      {/* ── Content ── */}
      <main id="main" className="app-main">
        <div className="app-content">{children}</div>
      </main>

      {/* ── Start menu ── */}
      <div className={`startmenu${menuOpen ? '' : ' hidden'}`} ref={menuRef} role="menu" aria-hidden={!menuOpen}>
        <div className="sm-head">
          <div className="sm-search">
            <Search />
            <input
              suppressHydrationWarning
              ref={searchRef}
              placeholder="Search modules…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search modules"
            />
          </div>
        </div>
        <div className="sm-body">
          <div className="sm-title">Pinned · {user.tenantName}</div>
          <div className="sm-grid">
            {filteredTiles.map((n: NavItem) => {
              const Icon = n.icon
              return (
                <Link key={n.key} href={n.href} className="sm-tile" role="menuitem">
                  <span className={`tico ${n.grad}`}>
                    <Icon size={22} />
                  </span>
                  <span>{n.label}</span>
                </Link>
              )
            })}
            {filteredTiles.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '20px 0', textAlign: 'center' }} className="t-body">
                No modules match “{query}”
              </div>
            )}
          </div>
          <div className="sm-title">All sections</div>
          <div className="sm-list">
            {filteredTiles.map((n: NavItem) => {
              const Icon = n.icon
              return (
                <div key={`g-${n.key}`} className="nav-group" style={{ marginBottom: 4 }}>
                  <Link href={n.href} className="nav-item" role="menuitem">
                    <Icon />
                    {n.label}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
        <div className="sm-foot">
          <div className="sm-user">
            <span className={`avatar sm a-p`}>{initials}</span>
            <span className="who">
              <b>{user.name}</b>
              <span>{user.email}</span>
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Taskbar ── */}
      <nav className="taskbar" aria-label="Taskbar">
        <button
          suppressHydrationWarning
          ref={startBtnRef}
          className={`tb-start${menuOpen ? ' on' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Start"
          aria-expanded={menuOpen}
        >
          <PLogoMark size={36} />
        </button>
        <span className="tb-sep" />
        {nav.slice(0, 5).map((n) => {
          const Icon = n.icon
          const active = n.href === '/app/home' ? pathname === '/app/home' : pathname.startsWith(n.href)
          return (
            <Link
              key={n.key}
              href={n.href}
              className={`tb-pin${active ? ' active' : ''}`}
              title={n.label}
              aria-label={n.label}
            >
              <Icon />
            </Link>
          )
        })}
        <div className="tb-right">
          <button suppressHydrationWarning className="h-icbtn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon /> : <Sun />}
          </button>
          <div className="tb-clock" aria-label="Clock">
            <b>{clock.time}</b>
            <span>{clock.date}</span>
          </div>
        </div>
      </nav>

      {/* ── Global Search Command Palette Modal ── */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* ── Keyboard shortcut cheat sheet (? key) ── */}
      {shortcutOpen && (
        <div
          className="cheatsheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShortcutOpen(false)
          }}
        >
          <div className="cheatsheet-panel">
            <div className="cheatsheet-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="tico g-purple" style={{ width: 32, height: 32, borderRadius: 9 }}>
                  <Keyboard size={15} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>Keyboard shortcuts</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Get around PreOne without leaving the keyboard
                  </div>
                </div>
              </div>
              <button className="x-btn" onClick={() => setShortcutOpen(false)} aria-label="Close keyboard shortcuts">
                <X />
              </button>
            </div>

            <div className="cheatsheet-body">
              {[
                {
                  group: 'Global',
                  keys: [
                    { combo: '⌘ / Ctrl + K', label: 'Open search & command palette' },
                    { combo: '/', label: 'Open the start menu' },
                    { combo: '?', label: 'Toggle this cheat sheet' },
                    { combo: 'Esc', label: 'Close menus, panels and modals' },
                  ],
                },
                {
                  group: 'Inside the palette',
                  keys: [
                    { combo: '↑ ↓', label: 'Move through results or commands' },
                    { combo: 'Enter', label: 'Open the highlighted item' },
                    { combo: '>', label: 'Prefix a query to run a command' },
                    { combo: 'Esc', label: 'Close the palette' },
                  ],
                },
                {
                  group: 'Everywhere',
                  keys: [
                    { combo: 'Tab', label: 'Move to the next field or control' },
                    { combo: 'Shift + Tab', label: 'Move to the previous field or control' },
                  ],
                },
              ].map((g) => (
                <div key={g.group} className="cheatsheet-group">
                  <div className="cheatsheet-group-title">{g.group}</div>
                  {g.keys.map((k) => (
                    <div key={k.combo} className="cheatsheet-row">
                      <span className="cheatsheet-combo">
                        {k.combo.split(' + ').map((token, i) => (
                          <React.Fragment key={`${k.combo}-${token}`}>
                            {i > 0 && <span className="cheatsheet-plus">+</span>}
                            <kbd>{token}</kbd>
                          </React.Fragment>
                        ))}
                      </span>
                      <span className="cheatsheet-label">{k.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="cheatsheet-foot">
              Press <kbd>?</kbd> anywhere to toggle this sheet
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function ClockIcon() {
  return <Clock3 size={16} />
}

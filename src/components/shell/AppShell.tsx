'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Bell, Sun, Moon, LogOut, ChevronRight, Clock3,
} from 'lucide-react'
import { PLogoMark, PLogoWordmark } from '@/components/preone/PLogo'
import { Avatar } from '@/components/preone/ui'
import { navForRole, NavItem } from '@/lib/nav'
import { Role } from '@/lib/auth'
import { enumLabel } from '@/lib/format'

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
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [clock, setClock] = useState({ time: '', date: '' })
  const searchRef = useRef<HTMLInputElement>(null)

  const nav = useMemo(() => navForRole(user.role), [user.role])

  // current module from path
  const current = useMemo(() => {
    const match = nav.find((n) => pathname.startsWith(n.href))
    return match?.label || 'Dashboard'
  }, [nav, pathname])

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

  // keyboard: Ctrl/⌘+K or / opens start menu; Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMenuOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setMenuOpen(false)
      } else if (e.key === '/' && !inInput) {
        e.preventDefault()
        setMenuOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // close menu on navigation
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenuOpen(false), [pathname])

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }, [router])

  const q = query.trim().toLowerCase()
  const filteredTiles = q ? nav.filter((n) => n.label.toLowerCase().includes(q)) : nav

  const roleLabel = enumLabel(user.role)
  const initials = user.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  return (
    <>
      {/* ── Header ── */}
      <header className="app-header">
        <Link href="/app/dashboard" className="h-logo" aria-label="PreOne home">
          <PLogoMark size={34} />
          <PLogoWordmark />
        </Link>
        <div className="h-breadcrumb">
          <span>{user.tenantName}</span>
          <ChevronRight size={13} />
          <b>{current}</b>
        </div>
        <div className="h-spacer" />
        <div className="h-search">
          <Search />
          <input
            placeholder="Search modules, students…"
            onFocus={() => { setMenuOpen(true); setTimeout(() => searchRef.current?.focus(), 30) }}
            readOnly
            aria-label="Global search"
          />
          <kbd>⌘K</kbd>
        </div>
        <button className="h-icbtn" aria-label="Notifications">
          <Bell />
          <span className="cnt">3</span>
        </button>
        <button className="h-avatar" onClick={() => setMenuOpen(true)} aria-label="Open start menu">
          <span className="avatar sm a-p">{initials}</span>
          <span className="who">
            <b>{user.name}</b>
            <span>{roleLabel}</span>
          </span>
        </button>
      </header>

      {/* ── Content ── */}
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>

      {/* ── Start menu ── */}
      <div className={`startmenu${menuOpen ? '' : ' hidden'}`} role="menu" aria-hidden={!menuOpen}>
        <div className="sm-head">
          <div className="sm-search">
            <Search />
            <input
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
          const active = pathname.startsWith(n.href)
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
          <button className="h-icbtn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon /> : <Sun />}
          </button>
          <button className="h-icbtn" aria-label="Notifications">
            <Bell />
            <span className="cnt">3</span>
          </button>
          <div className="tb-clock" aria-label="Clock">
            <b>{clock.time}</b>
            <span>{clock.date}</span>
          </div>
        </div>
      </nav>
    </>
  )
}

export function ClockIcon() {
  return <Clock3 size={16} />
}

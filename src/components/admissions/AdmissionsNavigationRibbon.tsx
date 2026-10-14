'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  PhoneCall,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  BarChart3,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react'

export interface AdmissionsNavigationModule {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number | string
  accent: 'rose' | 'amber' | 'violet' | 'emerald' | 'teal' | 'indigo' | 'blue'
}

export const ADMISSIONS_MODULES: AdmissionsNavigationModule[] = [
  {
    key: 'enquiries',
    label: 'Enquiries',
    href: '/app/admissions/enquiries',
    icon: Users,
    accent: 'rose',
  },
  {
    key: 'follow-ups',
    label: 'Follow-ups',
    href: '/app/admissions/follow-ups',
    icon: PhoneCall,
    accent: 'amber',
  },
  {
    key: 'applications',
    label: 'Applications',
    href: '/app/admissions/applications',
    icon: FileSpreadsheet,
    accent: 'violet',
  },
  {
    key: 'admitted',
    label: 'Confirmed Admissions',
    href: '/app/admissions/admitted',
    icon: GraduationCap,
    accent: 'emerald',
  },
  {
    key: 'classroom-placements',
    label: 'Classroom Placements',
    href: '/app/admissions/classroom-placements',
    icon: LayoutGrid,
    accent: 'teal',
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/app/admissions/reports',
    icon: BarChart3,
    accent: 'indigo',
  },
]

// Signature styling dictionary per module accent
const MODULE_THEMES = {
  blue: {
    activePill:
      'bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/80 shadow-xs shadow-blue-500/10',
    activeDot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]',
    activeIcon: 'text-blue-600 dark:text-blue-400',
    activeBadge: 'bg-blue-600 text-white',
    inactiveBadge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    inactive:
      'text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/30',
  },
  rose: {
    activePill:
      'bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/80 shadow-xs shadow-rose-500/15',
    activeDot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]',
    activeIcon: 'text-rose-600 dark:text-rose-400',
    activeBadge: 'bg-rose-500 text-white',
    inactiveBadge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
    inactive:
      'text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30',
  },
  amber: {
    activePill:
      'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80 shadow-xs shadow-amber-500/15',
    activeDot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
    activeIcon: 'text-amber-600 dark:text-amber-400',
    activeBadge: 'bg-orange-500 text-white',
    inactiveBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    inactive:
      'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/70 dark:hover:bg-amber-950/30',
  },
  violet: {
    activePill:
      'bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-300/80 dark:border-violet-700/80 shadow-xs shadow-violet-500/15',
    activeDot: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.7)]',
    activeIcon: 'text-violet-600 dark:text-violet-400',
    activeBadge: 'bg-violet-600 text-white',
    inactiveBadge: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
    inactive:
      'text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/70 dark:hover:bg-violet-950/30',
  },
  emerald: {
    activePill:
      'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80 shadow-xs shadow-emerald-500/15',
    activeDot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
    activeIcon: 'text-emerald-600 dark:text-emerald-400',
    activeBadge: 'bg-emerald-600 text-white',
    inactiveBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    inactive:
      'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30',
  },
  teal: {
    activePill:
      'bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300/80 dark:border-teal-700/80 shadow-xs shadow-teal-500/15',
    activeDot: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]',
    activeIcon: 'text-teal-600 dark:text-teal-400',
    activeBadge: 'bg-teal-600 text-white',
    inactiveBadge: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300',
    inactive:
      'text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/70 dark:hover:bg-teal-950/30',
  },
  indigo: {
    activePill:
      'bg-gradient-to-r from-indigo-500/15 via-blue-500/10 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/80 shadow-xs shadow-indigo-500/15',
    activeDot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]',
    activeIcon: 'text-indigo-600 dark:text-indigo-400',
    activeBadge: 'bg-indigo-600 text-white',
    inactiveBadge: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
    inactive:
      'text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30',
  },
}

export interface AdmissionsNavigationRibbonProps {
  moduleCounts?: Partial<Record<string, number>>
  className?: string
}

export function AdmissionsNavigationRibbon({
  moduleCounts = {},
  className = '',
}: AdmissionsNavigationRibbonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isControlCenterActive = pathname === '/app/admissions'
  const homeTheme = MODULE_THEMES.blue
  const navContainerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLAnchorElement>(null)

  // Auto-scroll the active tab into view on route change/initial mount
  useEffect(() => {
    if (activeTabRef.current && navContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [pathname])

  const allWorkspaces = [
    { key: 'control-center', label: 'Control Center', href: '/app/admissions' },
    ...ADMISSIONS_MODULES.map((m) => ({ key: m.key, label: m.label, href: m.href })),
  ]

  const currentWorkspaceHref = allWorkspaces.find((w) =>
    w.href === '/app/admissions' ? pathname === '/app/admissions' : pathname.startsWith(w.href)
  )?.href || '/app/admissions'

  return (
    <div className={`w-full min-w-0 max-w-full flex flex-col gap-2 ${className}`}>
      {/* Mobile Workspace Selector (< sm: 320px - 639px) */}
      <div className="sm:hidden w-full">
        <label htmlFor="admissions-module-select" className="sr-only">
          Select Admissions Workspace
        </label>
        <div className="relative">
          <select
            id="admissions-module-select"
            value={currentWorkspaceHref}
            onChange={(e) => router.push(e.target.value)}
            className="w-full h-10 px-3.5 pr-10 rounded-xl bg-card/95 border border-border/80 text-xs font-semibold text-foreground shadow-xs appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            {allWorkspaces.map((w) => (
              <option key={w.key} value={w.href}>
                {w.label} {moduleCounts[w.key] ? `(${moduleCounts[w.key]})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Horizontal Multi-Color Vibrant Pills (Auto-centered & Touch-friendly across all screens) */}
      <div
        ref={navContainerRef}
        className="w-full min-w-0 max-w-full overflow-x-auto touch-pan-x rail-edge-fade scrollbar-none py-0.5"
      >
        <nav
          className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 [box-shadow:var(--shadow-1)] text-xs select-none"
          aria-label="Admissions Modules Multi-Color Navigation"
        >
          {/* ── Control Center Launcher Link ── */}
          <Link
            ref={isControlCenterActive ? activeTabRef : undefined}
            href="/app/admissions"
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border ${
              isControlCenterActive
                ? `${homeTheme.activePill} font-bold`
                : `border-transparent ${homeTheme.inactive} font-medium`
            }`}
          >
            {isControlCenterActive ? (
              <span className={`w-2 h-2 rounded-full ${homeTheme.activeDot} animate-pulse`} />
            ) : (
              <LayoutDashboard size={13} className="text-muted-foreground/80 shrink-0" />
            )}
            <span>Control Center</span>
          </Link>

          {/* Vertical subtle divider */}
          <div className="h-4 w-px bg-border/70 mx-0.5 shrink-0" aria-hidden="true" />

          {/* ── Dedicated Workspaces (Multi-Color Vibrant Pills) ── */}
          {ADMISSIONS_MODULES.map((mod) => {
            const Icon = mod.icon
            const isActive = pathname.startsWith(mod.href)
            const count = moduleCounts[mod.key]
            const theme = MODULE_THEMES[mod.accent] || MODULE_THEMES.blue

            return (
              <Link
                key={mod.key}
                ref={isActive ? activeTabRef : undefined}
                href={mod.href}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border ${
                  isActive
                    ? `${theme.activePill} font-bold`
                    : `border-transparent ${theme.inactive} font-medium`
                }`}
              >
                {/* Glowing animated dot for active tab */}
                {isActive && (
                  <span className={`w-2 h-2 rounded-full ${theme.activeDot} animate-pulse shrink-0`} />
                )}

                {/* Module Icon */}
                <Icon
                  size={14}
                  className={`transition-colors shrink-0 ${
                    isActive ? theme.activeIcon : 'text-muted-foreground'
                  }`}
                />

                {/* Module Label */}
                <span className={isActive ? 'font-bold' : ''}>{mod.label}</span>

                {/* Live Count Badge */}
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] transition-all font-bold ${
                      isActive ? `${theme.activeBadge} shadow-2xs` : theme.inactiveBadge
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

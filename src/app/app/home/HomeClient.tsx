'use client'

import React, { useMemo, useState, useEffect } from 'react'
import type { Role } from '@/lib/auth'
import type { BrandingConfig } from '@/lib/branding-types'
import { homeModules, type HomeModule } from '@/lib/modules'
import { ModuleCard, PLogoWordmark } from '@/components/preone'
import { useI18n } from '@/lib/i18n/context'
import { useBranding } from '@/lib/branding-context'

export interface HomeClientProps {
  role: Role
  branding?: BrandingConfig
  user?: {
    name: string
    role: Role
    tenantName: string
    branchName?: string | null
  }
}

export function HomeClient({ role, branding: initialBranding, user: initialUser }: HomeClientProps) {
  const { t } = useI18n()
  const contextBranding = useBranding()
  const [clientBranding, setClientBranding] = useState<BrandingConfig | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [greetingKey, setGreetingKey] = useState('home.welcomeBack')

  // Resolve canonical active branding: client override -> context subscription -> SSR initial prop
  const branding = clientBranding || contextBranding || initialBranding

  // Synchronize schoolName and campusName into user context
  const resolvedSchoolName = branding?.schoolName?.trim() || initialUser?.tenantName?.trim() || 'PreOne'
  const user = initialUser
    ? {
        ...initialUser,
        tenantName: resolvedSchoolName,
        branchName: branding?.campusName || initialUser.branchName || null,
      }
    : undefined

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey('home.goodMorning')
    else if (hour < 17) setGreetingKey('home.goodAfternoon')
    else setGreetingKey('home.goodEvening')
  }, [])

  // Live real-time branding synchronization across Setup updates and tabs
  useEffect(() => {
    const handleBrandingSync = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setClientBranding(detail)
        setLogoError(false)
      } else {
        fetch('/api/v1/branding')
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            if (j?.success && j.data) {
              setClientBranding(j.data)
              setLogoError(false)
            }
          })
          .catch(() => {})
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('preone:branding-updated', handleBrandingSync)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('preone:branding-updated', handleBrandingSync)
      }
    }
  }, [])

  // Reset logo error flag when logoUrl changes
  useEffect(() => {
    setLogoError(false)
  }, [branding?.logoUrl])

  const modules = useMemo<HomeModule[]>(
    () =>
      homeModules(role)
        .filter((m) => m.key !== 'home')
        .map((m) => {
          const navKey = `nav.${m.key === 'daily-diary' ? 'dailyDiary' : m.key === 'learning' || m.key === 'preo-learning' || m.key === 'preo_learning' ? 'learning' : m.key}`
          const localizedTitle = t(navKey)
          return {
            ...m,
            label: localizedTitle && localizedTitle !== navKey ? localizedTitle : m.label,
          }
        }),
    [role, t]
  )

  const firstName = user?.name ? user.name.split(' ')[0] : 'Educator'
  const campusName = branding?.campusName || user?.branchName || null

  return (
    <div className="home">
      {/* ── Centered PreOne Brand Logo & Preschool Workspace Context ── */}
      <section className="home-center-hero" aria-label="PreOne Home">
        <div className="home-center-brand">
          {branding?.logoUrl ? (
            !logoError ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={branding.logoUrl}
                  alt={user?.tenantName || branding?.schoolName || 'School Logo'}
                  className="h-16 max-h-16 max-w-[260px] object-contain drop-shadow-sm rounded-lg transition-transform duration-200 hover:scale-102"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <PLogoWordmark subtitle="Preschool OS" />
            )
          ) : (
            <PLogoWordmark subtitle="Preschool OS" />
          )}
        </div>

        {/* Canonical School Title */}
        <h1
          className="text-xl sm:text-2xl font-bold tracking-tight text-center text-foreground mt-2 mb-1 max-w-xl mx-auto break-words leading-tight px-4"
          data-testid="home-school-title"
        >
          {user?.tenantName || branding?.schoolName || 'PreOne'}
        </h1>

        {user && (
          <div className="home-context-bar flex flex-wrap items-center justify-center gap-1.5" role="status">
            <span className="home-tenant-badge" data-testid="home-tenant-badge">
              <span className="home-tenant-dot" aria-hidden="true" />
              {user.tenantName || branding?.schoolName || 'PreOne'}
            </span>
            {campusName && (
              <>
                <span className="home-context-sep" aria-hidden="true">•</span>
                <span
                  className="home-campus-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 shadow-2xs"
                  data-testid="home-campus-badge"
                >
                  {campusName}
                </span>
              </>
            )}
            <span className="home-context-sep" aria-hidden="true">•</span>
            <span className="home-greeting">
              {t(greetingKey)}, <strong className="home-user-name">{firstName}</strong>
            </span>
          </div>
        )}
      </section>

      {/* ── Main Module Grid ── */}
      <main aria-label={t('nav.home')}>
        <div className="module-grid">
          {modules.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
        {modules.length === 0 && (
          <div className="home-note">{t('home.noModules')}</div>
        )}
      </main>
    </div>
  )
}

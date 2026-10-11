'use client'

import React, { useMemo, useState, useEffect } from 'react'
import type { Role } from '@/lib/auth'
import type { BrandingConfig } from '@/lib/branding-types'
import { homeModules, type HomeModule } from '@/lib/modules'
import { ModuleCard, PLogoWordmark } from '@/components/preone'
import { useI18n } from '@/lib/i18n/context'

export interface HomeClientProps {
  role: Role
  branding?: BrandingConfig
  user?: {
    name: string
    role: Role
    tenantName: string
  }
}

export function HomeClient({ role, branding, user }: HomeClientProps) {
  const { t } = useI18n()
  const [greetingKey, setGreetingKey] = useState('home.welcomeBack')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey('home.goodMorning')
    else if (hour < 17) setGreetingKey('home.goodAfternoon')
    else setGreetingKey('home.goodEvening')
  }, [])

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

  return (
    <div className="home">
      {/* ── Centered PreOne Brand Logo & Preschool Workspace Context ── */}
      <section className="home-center-hero" aria-label="PreOne Home">
        <div className="home-center-brand">
          {branding?.logoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={branding.logoUrl}
                alt={user?.tenantName || 'School Logo'}
                className="h-16 max-h-16 max-w-[260px] object-contain drop-shadow-sm rounded-lg"
              />
            </div>
          ) : (
            <PLogoWordmark subtitle="Preschool OS" />
          )}
        </div>

        {user && (
          <div className="home-context-bar" role="status">
            <span className="home-tenant-badge">
              <span className="home-tenant-dot" aria-hidden="true" />
              {user.tenantName || 'Sunshine Kids Preschool'}
            </span>
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
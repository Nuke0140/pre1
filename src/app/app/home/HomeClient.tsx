'use client'

import React, { useMemo } from 'react'
import type { Role } from '@/lib/auth'
import { homeModules, type HomeModule } from '@/lib/modules'
import { ModuleCard, PLogoWordmark } from '@/components/preone'

export function HomeClient({ role }: { role: Role }) {
  const modules = useMemo<HomeModule[]>(
    () => homeModules(role).filter((m) => m.key !== 'home'),
    [role]
  )

  return (
    <div className="home" style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
      {/* ── Centered PreOne Brand Logo ── */}
      <section className="home-center-hero" aria-label="PreOne Home">
        <div className="home-center-brand">
          <PLogoWordmark subtitle="Preschool OS" />
        </div>
      </section>

      {/* ── Main Module Grid ── */}
      <main aria-label="Available Modules">
        <div className="module-grid">
          {modules.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
        {modules.length === 0 && (
          <div className="home-note">No modules available yet — your little stars are waiting to be added!</div>
        )}
      </main>
    </div>
  )
}
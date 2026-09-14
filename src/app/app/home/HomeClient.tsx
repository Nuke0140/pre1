'use client'

import { useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import type { Role } from '@/lib/auth'
import { homeModules, type HomeModule } from '@/lib/modules'
import { ModuleTile } from '@/components/preone/ModuleTile'

export function HomeClient({ role }: {
  role: Role
}) {
  const modules = useMemo<HomeModule[]>(() => homeModules(role), [role])

  return (
    <div className="home">
      <section aria-label="Applications">
        <div className="home-sec">
          <span className="t-title"><LayoutGrid /> Applications</span>
        </div>
        <div className="tile-grid">
          {modules.map((m) => (
            <ModuleTile key={m.key} module={m} />
          ))}
        </div>
        {modules.length === 0 && (
          <div className="home-note">No modules available yet — your little stars are waiting to be added!</div>
        )}
      </section>
    </div>
  )
}
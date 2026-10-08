'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Baby, ShieldCheck, ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { PageHead, Card } from '@/components/preone/ui'
import { StaffUsersIllustration, FamilyUsersIllustration } from '@/components/preone/illustrations'
import { RolesDirectoryModal } from '@/components/users/RolesDirectoryModal'
import { useI18n } from '@/lib/i18n'

export default function UsersLauncherPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState({
    staffTotal: 0,
    staffActive: 0,
    parentsTotal: 0,
    guardiansTotal: 0,
    loading: true,
  })

  // Modal trigger
  const [rolesModalOpen, setRolesModalOpen] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/users?pageSize=1')
      if (res.ok) {
        const json = await res.json()
        const tabs = json.meta?.tabs || {}
        setStats({
          staffTotal: tabs.STAFF || 0,
          staffActive: tabs.STAFF_ACTIVE ?? 0,
          parentsTotal: tabs.PARENT || 0,
          guardiansTotal: tabs.GUARDIAN || 0,
          loading: false,
        })
      }
    } catch (e) {
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: t('nav.home'), href: '/app' }, { label: t('users.title') }]} />

      {/* Page Header */}
      <PageHead
        title={t('users.title')}
        sub={t('users.subtitle')}
        actions={
          <button
            type="button"
            onClick={() => setRolesModalOpen(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-2.5 sm:py-2 sm:px-3"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('users.rolesDirectory')}</span>
          </button>
        }
      />

      {/* Centered Content Area */}
      <div className="pt-1 sm:pt-4">
        <div className="users-access-grid max-w-5xl mx-auto">
          {/* Card 1: Staff Users */}
          <Card
            as={Link}
            href="/app/users/staff"
            variant="nav"
            className="group"
          >
            {/* Top Row: Icon + Status Badge */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="tile-ico ic-purple w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <span className="badge b-primary text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 shrink-0">
                {stats.loading ? '...' : t('users.activeStaffBadge', { count: stats.staffActive })}
              </span>
            </div>

            {/* Middle Content: Heading, Description & Illustration */}
            <div className="flex flex-row items-center justify-between gap-3 my-2 sm:my-5 w-full">
              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  {t('users.staffUsers')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-normal sm:leading-relaxed max-w-[280px]">
                  {t('users.staffUsersDesc')}
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <div className="block sm:hidden">
                  <StaffUsersIllustration
                    size={76}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="hidden sm:block">
                  <StaffUsersIllustration
                    size={128}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Action Label + Arrow */}
            <div className="flex items-center justify-between pt-2.5 sm:pt-4 mt-auto border-t border-gray-100 dark:border-gray-800/80 w-full">
              <span className="text-[11px] sm:text-xs font-semibold text-primary group-hover:underline">
                {t('users.openStaffDirectory')}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-primary flex items-center justify-center transition-all duration-200 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </Card>

          {/* Card 2: Family Users */}
          <Card
            as={Link}
            href="/app/users/family"
            variant="nav"
            className="group"
          >
            {/* Top Row: Icon + Status Badge */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="tile-ico ic-orange w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <Baby className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <span className="badge b-amber text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 shrink-0">
                {stats.loading ? '...' : t('users.activeFamilyBadge', { parents: stats.parentsTotal, guardians: stats.guardiansTotal })}
              </span>
            </div>

            {/* Middle Content: Heading, Description & Illustration */}
            <div className="flex flex-row items-center justify-between gap-3 my-2 sm:my-5 w-full">
              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('users.familyUsers')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-normal sm:leading-relaxed max-w-[280px]">
                  {t('users.familyUsersDesc')}
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <div className="block sm:hidden">
                  <FamilyUsersIllustration
                    size={76}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="hidden sm:block">
                  <FamilyUsersIllustration
                    size={128}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Action Label + Arrow */}
            <div className="flex items-center justify-between pt-2.5 sm:pt-4 mt-auto border-t border-gray-100 dark:border-gray-800/80 w-full">
              <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                {t('users.openFamilyDirectory')}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all duration-200 group-hover:translate-x-1 group-hover:bg-amber-600 group-hover:text-white">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Roles Directory Modal */}
      <RolesDirectoryModal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
      />
    </div>
  )
}

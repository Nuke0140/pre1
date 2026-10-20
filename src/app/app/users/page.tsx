'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, UserPlus, ChevronDown, Briefcase, Users, FileSpreadsheet } from 'lucide-react'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { PageHead, Card } from '@/components/preone/ui'
import { StaffUsersIllustration, FamilyUsersIllustration } from '@/components/preone/illustrations'
import { RolesDirectoryModal } from '@/components/users/RolesDirectoryModal'
import { AddStaffModal } from '@/components/users/AddStaffModal'
import { AddFamilyModal } from '@/components/users/AddFamilyModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { BranchOption, ClassroomOption } from '@/components/users/types'
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

  // Modal triggers
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [addFamilyOpen, setAddFamilyOpen] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  const fetchBranchesAndClassrooms = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/v1/branches'),
        fetch('/api/v1/classrooms'),
      ])
      if (bRes.ok) {
        const bJson = await bRes.json()
        setBranches(bJson.data || bJson.items || [])
      }
      if (cRes.ok) {
        const cJson = await cRes.json()
        setClassrooms(cJson.data || cJson.items || [])
      }
    } catch {
      // Non-blocking
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/users?pageSize=1')
      if (res.ok) {
        const json = await res.json()
        const tabs = json.meta?.tabs || {}
        const familyKpis = json.meta?.familyKpis
        setStats({
          staffTotal: tabs.STAFF || 0,
          staffActive: tabs.STAFF_ACTIVE ?? json.meta?.kpis?.active ?? tabs.STAFF ?? 0,
          parentsTotal: familyKpis?.totalParents ?? tabs.PARENT ?? 0,
          guardiansTotal: familyKpis?.totalGuardians ?? tabs.GUARDIAN ?? 0,
          loading: false,
        })
      }
    } catch (e) {
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchStats()
    fetchBranchesAndClassrooms()
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: t('nav.home'), href: '/app' }, { label: t('users.title') }]} />

      {/* Page Header */}
      <PageHead
        title={t('users.title')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRolesModalOpen(true)}
              className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-2.5 sm:py-2 sm:px-3"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('users.rolesDirectory')}</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="btn btn-primary text-xs flex items-center justify-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-3.5 shadow-sm font-semibold users-act-add"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ {t('common.add') || 'Add'}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border border-gray-100 dark:border-gray-800 rounded-xl bg-card z-50">
                <DropdownMenuItem
                  onClick={() => setAddStaffOpen(true)}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{t('users.addStaff') || 'Add Staff Member'}</div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAddFamilyOpen(true)}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{t('users.addFamily') || 'Add Family / Parent'}</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/app/users/staff?tab=import"
                    className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Import via Spreadsheet</div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            {/* Top Row: Category Tag + Status Badge */}
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/40">
                Staff Directory
              </span>
              <span className="badge b-primary text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 shrink-0">
                {stats.loading ? '...' : t('users.activeStaffBadge', { count: stats.staffActive })}
              </span>
            </div>

            {/* Middle Content: Heading & Transparent 3D Icon */}
            <div className="flex flex-row items-center justify-between gap-3 my-3 sm:my-6 w-full">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  {t('users.staffUsers')}
                </h2>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <div className="block sm:hidden">
                  <StaffUsersIllustration
                    size={72}
                    className="transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
                  />
                </div>
                <div className="hidden sm:block">
                  <StaffUsersIllustration
                    size={112}
                    className="transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
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
            {/* Top Row: Category Tag + Status Badge */}
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/40">
                Family Directory
              </span>
              <span className="badge b-amber text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 shrink-0">
                {stats.loading ? '...' : t('users.activeFamilyBadge', { parents: stats.parentsTotal, guardians: stats.guardiansTotal })}
              </span>
            </div>

            {/* Middle Content: Heading & Transparent 3D Icon */}
            <div className="flex flex-row items-center justify-between gap-3 my-3 sm:my-6 w-full">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('users.familyUsers')}
                </h2>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <div className="block sm:hidden">
                  <FamilyUsersIllustration
                    size={80}
                    className="transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
                  />
                </div>
                <div className="hidden sm:block">
                  <FamilyUsersIllustration
                    size={128}
                    className="transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
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

      {/* Add Staff Modal */}
      <AddStaffModal
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        branches={branches}
        classrooms={classrooms}
        onSuccess={() => {
          setAddStaffOpen(false)
          fetchStats()
        }}
      />

      {/* Add Family Modal */}
      <AddFamilyModal
        open={addFamilyOpen}
        onClose={() => setAddFamilyOpen(false)}
        defaultRole="PARENT"
        branches={branches}
        classrooms={classrooms}
        onSuccess={() => {
          setAddFamilyOpen(false)
          fetchStats()
        }}
      />
    </div>
  )
}

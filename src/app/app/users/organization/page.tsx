'use client'

import React, { Suspense, useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Network, ShieldCheck, ChevronLeft, ArrowLeft, RefreshCw, Layers } from 'lucide-react'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { PageHead } from '@/components/preone/ui'
import { OrgHierarchyView } from '@/components/users/OrgHierarchyView'
import { RolesDirectoryView } from '@/components/users/RolesDirectoryView'
import { User360Drawer } from '@/components/users/User360Drawer'
import { BranchOption, UserRecord } from '@/components/users/types'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

function OrganizationSetupPageContent() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const requestedTab = searchParams?.get('tab')
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'dictionary'>(
    requestedTab === 'dictionary' ? 'dictionary' : 'hierarchy'
  )

  const [branches, setBranches] = useState<BranchOption[]>([])
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)

  // Fetch campus branches for hierarchy filter
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch('/api/v1/branches')
        if (res.ok) {
          const json = await res.json()
          setBranches(json.data || json.items || [])
        }
      } catch {
        // Non-blocking
      }
    }
    loadBranches()
  }, [])

  // Sync tab with URL without full page reload
  const handleTabChange = (tab: 'hierarchy' | 'dictionary') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tab)
    router.replace(`/app/users/organization?${params.toString()}`, { scroll: false })
  }

  // Handle selecting a staff node in OrgHierarchyView
  const handleSelectUserFromHierarchy = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/users/${userId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setViewingUser(json.data)
      } else {
        toast.error('Load Error', 'Could not load staff profile details')
      }
    } catch {
      toast.error('Load Error', 'Failed to load user profile')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home') || 'Home', href: '/app' },
          { label: t('users.title') || 'Users', href: '/app/users' },
          { label: 'Organization Setup' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/app/users"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Users Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Network className="w-5 h-5" />
            </div>
            <span>Organization Setup</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Consolidated organizational structure: reporting hierarchy and roles & permissions dictionary.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 p-1 bg-gray-50 dark:bg-gray-900/50 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            id="tab-org-hierarchy"
            onClick={() => handleTabChange('hierarchy')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Organization Hierarchy</span>
          </button>
          <button
            type="button"
            id="tab-org-dictionary"
            onClick={() => handleTabChange('dictionary')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'dictionary'
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dictionary</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mt-4">
        {activeTab === 'hierarchy' ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs">
            <OrgHierarchyView
              branches={branches}
              onSelectUser={handleSelectUserFromHierarchy}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs">
            <RolesDirectoryView />
          </div>
        )}
      </div>

      {/* User 360 Inspection Drawer when clicking a staff member */}
      {viewingUser && (
        <User360Drawer
          open={Boolean(viewingUser)}
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  )
}

export default function OrganizationSetupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Loading organization...</div>}>
      <OrganizationSetupPageContent />
    </Suspense>
  )
}

'use client'

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Camera, Upload, Trash2, ArrowLeft, RefreshCw, Search, CheckCircle2,
  AlertCircle, Image as ImageIcon, Users, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { Avatar } from '@/components/preone/ui'
import { ZipPhotoUploadView } from '@/components/users/ZipPhotoUploadView'
import { UserRecord, BranchOption } from '@/components/users/types'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

function PhotoManagementPageContent() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const requestedTab = searchParams?.get('tab')
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>(
    requestedTab === 'bulk' ? 'bulk' : 'individual'
  )

  // Staff List State for Individual Photo Upload
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffList, setStaffList] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<UserRecord | null>(null)

  // Single Photo Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Fetch staff list
  const fetchStaff = async () => {
    setLoadingStaff(true)
    try {
      const res = await fetch('/api/v1/users?role=STAFF&pageSize=100')
      if (res.ok) {
        const json = await res.json()
        const items = json.data || json.items || []
        setStaffList(items)
        if (items.length > 0 && !selectedStaff) {
          setSelectedStaff(items[0])
          setPreviewUrl(items[0].avatarUrl || null)
        }
      }
    } catch {
      toast.error('Network Error', 'Failed to load staff list')
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // Sync tab with URL
  const handleTabChange = (tab: 'individual' | 'bulk') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tab)
    router.replace(`/app/users/photos?${params.toString()}`, { scroll: false })
  }

  // Handle staff selection
  const handleSelectStaff = (u: UserRecord) => {
    setSelectedStaff(u)
    setSelectedFile(null)
    setPreviewUrl(u.avatarUrl || null)
  }

  // Handle single photo file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid Format', 'Please choose a JPG, PNG, or WebP photo')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum photo size is 5MB')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  // Upload single photo
  const handleUploadPhoto = async () => {
    if (!selectedStaff || !selectedFile) return
    const targetUserId = selectedStaff.userId || selectedStaff.id

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)

      const res = await fetch(`/api/v1/users/${targetUserId}/photo`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to upload photo')
      }

      const newUrl = json.data?.avatarUrl || previewUrl
      toast.success('Photo Updated', `Profile photo updated for ${selectedStaff.name || selectedStaff.fullName}.`)

      // Update in staff list
      setStaffList((prev) =>
        prev.map((s) => (s.id === selectedStaff.id || s.userId === targetUserId ? { ...s, avatarUrl: newUrl } : s))
      )
      setSelectedStaff((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null))
      setSelectedFile(null)
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Could not upload photo')
    } finally {
      setUploading(false)
    }
  }

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!selectedStaff) return
    const targetUserId = selectedStaff.userId || selectedStaff.id

    setRemoving(true)
    try {
      const res = await fetch(`/api/v1/users/${targetUserId}/photo`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || json.message || 'Failed to remove photo')
      }

      toast.success('Photo Removed', `Profile photo cleared for ${selectedStaff.name || selectedStaff.fullName}.`)

      setStaffList((prev) =>
        prev.map((s) => (s.id === selectedStaff.id || s.userId === targetUserId ? { ...s, avatarUrl: null } : s))
      )
      setSelectedStaff((prev) => (prev ? { ...prev, avatarUrl: null } : null))
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      toast.error('Remove Error', err.message || 'Could not remove photo')
    } finally {
      setRemoving(false)
    }
  }

  // Filter staff list
  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList
    const q = search.toLowerCase()
    return staffList.filter((u) => {
      const matchName = (u.name || u.fullName || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      const matchEmp = (u.employeeCode || '').toLowerCase().includes(q)
      const matchRole = (u.role || '').toLowerCase().includes(q)
      return matchName || matchEmail || matchEmp || matchRole
    })
  }, [staffList, search])

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home') || 'Home', href: '/app' },
          { label: t('users.title') || 'Users', href: '/app/users' },
          { label: 'Photo Management' },
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
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              <Camera className="w-5 h-5" />
            </div>
            <span>Photo Management</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage staff portrait photos: upload individual staff portraits or bulk-match photo archives.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 p-1 bg-gray-50 dark:bg-gray-900/50 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            id="tab-individual-photo"
            onClick={() => handleTabChange('individual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'individual'
                ? 'bg-white dark:bg-gray-800 text-sky-700 dark:text-sky-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Individual Upload</span>
          </button>
          <button
            type="button"
            id="tab-bulk-photo"
            onClick={() => handleTabChange('bulk')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-gray-800 text-sky-700 dark:text-sky-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mt-4">
        {activeTab === 'individual' ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Staff Selector Column */}
              <div className="lg:col-span-5 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-900/40 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Select Staff Member ({filteredStaff.length})
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredStaff.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      No staff members match "{search}"
                    </div>
                  ) : (
                    filteredStaff.map((u) => {
                      const isSelected = selectedStaff?.id === u.id || selectedStaff?.userId === u.userId
                      return (
                        <button
                          key={u.id || u.userId}
                          type="button"
                          onClick={() => handleSelectStaff(u)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center gap-3 border ${
                            isSelected
                              ? 'bg-white dark:bg-gray-800 border-sky-400 dark:border-sky-600 shadow-xs'
                              : 'border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <Avatar name={u.name || u.fullName} src={u.avatarUrl} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100 truncate">
                              {u.name || u.fullName}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span className="badge badge-xs">{u.role}</span>
                              {u.employeeCode && (
                                <span className="font-mono text-[10px] text-gray-400">{u.employeeCode}</span>
                              )}
                            </div>
                          </div>
                          {u.avatarUrl && (
                            <span className="badge b-green text-[9px] px-1 py-0 uppercase">Photo</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Photo Uploader Column */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                {selectedStaff ? (
                  <div className="space-y-6">
                    {/* Selected Staff Header Card */}
                    <div className="p-4 rounded-xl border border-sky-200/80 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 dark:from-sky-950/30 dark:via-gray-900 dark:to-sky-950/20 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={selectedStaff.name || selectedStaff.fullName}
                          src={previewUrl || selectedStaff.avatarUrl}
                          size="lg"
                          className="w-16 h-16 ring-2 ring-sky-500/30"
                        />
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {selectedStaff.name || selectedStaff.fullName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="badge badge-sm">{selectedStaff.role}</span>
                            {selectedStaff.employeeCode && (
                              <span className="font-mono text-[11px]">ID: {selectedStaff.employeeCode}</span>
                            )}
                            {selectedStaff.email && (
                              <span>• {selectedStaff.email}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedStaff.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={removing}
                          className="btn btn-secondary text-xs px-3 py-1.5 text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{removing ? 'Removing...' : 'Remove Photo'}</span>
                        </button>
                      )}
                    </div>

                    {/* Drag and Drop / Upload Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-sky-500 bg-gray-50/50 dark:bg-gray-900/30 transition-colors"
                    >
                      <Camera className="w-12 h-12 text-sky-600 mb-2" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedFile ? 'Change Selected Photo' : 'Upload New Portrait Photo'}
                      </div>
                      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-3">
                        Click to select an image file or drag and drop here.
                      </p>
                      <span className="text-[11px] text-gray-400 font-mono">
                        Formats: JPG, PNG, WebP • Maximum file size: 5MB
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {selectedFile && (
                        <div className="mt-3 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(selectedStaff.avatarUrl || null)
                          }}
                          className="btn btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleUploadPhoto}
                        disabled={uploading || !selectedFile}
                        className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading Portrait...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Save Photo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-xs text-gray-400">
                    Select a staff member from the left to view or update their photo.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs">
            <ZipPhotoUploadView
              onSuccess={() => {
                fetchStaff()
                toast.success('Bulk Photos Applied', 'Profile photos updated across staff accounts.')
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PhotoManagementPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Loading photo management...</div>}>
      <PhotoManagementPageContent />
    </Suspense>
  )
}

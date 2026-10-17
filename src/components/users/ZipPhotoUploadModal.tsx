'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Archive, Upload, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  FileCheck, Users, X, Download
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

interface ZipPhotoItem {
  fileName: string
  identifier: string
  status: 'MATCHED' | 'UNMATCHED' | 'INVALID_FORMAT'
  action: 'ADD' | 'REPLACE' | 'SKIP'
  userId?: string
  userName?: string
  role?: string
  currentPhotoUrl?: string | null
  reason?: string
}

interface CandidateUser {
  userId: string
  name: string
  email: string | null
  role: string
  employeeCode?: string | null
  avatarUrl?: string | null
}

interface ZipPhotoUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ZipPhotoUploadModal({ open, onClose, onSuccess }: ZipPhotoUploadModalProps) {
  const toast = useToast()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'SELECT' | 'PREVIEW' | 'RESULT'>('SELECT')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Preview data & candidate users for mismatch resolution
  const [items, setItems] = useState<ZipPhotoItem[]>([])
  const [candidateUsers, setCandidateUsers] = useState<CandidateUser[]>([])
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    replacements: 0,
    newAdditions: 0,
    invalid: 0,
  })

  // Execution result
  const [results, setResults] = useState<{
    successful: number
    failed: number
    skipped: number
    totalProcessed: number
  } | null>(null)

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Invalid Format', 'Please choose a .zip archive file')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum ZIP archive size is 50MB')
      return
    }

    setZipFile(file)
    setAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('zip', file)
      formData.append('mode', 'preview')

      const res = await fetch('/api/v1/users/photos/zip', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to inspect ZIP archive')
      }

      const payload = json.data || json
      const loadedItems = payload?.items || []
      const candidates: CandidateUser[] = payload?.candidateUsers || []
      setItems(loadedItems)
      setCandidateUsers(candidates)
      setAssignments({})
      setStats({
        total: payload?.totalFiles || payload?.totalInZip || loadedItems.length,
        matched: payload?.matched || payload?.matchedCount || 0,
        unmatched: payload?.unmatched || payload?.unmatchedCount || 0,
        replacements: payload?.toReplace || payload?.replaceCount || 0,
        newAdditions: payload?.toAdd || payload?.newAdditionsCount || 0,
        invalid: payload?.invalid || payload?.invalidCount || 0,
      })
      setStep('PREVIEW')
    } catch (err: any) {
      toast.error('Inspection Failed', err.message || 'Could not analyze ZIP')
      setZipFile(null)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAssignUser = (fileName: string, userId: string) => {
    if (!userId) {
      setAssignments((prev) => {
        const next = { ...prev }
        delete next[fileName]
        return next
      })
      setItems((prev) =>
        prev.map((it) => {
          if (it.fileName === fileName) {
            return {
              ...it,
              status: 'UNMATCHED',
              action: 'SKIP',
              userId: undefined,
              userName: undefined,
              role: undefined,
              currentPhotoUrl: undefined,
              reason: `No user found with identifier "${it.identifier}"`,
            }
          }
          return it
        })
      )
      return
    }

    const candidate = candidateUsers.find((u) => u.userId === userId)
    if (!candidate) return

    setAssignments((prev) => ({ ...prev, [fileName]: userId }))
    setItems((prev) =>
      prev.map((it) => {
        if (it.fileName === fileName) {
          const hasPhoto = Boolean(candidate.avatarUrl)
          return {
            ...it,
            status: 'MATCHED',
            action: hasPhoto ? 'REPLACE' : 'ADD',
            userId: candidate.userId,
            userName: candidate.name,
            role: candidate.role,
            currentPhotoUrl: candidate.avatarUrl,
            reason: 'Manually assigned',
          }
        }
        return it
      })
    )
  }

  // Recalculate stats whenever items change through manual resolution
  useEffect(() => {
    if (items.length === 0) return
    const matched = items.filter((i) => i.status === 'MATCHED').length
    const unmatched = items.filter((i) => i.status === 'UNMATCHED').length
    const invalid = items.filter((i) => i.status === 'INVALID_FORMAT').length
    const replacements = items.filter((i) => i.action === 'REPLACE').length
    const newAdditions = items.filter((i) => i.action === 'ADD').length
    setStats({
      total: items.length,
      matched,
      unmatched,
      replacements,
      newAdditions,
      invalid,
    })
  }, [items])

  const handleExecute = async () => {
    if (!zipFile) return
    setExecuting(true)

    try {
      const formData = new FormData()
      formData.append('zip', zipFile)
      formData.append('mode', 'execute')
      if (Object.keys(assignments).length > 0) {
        formData.append('assignments', JSON.stringify(assignments))
      }

      const res = await fetch('/api/v1/users/photos/zip', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to process photos')
      }

      setResults({
        successful: json.data?.successfulCount || json.data?.uploaded || 0,
        failed: json.data?.failedCount || json.data?.failed || 0,
        skipped: json.data?.skippedCount || json.data?.unmatched || 0,
        totalProcessed: json.data?.totalProcessed || json.data?.totalFiles || 0,
      })
      toast.success(
        'Photos Processed',
        `Successfully applied ${json.data?.successfulCount || json.data?.uploaded || 0} profile photos.`
      )
      setStep('RESULT')
      onSuccess()
    } catch (err: any) {
      toast.error('Execution Error', err.message || 'Failed to process photos')
    } finally {
      setExecuting(false)
    }
  }

  const handleReset = () => {
    setZipFile(null)
    setItems([])
    setCandidateUsers([])
    setAssignments({})
    setResults(null)
    setStep('SELECT')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('users.bulkPhotoUpload') || 'Bulk Profile Photo Upload'}
      subtitle="Match photos automatically using Employee Code, Username, or Email in file names"
      wide
    >
      <div className="space-y-5 py-2">
        {step === 'SELECT' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 bg-gray-50/50 dark:bg-gray-900/50'
              }`}
            >
              <Archive className={`w-12 h-12 mb-3 ${analyzing ? 'animate-bounce text-purple-600' : 'text-gray-400'}`} />
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {analyzing ? 'Analyzing ZIP archive and matching users...' : 'Click to select or drag and drop .ZIP file'}
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Name image files after user identifiers (e.g., <code className="text-purple-600 dark:text-purple-400">EMP-2026-001.jpg</code> or <code className="text-purple-600 dark:text-purple-400">ananya.sharma.png</code>).
              </p>
              <span className="text-[11px] text-gray-400 mt-2 font-mono">
                ZIP limit: 50MB • Formats: JPG, PNG, WebP • Max 500 images
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <span className="font-semibold text-gray-900 dark:text-white block">File Naming Best Practices</span>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li><strong>Employee Code:</strong> <code>EMP-001.jpg</code> matches staff profile with code EMP-001.</li>
                <li><strong>Username:</strong> <code>rahul01.png</code> matches user with username @rahul01.</li>
                <li><strong>Email prefix / Email:</strong> <code>priya@school.com.webp</code> matches user with that email.</li>
                <li>Images that do not match any user will be skipped without stopping the upload.</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'PREVIEW' && (
          <div className="space-y-4">
            {/* Summary KPI Bar */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-500 block text-[11px]">Total in ZIP</span>
                <span className="text-base font-bold text-gray-900 dark:text-white font-mono">{stats.total}</span>
              </div>
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Matched Users</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {stats.matched} ({stats.replacements} update, {stats.newAdditions} new)
                </span>
              </div>
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-amber-700 dark:text-amber-400 block text-[11px]">Unmatched</span>
                <span className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono">{stats.unmatched}</span>
              </div>
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Invalid Files</span>
                <span className="text-base font-bold text-rose-700 dark:text-rose-400 font-mono">{stats.invalid}</span>
              </div>
            </div>

            {/* Matching Preview Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5">File Name</th>
                    <th className="p-2.5">Matched User</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="p-2.5 font-mono text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                        {item.fileName}
                      </td>
                      <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                        {item.status === 'UNMATCHED' || assignments[item.fileName] ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={assignments[item.fileName] || ''}
                              onChange={(e) => handleAssignUser(item.fileName, e.target.value)}
                              className={`select select-sm text-[11px] py-1 px-2 max-w-[220px] ${
                                assignments[item.fileName]
                                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20'
                                  : 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                              }`}
                            >
                              <option value="">🔍 Match to user...</option>
                              {candidateUsers.map((u) => (
                                <option key={u.userId} value={u.userId}>
                                  {u.name} {u.employeeCode ? `(${u.employeeCode})` : `(${u.role})`}
                                </option>
                              ))}
                            </select>
                            {assignments[item.fileName] && (
                              <span className="badge badge-xs badge-info text-[9px] shrink-0">Manual Match</span>
                            )}
                          </div>
                        ) : (
                          <span>{item.userName}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-500">{item.role || '—'}</td>
                      <td className="p-2.5">
                        {item.status === 'MATCHED' ? (
                          <span className="badge badge-success text-[10px]">MATCHED</span>
                        ) : item.status === 'UNMATCHED' ? (
                          <span className="badge badge-warning text-[10px]">UNMATCHED</span>
                        ) : (
                          <span className="badge badge-danger text-[10px]">INVALID</span>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-400">
                        {item.action === 'REPLACE' ? (
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Replace current photo</span>
                        ) : item.action === 'ADD' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Add photo</span>
                        ) : (
                          <span className="text-gray-400">Skip</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleReset}
                disabled={executing}
                className="btn btn-secondary text-xs"
              >
                Choose Another ZIP
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={executing}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={executing || stats.matched === 0}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>
                    {executing ? 'Uploading and Saving...' : `Apply ${stats.matched} Photos`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'RESULT' && results && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Batch Upload Completed</h3>
              <p className="text-xs text-gray-500 mt-1">
                Processed {results.totalProcessed} files from the ZIP archive.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs max-w-sm mx-auto">
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-300 block text-[11px]">Applied</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{results.successful}</span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-500 block text-[11px]">Skipped</span>
                <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{results.skipped}</span>
              </div>
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20">
                <span className="text-rose-700 dark:text-rose-300 block text-[11px]">Failed</span>
                <span className="text-lg font-bold text-rose-700 dark:text-rose-400">{results.failed}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary text-xs px-6"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

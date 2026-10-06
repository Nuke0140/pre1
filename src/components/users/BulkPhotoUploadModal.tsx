'use client'

import React, { useState } from 'react'
import { UploadCloud, FileArchive, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'

interface BulkPhotoUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function BulkPhotoUploadModal({ open, onClose, onSuccess }: BulkPhotoUploadModalProps) {
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [matchingStrategy, setMatchingStrategy] = useState<'EMPLOYEE_CODE' | 'USERNAME' | 'EMAIL'>('EMPLOYEE_CODE')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  if (!open) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      toast.error('No Files Selected', 'Please select images or a ZIP file to upload')
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('matchingStrategy', matchingStrategy)
      files.forEach((f) => formData.append('files', f))

      const res = await fetch('/api/v1/users/bulk-photos', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Bulk photo upload failed')
      }

      setResult(json.data)
      toast.success(
        'Bulk Upload Complete',
        `Successfully updated ${json.data.matchedCount || 0} user photos!`
      )
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error('Bulk Upload Error', err.message || 'Failed to process bulk photos')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Photo Upload"
      subtitle="Upload profile photos in bulk for staff or students using matching IDs"
      icon={<UploadCloud className="w-5 h-5 text-indigo-600" />}
      iconClass="ic-purple"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
            Close
          </button>
          {!result && (
            <button
              type="submit"
              form="bulk-photo-form"
              className="btn btn-primary text-xs"
              disabled={submitting || files.length === 0}
            >
              {submitting ? 'Uploading & Matching...' : `Upload ${files.length} File(s)`}
            </button>
          )}
        </div>
      }
    >
      {!result ? (
        <form id="bulk-photo-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Matching Strategy
            </label>
            <select
              value={matchingStrategy}
              onChange={(e) => setMatchingStrategy(e.target.value as any)}
              className="select w-full text-xs"
            >
              <option value="EMPLOYEE_CODE">Match Filename to Employee Code (e.g. EMP-001.jpg)</option>
              <option value="USERNAME">Match Filename to Username (e.g. john_doe.png)</option>
              <option value="EMAIL">Match Filename to Email (e.g. john@school.demo.jpg)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Photo Files or ZIP Archive
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.zip"
                id="bulk-photo-input"
                className="hidden"
                onChange={handleFileSelect}
              />
              <label htmlFor="bulk-photo-input" className="cursor-pointer flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-indigo-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Click to choose photos or drag and drop here
                </span>
                <span className="text-[11px] text-gray-400">
                  Supports multiple JPG, PNG, WEBP files or a ZIP archive
                </span>
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FileArchive className="w-3.5 h-3.5 text-indigo-500" />
                <span>{files.length} File(s) Selected:</span>
              </div>
              <ul className="max-h-24 overflow-y-auto text-gray-500 font-mono text-[11px] space-y-0.5">
                {files.slice(0, 10).map((f, i) => (
                  <li key={i} className="truncate">• {f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                ))}
                {files.length > 10 && <li className="italic text-gray-400">...and {files.length - 10} more files</li>}
              </ul>
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Matched and updated {result.matchedCount || 0} profile photos!</span>
          </div>

          {result.unmatched && result.unmatched.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{result.unmatched.length} Unmatched Files:</span>
              </div>
              <ul className="max-h-24 overflow-y-auto font-mono text-[11px] space-y-0.5">
                {result.unmatched.map((name: string, idx: number) => (
                  <li key={idx}>• {name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

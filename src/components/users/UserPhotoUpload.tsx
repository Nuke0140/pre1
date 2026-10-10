'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, Trash2, Link as LinkIcon, RefreshCw, X, Check } from 'lucide-react'
import { Avatar } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'

interface UserPhotoUploadProps {
  value: string
  onChange: (url: string) => void
  name?: string
  label?: string
  hint?: string
}

export function UserPhotoUpload({
  value,
  onChange,
  name = '',
  label = 'Profile Photo',
  hint = 'Upload JPG, PNG or WebP (max 5MB)',
}: UserPhotoUploadProps) {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid Format', 'Please upload a JPG, PNG, or WebP photo.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum photo size is 5MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/users/photo', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to upload photo')
      }

      const uploadedUrl = json.data?.url || json.url || json.data?.avatarUrl
      if (uploadedUrl) {
        onChange(uploadedUrl)
        toast.success('Photo Uploaded', 'Profile photo saved and ready to store.')
      }
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Could not upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (value && value.startsWith('/uploads/avatars/')) {
      try {
        await fetch('/api/v1/users/photo', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        })
      } catch {
        // Non-blocking
      }
    }
    onChange('')
    setCustomUrl('')
  }

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim())
      setShowUrlInput(false)
    }
  }

  return (
    <div className="field sm:col-span-2">
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
        {/* Avatar Preview */}
        <div className="relative group shrink-0">
          <Avatar name={name || 'User'} src={value || null} size="lg" className="w-16 h-16 text-base" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold"
            title="Upload photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 font-semibold shadow-xs"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{value ? 'Change Photo' : 'Upload Photo'}</span>
                </>
              )}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="btn btn-ghost text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 py-1.5 px-2.5"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline ml-1"
            >
              {showUrlInput ? 'Hide URL input' : 'Or paste link'}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
            {value ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono break-all flex items-center gap-1">
                <Check className="w-3 h-3 shrink-0" /> Photo attached (will be stored in database)
              </span>
            ) : (
              hint
            )}
          </p>

          {/* Optional Direct URL Input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="input text-xs flex-1 py-1"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="btn btn-primary text-xs py-1 px-2.5"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

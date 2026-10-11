'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, Trash2, Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

interface PhotoUploadModalProps {
  open: boolean
  onClose: () => void
  userId: string
  userName: string
  currentPhotoUrl?: string | null
  onSuccess: (newPhotoUrl: string | null) => void
}

export function PhotoUploadModal({
  open,
  onClose,
  userId,
  userName,
  currentPhotoUrl,
  onSuccess,
}: PhotoUploadModalProps) {
  const toast = useToast()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)

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

  const handleUpload = async () => {
    if (!selectedFile) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)

      const res = await fetch(`/api/v1/users/${userId}/photo`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to upload photo')
      }

      toast.success('Photo Updated', `Profile photo saved for ${userName}`)
      onSuccess(json.data?.avatarUrl || null)
      handleClose()
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Could not save profile photo')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove the profile photo for ${userName}?`)) return
    setRemoving(true)

    try {
      const res = await fetch(`/api/v1/users/${userId}/photo`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to remove photo')
      }

      toast.success('Photo Removed', `Profile photo removed for ${userName}`)
      onSuccess(null)
      handleClose()
    } catch (err: any) {
      toast.error('Remove Error', err.message || 'Could not remove profile photo')
    } finally {
      setRemoving(false)
    }
  }

  const handleClose = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  if (!open) return null

  const displayAvatar = previewUrl || currentPhotoUrl

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('users.profilePhoto') || 'Profile Photo'}
      subtitle={`Manage profile picture for ${userName}`}
    >
      <div className="space-y-6 py-2">
        {/* Avatar Preview Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-purple-100 dark:ring-purple-900/40 shadow-inner flex items-center justify-center bg-gray-200 dark:bg-gray-800">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-3xl font-bold text-gray-400">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-colors"
              title="Select new image"
            >
              <Camera size={16} />
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500 text-center">
            {selectedFile ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            ) : (
              'Accepts JPG, PNG, or WebP. Max 5MB file size.'
            )}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div>
            {currentPhotoUrl && !selectedFile && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="btn btn-ghost text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{removing ? 'Removing...' : 'Remove Photo'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || removing}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Upload size={14} />
                <span>{loading ? 'Uploading...' : 'Save Photo'}</span>
              </button>
            )}
            {!selectedFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Choose Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

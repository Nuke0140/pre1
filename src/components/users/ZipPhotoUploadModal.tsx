'use client'

import React from 'react'
import { Modal } from '@/components/preone/Modal'
import { useI18n } from '@/lib/i18n'
import { ZipPhotoUploadView } from './ZipPhotoUploadView'

export interface ZipPhotoUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ZipPhotoUploadModal({ open, onClose, onSuccess }: ZipPhotoUploadModalProps) {
  const { t } = useI18n()

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.bulkPhotoUpload') || 'Bulk Profile Photo Upload'}
      subtitle="Match photos automatically using Employee Code, Username, or Email in file names"
      wide
    >
      <ZipPhotoUploadView
        onSuccess={onSuccess}
        onCancel={onClose}
      />
    </Modal>
  )
}

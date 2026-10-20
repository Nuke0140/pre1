'use client'

import React from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { BranchOption } from './types'
import { BulkUpdateFieldView } from './BulkUpdateFieldView'

export interface BulkUpdateFieldModalProps {
  open: boolean
  onClose: () => void
  selectedUserIds?: string[]
  branches?: BranchOption[]
  userType?: 'STAFF' | 'FAMILY' | 'ALL'
  onSuccess?: () => void
}

export function BulkUpdateFieldModal({
  open,
  onClose,
  selectedUserIds = [],
  branches = [],
  userType = 'STAFF',
  onSuccess,
}: BulkUpdateFieldModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Field Update"
      subtitle="Select specific user fields to update across multiple accounts via CSV template."
      icon={<FileSpreadsheet className="w-5 h-5 text-purple-600" />}
      iconClass="ic-purple"
      maxWidth="min(860px, 100vw - 32px)"
    >
      <BulkUpdateFieldView
        selectedUserIds={selectedUserIds}
        branches={branches}
        userType={userType}
        onSuccess={() => {
          onSuccess?.()
          onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}

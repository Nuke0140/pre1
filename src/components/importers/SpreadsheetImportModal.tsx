'use client'

import React from 'react'
import { Modal } from '@/components/preone/Modal'
import { FileSpreadsheet } from 'lucide-react'
import { SpreadsheetImportWorkspace, ImportModule } from './SpreadsheetImportWorkspace'

interface SpreadsheetImportModalProps {
  open: boolean
  onClose: () => void
  module: ImportModule
  onSuccess?: () => void
}

export function SpreadsheetImportModal({
  open,
  onClose,
  module,
  onSuccess,
}: SpreadsheetImportModalProps) {
  const titles: Record<ImportModule, string> = {
    CLASSROOMS: 'Import Classrooms via Spreadsheet',
    STAFF: 'Import Staff via Spreadsheet',
    FEES: 'Import Fees via Spreadsheet',
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[module]}
      subtitle="Batch create or update records via CSV upload or copy-paste from Excel / Google Sheets"
      icon={<FileSpreadsheet className="w-5 h-5 text-purple-600" />}
      iconClass="ic-purple"
      wide
    >
      <div className="p-1">
        <SpreadsheetImportWorkspace
          module={module}
          embedded={true}
          onSuccess={() => {
            onSuccess?.()
          }}
          onCancel={onClose}
        />
      </div>
    </Modal>
  )
}

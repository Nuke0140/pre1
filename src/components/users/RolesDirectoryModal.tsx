'use client'

import React from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { DEFAULT_ROLES_MATRIX, RoleMatrixItem } from './types'
import { useI18n } from '@/lib/i18n'
import { RolesDirectoryView } from './RolesDirectoryView'

export interface RolesDirectoryModalProps {
  open: boolean
  onClose: () => void
  rolesMatrix?: RoleMatrixItem[]
}

export function RolesDirectoryModal({
  open,
  onClose,
  rolesMatrix = DEFAULT_ROLES_MATRIX,
}: RolesDirectoryModalProps) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.rolesDirectoryTitle') || 'Who Can See What?'}
      subtitle={t('users.rolesDirectorySub') || 'Understand what each staff role can access in your school.'}
      icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
      iconClass="ic-purple"
      maxWidth="min(1100px, 100vw - 32px)"
      className="modal-xl"
      wide
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>PreOne Role-Based Access Control (RBAC) strictly enforces tenant, campus branch, and classroom boundaries.</span>
          </div>
          <button type="button" className="btn btn-secondary text-xs px-4 py-1.5 font-medium" onClick={onClose}>
            {t('common.close') || 'Close'}
          </button>
        </div>
      }
    >
      <RolesDirectoryView rolesMatrix={rolesMatrix} />
    </Modal>
  )
}

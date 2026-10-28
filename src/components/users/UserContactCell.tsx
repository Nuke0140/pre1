'use client'

import React from 'react'
import { Mail, Phone } from 'lucide-react'
import { UserRecord } from './types'
import { ContactActionStrip } from './ContactActionStrip'
import { normalizePhoneNumber } from '@/lib/users/phone-utils'

export interface UserContactCellProps {
  user: UserRecord
  className?: string
  showMicroActions?: boolean
}

export function UserContactCell({
  user,
  className = '',
  showMicroActions = true,
}: UserContactCellProps) {
  const phoneRes = normalizePhoneNumber(user.phone)
  const displayPhone = phoneRes.isValid ? phoneRes.display : user.phone

  return (
    <div className={`user-contact-cell flex items-center justify-between gap-2 max-w-xs ${className}`.trim()}>
      <div className="min-w-0 flex-1 space-y-1 text-xs">
        {/* Phone Line */}
        {user.phone ? (
          <div className="text-gray-800 dark:text-gray-200 font-mono font-medium flex items-center gap-1.5 truncate">
            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{displayPhone}</span>
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 italic text-[11px] flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" aria-hidden="true" />
            <span>No phone</span>
          </div>
        )}

        {/* Email Line */}
        {user.email ? (
          <div className="text-gray-500 dark:text-gray-400 font-mono text-[11px] flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
            <span className="truncate" title={user.email}>{user.email}</span>
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 italic text-[11px] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" aria-hidden="true" />
            <span>No email</span>
          </div>
        )}
      </div>

      {/* Contact Micro-Strip (Emerges on hover / keyboard focus) */}
      {showMicroActions && (
        <ContactActionStrip
          name={user.name}
          phone={user.phone}
          email={user.email}
        />
      )}
    </div>
  )
}

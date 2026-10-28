'use client'

import React from 'react'
import { Building, Building2, DoorOpen, Users } from 'lucide-react'
import { Avatar } from '@/components/preone/ui'
import { UserRecord } from './types'

export interface UserIdentityCellProps {
  user: UserRecord
  onClick?: () => void
  contextType?: 'staff' | 'family' | 'parent' | 'guardian' | 'auto'
  className?: string
}

export function UserIdentityCell({
  user,
  onClick,
  contextType = 'auto',
  className = '',
}: UserIdentityCellProps) {
  // Determine if this user is a family role or staff role
  const isFamily =
    contextType === 'family' ||
    contextType === 'parent' ||
    contextType === 'guardian' ||
    (contextType === 'auto' && (user.role === 'PARENT' || user.role === 'GUARDIAN'))

  // 1. Line 1: Primary Identity
  const displayName = user.name || user.fullName || 'Unnamed User'

  // 2. Line 2: Account Identifier
  const usernameHandle = user.username
    ? `@${user.username}`
    : user.email
    ? `@${user.email.split('@')[0]}`
    : isFamily
    ? '@family'
    : '@staff'

  // 3. Line 3: Organizational Context
  let contextLine: React.ReactNode = null

  if (isFamily) {
    const children = user.guardianProfile?.students || []
    const isCrossCampus = user.guardianProfile?.isCrossCampus
    const campusesCount = user.guardianProfile?.campusesCount

    if (children.length > 0) {
      contextLine = (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-1 font-medium">
          <Users className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" aria-hidden="true" />
          <span className="truncate">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Children: </span>
            {children.map((c, i) => (
              <span key={c.id || i}>
                {i > 0 && ', '}
                <span className="text-gray-800 dark:text-gray-200">{c.name}</span>
                {c.classroom && (
                  <span className="text-purple-600 dark:text-purple-400 text-[10px] ml-0.5">({c.classroom})</span>
                )}
              </span>
            ))}
          </span>
          {isCrossCampus && (
            <span className="badge b-purple text-[9px] px-1 py-0 shrink-0 font-normal ml-1">
              {campusesCount ? `${campusesCount} Campuses` : 'Cross-Campus'}
            </span>
          )}
        </div>
      )
    } else {
      contextLine = (
        <div className="text-[11px] text-gray-400 italic mt-1 truncate">
          No linked students
        </div>
      )
    }
  } else {
    // Staff context line
    const employeeCode = user.staffProfile?.employeeCode
    const assigned = user.assignedBranches || []
    const branchName =
      user.branchName ||
      (assigned.length > 0 ? (assigned.find((b) => b.isPrimary)?.name || assigned[0]?.name) : null)
    const classroomName =
      user.taughtClasses?.[0]?.name ||
      (user as any).classroom?.name ||
      (user as any).preferences?.assignedClassroomName

    const contextParts: string[] = []
    if (employeeCode) contextParts.push(employeeCode)
    if (branchName) contextParts.push(branchName)
    if (classroomName) contextParts.push(classroomName)

    if (contextParts.length > 0) {
      contextLine = (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-1 font-medium">
          {branchName && <Building className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />}
          <span className="truncate">
            {contextParts.join(' • ')}
          </span>
          {assigned.length > 1 && (
            <span
              className="badge b-purple text-[9px] px-1 py-0 shrink-0 font-normal"
              title={assigned.map((b) => `${b.name} (${b.code})`).join(', ')}
            >
              +{assigned.length - 1}
            </span>
          )}
        </div>
      )
    } else {
      contextLine = (
        <div className="text-[11px] text-gray-400 italic mt-1 truncate">
          Staff Member
        </div>
      )
    }
  }

  return (
    <div className={`user-identity-cell flex items-center gap-3 min-w-0 max-w-sm sm:max-w-md ${className}`.trim()}>
      <Avatar
        name={displayName}
        src={user.avatarUrl}
        size="md"
        className="shrink-0 ring-1 ring-black/5 dark:ring-white/10"
      />
      <div className="min-w-0 flex-1">
        {/* Line 1: Primary Identity */}
        <div
          className="font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors cursor-pointer text-sm truncate leading-tight"
          onClick={onClick}
          title={displayName}
        >
          {displayName}
        </div>

        {/* Line 2: Account Identifier */}
        <div className="text-[12px] text-gray-400 dark:text-gray-500 font-mono truncate leading-none mt-1">
          {usernameHandle}
        </div>

        {/* Line 3: Organizational Context */}
        {contextLine}
      </div>
    </div>
  )
}

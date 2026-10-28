'use client'

import React from 'react'
import { DoorOpen, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { StatusBadge } from '@/components/preone/ui'
import { ROLE_BADGE, UserRecord } from './types'

export interface UserRolePlacementCellProps {
  user: UserRecord
  contextType?: 'staff' | 'family' | 'parent' | 'guardian' | 'auto'
  className?: string
}

function normalizeRole(role: string): string {
  if (!role) return 'STAFF'
  const upper = role.toUpperCase().trim()
  if (upper === 'ADMIN' || upper === 'SUPER_ADMIN') return 'OWNER'
  if (upper === 'LEAD_TEACHER' || upper === 'ASSISTANT_TEACHER') return 'TEACHER'
  if (upper === 'CARE_TAKER' || upper === 'CAREGIVER') return 'ATTENDANT'
  return upper
}

export function UserRolePlacementCell({
  user,
  contextType = 'auto',
  className = '',
}: UserRolePlacementCellProps) {
  const normRole = normalizeRole(user.role)
  const roleBadgeConfig = ROLE_BADGE[normRole] || ROLE_BADGE[user.role] || {
    cls: 'b-neutral',
    label: user.role || 'User',
  }

  const isFamily =
    contextType === 'family' ||
    contextType === 'parent' ||
    contextType === 'guardian' ||
    (contextType === 'auto' && (user.role === 'PARENT' || user.role === 'GUARDIAN'))

  return (
    <div className={`user-role-placement-cell space-y-1.5 ${className}`.trim()}>
      {/* 1. Primary Role Badge + Lifecycle Status */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`badge ${roleBadgeConfig.cls} text-xs font-semibold px-2 py-0.5`}>
          {roleBadgeConfig.label}
        </span>
        <StatusBadge status={user.status} size="sm" />
      </div>

      {/* 2. Contextual Placement / Security Indicator */}
      {isFamily ? (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {user.role === 'GUARDIAN' ? (
            (() => {
              const children = user.guardianProfile?.students || []
              const canPickup = children.some((c) => c.canPickup)
              const hasPin = children.some((c) => Boolean(c.pickupPin))

              return (
                <>
                  <span
                    className={`badge text-[10px] font-medium flex items-center gap-1 ${
                      canPickup ? 'b-success' : 'b-neutral'
                    }`}
                  >
                    {canPickup ? (
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    )}
                    <span>{canPickup ? 'Authorized Escort' : 'Pickup Restricted'}</span>
                  </span>

                  {hasPin && (
                    <span
                      className="badge b-purple text-[10px] font-mono flex items-center gap-1 shrink-0"
                      title="Gate verification PIN is configured"
                    >
                      <KeyRound className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
                      <span>Gate PIN Set</span>
                    </span>
                  )}
                </>
              )
            })()
          ) : (
            // Parent indicators
            <span className="badge b-success text-[10px] font-medium">
              Fee Payer
            </span>
          )}
        </div>
      ) : (
        // Staff indicators
        (() => {
          const assignedClassroomName =
            user.taughtClasses?.[0]?.name ||
            (user as any).classroom?.name ||
            (user as any).preferences?.assignedClassroomName

          const designation = user.staffProfile?.designation || user.staffProfile?.department

          return (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {assignedClassroomName && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60"
                  title={`Assigned to ${assignedClassroomName}`}
                >
                  <DoorOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[130px]">{assignedClassroomName}</span>
                </span>
              )}

              {designation && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {designation}
                </span>
              )}
            </div>
          )
        })()
      )}
    </div>
  )
}

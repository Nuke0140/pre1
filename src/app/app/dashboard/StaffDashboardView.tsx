'use client'

import React from 'react'
import Link from 'next/link'
import {
  ClipboardCheck, Clock, UserCheck, Calendar, ShieldAlert, AlertCircle, ArrowRight
} from 'lucide-react'
import { PageHead, EmptyState } from '@/components/preone/ui'

interface StaffDashboardViewProps {
  role: string
  name?: string
  branchName?: string
}

export function StaffDashboardView({ role, name = 'Staff Member', branchName }: StaffDashboardViewProps) {
  const roleDisplay = role === 'DRIVER' 
    ? 'Transport Driver' 
    : role === 'ATTENDANT' 
    ? 'Childcare Attendant' 
    : role === 'RECEPTIONIST' 
    ? 'Front Desk Administrator' 
    : 'Operations Staff'

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Staff Operations Portal"
        title={`Welcome, ${name}`}
        sub={`${roleDisplay} ${branchName ? `· ${branchName}` : ''} — Your daily operational duty workspace.`}
      />

      {/* Duty Overview Hero */}
      <div className="operational-hero">
        <div className="operational-hero-head">
          <div>
            <h2 className="operational-hero-title">Daily Shift & Duty Center</h2>
            <p className="operational-hero-sub">
              Access your daily assigned shifts, attendance check-in, student safety rosters, and center communications.
            </p>
          </div>
          <span className="badge b-primary b-dot">Active Shift</span>
        </div>

        {/* Quick Duty Shortcuts */}
        <div className="quick-action-strip">
          <span className="strip-label">Actions:</span>
          <Link href="/app/daily-diary?tab=attendance" className="btn-action">
            <ClipboardCheck size={14} /> My Attendance
          </Link>
          {role === 'DRIVER' && (
            <Link href="/app/transport" className="btn-action">
              <Clock size={14} /> Route Schedule
            </Link>
          )}
          {role === 'RECEPTIONIST' && (
            <Link href="/app/admissions" className="btn-action">
              <UserCheck size={14} /> Visitor Intake
            </Link>
          )}
          <Link href="/app/home" className="btn-action">
            <ArrowRight size={14} /> Launchpad
          </Link>
        </div>
      </div>

      {/* Operations Notices Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Duty Protocol & Guidelines</h3>
              <p className="text-xs text-slate-500">Center child-safety compliance</p>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Ensure timely badge punch-in and room check-in.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Escort children exclusively via authorized guardian pickup.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Report any facility safety or wellness incidents immediately.
            </li>
          </ul>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Access & Boundaries</h3>
              <p className="text-xs text-slate-500">Restricted operational view</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Institutional financials, student billing, and administrative audit trails are restricted to school leadership and billing officers.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Assigned Role: <b className="text-slate-800 dark:text-slate-200">{role}</b></span>
            <Link href="/app/home" className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
              All Modules <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

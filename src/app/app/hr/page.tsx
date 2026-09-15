'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Users, UserCheck, CalendarCheck, CreditCard, Briefcase,
  AlertTriangle, ShieldCheck, UserMinus, Plus, Search,
  RefreshCw, CheckCircle2, XCircle, Clock, ChevronRight,
  FileText, Building, Award, Calendar, DollarSign
} from 'lucide-react'
import { PageHead, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { DataTable, Column } from '@/components/preone/DataTable'
import { useToast } from '@/components/preone/Toast'

type TabKey = 'overview' | 'staff' | 'attendance' | 'leaves' | 'payroll' | 'recruitment' | 'compliance' | 'offboarding'

export default function HRPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [payrollCycles, setPayrollCycles] = useState<any[]>([])
  const [jobOpenings, setJobOpenings] = useState<any[]>([])
  const [resignations, setResignations] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const toast = useToast()

  // Selected staff 360 modal
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [staff360, setStaff360] = useState<any>(null)
  const [is360Open, setIs360Open] = useState(false)

  // Add Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    employeeCode: '',
    designation: 'Pre-Primary Teacher',
    department: 'Academics',
    qualification: 'NTT / ECCE Diploma',
    basicSalary: 22000,
  })

  // Load Dashboard Data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/hr').then((r) => r.json())
      if (res.success) {
        setMetrics(res.data.metrics)
      }
    } catch {
      toast.error('Failed to load HR metrics')
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load Staff Directory
  const loadStaff = useCallback(async () => {
    try {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      const res = await fetch(`/api/v1/hr/staff?${q}`).then((r) => r.json())
      if (res.success) setStaffList(res.data)
    } catch {
      toast.error('Failed to load staff directory')
    }
  }, [search, toast])

  // Load Leaves
  const loadLeaves = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/hr/leaves').then((r) => r.json())
      if (res.success) setLeaves(res.data)
    } catch {
      toast.error('Failed to load leave requests')
    }
  }, [toast])

  // Load Attendance
  const loadAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/hr/attendance').then((r) => r.json())
      if (res.success) setAttendanceRecords(res.data.records)
    } catch {
      toast.error('Failed to load attendance')
    }
  }, [toast])

  // Load Payroll
  const loadPayroll = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/hr/payroll').then((r) => r.json())
      if (res.success) setPayrollCycles(res.data)
    } catch {
      toast.error('Failed to load payroll cycles')
    }
  }, [toast])

  // Load Recruitment
  const loadRecruitment = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/hr/recruitment').then((r) => r.json())
      if (res.success) setJobOpenings(res.data)
    } catch {
      toast.error('Failed to load recruitment openings')
    }
  }, [toast])

  // Load Offboarding
  const loadOffboarding = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/hr/offboarding').then((r) => r.json())
      if (res.success) setResignations(res.data)
    } catch {
      toast.error('Failed to load offboarding records')
    }
  }, [toast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (tab === 'staff') loadStaff()
    else if (tab === 'leaves') loadLeaves()
    else if (tab === 'attendance') loadAttendance()
    else if (tab === 'payroll') loadPayroll()
    else if (tab === 'recruitment') loadRecruitment()
    else if (tab === 'offboarding') loadOffboarding()
  }, [tab, loadStaff, loadLeaves, loadAttendance, loadPayroll, loadRecruitment, loadOffboarding])

  // View Staff 360
  const viewStaff360 = async (id: string) => {
    try {
      setSelectedStaffId(id)
      setIs360Open(true)
      const res = await fetch(`/api/v1/hr/staff/${id}`).then((r) => r.json())
      if (res.success) setStaff360(res.data)
    } catch {
      toast.error('Failed to load staff 360 profile')
    }
  }

  // Handle Leave Approval
  const actionLeave = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoading(true)
      const res = await fetch(`/api/v1/hr/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then((r) => r.json())
      if (res.success) {
        toast.success(`Leave request ${action.toLowerCase()}d successfully`)
        loadLeaves()
      } else {
        toast.error(res.error || 'Failed to action leave')
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Add Staff
  const handleCreateStaff = async () => {
    try {
      setActionLoading(true)
      const res = await fetch('/api/v1/hr/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStaff,
          mode: 'new',
          salary: {
            basicSalary: Number(newStaff.basicSalary),
            hra: Math.round(Number(newStaff.basicSalary) * 0.4),
            specialAllowance: Math.round(Number(newStaff.basicSalary) * 0.2),
          },
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Staff member onboarded successfully')
        setIsAddStaffOpen(false)
        loadStaff()
        loadDashboard()
      } else {
        toast.error(res.error || 'Failed to create staff member')
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Run Payroll
  const handleRunPayroll = async () => {
    try {
      setActionLoading(true)
      const today = new Date()
      const res = await fetch('/api/v1/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CALCULATE',
          month: today.getMonth() + 1,
          year: today.getFullYear(),
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Monthly payroll calculated successfully with POSH gates')
        loadPayroll()
        loadDashboard()
      } else {
        toast.error(res.error || 'Failed to calculate payroll')
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="HR & Workforce Management"
        sub="Preschool staff lifecycle, teacher coverage, attendance, statutory payroll and POSH compliance."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => { loadDashboard(); if (tab === 'staff') loadStaff() }}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddStaffOpen(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Onboard Staff
            </button>
          </div>
        }
      />

      <Segmented
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'staff', label: 'Staff Directory' },
          { key: 'attendance', label: 'Daily Attendance' },
          { key: 'leaves', label: 'Leaves & Coverage' },
          { key: 'payroll', label: 'Payroll & Statutory' },
          { key: 'recruitment', label: 'Recruitment' },
          { key: 'compliance', label: 'POSH & Compliance' },
          { key: 'offboarding', label: 'Offboarding' },
        ]}
      />

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="metric-strip">
            <div className="metric-cell">
              <div className="m-top">
                <span className="m-lbl">Total Headcount</span>
                <Users size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="m-val">{metrics?.totalStaff ?? 0}</div>
              <div className="m-meta" style={{ color: 'var(--success)' }}>{metrics?.activeStaff ?? 0} active employees</div>
            </div>
            <div className="metric-cell">
              <div className="m-top">
                <span className="m-lbl">Present Today</span>
                <UserCheck size={16} style={{ color: 'var(--success)' }} />
              </div>
              <div className="m-val m-success">{metrics?.presentToday ?? 0}</div>
              <div className="m-meta">{metrics?.onLeaveToday ?? 0} on approved leave</div>
            </div>
            <div className="metric-cell">
              <div className="m-top">
                <span className="m-lbl">Pending Leaves</span>
                <CalendarCheck size={16} style={{ color: '#B45309' }} />
              </div>
              <div className="m-val" style={{ color: '#B45309' }}>{metrics?.pendingLeaves ?? 0}</div>
              <div className="m-meta">Requires substitute coverage</div>
            </div>
            <div className="metric-cell">
              <div className="m-top">
                <span className="m-lbl">POSH Training Due</span>
                <ShieldCheck size={16} style={{ color: 'var(--danger)' }} />
              </div>
              <div className="m-val" style={{ color: 'var(--danger)' }}>{metrics?.poshDue ?? 0}</div>
              <div className="m-meta">Overdue blocks payroll</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5 md:col-span-2 space-y-4">
              <h3 className="text-base font-semibold text-slate-800">Branch Workforce Distribution</h3>
              <div className="divide-y divide-slate-100">
                {(metrics?.staffByBranch || []).length > 0 ? (
                  metrics.staffByBranch.map((b: any, i: number) => (
                    <div key={i} className="py-3 flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700">{b.branchName}</span>
                      <span className="badge b-neutral">{b.count} staff members</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm">No branch staff assigned yet.</div>
                )}
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-800">Quick HR Actions</h3>
              <div className="space-y-2">
                <button className="btn btn-outline w-full justify-start text-left" onClick={() => setTab('staff')}>
                  <Users size={16} className="mr-2 text-indigo-500" /> View Staff Directory
                </button>
                <button className="btn btn-outline w-full justify-start text-left" onClick={() => setTab('leaves')}>
                  <CalendarCheck size={16} className="mr-2 text-amber-500" /> Review Leave Requests
                </button>
                <button className="btn btn-outline w-full justify-start text-left" onClick={() => setTab('payroll')}>
                  <CreditCard size={16} className="mr-2 text-emerald-500" /> Run Monthly Payroll
                </button>
                <button className="btn btn-outline w-full justify-start text-left" onClick={() => setTab('compliance')}>
                  <ShieldCheck size={16} className="mr-2 text-rose-500" /> Audit POSH Certificates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAFF DIRECTORY TAB */}
      {tab === 'staff' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search by code, name, designation or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddStaffOpen(true)}>
              <Plus size={14} className="mr-1.5" /> Add Staff
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length > 0 ? (
                  staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.employeeCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3 px-4">{s.designation || 'Staff'}</td>
                      <td className="py-3 px-4">{s.branchName || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <span className="badge b-info">{s.role || 'TEACHER'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {s.assignedClassrooms?.length > 0 ? (
                          <span className="badge b-success">{s.assignedClassrooms.join(', ')}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${s.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{s.status}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="btn btn-outline btn-sm" onClick={() => viewStaff360(s.id)}>
                          View 360
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No staff members found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAILY ATTENDANCE TAB */}
      {tab === 'attendance' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800">Today&apos;s Staff Attendance Register</h3>
            <button className="btn btn-outline" onClick={loadAttendance}>
              <RefreshCw size={14} className="mr-1.5" /> Refresh Punches
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">{r.name} ({r.employeeCode})</td>
                      <td className="py-3 px-4">{r.designation || 'Staff'}</td>
                      <td className="py-3 px-4">{r.branchName || 'Main'}</td>
                      <td className="py-3 px-4">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-4">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-4">{r.workedHours} hrs</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${r.status === 'PRESENT' ? 'b-success' : r.status === 'ON_LEAVE' ? 'b-warning' : 'b-neutral'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No staff attendance records logged for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVES TAB */}
      {tab === 'leaves' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800">Leave Requests & Teacher Classroom Coverage</h3>
            <span className="badge b-info">{leaves.filter((l) => l.status === 'PENDING').length} Pending Approval</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Classroom Coverage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.length > 0 ? (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{l.staffProfile.user.fullName}</div>
                        <div className="text-xs text-slate-400">{l.staffProfile.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">{l.leaveType.name}</td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{l.totalDays}</td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate">{l.reason}</td>
                      <td className="py-3 px-4">
                        {l.coverages?.length > 0 ? (
                          <span className="badge b-primary">
                            {l.coverages.map((c: any) => c.classroom.name).join(', ')} covered
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not required</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${l.status === 'APPROVED' ? 'b-success' : l.status === 'REJECTED' ? 'b-danger' : 'b-warning'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {l.status === 'PENDING' && (
                          <div className="flex justify-end gap-1.5">
                            <button className="btn btn-primary btn-sm" disabled={actionLoading} onClick={() => actionLeave(l.id, 'APPROVE')}>
                              Approve
                            </button>
                            <button className="btn btn-outline btn-sm" disabled={actionLoading} onClick={() => actionLeave(l.id, 'REJECT')}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYROLL TAB */}
      {tab === 'payroll' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Monthly Payroll Cycles</h3>
              <p className="text-xs text-slate-500">25th Attendance Lock &bull; PF (12%) &bull; ESI (0.75%) &bull; PT &bull; POSH Gate</p>
            </div>
            <button className="btn btn-primary" onClick={handleRunPayroll} disabled={actionLoading}>
              <CreditCard size={14} className="mr-1.5" /> Process Current Month
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">Deductions (PF/ESI/PT)</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollCycles.length > 0 ? (
                  payrollCycles.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.month}/{c.year}</td>
                      <td className="py-3 px-4">{c.totalStaff} employees</td>
                      <td className="py-3 px-4 font-mono">₹{Number(c.totalGross).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-rose-600">₹{Number(c.totalDeductions).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">₹{Number(c.totalNetPayable).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${c.status === 'DISBURSED' ? 'b-success' : c.status === 'REVIEWED' ? 'b-info' : 'b-warning'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status !== 'DISBURSED' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleRunPayroll()}>
                            Disburse
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Locked & Paid</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No payroll cycles processed yet. Click &quot;Process Current Month&quot; to run calculation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECRUITMENT TAB */}
      {tab === 'recruitment' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800">Job Openings & Candidate Pipeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobOpenings.length > 0 ? (
              jobOpenings.map((j) => (
                <div key={j.id} className="card p-4 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-900">{j.title}</h4>
                      <p className="text-xs text-slate-500">{j.designation} &bull; {j.department}</p>
                    </div>
                    <span className={`badge ${j.status === 'OPEN' ? 'b-success' : 'b-neutral'}`}>{j.status}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-100">
                    <span>{j.applications?.length || 0} Applicants</span>
                    <span>Min Exp: {j.minExperienceYears} yrs</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-slate-400">
                No job openings active currently.
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLIANCE & POSH TAB */}
      {tab === 'compliance' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Preschool POSH & Safety Compliance</h3>
              <p className="text-xs text-slate-500">POSH annual certification status across staff</p>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="flex-shrink-0 text-amber-600" size={18} />
            <div>
              <strong>POSH Statutory Rule:</strong> All preschool educators and care workers must complete annual POSH (Prevention of Sexual Harassment) certification. Expired certification holds monthly salary payout.
            </div>
          </div>
        </div>
      )}

      {/* OFFBOARDING TAB */}
      {tab === 'offboarding' && (
        <div className="card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Staff Resignations & Clearance Tasks</h3>
              <p className="text-xs text-slate-500">Cross-module clearance: Inventory asset returns, Academics handover, Finance dues</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Requested LWD</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Clearance Status</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resignations.length > 0 ? (
                  resignations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">{r.staffProfile.user.fullName}</td>
                      <td className="py-3 px-4">{new Date(r.requestedLwd).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${r.status === 'COMPLETED' ? 'b-success' : 'b-warning'}`}>
                          {r.staffProfile.offboardingTasks?.filter((t: any) => t.isCompleted).length || 0} / {r.staffProfile.offboardingTasks?.length || 5} Tasks Done
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${r.status === 'COMPLETED' ? 'b-neutral' : 'b-danger'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No active resignations or offboarding tasks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF 360 DRAWER / MODAL */}
      {is360Open && staff360 && (
        <Modal open={is360Open} onClose={() => setIs360Open(false)} title={`Staff 360: ${staff360.user?.fullName || staff360.user?.name || 'Staff'} (${staff360.employeeCode})`}>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><span className="text-slate-500">Designation:</span> <strong>{staff360.designation}</strong></div>
              <div><span className="text-slate-500">Department:</span> <strong>{staff360.department || 'Academics'}</strong></div>
              <div><span className="text-slate-500">Branch:</span> <strong>{staff360.branch?.name || 'Main'}</strong></div>
              <div><span className="text-slate-500">Role:</span> <strong>{staff360.primaryRole || 'TEACHER'}</strong></div>
              <div><span className="text-slate-500">Email:</span> <strong>{staff360.user?.email}</strong></div>
              <div><span className="text-slate-500">Status:</span> <strong>{staff360.status}</strong></div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Assigned Classrooms</h4>
              {staff360.classrooms?.length > 0 ? (
                <div className="flex gap-2">
                  {staff360.classrooms.map((c: any) => (
                    <span key={c.id} className="badge b-success">{c.name} ({c.programType})</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No active classrooms assigned.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Salary Structure</h4>
              {staff360.salaryStructure ? (
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div>Basic: ₹{Number(staff360.salaryStructure.basicSalary)}</div>
                  <div>HRA: ₹{Number(staff360.salaryStructure.hra)}</div>
                  <div>Allowance: ₹{Number(staff360.salaryStructure.specialAllowance)}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Default salary package applicable.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ADD STAFF MODAL */}
      {isAddStaffOpen && (
        <Modal open={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} title="Onboard New Preschool Staff">
          <div className="space-y-3">
            <Field label="Full Name" required>
              <input
                type="text"
                className="input"
                placeholder="e.g. Radhika Sharma"
                value={newStaff.fullName}
                onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" required>
                <input
                  type="email"
                  className="input"
                  placeholder="teacher@preone.in"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </Field>
              <Field label="Employee Code" required>
                <input
                  type="text"
                  className="input"
                  placeholder="EMP-2026-01"
                  value={newStaff.employeeCode}
                  onChange={(e) => setNewStaff({ ...newStaff, employeeCode: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Designation">
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Senior Teacher"
                  value={newStaff.designation}
                  onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                />
              </Field>
              <Field label="Basic Salary (₹)">
                <input
                  type="number"
                  className="input"
                  value={newStaff.basicSalary}
                  onChange={(e) => setNewStaff({ ...newStaff, basicSalary: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button className="btn btn-outline" onClick={() => setIsAddStaffOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={handleCreateStaff}>
                Complete Onboarding
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

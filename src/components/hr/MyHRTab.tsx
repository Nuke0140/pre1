'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  Briefcase,
  AlertCircle,
  Plus,
  CheckCircle2,
  XCircle,
  Bell,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Star,
} from 'lucide-react'

export function MyHRTab() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'attendance' | 'leave' | 'salary' | 'payslips' | 'performance' | 'documents' | 'notifications'>('profile')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [leaveData, setLeaveData] = useState<any>(null)
  const [salary, setSalary] = useState<any>(null)
  const [payslips, setPayslips] = useState<any[]>([])
  const [appraisals, setAppraisals] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  // Leave Form state
  const [applyOpen, setApplyOpen] = useState(false)
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [applying, setApplying] = useState(false)
  const [leaveMessage, setLeaveMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resProf, resAtt, resLeave, resSal, resPayslip, resAppraisals, resDocs, resNotif] = await Promise.all([
        fetch('/api/v1/hr/me/profile').then((r) => r.json()),
        fetch('/api/v1/hr/me/attendance').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/leave').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/salary').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/payslips').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/appraisals').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/documents').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/hr/me/notifications').then((r) => r.json()).catch(() => ({ success: false })),
      ])

      if (resProf.success) {
        setProfile(resProf.data)
      } else {
        setError(resProf.error?.message || 'No Employee record linked to your user account')
      }

      if (resAtt.success) setAttendance(resAtt.data)
      if (resLeave.success) setLeaveData(resLeave.data)
      if (resSal.success) setSalary(resSal.data)
      if (resPayslip.success) setPayslips(resPayslip.data || [])
      if (resAppraisals.success) setAppraisals(resAppraisals.data || [])
      if (resDocs.success) setDocuments(resDocs.data || [])
      if (resNotif.success) setNotifications(resNotif.data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load My HR data')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    setLeaveMessage(null)
    try {
      const res = await fetch('/api/v1/hr/me/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveTypeId, startDate, endDate, reason }),
      }).then((r) => r.json())

      if (res.success) {
        setLeaveMessage({ type: 'success', msg: 'Leave application submitted successfully!' })
        setApplyOpen(false)
        setStartDate('')
        setEndDate('')
        setReason('')
        // Refresh leave data
        const rL = await fetch('/api/v1/hr/me/leave').then((r) => r.json())
        if (rL.success) setLeaveData(rL.data)
      } else {
        setLeaveMessage({ type: 'error', msg: res.error?.message || 'Failed to submit leave' })
      }
    } catch (e: any) {
      setLeaveMessage({ type: 'error', msg: e.message || 'Submission error' })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading My HR workspace...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm max-w-2xl mx-auto my-8">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Employee Record Notice
        </div>
        <p>{error || 'Your logged-in account is not linked to an active Employee record in this tenant.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Sub Navigation Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold flex items-center justify-center text-lg shadow">
              {profile.user?.fullName?.charAt(0) || 'E'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile.user?.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  {profile.employeeCode}
                </span>
                <span>•</span>
                <span>{profile.designationRef?.name || profile.designation || 'Staff'}</span>
                <span>•</span>
                <span>{profile.departmentRef?.name || profile.department || 'General'}</span>
              </div>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" />
              My Profile
            </button>
            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              My Attendance
            </button>
            <button
              onClick={() => setActiveSubTab('leave')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'leave' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              My Leave
            </button>
            <button
              onClick={() => setActiveSubTab('salary')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'salary' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />
              My Salary
            </button>
            <button
              onClick={() => setActiveSubTab('payslips')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'payslips' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              My Payslips
            </button>
            <button
              onClick={() => setActiveSubTab('performance')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'performance' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Award className="w-3.5 h-3.5 inline mr-1" />
              My Performance
            </button>
            <button
              onClick={() => setActiveSubTab('documents')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'documents' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              My Documents
            </button>
            <button
              onClick={() => setActiveSubTab('notifications')}
              className={`px-3 py-1.5 rounded-md transition ${activeSubTab === 'notifications' ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Bell className="w-3.5 h-3.5 inline mr-1" />
              Notifications
            </button>
          </div>
        </div>
      </div>

      {/* ── Subtab Content ── */}

      {/* 1. MY PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Full Name</span>
                <span className="font-semibold text-slate-800">{profile.user?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-semibold text-slate-800">{profile.user?.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-800">{profile.user?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Birth</span>
                <span className="font-semibold text-slate-800">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Gender</span>
                <span className="font-semibold text-slate-800">{profile.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Blood Group</span>
                <span className="font-semibold text-slate-800">{profile.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Employment Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Employee Code</span>
                <span className="font-semibold font-mono text-indigo-700">{profile.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Employment Status</span>
                <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {profile.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-800">{profile.departmentRef?.name || profile.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Designation</span>
                <span className="font-semibold text-slate-800">{profile.designationRef?.name || profile.designation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Branch / Campus</span>
                <span className="font-semibold text-slate-800">{profile.branch?.name || 'Main Campus'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Joining Date</span>
                <span className="font-semibold text-slate-800">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MY ATTENDANCE */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          {attendance?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <span className="text-xs text-emerald-700 font-medium block">Present Days</span>
                <span className="text-2xl font-bold text-emerald-900">{attendance.summary.present}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                <span className="text-xs text-rose-700 font-medium block">Absent Days</span>
                <span className="text-2xl font-bold text-rose-900">{attendance.summary.absent}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs text-amber-700 font-medium block">Half Days</span>
                <span className="text-2xl font-bold text-amber-900">{attendance.summary.halfDay}</span>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl">
                <span className="text-xs text-sky-700 font-medium block">On Leave</span>
                <span className="text-2xl font-bold text-sky-900">{attendance.summary.onLeave}</span>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Monthly Attendance Records
            </div>
            {attendance?.records && attendance.records.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {attendance.records.map((r: any) => (
                  <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <span className="font-semibold text-slate-800">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      {r.checkIn && (
                        <span className="text-slate-400 text-[11px] block">
                          Punch: {new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : r.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No attendance records logged for this month yet.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. MY LEAVE */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Leave Quota & Requests</h3>
            <button
              onClick={() => setApplyOpen(!applyOpen)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> Apply for Leave
            </button>
          </div>

          {leaveMessage && (
            <div className={`p-3 rounded-lg text-xs font-medium ${leaveMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
              {leaveMessage.msg}
            </div>
          )}

          {applyOpen && (
            <form onSubmit={handleApplyLeave} className="bg-slate-50 border border-indigo-200 rounded-xl p-4 space-y-4 text-xs shadow-inner">
              <h4 className="font-bold text-slate-800">Apply Leave Request</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Leave Type</label>
                  <select
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">Select Leave Type</option>
                    {leaveData?.balances?.map((b: any) => (
                      <option key={b.leaveType?.id || b.id} value={b.leaveType?.id || b.leaveTypeId}>
                        {b.leaveType?.name || 'Casual Leave'} (Remaining: {b.balance || b.totalCredited - b.consumed} days)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="Explain brief reason for leave..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  {applying ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}

          {/* Leave Balances */}
          {leaveData?.balances && leaveData.balances.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {leaveData.balances.map((b: any) => (
                <div key={b.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <span className="text-xs font-bold text-slate-700 block">{b.leaveType?.name || 'Leave'}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-indigo-600">{b.balance ?? (b.totalCredited - b.consumed)}</span>
                    <span className="text-[11px] text-slate-400">/ {b.totalCredited} days</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leave History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Leave Request History
            </div>
            {leaveData?.requests && leaveData.requests.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {leaveData.requests.map((r: any) => (
                  <div key={r.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {r.leaveType?.name || 'Leave'} ({r.totalDays || 1} day(s))
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()} — {r.reason}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No leave requests submitted yet.</div>
            )}
          </div>
        </div>
      )}

      {/* 4. MY SALARY */}
      {activeSubTab === 'salary' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Active Salary Structure
          </h3>
          {salary ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-slate-900">₹{Number(salary.basicSalary).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">HRA (Housing Allowance)</span>
                <span className="font-bold text-slate-900">₹{Number(salary.hra).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Special / Other Allowance</span>
                <span className="font-bold text-slate-900">₹{Number(salary.specialAllowance).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg font-extrabold text-sm text-emerald-900">
                <span>Gross Fixed Salary</span>
                <span>₹{(Number(salary.basicSalary) + Number(salary.hra) + Number(salary.specialAllowance)).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">No active salary structure configured.</div>
          )}
        </div>
      )}

      {/* 5. MY PAYSLIPS */}
      {activeSubTab === 'payslips' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            Monthly Payslips
          </div>
          {payslips.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {payslips.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">
                      {p.payrollCycle ? `${new Date(0, p.payrollCycle.month - 1).toLocaleString('default', { month: 'long' })} ${p.payrollCycle.year}` : 'Monthly Payslip'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      Gross: ₹{Number(p.grossEarnings).toLocaleString()} | Deductions: ₹{Number(p.totalDeductions).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-700 block">
                      ₹{Number(p.netSalary).toLocaleString()}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No payslips generated for your account yet.</div>
          )}
        </div>
      )}

      {/* 5.5. MY PERFORMANCE APPRAISALS */}
      {activeSubTab === 'performance' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span>Performance & Appraisal Records</span>
            <span className="text-[11px] font-normal text-slate-500">Historical performance & salary revisions</span>
          </div>
          {appraisals.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {appraisals.map((app) => (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        Review Period: {app.reviewPeriod}
                      </span>
                      <span className="text-slate-500 text-xs">
                        Reviewer: {app.reviewer?.user?.fullName || 'Management'} • Date: {new Date(app.appraisalDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {app.rating.toFixed(1)} / 5.0
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium mt-1">
                        {app.performanceStatus}
                      </span>
                    </div>
                  </div>

                  {app.strengths && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                      <span className="font-bold text-slate-900">Strengths: </span>
                      {app.strengths}
                    </div>
                  )}

                  {app.reviewerComments && (
                    <div className="text-slate-600 italic bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      "{app.reviewerComments}"
                    </div>
                  )}

                  {/* Salary Revision Summary */}
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider block">
                        Approved Salary Revision
                      </span>
                      <span className="text-xs text-slate-600">
                        Previous: ₹{app.previousSalary.toLocaleString()} ➔ Revised: <strong className="text-emerald-700 font-bold">₹{app.revisedSalary.toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800 block">
                        +₹{app.increaseAmount.toLocaleString()} ({app.increaseType === 'PERCENTAGE' ? `${app.increasePercentage}%` : 'Fixed'})
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Status: {app.salaryRevisionStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No performance appraisals recorded for your account yet.
            </div>
          )}
        </div>
      )}

      {/* 6. MY DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Employee Verification Documents
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload identity proofs, ECCE certificates, or qualification degrees for HR verification.
              </p>
            </div>
          </div>

          {/* Upload Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement
              const file = fileInput?.files?.[0]
              const docTypeSelect = e.currentTarget.querySelector('select[name="docType"]') as HTMLSelectElement
              const docNumInput = e.currentTarget.querySelector('input[name="docNumber"]') as HTMLInputElement

              if (!file) {
                alert('Please select a file to upload (PDF, JPG, or PNG under 5MB).')
                return
              }

              const fd = new FormData()
              fd.append('file', file)
              fd.append('docType', docTypeSelect.value)
              fd.append('staffProfileId', profile.id)
              if (docNumInput.value) fd.append('documentNumber', docNumInput.value)

              try {
                const res = await fetch('/api/v1/hr/documents/upload', {
                  method: 'POST',
                  body: fd,
                }).then((r) => r.json())

                if (res.success) {
                  alert('Document uploaded successfully! Status set to PENDING verification.')
                  fileInput.value = ''
                  docNumInput.value = ''
                  // Refresh documents list
                  const rDocs = await fetch('/api/v1/hr/me/documents').then((r) => r.json())
                  if (rDocs.success) setDocuments(rDocs.data || [])
                } else {
                  alert(res.error?.message || 'Failed to upload document')
                }
              } catch (err: any) {
                alert(err.message || 'Upload error')
              }
            }}
            className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-3"
          >
            <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Upload New Document
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
                <select name="docType" className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white">
                  <option value="ID_PROOF">Aadhaar / PAN Card (Identity Proof)</option>
                  <option value="ADDRESS_PROOF">Address Proof</option>
                  <option value="DEGREE_CERTIFICATE">Degree / Graduation Certificate</option>
                  <option value="ECCE_CERTIFICATE">ECCE / Montessori Diploma</option>
                  <option value="POLICE_VERIFICATION">Police Verification Record</option>
                  <option value="EXPERIENCE_LETTER">Experience / Relieving Letter</option>
                  <option value="RESUME">Resume / CV</option>
                  <option value="OTHER">Other Verification Document</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document No. (Optional)</label>
                <input
                  name="docNumber"
                  placeholder="e.g. 1234-5678-9012"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (PDF, JPG, PNG &le; 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-xs p-1 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm">
                Upload & Submit
              </button>
            </div>
          </form>

          {/* Document List */}
          {documents.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl overflow-hidden">
              {documents.map((d) => (
                <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 block text-xs">{d.fileName || d.docType}</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      Type: {d.docType} {d.documentNumber ? `• No: ${d.documentNumber}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.verificationStatus || 'PENDING'}
                    </span>
                    <a
                      href={`/api/v1/hr/documents/${d.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-[11px] transition inline-flex items-center gap-1"
                    >
                      Download / View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
              No employee documents uploaded yet. Use the form above to upload identity files.
            </div>
          )}
        </div>
      )}

      {/* 7. HR NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            HR Notifications
          </div>
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {notifications.map((n) => (
                <div key={n.id} className="p-3">
                  <div className="font-bold text-slate-800">{n.title}</div>
                  <div className="text-slate-600 mt-0.5">{n.body || n.message}</div>
                  <div className="text-slate-400 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No HR notifications found.</div>
          )}
        </div>
      )}
    </div>
  )
}

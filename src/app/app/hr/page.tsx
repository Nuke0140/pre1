'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users, UserCheck, CalendarCheck, CreditCard, Briefcase,
  AlertTriangle, ShieldCheck, UserMinus, Plus, RefreshCw,
  CheckCircle2, XCircle, FileText, Building, Calendar,
  Eye, Pencil, BadgeCheck, HandCoins, ListChecks, Send,
  DollarSign, GraduationCap, Clock, Lock, ArrowRight,
  Shield, Download, Filter, Search, PhoneCall, ExternalLink,
  ChevronRight, AlertCircle, X, Check, Award, HeartPulse, UserX
} from 'lucide-react'
import { PageHead, StatusBadge, Skeleton, Avatar, EmptyState, Segmented, Field } from '@/components/preone/ui'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { Modal, Drawer } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { can } from '@/lib/auth'
import { fmtDate } from '@/lib/format'

type TabKey = 'overview' | 'staff' | 'attendance' | 'leaves' | 'payroll' | 'recruitment' | 'compliance' | 'offboarding'

const STAFF_ROLES = ['TEACHER', 'HELPER', 'ACCOUNTANT', 'HR', 'DRIVER', 'PRINCIPAL']

const money = (n?: number | null) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
const timeOf = (d?: string | null) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')

export default function HRPage() {
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('overview')
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [busy, setBusy] = useState(false)

  // Global Context & Search
  const [globalSearch, setGlobalSearch] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const canWrite = can(role as any, 'hr:write')
  const canApprove = can(role as any, 'hr:approve')
  const canPayroll = can(role as any, 'payroll:process')

  const [metrics, setMetrics] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])

  // Staff Directory Workspace
  const [staffList, setStaffList] = useState<any[] | null>(null)
  const [staffQuery, setStaffQuery] = useState('')
  const [staffBranch, setStaffBranch] = useState('ALL')
  const [staffStatus, setStaffStatus] = useState('ALL')
  const [staffDept, setStaffDept] = useState('ALL')

  // Attendance Workspace
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceBranch, setAttendanceBranch] = useState('ALL')
  const [attendanceRecords, setAttendanceRecords] = useState<any[] | null>(null)
  const [attCorrectionModalOpen, setAttCorrectionModalOpen] = useState(false)
  const [activeCorrectionTarget, setActiveCorrectionTarget] = useState<any>(null)
  const [correctionForm, setCorrectionForm] = useState({
    status: 'PRESENT',
    checkIn: '',
    checkOut: '',
    reason: '',
  })

  // Leaves Workspace
  const [leaves, setLeaves] = useState<any[] | null>(null)
  const [leaveFilter, setLeaveFilter] = useState('ALL')
  const [leaveActionLoading, setLeaveActionLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [activeRejectTarget, setActiveRejectTarget] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Payroll Workspace
  const [payrollCycles, setPayrollCycles] = useState<any[] | null>(null)
  const [isProcessPayrollOpen, setIsProcessPayrollOpen] = useState(false)
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1)
  const [payYear, setPayYear] = useState(new Date().getFullYear())
  const [payBranch, setPayBranch] = useState('')
  const [disburseModalOpen, setDisburseModalOpen] = useState(false)
  const [activeDisburseCycle, setActiveDisburseCycle] = useState<any>(null)
  const [disburseReference, setDisburseReference] = useState('')

  // Recruitment Workspace
  const [jobOpenings, setJobOpenings] = useState<any[] | null>(null)
  const [recruitmentTab, setRecruitmentTab] = useState<'PIPELINE' | 'OPENINGS'>('PIPELINE')
  const [isNewOpeningOpen, setIsNewOpeningOpen] = useState(false)
  const [newOpeningForm, setNewOpeningForm] = useState({
    title: '',
    designation: 'Montessori Teacher',
    department: 'Academics',
    branchId: '',
    openingsCount: 1,
    minExperienceYears: 1,
    qualificationRequired: 'ECCE / Montessori Diploma',
    description: '',
  })
  const [activeInterviewApp, setActiveInterviewApp] = useState<any>(null)
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [interviewForm, setInterviewForm] = useState({
    roundName: 'Pedagogical Demo & Interview',
    scheduledAt: '',
    interviewerName: '',
  })
  const [activeConvertCandidate, setActiveConvertCandidate] = useState<any>(null)
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertForm, setConvertForm] = useState({
    employeeCode: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 20000,
  })

  // Compliance Workspace
  const [complianceRecords, setComplianceRecords] = useState<any[] | null>(null)
  const [complianceStats, setComplianceStats] = useState<any>(null)
  const [complianceFilter, setComplianceFilter] = useState('ALL')
  const [recordCertModalOpen, setRecordCertModalOpen] = useState(false)
  const [certForm, setCertForm] = useState({
    staffProfileId: '',
    trainingType: 'POSH',
    title: 'Annual POSH Certification 2026',
    score: 95,
    completionDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    remarks: 'Annual child-safety certification verified',
  })

  // Offboarding Workspace
  const [resignations, setResignations] = useState<any[] | null>(null)
  const [isSubmitResignationOpen, setIsSubmitResignationOpen] = useState(false)
  const [resignationForm, setResignationForm] = useState({
    staffProfileId: '',
    reason: '',
    requestedLwd: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
  })

  // Staff 360 Full Drawer Workspace
  const [is360Open, setIs360Open] = useState(false)
  const [staff360, setStaff360] = useState<any>(null)
  const [staff360Tab, setStaff360Tab] = useState<'OVERVIEW' | 'EMPLOYMENT' | 'PERSONAL' | 'SALARY' | 'ATTENDANCE' | 'LEAVES' | 'PAYROLL' | 'COMPLIANCE'>('OVERVIEW')

  // Full Staff Edit Modal
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false)
  const [editStaffData, setEditStaffData] = useState<any>(null)

  // Atomic Onboard Staff Modal
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [onboardForm, setOnboardForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TEACHER',
    employeeCode: '',
    designation: 'Montessori Educator',
    department: 'Academics',
    qualification: 'ECCE Diploma',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'REGULAR',
    branchId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    basicSalary: 22000,
  })

  // Branch Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<any>(null)
  const [targetBranchId, setTargetBranchId] = useState('')

  // ── 1. Data Loaders ─────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    try {
      setBusy(true)
      const [resHr, resBranches] = await Promise.all([
        fetch('/api/v1/hr').then((r) => r.json()),
        fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false })),
      ])
      if (resHr.success) {
        setMetrics(resHr.data.metrics)
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
      if (resBranches.success) {
        setBranches(resBranches.data || [])
      }
    } catch (e: any) {
      toast.error('Failed to load HR dashboard', e.message)
    } finally {
      setBusy(false)
    }
  }, [toast])

  const loadStaff = useCallback(async () => {
    try {
      setStaffList(null)
      const sp = new URLSearchParams()
      if (staffBranch !== 'ALL') sp.set('branchId', staffBranch)
      if (staffStatus !== 'ALL') sp.set('status', staffStatus)
      if (staffDept !== 'ALL') sp.set('department', staffDept)
      if (staffQuery.trim()) sp.set('search', staffQuery.trim())

      const res = await fetch(`/api/v1/hr/staff?${sp.toString()}`).then((r) => r.json())
      if (res.success) setStaffList(res.data)
    } catch (e: any) {
      toast.error('Failed to load staff directory', e.message)
    }
  }, [staffBranch, staffStatus, staffDept, staffQuery, toast])

  const loadAttendance = useCallback(async () => {
    try {
      setAttendanceRecords(null)
      const sp = new URLSearchParams({ date: attendanceDate })
      if (attendanceBranch !== 'ALL') sp.set('branchId', attendanceBranch)

      const res = await fetch(`/api/v1/hr/attendance?${sp.toString()}`).then((r) => r.json())
      if (res.success) setAttendanceRecords(res.data.records)
    } catch (e: any) {
      toast.error('Failed to load staff attendance', e.message)
    }
  }, [attendanceDate, attendanceBranch, toast])

  const loadLeaves = useCallback(async () => {
    try {
      setLeaves(null)
      const sp = new URLSearchParams()
      if (leaveFilter !== 'ALL') sp.set('status', leaveFilter)
      const res = await fetch(`/api/v1/hr/leaves?${sp.toString()}`).then((r) => r.json())
      if (res.success) setLeaves(res.data)
    } catch (e: any) {
      toast.error('Failed to load leave records', e.message)
    }
  }, [leaveFilter, toast])

  const loadPayroll = useCallback(async () => {
    try {
      setPayrollCycles(null)
      const res = await fetch('/api/v1/hr/payroll').then((r) => r.json())
      if (res.success) setPayrollCycles(res.data)
    } catch (e: any) {
      toast.error('Failed to load payroll cycles', e.message)
    }
  }, [toast])

  const loadRecruitment = useCallback(async () => {
    try {
      setJobOpenings(null)
      const res = await fetch('/api/v1/hr/recruitment').then((r) => r.json())
      if (res.success) setJobOpenings(res.data)
    } catch (e: any) {
      toast.error('Failed to load recruitment pipeline', e.message)
    }
  }, [toast])

  const loadCompliance = useCallback(async () => {
    try {
      setComplianceRecords(null)
      const sp = new URLSearchParams()
      if (complianceFilter !== 'ALL') sp.set('status', complianceFilter)
      const res = await fetch(`/api/v1/hr/compliance?${sp.toString()}`).then((r) => r.json())
      if (res.success) {
        setComplianceRecords(res.data.records)
        setComplianceStats(res.data.stats)
      }
    } catch (e: any) {
      toast.error('Failed to load compliance radar', e.message)
    }
  }, [complianceFilter, toast])

  const loadOffboarding = useCallback(async () => {
    try {
      setResignations(null)
      const res = await fetch('/api/v1/hr/offboarding').then((r) => r.json())
      if (res.success) setResignations(res.data)
    } catch (e: any) {
      toast.error('Failed to load offboarding records', e.message)
    }
  }, [toast])

  // Initial load
  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  // Tab switch loader
  useEffect(() => {
    if (tab === 'overview') loadOverview()
    else if (tab === 'staff') loadStaff()
    else if (tab === 'attendance') loadAttendance()
    else if (tab === 'leaves') loadLeaves()
    else if (tab === 'payroll') loadPayroll()
    else if (tab === 'recruitment') loadRecruitment()
    else if (tab === 'compliance') loadCompliance()
    else if (tab === 'offboarding') loadOffboarding()
  }, [tab, loadOverview, loadStaff, loadAttendance, loadLeaves, loadPayroll, loadRecruitment, loadCompliance, loadOffboarding])

  // Open Staff 360
  const openStaff360 = async (staffId: string) => {
    setIs360Open(true)
    setStaff360(null)
    try {
      const res = await fetch(`/api/v1/hr/staff/${staffId}`).then((r) => r.json())
      if (res.success) {
        setStaff360(res.data)
      } else {
        toast.error('Could not load Staff 360', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Error loading 360 profile', e.message)
    }
  }

  // Open Edit Staff
  const openEditStaff = (profile: any) => {
    setEditStaffData({
      id: profile.id,
      fullName: profile.user?.fullName || profile.name || '',
      phone: profile.user?.phone || profile.phone || '',
      designation: profile.designation || '',
      department: profile.department || 'Academics',
      qualification: profile.qualification || '',
      employmentType: profile.employmentType || 'REGULAR',
      branchId: profile.branchId || '',
      gender: profile.gender || '',
      maritalStatus: profile.maritalStatus || '',
      bloodGroup: profile.bloodGroup || '',
      currentAddress: profile.currentAddress || '',
      permanentAddress: profile.permanentAddress || '',
      panNumber: profile.panNumber || '',
      aadhaarNumber: profile.aadhaarNumber || '',
      uanNumber: profile.uanNumber || '',
      esiNumber: profile.esiNumber || '',
      emergencyContactName: profile.emergencyContactName || '',
      emergencyContactPhone: profile.emergencyContactPhone || '',
      basicSalary: profile.salaryStructure?.basicSalary || 20000,
      hra: profile.salaryStructure?.hra || 8000,
      specialAllowance: profile.salaryStructure?.specialAllowance || 4000,
      bankAccount: profile.bankDetails?.accountNumberEncrypted || '',
      bankName: profile.bankDetails?.bankName || '',
      ifscCode: profile.bankDetails?.ifscCode || '',
    })
    setIsEditStaffOpen(true)
  }

  // Save Edit Staff
  const handleSaveStaffEdit = async () => {
    if (!editStaffData) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/hr/staff/${editStaffData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editStaffData.fullName,
          phone: editStaffData.phone,
          designation: editStaffData.designation,
          department: editStaffData.department,
          qualification: editStaffData.qualification,
          employmentType: editStaffData.employmentType,
          branchId: editStaffData.branchId || null,
          gender: editStaffData.gender || null,
          maritalStatus: editStaffData.maritalStatus || null,
          bloodGroup: editStaffData.bloodGroup || null,
          currentAddress: editStaffData.currentAddress || null,
          permanentAddress: editStaffData.permanentAddress || null,
          panNumber: editStaffData.panNumber || null,
          aadhaarNumber: editStaffData.aadhaarNumber || null,
          uanNumber: editStaffData.uanNumber || null,
          esiNumber: editStaffData.esiNumber || null,
          emergencyContactName: editStaffData.emergencyContactName || null,
          emergencyContactPhone: editStaffData.emergencyContactPhone || null,
          salary: {
            basicSalary: parseFloat(editStaffData.basicSalary) || 0,
            hra: parseFloat(editStaffData.hra) || 0,
            specialAllowance: parseFloat(editStaffData.specialAllowance) || 0,
          },
          bankDetails: editStaffData.bankAccount ? {
            accountHolderName: editStaffData.fullName,
            bankName: editStaffData.bankName || 'HDFC Bank',
            accountNumber: editStaffData.bankAccount,
            ifscCode: editStaffData.ifscCode || 'HDFC0001234',
          } : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Staff profile updated')
        setIsEditStaffOpen(false)
        if (is360Open && staff360?.id === editStaffData.id) {
          openStaff360(editStaffData.id)
        }
        loadStaff()
      } else {
        toast.error('Update failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Atomic Onboard Staff
  const handleCreateStaff = async () => {
    if (!onboardForm.fullName || !onboardForm.email || !onboardForm.employeeCode) {
      toast.error('Validation Error', 'Full Name, Email, and Employee Code are required.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...onboardForm,
          salary: {
            basicSalary: Number(onboardForm.basicSalary),
            hra: Math.round(Number(onboardForm.basicSalary) * 0.4),
            specialAllowance: Math.round(Number(onboardForm.basicSalary) * 0.2),
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Staff Onboarded Successfully')
        setIsOnboardOpen(false)
        setOnboardForm({
          fullName: '', email: '', phone: '', password: '', role: 'TEACHER',
          employeeCode: '', designation: 'Montessori Educator', department: 'Academics',
          qualification: 'ECCE Diploma', joiningDate: new Date().toISOString().split('T')[0],
          employmentType: 'REGULAR', branchId: '', emergencyContactName: '', emergencyContactPhone: '',
          basicSalary: 22000,
        })
        loadOverview()
        if (tab === 'staff') loadStaff()
      } else {
        toast.error('Onboarding Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Branch Transfer
  const handleExecuteTransfer = async () => {
    if (!transferTarget || !targetBranchId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/hr/staff/${transferTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: targetBranchId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Branch Transfer Completed')
        setIsTransferOpen(false)
        setTransferTarget(null)
        loadStaff()
      } else {
        toast.error('Transfer Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Submit Attendance Correction
  const handleSaveCorrection = async () => {
    if (!activeCorrectionTarget || !correctionForm.reason.trim()) {
      toast.error('Validation Error', 'Mandatory correction reason required for audit.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffProfileId: activeCorrectionTarget.staffProfileId,
          date: attendanceDate,
          status: correctionForm.status,
          checkIn: correctionForm.checkIn || undefined,
          checkOut: correctionForm.checkOut || undefined,
          reason: correctionForm.reason.trim(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Attendance correction recorded with audit trail')
        setAttCorrectionModalOpen(false)
        loadAttendance()
      } else {
        toast.error('Correction Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Action Leave (Approve or Reject)
  const actionLeave = async (id: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setLeaveActionLoading(true)
    try {
      const res = await fetch(`/api/v1/hr/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(action === 'APPROVE' ? 'Leave Approved & Coverage Routed' : 'Leave Request Rejected')
        setRejectModalOpen(false)
        loadLeaves()
        loadOverview()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setLeaveActionLoading(false)
    }
  }

  // Process Payroll
  const handleProcessPayroll = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: payMonth,
          year: payYear,
          branchId: payBranch || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Payroll Calculation Completed', `Status: ${json.data.status}`)
        setIsProcessPayrollOpen(false)
        loadPayroll()
        loadOverview()
      } else {
        toast.error('Payroll Calculation Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Disburse Payroll
  const handleDisbursePayroll = async () => {
    if (!activeDisburseCycle) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISBURSE',
          cycleId: activeDisburseCycle.id,
          paymentReference: disburseReference || `NEFT-${Date.now()}`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Payroll Disbursed & Locked')
        setDisburseModalOpen(false)
        loadPayroll()
        loadOverview()
      } else {
        toast.error('Disbursement Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Export Bank NEFT
  const handleExportBankFile = async (cycleId: string) => {
    try {
      const link = document.createElement('a')
      link.href = `/api/v1/hr/payroll?export=true&cycleId=${cycleId}`
      link.download = `bank-payout-${cycleId}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Downloading Bank NEFT CSV')
    } catch (e: any) {
      toast.error('Failed to export bank file', e.message)
    }
  }

  // Move Candidate Stage
  const handleMoveCandidateStage = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/v1/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STAGE',
          jobApplicationId: appId,
          status: newStatus,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Candidate moved to ${newStatus}`)
        loadRecruitment()
      } else {
        toast.error('Failed to update stage', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    }
  }

  // Convert Candidate to Staff
  const handleConvertCandidate = async () => {
    if (!activeConvertCandidate || !convertForm.employeeCode) {
      toast.error('Validation Error', 'Employee code is required.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONVERT_TO_STAFF',
          jobApplicationId: activeConvertCandidate.id,
          staffData: convertForm,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Candidate ${activeConvertCandidate.candidateName} successfully onboarded as staff!`)
        setConvertModalOpen(false)
        loadRecruitment()
        loadOverview()
      } else {
        toast.error('Conversion Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Record Compliance Training
  const handleRecordCompliance = async () => {
    if (!certForm.staffProfileId) {
      toast.error('Validation Error', 'Please select an employee.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Compliance certificate recorded. Any held payouts released.')
        setRecordCertModalOpen(false)
        loadCompliance()
        loadOverview()
      } else {
        toast.error('Failed to record compliance', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Complete Clearance Task
  const handleCompleteClearance = async (taskId: string) => {
    const remarks = window.prompt('Enter clearance verification notes / asset handover remarks:', 'Verified and cleared')
    if (remarks === null) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/offboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_TASK',
          taskId,
          remarks,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Clearance task signed off')
        loadOffboarding()
        loadOverview()
      } else {
        toast.error('Action Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Reopen Clearance Task
  const handleReopenClearance = async (taskId: string) => {
    const remarks = window.prompt('Reason for reopening clearance task:', 'Pending physical verification')
    if (remarks === null) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/hr/offboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN_TASK',
          taskId,
          remarks,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.warning('Clearance task reopened')
        loadOffboarding()
        loadOverview()
      } else {
        toast.error('Failed to reopen task', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── 1. Page Header & Operational Context Strip ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="space-y-1.5">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/app' }, { label: 'HR & Workforce' }]} />
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              HR & Workforce Management
            </h1>
            <span className="badge b-primary text-xs font-semibold px-2 py-0.5">M07 Control Plane</span>
            <span className="badge b-success text-xs font-semibold px-2 py-0.5">Child Safety Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>Campus: <b>Main Campus</b></span>
            <span>•</span>
            <span>Academic Session: <b>2026-27</b></span>
            <span>•</span>
            <span>Fiscal Year: <b>2026-27 (Apr–Mar)</b></span>
            {lastSyncTime && (
              <>
                <span>•</span>
                <span>Synced: {lastSyncTime}</span>
              </>
            )}
          </div>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          <div className="relative min-w-[220px] hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className="input text-xs"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search staff, code, role..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value)
                setStaffQuery(e.target.value)
                if (tab !== 'staff') setTab('staff')
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            onClick={() => {
              if (tab === 'overview') loadOverview()
              else if (tab === 'staff') loadStaff()
              else if (tab === 'attendance') loadAttendance()
              else if (tab === 'leaves') loadLeaves()
              else if (tab === 'payroll') loadPayroll()
              else if (tab === 'recruitment') loadRecruitment()
              else if (tab === 'compliance') loadCompliance()
              else if (tab === 'offboarding') loadOffboarding()
            }}
            disabled={busy}
            title="Refresh active workspace data"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin text-primary' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm shadow-primary/20"
            onClick={() => setIsOnboardOpen(true)}
          >
            <Plus size={14} />
            <span>Onboard Staff</span>
          </button>
        </div>
      </div>

      {/* ── 2. Canonical PreOne Metric Strip ── */}
      <div className="metric-strip">
        {/* Active Staff */}
        <div
          className="metric-cell cursor-pointer"
          onClick={() => {
            setTab('staff')
            setStaffStatus('ACTIVE')
          }}
          title="Click to view staff roster"
        >
          <div className="m-top">
            <span className="m-lbl">Active Staff</span>
            <span className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users size={14} />
            </span>
          </div>
          <div className="m-val m-highlight">
            {metrics?.activeStaff ?? 0}
            <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>
              /{metrics?.totalStaff ?? 0}
            </span>
          </div>
          <div className="m-meta truncate">
            {metrics?.onProbation ?? 0} on probation • <span className="text-primary font-medium">View roster →</span>
          </div>
        </div>

        {/* Staff Present Today */}
        <div
          className="metric-cell cursor-pointer"
          onClick={() => setTab('attendance')}
          title="Click to view today's attendance register"
        >
          <div className="m-top">
            <span className="m-lbl">Staff Present</span>
            <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck size={14} />
            </span>
          </div>
          <div className="m-val m-success">
            {metrics?.presentToday ?? 0}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>
              clocked in
            </span>
          </div>
          <div className="m-meta truncate">
            {metrics?.onLeaveToday ?? 0} on leave • <span className="text-rose-500 font-medium">{metrics?.absentToday ?? 0} absent</span>
          </div>
        </div>

        {/* Pending Actions Desk */}
        <div
          className="metric-cell cursor-pointer"
          onClick={() => {
            setTab('leaves')
            setLeaveFilter('PENDING')
          }}
          title="Click to view pending leave approvals"
        >
          <div className="m-top">
            <span className="m-lbl">Pending Actions</span>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${((metrics?.pendingLeaves || 0) + (metrics?.pendingResignations || 0)) > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
              <Clock size={14} />
            </span>
          </div>
          <div className={`m-val ${((metrics?.pendingLeaves || 0) + (metrics?.pendingResignations || 0)) > 0 ? 'm-warning' : ''}`}>
            {(metrics?.pendingLeaves || 0) + (metrics?.pendingResignations || 0)}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>
              items
            </span>
          </div>
          <div className="m-meta truncate">
            {metrics?.pendingLeaves ?? 0} leaves pending • <span className="text-amber-600 font-medium">{metrics?.pendingResignations ?? 0} exits</span>
          </div>
        </div>

        {/* POSH & Compliance Radar */}
        <div
          className="metric-cell cursor-pointer"
          onClick={() => {
            setTab('compliance')
            setComplianceFilter('EXPIRING_SOON')
          }}
          title="Click to view compliance alerts"
        >
          <div className="m-top">
            <span className="m-lbl">POSH & Compliance</span>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${(metrics?.poshDue || 0) > 0 ? 'bg-rose-500/15 text-rose-600 animate-pulse' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <ShieldCheck size={14} />
            </span>
          </div>
          <div className={`m-val ${(metrics?.poshDue || 0) > 0 ? 'm-danger' : 'm-success'}`}>
            {metrics?.poshDue ?? 0}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>
              due/expiring
            </span>
          </div>
          <div className="m-meta truncate">
            Payroll gate: {metrics?.latestPayrollStatus || 'DRAFT'} • <span className={(metrics?.poshDue || 0) > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>
              {(metrics?.poshDue || 0) > 0 ? 'Action required' : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Workspace Navigation Tabs ── */}
      <div className="overflow-x-auto pb-1" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <Segmented
          value={tab}
          onChange={(val) => setTab(val as any)}
          options={[
            { key: 'overview', label: 'Command Overview' },
            { key: 'staff', label: `Staff Directory (${metrics?.activeStaff ?? '…'})` },
            { key: 'attendance', label: 'Staff Attendance' },
            { key: 'leaves', label: `Leaves & Coverage (${metrics?.pendingLeaves ? `${metrics.pendingLeaves} Pending` : 'All Clear'})` },
            { key: 'payroll', label: 'Payroll & Statutory' },
            { key: 'recruitment', label: `Recruitment (${metrics?.openPositions ? `${metrics.openPositions} Jobs` : 'Pipeline'})` },
            { key: 'compliance', label: `Compliance Radar (${metrics?.poshDue ?? 0})` },
            { key: 'offboarding', label: `Offboarding (${metrics?.pendingResignations ?? 0})` },
          ]}
        />
      </div>

      {/* ── 4. WORKSPACE 1: OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Campus Distribution & Meter (7 cols) */}
            <div
              className="lg:col-span-7 card p-5 space-y-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
              }}
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Building size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Campus Staffing Distribution</h3>
                    <p className="text-xs text-muted-foreground">Active workforce distributed across preschool branches</p>
                  </div>
                </div>
                <span className="badge b-neutral text-xs">{metrics?.staffByBranch?.length || 1} Branches</span>
              </div>

              <div className="space-y-3">
                {metrics?.staffByBranch?.map((b: any, idx: number) => {
                  const pct = (metrics?.activeStaff && metrics.activeStaff > 0)
                    ? Math.round((b.count / metrics.activeStaff) * 100)
                    : 0
                  return (
                    <div
                      key={idx}
                      className="p-3.5 space-y-2"
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 12,
                      }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{b.branchName}</span>
                        <span className="font-mono text-muted-foreground">{b.count} staff ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, background: 'var(--primary)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Action Desk (5 cols) */}
            <div
              className="lg:col-span-5 card p-5 space-y-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
              }}
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <ListChecks size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Pending Workforce Actions</h3>
                    <p className="text-xs text-muted-foreground">Urgent items awaiting management authorization</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div
                  onClick={() => { setTab('leaves'); setLeaveFilter('PENDING') }}
                  className="p-3.5 cursor-pointer transition-all flex items-center justify-between hover:border-primary"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Pending Leave Approvals</div>
                      <div className="text-[11px] text-muted-foreground">Teacher coverage routing required</div>
                    </div>
                  </div>
                  <span className="badge b-warning font-bold">{metrics?.pendingLeaves ?? 0}</span>
                </div>

                <div
                  onClick={() => { setTab('compliance'); setComplianceFilter('EXPIRING_SOON') }}
                  className="p-3.5 cursor-pointer transition-all flex items-center justify-between hover:border-primary"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">POSH Certifications Expiring</div>
                      <div className="text-[11px] text-muted-foreground">Will trigger payroll salary holds</div>
                    </div>
                  </div>
                  <span className="badge b-danger font-bold">{metrics?.poshDue ?? 0}</span>
                </div>

                <div
                  onClick={() => setTab('offboarding')}
                  className="p-3.5 cursor-pointer transition-all flex items-center justify-between hover:border-primary"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <UserMinus size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Open Resignations & Clearance</div>
                      <div className="text-[11px] text-muted-foreground">5-point departmental handover tasks</div>
                    </div>
                  </div>
                  <span className="badge b-info font-bold">{metrics?.pendingResignations ?? 0}</span>
                </div>

                <div
                  onClick={() => setTab('recruitment')}
                  className="p-3.5 cursor-pointer transition-all flex items-center justify-between hover:border-primary"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Active Job Openings</div>
                      <div className="text-[11px] text-muted-foreground">Candidates in interview pipeline</div>
                    </div>
                  </div>
                  <span className="badge b-primary font-bold">{metrics?.openPositions ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. WORKSPACE 2: STAFF DIRECTORY ── */}
      {tab === 'staff' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className="card flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap flex-1">
              <div className="relative min-w-[240px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  className="input text-xs"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Search staff by name, code, phone..."
                  value={staffQuery}
                  onChange={(e) => setStaffQuery(e.target.value)}
                />
              </div>

              <select
                className="select text-xs max-w-xs"
                value={staffBranch}
                onChange={(e) => setStaffBranch(e.target.value)}
              >
                <option value="ALL">All Campus Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                className="select text-xs max-w-xs"
                value={staffDept}
                onChange={(e) => setStaffDept(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                <option value="Academics">Academics</option>
                <option value="Operations">Operations</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            {/* Employment Status Pills */}
            <div className="overflow-x-auto pb-1 md:pb-0">
              <Segmented
                value={staffStatus}
                onChange={(st) => setStaffStatus(st as any)}
                options={[
                  { key: 'ALL', label: 'All Staff' },
                  { key: 'ACTIVE', label: 'Active' },
                  { key: 'PROBATION', label: 'Probation' },
                  { key: 'ON_NOTICE', label: 'On Notice' },
                  { key: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          {/* Staff Roster Container */}
          <div
            className="card overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 0,
              boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            }}
          >
            {staffList === null ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} h={50} />)}
              </div>
            ) : staffList.length === 0 ? (
              <EmptyState
                icon={<Users size={36} />}
                title="No staff members found"
                message="No employees match the active filters or search terms."
              />
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="op-desktop-only overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      <tr>
                        <th className="p-3.5">Employee</th>
                        <th className="p-3.5">Code</th>
                        <th className="p-3.5">Designation & Role</th>
                        <th className="p-3.5">Campus Branch</th>
                        <th className="p-3.5">Classrooms</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {staffList.map((st: any) => (
                        <tr key={st.id} className="hover:bg-muted/15 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="p-3.5 flex items-center gap-3">
                            <Avatar name={st.name} size="md" />
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{st.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{st.email}</div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-foreground font-semibold">
                            {st.employeeCode}
                          </td>
                          <td className="p-3.5">
                            <div className="text-xs font-semibold text-foreground">{st.designation || 'Staff'}</div>
                            <div className="text-[11px] text-muted-foreground">{st.role || st.roles?.[0] || 'Member'} • {st.department || 'General'}</div>
                          </td>
                          <td className="p-3.5 text-xs text-foreground font-medium">
                            {st.branchName || 'Main Campus'}
                          </td>
                          <td className="p-3.5">
                            {st.assignedClassrooms?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {st.assignedClassrooms.map((c: string, idx: number) => (
                                  <span key={idx} className="badge b-primary text-[10px]">{c}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={st.status} />
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm text-xs"
                                onClick={() => openStaff360(st.id)}
                              >
                                <Eye size={13} />
                                <span>360</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-xs h-8 w-8 p-0"
                                title="Edit Workforce Profile"
                                onClick={() => openEditStaff(st)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-xs h-8 w-8 p-0 text-primary"
                                title="Branch Transfer"
                                onClick={() => {
                                  setTransferTarget(st)
                                  setTargetBranchId(st.branchId || '')
                                  setIsTransferOpen(true)
                                }}
                              >
                                <Building size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="op-mobile-only divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {staffList.map((st: any) => (
                    <div key={st.id} className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={st.name} size="md" />
                          <div>
                            <div className="font-semibold text-sm text-foreground">{st.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {st.employeeCode} • {st.branchName || 'Main Campus'}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={st.status} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <div>
                          <span className="font-medium text-foreground">{st.designation || 'Staff'}</span>
                          <span className="mx-1.5">•</span>
                          <span>{st.department || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs h-7 px-2"
                            onClick={() => openStaff360(st.id)}
                          >
                            <Eye size={12} />
                            <span>360</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-xs h-7 w-7 p-0"
                            onClick={() => openEditStaff(st)}
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 6. WORKSPACE 3: ATTENDANCE ── */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div
            className="card flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <input
                  type="date"
                  className="input text-xs font-semibold"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>

              <select
                className="select text-xs max-w-xs"
                value={attendanceBranch}
                onChange={(e) => setAttendanceBranch(e.target.value)}
              >
                <option value="ALL">All Campus Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
              <span>Standard Shift: <b>8 Hours</b></span>
              <span>•</span>
              <span>Punch Mode: <b>Manual & Biometric Bridge</b></span>
            </div>
          </div>

          {/* Attendance Register Container */}
          <div
            className="card overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 0,
              boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            }}
          >
            {attendanceRecords === null ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} h={50} />)}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <EmptyState
                icon={<Clock size={36} />}
                title="No staff attendance records"
                message={`No staff members found for ${attendanceDate}.`}
              />
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="op-desktop-only overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      <tr>
                        <th className="p-3.5">Staff Member</th>
                        <th className="p-3.5">Code</th>
                        <th className="p-3.5">Check-In</th>
                        <th className="p-3.5">Check-Out</th>
                        <th className="p-3.5">Worked Hours</th>
                        <th className="p-3.5">Today Status</th>
                        <th className="p-3.5 text-right">Correction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {attendanceRecords.map((r: any) => {
                        const variance = r.workedHours > 0 ? (r.workedHours - 8).toFixed(1) : null
                        return (
                          <tr key={r.staffProfileId} className="hover:bg-muted/15 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="p-3.5 flex items-center gap-3">
                              <Avatar name={r.name} size="sm" />
                              <div>
                                <div className="font-semibold text-foreground">{r.name}</div>
                                <div className="text-xs text-muted-foreground">{r.designation}</div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-xs text-foreground font-semibold">{r.employeeCode}</td>
                            <td className="p-3.5 text-xs font-mono text-foreground">{timeOf(r.checkIn)}</td>
                            <td className="p-3.5 text-xs font-mono text-foreground">{timeOf(r.checkOut)}</td>
                            <td className="p-3.5 text-xs font-mono">
                              <span className="font-semibold text-foreground">{r.workedHours}h</span>
                              {variance && (
                                <span className={`text-[11px] ml-1.5 ${Number(variance) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  ({Number(variance) >= 0 ? `+${variance}h` : `${variance}h`})
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm text-xs flex items-center gap-1 ml-auto"
                                onClick={() => {
                                  setActiveCorrectionTarget(r)
                                  setCorrectionForm({
                                    status: r.status === 'UNMARKED' ? 'PRESENT' : r.status,
                                    checkIn: r.checkIn ? new Date(r.checkIn).toISOString().slice(11, 16) : '08:30',
                                    checkOut: r.checkOut ? new Date(r.checkOut).toISOString().slice(11, 16) : '16:30',
                                    reason: '',
                                  })
                                  setAttCorrectionModalOpen(true)
                                }}
                              >
                                <Pencil size={12} />
                                <span>Correct</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="op-mobile-only divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {attendanceRecords.map((r: any) => {
                    const variance = r.workedHours > 0 ? (r.workedHours - 8).toFixed(1) : null
                    return (
                      <div key={r.staffProfileId} className="p-4 space-y-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.name} size="md" />
                            <div>
                              <div className="font-semibold text-sm text-foreground">{r.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{r.employeeCode} • {r.designation}</div>
                            </div>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="text-muted-foreground font-mono text-[11px]">
                            <span>In: {timeOf(r.checkIn)}</span> • <span>Out: {timeOf(r.checkOut)}</span> • <b className="text-foreground">{r.workedHours}h</b>
                            {variance && (
                              <span className={`ml-1 ${Number(variance) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                ({Number(variance) >= 0 ? `+${variance}h` : `${variance}h`})
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs h-7 px-2 flex items-center gap-1"
                            onClick={() => {
                              setActiveCorrectionTarget(r)
                              setCorrectionForm({
                                status: r.status === 'UNMARKED' ? 'PRESENT' : r.status,
                                checkIn: r.checkIn ? new Date(r.checkIn).toISOString().slice(11, 16) : '08:30',
                                checkOut: r.checkOut ? new Date(r.checkOut).toISOString().slice(11, 16) : '16:30',
                                reason: '',
                              })
                              setAttCorrectionModalOpen(true)
                            }}
                          >
                            <Pencil size={11} />
                            <span>Correct</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 7. WORKSPACE 4: LEAVES & SUBSTITUTE COVERAGE ── */}
      {tab === 'leaves' && (
        <div className="space-y-6">
          {/* Fiscal Quota Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { label: 'Casual Leave (CL)', quota: '12 Days / Year', desc: 'Standard preschool quota' },
              { label: 'Sick Leave (SL)', quota: '10 Days / Year', desc: 'Medical coverage' },
              { label: 'Earned Leave (EL)', quota: '15 Days / Year', desc: 'Carry forward permitted' },
              { label: 'Maternity Leave (ML)', quota: '180 Days', desc: 'Statutory maternity policy' },
            ].map((q, i) => (
              <div
                key={i}
                className="card p-4 space-y-1"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 16,
                  boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
                }}
              >
                <div className="text-xs font-semibold text-muted-foreground">{q.label}</div>
                <div className="text-xl font-bold text-foreground">{q.quota}</div>
                <div className="text-[11px] text-muted-foreground">{q.desc}</div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between overflow-x-auto pb-1">
            <Segmented
              value={leaveFilter}
              onChange={(st) => setLeaveFilter(st as any)}
              options={[
                { key: 'ALL', label: 'All Requests' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>

          {/* Leave Requests Container */}
          <div
            className="card overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 0,
              boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            }}
          >
            {leaves === null ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} h={50} />)}
              </div>
            ) : leaves.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck size={36} />}
                title="No leave requests"
                message="No staff leave applications found."
              />
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="op-desktop-only overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      <tr>
                        <th className="p-3.5">Staff Member</th>
                        <th className="p-3.5">Leave Type</th>
                        <th className="p-3.5">Duration</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Classroom Coverage</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Approval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {leaves.map((l: any) => (
                        <tr key={l.id} className="hover:bg-muted/15 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="p-3.5 flex items-center gap-3">
                            <Avatar name={l.staffProfile?.user?.fullName} size="sm" />
                            <div>
                              <div className="font-semibold text-foreground">{l.staffProfile?.user?.fullName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{l.staffProfile?.employeeCode}</div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="badge b-primary text-xs">{l.leaveType?.name || 'Leave'}</span>
                          </td>
                          <td className="p-3.5 text-xs">
                            <div className="font-semibold text-foreground">{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</div>
                            <div className="text-muted-foreground">{l.totalDays} days total</div>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground max-w-xs">
                            {l.reason}
                          </td>
                          <td className="p-3.5">
                            {l.coverages?.length > 0 ? (
                              <div className="space-y-1">
                                {l.coverages.map((c: any) => (
                                  <span key={c.id} className="badge b-warning text-[10px] flex items-center gap-1 w-fit">
                                    <span>Cover: {c.classroom?.name}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not required</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={l.status} />
                          </td>
                          <td className="p-3.5 text-right">
                            {l.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm text-xs h-8 px-2.5"
                                  onClick={() => actionLeave(l.id, 'APPROVE')}
                                  disabled={leaveActionLoading}
                                >
                                  <Check size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm text-xs h-8 px-2 text-rose-600"
                                  onClick={() => {
                                    setActiveRejectTarget(l)
                                    setRejectionReason('')
                                    setRejectModalOpen(true)
                                  }}
                                  disabled={leaveActionLoading}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="op-mobile-only divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {leaves.map((l: any) => (
                    <div key={l.id} className="p-4 space-y-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.staffProfile?.user?.fullName} size="md" />
                          <div>
                            <div className="font-semibold text-sm text-foreground">{l.staffProfile?.user?.fullName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{l.staffProfile?.employeeCode} • {l.leaveType?.name || 'Leave'}</div>
                          </div>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">{fmtDate(l.startDate)} → {fmtDate(l.endDate)} ({l.totalDays} days)</div>
                        <div className="mt-0.5">{l.reason}</div>
                        {l.coverages?.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="badge b-warning text-[10px]">Cover: {l.coverages[0].classroom?.name}</span>
                          </div>
                        )}
                      </div>
                      {l.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs h-7 px-2.5 text-rose-600"
                            onClick={() => {
                              setActiveRejectTarget(l)
                              setRejectionReason('')
                              setRejectModalOpen(true)
                            }}
                            disabled={leaveActionLoading}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="btn btn-success btn-sm text-xs h-7 px-3"
                            onClick={() => actionLeave(l.id, 'APPROVE')}
                            disabled={leaveActionLoading}
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 8. WORKSPACE 5: PAYROLL & STATUTORY ── */}
      {tab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Monthly Statutory Payroll Engine</h3>
              <p className="text-xs text-muted-foreground">25th cutoff, PF (12%), ESI (0.75%), PT slabs & POSH compliance gate</p>
            </div>
            <button
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => setIsProcessPayrollOpen(true)}
            >
              <CreditCard size={14} />
              <span>Process Monthly Period</span>
            </button>
          </div>

          {/* Payroll Cycles Grid */}
          {payrollCycles === null ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} h={160} />)}
            </div>
          ) : payrollCycles.length === 0 ? (
            <EmptyState
              icon={<DollarSign size={36} />}
              title="No payroll cycles recorded"
              message="Click 'Process Monthly Period' to calculate salary with statutory deductions."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payrollCycles.map((c: any) => {
                const heldCount = c.payslips?.filter((p: any) => p.isHeld).length || 0
                return (
                    <div
                      key={c.id}
                      className="card space-y-4"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-base text-foreground">
                            {new Date(c.year, c.month - 1).toLocaleString('default', { month: 'long' })} {c.year}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Branch: {c.branch?.name || 'All Campuses'}</div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 text-xs"
                        style={{
                          borderTop: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-subtle)',
                          padding: '12px 0',
                        }}
                      >
                        <div>Staff: <b className="text-foreground">{c.totalStaff}</b></div>
                        <div>Net: <b className="text-emerald-600">{money(c.totalNetPayable)}</b></div>
                        <div>Gross: <b className="text-foreground">{money(c.totalGross)}</b></div>
                        <div>Deductions: <b className="text-rose-500">{money(c.totalDeductions)}</b></div>
                      </div>

                      {heldCount > 0 && (
                        <div
                          className="flex items-center justify-between text-xs text-rose-600"
                          style={{
                            background: 'var(--danger-soft)',
                            border: '1px solid var(--border-danger)',
                            borderRadius: 12,
                            padding: '8px 12px',
                          }}
                        >
                          <span className="font-semibold">{heldCount} POSH Gate Holds</span>
                          <button
                            type="button"
                            className="underline font-bold text-[11px]"
                            onClick={() => { setTab('compliance'); setComplianceFilter('EXPIRED') }}
                          >
                            Resolve in Compliance →
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-xs flex items-center gap-1"
                          onClick={() => handleExportBankFile(c.id)}
                        >
                          <Download size={13} />
                          <span>NEFT CSV</span>
                        </button>

                        {c.status === 'REVIEWED' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm text-xs"
                            onClick={() => {
                              setActiveDisburseCycle(c)
                              setDisburseReference(`NEFT-${Date.now().toString().slice(-6)}`)
                              setDisburseModalOpen(true)
                            }}
                          >
                            Disburse & Lock
                          </button>
                        )}
                      </div>
                    </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 9. WORKSPACE 6: RECRUITMENT ── */}
      {tab === 'recruitment' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Segmented
              value={recruitmentTab}
              onChange={(t) => setRecruitmentTab(t as any)}
              options={[
                { key: 'PIPELINE', label: 'Candidate Pipeline' },
                { key: 'OPENINGS', label: `Job Openings (${jobOpenings?.length || 0})` },
              ]}
            />

            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shadow-sm shadow-primary/20"
              onClick={() => setIsNewOpeningOpen(true)}
            >
              <Plus size={14} />
              <span>Post Opening</span>
            </button>
          </div>

          {/* Pipeline Kanban View */}
          {recruitmentTab === 'PIPELINE' && (
            <div className="space-y-4">
              {jobOpenings?.map((job) => (
                <div
                  key={job.id}
                  className="card space-y-3"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
                  }}
                >
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <div>
                      <span className="font-bold text-sm text-foreground">{job.title}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-medium">({job.department} • {job.branch?.name || 'All'})</span>
                    </div>
                    <span className="badge b-primary text-xs">{job.applications?.length || 0} Applicants</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {job.applications?.map((app: any) => (
                      <div
                        key={app.id}
                        className="p-3.5 space-y-3"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 12,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-sm text-foreground">{app.candidateName}</div>
                            <div className="text-xs text-muted-foreground">{app.email} • {app.phone}</div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Exp: <b className="text-foreground">{app.experienceYears} yrs</b> • Qual: <b className="text-foreground">{app.highestQualification}</b>
                        </div>

                        {app.interviews?.length > 0 && (
                          <div
                            className="text-[11px] p-2"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 8,
                            }}
                          >
                            <b>Latest Round:</b> {app.interviews[0].roundName} ({app.interviews[0].status})
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between gap-1" style={{ borderTop: '1px solid var(--border-default)' }}>
                          <select
                            className="select text-xs h-8 max-w-[130px]"
                            value={app.status}
                            onChange={(e) => handleMoveCandidateStage(app.id, e.target.value)}
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFERED">Offered</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>

                          {app.status === 'HIRED' ? (
                            <button
                              type="button"
                              className="btn btn-success btn-sm text-xs h-8 px-2.5"
                              onClick={() => {
                                setActiveConvertCandidate(app)
                                setConvertForm({
                                  employeeCode: `EMP-2026-${Date.now().toString().slice(-4)}`,
                                  joiningDate: new Date().toISOString().split('T')[0],
                                  basicSalary: 24000,
                                })
                                setConvertModalOpen(true)
                              }}
                            >
                              Convert to Staff
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm text-xs h-8 px-2.5"
                              onClick={() => {
                                setActiveInterviewApp(app)
                                setInterviewForm({
                                  roundName: 'Pedagogical Demo',
                                  scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                                  interviewerName: '',
                                })
                                setInterviewModalOpen(true)
                              }}
                            >
                              Schedule Round
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Openings Table View */}
          {recruitmentTab === 'OPENINGS' && (
            <div
              className="card overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                padding: 0,
                boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    <tr>
                      <th className="p-3.5">Position Title</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Designation</th>
                      <th className="p-3.5">Campus</th>
                      <th className="p-3.5">Openings</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {jobOpenings?.map((j) => (
                      <tr key={j.id} className="hover:bg-muted/15 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-3.5 font-bold text-foreground">{j.title}</td>
                        <td className="p-3.5 text-xs text-foreground">{j.department}</td>
                        <td className="p-3.5 text-xs text-foreground">{j.designation}</td>
                        <td className="p-3.5 text-xs text-foreground">{j.branch?.name || 'All'}</td>
                        <td className="p-3.5 font-mono text-xs text-foreground">{j.openingsCount}</td>
                        <td className="p-3.5"><StatusBadge status={j.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 10. WORKSPACE 7: COMPLIANCE RADAR ── */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="card rounded-2xl p-4 bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 overflow-x-auto">
              {(['ALL', 'EXPIRED', 'EXPIRING_SOON', 'COMPLIANT', 'NOT_CERTIFIED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setComplianceFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    complianceFilter === st
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL' ? 'All Staff' : st === 'EXPIRING_SOON' ? 'Expiring (≤30d)' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => {
                setCertForm({
                  staffProfileId: staffList?.[0]?.id || '',
                  trainingType: 'POSH',
                  title: 'Annual POSH Certification',
                  score: 95,
                  completionDate: new Date().toISOString().split('T')[0],
                  expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
                  remarks: 'Child safety compliance certification',
                })
                setRecordCertModalOpen(true)
              }}
            >
              <Award size={14} />
              <span>Record Certificate</span>
            </button>
          </div>

          {/* Compliance Radar Table */}
          <div className="card p-0 rounded-2xl overflow-hidden border border-border bg-card">
            {complianceRecords === null ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} h={50} />)}
              </div>
            ) : complianceRecords.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck size={36} />}
                title="No compliance records found"
                message="No records match the active filter."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                    <tr>
                      <th className="p-3.5">Staff Member</th>
                      <th className="p-3.5">Campus</th>
                      <th className="p-3.5">POSH Training Status</th>
                      <th className="p-3.5">Expiry Date</th>
                      <th className="p-3.5">Police Verification</th>
                      <th className="p-3.5">Medical Fitness</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {complianceRecords.map((c: any) => (
                      <tr key={c.staffProfileId} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3.5 flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div>
                            <div className="font-semibold text-foreground">{c.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.employeeCode} • {c.designation}</div>
                          </div>
                        </td>
                        <td className="p-3.5 text-xs">{c.branchName || 'Main Campus'}</td>
                        <td className="p-3.5">
                          <span className={`badge ${
                            c.poshStatus === 'COMPLIANT' ? 'b-success' :
                            c.poshStatus === 'EXPIRING_SOON' ? 'b-warning' :
                            'b-danger'
                          }`}>
                            {c.poshStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-mono">
                          {c.poshExpiry || '—'}
                          {c.daysRemaining !== null && (
                            <span className="text-[11px] text-muted-foreground block">
                              {c.daysRemaining < 0 ? 'Overdue' : `${c.daysRemaining} days remaining`}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`badge ${c.policeVerificationStatus === 'VERIFIED' ? 'b-success' : 'b-neutral'} text-[11px]`}>
                            {c.policeVerificationStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`badge ${c.medicalFitnessStatus === 'VERIFIED' ? 'b-success' : 'b-neutral'} text-[11px]`}>
                            {c.medicalFitnessStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            className="btn btn-outline btn-sm text-xs"
                            onClick={() => {
                              setCertForm({
                                staffProfileId: c.staffProfileId,
                                trainingType: 'POSH',
                                title: 'POSH Certification Renewal',
                                score: 100,
                                completionDate: new Date().toISOString().split('T')[0],
                                expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
                                remarks: 'Certified via Compliance Workspace',
                              })
                              setRecordCertModalOpen(true)
                            }}
                          >
                            Upload Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 11. WORKSPACE 8: OFFBOARDING & CLEARANCE ── */}
      {tab === 'offboarding' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Staff Offboarding & Departmental Clearance</h3>
              <p className="text-xs text-muted-foreground">5-point clearance sign-off with safe inactivation preserving audit logs</p>
            </div>

            <button
              className="btn btn-outline btn-sm flex items-center gap-1.5"
              onClick={() => setIsSubmitResignationOpen(true)}
            >
              <UserMinus size={14} />
              <span>Submit Resignation</span>
            </button>
          </div>

          {resignations === null ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} h={120} />)}
            </div>
          ) : resignations.length === 0 ? (
            <EmptyState
              icon={<UserMinus size={36} />}
              title="No active offboarding cases"
              message="All active staff members are in good standing."
            />
          ) : (
            <div className="space-y-4">
              {resignations.map((r) => (
                <div key={r.id} className="card rounded-2xl p-5 border border-border bg-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.staffProfile?.user?.fullName} size="lg" />
                      <div>
                        <div className="font-bold text-base text-foreground">{r.staffProfile?.user?.fullName}</div>
                        <div className="text-xs text-muted-foreground">{r.staffProfile?.employeeCode} • {r.staffProfile?.branch?.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Reason: <i className="text-foreground">{r.reason}</i></div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  {/* 5-Point Clearance Tasks Checklist */}
                  <div className="border-t border-border/50 pt-3 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departmental Clearance Checklist:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {r.staffProfile?.offboardingTasks?.map((task: any) => (
                        <div key={task.id} className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${task.isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/20 border-border/60'}`}>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              {task.isCompleted ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Clock size={13} className="text-amber-500" />}
                              <span>{task.taskType}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{task.description}</div>
                            {task.remarks && <div className="text-[11px] italic text-foreground mt-1">"{task.remarks}"</div>}
                          </div>

                          <div>
                            {task.isCompleted ? (
                              <button
                                className="btn btn-ghost btn-sm text-[10px] text-muted-foreground hover:text-rose-500 h-6 px-1.5"
                                onClick={() => handleReopenClearance(task.id)}
                              >
                                Reopen
                              </button>
                            ) : (
                              <button
                                className="btn btn-success btn-sm text-[11px] h-7 px-2"
                                onClick={() => handleCompleteClearance(task.id)}
                              >
                                Sign-off
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 12. STAFF 360 FULL DRAWER WORKSPACE ── */}
      <Drawer
        open={is360Open}
        onClose={() => setIs360Open(false)}
        title={staff360 ? `${staff360.user?.fullName}` : 'Staff 360 Workspace'}
        subtitle={staff360 ? `${staff360.employeeCode} · ${staff360.designation} · ${staff360.branch?.name || 'Main Campus'}` : undefined}
        icon={<Users size={20} />}
        iconClass="ic-purple"
      >
        {!staff360 ? (
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} h={40} />)}
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {/* Top Identity Header Card */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={staff360.user?.fullName} size="lg" />
                <div>
                  <div className="font-bold text-base text-foreground">{staff360.user?.fullName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{staff360.employeeCode} • {staff360.user?.email}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{staff360.user?.phone || 'No phone recorded'}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={staff360.status} />
                <button
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => openEditStaff(staff360)}
                >
                  <Pencil size={13} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Segmented
              value={staff360Tab}
              onChange={(t) => setStaff360Tab(t as any)}
              options={[
                { key: 'OVERVIEW', label: 'Overview' },
                { key: 'EMPLOYMENT', label: 'Employment' },
                { key: 'PERSONAL', label: 'Personal & KYC' },
                { key: 'SALARY', label: 'Compensation' },
                { key: 'ATTENDANCE', label: 'Attendance' },
                { key: 'LEAVES', label: 'Leaves' },
                { key: 'COMPLIANCE', label: 'Compliance' },
              ]}
            />

            {/* TAB: OVERVIEW */}
            {staff360Tab === 'OVERVIEW' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Campus Branch:</span>
                    <b className="text-foreground text-sm">{staff360.branch?.name || 'Main Campus'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Department:</span>
                    <b className="text-foreground text-sm">{staff360.department || 'Academics'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Joining Date:</span>
                    <b className="text-foreground text-sm">{fmtDate(staff360.joiningDate)}</b>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <div className="font-semibold text-foreground">Assigned Classrooms:</div>
                  {staff360.classrooms?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {staff360.classrooms.map((c: any) => (
                        <span key={c.id} className="badge b-primary text-xs">{c.name} ({c.programType})</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No active classrooms assigned.</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <div className="font-semibold text-foreground">Emergency Contact:</div>
                  <div className="text-foreground">
                    Name: <b>{staff360.emergencyContactName || 'Not recorded'}</b> • Phone: <b>{staff360.emergencyContactPhone || '—'}</b>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EMPLOYMENT */}
            {staff360Tab === 'EMPLOYMENT' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Employment Type:</span>
                    <b className="text-foreground">{staff360.employmentType || 'REGULAR'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Qualification:</span>
                    <b className="text-foreground">{staff360.qualification || 'ECCE'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Probation End:</span>
                    <b className="text-foreground">{fmtDate(staff360.probationEndDate)}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Notice Period:</span>
                    <b className="text-foreground">{staff360.noticePeriodDays || 60} Days</b>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PERSONAL */}
            {staff360Tab === 'PERSONAL' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Gender:</span>
                    <b className="text-foreground">{staff360.gender || 'Not specified'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Blood Group:</span>
                    <b className="text-foreground">{staff360.bloodGroup || '—'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">PAN:</span>
                    <b className="text-foreground font-mono">{staff360.panNumber || '—'}</b>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block mb-1">Aadhaar:</span>
                    <b className="text-foreground font-mono">{staff360.aadhaarNumber ? `****${staff360.aadhaarNumber.slice(-4)}` : '—'}</b>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block mb-1">Residential Address:</span>
                  <p className="text-foreground">{staff360.currentAddress || 'No address on file'}</p>
                </div>
              </div>
            )}

            {/* TAB: SALARY */}
            {staff360Tab === 'SALARY' && (
              <div className="space-y-4 text-xs">
                {staff360.salaryStructure ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground block mb-1">Basic Salary:</span>
                      <b className="text-foreground text-sm font-mono">{money(staff360.salaryStructure.basicSalary)}</b>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground block mb-1">HRA:</span>
                      <b className="text-foreground text-sm font-mono">{money(staff360.salaryStructure.hra)}</b>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground block mb-1">Special Allowance:</span>
                      <b className="text-foreground text-sm font-mono">{money(staff360.salaryStructure.specialAllowance)}</b>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground block mb-1">PF Statutory (12%):</span>
                      <b className="text-foreground">{staff360.salaryStructure.pfEligible ? 'Enabled' : 'Exempt'}</b>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No salary structure defined.</p>
                )}

                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <div className="font-semibold text-foreground">Disbursement Bank Account:</div>
                  {staff360.bankDetails ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>Bank: <b>{staff360.bankDetails.bankName}</b></div>
                      <div>IFSC: <b className="font-mono">{staff360.bankDetails.ifscCode}</b></div>
                      <div>Account: <b className="font-mono">{staff360.bankDetails.accountNumberMasked}</b></div>
                      <div>Holder: <b>{staff360.bankDetails.accountHolderName}</b></div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No bank details registered for direct deposit.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ATTENDANCE */}
            {staff360Tab === 'ATTENDANCE' && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold text-foreground">Recent 30-Day Punch History:</div>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/40 border-b border-border text-[11px] text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Check In</th>
                        <th className="p-2.5">Check Out</th>
                        <th className="p-2.5">Worked</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {staff360.recentAttendance?.slice(0, 15).map((a: any) => (
                        <tr key={a.id}>
                          <td className="p-2.5 font-mono">{fmtDate(a.date)}</td>
                          <td className="p-2.5 font-mono">{timeOf(a.checkIn)}</td>
                          <td className="p-2.5 font-mono">{timeOf(a.checkOut)}</td>
                          <td className="p-2.5 font-mono">{a.workedHours}h</td>
                          <td className="p-2.5"><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: LEAVES */}
            {staff360Tab === 'LEAVES' && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold text-foreground">Active Fiscal Year Leave Balances:</div>
                <div className="grid grid-cols-2 gap-2">
                  {staff360.leaveBalances?.map((b: any) => (
                    <div key={b.id} className="p-2.5 rounded-xl border border-border bg-card">
                      <div className="text-muted-foreground">{b.leaveType?.name}</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{b.balance} Days Left</div>
                      <div className="text-[11px] text-muted-foreground">{b.consumed} consumed of {b.totalCredited}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: COMPLIANCE */}
            {staff360Tab === 'COMPLIANCE' && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold text-foreground">Training & Compliance Certifications:</div>
                {staff360.trainings?.length > 0 ? (
                  <div className="space-y-2">
                    {staff360.trainings.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                        <div>
                          <div className="font-bold text-foreground">{t.title || t.trainingType}</div>
                          <div className="text-muted-foreground mt-0.5">Completed: {fmtDate(t.completionDate)} • Score: {t.score}%</div>
                        </div>
                        <span className={`badge ${new Date(t.expiryDate) > new Date() ? 'b-success' : 'b-danger'}`}>
                          {new Date(t.expiryDate) > new Date() ? 'VALID' : 'EXPIRED'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No training certificates logged.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── 13. MODAL: EDIT WORKFORCE PROFILE ── */}
      {editStaffData && (
        <Modal
          open={isEditStaffOpen}
          onClose={() => setIsEditStaffOpen(false)}
          title={`Edit Workforce Profile — ${editStaffData.fullName}`}
          subtitle="Complete mutable field updater with audit tracking"
          icon={<Pencil size={18} />}
          iconClass="ic-primary"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input
                  className="input"
                  value={editStaffData.fullName}
                  onChange={(e) => setEditStaffData({ ...editStaffData, fullName: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input"
                  value={editStaffData.phone}
                  onChange={(e) => setEditStaffData({ ...editStaffData, phone: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Workforce Designation">
                <input
                  className="input"
                  value={editStaffData.designation}
                  onChange={(e) => setEditStaffData({ ...editStaffData, designation: e.target.value })}
                />
              </Field>
              <Field label="Department">
                <select
                  className="select"
                  value={editStaffData.department}
                  onChange={(e) => setEditStaffData({ ...editStaffData, department: e.target.value })}
                >
                  <option value="Academics">Academics</option>
                  <option value="Operations">Operations</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Campus Branch">
                <select
                  className="select"
                  value={editStaffData.branchId}
                  onChange={(e) => setEditStaffData({ ...editStaffData, branchId: e.target.value })}
                >
                  <option value="">Unassigned Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Employment Type">
                <select
                  className="select"
                  value={editStaffData.employmentType}
                  onChange={(e) => setEditStaffData({ ...editStaffData, employmentType: e.target.value })}
                >
                  <option value="REGULAR">Regular</option>
                  <option value="PROBATION">Probation</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </Field>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="font-semibold text-foreground">Compensation Structure (₹):</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Basic Salary">
                  <input
                    className="input"
                    type="number"
                    value={editStaffData.basicSalary}
                    onChange={(e) => setEditStaffData({ ...editStaffData, basicSalary: e.target.value })}
                  />
                </Field>
                <Field label="HRA">
                  <input
                    className="input"
                    type="number"
                    value={editStaffData.hra}
                    onChange={(e) => setEditStaffData({ ...editStaffData, hra: e.target.value })}
                  />
                </Field>
                <Field label="Special Allowance">
                  <input
                    className="input"
                    type="number"
                    value={editStaffData.specialAllowance}
                    onChange={(e) => setEditStaffData({ ...editStaffData, specialAllowance: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="font-semibold text-foreground">Statutory IDs & KYC:</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PAN Number">
                  <input
                    className="input font-mono"
                    value={editStaffData.panNumber}
                    onChange={(e) => setEditStaffData({ ...editStaffData, panNumber: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Aadhaar Number">
                  <input
                    className="input font-mono"
                    value={editStaffData.aadhaarNumber}
                    onChange={(e) => setEditStaffData({ ...editStaffData, aadhaarNumber: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="font-semibold text-foreground">Direct Deposit Bank Details:</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Bank Name">
                  <input
                    className="input"
                    value={editStaffData.bankName}
                    onChange={(e) => setEditStaffData({ ...editStaffData, bankName: e.target.value })}
                  />
                </Field>
                <Field label="Account Number">
                  <input
                    className="input font-mono"
                    value={editStaffData.bankAccount}
                    onChange={(e) => setEditStaffData({ ...editStaffData, bankAccount: e.target.value })}
                  />
                </Field>
                <Field label="IFSC Code">
                  <input
                    className="input font-mono"
                    value={editStaffData.ifscCode}
                    onChange={(e) => setEditStaffData({ ...editStaffData, ifscCode: e.target.value.toUpperCase() })}
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button className="btn btn-outline" onClick={() => setIsEditStaffOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveStaffEdit} disabled={busy}>
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 14. MODAL: ATOMIC ONBOARD STAFF ── */}
      <Modal
        open={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Preschool Staff"
        subtitle="Atomic provisioning of User + TenantUser + StaffProfile + Salary"
        icon={<Plus size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" required>
              <input
                className="input"
                placeholder="e.g. Radhika Sharma"
                value={onboardForm.fullName}
                onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
              />
            </Field>
            <Field label="Email Address" required>
              <input
                className="input"
                type="email"
                placeholder="teacher@preone.test"
                value={onboardForm.email}
                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee Code" required helper="Unique ID across registers">
              <input
                className="input font-mono"
                placeholder="EMP-2026-01"
                value={onboardForm.employeeCode}
                onChange={(e) => setOnboardForm({ ...onboardForm, employeeCode: e.target.value })}
              />
            </Field>
            <Field label="System RBAC Role" required>
              <select
                className="select"
                value={onboardForm.role}
                onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Workforce Designation">
              <input
                className="input"
                placeholder="e.g. Montessori Lead Educator"
                value={onboardForm.designation}
                onChange={(e) => setOnboardForm({ ...onboardForm, designation: e.target.value })}
              />
            </Field>
            <Field label="Department">
              <select
                className="select"
                value={onboardForm.department}
                onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })}
              >
                <option value="Academics">Academics</option>
                <option value="Operations">Operations</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Campus Branch">
              <select
                className="select"
                value={onboardForm.branchId}
                onChange={(e) => setOnboardForm({ ...onboardForm, branchId: e.target.value })}
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Monthly Basic Salary (₹)" required>
              <input
                className="input"
                type="number"
                value={onboardForm.basicSalary}
                onChange={(e) => setOnboardForm({ ...onboardForm, basicSalary: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button className="btn btn-outline" onClick={() => setIsOnboardOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateStaff} disabled={busy}>
              {busy ? 'Onboarding…' : 'Complete Atomic Onboarding'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 15. MODAL: ATTENDANCE CORRECTION ── */}
      <Modal
        open={attCorrectionModalOpen}
        onClose={() => setAttCorrectionModalOpen(false)}
        title={`Correct Attendance — ${activeCorrectionTarget?.name}`}
        subtitle={`Date: ${attendanceDate} · Employee: ${activeCorrectionTarget?.employeeCode}`}
        icon={<Pencil size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <Field label="Corrected Status" required>
            <select
              className="select font-semibold"
              value={correctionForm.status}
              onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
            >
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrival</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Approved Leave</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-In Time">
              <input
                type="time"
                className="input font-mono"
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
              />
            </Field>
            <Field label="Check-Out Time">
              <input
                type="time"
                className="input font-mono"
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Mandatory Correction Reason" required helper="Recorded in immutable audit trail">
            <textarea
              className="textarea"
              placeholder="e.g. Biometric scanner offline at gate; teacher verified by coordinator Anita"
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              rows={3}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setAttCorrectionModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveCorrection} disabled={busy}>
              {busy ? 'Saving…' : 'Record Correction'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 16. MODAL: RECORD COMPLIANCE CERTIFICATE ── */}
      <Modal
        open={recordCertModalOpen}
        onClose={() => setRecordCertModalOpen(false)}
        title="Record Compliance Certification"
        subtitle="Uploads certificate & automatically releases any active payroll hold"
        icon={<Award size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <Field label="Staff Member" required>
            <select
              className="select"
              value={certForm.staffProfileId}
              onChange={(e) => setCertForm({ ...certForm, staffProfileId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.employeeCode})</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Training / Audit Type" required>
              <select
                className="select font-semibold"
                value={certForm.trainingType}
                onChange={(e) => setCertForm({ ...certForm, trainingType: e.target.value })}
              >
                <option value="POSH">POSH (Prevention of Sexual Harassment)</option>
                <option value="FIRE_SAFETY">Fire & Evacuation Safety</option>
                <option value="FIRST_AID">Pediatric First Aid & CPR</option>
                <option value="POLICE_VERIFICATION">Police Verification</option>
                <option value="MEDICAL_FITNESS">Medical Fitness Record</option>
              </select>
            </Field>

            <Field label="Score / Evaluation (%)">
              <input
                className="input"
                type="number"
                value={certForm.score}
                onChange={(e) => setCertForm({ ...certForm, score: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Completion Date" required>
              <input
                type="date"
                className="input"
                value={certForm.completionDate}
                onChange={(e) => setCertForm({ ...certForm, completionDate: e.target.value })}
              />
            </Field>
            <Field label="Expiry Date (Default 1 Yr)" required>
              <input
                type="date"
                className="input"
                value={certForm.expiryDate}
                onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Verification Notes">
            <input
              className="input"
              value={certForm.remarks}
              onChange={(e) => setCertForm({ ...certForm, remarks: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setRecordCertModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRecordCompliance} disabled={busy}>
              {busy ? 'Saving…' : 'Record & Release Gate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 17. MODAL: PROCESS PAYROLL ── */}
      <Modal
        open={isProcessPayrollOpen}
        onClose={() => setIsProcessPayrollOpen(false)}
        title="Process Monthly Payroll Period"
        subtitle="Synchronizes attendance, leaves, deductions and enforces POSH gate"
        icon={<CreditCard size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payroll Month" required>
              <select
                className="select font-semibold"
                value={payMonth}
                onChange={(e) => setPayMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payroll Year" required>
              <input
                className="input font-mono"
                type="number"
                value={payYear}
                onChange={(e) => setPayYear(Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Campus Scope">
            <select
              className="select"
              value={payBranch}
              onChange={(e) => setPayBranch(e.target.value)}
            >
              <option value="">All Campuses & Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>

          <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs space-y-1">
            <div className="font-semibold text-foreground">Statutory Deduction Rules Applied:</div>
            <div>• PF: 12% of basic salary</div>
            <div>• ESI: 0.75% of gross if gross ≤ ₹21,000</div>
            <div>• POSH Gate: Automatic hold if annual certification is missing/expired</div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setIsProcessPayrollOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleProcessPayroll} disabled={busy}>
              {busy ? 'Calculating…' : 'Run Calculation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 18. MODAL: DISBURSE PAYROLL ── */}
      <Modal
        open={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title="Disburse & Lock Payroll Period"
        subtitle={`Cycle: ${activeDisburseCycle?.month}/${activeDisburseCycle?.year} · Total Net: ${money(activeDisburseCycle?.totalNetPayable)}`}
        icon={<HandCoins size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <Field label="Bank Payment Reference / UTR" required helper="e.g. HDFC-NEFT-20260425-998">
            <input
              className="input font-mono"
              placeholder="NEFT-UTR-REFERENCE"
              value={disburseReference}
              onChange={(e) => setDisburseReference(e.target.value)}
            />
          </Field>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs">
            Warning: Disbursing locks the payroll period permanently. No further salary modifications can be made without an authorized adjustment cycle.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setDisburseModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleDisbursePayroll} disabled={busy}>
              {busy ? 'Disbursing…' : 'Confirm Disbursement'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 19. MODAL: CONVERT CANDIDATE TO STAFF ── */}
      <Modal
        open={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={`Onboard Candidate — ${activeConvertCandidate?.candidateName}`}
        subtitle="1-tap atomic conversion to canonical User + StaffProfile"
        icon={<Award size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div>Email: <b>{activeConvertCandidate?.email}</b></div>
            <div>Phone: <b>{activeConvertCandidate?.phone}</b></div>
            <div>Qualification: <b>{activeConvertCandidate?.highestQualification}</b></div>
          </div>

          <Field label="Assign Employee Code" required>
            <input
              className="input font-mono"
              value={convertForm.employeeCode}
              onChange={(e) => setConvertForm({ ...convertForm, employeeCode: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Official Joining Date" required>
              <input
                type="date"
                className="input"
                value={convertForm.joiningDate}
                onChange={(e) => setConvertForm({ ...convertForm, joiningDate: e.target.value })}
              />
            </Field>

            <Field label="Starting Basic Salary (₹)" required>
              <input
                type="number"
                className="input font-mono"
                value={convertForm.basicSalary}
                onChange={(e) => setConvertForm({ ...convertForm, basicSalary: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setConvertModalOpen(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleConvertCandidate} disabled={busy}>
              {busy ? 'Converting…' : 'Convert & Provision Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 20. MODAL: BRANCH TRANSFER ── */}
      <Modal
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title={`Transfer Campus — ${transferTarget?.name}`}
        subtitle={`Current Branch: ${transferTarget?.branchName || 'Main Campus'}`}
        icon={<Building size={18} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4 text-xs">
          <Field label="Select New Destination Branch" required>
            <select
              className="select font-semibold"
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
            >
              <option value="">Select Campus</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>

          <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
            Transferring campus will update the employee's workforce profile and synchronize their <code>TenantUser</code> branch scope. Existing classroom allocations should be updated in the Academics module.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button className="btn btn-outline" onClick={() => setIsTransferOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExecuteTransfer} disabled={busy || !targetBranchId}>
              {busy ? 'Transferring…' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

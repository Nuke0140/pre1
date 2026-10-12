'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart3, TrendingUp, Users, CalendarCheck2, FileSpreadsheet,
  GraduationCap, Download, RefreshCw, Filter, Calendar, Building,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, Percent,
  PhoneCall, MapPin, PieChart, Clock, Layers, Award, Sparkles, Check,
  XCircle
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { FunnelChart, DonutChart, BarChart } from '@/components/preone/Chart'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill } from '@/components/preone'
import { GlobalActionMenu } from '@/components/ui/action-menu'

export default function AdmissionsReportsPage() {
  const toast = useToast()

  // Master Contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [sessions, setSessions] = useState<{ id: string; name: string; isCurrent?: boolean }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Date Range filter
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d' | 'session'>('all')
  const [activeTab, setActiveTab] = useState<'funnel' | 'sources' | 'programs' | 'pipeline' | 'comparison' | 'lost'>('funnel')

  // Raw data from APIs
  const [leads, setLeads] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [visitsData, setVisitsData] = useState<{ completed: number; upcoming: number }>({ completed: 0, upcoming: 0 })
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // 1. Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      try {
        const [brRes, sesRes, progRes] = await Promise.all([
          fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/academic-years').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/programs').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        ])
        if (brRes.success && brRes.data?.length > 0) {
          setBranches(brRes.data)
          if (brRes.data.length > 1) {
            setSelectedBranchId('__ALL_BRANCHES__')
          } else {
            const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
            setSelectedBranchId(main.id)
          }
        }
        if (sesRes.success && sesRes.data?.length > 0) {
          setSessions(sesRes.data)
          const curr = sesRes.data.find((s: any) => s.isCurrent) || sesRes.data[0]
          setSelectedSessionId(curr.id)
        }
        if (progRes.success && progRes.data) {
          setPrograms(progRes.data)
        }
      } catch (e) {
        console.error('Failed to load masters:', e)
      }
    }
    loadMasters()
  }, [])

  // 2. Load admissions datasets
  const loadReportsData = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const leadParams = new URLSearchParams({ branchId: selectedBranchId })
      const appParams = new URLSearchParams({ branchId: selectedBranchId })
      if (selectedSessionId) {
        appParams.set('academicSessionId', selectedSessionId)
      }

      const [leadRes, appRes, visitRes] = await Promise.all([
        fetch(`/api/v1/leads?${leadParams.toString()}`).then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/v1/applications?${appParams.toString()}`).then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/v1/visits?branchId=${selectedBranchId}&queue=COMPLETED`).then((r) => r.json()).catch(() => ({ success: false, data: null })),
      ])

      if (leadRes.success && leadRes.data) {
        setLeads(leadRes.data)
      } else {
        setLeads([])
      }

      if (appRes.success && appRes.data) {
        setApplications(appRes.data)
      } else {
        setApplications([])
      }

      if (visitRes.success && visitRes.data) {
        setVisitsData({
          completed: visitRes.data.counts?.completed || 0,
          upcoming: visitRes.data.counts?.upcomingVisits || 0,
        })
      }
    } catch (e: any) {
      console.error('Failed to load report data:', e)
      toast.error('Failed to load report metrics: ' + (e.message || 'Unknown error'))
    } finally {
      setBusy(false)
    }
  }, [selectedBranchId, selectedSessionId, toast])

  useEffect(() => {
    if (selectedBranchId) {
      loadReportsData()
    }
  }, [selectedBranchId, selectedSessionId, loadReportsData])

  // Filter leads based on selected date range
  const filteredLeads = useMemo(() => {
    if (dateRange === 'all') return leads
    const now = new Date().getTime()
    const daysLimit = dateRange === '30d' ? 30 : 90
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000
    return leads.filter((l) => new Date(l.createdAt).getTime() >= cutoff)
  }, [leads, dateRange])

  // Filter applications based on selected date range
  const filteredApps = useMemo(() => {
    if (dateRange === 'all') return applications
    const now = new Date().getTime()
    const daysLimit = dateRange === '30d' ? 30 : 90
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000
    return applications.filter((a) => new Date(a.submittedAt || a.createdAt).getTime() >= cutoff)
  }, [applications, dateRange])

  // Metrics computation
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length
    const contactedLeads = filteredLeads.filter((l) => l.status !== 'NEW' && l.status !== 'DUPLICATE').length
    const qualifiedLeads = filteredLeads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CONVERTED' || l.status === 'APPLICATION_STARTED').length
    const convertedLeads = filteredLeads.filter((l) => l.status === 'CONVERTED' || l.convertedApplicationId).length
    const lostLeads = filteredLeads.filter((l) => l.status === 'LOST').length

    const totalApps = filteredApps.length
    const approvedApps = filteredApps.filter((a) => ['APPROVED', 'OFFER_MADE', 'OFFER_ACCEPTED', 'ENROLLED'].includes(a.status)).length
    const offersMade = filteredApps.filter((a) => ['OFFER_MADE', 'OFFER_ACCEPTED', 'ENROLLED'].includes(a.status)).length
    const enrolledApps = filteredApps.filter((a) => a.status === 'ENROLLED' || a.studentId).length

    // Stage counts for Truthful Funnel
    const stage1_enquiries = totalLeads
    const stage2_contacted = contactedLeads
    const stage3_qualified = qualifiedLeads
    const stage4_applications = totalApps
    const stage5_approved = approvedApps
    const stage6_enrolled = enrolledApps

    // Key Rates
    const overallYield = stage1_enquiries > 0 ? ((stage6_enrolled / stage1_enquiries) * 100).toFixed(1) : '0.0'
    const appToEnrollRate = stage4_applications > 0 ? ((stage6_enrolled / stage4_applications) * 100).toFixed(1) : '0.0'
    const contactRate = stage1_enquiries > 0 ? ((stage2_contacted / stage1_enquiries) * 100).toFixed(1) : '0.0'
    const qualificationRate = stage2_contacted > 0 ? ((stage3_qualified / stage2_contacted) * 100).toFixed(1) : '0.0'

    return {
      totalLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      totalApps,
      approvedApps,
      offersMade,
      enrolledApps,
      overallYield,
      appToEnrollRate,
      contactRate,
      qualificationRate,
      funnel: [
        { label: '1. Total Enquiries', value: Math.max(stage1_enquiries, 1), color: '#3B82F6' },
        { label: '2. In Follow-up / Contacted', value: Math.max(stage2_contacted, 0), color: '#6366F1' },
        { label: '3. Qualified (Green / Positive)', value: Math.max(stage3_qualified, 0), color: '#10B981' },
        { label: '4. Applications Submitted', value: Math.max(stage4_applications, 0), color: '#EC4899' },
        { label: '5. Documents Approved', value: Math.max(stage5_approved, 0), color: '#F59E0B' },
        { label: '6. Confirmed Enrolled', value: Math.max(stage6_enrolled, 0), color: '#059669' },
      ],
    }
  }, [filteredLeads, filteredApps])

  // Lost Leads Analytics
  const lostStats = useMemo(() => {
    const lostList = filteredLeads.filter((l) => l.status === 'LOST')
    const reasonCounts: Record<string, number> = {
      FEES_TOO_HIGH: 0,
      DISTANCE_LOCATION: 0,
      TIMINGS_INCONVENIENT: 0,
      CHOSE_ANOTHER_SCHOOL: 0,
      FACILITIES_EXPECTATIONS: 0,
      RELOCATING: 0,
      OTHER: 0,
    }

    const detailedList = lostList.map((l) => {
      let reason = 'OTHER'
      let detail = ''
      if (l.notes) {
        const match = l.notes.match(/\[Lost:\s*([^\]|]+)(?:\s*\|\s*([^\]]*))?\]/)
        if (match) {
          reason = match[1].trim()
          detail = (match[2] || '').trim()
        }
      }
      if (reasonCounts[reason] !== undefined) {
        reasonCounts[reason] += 1
      } else {
        reasonCounts.OTHER += 1
      }
      return {
        ...l,
        lostReason: reason,
        lostDetail: detail || l.notes,
      }
    })

    const reasonsBreakdown = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        label: reason.replace(/_/g, ' '),
        count,
        pct: lostList.length > 0 ? Math.round((count / lostList.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      total: lostList.length,
      rate: filteredLeads.length > 0 ? ((lostList.length / filteredLeads.length) * 100).toFixed(1) : '0.0',
      reasons: reasonsBreakdown,
      items: detailedList,
    }
  }, [filteredLeads])

  // Source attribution
  const sourceStats = useMemo(() => {
    const map: Record<string, { count: number; converted: number }> = {}
    filteredLeads.forEach((l) => {
      const src = l.source || 'WALK_IN'
      if (!map[src]) map[src] = { count: 0, converted: 0 }
      map[src].count += 1
      if (l.status === 'CONVERTED' || l.convertedApplicationId) {
        map[src].converted += 1
      }
    })

    const data = Object.entries(map).map(([src, d]) => ({
      source: src,
      count: d.count,
      converted: d.converted,
      conversionRate: d.count > 0 ? Math.round((d.converted / d.count) * 100) : 0,
    })).sort((a, b) => b.count - a.count)

    const chartData = data.map((d) => ({
      label: d.source.replace('_', ' '),
      value: d.count,
    }))

    return { list: data, chartData }
  }, [filteredLeads])

  // Program demand attribution
  const programStats = useMemo(() => {
    const map: Record<string, { enquiries: number; applications: number; enrolled: number }> = {}

    filteredLeads.forEach((l) => {
      const prog = l.interestedProgram || 'UNSPECIFIED'
      if (!map[prog]) map[prog] = { enquiries: 0, applications: 0, enrolled: 0 }
      map[prog].enquiries += 1
    })

    filteredApps.forEach((a) => {
      const prog = a.programType || 'UNSPECIFIED'
      if (!map[prog]) map[prog] = { enquiries: 0, applications: 0, enrolled: 0 }
      map[prog].applications += 1
      if (a.status === 'ENROLLED' || a.studentId) {
        map[prog].enrolled += 1
      }
    })

    const list = Object.entries(map).map(([prog, d]) => ({
      program: prog,
      enquiries: d.enquiries,
      applications: d.applications,
      enrolled: d.enrolled,
      appRate: d.enquiries > 0 ? Math.round((d.applications / d.enquiries) * 100) : 0,
    })).sort((a, b) => b.applications - a.applications)

    const barData = list.map((d) => ({
      label: d.program,
      value: d.applications,
    }))

    return { list, barData }
  }, [filteredLeads, filteredApps])

  // Branch-Wise Comparative Performance Breakdown
  const campusComparison = useMemo(() => {
    const map: Record<string, { id: string; name: string; enquiries: number; applications: number; offers: number; enrolled: number }> = {}

    branches.forEach((b) => {
      map[b.id] = { id: b.id, name: b.name, enquiries: 0, applications: 0, offers: 0, enrolled: 0 }
    })

    filteredLeads.forEach((l) => {
      const bId = l.branchId
      if (bId && map[bId]) {
        map[bId].enquiries += 1
      }
    })

    filteredApps.forEach((a) => {
      const bId = a.branchId
      if (bId && map[bId]) {
        map[bId].applications += 1
        if (['APPROVED', 'OFFER_GENERATED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'ENROLLED', 'ADMITTED'].includes(a.status)) {
          map[bId].offers += 1
        }
        if (['ENROLLED', 'ADMITTED'].includes(a.status) || a.studentId) {
          map[bId].enrolled += 1
        }
      }
    })

    return Object.values(map).map((row) => ({
      ...row,
      enquiryToAppRate: row.enquiries > 0 ? Math.round((row.applications / row.enquiries) * 100) : 0,
      conversionYield: row.enquiries > 0 ? Math.round((row.enrolled / row.enquiries) * 100) : 0,
    })).sort((a, b) => b.enquiries - a.enquiries)
  }, [branches, filteredLeads, filteredApps])

  // Pipeline status breakdown
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    filteredLeads.forEach((l) => {
      const st = l.status || 'NEW'
      map[st] = (map[st] || 0) + 1
    })
    return Object.entries(map).map(([status, count]) => ({
      status,
      count,
      pct: filteredLeads.length > 0 ? Math.round((count / filteredLeads.length) * 100) : 0,
    }))
  }, [filteredLeads])

  // Export CSV
  const handleExportCsv = () => {
    const branchName = selectedBranchId === '__ALL_BRANCHES__' ? 'All Branches' : (branches.find((b) => b.id === selectedBranchId)?.name || 'Branch')
    const csvRows = [
      ['PreOne Preschool Admissions Report'],
      [`Branch: ${branchName}`, `Generated: ${new Date().toLocaleString()}`, `Range: ${dateRange}`],
      [],
      ['--- FUNNEL SUMMARY ---'],
      ['Stage', 'Count', 'Conversion Yield'],
      ...metrics.funnel.map((s) => [s.label, s.value.toString(), `${metrics.overallYield}%`]),
      [],
      ...(branches.length > 1 ? [
        ['--- CAMPUS-WISE PERFORMANCE COMPARISON ---'],
        ['Campus / Branch', 'Enquiries', 'Applications', 'Offers Issued', 'Enrolled', 'Enquiry-to-App %', 'Overall Yield %'],
        ...campusComparison.map((c) => [
          c.name,
          c.enquiries.toString(),
          c.applications.toString(),
          c.offers.toString(),
          c.enrolled.toString(),
          `${c.enquiryToAppRate}%`,
          `${c.conversionYield}%`,
        ]),
        [],
      ] : []),
      ['--- LEAD SOURCES ATTRIBUTION ---'],
      ['Source', 'Leads Received', 'Converted', 'Conversion Rate %'],
      ...sourceStats.list.map((s) => [s.source, s.count.toString(), s.converted.toString(), `${s.conversionRate}%`]),
      [],
      ['--- PROGRAM DEMAND ---'],
      ['Program', 'Inquiries', 'Applications', 'Enrolled', 'Inquiry-to-App %'],
      ...programStats.list.map((p) => [p.program, p.enquiries.toString(), p.applications.toString(), p.enrolled.toString(), `${p.appRate}%`]),
    ]

    const csvContent = csvRows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `admissions_report_${branchName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Admissions report exported to CSV successfully.')
  }

  return (
    <AdmissionsShell
      title="Admissions Reports & Analytics"
      description="Conversion funnels, acquisition channels, program demand, and enrollment velocity across preschool branches."
      currentModuleKey="reports"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      sessions={sessions}
      selectedSessionId={selectedSessionId}
      onSessionChange={setSelectedSessionId}
      showSessionFilter={true}
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadReportsData}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground bg-card hover:bg-muted/50 transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <GlobalActionMenu
            label="Actions"
            size="sm"
            actions={[
              {
                id: 'export-csv',
                label: 'Export Analytics CSV',
                helperText: 'प्रवेश अहवाल डाउनलोड करा',
                icon: <Download />,
                category: 'export',
                onClick: handleExportCsv,
              },
              {
                id: 'share-form',
                label: 'Share Public Form',
                helperText: 'सार्वजनिक प्रवेश लिंक शेअर करा',
                icon: <Users />,
                category: 'general',
                onClick: () => setShareModalOpen(true),
              },
            ]}
          />
        </div>
      }
    >
      {/* ── Filter Toolbar ── */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'funnel'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Conversion Funnel
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'sources'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lead Acquisition
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'programs'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Program Demand
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'pipeline'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pipeline Health
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'lost'
                ? 'bg-destructive/15 text-destructive font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <XCircle size={13} />
            <span>Lost Analysis</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
              {lostStats.total}
            </span>
          </button>
          {branches.length > 1 && (
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building size={13} />
              <span>Campus Comparison</span>
            </button>
          )}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Time Horizon:</span>
          <div className="flex items-center rounded-lg border border-border bg-muted/20 p-0.5 text-xs font-medium">
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateRange === 'all' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateRange === '30d' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateRange === '90d' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Metric Cards (Windows-style Control Tiles) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-border/80 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inquiries</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.totalLeads}</div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <span className="text-blue-600 font-semibold">{metrics.contactRate}%</span>
            <span>contacted by team</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-border/80 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <FileSpreadsheet size={16} className="text-pink-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.totalApps}</div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <span className="text-emerald-600 font-semibold">{metrics.approvedApps}</span>
            <span>approved for admission</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-border/80 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Official Admissions</span>
            <GraduationCap size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{metrics.enrolledApps}</div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600">{metrics.appToEnrollRate}%</span>
            <span>application-to-seat yield</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-border/80 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Yield</span>
            <TrendingUp size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">{metrics.overallYield}%</div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <span>Inquiry to Confirmed Student</span>
          </div>
        </div>
      </div>

      {/* ── TAB 1: CONVERSION FUNNEL ── */}
      {activeTab === 'funnel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Visual Funnel Chart Card */}
          <div className="lg:col-span-6 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Stage-by-Stage Conversion Funnel</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Drop-off velocity across the end-to-end admissions lifecycle</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                End-to-End
              </span>
            </div>

            <div className="pt-2">
              <FunnelChart data={metrics.funnel} height={260} />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span>Primary drop-off point:</span>
              <span className="font-semibold text-foreground">Inquiry Intake ➔ Campus Visit Scheduling</span>
            </div>
          </div>

          {/* Funnel Table Breakdown Card */}
          <div className="lg:col-span-6 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Funnel Milestone Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Detailed count and step-to-step transition rates</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Milestone Stage</th>
                    <th className="py-2.5 px-3 text-right">Candidates</th>
                    <th className="py-2.5 px-3 text-right">Step Transition</th>
                    <th className="py-2.5 px-3 text-right">Cumulative Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {metrics.funnel.map((stage, idx) => {
                    const prevVal = idx === 0 ? stage.value : metrics.funnel[idx - 1].value
                    const stepRate = prevVal > 0 ? Math.round((stage.value / prevVal) * 100) : 100
                    const cumRate = metrics.funnel[0].value > 0 ? ((stage.value / metrics.funnel[0].value) * 100).toFixed(1) : '0'

                    return (
                      <tr key={stage.label} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.label}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {stage.value}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            idx === 0
                              ? 'bg-muted text-muted-foreground'
                              : stepRate >= 70
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : stepRate >= 40
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {idx === 0 ? '100%' : `${stepRate}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          {cumRate}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LEAD SOURCES ATTRIBUTION ── */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Donut Chart */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Channel Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Where prospective parents learn about your preschool</p>
            </div>

            <div className="flex items-center justify-center py-4">
              {sourceStats.chartData.length > 0 ? (
                <DonutChart
                  data={sourceStats.chartData}
                  size={200}
                  centerLabel={`${filteredLeads.length}`}
                  centerSublabel="Total Leads"
                />
              ) : (
                <EmptyState title="No leads recorded" description="Start logging inquiries to see channel attribution." />
              )}
            </div>
          </div>

          {/* Source Conversion Table */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Channel Conversion Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Comparing inquiries received vs formally enrolled students</p>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Lead Source</th>
                    <th className="py-2.5 px-3 text-right">Inquiries</th>
                    <th className="py-2.5 px-3 text-right">Converted</th>
                    <th className="py-2.5 px-3 text-right">Efficiency %</th>
                    <th className="py-2.5 px-3 text-right">Performance Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sourceStats.list.map((s, idx) => (
                    <tr key={s.source} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {s.source.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        {s.count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                        {s.converted}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.conversionRate >= 50
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : s.conversionRate >= 20
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {s.conversionRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {idx === 0 ? '🏆 Highest Volume' : `#${idx + 1}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sourceStats.list.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No inquiry source data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROGRAM DEMAND & CAPACITY ── */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bar Chart */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Applications by Program</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Demand across grades and age cohorts</p>
            </div>

            <div className="pt-2">
              {programStats.barData.length > 0 ? (
                <BarChart data={programStats.barData} height={220} barColor="#8B5CF6" />
              ) : (
                <EmptyState title="No program data" description="No formal applications logged for this branch." />
              )}
            </div>
          </div>

          {/* Program Breakdown Table */}
          <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Program Admission Velocity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tracking enquiry interest, application volume, and confirmed seats</p>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Preschool Program</th>
                    <th className="py-2.5 px-3 text-right">Inquiries</th>
                    <th className="py-2.5 px-3 text-right">Applications</th>
                    <th className="py-2.5 px-3 text-right">Enrolled Seats</th>
                    <th className="py-2.5 px-3 text-right">Lead-to-App %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {programStats.list.map((p) => (
                    <tr key={p.program} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {p.program}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {p.enquiries}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        {p.applications}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {p.enrolled}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-500/10 text-violet-600">
                          {p.appRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {programStats.list.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No program applications available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PIPELINE HEALTH ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Inquiry Pipeline Status Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribution of candidate leads across the operational workflow</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {statusBreakdown.map((s) => (
                <div key={s.status} className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.status}
                    </span>
                    <span className="text-xs font-bold font-mono text-foreground">{s.pct}%</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground">{s.count}</div>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.status === 'CONVERTED'
                          ? 'bg-emerald-500'
                          : s.status === 'LOST'
                          ? 'bg-rose-500'
                          : s.status === 'QUALIFIED'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conversion Speed & SLA Box */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Average Pipeline Velocity</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Prospective parents spend an average of <strong className="text-foreground">4.2 days</strong> between first inquiry contact and their completed campus tour.
              </p>
            </div>

            {/* Application Acceptance Ratio */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Offer Acceptance Health</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-emerald-600">{metrics.appToEnrollRate}%</strong> of parents who submit formal preschool applications proceed to pay enrollment deposits and complete student onboarding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: CAMPUS COMPARISON ── */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building size={16} className="text-primary" />
                  <span>Branch-Level Admissions Performance Matrix</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparative intake volume, conversion efficiency, and enrollment yields across authorized campuses
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/80 text-foreground border border-border/70">
                {branches.length} Campuses Monitored
              </span>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Campus / Branch</th>
                    <th className="py-2.5 px-3 text-right">Inquiries</th>
                    <th className="py-2.5 px-3 text-right">Applications</th>
                    <th className="py-2.5 px-3 text-right">Offers Issued</th>
                    <th className="py-2.5 px-3 text-right">Confirmed Students</th>
                    <th className="py-2.5 px-3 text-right">Inquiry-to-App %</th>
                    <th className="py-2.5 px-3 text-right">Overall Yield %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {campusComparison.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="py-3 px-3 font-bold text-foreground flex items-center gap-2">
                        <Building size={14} className="text-primary shrink-0" />
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {row.enquiries}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {row.applications}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {row.offers}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.enrolled}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                        {row.enquiryToAppRate}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {row.conversionYield}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LOST LEADS ANALYSIS ── */}
      {activeTab === 'lost' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Lost Enquiries</span>
                <XCircle size={16} className="text-destructive" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-destructive">{lostStats.total}</div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <span>Enquiries marked lost</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Enquiry Loss Rate</span>
                <Percent size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{lostStats.rate}%</div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <span>of total enquiries</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Primary Loss Factor</span>
                <AlertCircle size={16} className="text-primary" />
              </div>
              <div className="text-base font-bold tracking-tight text-foreground truncate">
                {lostStats.reasons[0]?.count > 0 ? lostStats.reasons[0].label : 'None'}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <span>{lostStats.reasons[0]?.count || 0} enquiries ({lostStats.reasons[0]?.pct || 0}%)</span>
              </div>
            </div>
          </div>

          {/* Reason Breakdown & Audit Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Loss Reasons Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Distribution of reasons why enquiries did not proceed</p>
              </div>
              <div className="space-y-3 pt-1">
                {lostStats.reasons.map((r) => (
                  <div key={r.reason} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{r.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {r.count} ({r.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive/70 transition-all"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Lost Leads Table */}
            <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Lost Leads Audit Log</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Full audit trail of closed leads with parent feedback</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {lostStats.items.length} Records
                </span>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Lead #</th>
                      <th className="py-2.5 px-3">Pupil & Parent</th>
                      <th className="py-2.5 px-3">Program</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Remarks / Feedback</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {lostStats.items.length > 0 ? (
                      lostStats.items.map((lead: any) => (
                        <tr key={lead.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary whitespace-nowrap">
                            {lead.leadNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">{lead.childName || 'Child'}</div>
                            <div className="text-[11px] text-muted-foreground">{lead.parentName} ({lead.phone})</div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-foreground">
                              {lead.interestedProgram || 'Nursery'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                              {lead.lostReason.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-xs truncate" title={lead.lostDetail}>
                            {lead.lostDetail || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap">
                            {fmtDate(lead.updatedAt || lead.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No lost leads in this time range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Fast Modals ── */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        onSuccess={() => {
          setEnquiryModalOpen(false)
          loadReportsData()
        }}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
      />

      <SharePublicFormModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        branchId={selectedBranchId}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name}
      />
    </AdmissionsShell>
  )
}

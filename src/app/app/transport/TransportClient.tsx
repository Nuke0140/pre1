'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bus,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  Search,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  KeyRound,
  FileText,
  Calendar,
  Wrench,
  AlertOctagon,
  UserX,
  ExternalLink,
  Edit3,
  ListOrdered,
  X,
  UserPlus,
} from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, KpiTile, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { inr, fmtDate, enumLabel } from '@/lib/format'
import { Role } from '@/lib/auth'

interface SessionProps {
  uid: string
  email: string
  name: string
  role: Role
  tenantId: string | null
  branchId: string | null
}

export function TransportClient({ session }: { session: SessionProps }) {
  const toast = useToast()
  const role = session.role
  const canWrite = ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'PLATFORM_ADMIN'].includes(role)
  const canOperate = ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'RECEPTION', 'PLATFORM_ADMIN'].includes(role)

  type TabKey = 'OVERVIEW' | 'TRIPS' | 'ROUTES' | 'VEHICLES' | 'STUDENTS' | 'INCIDENTS'
  const [tab, setTab] = useState<TabKey>('OVERVIEW')

  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [eligibleStaff, setEligibleStaff] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])

  // Filter States
  const [tripTypeFilter, setTripTypeFilter] = useState<'ALL' | 'MORNING' | 'EVENING'>('ALL')
  const [tripStatusFilter, setTripStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'>('ALL')
  const [routeFilter, setRouteFilter] = useState<string>('ALL')
  const [studentSearch, setStudentSearch] = useState<string>('')
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState<string>('ALL')

  // Emergency Safety Callout State
  const [activeSafetyAlert, setActiveSafetyAlert] = useState<{
    studentName: string
    studentId?: string
    reason: string
    stopName?: string
    attemptedPerson?: string
    timestamp: string
  } | null>(null)

  // Modal States
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)
  const [editVehicleModal, setEditVehicleModal] = useState<any>(null)
  const [addRouteOpen, setAddRouteOpen] = useState(false)
  const [editRouteModal, setEditRouteModal] = useState<any>(null)
  const [manageStopsModal, setManageStopsModal] = useState<any>(null)
  const [assignStudentOpen, setAssignStudentOpen] = useState(false)
  const [cancelAssignmentModal, setCancelAssignmentModal] = useState<any>(null)
  const [startTripOpen, setStartTripOpen] = useState(false)
  const [dropVerifyOpen, setDropVerifyOpen] = useState<any>(null)
  const [dropError, setDropError] = useState<string | null>(null)
  const [reportIncidentOpen, setReportIncidentOpen] = useState(false)
  const [incidentTripPrefill, setIncidentTripPrefill] = useState<any>(null)
  const [resolveIncidentModal, setResolveIncidentModal] = useState<any>(null)
  const [delayTripOpen, setDelayTripOpen] = useState<any>(null)
  const [substituteVehicleModal, setSubstituteVehicleModal] = useState<any>(null)
  const [substituteDriverModal, setSubstituteDriverModal] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  // Drop Verification Form State
  const [selectedGuardianId, setSelectedGuardianId] = useState('')
  const [pickupPin, setPickupPin] = useState('')

  // 1. Data Fetching
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/transport/dashboard')
      const json = await res.json()
      if (json.success) setMetrics(json.data)
    } catch {
      toast.error('Failed to load transport dashboard')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/vehicles')
      const json = await res.json()
      if (json.success) setVehicles(json.data)
    } catch {}
  }, [])

  const loadRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/routes')
      const json = await res.json()
      if (json.success) setRoutes(json.data)
    } catch {}
  }, [])

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/assignments')
      const json = await res.json()
      if (json.success) setAssignments(json.data)
    } catch {}
  }, [])

  const loadTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/trips')
      const json = await res.json()
      if (json.success) setTrips(json.data)
    } catch {}
  }, [])

  const loadIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/incidents')
      const json = await res.json()
      if (json.success) setIncidents(json.data)
    } catch {}
  }, [])

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/transport/eligible-staff')
      const json = await res.json()
      if (json.success) setEligibleStaff(json.data)
    } catch {}
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/students?pageSize=100&status=ACTIVE')
      const json = await res.json()
      if (json.success) setAvailableStudents(json.data || [])
    } catch {}
  }, [])

  useEffect(() => {
    loadDashboard()
    loadVehicles()
    loadRoutes()
    loadAssignments()
    loadTrips()
    loadIncidents()
    loadStaff()
    loadStudents()
  }, [loadDashboard, loadVehicles, loadRoutes, loadAssignments, loadTrips, loadIncidents, loadStaff, loadStudents])

  // Helper avatar generator
  const getAvatarInitials = (name: string) => {
    if (!name) return 'CH'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  // 2. Vehicle Actions
  const handleCreateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: fd.get('registrationNumber'),
          capacity: Number(fd.get('capacity')),
          makeModel: fd.get('makeModel'),
          vehicleType: fd.get('vehicleType'),
          notes: fd.get('notes'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Vehicle registered successfully')
        setAddVehicleOpen(false)
        loadVehicles()
        loadDashboard()
      } else {
        toast.error('Failed to create vehicle', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error creating vehicle', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editVehicleModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/vehicles/${editVehicleModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacity: Number(fd.get('capacity')),
          makeModel: fd.get('makeModel'),
          status: fd.get('status'),
          notes: fd.get('notes'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Vehicle updated successfully')
        setEditVehicleModal(null)
        loadVehicles()
        loadDashboard()
      } else {
        toast.error('Failed to update vehicle', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error updating vehicle', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/v1/transport/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Vehicle status changed to ${nextStatus}`)
        loadVehicles()
        loadDashboard()
      } else {
        toast.error('Failed to change vehicle status', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error changing status', err.message)
    }
  }

  // 3. Route Actions
  const handleCreateRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/transport/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fd.get('code'),
          name: fd.get('name'),
          description: fd.get('description'),
          vehicleId: fd.get('vehicleId') || undefined,
          driverProfileId: fd.get('driverProfileId') || undefined,
          attendantProfileId: fd.get('attendantProfileId') || undefined,
          stops: [
            { name: fd.get('stop1Name'), sequence: 1, morningPickupTime: '07:45', eveningDropTime: '15:15' },
            { name: fd.get('stop2Name'), sequence: 2, morningPickupTime: '08:05', eveningDropTime: '15:35' },
            { name: 'School Campus', sequence: 3, morningPickupTime: '08:30', eveningDropTime: '15:00' },
          ].filter((s) => s.name),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Route created successfully')
        setAddRouteOpen(false)
        loadRoutes()
        loadDashboard()
      } else {
        toast.error('Failed to create route', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error creating route', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editRouteModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/routes/${editRouteModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          description: fd.get('description'),
          vehicleId: fd.get('vehicleId') || null,
          driverProfileId: fd.get('driverProfileId') || null,
          attendantProfileId: fd.get('attendantProfileId') || null,
          status: fd.get('status'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Route configuration saved')
        setEditRouteModal(null)
        loadRoutes()
        loadDashboard()
      } else {
        toast.error('Failed to update route', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error updating route', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 4. Trip Actions
  const handleStartTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/transport/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: fd.get('routeId'),
          tripType: fd.get('tripType'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Trip dispatched with live student manifest!')
        setStartTripOpen(false)
        loadTrips()
        loadDashboard()
        setTab('TRIPS')
      } else {
        toast.error('Failed to start trip', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error starting trip', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleBoard = async (tripId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/v1/transport/trips/${tripId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Child boarded safely. ARRIVAL logged on parent timeline!')
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Boarding failed', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error recording boarding', err.message)
    }
  }

  const handleDropConfirm = async () => {
    if (!dropVerifyOpen) return
    setBusy(true)
    setDropError(null)
    try {
      const res = await fetch(`/api/v1/transport/trips/${dropVerifyOpen.tripId}/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: dropVerifyOpen.student.id,
          guardianId: selectedGuardianId || undefined,
          pin: pickupPin || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Verified and safely handed over to guardian!`)
        setDropVerifyOpen(null)
        setSelectedGuardianId('')
        setPickupPin('')
        loadTrips()
        loadDashboard()
      } else {
        const errorMsg = json.error?.message || json.error || 'Pickup unauthorized'
        setDropError(errorMsg)
        setActiveSafetyAlert({
          studentName: `${dropVerifyOpen.student.firstName} ${dropVerifyOpen.student.lastName || ''}`,
          studentId: dropVerifyOpen.student.id,
          reason: errorMsg,
          stopName: dropVerifyOpen.stop.name,
          attemptedPerson: selectedGuardianId || 'Collecting Person',
          timestamp: new Date().toLocaleTimeString(),
        })
        toast.error('Release Blocked', errorMsg)
        loadIncidents()
      }
    } catch (err: any) {
      setDropError(err.message)
      toast.error('Pickup Blocked', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleRecordDelay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!delayTripOpen) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/trips/${delayTripOpen.id}/delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delayMinutes: Number(fd.get('delayMinutes')),
          reason: fd.get('reason'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Trip delay recorded. Bus Delay Alert sent to affected parents!')
        setDelayTripOpen(null)
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Failed to record delay', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error recording delay', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 5. In-Flight Substitutions
  const handleSubstituteVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!substituteVehicleModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/trips/${substituteVehicleModal.id}/substitute-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: fd.get('vehicleId'),
          reason: fd.get('reason'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Trip vehicle substituted in-flight!')
        setSubstituteVehicleModal(null)
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Vehicle substitution failed', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error substituting vehicle', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSubstituteDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!substituteDriverModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/trips/${substituteDriverModal.id}/substitute-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverProfileId: fd.get('driverProfileId'),
          reason: fd.get('reason'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Trip driver substituted in-flight!')
        setSubstituteDriverModal(null)
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Driver substitution failed', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error substituting driver', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 6. Student Allocations
  const handleAssignStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const routeId = fd.get('routeId') as string
    const selectedRoute = routes.find((r) => r.id === routeId)
    const pickupStopId = fd.get('pickupStopId') as string
    const dropStopId = fd.get('dropStopId') as string

    try {
      const res = await fetch('/api/v1/transport/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: fd.get('studentId'),
          routeId,
          pickupStopId,
          dropStopId,
          tripType: fd.get('tripType'),
          monthlyFeeCents: Number(fd.get('monthlyFee')) * 100,
          generateFeeInvoice: fd.get('generateFeeInvoice') === 'on',
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Student assigned to transport!')
        setAssignStudentOpen(false)
        loadAssignments()
        loadRoutes()
        loadDashboard()
      } else {
        toast.error('Assignment failed', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error assigning student', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCancelAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!cancelAssignmentModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/assignments/${cancelAssignmentModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL',
          reason: fd.get('reason'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Transport allocation cancelled and capacity released')
        setCancelAssignmentModal(null)
        loadAssignments()
        loadRoutes()
        loadDashboard()
      } else {
        toast.error('Failed to cancel assignment', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error cancelling assignment', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 7. Incident Management
  const handleReportIncident = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/transport/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: fd.get('tripId') || undefined,
          vehicleId: fd.get('vehicleId') || undefined,
          severity: fd.get('severity'),
          category: fd.get('category'),
          title: fd.get('title'),
          description: fd.get('description'),
          actionTaken: fd.get('actionTaken'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Incident reported. Operations follow-up logged!')
        setReportIncidentOpen(false)
        setIncidentTripPrefill(null)
        loadIncidents()
        loadDashboard()
      } else {
        toast.error('Failed to report incident', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error reporting incident', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleResolveIncident = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolveIncidentModal) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/transport/incidents/${resolveIncidentModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: fd.get('status'),
          actionTaken: fd.get('actionTaken'),
          resolutionNotes: fd.get('resolutionNotes'),
          correctionReason: fd.get('correctionReason'),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Incident status updated and follow-up closed!')
        setResolveIncidentModal(null)
        loadIncidents()
        loadDashboard()
      } else {
        toast.error('Failed to update incident', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error updating incident', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Filtered lists
  const filteredTrips = trips.filter((t) => {
    if (tripTypeFilter !== 'ALL' && t.tripType !== tripTypeFilter) return false
    if (tripStatusFilter === 'DELAYED' && (!t.delayMinutes || t.delayMinutes <= 0)) return false
    if (tripStatusFilter !== 'ALL' && tripStatusFilter !== 'DELAYED' && t.status !== tripStatusFilter) return false
    if (routeFilter !== 'ALL' && t.route.id !== routeFilter) return false
    return true
  })

  const filteredAssignments = assignments.filter((a) => {
    if (!studentSearch.trim()) return true
    const q = studentSearch.toLowerCase()
    const name = `${a.student.firstName} ${a.student.lastName || ''}`.toLowerCase()
    const adm = (a.student.admissionNo || '').toLowerCase()
    const rName = (a.route.name || '').toLowerCase()
    return name.includes(q) || adm.includes(q) || rName.includes(q)
  })

  const filteredIncidents = incidents.filter((inc) => {
    if (incidentSeverityFilter !== 'ALL' && inc.severity !== incidentSeverityFilter) return false
    return true
  })

  // Check if any open critical incidents exist
  const criticalIncidents = incidents.filter((i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.status !== 'RESOLVED')

  return (
    <div className="page-shell">
      <PageHead
        title="Transport & Child Safety Operations"
        sub="Fleet management, daily transit runs, student manifest verification, authorized multi-guardian drop safety, and real-time operations escalation"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => { loadDashboard(); loadTrips(); loadVehicles(); loadRoutes(); loadIncidents(); }} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {canOperate && (
              <button className="btn btn-secondary" onClick={() => setStartTripOpen(true)}>
                <Clock size={15} /> Dispatch Trip
              </button>
            )}
            {canWrite && (
              <>
                <button className="btn btn-secondary" onClick={() => setAssignStudentOpen(true)}>
                  <UserPlus size={15} /> Allocate Seat
                </button>
                <button className="btn btn-primary" onClick={() => setAddRouteOpen(true)}>
                  <Plus size={15} /> Add Route
                </button>
              </>
            )}
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* CRITICAL SAFETY ALERT CALLOUT (When pickup blocked or critical incident) */}
      {/* ========================================================================= */}
      {(activeSafetyAlert || criticalIncidents.length > 0) && (
        <div
          style={{
            marginBottom: 20,
            padding: '16px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '2px solid var(--danger)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'var(--danger)',
                color: 'var(--text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--danger)', textTransform: 'uppercase' }}>
                  Emergency Child Safety Alert
                </span>
                <span className="badge b-danger">PRINCIPAL ESCALATION</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginTop: 2 }}>
                {activeSafetyAlert ? `Unauthorized Pickup Blocked: ${activeSafetyAlert.studentName}` : `${criticalIncidents.length} Critical Transit Incident(s) Active`}
              </div>
              <p style={{ fontSize: 13, color: 'var(--foreground)', opacity: 0.85, margin: '4px 0 8px 0' }}>
                {activeSafetyAlert
                  ? `Drop verification failed at ${activeSafetyAlert.stopName || 'bus stop'}. Reason: ${activeSafetyAlert.reason}. Child release was strictly BLOCKED.`
                  : criticalIncidents[0]?.description}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/app/operations" className="btn btn-danger btn-sm" style={{ textDecoration: 'none' }}>
                  <AlertOctagon size={14} /> Open Operations Follow-Up
                </Link>
                {activeSafetyAlert?.studentId && (
                  <Link href={`/app/students/${activeSafetyAlert.studentId}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={13} /> View Student 360
                  </Link>
                )}
              </div>
            </div>
          </div>
          {activeSafetyAlert && (
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSafetyAlert(null)} title="Dismiss callout">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE KPI STRIP (Clickable navigation) */}
      {/* ========================================================================= */}
      <div className="metric-strip" style={{ marginBottom: 20 }}>
        <div className="metric-cell" onClick={() => setTab('ROUTES')} style={{ cursor: 'pointer' }} title="Click to view Routes">
          <div className="m-top">
            <span className="m-lbl">Active Routes</span>
            <Bus size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val">{metrics?.activeRoutes ?? 0}</div>
          <div className="m-meta">Daily routes configured →</div>
        </div>

        <div className="metric-cell" onClick={() => setTab('VEHICLES')} style={{ cursor: 'pointer' }} title="Click to view Fleet">
          <div className="m-top">
            <span className="m-lbl">In-Service Fleet</span>
            <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
          </div>
          <div className="m-val m-success">{metrics?.activeVehicles ?? 0}</div>
          <div className="m-meta">{metrics?.vehiclesInMaintenance ? `${metrics.vehiclesInMaintenance} in maintenance` : '100% active'} →</div>
        </div>

        <div className="metric-cell" onClick={() => setTab('STUDENTS')} style={{ cursor: 'pointer' }} title="Click to view Allocations">
          <div className="m-top">
            <span className="m-lbl">Assigned Children</span>
            <Users size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="m-val">{metrics?.studentsUsingTransport ?? 0}</div>
          <div className="m-meta">Allocated seats →</div>
        </div>

        <div className="metric-cell" onClick={() => setTab('TRIPS')} style={{ cursor: 'pointer' }} title="Click to view Trips">
          <div className="m-top">
            <span className="m-lbl">Boarded Today</span>
            <UserCheck size={15} style={{ color: 'var(--info)' }} />
          </div>
          <div className="m-val">{metrics?.childrenBoarded ?? 0}</div>
          <div className="m-meta">Morning arrivals logged →</div>
        </div>

        <div className="metric-cell" onClick={() => setTab('TRIPS')} style={{ cursor: 'pointer' }} title="Click to view Trips">
          <div className="m-top">
            <span className="m-lbl">Safely Dropped</span>
            <ShieldCheck size={15} style={{ color: 'var(--success)' }} />
          </div>
          <div className="m-val m-success">{metrics?.childrenDropped ?? 0}</div>
          <div className="m-meta">Guardian PIN verified →</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => { setTab('TRIPS'); setTripStatusFilter('DELAYED'); }}
          style={{ cursor: 'pointer' }}
          title="Click to view Delayed Trips"
        >
          <div className="m-top">
            <span className="m-lbl">Delayed Trips</span>
            <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="m-val" style={{ color: metrics?.delayedTrips > 0 ? 'var(--danger)' : 'var(--foreground)' }}>
            {metrics?.delayedTrips ?? 0}
          </div>
          <div className="m-meta">{metrics?.delayedTrips > 0 ? 'Review & Alert' : 'On schedule'} →</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Segmented
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        options={[
          { key: 'OVERVIEW', label: 'Command Center' },
          { key: 'TRIPS', label: `Today's Runs (${trips.length})` },
          { key: 'ROUTES', label: `Routes (${routes.length})` },
          { key: 'VEHICLES', label: `Fleet (${vehicles.length})` },
          { key: 'STUDENTS', label: `Allocations (${assignments.length})` },
          { key: 'INCIDENTS', label: `Safety & Incidents (${incidents.length})` },
        ]}
      />

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW — COMMAND CENTER */}
      {/* ========================================================================= */}
      {tab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 16 }} className="dash-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Active Daily Trips Progress</div>
                <div className="card-sub">Morning pickup and evening handover runs</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('TRIPS')}>
                Manage Runs <ArrowRight size={13} />
              </button>
            </div>
            {trips.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {trips.map((t) => {
                  const handledCount = t.manifest.filter((m: any) => m.status === 'BOARDED' || m.status === 'DROPPED').length
                  const progressPct = t.manifest.length > 0 ? Math.round((handledCount / t.manifest.length) * 100) : 0
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{t.route.name}</span>
                            <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{t.route.code}</span>
                            <span className={`badge ${t.tripType === 'MORNING' ? 'b-primary' : 'b-purple'}`}>{t.tripType}</span>
                            <span className={`badge ${t.status === 'IN_PROGRESS' ? 'b-warning' : t.status === 'COMPLETED' ? 'b-success' : 'b-neutral'}`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="t-caption" style={{ marginTop: 4 }}>
                            Bus: <b>{t.vehicle.registrationNumber}</b> · Driver: <b>{t.driverProfile.user.fullName}</b>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {handledCount} / {t.manifest.length} Handled ({progressPct}%)
                          </div>
                          {t.delayMinutes > 0 ? (
                            <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700 }}>
                              Delayed +{t.delayMinutes}m ({t.delayReason})
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>On time</div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: t.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Bus size={36} />}
                title="No Runs Active Today"
                message="Click 'Dispatch Trip' to initiate a morning pickup or evening drop manifest."
                action={canOperate && <button className="btn btn-primary btn-sm" onClick={() => setStartTripOpen(true)}>Dispatch Trip</button>}
              />
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Fleet Readiness</div>
                <div className="card-sub">Active buses, vans, and maintenance guards</div>
              </div>
              {canWrite && (
                <button className="btn btn-ghost btn-sm" onClick={() => setAddVehicleOpen(true)}>
                  <Plus size={13} /> Add Bus
                </button>
              )}
            </div>
            {vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vehicles.slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.registrationNumber}</div>
                      <div className="t-caption">
                        {v.makeModel || 'Standard Bus'} · Cap: <b>{v.capacity}</b> seats
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${v.status === 'ACTIVE' ? 'b-success' : v.status === 'MAINTENANCE' ? 'b-warning' : 'b-neutral'}`}>
                        {v.status}
                      </span>
                      {canWrite && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '2px 6px' }}
                          onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                          title="Toggle Maintenance Mode"
                        >
                          <Wrench size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Bus size={32} />} title="No Vehicles Registered" message="Register preschool buses or vans to assign to routes." />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TODAY'S TRIPS & LIVE MANIFESTS */}
      {/* ========================================================================= */}
      {tab === 'TRIPS' && (
        <div style={{ marginTop: 16 }}>
          {/* Trip Filters */}
          <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                <select
                  className="input"
                  style={{ width: 140, padding: '4px 8px', height: 32, fontSize: 13 }}
                  value={tripTypeFilter}
                  onChange={(e) => setTripTypeFilter(e.target.value as any)}
                >
                  <option value="ALL">All Trip Types</option>
                  <option value="MORNING">Morning Only</option>
                  <option value="EVENING">Evening Only</option>
                </select>

                <select
                  className="input"
                  style={{ width: 150, padding: '4px 8px', height: 32, fontSize: 13 }}
                  value={tripStatusFilter}
                  onChange={(e) => setTripStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed Only</option>
                </select>

                <select
                  className="input"
                  style={{ width: 180, padding: '4px 8px', height: 32, fontSize: 13 }}
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                >
                  <option value="ALL">All Routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              {canOperate && (
                <button className="btn btn-primary btn-sm" onClick={() => setStartTripOpen(true)}>
                  <Plus size={13} /> Dispatch New Run
                </button>
              )}
            </div>
          </div>

          {filteredTrips.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {filteredTrips.map((t) => (
                <div key={t.id} className="card">
                  {/* Trip Header */}
                  <div className="card-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h3 className="t-h2" style={{ margin: 0 }}>{t.route.name}</h3>
                        <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{t.route.code}</span>
                        <span className={`badge ${t.tripType === 'MORNING' ? 'b-primary' : 'b-purple'}`}>{t.tripType} RUN</span>
                        <span className={`badge ${t.status === 'IN_PROGRESS' ? 'b-warning' : t.status === 'COMPLETED' ? 'b-success' : 'b-neutral'}`}>
                          {t.status}
                        </span>
                        {t.delayMinutes > 0 && (
                          <span className="badge b-danger">
                            <AlertTriangle size={11} style={{ marginRight: 4 }} /> DELAYED +{t.delayMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="t-caption" style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>Bus: <b>{t.vehicle.registrationNumber}</b> (Cap: {t.vehicle.capacity})</span>
                        <span>Driver: <b>{t.driverProfile.user.fullName}</b></span>
                        {t.attendantProfile && <span>Attendant: <b>{t.attendantProfile.user.fullName}</b></span>}
                        <span>Date: <b>{fmtDate(t.tripDate)}</b></span>
                      </div>
                      {t.notes && (
                        <div style={{ fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic', marginTop: 4 }}>
                          Operational notes: {t.notes}
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {t.status === 'IN_PROGRESS' && canOperate && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSubstituteVehicleModal(t)}
                            title="Substitute Vehicle In-Flight"
                          >
                            <Bus size={13} /> Sub Bus
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSubstituteDriverModal(t)}
                            title="Substitute Driver In-Flight"
                          >
                            <UserCheck size={13} /> Sub Driver
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setDelayTripOpen(t)}>
                            <AlertTriangle size={13} /> Log Delay
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setIncidentTripPrefill(t)
                              setReportIncidentOpen(true)
                            }}
                          >
                            <AlertOctagon size={13} /> Log Incident
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={async () => {
                              await fetch(`/api/v1/transport/trips/${t.id}/complete`, { method: 'POST' })
                              toast.success('Trip completed upon arrival!')
                              loadTrips()
                              loadDashboard()
                            }}
                          >
                            <CheckCircle2 size={13} /> Complete Run
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Student Manifest Roster */}
                  <div style={{ overflowX: 'auto', marginTop: 12 }}>
                    <table className="table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Child Identity</th>
                          <th>Designated Stop</th>
                          <th>Transit Status</th>
                          <th>Verification / Timestamp</th>
                          <th style={{ textAlign: 'right' }}>Child Safety Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.manifest.map((item: any) => {
                          const fullName = `${item.student.firstName} ${item.student.lastName || ''}`
                          return (
                            <tr key={item.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: '50%',
                                      background: 'var(--bg-surface-hover)',
                                      color: 'var(--primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      border: '1px solid var(--border)',
                                    }}
                                  >
                                    {getAvatarInitials(fullName)}
                                  </div>
                                  <div>
                                    <Link
                                      href={`/app/students/${item.student.id}`}
                                      style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                                      className="hover:underline"
                                    >
                                      {fullName}
                                    </Link>
                                    <div className="t-caption">Adm: {item.student.admissionNo}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <b>{item.stop.name}</b>
                                <div className="t-caption">
                                  Seq {item.stop.sequence} · {t.tripType === 'MORNING' ? item.stop.morningPickupTime : item.stop.eveningDropTime}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    item.status === 'BOARDED' || item.status === 'DROPPED'
                                      ? 'b-success'
                                      : item.status === 'ABSENT'
                                      ? 'b-danger'
                                      : 'b-warning'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td>
                                {item.status === 'BOARDED' && item.boardedAt ? (
                                  <div style={{ fontSize: 13 }}>
                                    Boarded at {new Date(item.boardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                ) : item.status === 'DROPPED' && item.droppedAt ? (
                                  <div style={{ fontSize: 13 }}>
                                    Handed over at {new Date(item.droppedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>Awaiting action</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {t.status === 'IN_PROGRESS' && canOperate && (
                                  <div style={{ display: 'inline-flex', gap: 6 }}>
                                    {t.tripType === 'MORNING' && item.status !== 'BOARDED' && (
                                      <button className="btn btn-primary btn-sm" onClick={() => handleBoard(t.id, item.student.id)}>
                                        <UserCheck size={13} /> Board Child
                                      </button>
                                    )}
                                    {t.tripType === 'EVENING' && item.status !== 'DROPPED' && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => {
                                          setDropVerifyOpen({ tripId: t.id, student: item.student, stop: item.stop })
                                          setSelectedGuardianId(item.student.guardians?.[0]?.guardian?.id || '')
                                          setPickupPin('')
                                          setDropError(null)
                                        }}
                                      >
                                        <KeyRound size={13} /> Verify & Drop
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={<Bus size={36} />}
                title="No Runs Found"
                message="No trips matching your filter. Clear filters or dispatch a new morning/evening run."
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROUTES & STOPS */}
      {/* ========================================================================= */}
      {tab === 'ROUTES' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Configured Bus Routes</div>
                <div className="card-sub">Stops, sequencing, assigned bus, driver and attendant</div>
              </div>
              {canWrite && (
                <button className="btn btn-primary btn-sm" onClick={() => setAddRouteOpen(true)}>
                  <Plus size={13} /> Add Route
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Assigned Vehicle</th>
                    <th>Driver & Attendant</th>
                    <th>Ordered Stops Timeline</th>
                    <th>Students / Capacity</th>
                    <th>Status</th>
                    {canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.name}</b>
                        <div className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</div>
                        {r.description && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{r.description}</div>}
                      </td>
                      <td>
                        {r.vehicle ? (
                          <div>
                            <b>{r.vehicle.registrationNumber}</b>
                            <div className="t-caption">
                              Cap: {r.vehicle.capacity} ({r.availableCapacity} seats free)
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--c-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div>Driver: <b>{r.driverProfile?.user?.fullName || 'Not assigned'}</b></div>
                        <div className="t-caption">Attendant: {r.attendantProfile?.user?.fullName || 'Not assigned'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.stops.map((s: any) => (
                            <span key={s.id} className="badge b-neutral" style={{ fontSize: 11 }}>
                              {s.sequence}. {s.name} ({s.morningPickupTime})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <b>{r.activeStudentsCount}</b> / {r.vehicle?.capacity || '—'}
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{r.status}</span>
                      </td>
                      {canWrite && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditRouteModal(r)}
                            title="Edit Route & Assignments"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FLEET (VEHICLES) */}
      {/* ========================================================================= */}
      {tab === 'VEHICLES' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">School Transport Fleet</div>
                <div className="card-sub">Registration, capacity, and maintenance status</div>
              </div>
              {canWrite && (
                <button className="btn btn-primary btn-sm" onClick={() => setAddVehicleOpen(true)}>
                  <Plus size={13} /> Register Vehicle
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Registration No</th>
                    <th>Type & Make</th>
                    <th>Seating Capacity</th>
                    <th>Assigned Route</th>
                    <th>Status</th>
                    {canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <b>{v.registrationNumber}</b>
                        {v.notes && <div className="t-caption">{v.notes}</div>}
                      </td>
                      <td>
                        {v.makeModel || 'Standard School Bus'}
                        <div className="t-caption">{v.vehicleType}</div>
                      </td>
                      <td>
                        <b>{v.capacity}</b> seats
                      </td>
                      <td>
                        {v.routes && v.routes.length > 0 ? (
                          v.routes.map((r: any) => <span key={r.id} className="badge b-neutral">{r.name}</span>)
                        ) : (
                          <span style={{ color: 'var(--c-muted)' }}>Idle / Standby</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${v.status === 'ACTIVE' ? 'b-success' : v.status === 'MAINTENANCE' ? 'b-warning' : 'b-neutral'}`}>
                          {v.status}
                        </span>
                      </td>
                      {canWrite && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                              title={v.status === 'ACTIVE' ? 'Mark in Maintenance' : 'Set Active'}
                            >
                              <Wrench size={13} /> {v.status === 'ACTIVE' ? 'Maintenance' : 'Activate'}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditVehicleModal(v)}
                              title="Edit Vehicle"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STUDENT ALLOCATIONS */}
      {/* ========================================================================= */}
      {tab === 'STUDENTS' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Student Transport Allocations</div>
                <div className="card-sub">Active seat allocations, stops, trip types, and fee invoices</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--c-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: 30, height: 34, width: 220, fontSize: 13 }}
                    placeholder="Search child or route..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                {canWrite && (
                  <button className="btn btn-primary btn-sm" onClick={() => setAssignStudentOpen(true)}>
                    <UserPlus size={13} /> Assign Student
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Student Identity</th>
                    <th>Route</th>
                    <th>Pickup Stop</th>
                    <th>Drop Stop</th>
                    <th>Trip Type</th>
                    <th>Monthly Fee</th>
                    <th>Status</th>
                    {canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => {
                    const fullName = `${a.student.firstName} ${a.student.lastName || ''}`
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'var(--c-surface-hover, #f3f4f6)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {getAvatarInitials(fullName)}
                            </div>
                            <div>
                              <Link
                                href={`/app/students/${a.student.id}`}
                                style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
                                className="hover:underline"
                              >
                                {fullName}
                              </Link>
                              <div className="t-caption">{a.student.admissionNo} · {a.student.currentClassroom?.name || 'Classroom'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <b>{a.route.name}</b>
                          <div className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>{a.route.code}</div>
                        </td>
                        <td>{a.pickupStop.name} ({a.pickupStop.morningPickupTime})</td>
                        <td>{a.dropStop.name} ({a.dropStop.eveningDropTime})</td>
                        <td><span className="badge b-neutral">{a.tripType}</span></td>
                        <td>{a.monthlyFeeCents > 0 ? inr(a.monthlyFeeCents) : 'Included'}</td>
                        <td><span className={`badge ${a.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{a.status}</span></td>
                        {canWrite && (
                          <td style={{ textAlign: 'right' }}>
                            {a.status === 'ACTIVE' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--c-danger, #dc2626)' }}
                                onClick={() => setCancelAssignmentModal(a)}
                                title="Discontinue Transport Service"
                              >
                                <UserX size={13} /> Cancel
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {filteredAssignments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                        <EmptyState icon={<Users size={32} />} title="No allocations found" message="Allocate seats to enrolled students." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SAFETY & INCIDENTS */}
      {/* ========================================================================= */}
      {tab === 'INCIDENTS' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Transport Safety & Incident Log</div>
                <div className="card-sub">Operations exceptions, emergency follow-ups, and resolution tracking</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  className="input"
                  style={{ width: 150, padding: '4px 8px', height: 32, fontSize: 13 }}
                  value={incidentSeverityFilter}
                  onChange={(e) => setIncidentSeverityFilter(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
                {canOperate && (
                  <button className="btn btn-danger btn-sm" onClick={() => setReportIncidentOpen(true)}>
                    <AlertOctagon size={13} /> Report Incident
                  </button>
                )}
              </div>
            </div>

            {filteredIncidents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? '1.5px solid var(--c-danger, #dc2626)' : '1px solid var(--border)',
                      background: inc.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.04)' : 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${inc.severity === 'CRITICAL' ? 'b-danger' : inc.severity === 'HIGH' ? 'b-orange' : 'b-warning'}`}>
                          {inc.severity}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{inc.title}</span>
                        <span className="badge b-neutral">{inc.category}</span>
                        {(inc.severity === 'HIGH' || inc.severity === 'CRITICAL') && (
                          <span className="badge b-danger">OPERATIONS ESCALATED</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${inc.status === 'RESOLVED' ? 'b-success' : 'b-info'}`}>{inc.status}</span>
                        {canOperate && inc.status !== 'RESOLVED' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setResolveIncidentModal(inc)}>
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--foreground)', opacity: 0.85, margin: '8px 0' }}>{inc.description}</p>

                    {inc.actionTaken && (
                      <div style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, marginBottom: 6 }}>
                        <b>Action Taken:</b> {inc.actionTaken}
                      </div>
                    )}

                    <div className="t-caption" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span>Reported by: <b>{inc.reportedByName}</b></span>
                      <span>Date: <b>{fmtDate(inc.createdAt)}</b></span>
                      {inc.vehicle && <span>Bus: <b>{inc.vehicle.registrationNumber}</b></span>}
                      {inc.student && <span>Student: <b>{inc.student.firstName} {inc.student.lastName || ''}</b></span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<ShieldCheck size={36} />} title="Zero Incidents On Record" message="All transit operations are running cleanly without safety flags." />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAFE DROP & MULTI-GUARDIAN VERIFICATION */}
      {/* ========================================================================= */}
      <Modal
        open={!!dropVerifyOpen}
        onClose={() => { setDropVerifyOpen(null); setDropError(null); }}
        title="Child Handover & PIN Verification"
        subtitle="Mandatory preschool safety release protocol"
        icon={<ShieldCheck size={20} />}
      >
        {dropVerifyOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Child Profile Banner */}
            <div style={{ padding: 12, background: 'rgba(5, 150, 105, 0.08)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--c-success, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {getAvatarInitials(`${dropVerifyOpen.student.firstName} ${dropVerifyOpen.student.lastName || ''}`)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {dropVerifyOpen.student.firstName} {dropVerifyOpen.student.lastName || ''}
                </div>
                <div className="t-caption">Admission No: {dropVerifyOpen.student.admissionNo} · Stop: <b>{dropVerifyOpen.stop.name}</b></div>
              </div>
            </div>

            {/* Error / Unauthorized Block Alert Banner */}
            {dropError && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1.5px solid var(--c-danger, #dc2626)',
                  color: 'var(--c-danger, #dc2626)',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <AlertOctagon size={16} /> RELEASE STRICTLY BLOCKED
                </div>
                <div style={{ marginTop: 4 }}>{dropError}</div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                  An Emergency Safety Follow-Up has been logged for the Principal. Do not release the child.
                </div>
              </div>
            )}

            {/* Guardian Selection */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Collecting Adult Present at Stop:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dropVerifyOpen.student.guardians?.map((g: any) => {
                  const isSelected = selectedGuardianId === g.guardian.id
                  const isAuthorized = g.canPickup
                  return (
                    <label
                      key={g.guardian.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="selectedGuardian"
                          value={g.guardian.id}
                          checked={isSelected}
                          onChange={() => { setSelectedGuardianId(g.guardian.id); setDropError(null); }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{g.guardian.fullName}</div>
                          <div className="t-caption">{g.relationship || g.guardian.relationship} · {g.guardian.phone || 'No phone'}</div>
                        </div>
                      </div>
                      <span className={`badge ${isAuthorized ? 'b-success' : 'b-danger'}`}>
                        {isAuthorized ? 'Authorized' : 'REVOKED / UNAUTHORIZED'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Field label="Guardian 4-Digit Security PIN" required helper="Enter the collecting adult's verification PIN">
              <input
                type="password"
                className="input"
                placeholder="••••"
                value={pickupPin}
                onChange={(e) => setPickupPin(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDropVerifyOpen(null)}>Cancel</button>
              <button type="button" className="btn btn-success" onClick={handleDropConfirm} disabled={busy}>
                Verify & Release Child
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DISPATCH TRIP */}
      {/* ========================================================================= */}
      <Modal open={startTripOpen} onClose={() => setStartTripOpen(false)} title="Dispatch Daily Trip" subtitle="Dynamic manifest populated from active seat allocations" icon={<Clock size={20} />}>
        <form onSubmit={handleStartTrip}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Select Route" required>
              <select name="routeId" className="input" required>
                <option value="">-- Choose Route --</option>
                {routes.filter((r) => r.status === 'ACTIVE').map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code}) · {r.activeStudentsCount} riders</option>
                ))}
              </select>
            </Field>
            <Field label="Trip Run" required>
              <select name="tripType" className="input" defaultValue="MORNING">
                <option value="MORNING">Morning Pickup Run (Home to Campus)</option>
                <option value="EVENING">Evening Drop Run (Campus to Home)</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStartTripOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Dispatch Run</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SUBSTITUTE VEHICLE */}
      {/* ========================================================================= */}
      <Modal
        open={!!substituteVehicleModal}
        onClose={() => setSubstituteVehicleModal(null)}
        title="Substitute Vehicle In-Flight"
        subtitle="Preserves audit trail and updates active trip"
        icon={<Bus size={20} />}
      >
        {substituteVehicleModal && (
          <form onSubmit={handleSubstituteVehicle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Current Bus: <b>{substituteVehicleModal.vehicle.registrationNumber}</b> ({substituteVehicleModal.route.name})
              </div>
              <Field label="Select Standby Replacement Bus" required>
                <select name="vehicleId" className="input" required>
                  <option value="">-- Select Active Vehicle --</option>
                  {vehicles
                    .filter((v) => v.status === 'ACTIVE' && v.id !== substituteVehicleModal.vehicle.id)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.makeModel || 'Standby'} · Cap: {v.capacity})
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Reason for In-Flight Substitution" required>
                <input type="text" name="reason" className="input" placeholder="Flat tyre / AC compressor failure" required />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSubstituteVehicleModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-warning" disabled={busy}>Confirm Substitution</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SUBSTITUTE DRIVER */}
      {/* ========================================================================= */}
      <Modal
        open={!!substituteDriverModal}
        onClose={() => setSubstituteDriverModal(null)}
        title="Substitute Driver In-Flight"
        subtitle="Select from active canonical HR staff profiles"
        icon={<UserCheck size={20} />}
      >
        {substituteDriverModal && (
          <form onSubmit={handleSubstituteDriver}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Current Driver: <b>{substituteDriverModal.driverProfile.user.fullName}</b> ({substituteDriverModal.route.name})
              </div>
              <Field label="Select Replacement Driver (from HR Staff Directory)" required>
                <select name="driverProfileId" className="input" required>
                  <option value="">-- Select Eligible Driver --</option>
                  {eligibleStaff
                    .filter((s) => s.id !== substituteDriverModal.driverProfile.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.designation} · {s.employeeCode})
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Reason for In-Flight Substitution" required>
                <input type="text" name="reason" className="input" placeholder="Driver medical indisposition / shift handover" required />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSubstituteDriverModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-warning" disabled={busy}>Confirm Substitution</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REPORT DELAY */}
      {/* ========================================================================= */}
      <Modal open={!!delayTripOpen} onClose={() => setDelayTripOpen(null)} title="Broadcast Trip Delay" subtitle="Alerts affected parents on their timelines" icon={<AlertTriangle size={20} />}>
        {delayTripOpen && (
          <form onSubmit={handleRecordDelay}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Route: <b>{delayTripOpen.route.name}</b> · Bus: <b>{delayTripOpen.vehicle.registrationNumber}</b>
              </div>
              <Field label="Estimated Delay (Minutes)" required>
                <input type="number" name="delayMinutes" defaultValue={delayTripOpen.delayMinutes || 15} min={1} className="input" required />
              </Field>
              <Field label="Preset Delay Reason" required>
                <select
                  className="input"
                  name="reason"
                  defaultValue={delayTripOpen.delayReason || 'Heavy traffic congestion'}
                >
                  <option value="Heavy traffic congestion">Heavy traffic congestion</option>
                  <option value="Road work and diversion">Road work and diversion</option>
                  <option value="Vehicle breakdown / puncture">Vehicle breakdown / puncture</option>
                  <option value="Severe weather / rain">Severe weather / rain</option>
                  <option value="Student pickup delay at stop">Student pickup delay at stop</option>
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDelayTripOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-warning" disabled={busy}>Broadcast Delay Alert</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN STUDENT TO ROUTE */}
      {/* ========================================================================= */}
      <Modal open={assignStudentOpen} onClose={() => setAssignStudentOpen(false)} title="Allocate Student Transport Seat" subtitle="Capacity guarded assignment & finance invoice generation" icon={<UserPlus size={20} />}>
        <form onSubmit={handleAssignStudent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Select Enrolled Student" required>
              <select name="studentId" className="input" required>
                <option value="">-- Choose Student --</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName || ''} ({s.admissionNo} · {s.classroomName || 'Classroom'})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Select Route" required>
              <select
                name="routeId"
                className="input"
                required
                onChange={(e) => {
                  const r = routes.find((rt) => rt.id === e.target.value)
                  // triggers stop dropdown re-render
                }}
              >
                <option value="">-- Choose Route --</option>
                {routes.filter((r) => r.status === 'ACTIVE').map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) · {r.availableCapacity} seats free of {r.vehicle?.capacity}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Pickup Stop" required>
                <select name="pickupStopId" className="input" required>
                  <option value="">-- Pickup Stop --</option>
                  {routes.flatMap((r) => r.stops).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.morningPickupTime})</option>
                  ))}
                </select>
              </Field>
              <Field label="Drop Stop" required>
                <select name="dropStopId" className="input" required>
                  <option value="">-- Drop Stop --</option>
                  {routes.flatMap((r) => r.stops).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.eveningDropTime})</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Trip Operational Run">
                <select name="tripType" className="input" defaultValue="TWO_WAY">
                  <option value="TWO_WAY">Two-Way (Pickup & Drop)</option>
                  <option value="MORNING_ONLY">Morning Only</option>
                  <option value="EVENING_ONLY">Evening Only</option>
                </select>
              </Field>
              <Field label="Monthly Fee (₹)">
                <input type="number" name="monthlyFee" defaultValue={2500} min={0} className="input" />
              </Field>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
              <input type="checkbox" name="generateFeeInvoice" defaultChecked />
              <span>Automatically generate Finance Invoice under <b>TRANSPORT</b> Fee Head</span>
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAssignStudentOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Allocate Seat</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CANCEL TRANSPORT ALLOCATION */}
      {/* ========================================================================= */}
      <Modal open={!!cancelAssignmentModal} onClose={() => setCancelAssignmentModal(null)} title="Cancel Transport Allocation" subtitle="Releases vehicle seat and logs timeline event" icon={<UserX size={20} />}>
        {cancelAssignmentModal && (
          <form onSubmit={handleCancelAssignment}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Discontinuing transport for <b>{cancelAssignmentModal.student.firstName} {cancelAssignmentModal.student.lastName || ''}</b> from Route <b>{cancelAssignmentModal.route.name}</b>.
              </div>
              <Field label="Cancellation Reason" required helper="Recorded in audit trail and student timeline">
                <input type="text" name="reason" className="input" placeholder="Parent requested withdrawal / relocated" required />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setCancelAssignmentModal(null)}>Keep Active</button>
              <button type="submit" className="btn btn-danger" disabled={busy}>Discontinue Service</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD VEHICLE */}
      {/* ========================================================================= */}
      <Modal open={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} title="Register Vehicle" subtitle="Fleet registration, capacity, and type" icon={<Bus size={20} />}>
        <form onSubmit={handleCreateVehicle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Registration Number" required helper="e.g. MH-12-AB-1234">
              <input type="text" name="registrationNumber" className="input" placeholder="MH-12-AB-1234" required />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Capacity (Seats)" required>
                <input type="number" name="capacity" defaultValue={20} min={1} className="input" required />
              </Field>
              <Field label="Vehicle Type">
                <select name="vehicleType" className="input" defaultValue="BUS">
                  <option value="BUS">School Bus</option>
                  <option value="MINI_BUS">Mini Bus</option>
                  <option value="VAN">Van</option>
                </select>
              </Field>
            </div>
            <Field label="Make & Model">
              <input type="text" name="makeModel" className="input" placeholder="Force Traveller / Eicher Starline" />
            </Field>
            <Field label="Compliance & Safety Notes">
              <input type="text" name="notes" className="input" placeholder="Speed governor installed, fire extinguisher checked" />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAddVehicleOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Register Vehicle</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT VEHICLE */}
      {/* ========================================================================= */}
      <Modal open={!!editVehicleModal} onClose={() => setEditVehicleModal(null)} title="Edit Vehicle" subtitle="Update fleet specifications" icon={<Edit3 size={20} />}>
        {editVehicleModal && (
          <form onSubmit={handleUpdateVehicle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Vehicle: <b>{editVehicleModal.registrationNumber}</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Capacity (Seats)" required>
                  <input type="number" name="capacity" defaultValue={editVehicleModal.capacity} min={1} className="input" required />
                </Field>
                <Field label="Operational Status">
                  <select name="status" className="input" defaultValue={editVehicleModal.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </Field>
              </div>
              <Field label="Make & Model">
                <input type="text" name="makeModel" defaultValue={editVehicleModal.makeModel || ''} className="input" />
              </Field>
              <Field label="Notes">
                <input type="text" name="notes" defaultValue={editVehicleModal.notes || ''} className="input" />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditVehicleModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD ROUTE */}
      {/* ========================================================================= */}
      <Modal open={addRouteOpen} onClose={() => setAddRouteOpen(false)} title="Create Bus Route" subtitle="Route path, vehicle, driver & stops" icon={<MapPin size={20} />}>
        <form onSubmit={handleCreateRoute}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <Field label="Route Code" required>
                <input type="text" name="code" className="input" placeholder="RT-01" required />
              </Field>
              <Field label="Route Name" required>
                <input type="text" name="name" className="input" placeholder="Kothrud - Campus Express" required />
              </Field>
            </div>
            <Field label="Assign Vehicle">
              <select name="vehicleId" className="input">
                <option value="">-- Select Available Vehicle --</option>
                {vehicles.filter((v) => v.status === 'ACTIVE').map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} (Cap: {v.capacity})</option>
                ))}
              </select>
            </Field>
            <Field label="Assign Driver (from HR Staff Directory)">
              <select name="driverProfileId" className="input">
                <option value="">-- Select Eligible Driver --</option>
                {eligibleStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.designation} · {s.employeeCode})</option>
                ))}
              </select>
            </Field>
            <div className="card" style={{ padding: 12, background: 'var(--c-surface-hover)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Ordered Stops Sequence</div>
              <Field label="Stop 1 Name (e.g. Green Valley Circle)">
                <input type="text" name="stop1Name" className="input" placeholder="Stop 1" required />
              </Field>
              <Field label="Stop 2 Name (e.g. Sunrise Enclave)">
                <input type="text" name="stop2Name" className="input" placeholder="Stop 2" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAddRouteOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save Route</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT ROUTE */}
      {/* ========================================================================= */}
      <Modal open={!!editRouteModal} onClose={() => setEditRouteModal(null)} title="Edit Bus Route" subtitle="Configure vehicle, driver, and attendants" icon={<Edit3 size={20} />}>
        {editRouteModal && (
          <form onSubmit={handleUpdateRoute}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Route Code: <b>{editRouteModal.code}</b>
              </div>
              <Field label="Route Name" required>
                <input type="text" name="name" defaultValue={editRouteModal.name} className="input" required />
              </Field>
              <Field label="Description">
                <input type="text" name="description" defaultValue={editRouteModal.description || ''} className="input" />
              </Field>
              <Field label="Assigned Vehicle">
                <select name="vehicleId" defaultValue={editRouteModal.vehicleId || ''} className="input">
                  <option value="">-- Unassigned --</option>
                  {vehicles.filter((v) => v.status === 'ACTIVE' || v.id === editRouteModal.vehicleId).map((v) => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} (Cap: {v.capacity})</option>
                  ))}
                </select>
              </Field>
              <Field label="Assigned Driver">
                <select name="driverProfileId" defaultValue={editRouteModal.driverProfileId || ''} className="input">
                  <option value="">-- Unassigned --</option>
                  {eligibleStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.designation})</option>
                  ))}
                </select>
              </Field>
              <Field label="Route Status">
                <select name="status" defaultValue={editRouteModal.status} className="input">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditRouteModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>Save Route</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REPORT INCIDENT */}
      {/* ========================================================================= */}
      <Modal open={reportIncidentOpen} onClose={() => { setReportIncidentOpen(false); setIncidentTripPrefill(null); }} title="Report Transit Safety Incident" subtitle="Auto-escalates HIGH & CRITICAL severity to Operations" icon={<AlertOctagon size={20} />}>
        <form onSubmit={handleReportIncident}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {incidentTripPrefill && (
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Linked Run: <b>{incidentTripPrefill.route.name}</b> ({incidentTripPrefill.vehicle.registrationNumber})
                <input type="hidden" name="tripId" value={incidentTripPrefill.id} />
                <input type="hidden" name="vehicleId" value={incidentTripPrefill.vehicle.id} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Severity Level" required>
                <select name="severity" className="input" defaultValue="MEDIUM">
                  <option value="LOW">LOW — Minor delay / notification</option>
                  <option value="MEDIUM">MEDIUM — Operational disruption</option>
                  <option value="HIGH">HIGH — Safety risk (Escalates to Principal)</option>
                  <option value="CRITICAL">CRITICAL — Emergency (Immediate Escalation)</option>
                </select>
              </Field>
              <Field label="Category" required>
                <select name="category" className="input" defaultValue="OTHER">
                  <option value="DELAY">DELAY</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="BEHAVIOR">BEHAVIOR</option>
                  <option value="ROUTE_OBSTRUCTION">ROUTE_OBSTRUCTION</option>
                  <option value="ACCIDENT">ACCIDENT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </Field>
            </div>
            <Field label="Incident Title" required>
              <input type="text" name="title" className="input" placeholder="Child unbuckled seatbelt / minor collision" required />
            </Field>
            <Field label="Detailed Description" required>
              <textarea name="description" rows={3} className="input" placeholder="Explain the exact operational circumstances..." required />
            </Field>
            <Field label="Immediate Action Taken">
              <input type="text" name="actionTaken" className="input" placeholder="Attendant intervened and escorted child safely" />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setReportIncidentOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={busy}>Submit Incident Report</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESOLVE / UPDATE INCIDENT */}
      {/* ========================================================================= */}
      <Modal open={!!resolveIncidentModal} onClose={() => setResolveIncidentModal(null)} title="Resolve Transport Incident" subtitle="Closes linked Operations safety follow-up" icon={<CheckCircle2 size={20} />}>
        {resolveIncidentModal && (
          <form onSubmit={handleResolveIncident}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 10, background: 'var(--c-surface-hover)', borderRadius: 8, fontSize: 13 }}>
                Incident: <b>{resolveIncidentModal.title}</b> ({resolveIncidentModal.severity})
              </div>
              <Field label="Update Status" required>
                <select name="status" className="input" defaultValue="RESOLVED">
                  <option value="RESOLVED">RESOLVED — Close Incident & Follow-Up</option>
                  <option value="INVESTIGATING">INVESTIGATING — Under Review</option>
                </select>
              </Field>
              <Field label="Action Taken / Resolution Summary" required>
                <textarea
                  name="actionTaken"
                  rows={3}
                  className="input"
                  defaultValue={resolveIncidentModal.actionTaken || ''}
                  placeholder="Details of corrective actions taken..."
                  required
                />
              </Field>
              <Field label="Audit Reason (Optional)">
                <input type="text" name="correctionReason" className="input" placeholder="Reviewed with driver and closed by Principal" />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setResolveIncidentModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={busy}>Save Resolution</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

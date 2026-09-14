'use client'

import React, { useCallback, useEffect, useState } from 'react'
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

  // Modal States
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)
  const [addRouteOpen, setAddRouteOpen] = useState(false)
  const [assignStudentOpen, setAssignStudentOpen] = useState(false)
  const [startTripOpen, setStartTripOpen] = useState(false)
  const [dropVerifyOpen, setDropVerifyOpen] = useState<any>(null)
  const [reportIncidentOpen, setReportIncidentOpen] = useState(false)
  const [delayTripOpen, setDelayTripOpen] = useState<any>(null)
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

  useEffect(() => {
    loadDashboard()
    loadVehicles()
    loadRoutes()
    loadAssignments()
    loadTrips()
    loadIncidents()
    loadStaff()
  }, [loadDashboard, loadVehicles, loadRoutes, loadAssignments, loadTrips, loadIncidents, loadStaff])

  // 2. Actions: Create Vehicle
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

  // 3. Actions: Create Route
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
            { name: fd.get('stop1Name'), sequence: 1, morningPickupTime: '08:00', eveningDropTime: '15:15' },
            { name: fd.get('stop2Name'), sequence: 2, morningPickupTime: '08:15', eveningDropTime: '15:30' },
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

  // 4. Actions: Start Trip
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
        toast.success('Trip started with live student manifest!')
        setStartTripOpen(false)
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Failed to start trip', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error starting trip', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 5. Actions: Board Student
  const handleBoard = async (tripId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/v1/transport/trips/${tripId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Child boarded safely. Parent timeline updated!')
        loadTrips()
        loadDashboard()
      } else {
        toast.error('Boarding failed', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Error recording boarding', err.message)
    }
  }

  // 6. Actions: Drop Verification
  const handleDropConfirm = async () => {
    if (!dropVerifyOpen) return
    setBusy(true)
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
        toast.error('Pickup Denied', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Pickup Blocked', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 7. Actions: Record Delay
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
        toast.success('Trip delay recorded. Notification sent to affected parents!')
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

  return (
    <div className="page-shell">
      <PageHead
        title="Transport & Safety Operations"
        sub="Preschool child safety, bus routes, fleet, driver assignment, live trips, and authorized guardian drop verification"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { loadDashboard(); loadTrips(); }} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {canOperate && (
              <button className="btn btn-secondary" onClick={() => setStartTripOpen(true)}>
                <Clock size={15} /> Start Trip
              </button>
            )}
            {canWrite && (
              <button className="btn btn-primary" onClick={() => setAddRouteOpen(true)}>
                <Plus size={15} /> Add Route
              </button>
            )}
          </div>
        }
      />

      {/* Primary KPI Grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        <KpiTile
          label="Active Routes"
          value={metrics?.activeRoutes ?? 0}
          icon={<Bus size={18} />}
          iconClass="ic-purple"
        />
        <KpiTile
          label="Active Vehicles"
          value={metrics?.activeVehicles ?? 0}
          icon={<CheckCircle2 size={18} />}
          iconClass="ic-green"
          meta={metrics?.vehiclesInMaintenance ? `${metrics.vehiclesInMaintenance} in maintenance` : undefined}
        />
        <KpiTile
          label="Enrolled Children"
          value={metrics?.studentsUsingTransport ?? 0}
          icon={<Users size={18} />}
          iconClass="ic-blue"
        />
        <KpiTile
          label="Boarded Today"
          value={metrics?.childrenBoarded ?? 0}
          icon={<UserCheck size={18} />}
          iconClass="ic-cyan"
        />
        <KpiTile
          label="Safely Dropped"
          value={metrics?.childrenDropped ?? 0}
          icon={<ShieldCheck size={18} />}
          iconClass="ic-green"
        />
        <KpiTile
          label="Delayed Trips"
          value={metrics?.delayedTrips ?? 0}
          icon={<AlertTriangle size={18} />}
          iconClass="ic-orange"
        />
      </div>

      {/* Tabs Navigation */}
      <Segmented
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        options={[
          { key: 'OVERVIEW', label: 'Overview' },
          { key: 'TRIPS', label: `Today's Trips (${trips.length})` },
          { key: 'ROUTES', label: `Routes (${routes.length})` },
          { key: 'VEHICLES', label: `Fleet (${vehicles.length})` },
          { key: 'STUDENTS', label: `Allocations (${assignments.length})` },
          { key: 'INCIDENTS', label: `Safety & Incidents (${incidents.length})` },
        ]}
      />

      {/* TAB 1: OVERVIEW */}
      {tab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 16 }} className="dash-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Live Operational Trips Today</div>
                <div className="card-sub">Morning and evening bus runs in progress</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('TRIPS')}>
                View All Trips <ArrowRight size={13} />
              </button>
            </div>
            {trips.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trips.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--c-surface-hover, rgba(0,0,0,0.02))', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <b>{t.route.name}</b>
                        <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{t.route.code}</span>
                        <span className={`badge ${t.status === 'IN_PROGRESS' ? 'b-warning' : t.status === 'COMPLETED' ? 'b-success' : 'b-neutral'}`}>{t.status}</span>
                      </div>
                      <div className="t-caption" style={{ marginTop: 4 }}>
                        Bus: <b>{t.vehicle.registrationNumber}</b> · Driver: <b>{t.driverProfile.user.fullName}</b> · Type: {t.tripType}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {t.manifest.filter((m: any) => m.status === 'BOARDED' || m.status === 'DROPPED').length} / {t.manifest.length} Handled
                      </div>
                      {t.delayMinutes > 0 && (
                        <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 600 }}>
                          Delayed +{t.delayMinutes}m
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Bus size={36} />}
                title="No Trips Scheduled Today"
                message="Click 'Start Trip' to dispatch morning or evening school buses with live manifests."
                action={canOperate && <button className="btn btn-primary btn-sm" onClick={() => setStartTripOpen(true)}>Start Trip</button>}
              />
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Fleet Readiness & Status</div>
                <div className="card-sub">Active buses and maintenance checks</div>
              </div>
              {canWrite && (
                <button className="btn btn-ghost btn-sm" onClick={() => setAddVehicleOpen(true)}>
                  <Plus size={13} /> Add Bus
                </button>
              )}
            </div>
            {vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vehicles.slice(0, 5).map((v) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <b>{v.registrationNumber}</b> ({v.makeModel || 'School Bus'})
                      <div className="t-caption">Capacity: {v.capacity} seats · Type: {v.vehicleType}</div>
                    </div>
                    <span className={`badge ${v.status === 'ACTIVE' ? 'b-success' : v.status === 'MAINTENANCE' ? 'b-warning' : 'b-neutral'}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Bus size={32} />} title="No Vehicles Registered" message="Register preschool buses or vans to assign to routes." />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TODAY'S TRIPS & LIVE MANIFESTS */}
      {tab === 'TRIPS' && (
        <div style={{ marginTop: 16 }}>
          {trips.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {trips.map((t) => (
                <div key={t.id} className="card">
                  <div className="card-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 className="t-h2">{t.route.name}</h3>
                        <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{t.route.code}</span>
                        <span className={`badge ${t.tripType === 'MORNING' ? 'b-primary' : 'b-purple'}`}>{t.tripType} TRIP</span>
                        <span className={`badge ${t.status === 'IN_PROGRESS' ? 'b-warning' : t.status === 'COMPLETED' ? 'b-success' : 'b-neutral'}`}>{t.status}</span>
                      </div>
                      <div className="t-caption" style={{ marginTop: 4 }}>
                        Bus: <b>{t.vehicle.registrationNumber}</b> (Cap: {t.vehicle.capacity}) · Driver: <b>{t.driverProfile.user.fullName}</b> · Date: {fmtDate(t.tripDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {t.status === 'IN_PROGRESS' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => setDelayTripOpen(t)}>
                            <AlertTriangle size={13} /> Report Delay
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={async () => {
                              await fetch(`/api/v1/transport/trips/${t.id}/complete`, { method: 'POST' })
                              toast.success('Trip completed!')
                              loadTrips()
                              loadDashboard()
                            }}
                          >
                            <CheckCircle2 size={13} /> Arrived / Complete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Student Manifest Table */}
                  <div style={{ overflowX: 'auto', marginTop: 12 }}>
                    <table className="table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Stop</th>
                          <th>Status</th>
                          <th>Action Timestamp</th>
                          <th style={{ textAlign: 'right' }}>Operational Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.manifest.map((item: any) => (
                          <tr key={item.id}>
                            <td>
                              <b>{item.student.firstName} {item.student.lastName || ''}</b>
                              <div className="t-caption">{item.student.admissionNo}</div>
                            </td>
                            <td>
                              {item.stop.name}
                              <div className="t-caption">Seq: {item.stop.sequence}</div>
                            </td>
                            <td>
                              <span className={`badge ${item.status === 'BOARDED' || item.status === 'DROPPED' ? 'b-success' : item.status === 'ABSENT' ? 'b-danger' : 'b-warning'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              {item.boardedAt ? fmtDate(item.boardedAt) : item.droppedAt ? fmtDate(item.droppedAt) : 'Pending'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {t.status === 'IN_PROGRESS' && (
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
                                      }}
                                    >
                                      <KeyRound size={13} /> Verify & Drop
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
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
                title="No Active Trips"
                message="Start an operational morning or evening trip to view live manifests."
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROUTES & STOPS */}
      {tab === 'ROUTES' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Configured Bus Routes</div>
                <div className="card-sub">Stops, sequences, assigned vehicle, driver and attendant</div>
              </div>
              {canWrite && (
                <button className="btn btn-primary btn-sm" onClick={() => setAddRouteOpen(true)}>
                  <Plus size={13} /> Create Route
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver & Attendant</th>
                    <th>Stops Sequence</th>
                    <th>Students</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.name}</b>
                        <div className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</div>
                      </td>
                      <td>
                        {r.vehicle ? (
                          <div>
                            <b>{r.vehicle.registrationNumber}</b>
                            <div className="t-caption">Cap: {r.vehicle.capacity} ({r.availableCapacity} seats free)</div>
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
                        <b>{r.activeStudentsCount}</b> children
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                        <EmptyState icon={<MapPin size={32} />} title="No routes found" message="Create routes and stops to start assigning children." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FLEET (VEHICLES) */}
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
                  <Plus size={13} /> Add Vehicle
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
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <b>{v.registrationNumber}</b>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ALLOCATIONS */}
      {tab === 'STUDENTS' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Student Transport Allocations</div>
                <div className="card-sub">Active enrollments across routes and designated stops</div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assigned Route</th>
                    <th>Pickup Stop</th>
                    <th>Drop Stop</th>
                    <th>Trip Type</th>
                    <th>Fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.student.firstName} {a.student.lastName || ''}</b>
                        <div className="t-caption">{a.student.admissionNo} · {a.student.currentClassroom?.name || 'Classroom'}</div>
                      </td>
                      <td>
                        <b>{a.route.name}</b>
                        <div className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>{a.route.code}</div>
                      </td>
                      <td>{a.pickupStop.name} ({a.pickupStop.morningPickupTime})</td>
                      <td>{a.dropStop.name} ({a.dropStop.eveningDropTime})</td>
                      <td><span className="badge b-neutral">{a.tripType}</span></td>
                      <td>{a.monthlyFeeCents > 0 ? inr(a.monthlyFeeCents) : 'Included'}</td>
                      <td><span className="badge b-success">{a.status}</span></td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
                        <EmptyState icon={<Users size={32} />} title="No student allocations" message="Assign students from the student 360 or user directory." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SAFETY & INCIDENTS */}
      {tab === 'INCIDENTS' && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Transport Safety & Incident Log</div>
                <div className="card-sub">Real-time alerts, breakdown logs, and security follow-ups</div>
              </div>
            </div>
            {incidents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incidents.map((inc) => (
                  <div key={inc.id} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--c-surface-hover)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${inc.severity === 'CRITICAL' ? 'b-danger' : inc.severity === 'HIGH' ? 'b-orange' : 'b-warning'}`}>{inc.severity}</span>
                        <b>{inc.title}</b>
                        <span className="badge b-neutral">{inc.category}</span>
                      </div>
                      <span className="badge b-info">{inc.status}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--c-muted)', margin: '6px 0' }}>{inc.description}</p>
                    <div className="t-caption">Reported by {inc.reportedByName} · {fmtDate(inc.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<ShieldCheck size={36} />} title="No Incidents Reported" message="Zero transport safety incidents currently on record." />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD VEHICLE */}
      {/* ========================================================================= */}
      <Modal open={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} title="Register Vehicle" subtitle="Fleet vehicle registration and capacity" icon={<Bus size={20} />}>
        <form onSubmit={handleCreateVehicle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Registration Number" required helper="e.g. MH-12-AB-1234">
              <input type="text" name="registrationNumber" className="input" placeholder="MH-12-AB-1234" required />
            </Field>
            <Field label="Capacity (Seats)" required helper="Maximum authorized child passengers">
              <input type="number" name="capacity" defaultValue={20} min={1} className="input" required />
            </Field>
            <Field label="Make & Model">
              <input type="text" name="makeModel" className="input" placeholder="Force Traveller / Eicher Starline" />
            </Field>
            <Field label="Vehicle Type">
              <select name="vehicleType" className="input" defaultValue="BUS">
                <option value="BUS">School Bus</option>
                <option value="MINI_BUS">Mini Bus</option>
                <option value="VAN">Van</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAddVehicleOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Register Vehicle</button>
          </div>
        </form>
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
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Ordered Stops</div>
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
      {/* MODAL: START TRIP */}
      {/* ========================================================================= */}
      <Modal open={startTripOpen} onClose={() => setStartTripOpen(false)} title="Start Operational Trip" subtitle="Generates dynamic manifest from active student assignments" icon={<Clock size={20} />}>
        <form onSubmit={handleStartTrip}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Select Route" required>
              <select name="routeId" className="input" required>
                <option value="">-- Choose Route --</option>
                {routes.filter((r) => r.status === 'ACTIVE').map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code}) · {r.activeStudentsCount} students</option>
                ))}
              </select>
            </Field>
            <Field label="Trip Operational Run" required>
              <select name="tripType" className="input" defaultValue="MORNING">
                <option value="MORNING">Morning (Home to School Pickup & Arrival)</option>
                <option value="EVENING">Evening (School to Home Drop & Handover)</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStartTripOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Start Run</button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DROP GUARDIAN VERIFICATION */}
      {/* ========================================================================= */}
      <Modal open={!!dropVerifyOpen} onClose={() => setDropVerifyOpen(null)} title="Guardian Handover Verification" subtitle="Child safety drop authorization" icon={<ShieldCheck size={20} />}>
        {dropVerifyOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: 'rgba(5, 150, 105, 0.08)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Child: {dropVerifyOpen.student.firstName} {dropVerifyOpen.student.lastName || ''}</div>
              <div className="t-caption">Admission No: {dropVerifyOpen.student.admissionNo} · Stop: {dropVerifyOpen.stop.name}</div>
            </div>

            <Field label="Select Pickup Guardian Present at Stop" required helper="Only authorized guardians linked to this child will pass">
              <select
                className="input"
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
              >
                {dropVerifyOpen.student.guardians?.map((g: any) => (
                  <option key={g.guardian.id} value={g.guardian.id}>
                    {g.guardian.fullName} ({g.guardian.relationship}) {g.guardian.pickupPin ? '· [PIN Protected]' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Guardian Security PIN (If configured)" helper="Enter the 4-digit pickup PIN for verification">
              <input
                type="password"
                className="input"
                placeholder="4-digit PIN"
                value={pickupPin}
                onChange={(e) => setPickupPin(e.target.value)}
                maxLength={6}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDropVerifyOpen(null)}>Cancel</button>
              <button type="button" className="btn btn-success" onClick={handleDropConfirm} disabled={busy}>
                Confirm Handover
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REPORT DELAY */}
      {/* ========================================================================= */}
      <Modal open={!!delayTripOpen} onClose={() => setDelayTripOpen(null)} title="Broadcast Trip Delay" subtitle="Alerts affected parents on their timelines" icon={<AlertTriangle size={20} />}>
        <form onSubmit={handleRecordDelay}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Delay (Minutes)" required>
              <input type="number" name="delayMinutes" defaultValue={15} min={1} className="input" required />
            </Field>
            <Field label="Reason for Delay" required>
              <input type="text" name="reason" className="input" placeholder="Heavy traffic on Highway / Flat tyre" required />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setDelayTripOpen(null)}>Cancel</button>
            <button type="submit" className="btn btn-warning" disabled={busy}>Broadcast Delay</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

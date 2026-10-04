import * as fs from 'fs'
import * as path from 'path'

const filePath = path.resolve('src/app/app/transport/TransportClient.tsx')
let content = fs.readFileSync(filePath, 'utf-8')

// Normalize to LF
content = content.replace(/\r\n/g, '\n')

// 1. Add LayoutDashboard, Truck, GraduationCap to lucide-react imports if missing
if (!content.includes('LayoutDashboard')) {
  content = content.replace(
    "import {\n  Bus,",
    "import {\n  LayoutDashboard,\n  Truck,\n  GraduationCap,\n  Bus,"
  )
}

// 2. Add handleRefreshAll before the return statement
const refreshHandlerCode = `  const handleRefreshAll = () => {
    loadDashboard()
    loadTrips()
    loadVehicles()
    loadRoutes()
    loadIncidents()
    loadMyChildren()
    loadTeacherData()
    loadAuthorizations()
    loadSecurityLogs()
  }

  return (`

if (!content.includes('const handleRefreshAll =')) {
  content = content.replace('  return (', refreshHandlerCode)
}

// 3. Update PageHead with badge M09 and context-sensitive actions
const pageHeadStart = `<PageHead\n        title="Transport & Child Safety Operations"`
const pageHeadEnd = `actions={\n          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>`

const newPageHeadBlock = `<PageHead
        title="Transport & Child Safety Operations"
        badge={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '9999px',
              background: 'var(--preone-primary-soft, #f3eeff)',
              color: 'var(--preone-primary, #7c3aed)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              marginLeft: 8,
              letterSpacing: '0.04em',
            }}
          >
            M09
          </span>
        }
        sub="Fleet management, daily transit runs, student manifest verification, authorized multi-guardian drop safety, and real-time operations escalation"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(tab === 'OVERVIEW' || tab === 'TRIPS') && canOperate && (
              <button className="btn btn-primary" onClick={() => setStartTripOpen(true)}>
                <Clock size={15} /> Dispatch Trip
              </button>
            )}
            {tab === 'PARENT' && (
              <button className="btn btn-primary" onClick={() => setAddAuthOpen(true)}>
                <Plus size={15} /> Request Alternate Pickup
              </button>
            )}
            {tab === 'DRIVER' && (
              <button className="btn btn-primary" onClick={() => setTab('SCANNER')}>
                <QrCode size={15} /> Bus Check-In QR
              </button>
            )}
            {tab === 'TEACHER' && (
              <button className="btn btn-primary" onClick={() => toast.info('Review pending student arrivals below and confirm')}>
                <CheckCircle2 size={15} /> Verify Arrivals
              </button>
            )}
            {tab === 'ROUTES' && canWrite && (
              <button className="btn btn-primary" onClick={() => setAddRouteOpen(true)}>
                <Plus size={15} /> Add Route
              </button>
            )}
            {tab === 'VEHICLES' && canWrite && (
              <button className="btn btn-primary" onClick={() => setAddVehicleOpen(true)}>
                <Plus size={15} /> Register Vehicle
              </button>
            )}
            {tab === 'STUDENTS' && canWrite && (
              <button className="btn btn-primary" onClick={() => setAssignStudentOpen(true)}>
                <UserPlus size={15} /> Allocate Seat
              </button>
            )}
            {tab === 'AUTHORIZATIONS' && (
              <button className="btn btn-primary" onClick={() => setAddAuthOpen(true)}>
                <Plus size={15} /> Request Authorization
              </button>
            )}
            {tab === 'SECURITY' && canOperate && (
              <button className="btn btn-danger" onClick={() => setManualOverrideModal({})}>
                <AlertTriangle size={15} /> Record Override
              </button>
            )}
            {tab === 'INCIDENTS' && canOperate && (
              <button className="btn btn-danger" onClick={() => setReportIncidentOpen(true)}>
                <AlertOctagon size={15} /> Report Incident
              </button>
            )}
            {tab === 'SCANNER' && (
              <button className="btn btn-primary" onClick={() => setShowCameraScanner(true)}>
                <QrCode size={15} /> Open Camera Scanner
              </button>
            )}
            {tab === 'SEED' && (
              <button className="btn btn-primary" onClick={handleSeedDemoData} disabled={busy}>
                <Zap size={15} /> Seed Demo Data & QR
              </button>
            )}
            <button className="btn btn-outline" onClick={handleRefreshAll} disabled={loading} title="Reload live data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }`

// Find the exact PageHead slice
const phIdx = content.indexOf('<PageHead\n        title="Transport & Child Safety Operations"')
const phEndIdx = content.indexOf('/>\n\n      {/* ========================================================================= */}\n      {/* CRITICAL SAFETY ALERT CALLOUT')

if (phIdx !== -1 && phEndIdx !== -1) {
  content = content.slice(0, phIdx) + newPageHeadBlock + '\n      ' + content.slice(phEndIdx)
  console.log('Updated PageHead successfully!')
} else {
  console.error('Could not find PageHead slice:', { phIdx, phEndIdx })
}

// 4. Replace metric strip and Segmented navigation with Metro horizontal nav
const navStartStr = `{/* ========================================================================= */}\n      {/* INTERACTIVE KPI STRIP (Clickable navigation) */}`
const navEndStr = `{/* ========================================================================= */}\n      {/* TAB: PARENT — MY CHILDREN & TRANSPORT */}`

const navStartIdx = content.indexOf(navStartStr)
const navEndIdx = content.indexOf(navEndStr)

const newNavBlock = `{/* 12 CANONICAL WORKSPACE HORIZONTAL METRO NAVIGATION */}
      <nav
        aria-label="Transport Workspaces"
        style={{
          display: 'flex',
          gap: 6,
          padding: 6,
          background: 'var(--surface-card, #ffffff)',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--elevation-1)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          marginBottom: 20,
        }}
      >
        {[
          { key: 'OVERVIEW', label: '1. Command Center', icon: LayoutDashboard },
          { key: 'PARENT', label: '2. Parent Portal', icon: Users, badge: myChildren.length > 0 ? myChildren.length : undefined },
          { key: 'DRIVER', label: '3. Driver Hub', icon: Bus },
          { key: 'TEACHER', label: '4. Teacher Verification', icon: GraduationCap, badge: teacherData?.pendingArrivals?.length > 0 ? teacherData.pendingArrivals.length : undefined },
          { key: 'TRIPS', label: "5. Daily Runs", icon: Clock, badge: trips.length > 0 ? trips.length : undefined },
          { key: 'ROUTES', label: '6. Routes & Stops', icon: MapPin, badge: routes.length > 0 ? routes.length : undefined },
          { key: 'VEHICLES', label: '7. Fleet Vehicles', icon: Truck, badge: vehicles.length > 0 ? vehicles.length : undefined },
          { key: 'STUDENTS', label: '8. Allocations', icon: UserCheck, badge: assignments.length > 0 ? assignments.length : undefined },
          { key: 'AUTHORIZATIONS', label: '9. Temp Pickups', icon: ShieldCheck, badge: authorizations.filter((a: any) => a.status === 'PENDING').length || (authorizations.length > 0 ? authorizations.length : undefined) },
          { key: 'SECURITY', label: '10. Security Audit', icon: ShieldAlert },
          { key: 'INCIDENTS', label: '11. Safety Incidents', icon: AlertTriangle, badge: criticalIncidents.length > 0 ? criticalIncidents.length : (incidents.length > 0 ? incidents.length : undefined) },
          { key: 'SCANNER', label: '12. QR Scanner', icon: QrCode },
          { key: 'SEED', label: 'Demo Seed & Test', icon: Zap },
        ].map((t) => {
          const isActive = tab === t.key
          const Icon = t.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as TabKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                borderRadius: 'var(--radius-md, 12px)',
                border: isActive
                  ? '1px solid color-mix(in srgb, var(--primary, #7c3aed) 28%, transparent)'
                  : '1px solid transparent',
                background: isActive
                  ? 'var(--preone-primary-soft, #f3eeff)'
                  : 'transparent',
                color: isActive
                  ? 'var(--primary, #7c3aed)'
                  : 'var(--text-secondary, #4a5a72)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' : 'none',
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--primary, #7c3aed)' : 'var(--text-muted)' }} />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: 9999,
                    background: isActive ? 'var(--primary, #7c3aed)' : 'var(--border-default, #cbd5e1)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary, #475569)',
                    fontWeight: 700,
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      `

if (navStartIdx !== -1 && navEndIdx !== -1) {
  content = content.slice(0, navStartIdx) + newNavBlock + content.slice(navEndIdx)
  console.log('Updated horizontal navigation successfully!')
} else {
  console.error('Could not find nav slice:', { navStartIdx, navEndIdx })
}

// 5. Replace TAB 1: OVERVIEW slice
const ovStartStr = `{/* ========================================================================= */}\n      {/* TAB 1: OVERVIEW — COMMAND CENTER */}`
const ovEndStr = `{/* ========================================================================= */}\n      {/* TAB 2: TODAY'S TRIPS & LIVE MANIFESTS */}`

const ovStartIdx = content.indexOf(ovStartStr)
const ovEndIdx = content.indexOf(ovEndStr)

const newOverviewBlock = `{/* ========================================================================= */}
      {/* TAB 1: OVERVIEW — COMMAND CENTER */}
      {/* ========================================================================= */}
      {tab === 'OVERVIEW' && (
        <div style={{ marginTop: 16 }}>
          {/* Fluent Metro KPI Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* 1. Active Routes */}
            <div
              onClick={() => setTab('ROUTES')}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Routes</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>
                {metrics?.activeRoutes ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                Daily routes configured →
              </div>
            </div>

            {/* 2. In-Service Fleet */}
            <div
              onClick={() => setTab('VEHICLES')}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>In-Service Fleet</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--success, #10b981)', lineHeight: 1.1 }}>
                {metrics?.activeVehicles ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                {metrics?.vehiclesInMaintenance ? \`\${metrics.vehiclesInMaintenance} in maintenance →\` : '100% operational →'}
              </div>
            </div>

            {/* 3. Assigned Children */}
            <div
              onClick={() => setTab('STUDENTS')}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Children</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>
                {metrics?.studentsUsingTransport ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                Allocated seats →
              </div>
            </div>

            {/* 4. Boarded Today */}
            <div
              onClick={() => setTab('TRIPS')}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Boarded Today</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>
                {metrics?.childrenBoarded ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                Morning arrivals logged →
              </div>
            </div>

            {/* 5. Safely Dropped */}
            <div
              onClick={() => setTab('TRIPS')}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Safely Dropped</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--success, #10b981)', lineHeight: 1.1 }}>
                {metrics?.childrenDropped ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                Guardian PIN verified →
              </div>
            </div>

            {/* 6. Delayed Trips */}
            <div
              onClick={() => { setTab('TRIPS'); setTripStatusFilter('DELAYED'); }}
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderRadius: 16,
                border: metrics?.delayedTrips > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-default, #e2e8f0)',
                padding: '16px 18px',
                boxShadow: 'var(--elevation-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delayed Trips</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: metrics?.delayedTrips > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: metrics?.delayedTrips > 0 ? 'var(--danger, #ef4444)' : 'var(--warning, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: metrics?.delayedTrips > 0 ? 'var(--danger, #ef4444)' : 'var(--foreground)', lineHeight: 1.1 }}>
                {metrics?.delayedTrips ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 6, fontWeight: 500 }}>
                {metrics?.delayedTrips > 0 ? 'Review & Alert →' : 'On schedule →'}
              </div>
            </div>
          </div>

          {/* 2-Column Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }} className="dash-grid">
            {/* Column 1: Active Trips + Routes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                                <span className={\`badge \${t.tripType === 'MORNING' ? 'b-primary' : 'b-purple'}\`}>{t.tripType}</span>
                                <span className={\`badge \${t.status === 'IN_PROGRESS' ? 'b-warning' : t.status === 'COMPLETED' ? 'b-success' : 'b-neutral'}\`}>
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
                                width: \`\${progressPct}%\`,
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

              {/* Route Transit Status & Network Coverage */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Route Transit Status & Network Coverage</div>
                    <div className="card-sub">Configured stops, allocated buses, and active student distribution</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('ROUTES')}>
                    View All Routes <ArrowRight size={13} />
                  </button>
                </div>
                {routes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {routes.slice(0, 5).map((r) => {
                      const studentCount = assignments.filter((a) => a.routeId === r.id && a.status === 'ACTIVE').length
                      return (
                        <div
                          key={r.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</span>
                              <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</span>
                              <span className={\`badge \${r.isActive ? 'b-success' : 'b-neutral'}\`}>
                                {r.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="t-caption" style={{ marginTop: 3 }}>
                              Stops: <b>{r.stops?.length || 0}</b> · Bus: <b>{r.defaultVehicle?.registrationNumber || 'Unassigned'}</b> · Driver: <b>{r.defaultDriver?.user?.fullName || 'Unassigned'}</b>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              {studentCount} Students
                            </div>
                            <div className="t-caption">{r.stops?.[0]?.morningPickupTime ? \`Starts \${r.stops[0].morningPickupTime}\` : 'Configured'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MapPin size={32} />}
                    title="No Routes Configured"
                    message="Set up transport routes and pickup stops for enrolled children."
                    action={canWrite && <button className="btn btn-primary btn-sm" onClick={() => setAddRouteOpen(true)}>Add Route</button>}
                  />
                )}
              </div>
            </div>

            {/* Column 2: Fleet Readiness + Safety Assurance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                          <span className={\`badge \${v.status === 'ACTIVE' ? 'b-success' : v.status === 'MAINTENANCE' ? 'b-warning' : 'b-neutral'}\`}>
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

              {/* Child Safety & Handover Assurance */}
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Child Safety & Handover Assurance</div>
                    <div className="card-sub">Zero unverified handovers invariant & real-time guardian verification</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('SECURITY')}>
                    Audit Trail <ArrowRight size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--success, #10b981)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
                        Strict Multi-Guardian Policy Active
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', marginTop: 2, lineHeight: 1.4 }}>
                        Every child release requires registered guardian OTP/PIN or biometric match. Non-authorized individuals trigger instant principal safety escalation.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ padding: '10px 12px', background: 'var(--c-surface-hover, rgba(0,0,0,0.02))', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="t-caption">Active Temp Pickups</div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                        {authorizations.filter((a: any) => a.status === 'PENDING' || a.status === 'APPROVED').length}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', background: 'var(--c-surface-hover, rgba(0,0,0,0.02))', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div className="t-caption">Security Audit Logs</div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                        {securityLogs.length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTab('AUTHORIZATIONS')}>
                      <ShieldCheck size={13} /> Temp Pickups
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTab('SECURITY')}>
                      <ShieldAlert size={13} /> Security Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      `

if (ovStartIdx !== -1 && ovEndIdx !== -1) {
  content = content.slice(0, ovStartIdx) + newOverviewBlock + content.slice(ovEndIdx)
  console.log('Updated Overview workspace successfully!')
} else {
  console.error('Could not find Overview slice:', { ovStartIdx, ovEndIdx })
}

// 6. Clean up demo seed emojis in SEED tab lines
content = content.replace(`🚍 <b>Bus:</b>`, `<b>Bus:</b>`)
content = content.replace(`🗺️ <b>Route:</b>`, `<b>Route:</b>`)
content = content.replace(`👨‍✈️ <b>Driver:</b>`, `<b>Driver:</b>`)
content = content.replace(`👨‍👩‍👧‍👦 <b>Parent:</b>`, `<b>Parent:</b>`)
content = content.replace(`👩‍🏫 <b>Teacher:</b>`, `<b>Teacher:</b>`)
content = content.replace(`Load Token into QR Scanner 🔍`, `Load Token into QR Scanner`)
content = content.replace(`Go to Parent Portal 👨‍👩‍👧‍👦`, `Go to Parent Portal`)
content = content.replace(`Go to Teacher View 👩‍🏫`, `Go to Teacher View`)

fs.writeFileSync(filePath, content, 'utf-8')
console.log('Successfully updated TransportClient.tsx!')

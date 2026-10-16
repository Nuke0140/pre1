'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
  Building2,
  Blocks,
  ArrowRight,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  type StepDependencyResolution,
  type PrerequisiteDiagnostic,
} from '@/lib/setup/dependency-resolver'

export interface SmartDependencyResolverProps {
  stepKey: string
  stepLabel: string
  branchId?: string | null
  onUnblocked?: () => void
  className?: string
}

export function SmartDependencyResolver({
  stepKey,
  stepLabel,
  branchId,
  onUnblocked,
  className = '',
}: SmartDependencyResolverProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState<StepDependencyResolution | null>(null)
  const [activeModal, setActiveModal] = useState<'YEAR' | 'BRANCH' | 'PROGRAM' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [justUnblocked, setJustUnblocked] = useState(false)

  // Load diagnostic
  const loadDiagnostics = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const url = `/api/v1/setup/dependencies/resolve?stepKey=${stepKey}${branchId ? `&branchId=${branchId}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.data) {
        setResolution(json.data)
        if (!json.data.isBlocked && json.data.missingPrerequisites.length === 0) {
          // If was previously blocked and now unblocked
          if (resolution?.isBlocked) {
            setJustUnblocked(true)
            onUnblocked?.()
          }
        }
      } else {
        setErrorMessage(json.error?.message || 'Failed to evaluate prerequisites')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error evaluating dependencies')
    } finally {
      setLoading(false)
    }
  }, [stepKey, branchId, onUnblocked, resolution?.isBlocked])

  useEffect(() => {
    loadDiagnostics()
  }, [stepKey, branchId])

  // Handle 1-click resolution submission
  const handleResolveAction = async (actionType: string, payload: Record<string, any>) => {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/v1/setup/dependencies/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStep: stepKey,
          actionType,
          payload,
          branchId,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        toast.success('Prerequisite Resolved', json.data.message)
        setActiveModal(null)
        setResolution(json.data.updatedResolution)

        // Check if now fully unblocked
        if (!json.data.updatedResolution.isBlocked) {
          setJustUnblocked(true)
          toast.success('Step Unlocked', `${stepLabel} is now ready for configuration.`)
          onUnblocked?.()
        }
      } else {
        setErrorMessage(json.error?.message || 'Failed to resolve prerequisite')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error executing resolution')
    } finally {
      setSubmitting(false)
    }
  }

  // If loading and no previous data, render clean skeleton
  if (loading && !resolution) {
    return (
      <div className={`card ${className}`} style={{ borderColor: 'var(--border-subtle)', marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RefreshCw size={16} className="animate-spin text-primary" />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Evaluating prerequisites for {stepLabel}…</span>
        </div>
      </div>
    )
  }

  // If not blocked and not just unblocked, do not render blocking notice
  if (!resolution?.isBlocked && !justUnblocked) {
    return null
  }

  // If just unblocked, render celebratory success banner
  if (justUnblocked && !resolution?.isBlocked) {
    return (
      <div
        className={`card ${className}`}
        style={{
          borderColor: 'var(--success, #16a34a)',
          background: 'var(--success-bg, rgba(22, 163, 74, 0.08))',
          marginBottom: 16,
          padding: '14px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Unlock size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                🎉 All Prerequisites Satisfied!
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {stepLabel} is now unlocked. You can configure and schedule items immediately below.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setJustUnblocked(false)}
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    )
  }

  const missing = resolution?.missingPrerequisites || []

  return (
    <>
      <div
        className={`card ${className}`}
        style={{
          borderColor: 'var(--warning, #f59e0b)',
          borderLeft: '4px solid var(--warning, #f59e0b)',
          marginBottom: 16,
          padding: '16px 18px',
          background: 'var(--bg-card)',
        }}
        role="region"
        aria-label={`${stepLabel} Prerequisites Notice`}
      >
        {/* Header Block */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--warning, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Lock size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {stepLabel} is Blocked
                </span>
                <span className="badge b-orange" style={{ fontSize: 10.5 }}>
                  {missing.length} Missing {missing.length === 1 ? 'Prerequisite' : 'Prerequisites'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                This step requires prior configuration before items can be saved. Resolve the items below directly without leaving this page.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadDiagnostics}
            disabled={loading}
            title="Re-check prerequisites"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Re-check</span>
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Missing Prerequisites List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {missing.map((item, idx) => {
            const isFirst = idx === 0
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 8,
                  border: isFirst ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
                    <span className="badge b-orange" style={{ fontSize: 10 }}>Required</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {item.whyRequired}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Primary 1-Click Action */}
                  {item.actionType === 'QUICK_CREATE_YEAR' && item.canUserResolve && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveModal('YEAR')}
                    >
                      <CalendarPlus size={13} /> Create Academic Year (1-Click)
                    </button>
                  )}

                  {item.actionType === 'QUICK_CREATE_BRANCH' && item.canUserResolve && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveModal('BRANCH')}
                    >
                      <Building2 size={13} /> Quick Add Branch (1-Click)
                    </button>
                  )}

                  {item.actionType === 'QUICK_CREATE_PROGRAM' && item.canUserResolve && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveModal('PROGRAM')}
                    >
                      <Blocks size={13} /> Quick Add Program (1-Click)
                    </button>
                  )}

                  {/* Secondary Action: Full Page Link */}
                  <a
                    href={item.targetRoute}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 11.5 }}
                    title={`Open full ${item.label} setup`}
                  >
                    <span>Full Setup</span>
                    <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 1-CLICK QUICK CREATE MODALS ── */}

      {/* 1. Academic Year Modal */}
      {activeModal === 'YEAR' && (
        <QuickYearModal
          initialData={resolution?.missingPrerequisites.find((m) => m.key === 'academic_year')?.suggestedPayload}
          onClose={() => setActiveModal(null)}
          onSubmit={(payload) => handleResolveAction('QUICK_CREATE_YEAR', payload)}
          submitting={submitting}
          errorMessage={errorMessage}
        />
      )}

      {/* 2. Branch Modal */}
      {activeModal === 'BRANCH' && (
        <QuickBranchModal
          initialData={resolution?.missingPrerequisites.find((m) => m.key === 'branch')?.suggestedPayload}
          onClose={() => setActiveModal(null)}
          onSubmit={(payload) => handleResolveAction('QUICK_CREATE_BRANCH', payload)}
          submitting={submitting}
          errorMessage={errorMessage}
        />
      )}

      {/* 3. Program Modal */}
      {activeModal === 'PROGRAM' && (
        <QuickProgramModal
          initialData={resolution?.missingPrerequisites.find((m) => m.key === 'programs')?.suggestedPayload}
          onClose={() => setActiveModal(null)}
          onSubmit={(payload) => handleResolveAction('QUICK_CREATE_PROGRAM', payload)}
          submitting={submitting}
          errorMessage={errorMessage}
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
 * COMPACT IN-PLACE MODALS FOR 1-CLICK UNBLOCKING
 * ───────────────────────────────────────────────────────────── */

function QuickYearModal({
  initialData,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initialData?: Record<string, any>
  onClose: () => void
  onSubmit: (payload: Record<string, any>) => void
  submitting: boolean
  errorMessage: string | null
}) {
  const [name, setName] = useState(String(initialData?.name || '2026-27'))
  const [startDate, setStartDate] = useState(String(initialData?.startDate || '2026-06-01'))
  const [endDate, setEndDate] = useState(String(initialData?.endDate || '2027-04-30'))
  const [status, setStatus] = useState(String(initialData?.status || 'ACTIVE'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, startDate, endDate, status })
  }

  return (
    <Modal open onClose={onClose} title="Create Academic Year" icon={<CalendarPlus size={22} />} iconClass="ic-green">
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
            {errorMessage}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Session Name <span className="req">*</span></label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. 2026-27"
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>Initial Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={submitting}
            >
              <option value="ACTIVE">Active (Operating)</option>
              <option value="PLANNED">Planned</option>
            </select>
          </div>
          <div className="field">
            <label>Start Date <span className="req">*</span></label>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>End Date <span className="req">*</span></label>
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
        </div>
        <p className="helper" style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
          Dates are suggested from your school cycle. You can review or edit before saving. The first academic year is automatically marked current.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${submitting ? 'is-loading' : ''}`} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create & Unblock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function QuickBranchModal({
  initialData,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initialData?: Record<string, any>
  onClose: () => void
  onSubmit: (payload: Record<string, any>) => void
  submitting: boolean
  errorMessage: string | null
}) {
  const [name, setName] = useState(String(initialData?.name || 'Main Campus'))
  const [code, setCode] = useState(String(initialData?.code || 'MAIN'))
  const [capacity, setCapacity] = useState(Number(initialData?.capacity || 100))
  const [city, setCity] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, code, capacity, city })
  }

  return (
    <Modal open onClose={onClose} title="Quick Add Campus Branch" icon={<Building2 size={22} />} iconClass="ic-blue">
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
            {errorMessage}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Branch / Campus Name <span className="req">*</span></label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Main Campus"
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>Branch Code <span className="req">*</span></label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. MAIN"
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>Campus Capacity (Seats)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
              disabled={submitting}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${submitting ? 'is-loading' : ''}`} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Branch'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function QuickProgramModal({
  initialData,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initialData?: Record<string, any>
  onClose: () => void
  onSubmit: (payload: Record<string, any>) => void
  submitting: boolean
  errorMessage: string | null
}) {
  const [name, setName] = useState(String(initialData?.name || 'Playgroup'))
  const [code, setCode] = useState(String(initialData?.code || 'PG'))
  const [programType, setProgramType] = useState(String(initialData?.programType || 'PLAYGROUP'))
  const [capacity, setCapacity] = useState(Number(initialData?.capacity || 20))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, code, programType, capacity })
  }

  return (
    <Modal open onClose={onClose} title="Quick Add Program" icon={<Blocks size={22} />} iconClass="ic-purple">
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
            {errorMessage}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>Program Name <span className="req">*</span></label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Playgroup"
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>Code <span className="req">*</span></label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. PG"
              disabled={submitting}
            />
          </div>
          <div className="field">
            <label>Program Type <span className="req">*</span></label>
            <select
              className="select"
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              disabled={submitting}
            >
              <option value="PLAYGROUP">Playgroup</option>
              <option value="NURSERY">Nursery</option>
              <option value="LKG">LKG (Jr KG)</option>
              <option value="UKG">UKG (Sr KG)</option>
              <option value="DAYCARE">Daycare</option>
            </select>
          </div>
          <div className="field">
            <label>Class Capacity</label>
            <input
              className="input"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              disabled={submitting}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${submitting ? 'is-loading' : ''}`} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Program'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

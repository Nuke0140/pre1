'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Copy, Building2, CheckCircle2, AlertTriangle, ArrowRight,
  ShieldAlert, RefreshCw, Layers, Check, X, Info, ChevronDown
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  CATEGORY_COPY_POLICIES,
  type CopyableCategory,
} from '@/lib/setup/scope-model'
import type {
  BranchCopyPreviewResult,
  BranchCopyExecutionResult,
  ConflictStrategy,
} from '@/lib/setup/branch-copy-service'

export interface CopyBranchSetupModalProps {
  open: boolean
  onClose: () => void
  branches: Array<{ id: string; name: string; code: string }>
  initialSourceBranchId?: string
  onSuccess?: () => void
}

export function CopyBranchSetupModal({
  open,
  onClose,
  branches,
  initialSourceBranchId,
  onSuccess,
}: CopyBranchSetupModalProps) {
  const toast = useToast()

  const [sourceBranchId, setSourceBranchId] = useState<string>('')
  const [destinationBranchId, setDestinationBranchId] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<CopyableCategory[]>([
    'classrooms',
    'fee_structures',
    'programs',
    'facilities',
  ])
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('SKIP')

  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<BranchCopyPreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<BranchCopyExecutionResult | null>(null)

  // Initialize source branch
  useEffect(() => {
    if (open) {
      setPreviewData(null)
      setPreviewError(null)
      setExecutionResult(null)

      if (initialSourceBranchId && initialSourceBranchId !== 'ALL') {
        setSourceBranchId(initialSourceBranchId)
      } else if (branches.length > 0 && !sourceBranchId) {
        setSourceBranchId(branches[0].id)
      }
    }
  }, [open, initialSourceBranchId, branches])

  // Reset preview when branch or categories change
  const handleSourceChange = (id: string) => {
    setSourceBranchId(id)
    if (destinationBranchId === id) {
      setDestinationBranchId('')
    }
    setPreviewData(null)
  }

  const handleDestinationChange = (id: string) => {
    setDestinationBranchId(id)
    setPreviewData(null)
  }

  const toggleCategory = (cat: CopyableCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
    setPreviewData(null)
  }

  const destinationOptions = useMemo(() => {
    return branches.filter((b) => b.id !== sourceBranchId)
  }, [branches, sourceBranchId])

  const canPreview = Boolean(
    sourceBranchId &&
    destinationBranchId &&
    sourceBranchId !== destinationBranchId &&
    selectedCategories.length > 0
  )

  const loadPreview = async () => {
    if (!canPreview) return
    setPreviewLoading(true)
    setPreviewError(null)
    setExecutionResult(null)

    try {
      const res = await fetch('/api/v1/setup/branches/copy-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBranchId,
          destinationBranchId,
          categories: selectedCategories,
        }),
      })
      const j = await res.json()
      if (j.success) {
        setPreviewData(j.data)
      } else {
        setPreviewError(j.error?.message || 'Failed to generate copy preview')
      }
    } catch (e: any) {
      setPreviewError(e?.message || 'Server communication error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const executeCopy = async () => {
    if (!canPreview) return
    setExecuting(true)

    try {
      const res = await fetch('/api/v1/setup/branches/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBranchId,
          destinationBranchId,
          categories: selectedCategories,
          conflictStrategy,
        }),
      })
      const j = await res.json()
      if (j.success) {
        setExecutionResult(j.data)
        toast.success(
          'Setup copied successfully',
          `${j.data.totalCreated} created, ${j.data.totalSkipped} skipped`
        )
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error('Copy failed', j.error?.message)
      }
    } catch (e: any) {
      toast.error('Copy error', e?.message || 'Network failure')
    } finally {
      setExecuting(false)
    }
  }

  const sourceBranch = branches.find((b) => b.id === sourceBranchId)
  const destinationBranch = branches.find((b) => b.id === destinationBranchId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Copy Setup Between Branches"
      subtitle="Safely clone branch-specific operational structure without sensitive data"
      icon={<Copy size={20} />}
      wide
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Strict Isolation Notice */}
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-subtle)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <ShieldAlert size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Data Protection Guarantee:
            </span>{' '}
            Students, child records, financial transactions, invoices, attendance history, and teacher credentials are{' '}
            <strong>never copied</strong>. Only clean structural templates (classrooms, fee heads, capacities, facilities) are cloned.
          </div>
        </div>

        {/* 1. Branch Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div className="field">
            <label style={{ fontSize: 12.5, fontWeight: 600 }}>
              Source Campus <span className="req">*</span>
            </label>
            <select
              className="select"
              value={sourceBranchId}
              onChange={(e) => handleSourceChange(e.target.value)}
              disabled={executing || Boolean(executionResult)}
            >
              <option value="">Select source campus…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              Campus whose configuration will be cloned.
            </span>
          </div>

          <div className="field">
            <label style={{ fontSize: 12.5, fontWeight: 600 }}>
              Destination Campus <span className="req">*</span>
            </label>
            <select
              className="select"
              value={destinationBranchId}
              onChange={(e) => handleDestinationChange(e.target.value)}
              disabled={executing || Boolean(executionResult)}
            >
              <option value="">Select target campus…</option>
              {destinationOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              Campus receiving the new configuration.
            </span>
          </div>
        </div>

        {/* 2. Category Checkboxes */}
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Configuration Categories to Copy
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8 }}>
            {(Object.keys(CATEGORY_COPY_POLICIES) as CopyableCategory[]).map((catKey) => {
              const policy = CATEGORY_COPY_POLICIES[catKey]
              const checked = selectedCategories.includes(catKey)
              return (
                <label
                  key={catKey}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: checked ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: checked ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    cursor: executing || executionResult ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(catKey)}
                    disabled={executing || Boolean(executionResult)}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{policy.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {policy.description}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* 3. Conflict Strategy */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Conflict Handling:</span>
            <select
              className="select"
              style={{ height: 30, fontSize: 12, padding: '2px 10px', minWidth: 200 }}
              value={conflictStrategy}
              onChange={(e) => {
                setConflictStrategy(e.target.value as ConflictStrategy)
                setPreviewData(null)
              }}
              disabled={executing || Boolean(executionResult)}
            >
              <option value="SKIP">Skip existing records (Recommended)</option>
              <option value="CREATE_MISSING">Create missing records only</option>
              <option value="OVERWRITE">Update existing records</option>
            </select>
          </div>

          {!previewData && !executionResult && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadPreview}
              disabled={!canPreview || previewLoading}
            >
              {previewLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Layers size={14} /> Preview Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* Error State */}
        {previewError && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: 8,
              border: '1px solid #fecaca',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{previewError}</span>
          </div>
        )}

        {/* 4. Preview Results Display */}
        {previewData && !executionResult && (
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: 14,
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                  Preview: {previewData.sourceBranch.name} → {previewData.destinationBranch.name}
                </span>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Selected strategy: <strong>{conflictStrategy.replaceAll('_', ' ')}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge b-success" style={{ fontSize: 11 }}>
                  +{previewData.summary.totalNewRecords} New Records
                </span>
                {previewData.summary.totalConflicts > 0 && (
                  <span className="badge b-warning" style={{ fontSize: 11 }}>
                    {previewData.summary.totalConflicts} Matches / Conflicts
                  </span>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {previewData.categories.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Source: {cat.sourceCount} | New: {cat.newCount} | Conflicts: {cat.conflictsCount}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {cat.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: item.status === 'WILL_CREATE' ? 'var(--success, #16a34a)' : 'var(--warning, #eab308)',
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({item.type})</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 11 }}>
                          {item.status === 'WILL_CREATE'
                            ? 'Will create'
                            : conflictStrategy === 'OVERWRITE'
                            ? 'Will overwrite'
                            : 'Will skip'}
                        </span>
                      </div>
                    ))}
                    {cat.items.length > 4 && (
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                        +{cat.items.length - 4} more items…
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPreviewData(null)}
                disabled={executing}
              >
                Change Selections
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={executeCopy}
                disabled={executing || previewData.summary.totalSourceRecords === 0}
              >
                {executing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Copying Configuration…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Confirm & Copy to {destinationBranch?.name}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 5. Execution Summary Display */}
        {executionResult && (
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: 16,
              background: 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Configuration Cloned to {executionResult.destinationBranch.name}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {executionResult.message}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div className="card" style={{ padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success, #16a34a)' }}>
                  {executionResult.totalCreated}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Created</div>
              </div>
              <div className="card" style={{ padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                  {executionResult.totalUpdated}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updated</div>
              </div>
              <div className="card" style={{ padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {executionResult.totalSkipped}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Skipped</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

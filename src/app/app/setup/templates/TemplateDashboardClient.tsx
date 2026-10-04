'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  ExternalLink,
  Printer,
  Sparkles,
  Award,
  Receipt,
  IdCard,
  Contact,
  FileSpreadsheet,
  GraduationCap,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  Layout,
  Sliders,
  Check,
  Eye,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Star,
} from 'lucide-react'
import { PageHead, Skeleton, StatusBadge, EmptyState } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  DocumentType,
  PageFormat,
  DOCUMENT_TYPE_CONFIG,
  PAGE_DIMENSIONS,
} from '@/lib/templates/types'
import { TEMPLATE_PRESETS } from '@/lib/templates/presets'
import { TestTemplateModal } from '@/components/templates/TestTemplateModal'

interface TemplateListItem {
  id: string
  type: DocumentType
  name: string
  isDefault: boolean
  version: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  pageSize: PageFormat
  orientation: 'portrait' | 'landscape'
  elementsCount: number
  publishedAt: string | null
  publishedBy: string | null
  updatedAt: string
  createdAt: string
  definition: any
}

const TYPE_ICONS: Record<DocumentType, React.ComponentType<{ size?: number; className?: string }>> = {
  STUDENT_ID_CARD: Contact,
  STAFF_ID_CARD: IdCard,
  FEE_RECEIPT: Receipt,
  CERTIFICATE: Award,
  ADMISSION_FORM: FileSpreadsheet,
  REPORT_CARD: GraduationCap,
  GENERAL_LETTER: FileText,
}

const TYPE_COLORS: Record<DocumentType, string> = {
  STUDENT_ID_CARD: '#4C1D95',
  STAFF_ID_CARD: '#1E293B',
  FEE_RECEIPT: '#047857',
  CERTIFICATE: '#D97706',
  ADMISSION_FORM: '#2563EB',
  REPORT_CARD: '#4338CA',
  GENERAL_LETTER: '#6B7280',
}

export default function TemplateDashboardClient() {
  const router = useRouter()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMode, setCreateMode] = useState<'PRESET' | 'BLANK'>('PRESET')
  const [selectedPreset, setSelectedPreset] = useState<DocumentType>('STUDENT_ID_CARD')
  const [newTemplateType, setNewTemplateType] = useState<DocumentType>('STUDENT_ID_CARD')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateFormat, setNewTemplateFormat] = useState<PageFormat>('ID_CARD_PORTRAIT')

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateListItem | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<TemplateListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Test Template Modal
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [templateToTest, setTemplateToTest] = useState<TemplateListItem | null>(null)

  // Fetch Templates
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'ALL') params.set('type', selectedType)
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/v1/templates?${params.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        setTemplates(json.data.items || [])
      } else {
        toast.error('Failed to load templates', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Network Error', err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedStatus, search, toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Quick stats
  const stats = useMemo(() => {
    const total = templates.length
    const published = templates.filter((t) => t.status === 'PUBLISHED').length
    const drafts = templates.filter((t) => t.status === 'DRAFT').length
    const typesCount = new Set(templates.map((t) => t.type)).size
    return { total, published, drafts, typesCount }
  }, [templates])

  // Handle Create Template
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setCreating(true)
    try {
      const type = createMode === 'PRESET' ? selectedPreset : newTemplateType
      const payload = {
        name: newTemplateName.trim(),
        type,
        presetKey: createMode === 'PRESET' ? selectedPreset : 'BLANK',
        format: createMode === 'BLANK' ? newTemplateFormat : undefined,
      }

      const res = await fetch('/api/v1/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success && json.data) {
        toast.success('Template created', `"${json.data.name}" ready in Studio`)
        setCreateModalOpen(false)
        router.push(`/app/setup/templates/${json.data.id}`)
      } else {
        toast.error('Error creating template', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Failed to create template', err.message)
    } finally {
      setCreating(false)
    }
  }

  // Handle Duplicate
  const handleDuplicate = async (t: TemplateListItem) => {
    try {
      const res = await fetch(`/api/v1/templates/${t.id}/duplicate`, { method: 'POST' })
      const json = await res.json()
      if (json.success && json.data) {
        toast.success('Template Duplicated', `Created "${json.data.name}"`)
        loadTemplates()
      } else {
        toast.error('Failed to duplicate', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Duplicate error', err.message)
    }
  }

  // Handle Publish
  const handlePublish = async (t: TemplateListItem) => {
    try {
      const res = await fetch(`/api/v1/templates/${t.id}/publish`, { method: 'POST' })
      const json = await res.json()
      if (json.success && json.data) {
        toast.success('Template Published', `"${t.name}" published as active version`)
        loadTemplates()
      } else {
        toast.error('Failed to publish', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Publish error', err.message)
    }
  }

  // Handle Set Default
  const handleSetDefault = async (t: TemplateListItem) => {
    try {
      const res = await fetch(`/api/v1/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Default Assigned', `"${t.name}" is now the primary template for ${DOCUMENT_TYPE_CONFIG[t.type]?.label}`)
        loadTemplates()
      } else {
        toast.error('Failed to set default', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Error updating default', err.message)
    }
  }

  // Open Preview Modal
  const openPreview = async (t: TemplateListItem) => {
    setPreviewTemplate(t)
    setPreviewModalOpen(true)
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/v1/templates/${t.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.success && json.data?.html) {
        setPreviewHtml(json.data.html)
      } else {
        setPreviewHtml('<p style="padding: 20px; color: red;">Failed to generate preview</p>')
      }
    } catch (e: any) {
      setPreviewHtml(`<p style="padding: 20px; color: red;">Error: ${e.message}</p>`)
    } finally {
      setLoadingPreview(false)
    }
  }

  // Print Preview
  const handlePrintPreview = () => {
    if (!previewHtml) return
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(previewHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  // Confirm Delete
  const confirmDelete = async () => {
    if (!templateToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateToDelete.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Template deleted', `"${templateToDelete.name}" removed`)
        setDeleteModalOpen(false)
        setTemplateToDelete(null)
        loadTemplates()
      } else {
        toast.error('Cannot delete template', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Delete failed', err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-shell" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
      {/* ── Page Header ── */}
      <PageHead
        title="No-Code Template Studio"
        subtitle="Visual drag-and-drop designer for student ID cards, fee receipts, completion certificates, and school documents."
        breadcrumbs={[
          { label: 'Setup', href: '/app/setup' },
          { label: 'Templates' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadTemplates()}
              title="Refresh templates list"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setNewTemplateName('')
                setCreateMode('PRESET')
                setSelectedPreset('STUDENT_ID_CARD')
                setCreateModalOpen(true)
              }}
            >
              <Plus size={16} /> New Template
            </button>
          </div>
        }
      />

      {/* ── KPI Stats Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
            Total Templates
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {loading ? '…' : stats.total}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Across {stats.typesCount} document categories
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
            Published & Active
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669', marginTop: 4 }}>
            {loading ? '…' : stats.published}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Live for document generation
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
            In Draft
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
            {loading ? '…' : stats.drafts}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Unpublished working revisions
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
            Setup Step 15
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={24} color="#7C3AED" /> Satisfied
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Document registry active
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div
        style={{
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 420 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
              placeholder="Search templates by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface-muted)', padding: 4, borderRadius: 6 }}>
            {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${selectedStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => setSelectedStatus(st)}
              >
                {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Document Type Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>Type:</span>
          <button
            type="button"
            className={`badge ${selectedType === 'ALL' ? 'b-primary' : 'b-neutral'}`}
            style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12, border: '1px solid transparent' }}
            onClick={() => setSelectedType('ALL')}
          >
            All Types
          </button>
          {(Object.keys(DOCUMENT_TYPE_CONFIG) as DocumentType[]).map((dt) => {
            const Icon = TYPE_ICONS[dt] || FileText
            const active = selectedType === dt
            return (
              <button
                key={dt}
                type="button"
                className={`badge ${active ? 'b-primary' : 'b-neutral'}`}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid transparent',
                }}
                onClick={() => setSelectedType(dt)}
              >
                <Icon size={13} />
                {DOCUMENT_TYPE_CONFIG[dt]?.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Templates Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface-panel)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: 20,
              }}
            >
              <Skeleton style={{ height: 24, width: '60%', marginBottom: 12 }} />
              <Skeleton style={{ height: 16, width: '40%', marginBottom: 16 }} />
              <Skeleton style={{ height: 60, width: '100%', marginBottom: 16 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 28, width: '30%' }} />
                <Skeleton style={{ height: 28, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="No document templates found"
          description={
            search || selectedType !== 'ALL' || selectedStatus !== 'ALL'
              ? 'No templates match the current filters. Try resetting search or type filter.'
              : 'You have not created any document templates yet. Start with a preschool preset or blank canvas.'
          }
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setNewTemplateName('')
                setCreateMode('PRESET')
                setSelectedPreset('STUDENT_ID_CARD')
                setCreateModalOpen(true)
              }}
            >
              <Sparkles size={16} /> Choose a Starter Preset
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {templates.map((t) => {
            const Icon = TYPE_ICONS[t.type] || FileText
            const typeMeta = DOCUMENT_TYPE_CONFIG[t.type]
            const dim = PAGE_DIMENSIONS[t.pageSize] || PAGE_DIMENSIONS.A4_PORTRAIT

            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--surface-panel)',
                  border: t.isDefault ? '2px solid #7C3AED' : '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: t.isDefault ? '0 4px 12px rgba(124, 58, 237, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {t.isDefault && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: 16,
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Star size={10} fill="#FFF" /> Default Active
                  </div>
                )}

                <div>
                  {/* Top Category Badge & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: `${TYPE_COLORS[t.type]}15`,
                        color: TYPE_COLORS[t.type],
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Icon size={14} />
                      {typeMeta?.label || t.type}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className={`badge ${
                          t.status === 'PUBLISHED' ? 'b-success' : t.status === 'DRAFT' ? 'b-warning' : 'b-neutral'
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {t.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>v{t.version}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px 0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.name}
                  </h3>

                  {/* Dimension & Element specs */}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', gap: 12 }}>
                    <span>📐 {dim.name} ({dim.widthMm} × {dim.heightMm}mm)</span>
                    <span>🧩 {t.elementsCount} elements</span>
                  </div>

                  {/* Last updated */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Updated {new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {t.publishedBy ? ` • Pub by ${t.publishedBy}` : ''}
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openPreview(t)}
                      title="Quick Preview"
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: '#7C3AED18',
                        color: '#6D28D9',
                        border: '1px solid #7C3AED40',
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setTemplateToTest(t)
                        setTestModalOpen(true)
                      }}
                      title="Test Template with Real Records, Live Preview & PDF Download"
                    >
                      <Sparkles size={13} /> Test Template
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleDuplicate(t)}
                      title="Duplicate as Draft"
                    >
                      <Copy size={13} />
                    </button>
                    {!t.isDefault && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleSetDefault(t)}
                        title="Set as Default for this Document Type"
                      >
                        <Star size={13} />
                      </button>
                    )}
                    {!t.isDefault && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        style={{ color: '#DC2626' }}
                        onClick={() => {
                          setTemplateToDelete(t)
                          setDeleteModalOpen(true)
                        }}
                        title="Delete Template"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => router.push(`/app/setup/templates/${t.id}`)}
                  >
                    Open Studio <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE TEMPLATE MODAL ── */}
      {createModalOpen && (
        <Modal
          open
          onClose={() => setCreateModalOpen(false)}
          title="Create New Document Template"
          icon={<Sparkles size={20} />}
          iconClass="ic-purple"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: 10, background: 'var(--surface-muted)', padding: 4, borderRadius: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${createMode === 'PRESET' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setCreateMode('PRESET')}
              >
                <Sparkles size={14} /> Starter Preschool Preset
              </button>
              <button
                type="button"
                className={`btn btn-sm ${createMode === 'BLANK' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
                onClick={() => setCreateMode('BLANK')}
              >
                <Layout size={14} /> Blank Canvas
              </button>
            </div>

            {/* Template Name */}
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Template Name <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="input"
                required
                placeholder={
                  createMode === 'PRESET'
                    ? TEMPLATE_PRESETS[selectedPreset]?.name
                    : 'e.g. Annual Sports Day Certificate 2026'
                }
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>

            {/* PRESET MODE PICKER */}
            {createMode === 'PRESET' ? (
              <div className="field">
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Select Preschool Document Preset:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                  {(Object.keys(TEMPLATE_PRESETS) as DocumentType[]).map((pKey) => {
                    const preset = TEMPLATE_PRESETS[pKey]
                    const Icon = TYPE_ICONS[preset.type] || FileText
                    const isSelected = selectedPreset === pKey

                    return (
                      <div
                        key={pKey}
                        onClick={() => {
                          setSelectedPreset(pKey)
                          if (!newTemplateName) {
                            setNewTemplateName(preset.name)
                          }
                        }}
                        style={{
                          border: isSelected ? '2px solid #7C3AED' : '1px solid var(--border-color)',
                          background: isSelected ? '#7C3AED0A' : 'var(--surface-panel)',
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: TYPE_COLORS[preset.type] }}>
                          <Icon size={16} />
                          {preset.definition.documentType.replaceAll('_', ' ')}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{preset.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{preset.description}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* BLANK CANVAS MODE PICKER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Document Category</label>
                  <select
                    className="select"
                    value={newTemplateType}
                    onChange={(e) => {
                      const t = e.target.value as DocumentType
                      setNewTemplateType(t)
                      setNewTemplateFormat(DOCUMENT_TYPE_CONFIG[t]?.defaultFormat || 'A4_PORTRAIT')
                    }}
                  >
                    {(Object.keys(DOCUMENT_TYPE_CONFIG) as DocumentType[]).map((dt) => (
                      <option key={dt} value={dt}>
                        {DOCUMENT_TYPE_CONFIG[dt].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Page Dimensions & Orientation</label>
                  <select
                    className="select"
                    value={newTemplateFormat}
                    onChange={(e) => setNewTemplateFormat(e.target.value as PageFormat)}
                  >
                    {(Object.keys(PAGE_DIMENSIONS) as PageFormat[]).map((pf) => {
                      const dim = PAGE_DIMENSIONS[pf]
                      return (
                        <option key={pf} value={pf}>
                          {dim.name} ({dim.widthMm} × {dim.heightMm} mm)
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${creating ? 'is-loading' : ''}`}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create in Studio'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {previewModalOpen && previewTemplate && (
        <Modal
          open
          onClose={() => setPreviewModalOpen(false)}
          title={`Preview Document — ${previewTemplate.name}`}
          icon={<Eye size={20} />}
          iconClass="ic-blue"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Rendered with live preschool sample data (PreOne sandbox profile).
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handlePrintPreview}
                  disabled={loadingPreview}
                >
                  <Printer size={14} /> Print Document
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => router.push(`/app/setup/templates/${previewTemplate.id}`)}
                >
                  Edit in Studio
                </button>
              </div>
            </div>

            {loadingPreview ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: 10 }} />
                <div>Generating document layout...</div>
              </div>
            ) : (
              <div
                style={{
                  background: '#F1F5F9',
                  padding: 20,
                  borderRadius: 8,
                  maxHeight: 520,
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteModalOpen && templateToDelete && (
        <Modal
          open
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Template Confirmation"
          icon={<AlertTriangle size={20} />}
          iconClass="ic-red"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete template{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{templateToDelete.name}"</strong>?
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TEST TEMPLATE MODAL ── */}
      {testModalOpen && templateToTest && (
        <TestTemplateModal
          open={testModalOpen}
          onClose={() => {
            setTestModalOpen(false)
            setTemplateToTest(null)
          }}
          templateId={templateToTest.id}
          templateName={templateToTest.name}
          documentType={templateToTest.type}
          initialDefinition={templateToTest.definition}
          isPublished={templateToTest.status === 'PUBLISHED'}
          publishedVersion={templateToTest.version}
          currentDraftVersion={templateToTest.version}
          onSetDefaultSuccess={loadTemplates}
        />
      )}
    </div>
  )
}

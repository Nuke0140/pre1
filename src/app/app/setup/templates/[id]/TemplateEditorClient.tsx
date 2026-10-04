'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers,
  Eye,
  Edit3,
  Printer,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  Sparkles,
  Heading,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  Table as TableIcon,
  QrCode,
  Barcode,
  PenTool,
  Award,
  Info,
  Database,
  Search,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  CornerDownRight,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  TemplateDefinition,
  TemplateElement,
  DocumentType,
  PageFormat,
  ElementType,
  PAGE_DIMENSIONS,
  DOCUMENT_TYPE_CONFIG,
} from '@/lib/templates/types'
import {
  APPROVED_TEMPLATE_FIELDS,
  FIELD_DOMAINS,
  FieldDefinition,
  resolveTokens,
  getDefaultSampleData,
} from '@/lib/templates/field-registry'
import { TestTemplateModal } from '@/components/templates/TestTemplateModal'

// 1mm = 3.7795275591 px at 96 DPI
const MM_TO_PX = 3.78

interface TemplateEditorProps {
  templateId: string
}

export default function TemplateEditorClient({ templateId }: TemplateEditorProps) {
  const router = useRouter()
  const toast = useToast()

  // Template State
  const [loading, setLoading] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [templateType, setTemplateType] = useState<DocumentType>('STUDENT_ID_CARD')
  const [isDefault, setIsDefault] = useState(false)
  const [definition, setDefinition] = useState<TemplateDefinition | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // Editor Interaction State
  const [zoom, setZoom] = useState(1) // 1 = 100%
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSizeMm, setGridSizeMm] = useState(2) // 2mm grid
  const [previewMode, setPreviewMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Undo / Redo History
  const [history, setHistory] = useState<TemplateDefinition[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Field Picker Modal
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false)
  const [fieldSearch, setFieldSearch] = useState('')
  const [selectedFieldDomain, setSelectedFieldDomain] = useState<string>('ALL')

  // Publish Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false)

  // Test Template Modal
  const [testModalOpen, setTestModalOpen] = useState(false)

  // Canvas Refs & Dragging
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemW: number; elemH: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemW: 0,
    elemH: 0,
  })

  // 1. Fetch Template
  const loadTemplate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateId}`)
      const json = await res.json()

      if (json.success && json.data) {
        setTemplateName(json.data.name)
        setTemplateType(json.data.type)
        setIsDefault(json.data.isDefault)
        setDefinition(json.data.definition)
        setHistory([json.data.definition])
        setHistoryIndex(0)
        setIsDirty(false)
      } else {
        toast.error('Failed to load template', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Load error', err.message)
    } finally {
      setLoading(false)
    }
  }, [templateId, toast])

  useEffect(() => {
    loadTemplate()
  }, [loadTemplate])

  // Helper to record history state
  const pushHistory = useCallback(
    (newDef: TemplateDefinition) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1)
        return [...sliced, newDef]
      })
      setHistoryIndex((prev) => prev + 1)
      setIsDirty(true)
    },
    [historyIndex]
  )

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1
      setDefinition(history[nextIndex])
      setHistoryIndex(nextIndex)
      setIsDirty(true)
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setDefinition(history[nextIndex])
      setHistoryIndex(nextIndex)
      setIsDirty(true)
    }
  }

  // Selected Element
  const selectedElement = useMemo(() => {
    if (!definition || !selectedElementId) return null
    return definition.elements.find((el) => el.id === selectedElementId) || null
  }, [definition, selectedElementId])

  // Update specific element
  const updateElement = useCallback(
    (id: string, updates: Partial<TemplateElement>) => {
      if (!definition) return
      const updatedElements = definition.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            ...updates,
            styles: { ...el.styles, ...(updates.styles || {}) },
          }
        }
        return el
      })

      const newDef: TemplateDefinition = {
        ...definition,
        elements: updatedElements,
      }
      setDefinition(newDef)
      pushHistory(newDef)
    },
    [definition, pushHistory]
  )

  // Delete Element
  const deleteElement = (id: string) => {
    if (!definition) return
    const newDef: TemplateDefinition = {
      ...definition,
      elements: definition.elements.filter((el) => el.id !== id),
    }
    setDefinition(newDef)
    pushHistory(newDef)
    if (selectedElementId === id) setSelectedElementId(null)
    toast.success('Element removed')
  }

  // Duplicate Element
  const duplicateElement = (id: string) => {
    if (!definition) return
    const target = definition.elements.find((el) => el.id === id)
    if (!target) return

    const newElem: TemplateElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `elem_${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: target.x + 4,
      y: target.y + 4,
      zIndex: (target.zIndex || 1) + 1,
    }

    const newDef: TemplateDefinition = {
      ...definition,
      elements: [...definition.elements, newElem],
    }
    setDefinition(newDef)
    pushHistory(newDef)
    setSelectedElementId(newElem.id)
    toast.success('Element duplicated')
  }

  // Layer ordering
  const bringToFront = (id: string) => {
    if (!definition) return
    const maxZ = Math.max(...definition.elements.map((e) => e.zIndex || 1), 1)
    updateElement(id, { zIndex: maxZ + 1 })
  }

  const sendToBack = (id: string) => {
    if (!definition) return
    const minZ = Math.min(...definition.elements.map((e) => e.zIndex || 1), 1)
    updateElement(id, { zIndex: Math.max(1, minZ - 1) })
  }

  // Add New Element by Type
  const addElement = (type: ElementType, presetOptions?: Partial<TemplateElement>) => {
    if (!definition) return

    const id = `elem_${Date.now()}`
    let newElem: TemplateElement

    switch (type) {
      case 'text':
        newElem = {
          id,
          type: 'text',
          name: 'Text Label',
          x: 10,
          y: 10,
          width: 60,
          height: 8,
          zIndex: definition.elements.length + 1,
          content: 'Add descriptive text...',
          styles: {
            fontSize: 10,
            color: '#1E293B',
            textAlign: 'left',
          },
        }
        break

      case 'bound-text':
        newElem = {
          id,
          type: 'bound-text',
          name: presetOptions?.name || 'Bound Field',
          x: 10,
          y: 10,
          width: 70,
          height: 8,
          zIndex: definition.elements.length + 1,
          content: presetOptions?.content || '{{student.fullName}}',
          fieldBinding: presetOptions?.fieldBinding || 'student.fullName',
          styles: {
            fontSize: 11,
            fontWeight: '600',
            color: '#1E1B4B',
            textAlign: 'left',
          },
        }
        break

      case 'photo':
        newElem = {
          id,
          type: 'photo',
          name: 'Student Photo',
          x: 10,
          y: 10,
          width: 25,
          height: 30,
          zIndex: definition.elements.length + 1,
          content: '{{student.photoUrl}}',
          fieldBinding: 'student.photoUrl',
          styles: {
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 4,
          },
        }
        break

      case 'image':
        newElem = {
          id,
          type: 'image',
          name: 'School Crest / Logo',
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          zIndex: definition.elements.length + 1,
          content: '/preone-crest.png',
          fieldBinding: 'school.logoUrl',
          styles: {
            borderRadius: 0,
          },
        }
        break

      case 'shape':
        newElem = {
          id,
          type: 'shape',
          name: 'Accent Rectangle',
          x: 10,
          y: 10,
          width: 80,
          height: 15,
          zIndex: 1,
          content: '',
          styles: {
            backgroundColor: '#7C3AED',
            borderRadius: 4,
          },
        }
        break

      case 'qrcode':
        newElem = {
          id,
          type: 'qrcode',
          name: 'Gate Scanner QR',
          x: 10,
          y: 10,
          width: 16,
          height: 16,
          zIndex: definition.elements.length + 1,
          content: 'https://preone.school/verify/{{student.admissionNumber}}',
          fieldBinding: 'student.admissionNumber',
          styles: {},
        }
        break

      case 'barcode':
        newElem = {
          id,
          type: 'barcode',
          name: 'Barcode Strip',
          x: 10,
          y: 10,
          width: 40,
          height: 12,
          zIndex: definition.elements.length + 1,
          content: '{{student.admissionNumber}}',
          fieldBinding: 'student.admissionNumber',
          styles: {},
        }
        break

      case 'signature':
        newElem = {
          id,
          type: 'signature',
          name: 'Principal Signature',
          x: 10,
          y: 10,
          width: 50,
          height: 18,
          zIndex: definition.elements.length + 1,
          content: 'Head of School\n{{school.principalName}}',
          styles: {
            fontSize: 8,
            color: '#475569',
            textAlign: 'center',
          },
        }
        break

      case 'table':
        newElem = {
          id,
          type: 'table',
          name: 'Data Table',
          x: 10,
          y: 10,
          width: definition.widthMm - 20,
          height: 35,
          zIndex: definition.elements.length + 1,
          content: '',
          styles: {
            tableColumns: [
              { key: 'col1', label: 'Item Description', widthPercent: 60, align: 'left' },
              { key: 'col2', label: 'Quantity / Term', widthPercent: 20, align: 'left' },
              { key: 'col3', label: 'Amount (₹)', widthPercent: 20, align: 'right' },
            ],
          },
        }
        break

      default:
        return
    }

    const newDef: TemplateDefinition = {
      ...definition,
      elements: [...definition.elements, newElem],
    }
    setDefinition(newDef)
    pushHistory(newDef)
    setSelectedElementId(newElem.id)
    toast.success(`Added ${newElem.name}`)
  }

  // Keyboard Navigation: Nudge with arrows, Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault()
          deleteElement(selectedElementId)
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElement) {
          e.preventDefault()
          const delta = e.shiftKey ? 5 : 1 // 5mm with Shift, 1mm regular
          let newX = selectedElement.x
          let newY = selectedElement.y

          if (e.key === 'ArrowUp') newY = Math.max(0, newY - delta)
          if (e.key === 'ArrowDown') newY = newY + delta
          if (e.key === 'ArrowLeft') newX = Math.max(0, newX - delta)
          if (e.key === 'ArrowRight') newX = newX + delta

          updateElement(selectedElement.id, { x: newX, y: newY })
        }
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, selectedElement, updateElement, handleUndo, handleRedo])

  // Mouse Dragging Logic
  const handleMouseDownOnElement = (e: React.MouseEvent, elem: TemplateElement) => {
    e.stopPropagation()
    setSelectedElementId(elem.id)
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
      elemW: elem.width,
      elemH: elem.height,
    }
  }

  const handleMouseDownOnResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation()
    if (!selectedElement) return
    setIsResizing(true)
    setResizeHandle(handle)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: selectedElement.x,
      elemY: selectedElement.y,
      elemW: selectedElement.width,
      elemH: selectedElement.height,
    }
  }

  // Global Mouse Move for Drag / Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!selectedElement) return

      const deltaPixelX = (e.clientX - dragStartRef.current.mouseX) / zoom
      const deltaPixelY = (e.clientY - dragStartRef.current.mouseY) / zoom

      const deltaMmX = deltaPixelX / MM_TO_PX
      const deltaMmY = deltaPixelY / MM_TO_PX

      if (isDragging) {
        let newX = dragStartRef.current.elemX + deltaMmX
        let newY = dragStartRef.current.elemY + deltaMmY

        if (snapToGrid) {
          newX = Math.round(newX / gridSizeMm) * gridSizeMm
          newY = Math.round(newY / gridSizeMm) * gridSizeMm
        }

        newX = Math.max(0, Math.round(newX * 10) / 10)
        newY = Math.max(0, Math.round(newY * 10) / 10)

        updateElement(selectedElement.id, { x: newX, y: newY })
      } else if (isResizing && resizeHandle) {
        let newW = dragStartRef.current.elemW
        let newH = dragStartRef.current.elemH
        let newX = dragStartRef.current.elemX
        let newY = dragStartRef.current.elemY

        if (resizeHandle.includes('e')) newW = dragStartRef.current.elemW + deltaMmX
        if (resizeHandle.includes('s')) newH = dragStartRef.current.elemH + deltaMmY
        if (resizeHandle.includes('w')) {
          newW = dragStartRef.current.elemW - deltaMmX
          newX = dragStartRef.current.elemX + deltaMmX
        }
        if (resizeHandle.includes('n')) {
          newH = dragStartRef.current.elemH - deltaMmY
          newY = dragStartRef.current.elemY + deltaMmY
        }

        if (snapToGrid) {
          newW = Math.round(newW / gridSizeMm) * gridSizeMm
          newH = Math.round(newH / gridSizeMm) * gridSizeMm
        }

        newW = Math.max(4, Math.round(newW * 10) / 10)
        newH = Math.max(4, Math.round(newH * 10) / 10)

        updateElement(selectedElement.id, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: newW,
          height: newH,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeHandle, selectedElement, zoom, snapToGrid, gridSizeMm, updateElement])

  // Save Draft to Backend
  const handleSaveDraft = async () => {
    if (!definition) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          type: templateType,
          isDefault,
          definition,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setIsDirty(false)
        toast.success('Draft Saved', 'All elements and layout changes stored safely.')
      } else {
        toast.error('Save failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Network Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  // Publish Template
  const handlePublishConfirm = async () => {
    setPublishing(true)
    try {
      // First save draft
      await fetch(`/api/v1/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          type: templateType,
          isDefault,
          definition,
        }),
      })

      const res = await fetch(`/api/v1/templates/${templateId}/publish`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Template Published', `Version ${json.data.content?.version} is now live.`)
        setPublishModalOpen(false)
        loadTemplate()
      } else {
        toast.error('Publishing failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Publish error', err.message)
    } finally {
      setPublishing(false)
    }
  }

  // Print Preview
  const handlePrintDocument = () => {
    if (!definition) return
    // Simple window print with clean container
    window.print()
  }

  if (loading || !definition) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ color: '#7C3AED', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Template Studio...</div>
        </div>
      </div>
    )
  }

  const sampleData = getDefaultSampleData()
  const canvasWidthPx = definition.widthMm * MM_TO_PX
  const canvasHeightPx = definition.heightMm * MM_TO_PX

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        background: '#0F172A',
        color: '#F8FAFC',
      }}
    >
      {/* ── TOP STUDIO NAVBAR ── */}
      <div
        style={{
          height: 52,
          borderBottom: '1px solid #334155',
          background: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 20,
        }}
      >
        {/* Left: Back & Title input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: '#94A3B8' }}
            onClick={() => router.push('/app/setup/templates')}
            title="Back to Templates"
          >
            <ArrowLeft size={16} />
          </button>

          <input
            type="text"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value)
              setIsDirty(true)
            }}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 4,
              outline: 'none',
              width: 240,
            }}
            onFocus={(e) => (e.target.style.borderColor = '#475569')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            placeholder="Template Name..."
          />

          <span
            style={{
              background: '#334155',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {DOCUMENT_TYPE_CONFIG[templateType]?.label || templateType}
          </span>

          <span
            style={{
              background: definition.status === 'PUBLISHED' ? '#065F46' : '#78350F',
              color: definition.status === 'PUBLISHED' ? '#34D399' : '#FBBF24',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            v{definition.version} {definition.status}
          </span>

          {isDirty && (
            <span style={{ fontSize: 11, color: '#F97316', fontWeight: 600 }}>• Unsaved Changes</span>
          )}
        </div>

        {/* Center: Tools (Undo, Redo, Zoom, Grid, Preview Mode) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: historyIndex > 0 ? '#FFFFFF' : '#64748B' }}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: historyIndex < history.length - 1 ? '#FFFFFF' : '#64748B' }}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          <div style={{ width: 1, height: 18, background: '#475569', margin: '0 4px' }} />

          {/* Zoom Controls */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: '#CBD5E1' }}
            onClick={() => setZoom((prev) => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10))}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: 12, color: '#CBD5E1', minWidth: 42, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: '#CBD5E1' }}
            onClick={() => setZoom((prev) => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10))}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: '#94A3B8' }}
            onClick={() => setZoom(1)}
            title="Reset Zoom to 100%"
          >
            <Maximize2 size={13} />
          </button>

          <div style={{ width: 1, height: 18, background: '#475569', margin: '0 4px' }} />

          {/* Grid Snap Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${snapToGrid ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '4px 8px' }}
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Toggle Grid Snapping"
          >
            <Grid size={14} style={{ color: snapToGrid ? '#A855F7' : '#94A3B8' }} /> Snap {gridSizeMm}mm
          </button>

          {/* Mode Switcher: Design vs Preview */}
          <button
            type="button"
            className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <Edit3 size={14} /> Design Mode
              </>
            ) : (
              <>
                <Eye size={14} /> Preview Data
              </>
            )}
          </button>
        </div>

        {/* Right: Test, Save Draft & Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: '#7C3AED25',
              color: '#E9D5FF',
              border: '1px solid #A855F780',
              fontWeight: 600,
            }}
            onClick={() => setTestModalOpen(true)}
            title="Test Template with Live Records, Data Mapping & PDF Generation"
          >
            <Sparkles size={14} /> Test Template
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setPublishModalOpen(true)}
            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
          >
            <CheckCircle2 size={14} /> Publish Version
          </button>
        </div>
      </div>

      {/* ── WORKSPACE BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT ELEMENT PALETTE ── */}
        {!previewMode && (
          <div
            style={{
              width: 220,
              background: '#1E293B',
              borderRight: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              gap: 16,
              overflowY: 'auto',
            }}
          >
            {/* Field Explorer Button */}
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 600,
                padding: '8px 12px',
              }}
              onClick={() => setFieldPickerOpen(true)}
            >
              <Database size={15} /> Insert Data Field...
            </button>

            {/* Typography Palette */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                Text & Headings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('text', { styles: { fontSize: 16, fontWeight: 'bold' } })}
                >
                  <Heading size={14} style={{ color: '#38BDF8' }} /> Heading
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('text', { styles: { fontSize: 9 } })}
                >
                  <Type size={14} style={{ color: '#818CF8' }} /> Body Text
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('bound-text')}
                >
                  <Database size={14} style={{ color: '#A855F7' }} /> Bound Field
                </button>
              </div>
            </div>

            {/* Media & Photos */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                Media & Photos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('photo')}
                >
                  <ImageIcon size={14} style={{ color: '#34D399' }} /> Student Photo
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('image')}
                >
                  <Award size={14} style={{ color: '#FBBF24' }} /> School Emblem / Logo
                </button>
              </div>
            </div>

            {/* Shapes & Layout */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                Shapes & Layout
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('shape')}
                >
                  <Square size={14} style={{ color: '#F472B6' }} /> Rectangle Box
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() =>
                    addElement('shape', {
                      height: 0.5,
                      styles: { backgroundColor: '#CBD5E1' },
                    })
                  }
                >
                  <Minus size={14} style={{ color: '#94A3B8' }} /> Horizontal Divider
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('table')}
                >
                  <TableIcon size={14} style={{ color: '#38BDF8' }} /> Dynamic Table
                </button>
              </div>
            </div>

            {/* Codes & Signatures */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                Codes & Signatures
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('qrcode')}
                >
                  <QrCode size={14} style={{ color: '#22D3EE' }} /> Gate QR Code
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('barcode')}
                >
                  <Barcode size={14} style={{ color: '#A78BFA' }} /> Barcode Strip
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ justifyContent: 'flex-start', color: '#E2E8F0', padding: '6px 10px' }}
                  onClick={() => addElement('signature')}
                >
                  <PenTool size={14} style={{ color: '#FBBF24' }} /> Signature Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CENTER DESIGN CANVAS ── */}
        <div
          ref={canvasRef}
          onClick={() => setSelectedElementId(null)}
          style={{
            flex: 1,
            background: '#0B0F19',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            position: 'relative',
          }}
        >
          {/* Scaled Document Canvas */}
          <div
            id="template-canvas-sheet"
            style={{
              width: canvasWidthPx * zoom,
              height: canvasHeightPx * zoom,
              minWidth: canvasWidthPx * zoom,
              minHeight: canvasHeightPx * zoom,
              backgroundColor: definition.backgroundColor || '#FFFFFF',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden',
              transformOrigin: 'top center',
              transition: isDragging || isResizing ? 'none' : 'width 0.1s ease, height 0.1s ease',
            }}
          >
            {/* Background Grid Lines (Subtle) */}
            {snapToGrid && !previewMode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle, #CBD5E1 0.75px, transparent 0.75px)`,
                  backgroundSize: `${gridSizeMm * MM_TO_PX * zoom}px ${gridSizeMm * MM_TO_PX * zoom}px`,
                  opacity: 0.35,
                }}
              />
            )}

            {/* Elements Layer */}
            {definition.elements.map((el) => {
              const isSelected = selectedElementId === el.id && !previewMode
              const xPx = el.x * MM_TO_PX * zoom
              const yPx = el.y * MM_TO_PX * zoom
              const wPx = el.width * MM_TO_PX * zoom
              const hPx = el.height * MM_TO_PX * zoom
              const s = el.styles || {}

              // Content Resolution in Preview vs Design
              const displayContent = previewMode
                ? resolveTokens(el.content || '', sampleData)
                : el.content

              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!previewMode) setSelectedElementId(el.id)
                  }}
                  onMouseDown={(e) => {
                    if (!previewMode) handleMouseDownOnElement(e, el)
                  }}
                  style={{
                    position: 'absolute',
                    left: xPx,
                    top: yPx,
                    width: wPx,
                    height: hPx,
                    zIndex: el.zIndex || 1,
                    cursor: previewMode ? 'default' : 'move',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    border: isSelected
                      ? '1.5px solid #7C3AED'
                      : !previewMode
                      ? '1px dashed rgba(148, 163, 184, 0.4)'
                      : s.borderWidth
                      ? `${s.borderWidth}px solid ${s.borderColor || '#CBD5E1'}`
                      : 'none',
                    outline: isSelected ? '2px solid rgba(124, 58, 237, 0.25)' : 'none',
                    backgroundColor: s.backgroundColor || 'transparent',
                    borderRadius: s.borderRadius ? s.borderRadius * zoom : 0,
                    opacity: s.opacity !== undefined ? s.opacity : 1,
                    padding: 2,
                    overflow: 'hidden',
                  }}
                >
                  {/* Element Inner Render */}
                  {el.type === 'text' || el.type === 'bound-text' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: (s.fontSize || 10) * zoom * 1.33,
                        fontWeight: s.fontWeight || 'normal',
                        fontFamily: s.fontFamily || 'Inter, sans-serif',
                        color: s.color || '#0F172A',
                        textAlign: s.textAlign || 'left',
                        lineHeight: s.lineHeight || 1.3,
                        letterSpacing: s.letterSpacing ? s.letterSpacing * zoom : undefined,
                        textTransform: s.textTransform || 'none',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {displayContent}
                    </div>
                  ) : el.type === 'shape' ? (
                    <div style={{ width: '100%', height: '100%' }} />
                  ) : el.type === 'photo' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F1F5F9',
                        color: '#64748B',
                        fontSize: 9 * zoom,
                        fontWeight: 600,
                        border: '1px dashed #CBD5E1',
                        borderRadius: s.borderRadius || 4,
                      }}
                    >
                      {previewMode ? (
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 18 * zoom }}>👤</span>
                          <div style={{ fontSize: 7 * zoom }}>Aarav Sharma</div>
                        </div>
                      ) : (
                        <span>[ PHOTO ]</span>
                      )}
                    </div>
                  ) : el.type === 'image' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        fontSize: 9 * zoom,
                        fontWeight: 700,
                      }}
                    >
                      <span>🛡️ LOGO</span>
                    </div>
                  ) : el.type === 'qrcode' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 6 * zoom,
                        color: '#0F172A',
                        padding: 2,
                      }}
                    >
                      <QrCode size={Math.min(wPx, hPx) * 0.7} />
                      <div style={{ fontSize: 5 * zoom, color: '#64748B', marginTop: 1 }}>VERIFY</div>
                    </div>
                  ) : el.type === 'barcode' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 6 * zoom,
                        color: '#0F172A',
                        padding: 2,
                      }}
                    >
                      <Barcode size={Math.min(wPx, hPx) * 0.7} />
                      <div style={{ fontSize: 5 * zoom, color: '#64748B', fontFamily: 'monospace' }}>
                        *PRE-2026-0042*
                      </div>
                    </div>
                  ) : el.type === 'signature' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ width: '80%', borderTop: '1px solid #94A3B8', marginBottom: 2 * zoom }} />
                      <div
                        style={{
                          fontSize: 7 * zoom,
                          color: '#475569',
                          textAlign: 'center',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {displayContent}
                      </div>
                    </div>
                  ) : el.type === 'table' ? (
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7 * zoom }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                            {(
                              s.tableColumns || [
                                { key: 'c1', label: 'Item', widthPercent: 60, align: 'left' },
                                { key: 'c2', label: 'Amount', widthPercent: 40, align: 'right' },
                              ]
                            ).map((c) => (
                              <th
                                key={c.key}
                                style={{
                                  padding: '2px 4px',
                                  textAlign: c.align,
                                  width: `${c.widthPercent}%`,
                                  fontWeight: 600,
                                  color: '#334155',
                                }}
                              >
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '2px 4px' }}>Term 1 Tuition & Learning Kit</td>
                            <td style={{ padding: '2px 4px' }}>Term 1</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>₹18,500.00</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '2px 4px' }}>Meal & Nutrition Plan</td>
                            <td style={{ padding: '2px 4px' }}>Term 1</td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>₹4,000.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {/* 8 Resize Handles (When Selected) */}
                  {isSelected && (
                    <>
                      {['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'].map((h) => {
                        const stylePos: React.CSSProperties = {
                          position: 'absolute',
                          width: 7,
                          height: 7,
                          background: '#7C3AED',
                          border: '1px solid #FFFFFF',
                          borderRadius: 1,
                          zIndex: 10,
                        }
                        if (h.includes('n')) stylePos.top = -4
                        if (h.includes('s')) stylePos.bottom = -4
                        if (h.includes('w')) stylePos.left = -4
                        if (h.includes('e')) stylePos.right = -4
                        if (h === 'n' || h === 's') stylePos.left = 'calc(50% - 3.5px)'
                        if (h === 'e' || h === 'w') stylePos.top = 'calc(50% - 3.5px)'

                        return (
                          <div
                            key={h}
                            onMouseDown={(e) => handleMouseDownOnResize(e, h)}
                            style={{
                              ...stylePos,
                              cursor: `${h}-resize`,
                            }}
                          />
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PROPERTIES INSPECTOR ── */}
        {!previewMode && (
          <div
            style={{
              width: 290,
              background: '#1E293B',
              borderLeft: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              padding: 14,
              gap: 16,
              overflowY: 'auto',
            }}
          >
            {selectedElement ? (
              /* ELEMENT INSPECTOR */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                    {selectedElement.name}
                  </div>
                  <span
                    style={{
                      background: '#334155',
                      color: '#A855F7',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedElement.type}
                  </span>
                </div>

                {/* Layer Ordering */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1, fontSize: 11, padding: '4px' }}
                    onClick={() => bringToFront(selectedElement.id)}
                    title="Bring to Front"
                  >
                    Bring to Front
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1, fontSize: 11, padding: '4px' }}
                    onClick={() => sendToBack(selectedElement.id)}
                    title="Send to Back"
                  >
                    Send to Back
                  </button>
                </div>

                {/* Geometry: X, Y, W, H */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                    Position & Size (mm)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: '#64748B' }}>X (mm)</label>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#64748B' }}>Y (mm)</label>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#64748B' }}>Width (mm)</label>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#64748B' }}>Height (mm)</label>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Data Binding Selector */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Database Binding</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: 10, color: '#A855F7', padding: '2px 4px' }}
                      onClick={() => setFieldPickerOpen(true)}
                    >
                      Browse...
                    </button>
                  </div>
                  <select
                    className="select"
                    style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                    value={selectedElement.fieldBinding || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      updateElement(selectedElement.id, {
                        fieldBinding: val || undefined,
                        content: val ? `{{${val}}}` : selectedElement.content,
                      })
                    }}
                  >
                    <option value="">(No direct binding)</option>
                    {APPROVED_TEMPLATE_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.domain} • {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Editor */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                    Text Content
                  </div>
                  <textarea
                    rows={3}
                    className="textarea"
                    style={{ fontSize: 12, padding: '6px', background: '#0F172A', color: '#F8FAFC', width: '100%' }}
                    value={selectedElement.content || ''}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  />
                </div>

                {/* Typography (if text or bound-text) */}
                {(selectedElement.type === 'text' || selectedElement.type === 'bound-text') && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                      Typography
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B' }}>Font Size (pt)</label>
                        <input
                          type="number"
                          className="input"
                          style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                          value={selectedElement.styles.fontSize || 10}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              styles: { ...selectedElement.styles, fontSize: parseFloat(e.target.value) || 10 },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B' }}>Font Weight</label>
                        <select
                          className="select"
                          style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                          value={selectedElement.styles.fontWeight || 'normal'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              styles: { ...selectedElement.styles, fontWeight: e.target.value as any },
                            })
                          }
                        >
                          <option value="normal">Regular (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="600">Semibold (600)</option>
                          <option value="bold">Bold (700)</option>
                        </select>
                      </div>
                    </div>

                    {/* Text Align & Color */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['left', 'center', 'right'] as const).map((al) => (
                          <button
                            key={al}
                            type="button"
                            className={`btn btn-sm ${
                              (selectedElement.styles.textAlign || 'left') === al ? 'btn-primary' : 'btn-ghost'
                            }`}
                            style={{ padding: '4px 8px' }}
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                styles: { ...selectedElement.styles, textAlign: al },
                              })
                            }
                          >
                            {al === 'left' && <AlignLeft size={13} />}
                            {al === 'center' && <AlignCenter size={13} />}
                            {al === 'right' && <AlignRight size={13} />}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label style={{ fontSize: 11, color: '#94A3B8' }}>Color:</label>
                        <input
                          type="color"
                          value={selectedElement.styles.color || '#0F172A'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              styles: { ...selectedElement.styles, color: e.target.value },
                            })
                          }
                          style={{
                            width: 28,
                            height: 28,
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: 'transparent',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Styling: Fill, Border, Radius */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                    Appearance & Border
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>Background Fill</span>
                      <input
                        type="color"
                        value={selectedElement.styles.backgroundColor || '#FFFFFF'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            styles: { ...selectedElement.styles, backgroundColor: e.target.value },
                          })
                        }
                        style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>Border Color</span>
                      <input
                        type="color"
                        value={selectedElement.styles.borderColor || '#CBD5E1'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            styles: { ...selectedElement.styles, borderColor: e.target.value },
                          })
                        }
                        style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B' }}>Border Width</label>
                        <input
                          type="number"
                          className="input"
                          style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                          value={selectedElement.styles.borderWidth || 0}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              styles: { ...selectedElement.styles, borderWidth: parseFloat(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#64748B' }}>Border Radius</label>
                        <input
                          type="number"
                          className="input"
                          style={{ height: 28, fontSize: 12, padding: '2px 6px', background: '#0F172A', color: '#F8FAFC' }}
                          value={selectedElement.styles.borderRadius || 0}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              styles: { ...selectedElement.styles, borderRadius: parseFloat(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Element Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => duplicateElement(selectedElement.id)}
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => deleteElement(selectedElement.id)}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              /* PAGE / DOCUMENT INSPECTOR */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                  Document Settings
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94A3B8' }}>Document Type</label>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>
                    {DOCUMENT_TYPE_CONFIG[templateType]?.label}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94A3B8' }}>Page Format</label>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>
                    {PAGE_DIMENSIONS[definition.pageSize]?.name || definition.pageSize}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    {definition.widthMm} × {definition.heightMm} mm ({definition.orientation})
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#CBD5E1' }}>Sheet Background</span>
                    <input
                      type="color"
                      value={definition.backgroundColor || '#FFFFFF'}
                      onChange={(e) => {
                        const newDef = { ...definition, backgroundColor: e.target.value }
                        setDefinition(newDef)
                        pushHistory(newDef)
                      }}
                      style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => {
                        setIsDefault(e.target.checked)
                        setIsDirty(true)
                      }}
                    />
                    Set as Default Active Template
                  </label>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Used automatically by preschool operations when generating this document.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                    💡 <strong>Pro Tip:</strong> Click any element to inspect and move. Use arrow keys to nudge, Shift+arrows for 5mm steps.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DATA FIELD PICKER MODAL ── */}
      {fieldPickerOpen && (
        <Modal
          open
          onClose={() => setFieldPickerOpen(false)}
          title="Preschool Data Field Explorer"
          icon={<Database size={20} />}
          iconClass="ic-purple"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Select an approved preschool database field to inject dynamic tokens into your document layout.
            </p>

            {/* Search & Domain Filter */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 32, width: '100%' }}
                  placeholder="Search fields (e.g. admission, phone, teacher)..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                />
              </div>

              <select
                className="select"
                style={{ width: 160 }}
                value={selectedFieldDomain}
                onChange={(e) => setSelectedFieldDomain(e.target.value)}
              >
                <option value="ALL">All Domains</option>
                {FIELD_DOMAINS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fields List */}
            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {APPROVED_TEMPLATE_FIELDS.filter((f) => {
                if (selectedFieldDomain !== 'ALL' && f.domain !== selectedFieldDomain) return false
                if (
                  fieldSearch.trim() &&
                  !f.label.toLowerCase().includes(fieldSearch.toLowerCase()) &&
                  !f.key.toLowerCase().includes(fieldSearch.toLowerCase())
                ) {
                  return false
                }
                return true
              }).map((f) => (
                <div
                  key={f.key}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-panel)',
                    borderRadius: 6,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {f.label}
                      </span>
                      <span
                        style={{
                          background: 'var(--surface-muted)',
                          color: 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {f.domain}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7C3AED', fontFamily: 'monospace', marginTop: 2 }}>
                      {`{{${f.key}}}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Sample: <em>{f.sampleValue}</em>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        if (selectedElement) {
                          updateElement(selectedElement.id, {
                            fieldBinding: f.key,
                            content: `{{${f.key}}}`,
                          })
                          toast.success(`Bound ${selectedElement.name} to ${f.label}`)
                        } else {
                          addElement('bound-text', {
                            name: f.label,
                            content: `{{${f.key}}}`,
                            fieldBinding: f.key,
                          })
                        }
                        setFieldPickerOpen(false)
                      }}
                    >
                      {selectedElement ? 'Bind to Selected' : 'Add to Canvas'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setFieldPickerOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── PUBLISH VERSION MODAL ── */}
      {publishModalOpen && (
        <Modal
          open
          onClose={() => setPublishModalOpen(false)}
          title="Publish Document Template"
          icon={<CheckCircle2 size={20} />}
          iconClass="ic-green"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Publishing will freeze this template as an official version (v{definition.version + 1}).
              Modules generating {DOCUMENT_TYPE_CONFIG[templateType]?.label || templateType} will use this published layout.
            </p>

            <div
              style={{
                background: 'var(--surface-muted)',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              ✅ Verifies all {definition.elements.length} layout elements<br />
              ✅ Automatically updates Setup Step 15 progress<br />
              ✅ Creates an immutable audit milestone
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPublishModalOpen(false)}
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePublishConfirm}
                disabled={publishing}
              >
                {publishing ? 'Publishing...' : 'Publish Version'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TEST TEMPLATE MODAL ── */}
      {testModalOpen && definition && (
        <TestTemplateModal
          open={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          templateId={templateId}
          templateName={templateName}
          documentType={templateType}
          initialDefinition={definition}
          isPublished={definition.status === 'PUBLISHED'}
          publishedVersion={definition.version}
          currentDraftVersion={definition.version}
          onSetDefaultSuccess={loadTemplate}
        />
      )}
    </div>
  )
}

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
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Heading,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  QrCode,
  Barcode,
  PenTool,
  Award,
  Database,
  Search,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Sliders,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  TemplateDefinition,
  TemplateElement,
  DocumentType,
  PageFormat,
  ElementType,
  ElementStyles,
  PAGE_DIMENSIONS,
  DOCUMENT_TYPE_CONFIG,
} from '@/lib/templates/types'
import {
  APPROVED_TEMPLATE_FIELDS,
  FIELD_DOMAINS,
  FieldDefinition,
  FieldDomain,
  resolveTokens,
  getDefaultSampleData,
  searchApprovedFields,
} from '@/lib/templates/field-registry'
import { TEMPLATE_PRESETS } from '@/lib/templates/presets'
import { TestTemplateModal } from '@/components/templates/TestTemplateModal'

// 1mm = 3.7795275591 px at 96 DPI
const MM_TO_PX = 3.78

interface TemplateEditorProps {
  templateId: string
}

type LeftPanelTab = 'elements' | 'fields'

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
  const [zoom, setZoom] = useState(1.4)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridSizeMm, setGridSizeMm] = useState<number>(2) // 1mm, 2mm, 5mm
  const [previewMode, setPreviewMode] = useState(false)
  const [showMargins, setShowMargins] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)

  // Layout Panels Visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeLeftTab, setActiveLeftTab] = useState<LeftPanelTab>('fields')
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false)

  // Inspector Collapsible Sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    layout: true,
    content: true,
    style: true,
    advanced: false,
  })

  // Elements Collapsible Categories
  const [openElementCategories, setOpenElementCategories] = useState<Record<string, boolean>>({
    text: true,
    media: true,
    shapes: false,
    codes: false,
    signatures: false,
    layout: false,
  })

  // Data Field Groups Collapsed State
  const [openFieldDomains, setOpenFieldDomains] = useState<Record<string, boolean>>({
    STUDENT: true,
    SCHOOL: false,
    GUARDIAN: false,
    CLASSROOM: false,
    FINANCE: false,
    STAFF: false,
    TRANSPORT: false,
    ATTENDANCE: false,
    SYSTEM: false,
  })

  // Field Search State
  const [fieldSearch, setFieldSearch] = useState('')

  // Undo / Redo History
  const [history, setHistory] = useState<TemplateDefinition[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Modals
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [testModalOpen, setTestModalOpen] = useState(false)

  // Canvas Refs & Dragging
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const dragStartRef = useRef<{
    mouseX: number
    mouseY: number
    elemX: number
    elemY: number
    elemW: number
    elemH: number
  }>({
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

  // Fit Page: Auto-scale to fill viewport comfortably
  const fitToPage = useCallback(() => {
    if (!definition || !containerRef.current) return
    const container = containerRef.current
    const availableW = container.clientWidth - 80
    const availableH = container.clientHeight - 80

    const docWidthPx = definition.widthMm * MM_TO_PX
    const docHeightPx = definition.heightMm * MM_TO_PX

    const scaleX = availableW / docWidthPx
    const scaleY = availableH / docHeightPx
    const optimalScale = Math.min(scaleX, scaleY, 2.5)

    setZoom(Math.max(0.4, Math.round(optimalScale * 10) / 10))
  }, [definition])

  // Auto-fit on initial load once definition is ready
  const initialFitDone = useRef(false)
  useEffect(() => {
    if (definition && !initialFitDone.current) {
      initialFitDone.current = true
      setTimeout(() => {
        fitToPage()
      }, 150)
    }
  }, [definition, fitToPage])

  // Helper to record history state
  const pushHistory = useCallback(
    (newDef: TemplateDefinition) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1)
        next.push(newDef)
        return next
      })
      setHistoryIndex((prev) => prev + 1)
      setIsDirty(true)
    },
    [historyIndex]
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevDef = history[historyIndex - 1]
      setDefinition(prevDef)
      setHistoryIndex(historyIndex - 1)
      setIsDirty(true)
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextDef = history[historyIndex + 1]
      setDefinition(nextDef)
      setHistoryIndex(historyIndex + 1)
      setIsDirty(true)
    }
  }, [history, historyIndex])

  // Snap to Grid calculation
  const snapVal = useCallback(
    (val: number) => {
      if (!snapToGrid) return Math.round(val * 10) / 10
      return Math.round(val / gridSizeMm) * gridSizeMm
    },
    [snapToGrid, gridSizeMm]
  )

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
          const merged = { ...el, ...updates }
          if (updates.styles) {
            merged.styles = { ...el.styles, ...updates.styles }
          }
          return merged
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

  // Add a new element
  const addElement = useCallback(
    (type: ElementType, presetOptions?: Partial<TemplateElement>) => {
      if (!definition) return
      const id = 'el_' + Math.random().toString(36).substring(2, 9)
      const defaultX = snapVal(10)
      const defaultY = snapVal(10)

      let newElem: TemplateElement

      switch (type) {
        case 'text':
          newElem = {
            id,
            type: 'text',
            name: presetOptions?.name || 'Text Label',
            x: defaultX,
            y: defaultY,
            width: presetOptions?.width || 60,
            height: presetOptions?.height || 8,
            zIndex: definition.elements.length + 1,
            content: presetOptions?.content || 'Add descriptive text...',
            styles: {
              fontSize: 10,
              color: '#1E293B',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
              ...(presetOptions?.styles || {}),
            },
          }
          break

        case 'bound-text':
          newElem = {
            id,
            type: 'bound-text',
            name: presetOptions?.name || 'Bound Field',
            x: defaultX,
            y: defaultY,
            width: presetOptions?.width || 70,
            height: presetOptions?.height || 8,
            zIndex: definition.elements.length + 1,
            content: presetOptions?.content || '{{student.fullName}}',
            fieldBinding: presetOptions?.fieldBinding || 'student.fullName',
            styles: {
              fontSize: 11,
              fontWeight: '600',
              color: '#1E1B4B',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
              ...(presetOptions?.styles || {}),
            },
          }
          break

        case 'photo':
          newElem = {
            id,
            type: 'photo',
            name: 'Student Photo',
            x: defaultX,
            y: defaultY,
            width: 25,
            height: 30,
            zIndex: definition.elements.length + 1,
            content: '',
            styles: {
              borderRadius: 4,
              borderColor: '#CBD5E1',
              borderWidth: 1,
            },
          }
          break

        case 'image':
          newElem = {
            id,
            type: 'image',
            name: presetOptions?.name || 'School Logo',
            x: defaultX,
            y: defaultY,
            width: 30,
            height: 20,
            zIndex: definition.elements.length + 1,
            content: presetOptions?.content || '/brand/preone-crest.svg',
            styles: {
              objectFit: 'contain',
            },
          }
          break

        case 'qrcode':
          newElem = {
            id,
            type: 'qrcode',
            name: presetOptions?.name || 'Verification QR',
            x: defaultX,
            y: defaultY,
            width: 18,
            height: 18,
            zIndex: definition.elements.length + 1,
            content: 'https://preone.app/verify/cert/LEPA-2026-001',
            fieldBinding: 'system.verifyUrl',
            styles: {},
          }
          break

        case 'barcode':
          newElem = {
            id,
            type: 'barcode',
            name: 'Admission Barcode',
            x: defaultX,
            y: defaultY,
            width: 50,
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
            name: presetOptions?.name || 'Principal Signature',
            x: defaultX,
            y: defaultY,
            width: 45,
            height: 15,
            zIndex: definition.elements.length + 1,
            content: presetOptions?.content || 'Principal & Academic Director',
            styles: {},
          }
          break

        case 'badge':
          newElem = {
            id,
            type: 'badge',
            name: 'Status Badge',
            x: defaultX,
            y: defaultY,
            width: 24,
            height: 7,
            zIndex: definition.elements.length + 1,
            content: '{{fee.status}}',
            fieldBinding: 'fee.status',
            styles: {
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 'bold',
              textAlign: 'center',
            },
          }
          break

        case 'shape':
        default:
          newElem = {
            id,
            type: 'shape',
            name: presetOptions?.name || 'Box Shape',
            x: defaultX,
            y: defaultY,
            width: presetOptions?.width || 50,
            height: presetOptions?.height || 20,
            zIndex: definition.elements.length + 1,
            content: '',
            styles: {
              backgroundColor: presetOptions?.styles?.backgroundColor || '#F8FAFC',
              borderColor: presetOptions?.styles?.borderColor || '#E2E8F0',
              borderWidth: 1,
              borderRadius: 4,
              ...(presetOptions?.styles || {}),
            },
          }
          break
      }

      const newDef: TemplateDefinition = {
        ...definition,
        elements: [...definition.elements, newElem],
      }
      setDefinition(newDef)
      setSelectedElementId(id)
      pushHistory(newDef)
      toast.success('Element Added', `Added ${newElem.name} to template canvas`)
    },
    [definition, pushHistory, snapVal, toast]
  )

  // Insert or Rebind Field
  const handleInsertField = useCallback(
    (field: FieldDefinition) => {
      if (!definition) return

      if (selectedElement) {
        // Rebind current selected element
        updateElement(selectedElement.id, {
          fieldBinding: field.key,
          content: `{{${field.key}}}`,
          name: field.label,
        })
        toast.success('Field Bound', `Bound ${field.label} to selected element`)
      } else {
        // Create new bound-text element
        const id = 'bf_' + Math.random().toString(36).substring(2, 9)
        const defaultX = snapVal(15)
        const defaultY = snapVal(15)

        const newElem: TemplateElement = {
          id,
          type: 'bound-text',
          name: field.label,
          x: defaultX,
          y: defaultY,
          width: 65,
          height: 8,
          zIndex: definition.elements.length + 1,
          content: `{{${field.key}}}`,
          fieldBinding: field.key,
          styles: {
            fontSize: 10,
            fontWeight: '600',
            color: '#1E293B',
            textAlign: 'left',
            fontFamily: 'Inter, sans-serif',
          },
        }

        const newDef: TemplateDefinition = {
          ...definition,
          elements: [...definition.elements, newElem],
        }
        setDefinition(newDef)
        setSelectedElementId(id)
        pushHistory(newDef)
        toast.success('Field Added', `Inserted ${field.label} on canvas`)
      }
    },
    [definition, selectedElement, updateElement, snapVal, pushHistory, toast]
  )

  // Canvas Drag & Drop insertion
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!definition || !canvasRef.current) return

      const raw = e.dataTransfer.getData('text/plain')
      if (!raw) return

      try {
        const payload = JSON.parse(raw)
        const rect = canvasRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        // Convert px to mm
        const dropXMm = snapVal(mouseX / (MM_TO_PX * zoom))
        const dropYMm = snapVal(mouseY / (MM_TO_PX * zoom))

        if (payload.kind === 'field') {
          const field = APPROVED_TEMPLATE_FIELDS.find((f) => f.key === payload.key)
          if (!field) return

          const id = 'bf_' + Math.random().toString(36).substring(2, 9)
          const newElem: TemplateElement = {
            id,
            type: 'bound-text',
            name: field.label,
            x: Math.max(0, Math.min(dropXMm, definition.widthMm - 20)),
            y: Math.max(0, Math.min(dropYMm, definition.heightMm - 8)),
            width: 65,
            height: 8,
            zIndex: definition.elements.length + 1,
            content: `{{${field.key}}}`,
            fieldBinding: field.key,
            styles: {
              fontSize: 10,
              fontWeight: '600',
              color: '#1E293B',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
            },
          }

          const newDef: TemplateDefinition = {
            ...definition,
            elements: [...definition.elements, newElem],
          }
          setDefinition(newDef)
          setSelectedElementId(id)
          pushHistory(newDef)
          toast.success('Field Placed', `Placed ${field.label} at ${dropXMm}mm, ${dropYMm}mm`)
        }
      } catch (err) {
        // ignore non-json drops
      }
    },
    [definition, zoom, snapVal, pushHistory, toast]
  )

  // Duplicate selected element
  const handleDuplicate = useCallback(() => {
    if (!definition || !selectedElement) return
    const id = 'el_' + Math.random().toString(36).substring(2, 9)
    const cloned: TemplateElement = {
      ...selectedElement,
      id,
      name: `${selectedElement.name} (Copy)`,
      x: snapVal(Math.min(selectedElement.x + 4, definition.widthMm - selectedElement.width)),
      y: snapVal(Math.min(selectedElement.y + 4, definition.heightMm - selectedElement.height)),
      zIndex: definition.elements.length + 1,
    }

    const newDef: TemplateDefinition = {
      ...definition,
      elements: [...definition.elements, cloned],
    }
    setDefinition(newDef)
    setSelectedElementId(id)
    pushHistory(newDef)
    toast.success('Duplicated', `Created copy of ${selectedElement.name}`)
  }, [definition, selectedElement, snapVal, pushHistory, toast])

  // Delete element
  const handleDeleteElement = useCallback(
    (id: string) => {
      if (!definition) return
      const newDef: TemplateDefinition = {
        ...definition,
        elements: definition.elements.filter((el) => el.id !== id),
      }
      setDefinition(newDef)
      setSelectedElementId(null)
      pushHistory(newDef)
      toast.info('Element Deleted', 'Removed element from canvas')
    },
    [definition, pushHistory, toast]
  )

  // Re-order Z-Index
  const handleMoveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      if (!definition) return
      const idx = definition.elements.findIndex((e) => e.id === id)
      if (idx === -1) return
      if (direction === 'up' && idx === definition.elements.length - 1) return
      if (direction === 'down' && idx === 0) return

      const newElements = [...definition.elements]
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1
      const temp = newElements[idx]
      newElements[idx] = newElements[targetIdx]
      newElements[targetIdx] = temp

      // Recalculate zIndices sequentially
      newElements.forEach((el, i) => {
        el.zIndex = i + 1
      })

      const newDef: TemplateDefinition = {
        ...definition,
        elements: newElements,
      }
      setDefinition(newDef)
      pushHistory(newDef)
    },
    [definition, pushHistory]
  )

  // Mouse interaction: Drag element on canvas
  const handleMouseDownOnElement = useCallback(
    (e: React.MouseEvent, el: TemplateElement) => {
      if (previewMode || el.locked) return
      e.stopPropagation()
      setSelectedElementId(el.id)
      setIsDragging(true)
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemX: el.x,
        elemY: el.y,
        elemW: el.width,
        elemH: el.height,
      }
    },
    [previewMode]
  )

  // Mouse interaction: Resize element
  const handleMouseDownOnResize = useCallback(
    (e: React.MouseEvent, handle: string) => {
      if (previewMode || !selectedElement || selectedElement.locked) return
      e.stopPropagation()
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
    },
    [previewMode, selectedElement]
  )

  // Window Mouse Move & Up Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!definition || !selectedElement) return

      const deltaX = (e.clientX - dragStartRef.current.mouseX) / (MM_TO_PX * zoom)
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / (MM_TO_PX * zoom)

      if (isDragging) {
        const rawX = dragStartRef.current.elemX + deltaX
        const rawY = dragStartRef.current.elemY + deltaY
        const nextX = Math.max(0, Math.min(snapVal(rawX), definition.widthMm - selectedElement.width))
        const nextY = Math.max(0, Math.min(snapVal(rawY), definition.heightMm - selectedElement.height))

        setDefinition((prev) => {
          if (!prev) return null
          return {
            ...prev,
            elements: prev.elements.map((el) => (el.id === selectedElement.id ? { ...el, x: nextX, y: nextY } : el)),
          }
        })
      } else if (isResizing && resizeHandle) {
        let newX = dragStartRef.current.elemX
        let newY = dragStartRef.current.elemY
        let newW = dragStartRef.current.elemW
        let newH = dragStartRef.current.elemH

        if (resizeHandle.includes('e')) {
          newW = Math.max(4, snapVal(dragStartRef.current.elemW + deltaX))
        }
        if (resizeHandle.includes('s')) {
          newH = Math.max(2, snapVal(dragStartRef.current.elemH + deltaY))
        }
        if (resizeHandle.includes('w')) {
          const maxLeftDelta = dragStartRef.current.elemW - 4
          const clampedDeltaX = Math.min(maxLeftDelta, deltaX)
          newX = Math.max(0, snapVal(dragStartRef.current.elemX + clampedDeltaX))
          newW = Math.max(4, snapVal(dragStartRef.current.elemW - clampedDeltaX))
        }
        if (resizeHandle.includes('n')) {
          const maxTopDelta = dragStartRef.current.elemH - 2
          const clampedDeltaY = Math.min(maxTopDelta, deltaY)
          newY = Math.max(0, snapVal(dragStartRef.current.elemY + clampedDeltaY))
          newH = Math.max(2, snapVal(dragStartRef.current.elemH - clampedDeltaY))
        }

        setDefinition((prev) => {
          if (!prev) return null
          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === selectedElement.id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el
            ),
          }
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false)
        setIsResizing(false)
        setResizeHandle(null)
        if (definition) pushHistory(definition)
      }
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeHandle, definition, selectedElement, zoom, snapVal, pushHistory])

  // Save Draft API
  const handleSaveDraft = async () => {
    if (!definition) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          content: definition,
          isDefault,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setIsDirty(false)
        toast.success('Draft Saved', `Template "${templateName}" saved successfully.`)
      } else {
        toast.error('Save failed', json.error?.message || 'Unknown error occurred')
      }
    } catch (err: any) {
      toast.error('Save error', err.message)
    } finally {
      setSaving(false)
    }
  }

  // Publish Version API
  const handlePublish = async () => {
    if (!definition) return
    setPublishing(true)
    try {
      if (isDirty) {
        await handleSaveDraft()
      }

      const res = await fetch(`/api/v1/templates/${templateId}/publish`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Template Published', `Version ${json.data.content?.version} is now live and official.`)
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

  // Keyboard accelerators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveDraft()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        handleDuplicate()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !previewMode) {
          e.preventDefault()
          handleDeleteElement(selectedElementId)
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElement && !previewMode && !selectedElement.locked) {
          e.preventDefault()
          const step = e.shiftKey ? 5 : 1
          let nextX = selectedElement.x
          let nextY = selectedElement.y
          if (e.key === 'ArrowUp') nextY = Math.max(0, nextY - step)
          if (e.key === 'ArrowDown') nextY = Math.min(definition?.heightMm || 100, nextY + step)
          if (e.key === 'ArrowLeft') nextX = Math.max(0, nextX - step)
          if (e.key === 'ArrowRight') nextX = Math.min(definition?.widthMm || 100, nextX + step)
          updateElement(selectedElement.id, { x: nextX, y: nextY })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleSaveDraft,
    handleUndo,
    handleRedo,
    handleDuplicate,
    handleDeleteElement,
    selectedElementId,
    selectedElement,
    previewMode,
    definition,
    updateElement,
  ])

  // Filtered Canonical Fields
  const filteredFields = useMemo(() => {
    return searchApprovedFields(fieldSearch, 'ALL')
  }, [fieldSearch])

  // Grouped Fields by Domain
  const groupedFields = useMemo(() => {
    const map: Record<string, FieldDefinition[]> = {}
    FIELD_DOMAINS.forEach((dom) => {
      map[dom.key] = []
    })
    filteredFields.forEach((field) => {
      if (!map[field.domain]) map[field.domain] = []
      map[field.domain].push(field)
    })
    return map
  }, [filteredFields])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '85vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={36} className="spin" style={{ color: '#7C3AED', marginBottom: 14 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            Loading Template Studio 2.0...
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Preparing high-precision canvas & database bindings
          </div>
        </div>
      </div>
    )
  }

  if (!definition) {
    return (
      <div
        style={{
          display: 'flex',
          height: '85vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          Template Not Found or Inaccessible
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          This template does not exist or belongs to another school tenant.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push('/app/setup/templates')}
        >
          Return to Template Library
        </button>
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
        background: 'var(--bg-page, #0F172A)',
        color: 'var(--text-primary, #F8FAFC)',
      }}
    >
      {/* ── 1. COMPACT TOP TOOLBAR ── */}
      <header
        style={{
          height: 52,
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          background: 'var(--surface-solid, #1E293B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          zIndex: 30,
          gap: 8,
        }}
      >
        {/* Left: Navigation, Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--text-secondary, #94A3B8)', padding: '6px' }}
            onClick={() => router.push('/app/setup/templates')}
            title="Return to Template Library"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Editable Template Title */}
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
              color: 'var(--text-primary, #FFFFFF)',
              fontSize: 14,
              fontWeight: 700,
              padding: '3px 6px',
              borderRadius: 6,
              outline: 'none',
              maxWidth: 200,
              textOverflow: 'ellipsis',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--brand-500, #8B5CF6)')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            placeholder="Template Name..."
            title="Click to rename template"
          />

          {/* Doc Type & Version Badges */}
          <span
            style={{
              background: 'rgba(124, 58, 237, 0.12)',
              color: 'var(--brand-300, #C4B5FD)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {DOCUMENT_TYPE_CONFIG[templateType]?.label || templateType}
          </span>

          <span
            style={{
              background:
                definition.status === 'PUBLISHED'
                  ? 'rgba(5, 150, 105, 0.12)'
                  : 'rgba(217, 119, 6, 0.12)',
              color: definition.status === 'PUBLISHED' ? '#34D399' : '#FBBF24',
              border: `1px solid ${
                definition.status === 'PUBLISHED'
                  ? 'rgba(5, 150, 105, 0.3)'
                  : 'rgba(217, 119, 6, 0.3)'
              }`,
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            v{definition.version}
          </span>

          {/* Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: saving ? '#38BDF8' : isDirty ? '#F97316' : '#10B981',
              fontWeight: 500,
              marginLeft: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: saving ? '#38BDF8' : isDirty ? '#F97316' : '#10B981',
              }}
            />
            <span>{saving ? 'Saving...' : isDirty ? 'Unsaved' : 'Saved'}</span>
          </div>
        </div>

        {/* Center: Tools (Undo/Redo, Zoom, Fit, View, Mode) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* History Undo / Redo */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{
              color:
                historyIndex > 0
                  ? 'var(--text-primary, #FFFFFF)'
                  : 'var(--text-muted, #64748B)',
              padding: '6px',
            }}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{
              color:
                historyIndex < history.length - 1
                  ? 'var(--text-primary, #FFFFFF)'
                  : 'var(--text-muted, #64748B)',
              padding: '6px',
            }}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>

          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--border, rgba(255,255,255,0.12))',
              margin: '0 4px',
            }}
          />

          {/* Zoom Out & In */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--text-secondary, #CBD5E1)', padding: '5px' }}
            onClick={() => setZoom((prev) => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <select
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #CBD5E1)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
              outline: 'none',
            }}
            title="Zoom percentage"
          >
            <option value="50" style={{ background: '#1E293B' }}>50%</option>
            <option value="75" style={{ background: '#1E293B' }}>75%</option>
            <option value="100" style={{ background: '#1E293B' }}>100%</option>
            <option value="125" style={{ background: '#1E293B' }}>125%</option>
            <option value="140" style={{ background: '#1E293B' }}>140%</option>
            <option value="175" style={{ background: '#1E293B' }}>175%</option>
            <option value="200" style={{ background: '#1E293B' }}>200%</option>
          </select>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--text-secondary, #CBD5E1)', padding: '5px' }}
            onClick={() => setZoom((prev) => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          {/* Fit Page */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--brand-300, #C4B5FD)', fontSize: 11, padding: '4px 6px', gap: 3 }}
            onClick={fitToPage}
            title="Fit Page in Viewport"
          >
            <Maximize2 size={13} /> Fit
          </button>

          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--border, rgba(255,255,255,0.12))',
              margin: '0 4px',
            }}
          />

          {/* Preview Data Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              gap: 4,
              background: previewMode ? 'var(--brand-600, #7C3AED)' : 'transparent',
              color: previewMode ? '#FFFFFF' : 'var(--text-secondary, #CBD5E1)',
            }}
            onClick={() => {
              setPreviewMode(!previewMode)
              if (!previewMode) setSelectedElementId(null)
            }}
            title={previewMode ? 'Back to Visual Design' : 'Preview with Sample Data'}
          >
            {previewMode ? <Edit3 size={13} /> : <Eye size={13} />}
            <span>{previewMode ? 'Design' : 'Preview'}</span>
          </button>

          {/* View Menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{
                fontSize: 11,
                padding: '3px 7px',
                gap: 4,
                color: snapToGrid ? 'var(--brand-300, #C4B5FD)' : 'var(--text-muted, #94A3B8)',
              }}
              onClick={() => setViewMenuOpen(!viewMenuOpen)}
              title="View Options"
            >
              <Grid size={13} /> View <ChevronDown size={11} />
            </button>

            {viewMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 180,
                  background: 'var(--surface-solid, #1E293B)',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  borderRadius: 8,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  padding: 8,
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  Snap to Grid
                </label>

                {snapToGrid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 20 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Grid:</span>
                    {[1, 2, 5].map((mm) => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => setGridSizeMm(mm)}
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 3,
                          border: 'none',
                          cursor: 'pointer',
                          background: gridSizeMm === mm ? 'var(--brand-600, #7C3AED)' : 'rgba(255,255,255,0.06)',
                          color: '#FFFFFF',
                        }}
                      >
                        {mm}mm
                      </button>
                    ))}
                  </div>
                )}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showMargins}
                    onChange={(e) => setShowMargins(e.target.checked)}
                  />
                  Show Margins
                </label>
              </div>
            )}
          </div>

          {/* Layers Toggle Button */}
          <button
            type="button"
            className={`btn btn-sm ${layersDrawerOpen ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              gap: 4,
              color: layersDrawerOpen ? 'var(--brand-300, #C4B5FD)' : 'var(--text-secondary, #CBD5E1)',
            }}
            onClick={() => setLayersDrawerOpen(!layersDrawerOpen)}
            title="Toggle Document Layers"
          >
            <Layers size={13} /> Layers
          </button>
        </div>

        {/* Right: Test, Save & Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: 'rgba(124, 58, 237, 0.15)',
              color: 'var(--brand-300, #DDD6FE)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              fontSize: 11,
              fontWeight: 600,
              gap: 5,
              padding: '4px 10px',
            }}
            onClick={() => setTestModalOpen(true)}
            title="Test Template with Live Database Records & PDF Generation"
          >
            <Sparkles size={13} /> Test Template
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{ fontSize: 11, gap: 5, padding: '4px 10px' }}
          >
            <Save size={13} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setPublishModalOpen(true)}
            style={{
              background: 'var(--brand-600, #7C3AED)',
              borderColor: 'var(--brand-600, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
              gap: 5,
              padding: '4px 10px',
            }}
          >
            <CheckCircle2 size={13} /> Publish Version
          </button>
        </div>
      </header>

      {/* ── 2. THREE-PANEL WORKSPACE BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* ── LEFT PANEL: ELEMENTS & DATA FIELDS ONLY ── */}
        {!previewMode && (
          <aside
            style={{
              width: leftPanelOpen ? 260 : 40,
              transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'var(--surface-solid, #1E293B)',
              borderRight: '1px solid var(--border, rgba(255,255,255,0.08))',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 15,
              overflow: 'hidden',
            }}
          >
            {/* Panel Tab Switcher Header (Elements & Data Fields Only) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                background: 'rgba(0,0,0,0.12)',
                padding: leftPanelOpen ? '4px 8px' : '4px 2px',
                justifyContent: 'space-between',
              }}
            >
              {leftPanelOpen ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className={`btn btn-xs ${activeLeftTab === 'fields' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      background: activeLeftTab === 'fields' ? 'var(--brand-600, #7C3AED)' : 'transparent',
                    }}
                    onClick={() => setActiveLeftTab('fields')}
                    title="Database Field Catalog"
                  >
                    <Database size={12} /> Data Fields
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${activeLeftTab === 'elements' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      background: activeLeftTab === 'elements' ? 'var(--brand-600, #7C3AED)' : 'transparent',
                    }}
                    onClick={() => setActiveLeftTab('elements')}
                    title="Insert Design Elements"
                  >
                    <Plus size={12} /> Elements
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setLeftPanelOpen(true)
                      setActiveLeftTab('fields')
                    }}
                    title="Open Data Fields"
                  >
                    <Database size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setLeftPanelOpen(true)
                      setActiveLeftTab('elements')
                    }}
                    title="Open Elements"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}

              {/* Panel Collapse / Expand Button */}
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                title={leftPanelOpen ? 'Collapse Left Panel' : 'Expand Left Panel'}
              >
                {leftPanelOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
              </button>
            </div>

            {/* TAB CONTENT */}
            {leftPanelOpen && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '10px 8px', gap: 10 }}>
                {/* ── TAB 1: DATA FIELDS ── */}
                {activeLeftTab === 'fields' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Search Field */}
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={13}
                        style={{
                          position: 'absolute',
                          left: 9,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                        }}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder="Search student, class, parent, school..."
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        style={{
                          height: 30,
                          fontSize: 11,
                          paddingLeft: 28,
                          paddingRight: fieldSearch ? 26 : 6,
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border, rgba(255,255,255,0.1))',
                          borderRadius: 6,
                          width: '100%',
                          color: 'var(--text-primary)',
                        }}
                      />
                      {fieldSearch && (
                        <button
                          type="button"
                          onClick={() => setFieldSearch('')}
                          style={{
                            position: 'absolute',
                            right: 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>

                    {/* Grouped Accordions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {FIELD_DOMAINS.map((dom) => {
                        const fieldsInDom = groupedFields[dom.key] || []
                        if (fieldSearch && fieldsInDom.length === 0) return null
                        const isOpen = fieldSearch ? true : openFieldDomains[dom.key]

                        return (
                          <div
                            key={dom.key}
                            style={{
                              border: '1px solid var(--border, rgba(255,255,255,0.06))',
                              borderRadius: 6,
                              overflow: 'hidden',
                              background: 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenFieldDomains((prev) => ({ ...prev, [dom.key]: !prev[dom.key] }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: dom.color,
                                  }}
                                />
                                <span>{dom.label}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                  ({fieldsInDom.length})
                                </span>
                              </div>
                              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>

                            {isOpen && (
                              <div style={{ padding: '2px 4px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {fieldsInDom.map((field) => (
                                  <div
                                    key={field.key}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(
                                        'text/plain',
                                        JSON.stringify({ kind: 'field', key: field.key })
                                      )
                                    }}
                                    onClick={() => handleInsertField(field)}
                                    title={`Click to ${selectedElement ? 'rebind selected' : 'insert'}\nToken: {{${field.key}}}\nSample: ${field.sampleValue}`}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 4,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      cursor: 'pointer',
                                      background: 'transparent',
                                      transition: 'background 0.1s ease',
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background = 'transparent')
                                    }
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {field.label}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span
                                        style={{
                                          fontSize: 9,
                                          color: 'var(--text-muted)',
                                          padding: '1px 3px',
                                          borderRadius: 3,
                                          background: 'rgba(255,255,255,0.05)',
                                        }}
                                      >
                                        {(field.dataType || 'text').substring(0, 3)}
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-ghost"
                                        style={{
                                          padding: '1px 4px',
                                          fontSize: 10,
                                          color: 'var(--brand-300, #C4B5FD)',
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleInsertField(field)
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {filteredFields.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: 11 }}>
                          No matching database fields.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 2: ELEMENTS ── */}
                {activeLeftTab === 'elements' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Category: Text */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenElementCategories((prev) => ({ ...prev, text: !prev.text }))
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Type size={13} style={{ color: '#38BDF8' }} />
                          <span>Text</span>
                        </div>
                        {openElementCategories.text ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {openElementCategories.text && (
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('text', {
                                name: 'Heading',
                                content: 'Document Heading',
                                styles: { fontSize: 16, fontWeight: 'bold' },
                              })
                            }
                          >
                            <Heading size={13} style={{ color: '#38BDF8' }} /> Heading 16pt
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('text', {
                                name: 'Subheading',
                                content: 'Section Subtitle',
                                styles: { fontSize: 12, fontWeight: '600' },
                              })
                            }
                          >
                            <Type size={13} style={{ color: '#38BDF8' }} /> Subheading 12pt
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('text', {
                                name: 'Body Text',
                                content: 'Standard readable paragraph text',
                                styles: { fontSize: 10 },
                              })
                            }
                          >
                            <Type size={13} style={{ color: 'var(--text-muted)' }} /> Body Text 10pt
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('text', {
                                name: 'Caption Note',
                                content: 'Small label or disclaimer',
                                styles: { fontSize: 8, color: '#64748B' },
                              })
                            }
                          >
                            <Type size={11} style={{ color: 'var(--text-muted)' }} /> Caption 8pt
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category: Photos & Images */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenElementCategories((prev) => ({ ...prev, media: !prev.media }))
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ImageIcon size={13} style={{ color: '#34D399' }} />
                          <span>Photos & Images</span>
                        </div>
                        {openElementCategories.media ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {openElementCategories.media && (
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('photo')}
                          >
                            <ImageIcon size={13} style={{ color: '#34D399' }} /> Student Photo
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('image')}
                          >
                            <Award size={13} style={{ color: '#FBBF24' }} /> School Logo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category: Shapes */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenElementCategories((prev) => ({ ...prev, shapes: !prev.shapes }))
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Square size={13} style={{ color: '#F472B6' }} />
                          <span>Shapes</span>
                        </div>
                        {openElementCategories.shapes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {openElementCategories.shapes && (
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('shape')}
                          >
                            <Square size={13} style={{ color: '#F472B6' }} /> Rectangle Box
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('shape', {
                                name: 'Divider Line',
                                width: 70,
                                height: 1,
                                styles: { backgroundColor: '#CBD5E1', borderWidth: 0 },
                              })
                            }
                          >
                            <Minus size={13} style={{ color: '#94A3B8' }} /> Divider Line
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('badge')}
                          >
                            <Award size={13} style={{ color: '#10B981' }} /> Status Badge
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category: QR & Barcode */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenElementCategories((prev) => ({ ...prev, codes: !prev.codes }))
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <QrCode size={13} style={{ color: '#A78BFA' }} />
                          <span>QR & Barcode</span>
                        </div>
                        {openElementCategories.codes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {openElementCategories.codes && (
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('qrcode')}
                          >
                            <QrCode size={13} style={{ color: '#A78BFA' }} /> Verification QR
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('barcode')}
                          >
                            <Barcode size={13} style={{ color: '#CBD5E1' }} /> Admission Barcode
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category: Signatures */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenElementCategories((prev) => ({ ...prev, signatures: !prev.signatures }))
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PenTool size={13} style={{ color: '#F59E0B' }} />
                          <span>Signatures</span>
                        </div>
                        {openElementCategories.signatures ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {openElementCategories.signatures && (
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() => addElement('signature', { name: 'Principal Signature' })}
                          >
                            <PenTool size={13} style={{ color: '#F59E0B' }} /> Principal Signature
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ justifyContent: 'flex-start', fontSize: 11, padding: '5px 8px', gap: 6 }}
                            onClick={() =>
                              addElement('signature', {
                                name: 'Authorized Signatory',
                                content: 'Authorized Signatory',
                              })
                            }
                          >
                            <PenTool size={13} style={{ color: '#94A3B8' }} /> Authorized Signatory
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* ── LAYERS SECONDARY DRAWER (OFF-CANVAS) ── */}
        {layersDrawerOpen && (
          <aside
            style={{
              position: 'absolute',
              left: leftPanelOpen ? 260 : 40,
              top: 0,
              bottom: 0,
              width: 250,
              background: 'var(--surface-solid, #1E293B)',
              borderRight: '1px solid var(--border, rgba(255,255,255,0.1))',
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Layers size={14} style={{ color: 'var(--brand-300, #C4B5FD)' }} />
                <span>Layers ({definition.elements.length})</span>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => setLayersDrawerOpen(false)}
                style={{ padding: 4 }}
              >
                <X size={13} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...definition.elements].reverse().map((el, revIdx) => {
                const isSelected = selectedElementId === el.id
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: 4,
                      background: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                      border: isSelected ? '1px solid #7C3AED' : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {el.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        style={{ padding: '2px 4px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveLayer(el.id, 'up')
                        }}
                        title="Bring Forward"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        style={{ padding: '2px 4px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveLayer(el.id, 'down')
                        }}
                        title="Send Backward"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        style={{ padding: '2px 4px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          updateElement(el.id, { locked: !el.locked })
                        }}
                        title={el.locked ? 'Unlock' : 'Lock'}
                      >
                        {el.locked ? <Lock size={11} style={{ color: '#F97316' }} /> : <Unlock size={11} />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        )}

        {/* ── CENTRAL VISUAL CANVAS WORKSPACE ── */}
        <div
          ref={containerRef}
          onClick={() => setSelectedElementId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          style={{
            flex: 1,
            background: 'var(--bg-canvas, #090D16)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '30px 20px',
            position: 'relative',
          }}
        >
          {/* Scaled Document Canvas Sheet */}
          <div
            ref={canvasRef}
            id="template-canvas-sheet"
            data-testid="template-canvas"
            style={{
              width: canvasWidthPx * zoom,
              height: canvasHeightPx * zoom,
              minWidth: canvasWidthPx * zoom,
              minHeight: canvasHeightPx * zoom,
              backgroundColor: definition.backgroundColor || '#FFFFFF',
              boxShadow: '0 20px 45px -10px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)',
              borderRadius: definition.pageSize.includes('ID_CARD') ? 10 : 2,
              position: 'relative',
              overflow: 'hidden',
              transformOrigin: 'top center',
              transition: isDragging || isResizing ? 'none' : 'width 0.15s ease, height 0.15s ease',
            }}
          >
            {/* Background Grid Lines when Snap is enabled in View menu */}
            {snapToGrid && !previewMode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle, #94A3B8 0.75px, transparent 0.75px)`,
                  backgroundSize: `${gridSizeMm * MM_TO_PX * zoom}px ${gridSizeMm * MM_TO_PX * zoom}px`,
                  opacity: 0.35,
                }}
              />
            )}

            {/* Printable Margin Guidelines */}
            {showMargins && !previewMode && definition.marginsMm && (
              <div
                style={{
                  position: 'absolute',
                  left: definition.marginsMm.left * MM_TO_PX * zoom,
                  top: definition.marginsMm.top * MM_TO_PX * zoom,
                  right: definition.marginsMm.right * MM_TO_PX * zoom,
                  bottom: definition.marginsMm.bottom * MM_TO_PX * zoom,
                  border: '1px dashed rgba(168, 85, 247, 0.35)',
                  pointerEvents: 'none',
                  zIndex: 0,
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

              // Content Resolution
              let displayContent = el.content || ''
              if (previewMode && (el.type === 'bound-text' || el.content?.includes('{{'))) {
                displayContent = resolveTokens(displayContent, sampleData)
              }

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
                    cursor: previewMode ? 'default' : el.locked ? 'not-allowed' : 'move',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    // Only show border when selected or when element has a designated style border
                    border: isSelected
                      ? '1.5px solid #7C3AED'
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
                        background: 'rgba(0,0,0,0.03)',
                      }}
                    >
                      <img
                        src={el.content || '/brand/preone-crest.svg'}
                        alt={el.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: s.objectFit || 'contain',
                        }}
                      />
                    </div>
                  ) : el.type === 'qrcode' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: 2,
                      }}
                    >
                      <QrCode size={Math.min(wPx, hPx) - 6} style={{ color: '#0F172A' }} />
                    </div>
                  ) : el.type === 'barcode' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <Barcode size={Math.min(wPx, hPx) - 4} style={{ color: '#0F172A' }} />
                    </div>
                  ) : el.type === 'signature' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: 2,
                        fontSize: 8 * zoom,
                        color: '#475569',
                      }}
                    >
                      <div style={{ width: '80%', borderTop: '1px solid #94A3B8', marginBottom: 2 * zoom }} />
                      <span>{el.content || 'Authorized Signatory'}</span>
                    </div>
                  ) : el.type === 'badge' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: (s.fontSize || 9) * zoom,
                        fontWeight: '700',
                        color: s.color || '#15803D',
                        borderRadius: s.borderRadius || 3,
                        background: s.backgroundColor || '#DCFCE7',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {previewMode ? resolveTokens(el.content || 'PAID', sampleData) : el.content || 'PAID'}
                    </div>
                  ) : (
                    <div>{displayContent}</div>
                  )}

                  {/* Contextual Floating Micro-Bar (Only on Selected Element) */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -30,
                        left: 0,
                        height: 24,
                        background: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 4px',
                        gap: 2,
                        zIndex: 35,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={handleDuplicate}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#CBD5E1',
                          padding: '2px 4px',
                          cursor: 'pointer',
                        }}
                        title="Duplicate (Ctrl+D)"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveLayer(el.id, 'up')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#CBD5E1',
                          padding: '2px 4px',
                          cursor: 'pointer',
                        }}
                        title="Bring Forward"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveLayer(el.id, 'down')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#CBD5E1',
                          padding: '2px 4px',
                          cursor: 'pointer',
                        }}
                        title="Send Backward"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(el.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#F87171',
                          padding: '2px 4px',
                          cursor: 'pointer',
                        }}
                        title="Delete (Del)"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}

                  {/* 8 Resize Handles (When Selected & Not Locked) */}
                  {isSelected && !el.locked && (
                    <>
                      {['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'].map((h) => {
                        const stylePos: React.CSSProperties = {
                          position: 'absolute',
                          width: 7,
                          height: 7,
                          background: '#7C3AED',
                          border: '1px solid #FFFFFF',
                          borderRadius: 2,
                          zIndex: 20,
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

          {/* Minimal Document Info Pill */}
          <div
            style={{
              marginTop: 14,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 10,
              color: 'var(--text-muted, #94A3B8)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{definition.widthMm} × {definition.heightMm} mm</span>
            <span>•</span>
            <span>{PAGE_DIMENSIONS[definition.pageSize]?.name || definition.pageSize}</span>
            <span>•</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* ── RIGHT PANEL: CONTEXTUAL INSPECTOR ── */}
        {!previewMode && (
          <aside
            style={{
              width: rightPanelOpen ? 280 : 40,
              transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'var(--surface-solid, #1E293B)',
              borderLeft: '1px solid var(--border, rgba(255,255,255,0.08))',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 15,
              overflow: 'hidden',
            }}
          >
            {/* Inspector Header with Collapse Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: rightPanelOpen ? '6px 10px' : '6px 2px',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                background: 'rgba(0,0,0,0.12)',
              }}
            >
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                title={rightPanelOpen ? 'Collapse Inspector' : 'Expand Inspector'}
              >
                {rightPanelOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
              </button>

              {rightPanelOpen && (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {selectedElement ? 'Element Properties' : 'Document Settings'}
                </div>
              )}
            </div>

            {/* Inspector Content */}
            {rightPanelOpen && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedElement ? (
                  /* ── SELECTED ELEMENT INSPECTOR ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header: Name, Type, Lock */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: '#7C3AED',
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                          }}
                        >
                          {selectedElement.type}
                        </span>
                        <input
                          type="text"
                          value={selectedElement.name}
                          onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            background: 'transparent',
                            border: '1px solid transparent',
                            borderRadius: 4,
                            padding: '1px 4px',
                            outline: 'none',
                            maxWidth: 140,
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                          onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                        style={{ color: selectedElement.locked ? '#F97316' : 'var(--text-muted)', padding: 3 }}
                        title={selectedElement.locked ? 'Unlock' : 'Lock'}
                      >
                        {selectedElement.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                    </div>

                    {/* Section: Layout (Position & Dimensions) */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenSections((prev) => ({ ...prev, layout: !prev.layout }))}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Layout</span>
                        {openSections.layout ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      {openSections.layout && (
                        <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>X (mm)</label>
                            <input
                              type="number"
                              className="input"
                              value={selectedElement.x}
                              onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
                              style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Y (mm)</label>
                            <input
                              type="number"
                              className="input"
                              value={selectedElement.y}
                              onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
                              style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Width (mm)</label>
                            <input
                              type="number"
                              className="input"
                              value={selectedElement.width}
                              onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) || 1 })}
                              style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Height (mm)</label>
                            <input
                              type="number"
                              className="input"
                              value={selectedElement.height}
                              onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) || 1 })}
                              style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section: Content & Field Binding */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenSections((prev) => ({ ...prev, content: !prev.content }))}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Content & Binding</span>
                        {openSections.content ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      {openSections.content && (
                        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {selectedElement.fieldBinding ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Bound Database Field</label>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: 'rgba(124, 58, 237, 0.12)',
                                  border: '1px solid rgba(124, 58, 237, 0.3)',
                                  borderRadius: 4,
                                  padding: '4px 6px',
                                }}
                              >
                                <code style={{ fontSize: 10, color: 'var(--brand-300, #C4B5FD)' }}>
                                  {`{{${selectedElement.fieldBinding}}}`}
                                </code>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => setActiveLeftTab('fields')}
                                  style={{ fontSize: 9, color: 'var(--brand-300, #DDD6FE)', padding: '1px 4px' }}
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Content / Text</label>
                            <textarea
                              className="input"
                              rows={2}
                              value={selectedElement.content || ''}
                              onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                              style={{ width: '100%', fontSize: 11, padding: 4 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section: Style & Typography */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenSections((prev) => ({ ...prev, style: !prev.style }))}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Style & Appearance</span>
                        {openSections.style ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      {openSections.style && (
                        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Typography (for text elements) */}
                          {(selectedElement.type === 'text' || selectedElement.type === 'bound-text' || selectedElement.type === 'badge') && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              <div>
                                <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Font Size (pt)</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={selectedElement.styles?.fontSize || 10}
                                  onChange={(e) =>
                                    updateElement(selectedElement.id, {
                                      styles: { fontSize: parseInt(e.target.value) || 10 },
                                    })
                                  }
                                  style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Weight</label>
                                <select
                                  className="input"
                                  value={selectedElement.styles?.fontWeight || 'normal'}
                                  onChange={(e) =>
                                    updateElement(selectedElement.id, {
                                      styles: { fontWeight: e.target.value as ElementStyles['fontWeight'] },
                                    })
                                  }
                                  style={{ height: 26, fontSize: 11, padding: '2px 4px' }}
                                >
                                  <option value="normal">Regular</option>
                                  <option value="600">Semibold</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Text Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="color"
                                    value={selectedElement.styles?.color || '#0F172A'}
                                    onChange={(e) =>
                                      updateElement(selectedElement.id, {
                                        styles: { color: e.target.value },
                                      })
                                    }
                                    style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                  />
                                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                    {selectedElement.styles?.color || '#0F172A'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Align</label>
                                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                  {(['left', 'center', 'right'] as const).map((align) => (
                                    <button
                                      key={align}
                                      type="button"
                                      className="btn btn-xs btn-ghost"
                                      style={{
                                        padding: 3,
                                        background:
                                          (selectedElement.styles?.textAlign || 'left') === align
                                            ? 'rgba(124, 58, 237, 0.2)'
                                            : 'transparent',
                                      }}
                                      onClick={() =>
                                        updateElement(selectedElement.id, {
                                          styles: { textAlign: align },
                                        })
                                      }
                                    >
                                      {align === 'left' ? <AlignLeft size={11} /> : align === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Background Fill & Borders */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                            <div>
                              <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Fill Color</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="color"
                                  value={selectedElement.styles?.backgroundColor || '#FFFFFF'}
                                  onChange={(e) =>
                                    updateElement(selectedElement.id, {
                                      styles: { backgroundColor: e.target.value },
                                    })
                                  }
                                  style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  style={{ fontSize: 9, padding: '1px 3px' }}
                                  onClick={() =>
                                    updateElement(selectedElement.id, {
                                      styles: { backgroundColor: 'transparent' },
                                    })
                                  }
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Border Width</label>
                              <input
                                type="number"
                                className="input"
                                value={selectedElement.styles?.borderWidth || 0}
                                onChange={(e) =>
                                  updateElement(selectedElement.id, {
                                    styles: { borderWidth: parseInt(e.target.value) || 0 },
                                  })
                                }
                                style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section: Advanced (Collapsed by Default) */}
                    <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.06))', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenSections((prev) => ({ ...prev, advanced: !prev.advanced }))}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Advanced</span>
                        {openSections.advanced ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      {openSections.advanced && (
                        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)' }}>Layer Z-Index</label>
                            <input
                              type="number"
                              className="input"
                              value={selectedElement.zIndex || 1}
                              onChange={(e) =>
                                updateElement(selectedElement.id, { zIndex: parseInt(e.target.value) || 1 })
                              }
                              style={{ height: 26, fontSize: 11, padding: '2px 6px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── DOCUMENT SETTINGS INSPECTOR ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Document Type
                      </label>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                        {DOCUMENT_TYPE_CONFIG[templateType]?.label || templateType}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Page Format & Dimensions
                      </label>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                        {PAGE_DIMENSIONS[definition.pageSize]?.name || definition.pageSize}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {definition.widthMm} × {definition.heightMm} mm ({definition.orientation})
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Sheet Background</span>
                        <input
                          type="color"
                          value={definition.backgroundColor || '#FFFFFF'}
                          onChange={(e) => {
                            const newDef = { ...definition, backgroundColor: e.target.value }
                            setDefinition(newDef)
                            pushHistory(newDef)
                          }}
                          style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => {
                            setIsDefault(e.target.checked)
                            setIsDirty(true)
                          }}
                        />
                        Set as Default Template
                      </label>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Used automatically for admissions and student identity printing.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── 3. PUBLISH VERSION MODAL ── */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Template Version"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Publishing creates a permanent version snapshot (v{(definition.version || 1) + 1}) and updates active document generation.
          </p>

          <div
            style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: 6,
              padding: 10,
              fontSize: 12,
              color: 'var(--brand-300, #C4B5FD)',
            }}
          >
            <strong>Version Target:</strong> v{(definition.version || 1) + 1}
            <br />
            <strong>Elements:</strong> {definition.elements.length}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPublishModalOpen(false)}
              disabled={publishing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={publishing}
              style={{
                background: 'var(--brand-600, #7C3AED)',
                borderColor: 'var(--brand-600, #7C3AED)',
                color: '#FFFFFF',
              }}
            >
              {publishing ? 'Publishing...' : 'Confirm & Publish'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 4. TEST TEMPLATE MODAL ── */}
      <TestTemplateModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        templateId={templateId}
        templateName={templateName}
        documentType={templateType}
        initialDefinition={definition}
        publishedVersion={definition.version}
        currentDraftVersion={definition.version}
        isPublished={definition.status === 'PUBLISHED'}
        onSetDefaultSuccess={() => setIsDefault(true)}
      />
    </div>
  )
}

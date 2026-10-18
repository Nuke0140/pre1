'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Package,
  Truck,
  Building,
  MapPin,
  FileText,
  Upload,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  RotateCw,
  Flashlight,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/preone/Toast'
import {
  ItemLookupResult,
  FastStockReceiptResult,
  FastReceiveSessionItem,
} from '@/lib/inventory/fast-receiving-types'

interface FastStockReceivingModalProps {
  open: boolean
  onClose: () => void
  branchId?: string | null
  branchName?: string | null
  onReceiptSuccess?: (result: FastStockReceiptResult) => void
}

function generateClientUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function FastStockReceivingModal({
  open,
  onClose,
  branchId,
  branchName,
  onReceiptSuccess,
}: FastStockReceivingModalProps) {
  const toast = useToast()

  // Workflow steps: SCAN -> DETAILS -> SUCCESS
  const [step, setStep] = useState<'SCAN' | 'DETAILS' | 'SUCCESS'>('SCAN')

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  // Item state
  const [matchedItem, setMatchedItem] = useState<ItemLookupResult | null>(null)
  const [multipleMatches, setMultipleMatches] = useState<ItemLookupResult[]>([])
  const [availableLocations, setAvailableLocations] = useState<Array<{ id: string; name: string; code: string; locationType: string }>>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')

  // Quantity input state
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedPoItemId, setSelectedPoItemId] = useState<string>('') // if linked to PO

  // Optional delivery metadata
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [challanNumber, setChallanNumber] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Submission state
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateClientUuid())
  const [submitting, setSubmitting] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<FastStockReceiptResult | null>(null)

  // Multi-item rapid session items
  const [sessionItems, setSessionItems] = useState<FastReceiveSessionItem[]>([])

  // Video and animation refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setTorchOn(false)
  }, [])

  // Start camera scanner
  const startCamera = useCallback(async () => {
    setCameraPermissionError(null)
    try {
      if (streamRef.current) {
        stopCamera()
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)

      // Check for torch capability
      const track = stream.getVideoTracks()[0]
      const capabilities: any = track?.getCapabilities?.() || {}
      setHasTorch(Boolean(capabilities.torch))

      // Setup BarcodeDetector if browser supports native API
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
          })

          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current)
                if (barcodes && barcodes.length > 0) {
                  const detectedCode = barcodes[0].rawValue
                  if (detectedCode && detectedCode.trim()) {
                    handleCodeDetected(detectedCode.trim())
                  }
                }
              } catch {
                // Ignore detection frame error
              }
            }
          }, 400)
        } catch {
          // Fallback to manual trigger
        }
      }
    } catch (err: any) {
      setCameraActive(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionError('Camera permission denied. Please allow camera access in browser settings, or type the barcode / SKU below.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermissionError('No camera found on this device. Please use manual SKU search below.')
      } else {
        setCameraPermissionError(err.message || 'Unable to start camera.')
      }
    }
  }, [facingMode, stopCamera])

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (track && hasTorch) {
      try {
        const nextState = !torchOn
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        })
        setTorchOn(nextState)
      } catch {
        // Torch constraint not supported
      }
    }
  }

  // Switch between back/front camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  // Lookup item by code from API
  const handleLookup = async (codeToLookup: string) => {
    const code = codeToLookup.trim()
    if (!code) return

    setLookupLoading(true)
    try {
      const q = new URLSearchParams({ code })
      if (branchId) q.append('branchId', branchId)

      const res = await fetch(`/api/v1/inventory/fast-receive/lookup?${q.toString()}`)
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error?.message || `Failed to find item for '${code}'`)
        return
      }

      const { exactMatch, matches, availableLocations: locs } = json.data
      setAvailableLocations(locs || [])

      // Auto-select primary or first location
      if (locs && locs.length > 0) {
        const mainLoc = locs.find((l: any) => l.locationType === 'MAIN_STORE') || locs[0]
        setSelectedLocationId(mainLoc.id)
      }

      if (exactMatch) {
        selectItemForReceiving(exactMatch)
        stopCamera()
      } else if (matches && matches.length === 1) {
        selectItemForReceiving(matches[0])
        stopCamera()
      } else if (matches && matches.length > 1) {
        setMultipleMatches(matches)
        stopCamera()
      } else {
        toast.error(`No inventory items found matching '${code}'. Try manual SKU search.`)
      }
    } catch {
      toast.error('Network error during barcode lookup. Please check your connection.')
    } finally {
      setLookupLoading(false)
    }
  }

  // Handle scanned barcode hit
  const handleCodeDetected = (code: string) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setManualCode(code)
    handleLookup(code)
  }

  // Select an item to receive
  const selectItemForReceiving = (item: ItemLookupResult) => {
    setMatchedItem(item)
    setMultipleMatches([])
    setStep('DETAILS')
    setQuantity(1)
    setBatchNumber(`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)

    // If item has open PO with pending quantity, pre-select the first one
    if (item.openPurchaseOrders && item.openPurchaseOrders.length > 0) {
      setSelectedPoItemId(item.openPurchaseOrders[0].purchaseOrderItemId)
    } else {
      setSelectedPoItemId('')
    }
  }

  // Photo capture / file selection
  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size exceeds 5MB limit')
      return
    }

    setPhotoFile(file)
    const preview = URL.createObjectURL(file)
    setPhotoPreviewUrl(preview)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
      setPhotoPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Submit fast stock receipt
  const handleSubmitStockReceipt = async () => {
    if (!matchedItem) return
    if (!selectedLocationId) {
      toast.error('Please select a storage location')
      return
    }
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    setSubmitting(true)
    let uploadedPhotoUrl: string | null = null

    try {
      // 1. Upload photo if staff attached one
      if (photoFile) {
        setUploadingPhoto(true)
        const fd = new FormData()
        fd.append('photo', photoFile)

        const uploadRes = await fetch('/api/v1/inventory/fast-receive/upload-photo', {
          method: 'POST',
          body: fd,
        })
        const uploadJson = await uploadRes.json()
        setUploadingPhoto(false)

        if (uploadJson.success && uploadJson.data?.photoUrl) {
          uploadedPhotoUrl = uploadJson.data.photoUrl
        } else {
          toast.error(uploadJson.error?.message || 'Failed to upload delivery photo')
          setSubmitting(false)
          return
        }
      }

      // 2. Resolve PO link if selected
      let purchaseOrderId: string | null = null
      let purchaseOrderItemId: string | null = null

      if (selectedPoItemId) {
        const poLink = matchedItem.openPurchaseOrders?.find(
          (p) => p.purchaseOrderItemId === selectedPoItemId
        )
        if (poLink) {
          purchaseOrderId = poLink.purchaseOrderId
          purchaseOrderItemId = poLink.purchaseOrderItemId
        }
      }

      // 3. Post stock receipt with idempotencyKey
      const payload = {
        idempotencyKey,
        itemId: matchedItem.id,
        branchId: branchId || undefined,
        locationId: selectedLocationId,
        quantity,
        purchaseOrderId,
        purchaseOrderItemId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        challanNumber: challanNumber.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        deliveryPhotoUrl: uploadedPhotoUrl || undefined,
      }

      const res = await fetch('/api/v1/inventory/fast-receive/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error?.message || 'Failed to post stock receipt')
        setSubmitting(false)
        return
      }

      const result: FastStockReceiptResult = json.data
      setLastReceipt(result)

      // Add to session list
      setSessionItems((prev) => [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          itemName: result.itemName,
          sku: result.sku,
          quantity: result.receivedQuantity,
          unitSymbol: result.unitSymbol,
          locationName: result.locationName,
          referenceNumber: result.referenceNumber,
          newAvailableQuantity: result.newAvailableQuantity,
          photoUrl: result.deliveryPhotoUrl,
          poNumber: result.purchaseOrderId ? (result.grnNumber || 'PO Linked') : null,
        },
        ...prev,
      ])

      toast.success(
        `Added +${result.receivedQuantity} ${result.unitSymbol} to stock!`,
        `New Balance: ${result.newAvailableQuantity} ${result.unitSymbol} in ${result.locationName}`
      )

      if (onReceiptSuccess) {
        onReceiptSuccess(result)
      }

      setStep('SUCCESS')
    } catch {
      toast.error('Network error during stock posting. Please check your connection and retry.')
    } finally {
      setSubmitting(false)
      setUploadingPhoto(false)
    }
  }

  // Reset to scan next item in the same session
  const handleScanNext = () => {
    setMatchedItem(null)
    setMultipleMatches([])
    setManualCode('')
    setQuantity(1)
    setSelectedPoItemId('')
    setInvoiceNumber('')
    setChallanNumber('')
    setDeliveryNotes('')
    removePhoto()
    setIdempotencyKey(generateClientUuid())
    setStep('SCAN')
  }

  // Cleanup camera when modal closes or unmounts
  useEffect(() => {
    if (!open) {
      stopCamera()
      removePhoto()
      setStep('SCAN')
      setMatchedItem(null)
      setMultipleMatches([])
    } else {
      setIdempotencyKey(generateClientUuid())
    }
    return () => {
      stopCamera()
    }
  }, [open, stopCamera])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#10B981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Fast Stock Receiving
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {branchName ? `Branch: ${branchName}` : 'Preschool Inventory Intake'}
                {sessionItems.length > 0 && ` • ${sessionItems.length} received in this session`}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            style={{ borderRadius: '50%', width: 32, height: 32, padding: 0 }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ============================================================== */}
          {/* STEP 1: SCAN OR ENTER BARCODE                                  */}
          {/* ============================================================== */}
          {step === 'SCAN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Camera Preview Area */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 240,
                  borderRadius: 16,
                  background: '#0F172A',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Scan reticle overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: '20px 40px',
                        border: '2px dashed #10B981',
                        borderRadius: 12,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: 2,
                          background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                          boxShadow: '0 0 8px #10B981',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    </div>

                    {/* Camera controls toolbar */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        display: 'flex',
                        gap: 8,
                        zIndex: 10,
                      }}
                    >
                      {hasTorch && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={toggleTorch}
                          style={{
                            background: torchOn ? '#F59E0B' : 'rgba(15, 23, 42, 0.75)',
                            color: '#ffffff',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 20,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Flashlight size={14} /> {torchOn ? 'Torch On' : 'Torch'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={toggleCameraFacing}
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                        }}
                      >
                        <RotateCw size={14} /> Flip
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={stopCamera}
                        style={{
                          background: 'rgba(239, 68, 68, 0.85)',
                          color: '#ffffff',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                        }}
                      >
                        Stop
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      padding: 20,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Camera size={28} />
                    </div>
                    <div>
                      <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.95rem' }}>
                        Scan Product Barcode
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: 2 }}>
                        Point your camera at the box barcode or SKU label
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={startCamera}
                      style={{
                        background: '#10B981',
                        color: '#ffffff',
                        fontWeight: 600,
                        borderRadius: 10,
                        padding: '8px 16px',
                        marginTop: 4,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      <Camera size={15} /> Start Camera Scanner
                    </button>
                  </div>
                )}
              </div>

              {/* Camera permission error banner */}
              {cameraPermissionError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{cameraPermissionError}</span>
                </div>
              )}

              {/* Manual SKU / Barcode input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Or Enter Barcode / SKU / Item Name
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 11,
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 8901234567890, ART-CR-001, Crayons..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleLookup(manualCode)
                        }
                      }}
                      style={{
                        paddingLeft: 36,
                        height: 38,
                        fontSize: '0.88rem',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!manualCode.trim() || lookupLoading}
                    onClick={() => handleLookup(manualCode)}
                    style={{ minWidth: 90 }}
                  >
                    {lookupLoading ? <RefreshCw size={15} className="animate-spin" /> : 'Find Item'}
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Supports physical USB/Bluetooth handheld barcode scanners (presses Enter automatically)
                </div>
              </div>

              {/* Multiple item matches picker */}
              {multipleMatches.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Multiple Items Matched ({multipleMatches.length}) — Select One:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {multipleMatches.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => selectItemForReceiving(it)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--border-color, #e2e8f0)',
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          transition: 'border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10B981')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)')}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {it.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            SKU: {it.sku} • {it.category.name}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#059669',
                              fontWeight: 600,
                            }}
                          >
                            Stock: {it.currentStock.availableQuantity} {it.unit.symbol}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: ENTER RECEIVED QUANTITY & LOCATION                     */}
          {/* ============================================================== */}
          {step === 'DETAILS' && matchedItem && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Selected Item Banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#10B981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                      {matchedItem.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      SKU: {matchedItem.sku} • Category: {matchedItem.category.name}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setStep('SCAN')}
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  Change
                </button>
              </div>

              {/* Current Stock Level Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-muted, #f8fafc)',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Current On-Hand Stock:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {matchedItem.currentStock.availableQuantity} {matchedItem.unit.name} ({matchedItem.unit.symbol})
                </span>
              </div>

              {/* Large Quantity Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Received Quantity ({matchedItem.unit.name})
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ width: 44, height: 44, borderRadius: 12, padding: 0 }}
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>

                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="number"
                      min={1}
                      step={matchedItem.unit.decimalAllowed ? 0.1 : 1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        height: 48,
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        borderRadius: 12,
                        border: '2px solid #10B981',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: 14,
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {matchedItem.unit.symbol}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{ width: 44, height: 44, borderRadius: 12, padding: 0 }}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Quick Add Pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 5, 10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => setQuantity(num)}
                      style={{
                        borderRadius: 14,
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        background: quantity === num ? 'rgba(16, 185, 129, 0.15)' : undefined,
                        borderColor: quantity === num ? '#10B981' : undefined,
                        color: quantity === num ? '#059669' : undefined,
                        fontWeight: quantity === num ? 700 : 500,
                      }}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receiving Location Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Receiving Storage Location
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin
                    size={16}
                    style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }}
                  />
                  <select
                    className="input"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    style={{ paddingLeft: 36, height: 38, fontSize: '0.85rem' }}
                  >
                    {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code}) — {loc.locationType.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Order (GRN) Linking Option */}
              {matchedItem.openPurchaseOrders && matchedItem.openPurchaseOrders.length > 0 ? (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 12,
                    background: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, color: '#1D4ED8' }}>
                      <FileText size={15} /> Open Purchase Order Detected
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600 }}>
                      Official GRN
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Link this delivery to an open PO to update ordered quantities and post vendor billing:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {matchedItem.openPurchaseOrders.map((po) => {
                      const isSelected = selectedPoItemId === po.purchaseOrderItemId
                      return (
                        <div
                          key={po.purchaseOrderItemId}
                          onClick={() => setSelectedPoItemId(isSelected ? '' : po.purchaseOrderItemId)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#2563EB' : 'var(--border-color, #e2e8f0)'}`,
                            background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{po.poNumber}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{po.vendorName}</span>
                          </div>
                          <div style={{ fontWeight: 600, color: '#2563EB' }}>
                            {po.pendingQuantity} {matchedItem.unit.symbol} pending
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {selectedPoItemId
                      ? '✓ Receipt will be linked to selected PO and generate an official GRN.'
                      : '○ Direct stock receipt without PO link.'}
                  </div>
                </div>
              ) : null}

              {/* Optional Delivery Evidence & Details Toggle */}
              <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    padding: '4px 8px',
                  }}
                >
                  <Camera size={14} />
                  <span>
                    {showOptionalFields
                      ? 'Hide Delivery Photo & Reference Details'
                      : 'Attach Delivery Photo / Challan # / Notes'}
                  </span>
                </button>

                {showOptionalFields && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--bg-muted, #f8fafc)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Delivery Photo Capture */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Delivery Box Photo / Proof
                      </label>

                      {photoPreviewUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 10, overflow: 'hidden' }}>
                          <img
                            src={photoPreviewUrl}
                            alt="Delivery Box Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Remove photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoSelected}
                            style={{ display: 'none' }}
                            id="delivery-photo-input"
                          />
                          <label
                            htmlFor="delivery-photo-input"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              padding: '12px',
                              borderRadius: 10,
                              border: '1.5px dashed var(--border-color, #cbd5e1)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                            }}
                          >
                            <Camera size={16} /> Take Box Photo or Upload Image
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Challan / Invoice number inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Challan / DC #
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. DC-9842"
                          value={challanNumber}
                          onChange={(e) => setChallanNumber(e.target.value)}
                          style={{ height: 34, fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Vendor Invoice #
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. INV-2026-88"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          style={{ height: 34, fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>

                    {/* Delivery Notes */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Delivery Notes
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Received at front gate, box in good condition"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        style={{ height: 34, fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Button: Add to Stock */}
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting || uploadingPhoto || quantity <= 0}
                onClick={handleSubmitStockReceipt}
                style={{
                  height: 48,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 14,
                  background: '#10B981',
                  borderColor: '#10B981',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{uploadingPhoto ? 'Uploading Delivery Photo...' : 'Posting Authoritative Stock...'}</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>
                      Add to Stock (+{quantity} {matchedItem.unit.symbol})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: SUCCESS & CONFIRMATION                                 */}
          {/* ============================================================== */}
          {step === 'SUCCESS' && lastReceipt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  +{lastReceipt.receivedQuantity} {lastReceipt.unitSymbol} Added to Stock
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  {lastReceipt.itemName}
                </p>
              </div>

              {/* Authoritative Balance Card */}
              <div
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'var(--bg-muted, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                  <span style={{ fontWeight: 600 }}>{lastReceipt.locationName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reference:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {lastReceipt.grnNumber || lastReceipt.referenceNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>New Stock Balance:</span>
                  <span style={{ fontWeight: 700, color: '#10B981', fontSize: '1rem' }}>
                    {lastReceipt.newAvailableQuantity} {lastReceipt.unitSymbol}{' '}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      (was {lastReceipt.previousAvailableQuantity})
                    </span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  style={{ flex: 1, height: 42, borderRadius: 12 }}
                >
                  Done
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleScanNext}
                  style={{
                    flex: 1.4,
                    height: 42,
                    borderRadius: 12,
                    background: '#10B981',
                    borderColor: '#10B981',
                    fontWeight: 600,
                  }}
                >
                  <Camera size={16} /> Scan Next Item
                </button>
              </div>
            </div>
          )}

          {/* Session Summary List (if multiple items received) */}
          {sessionItems.length > 0 && step !== 'SUCCESS' && (
            <div
              style={{
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Recent Received in this Session ({sessionItems.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
                {sessionItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: 'var(--bg-muted, #f8fafc)',
                    }}
                  >
                    <span>
                      <strong>+{item.quantity} {item.unitSymbol}</strong> — {item.itemName}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

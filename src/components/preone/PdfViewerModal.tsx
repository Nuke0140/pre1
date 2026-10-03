'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  RotateCw,
} from 'lucide-react'

export interface PdfViewerModalProps {
  open: boolean
  onClose: () => void
  documentId: string
  title: string
  documentType?: string
  fileSizeBytes?: number
  fileName?: string
}

export function PdfViewerModal({
  open,
  onClose,
  documentId,
  title,
  documentType,
  fileSizeBytes,
  fileName,
}: PdfViewerModalProps) {
  const [mounted, setMounted] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    setZoom(100)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, documentId])

  if (!open || !mounted) return null

  const viewUrl = `/api/v1/documents/${documentId}/view`
  const downloadUrl = `/api/v1/documents/${documentId}/download`

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 15))
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 15))
  const handleResetZoom = () => setZoom(100)

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 rounded-xl'
            : 'w-full max-w-5xl h-[90vh]'
        }`}
      >
        {/* Top Header & Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 gap-3">
          {/* Document metadata */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={title}>
                {title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                {documentType && (
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {documentType.replace(/_/g, ' ')}
                  </span>
                )}
                {fileSizeBytes ? (
                  <>
                    <span>•</span>
                    <span>{Math.round(fileSizeBytes / 1024)} KB</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 mr-1 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                title="Reset Zoom"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Open in new tab */}
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open PDF in new tab"
            >
              <ExternalLink size={15} />
            </a>

            {/* Direct Download */}
            <a
              href={downloadUrl}
              download={fileName || `${title}.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs"
              title="Download official PDF"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close viewer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* PDF Rendering Body */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 backdrop-blur-2xs gap-2">
              <RotateCw className="animate-spin text-purple-600" size={24} />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Loading official PDF preview...
              </p>
            </div>
          )}

          <div
            className="w-full h-full flex items-center justify-center overflow-auto"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <iframe
              ref={iframeRef}
              src={`${viewUrl}#toolbar=1&navpanes=0`}
              title={title}
              className="w-full h-full border-0 rounded-b-xl"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  QrCode,
  Copy,
  Check,
  Printer,
  ExternalLink,
  MessageCircle,
  Building,
  Sparkles,
  Info,
  Download,
} from 'lucide-react'

export interface LobbyQrStandeeModalProps {
  open: boolean
  onClose: () => void
  branchId?: string
  branchName?: string
  schoolName?: string
  academicSessionName?: string
  logoUrl?: string | null
}

export function LobbyQrStandeeModal({
  open,
  onClose,
  branchId,
  branchName,
  schoolName = 'PreOne Preschool',
  academicSessionName,
  logoUrl,
}: LobbyQrStandeeModalProps) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  // Construct absolute URL tailored for Lobby Front-Desk QR
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const isSpecificBranch = branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all'
  
  const queryParams = new URLSearchParams()
  if (isSpecificBranch && branchId) {
    queryParams.set('branchId', branchId)
  }
  queryParams.set('source', 'LOBBY_QR')

  const publicUrl = `${origin}/public/enquiry?${queryParams.toString()}`

  // High-resolution QR Code image URL (280x280 for crisp desk printouts)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=1&format=svg&data=${encodeURIComponent(
    publicUrl
  )}`

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link Copied! 📋', 'Lobby QR registration link copied to clipboard.')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Generate WhatsApp sharing link for direct parent sharing
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Welcome to ${schoolName}! Please complete your quick admission self-registration here: ${publicUrl}`
  )}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Front-Desk Lobby QR Standee"
      subtitle="Print or display for waiting parents to self-fill child details & medical notes"
      icon={<QrCode size={20} className="text-primary" />}
      size="lg"
    >
      <div className="space-y-5">
        {/* Printable Standee Display Card */}
        <div
          id="lobby-qr-printable-area"
          className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 via-card to-card p-6 text-center shadow-sm"
        >
          {/* Decorative Corner Accents */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />

          {/* Standee Header */}
          <div className="space-y-1 mb-4">
            {logoUrl && (
              <div className="flex justify-center mb-2">
                <img
                  src={logoUrl}
                  alt={schoolName}
                  className="h-12 max-h-12 max-w-[180px] object-contain drop-shadow-xs rounded-lg"
                  data-testid="lobby-qr-school-logo"
                />
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              <Sparkles size={12} />
              <span>Welcome to Admissions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
              {schoolName}
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building size={12} className="text-primary" />
                <span>{isSpecificBranch && branchName ? branchName : 'Main Reception Desk'}</span>
              </span>
              {academicSessionName && (
                <>
                  <span>•</span>
                  <span>Session {academicSessionName}</span>
                </>
              )}
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="inline-block p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-md transition-transform hover:scale-[1.02]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`Lobby QR Code for ${schoolName}`}
              className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain block"
              loading="eager"
            />
            <div className="mt-2 text-[11px] font-mono font-bold tracking-tight text-slate-800">
              SCAN WITH PHONE CAMERA
            </div>
          </div>

          {/* Instructions for Waiting Parents */}
          <div className="mt-4 max-w-sm mx-auto space-y-1">
            <p className="text-sm font-bold text-foreground">
              Avoid waiting — fill your child details now!
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Scan with your mobile camera to fill child details, program preferences, and medical notes. Reception receives your walk-in instantly with an alert chime!
            </p>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary h-10 rounded-xl text-xs font-bold gap-2 justify-center shadow-xs"
          >
            <Printer size={15} />
            <span>Print Counter Standee</span>
          </button>

          {/* Copy URL Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-outline h-10 rounded-xl text-xs font-semibold gap-2 justify-center"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Form URL'}</span>
          </button>

          {/* Share on WhatsApp */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline h-10 rounded-xl text-xs font-semibold gap-2 justify-center text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <MessageCircle size={15} />
            <span>Share via WhatsApp</span>
          </a>
        </div>

        {/* URL Preview & Direct Navigation */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
              Target Walk-In URL
            </div>
            <div className="font-mono text-[11px] text-foreground truncate select-all">
              {publicUrl}
            </div>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm h-8 px-2.5 rounded-lg text-primary text-xs font-semibold shrink-0 gap-1"
          >
            <span>Open Form</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info size={13} className="text-primary shrink-0" />
            <span>Works 100% on iOS & Android cameras without installing any app.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-8 px-3 rounded-xl text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { Share2, Copy, Check, ExternalLink, Globe } from 'lucide-react'

export interface SharePublicFormModalProps {
  open: boolean
  onClose: () => void
  branchId?: string
  branchName?: string
}

export function SharePublicFormModal({
  open,
  onClose,
  branchId,
  branchName,
}: SharePublicFormModalProps) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  // Construct absolute URL
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${origin}/public/enquiry${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link Copied! 📋', 'Shareable enquiry form URL copied to clipboard.')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Public Enquiry Portal Link"
      subtitle="Share with parents on WhatsApp, school website, social media, or flyers"
      icon={<Globe size={20} className="text-primary" />}
      size="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
          <div className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Target Campus / Branch</span>
            <span className="text-[11px] font-semibold text-primary">{branchName || 'All Branches'}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Parents visiting this link will be presented with a clean, branded mobile-friendly enquiry form without requiring staff login. Submissions appear instantly in your authoritative Enquiries Ledger.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="input text-xs font-mono w-full h-9 rounded-xl bg-muted/40 cursor-text select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-primary btn-sm h-9 px-3.5 rounded-xl text-xs font-semibold shrink-0 gap-1.5 shadow-xs"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Open preview in new tab</span>
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-8 px-3 rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

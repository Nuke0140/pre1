'use client'

import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  Send,
} from 'lucide-react'
import {
  ADMISSION_WHATSAPP_TEMPLATES,
  type CommunicationTemplateContext,
} from '@/lib/admissions/communication-templates'
import {
  buildWhatsAppChatUrl,
  normalizePhoneNumberForWhatsApp,
} from '@/lib/contact-utils'

export interface WhatsAppTemplateModalProps {
  open: boolean
  onClose: () => void
  leadId?: string | null
  applicationId?: string | null
  phone?: string | null
  phoneNumber?: string | null
  parentName?: string | null
  childName?: string | null
  schoolName?: string | null
  branchName?: string | null
  branchId?: string | null
  tourDate?: string | null
  tourTime?: string | null
  brochureUrl?: string | null
  programName?: string | null
  applicationNumber?: string | null
  leadNumber?: string | null
  onLogged?: () => void
  onPrepared?: () => void | Promise<void>
}

export function WhatsAppTemplateModal({
  open,
  onClose,
  leadId,
  applicationId,
  phone,
  phoneNumber,
  parentName,
  childName,
  schoolName = 'PreOne Preschool',
  branchName,
  branchId,
  tourDate,
  tourTime,
  brochureUrl,
  programName,
  applicationNumber,
  leadNumber,
  onLogged,
  onPrepared,
}: WhatsAppTemplateModalProps) {
  const effectivePhone = phone || phoneNumber || null
  const toast = useToast()
  const [selectedTemplateId, setSelectedTemplateId] = useState('VISIT_THANK_YOU')
  const [copied, setCopied] = useState(false)

  // Context bundle for template generator
  const templateContext: CommunicationTemplateContext = useMemo(
    () => ({
      parentName,
      childName,
      schoolName,
      branchName,
      tourDate,
      tourTime,
      brochureUrl,
      programName,
      applicationNumber,
      leadNumber,
    }),
    [
      parentName,
      childName,
      schoolName,
      branchName,
      tourDate,
      tourTime,
      brochureUrl,
      programName,
      applicationNumber,
      leadNumber,
    ]
  )

  // Active template
  const activeTemplate = useMemo(() => {
    return (
      ADMISSION_WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      ADMISSION_WHATSAPP_TEMPLATES[0]
    )
  }, [selectedTemplateId])

  // Custom text override
  const [customText, setCustomText] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Computed message text
  const messageText = useMemo(() => {
    if (isEditing) return customText
    return activeTemplate.buildMessage(templateContext)
  }, [activeTemplate, templateContext, isEditing, customText])

  // Validation
  const normalizedPhone = normalizePhoneNumberForWhatsApp(effectivePhone)
  const isPhoneValid = Boolean(normalizedPhone)

  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId)
    setIsEditing(false)
    const t = ADMISSION_WHATSAPP_TEMPLATES.find((x) => x.id === tId)
    if (t) {
      setCustomText(t.buildMessage(templateContext))
    }
  }

  const handleCopyMessage = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(messageText)
      setCopied(true)
      toast.success('Message Copied! 📋', 'Ready to paste into WhatsApp.')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenWhatsApp = async () => {
    if (!isPhoneValid || !normalizedPhone) {
      toast.error('Invalid Phone Number', 'A valid 10-digit mobile number is required to open WhatsApp.')
      return
    }

    const waUrl = buildWhatsAppChatUrl(effectivePhone, messageText)
    if (!waUrl) return

    // Record interaction asynchronously in communication log
    fetch('/api/v1/admissions/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadId || undefined,
        applicationId: applicationId || undefined,
        channel: 'WHATSAPP',
        interactionType: 'WHATSAPP_PREPARED',
        notes: `Prepared WhatsApp template "${activeTemplate.name}":\n"${messageText.slice(0, 300)}..."`,
        parentName: parentName || undefined,
        phone: effectivePhone || undefined,
        branchId: branchId || undefined,
      }),
    })
      .then(() => {
        onLogged?.()
        onPrepared?.()
      })
      .catch(() => {})

    // Open WhatsApp Web or mobile app in a new tab
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }

    toast.info('WhatsApp Opened 💬', 'Please review and press send in WhatsApp.')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose WhatsApp Message"
      subtitle={`Choose a template to message ${parentName || 'Parent'} (${phone || 'No phone'})`}
      icon={<MessageCircle size={20} className="text-emerald-500" />}
      size="lg"
    >
      <div className="space-y-4">
        {/* Recipient Information Pill */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-950 dark:text-emerald-200">
              Parent: {parentName || 'Prospective Parent'}
            </span>
            {childName && (
              <span className="text-emerald-700 dark:text-emerald-400 font-normal">
                (Child: {childName})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {phone || 'No phone'}
            </span>
            {!isPhoneValid && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                Invalid
              </span>
            )}
          </div>
        </div>

        {/* Template Selector Grid */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Select Message Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ADMISSION_WHATSAPP_TEMPLATES.map((t) => {
              const isSelected = selectedTemplateId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                      : 'border-border/70 bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate">
                      {t.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-muted text-muted-foreground shrink-0">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {t.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Message Preview & Customization Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-500" />
              <span>Preview & Edit Message</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true)
                    setCustomText(activeTemplate.buildMessage(templateContext))
                  }}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Edit message
                </button>
              )}
            </div>
          </div>

          {/* Textarea Preview with WhatsApp Chat Styling */}
          <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => {
                setIsEditing(true)
                setCustomText(e.target.value)
              }}
              className="w-full bg-transparent text-xs text-foreground resize-none focus:outline-none leading-relaxed font-sans"
              placeholder="Type your WhatsApp message..."
            />
            <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Opens in standard WhatsApp (wa.me link). Staff reviews before sending.</span>
              <span className="font-mono">{messageText.length} chars</span>
            </div>
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-9 px-3 rounded-xl text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!isPhoneValid}
            className="btn btn-sm h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={13} />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

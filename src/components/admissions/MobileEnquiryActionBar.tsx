'use client'

import React from 'react'
import { Plus, ClipboardList } from 'lucide-react'

export interface MobileEnquiryActionBarProps {
  onRecordEnquiry: () => void
  onStartApplication: () => void
  selectedEnquiry?: any | null
  totalEnquiries?: number
  disabled?: boolean
}

export function MobileEnquiryActionBar({
  onRecordEnquiry,
  onStartApplication,
  selectedEnquiry,
  totalEnquiries = 0,
  disabled = false,
}: MobileEnquiryActionBarProps) {
  return (
    <aside
      aria-label="Admissions Mobile Quick Actions"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-3.5 sm:px-6 py-2.5 shadow-lg lg:hidden transition-all duration-200"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
      }}
    >
      <div className="max-w-md mx-auto flex items-center gap-2.5">
        {/* Secondary Action: Start Application */}
        <button
          type="button"
          onClick={onStartApplication}
          disabled={disabled || totalEnquiries === 0}
          className="btn btn-outline h-11 px-3 sm:px-4 rounded-2xl text-xs font-semibold gap-1.5 flex-1 justify-center bg-card border-border/90 hover:bg-muted/60 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            selectedEnquiry
              ? `Start application for ${selectedEnquiry.childName || selectedEnquiry.parentName}`
              : 'Start application for an enquiry'
          }
        >
          <ClipboardList size={15} className="text-primary shrink-0" />
          <span className="truncate">
            {selectedEnquiry
              ? `App: ${selectedEnquiry.childName || selectedEnquiry.parentName.split(' ')[0]}`
              : 'Start Application'}
          </span>
        </button>

        {/* Primary Action: + Record Enquiry */}
        <button
          type="button"
          onClick={onRecordEnquiry}
          disabled={disabled}
          className="btn btn-primary h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold gap-1.5 flex-[1.1] justify-center shadow-xs active:scale-[0.99] transition-all"
          title="Register new enquiry"
        >
          <Plus size={16} className="shrink-0" />
          <span className="truncate">+ Record Enquiry</span>
        </button>
      </div>
    </aside>
  )
}

'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/preone/Modal'
import { ClipboardList, Search, User, Baby, CheckCircle2 } from 'lucide-react'
import { StatusPill } from '@/components/preone'

export interface SelectEnquiryForAppModalProps {
  open: boolean
  onClose: () => void
  enquiries: any[]
  onSelect: (enquiry: any) => void
}

export function SelectEnquiryForAppModal({
  open,
  onClose,
  enquiries,
  onSelect,
}: SelectEnquiryForAppModalProps) {
  const [search, setSearch] = useState('')

  const eligibleEnquiries = (enquiries || []).filter((e) => {
    // Exclude leads that already have an application started or are admitted/lost
    return e.status !== 'APPLICATION_STARTED' && e.status !== 'CONVERTED' && e.status !== 'LOST'
  })

  const filtered = eligibleEnquiries.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (e.leadNumber && e.leadNumber.toLowerCase().includes(q)) ||
      (e.parentName && e.parentName.toLowerCase().includes(q)) ||
      (e.childName && e.childName.toLowerCase().includes(q)) ||
      (e.phone && e.phone.includes(q))
    )
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Enquiry to Start Application"
      subtitle="Choose a prospective child to assign staff and schedule outreach"
      icon={<ClipboardList size={20} className="text-primary" />}
      size="md"
    >
      <div className="space-y-3.5">
        {/* Search Filter */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="input text-xs pl-9 pr-3 h-9 rounded-xl bg-card border border-border/80 w-full"
            placeholder="Search by child, parent, or ref #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List of Enquiries */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
          {filtered.length > 0 ? (
            filtered.map((e) => (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelect(e)
                  onClose()
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    onSelect(e)
                    onClose()
                  }
                }}
                className="p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/[0.03] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-primary">
                      {e.leadNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      {e.childName || e.parentName}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>Parent: {e.parentName}</span>
                    <span>•</span>
                    <span>{e.interestedProgram || 'Nursery'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={e.status} size="sm" />
                  <span className="btn btn-primary btn-sm h-7 px-2.5 text-[11px] rounded-lg font-bold group-hover:scale-105 transition-transform">
                    Select
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">No eligible enquiries found</p>
              <p className="text-[11px]">
                {search ? 'Try adjusting your search keywords.' : 'All current enquiries already have active applications.'}
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-8 px-3 rounded-xl text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

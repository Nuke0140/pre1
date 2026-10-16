'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PhoneCall,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  FileText,
  AlertCircle,
  MoreVertical,
  Edit3,
  Trash2,
  ExternalLink,
  Info,
  Car,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { ManagePickupAuthModal, PickupGuardianData } from './ManagePickupAuthModal'

export interface AlternatePickupPerson {
  id: string
  personName: string
  phone: string
  relationship: string
  actionType: string
  reason: string
  validFrom: string | Date
  validUntil: string | Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  approvedByName?: string | null
  approvedAt?: string | Date | null
  remarks?: string | null
}

interface PickupSecurityPanelProps {
  studentId: string
  studentName: string
  guardians: PickupGuardianData[]
  alternatePickups?: AlternatePickupPerson[]
  isStaff?: boolean
  invitingGuardianId?: string | null
  onRefresh: () => void
  onOpenLinkGuardian: () => void
  onEditGuardian: (g: PickupGuardianData) => void
  onUnlinkGuardian: (g: { id: string; name: string }) => void
  onInvitePortal?: (guardianId: string, guardianName: string) => void
}

export function PickupSecurityPanel({
  studentId,
  studentName,
  guardians,
  alternatePickups = [],
  isStaff = true,
  invitingGuardianId = null,
  onRefresh,
  onOpenLinkGuardian,
  onEditGuardian,
  onUnlinkGuardian,
  onInvitePortal,
}: PickupSecurityPanelProps) {
  const [selectedGuardianForAuth, setSelectedGuardianForAuth] = useState<PickupGuardianData | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Quick stats
  const totalGuardians = guardians.length
  const authorizedCount = guardians.filter(
    (g) => (g.pickupStatus === 'AUTHORIZED' || (!g.pickupStatus && g.canPickup))
  ).length
  const emergencyCount = guardians.filter((g) => g.isEmergencyContact ?? g.isPrimary).length
  const activeAlternateCount = alternatePickups.filter((p) => p.status === 'APPROVED').length

  const getStatusBadge = (g: PickupGuardianData) => {
    const rawStatus = g.pickupStatus || (g.canPickup ? 'AUTHORIZED' : 'NOT_AUTHORIZED')
    
    // Check expiration dynamically if expiry date is present
    const isExpired = g.authExpiresAt && new Date(g.authExpiresAt) < new Date()
    const effectiveStatus = isExpired ? 'EXPIRED' : rawStatus

    switch (effectiveStatus) {
      case 'AUTHORIZED':
        return {
          label: 'Authorized for Pickup',
          icon: <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
          pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        }
      case 'RESTRICTED':
        return {
          label: 'Restricted Pickup',
          icon: <AlertTriangle size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />,
          pillClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
        }
      case 'PENDING':
        return {
          label: 'Authorization Pending',
          icon: <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />,
          pillClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        }
      case 'EXPIRED':
        return {
          label: 'Authorization Expired',
          icon: <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />,
          pillClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        }
      case 'NOT_AUTHORIZED':
      default:
        return {
          label: 'Not Authorized',
          icon: <ShieldAlert size={14} className="text-slate-600 dark:text-slate-400 shrink-0" />,
          pillClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        }
    }
  }

  const handleCallContact = (name: string, phone: string) => {
    if (!phone) {
      toast.error('No Phone Number', `No telephone number on file for ${name}`)
      return
    }
    window.location.href = `tel:${phone}`
  }

  return (
    <div className="space-y-6">
      {/* ── SECTION HEADER & SUMMARY ── */}
      <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pickup Security & Guardians
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  Child Safety Guard
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review authorized pickup persons, emergency contacts, and any pickup restrictions for this child.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenLinkGuardian}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={14} />
              <span>Link Guardian</span>
            </button>
          </div>
        </div>

        {/* Child Safety Key Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Total Family Guardians</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalGuardians}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Authorized for Pickup</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{authorizedCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Emergency Contacts</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{emergencyCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Alternate / Temp Pickups</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeAlternateCount}</div>
          </div>
        </div>
      </div>

      {/* ── GUARDIAN CARDS GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Registered Guardians & Pickup Authority</span>
            <span className="text-xs font-normal text-slate-500 lowercase">({guardians.length} listed)</span>
          </h3>
        </div>

        {guardians.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {guardians.map((g) => {
              const statusInfo = getStatusBadge(g)
              const isEmergency = g.isEmergencyContact ?? g.isPrimary

              return (
                <div
                  key={g.id}
                  className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all space-y-4"
                >
                  {/* Top Bar: Identity & Quick Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {g.photoUrl ? (
                        <img
                          src={g.photoUrl}
                          alt={g.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-base flex items-center justify-center border border-purple-200 dark:border-purple-800/60">
                          {g.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                          {g.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                            {g.relationship?.toLowerCase()}
                          </span>
                          {g.occupation && (
                            <>
                              <span>•</span>
                              <span>{g.occupation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {g.phone && (
                        <button
                          type="button"
                          onClick={() => handleCallContact(g.name, g.phone)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
                          title={`Call ${g.name} (${g.phone})`}
                        >
                          <PhoneCall size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditGuardian(g)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Edit guardian details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnlinkGuardian({ id: g.id, name: g.name })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Unlink guardian"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Badges / Distinct Labels */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Primary Contact */}
                    {g.isPrimary && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Primary Contact
                      </span>
                    )}

                    {/* Emergency Contact */}
                    {isEmergency && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Phone size={11} />
                        <span>Emergency Contact {g.emergencyPriority ? `(Priority #${g.emergencyPriority})` : ''}</span>
                      </span>
                    )}

                    {/* Pickup Authorization Status Pill (Always visible, unmistakable text) */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${statusInfo.pillClass}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Scope & Restrictions Block */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span className="text-slate-400">Authorized Days:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {g.pickupDays || 'All Days'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className="text-slate-400">Time Window:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {g.pickupTimeWindow || 'No time restriction configured'}
                        </span>
                      </div>
                    </div>

                    {/* Expiry / Start Dates */}
                    {(g.authStartDate || g.authExpiresAt) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {g.authStartDate && (
                          <span>Valid from: <strong>{new Date(g.authStartDate).toLocaleDateString()}</strong></span>
                        )}
                        {g.authExpiresAt && (
                          <span>• Expires: <strong>{new Date(g.authExpiresAt).toLocaleDateString()}</strong></span>
                        )}
                      </div>
                    )}

                    {/* Specific Restrictions Note */}
                    {g.pickupRestrictions && (
                      <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-1.5 text-xs">
                        <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Gate Restriction: </strong>
                          {g.pickupRestrictions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portal Login Indicator / Quick Invite */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {g.portalAccount ? (
                      <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 text-[11px]">
                        <CheckCircle2 size={13} />
                        <span>Portal Connected ({g.portalAccount.email || g.email})</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400">No portal login linked</span>
                        {onInvitePortal && (
                          <button
                            type="button"
                            onClick={() => onInvitePortal(g.id, g.name)}
                            disabled={invitingGuardianId === g.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <span>{invitingGuardianId === g.id ? 'Inviting...' : 'Invite to Portal'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Verification & PIN Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <KeyRound size={12} className={g.hasPickupPin ? "text-emerald-600" : "text-slate-400"} />
                        <span>{g.hasPickupPin ? "Pickup PIN configured (••••)" : "No PIN configured"}</span>
                      </div>
                      {g.verifiedByName && (
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium text-[11px]">
                          <UserCheck size={12} />
                          <span>Verified by {g.verifiedByName}</span>
                        </div>
                      )}
                    </div>

                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGuardianForAuth(g)
                          setAuthModalOpen(true)
                        }}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <Shield size={12} />
                        <span>Manage Authorization</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <ShieldAlert size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Registered Guardians Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                For child safety, link authorized family members before releasing this child at the dismissal gate.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLinkGuardian}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>Link Guardian Now</span>
            </button>
          </div>
        )}
      </div>

      {/* ── ALTERNATE & TEMPORARY AUTHORIZED PICKUP PERSONS (NANNY / DRIVER) ── */}
      {alternatePickups && alternatePickups.length > 0 && (
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Approved Alternate & Temporary Pickup Authorizations
              </h3>
            </div>
            <span className="text-xs text-slate-400">Drivers, Nannies & Guest Pickups</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alternatePickups.map((ap) => {
              const isApproved = ap.status === 'APPROVED'
              const isValid = new Date(ap.validUntil) >= new Date()

              return (
                <div
                  key={ap.id}
                  className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{ap.personName}</div>
                      <div className="text-slate-500 font-medium">
                        {ap.relationship} • {ap.phone}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      isApproved && isValid
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {isApproved && isValid ? 'Authorized Temporary Pickup' : ap.status}
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Valid: </span>
                    <span className="font-semibold">
                      {new Date(ap.validFrom).toLocaleDateString()} – {new Date(ap.validUntil).toLocaleDateString()}
                    </span>
                  </div>

                  {ap.reason && (
                    <div className="text-slate-500 text-[11px] italic">
                      Reason: “{ap.reason}”
                    </div>
                  )}

                  {ap.approvedByName && (
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                      Approved by {ap.approvedByName}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: MANAGE PICKUP AUTHORIZATION ── */}
      {selectedGuardianForAuth && (
        <ManagePickupAuthModal
          open={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false)
            setSelectedGuardianForAuth(null)
          }}
          studentId={studentId}
          studentName={studentName}
          guardian={selectedGuardianForAuth}
          onSuccess={() => {
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

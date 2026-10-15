'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users, Baby, Building2, Shield, KeyRound, Phone, Mail,
  CheckCircle2, XCircle, Plus, Sparkles, AlertCircle, RefreshCw,
  Star, ChevronRight, UserPlus, HeartHandshake, Check, MapPin
} from 'lucide-react'
import { UserRecord, FamilyHousehold, GuardianChild, HouseholdGuardian, HouseholdCampus } from './types'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'

interface FamilyGroupingCardProps {
  user: UserRecord
  initialHousehold?: FamilyHousehold | null
  onUpdate?: () => void
  onOpenPinModal?: () => void
}

function calculateAge(dobStr?: string | null): string | null {
  if (!dobStr) return null
  try {
    const dob = new Date(dobStr)
    const diffMs = Date.now() - dob.getTime()
    if (diffMs <= 0) return null
    const diffDate = new Date(diffMs)
    const years = Math.abs(diffDate.getUTCFullYear() - 1970)
    const months = diffDate.getUTCMonth()
    if (years === 0) {
      return `${months} mo`
    }
    return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
  } catch {
    return null
  }
}

export function FamilyGroupingCard({
  user,
  initialHousehold,
  onUpdate,
  onOpenPinModal,
}: FamilyGroupingCardProps) {
  const toast = useToast()
  const [household, setHousehold] = useState<FamilyHousehold | null>(initialHousehold || null)
  const [loading, setLoading] = useState<boolean>(!initialHousehold)
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all')

  // Link Sibling Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [admissionNo, setAdmissionNo] = useState('')
  const [relationship, setRelationship] = useState('GUARDIAN')
  const [canPickup, setCanPickup] = useState(true)
  const [pickupPin, setPickupPin] = useState('')
  const [receivesComm, setReceivesComm] = useState(true)
  const [isFeePayer, setIsFeePayer] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const fetchHousehold = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/users/${user.id}/family`)
      if (!res.ok) {
        throw new Error('Failed to fetch family group')
      }
      const json = await res.json()
      const data = json.data || json
      if (data.household) {
        setHousehold(data.household)
      } else if (user.guardianProfile) {
        // Fallback from guardianProfile
        const gp = user.guardianProfile
        const fallbackHousehold: FamilyHousehold = {
          id: `hh_${gp.id}`,
          familyName: `${user.name}'s Household`,
          isCrossCampus: Boolean(gp.isCrossCampus),
          campuses: gp.campuses || [],
          guardians: [
            {
              id: gp.id,
              userId: user.userId,
              fullName: user.name,
              relationship: gp.relationship,
              phone: user.phone,
              email: user.email,
              isPrimaryContact: gp.isPrimaryContact,
              canPickup: true,
              pickupPin: gp.pickupPin,
              role: user.role,
              status: user.status,
            },
          ],
          students: gp.students || [],
          primaryGuardian: null,
        }
        setHousehold(fallbackHousehold)
      }
    } catch (err: any) {
      console.error('Error fetching household details:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user.guardianProfile, user.name, user.phone, user.email, user.userId, user.role, user.status])

  useEffect(() => {
    if (initialHousehold) {
      setHousehold(initialHousehold)
    } else {
      fetchHousehold()
    }
  }, [initialHousehold, fetchHousehold])

  // Filter students by selected campus
  const filteredStudents = useMemo(() => {
    if (!household?.students) return []
    if (selectedCampusId === 'all') return household.students
    return household.students.filter((s) => s.branchId === selectedCampusId)
  }, [household?.students, selectedCampusId])

  const handleLinkSibling = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admissionNo.trim()) {
      setLinkError('Admission number is required')
      return
    }

    setSubmitting(true)
    setLinkError(null)

    try {
      const res = await fetch(`/api/v1/users/${user.id}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAdmissionNo: admissionNo.trim(),
          relationship,
          permissions: {
            canPickup,
            pickupPin: pickupPin.trim() || undefined,
            receivesCommunication: receivesComm,
            isFeePayer,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to link student')
      }

      toast.success(data.message || 'Sibling successfully linked to family unit!')
      setIsLinkModalOpen(false)
      setAdmissionNo('')
      setPickupPin('')
      await fetchHousehold()
      onUpdate?.()
    } catch (err: any) {
      setLinkError(err.message || 'Error linking sibling')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !household) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading household & sibling grouping...</p>
      </div>
    )
  }

  if (!household) {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Family Unit Available</h4>
        <p className="text-xs text-gray-500 mt-1">This user is not currently linked to any student guardian profiles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Household Grouping Header Card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/20 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  {household.familyName}
                </h3>
                {household.isCrossCampus ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Cross-Campus Family ({household.campuses.length} Campuses)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    {household.campuses[0]?.name || 'Single Campus'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{household.students.length} Enrolled {household.students.length === 1 ? 'Ward' : 'Wards'}</span>
                <span>•</span>
                <span>{household.guardians.length} Registered Caregiver{household.guardians.length === 1 ? '' : 's'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Link Sibling / Child
            </button>
          </div>
        </div>

        {/* Cross Campus Info Callout if applicable */}
        {household.isCrossCampus && (
          <div className="mt-3.5 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Wards in this household attend multiple campuses. Use the campus switcher below to filter.
              </span>
            </div>
            <div className="flex items-center gap-1">
              {household.campuses.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium"
                >
                  {c.name}: <strong>{c.studentCount}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Cross-Campus Switcher Pills (If > 1 campus or when filtering) */}
      {household.campuses.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Campus Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCampusId('all')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              selectedCampusId === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Campuses ({household.students.length})
          </button>
          {household.campuses.map((campus) => (
            <button
              key={campus.id}
              type="button"
              onClick={() => setSelectedCampusId(campus.id)}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCampusId === campus.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{campus.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCampusId === campus.id ? 'bg-indigo-800 text-indigo-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {campus.studentCount}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Enrolled Wards / Sibling Cluster Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
          <span>Enrolled Children ({filteredStudents.length} of {household.students.length})</span>
          {household.campuses.length > 1 && selectedCampusId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCampusId('all')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline capitalize"
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredStudents.map((child) => {
              const age = calculateAge(child.dob)
              return (
                <div
                  key={child.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Left: Avatar & Child Profile */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
                        {child.photoUrl ? (
                          <img
                            src={child.photoUrl}
                            alt={child.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Baby className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {child.name}
                          </span>
                          <span className="badge b-primary font-mono text-[10px]">
                            {child.admissionNo}
                          </span>
                          {child.branchName && (
                            <span className="badge b-purple text-[10px] flex items-center gap-1 font-medium">
                              <Building2 className="w-3 h-3" />
                              {child.branchName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {child.classroom && (
                            <span className="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              Class: {child.classroom}
                            </span>
                          )}
                          {age && (
                            <span>
                              Age: <strong>{age}</strong>
                            </span>
                          )}
                          {child.dob && (
                            <span className="text-[11px]">
                              (DOB: {fmtDate(child.dob)})
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            Relation: <strong className="capitalize">{child.relationship?.toLowerCase() || 'Child'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Security & Pickup Authorizations */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
                      <span
                        className={`badge text-[10px] font-semibold flex items-center gap-1 ${
                          child.canPickup ? 'b-success' : 'b-neutral'
                        }`}
                      >
                        {child.canPickup ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {child.canPickup ? 'Pickup Authorized' : 'No Pickup'}
                      </span>

                      {child.receivesComm !== false && (
                        <span className="badge b-blue text-[10px]">
                          Comms Active
                        </span>
                      )}

                      {child.canPickup && (
                        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-md px-2 py-1">
                          <KeyRound className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            {child.pickupPin ? '••••' : 'No PIN'}
                          </span>
                          {onOpenPinModal && (
                            <button
                              type="button"
                              onClick={onOpenPinModal}
                              className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline ml-1 cursor-pointer"
                              title="Update Pickup PIN"
                            >
                              Manage
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-4 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 text-xs">
            No enrolled wards found for the selected campus.
          </div>
        )}
      </div>

      {/* 4. Household Caregivers / Co-Guardians Section */}
      <div className="space-y-2.5 pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>Household Caregivers & Co-Guardians ({household.guardians.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {household.guardians.map((g) => (
            <div
              key={g.id}
              className={`rounded-xl border p-3 flex flex-col justify-between text-xs transition-colors ${
                g.isPrimaryContact
                  ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                    <span>{g.fullName}</span>
                    {g.isPrimaryContact && (
                      <span className="badge b-success text-[10px] flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="badge b-purple text-[10px] uppercase font-mono">
                    {g.relationship}
                  </span>
                </div>

                <div className="space-y-1 mt-2 text-[11px] text-gray-600 dark:text-gray-300">
                  {g.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <a href={`tel:${g.phone}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                        {g.phone}
                      </a>
                    </div>
                  )}
                  {g.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <a href={`mailto:${g.email}`} className="hover:underline truncate max-w-[200px]">
                        {g.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                <span>Pickup: {g.canPickup !== false ? 'Authorized' : 'Restricted'}</span>
                <span>Role: <strong>{g.role || 'GUARDIAN'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Link Sibling Modal */}
      {isLinkModalOpen && (
        <Modal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          title="Link Sibling to Family Unit"
        >
          <form onSubmit={handleLinkSibling} className="space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Link an additional enrolled child to <strong>{household.familyName}</strong>. The child will share
              the household caregiver roster and pickup authorizations.
            </p>

            {linkError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Student Admission Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ADM-2024-002"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="input input-sm w-full font-mono uppercase"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                Enter the exact admission number of the child already enrolled in any school campus.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Relationship to Guardian
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="select select-sm w-full"
              >
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
                <option value="GUARDIAN">Legal Guardian</option>
                <option value="GRANDPARENT">Grandparent</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other Caregiver</option>
              </select>
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Caregiver Permissions
              </span>

              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canPickup}
                  onChange={(e) => setCanPickup(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary"
                />
                <span>Authorized for Daily School Pickup</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receivesComm}
                  onChange={(e) => setReceivesComm(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary"
                />
                <span>Receives School Communications & Announcements</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeePayer}
                  onChange={(e) => setIsFeePayer(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary"
                />
                <span>Designated Fee Payer</span>
              </label>
            </div>

            {canPickup && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Child Pickup PIN (Optional, 4-6 digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 1234"
                  value={pickupPin}
                  onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                  className="input input-sm w-full font-mono tracking-widest text-center"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="btn btn-ghost btn-sm text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !admissionNo.trim()}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Link Child to Household
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

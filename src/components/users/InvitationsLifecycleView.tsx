'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Send,
  Search,
  ExternalLink,
  Shield,
  Building,
  MoreHorizontal,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InvitationListItem, InvitationKpis } from '@/lib/users/invitation-service'

interface InvitationsLifecycleViewProps {
  onSelectUser?: (userId: string) => void
  onInviteSuccess?: () => void
}

export function InvitationsLifecycleView({ onSelectUser, onInviteSuccess }: InvitationsLifecycleViewProps) {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<InvitationListItem[]>([])
  const [kpis, setKpis] = useState<InvitationKpis>({
    total: 0,
    pending: 0,
    expiringSoon: 0,
    expired: 0,
    accepted: 0,
  })

  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'EXPIRING_SOON' | 'EXPIRED' | 'ACCEPTED'>('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL('/api/v1/users/invitations', window.location.origin)
      if (selectedFilter !== 'ALL') {
        url.searchParams.set('status', selectedFilter)
      }
      if (search.trim()) {
        url.searchParams.set('search', search.trim())
      }

      const res = await fetch(url.toString())
      const json = await res.json()

      if (res.ok && json.success) {
        setInvitations(json.data.invitations || [])
        if (json.data.kpis) {
          setKpis(json.data.kpis)
        }
      } else {
        toast.error('Failed to load invitations', json.error?.message || json.message)
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Could not retrieve invitations')
    } finally {
      setLoading(false)
    }
  }, [selectedFilter, search, toast])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleResend = async (item: InvitationListItem) => {
    setActionLoadingId(item.id)
    try {
      const res = await fetch('/api/v1/users/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend',
          invitationId: item.invitationId,
          userId: item.userId,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to resend invitation')
      }

      toast.success(
        'Invitation Resent',
        json.data?.message || `Refreshed 7-day invitation sent to ${item.email}.`
      )
      fetchInvitations()
      onInviteSuccess?.()
    } catch (err: any) {
      toast.error('Resend Failed', err.message || 'Could not resend invitation')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRevoke = async (item: InvitationListItem) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${item.fullName} (${item.email})?`)) {
      return
    }

    setActionLoadingId(item.id)
    try {
      const res = await fetch('/api/v1/users/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          invitationId: item.invitationId,
          userId: item.userId,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to revoke invitation')
      }

      toast.success('Invitation Revoked', `Access invitation for ${item.email} has been cancelled.`)
      fetchInvitations()
      onInviteSuccess?.()
    } catch (err: any) {
      toast.error('Revoke Failed', err.message || 'Could not revoke invitation')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCopyLink = async (item: InvitationListItem) => {
    if (!item.inviteUrl) {
      toast.error('Link Unavailable', 'Please resend the invitation to generate a fresh link.')
      return
    }

    try {
      await navigator.clipboard.writeText(item.inviteUrl)
      setCopiedId(item.id)
      toast.success('Link Copied', 'Direct invitation link copied to clipboard.')
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error('Copy Failed', 'Could not copy link to clipboard.')
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedFilter('ALL')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-purple-50/80 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800 shadow-xs'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Invites</span>
            <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {kpis.total}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">All tracked invitations</div>
        </div>

        <div
          onClick={() => setSelectedFilter('PENDING')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'PENDING'
              ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 shadow-xs'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Active Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800 dark:text-amber-200 mt-1">
            {kpis.pending}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Within 7-day validity</div>
        </div>

        <div
          onClick={() => setSelectedFilter('EXPIRING_SOON')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'EXPIRING_SOON'
              ? 'bg-orange-50/80 border-orange-300 dark:bg-orange-950/40 dark:border-orange-800 shadow-xs'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-orange-800 dark:text-orange-200 mt-1">
            {kpis.expiringSoon}
          </div>
          <div className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">&lt; 24h remaining</div>
        </div>

        <div
          onClick={() => setSelectedFilter('EXPIRED')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'EXPIRED'
              ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 shadow-xs'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Expired</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-800 dark:text-rose-200 mt-1">
            {kpis.expired}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Requires resend</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invitee name, email, or role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 text-xs">
            {(['ALL', 'PENDING', 'EXPIRING_SOON', 'EXPIRED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedFilter === filter
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {filter === 'ALL' && 'All'}
                {filter === 'PENDING' && 'Active'}
                {filter === 'EXPIRING_SOON' && 'Expiring'}
                {filter === 'EXPIRED' && 'Expired'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchInvitations()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs">
        {loading && invitations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading invitation lifecycle data...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Mail className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              No invitations found
            </p>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
              {search
                ? `No invitations matching "${search}"`
                : selectedFilter !== 'ALL'
                ? `No ${selectedFilter.toLowerCase()} invitations at this time.`
                : 'Send invitations to new teachers, administrators, or staff members to see them here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Invitee &amp; Role</th>
                  <th className="py-2.5 px-3">Campus &amp; Role</th>
                  <th className="py-2.5 px-3">Invited Age</th>
                  <th className="py-2.5 px-3">Expiry Countdown</th>
                  <th className="py-2.5 px-3">Resends</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invitations.map((item) => {
                  const isActionLoading = actionLoadingId === item.id
                  const isCopied = copiedId === item.id

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Invitee */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={item.fullName} src={item.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <div
                              onClick={() => onSelectUser?.(item.userId)}
                              className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer truncate max-w-[160px]"
                            >
                              {item.fullName}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono truncate max-w-[160px]">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Campus & Designation */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <span className="badge b-purple text-[10px] font-bold">
                            {item.role}
                          </span>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-gray-400" />
                            <span>{item.branchName || 'All Campuses'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Invited Age */}
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                        <div title={new Date(item.invitedAt).toLocaleString()}>
                          <div className="font-medium">{item.invitedAge}</div>
                          <div className="text-[10px] text-gray-400">by {item.invitedByName}</div>
                        </div>
                      </td>

                      {/* Expiry Countdown & Status */}
                      <td className="py-2.5 px-3">
                        <div>
                          {item.effectiveStatus === 'ACCEPTED' ? (
                            <span className="badge b-emerald text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Accepted</span>
                            </span>
                          ) : item.effectiveStatus === 'EXPIRED' ? (
                            <div className="space-y-0.5">
                              <span className="badge b-red text-[11px] font-semibold flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                <span>Expired</span>
                              </span>
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                                {item.expiresIn}
                              </div>
                            </div>
                          ) : item.effectiveStatus === 'EXPIRING_SOON' ? (
                            <div className="space-y-0.5">
                              <span className="badge b-amber text-[11px] font-semibold flex items-center gap-1 w-fit animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Expiring Soon</span>
                              </span>
                              <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                                {item.expiresIn}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="badge b-amber text-[11px] font-semibold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                              <div className="text-[10px] text-gray-500">
                                {item.expiresIn}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Resends */}
                      <td className="py-2.5 px-3">
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-mono font-medium">
                            {item.resendCount === 0 ? 'Initial' : `${item.resendCount}x resent`}
                          </span>
                          {item.lastResentAt && (
                            <div className="text-[10px] text-gray-400">
                              last: {new Date(item.lastResentAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Resend button */}
                          <button
                            type="button"
                            onClick={() => handleResend(item)}
                            disabled={isActionLoading}
                            className="p-1 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            title="Resend invitation email"
                          >
                            <Send className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item)}
                            disabled={!item.inviteUrl}
                            className="p-1 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors disabled:opacity-40"
                            title="Copy direct invite link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* More dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem onClick={() => onSelectUser?.(item.userId)}>
                                <ExternalLink className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                <span>View User 360</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResend(item)}>
                                <Send className="w-3.5 h-3.5 mr-2 text-purple-600" />
                                <span>Resend Invitation</span>
                              </DropdownMenuItem>
                              {item.inviteUrl && (
                                <DropdownMenuItem onClick={() => handleCopyLink(item)}>
                                  <Copy className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                  <span>Copy Invite Link</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRevoke(item)}
                                className="text-red-600 dark:text-red-400 focus:text-red-600"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                                <span>Revoke Invitation</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

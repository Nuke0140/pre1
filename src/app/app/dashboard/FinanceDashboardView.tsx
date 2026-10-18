'use client'

import React from 'react'
import Link from 'next/link'
import {
  Wallet,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Receipt,
  Plus,
  Send,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { PageHead, KpiMetricCard, EmptyState, StatusBadge } from '@/components/preone/ui'
import { inr, fmtDate } from '@/lib/format'

export interface FinanceDashboardProps {
  role: string
  sessionName?: string
  metrics: {
    billed: number
    collected: number
    overdue: number
    collectRate: number
    draftCount: number
    draftTotalCents: number
    overdueCount: number
    paidCount: number
  }
  recentInvoices: {
    id: string
    invoiceNumber: string
    studentName: string
    totalCents: number
    paidCents: number
    balanceCents: number
    status: string
    dueDate: string
  }[]
  recentPayments: {
    id: string
    paymentNumber: string
    studentName: string
    amountCents: number
    method: string
    status: string
    paymentDate: string
  }[]
}

export function FinanceDashboardView({
  role,
  sessionName,
  metrics,
  recentInvoices = [],
  recentPayments = [],
}: FinanceDashboardProps) {
  return (
    <div className="premium-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. Page Header & Operational Hero ── */}
      <PageHead
        eyebrow="Finance & Accounts Operations"
        title="Fee Management & Collection Center"
        sub="Authorized institutional fee ledger, collection efficiency tracking, uncommitted drafts, and receivables recovery."
        badge={
          sessionName ? (
            <span className="badge b-primary b-dot">Session: {sessionName}</span>
          ) : (
            <span className="badge b-warning b-dot">All-Time Cumulative View (No Active Academic Session)</span>
          )
        }
      />

      {/* ── Operational Command Strip ── */}
      <div className="operational-hero">
        <div className="operational-hero-head">
          <div>
            <h2 className="operational-hero-title">Receivables & Cash Flow Pulse</h2>
            <p className="operational-hero-sub">
              {sessionName
                ? `Showing active fee receivables and collections strictly scoped to academic session ${sessionName}.`
                : 'No active academic session was detected. Showing all tenant records with session-unrestricted scope.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge b-neutral font-mono">Role: {role}</span>
          </div>
        </div>

        {/* ── 2. Primary Financial KPI Metrics Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Active Billed Total */}
          <div className="premium-enter premium-stagger-1">
            <KpiMetricCard
              label="Active Billed Revenue"
              value={inr(metrics.billed, { compact: true })}
              icon={<FileText size={17} />}
              iconClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40"
              status={{
                text: `${metrics.paidCount} fully settled`,
                variant: 'neutral',
              }}
            />
          </div>

          {/* Cash Collected Total */}
          <div className="premium-enter premium-stagger-2">
            <KpiMetricCard
              label="Cash Collected"
              value={inr(metrics.collected, { compact: true })}
              icon={<Wallet size={17} />}
              iconClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40"
              status={{
                text: `${metrics.collectRate}% recovery efficiency`,
                variant: metrics.collectRate >= 85 ? 'success' : 'warning',
              }}
            />
          </div>

          {/* Overdue Arrears */}
          <div className="premium-enter premium-stagger-3">
            <KpiMetricCard
              label="Overdue Arrears"
              value={inr(metrics.overdue, { compact: true })}
              icon={<AlertCircle size={17} />}
              iconClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40"
              status={{
                text: metrics.overdueCount > 0 ? `${metrics.overdueCount} accounts past due` : 'No overdue arrears',
                variant: metrics.overdueCount > 0 ? 'urgent' : 'success',
              }}
            />
          </div>

          {/* Draft Work Queue (Isolated from Billed) */}
          <div className="premium-enter premium-stagger-4">
            <KpiMetricCard
              label="Draft Invoices Pending"
              value={metrics.draftCount}
              icon={<Clock size={17} />}
              iconClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40"
              status={{
                text: metrics.draftCount > 0 ? `${inr(metrics.draftTotalCents, { compact: true })} unissued` : 'Draft queue clear',
                variant: metrics.draftCount > 0 ? 'warning' : 'neutral',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Quick Action Launchpad ── */}
      <div className="quick-action-strip">
        <span className="strip-label">Finance Actions:</span>
        <Link href="/app/finance?action=create-invoice" className="btn-action">
          <Plus size={14} /> Create Invoice
        </Link>
        <Link href="/app/finance?action=record-payment" className="btn-action">
          <Receipt size={14} /> Record Offline Payment
        </Link>
        <Link href="/app/finance?tab=invoices&filter=overdue" className="btn-action">
          <Send size={14} /> Follow-Up Reminders
        </Link>
        <Link href="/app/finance" className="btn-action">
          <Wallet size={14} /> Full Fee Register
        </Link>
      </div>

      {/* ── 4. Drafts Operational Callout Banner (when drafts exist) ── */}
      {metrics.draftCount > 0 && (
        <div
          role="status"
          aria-label="Pending Draft Invoices Notice"
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg, 12px)',
            backgroundColor: 'var(--amber-soft, #fef3c7)',
            border: '1px solid var(--amber-border, #fcd34d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#92400e' }}>
                {metrics.draftCount} Draft {metrics.draftCount === 1 ? 'Invoice' : 'Invoices'} Awaiting Dispatch ({inr(metrics.draftTotalCents)})
              </div>
              <div style={{ fontSize: 12, color: '#b45309' }}>
                Draft invoices are isolated from legal billed receivables. Review and issue them to enable parent portal visibility.
              </div>
            </div>
          </div>
          <Link
            href="/app/finance?tab=invoices&status=DRAFT"
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600 }}
          >
            Review Drafts <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── 5. Detailed Ledgers: Overdue & Priority Invoices + Recent Collections ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="dash-grid">
        {/* Recent Invoices / Receivables Queue */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Invoices & Priority Receivables</div>
              <div className="card-sub">Active billing accounts and outstanding balances</div>
            </div>
            <Link href="/app/finance?tab=invoices" className="btn btn-ghost btn-sm">
              All Invoices <ArrowRight size={13} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div style={{ padding: '24px 16px' }}>
              <EmptyState
                compact
                icon={<FileText size={24} className="text-slate-400" />}
                title="No Invoices Issued"
                description={
                  sessionName
                    ? `No fee invoices have been generated for academic session ${sessionName}.`
                    : 'No fee invoices found in the institutional records.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-300">
                        {inv.studentName || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {inr(inv.totalCents)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {inv.balanceCents > 0 ? inr(inv.balanceCents) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Authoritative Cleared Payments Feed */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Authoritative Collections Log</div>
              <div className="card-sub">Cleared transactions deposited into school ledger</div>
            </div>
            <Link href="/app/finance?tab=payments" className="btn btn-ghost btn-sm">
              All Receipts <ArrowRight size={13} />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div style={{ padding: '24px 16px' }}>
              <EmptyState
                compact
                icon={<Receipt size={24} className="text-slate-400" />}
                title="No Payments Recorded"
                description={
                  sessionName
                    ? `No cash or online fee payments have cleared for academic session ${sessionName}.`
                    : 'No payment receipts recorded in the institutional ledger.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Receipt / Ref</th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-slate-200">
                        {pmt.paymentNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-300">
                        {pmt.studentName || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {fmtDate(pmt.paymentDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {inr(pmt.amountCents)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="badge b-neutral text-[10px] uppercase font-mono">
                          {pmt.method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

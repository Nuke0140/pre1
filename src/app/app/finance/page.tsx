'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Wallet, IndianRupee, Receipt, BadgeCheck, Download, Layers, Printer, FileText } from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, KpiTile, Skeleton } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { inr, fmtDate, enumLabel } from '@/lib/format'

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  studentName: string
  admissionNo: string
  dueDate: string
  totalCents: number
  paidCents: number
  balanceCents: number
  status: string
}
interface Detail {
  id: string
  invoiceNumber: string
  title: string
  student: { name: string; admissionNo: string; classroom?: string }
  dueDate: string
  items: { feeHead: string; description: string; amountCents: number }[]
  totalCents: number
  paidCents: number
  balanceCents: number
  status: string
  payments: {
    id: string
    paymentNumber: string
    amountCents: number
    method: string
    paymentDate: string
    receiptId: string | null
    receiptNumber: string | null
  }[]
}
interface StudentOpt { id: string; name: string; admissionNo: string }

interface ReceiptDetail {
  receiptNumber: string
  issuedAt: string
  amountRupees: string
  school: { name: string; code: string; address?: string; city?: string; phone?: string; email?: string; gstNumber?: string }
  student: { name: string; admissionNo: string; classroom?: string }
  payment: { paymentNumber: string; method: string; transactionRef?: string; paidAt: string }
  invoice: { invoiceNumber: string; title: string; totalRupees: string; balanceRupees: string }
}

export default function FinancePage() {
  const toast = useToast()
  const sp = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [students, setStudents] = useState<StudentOpt[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [receiptDetail, setReceiptDetail] = useState<ReceiptDetail | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = useCallback(async () => {
    const url = statusFilter === 'ALL' ? '/api/v1/invoices' : `/api/v1/invoices?status=${statusFilter}`
    const [inv, stu] = await Promise.all([
      fetch(url).then((r) => r.json()),
      fetch('/api/v1/students?pageSize=100').then((r) => r.json()),
    ])
    if (inv.success) setInvoices(inv.data)
    if (stu.success) setStudents(stu.data.map((s: { id: string; name: string; admissionNo: string }) => ({ id: s.id, name: s.name, admissionNo: s.admissionNo })))
  }, [statusFilter])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const openDetail = useCallback(async (id: string) => {
    const j = await fetch(`/api/v1/invoices/${id}`).then((r) => r.json())
    if (j.success) setDetail(j.data)
  }, [])

  const viewReceipt = async (receiptId: string) => {
    setBusy(true)
    const j = await fetch(`/api/v1/receipts/${receiptId}`).then((r) => r.json())
    setBusy(false)
    if (j.success) {
      setReceiptDetail(j.data)
    } else {
      toast.error('Could not load receipt', j.error?.message)
    }
  }

  const triggerExport = async () => {
    setBusy(true)
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PAYMENT_EXPORT',
        payload: { format: 'CSV', statusFilter },
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Export job queued', `Job #${json.data.id.slice(0, 8)} started in background`)
    } else {
      toast.error('Failed to start export', json.error?.message)
    }
  }

  const triggerBulkInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const rupees = parseFloat(String(fd.get('amount') || '0'))
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'BULK_INVOICE',
        payload: {
          title: fd.get('title') || 'Term Fee',
          description: fd.get('desc') || 'Tuition & Activities',
          amountCents: Math.round(rupees * 100),
          feeHead: fd.get('feeHead') || 'TUITION',
          dueDate: fd.get('dueDate'),
        },
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Bulk invoicing queued', `Job #${json.data.id.slice(0, 8)} processing for active students`)
      setBulkOpen(false)
      setTimeout(load, 2000)
    } else {
      toast.error('Failed to trigger bulk invoicing', json.error?.message)
    }
  }

  useEffect(() => {
    const inv = sp.get('invoice')
    if (inv) Promise.resolve().then(() => openDetail(inv))
  }, [sp, openDetail])

  const recordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!detail) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const rupees = parseFloat(String(fd.get('rupees') || '0'))
    const res = await fetch(`/api/v1/invoices/${detail.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: Math.round(rupees * 100),
        method: fd.get('method'),
        transactionRef: fd.get('ref') || undefined,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Payment recorded', `Receipt ${json.data.receiptNumber} generated · invoice ${json.data.status}`)
      setPayOpen(false)
      openDetail(detail.id)
      load()
    } else {
      toast.error('Payment failed', json.error?.message)
    }
  }

  const sendReminder = async () => {
    if (!detail) return
    setBusy(true)
    const res = await fetch(`/api/v1/invoices/${detail.id}/remind`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Reminder sent', 'Fee follow-up stays open until payment is received (notification ≠ resolution)')
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const createInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const rupees = parseFloat(String(fd.get('amount') || '0'))
    const res = await fetch('/api/v1/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: fd.get('studentId'),
        title: fd.get('title') || 'Fee Invoice',
        dueDate: fd.get('dueDate'),
        lineItems: [{ description: String(fd.get('desc') || 'Fee'), amountCents: Math.round(rupees * 100), feeHead: 'OTHER' }],
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Invoice raised', json.data.invoiceNumber)
      setCreateOpen(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const totals = (invoices || []).reduce(
    (acc, i) => {
      acc.billed += i.totalCents
      acc.paid += i.paidCents
      acc.due += i.balanceCents
      return acc
    },
    { billed: 0, paid: 0, due: 0 }
  )

  return (
    <>
      <PageHead
        title="Fees & Payments"
        sub="Invoices, receipts aur collection — sab kuch auto-reconciled."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={triggerExport} disabled={busy} title="Export payment records to CSV">
              <Download size={15} /> Export CSV
            </button>
            <button className="btn btn-outline" onClick={() => setBulkOpen(true)}>
              <Layers size={15} /> Bulk Invoicing
            </button>
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Raise Invoice
            </button>
          </div>
        }
      />

      <div className="kpi-row">
        <KpiTile label="Total Billed" value={inr(totals.billed, { compact: true })} icon={<IndianRupee />} iconClass="ic-blue" meta={`${invoices?.length ?? 0} invoices`} />
        <KpiTile label="Collected" value={inr(totals.paid, { compact: true })} icon={<Wallet />} iconClass="ic-green" trend={{ dir: 'up', text: `${totals.billed ? Math.round((totals.paid / totals.billed) * 100) : 0}%` }} />
        <KpiTile label="Outstanding" value={inr(totals.due, { compact: true })} icon={<Receipt />} iconClass="ic-orange" meta="Follow up with fee payers" />
      </div>

      <div className="dtable-wrap">
        <div className="table-toolbar">
          <div className="card-title">All Invoices</div>
          <div className="seg">
            {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map((s) => (
              <button key={s} className={statusFilter === s ? 'on' : ''} onClick={() => setStatusFilter(s)}>
                {s === 'ALL' ? 'All' : enumLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="dtable-scroll">
          <table className="dtable">
            <thead>
              <tr><th>Invoice</th><th>Student</th><th>Due</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices?.map((i) => (
                <tr key={i.id} onClick={() => openDetail(i.id)}>
                  <td>
                    <span className="cell-strong" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{i.invoiceNumber}</span>
                    <span className="cell-sub">{i.title}</span>
                  </td>
                  <td className="cell-strong">{i.studentName}<span className="cell-sub">{i.admissionNo}</span></td>
                  <td>{fmtDate(i.dueDate)}</td>
                  <td>{inr(i.totalCents)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{inr(i.paidCents)}</td>
                  <td style={{ fontWeight: 700, color: i.balanceCents > 0 ? '#DC2626' : undefined }}>{inr(i.balanceCents)}</td>
                  <td><StatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices === null && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} h={36} />)}
            </div>
          )}
          {invoices?.length === 0 && (
            <EmptyState icon={<Wallet size={40} />} title="No invoices" message="Invoices appear when admissions are approved or raised manually." />
          )}
        </div>
      </div>

      {/* Detail + record payment */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.invoiceNumber : ''}
        subtitle={detail ? `${detail.student.name} · ${detail.student.classroom || ''}` : ''}
        icon={<Receipt size={22} />}
        wide
      >
        {detail && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <StatusBadge status={detail.status} />
              <span className="t-caption">Due {fmtDate(detail.dueDate)}</span>
            </div>
            <table className="dtable" style={{ border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {detail.items.map((it, ix) => (
                  <tr key={ix} style={{ cursor: 'default' }}>
                    <td>
                      {it.description}
                      <span className="cell-sub">{enumLabel(it.feeHead)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{inr(it.amountCents)}</td>
                  </tr>
                ))}
                <tr style={{ cursor: 'default' }}>
                  <td className="cell-strong">Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{inr(detail.totalCents)}</td>
                </tr>
                <tr style={{ cursor: 'default' }}>
                  <td>Paid</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>{inr(detail.paidCents)}</td>
                </tr>
                <tr style={{ cursor: 'default' }}>
                  <td className="cell-strong">Balance</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: detail.balanceCents > 0 ? '#DC2626' : 'var(--success)' }}>
                    {inr(detail.balanceCents)}
                  </td>
                </tr>
              </tbody>
            </table>

            {detail.payments.length > 0 && (
              <>
                <div className="sm-title" style={{ marginTop: 16 }}>Payment history</div>
                {detail.payments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--success-soft)', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5 }}>
                      <strong>{p.paymentNumber}</strong> · {inr(p.amountCents)} · {enumLabel(p.method)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge b-success"><BadgeCheck size={12} /> {p.receiptNumber}</span>
                      {p.receiptId && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '2px 8px', fontSize: 12, height: 26 }}
                          onClick={() => viewReceipt(p.receiptId!)}
                          title="View & Print Official Receipt"
                        >
                          <Printer size={13} /> View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
              {detail.balanceCents > 0 && !['CANCELLED', 'WRITTEN_OFF'].includes(detail.status) && (
                <button className="btn btn-outline" disabled={busy} onClick={sendReminder}>
                  Send reminder
                </button>
              )}
              {detail.balanceCents > 0 && !['CANCELLED', 'WRITTEN_OFF'].includes(detail.status) && (
                <button className="btn btn-primary" onClick={() => setPayOpen(true)}>
                  <IndianRupee size={15} /> Record Payment
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        open={!!receiptDetail}
        onClose={() => setReceiptDetail(null)}
        title={receiptDetail ? `Official Receipt — ${receiptDetail.receiptNumber}` : ''}
        subtitle="Server-verified payment acknowledgment"
        icon={<FileText size={22} />}
        wide
      >
        {receiptDetail && (
          <div>
            <div style={{ padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{receiptDetail.school.name}</h3>
                  <div className="t-caption" style={{ marginTop: 4 }}>
                    {receiptDetail.school.address} · {receiptDetail.school.city}
                  </div>
                  {receiptDetail.school.gstNumber && (
                    <div className="t-caption">GSTIN: {receiptDetail.school.gstNumber}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                    {receiptDetail.receiptNumber}
                  </div>
                  <div className="t-caption" style={{ marginTop: 4 }}>Date: {fmtDate(receiptDetail.issuedAt)}</div>
                  <span className="badge b-success" style={{ marginTop: 6 }}>PAYMENT VERIFIED</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div className="t-caption" style={{ fontWeight: 600 }}>RECEIVED FROM / STUDENT</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>{receiptDetail.student.name}</div>
                  <div className="t-caption">Admission No: {receiptDetail.student.admissionNo}</div>
                  {receiptDetail.student.classroom && (
                    <div className="t-caption">Classroom: {receiptDetail.student.classroom}</div>
                  )}
                </div>
                <div>
                  <div className="t-caption" style={{ fontWeight: 600 }}>PAYMENT DETAILS</div>
                  <div className="t-caption" style={{ marginTop: 4 }}>Payment #: {receiptDetail.payment.paymentNumber}</div>
                  <div className="t-caption">Method: {enumLabel(receiptDetail.payment.method)}</div>
                  {receiptDetail.payment.transactionRef && (
                    <div className="t-caption">Ref/UTR: {receiptDetail.payment.transactionRef}</div>
                  )}
                  <div className="t-caption">Invoice: {receiptDetail.invoice.invoiceNumber}</div>
                </div>
              </div>

              <div style={{ background: 'var(--primary-soft, #f0f4ff)', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Amount Paid</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>₹{receiptDetail.amountRupees}</span>
              </div>

              <div className="t-caption" style={{ marginTop: 14, textAlign: 'center', color: 'var(--muted)' }}>
                Computer-generated receipt issued per PreOne Enterprise Preschool OS. IT §269ST compliant.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setReceiptDetail(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Invoicing Modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Generate Bulk Invoices"
        subtitle="Queues an asynchronous background job for all active enrolled students"
        icon={<Layers size={22} />}
      >
        <form onSubmit={triggerBulkInvoice}>
          <div className="form-grid">
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label>Invoice Title <span className="req">*</span></label>
              <input className="input" name="title" placeholder="Term 1 Tuition & Activity Fee" required />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label>Line Item Description <span className="req">*</span></label>
              <input className="input" name="desc" placeholder="Preschool Tuition, Learning Kit & Refreshments" required />
            </div>
            <div className="field">
              <label>Fee Head <span className="req">*</span></label>
              <select className="select" name="feeHead" defaultValue="TUITION">
                {['TUITION', 'REGISTRATION', 'ANNUAL', 'MATERIAL', 'ACTIVITY', 'TRANSPORT', 'MEALS', 'DAYCARE', 'OTHER'].map((fh) => (
                  <option key={fh} value={fh}>{enumLabel(fh)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount per Student (₹) <span className="req">*</span></label>
              <input className="input" name="amount" type="number" min="1" step="0.01" placeholder="15000" required />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label>Due Date <span className="req">*</span></label>
              <input className="input" name="dueDate" type="date" required />
            </div>
          </div>
          <p className="helper" style={{ margin: '12px 0 0' }}>
            A background worker will process each student sequentially with unique invoice numbering and audit tracking.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Start Bulk Job</button>
          </div>
        </form>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record Payment"
        subtitle={detail ? `Balance ${inr(detail.balanceCents)}` : ''}
        icon={<IndianRupee size={22} />}
      >
        {detail && (
          <form onSubmit={recordPayment}>
            <div className="form-grid">
              <div className="field">
                <label>Amount (₹) <span className="req">*</span></label>
                <input className="input" name="rupees" type="number" min="1" max={detail.balanceCents / 100} step="0.01"
                  defaultValue={detail.balanceCents / 100} required />
              </div>
              <div className="field">
                <label>Method <span className="req">*</span></label>
                <select className="select" name="method" defaultValue="UPI">
                  {['UPI', 'CASH', 'CARD', 'NET_BANKING', 'CHEQUE', 'BANK_TRANSFER', 'WALLET'].map((m) => (
                    <option key={m} value={m}>{enumLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Transaction Ref / UTR</label>
                <input className="input" name="ref" placeholder="UPI ref no (optional)" />
              </div>
            </div>
            <p className="helper" style={{ margin: '10px 0 0' }}>
              Receipt auto-generated on save (RPT ≤60s rule). Cash above ₹50,000 is blocked (IT §269ST).
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPayOpen(false)}>Cancel</button>
              <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Payment</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create invoice modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Raise Invoice" subtitle="Manual invoice for any fee component" icon={<Plus size={22} />} wide>
        <form onSubmit={createInvoice}>
          <div className="form-grid">
            <div className="field">
              <label>Student <span className="req">*</span></label>
              <select className="select" name="studentId" required defaultValue="">
                <option value="" disabled>Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
              </select>
            </div>
            <div className="field"><label>Title</label><input className="input" name="title" placeholder="Transport Fee — Term 2" /></div>
            <div className="field"><label>Description</label><input className="input" name="desc" placeholder="Bus route PM-04" /></div>
            <div className="field"><label>Amount (₹) <span className="req">*</span></label><input className="input" name="amount" type="number" min="1" step="0.01" required /></div>
            <div className="field"><label>Due Date <span className="req">*</span></label><input className="input" name="dueDate" type="date" required /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Raise Invoice</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

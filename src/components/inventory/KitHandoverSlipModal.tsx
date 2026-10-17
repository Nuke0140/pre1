'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Printer,
  X,
  Package,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  Building2,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { HandoverSlipData } from '@/lib/inventory/welcome-kit-service'

interface KitHandoverSlipModalProps {
  open: boolean
  onClose: () => void
  kitIssuanceId?: string | null
  initialSlipData?: HandoverSlipData | null
}

export function KitHandoverSlipModal({
  open,
  onClose,
  kitIssuanceId,
  initialSlipData,
}: KitHandoverSlipModalProps) {
  const [slip, setSlip] = useState<HandoverSlipData | null>(initialSlipData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialSlipData) {
      setSlip(initialSlipData)
      setError(null)
      return
    }

    if (open && kitIssuanceId) {
      setLoading(true)
      setError(null)
      fetch(`/api/v1/inventory/welcome-kits/slip?id=${encodeURIComponent(kitIssuanceId)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setSlip(res.data)
          } else {
            setError(res.error?.message || 'Failed to load handover slip')
          }
        })
        .catch((err) => setError(err.message || 'Network error'))
        .finally(() => setLoading(false))
    }
  }, [open, kitIssuanceId, initialSlipData])

  const handlePrint = () => {
    window.print()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      className="print-modal-container"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        className="print-modal-card"
      >
        {/* Top Control Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Student Welcome Kit Handover Slip
              </h3>
              <p style={{ fontSize: '0.75rem', margin: 0, color: '#64748b' }}>
                Official acknowledgment & physical item handover receipt
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!slip || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: !slip || loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <Printer size={15} />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '24px', backgroundColor: '#f1f5f9' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Generating authoritative handover slip...</p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <strong>Failed to load handover slip</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>{error}</p>
              </div>
            </div>
          ) : slip ? (
            /* PRINTABLE SLIP CANVAS */
            <div
              ref={printRef}
              className="print-area"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '32px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                color: '#0f172a',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Slip Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '20px',
                  borderBottom: '2px solid #7c3aed',
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#7c3aed',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}
                  >
                    <Package size={14} />
                    <span>PREONE PRESCHOOL ERP • INVENTORY HANDOVER</span>
                  </div>
                  <h1
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {slip.school.tenantName}
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    {slip.school.branchName}
                    {slip.school.branchAddress ? ` • ${slip.school.branchAddress}` : ''}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#7c3aed',
                      backgroundColor: '#f5f3ff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd6fe',
                      display: 'inline-block',
                    }}
                  >
                    {slip.kitNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                    Issued: {slip.issuedAtFormatted}
                  </div>
                </div>
              </div>

              {/* Kit & Student Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  padding: '18px 0',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                {/* Student Info */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      marginBottom: 6,
                    }}
                  >
                    Student Information
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {slip.student.fullName}
                  </div>
                  <div style={{ color: '#475569', marginTop: 2 }}>
                    <strong>Admission No:</strong> {slip.student.admissionNo}
                  </div>
                  {slip.student.classroomName && (
                    <div style={{ color: '#475569', marginTop: 2 }}>
                      <strong>Classroom:</strong> {slip.student.classroomName}
                    </div>
                  )}
                  {slip.student.guardianName && (
                    <div style={{ color: '#475569', marginTop: 2 }}>
                      <strong>Primary Contact:</strong> {slip.student.guardianName}
                      {slip.student.guardianPhone ? ` (${slip.student.guardianPhone})` : ''}
                    </div>
                  )}
                </div>

                {/* Kit Info */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      marginBottom: 6,
                    }}
                  >
                    Bundle Configuration
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#7c3aed' }}>
                    {slip.bundleName}
                  </div>
                  <div style={{ color: '#475569', marginTop: 2 }}>
                    <strong>Stock Issue #:</strong> {slip.stockIssueNumber}
                  </div>
                  {slip.uniformSize && (
                    <div style={{ color: '#475569', marginTop: 2 }}>
                      <strong>Uniform Size:</strong>{' '}
                      <span
                        style={{
                          fontWeight: 700,
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        Size {slip.uniformSize}
                      </span>
                    </div>
                  )}
                  <div style={{ color: '#475569', marginTop: 2 }}>
                    <strong>Issued By:</strong> {slip.issuer.name}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div style={{ padding: '16px 0' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Itemized Kit Contents</span>
                  <span>Total Items: {slip.totalItemsQuantity}</span>
                </div>

                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>#</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>Item Description</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>Category</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569' }}>SKU</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                        Qty
                      </th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slip.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '10px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0f172a' }}>
                          {item.itemName}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#64748b', fontSize: '0.8rem' }}>
                          {item.category}
                        </td>
                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                          {item.sku}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                          {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                      <td colSpan={4} style={{ padding: '10px 10px', fontWeight: 700, textAlign: 'right' }}>
                        Total Kit Units Delivered:
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed' }}>
                        {slip.totalItemsQuantity}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b' }}>items</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes / Remarks if any */}
              {slip.notes && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    color: '#92400e',
                  }}
                >
                  <strong>Remarks / Handover Notes:</strong> {slip.notes}
                </div>
              )}

              {/* Handover Declaration & Signatures */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px dashed #cbd5e1',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    margin: '0 0 28px 0',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  &ldquo;I acknowledge receipt of the complete Student Welcome Kit in clean and good condition as itemized above.&rdquo;
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '40px',
                  }}
                >
                  {/* Staff Signature */}
                  <div>
                    <div
                      style={{
                        height: '42px',
                        borderBottom: '1px solid #94a3b8',
                        marginBottom: '6px',
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      {slip.issuer.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Issuing Staff Signature & Stamp
                    </div>
                  </div>

                  {/* Parent / Guardian Signature */}
                  <div>
                    <div
                      style={{
                        height: '42px',
                        borderBottom: '1px solid #94a3b8',
                        marginBottom: '6px',
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      {slip.student.guardianName || 'Parent / Guardian'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Parent / Receiver Signature & Date
                    </div>
                  </div>
                </div>
              </div>

              {/* Slip Footer */}
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                }}
              >
                <span>PreOne ERP • Verified Inventory Handover Document</span>
                <span>Ref: {slip.kitIssuanceId}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!slip || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: !slip || loading ? 'not-allowed' : 'pointer',
            }}
          >
            <Printer size={15} />
            <span>Print Official Slip</span>
          </button>
        </div>
      </div>
    </div>
  )
}

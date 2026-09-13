'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Building2,
  GitBranch,
  Sliders,
  Bell,
  FileText,
  ShieldCheck,
  Plus,
  Rocket,
  CheckCircle,
  Clock,
  MapPin,
  Save,
} from 'lucide-react'
import { PageHead, Segmented, Skeleton, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { enumLabel } from '@/lib/format'

interface SchoolProfile {
  id: string
  name: string
  code: string
  tagline: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
  website: string | null
  gstNumber: string | null
  currency: string
  timezone: string
  themeColor: string
  status: string
  subscriptionPlan: string
  counts: {
    students: number
    branches: number
    staff: number
    classrooms: number
  }
}

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  timingOpen: string | null
  timingClose: string | null
  capacity: number | null
  isMain: boolean
  isActive: boolean
}

export default function SettingsPage() {
  const toast = useToast()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState<SchoolProfile | null>(null)
  const [branches, setBranches] = useState<Branch[] | null>(null)
  const [branchOpen, setBranchOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Configuration Domains from Setup Engine
  const [commConfig, setCommConfig] = useState<any>(null)
  const [docConfig, setDocConfig] = useState<any>(null)
  const [brandConfig, setBrandConfig] = useState<any>(null)

  const load = useCallback(async () => {
    const [p, b, c, d, br] = await Promise.all([
      fetch('/api/v1/tenant/profile').then((r) => r.json()),
      fetch('/api/v1/branches').then((r) => r.json()),
      fetch('/api/v1/setup/config/COMMUNICATION').then((r) => r.json()),
      fetch('/api/v1/setup/config/DOCUMENT_TEMPLATES').then((r) => r.json()),
      fetch('/api/v1/setup/config/BRANDING').then((r) => r.json()),
    ])

    if (p.success) setProfile(p.data)
    if (b.success) setBranches(b.data)
    if (c.success) setCommConfig(c.data.data || {})
    if (d.success) setDocConfig(d.data.data || {})
    if (br.success) setBrandConfig(br.data.data || {})
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      tagline: fd.get('tagline'),
      address: fd.get('address'),
      city: fd.get('city'),
      state: fd.get('state'),
      pincode: fd.get('pincode'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      website: fd.get('website'),
      gstNumber: fd.get('gstNumber'),
      timezone: fd.get('timezone'),
      themeColor: fd.get('themeColor'),
    }

    const res = await fetch('/api/v1/tenant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('School profile updated')
      load()
    } else {
      toast.error('Failed to update profile', json.error?.message)
    }
  }

  const createBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        code: fd.get('code'),
        address: fd.get('address'),
        city: fd.get('city'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        timingOpen: fd.get('timingOpen') || '08:30',
        timingClose: fd.get('timingClose') || '16:00',
        capacity: fd.get('capacity') ? parseInt(String(fd.get('capacity'))) : null,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Branch added', `${json.data.name} (${json.data.code})`)
      setBranchOpen(false)
      load()
    } else {
      toast.error('Failed to add branch', json.error?.message)
    }
  }

  const saveConfig = async (domain: string, data: any) => {
    setBusy(true)
    const res = await fetch(`/api/v1/setup/config/${domain}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Configuration saved', `${domain} preferences updated`)
      load()
    } else {
      toast.error('Failed to save config', json.error?.message)
    }
  }

  return (
    <>
      <PageHead
        title="Settings & School Administration"
        sub="Manage school identity, branches, templates, notifications, and compliance settings."
      />

      {/* Guided Setup Link */}
      <a
        href="/app/setup"
        className="card card-hover"
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          color: 'inherit',
          textDecoration: 'none',
          borderColor: 'var(--preone-primary)',
        }}
      >
        <div className="kpi-ic ic-violet"><Rocket size={18} /></div>
        <div style={{ flex: 1 }}>
          <div className="card-title" style={{ fontSize: 13.5 }}>Preschool Setup Engine (10 Configuration Domains)</div>
          <div className="card-sub">Guided dependency engine, validation rules and go-live launch checklist</div>
        </div>
        <span className="badge b-primary">Open Setup</span>
      </a>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'profile', label: 'School Profile' },
          { key: 'branches', label: `Branches (${branches?.length ?? 0})` },
          { key: 'notifications', label: 'Notifications' },
          { key: 'templates', label: 'Document Templates' },
          { key: 'security', label: 'Security & DPDP' },
        ]}
      />

      {/* TAB 1: School Profile */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 840 }}>
          {profile ? (
            <form onSubmit={updateProfile} className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">School Identity & Profile</div>
                  <div className="card-sub">School name, registration codes, contact and address shown on receipts and reports</div>
                </div>
                <Building2 size={20} style={{ color: 'var(--primary)' }} />
              </div>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <div className="field">
                  <label>Preschool Name <span className="req">*</span></label>
                  <input className="input" name="name" defaultValue={profile.name} required />
                </div>
                <div className="field">
                  <label>School Code</label>
                  <input className="input" value={profile.code} disabled title="Assigned by Platform Admin" />
                </div>
                <div className="field" style={{ gridColumn: '1/-1' }}>
                  <label>Tagline / Motto</label>
                  <input className="input" name="tagline" defaultValue={profile.tagline || ''} placeholder="e.g. Joyful Early Learning & Discovery" />
                </div>
                <div className="field">
                  <label>Official Email</label>
                  <input className="input" name="email" type="email" defaultValue={profile.email || ''} />
                </div>
                <div className="field">
                  <label>Primary Phone</label>
                  <input className="input" name="phone" defaultValue={profile.phone || ''} />
                </div>
                <div className="field" style={{ gridColumn: '1/-1' }}>
                  <label>Campus Address</label>
                  <input className="input" name="address" defaultValue={profile.address || ''} />
                </div>
                <div className="field">
                  <label>City</label>
                  <input className="input" name="city" defaultValue={profile.city || ''} />
                </div>
                <div className="field">
                  <label>State</label>
                  <input className="input" name="state" defaultValue={profile.state || ''} />
                </div>
                <div className="field">
                  <label>Pincode</label>
                  <input className="input" name="pincode" defaultValue={profile.pincode || ''} />
                </div>
                <div className="field">
                  <label>GSTIN / Tax ID</label>
                  <input className="input" name="gstNumber" defaultValue={profile.gstNumber || ''} placeholder="27ABCDE1234F1Z5" />
                </div>
                <div className="field">
                  <label>Timezone</label>
                  <select className="select" name="timezone" defaultValue={profile.timezone || 'Asia/Kolkata'}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="field">
                  <label>Brand Theme Color</label>
                  <input className="input" name="themeColor" type="color" defaultValue={profile.themeColor || '#4F46E5'} style={{ height: 40 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="card"><Skeleton h={220} /></div>
          )}
        </div>
      )}

      {/* TAB 2: Branches */}
      {tab === 'branches' && (
        <div className="dtable-wrap">
          <div className="table-toolbar">
            <div className="card-title">School Branches & Campuses</div>
            <button className="btn btn-primary btn-sm" onClick={() => setBranchOpen(true)}>
              <Plus size={14} /> Add Branch
            </button>
          </div>
          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Operating Timings</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches?.map((b) => (
                  <tr key={b.id} style={{ cursor: 'default' }}>
                    <td>
                      <span className="cell-strong">{b.name}</span>
                      {b.isMain && <span className="badge b-primary" style={{ marginLeft: 6, fontSize: 10 }}>HEAD OFFICE</span>}
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.code}</span></td>
                    <td>{b.city || b.address || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Clock size={12} style={{ color: 'var(--muted)' }} />
                        {b.timingOpen || '08:30'} – {b.timingClose || '16:00'}
                      </div>
                    </td>
                    <td>{b.capacity ? `${b.capacity} children` : 'Flexible'}</td>
                    <td><StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {branches === null && <div style={{ padding: 16 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} h={36} />)}</div>}
          </div>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {tab === 'notifications' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Notification & Dispatch Channels</div>
              <div className="card-sub">Channels used for daily timelines, fee reminders, and urgent broadcasts</div>
            </div>
            <Bell size={20} style={{ color: 'var(--primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>In-App Push & Child Timelines</b>
                <div className="t-caption">Direct dispatch to parent app and web portal</div>
              </div>
              <span className="badge b-success"><CheckCircle size={12} /> ACTIVE</span>
            </div>

            <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>WhatsApp Business API</b>
                <div className="t-caption">Official template messaging for emergency notices and payment links</div>
              </div>
              <span className="badge b-neutral">CONFIGURED VIA GATEWAY</span>
            </div>

            <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>Transactional SMS (DLT Approved)</b>
                <div className="t-caption">High-priority OTPs and gate pickup verification alerts</div>
              </div>
              <span className="badge b-neutral">TELCO DLT READY</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Document Templates */}
      {tab === 'templates' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Official Document Templates</div>
              <div className="card-sub">Standard preschool templates automatically formatted with school branding and signatures</div>
            </div>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
            {[
              { title: 'Payment Receipt', type: 'RECEIPT', status: 'DEFAULT APPLIED' },
              { title: 'Student ID Card', type: 'ID_CARD', status: 'BARCODE VERIFIED' },
              { title: 'Admission Form', type: 'ADMISSION_FORM', status: 'STANDARD 4-STEP' },
              { title: 'Bonafide Certificate', type: 'CERTIFICATE', status: 'READY' },
              { title: 'Development Report', type: 'REPORT_CARD', status: 'EYFS ALIGNED' },
              { title: 'Medical Consent', type: 'CONSENT_FORM', status: 'READY' },
            ].map((tmpl, idx) => (
              <div key={idx} style={{ padding: 14, border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{tmpl.title}</div>
                <div className="t-caption" style={{ marginTop: 2 }}>{tmpl.type}</div>
                <div style={{ marginTop: 10 }}>
                  <span className="badge b-success" style={{ fontSize: 10 }}>{tmpl.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Security & Compliance */}
      {tab === 'security' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Security, RBAC & DPDP Compliance</div>
              <div className="card-sub">Digital Personal Data Protection (DPDP) Act 2023 posture & audit controls</div>
            </div>
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div className="stat-mini">
              <b style={{ fontSize: 14 }}>Multi-Tenant Row Scoping</b>
              <span>Every entity isolated by tenantId</span>
            </div>
            <div className="stat-mini">
              <b style={{ fontSize: 14 }}>Role-Based Access Control</b>
              <span>8 granular roles with principle of least privilege</span>
            </div>
            <div className="stat-mini">
              <b style={{ fontSize: 14 }}>DPDP Minor Consent</b>
              <span>Digital parental consent logged on every admission</span>
            </div>
            <div className="stat-mini">
              <b style={{ fontSize: 14 }}>Tamper-Evident Audit</b>
              <span>Immutable audit logs recording IP, user agent, before/after values</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title="Add Campus Branch"
        subtitle="Create a new physical preschool branch"
        icon={<GitBranch size={22} />}
        wide
      >
        <form onSubmit={createBranch}>
          <div className="form-grid">
            <div className="field">
              <label>Branch Name <span className="req">*</span></label>
              <input className="input" name="name" required placeholder="e.g. PreOne Koramangala" />
            </div>
            <div className="field">
              <label>Branch Code <span className="req">*</span></label>
              <input className="input" name="code" required placeholder="KRM" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <label>Street Address</label>
              <input className="input" name="address" placeholder="8th Block, 80 Feet Road" />
            </div>
            <div className="field">
              <label>City</label>
              <input className="input" name="city" placeholder="Bengaluru" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" name="phone" placeholder="+91 98765 43210" />
            </div>
            <div className="field">
              <label>Opening Time</label>
              <input className="input" name="timingOpen" type="time" defaultValue="08:30" />
            </div>
            <div className="field">
              <label>Closing Time</label>
              <input className="input" name="timingClose" type="time" defaultValue="16:00" />
            </div>
            <div className="field">
              <label>Capacity</label>
              <input className="input" name="capacity" type="number" placeholder="60" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBranchOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Branch</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

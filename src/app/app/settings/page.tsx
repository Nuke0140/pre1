'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Building2, School, Users, Plus, GraduationCap } from 'lucide-react'
import { PageHead, Avatar, Segmented, Skeleton, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { enumLabel, timeAgo, inr } from '@/lib/format'

interface ClassInfo { id: string; name: string; programType: string; capacity: number; teacher: string | null; students: number }
interface Staff { id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null }
interface FeePlan { id: string; name: string; programType: string; totalAnnualCents: number; installmentCount: number; items: { label: string; amountCents: number }[] }

export default function SettingsPage() {
  const toast = useToast()
  const [tab, setTab] = useState('school')
  const [classrooms, setClassrooms] = useState<ClassInfo[] | null>(null)
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [plans, setPlans] = useState<FeePlan[] | null>(null)
  const [classOpen, setClassOpen] = useState(false)
  const [staffOpen, setStaffOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [c, u, f] = await Promise.all([
      fetch('/api/v1/classrooms').then((r) => r.json()),
      fetch('/api/v1/users').then((r) => r.json()),
      fetch('/api/v1/fee-plans').then((r) => r.json()),
    ])
    if (c.success) setClassrooms(c.data)
    if (u.success) setStaff(u.data)
    if (f.success) setPlans(f.data)
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const createClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fd.get('name'), programType: fd.get('programType'), capacity: parseInt(String(fd.get('capacity')) || '20') }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Classroom created')
      setClassOpen(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const createStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fd.get('fullName'), email: fd.get('email'),
        password: fd.get('password'), role: fd.get('role'), phone: fd.get('phone'),
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Staff member added', 'They can sign in immediately')
      setStaffOpen(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  return (
    <>
      <PageHead title="Settings" sub="School setup — classes, staff aur fee plans." />

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'school', label: 'School' },
          { key: 'classes', label: `Classrooms (${classrooms?.length ?? 0})` },
          { key: 'staff', label: `Staff (${staff?.length ?? 0})` },
          { key: 'fees', label: `Fee Plans (${plans?.length ?? 0})` },
        ]}
      />

      {tab === 'school' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-head">
            <div>
              <div className="card-title">School Profile</div>
              <div className="card-sub">Onboarding wizard se set hua — Platform admin isse manage karta hai</div>
            </div>
            <Building2 size={18} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div className="form-grid">
            <div className="stat-mini"><b style={{ fontSize: 14 }}>Multi-tenant</b><span>Isolated by tenantId on every table</span></div>
            <div className="stat-mini"><b style={{ fontSize: 14 }}>PostgreSQL</b><span>Shared DB + row scoping (ADR-002)</span></div>
            <div className="stat-mini"><b style={{ fontSize: 14 }}>RBAC</b><span>8 roles · least privilege</span></div>
            <div className="stat-mini"><b style={{ fontSize: 14 }}>DPDP Ready</b><span>Soft delete + audit trail</span></div>
          </div>
        </div>
      )}

      {tab === 'classes' && (
        <div className="dtable-wrap">
          <div className="table-toolbar">
            <div className="card-title">Classrooms</div>
            <button className="btn btn-primary btn-sm" onClick={() => setClassOpen(true)}><Plus size={14} /> Add Classroom</button>
          </div>
          <div className="dtable-scroll">
            <table className="dtable">
              <thead><tr><th>Classroom</th><th>Program</th><th>Teacher</th><th>Strength</th><th>Capacity</th></tr></thead>
              <tbody>
                {classrooms?.map((c) => (
                  <tr key={c.id} style={{ cursor: 'default' }}>
                    <td className="cell-strong">{c.name}</td>
                    <td><span className="badge b-pink">{enumLabel(c.programType)}</span></td>
                    <td>{c.teacher || <span className="t-caption">Unassigned</span>}</td>
                    <td>{c.students}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progressbar" style={{ width: 80, height: 5 }}>
                          <i style={{ width: `${Math.min(100, Math.round((c.students / Math.max(1, c.capacity)) * 100))}%` }} />
                        </div>
                        <span className="t-caption">{c.capacity}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {classrooms === null && <div style={{ padding: 16 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} h={36} />)}</div>}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="dtable-wrap">
          <div className="table-toolbar">
            <div className="card-title">Staff & Roles</div>
            <button className="btn btn-primary btn-sm" onClick={() => setStaffOpen(true)}><Plus size={14} /> Add Staff</button>
          </div>
          <div className="dtable-scroll">
            <table className="dtable">
              <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Last Login</th></tr></thead>
              <tbody>
                {staff?.map((s) => (
                  <tr key={s.id} style={{ cursor: 'default' }}>
                    <td>
                      <span className="cell-user">
                        <Avatar name={s.name} />
                        <span>
                          <span className="cell-strong">{s.name}</span>
                          <span className="cell-sub">{s.email}</span>
                        </span>
                      </span>
                    </td>
                    <td><span className="badge b-primary">{enumLabel(s.role)}</span></td>
                    <td><span className={`badge ${s.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{enumLabel(s.status)}</span></td>
                    <td>{s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff === null && <div style={{ padding: 16 }}>{[...Array(3)].map((_, i) => <Skeleton key={i} h={36} />)}</div>}
          </div>
        </div>
      )}

      {tab === 'fees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {plans?.map((p) => (
            <div className="card card-hover" key={p.id}>
              <div className="card-head">
                <div>
                  <div className="card-title">{p.name}</div>
                  <div className="card-sub">{enumLabel(p.programType)} · {p.installmentCount} installments</div>
                </div>
                <GraduationCap size={18} style={{ color: 'var(--preone-primary)' }} />
              </div>
              <div className="t-kpi" style={{ fontSize: 24 }}>{inr(p.totalAnnualCents, { compact: true })}<span className="unit">/year</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {p.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--foreground-secondary)' }}>{it.label}</span>
                    <b>{inr(it.amountCents)}</b>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {plans === null && [...Array(3)].map((_, i) => <div className="card" key={i}><Skeleton h={140} /></div>)}
        </div>
      )}

      {/* Classroom modal */}
      <Modal open={classOpen} onClose={() => setClassOpen(false)} title="Add Classroom" subtitle="Program-wise classroom with capacity" icon={<School size={22} />}>
        <form onSubmit={createClass}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Name <span className="req">*</span></label>
            <input className="input" name="name" required placeholder="Nursery A" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Program</label>
              <select className="select" name="programType" defaultValue="NURSERY">
                {['PLAYGROUP','NURSERY','LKG','UKG','DAYCARE'].map((p) => <option key={p} value={p}>{enumLabel(p)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Capacity</label>
              <input className="input" name="capacity" type="number" min="1" defaultValue="20" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setClassOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create</button>
          </div>
        </form>
      </Modal>

      {/* Staff modal */}
      <Modal open={staffOpen} onClose={() => setStaffOpen(false)} title="Add Staff" subtitle="Account + role assignment (immediate access)" icon={<Users size={22} />} wide>
        <form onSubmit={createStaff}>
          <div className="form-grid">
            <div className="field"><label>Full Name <span className="req">*</span></label><input className="input" name="fullName" required /></div>
            <div className="field"><label>Email <span className="req">*</span></label><input className="input" name="email" type="email" required /></div>
            <div className="field"><label>Phone</label><input className="input" name="phone" /></div>
            <div className="field"><label>Temp Password <span className="req">*</span></label><input className="input" name="password" required minLength={6} defaultValue="Welcome@123" /></div>
            <div className="field">
              <label>Role <span className="req">*</span></label>
              <select className="select" name="role" defaultValue="TEACHER">
                {['PRINCIPAL','COORDINATOR','TEACHER','ACCOUNTS','RECEPTION'].map((r) => (
                  <option key={r} value={r}>{enumLabel(r)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStaffOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Add Staff</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

'use client'

import React, { useState } from 'react'
import { Briefcase, Building, Mail, Phone, User, Shield, Check, Key } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { Role, BranchOption, ClassroomOption, CANONICAL_STAFF_ROLES, ROLE_BADGE } from './types'

interface AddStaffModalProps {
  open: boolean
  onClose: () => void
  branches: BranchOption[]
  classrooms: ClassroomOption[]
  onSuccess: () => void
}

export function AddStaffModal({ open, onClose, branches, classrooms, onSuccess }: AddStaffModalProps) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('TEACHER')
  const [branchId, setBranchId] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('Academics')
  const [employmentType, setEmploymentType] = useState('REGULAR')
  const [qualification, setQualification] = useState('')
  const [classroomId, setClassroomId] = useState('')

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setUsername('')
    setPassword('')
    setRole('TEACHER')
    setBranchId(branches[0]?.id || '')
    setEmployeeCode('')
    setDesignation('')
    setDepartment('Academics')
    setEmploymentType('REGULAR')
    setQualification('')
    setClassroomId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !email.trim()) {
      toast.error('Validation Error', 'Name and email are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          role,
          primaryRole: role,
          roles: [role],
          branchId: branchId || undefined,
          employeeCode: employeeCode.trim() || undefined,
          designation: designation.trim() || undefined,
          department: department.trim() || undefined,
          employmentType,
          qualification: qualification.trim() || undefined,
          classroomId: role === 'TEACHER' && classroomId ? classroomId : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create staff account')
      }

      toast.success(
        'Staff Member Created',
        `${fullName} has been registered as ${role}. Username: ${json.data?.username || 'Auto-generated'}`
      )
      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Creation Failed', err.message || 'Error occurred while saving staff user')
    } finally {
      setSubmitting(false)
    }
  }

  const modalFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
        <span
          className="badge b-primary"
          style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 600, gap: 6 }}
        >
          <Briefcase style={{ width: 13, height: 13 }} />
          Campus Workforce Member
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'auto', marginLeft: 'auto' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-staff-form"
          className="btn btn-primary btn-sm"
          disabled={submitting}
        >
          {submitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
              Creating Staff Account...
            </span>
          ) : (
            'Create Staff Member'
          )}
        </button>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Preschool Staff User"
      subtitle="Create an authorized workforce account for teachers, administration, and campus operations"
      icon={<Briefcase style={{ width: 20, height: 20 }} />}
      iconClass="ic-purple"
      wide
      footer={modalFooter}
    >
      <form id="add-staff-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} autoComplete="off">
        {/* Section 1: Identity & Access */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              1
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Identity & Access
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label>
                Full Name <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <User style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="field">
              <label>
                Work Email <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <Mail style={{ width: 16, height: 16 }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@preschool.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="field">
              <label>Mobile Phone</label>
              <div className="input-icon-wrap">
                <Phone style={{ width: 16, height: 16 }} />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="field">
              <label>
                Username <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional, auto-generated if blank)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. priya.sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Role & Campus Placement */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              2
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Role & Placement
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label>
                Staff Role <span className="req">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="select"
              >
                {CANONICAL_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGE[r]?.label || r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Campus Branch</label>
              <div className="input-icon-wrap">
                <Building style={{ width: 16, height: 16 }} />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="select"
                  style={{ paddingLeft: 38 }}
                >
                  <option value="">All Branches / Central</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Teacher Specific Primary Classroom Allocation */}
          {role === 'TEACHER' && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--preone-primary-soft)',
                border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              }}
            >
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                Assigned Primary Classroom
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="select"
                style={{ background: 'var(--bg-card)' }}
              >
                <option value="">No specific classroom / Floater Teacher</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.35 }}>
                Teachers receive daily attendance and activity permissions for their assigned classroom.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Professional Details & Credentials */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              3
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Professional Profile
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label>Employee Code / ID</label>
              <input
                type="text"
                placeholder="e.g. EMP-1042"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="input font-mono"
              />
            </div>

            <div className="field">
              <label>Highest Qualification</label>
              <input
                type="text"
                placeholder="e.g. B.Ed, Early Childhood Dip."
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label>Job Designation / Title</label>
              <input
                type="text"
                placeholder="e.g. Lead Montessori Guide"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="select"
              >
                <option value="Academics">Academics</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Transport">Transport</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            <div className="field">
              <label>Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="select"
              >
                <option value="REGULAR">Regular / Permanent</option>
                <option value="PROBATION">Probationary</option>
                <option value="CONTRACT">Contractual</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>

            <div className="field">
              <label>
                Initial Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div className="input-icon-wrap">
                <Key style={{ width: 16, height: 16 }} />
                <input
                  type="password"
                  placeholder="Leave blank for invite email"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input font-mono"
                  style={{ paddingLeft: 38 }}
                  autoComplete="new-password"
                  data-lpignore="true"
                />
              </div>
              <span className="helper">Leave blank to send an email invitation with password setup link.</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}


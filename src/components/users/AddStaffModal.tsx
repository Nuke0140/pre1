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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Preschool Staff User"
      subtitle="Create an authorized workforce account for teachers, administration, and campus operations"
      icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
      iconClass="ic-purple"
      wide
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-staff-form"
            className="btn btn-primary text-xs"
            disabled={submitting}
          >
            {submitting ? 'Creating Staff Account...' : 'Create Staff Member'}
          </button>
        </div>
      }
    >
      <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identity & Access</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative input-icon-wrap">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  className="input w-full text-sm"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <div className="relative input-icon-wrap">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@preschool.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  className="input w-full text-sm"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Phone
              </label>
              <div className="relative input-icon-wrap">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  className="input w-full text-sm"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-gray-400 font-normal">(Optional, auto-generated if blank)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. priya.sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full text-sm font-mono"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Role & Campus Placement */}
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & Placement</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Staff Role <span className="text-red-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="select w-full text-sm"
              >
                {CANONICAL_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGE[r]?.label || r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campus Branch
              </label>
              <div className="relative input-icon-wrap">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  className="select w-full text-sm"
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

          {/* Teacher Specific Classroom Allocation */}
          {role === 'TEACHER' && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg">
              <label className="block text-xs font-medium text-indigo-950 dark:text-indigo-200 mb-1">
                Assigned Primary Classroom
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="select w-full text-sm bg-white dark:bg-gray-900"
              >
                <option value="">No specific classroom / Floater Teacher</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                Teachers receive daily attendance and activity permissions for their assigned classroom.
              </p>
            </div>
          )}
        </div>

        {/* Professional Details & Credentials */}
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professional Profile</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee Code / ID
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-1042"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="input w-full text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Highest Qualification
              </label>
              <input
                type="text"
                placeholder="e.g. B.Ed, Early Childhood Dip."
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Designation / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Montessori Guide"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="select w-full text-sm"
              >
                <option value="Academics">Academics</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Transport">Transport</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="select w-full text-sm"
              >
                <option value="REGULAR">Regular / Permanent</option>
                <option value="PROBATION">Probationary</option>
                <option value="CONTRACT">Contractual</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Password <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative input-icon-wrap">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Leave blank for invite email"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  className="input w-full text-sm font-mono"
                  autoComplete="new-password"
                  data-lpignore="true"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

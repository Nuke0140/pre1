'use client'

import React, { useEffect, useState } from 'react'
import { Pencil, Shield, Lock, Briefcase, Heart, DollarSign } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Field } from '@/components/preone/ui'
import type { BranchOption } from './types'

interface EditStaffModalProps {
  open: boolean
  onClose: () => void
  staff: any | null
  branches: BranchOption[]
  onSave: (payload: any) => Promise<void>
  loading?: boolean
}

function toDateInput(val: any): string {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function EditStaffModal({
  open,
  onClose,
  staff,
  branches,
  onSave,
  loading,
}: EditStaffModalProps) {
  const [activeTab, setActiveTab] = useState<'employment' | 'personal' | 'statutory' | 'salary'>('employment')
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    if (staff) {
      setForm({
        id: staff.id,
        fullName: staff.name || staff.user?.fullName || '',
        phone: staff.phone || staff.user?.phone || '',
        branchId: staff.branchId || '',
        // Employment
        designation: staff.designation || '',
        department: staff.department || 'Academics',
        qualification: staff.qualification || '',
        employmentType: staff.employmentType || 'REGULAR',
        joiningDate: toDateInput(staff.joiningDate),
        noticePeriodDays: staff.noticePeriodDays ?? 30,
        probationEndDate: toDateInput(staff.probationEndDate),
        confirmationDate: toDateInput(staff.confirmationDate),
        // Personal
        dateOfBirth: toDateInput(staff.dateOfBirth),
        gender: staff.gender || '',
        maritalStatus: staff.maritalStatus || '',
        bloodGroup: staff.bloodGroup || '',
        emergencyContactName: staff.emergencyContactName || '',
        emergencyContactPhone: staff.emergencyContactPhone || '',
        currentAddress: staff.currentAddress || '',
        permanentAddress: staff.permanentAddress || '',
        // Statutory
        panNumber: staff.panNumber || '',
        aadhaarNumber: staff.aadhaarNumber || '',
        uanNumber: staff.uanNumber || '',
        esiNumber: staff.esiNumber || '',
        // Salary
        basicSalary: staff.salaryStructure?.basicSalary || staff.basicSalary || 20000,
        hra: staff.salaryStructure?.hra || staff.hra || 8000,
        specialAllowance: staff.salaryStructure?.specialAllowance || staff.specialAllowance || 4000,
      })
    }
  }, [staff])

  if (!form) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Employee — ${form.fullName}`}
      subtitle="Update employment details, personal KYC, statutory identifiers, and compensation"
      icon={<Pencil size={18} />}
      wide
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-muted-foreground text-xs flex items-center gap-1.5">
            <Lock size={12} />
            <span>Statutory identifiers and addresses are encrypted at rest</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || !form.fullName}
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs */}
        <div className="seg flex flex-wrap gap-1 border-b border-border/60 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'employment' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Briefcase size={14} /> Employment & Campus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'personal' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Heart size={14} /> Personal & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statutory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'statutory' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Shield size={14} /> Statutory & KYC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'salary' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <DollarSign size={14} /> Compensation
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: EMPLOYMENT */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Full Name" required>
                  <input
                    className="input text-xs w-full"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="input text-xs w-full"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Branch / Campus">
                  <select
                    className="select text-xs w-full"
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  >
                    <option value="">Main Campus (Default)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Designation">
                  <input
                    className="input text-xs w-full"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </Field>
                <Field label="Department">
                  <select
                    className="select text-xs w-full"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Transport">Transport</option>
                  </select>
                </Field>
                <Field label="Employment Type">
                  <select
                    className="select text-xs w-full"
                    value={form.employmentType}
                    onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  >
                    <option value="REGULAR">Regular (Full-time)</option>
                    <option value="PROBATION">Probation</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Qualification">
                  <input
                    className="input text-xs w-full"
                    value={form.qualification}
                    placeholder="e.g., M.Sc, B.Ed, ECCE"
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  />
                </Field>
                <Field label="Joining Date">
                  <input
                    type="date"
                    className="input text-xs w-full"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  />
                </Field>
                <Field label="Notice Period (Days)">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    className="input text-xs w-full"
                    value={form.noticePeriodDays}
                    onChange={(e) => setForm({ ...form, noticePeriodDays: parseInt(e.target.value, 10) || 0 })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Probation End Date">
                  <input
                    type="date"
                    className="input text-xs w-full"
                    value={form.probationEndDate}
                    onChange={(e) => setForm({ ...form, probationEndDate: e.target.value })}
                  />
                </Field>
                <Field label="Confirmation Date">
                  <input
                    type="date"
                    className="input text-xs w-full"
                    value={form.confirmationDate}
                    onChange={(e) => setForm({ ...form, confirmationDate: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & ADDRESS */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Field label="Date of Birth">
                  <input
                    type="date"
                    className="input text-xs w-full"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className="select text-xs w-full"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Marital Status">
                  <select
                    className="select text-xs w-full"
                    value={form.maritalStatus}
                    onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select
                    className="select text-xs w-full"
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Emergency Contact Name">
                  <input
                    className="input text-xs w-full"
                    value={form.emergencyContactName}
                    placeholder="e.g., Jane Doe (Spouse)"
                    onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  />
                </Field>
                <Field label="Emergency Contact Phone">
                  <input
                    className="input text-xs w-full"
                    value={form.emergencyContactPhone}
                    placeholder="10-digit mobile"
                    onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Current Address (Encrypted)">
                  <textarea
                    rows={2}
                    className="textarea text-xs w-full"
                    value={form.currentAddress}
                    placeholder="Current residential address"
                    onChange={(e) => setForm({ ...form, currentAddress: e.target.value })}
                  />
                </Field>
                <Field label="Permanent Address (Encrypted)">
                  <textarea
                    rows={2}
                    className="textarea text-xs w-full"
                    value={form.permanentAddress}
                    placeholder="Permanent residential address"
                    onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 3: STATUTORY & KYC */}
          {activeTab === 'statutory' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
                <Shield size={16} className="text-primary shrink-0" />
                <span>
                  All statutory IDs are strictly validated and encrypted at rest with tenant-isolated AES-256-GCM.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="PAN Number (10 alphanumeric)">
                  <input
                    className="input text-xs w-full font-mono uppercase"
                    value={form.panNumber}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Aadhaar Number (12 digits)">
                  <input
                    className="input text-xs w-full font-mono"
                    value={form.aadhaarNumber}
                    placeholder="12 digit Aadhaar number"
                    maxLength={14}
                    onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Universal Account Number (UAN - 12 digits)">
                  <input
                    className="input text-xs w-full font-mono"
                    value={form.uanNumber}
                    placeholder="12 digit UAN"
                    maxLength={12}
                    onChange={(e) => setForm({ ...form, uanNumber: e.target.value })}
                  />
                </Field>
                <Field label="ESI Number (17 digits)">
                  <input
                    className="input text-xs w-full font-mono"
                    value={form.esiNumber}
                    placeholder="17 digit ESI number"
                    maxLength={17}
                    onChange={(e) => setForm({ ...form, esiNumber: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b border-border/60 pb-1 mb-2.5">
                Salary Structure (Monthly Base)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Basic Salary (₹)" required>
                  <input
                    type="number"
                    className="input text-xs w-full font-mono"
                    value={form.basicSalary}
                    onChange={(e) => setForm({ ...form, basicSalary: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="HRA (₹)">
                  <input
                    type="number"
                    className="input text-xs w-full font-mono"
                    value={form.hra}
                    onChange={(e) => setForm({ ...form, hra: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Special Allowance (₹)">
                  <input
                    type="number"
                    className="input text-xs w-full font-mono"
                    value={form.specialAllowance}
                    onChange={(e) => setForm({ ...form, specialAllowance: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}

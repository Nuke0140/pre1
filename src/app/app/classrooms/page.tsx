'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  LayoutGrid, Plus, FileSpreadsheet, Building2, Blocks,
  GraduationCap, Users, RefreshCw, Search, ShieldCheck
} from 'lucide-react'
import { PageHead, KpiTile, EmptyState, GlobalFilterToolbar, GlobalModuleNavigation, getClassroomsNavConfig } from '@/components/preone'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'
import { SpreadsheetImportWorkspace } from '@/components/importers/SpreadsheetImportWorkspace'
import { Modal } from '@/components/preone/Modal'

export default function ClassroomsPage() {
  const toast = useToast()
  const { t } = useI18n()

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'IMPORT'>('DIRECTORY')
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('ALL')
  const [selectedProgram, setSelectedProgram] = useState('ALL')
  const [search, setSearch] = useState('')

  // Create Classroom Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formProgramType, setFormProgramType] = useState('NURSERY')
  const [formCapacity, setFormCapacity] = useState('20')
  const [formBranchId, setFormBranchId] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, bRes, pRes] = await Promise.all([
        fetch('/api/v1/classrooms').then((r) => r.json()),
        fetch('/api/v1/branches').then((r) => r.json()),
        fetch('/api/v1/programs').then((r) => r.json()),
      ])

      if (cRes.success && Array.isArray(cRes.data)) setClassrooms(cRes.data)
      if (bRes.success && Array.isArray(bRes.data)) {
        setBranches(bRes.data)
        if (bRes.data.length > 0 && !formBranchId) {
          setFormBranchId(bRes.data[0].id)
        }
      }
      if (pRes.success && Array.isArray(pRes.data)) setPrograms(pRes.data)
    } catch (e: any) {
      toast.error('Failed to load classrooms', e.message)
    } finally {
      setLoading(false)
    }
  }, [formBranchId, toast])

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Name Required', 'Please enter a classroom name')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/v1/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          programType: formProgramType,
          capacity: parseInt(formCapacity, 10) || 20,
          branchId: formBranchId || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || json.error || 'Failed to create classroom')

      toast.success('Classroom Created', `${formName} has been created successfully.`)
      setCreateModalOpen(false)
      setFormName('')
      loadData()
    } catch (err: any) {
      toast.error('Creation Failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      if (selectedBranch !== 'ALL' && c.branchId !== selectedBranch) return false
      if (selectedProgram !== 'ALL' && c.programType !== selectedProgram) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const mName = String(c.name || '').toLowerCase().includes(q)
        const mCode = String(c.code || '').toLowerCase().includes(q)
        const mBranch = String(c.branchName || '').toLowerCase().includes(q)
        const mTeacher = String(c.teacher || '').toLowerCase().includes(q)
        if (!mName && !mCode && !mBranch && !mTeacher) return false
      }
      return true
    })
  }, [classrooms, selectedBranch, selectedProgram, search])

  const totalCapacity = classrooms.reduce((acc, c) => acc + (c.capacity || 0), 0)
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.students || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home'), href: '/app' },
          { label: 'Classrooms' },
        ]}
      />

      {/* Page Header */}
      <PageHead
        title="Classrooms & Learning Spaces"
        sub="Manage preschool class-sections, room capacities, assigned guides, and bulk spreadsheet migrations."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'IMPORT' ? 'DIRECTORY' : 'IMPORT')}
              className={`btn text-xs flex items-center gap-1.5 py-1.5 px-3 font-semibold shadow-xs ${
                activeTab === 'IMPORT'
                  ? 'btn-secondary text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200'
                  : 'btn-secondary'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
              <span>{activeTab === 'IMPORT' ? 'View Directory' : 'Import via Spreadsheet'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3.5 font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Classroom</span>
            </button>
          </div>
        }
      />

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile
          label="Total Classrooms"
          value={classrooms.length}
          icon={<LayoutGrid className="w-4 h-4 text-purple-600" />}
          iconClass="ic-purple"
          variant="compact"
        />
        <KpiTile
          label="Active Campuses"
          value={branches.length}
          icon={<Building2 className="w-4 h-4 text-blue-600" />}
          iconClass="ic-blue"
          variant="compact"
        />
        <KpiTile
          label="Total Student Capacity"
          value={totalCapacity}
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          iconClass="ic-green"
          variant="compact"
        />
        <KpiTile
          label="Enrolled Students"
          value={totalStudents}
          icon={<GraduationCap className="w-4 h-4 text-amber-600" />}
          iconClass="ic-orange"
          variant="compact"
        />
      </div>

      {/* Tabs Navigation */}
      <GlobalModuleNavigation
        items={getClassroomsNavConfig({ classrooms: classrooms.length })}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as 'DIRECTORY' | 'IMPORT')}
        ariaLabel="Classrooms Section Navigation"
      />

      {/* TAB 1: DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* ── Standardized Global Filter Toolbar ── */}
          <GlobalFilterToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: 'Search classroom by name, code, campus or teacher...',
              shortcut: '/',
            }}
            filters={[
              {
                id: 'branch',
                label: 'Campus',
                type: 'branch',
                value: selectedBranch,
                defaultValue: 'ALL',
                placeholder: 'All Campuses',
                options: [
                  { value: 'ALL', label: 'All Campuses' },
                  ...branches.map((b) => ({
                    value: b.id,
                    label: b.name,
                    isMain: b.isMain,
                  })),
                ],
                onChange: setSelectedBranch,
              },
              {
                id: 'program',
                label: 'Program',
                type: 'select',
                value: selectedProgram,
                defaultValue: 'ALL',
                placeholder: 'All Programs',
                options: [
                  { value: 'ALL', label: 'All Programs' },
                  { value: 'PLAYGROUP', label: 'Playgroup' },
                  { value: 'NURSERY', label: 'NURSERY' },
                  { value: 'LKG', label: 'Junior KG (LKG)' },
                  { value: 'UKG', label: 'Senior KG (UKG)' },
                  { value: 'DAYCARE', label: 'Daycare' },
                ],
                onChange: setSelectedProgram,
              },
            ]}
            refresh={{
              onRefresh: loadData,
              refreshing: loading,
              label: 'Refresh Classrooms',
            }}
            onReset={() => {
              setSearch('')
              setSelectedBranch('ALL')
              setSelectedProgram('ALL')
            }}
            extraActions={
              <div className="text-xs text-muted-foreground font-mono hidden sm:block">
                {filteredClassrooms.length} classrooms
              </div>
            }
          />

          {/* Classrooms Grid / Table */}
          {filteredClassrooms.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-card">
              <LayoutGrid className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">No classrooms match criteria</h4>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your campus or program filters, or import your classrooms via spreadsheet.</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('IMPORT')}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  <span>Import via Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="btn btn-primary text-xs"
                >
                  + Add Classroom
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Classroom Name</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Code</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Program Type</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Campus Branch</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Primary Teacher</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white text-center">Enrolled / Capacity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                    {filteredClassrooms.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-purple-700 dark:text-purple-400">
                          {c.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge b-primary text-[10px] font-semibold">
                            {c.programType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {c.branchName}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {c.teacher ? (
                            <span className="font-medium text-gray-900 dark:text-white">{c.teacher}</span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          <span className={c.students >= c.capacity ? 'text-amber-600' : 'text-emerald-600'}>
                            {c.students || 0}
                          </span>
                          <span className="text-gray-400 font-normal"> / {c.capacity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORT VIA SPREADSHEET */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-4">
          <SpreadsheetImportWorkspace
            module="CLASSROOMS"
            onSuccess={() => {
              loadData()
              setActiveTab('DIRECTORY')
            }}
          />
        </div>
      )}

      {/* CREATE CLASSROOM MODAL */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Preschool Classroom"
        subtitle="Create a new class section for this operating academic year"
        icon={<LayoutGrid className="w-5 h-5 text-purple-600" />}
      >
        <form onSubmit={handleCreateClassroom} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Classroom Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nursery A (Sunflowers)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input w-full p-2.5 text-xs rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Program Type *
              </label>
              <select
                value={formProgramType}
                onChange={(e) => setFormProgramType(e.target.value)}
                className="select w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <option value="PLAYGROUP">Playgroup</option>
                <option value="NURSERY">Nursery</option>
                <option value="LKG">Junior KG (LKG)</option>
                <option value="UKG">Senior KG (UKG)</option>
                <option value="DAYCARE">Daycare</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Capacity (Students)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                className="input w-full p-2 text-xs rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Campus Branch
            </label>
            <select
              value={formBranchId}
              onChange={(e) => setFormBranchId(e.target.value)}
              className="select w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs py-1.5 px-4 font-semibold"
            >
              {saving ? 'Creating...' : 'Save Classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

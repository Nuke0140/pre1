'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Network, Search, Users, ChevronDown, ChevronRight, Building,
  Briefcase, Shield, GraduationCap, ArrowUpDown, RefreshCw,
  FolderTree, Grid, Layers, ExternalLink, Filter, CheckCircle2
} from 'lucide-react'
import { Avatar } from '@/components/preone/ui'
import { ROLE_BADGE, BranchOption } from './types'
import { normalizeRole } from '@/lib/roles'
import { useToast } from '@/components/preone/Toast'

export interface OrgNode {
  id: string
  userId: string
  tenantUserId: string
  fullName: string
  name: string
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
  role: string
  roles: string[]
  designation: string
  department: string
  employeeCode: string
  employmentType?: string | null
  status: string
  branchId?: string | null
  branchName?: string | null
  reportingManagerId?: string | null
  reportingManagerName?: string | null
  directReportsCount: number
  children: OrgNode[]
}

interface OrgHierarchyViewProps {
  branches?: BranchOption[]
  onSelectUser: (userId: string) => void
}

export function OrgHierarchyView({ branches = [], onSelectUser }: OrgHierarchyViewProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [roots, setRoots] = useState<OrgNode[]>([])
  const [allNodes, setAllNodes] = useState<OrgNode[]>([])
  const [totalStaff, setTotalStaff] = useState(0)
  const [departments, setDepartments] = useState<Record<string, number>>({})

  // Controls
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [viewLayout, setViewLayout] = useState<'tree' | 'departments'>('tree')
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())

  // Fetch hierarchy tree from API
  const fetchHierarchy = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBranch !== 'ALL') params.set('branchId', selectedBranch)
      if (selectedDept !== 'ALL') params.set('department', selectedDept)
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/v1/users/org-hierarchy?${params.toString()}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to load org hierarchy')
      }

      setRoots(json.data.roots || [])
      setAllNodes(json.data.allNodes || [])
      setTotalStaff(json.data.totalStaff || 0)
      setDepartments(json.data.departments || {})
    } catch (err: any) {
      toast.error('Hierarchy Error', err.message || 'Could not load org chart')
    } finally {
      setLoading(false)
    }
  }, [selectedBranch, selectedDept, search, toast])

  useEffect(() => {
    fetchHierarchy()
  }, [fetchHierarchy])

  // Toggle node collapse
  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Expand / Collapse all
  const expandAll = () => setCollapsedNodeIds(new Set())
  const collapseAll = () => {
    const allIds = new Set<string>()
    const collect = (nodes: OrgNode[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          allIds.add(n.id)
          collect(n.children)
        }
      })
    }
    collect(roots)
    setCollapsedNodeIds(allIds)
  }

  // Calculate metrics
  const mappedCount = useMemo(() => {
    return allNodes.filter((n) => n.reportingManagerId).length
  }, [allNodes])

  // Nodes grouped by department for Department View
  const departmentGroups = useMemo(() => {
    const groups: Record<string, OrgNode[]> = {}
    allNodes.forEach((node) => {
      const dept = node.department || 'General'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(node)
    })
    return groups
  }, [allNodes])

  // Check if a node or its children match current search
  const isSearchMatch = (node: OrgNode): boolean => {
    if (!search.trim()) return false
    const q = search.toLowerCase()
    return (
      node.name.toLowerCase().includes(q) ||
      node.designation.toLowerCase().includes(q) ||
      node.department.toLowerCase().includes(q) ||
      node.employeeCode.toLowerCase().includes(q)
    )
  }

  // Render individual tree node component
  const renderTreeNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isCollapsed = collapsedNodeIds.has(node.id)
    const badge = ROLE_BADGE[normalizeRole(node.role)] || { cls: 'b-neutral', label: node.role }
    const match = isSearchMatch(node)

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Box */}
        <div
          onClick={() => onSelectUser(node.userId)}
          className={`group relative flex flex-col p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md w-64 text-left select-none ${
            match
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-400/40'
              : 'border-border/80 bg-card hover:border-indigo-400/80 dark:hover:border-indigo-500/60'
          }`}
        >
          {/* Card Top: Avatar, Name, Role Badge */}
          <div className="flex items-start gap-2.5">
            <Avatar name={node.name} src={node.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {node.name}
                </span>
              </div>
              <span className={`badge ${badge.cls} text-[10px] py-0 px-1.5 mt-0.5`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Card Middle: Designation, Department */}
          <div className="mt-2.5 pt-2 border-t border-border/60 text-[11px] space-y-0.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="truncate font-medium text-foreground">{node.designation}</span>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{node.employeeCode}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground text-[10px]">
              <span className="truncate">{node.department}</span>
              {node.branchName && (
                <span className="truncate max-w-[90px] text-gray-500 dark:text-gray-400" title={node.branchName}>
                  {node.branchName}
                </span>
              )}
            </div>
          </div>

          {/* Card Bottom: Reporting status & direct reports expander */}
          <div className="mt-2 pt-1.5 flex items-center justify-between text-[11px]">
            {node.reportingManagerName ? (
              <span className="text-[10px] text-muted-foreground truncate" title={`Reports to ${node.reportingManagerName}`}>
                Reports to: <strong className="text-foreground">{node.reportingManagerName}</strong>
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Executive Lead
              </span>
            )}

            {hasChildren && (
              <button
                type="button"
                onClick={(e) => toggleNode(node.id, e)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand reports' : 'Collapse reports'}
              >
                <span>{node.children.length}</span>
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Tree Connectors & Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-border/80" />

            {/* Horizontal connector bar across children */}
            {node.children.length > 1 ? (
              <div className="relative flex justify-center pt-6">
                <div
                  className="absolute top-0 h-0.5 bg-border/80"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `calc(100% - ${node.children.length > 1 ? '16rem' : '0px'})`,
                  }}
                />
                <div className="flex items-start gap-6 relative">
                  {node.children.map((child) => (
                    <div key={child.id} className="relative flex flex-col items-center">
                      {/* Vertical stem down to child */}
                      <div className="absolute -top-6 w-0.5 h-6 bg-border/80" />
                      {renderTreeNode(child, level + 1)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-2">
                {renderTreeNode(node.children[0], level + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Ribbon */}
      <div className="card card-compact p-4 rounded-xl space-y-3.5 border border-border/80 bg-card">
        {/* Row 1: Search & Layout Mode & Stats */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search staff, designation, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm pl-9 w-full text-xs"
              />
            </div>

            {branches.length > 1 && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="select select-sm text-xs max-w-[160px]"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* View Layout Toggle */}
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
              <button
                type="button"
                onClick={() => setViewLayout('tree')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'tree'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tree Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('departments')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'departments'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-indigo-500" />
                <span>Departments</span>
              </button>
            </div>

            {viewLayout === 'tree' && (
              <div className="inline-flex gap-1">
                <button
                  type="button"
                  onClick={expandAll}
                  className="btn btn-sm btn-ghost text-xs px-2"
                  title="Expand all hierarchy levels"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="btn btn-sm btn-ghost text-xs px-2"
                  title="Collapse tree to root leaders"
                >
                  Collapse All
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={fetchHierarchy}
              className="btn btn-sm btn-ghost p-1.5 text-muted-foreground hover:text-foreground"
              title="Refresh hierarchy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Department Quick Filters */}
        <div className="flex items-center gap-1.5 flex-wrap border-t border-border/60 pt-2.5 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Department:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
              selectedDept === 'ALL'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Departments ({totalStaff})
          </button>
          {Object.entries(departments).map(([dept, count]) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDept === dept
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {dept} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Hierarchy Content Area */}
      {loading ? (
        <div className="card p-12 text-center rounded-2xl border border-border/80 bg-card space-y-3">
          <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 animate-pulse">
            <Network className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-foreground">Loading Organizational Tree...</p>
          <p className="text-xs text-muted-foreground">Mapping reporting relationships and team structures</p>
        </div>
      ) : roots.length === 0 ? (
        <div className="card p-12 text-center rounded-2xl border border-border/80 bg-card space-y-3">
          <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No Staff Members Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No workforce members match the active filters or school directory has no staff records registered yet.
          </p>
        </div>
      ) : viewLayout === 'tree' ? (
        /* Visual Tree Canvas */
        <div className="card rounded-2xl border border-border/80 bg-card p-6 overflow-x-auto min-h-[500px]">
          <div className="flex items-start justify-center gap-12 min-w-max pb-8">
            {roots.map((root) => renderTreeNode(root, 0))}
          </div>
        </div>
      ) : (
        /* Department Grouped Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(departmentGroups).map(([dept, members]) => (
            <div
              key={dept}
              className="card p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  {dept}
                </span>
                <span className="badge b-neutral text-xs">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {members.map((m) => {
                  const badge = ROLE_BADGE[normalizeRole(m.role)] || { cls: 'b-neutral', label: m.role }
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectUser(m.userId)}
                      className="p-2.5 rounded-lg border border-border/60 hover:border-indigo-400 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{m.designation}</p>
                          {m.reportingManagerName && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                              Reports to: {m.reportingManagerName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`badge ${badge.cls} text-[9px] py-0 px-1 font-semibold`}>
                          {badge.label}
                        </span>
                        {m.directReportsCount > 0 && (
                          <span className="badge b-primary text-[9px] py-0 px-1 font-mono">
                            {m.directReportsCount} reports
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

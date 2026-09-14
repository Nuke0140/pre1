import { navForRole, type NavItem } from './nav'
import type { Role } from './auth'
import { can } from './auth'

export type TileSize = 'sm' | 'md' | 'lg'

export interface QuickAction {
  label: string
  href: string
  perm?: string
}

export interface ModuleMeta {
  description: string
  tileSize: TileSize
  quickActions?: QuickAction[]
}

export interface HomeModule extends NavItem {
  description: string
  tileSize: TileSize
  quickActions: QuickAction[]
}

const DEFAULT_META: ModuleMeta = {
  description: '',
  tileSize: 'sm',
}

const MODULE_META: Record<string, ModuleMeta> = {
  home: {
    description: 'Preschool command centre and quick launcher',
    tileSize: 'md',
  },
  dashboard: {
    description: 'Live school overview with KPIs and recent activity',
    tileSize: 'lg',
  },
  users: {
    description: 'Staff directory, parents and role access',
    tileSize: 'md',
    quickActions: [{ label: 'Add user', href: '/app/users', perm: 'users:write' }],
  },
  setup: {
    description: 'School, academic year and go-live wizard',
    tileSize: 'sm',
  },
  admissions: {
    description: 'Enquiries, applications and offers funnel',
    tileSize: 'lg',
    quickActions: [
      { label: 'Record enquiry', href: '/app/admissions', perm: 'admissions:write' },
      { label: 'New application', href: '/app/admissions', perm: 'admissions:write' },
    ],
  },
  academics: {
    description: 'Curriculum, lesson plans and child progress',
    tileSize: 'md',
  },
  students: {
    description: 'Student directory, profiles and enrolment',
    tileSize: 'lg',
    quickActions: [{ label: 'Add student', href: '/app/students', perm: 'students:write' }],
  },
  attendance: {
    description: 'Daily check-in register and attendance history',
    tileSize: 'md',
    quickActions: [{ label: 'Mark attendance', href: '/app/attendance', perm: 'attendance:mark' }],
  },
  operations: {
    description: 'Today at school — pick-ups, health alerts and incidents',
    tileSize: 'md',
  },
  transport: {
    description: 'Preschool child safety, bus routes, fleet, pickups & live trips',
    tileSize: 'lg',
    quickActions: [
      { label: "Today's trips", href: '/app/transport?tab=trips', perm: 'transport:trip' },
      { label: 'Assign student', href: '/app/transport?tab=students', perm: 'transport:assign' },
    ],
  },
  inventory: {
    description: 'Materials, classroom requests, stock, procurement & vendors',
    tileSize: 'lg',
    quickActions: [
      { label: 'Request materials', href: '/app/inventory?tab=requests', perm: 'inventory:request' },
      { label: 'Receive stock', href: '/app/inventory?tab=grn', perm: 'inventory:receive' },
    ],
  },
  finance: {
    description: 'Fees, invoices, payments and collections',
    tileSize: 'lg',
    quickActions: [{ label: 'Create invoice', href: '/app/finance', perm: 'finance:write' }],
  },
  reports: {
    description: 'Cross-module analytics, operational dashboards, custom report builder & exports',
    tileSize: 'lg',
    quickActions: [
      { label: 'Executive MIS', href: '/app/reports?tab=executive', perm: 'reports:read' },
      { label: 'Custom Builder', href: '/app/reports?tab=custom', perm: 'reports:custom' },
    ],
  },
  communication: {
    description: 'Announcements to parents and staff',
    tileSize: 'md',
    quickActions: [{ label: 'Send announcement', href: '/app/communication', perm: 'communication:write' }],
  },
  settings: {
    description: 'School preferences and branch settings',
    tileSize: 'sm',
  },
  audit: {
    description: 'Security and activity audit trail',
    tileSize: 'sm',
  },
  platform: {
    description: 'Multi-tenant platform console',
    tileSize: 'sm',
  },
}

export function homeModules(roleOrRoles: Role | Role[]): HomeModule[] {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
  return navForRole(roles).map((n) => {
    const meta = MODULE_META[n.key] ?? DEFAULT_META
    const qas = (meta.quickActions ?? []).filter((qa) => !qa.perm || can(roles, qa.perm))
    return {
      ...n,
      description: meta.description,
      tileSize: meta.tileSize,
      quickActions: qas,
    }
  })
}

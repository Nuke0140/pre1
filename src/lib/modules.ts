import { navForRole, type NavItem } from './nav'
import type { Role } from './auth'
import { can } from './auth'

export type TileSize = 'sm' | 'md' | 'lg'
export type SemanticTheme = 'lavender' | 'blue' | 'teal' | 'orange' | 'pink' | 'green' | 'purple'

export interface QuickAction {
  label: string
  href: string
  perm?: string
}

export interface ModuleMeta {
  description: string
  tileSize: TileSize
  semanticTheme?: SemanticTheme
  quickActions?: QuickAction[]
}

export interface HomeModule extends NavItem {
  description: string
  tileSize: TileSize
  semanticTheme: SemanticTheme
  quickActions: QuickAction[]
}

const DEFAULT_META: ModuleMeta = {
  description: '',
  tileSize: 'sm',
  semanticTheme: 'lavender',
}

const MODULE_META: Record<string, ModuleMeta> = {
  home: {
    description: 'Your control center',
    tileSize: 'md',
    semanticTheme: 'lavender',
  },
  dashboard: {
    description: 'Insights at a glance',
    tileSize: 'lg',
    semanticTheme: 'blue',
  },
  users: {
    description: 'Manage access & roles',
    tileSize: 'md',
    semanticTheme: 'teal',
    quickActions: [{ label: 'Add user', href: '/app/users', perm: 'users:write' }],
  },
  hr: {
    description: 'Staff, leaves & payroll',
    tileSize: 'md',
    semanticTheme: 'orange',
  },
  setup: {
    description: 'School configuration',
    tileSize: 'sm',
    semanticTheme: 'lavender',
  },
  admissions: {
    description: 'Inquiries & enrollments',
    tileSize: 'lg',
    semanticTheme: 'pink',
    quickActions: [
      { label: 'Record enquiry', href: '/app/admissions', perm: 'admissions:write' },
      { label: 'New application', href: '/app/admissions', perm: 'admissions:write' },
    ],
  },
  academics: {
    description: 'Classes, curriculum & learning',
    tileSize: 'md',
    semanticTheme: 'blue',
  },
  students: {
    description: 'Student records & profiles',
    tileSize: 'lg',
    semanticTheme: 'green',
    quickActions: [{ label: 'Add student', href: '/app/students', perm: 'students:write' }],
  },
  attendance: {
    description: 'Track daily attendance',
    tileSize: 'md',
    semanticTheme: 'pink',
    quickActions: [{ label: 'Mark attendance', href: '/app/attendance', perm: 'attendance:mark' }],
  },
  operations: {
    description: 'Daily school operations',
    tileSize: 'md',
    semanticTheme: 'lavender',
  },
  transport: {
    description: 'Routes & vehicle tracking',
    tileSize: 'lg',
    semanticTheme: 'blue',
    quickActions: [
      { label: "Today's trips", href: '/app/transport?tab=trips', perm: 'transport:trip' },
      { label: 'Assign student', href: '/app/transport?tab=students', perm: 'transport:assign' },
    ],
  },
  inventory: {
    description: 'Supplies & assets',
    tileSize: 'lg',
    semanticTheme: 'orange',
    quickActions: [
      { label: 'Request materials', href: '/app/inventory?tab=requests', perm: 'inventory:request' },
      { label: 'Receive stock', href: '/app/inventory?tab=grn', perm: 'inventory:receive' },
    ],
  },
  finance: {
    description: 'Billing & payments',
    tileSize: 'lg',
    semanticTheme: 'green',
    quickActions: [{ label: 'Create invoice', href: '/app/finance', perm: 'finance:write' }],
  },
  reports: {
    description: 'Data-driven insights',
    tileSize: 'lg',
    semanticTheme: 'purple',
    quickActions: [
      { label: 'Executive MIS', href: '/app/reports?tab=executive', perm: 'reports:read' },
      { label: 'Custom Builder', href: '/app/reports?tab=custom', perm: 'reports:custom' },
    ],
  },
  communication: {
    description: 'Communicate with your community',
    tileSize: 'md',
    semanticTheme: 'pink',
    quickActions: [{ label: 'Send announcement', href: '/app/communication', perm: 'communication:write' }],
  },
  settings: {
    description: 'System preferences',
    tileSize: 'sm',
    semanticTheme: 'blue',
  },
  audit: {
    description: 'Track system activities',
    tileSize: 'sm',
    semanticTheme: 'orange',
  },
  platform: {
    description: 'Multi-tenant platform console',
    tileSize: 'sm',
    semanticTheme: 'blue',
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
      semanticTheme: meta.semanticTheme ?? 'lavender',
      quickActions: qas,
    }
  })
}

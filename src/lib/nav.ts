import {
  LayoutDashboard, Users, ClipboardList, IndianRupee,
  Sparkles, Megaphone, Settings, ScrollText, Building2, Rocket,
  HeartPulse, UserCheck,
} from 'lucide-react'
import type { Role } from './auth'
import { can } from './auth'

export interface NavItem {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  grad: string
  perm?: string
  roles?: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, grad: 'g-blue' },
  { key: 'users', label: 'Users', href: '/app/users', icon: UserCheck, grad: 'g-violet', perm: 'users:read' },
  { key: 'setup', label: 'Setup', href: '/app/setup', icon: Rocket, grad: 'g-violet', perm: 'settings:read' },
  { key: 'admissions', label: 'Admissions', href: '/app/admissions', icon: ClipboardList, grad: 'g-pink', perm: 'admissions:read' },
  { key: 'academics', label: 'Academics', href: '/app/academics', icon: Sparkles, grad: 'g-purple', perm: 'academics:read' },
  { key: 'students', label: 'Students', href: '/app/students', icon: Users, grad: 'g-blue', perm: 'students:read' },
  { key: 'operations', label: 'Operations', href: '/app/operations', icon: HeartPulse, grad: 'g-red', perm: 'operations:read' },
  { key: 'finance', label: 'Fees', href: '/app/finance', icon: IndianRupee, grad: 'g-yellow', perm: 'finance:read' },
  { key: 'communication', label: 'Announcements', href: '/app/communication', icon: Megaphone, grad: 'g-orange', perm: 'communication:read' },
  { key: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, grad: 'g-slate', perm: 'settings:read' },
  { key: 'audit', label: 'Audit Logs', href: '/app/audit', icon: ScrollText, grad: 'g-sky', perm: 'audit:read' },
  { key: 'platform', label: 'Platform Console', href: '/onboard', icon: Building2, grad: 'g-blue', roles: ['PLATFORM_ADMIN'] },
]

/** Role-filtered navigation (menuBuilder per Frontend Architecture §RBAC). */
export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((n) => {
    if (n.roles && !n.roles.includes(role)) return false
    if (n.perm && !can(role, n.perm)) return false
    return true
  })
}

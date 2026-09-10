import {
  LayoutDashboard, Users, ClipboardList, CalendarCheck, IndianRupee,
  Sparkles, Smartphone, Megaphone, Settings, ScrollText, Building2, Rocket,
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
  { key: 'setup', label: 'Setup', href: '/app/setup', icon: Rocket, grad: 'g-violet', perm: 'settings:read' },
  { key: 'students', label: 'Students', href: '/app/students', icon: Users, grad: 'g-purple', perm: 'students:read' },
  { key: 'admissions', label: 'Admissions', href: '/app/admissions', icon: ClipboardList, grad: 'g-pink', perm: 'admissions:read' },
  { key: 'attendance', label: 'Attendance', href: '/app/attendance', icon: CalendarCheck, grad: 'g-green', perm: 'attendance:read' },
  { key: 'finance', label: 'Fees', href: '/app/finance', icon: IndianRupee, grad: 'g-yellow', perm: 'finance:read' },
  { key: 'academics', label: 'Academics', href: '/app/academics', icon: Sparkles, grad: 'g-violet', perm: 'academics:read' },
  { key: 'timeline', label: 'Child Timeline', href: '/app/timeline', icon: Smartphone, grad: 'g-cyan', perm: 'timeline:read' },
  { key: 'communication', label: 'Announcements', href: '/app/communication', icon: Megaphone, grad: 'g-orange', perm: 'communication:read' },
  { key: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, grad: 'g-slate', perm: 'settings:read' },
  { key: 'audit', label: 'Audit Log', href: '/app/audit', icon: ScrollText, grad: 'g-sky', perm: 'audit:read' },
  { key: 'platform', label: 'Platform', href: '/onboard', icon: Building2, grad: 'g-blue', roles: ['PLATFORM_ADMIN'] },
]

/** Role-filtered navigation (menuBuilder per Frontend Architecture §RBAC). */
export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((n) => {
    if (n.roles && !n.roles.includes(role)) return false
    if (n.perm && !can(role, n.perm)) return false
    return true
  })
}

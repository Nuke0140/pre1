'use client'

import React from 'react'
import {
  Users,
  PhoneCall,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  BarChart3,
  LayoutDashboard,
  Layers,
  Calendar,
  ShieldCheck,
  Receipt,
  User,
  Shield,
  BookOpen,
  CalendarDays,
  Award,
  Sparkles,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Building2,
  Boxes,
  Bus,
  Compass,
  MapPin,
  ShieldAlert,
  Wrench,
  Activity,
  UserCheck,
  CreditCard,
  FileText,
  Bell,
  Sliders,
  CalendarCheck,
  CalendarRange,
  Inbox,
  FileBarChart,
  Clock,
  ScrollText,
  Flame,
  AlertTriangle,
  QrCode,
} from 'lucide-react'

export interface ModuleNavigationItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode
  badge?: number | string
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  disabled?: boolean
  permission?: boolean
  tooltip?: string
  ariaLabel?: string
  description?: string
  matchPrefix?: boolean
}

/**
 * 1. ADMISSIONS MODULE CONFIGURATION
 */
export const ADMISSIONS_NAVIGATION_CONFIG: ModuleNavigationItem[] = [
  {
    id: 'control-center',
    label: 'Control Center',
    href: '/app/admissions',
    icon: LayoutDashboard,
    tooltip: 'Pipeline overview, live admissions & quick actions',
  },
  {
    id: 'enquiries',
    label: 'Enquiries',
    href: '/app/admissions/enquiries',
    icon: Users,
    tooltip: 'Prospective leads and walk-in enquiries',
    matchPrefix: true,
  },
  {
    id: 'follow-ups',
    label: 'Follow-ups',
    href: '/app/admissions/follow-ups',
    icon: PhoneCall,
    tooltip: 'Scheduled parent calls and site tour follow-ups',
    matchPrefix: true,
  },
  {
    id: 'applications',
    label: 'Applications',
    href: '/app/admissions/applications',
    icon: FileSpreadsheet,
    tooltip: 'Formal admissions application review & verification',
    matchPrefix: true,
  },
  {
    id: 'admitted',
    label: 'Confirmed Admitted',
    href: '/app/admissions/admitted',
    icon: GraduationCap,
    tooltip: 'Enrolled students and welcome kit issuance',
    matchPrefix: true,
  },
  {
    id: 'classroom-placements',
    label: 'Classroom Placements',
    href: '/app/admissions/classroom-placements',
    icon: LayoutGrid,
    tooltip: 'Capacity planning and student seat placement',
    matchPrefix: true,
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    href: '/app/admissions/reports',
    icon: BarChart3,
    tooltip: 'Conversion funnel and admission statistics',
    matchPrefix: true,
  },
]

/**
 * 2. CLASSROOMS MODULE CONFIGURATION
 */
export function getClassroomsNavConfig(counts?: { classrooms?: number }): ModuleNavigationItem[] {
  return [
    {
      id: 'DIRECTORY',
      label: counts?.classrooms != null ? `Classrooms Directory (${counts.classrooms})` : 'Classrooms Directory',
      icon: LayoutGrid,
      tooltip: 'View all active classrooms and teacher assignments',
    },
    {
      id: 'IMPORT',
      label: 'Import via Spreadsheet',
      icon: FileSpreadsheet,
      tooltip: 'Bulk import classroom rosters via CSV/Excel',
    },
  ]
}

/**
 * 3. FEES & FINANCE MODULE CONFIGURATION
 */
export const FEES_NAVIGATION_CONFIG: ModuleNavigationItem[] = [
  {
    id: 'STRUCTURES',
    label: 'Fee Structures',
    icon: Layers,
    tooltip: 'Configured academic fee templates and rules',
  },
  {
    id: 'SCHEDULES',
    label: 'Student Dues & Schedules',
    icon: Calendar,
    tooltip: 'Pending student dues, installment plans and invoices',
  },
  {
    id: 'DEPOSITS',
    label: 'Security Deposits',
    icon: ShieldCheck,
    tooltip: 'Refundable caution deposits and status',
  },
  {
    id: 'PAYMENTS',
    label: 'Payment Receipts',
    icon: Receipt,
    tooltip: 'Verified payment transactions and official receipts',
  },
  {
    id: 'IMPORT',
    label: 'Import via Spreadsheet',
    icon: FileSpreadsheet,
    tooltip: 'Bulk upload fee ledgers and payments',
  },
]

/**
 * 4. USERS / FAMILY MODULE CONFIGURATION
 */
export function getFamilyNavConfig(counts?: { parents?: number; guardians?: number }): ModuleNavigationItem[] {
  return [
    {
      id: 'PARENTS',
      label: 'Parents',
      icon: User,
      badge: counts?.parents,
      tooltip: 'Primary parent contacts with tuition billing access',
    },
    {
      id: 'GUARDIANS',
      label: 'Guardians & Escorts',
      icon: Shield,
      badge: counts?.guardians,
      tooltip: 'Authorized pickup escorts with biometric/PIN verification',
    },
  ]
}

/**
 * 5. LEARNING & CURRICULUM MODULE CONFIGURATION
 */
export function getLearningNavConfig(counts?: {
  curricula?: number
  activities?: number
  observations?: number
}): ModuleNavigationItem[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      tooltip: 'Preschool developmental progress snapshot',
    },
    {
      id: 'curriculum',
      label: 'Curriculum & Goals',
      icon: BookOpen,
      badge: counts?.curricula,
      tooltip: 'EYFS developmental domains and learning milestones',
    },
    {
      id: 'activities',
      label: 'Activity Planner',
      icon: CalendarDays,
      badge: counts?.activities,
      tooltip: 'Classroom daily plans and pedagogical activities',
    },
    {
      id: 'observations',
      label: 'Observations',
      icon: Award,
      badge: counts?.observations,
      tooltip: 'Formative teacher notes and portfolio evaluations',
    },
    {
      id: 'progress',
      label: 'Milestone Matrix',
      icon: Sparkles,
      tooltip: 'Student developmental milestone achievement matrix',
    },
  ]
}

/**
 * 6. INVENTORY MODULE CONFIGURATION
 */
export function getInventoryNavConfig(options: {
  isTeacher?: boolean
  canApprove?: boolean
  pendingRequestsCount?: number
}): ModuleNavigationItem[] {
  const { isTeacher, canApprove, pendingRequestsCount } = options

  return [
    {
      id: 'STORE',
      label: 'Classroom Supply Store',
      icon: ShoppingCart,
      tooltip: 'Teacher classroom supply request catalog',
    },
    {
      id: 'APPROVALS',
      label: 'Approvals Inbox',
      icon: ShieldCheck,
      badge: pendingRequestsCount || undefined,
      badgeVariant: 'warning',
      permission: Boolean(canApprove),
      tooltip: 'Pending material requests awaiting principal sign-off',
    },
    {
      id: 'OVERVIEW',
      label: 'Overview',
      icon: BarChart3,
      permission: !isTeacher,
      tooltip: 'Stock valuation, low stock warnings & distribution stats',
    },
    {
      id: 'ITEMS',
      label: 'Items & Stock',
      icon: Package,
      permission: !isTeacher,
      tooltip: 'Central inventory catalog and physical stock balances',
    },
    {
      id: 'DISTRIBUTION',
      label: isTeacher ? 'Classroom Distributions' : 'Requests & Distribution',
      icon: Sparkles,
      badge: isTeacher ? undefined : pendingRequestsCount || undefined,
      badgeVariant: 'warning',
      tooltip: 'Requisitions and student welcome kit issuance',
    },
    {
      id: 'STORES',
      label: 'Stores & Transfers',
      icon: Warehouse,
      permission: !isTeacher,
      tooltip: 'Warehouse locations, stock bins and intra-school transfers',
    },
    {
      id: 'PROCUREMENT',
      label: 'Procurement',
      icon: ShoppingCart,
      permission: !isTeacher,
      tooltip: 'Purchase orders and vendor procurement pipelines',
    },
    {
      id: 'RECEIVING',
      label: 'Receiving (GRN)',
      icon: Truck,
      permission: !isTeacher,
      tooltip: 'Goods Received Notes and vendor delivery inspections',
    },
    {
      id: 'VENDORS',
      label: 'Vendors',
      icon: Building2,
      permission: !isTeacher,
      tooltip: 'Registered educational suppliers and price contracts',
    },
    {
      id: 'REPORTS',
      label: 'Reports & Audit',
      icon: Boxes,
      permission: !isTeacher,
      tooltip: 'Inventory consumption, reorder alerts and stock ledger',
    },
  ].filter((item) => item.permission !== false)
}

/**
 * 7. TRANSPORT MODULE CONFIGURATION
 */
export function getTransportNavConfig(options: {
  isAdmin?: boolean
  isParent?: boolean
  isDriver?: boolean
  isTeacher?: boolean
  isSecurity?: boolean
  activeTripsCount?: number
  unreadIncidentsCount?: number
  assignmentsCount?: number
  vehiclesCount?: number
  myChildrenCount?: number
  pendingArrivalsCount?: number
  pendingAuthCount?: number
}): ModuleNavigationItem[] {
  const {
    isAdmin = true,
    isParent,
    isDriver,
    isTeacher,
    isSecurity,
    activeTripsCount,
    unreadIncidentsCount,
    assignmentsCount,
    vehiclesCount,
    myChildrenCount,
    pendingArrivalsCount,
    pendingAuthCount,
  } = options

  const items: ModuleNavigationItem[] = []

  if (isAdmin) {
    items.push({
      id: 'HOME',
      label: 'Home',
      icon: Compass,
      tooltip: 'Live morning arrivals and afternoon dispatch command deck',
    })
    items.push({
      id: 'TRIPS',
      label: "Today's Trips",
      icon: Bus,
      badge: activeTripsCount,
      badgeVariant: 'info',
      tooltip: 'Real-time vehicle trip monitoring and stop verification',
    })
    items.push({
      id: 'STUDENTS_ROUTES',
      label: 'Children & Routes',
      icon: MapPin,
      badge: assignmentsCount,
      tooltip: 'Bus route planning, stops and student seat assignments',
    })
    items.push({
      id: 'SAFETY',
      label: 'Safety & Approvals',
      icon: ShieldAlert,
      badge: unreadIncidentsCount,
      badgeVariant: 'danger',
      tooltip: 'Pickup PIN authorizations and safety incident log',
    })
    items.push({
      id: 'FLEET_SETTINGS',
      label: 'Fleet & Settings',
      icon: Wrench,
      badge: vehiclesCount,
      tooltip: 'Vehicles, driver credentials, maintenance and RFID scanner',
    })
  }

  if (isParent) {
    items.push({
      id: 'PARENT',
      label: "My Child's Transport",
      icon: Users,
      badge: myChildrenCount,
      tooltip: 'Independent transit status, stops and pickup authorizations for linked children',
    })
  }

  if (isDriver) {
    items.push({
      id: 'DRIVER',
      label: 'My Trip',
      icon: Bus,
      tooltip: 'Active transit route, passenger manifest and stop check-ins',
    })
    items.push({
      id: 'SCANNER',
      label: 'Gate QR Scanner',
      icon: QrCode,
      tooltip: 'Driver QR check-in and student drop verification',
    })
  }

  if (isTeacher) {
    items.push({
      id: 'TEACHER',
      label: 'Arrivals to Verify',
      icon: GraduationCap,
      badge: pendingArrivalsCount,
      badgeVariant: 'warning',
      tooltip: 'Classroom student morning arrival check-ins',
    })
  }

  if (isSecurity && !isAdmin) {
    items.push({
      id: 'SCANNER',
      label: 'QR/PIN Scanner',
      icon: QrCode,
      tooltip: 'Gate QR token and pickup PIN scanner',
    })
    items.push({
      id: 'AUTHORIZATIONS',
      label: 'Temp Pickups',
      icon: ShieldCheck,
      badge: pendingAuthCount,
      badgeVariant: 'warning',
      tooltip: 'Temporary guardian pickup authorizations',
    })
    items.push({
      id: 'SECURITY',
      label: 'Security Audit',
      icon: ShieldAlert,
      tooltip: 'Access control log and gate security incidents',
    })
  }

  return items
}

/**
 * 8. AUDIT MODULE CONFIGURATION
 */
export const AUDIT_CATEGORY_CONFIG: ModuleNavigationItem[] = [
  { id: 'all', label: 'All Activity', icon: ScrollText, tooltip: 'Complete immutable system activity audit trail' },
  { id: 'security', label: 'Security Events', icon: ShieldAlert, tooltip: 'Access control violations, login failures and security exceptions' },
  { id: 'changes', label: 'Data Changes', icon: Flame, tooltip: 'Record updates, field mutations and profile modifications' },
  { id: 'finance', label: 'Payment Activity', icon: CreditCard, tooltip: 'Invoices, fee receipts, online payments and refund events' },
  { id: 'exports', label: 'Exports & Reports', icon: FileSpreadsheet, tooltip: 'CSV generation and audit report downloads' },
]

/**
 * 9. HR & WORKFORCE MODULE CONFIGURATION
 */
export function getHrNavConfig(options?: { pendingRequestsCount?: number }): ModuleNavigationItem[] {
  return [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Workforce snapshot & KPIs' },
    { id: 'employees', label: 'Employees', icon: Users, tooltip: 'Staff profiles & directory' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, tooltip: 'Daily roll call & punches' },
    { id: 'leave', label: 'Leave', icon: CalendarDays, tooltip: 'Balances & approvals' },
    { id: 'schedule', label: 'Staff Schedule', icon: CalendarRange, tooltip: 'Timetables & classrooms' },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, tooltip: 'Cycles, PF/ESI & payouts' },
    { id: 'performance', label: 'Performance', icon: Award, tooltip: 'Appraisals & reviews' },
    { id: 'training', label: 'Training', icon: ShieldCheck, tooltip: 'POSH, safety & ECCE' },
    {
      id: 'requests',
      label: 'Requests',
      icon: Inbox,
      badge: options?.pendingRequestsCount || undefined,
      badgeVariant: 'warning',
      tooltip: 'Unified approvals inbox',
    },
    { id: 'reports', label: 'Reports', icon: FileBarChart, tooltip: 'Analytics & compliance' },
  ]
}

/**
 * 10. SETTINGS MODULE CONFIGURATION
 */
export const SETTINGS_NAVIGATION_CONFIG: ModuleNavigationItem[] = [
  { id: 'profile', label: 'School Profile', icon: Building2, tooltip: 'Brand identity, tax numbers and contact' },
  { id: 'organization', label: 'Organization', icon: Layers, tooltip: 'Campus branches and departments' },
  { id: 'operations', label: 'Operating Schedule', icon: Sliders, tooltip: 'Campus operating hours and shifts' },
  { id: 'admissions', label: 'Admissions Policy', icon: Sparkles, tooltip: 'Enquiry rules, capacities and fees' },
  { id: 'academics', label: 'Academics & EYFS', icon: GraduationCap, tooltip: 'Academic sessions and developmental framework' },
  { id: 'students', label: 'Student Lifecycle', icon: Users, tooltip: 'Enrolment policies and pickup security' },
  { id: 'finance', label: 'Finance & Invoicing', icon: CreditCard, tooltip: 'Bank accounts, taxes and invoice numbering' },
  { id: 'templates', label: 'Document Templates', icon: FileText, tooltip: 'Receipt and certificate print layouts' },
  { id: 'notifications', label: 'Communications & Alerts', icon: Bell, tooltip: 'SMS/WhatsApp gateways and parent alerts' },
  { id: 'security', label: 'Security & Access', icon: ShieldCheck, tooltip: 'Session duration and password policies' },
  { id: 'rbac', label: 'Role Permissions', icon: UserCheck, tooltip: 'Granular RBAC permission matrix' },
  { id: 'health', label: 'Integration Health', icon: Activity, tooltip: 'System diagnostic checks and connectivity' },
  { id: 'preferences', label: 'My Preferences', icon: Sliders, tooltip: 'Theme glow and user preferences' },
]

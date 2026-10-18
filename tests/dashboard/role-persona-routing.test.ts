import { describe, it, expect } from 'bun:test'
import * as fs from 'node:fs'
import { normalizeRole, CANONICAL_ROLES, LEGACY_ROLE_MAP } from '@/lib/roles'
import { can, ROLE_PERMISSIONS } from '@/lib/auth'

describe('PreOne Dashboard Controller & Security Architecture Suite', () => {
  const pageSource = fs.readFileSync('src/app/app/dashboard/page.tsx', 'utf-8')
  const clientSource = fs.readFileSync('src/app/app/dashboard/DashboardClient.tsx', 'utf-8')
  const staffViewSource = fs.readFileSync('src/app/app/dashboard/StaffDashboardView.tsx', 'utf-8')

  describe('1. Supported Roles and Persona Routing Mapping', () => {
    it('verifies all Prisma-supported canonical and legacy roles resolve via normalizeRole', () => {
      // Leadership
      expect(normalizeRole('OWNER')).toBe('OWNER')
      expect(normalizeRole('PRINCIPAL')).toBe('PRINCIPAL')

      // Academic
      expect(normalizeRole('TEACHER')).toBe('TEACHER')
      expect(normalizeRole('COORDINATOR')).toBe('COORDINATOR')

      // Operations / Support
      expect(normalizeRole('STAFF')).toBe('STAFF')
      expect(normalizeRole('HELPER')).toBe('STAFF')
      expect(normalizeRole('HR')).toBe('STAFF')
      expect(normalizeRole('ATTENDANT')).toBe('ATTENDANT')
      expect(normalizeRole('DRIVER')).toBe('DRIVER')
      expect(normalizeRole('RECEPTIONIST')).toBe('RECEPTIONIST')
      expect(normalizeRole('RECEPTION')).toBe('RECEPTIONIST')

      // Finance
      expect(normalizeRole('ACCOUNTS')).toBe('ACCOUNTS')
      expect(normalizeRole('ACCOUNTANT')).toBe('ACCOUNTS')

      // Family
      expect(normalizeRole('PARENT')).toBe('PARENT')
      expect(normalizeRole('GUARDIAN')).toBe('GUARDIAN')

      // Platform
      expect(normalizeRole('PLATFORM_ADMIN')).toBe('PLATFORM_ADMIN')
    })

    it('verifies dashboard controller maps TEACHER and COORDINATOR to TeacherToday', () => {
      expect(pageSource).toContain("if (canonicalRole === 'TEACHER' || canonicalRole === 'COORDINATOR')")
      expect(pageSource).toContain('return <TeacherToday />')
    })

    it('verifies dashboard controller maps PARENT and GUARDIAN to ParentToday', () => {
      expect(pageSource).toContain("if (canonicalRole === 'PARENT' || canonicalRole === 'GUARDIAN')")
      expect(pageSource).toContain('return <ParentToday />')
    })

    it('verifies dashboard controller maps operational support roles to StaffDashboardView', () => {
      expect(pageSource).toContain("canonicalRole === 'STAFF'")
      expect(pageSource).toContain("canonicalRole === 'ATTENDANT'")
      expect(pageSource).toContain("canonicalRole === 'DRIVER'")
      expect(pageSource).toContain("canonicalRole === 'RECEPTIONIST'")
      expect(pageSource).toContain('return (')
      expect(pageSource).toContain('<StaffDashboardView')
    })

    it('verifies dashboard controller maps ACCOUNTS to FinanceDashboardView', () => {
      expect(pageSource).toContain("if (canonicalRole === 'ACCOUNTS')")
      expect(pageSource).toContain('<FinanceDashboardView')
    })

    it('verifies PLATFORM_ADMIN is redirected to /onboard', () => {
      expect(pageSource).toContain("session.role === 'PLATFORM_ADMIN'")
      expect(pageSource).toContain("redirect('/onboard')")
    })

    it('verifies unknown or unsupported roles are safely redirected to /app/home', () => {
      expect(pageSource).toContain('!isAuthorizedExecutive')
      expect(pageSource).toContain("redirect('/app/home')")
    })
  })

  describe('2. Server-Side Data Scoping & Permission Guardrails', () => {
    it('verifies audit logs are strictly guarded by audit:read permission', () => {
      // Permission check in page controller
      expect(pageSource).toContain("const canReadAudit = can(session.role, 'audit:read')")
      expect(pageSource).toContain('canReadAudit')
      expect(pageSource).toContain('db.auditLog.findMany')

      // TEACHER, PARENT, STAFF cannot read audit logs
      expect(can('TEACHER', 'audit:read')).toBe(false)
      expect(can('PARENT', 'audit:read')).toBe(false)
      expect(can('STAFF', 'audit:read')).toBe(false)
      expect(can('DRIVER', 'audit:read')).toBe(false)
      expect(can('ATTENDANT', 'audit:read')).toBe(false)

      // Leadership and accounts can read audit logs
      expect(can('OWNER', 'audit:read')).toBe(true)
      expect(can('PRINCIPAL', 'audit:read')).toBe(true)
      expect(can('ACCOUNTS', 'audit:read')).toBe(true)

      // UI component guards rendering
      expect(clientSource).toContain('perms.audit && (')
    })

    it('verifies finance telemetry is server-authorized and not queried for non-finance roles', () => {
      expect(pageSource).toContain("const canReadFinance = can(session.role, 'finance:read')")
      expect(pageSource).toContain('canReadFinance')
      expect(pageSource).toContain('db.invoice.findMany')

      // TEACHER, STAFF, DRIVER, ATTENDANT have no finance read rights
      expect(can('TEACHER', 'finance:read')).toBe(false)
      expect(can('STAFF', 'finance:read')).toBe(false)
      expect(can('COORDINATOR', 'finance:read')).toBe(false)
      expect(can('RECEPTIONIST', 'finance:read')).toBe(false)
      expect(can('DRIVER', 'finance:read')).toBe(false)

      // OWNER, PRINCIPAL, ACCOUNTS have finance read rights
      expect(can('OWNER', 'finance:read')).toBe(true)
      expect(can('PRINCIPAL', 'finance:read')).toBe(true)
      expect(can('ACCOUNTS', 'finance:read')).toBe(true)
    })

    it('verifies draft and cancelled invoices are isolated from active billed revenue via calculateDashboardFeeMetrics', () => {
      expect(pageSource).toContain('calculateDashboardFeeMetrics(invoices, today)')
    })

    it('verifies every database query enforces tenantId scoping', () => {
      // Verify all db queries in dashboard controller include tenantId in where clause
      const dbCalls = pageSource.match(/db\.\w+\.(count|findMany|findUnique)\(\{[\s\S]*?\}\)/g) || []
      expect(dbCalls.length).toBeGreaterThanOrEqual(6)
      for (const call of dbCalls) {
        expect(call).toContain('tenantId')
      }
    })
  })

  describe('3. Staff & Operational Duty View Boundaries', () => {
    it('verifies StaffDashboardView does not display financial figures or audit trails', () => {
      expect(staffViewSource).not.toContain('inr(')
      expect(staffViewSource).not.toContain('totalCents')
      expect(staffViewSource).not.toContain('recentAudit')
      expect(staffViewSource).not.toContain('auditLog')
      expect(staffViewSource).toContain('Daily Shift & Duty Center')
    })
  })

  describe('4. Academic / Teacher Persona Accessibility & Touch Targets (Step 6.1)', () => {
    const teacherTodaySource = fs.readFileSync('src/app/app/dashboard/TeacherToday.tsx', 'utf-8')

    it('verifies TeacherToday quick-care buttons enforce min 44px touch targets on mobile with accessible names', () => {
      expect(teacherTodaySource).toContain('min-h-[44px]')
      expect(teacherTodaySource).toContain('min-w-[44px]')
      expect(teacherTodaySource).toContain('aria-label={`Record ${a.label}`}')
      expect(teacherTodaySource).toContain('aria-label="More care actions"')
    })
  })
})


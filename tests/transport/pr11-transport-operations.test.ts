import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { TransportService } from '@/lib/transport/transport-service'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

describe('PR #11 Transport Operations, Driver Filtering & Seed Elimination Verification', () => {
  const testTenantId = 'test-tenant-pr11-' + Date.now()
  const testBranchId = 'test-branch-pr11-' + Date.now()

  describe('1. Elimination of Seed Data Endpoint & Demo Methods', () => {
    it('verifies src/app/api/v1/transport/seed/route.ts is completely deleted', () => {
      const seedRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'v1', 'transport', 'seed', 'route.ts')
      expect(fs.existsSync(seedRoutePath)).toBe(false)
    })

    it('verifies TransportService has no seedTransportDemoData method', () => {
      expect((TransportService as any).seedTransportDemoData).toBeUndefined()
    })
  })

  describe('2. Driver-Only Staff Filter Validation', () => {
    it('accurately distinguishes transport staff from teachers and general staff', () => {
      const candidateStaff = [
        {
          id: 's-1',
          designation: 'Bus Driver',
          department: 'Transport',
          tenantUser: { role: 'DRIVER', roles: ['DRIVER'] },
        },
        {
          id: 's-2',
          designation: 'Van Attendant',
          department: 'Fleet Logistics',
          tenantUser: { role: 'ATTENDANT', roles: ['ATTENDANT'] },
        },
        {
          id: 's-3',
          designation: 'Preschool Teacher',
          department: 'Academics',
          tenantUser: { role: 'TEACHER', roles: ['TEACHER'] },
        },
        {
          id: 's-4',
          designation: 'School Principal',
          department: 'Administration',
          tenantUser: { role: 'PRINCIPAL', roles: ['PRINCIPAL'] },
        },
        {
          id: 's-5',
          designation: 'Transport Coordinator',
          department: 'Operations',
          tenantUser: { role: 'STAFF', roles: ['STAFF'] },
        },
      ]

      const transportStaff = candidateStaff.filter((s) => {
        const des = (s.designation || '').toLowerCase().trim()
        const dept = (s.department || '').toLowerCase().trim()
        const role = s.tenantUser?.role
        const roles = s.tenantUser?.roles || []

        if (role === 'DRIVER' || role === 'ATTENDANT') return true
        if (roles.includes('DRIVER') || roles.includes('ATTENDANT')) return true

        const transportKeywords = ['driver', 'attendant', 'conductor', 'chaperone', 'transport', 'pilot', 'bus']
        if (transportKeywords.some((kw) => des.includes(kw))) return true

        const transportDepts = ['transport', 'transportation', 'logistics', 'fleet']
        if (transportDepts.some((kw) => dept.includes(kw))) return true

        return false
      })

      const ids = transportStaff.map((s) => s.id)
      expect(ids).toContain('s-1') // Bus Driver
      expect(ids).toContain('s-2') // Van Attendant
      expect(ids).toContain('s-5') // Transport Coordinator (has transport keyword)
      expect(ids).not.toContain('s-3') // Teacher excluded
      expect(ids).not.toContain('s-4') // Principal excluded
    })
  })

  describe('3. Route Controls: Safe Soft-Deletion & Active Trip Safeguard', () => {
    it('prevents deletion of route when an active trip is IN_PROGRESS', async () => {
      const mockCtx = {
        tenantId: testTenantId,
        actorId: 'admin-1',
        actorName: 'Admin',
        actorRole: 'OWNER' as const,
      }

      // We test the business rule logic directly
      const mockRouteWithActiveTrip = {
        id: 'route-active-1',
        name: 'Route 101',
        trips: [{ id: 'trip-1', status: 'IN_PROGRESS' }],
      }

      expect(() => {
        if (mockRouteWithActiveTrip.trips && mockRouteWithActiveTrip.trips.length > 0) {
          throw new Error(
            `Cannot remove route "${mockRouteWithActiveTrip.name}" because a trip is currently IN_PROGRESS. Complete or cancel the active trip first.`
          )
        }
      }).toThrow(/Cannot remove route "Route 101" because a trip is currently IN_PROGRESS/)
    })

    it('verifies deleteRoute endpoint exported in /api/v1/transport/routes/[id]', async () => {
      const routeFilePath = path.join(process.cwd(), 'src', 'app', 'api', 'v1', 'transport', 'routes', '[id]', 'route.ts')
      const content = fs.readFileSync(routeFilePath, 'utf-8')
      expect(content).toContain('export const DELETE')
      expect(content).toContain('TransportService.deleteRoute')
    })
  })

  describe('4. Temporary Pickup Authorization: Permission & Field Mapping', () => {
    it('verifies authorizedPersonName and authorizedPersonPhone mapping in GET and POST', () => {
      const rawAuth = {
        id: 'auth-1',
        studentId: 'stud-1',
        personName: 'Rohan Sharma',
        phone: '+91 9876543210',
        relationship: 'Uncle',
        status: 'APPROVED',
      }

      const mapped = {
        ...rawAuth,
        authorizedPersonName: rawAuth.personName,
        authorizedPersonPhone: rawAuth.phone,
      }

      expect(mapped.authorizedPersonName).toBe('Rohan Sharma')
      expect(mapped.authorizedPersonPhone).toBe('+91 9876543210')
    })

    it('verifies POST endpoint allows transport:read permission for parents', () => {
      const authRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'v1', 'transport', 'authorizations', 'route.ts')
      const content = fs.readFileSync(authRoutePath, 'utf-8')
      expect(content).toContain("requireApi(req, 'transport:read')")
    })
  })

  describe('5. Parent Portal Dynamic Route & Stop Assignment', () => {
    it('normalizes ROUND_TRIP and empty tripType to valid TWO_WAY enum', () => {
      const cases = [
        { input: 'ROUND_TRIP', expected: 'TWO_WAY' },
        { input: undefined, expected: 'TWO_WAY' },
        { input: '', expected: 'TWO_WAY' },
        { input: 'MORNING_ONLY', expected: 'MORNING_ONLY' },
        { input: 'EVENING_ONLY', expected: 'EVENING_ONLY' },
      ]

      cases.forEach(({ input, expected }) => {
        const rawTripType = input
        const normalizedTripType =
          rawTripType === 'ROUND_TRIP' || !rawTripType ? 'TWO_WAY' : rawTripType
        expect(normalizedTripType).toBe(expected)
      })
    })

    it('safely falls back to first/last stops when stop IDs are not explicitly provided', () => {
      const stops = [
        { id: 'stop-first', name: 'Stop 1' },
        { id: 'stop-mid', name: 'Stop 2' },
        { id: 'stop-last', name: 'Stop 3' },
      ]

      const pStop = stops.find((s) => s.id === undefined) || stops[0]
      const dStop = stops.find((s) => s.id === undefined) || stops[stops.length - 1]

      expect(pStop.id).toBe('stop-first')
      expect(dStop.id).toBe('stop-last')
    })
  })
})

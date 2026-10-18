import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { StudentService } from '@/lib/students/student-service'
import {
  getStudentSafetySummary,
  SafetyAlertItem,
} from '@/lib/students/safety-alerts'
import { formatBloodGroup } from '@/lib/users/user-validation'

describe('Student Safety & Allergy Badges — Domain Engine & Service Integration', () => {
  describe('Safety & Allergy Parsing Engine (getStudentSafetySummary)', () => {
    it('handles student with null or empty safety records cleanly', () => {
      const summary = getStudentSafetySummary({
        bloodGroup: null,
        allergies: null,
        medicalAlerts: null,
        dietaryRestrictions: null,
      })

      expect(summary.hasAlerts).toBe(false)
      expect(summary.hasCriticalAlert).toBe(false)
      expect(summary.criticalCount).toBe(0)
      expect(summary.totalCount).toBe(0)
      expect(summary.alerts.length).toBe(0)
      expect(summary.bloodGroup).toBeNull()
      expect(summary.emergencyInstructions).toBeNull()
    })

    it('classifies severe peanut allergy and EpiPen as CRITICAL', () => {
      const summary = getStudentSafetySummary({
        bloodGroup: 'O_POSITIVE',
        allergies: 'Peanuts (Severe - EpiPen in classroom), Shellfish',
        emergencyMedicalInstructions: 'Administer EpiPen into outer thigh. Call 911 immediately.',
      })

      expect(summary.hasAlerts).toBe(true)
      expect(summary.hasCriticalAlert).toBe(true)
      expect(summary.criticalCount).toBeGreaterThanOrEqual(1)
      expect(summary.bloodGroup).toBe('O+')
      expect(summary.emergencyInstructions).toContain('EpiPen')

      const peanutAlert = summary.alerts.find((a) => a.label.toLowerCase().includes('peanut'))
      expect(peanutAlert).toBeDefined()
      expect(peanutAlert?.severity).toBe('CRITICAL')
      expect(peanutAlert?.isCritical).toBe(true)

      // CRITICAL alert should be first in priority list
      expect(summary.alerts[0].severity).toBe('CRITICAL')
    })

    it('classifies asthma and inhaler directives under medical alerts', () => {
      const summary = getStudentSafetySummary({
        medicalAlerts: 'Asthma - Inhaler before physical exercise',
      })

      expect(summary.hasAlerts).toBe(true)
      const asthmaAlert = summary.alerts.find((a) => a.label.toLowerCase().includes('asthma'))
      expect(asthmaAlert).toBeDefined()
      expect(asthmaAlert?.type).toBe('MEDICAL')
      expect(asthmaAlert?.isCritical).toBe(true)
    })

    it('classifies dietary restrictions with proper tagging', () => {
      const summary = getStudentSafetySummary({
        dietaryRestrictions: 'Lactose intolerant, No pork (Halal)',
      })

      expect(summary.hasAlerts).toBe(true)
      expect(summary.alerts.length).toBe(2)
      expect(summary.alerts.every((a) => a.type === 'DIETARY')).toBe(true)
      expect(summary.alerts.some((a) => a.label.includes('Lactose'))).toBe(true)
    })

    it('sorts multiple mixed alerts with CRITICAL items first', () => {
      const summary = getStudentSafetySummary({
        dietaryRestrictions: 'Vegetarian',
        medicalAlerts: 'Mild seasonal eczema',
        allergies: 'Tree Nuts (Severe anaphylaxis)',
      })

      expect(summary.alerts.length).toBe(3)
      // Severe anaphylaxis must be first
      expect(summary.alerts[0].label).toContain('Tree Nuts')
      expect(summary.alerts[0].severity).toBe('CRITICAL')
    })

    it('correctly formats various blood group representations', () => {
      expect(formatBloodGroup('A_POSITIVE')).toBe('A+')
      expect(formatBloodGroup('A_NEGATIVE')).toBe('A-')
      expect(formatBloodGroup('B_POSITIVE')).toBe('B+')
      expect(formatBloodGroup('B_NEGATIVE')).toBe('B-')
      expect(formatBloodGroup('AB_POSITIVE')).toBe('AB+')
      expect(formatBloodGroup('AB_NEGATIVE')).toBe('AB-')
      expect(formatBloodGroup('O_POSITIVE')).toBe('O+')
      expect(formatBloodGroup('O_NEGATIVE')).toBe('O-')
    })

    it('handles nested health sub-object seamlessly', () => {
      const summary = getStudentSafetySummary({
        health: {
          bloodGroup: 'B_POSITIVE',
          allergies: 'Eggs, Dairy',
          medicalAlerts: 'Febrile convulsions history',
          emergencyMedicalInstructions: 'Monitor fever above 101F. Contact parents.',
        },
      })

      expect(summary.hasAlerts).toBe(true)
      expect(summary.bloodGroup).toBe('B+')
      expect(summary.emergencyInstructions).toContain('101F')
      expect(summary.alerts.length).toBe(3)
    })
  })

  describe('Database & StudentService.listStudents Health Contract', () => {
    let tenant: any
    let branch: any
    let session: any
    let teacherUser: any
    let classroom: any
    let studentWithAllergies: any
    let studentHealthy: any

    const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    beforeAll(async () => {
      tenant = await db.tenant.create({
        data: {
          name: `Safety Test School ${ts}`,
          code: `SFT-${ts.slice(-4)}`,
          status: 'ACTIVE',
        },
      })

      branch = await db.branch.create({
        data: {
          tenantId: tenant.id,
          name: `PreOne Main Campus ${ts}`,
          code: `M-${ts.slice(-3)}`,
          isMain: true,
          isActive: true,
        },
      })

      session = await db.academicSession.create({
        data: {
          tenantId: tenant.id,
          name: `2026-2027 ${ts}`,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-04-30'),
          isCurrent: true,
        },
      })

      teacherUser = await db.user.create({
        data: {
          email: `teacher_safety_${ts}@preone.test`,
          username: `teacher_safety_${ts}`,
          fullName: 'Ms. Lead Educator',
          status: 'ACTIVE',
          passwordHash: '$2b$10$hashedtestpasswordstringhere',
        },
      })

      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: teacherUser.id,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      })

      classroom = await db.classroom.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: session.id,
          name: `Butterfly Toddlers ${ts}`,
          code: `BT-${ts.slice(-3)}`,
          programType: 'PLAYGROUP',
          capacity: 15,
          primaryTeacherId: teacherUser.id,
        },
      })

      studentWithAllergies = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          admissionNo: `ADM-SFT-01-${ts}`,
          firstName: 'Aarav',
          lastName: 'Sharma',
          dob: new Date('2023-02-15'),
          gender: 'MALE',
          status: 'ACTIVE',
          bloodGroup: 'O_POSITIVE',
          allergies: 'Peanuts (Severe Anaphylaxis), Cow Milk',
          medicalAlerts: 'Asthma - Carry Ventolin Inhaler',
          dietaryRestrictions: 'Strictly Vegetarian, No Nuts',
          emergencyMedicalInstructions: 'Inject EpiPen 0.15mg in right thigh immediately upon allergen ingestion. Call ambulance 108.',
          currentClassroomId: classroom.id,
        },
      })

      studentHealthy = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          admissionNo: `ADM-SFT-02-${ts}`,
          firstName: 'Riya',
          lastName: 'Verma',
          dob: new Date('2023-05-10'),
          gender: 'FEMALE',
          status: 'ACTIVE',
          bloodGroup: 'B_POSITIVE',
          currentClassroomId: classroom.id,
        },
      })
    })

    it('listStudents returns authoritative health payload for each student in batch query', async () => {
      const result = await StudentService.listStudents(
        { tenantId: tenant.id, branchId: branch.id, academicSessionId: session.id },
        { classroomId: classroom.id },
        { page: 1, pageSize: 10 }
      )

      expect(result.data.length).toBe(2)

      const aarav = result.data.find((s: any) => s.id === studentWithAllergies.id)
      expect(aarav).toBeDefined()
      expect(aarav.bloodGroup).toBe('O_POSITIVE')
      expect(aarav.allergies).toContain('Peanuts')
      expect(aarav.medicalAlerts).toContain('Asthma')
      expect(aarav.dietaryRestrictions).toContain('Vegetarian')
      expect(aarav.emergencyMedicalInstructions).toContain('EpiPen')

      // Verify nested health sub-object is populated
      expect(aarav.health).toBeDefined()
      expect(aarav.health.bloodGroup).toBe('O_POSITIVE')
      expect(aarav.health.allergies).toContain('Peanuts')
      expect(aarav.health.emergencyMedicalInstructions).toContain('EpiPen')

      // Verify healthy student has null alerts
      const riya = result.data.find((s: any) => s.id === studentHealthy.id)
      expect(riya).toBeDefined()
      expect(riya.bloodGroup).toBe('B_POSITIVE')
      expect(riya.allergies).toBeNull()
      expect(riya.health.allergies).toBeNull()
    })

    it('parses summary correctly directly from listStudents result', async () => {
      const result = await StudentService.listStudents(
        { tenantId: tenant.id, branchId: branch.id, academicSessionId: session.id },
        { classroomId: classroom.id },
        { page: 1, pageSize: 10 }
      )

      const aarav = result.data.find((s: any) => s.id === studentWithAllergies.id)
      const summary = getStudentSafetySummary(aarav)

      expect(summary.hasAlerts).toBe(true)
      expect(summary.hasCriticalAlert).toBe(true)
      expect(summary.bloodGroup).toBe('O+')
      expect(summary.primaryCriticalLabel).toContain('Peanuts')
      expect(summary.alerts.length).toBeGreaterThanOrEqual(4)
    })

    it('enforces RBAC: teacher only receives students assigned to their classroom', async () => {
      // Create a separate unassigned classroom with another child
      const otherClassroom = await db.classroom.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: session.id,
          name: `Unrelated Class ${ts}`,
          code: `UC-${ts.slice(-3)}`,
          programType: 'PLAYGROUP',
          capacity: 10,
        },
      })

      const otherStudent = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          admissionNo: `ADM-OTHER-${ts}`,
          firstName: 'Kabir',
          dob: new Date('2023-01-01'),
          gender: 'MALE',
          currentClassroomId: otherClassroom.id,
        },
      })

      // Query as teacher
      const teacherResult = await StudentService.listStudents(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          actorId: teacherUser.id,
          actorRole: 'TEACHER',
        },
        {},
        { page: 1, pageSize: 20 }
      )

      // Teacher should only receive their 2 assigned students
      const foundOther = teacherResult.data.find((s: any) => s.id === otherStudent.id)
      expect(foundOther).toBeUndefined()
      expect(teacherResult.data.length).toBe(2)
      expect(teacherResult.data.every((s: any) => s.classroom?.id === classroom.id)).toBe(true)
    })
  })
})

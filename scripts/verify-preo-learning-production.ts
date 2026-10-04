/**
 * Verification test suite for PreO Learning Module Hardening & Redesign
 */
import { AcademicService } from '../src/lib/academics/academic-service'
import { db } from '../src/lib/db'

async function runTests() {
  console.log('================================================================')
  console.log('🧪 PreOne — PreO Learning Production Verification Suite')
  console.log('================================================================')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${message}`)
      failed++
    }
  }

  try {
    // 1. Find a test tenant and user
    const tenant = await db.tenant.findFirst()
    if (!tenant) {
      console.log('⚠️ Skipping DB tests: No tenant found in current database')
      return
    }

    const branch = await db.branch.findFirst({ where: { tenantId: tenant.id } })
    const user = await db.user.findFirst({ where: { memberships: { some: { tenantId: tenant.id } } } })
    const academicSession = await db.academicSession.findFirst({ where: { tenantId: tenant.id } })
    const classroom = await db.classroom.findFirst({ where: { tenantId: tenant.id } })
    const student = await db.student.findFirst({ where: { tenantId: tenant.id } })

    const ctx = {
      tenantId: tenant.id,
      branchId: branch?.id,
      academicSessionId: academicSession?.id,
      actorId: user?.id || 'system-verifier',
      actorName: user?.name || 'Verifier',
      actorRole: user?.role || 'SUPER_ADMIN',
    }

    console.log('\n▶ [1/4] Testing Curriculum Seeding & Idempotency...')
    const curriculum1 = await AcademicService.createCurriculum(ctx, {
      name: 'EYFS Early Childhood Milestone Framework (Test)',
      code: 'EYFS-TEST',
      seedStandardAreas: true,
    })

    assert(Boolean(curriculum1 && curriculum1.id), 'Curriculum created successfully')
    assert(curriculum1.learningAreas && curriculum1.learningAreas.length >= 6, `Curriculum has 6 early childhood domains (got ${curriculum1.learningAreas?.length})`)

    const totalGoals = curriculum1.learningAreas?.reduce((sum, a) => sum + (a.goals?.length || 0), 0) || 0
    assert(totalGoals >= 18, `Curriculum has at least 18 milestone goals (got ${totalGoals})`)

    // Test Idempotency: calling again should not duplicate
    const curriculum2 = await AcademicService.createCurriculum(ctx, {
      name: 'EYFS Early Childhood Milestone Framework (Test)',
      code: 'EYFS-TEST',
      seedStandardAreas: true,
    })
    assert(curriculum2.id === curriculum1.id, 'Idempotent seeding: Returns existing active curriculum without duplicating')

    console.log('\n▶ [2/4] Testing Multi-Format Preschool Activities...')
    if (classroom) {
      const activity = await AcademicService.createActivity(ctx, {
        classroomId: classroom.id,
        title: 'Morning Circle Time Rhymes',
        activityType: 'RHYME',
        activityDate: new Date(),
        curriculumId: curriculum1.id,
        learningGoalId: curriculum1.learningAreas?.[0]?.goals?.[0]?.id,
        description: 'Singing phonics and movement rhymes together in circle time',
        materials: ['Chime bell', 'Rhyme cards'],
        expectedOutcome: 'Participation in rhyming cadence',
      })

      assert(Boolean(activity && activity.id), 'Preschool activity created with type RHYME')
      assert(activity.activityType === 'RHYME', `Activity preserved activityType="RHYME" (got ${activity.activityType})`)

      const filtered = await AcademicService.listActivities(ctx, {
        classroomId: classroom.id,
        activityType: 'RHYME',
      })
      assert(filtered.some(a => a.id === activity.id), 'listActivities filters correctly by activityType')
    } else {
      console.log('⚠️ Skipping activity test: No classroom in current database')
    }

    console.log('\n▶ [3/4] Testing Milestone Stage Progression & Domain Mastery...')
    if (student && curriculum1.learningAreas?.[0]?.goals?.[0]) {
      const goal = curriculum1.learningAreas[0].goals[0]
      const progress = await AcademicService.updateStudentProgress(ctx, student.id, {
        learningGoalId: goal.id,
        stage: 'ACHIEVED',
        notes: 'Demonstrated complete mastery during morning play.',
      })

      assert(Boolean(progress && progress.id), 'Milestone progress recorded')
      assert(progress.stage === 'ACHIEVED', 'Milestone stage updated to ACHIEVED')

      const progressData = await AcademicService.getStudentProgress(ctx, student.id)
      console.log('progressData learningAreas count:', progressData.learningAreas?.length)
      if (progressData.learningAreas?.length) {
        console.log('Sample area:', JSON.stringify(progressData.learningAreas[0]))
      }
      assert(Boolean(progressData && progressData.student), 'Student progress summary generated')
      const firstAreaMastery = progressData.learningAreas?.[0]?.masteryPercentage
      assert(typeof firstAreaMastery === 'number', `Calculated valid domain mastery percentage (got ${firstAreaMastery}%)`)
    } else {
      console.log('⚠️ Skipping milestone matrix test: No student or goal available')
    }

    console.log('\n▶ [4/4] Testing Formative Observation Journal...')
    if (student) {
      try {
        const res = await AcademicService.recordObservation(ctx, {
          studentId: student.id,
          narrative: 'Observed child engaging warmly with peer sharing building blocks.',
          publishToTimeline: true,
        })
        const obs = res.observation || res

        assert(Boolean(obs && obs.id), 'Formative observation recorded')
        assert(obs.status === 'PUBLISHED', 'Observation marked as PUBLISHED for parent timeline')
      } catch (e: any) {
        console.error('Error in recordObservation:', e)
        assert(false, `recordObservation threw: ${e.message}`)
      }
    } else {
      console.log('⚠️ Skipping observation test: No student available')
    }

  } catch (err: any) {
    console.error('Unexpected test error:', err)
    failed++
  }

  console.log('\n================================================================')
  console.log(`Test Execution Finished: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().then(() => process.exit(0)).catch(() => process.exit(1))

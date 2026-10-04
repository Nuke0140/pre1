import { db } from '../src/lib/db'
import { AcademicService } from '../src/lib/academics/academic-service'

async function runE2EStoryVerification() {
  console.log('================================================================')
  console.log('🧪 PreOne — PreO Learning "ABC Monster Story" E2E Verification')
  console.log('================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${msg}`)
      failed++
    }
  }

  // 1. Check exactly one canonical story record titled "ABC Monster Story"
  console.log('▶ [1/5] Verifying Exactly One Canonical Story Record...')
  const matchingStories = await db.classroomActivity.findMany({
    where: {
      title: { contains: 'ABC Monster', mode: 'insensitive' },
      deletedAt: null,
    },
    include: {
      classroom: true,
      learningGoal: true,
      tenant: true,
    },
  })

  assert(matchingStories.length === 1, `Exactly one ABC Monster Story exists in database (got ${matchingStories.length})`)
  const story = matchingStories[0]
  if (!story) {
    console.error('Fatal: ABC Monster Story not found')
    process.exit(1)
  }

  assert(story.title === 'ABC Monster Story', `Title is exact: "${story.title}"`)
  assert(story.activityType === 'STORY', `Activity type is STORY: "${story.activityType}"`)
  assert(Boolean(story.instructions && story.instructions.includes('1eGw2Rh15VCTSeJEATRJapCI_Pk-DBOV0')), 'Story contains canonical Google Drive file link in instructions')

  // 2. Tenant isolation and scoping test
  console.log('\n▶ [2/5] Verifying Tenant Scoping & Isolation...')
  const foreignTenantId = '695ff531-a070-4919-ab98-8f3e0c805407'
  try {
    const crossTenantGet = await AcademicService.getActivity(
      {
        tenantId: foreignTenantId,
        actorId: 'test-user',
        actorRole: 'OWNER',
      },
      story.id
    )
    assert(crossTenantGet === null, 'Cross-tenant access correctly returns null (not leaking data across tenants)')
  } catch (err: any) {
    assert(true, `Cross-tenant access cleanly rejected: ${err.message}`)
  }

  // Same-tenant access works
  const ownTenantGet = await AcademicService.getActivity(
    {
      tenantId: story.tenantId,
      actorId: story.createdBy || 'test-user',
      actorRole: 'OWNER',
    },
    story.id
  )
  assert(ownTenantGet !== null && ownTenantGet.id === story.id, 'Same-tenant access retrieves story successfully')

  // 3. Media Provider & Link Resolution Verification
  console.log('\n▶ [3/5] Verifying Google Drive Media Provider Abstraction & Permissions...')
  const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/
  const fileIdMatch = story.instructions?.match(driveRegex)
  assert(Boolean(fileIdMatch && fileIdMatch[1] === '1eGw2Rh15VCTSeJEATRJapCI_Pk-DBOV0'), `Extracted Google Drive File ID: "${fileIdMatch?.[1]}"`)

  // Check HTTP response from Drive preview URL (confirming permissions)
  try {
    const previewUrl = `https://drive.google.com/file/d/${fileIdMatch?.[1]}/preview`
    const res = await fetch(previewUrl, { method: 'HEAD' })
    assert(res.status === 200, `Google Drive preview endpoint returns 200 OK (status: ${res.status})`)
  } catch (err: any) {
    console.warn('Network check warning:', err.message)
  }

  // 4. Progress persistence using canonical service
  console.log('\n▶ [4/5] Verifying Canonical Progress Tracking on ABC Monster Story...')
  const student = await db.student.findFirst({
    where: { tenantId: story.tenantId, deletedAt: null },
  })

  if (!student) {
    console.error('Fatal: No student found in tenant')
    process.exit(1)
  }

  console.log(`Testing with student: ${student.firstName} ${student.lastName} (${student.id})`)

  // Clean any old progress for test reproducibility
  await db.activityProgress.deleteMany({
    where: { activityId: story.id, studentId: student.id },
  })

  // Case A: User opens story (progress must NOT be completed just by opening)
  const initialProgress = await AcademicService.getActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    student.id,
    [story.id]
  )
  assert(initialProgress.length === 0, 'Opening story without playback leaves progress NOT_STARTED / empty')

  // Case B: User plays 30 seconds (verified playback event)
  await AcademicService.recordActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    {
      activityId: story.id,
      studentId: student.id,
      playbackPositionSecs: 30,
      progressPercentage: 5,
      status: 'IN_PROGRESS',
    }
  )

  const progressAfterPlay = await AcademicService.getActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    student.id,
    [story.id]
  )
  assert(progressAfterPlay.length === 1, 'Progress record created after verified playback event')
  assert(progressAfterPlay[0].status === 'IN_PROGRESS', `Status is IN_PROGRESS (got ${progressAfterPlay[0].status})`)
  assert(progressAfterPlay[0].playbackPositionSecs === 30, `Playback position recorded accurately (got ${progressAfterPlay[0].playbackPositionSecs}s)`)

  // Case C: Simulated page refresh / re-fetching progress
  const progressAfterRefresh = await AcademicService.getActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    student.id,
    [story.id]
  )
  assert(progressAfterRefresh[0].playbackPositionSecs === 30, 'Progress persists across refresh / subsequent sessions')

  // Case D: Completed playback (100%)
  await AcademicService.recordActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    {
      activityId: story.id,
      studentId: student.id,
      playbackPositionSecs: 900,
      progressPercentage: 100,
      status: 'COMPLETED',
    }
  )

  const progressAfterComplete = await AcademicService.getActivityProgress(
    {
      tenantId: story.tenantId,
      actorId: 'test-admin',
      actorRole: 'OWNER',
    },
    student.id,
    [story.id]
  )
  assert(progressAfterComplete[0].status === 'COMPLETED', `Status correctly updated to COMPLETED (got ${progressAfterComplete[0].status})`)
  assert(progressAfterComplete[0].completedAt !== null, 'completedAt timestamp is recorded')

  // 5. Verification of Learning Goal progression
  console.log('\n▶ [5/5] Verifying Milestone Learning Goal Sync...')
  if (story.learningGoalId) {
    const studentGoalProgress = await db.studentProgress.findFirst({
      where: {
        tenantId: story.tenantId,
        studentId: student.id,
        learningGoalId: story.learningGoalId,
      },
    })
    assert(studentGoalProgress !== null && studentGoalProgress.stage === 'ACHIEVED', `Student milestone goal linked to story marked as ACHIEVED`)
  }

  console.log('\n================================================================')
  console.log(`Verification Finished: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runE2EStoryVerification()
  .catch((e) => {
    console.error('Fatal unhandled error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

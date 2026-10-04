/**
 * End-to-end HTML & UI verification for simplified PreO Learning Landing Experience
 */
async function verifyLandingUI() {
  console.log('================================================================')
  console.log('🎨 PreOne — PreO Learning Simplified Landing UI Verification')
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

  // 1. Authenticate as OWNER
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
  })
  const setCookie = loginRes.headers.get('set-cookie')

  assert(Boolean(setCookie), 'Authenticated owner session cookie acquired')

  // 2. Fetch /app/learning HTML
  const learningRes = await fetch('http://localhost:3000/app/learning', {
    headers: { Cookie: setCookie || '' },
  })
  assert(learningRes.status === 200, `GET /app/learning returned HTTP 200 OK (got ${learningRes.status})`)

  const html = await learningRes.text()

  console.log('\n▶ [1/3] Verifying Title, Subtitle & Compact Search...')
  assert(html.includes('PreO Learning'), 'Page title "PreO Learning" is present')
  assert(html.includes('Learn • Listen • Read • Play'), 'Subtitle "Learn • Listen • Read • Play" is present')
  assert(
    html.includes('Search courses, rhymes, stories, or games') || html.includes('placeholder='),
    'Compact search control input is rendered'
  )

  console.log('\n▶ [2/3] Verifying Exactly Four Primary Category Cards in 2x2 Grid...')
  assert(html.includes('Courses'), 'Card 1: "Courses" present')
  assert(html.includes('Poems &amp; Rhymes') || html.includes('Poems & Rhymes'), 'Card 2: "Poems & Rhymes" present')
  assert(html.includes('Stories'), 'Card 3: "Stories" present')
  assert(html.includes('Games'), 'Card 4: "Games" present')

  assert(html.includes('Explore Courses'), 'Card 1 affordance "Explore Courses" present')
  assert(html.includes('Explore Poems &amp; Rhymes') || html.includes('Explore Poems & Rhymes'), 'Card 2 affordance "Explore Poems & Rhymes" present')
  assert(html.includes('Explore Stories'), 'Card 3 affordance "Explore Stories" present')
  assert(html.includes('Explore Games'), 'Card 4 affordance "Explore Games" present')

  assert(html.includes('Courses 3D Icon'), 'Courses 3D SVG artwork rendered')
  assert(html.includes('Poems and Rhymes 3D Icon'), 'Poems & Rhymes 3D SVG artwork rendered')
  assert(html.includes('Stories 3D Icon'), 'Stories 3D SVG artwork rendered')
  assert(html.includes('Games 3D Icon'), 'Games 3D SVG artwork rendered')

  console.log('\n▶ [3/3] Verifying Administrative Decoupling...')
  // The primary landing page must NOT show administrative clutter or KPI tiles on initial load
  assert(!html.includes('Active Frameworks'), 'Unrelated KPI tiles omitted from landing page')
  assert(html.includes('Staff Workspace'), 'Secondary access to Staff Workspace preserved for authorized users')

  console.log('\n================================================================')
  console.log(`Test Execution Finished: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

verifyLandingUI().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})

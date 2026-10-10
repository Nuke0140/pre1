import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Breadcrumbs, Crumb } from '../src/components/preone/Breadcrumbs'
import { PageHead } from '../src/components/preone/ui'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`)
    throw new Error(message)
  }
  console.log(`  ✓ PASS: ${message}`)
}

async function runTests() {
  console.log('======================================================================')
  console.log('   PREONE GLOBAL BREADCRUMB DESIGN SYSTEM VERIFICATION SUITE')
  console.log('======================================================================\n')

  // TEST 1: Home only
  console.log('[TEST 1] Single item: Home only')
  const html1 = renderToStaticMarkup(<Breadcrumbs items={[{ label: 'Home', href: '/app' }]} />)
  assert(html1.includes('aria-label="Breadcrumb"'), 'Nav has aria-label="Breadcrumb"')
  assert(html1.includes('Home'), 'Renders Home label')
  assert(html1.includes('bc-home-icon'), 'Includes default Lucide Home icon for root')
  assert(html1.includes('aria-current="page"'), 'Single item has aria-current="page"')
  assert(!html1.includes('bc-sep'), 'No separator rendered for single item')

  // TEST 2: Home + current page
  console.log('\n[TEST 2] Two items: Home + current page')
  const html2 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: 'Users & Access' },
      ]}
    />
  )
  assert(html2.includes('href="/app"'), 'Home item is a clickable link to /app')
  assert(html2.includes('bc-sep'), 'Separator exists between items')
  assert(html2.includes('aria-hidden="true"'), 'Separator has aria-hidden="true"')
  assert(html2.includes('Users &amp; Access') || html2.includes('Users & Access'), 'Current page label is rendered')
  assert(html2.includes('bc-current'), 'Current page has bc-current class')
  assert(html2.includes('aria-current="page"'), 'Current page has aria-current="page"')

  // TEST 3: Home + parent + current page
  console.log('\n[TEST 3] Three items: Home + parent + current page')
  const html3 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: 'Users & Access', href: '/app/users' },
        { label: 'Staff Users' },
      ]}
    />
  )
  assert(html3.includes('href="/app"'), 'Root Home links to /app')
  assert(html3.includes('href="/app/users"'), 'Parent Users & Access links to /app/users')
  assert(html3.includes('Staff Users'), 'Staff Users is rendered as current page')
  // Count separators (should be exactly 2)
  const sepCount = (html3.match(/class="bc-sep"/g) || []).length
  assert(sepCount === 2, `Expected 2 separators, got ${sepCount}`)

  // TEST 4: Clickable parent state & styling classes
  console.log('\n[TEST 4] Parent breadcrumb clickable attributes')
  assert(html3.includes('class="bc-link"'), 'Clickable items have bc-link class')
  assert(html3.includes('class="bc-item bc-item-root"'), 'Root item has bc-item-root class for subtle styling')

  // TEST 5: Current page accessibility & non-clickable
  console.log('\n[TEST 5] Current page is non-clickable with aria-current="page"')
  const staffMatch = html3.match(/<span class="bc-current[^"]*" aria-current="page"[^>]*>.*?Staff Users.*?<\/span>/)
  assert(!!staffMatch, 'Current item is rendered as non-clickable span with aria-current="page"')
  assert(!html3.includes('href="/app/users/staff"'), 'Current item does not contain link')

  // TEST 6: Decorative separator aria-hidden
  console.log('\n[TEST 6] Separators are decorative with aria-hidden="true"')
  assert(html3.includes('aria-hidden="true"'), 'Separators correctly flagged with aria-hidden="true"')

  // TEST 7: Long labels and title attributes
  console.log('\n[TEST 7] Long labels with truncation and accessible title attribute')
  const longLabel = 'Staff User Permissions and Comprehensive Role Security Configuration Matrix'
  const html7 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: longLabel },
      ]}
    />
  )
  assert(html7.includes('class="bc-label"'), 'Labels wrapped in bc-label class for ellipsis truncation')
  assert(html7.includes(`title="${longLabel}"`), 'Full label preserved in title attribute for accessibility')

  // TEST 8: Long breadcrumb collapsing (> 4 items)
  console.log('\n[TEST 8] Automatic collapsing of intermediate items when items > maxItems')
  const html8 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: 'Admissions', href: '/app/admissions' },
        { label: 'Students', href: '/app/students' },
        { label: 'Student Profile', href: '/app/students/123' },
        { label: 'Documents' },
      ]}
      maxItems={4}
    />
  )
  assert(html8.includes('bc-collapsed-btn'), 'Collapsed button rendered for intermediate crumbs')
  assert(html8.includes('aria-label="Show 2 hidden breadcrumb items"'), 'Accessible label describes hidden items count')
  assert(html8.includes('Home'), 'Preserves root Home crumb')
  assert(html8.includes('Student Profile'), 'Preserves nearest parent crumb')
  assert(html8.includes('Documents'), 'Preserves current page crumb')
  assert(!html8.includes('href="/app/admissions"'), 'Intermediary admissions link is collapsed')

  // TEST 9: Dynamic entity breadcrumbs
  console.log('\n[TEST 9] Dynamic entity breadcrumbs (e.g. Student Name)')
  const studentName = 'Aarav Patil'
  const html9 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: 'Students', href: '/app/students' },
        { label: studentName },
      ]}
    />
  )
  assert(html9.includes(studentName), `Rendered dynamic student name: ${studentName}`)
  assert(html9.includes('href="/app/students"'), 'Parent Students links to /app/students')

  // TEST 10: showHomeIcon customization
  console.log('\n[TEST 10] Customizing or disabling Home icon')
  const html10 = renderToStaticMarkup(
    <Breadcrumbs
      items={[{ label: 'Home', href: '/app' }, { label: 'Settings' }]}
      showHomeIcon={false}
    />
  )
  assert(!html10.includes('bc-home-icon'), 'Home icon omitted when showHomeIcon={false}')

  // TEST 11: Compact mode
  console.log('\n[TEST 11] Compact mode support')
  const html11 = renderToStaticMarkup(
    <Breadcrumbs
      compact
      items={[{ label: 'Home', href: '/app' }, { label: 'Compact Page' }]}
    />
  )
  assert(html11.includes('bc-compact'), 'Applies bc-compact class to nav')

  // TEST 12: Empty items edge case
  console.log('\n[TEST 12] Empty breadcrumbs array handling')
  const html12 = renderToStaticMarkup(<Breadcrumbs items={[]} />)
  assert(html12 === '', 'Empty items array returns empty string/null')

  // TEST 13: PageHead integration with breadcrumbs prop
  console.log('\n[TEST 13] PageHead integration with breadcrumbs prop')
  const html13 = renderToStaticMarkup(
    <PageHead
      title="Staff Directory"
      sub="Manage school educators and administrators"
      breadcrumbs={[
        { label: 'Home', href: '/app' },
        { label: 'Users & Access', href: '/app/users' },
        { label: 'Staff Users' },
      ]}
    />
  )
  assert(html13.includes('page-head-breadcrumbs'), 'PageHead renders page-head-breadcrumbs container')
  assert(html13.includes('aria-label="Breadcrumb"'), 'Breadcrumbs nav rendered inside PageHead')
  assert(html13.includes('Staff Directory'), 'Page title rendered below breadcrumbs')

  // TEST 14: Custom icon support on Crumb
  console.log('\n[TEST 14] Custom icon support on individual Crumb')
  const html14 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'School', href: '/app', icon: <span className="custom-school-icon">🏫</span> },
        { label: 'Campus' },
      ]}
    />
  )
  assert(html14.includes('custom-school-icon'), 'Custom icon rendered on Crumb')

  // TEST 15: onClick handler support for in-app tab/view switching
  console.log('\n[TEST 15] Click handler support on Crumb')
  const html15 = renderToStaticMarkup(
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/app' },
        { label: 'Library', onClick: () => {} },
        { label: 'Activity Details' },
      ]}
    />
  )
  assert(html15.includes('bc-btn-link'), 'Button rendered for non-href crumb with onClick')
  assert(html15.includes('Library'), 'Library crumb rendered')

  console.log('\n======================================================================')
  console.log('   ALL 15 BREADCRUMB DESIGN SYSTEM TESTS PASSED SUCCESSFULLY! ✓')
  console.log('======================================================================\n')
}

runTests().catch((err) => {
  console.error('Test suite failed:', err)
  process.exit(1)
})

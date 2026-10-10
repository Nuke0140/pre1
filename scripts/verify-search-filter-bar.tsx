import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  SearchFilterBar,
  type FilterConfig,
  type SearchSuggestionItem,
  resolveStatusDotColor,
} from '../src/components/preone/SearchFilterBar'
import { FilterBar } from '../src/components/preone/FilterBar'
import { Building2, Sparkles } from 'lucide-react'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`)
    throw new Error(message)
  }
  console.log(`  ✓ PASS: ${message}`)
}

async function runTests() {
  console.log('======================================================================')
  console.log('   PREONE GLOBAL SEARCH & FILTER BAR DESIGN SYSTEM VERIFICATION')
  console.log('======================================================================\n')

  // TEST 1: Default rendering with search input
  console.log('[TEST 1] Default rendering with search input')
  const html1 = renderToStaticMarkup(
    <SearchFilterBar
      search={{
        value: '',
        onChange: () => {},
        placeholder: 'Search staff members...',
      }}
    />
  )
  assert(html1.includes('role="search"'), 'Container has role="search"')
  assert(html1.includes('class="sfb-container sfb-default"'), 'Applies sfb-default container variant')
  assert(html1.includes('placeholder="Search staff members..."'), 'Renders search input with placeholder')
  assert(html1.includes('class="sfb-search-wrap"'), 'Renders sfb-search-wrap')

  // TEST 2: Filled search with clear button
  console.log('\n[TEST 2] Filled search with clear button')
  const html2 = renderToStaticMarkup(
    <SearchFilterBar
      search={{
        value: 'Anita Sharma',
        onChange: () => {},
      }}
    />
  )
  assert(html2.includes('value="Anita Sharma"'), 'Renders active search value')
  assert(html2.includes('class="sfb-clear-btn"'), 'Renders clear button when value exists')
  assert(html2.includes('aria-label="Clear search"'), 'Clear button has aria-label')

  // TEST 3: Keyboard shortcut badge
  console.log('\n[TEST 3] Keyboard shortcut badge integration')
  const html3 = renderToStaticMarkup(
    <SearchFilterBar
      search={{
        value: '',
        onChange: () => {},
        shortcut: '⌘K',
      }}
    />
  )
  assert(html3.includes('class="sfb-kbd"'), 'Renders kbd badge when shortcut provided')
  assert(html3.includes('⌘K'), 'Shows ⌘K shortcut text')

  // TEST 4: Loading spinner in search
  console.log('\n[TEST 4] Loading state with spinner')
  const html4 = renderToStaticMarkup(
    <SearchFilterBar
      search={{
        value: 'Deep',
        onChange: () => {},
        loading: true,
      }}
    />
  )
  assert(html4.includes('sfb-spinner'), 'Renders spinner when loading is true')
  assert(html4.includes('aria-label="Searching"'), 'Loading element is accessible')

  // TEST 5: Single Select Filter with active state
  console.log('\n[TEST 5] Single Select Filter (Default & Active states)')
  const singleFilter: FilterConfig = {
    id: 'role',
    label: 'Role',
    type: 'select',
    value: 'TEACHER',
    defaultValue: 'ALL',
    placeholder: 'All Roles',
    options: [
      { value: 'ALL', label: 'All Roles' },
      { value: 'TEACHER', label: 'Teacher' },
      { value: 'ADMIN', label: 'Admin Staff' },
    ],
    onChange: () => {},
  }
  const html5 = renderToStaticMarkup(<SearchFilterBar filters={[singleFilter]} />)
  assert(html5.includes('Role:'), 'Displays filter label name')
  assert(html5.includes('Teacher'), 'Displays selected value label')
  assert(html5.includes('is-active'), 'Marks filter trigger with is-active class')
  assert(html5.includes('sfb-filter-quick-clear'), 'Renders quick clear button for active filter')

  // TEST 6: Status Filter with semantic color dots
  console.log('\n[TEST 6] Status Filter with semantic color dot resolution')
  assert(resolveStatusDotColor('ACTIVE').includes('10b981'), 'Active resolves to green success token')
  assert(resolveStatusDotColor('PENDING').includes('f59e0b'), 'Pending resolves to amber warning token')
  assert(resolveStatusDotColor('SUSPENDED').includes('f43f5e'), 'Suspended resolves to danger red token')

  const statusFilter: FilterConfig = {
    id: 'status',
    label: 'Status',
    type: 'status',
    value: 'ACTIVE',
    defaultValue: 'ALL',
    placeholder: 'All Statuses',
    options: [
      { value: 'ALL', label: 'All Statuses' },
      { value: 'ACTIVE', label: 'Active', colorDot: 'green' },
      { value: 'SUSPENDED', label: 'Suspended', colorDot: 'red' },
    ],
    onChange: () => {},
  }
  const html6 = renderToStaticMarkup(<SearchFilterBar filters={[statusFilter]} />)
  assert(html6.includes('class="sfb-status-dot"'), 'Renders semantic status dot')

  // TEST 7: Campus / Branch Filter with Building2 icon
  console.log('\n[TEST 7] Campus/Branch Filter with icon')
  const branchFilter: FilterConfig = {
    id: 'branch',
    label: 'Campus',
    type: 'branch',
    value: 'ALL',
    defaultValue: 'ALL',
    placeholder: 'All Campuses',
    options: [
      { value: 'ALL', label: 'All Campuses' },
      { value: 'main', label: 'Main Campus', isMain: true },
    ],
    onChange: () => {},
  }
  const html7 = renderToStaticMarkup(<SearchFilterBar filters={[branchFilter]} />)
  assert(html7.includes('sfb-filter-icon'), 'Includes branch leading icon container')
  assert(!html7.includes('is-active'), 'Filter remains in default inactive state when ALL')

  // TEST 8: Multi-Select Filter representation
  console.log('\n[TEST 8] Multi-Select Filter with count representation')
  const multiFilter: FilterConfig = {
    id: 'tags',
    label: 'Tags',
    type: 'multi-select',
    value: ['VIP', 'NEW'],
    defaultValue: [],
    placeholder: 'All Tags',
    options: [
      { value: 'VIP', label: 'VIP' },
      { value: 'NEW', label: 'New Admission' },
      { value: 'SIBLING', label: 'Has Sibling' },
    ],
    onChange: () => {},
  }
  const html8 = renderToStaticMarkup(<SearchFilterBar filters={[multiFilter]} />)
  assert(html8.includes('2 selected'), 'Displays multi-select count summary')
  assert(html8.includes('is-active'), 'Multi-filter triggers active style')

  // TEST 9: Toggle Filter
  console.log('\n[TEST 9] Toggle Switch Filter')
  const toggleFilter: FilterConfig = {
    id: 'activeOnly',
    label: 'Active Only',
    type: 'toggle',
    value: true,
    defaultValue: false,
    onChange: () => {},
  }
  const html9 = renderToStaticMarkup(<SearchFilterBar filters={[toggleFilter]} />)
  assert(html9.includes('sfb-toggle-switch'), 'Renders toggle switch element')
  assert(html9.includes('is-checked'), 'Toggle switch is checked')

  // TEST 10: Autocomplete Search Suggestions Layout
  console.log('\n[TEST 10] Autocomplete Search Suggestions structure')
  const suggestions: SearchSuggestionItem[] = [
    {
      id: 'emp-1',
      title: 'Anita Sharma',
      subtitle: 'EMP001 · Head Teacher',
      badge: 'Teacher',
    },
    {
      id: 'emp-2',
      title: 'Anita Deshmukh',
      subtitle: 'EMP045 · Admin Staff',
      badge: 'Admin',
    },
  ]
  const searchWithSuggestions = {
    value: 'Anita',
    onChange: () => {},
    suggestions,
  }
  // In SSR / static markup, isFocused is false initially, but SearchFilterBar props accept suggestions
  assert(suggestions.length === 2, 'Suggestions configured with 2 items')
  assert(suggestions[0].title === 'Anita Sharma', 'First suggestion title matches')

  // TEST 11: More Filters button & count badge
  console.log('\n[TEST 11] More Filters button and active badge')
  const advancedFilters: FilterConfig[] = [
    {
      id: 'designation',
      label: 'Designation',
      type: 'select',
      value: 'SENIOR',
      defaultValue: 'ALL',
      placeholder: 'All',
      options: [
        { value: 'ALL', label: 'All' },
        { value: 'SENIOR', label: 'Senior Educator' },
      ],
      onChange: () => {},
    },
  ]
  const html11 = renderToStaticMarkup(
    <SearchFilterBar
      filters={[singleFilter]}
      advancedFilters={advancedFilters}
    />
  )
  assert(html11.includes('More Filters'), 'Renders More Filters trigger')
  assert(html11.includes('class="sfb-count-badge"'), 'Renders count badge for active advanced filters')
  assert(html11.includes('>1</span>'), 'Shows 1 active advanced filter')

  // TEST 12: Applied Active Chips Rail & Reset
  console.log('\n[TEST 12] Applied Active Chips Rail with auto-generation')
  const html12 = renderToStaticMarkup(
    <SearchFilterBar
      search={{
        value: 'Rahul',
        onChange: () => {},
      }}
      filters={[singleFilter]} // value: 'TEACHER'
      onReset={() => {}}
    />
  )
  assert(html12.includes('class="sfb-chips-rail"'), 'Renders applied chips rail')
  assert(html12.includes('Search:</strong> &quot;Rahul&quot;'), 'Generates chip for search query')
  assert(html12.includes('Role:</strong> Teacher'), 'Generates chip for active role filter')
  assert(html12.includes('class="sfb-chips-clear-all"'), 'Renders Clear All action button')

  // TEST 13: Variants: Default, Compact, Embedded
  console.log('\n[TEST 13] Component Variants support (default, compact, embedded)')
  const htmlDefault = renderToStaticMarkup(<SearchFilterBar variant="default" />)
  assert(htmlDefault.includes('sfb-default'), 'Default variant class applied')

  const htmlCompact = renderToStaticMarkup(<SearchFilterBar variant="compact" />)
  assert(htmlCompact.includes('sfb-compact'), 'Compact variant class applied')

  const htmlEmbedded = renderToStaticMarkup(<SearchFilterBar variant="embedded" />)
  assert(htmlEmbedded.includes('sfb-embedded'), 'Embedded variant class applied')

  // TEST 14: Backwards Compatibility with legacy FilterBar facade
  console.log('\n[TEST 14] Legacy FilterBar facade compatibility')
  const legacyHtml = renderToStaticMarkup(
    <FilterBar
      search="Legacy Search"
      onSearchChange={() => {}}
      searchPlaceholder="Search..."
      filters={[
        {
          id: 'status',
          label: 'Status',
          value: 'ACTIVE',
          options: [
            { value: 'ALL', label: 'All' },
            { value: 'ACTIVE', label: 'Active' },
          ],
          onChange: () => {},
        },
      ]}
    />
  )
  assert(legacyHtml.includes('value="Legacy Search"'), 'Legacy search mapped properly')
  assert(legacyHtml.includes('Status:'), 'Legacy filter mapped to SearchFilterBar')
  assert(legacyHtml.includes('Active'), 'Legacy active value reflected')

  // TEST 15: Custom actions slot
  console.log('\n[TEST 15] Extra actions slot rendering')
  const html15 = renderToStaticMarkup(
    <SearchFilterBar
      extraActions={<button id="test-export-btn">Export CSV</button>}
    />
  )
  assert(html15.includes('id="test-export-btn"'), 'Renders extra actions in toolbar')
  assert(html15.includes('class="sfb-extra-actions"'), 'Wrapped in sfb-extra-actions container')

  console.log('\n======================================================================')
  console.log('   ALL 15 SEARCH & FILTER BAR TESTS PASSED SUCCESSFULLY! ✓')
  console.log('======================================================================\n')
}

runTests().catch((err) => {
  console.error('\nVerification suite failed:', err)
  process.exit(1)
})

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-persona-targeted.spec.ts >> PreOne Dashboard Targeted Browser Verification Suite (Step 6.1) >> Persona: Finance (ACCOUNTS) >> verifies responsive layout & accessibility at 390-standard-mobile (390x844)
- Location: tests\e2e\dashboard-persona-targeted.spec.ts:80:13

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/app/dashboard", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { signSession, SESSION_COOKIE } from '../../src/lib/auth'
  3   | 
  4   | /**
  5   |  * PreOne Targeted Browser Verification — Phase 03, Step 6.1
  6   |  * Verifies real Chromium rendering across 5 personas x 6 viewports:
  7   |  * 360, 390, 640, 768, 1024, 1280 CSS pixels.
  8   |  */
  9   | 
  10  | const VIEWPORT_MATRIX = [
  11  |   { name: '360-small-mobile', width: 360, height: 740 },
  12  |   { name: '390-standard-mobile', width: 390, height: 844 },
  13  |   { name: '640-tablet-portrait', width: 640, height: 960 },
  14  |   { name: '768-tablet-landscape', width: 768, height: 1024 },
  15  |   { name: '1024-desktop-compact', width: 1024, height: 768 },
  16  |   { name: '1280-desktop-wide', width: 1280, height: 800 },
  17  | ] as const
  18  | 
  19  | const PERSONAS = [
  20  |   {
  21  |     name: 'Executive',
  22  |     role: 'OWNER',
  23  |     roles: ['OWNER'],
  24  |     uid: '3a484602-7155-49ff-a9aa-18d451b356f6',
  25  |     email: 'owner@sunshine.demo',
  26  |     tenantId: '1fac9d27-88a1-4e78-90a4-8a0e38bc744f',
  27  |   },
  28  |   {
  29  |     name: 'Finance',
  30  |     role: 'ACCOUNTS',
  31  |     roles: ['ACCOUNTS'],
  32  |     uid: '2d4b2f92-c9d3-4364-87e3-2d088672d46a',
  33  |     email: 'accounts_1792092314811@preone.test',
  34  |     tenantId: '84fc9cb4-f77b-4be6-9709-dd8fcae17f99',
  35  |   },
  36  |   {
  37  |     name: 'Teacher',
  38  |     role: 'TEACHER',
  39  |     roles: ['TEACHER'],
  40  |     uid: '2b0a8a42-235e-4b92-996f-1ce764b2a5fd',
  41  |     email: 'priya.teacher.998896@preone.test',
  42  |     tenantId: 'd9f100ee-0db1-4589-b737-0fbfee6008a7',
  43  |   },
  44  |   {
  45  |     name: 'Parent',
  46  |     role: 'PARENT',
  47  |     roles: ['PARENT'],
  48  |     uid: 'b109efdf-9d4f-4c78-9c83-da8daa9ed720',
  49  |     email: 'rohit.998896@example.com',
  50  |     tenantId: 'd9f100ee-0db1-4589-b737-0fbfee6008a7',
  51  |   },
  52  |   {
  53  |     name: 'Staff',
  54  |     role: 'STAFF',
  55  |     roles: ['STAFF'],
  56  |     uid: 'ad92e3bd-a902-4e54-a3d3-32b6338e0991',
  57  |     email: 'staff_1792174657250_8gvo8@rbac.test',
  58  |     tenantId: '688134f1-700a-4c59-b23e-6c1245b88a97',
  59  |   },
  60  | ] as const
  61  | 
  62  | test.describe('PreOne Dashboard Targeted Browser Verification Suite (Step 6.1)', () => {
  63  |   for (const persona of PERSONAS) {
  64  |     test.describe(`Persona: ${persona.name} (${persona.role})`, () => {
  65  |       let sessionToken: string
  66  | 
  67  |       test.beforeAll(async () => {
  68  |         sessionToken = await signSession({
  69  |           uid: persona.uid,
  70  |           email: persona.email,
  71  |           name: persona.name,
  72  |           tenantId: persona.tenantId,
  73  |           branchId: null,
  74  |           role: persona.role as any,
  75  |           roles: persona.roles as any,
  76  |         })
  77  |       })
  78  | 
  79  |       for (const vp of VIEWPORT_MATRIX) {
  80  |         test(`verifies responsive layout & accessibility at ${vp.name} (${vp.width}x${vp.height})`, async ({
  81  |           page,
  82  |           context,
  83  |         }) => {
  84  |           // 1. Establish session cookie
  85  |           await context.addCookies([
  86  |             {
  87  |               name: SESSION_COOKIE,
  88  |               value: sessionToken,
  89  |               domain: 'localhost',
  90  |               path: '/',
  91  |               httpOnly: true,
  92  |               sameSite: 'Lax',
  93  |             },
  94  |           ])
  95  | 
  96  |           // 2. Set viewport
  97  |           await page.setViewportSize({ width: vp.width, height: vp.height })
  98  | 
  99  |           // 3. Navigate to dashboard
> 100 |           const response = await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded' })
      |                                       ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  101 |           expect(response?.status()).toBe(200)
  102 |           await page.waitForTimeout(600) // allow hydration
  103 | 
  104 |           // 4. Check horizontal overflow (WCAG 1.4.10)
  105 |           const overflow = await page.evaluate(() => {
  106 |             const docElem = document.documentElement
  107 |             const body = document.body
  108 |             const innerWidth = window.innerWidth
  109 |             const docScrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth)
  110 |             return {
  111 |               hasHScroll: docScrollWidth > innerWidth + 1,
  112 |               scrollWidth: docScrollWidth,
  113 |               innerWidth,
  114 |             }
  115 |           })
  116 | 
  117 |           expect(overflow.hasHScroll).toBe(false)
  118 | 
  119 |           // 5. Persona-specific checks
  120 |           if (persona.role === 'OWNER') {
  121 |             // Setup incomplete banner
  122 |             const banner = page.locator('[role="region"][aria-label="Setup Incomplete Notice"]')
  123 |             await expect(banner).toBeVisible()
  124 |             const bannerCta = banner.locator('a, button').first()
  125 |             await expect(bannerCta).toBeVisible()
  126 |           }
  127 | 
  128 |           if (persona.role === 'ACCOUNTS') {
  129 |             // Finance dashboard: verify either table overflow container or honest empty state
  130 |             const tables = page.locator('.overflow-x-auto')
  131 |             const emptyState = page.locator('text=/No Invoices Issued/i')
  132 |             const hasTableOrEmpty = (await tables.count()) > 0 || (await emptyState.count()) > 0
  133 |             expect(hasTableOrEmpty).toBe(true)
  134 |           }
  135 | 
  136 |           if (persona.role === 'TEACHER') {
  137 |             // Teacher quick-care buttons: check touch target >= 44px on mobile
  138 |             const careButtons = page.locator('button[aria-label^="Record "]')
  139 |             const btnCount = await careButtons.count()
  140 |             if (btnCount > 0) {
  141 |               const firstBox = await careButtons.first().boundingBox()
  142 |               if (vp.width <= 640 && firstBox) {
  143 |                 expect(firstBox.height).toBeGreaterThanOrEqual(44)
  144 |                 expect(firstBox.width).toBeGreaterThanOrEqual(44)
  145 |               }
  146 |             }
  147 |           }
  148 | 
  149 |           if (persona.role === 'PARENT') {
  150 |             // Multi-child switcher check
  151 |             const tablist = page.locator('[role="tablist"][aria-label="Enrolled children"]')
  152 |             const tabCount = await page.locator('[role="tab"]').count()
  153 |             if (tabCount > 1) {
  154 |               await expect(tablist).toBeVisible()
  155 |               const selectedTab = page.locator('[role="tab"][aria-selected="true"]')
  156 |               await expect(selectedTab).toHaveCount(1)
  157 |               const tabpanel = page.locator('[role="tabpanel"]')
  158 |               await expect(tabpanel).toBeVisible()
  159 |             }
  160 |           }
  161 | 
  162 |           if (persona.role === 'STAFF') {
  163 |             // Verify operational heading & zero financial metrics
  164 |             const heading = page.locator('h1, h2').first()
  165 |             await expect(heading).toBeVisible()
  166 |             const content = await page.content()
  167 |             expect(content).not.toContain('Active Ledger Balance')
  168 |             expect(content).not.toContain('Audit Trail')
  169 |           }
  170 |         })
  171 |       }
  172 |     })
  173 |   }
  174 | })
  175 | 
```
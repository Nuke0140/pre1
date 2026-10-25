# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-matrix.spec.ts >> PreOne Responsive Viewport Matrix & Visual Diff Guardrails >> Viewport: 768-tablet-portrait (768x1024) >> verifies home layout integrity against baseline sweep
- Location: tests\e2e\responsive-matrix.spec.ts:127:13

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.screenshot: Test timeout of 30000ms exceeded.
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content":
    - /url: "#main"
  - button "Open PreO Mascot companion" [ref=e2] [cursor=pointer]:
    - 'img "PreO: The Explorer — PreOne Mascot" [ref=e3]'
  - banner [ref=e10]:
    - generic [ref=e11]:
      - link "PreOne OS Home" [ref=e13] [cursor=pointer]:
        - /url: /app/home
      - generic [ref=e18]:
        - button "Open global search (⌘K)" [ref=e19] [cursor=pointer]
        - button "Switch to dark theme" [ref=e23] [cursor=pointer]
        - button "Inbox & Attention" [ref=e27] [cursor=pointer]
        - button "Alerts and Notifications" [ref=e32] [cursor=pointer]
        - button "Open user profile menu" [ref=e38] [cursor=pointer]:
          - generic [aria-hidden] [ref=e39]: SO
          - generic [ref=e40]:
            - generic [ref=e41]: School Owner
            - generic [ref=e42]: Owner
  - main [ref=e45]:
    - generic [ref=e47]:
      - region "PreOne Home" [ref=e48]:
        - generic [ref=e50]:
          - img "PreOne" [ref=e51]
          - generic [ref=e52]: Preschool OS
        - heading "PreOne" [level=1] [ref=e53]
        - status [ref=e54]:
          - generic [ref=e55]: PreOne
          - generic [aria-hidden] [ref=e57]: •
          - generic [ref=e58]:
            - text: Welcome back,
            - strong [ref=e59]: Executive
      - main "Home" [ref=e60]:
        - generic [ref=e61]:
          - link "Dashboard" [ref=e62] [cursor=pointer]:
            - /url: /app/dashboard
            - generic [ref=e64]:
              - img "Dashboard"
            - heading "Dashboard" [level=3] [ref=e66]
          - link "Setup" [ref=e67] [cursor=pointer]:
            - /url: /app/setup
            - generic [ref=e69]:
              - img "Setup"
            - heading "Setup" [level=3] [ref=e71]
          - link "Users & Access" [ref=e72] [cursor=pointer]:
            - /url: /app/users
            - generic [ref=e74]:
              - img "Users & Access"
            - heading "Users & Access" [level=3] [ref=e76]
          - link "Admissions" [ref=e77] [cursor=pointer]:
            - /url: /app/admissions
            - generic [ref=e79]:
              - img "Admissions"
            - heading "Admissions" [level=3] [ref=e81]
          - link "Students" [ref=e82] [cursor=pointer]:
            - /url: /app/students
            - generic [ref=e84]:
              - img "Students"
            - heading "Students" [level=3] [ref=e86]
          - link "Classrooms" [ref=e87] [cursor=pointer]:
            - /url: /app/classrooms
            - generic [ref=e89]:
              - img "Classrooms"
            - heading "Classrooms" [level=3] [ref=e91]
          - link "Daily Diary" [ref=e92] [cursor=pointer]:
            - /url: /app/daily-diary
            - generic [ref=e94]:
              - img "Daily Diary"
            - heading "Daily Diary" [level=3] [ref=e96]
          - link "Fees & Finance" [ref=e97] [cursor=pointer]:
            - /url: /app/finance
            - generic [ref=e99]:
              - img "Fees & Finance"
            - heading "Fees & Finance" [level=3] [ref=e101]
          - link "Transport" [ref=e102] [cursor=pointer]:
            - /url: /app/transport
            - generic [ref=e104]:
              - img "Transport"
            - heading "Transport" [level=3] [ref=e106]
          - link "Inventory" [ref=e107] [cursor=pointer]:
            - /url: /app/inventory
            - generic [ref=e109]:
              - img "Inventory"
            - heading "Inventory" [level=3] [ref=e111]
          - link "PreO Learning" [ref=e112] [cursor=pointer]:
            - /url: /app/learning
            - generic [ref=e114]:
              - img "PreO Learning"
            - heading "PreO Learning" [level=3] [ref=e116]
          - link "HR & Workforce" [ref=e117] [cursor=pointer]:
            - /url: /app/hr
            - generic [ref=e119]:
              - img "HR & Workforce"
            - heading "HR & Workforce" [level=3] [ref=e121]
          - link "Reports & Analytics" [ref=e122] [cursor=pointer]:
            - /url: /app/reports
            - generic [ref=e124]:
              - img "Reports & Analytics"
            - heading "Reports & Analytics" [level=3] [ref=e126]
          - link "Announcements" [ref=e127] [cursor=pointer]:
            - /url: /app/communication
            - generic [ref=e129]:
              - img "Announcements"
            - heading "Announcements" [level=3] [ref=e131]
          - link "Settings" [ref=e132] [cursor=pointer]:
            - /url: /app/settings
            - generic [ref=e134]:
              - img "Settings"
            - heading "Settings" [level=3] [ref=e136]
          - link "Audit Logs" [ref=e137] [cursor=pointer]:
            - /url: /app/audit
            - generic [ref=e139]:
              - img "Audit Logs"
            - heading "Audit Logs" [level=3] [ref=e141]
  - contentinfo:
    - navigation "Global navigation dock" [ref=e142]:
      - generic [ref=e143]:
        - generic [ref=e144]:
          - link "Home" [ref=e145] [cursor=pointer]:
            - /url: /app/home
          - link "Dashboard" [ref=e151] [cursor=pointer]:
            - /url: /app/dashboard
            - generic [ref=e152]:
              - img "Dashboard"
        - button "PreOne Start Menu" [ref=e156] [cursor=pointer]
        - generic [ref=e169]:
          - link "Students" [ref=e170] [cursor=pointer]:
            - /url: /app/students
            - generic [ref=e171]:
              - img "Students"
          - link "PreO Learning" [ref=e173] [cursor=pointer]:
            - /url: /app/learning
            - generic [ref=e174]:
              - img "PreO Learning"
          - link "Users & Access" [ref=e176] [cursor=pointer]:
            - /url: /app/users
            - generic [ref=e177]:
              - img "Users & Access"
          - link "Daily Diary" [ref=e179] [cursor=pointer]:
            - /url: /app/daily-diary
            - generic [ref=e180]:
              - img "Daily Diary"
  - status
```

# Test source

```ts
  56  |           name: 'PreOne Sunshine',
  57  |           code: 'SUNSHINE',
  58  |           type: 'SCHOOL',
  59  |           status: 'ACTIVE',
  60  |           subscriptionPlan: 'PRO',
  61  |           onboardingStep: 5,
  62  |         },
  63  |       })
  64  | 
  65  |       await db.branch.upsert({
  66  |         where: { id: branchId },
  67  |         update: { isMain: true, isActive: true },
  68  |         create: {
  69  |           id: branchId,
  70  |           tenantId,
  71  |           name: 'Main Campus',
  72  |           code: 'MAIN',
  73  |           isMain: true,
  74  |           isActive: true,
  75  |         },
  76  |       })
  77  | 
  78  |       await db.user.upsert({
  79  |         where: { id: userId },
  80  |         update: { status: 'ACTIVE' },
  81  |         create: {
  82  |           id: userId,
  83  |           email: 'owner@sunshine.demo',
  84  |           username: 'owner.sunshine',
  85  |           fullName: 'School Owner',
  86  |           passwordHash: '$2b$10$W3MCU5DI0ScjrbYzTs8D0uN.Bini1xg1wQZnzaKgn14Rz0D1EB5Ju',
  87  |           status: 'ACTIVE',
  88  |         },
  89  |       })
  90  | 
  91  |       await db.tenantUser.upsert({
  92  |         where: { id: '5b7ccddb-9ab6-4a79-b62c-f3e4821d6257' },
  93  |         update: { status: 'ACTIVE', role: 'OWNER' },
  94  |         create: {
  95  |           id: '5b7ccddb-9ab6-4a79-b62c-f3e4821d6257',
  96  |           tenantId,
  97  |           userId,
  98  |           role: 'OWNER',
  99  |           roles: ['OWNER', 'PRINCIPAL'],
  100 |           branchId,
  101 |           status: 'ACTIVE',
  102 |         },
  103 |       })
  104 |     } catch {
  105 |       // Database is seeded by scripts/seed-responsive-ci.ts in CI
  106 |     }
  107 | 
  108 |     // Match the authenticated test persona used by the dashboard browser suite.
  109 |     // Without a session, /app routes redirect to AuthShell and these tests audit
  110 |     // decorative login artwork instead of the responsive application shell.
  111 |     sessionToken = await signSession({
  112 |       uid: '3a484602-7155-49ff-a9aa-18d451b356f6',
  113 |       email: 'owner@sunshine.demo',
  114 |       name: 'Executive',
  115 |       tenantId: '1fac9d27-88a1-4e78-90a4-8a0e38bc744f',
  116 |       branchId: null,
  117 |       role: 'OWNER',
  118 |       roles: ['OWNER'],
  119 |     })
  120 |   })
  121 | 
  122 |   for (const vp of VIEWPORT_MATRIX) {
  123 |     test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
  124 |       test.use({ viewport: { width: vp.width, height: vp.height } })
  125 | 
  126 |       for (const p of CORE_PAGES) {
  127 |         test(`verifies ${p.name} layout integrity against baseline sweep`, async ({ page, context }) => {
  128 |           await context.addCookies([{
  129 |             name: SESSION_COOKIE,
  130 |             value: sessionToken,
  131 |             domain: 'localhost',
  132 |             path: '/',
  133 |             httpOnly: true,
  134 |             sameSite: 'Lax',
  135 |           }])
  136 | 
  137 |           // Navigate to page (with client hydration wait)
  138 |           await page.goto(p.path, { waitUntil: 'domcontentloaded' })
  139 |           await page.waitForTimeout(300)
  140 | 
  141 |           // Promoted Playwright assert: pages x 9 viewports (no clipped-without-rail, no h-scroll, profile visible)
  142 |           await expect(page).toPassResponsiveProbe({
  143 |             pageName: p.name,
  144 |             viewportName: vp.name,
  145 |             requireProfile: true,
  146 |           })
  147 | 
  148 |           // Baseline comparison against today's sweep data
  149 |           const baselineEntry = baselineFixture.sweepBaseline.find(
  150 |             (b) => b.page === p.name && b.viewport === vp.name
  151 |           )
  152 |           expect(baselineEntry).toBeDefined()
  153 |           expect(baselineEntry?.status).toBe('PASS')
  154 | 
  155 |           // Screenshot visual diff capture
> 156 |           await page.screenshot({
      |                      ^ Error: page.screenshot: Test timeout of 30000ms exceeded.
  157 |             path: `tests/visual-regression/snapshots/${p.name}-${vp.name}.png`,
  158 |             fullPage: false,
  159 |           })
  160 |         })
  161 |       }
  162 |     })
  163 |   }
  164 | })
  165 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-matrix.spec.ts >> PreOne Responsive Viewport Matrix & Visual Diff Guardrails >> Viewport: 390-phone-standard (390x844) >> verifies admissions layout integrity against baseline sweep
- Location: tests\e2e\responsive-matrix.spec.ts:127:13

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.screenshot: Target page, context or browser has been closed
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
  - main [ref=e40]:
    - status "Loading content" [ref=e42]
  - contentinfo:
    - navigation "Global navigation dock" [ref=e67]:
      - generic [ref=e68]:
        - generic [ref=e69]:
          - link "Home" [ref=e70] [cursor=pointer]:
            - /url: /app/home
          - link "Dashboard" [ref=e75] [cursor=pointer]:
            - /url: /app/dashboard
            - generic [ref=e76]:
              - img "Dashboard"
        - button "PreOne Start Menu" [ref=e78] [cursor=pointer]
        - generic [ref=e90]:
          - link "Students" [ref=e91] [cursor=pointer]:
            - /url: /app/students
            - generic [ref=e92]:
              - img "Students"
          - link "PreO Learning" [ref=e93] [cursor=pointer]:
            - /url: /app/learning
            - generic [ref=e94]:
              - img "PreO Learning"
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
      |                      ^ Error: page.screenshot: Target page, context or browser has been closed
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
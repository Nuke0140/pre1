# PreOne Dashboard — Baseline Test & Verification Matrix (Final Reconciled)

**Date of Verification:** October 17, 2026  
**Auditor:** QA Automation Lead & Application Security Reviewer  
**Repository Target:** `3e0b7615ae4bc3257a11512e00f3377a24daa7f1` on `feat/admissions-e2e-workflow`  
**Test Engine:** Bun Test v1.3.14 · ESLint 9 · TypeScript 5.x (`tsc --noEmit`) · Playwright 1.64.1  

---

## 1. Comprehensive Test Execution Log & Results

| # | Exact Command Executed | Exit Code | Pass / Fail / Skip | Duration | Failure Breakdown & Details | Classification |
|---|---|---|---|---|---|---|
| 1 | `bun test tests/ui/global-kpi-card.test.ts` | **0** | **27 pass / 0 fail** (113 expects) | 651ms | None. 100% green. | `VERIFIED PASS` |
| 2 | `bun test tests/ui/global-module-navigation.test.ts` | **0** | **36 pass / 0 fail** (132 expects) | 268ms | None. 100% green across all 10 module configs. | `VERIFIED PASS` |
| 3 | `bun test tests/ui/book-loader.test.ts` | **0** | **7 pass / 0 fail** (91 expects) | 2.82s | None. Verifies `src/app/app/dashboard/loading.tsx`. | `VERIFIED PASS` |
| 4 | `bun test tests/students/` | **0** | **41 pass / 0 fail** (188 expects) | 4.82s | None. Verifies roster, drawer, emergency contact. | `VERIFIED PASS` |
| 5 | `bun test tests/domain/bug-012-core-tenant-apis.test.ts` | **0** | **19 pass / 0 fail** (97 expects) | 2.62s | Scenario 3 verifies strict multi-tenant isolation. | `VERIFIED PASS` |
| 6 | `bun test tests/auth/password-reset.test.ts` *(Cold)* | **1** | **4 pass / 1 fail** | 5.94s | `B3-05` timed out at 5012ms on cold live `fetch()`. | `TEST-003: TEST TIMEOUT` |
| 7 | `bun test tests/auth/password-reset.test.ts` *(Warm)* | **0** | **5 pass / 0 fail** | 1.02s | None. `B3-05` passed in 100.56ms when server was warm. | `VERIFIED PASS` |
| 8 | `tests/design-system/anti-patterns-remediation.test.ts` | **1** | **5 pass / 1 fail** | 116ms | Line 40: Expecting deprecated string in `AdmissionsNavigationRibbon` | `TEST-002: OUTDATED TEST` |
| 9 | `tests/design-system/design-tokens.test.ts` | **1** | **4 pass / 1 fail** | 199ms | Line 122: Expecting `[box-shadow:var(--shadow-1)]` in `KpiMetricCard` | `TEST-002: OUTDATED TEST` |
| 10 | `tests/design-system/responsive-transformation.test.ts` | **1** | **40 pass / 10 fail** | 296ms | 10 tests expecting older dropdowns replaced by `GlobalModuleNavigation` | `TEST-002: OUTDATED TEST` |
| 11 | `bun x eslint src/app/app/dashboard src/app/app/home` | **0** | **0 errors / 0 warnings** | 4.2s | None. 100% clean lint for dashboard components. | `VERIFIED PASS` |
| 12 | `bun x tsc --noEmit` | **1** | Dashboard: **0 errors**<br>Domain services: 35 errors | 14.2s | Type errors in `lead-service.ts`, `pipeline-service.ts`, `supply-cart-service.ts` | `DOMAIN SERVICE TYPE STRICTNESS` |

---

## 2. In-Depth Failure Root Cause Analysis

### 2.1 Investigation of `B3-05` (`tests/auth/password-reset.test.ts`) — `TEST-003`
- **Observed Behavior:** Fails with timeout (>5000ms) on cold execution; passes in 100ms on second execution.
- **Root Cause:** Test `B3-05` makes a live HTTP network request to `http://localhost:3000/api/v1/auth/reset-password`. On cold execution, Next.js webpack dev server on-demand route compilation took ~5.2 seconds, exceeding Bun test's default 5000ms test timeout.
- **Verification:** When re-run while the route cache was warm, the test passed cleanly with 0 errors (`100.56ms`).
- **Conclusion:** Not a product defect; purely a dev-server cold compilation race condition.

### 2.2 Investigation of Design-System Unit Failures (`tests/design-system/`) — `TEST-002`
All 12 failures were traced to outdated static string-matching assertions:
1. `anti-patterns-remediation.test.ts:40`: Expects `AdmissionsNavigationRibbon.tsx` to literally contain `"rounded-full ${theme.activeDot} animate-pulse shrink-0"`. The ribbon was refactored in the recent navigation standardization task to delegate cleanly to `GlobalModuleNavigation`.
2. `design-tokens.test.ts:122`: Expects `KpiMetricCard.tsx` to literally contain `"[box-shadow:var(--shadow-1)]"`. The component was upgraded to use `.preone-kpi-card` with theme-matching subtle glow.
3. `responsive-transformation.test.ts` (10 failures): Assert on legacy mobile `<select>` elements (`mobile section select picker (< md)`), which were superseded by `GlobalModuleNavigation`'s responsive `More (···)` overflow popover.

---

## 3. Playwright Responsive Matrix Audit & Gap — `TEST-001`

### File: `tests/e2e/responsive-matrix.spec.ts`
The test script runs an automated probe (`toPassResponsiveProbe`) checking:
- Zero un-railed element horizontal overflow (`no clipped-without-rail`)
- Zero document horizontal scrollbar (`scrollWidth <= viewportWidth`)
- Reachability of profile action button

### Viewports Tested (9 Total):
1. `320-phone-compact` (320 × 568)
2. `390-phone-standard` (390 × 844)
3. `667x375-phone-landscape` (667 × 375)
4. `768-tablet-portrait` (768 × 1024)
5. `820-tablet-air` (820 × 1180)
6. `1024-tablet-landscape` (1024 × 768)
7. `1280-laptop-13` (1280 × 800)
8. `1440-laptop-15` (1440 × 900)
9. `1920-desktop-1080p` (1920 × 1080)

### Critical Regression Coverage Gap:
`CORE_PAGES` is configured as:
```ts
export const CORE_PAGES = [
  { name: 'home', path: '/app/home' },
  { name: 'students', path: '/app/students' },
  { name: 'daily-diary', path: '/app/daily-diary' },
  { name: 'finance', path: '/app/fees' },
  { name: 'admissions', path: '/app/admissions' },
  { name: 'settings', path: '/app/settings' },
  { name: 'audit', path: '/app/audit' },
] as const
```
**`/app/dashboard` is completely omitted from the Playwright test matrix.**

---

## 4. Test Implementation Plan for Phase 02 & Phase 03

1. **Register Dashboard in Playwright Matrix (`tests/e2e/responsive-matrix.spec.ts`):**
   - Add `{ name: 'dashboard-admin', path: '/app/dashboard' }`.
   - Add authenticated role fixtures for Teacher and Parent dashboards:
     - `{ name: 'dashboard-teacher', path: '/app/dashboard' }`
     - `{ name: 'dashboard-parent', path: '/app/dashboard' }`
2. **Implement Dedicated Dashboard Unit Tests (`tests/dashboard/`):**
   - `dashboard-invoicing-accuracy.test.ts`: Verify that `CANCELLED`, `DRAFT`, and `WRITTEN_OFF` invoices are never counted in `billed`.
   - `dashboard-scoping.test.ts`: Verify that changing `branchId` or `academicSessionId` updates metrics accordingly.
   - `dashboard-role-dispatch.test.ts`: Verify that Teacher, Parent, and specialized staff roles receive appropriate views.
3. **Remediate Legacy Assertions (`tests/design-system/`):**
   - Update string matching in `anti-patterns-remediation.test.ts` and `responsive-transformation.test.ts` to assert against `GlobalModuleNavigation` rather than deleted components.

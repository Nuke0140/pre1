# PreOne Dashboard Redesign — Phase 01-A: Final Evidence Reconciliation Audit

**Audit Date:** October 17, 2026  
**Auditor Roles:** Senior Software Architect, Application Security Reviewer, QA Automation Lead, Frontend Performance Auditor  
**Repository:** `https://github.com/Nuke0140/pre1`  
**Git Branch:** `feat/admissions-e2e-workflow`  
**Commit SHA:** `3e0b7615ae4bc3257a11512e00f3377a24daa7f1`  
**Target Commit Matched:** YES (`3e0b7615ae4bc3257a11512e00f3377a24daa7f1`)  
**Working Tree Status:** Preserved without alteration (zero production files mutated during audit)  
**Runtime:** Bun v1.3.14 · Node.js v24.16.0 · Next.js 16.1.1 (App Router, React 19) · PostgreSQL (active on port 5432) · Webpack dev server active on port 3000 (`task-5480`, HTTP 200 OK)  

---

## 1. Executive Summary & Audit Context

This document provides the reconciled, evidence-backed baseline audit for Phase 01-A of the PreOne Dashboard Redesign project. Every finding has been verified against the checked-out source code, active schemas, executed tests, and runtime environment.

### Final Verification Conclusions:
1. **Refutation of Missing `loading.tsx` Claim (`LOAD-001`):** The previous audit asserted that `/app/dashboard` lacked a `loading.tsx` file. **This claim was refuted.** `src/app/app/dashboard/loading.tsx` is present, functional, and renders `<BookPageLoader mode="page" />`.
2. **Identification of Fee Invoicing Calculation Defect (`DATA-002`):** `src/app/app/dashboard/page.tsx:51` and `src/app/api/v1/dashboard/route.ts:34` sum `invoices.reduce((s, i) => s + i.totalCents, 0)` without filtering on `InvoiceStatus`. **`CANCELLED`, `DRAFT`, and `WRITTEN_OFF` invoices are incorrectly included**, falsely inflating the billed revenue KPI.
3. **M01 Specification Violation on Multi-Year Scoping (`DATA-001`):** Document `docs/M01_End_to_End_Integration_Impact_Map.md` (Rule I-1) mandates: *"no cross-year mixing in defaults views"*. Both `page.tsx` and `/api/v1/dashboard/route.ts` omit `academicSessionId`, violating project architecture rules.
4. **Audit Data Leak on Generic Staff Fallthrough (`AUTH-001`):** `db.auditLog.findMany` in `page.tsx:48` fetches the latest 8 tenant audit logs and renders them in `DashboardClient.tsx:254-280` without gating on the `audit:read` capability. Roles like `STAFF`, `ATTENDANT`, and `DRIVER` receive and view administrative audit summaries.
5. **Resolution of `B3-05` Test Timeout (`TEST-003`):** The previous audit attributed the timeout in `tests/auth/password-reset.test.ts` to mock email delays. Detailed inspection proved it is an integration test making a live HTTP fetch to `http://localhost:3000/api/v1/auth/reset-password`. Cold on-demand route compilation in Next.js took >5000ms, triggering the default runner timeout. When the dev server is warm, `B3-05` passes in 100ms.
6. **Cause of 12 Design-System Test Failures (`TEST-002`):** The failures in `tests/design-system/` do not indicate application regression; they are outdated string-literal assertions expecting deprecated markup from legacy components (`AdmissionsNavigationRibbon` and older 18-tab rails) that were superseded by `GlobalModuleNavigation`.
7. **Confirmed CSS Cascade Defect (`CSS-001`):** Duplication of `.quick-action-strip` at `globals.css:7904` (`display: grid`) overrides `globals.css:2437` (`display: flex`), causing `<span className="strip-label">` to occupy an entire 200px grid column in `DashboardClient.tsx`.
8. **Clarification on 7-Day Attendance Query Execution (`PERF-002`):** The 14 attendance count queries are dispatched **concurrently in parallel** via nested `Promise.all`, not sequentially in series.

---

## 2. Reconciled Finding Inventory & Risk Register

Every unique finding appears exactly once in this register:

| Finding ID | Priority | Finding Title | Status | Source Location | Real Impact | Phase 02 Action Required |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **`DATA-001`** | P0 | Omission of `academicSessionId` in dashboard queries | **CONFIRMED DEFECT** | `src/app/app/dashboard/page.tsx:35-38`; `docs/M01_End_to_End_Integration_Impact_Map.md:57` | Mixes multi-year historical invoice data into active dashboard | Mandate BFF query service with session scoping |
| **`DATA-002`** | P0 | Billed revenue calculation includes CANCELLED and DRAFT invoices | **CONFIRMED DEFECT** | `src/app/app/dashboard/page.tsx:51-56`; `prisma/schema.prisma:1792` | Total Billed metric is inaccurate on executive dashboard | Filter by `status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] }` |
| **`DATA-003`** | P0 | Lack of `branchId` scoping on multi-branch tenants | **CONFIRMED DESIGN RISK** | `src/app/app/dashboard/page.tsx:29-49` | Branch-restricted staff see tenant-wide totals | Add `branchId` filter to dashboard data layer |
| **`AUTH-001`** | P0 | Audit log exposure to non-administrative staff roles | **CONFIRMED DEFECT / PRIVILEGE LEAK** | `src/app/app/dashboard/page.tsx:48`; `DashboardClient.tsx:254-280` | `STAFF`, `ATTENDANT`, `DRIVER` see administrative audit summaries | Gate Recent Activity behind `audit:read` or remove from staff fallthrough |
| **`PERF-001`** | P1 | In-memory invoice aggregation over unbounded historical rows | **CONFIRMED DESIGN RISK** | `src/app/app/dashboard/page.tsx:35` | Node memory pressure on mature schools | Migrate to database-level aggregation (`aggregate`) |
| **`PERF-002`** | P1 | 14 concurrent queries for 7-day attendance trend | **CONFIRMED DESIGN RISK** | `src/app/app/dashboard/page.tsx:58-73` | Connection pool saturation during morning rush | Consolidate into single grouped query (`groupBy`) |
| **`SETUP-001`**| P1 | `SchoolSetup.status !== 'LIVE'` unconditional redirect | **CONFIRMED DESIGN RISK** | `src/app/app/dashboard/page.tsx:16-19` | Prevents owners from viewing preview dashboard | Design setup progress banner with telemetry preview |
| **`ROLE-001`** | P1 | Non-teaching operational roles lack dedicated dashboard personas | **CONFIRMED DESIGN RISK** | `src/app/app/dashboard/page.tsx:21-25` | Specialized staff see irrelevant cards and "Welcome, Administrator!" | Design 5 role-specific dashboard views |
| **`CSS-001`**  | P2 | `.quick-action-strip` grid duplication breaks label layout | **CONFIRMED DEFECT** | `src/app/globals.css:7904`; `DashboardClient.tsx:118` | Strip label renders as 200px grid box | Consolidate CSS declarations |
| **`CSS-002`**  | P2 | Duplicate `.operational-hero` and inline `!important` | **CONFIRMED DESIGN RISK** | `src/app/globals.css:2427` & `7750` | Dead code and cascade fragility | Remove duplicate selector and inline styles |
| **`TEST-001`** | P2 | `/app/dashboard` omitted from Playwright matrix | **CONFIRMED DESIGN RISK** | `tests/e2e/responsive-matrix.spec.ts:18` | Missing automated responsive test coverage | Add `/app/dashboard` to `CORE_PAGES` |
| **`TEST-002`** | P1 | 12 legacy assertions failing in `tests/design-system/` | **OUTDATED TEST EXPECTATION** | `tests/design-system/*.test.ts` | Test runner noise | Update assertions to modern components |
| **`TEST-003`** | P1 | `B3-05` timeout during cold route compilation | **TEST INFRASTRUCTURE / TIMEOUT** | `tests/auth/password-reset.test.ts:104` | Fails on cold dev server; passes warm | Add warm-up step or increase timeout |
| **`LOAD-001`** | P2 | Reported absence of `loading.tsx` | **REFUTED (NOT AN ISSUE)** | `src/app/app/dashboard/loading.tsx` | None (loader exists and works) | Retain existing `BookPageLoader` |

### Summary of Unique Finding Counts:
- **Total Unique Findings:** 14
- **By Priority:**
  - P0: 4 findings (`DATA-001`, `DATA-002`, `DATA-003`, `AUTH-001`)
  - P1: 6 findings (`PERF-001`, `PERF-002`, `SETUP-001`, `ROLE-001`, `TEST-002`, `TEST-003`)
  - P2: 4 findings (`CSS-001`, `CSS-002`, `TEST-001`, `LOAD-001`)
- **By Status:**
  - Confirmed Defects: 4 (`DATA-001`, `DATA-002`, `AUTH-001`, `CSS-001`)
  - Confirmed Design Risks: 6 (`DATA-003`, `PERF-001`, `PERF-002`, `SETUP-001`, `ROLE-001`, `CSS-002`, `TEST-001` - note: `CSS-002` and `TEST-001` are design risks, total design risks = 7)
  - Outdated Test Expectations: 1 (`TEST-002`)
  - Test Infrastructure / Timeout: 1 (`TEST-003`)
  - Refuted (Not an Issue): 1 (`LOAD-001`)

---

## 3. Substantiation of Cross-Tenant Data Isolation

### Evidence from Source Code:
Every single database query across the entire dashboard route hierarchy explicitly includes the tenant scoping parameter:
1. `src/app/app/dashboard/page.tsx`:
   - Line 11: `if (!session?.tenantId) return null`
   - Line 13: `const tenantId = session.tenantId`
   - Line 17: `db.schoolSetup.findUnique({ where: { tenantId } })`
   - Line 31: `db.student.count({ where: { tenantId, status: 'ACTIVE', deletedAt: null } })`
   - Line 32: `db.attendance.count({ where: { tenantId, date: today, status: { in: [...] } } })`
   - Line 35: `db.invoice.findMany({ where: { tenantId, deletedAt: null } })`
   - Line 39: `db.admissionApplication.count({ where: { tenantId, status: { in: [...] } } })`
   - Line 42: `db.lead.count({ where: { tenantId, status: { in: [...] } } })`
   - Line 43: `db.classroom.findMany({ where: { tenantId, isActive: true } })`
   - Line 48: `db.auditLog.findMany({ where: { tenantId } })`
   - Lines 63-66: `db.attendance.count({ where: { tenantId, date: d, ... } })`
2. `src/app/api/v1/teacher/today/route.ts`:
   - Lines 17-87: All queries explicitly include `{ where: { tenantId, ... } }`.
3. `src/app/api/v1/parent/today/route.ts`:
   - Lines 17-74: All queries explicitly include `{ where: { tenantId, ... } }`.
4. `src/app/api/v1/dashboard/route.ts`:
   - Lines 12-80: All queries explicitly include `{ where: { tenantId, ... } }`.

### Evidence from Executed Test Suites:
- `tests/domain/bug-012-core-tenant-apis.test.ts`:
  - `Scenario 3, Test 2`: `Tenant 2 cannot see Tenant 1 data (strict tenant isolation)` — **PASSED in 150.49ms**.
- `tests/students/emergency-contact-actions.test.ts`:
  - `Test 12`: `Enforces multi-tenant isolation: unauthorized tenant receives 404` — **PASSED in 41.03ms**.
- `tests/students/student-360-drawer.test.ts`:
  - `Test 8`: `Enforces multi-tenant isolation on summary route` — **PASSED in 37.43ms**.

### Honest Scope Limitation on Tenant Isolation:
Tenant isolation is enforced **application-side via Prisma query parameters and session verification**. Database-level PostgreSQL Row Level Security (RLS) policies are not configured at the database engine level.

---

## 4. KPI-by-KPI Data Scope Matrix

| KPI Metric | Source Query | Tenant Filter | Branch Filter | Academic Session Filter | Ownership Constraint | Verified Classification | Intended Scope Requirement |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Active Students** | `db.student.count` (`page.tsx:31`) | YES | **NO** | **NO** | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Active session + selected branch (`PRD §6`) |
| **Present Today** | `db.attendance.count` (`page.tsx:32`) | YES | **NO** | Date = today | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Today's campus gate arrival count (`Operating Loop`) |
| **Attendance %** | `presentToday / activeStudents` | YES | **NO** | Hybrid | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Campus daily attendance rate |
| **Fees Billed** | `db.invoice.findMany` (`page.tsx:35`) | YES | **NO** | **NO** | None | `CONFIRMED DEFECT` (`DATA-001`, `DATA-002`) | Current academic session issued invoices (`M01 Rule I-1`) |
| **Fees Collected** | `invoices.reduce(paidCents)` | YES | **NO** | **NO** | None | `CONFIRMED DEFECT` (`DATA-001`) | Current academic session collections |
| **Fees Overdue** | `invoices.filter(OVERDUE)` | YES | **NO** | **NO** | None | `CONFIRMED DESIGN RISK` (`DATA-001`) | Active arrears for current/prior academic terms |
| **Admissions Pipeline** | `db.admissionApplication.count` | YES | **NO** | **NO** | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Applications for active admission intake session |
| **New Leads** | `db.lead.count` (`page.tsx:42`) | YES | **NO** | N/A | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Prospective leads for branch campus |
| **Classrooms Capacity** | `db.classroom.findMany` (`page.tsx:43`) | YES | **NO** | **NO** | None | `CONFIRMED DESIGN RISK` (`DATA-003`) | Active classrooms in current session and branch |
| **7-Day Trend** | 14× `db.attendance.count` | YES | **NO** | Date-bounded | None | `CONFIRMED DESIGN RISK` (`PERF-002`) | Campus-specific daily trend |
| **Recent Activity** | `db.auditLog.findMany` (`page.tsx:48`) | YES | **NO** | N/A | None | `CONFIRMED DEFECT / LEAK` (`AUTH-001`) | Gated behind `audit:read` capability |

---

## 5. Invoice Business Rules Reconciliation

Inspection of `prisma/schema.prisma` line 1792 reveals `enum InvoiceStatus`:
```prisma
enum InvoiceStatus {
  DRAFT
  ISSUED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  WRITTEN_OFF
}
```

### Authoritative Rule Analysis:
1. **`CANCELLED` Invoices:** Must **NEVER** be counted in "Total Billed" or "Overdue". Summing cancelled invoices into revenue metrics is an unambiguous defect.
2. **`DRAFT` Invoices:** Represent unfinalized, unissued internal records. In standard billing practice, drafts are excluded from accounts receivable until issued.
3. **`WRITTEN_OFF` Invoices:** Represent bad debt. They were legally billed but are no longer expected to be collected.
4. **Decisions Requiring Product Owner Confirmation:**
   - *Decision 1:* Should `DRAFT` invoices have a dedicated operational indicator (e.g. "₹45,000 in Drafts awaiting approval") on the Finance dashboard, while remaining excluded from Total Billed?
   - *Decision 2:* How should `WRITTEN_OFF` invoices be represented in historical recovery reports versus active operational collection rates?

---

## 6. Seven-Day Attendance Trend: Execution Order & Call Count

- **Static Source Verification:** Lines 58-73 in `src/app/app/dashboard/page.tsx`:
  ```ts
  const trend = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const [present, total] = await Promise.all([
        db.attendance.count({ where: { tenantId, date: d, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }),
        db.attendance.count({ where: { tenantId, date: d } }),
      ])
      return { ... }
    })
  )
  ```
- **Execution Order:**
  - Outer: `Promise.all` over 7 days.
  - Inner: `Promise.all` over 2 count queries.
  - **The queries are executed CONCURRENTLY IN PARALLEL**, not in a sequential waterfall.
- **Query Count:**
  - Exactly **14 database queries** are generated per dashboard load (2 queries $\times$ 7 days).
  - Each query is an unbatched `SELECT COUNT(*) FROM "Attendance" WHERE ...`.
  - While parallel execution prevents sequential delay, it causes connection-pool contention during peak concurrent logins.

---

## 7. Staff Audit-Data Access Verification (`AUTH-001`)

- **Investigation:** Does restricted staff merely see a UI card shell, or is real audit data returned?
- **Server Verification (`page.tsx:48`):** `recentAudit = await db.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 8 })` is executed unconditionally for all users reaching this page.
- **Data Payload Passed to Client (`page.tsx:101-105`):** Full summary, actor name, action, and timestamp are included in `data.recentActivity`.
- **Client Rendering (`DashboardClient.tsx:254-280`):** The component maps over `data.recentActivity` and renders `a.summary` and `a.actor` without checking `can(session.role, 'audit:read')`.
- **Affected Roles:** `STAFF`, `ATTENDANT`, `DRIVER` fall through to `DashboardClient` and can read administrative audit summaries.
- **Mitigation:** Wrap the card in `{perms.audit && ( ... )}` and avoid querying `db.auditLog` on the server when the user lacks `audit:read`.

---

## 8. Reconciliation of Test Failures

### 8.1 Investigation of `B3-05` (`tests/auth/password-reset.test.ts`)
- **First (Cold) Run:** Failed with timeout at 5012ms.
- **Root Cause:** Test makes a live network call `fetch('http://localhost:3000/api/v1/auth/reset-password')`. Cold route compilation in Next.js took >5 seconds.
- **Second (Warm) Run:** Passed in **100.56ms** (5 passed, 0 failed across file).
- **Classification:** `TEST INFRASTRUCTURE / COLD COMPILATION TIMEOUT`.

### 8.2 Breakdown of 12 Design-System Failures (`tests/design-system/`)
All 12 failures are verified to be outdated string assertions on deprecated components:
1. `anti-patterns-remediation.test.ts:40`: Expects deprecated string `"rounded-full ${theme.activeDot} animate-pulse shrink-0"` in `AdmissionsNavigationRibbon.tsx`. Component was refactored to delegate to `GlobalModuleNavigation`.
2. `design-tokens.test.ts:122`: Expects `"[box-shadow:var(--shadow-1)]"` in `KpiMetricCard.tsx`. Component was upgraded to `.preone-kpi-card`.
3. `responsive-transformation.test.ts` (10 failures): Assert against deleted mobile `<select>` dropdowns and older tab rails that were replaced by `GlobalModuleNavigation`'s responsive popover.
- **Proof:** Modern component suites (`tests/ui/global-kpi-card.test.ts` with 27 tests and `tests/ui/global-module-navigation.test.ts` with 36 tests) test these exact components and pass 100%.

---

## 9. Audit Limitations

1. **No Headed Browser Execution:** Visual layout behaviors were verified using static CSS cascade analysis, DOM inspection, and Playwright probe definitions. No live headed browser screenshot capture was performed.
2. **Local PostgreSQL Environment:** Database queries were verified against local PostgreSQL. High-volume stress testing (e.g. 50,000+ invoices) was not performed on a live cloud cluster.
3. **Mock Cloud Integrations:** External third-party cloud services (AWS SES email delivery, n8n webhook listeners) run via local mocks.

---

## 10. Phase 01 Sign-off Decision

### Final Status: **READY WITH CONDITIONS**

### Justification:
The technical baseline of the PreOne dashboard architecture is complete, verified, and reconciled. Tenant isolation is verified. The defects identified (`DATA-001`, `DATA-002`, `AUTH-001`, `CSS-001`) are bounded, well-understood architectural gaps in the current implementation that define the exact requirements for Phase 02.

### Explicit Conditions for Phase 02:
1. **Design 5 Role-Specific Dashboard Personas:** Replace generic fallthrough with tailored blueprints for Executive (`OWNER`/`PRINCIPAL`), Academic Operations (`TEACHER`/`COORDINATOR`), Finance (`ACCOUNTS`), Front-Desk Logistics (`RECEPTIONIST`/`ATTENDANT`/`DRIVER`), and Family (`PARENT`/`GUARDIAN`).
2. **Mandate BFF Query Layer with `ScopeContext`:** Require Phase 02 dashboard endpoints to filter on `tenantId`, `branchId`, and `academicSessionId`.
3. **Filter Out CANCELLED and DRAFT Invoices:** Fix the revenue calculation flaw in Phase 02 financial specs.
4. **Gate Audit Log Activity Behind `audit:read`:** Remove administrative audit feeds from non-administrative staff views.
5. **Add `/app/dashboard` to Playwright Matrix:** Register `/app/dashboard` in `CORE_PAGES` across all 9 viewports in `tests/e2e/responsive-matrix.spec.ts`.

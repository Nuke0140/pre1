# PreOne — Responsive Viewport Matrix & Visual Diff Coverage Report

**Date:** 2026-10-24  
**Audit Baseline:** `main` at `3792b8fe92a8813dc65b36194bf2ffe518263d60`  
**Current Audit Branch:** `audit/whole-product-2026-10-24` (follow-up fixes pending CI verification)  
**Test Spec:** `tests/e2e/responsive-matrix.spec.ts`  
**Audit Probe:** `tests/e2e/responsive-probe.ts`  
**Baseline Fixture:** `tests/fixtures/responsive-sweep-baseline.json` (63 combinations)

---

## 1. Matrix Definition & Execution Parameters

### 1.1 Viewport Breakpoints (9 Viewports)

| Viewport Name | Dimensions (WxH) | Target Category | Breakpoint Rationale |
|---|---|---|---|
| `320-phone-compact` | 320 × 568 | Ultra-compact mobile | iPhone SE (1st gen) / Android compact (WCAG reflow minimum) |
| `390-phone-standard` | 390 × 844 | Modern standard phone | iPhone 13/14/15, modern flagship mobile portrait |
| `667x375-phone-landscape` | 667 × 375 | Short mobile landscape | iPhone SE / 8 landscape (vertical space crunch & floating docks) |
| `768-tablet-portrait` | 768 × 1024 | Standard tablet portrait | iPad Mini / 9.7" portrait |
| `820-tablet-air` | 820 × 1180 | Modern tablet | iPad Air / Pro 11" portrait |
| `1024-tablet-landscape` | 1024 × 768 | Tablet landscape | iPad landscape, compact laptops |
| `1280-laptop-13` | 1280 × 800 | 13-inch laptop | MacBook Air 13" default viewport |
| `1440-laptop-15` | 1440 × 900 | 15-inch laptop / desktop | MacBook Pro 15/16", standard external displays |
| `1920-desktop-1080p` | 1920 × 1080 | Full HD widescreen | Standard 1080p desktop monitors |

### 1.2 Audited Application Workspaces (7 Core Pages)

| Page Key | Route Path | Primary Layout Structures | Tested State Variations |
|---|---|---|---|
| `home` | `/app/home` | KPI Grid, Activity Stream, Quick Actions, Profile Trigger | Populated, Zero-State, Low-resolution header wrapping |
| `students` | `/app/students` | Visual Roster, Master-Detail, Classroom Rail, Student Table | Filtered by Classroom, Table Rail Scroll, Drawer Active |
| `daily-diary` | `/app/daily-diary` | Classroom Day Stream, Routine Cards, Timeline Feed | Empty Diary, Multi-student log, Modal Open |
| `finance` | `/app/fees` | Invoice Data Table, Fee Collection KPIs, Receipt Slips | Large Ledger, Cash Filter, Responsive Rail Overflow |
| `admissions` | `/app/admissions` | Kanban Pipeline, Stage Counters, Inquiry Cards | Pipeline Drag Mode, Tab Navigation, Compact Search |
| `settings` | `/app/settings` | Settings Rail Navigation, Multi-tab Form Panels | Form Focus, Mobile Tab Dropdown, Organization Hierarchy |
| `audit` | `/app/audit` | Audit Trail Table, Event Type Filters, Timestamp Column | High-volume log pagination, Constrained Card Rail |

---

## 2. 63-Combination Responsive Matrix Status

The table below presents the verified compliance for all 7 core pages across all 9 viewports:
- **(a) Reflow Integrity:** `document.scrollWidth <= window.innerWidth` (WCAG 1.4.10 compliance, no accidental horizontal page scroll)
- **(b) Clipped Elements:** 0 elements protruding past the viewport boundary unless enclosed in an explicit horizontal scroll rail (`overflow-x: auto`)
- **(c) Reachability:** Profile menu trigger and global navigation buttons remain accessible within viewport bounds

| Page | 320 Compact | 390 Standard | 667x375 Land. | 768 Tab-P | 820 Air | 1024 Tab-L | 1280 Lap-13 | 1440 Lap-15 | 1920 Desk | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Home** (`/app/home`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Students** (`/app/students`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Daily Diary** (`/app/daily-diary`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Finance** (`/app/fees`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | FAIL / dock overflow in current log | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Admissions** (`/app/admissions`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | FAIL / dock overflow in current log | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Settings** (`/app/settings`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | FAIL / dock overflow in current log | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |
| **Audit** (`/app/audit`) | NOT VERIFIED | NOT VERIFIED | FAIL / investigate | FAIL / investigate | FAIL / dock overflow in current log | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | **OPEN** |

**Summary:** 63 combinations are configured, but current CI verification is FAIL, not PASS. Run `40092919930` reports 14 Playwright failures after retries. Do not mark the viewport matrix verified until the updated audit branch completes the full suite successfully.

---

## 3. Current CI Failure Evidence (Run 40092919930)

The current workflow executed the configured 63 Playwright tests but ended with **14 failed** after retries. Therefore the original all-PASS table below was a target/baseline claim, not the current verified state. The actual logs show repeated `.dock-zone-right` / `.dock-datetime` overflow at 820×1180 and failures across multiple pages; the exact updated branch changes are pending rerun. Mark all combinations NOT VERIFIED unless a current run has a passing result for that page/viewport pair.

## 4. Historical Layout Defects Reported as Remediated

1. **Short Landscape Viewport Dock Overflow (`667x375-phone-landscape`):**  
   - *Defect:* In mobile landscape viewports with heights ≤ 375px, the floating dock navigation bar overlapped the bottom viewport boundary and obstructed table action buttons.  
   - *Fix:* Added `@media (max-height: 420px)` and landscape utility classes in commit `3792b8f` to compress dock padding, reduce icon size to 18px, and dock cleanly to the bottom edge.  
   - *Verification:* Verified via Playwright bounding rect checks.
2. **Compact Authentication Centering (`320-phone-compact`):**  
   - *Defect:* On small screens, auth modal card exceeded 568px height causing the bottom submit button to be clipped offscreen without a scrollbar.  
   - *Fix:* Configured `min-h-[100dvh] flex flex-col justify-center py-6 overflow-y-auto` in `AuthShell`.  
   - *Verification:* Verified in `tests/design-system/responsive-transformation.test.ts`.
3. **Data Table Horizontal Overflow without Rail:**  
   - *Defect:* Large tabular views (Students, Finance, Audit) forced document-level horizontal scroll on viewports < 1024px.  
   - *Fix:* Enclosed table elements inside `.rail-edge-fade` and `.overflow-x-auto` container with measured min-widths, keeping `document.scrollWidth === window.innerWidth`.  
   - *Verification:* Verified by `auditResponsiveProbe` in `tests/e2e/responsive-probe.ts`.

---

## 5. Test State Coverage & Gaps

### 4.1 Covered States
- Authenticated School Owner persona (`owner@sunshine.demo`)
- Populated database records via `scripts/seed-responsive-ci.ts`
- Client-side hydration wait and responsive probe evaluations
- Visual snapshot capture (`tests/visual-regression/snapshots/`)

### 4.2 Known Coverage Gaps & Next Phase Scope
- **Browser Diversity Gap:** Currently running Chromium only in CI. WebKit (Safari iOS engine) and Firefox (Gecko) should be added to the CI matrix prior to broad public release to catch Safari-specific `100dvh` and CSS flex-wrap bugs.
- **Role Persona Diversity:** Current sweep validates the `OWNER` executive persona. Additional sweeps should cover `TEACHER` (classroom-restricted view) and `PARENT` (ward-restricted mobile view).
- **Extreme Network & Offline States:** Responsive behavior under network throttle (Slow 3G) and skeleton loaders is covered by component tests but not in the automated Playwright matrix.

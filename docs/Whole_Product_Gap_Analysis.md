# PreOne — Whole-Product Gap Analysis

**Document:** `docs/Whole_Product_Gap_Analysis.md`
**Date:** 2026-10-17
**Status:** ANALYSIS DELIVERED — read-only; no production code modified
**Scope:** every implemented module of PreOne vs the canonical PreOne specification set (Master PRD §6–§9, DDD, BRC, ERD v3.0, Prisma Schema v3.0, API Contract Catalog, OpenAPI, Backend Technical Design, Engineering Standards, Enterprise Security Architecture/ADR-113, ADR series), plus a re-verification of the prior `docs/M01_Product_Conformance_Audit.md` findings at current HEAD.
**Baseline compared against:** `docs/M01_Product_Conformance_Audit.md` (2026-09-11), `docs/M00_Implementation_Impact_Map.md`, `docs/PreOne_Domain_Integration_Matrix.md`.

---

## 0. How to read this document

### 0.1 Verdict legend

| Badge | Meaning |
|---|---|
| **PASS** | Implementation matches the governing source for the audited scope |
| **PASS w/ warnings** | Matches on substance; named deviations are not product-breaking |
| **PARTIAL** | Some capability exists; material spec requirements are missing or divergent |
| **MISSING** | The spec feature/domain has no implementation |
| **STALE DECISION** | Docs declare a module deferred/off, but code ships it (or vice-versa) |

### 0.2 Severity rubric (normalized across this document)

| Severity | Definition |
|---|---|
| **P0** | Exploitable security defect, data-integrity defect, or a broken core path (crash / auth bypass / money or capacity corruption) |
| **P1** | Missing or broken capability the PRD marks P0 / an acceptance criterion, or a significant behavioral divergence |
| **P2** | Partial conformance, quality, secondary feature, UX-contract or authz weakness |
| **P3** | Doc drift, enhancement, cosmetic, dead code |

### 0.3 Evidence codes

| Code | Source |
|---|---|
| `SRC:` | Canonical docs in `upload/extracted/PREONE_DOC/MDs/` |
| `F:` | Implementation file + line (read directly by the auditor/sub-analyst) |
| `SCHEMA:` | `prisma/schema.prisma` |
| `M01:` | `docs/M01_Product_Conformance_Audit.md` (prior audit, 2026-09-11) |
| `GIT:` | `git` status / log at audit time |

### 0.4 Method and limitations (read this before citing numbers)

- The **base analysis is static** (source + schema + doc reading): no live server probes were used to derive §2–§6. As a follow-up, **static validation was executed** (`tsc --noEmit`, `bun test tests/`) and its results are appended in §7.3; those runs may promote or add findings. Where a sub-analysis says "not verified", it was not proven either way.
- Findings are grounded in file paths that were read at audit time. Claims from the prior M01 audit are only repeated where re-verified at HEAD.
- "Spec ref" cites the PRD section typically; the BRC/ERD may add stricter rules. Where sources conflict, the conflict is recorded in §7 rather than adjudicated.
- Codebase snapshot: HEAD `8db9bdb` (branch `main`), working tree **dirty** (24 tracked files modified, ~20 untracked paths — daily-diary, inventory supply-store/welcome-kits, tests). The audit covers the working tree as-is, not just committed code.
- Scale at audit time: **120 Prisma models**, ~**250 API route files**, **18 nav modules**, **68 test files**.

---

## 1. Executive summary

### 1.1 Verdict by module (PRD §8 map + beyond-PRD modules)

| # | Module | PRD ref | Verdict | One-line reason |
|---|---|---|---|---|
| 1 | Setup / onboarding (M00) | (M00 brief) | **PASS w/ warnings** | Setup state machine + config engine exist and are consumed by real workflows (see `M00` impact map); not re-audited in depth here |
| 2 | Marketing & CRM | §8.1 | **PARTIAL** | Rich lead pipeline exists; campaigns, lead score, funnel API, SLA tracking, real duplicate-merge absent |
| 3 | Admissions | §8.2 | **PARTIAL** | Application workflow + documents + offers + waitlist machine exist; numbering, offer-expiry enforcement, and the ERD admission entity diverge |
| 4 | Student Lifecycle | §8.3 | **PARTIAL** | Allocate/transfer/promote/withdraw exist; archive/alumni/DPDP-retention missing |
| 5 | Academics | §8.4 | **PARTIAL** | Observations/curriculum/report cards exist; approval chain, milestones, portfolio, AI draft missing; report-card PARENT path **crashes** |
| 6 | Daily Operations | §8.5 | **PARTIAL** | Attendance/care/daily-diary backbone is real and pillared by a correct follow-up engine; attendance & care **writes are not assignment-scoped** |
| 6b | Daily Diary (net-new) | (beyond PRD) | **PASS w/ warnings** | End-of-day report pipeline + routines + parent report exist and are classroom-scoped |
| 7 | Parent Communication | §8.6 | **PARTIAL** | Read-only timeline + one-way announcements work; **two-way chat and events/RSVP are absent**; multi-channel adapters fake success |
| 8 | Finance | §8.7 | **PARTIAL** | Invoicing/payments/receipts/deposits functional and recently hardened; GST, expenses, refund approval matrix, gateway, parental pay missing; **webhook unauthenticated** |
| 9 | Inventory & Procurement | §8.8 | **PARTIAL** (STALE DECISION) | Core PR→PO→GRN→stock loop works + new supply-cart/welcome-kits; no FIFO, reorder automation, stock-audit, valuation API; docs still say "not in MVP" |
| 10 | Human Resources | §8.9 | **PARTIAL** (STALE DECISION) | Staff/leave/payroll/recruitment/performance/offboarding real; no biometric, TDS slabs, usable bank file, self-review; docs say "feature flag OFF" |
| 11 | Administration | §8.10 | **MISSING** | Assets, visitors, maintenance, compliance dashboard, meal plans — none implemented (BR-011 is PRD **P0**) |
| 12 | Reports & Analytics | §8.11 | **PARTIAL** | 11 live reports + custom builder + strong role scoping; **predictive analytics absent**, `ReportSchedule` is dead schema, no true PDF, ~30 catalogue reports missing |
| 13 | Settings | §8.12 | **PARTIAL** | School config + notification rules + RBAC matrix solid; workflow builder and config versioning missing |
| 14 | Platform Management | §8.13 | **PARTIAL** | Tenant onboarding + audit + health exist; **subscription & billing and feature flags absent** |
| 15 | Transport | BR-028 (deferred) | **PARTIAL** (STALE DECISION) | Large first-party implementation shipped though spec defers it; **hardcoded fallback PIN + forgeable QR** |
| 16 | Users / RBAC / Security | §7 + ADR-113 | **PARTIAL** | Object-scoped RBAC, custom roles, session revocation, MFA, DPDP tooling added since M01; no RLS, audit not same-transaction, no hash chain |

### 1.2 Headline findings

1. **Security floor improved but not closed.** The M01 P0 IDOR class (9 unscoped id lookups) is **fixed** at HEAD — all re-verified routes now use a tenant-scoped helper (`src/lib/security/resource-scope.ts`). Payment idempotency + row-locking are **fixed**. The parent ledger + SSR leaks are **fixed**. **Still open:** login never checks `tenant.status` (suspended tenant can authenticate), no RLS, audit writes are not same-transaction. **New P0s:** unauthenticated/spoofable payment webhook (Finance), hardcoded fallback pick-up PINs and an unsigned/forgeable QR token (Transport), and a runtime crash on the report-card parent list.
2. **Three modules documented as "not in MVP" are shipped** (Inventory, HR, Transport) with no feature flag; conversely the PRD's **Administration** domain (BR-011, P0) ships nothing. The doc/code contract is out of sync in both directions.
3. **Two PRD P0 features are entirely missing:** **two-way parent chat + event RSVP** (§8.6) and **subscription & billing** (§8.13); **predictive analytics** (§8.11) is also absent.
4. **The happy-path core is genuinely strong.** Setup engine, follow-up state machine, enrollment transaction, admissions pipeline + waitlist machine, daily-diary pipeline, tenant-scoped helpers, and payments idempotency are real, tested, and well-built. Gaps concentrate at the *edges* (terminal lifecycle, approvals, cross-cutting security, missing modules).
5. **A build-time safety valve hides type errors, and testing proved it.** `next.config.ts` sets `typescript.ignoreBuildErrors: true`; `tsc --noEmit` surfaces **737 errors across 105 files**, and `bun test` finishes **637 pass / 21 fail**. Confirmed latent runtime breakages include the admissions pipeline-stage route (500), `GET /hr/schedule` (invalid Prisma relations), and `/users/username` (ReferenceError).
6. **Validation escalated one new P0.** `bun test` confirmed an **OTP authentication bypass**: `isDemoOtpAllowed()` unconditionally returns `true`, so codes `0000`/`1234` are accepted for every account in every environment (G-29).

### 1.3 What changed since the M01 audit (prior-findings re-verification)

| M01 finding | Status at HEAD | Evidence |
|---|---|---|
| P0-1 9 id-addressed lookups lack `tenantId` | **FIXED** | all six verified: `student-service.ts:330-331`; `admission-service.ts:1289-1290,1887-1888`; `applications/[id]/verify/route.ts:49-50`; `lead-service.ts:468-469,987-988`; `observations/[id]/publish/route.ts:21-22` |
| P0-2 capacity race → overbooking | **FIXED here / OPEN there** | `students/[id]/allocate/route.ts:55-69` and `academic-years/[id]/promote/route.ts:78` take `FOR UPDATE`; **enrollment** (`admission-service.ts:2112-2121`) and single `promoteStudent` (`student-service.ts:1625-1632`) still count without a lock |
| P0-3 payment idempotency + race | **FIXED** | `invoices/[id]/payments/route.ts:37,59-76,101-102,113-126,179-192`; unique `[tenantId,transactionRef]` `SCHEMA:812` |
| P0-4 parent ledger leak | **FIXED (new gaps)** | `invoices/route.ts:69-71`; `invoices/[id]/route.ts:41` guardian-scoped. *New:* `students/[id]/fees(+/schedule)` and `fee-structures` lack permission checks |
| P0-5 SSR student-page IDOR | **FIXED** | `app/app/students/[id]/page.tsx:11-27` session+scope guard; `student-service.ts:396-418` |
| P1-1 WAITLISTED→approval dead-end + waitlist machine | **FIXED** | `admission-service.ts:1295-1300`; full machine in `waiting-list-service.ts` + `admissions/waitlist/**` + UI |
| P1-2 student withdraw/transfer | **PARTIAL** | withdraw `students/[id]/status/route.ts:29-46`; transfer `students/[id]/transfer/route.ts`; promote present — **archive/alumni still missing** |
| P1-3 lead transition validation | **FIXED** | `lead-service.ts:703-717`; residual bypass in `markLost` (`:751-803`) |
| P1-6 teacher/class write scoping | **STILL OPEN** | `attendance/route.ts:209-214`, `care/route.ts:109-113` (tenant-only); **read** scope for `GET /students` was fixed (`student-service.ts:192-213`) |
| P1-7 parent provisioning | **FIXED** | `users/route.ts:930-987` → `FamilyUserService.createFamilyUser` |
| S-8 suspended tenant / stale cookie | **PARTIAL** | user-status + membership-status checks added (`auth/login/route.ts:185-231`); session revocation added (`auth-server.ts:44`); **`tenant.status` still never checked at login** |
| Phase 19 audit model (before/after, reason, atomic) | **PARTIAL** | model enriched with `oldValues/newValues/severity/ip/requestId` (`SCHEMA:1157-1183`); still best-effort non-`tx` default and no hash chain |
| P3-1 RLS defense-in-depth | **STILL OPEN** | `db.ts:72-77` plain `PrismaClient`; no RLS in migrations |

---

## 2. Cross-cutting findings

### 2.1 Tenant isolation & defense-in-depth
- **App-level isolation is now disciplined.** A shared helper set exists — `tenantScopedIdWhere`, `tenantScopedWhere`, `assertResourceScope` — in `src/lib/security/resource-scope.ts`, adopted across students, admissions, invoices, observations, payments.
- **No second layer.** `src/lib/db.ts:72-77` instantiates a bare `PrismaClient`; there is **no Prisma `$extends`/middleware tenant guard and no Postgres RLS** (ADR-043/044, ADR-113 §8). Isolation remains 100% dependent on per-query discipline — a single future omission re-opens the M01 IDOR class. **P2.**
- `branchId` is carried in the session/JWT but **not enforced** by most queries (branch scoping exists in `branch-context.ts`/`resource-scope.ts` but adoption is partial).

### 2.2 RBAC, branch/class/object scoping
- **Role list changed:** `src/lib/roles.ts:6-19` now defines 11 school roles + `PLATFORM_ADMIN`; `auth.ts` imports these and grants inventory/transport/hr/reports permissions. The 8-role model in the M01 audit and PRD §7.1 is now obsolete (product canon decision still pending — `M01` PC-1).
- **Object/branch scoping is partial:** `resource-scope.ts:116` `assertResourceScope` is used in only ~5 caller files; **attendance and care writes still validate only `tenantId`** (`attendance/route.ts:209-214`, `care/route.ts:109-113`). **P1.**
- **Page-level/RSC guards are inconsistent:** `app/app/students/[id]/page.tsx` guards; several `/app/*` pages and the `users/*` pages do not. **P2.**
- **Dead permissions persist** (`attendance:approve`, `academics:approve`) — granted, checked by no route. **P2.**

### 2.3 Audit trail
- Model enriched with `oldValues`/`newValues`/`severity`/`ipAddress`/`userAgent`/`requestId`/`branchId`/`academicSessionId` (`SCHEMA:1157-1183`; `audit-service.ts:201-239`).
- **Still best-effort:** when no `tx` is passed, `audit()` swallows its own errors (`audit-service.ts:234-238`); most callers pass no `tx`, so audit rows can be lost while the business mutation commits (violates ADR-113 §11.2 same-transaction rule). **P1.**
- **No hash chain / WORM / partitioning** (ADR-113 §11.3). **P2.**
- API-level immutability enforced (405 on mutation) — good.

### 2.4 API contract & error envelope
- Envelope `{success,data,meta?,traceId}` + typed error codes and `X-API-Version` are consistent with the API Catalog; `middleware.ts` authenticates but performs **no authorization** (every route self-scopes). **P2.**
- **Write-on-GET persists** in finance (`invoices`, `fee-schedules`, `students/[id]/fees`, `students/[id]/fees/schedule` `syncOverdue`) and in setup (`syncSetup`). **P2.**
- **Authorization gaps in routes that call `requireApi(req)` with no permission:** `students/[id]/fees`, `students/[id]/fees/schedule`, `fee-structures` (GET/POST). **P1.**

### 2.5 Notifications & channel honesty
- In-app notification model now exists (`InAppNotification`, `NotificationDeliveryLog`, `SCHEMA:4104,4127`) — the M01 statement "no delivery model" is outdated.
- **SMS and WhatsApp adapters write `status:'SENT'` / `delivered:true` with no provider HTTP call** when the env var is present — despite a header comment claiming "ZERO FAKE SUCCESS" (`channel-adapters.ts:10-11,242-263,320-341`). Email (SES/Gmail) is genuinely real. **P1 (honesty/ops).**
- `notification ≠ resolution` invariant still enforced (fee/care follow-ups stay open until a real resolving event). **PASS.**

### 2.6 Build / type safety
- `next.config.ts:8-10` `typescript.ignoreBuildErrors: true` masks **737 `tsc` errors across 105 files** (see §7.3). Confirmed instances include the parent timeline reading non-existent Prisma fields (`timeline/route.ts:49-54`), the report-card `guardianStudent` delegate, the broken admissions pipeline-stage route, and invalid Prisma relations in `hr/schedule`. **P1.**

### 2.7 Test coverage
- 68 test files exist across admissions, security, setup, daily-diary, inventory, design-system, auth, email. Coverage of the **new** security hardening (idempotency, scoping, revocation) appears present, but there is still **no cross-tenant live E2E pair per id-addressed route** and **no concurrency suite** in the style the M01 audit demanded (`M01` §23). **P2.**

---

## 3. Module gap analyses

> Each section: verdict, material gap table, strengths, decisions. Rows are trimmed to the material items; cite the referenced file:line.

### 3.1 Setup / onboarding (M00)
**Verdict: PASS w/ warnings** (not re-audited in depth).
- Setup engine (`src/lib/setup/{engine,validate,dependency-resolver,steps,config-service}.ts`), `SchoolSetup`/`SchoolSetupStep`/`SchoolSetupValidationRun`, config domains, go-live, and setup APIs all present; setup data is consumed by real workflows.
- Residual (from M00/M01): config domains store intent that some operational modules don't yet read (e.g. inventory config knobs are dead — see §3.9). `syncSetup` auto-completes steps **on GET** (write-on-GET). **P2.**

### 3.2 Marketing & CRM (PRD §8.1)
**Verdict: PARTIAL** — pipeline is rich; analytics/campaign layer is thin.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| No Campaign entity / ROI tracking (`campaign_id`) | FR-005, AC-004, R-MKT-004 | Missing | no `Campaign` model in `SCHEMA`; no campaign route | P2 |
| No lead score (R-MKT-005) | §8.1 field `score` | Missing | `SCHEMA:506-533` (no score) | P2 |
| No funnel analytics API (`GET /v1/leads/analytics/funnel`) | FR-004 | Partial | computed client-side `app/app/admissions/reports/page.tsx:157-185` | P2 |
| Lead response SLA (30 min) untracked | R-MKT-001 | Missing | no SLA/response field | P2 |
| Duplicate **merge** (30-day window) absent (only mark DUPLICATE) | R-MKT-002 | Partial | `lead-service.ts:808-846` | P2 |
| Counsellor double-booking check absent | R-MKT-003 | Missing | `followup-visit-service.ts:236-333`; `admission-service.ts:1008-1077` | P1 |
| Counselling not a model/state machine | FR-003; ERD §13.4.5 | Divergent | stored as `FollowUp` sourceType `CounsellingSession` | P2 |

**Strengths:** multi-channel intake; normalization + duplicate detection with audited override (`lead-service.ts:146-249,403-417`); full pipeline board, summary, visits, follow-ups, activity timeline.
**Decisions:** v1 scope for campaigns/score/funnel API.

### 3.3 Admissions (PRD §8.2)
**Verdict: PARTIAL** — flow works end-to-end; numbering/expiry/model diverge.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Enrollment capacity TOCTOU (count re-check, no lock) | R-ADM-002; M01 S-7 | Partial | `admission-service.ts:2112-2121` | **P0** |
| Offer number not sequential/unique (`OFR-<appseq>-<Date.now4>`), no unique constraint | ERD §13.4.9 | Divergent | `admission-service.ts:1535`; `SCHEMA:584-610` | P2 |
| Offer validity not clamped to 7–15 days; no expiry sweep / seat release | R-ADM-005 | Partial | `admission-service.ts:1451-1456,1632-1634` | P1 |
| Application `ADM-` prefix; no separate admission entity/admission_number | ERD §13.4.2/§13.4.7; M01 PC-2 | Divergent | `sequence.ts:31` | P2 |
| Numbering count-based, no lock (collision → 500) | M01 D-4 | Partial | `sequence.ts:72-78` | P1 |
| Program-level capacity unenforced | R-ADM-002; M01 PC-10 | Missing | only classroom capacity consulted | P1 |
| Lead→application convert lacks source-status guard | §8.1 workflow | Divergent | `lead-service.ts:984-990` | P2 |
| No per-document REJECTED/RESUBMIT workflow beyond boolean + reasons | ERD §13.4.2 | Partial | verify sets all-verified; rejection reasons exist | P2 |

**Strengths:** atomic enrollment tx with post-commit events; age + mandatory-doc gates; offer lifecycle with fee snapshot and sibling concession; **full waitlist machine** (priority, queue position, seat opportunity, offer, parent response, approve, complete, withdraw) + UI; tenant-scoped composite uniques.
**Decisions:** admission entity + APP/ADM numbering (PC-2); capacity level (PC-10); offer-expiry mechanism.

### 3.4 Student Lifecycle (PRD §8.3)
**Verdict: PARTIAL.**

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Archive & alumni (`alumni_until`, read-only, alumni access) | FR-014, R-STU-005/006 | Missing | `StudentStatus.ARCHIVED` enum only (`SCHEMA:1622`); no flow | P1 |
| DPDP retention (auto-archive 5–7y) for students | Goals/R-STU-006 | Missing | no retention job; DPDP service is users-only | P1 |
| Single-student promote capacity TOCTOU | R-STU-002 | Partial | `student-service.ts:1625-1632` | P1 |
| Transfer approval chain absent (executes immediately) | R-STU-003 | Missing | `student-service.ts:1474-1583` | P2 |
| Withdrawal sets `INACTIVE`, no `WITHDRAWN` status word | §8.3 enum | Divergent | `student-service.ts:1778-1785` | P2 |
| Promotion eligibility (completed session) not validated | R-STU-004 | Partial | `student-service.ts:1602-1605` | P2 |
| No student status transition machine | §8.3 | Partial | `updateStatus` accepts any status (`student-service.ts:1820-1854`) | P2 |
| No bulk-promote API route | §8.3 API | Partial | `bulkPromote` service exists, no route | P3 |
| Transfer Certificate flow absent | BRC R-ELG-013 | Missing | none | P2 |

**Strengths:** allocation history immutable; bulk promotion locked + idempotent; withdrawal guards dues; tenant/branch scoping via `resource-scope.ts`.
**Decisions:** archive/alumni scope + retention period (PRD 5y vs docs 7y); WITHDRAWN vocabulary.

### 3.5 Academics (PRD §8.4)
**Verdict: PARTIAL** — approval/milestone/portfolio/AI layer is missing or bypassed.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Report-card PARENT list calls invalid delegate `db.guardianStudent` (model is `StudentGuardian`) → runtime error | — | Broken | `academics/report-cards/route.ts:54` vs `SCHEMA:475` | **P0** |
| Report-card approval is single-level (any `academics:write` can `PUBLISHED`); `academics:approve` unused | R-ACD-010; M01 | Partial | `report-card-service.ts:857-867`; `academics/report-cards/[id]/route.ts:70-76` | P1 |
| Observation min-length is 10 (spec wants `< 20` reject) | R-ACD-005 | Divergent | `academic-service.ts:969` | P2 |
| `publishToTimeline` writes `PUBLISHED` directly, bypassing teacher approval | §8.4 `teacher_approved` | Divergent | `academic-service.ts:989,1004`; `observations/route.ts:68,94` | P2 |
| Daily-diary `createObservation` hardcodes `PUBLISHED`, no length check | R-ACD-005 | Divergent | `daily-diary-service.ts:853-866` | P2 |
| Milestone cycle + delay/percentile flags | R-ACD-006/007 | Missing | `academic-service.ts:1161-1259` (goals/progress only) | P2 |
| Portfolio auto-compile (≥4/week) | R-ACD-008 | Missing | no portfolio endpoint | P3 |
| AI observation assistant / report-card AI draft | R-ACD-005/R-ACD-009; SPEC §22 | Missing | no `aiSuggestion` field; no draft path | P3 |
| `milestones:read-linked`, `diary:read-linked` perms granted, never checked | — | Partial | `auth.ts:133,143,134,144` | P3 |

**Strengths:** curriculum/learning-areas/goals/subjects; real report-card PDF render into `GeneratedProfileDocument`; parent isolation on report-card list/detail (except the crash above).
**Decisions:** R-ACD-010 approval chain; hard-block vs flag for R-ACD-005; AI scope (PC-4); portfolio vs Growth Passport (PC-7).

### 3.6 Daily Operations (PRD §8.5) + Daily Diary (net-new)
**Verdict: PARTIAL (ops) / PASS w/ warnings (daily diary)** — backbone excellent; write-scoping + historical integrity missing.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| `POST /attendance` not assignment-scoped (any marker can mark any class) | §7.2; M01 | Missing | `attendance/route.ts:209-214` | P1 |
| `POST /care` not assignment-scoped | §7.2; M01 | Missing | `care/route.ts:109-113` | P1 |
| Attendance historical edit: no lock window / correction table / before-after payload; `attendance:approve` dead | ERD §16.4.4; AC-017/018 | Partial | `attendance/route.ts:228-345` | P1 |
| Parent timeline reads non-existent fields (photos/meal/nap/severity always undefined) | FR-026 | Broken | `timeline/route.ts:49-54` vs `SCHEMA:1035-1046` | P2 |
| Daily-sheet assertions live in free-form JSON (no validated fields) | §8.5; R-OPS-006 | Partial | `SCHEMA:2115-2124` | P3 |
| No typed `photos[]`/`mood`/`milestoneTags` on `Observation` | §8.4 | Divergent | `SCHEMA:1059-1087` | P3 |

**Strengths:** follow-up machine exact + dedupe + audit; full end-of-day daily-report pipeline (readiness→review→draft→publish) with persisted `DailyReport` and recipient counts; **daily-diary routes classroom-scoped** via `assertClassroomAccess`; parent daily report guardian-scoped; care safety fan-out (URGENT/EMERGENCY).
**Decisions:** attendance lock-window policy (PC-5); daily-diary permission naming (`attendance:*` vs `diary:*`).

### 3.7 Parent Communication (PRD §8.6)
**Verdict: PARTIAL** — the "two-way" and "events" halves are absent.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Two-way chat absent (no model/routes) | FR-027, AC-023 | Missing | no `Message`/`Conversation` in `SCHEMA` | P1 (PRD P0) |
| Event calendar + RSVP absent | FR-029, AC-025 | Missing | no `Event`/`EventRsvp` | P1 (PRD P0) |
| Announcement lacks `ack_required`/attachments/channels; publish doesn't dispatch notifications | §8.6 workflow | Partial | `announcements/[id]/route.ts:291-301` | P1 |
| No ack tracking; channel preference/consent/quiet-hours/caps absent | R-COM-005/006 | Missing | no preference/cap model | P1 |
| SMS/WhatsApp adapters fake success | BR-013 | Stub | `channel-adapters.ts:242-263,320-341` | P1 |

**Strengths:** recipient resolution server-side; in-app read model; genuine email (SES + Gmail) with bounce/complaint webhook; timeline aggregation for parents (once field mismatch fixed).
**Decisions:** v1 chat/events scope; channel set (M01 PC-8).

### 3.8 Finance (PRD §8.7)
**Verdict: PARTIAL** — hardening is real; GST/expenses/refund-approval/parental-pay and one webhook risk remain.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Payment webhook unauthenticated, no signature verify, `tenantId` from body | security | Broken | `payments/webhook/route.ts:7-33` | **P0** |
| GST always zero (no CGST/SGST/IGST/HSN) + no gst-report model/endpoint | R-FIN-002/007 | Missing | `fee-service.ts:553-554` | P1 |
| No Refund approval matrix / credit note / gateway refund; `approvedById = processedById` | R-FIN-003; ERD | Missing | `fee-service.ts:2564-2565` | P1 |
| Expense tracking entirely absent | FR-035; R-FIN-015 | Missing | no `Expense` model | P1 |
| Late-fee tiers and default escalation (Day7/14/30) not scheduled | R-FIN-002/004 | Missing | manual `/invoices/[id]/remind` only | P1 |
| Parental "Pay Now" missing; PARENT lacks `finance:write` | §8.7 Parent: R+pay | Missing | `parent/fees/route.ts:8` | P1 |
| Authz gaps: `students/[id]/fees(+/schedule)`, `fee-structures` use permissionless `requireApi` | authz | Broken | those route files | P1 |
| Gateway is config-only; `finance/gateway/test` returns success without a call | §8.7 | Stub | `fee-service.ts:1319`; `finance/gateway/test/route.ts` | P2 |
| Sibling discount hardcoded 10% (spec tiers 10/15/20%) | R-FIN-005 | Partial | `fee-service.ts:499-505,781` | P2 |
| Invoice numbering `INV-{FY}-{4}`, not `INV-{BRANCH}-{FY}-{SEQ:00000}` | R-FIN-008 | Divergent | `sequence.ts` | P2 |
| Write-on-GET `syncOverdue` across fee routes | — | Bug | `invoices/route.ts:51` et al. | P2 |
| Reports gap: GST filing, defaulters, expense, P&L | §8.7 reports | Partial | `fees/export*` only | P2 |

**Strengths (verified):** payment idempotency + unique constraint + `FOR UPDATE`; `paid+balance=total` invariant; guardian-scoped invoice reads; deposit model; real receipt generation.
**Decisions:** refund approval matrix and whether refunds are v1 (M01 PC-3, conflicting docs); numbering format; installment `YEARLY`→`ONE_TIME` fallback.

### 3.9 Inventory & Procurement (PRD §8.8)
**Verdict: PARTIAL + STALE DECISION** — real module; docs say "not in MVP".

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| No FIFO consumption (issues use `findFirst` unordered) | R-INV-006 (PRD) | Missing | `inventory-service.ts:2206-2212`; `welcome-kit-service.ts:961-963` | P1 |
| No reorder automation (event emitted, no consumer; no auto-PR) | R-INV-001/002 | Missing | `inventory-service.ts:2329-2337`; no consumer | P1 |
| No stock-audit entity/variance; adjustments self-approve | R-INV-005/009 | Divergent | `inventory-service.ts:2856-2862` | P1 |
| No valuation API; valuation = qty×unitCost (averageCost unused) | §8.8 API `/inventory/valuation` | Divergent | `inventory-service.ts:3113-3117` | P1 |
| 12 ERD tables missing (ReorderRule, LowStockAlert, DamagedItem, StockAudit, Kitchen*, SupplierInvoice/Payment, VendorContact/Rating) | ERD §17.4 | Missing | `SCHEMA:2308-2954` | P1 |
| Vendor approved-list + onboarding approval + GSTIN validation + rating | R-INV-004/006 | Missing | `SCHEMA:2351` (`isActive` only) | P1 |
| PO/PR multi-level approval thresholds; PO PDF/email/ack | R-INV-007; AC-031/032 | Missing | single-step approve; no PDF/mail | P1 |
| GRN quality step not mandatory; GRN always `FINALIZED`; `pendingGRNs` KPI queries unused `SUBMITTED` | §8.8; AC-033 | Divergent | `inventory-service.ts:1860,3077` | P2 |
| Return window not enforced; issue purpose optional; no returnable flag | R-INV-010; AC-034 | Partial | `returnStock`; `issueStock:2251` | P1/P2 |
| Wastage report absent; export only stock+movements | §8.8 reports | Partial | `inventory-service.ts:3175,3320-3354` | P1/P2 |
| Dead config knobs (`requirePRApproval`, `requireIssueApproval`, `lowStockThresholdPercent`) | — | Dead | `config.ts:85-90,176-178` | P2 |
| PR→approver / PO→vendor+accounts / GRN→accounts notifications absent | §8.8 notifications | Missing | no `notify` in `inventory-service.ts` | P2 |

**Strengths:** masters + PR→PO→GRN→stock loop with `StockMovement` ledger and audit; **negative-stock prevention** with atomic conditional decrement; GRN-PO matching + over-receive gate + vendor bill; **teacher supply cart** and **student welcome kits** (idempotent, tested).
**Decisions:** BRC vs PRD rule-ID collisions; MVP scope (docs say deferred) → reconcile; valuation basis (FIFO vs weighted-average); role map (PRD gives Coordinator "Full", Accounts "approve" — impl grants neither).

### 3.10 Human Resources (PRD §8.9)
**Verdict: PARTIAL + STALE DECISION** — real, DB-backed, but not spec-accurate on payroll.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| No biometric attendance/exception integration | R-HR-003 | Missing | none under `src/lib/hr`; punches only | P2 |
| TDS/PT hardcoded; no slabs | FR-042; AC-037 | Stub | `payroll-service.ts:141-144` | P1 |
| Bank file emits **masked** account number → unusable for NEFT | AC-037 | Broken | `payroll-service.ts:317` | P1 |
| Payroll day factor divides by `punches.length` | AC-037 | Questionable | `payroll-service.ts:120` | P1 |
| Self-review fields exist but no API writes them | AC-038 | Partial | schema `selfRating`/`selfComments` unused | P1 |
| No offer-letter artifact / auto onboarding tasks | §8.9; AC-039 | Partial | `recruitment-service.ts` | P1 |
| Probation stored but no confirm transition | R-HR-006 | Partial | `StaffProfile.probationEndDate` | P2 |
| `/hr/training` is a re-export of compliance | §8.9 | Stub | `hr/training/route.ts:1-4` | P2 |
| Spec API paths ≠ implementation | §8.9 API ref | Doc drift | `/hr/payroll` etc. | P3 |

**Strengths:** staff onboarding/360/update; leave apply/balance/approval/coverage; full payroll cycle→payslip→disbursement→CSV; recruitment→convert-to-staff; offboarding clearance tasks; real analytics.
**Decisions:** docs say "feature flag OFF" but module is live and ungated — reconcile; HR role in the RBAC canon.

### 3.11 Administration (PRD §8.10)
**Verdict: MISSING.** None of the five sub-domains exist; BR-011 (Compliance) is PRD **P0**.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Asset management (register/tagging/depreciation/disposal) | FR-044 / BR-018 | Missing | no `Asset` model | P1 |
| Visitor management (photo, host approval, check-in/out) | FR-045 / BR-017 | Missing | no `Visitor` model | P1 |
| Maintenance scheduling | FR-046 | Missing | no model | P1 |
| Compliance dashboard | FR-047 / BR-011 (**P0**) | Missing | `hr/compliance` is statutory HR certs, not this | P1 |
| Meal plans | §8.10; R-OPS-004 | Missing | no `MealPlan` model | P2 |

**Decisions:** is Administration in v1 at all? If not, re-baseline BR-011.

### 3.12 Reports & Analytics (PRD §8.11)
**Verdict: PARTIAL.**

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Predictive analytics absent | FR-050, AC-046 | Missing | none | P1 (PRD P0) |
| `ReportSchedule` schema exists but **zero code references** (no scheduler/delivery) | R-RPT workflows | Dead schema | `SCHEMA:3982`; grep 0 | P1 |
| No true PDF export (CSV / XLS-XML / print only) | §9 format; R-RPT-003 | Partial | `export-engine.ts` | P1 |
| ~11 reports vs ~40 catalogue; Compliance category entirely absent | §9.1–9.5 | Partial | `report-registry.ts:13-269` | P1 |
| Missing Management/Financial reports (NPS, attrition, branch compare, P&L, GST filing, refunds, expense) | §9.3–9.4 | Missing | not in registry | P2 |
| Dashboard widget customization absent | R-RPT-005 | Partial | fixed widgets | P3 |

**Strengths:** role-based data scope enforced in every report; custom builder save/preview; bulk document job pipeline (templates).
**Decisions:** predictive scope; scheduling delivery channel; PDF engine.

### 3.13 Settings (PRD §8.12)
**Verdict: PARTIAL.**

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Workflow builder absent | FR-053, AC-049 | Missing | no settings tab/routes; guardrail copy only | P1 |
| Feature-flag governance absent | R-SET-006 | Missing | grep 0 | P1 |
| Config versioning absent | R-SET-001 | Partial | audit only, no history/rollback | P2 |
| Notification rule lacks audience/timing fields (has events/channels/templates) | FR-052 | Partial | `settings/notifications/route.ts:45-57` | P2 |

**Strengths:** school config domain API (`config.ts` source of truth); notification rules + test send; RBAC permission matrix UI; user preferences.

### 3.14 Platform Management (PRD §8.13)
**Verdict: PARTIAL.**

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| Subscription & Billing absent (no plans/cycle/invoices/renewal/dunning) | FR-055, AC-051 | Missing | only `Tenant.subscriptionPlan` enum | P1 (PRD P0) |
| Feature flags absent | R-PLT-003 | Missing | grep 0 | P1 |
| Platform console is the tenant wizard; no `/app/platform`; nav points to `/onboard` | §8.13 | Partial | `nav.ts:38` | P2 |
| Platform reports (growth, MRR/ARR, churn, adoption) absent | §8.13 reports | Missing | none | P2 |
| No 7-year retention/partitioning on audit | R-PLT-006 | Missing | `M01:607` | P2 |

**Strengths:** tenant onboarding with seeding; suspend/activate; audit log capture/search/export; integration health with secret masking.

### 3.15 Transport (ADR-38; PRD BR-028 "deferred v1.1+")
**Verdict: PARTIAL + STALE DECISION** — a large first-party module shipped where the spec defers it.

| Gap | Spec ref | Status | Evidence | Sev |
|---|---|---|---|---|
| `verifyPin` accepts hardcoded fallback PINs `1234`/`0000` | security | **Auth bypass** | `transport-security.ts:259-266` | **P0** |
| QR token unsigned base64; scan doesn't verify signature/expiry | security | Broken auth | `transport-service.ts:2033-2038`; `scan/route.ts:35-101` | **P0** |
| `POST /trips` sends `driverId`/`date` but service expects `driverProfileId`/`tripDate` (silently ignored) | — | Broken | `trips/route.ts:70,93,95` vs `transport-service.ts:856,885` | P1 |
| `PATCH /trips/[id]` `VERIFY_ARRIVAL` passes `notes` where `studentIds[]` expected | — | Broken | `trips/[id]/route.ts:73` | P1 |
| `getTrips` filters non-existent `scheduledDate` → date filter ignored | — | Broken | `transport-service.ts:1595` | P1 |
| `DELETE /transport/vehicles/[id]` requires undefined `transport:admin` → always 403 | — | Broken | `vehicles/[id]/route.ts:67` | P1 |
| State-changing POSTs gated by read perm `transport:read` | RBAC | Weak | `selection/route.ts:11`; `unknown-person/request/route.ts:12` | P2 |
| `/transport/seed` exposed in prod (demo users + PIN 1234) | ops | Risk | `seed/route.ts:24` | P2 |
| `registered-guardian` upsert uses placeholder `stopId:'default-stop'` | — | FK risk | `registered-guardian/pickup|drop/route.ts` | P1 |

**Strengths:** masters + assignment (capacity concurrency + fee invoice); trips; pickup authorization/security; incidents → follow-up; tenant-isolated cross-tenant scan block.
**Decisions:** build vs partner (BR-028 says deferred/partner); GPS scope; whether transport is v1.

### 3.16 Users / RBAC / Security (PRD §7; ADR-113)
**Verdict: PARTIAL** (substantially hardened since M01).
Gap details are consolidated in §2.1–§2.4. Key items: no RLS/middleware tenant guard (P2), audit not same-transaction (P1), no hash chain (P2), partial branch/class scoping (P2), inconsistent page guards (P2), no persisted DPDP consent ledger (P2), custom-role management UI missing (P3).
**Strengths:** per-request session revocation; MFA step-up for privileged roles; custom dynamic RBAC with cycle guard; object-scope helper; PII encryption + masking; API-level audit immutability; parent provisioning path; CSV bulk overwrite with preview.

---

## 4. Consolidated gap register (critical & high)

> P0 = exploitable/broken core path. P1 = missing PRD-P0 / acceptance-criteria capability or significant divergence.

| ID | Sev | Module | Gap | Evidence |
|---|---|---|---|---|
| G-01 | P0 | Transport | Hardcoded fallback PINs `1234`/`0000` in `verifyPin` | `transport-security.ts:259-266` |
| G-02 | P0 | Transport | Unsigned/forgeable driver QR token; scan ignores signature/expiry | `transport-service.ts:2033-2038`; `scan/route.ts:35-101` |
| G-03 | P0 | Finance | Payment webhook unauthenticated + spoofable `tenantId` | `payments/webhook/route.ts:7-33` |
| G-04 | P0 | Academics | Report-card PARENT list crashes on invalid delegate `db.guardianStudent` | `academics/report-cards/route.ts:54` |
| G-05 | P0 | Admissions | Enrollment capacity TOCTOU (no lock) → overbooking | `admission-service.ts:2112-2121` |
| G-06 | P1 | Cross-cut | Suspended tenant can still log in (`tenant.status` never checked) | `auth/login/route.ts` (no `tenant.status`) |
| G-07 | P1 | Cross-cut | Audit not written in the business transaction; default `audit()` swallows errors | `audit-service.ts:234-238` |
| G-08 | P1 | Finance | Permissionless routes expose student finance / fee structures | `students/[id]/fees(+/schedule)`, `fee-structures` |
| G-09 | P1 | Comm | Two-way chat absent | no model/routes |
| G-10 | P1 | Comm | Event calendar + RSVP absent | no model/routes |
| G-11 | P1 | Comm | SMS/WhatsApp adapters fake `SENT` | `channel-adapters.ts:242-341` |
| G-12 | P1 | Platform | Subscription & billing absent | none |
| G-13 | P1 | Reports | Predictive analytics absent | none |
| G-14 | P1 | Reports | `ReportSchedule` dead; no scheduled delivery | `SCHEMA:3982` |
| G-15 | P1 | Settings | Workflow builder + feature flags absent | none |
| G-16 | P1 | Admin | Whole §8.10 Administration domain missing (BR-011 P0) | none |
| G-17 | P1 | Finance | GST zero; no gst-report | `fee-service.ts:553-554` |
| G-18 | P1 | Finance | Refund approval matrix / credit note absent | `fee-service.ts:2564-2565` |
| G-19 | P1 | Finance | Expense tracking absent | no model |
| G-20 | P1 | Finance | Parental payment + parent `finance:write` absent | `parent/fees/route.ts:8` |
| G-21 | P1 | Inventory | No FIFO; no reorder automation; no valuation API; stock-audit missing | §3.9 rows |
| G-22 | P1 | HR | TDS/PT hardcoded; bank file masked → unusable | `payroll-service.ts:141-144,317` |
| G-23 | P1 | Ops | Attendance & care writes not assignment-scoped | `attendance/route.ts:209-214`; `care/route.ts:109-113` |
| G-24 | P1 | Academics | Report-card approval single-level; `academics:approve` dead | `report-card-service.ts:857-867` |
| G-25 | P1 | Students | Archive/alumni + DPDP retention missing | `SCHEMA:1622` |
| G-26 | P1 | Transport | Multiple broken field mappings (trips create, verify-arrival, date filter, vehicle delete perm) | §3.15 rows |
| G-27 | P1 | Comm | Announcements don't dispatch notifications; no ack/attachments | `announcements/[id]/route.ts:291-301` |
| G-28 | P1 | Inventory | Vendor approval/rating, PO approval tiers, PO PDF/email missing | §3.9 rows |
| G-29 | P0 | Auth | `isDemoOtpAllowed()` always `true`; OTP accepts `0000`/`1234` in any environment → account takeover | `otp-service.ts:54-56,167,398,551` |
| G-30 | P0 | Admissions | `pipeline/[id]/stage` route references unimported symbols → HTTP 500 on every call | `pipeline/[id]/stage/route.ts:30-31` (reproduced by test) |
| G-31 | P1 | HR | `GET /hr/schedule` uses invalid Prisma relations (`branch` on Classroom, `staffProfile` singular) → query throws | `hr/schedule/route.ts:36,47,54` |
| G-32 | P1 | Users | `/users/username` throws `ReferenceError` on unimported `isValidUsername`/`normalizeUsername` | `users/username/route.ts:39,59` |

---

## 5. Remediation plan

### P0 — stop-ship (security / integrity / crash)
| # | Fix |
|---|---|
| P0-a | Remove hardcoded transport PIN fallbacks; hash PINs; add attempt rate-limiting (`transport-security.ts`). |
| P0-b | Sign QR tokens (HMAC with per-tenant secret) and verify signature + expiry on scan (`transport-service.ts`, `scan/route.ts`). |
| P0-c | Authenticate the payment webhook: verify provider signature, ignore body `tenantId`, resolve tenant from the payment record (`payments/webhook/route.ts`). |
| P0-d | Fix the report-card PARENT list delegate (`db.studentGuardian`) (`academics/report-cards/route.ts`). |
| P0-e | Add `FOR UPDATE`/conditional seat guard to `completeEnrollment` and single `promoteStudent`. |
| P0-f | Fix the OTP demo bypass: gate `isDemoOtpAllowed()` behind env flags and remove `'0000'` as the generated code (`auth/otp-service.ts`). |
| P0-g | Fix `pipeline/[id]/stage` route (import `normalizePipelineStageKey`/`ORDERED_PIPELINE_STAGES`) — currently 500s on every call. |

### P1 — spec-mandated capability / major divergence
- Enforce `tenant.status` at login + on session validation.
- Make `audit()` transactional by default (require `tx` or outbox); stop swallowing errors.
- Add missing permission checks to `students/[id]/fees(+/schedule)` and `fee-structures`.
- Assignment-scope `POST /attendance` and `POST /care`.
- Implement or re-baseline: two-way chat, events/RSVP, subscription & billing, predictive analytics, workflow builder, feature flags, Administration domain.
- Real SMS/WhatsApp delivery or remove the fake-success path.
- Finance: GST/tax breakup + gst-report; refund approval matrix + credit note; expense module; parental pay; scheduled default escalation.
- Inventory: FIFO, reorder automation + auto-PR, valuation API, stock-audit/variance, vendor approval/rating, PO approval + PDF/email.
- HR: slab-based TDS/PT, real bank file, self-review, offer letter + onboarding tasks.
- Reports: scheduled delivery, true PDF, Compliance report category, catalogue expansion.
- Student archive/alumni + retention; attendance lock window + correction capture; report-card multi-level approval.
- Fix transport field mappings + `transport:admin` perm + seed exposure.
- Comm: announcement multi-channel dispatch + ack/attachments; channel preferences/consent/caps.
- Fix `GET /hr/schedule` (invalid Prisma relations); fix `/users/username` imports; fix undefined JSX (`Trash2`, `FileSpreadsheet`) and conditional hooks flagged by ESLint.
- Fix async CSV import transaction handling (`staff-user-service.ts` re-insert after `P2002` runs in an aborted tx); enforce Aadhaar Verhoeff checksum; repair `launcher-preview` missing default export.

### P2 — quality / partial conformance
- Add RLS or Prisma tenant middleware (defense-in-depth).
- Hash-chain audit + retention/partitioning.
- Remove/fix write-on-GET (`syncOverdue`, `syncSetup`).
- Fix parent timeline field mismatch; turn off `ignoreBuildErrors` (or fix the masked errors).
- Page-level/RSC guards for all `/app/*` and `users/*` pages; adopt `assertResourceScope` broadly.
- De-duplicate BRC/PRD rule IDs; align numbering formats; campaign/lead-score/funnel API.
- Fix `pendingGRNs` KPI, dead config knobs, training stub, decorative UI (bell badge, trend arrows).

### P3 — cleanup / enhancement
- Delete dead code (`/api/v1/dashboard` if unused, dead permissions, `ReportSchedule` if deferred), config versioning, custom-role management UI, doc drift (API paths, stale MVP claims).

---

## 6. Product decisions required

| # | Decision |
|---|---|
| D-1 | **Role taxonomy canon** — 8-role PRD vs 12-role implementation + custom roles (M01 PC-1). |
| D-2 | **Module scope** — are Inventory / HR / Transport in v1? Docs say deferred/off via flag; code ships them ungated. Ratify or gate. |
| D-3 | **Administration §8.10** — in v1 (BR-011 is P0) or re-baseline? |
| D-4 | **Admission entity + APP/ADM numbering** (M01 PC-2). |
| D-5 | **Capacity level** — classroom vs program vs branch (M01 PC-10). |
| D-6 | **Refund approver matrix** — 4 conflicting source versions (M01 PC-3). |
| D-7 | **Attendance lock-window policy** (M01 PC-5). |
| D-8 | **AI scope v1** — observation assistant, report-card draft (M01 PC-4). |
| D-9 | **"Growth Passport"/portfolio** — distinct module or observations+timeline (M01 PC-7). |
| D-10 | **Notification channels v1** + consent/quiet-hours (M01 PC-8). |
| D-11 | **Audit hash-chain / WORM / retention** timeline (M01 PC-9). |
| D-12 | **Student retention period** — PRD 5y vs docs 7y; archive/alumni scope. |
| D-13 | **Inventory valuation basis** — FIFO (PRD) vs weighted-average (schema). |
| D-14 | **Transport build-vs-partner + GPS scope** (BR-028 deferred). |
| D-15 | **GST applicability** — is GST in scope for a preschool (education is largely exempt)? zero-tax-by-design vs missing. |

---

## 7. Appendix

### 7.1 Documentation conflicts carried forward (from M01 Appendix A)
Role taxonomy; `school_id`/`tenantId`; response-envelope (wrapped vs unwrapped); money representation; age-band labels; portal strategy; three ADR numbering universes; "Growth Passport" absent from all sources. **New conflicts found this pass:**
- **BRC vs PRD rule-ID collisions** in Finance (`R-FIN-*`), Inventory (`R-INV-*`), Communication (`R-COM-*`), Settings/Platform (`R-SET-*`/`R-PLT-*`).
- **MVP-scope inversion:** `docs/PreOne_Domain_Integration_Matrix.md:19` and `docs/M01_*Impact_Map.md:135` declare Inventory/Transport/HR "NOT IMPLEMENTED / OFF via configuration", while all three ship and are reachable with no feature flag.
- **Prior-audit staleness:** `M01:716` claims no notification recipient/delivery model — one now exists.

### 7.2 Method & limitations
- Static review only. No live probe, DB query, build, or test execution.
- Severity is normalized by the auditor; module sub-analyses used mixed P-levels that were remapped to the rubric in §0.2.
- Where a claim could not be confirmed, it was marked "not verified" in the sub-analysis and is not asserted here.
- This document complements (does not replace) `docs/M01_Product_Conformance_Audit.md` for the M00/M01 core journey; it extends coverage to all modules and re-verifies the prior P0/P1 list at HEAD `8db9bdb`.

### 7.3 Static & dynamic validation results (executed 2026-10-17)

These checks were run after the gap analysis to validate its claims. They **convert several \"masked\" findings into proven defects.**

**TypeScript (`npx tsc --noEmit`)** — **737 errors across 105 files** (exit 2). `next.config.ts:8-10` sets `typescript.ignoreBuildErrors: true`, so none of these fail the build/CI. Confirmed runtime impact where the missing symbol is used as a **value**, or an invalid Prisma relation is used:

| File:line | TS error | Runtime impact | Sev |
|---|---|---|---|
| `admissions/pipeline/[id]/stage/route.ts:30-31` | `normalizePipelineStageKey`, `ORDERED_PIPELINE_STAGES` not imported | `ReferenceError` on **every** PATCH → HTTP 500 (reproduced by the test run) | **P0** |
| `hr/schedule/route.ts:36,47,54` | include `primaryTeacher.staffProfile` (should be `staffProfiles`); `branch` has no relation on `Classroom`; `orderBy: { branch }` | Prisma throws → `GET /hr/schedule` broken | P1 |
| `users/username/route.ts:39,59` | `isValidUsername`, `normalizeUsername` not imported | `ReferenceError` whenever `preferred` is supplied | P2 |
| `hr/requests/route.ts` (`staffProfile`), `hr/compliance/route.ts` (`verified`/`documentType`/`title`) | wrong Prisma field names | wrong/empty payloads | P2 |
| `leads/route.ts:169-179` | `ProgramType` not imported — **type-only** use | compile-only; no runtime crash | P3 |
| UI: `app/app/admissions/page.tsx` (`reloadAll`), `app/app/setup/[step]/page.tsx` (`fd`, `FileSpreadsheet`), `components/admissions/PipelineCard.tsx` (`onPromoteSuccess`) | missing names | runtime crash on those code paths | P1/P2 |
| `academics/report-cards/*` (`Errors.bad`), `academics/report-cards/route.ts:54` (`db.guardianStudent`) | `bad` not a member of `Errors`; invalid delegate | **confirms G-04** | **P0** |

**Unit / integration (`bun test tests/`)** — **637 passed / 21 failed / 2 errors** across 658 tests in 73 files (146s). The 2 \"errors\" are Playwright `.spec.ts` files wrongly collected by `bun test`. Material failures:

| Suite | Failure | Interpretation | Sev |
|---|---|---|---|
| `admissions/admission-pipeline` (tests 1, 3, 6, 7) | stage keys `undefined`; illegal-transition `requireAction` mismatch (`ALLOCATE_CLASSROOM` vs `COMPLETE_ENROLLMENT`); `OFFER_SENT` vs `OFFER_ACCEPTED`; **PATCH stage → 500** | **Reproduces G-30** + pipeline contract drift | **P0/P1** |
| `auth/otp-verification` (BUG-029) | demo OTP still allowed with `NODE_ENV=production` | **Confirmed auth bypass** | **P0** |
| `security/login-resilience` (B1-01…B1-07) | all 7 timed out (5s) | server-dependent harness — needs triage | P2 |
| `auth/password-reset` (B3-05), `domain/domain-integrations` (B4-01) | timeout (5s) | server-dependent harness — needs triage | P2 |
| `security/async-csv-import` (test 4) | `P2002` then `25P02` aborted transaction in `staff-user-service.ts:230-234` | fallback create runs inside the already-aborted tx | P1 |
| `security/statutory-id-validation` | Aadhaar Verhoeff checksum not enforced (`998877665544` accepted); start-digit message mismatch | real validation gap | P2 |
| `security/user-p4-fixes` (N-9) | roles subtitle i18n string drift | cosmetic/test drift | P3 |

**Security escalation from testing — P0:** `src/lib/auth/otp-service.ts:54-56` `isDemoOtpAllowed()` returns `true` **unconditionally** (its docstring claims `ENABLE_DEMO_OTP`/`ALLOW_DEMO_OTP` gate it). `DEMO_OTP_CODES = ['0000','000000','1234']` are accepted at lines 167 and 551, and OTP generation sets the code to `'0000'` (line 398). Net effect: **OTP verification accepts `0000`/`1234` for any account in any environment → account takeover for any known identifier.** Logged as **G-29**.

**ESLint** — full `eslint .` was impractical (it crawls `scratch/` browser-profile bundles; see below). Scoped `npx eslint src` → **10 errors / 12 warnings** (exit 1). Real defects among them: `react-hooks/rules-of-hooks` (conditional `useCountUp`, conditional `useId` at `app/app/users/staff/page.tsx:610`) and `react/jsx-no-undef` (`Trash2` at `app/app/students/[id]/page.tsx:523`; `FileSpreadsheet` at `app/app/setup/[step]/page.tsx:920`) — the latter corroborate the tsc runtime crashes. Config gap: `eslint.config.mjs:51` ignores `node_modules/.next/out/build/next-env.d.ts/examples/skills` but **not `scratch/**`**, and many rules are off (`no-unused-vars`, `no-undef`, `no-console`, `prefer-const`), so lint is a weak gate.

**Next build (`next build --webpack`)** — **succeeds** (289 routes compiled, ~4.5 min), run in an isolated copy to avoid disturbing the running dev server. It prints "Skipping validation of types" (because `ignoreBuildErrors` is on), so a green build does **not** mean a type-clean tree. Build warnings that are real defects:
- `src/app/app/launcher-preview/page.tsx`: `LauncherButtonGallery` has no default export — the page is broken (**P2**).
- `middleware` file convention is deprecated in favour of `proxy` (Next 16) (**P3**).
- `src/lib/auth.ts` pulls in `jose`, which uses `CompressionStream`/`DecompressionStream` (Node APIs) — flagged unsupported in the Edge Runtime; relevant because `middleware.ts` runs on Edge (**P2**, potential prod Edge runtime failure).

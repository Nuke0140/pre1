# PreOne — M01 Product-Conformance Audit

**Document:** `docs/M01_Product_Conformance_Audit.md`
**Date:** 2026-09-11 · **Status:** AUDIT DELIVERED — IMPLEMENTATION FROZEN
**Scope:** M00 + M01 implementation vs PreOne canonical product architecture
**Rule in force:** No production code was modified during this audit (Phase 24). All findings below are backed by file/line references, live-DB queries, or reproducible live-API probes.

---

## 0. How to read this document

**Verdict legend:**

| Badge | Meaning |
|---|---|
| **PASS** | Implementation matches the governing source |
| **PASS w/ warnings** | Matches on substance; named deviations exist that are not product-breaking |
| **WARNING** | Partially conformant; deviations require remediation or a product decision |
| **FAIL** | Does not match the governing source; empirically proven defect |
| **UNDEFINED** | The sources do not define this, or the feature is not implemented and is conditional in the brief |

**Evidence codes:**

| Code | Source |
|---|---|
| `SRC:` | Canonical source docs in `upload/extracted/PREONE_DOC/MDs/` (PRD, DDD, BRC, ERD, Prisma v3, API Contract Catalog, Security Architecture/ADR-113, ADR series, ADR-38) |
| `SPEC:` | M01 brief (`upload/Pasted Content_1789078914113.txt`, §0–§64; byte-identical copy `…18648.txt`) |
| `F:` | Implementation file + line (read directly by the auditor) |
| `DB:` | Live read-only SQL against `postgresql://…54329/preone` |
| `PR-n` | Live adversarial probe run 2026-09-11 against the running production build (§24, scripts `scripts/audit-probes.sh`, `audit-probes2.sh`, helper `scripts/dbq.mjs`) |
| `T-nn` / `M-nn` / `S-nn` | m01-e2e.sh / m00-e2e.sh / smoke.sh test IDs |
| `IMAP:` | Implementation's own impact maps in `docs/` (self-declared contracts) |

**Conflict block format (Phase 1 requirement):**

```
DOCUMENT SAYS:      … (source, section)
IMPLEMENTATION DOES: … (file:line)
TEST EXPECTS:        … (test id, what it asserts)
CONFLICT:            …
RECOMMENDATION:      …
REQUIRES PRODUCT DECISION: YES/NO
```

---

## 1. Phase 1 — Source of Truth

### 1.1 Established hierarchy

```
LEVEL 1  PreOne approved product requirements   → Master PRD v1.0, ADR-38 (LOCKED), ADR-113 Security Arch (LOCKED)
LEVEL 2  Canonical business workflows           → DDD v1.0, BRC v1.0, ADR Series Phase 2–5
LEVEL 3  UI/UX requirements                     → UI Design Philosophy v1.0, Frontend Architecture v1.0
LEVEL 4  API contracts                          → API Contract Catalog v1.0, OpenAPI Spec, Backend Technical Design
LEVEL 5  Database implementation                → ERD v3.0, Prisma Schema v3.0, actual prisma/schema.prisma + live DB
LEVEL 6  Automated tests                        → Test Strategy v1.0, docs/PreOne_End_to_End_Test_Matrix.md, scripts/*.sh
```

Where the M01 brief (SPEC) is stricter than the generic docs, **SPEC wins for M01 conformance**, because it is the most recent approved instruction set. Where ADR-38/ADR-113 (LOCKED) conflict with older docs, the LOCKED ADR wins.

### 1.2 ⚠️ Meta-finding: three ADR numbering universes

`SRC` contains (a) the legacy "ADR Catalog v1.0, ADRs 1–53" cited by PRD/DDD/BRC, (b) the ADR Series Phase 2–5 (160 ADRs, Vol1 001–020 Foundation, Vol2 021–040 DDD patterns, Vol3 041–060 Data, Vol4 061–090 Security), and (c) standalone LOCKED ADRs (ADR-38 Changes, ADR-111 DevOps, ADR-113 Security). Numbers collide across universes (e.g. "ADR-038" = Domain Invariants in the Series, "Universal User Context" in DDD's mapping, and "Single Mobile App Strategy" in the PDF). **Every remediation that cites an ADR must name its universe.** This is itself a documentation defect to be resolved by product.

### 1.3 Document-level conflicts that this audit will NOT auto-resolve

Per Phase 1 ("DO NOT automatically change the documentation; DO NOT automatically change the implementation"), the following conflicts between source docs are recorded in Appendix A and are flagged **REQUIRES PRODUCT DECISION** rather than counted as implementation faults: role taxonomy (6+ divergent lists), `school_id` vs `tenantId` discriminator, response envelope (OpenAPI §10.1 unwrapped vs Catalog §8.1 wrapped), refund approval matrix (4 versions), money representation (paise-int vs decimal VO), age-band labels (Jr.KG/Sr.KG vs LKG/UKG), ADR-38 single-mobile-app vs separate parent/teacher portals.

---

## 2. Phase 2 — Canonical Tenant Architecture

**Required hierarchy (SPEC §6/§7, SRC ERD §10–14):**

```
PREONE PLATFORM → SCHOOL TENANT → BRANCH → ACADEMIC YEAR → CLASS/SECTION → STUDENT
```

**Implemented:** `Tenant → Branch → AcademicSession → Classroom → Student` (schema models 1/2/5/6/7). The chain exists and every business table carries `tenantId`. `DB:` all 33 tables match the schema; per-tenant counts correct; zero rows with NULL `tenantId` in any business table.

**Verdict: FAIL — hierarchy correct, isolation NOT enforced.**

`F: src/app/api/v1/students/[id]/route.ts:16` — `findFirst({ where: { id, deletedAt: null } })` — **no tenantId**. Identical defect verified first-hand at:

| Endpoint | Lookup without tenant scoping |
|---|---|
| `GET /api/v1/students/{id}` | `F:…/students/[id]/route.ts:16` |
| `GET /api/v1/invoices/{id}` | `F:…/invoices/[id]/route.ts:16` |
| `POST /api/v1/invoices/{id}/payments` | `F:…/invoices/[id]/payments/route.ts:35` |
| `POST /api/v1/applications/{id}/approve` | `F:…/applications/[id]/approve/route.ts:26` |
| `POST /api/v1/applications/{id}/reject` | `F:…/applications/[id]/reject/route.ts:20` |
| `POST /api/v1/applications/{id}/verify` | `F:…/applications/[id]/verify/route.ts:20` |
| `PATCH /api/v1/leads/{id}` | `F:…/leads/[id]/route.ts:19` (also no `deletedAt` check) |
| `POST /api/v1/leads/{id}/convert` | `F:…/leads/[id]/convert/route.ts:17` |
| `POST /api/v1/observations/{id}/publish` | `F:…/observations/[id]/publish/route.ts:20` |

The correct pattern (`findFirst({ where: { id, tenantId } })`) already exists in the same codebase (`applications/[id]/waitlist`, `invoices/[id]/remind`, `operations/follow-ups/[id]`), so remediation is mechanical, not architectural.

**Per-resource isolation matrix (list endpoints are tenant-scoped ✓ unless noted):**

| Resource | List/queries | id-addressed ops | Proven by |
|---|---|---|---|
| users, tenants | ✓ (tenants = platform-scoped by design) | tenants/{id} platform-scoped ✓ | S18 |
| admissions (leads, applications, documents) | ✓ | **✗ leads/{id}, convert, approve, reject, verify** | PR-3 |
| students | ✓ | **✗ students/{id}** | PR-2 |
| parents (guardians) | ✓ via student/guardian joins | n/a | T28 |
| classes (classrooms) | ✓ | allocate: classroom tenant-checked ✓ | T39, PR-8 |
| attendance | ✓ | upsert keyed (studentId,date), tenant-checked ✓ | T13 |
| activities (care/timeline) | ✓ (PARENT self-scoped) | n/a | T28 |
| observations | ✓ (TEACHER self-scoped list) | **✗ publish** | — |
| fees (invoices, payments, receipts) | ✓ | **✗ invoices/{id}, payments** | PR-4 |
| receipts | ✓ (tenantId backfilled, unique per tenant) | via payment | DB: no dup receipt numbers |
| communications | ✓ | n/a | — |
| notifications (timeline funnel) | ✓ | n/a | — |
| reports (dashboards) | ✓ tenant-wide (branch NOT enforced — see Phase 3) | n/a | — |
| Growth Passport (observations) | ✓ list | **✗ publish** | — |
| audit logs | ✓ | read-only | T48 |

**Live probes (Phase 2 "test cross-tenant access explicitly"):**

- **PR-2 CONFIRMED** — Owner of tenant SUNSHINE called `GET /api/v1/students/{student of tenant M01230515}` → `200` with full profile (guardians, invoices, timeline) of another tenant's child.
- **PR-3 CONFIRMED** — Same owner `PATCH /api/v1/leads/{M01-tenant lead}` → `200`, record mutated (`tenantId` in response belongs to M01231331).
- **PR-4 CONFIRMED** — Same owner `POST /api/v1/invoices/{M01-tenant invoice}/payments` ₹1 → `201`; the M01 tenant's invoice moved to `PARTIALLY_PAID` with a sunshine-actor payment. **Money mutated across tenants.**

```
DOCUMENT SAYS:       ERD §5: every tenant-scoped row filtered by school/tenant; Security Arch (ADR-113) §8: 4-layer authz incl. object-level; SPEC §45: "cross-domain workflow preserves tenant/school/branch/AY isolation".
IMPLEMENTATION DOES: 9 id-addressed endpoints resolve records by raw id with no tenant predicate (list above).
TEST EXPECTS:        T26 asserts only PARENT-without-link 403 on ONE student within the same tenant; no test ever holds two tenant sessions (Test agent §D-1: cross-tenant coverage = 0).
CONFLICT:            Security boundary claimed by docs is absent on the object level; the suite that "passes 49/49" cannot see this class of defect.
RECOMMENDATION:      P0 — introduce a single tenant-scoped fetch helper (e.g. findTenant(db.model, id, tenantId)) and route ALL id-addressed lookups through it; add a cross-tenant E2E pair (tenant A session × tenant B fixtures) for every id-addressed route.
REQUIRES PRODUCT DECISION: NO
```

Also in this phase: `middleware.ts` authenticates (`/app/*`, `/onboard/*`, `/api/v1/*`) but performs **no authorization and no tenant check**; `requireApi()` (F: src/lib/auth-api.ts:7-17) likewise — every route self-scopes, and 9 of them forgot. `SRC` ADR-043/044 mandate RLS defense-in-depth (`app.tenant_id`/`app.school_id` settings + policy); the implementation has **no RLS and no Prisma middleware** — isolation is 100% dependent on per-query discipline. (See Phase 21.)

---

## 3. Phase 3 — Role / RBAC Audit

**Implemented roles (F: src/lib/auth.ts:8-16):** `PLATFORM_ADMIN, OWNER, PRINCIPAL, COORDINATOR, TEACHER, ACCOUNTS, RECEPTION, PARENT` — roles are per-tenant (`TenantUser.role`), user identity is global (`User.email` unique platform-wide), JWT carries `uid/email/name/tenantId/branchId/role` (7-day HS256 cookie).

**ROLE DOCUMENT (auditor-derived, verified against F: auth.ts:28-77):**

| ROLE | TENANT | BRANCH ACCESS | MODULE ACCESS (from permissions) | CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT | FINANCIAL | STUDENT ACCESS | PARENT ACCESS | AI ACCESS | AUDIT ACCESS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PLATFORM_ADMIN | platform (tenantId null) | none | tenants, onboard | ✓ tenants | ✓ all tenants | ✓ status | — | — | — | — | — | — | — | audit:read |
| OWNER | own | *de jure* all, **not enforced** | all school modules (`'*'` minus `platform:*`) | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| PRINCIPAL | own | *de jure* all, **not enforced** | students/admissions/attendance/finance/comms/academics/timeline/settings/users/audit/operations | ✓ | ✓ | ✓ | — | ✓ admissions:approve | — | ✓ | ✓ | ✓ | — | ✓ |
| COORDINATOR | own | **not enforced** | students/admissions/attendance/finance:read/comms/academics/timeline/settings:read/users:read/operations | ✓ | ✓ | ✓ | — | — | — | read | ✓ | ✓ | — | — |
| TEACHER | own | **not enforced** | students:read/attendance/academics/comms:read/timeline/operations | — | ✓ (tenant-wide!) | own-class writes only (UI), **any-class via API** | — | — | — | — | tenant-wide read | — | — | — |
| ACCOUNTS | own | **not enforced** | students:read/finance/attendance:read/audit:read/operations:read | — | ✓ | finance ✓ | — | — | — | ✓ | read | — | — | ✓ |
| RECEPTION | own | **not enforced** | students/admissions:read+write/comms:read/timeline:read | ✓ students | ✓ | ✓ | — | **no approve** (UI shows buttons → 403) | — | — | ✓ | — | — | — |
| PARENT | own | own children only | timeline:read/communication:read/**finance:read** | — | own-child (timeline ✓, **invoices ✗ leak**) | — | — | — | — | read-own (leak) | own | — | — | — |

**RBAC at both levels?**

- **Server/API level: YES for coarse permissions** — every protected route calls `requireApi(req, perm)`; 401/403 verified live (`PR-1`: no-cookie → 401; T25/T26/M-T41/S18 for role 403s). The wildcard rule is correct and hardened: `'*'` never grants `platform:*` (F: auth.ts:84) — the Task-7 privilege-escalation fix is intact.
- **Server/API level: NO for object/branch/class scoping.** `session.branchId` exists in the JWT but **no route ever filters by it**; teacher assignment is checked only in `GET /teacher/today` and `GET /operations/follow-ups` (F: …/follow-ups/route.ts:34-42) but **not** in `POST /attendance` (any `attendance:mark` holder marks any classroom in the tenant — F: …/attendance/route.ts:73-77), `POST /care`, or `GET /students` (TEACHER sees the full tenant roster).
- **UI level: nav only.** `navForRole()` (F: src/lib/nav.ts:36-42) filters nav entries; there are **no page-level role guards** except `/onboard` (server-checked) and the dashboard role-split. A hidden nav item is treated as the security boundary — exactly the anti-pattern the brief forbids ("A hidden button is NOT sufficient security").
- **SSR bypass: CONFIRMED.** `F: src/app/app/students/[id]/page.tsx` queries the DB directly in the server component with **no session/role/guardian check**; middleware only authenticates. **PR-7 CONFIRMED**: `parent@sunshine.demo` fetched `/app/students/{non-child student}` → HTTP 200 page rendering the child's name and invoice `INV-2026-0003`.

**Dead permissions:** `attendance:approve` and `academics:approve` are granted to PRINCIPAL (F: auth.ts:34,37) and checked by **no route** — approval gates that the docs assign to these concepts (attendance corrections after day-end, report-card publish) are simply absent.

**Role list vs docs — CONFLICT (product-level):**

```
DOCUMENT SAYS:       PRD §7.1/§7.2 defines 8 primary roles incl. Platform Admin, School Owner, Coordinator, Accounts, Reception; ERD §11.4.5 codes CENTER_HEAD…; Prisma seed v3.0 uses PLATFORM_ADMIN/SCHOOL_ADMIN/ACCOUNTANT/RECEPTIONIST/LIBRARIAN; Security Arch adds HR/Finance/Student; ADR-38 adds Inventory/Transport. Six-plus divergent lists (Appendix A-1).
IMPLEMENTATION DOES: PLATFORM_ADMIN/OWNER/PRINCIPAL/COORDINATOR/TEACHER/ACCOUNTS/RECEPTION/PARENT — matches PRD §7.1 most closely; no LIBRARIAN/HR/INVENTORY/TRANSPORT.
TEST EXPECTS:        T25/T26/M-T41 cover only 2 role boundaries (teacher→approve, parent→student).
CONFLICT:            Implementation role list ≠ any single doc list; no doc was designated canonical.
RECOMMENDATION:      Ratify the implemented 8-role list as LEVEL-1 canon in the PRD, record others as legacy/superseded (ADR needed).
REQUIRES PRODUCT DECISION: YES
```

**Verdict: WARNING.** Coarse-grained server RBAC is real and tested; branch/class/object-level authorization and page-level guards are missing; PARENT `finance:read` currently buys the whole tenant ledger (PR-6).

---

## 4. Phase 4 — Admission Flow Audit

**Canonical conceptual flow (SPEC §8; SRC DDD §20.2):**

```
LEAD → CONTACT/FOLLOW-UP → INTERESTED → VISIT → APPLICATION → DOCUMENT VERIFICATION
     → REVIEW → APPROVAL → ENROLLMENT → STUDENT
```

**Implemented flow (code-verified):**

```
Lead(NEW→CONTACTED→QUALIFIED→NURTURE→APPLICATION_STARTED→CONVERTED|LOST|DUPLICATE)
  └─convert→ AdmissionApplication(SUBMITTED→DOCUMENT_PENDING?→VERIFIED→UNDER_REVIEW→APPROVED|REJECTED|WAITLISTED|ENROLLED|WITHDRAWN)
       ├─ documents: ApplicationDocument{verified:boolean, verifiedAt, remarks}  (+/verify route sets all verified)
       ├─ approve→ Student + Guardian + StudentGuardian + StudentAllocation + Invoice (ONE tx) ; Application→ENROLLED
       └─ waitlist→ ApplicationStatus.WAITLISTED + ADMISSION follow-up
```

**Separation check (Phase 4 "Do NOT merge CRM stages and admission statuses"):**

| Domain | Implementation | Separate? |
|---|---|---|
| Lead Status | `LeadStatus` enum, 8 values | ✓ separate enum |
| Application Status | `ApplicationStatus` enum, 9 values | ✓ separate enum |
| Document Status | `ApplicationDocument.verified: Boolean` + verifiedAt/remarks | ⚠ boolean, not a status machine (docs: `VerificationStatus PENDING/VERIFIED/REJECTED/RESUBMIT` — ERD §13.4.2); no REJECTED/RESUBMIT per-document state |
| Approval Status | `Application.approvedAt` + `rejectionReason` | ⚠ no separate Approval entity/record (docs ERD §13.4.6 approval w/ decision + level 1–4); approval is an event timestamp on the application |
| Enrollment Status | `ApplicationStatus.ENROLLED` + `StudentAllocationStatus` | ⚠ **enrollment folded into application status**; no Enrollment entity/status |
| Student Status | `StudentStatus` enum, 5 values | ✓ separate enum (but no transition endpoints — Phase 11) |

The five domains are **field-separated** but not **entity-separated**: the brief's core demand ("Do not allow one status field to represent all of them") is met at the column level; the doc-level model (separate Admission aggregate with `admission_number ADM-YYYY-NNNNN`, ERD §13.4.7) is not implemented.

```
DOCUMENT SAYS:       ERD §13.4.2 application_number = APP-YYYY-NNNNN; ERD §13.4.7 admission_number = ADM-YYYY-NNNNN on a separate admission record; DDD §8.2 Admission Aggregate.
IMPLEMENTATION DOES: F: src/lib/sequence.ts:17 — application numbers use prefix 'ADM' (`ADM-YYYY-####`); students use `STU-YYYY-####` (approve route); no admission entity exists (application row IS the admission).
TEST EXPECTS:        T05/T07 assert applicationId/studentId exist; nothing asserts numbering semantics.
CONFLICT:            'ADM-' prefix is attached to applications; docs attach it to admissions; no admission record exists.
RECOMMENDATION:      Either rename application prefix to APP- (align ERD) or document ADM- as the canon for applications; decide whether an Admission entity is required for v1 or the application row is the admission (then update ERD).
REQUIRES PRODUCT DECISION: YES
```

**Lead pipeline entanglement:** `LeadStatus.APPLICATION_STARTED` (lead has an application) and `CONVERTED` (application approved → student) are lead-side mirrors of application events. This is a pipeline-vs-status conflation the brief warns about, though it does not cause data corruption — convert only fires from non-CONVERTED leads and approve flips the source lead (F: approve/route.ts:179-184).

**Visit/counselling:** no visit scheduling, no counselling record (ERD §13.4.5 counselling SCHEDULED/…, recommendation APPROVE/REJECT/WAITLIST) — `UNDEFINED` in implementation; the M01 brief does not mandate them.

**Verdict: WARNING** — statuses separated; document/approval/enrollment sub-domains simplified beyond the documented model; one numbering misnomer; waitlist dead-end (Phase 7).

---

## 5. Phase 5 — Admission State Machine

**Implemented state machines (code-verified):**

**LEAD** (`LeadStatus`: NEW, CONTACTED, QUALIFIED, NURTURE, APPLICATION_STARTED, CONVERTED, LOST, DUPLICATE)

```
DOCUMENT SAYS:       ERD §12.4.4 LeadStatus: NEW → CONTACTED → QUALIFIED → CONVERTED/LOST (+ LeadScoreTier).
IMPLEMENTATION DOES: richer enum ✓; but F: leads/[id]/route.ts:19-26 accepts ANY enum value on PATCH with no transition validation — LOST→CONVERTED→NEW are all freely assignable.
TEST EXPECTS:        no lead-transition test exists.
CONFLICT:            Lead has a status *list*, not a state *machine*.
RECOMMENDATION:      P1 — validate transitions in leads PATCH (allow forward pipeline + LOST/DUPLICATE side-exits only); add transition tests.
REQUIRES PRODUCT DECISION: NO
```

**APPLICATION** (`ApplicationStatus`: SUBMITTED, DOCUMENT_PENDING, VERIFIED, UNDER_REVIEW, APPROVED, REJECTED, WAITLISTED, ENROLLED, WITHDRAWN)

Enforced gates (verified in code):
- `verify` requires status ∈ {SUBMITTED, DOCUMENT_PENDING, UNDER_REVIEW} (F: …/verify/route.ts:20) ✓
- `approve` requires status ∈ {VERIFIED, UNDER_REVIEW} + all configured docs verified + capacity (F: …/approve/route.ts:28-72) ✓
- `reject` blocked if ENROLLED ✓
- `waitlist` blocked from {ENROLLED, REJECTED, WITHDRAWN} ✓
- **DEAD-END:** a WAITLISTED application has **no path to approval** — `approve` requires VERIFIED/UNDER_REVIEW, and `verify` does not accept WAITLISTED. When a seat frees, the waitlisted applicant can never be admitted.

```
DOCUMENT SAYS:       ERD §13.4.8 waiting_list: auto-promotion when seat opens, offer expiry; M01 SPEC §9/S5: full → block → waitlist; user's Phase 7 defines WAITLIST→ADMITTED.
IMPLEMENTATION DOES: waitlist is a terminal status + follow-up; no promotion path, no position/priority/offer-expiry.
TEST EXPECTS:        T38-T40 test capacity block only by changing capacity, never waitlist promotion ("no waitlisted applicant exists to be promoted" — test agent §D-14).
CONFLICT:            WAITLISTED→APPROVED transition required by docs is impossible in code.
RECOMMENDATION:      P1 — allow approve from WAITLISTED (gated on capacity) or add explicit waitlist→review transition; add promotion test.
REQUIRES PRODUCT DECISION: NO (mechanism obvious; only trigger policy needs a decision)
```

Also missing vs docs: no `DRAFT` state (ERD has it; impl applications are born SUBMITTED — acceptable simplification, note only). `WITHDRAWN` is reachable only via the enum — **no endpoint sets it**.

**ENROLLMENT** — no states of its own; `ENROLLED` (application) + `StudentAllocationStatus` (ACTIVE, COMPLETED, TRANSFERRED, PROMOTED, WITHDRAWN). The user's example machine (PENDING/READY/COMPLETED/CANCELLED) is **UNDEFINED** in the implementation; allocation history rows are the de-facto enrollment record (IMAP I-8).

**STUDENT** (`StudentStatus`: ACTIVE, INACTIVE, TRANSFERRED, GRADUATED, ARCHIVED) — **no transition endpoints exist** (Phase 11). Live data: all 32 students ACTIVE.

**FOLLOW-UP** (`FollowUpStatus`: OPEN, ACKNOWLEDGED, IN_PROGRESS, WAITING, RESOLVED, CLOSED) — **exact match to SPEC §42**; transitions enforced by map (F: src/lib/followups.ts): OPEN→{ACK,IN_PROGRESS,WAITING,RESOLVED,CLOSED}, …, RESOLVED→CLOSED only, CLOSED→OPEN reopen; resolve records resolvedAt/resolvedByName/outcome; reopen clears them. Dedupe via unique `dedupeKey` (idempotent re-raise returns the live row). **PASS** — this is the best-conformed machine in the codebase.

**ALLOCATION** — §10 mandates 6 operations: initial ✓, section change ✓, transfer ✓, promotion ✓, withdrawal (enum only — no endpoint), **archive — no enum value, no operation**.

**Verdict: WARNING.** FollowUp machine conforms exactly; Application has real gates but a fatal WAITLISTED dead-end; Lead has no transition control; Student has no machine at all.

---

## 6. Phase 6 — Enrollment Transaction Audit

**Verified behavior of `POST /api/v1/applications/{id}/approve` (F: …/approve/route.ts):**

| Step in brief (§8/§35) | Implemented? | Where |
|---|---|---|
| Admission Approved | ✓ (from VERIFIED/UNDER_REVIEW + doc gate) | route:26-72 |
| Enrollment Created | ✓ (Application→ENROLLED + StudentAllocation ACTIVE) | in tx |
| Student Created | ✓ `STU-{FY}-{n}` | in tx:76 |
| Admission Number Generated | ⚠ application `ADM-` + student `STU-` (see Phase 4 conflict) | in tx |
| Parent/Guardian Linked | ✓ Guardian + StudentGuardian (isPrimary, canPickup, isFeePayer) | in tx:94-106 |
| Branch Assigned | ✓ student.branchId = app.branchId | in tx |
| Academic Year Assigned | ⚠ via allocation.academicSessionId (resolveSessionId) ✓; Student row itself has no session column | allocation |
| Class Assigned | ✓ explicit classroomId (tenant-checked) else first ACTIVE classroom of program type | route:52-62 |
| Teacher Assigned | — (classroom's primaryTeacher pre-exists; not part of approval) | out of scope of the tx |
| Fee Plan Assigned | ⚠ **implicit** — first ACTIVE FeePlan for the programType; if none, **approval still succeeds with no invoice** | route:109-149 |
| Transport (if applicable) | n/a — feature flag OFF (IMAP I-15) | — |
| Student ACTIVE | ✓ (Student created ACTIVE) | in tx |

**Transactional integrity: PASS.** Everything above happens inside ONE `db.$transaction`; domain events (`StudentCreated`, `StudentAllocated`, `InvoiceIssued`) and the audit entry are emitted **after commit** (route:201-235) — no partial fan-out; Prisma interactive-tx semantics give rollback on any failure. Capacity guard before the tx (`BUSINESS_CLASS_FULL`), docs gate (`BUSINESS_DOCS_PENDING`).

**Residual risks (not transactional failures, but correctness):**

1. **Numbering inside the tx is count-based without a lock** (F: route:76; F: src/lib/sequence.ts count+1): two concurrent approvals can compute the same `STU-2026-####`; the `@@unique([tenantId, admissionNo])` backstop then aborts one with a 500 — safe (atomic) but user-visible failure under load.
2. **Missing FeePlan ⇒ no invoice, silent** — SPEC §24 invariant ("MUST NOT allow inconsistent states… unless business rules explicitly allow") is not enforced: a student can exist with zero fee obligation and nothing flags it (no follow-up, no validation category at admission time).
3. **Guardian relationship hardcoded `'MOTHER'`** (route:~100) — a father/legal-guardian primary contact is recorded as MOTHER. Data-quality defect.
4. Lead→CONVERTED flip inside the same post-commit section is `.catch(()=>{})`-swallowed (route:179-184): a failed lead flip leaves lead ≠ CONVERTED with an enrolled student — inconsistent but non-financial.

**Verdict: PASS w/ warnings.**

---

## 7. Phase 7 — Capacity / Waitlist Audit

**Capacity scope (brief §9: Program AND Section):**

| Level | Field | Enforced? |
|---|---|---|
| Program-level | `Program.capacity` (M00) | **NO enforcement anywhere in admission/allocation/promotion code** — grep-verified; only Classroom capacity is consulted |
| Section/Class-level | `Classroom.capacity` | ✓ consulted in approve, allocate, promote, and classroom PATCH (downsize guard `SETUP_004`) |
| Branch-level | `Branch.capacity` (M00 column) | never enforced (informational) |
| School-level | `Tenant.maxStudents` | never enforced |

**State vocabulary (user's Phase 7):** AVAILABLE/FULL/WAITLIST/ADMITTED — implementation has capacity count + `BUSINESS_CLASS_FULL` + `WAITLISTED` status; `TRANSFERRED`/`WITHDRAWN` exist only as allocation statuses. Adequate vocabulary; the waitlist machine is missing (Phase 5).

**Race condition — EMPIRICALLY PROVEN (Phase 7 "two users attempt to admit the final available seat"):**

- **PR-8 CONFIRMED 6/6 rounds:** in tenant M01231331, a fresh capacity-1 classroom received **two simultaneous** `POST /students/{id}/allocate` calls for two different students — **both returned 201 and the classroom ended with 2 ACTIVE allocations, in 6 of 6 rounds** (`scripts/audit-probes2.sh` round log). Root cause: `classroomSeats()` is a pure count-read with no `FOR UPDATE`, no serializable isolation, no unique constraint on "one ACTIVE allocation per student+classroom pair" — classic TOCTOU (F: src/lib/capacity.ts; F: …/students/[id]/allocate/route.ts:49-69).

```
DOCUMENT SAYS:       M01 SPEC §9: "enrollment ≥ capacity → block new allocation… Do not allow silent overbooking"; PRD AC-009/AC-010.
IMPLEMENTATION DOES: SELECT COUNT then INSERT (no lock/constraint); overbooking reproduces deterministically under concurrency.
TEST EXPECTS:        T38-T39 exercise the race sequentially (fill 1/1, then block) — passes while proving nothing about concurrency.
CONFLICT:            "No silent overbooking" is false under concurrent use.
RECOMMENDATION:      P0 — enforce with (a) a partial unique index (student_allocations: classroomId where status='ACTIVE' — per-seat model needs a seat_no column) or (b) SELECT … FOR UPDATE on the classroom row inside the allocation transaction, or (c) capacity counter with conditional UPDATE guard. Re-test with parallel requests.
REQUIRES PRODUCT DECISION: NO
```

**Waitlist:** see Phase 5 dead-end. No position, no priority score (ERD §13.4.12: SIBLING/STAFF_CHILD…), no offer expiry, no auto-promotion.

**Verdict: FAIL** (overbooking + unenforced program capacity + waitlist dead-end).

---

## 8. Phase 8 — Daily Operations Audit

**Loop conformance (SPEC §3/§13/§42/§43):** EVENT → DETECTION → DECISION → ACTION → COMMUNICATION → FOLLOW-UP → OUTCOME.

- Attendance ABSENT/LATE → `AttendanceExceptionDetected` → ATTENDANCE follow-up (dedupe `attendance:{studentId}:{date}:{status}`) + parent note ✓ (F: src/lib/integrations.ts:24-48)
- Care HEALTH_CHECK ABNORMAL → URGENT HEALTH follow-up + parent alert ✓; INCIDENT → URGENT/EMERGENCY ✓ (F: …/care/route.ts)
- Unauthorized pickup → BLOCK (403 `BUSINESS_PICKUP_BLOCKED`) + SAFETY EMERGENCY follow-up + audit ✓ (F: …/operations/pickup/route.ts) — **never releases on mismatch** ✓
- Observation NEEDS_ATTENTION/URGENT → LEARNING follow-up (dedupe `observation:{id}`) ✓; "no automatic medical/psychological diagnosis" respected — triage is teacher-declared enum ✓
- Fee overdue → reminder → **follow-up stays OPEN** until `PaymentReceived(fullyPaid)` → `resolveByDedupeKey` → `FOLLOWUP_AUTO_RESOLVED` audit ✓ (**notification ≠ resolution enforced** — the ONLY auto-resolution path in the codebase, exactly per SPEC §43)
- Command centre bands CRITICAL/ATTENTION/NORMAL ✓ (F: …/operations/today/route.ts; UI `/app/operations` with 60s refresh, resolve actions, empty states)
- Dashboards: TeacherToday (assigned sections, care taps, follow-ups), ParentToday (child-centric), admin dashboard role-split ✓

**Gaps:** unresolved-exception visibility is per-domain filtered, good; but there is **no acknowledged-by/timestamp display** distinction in UI bands (ACK vs OPEN render similarly); the UI uses only acknowledge/start/resolve (wait/close/reopen exist in API, not UI — minor). Teacher write-scoping gap noted in Phase 13. `IN_PROGRESS`/`WAITING` are honored by API but not exercised by UI buttons.

**Verdict: PASS w/ warnings.**

---

## 9. Phase 9 — Attendance Audit

| Requirement | Status |
|---|---|
| Statuses PRESENT/ABSENT/LATE/HALF_DAY/LEAVE | ✓ enum exact (matches ERD §16.4.2) |
| Scope: calendar/weekend/holiday | ✓ `dayStatus()` (CalendarEvent HOLIDAY/VACATION > OPERATING.workingDays); non-working day → `BUSINESS_SCHOOL_CLOSED` unless `force:true` (**force is audited** — summary suffix) |
| Academic year scoping | ✓ attendance re-stamped `academicSessionId` on write (resolveSessionId) |
| Class/student scoping | tenant ✓; **assignment ✗** — any `attendance:mark` holder may mark any classroom in the tenant (no `primaryTeacherId` check) |
| One record per student/day | ✓ `@@unique([studentId, date])` + idempotent upsert |
| Marked-by attribution | ✓ markedById/markedAt stamped on every write |
| Historical edits / lock | **✗ NO lock window, no correction workflow, no previous-value capture.** Any holder can overwrite any past date; the audit entry records only a summary line — not before/after (Phase 19). Docs require `attendance_correction` (from→to, reason, corrected_by, approved_by) with post-day approval (ERD §16.4.4; PRD AC-017/AC-018 "original preserved in audit"). |

```
DOCUMENT SAYS:       ERD §16.4.4 attendance_correction w/ approval; PRD AC-018 "edit with reason, original preserved in audit"; SPEC §44 before/after.
IMPLEMENTATION DOES: upsert overwrite; old value lost; no reason field; no approval gate; any past date writable.
TEST EXPECTS:        T11/T12 cover closed-day guard only; no historical-edit test.
CONFLICT:            Docs' correction model absent; audit trail cannot answer "what was attendance before the edit".
RECOMMENDATION:      P1 — before overwrite, capture prior row into the audit entry JSON (or a correction table); define lock window (e.g. editable same-day by teacher, after that needs attendance:approve); enforce assignment scoping.
REQUIRES PRODUCT DECISION: YES (lock-window policy)
```

**Verdict: WARNING** (strong day-of mechanics; historical-integrity model missing).

---

## 10. Phase 10 — Finance Audit

**Structure separation:** FeePlan (structure) + FeePlanItem ✓ → Invoice + InvoiceItem ✓ → Payment ✓ → Receipt (1:1 payment) ✓. Missing vs docs: fee_head master, fee_installment schedule, invoice_discount/tax rows (flat discountCents/taxCents columns only), refunds, write-off flow (status enum exists, no endpoint).

**Invoice statuses:** DRAFT/ISSUED/PARTIALLY_PAID/PAID/OVERDUE/CANCELLED/WRITTEN_OFF — **exact match** to ERD/Prisma `InvoiceStatus` ✓. `REFUNDED` (DDD adds it) — **UNDEFINED**; `WAIVED`/`DISCOUNTED` — partial (discountCents column; no workflow). Payment statuses PENDING/SUCCESS/FAILED/REFUNDED — exact match to ERD ✓ (all live rows SUCCESS).

**Numbering:** `INV/PAY/RCT/LEAD/ADM-YYYY-####`, **tenant-scoped composite uniques verified live** (`DB:` no duplicates across 16 tenants) ✓; format differs from BRC R-FIN-008 (`INV-{BRANCH}-{FY}-{SEQ}`) — doc-internal conflict anyway (Appendix A-4).

**Money:** integer paise everywhere (`*Cents` Int) — matches API Catalog §7.2 ("integer paise, NEVER float") ✓; `paid + balance = total` invariant maintained in the payment tx ✓.

**Idempotency — EMPIRICALLY PROVEN ABSENT:**

- **PR-5 CONFIRMED:** identical retry (same `transactionRef: "AUDIT-PROBE-P5"`) produced **two payment rows** (`PAY-2026-0019`, `PAY-2026-0020`) and two receipts; `DB:` `count(*) where transactionRef='AUDIT-PROBE-P5'` = 2. No Idempotency-Key header support, no unique on transactionRef, no dedupe (F: …/payments/route.ts whole file; `SRC` API Catalog §14 mandates Idempotency-Key on payments with Redis 24h).

**Concurrency:** invoice is read **outside** the tx (route:35) and `paidCents` computed from the stale read (route:55) — two simultaneous payments can both pass the overpay check against the same balance. (Same TOCTOU family as Phase 7.)

**Other findings:**

- Cross-tenant payment: **PR-4 CONFIRMED** (Phase 2).
- Overpay blocked ✓ (`BUSINESS_OVERPAY`), cash > ₹50,000 blocked ✓ (`BUSINESS_CASH_LIMIT`).
- `syncOverdue` performs **writes on GET** (`GET /invoices` flips ISSUED→OVERDUE and emits events, ≤200 rows) — side-effectful read; it is audited and idempotent-by-state, but violates safe-GET semantics and can surprise list consumers.
- Reminder (`/invoices/{id}/remind`) → broadcast + FINANCE follow-up stays OPEN until payment ✓ (T35/T37).
- No refund endpoint despite 4 conflicting approver matrices in docs (Appendix A-5) — **UNDEFINED, REQUIRES PRODUCT DECISION**.

**Verdict: FAIL** (idempotency + payment race + cross-tenant money mutation), structural parts otherwise sound.

---

## 11. Phase 11 — Student Lifecycle Audit

| Lifecycle op | Implemented? |
|---|---|
| CREATE | ✓ (admission approval; manual students POST; CSV import) |
| ACTIVE | ✓ (default status) |
| PROMOTE | ✓ allocation-level (`/academic-years/{id}/promote`: old ACTIVE→PROMOTED + new ACTIVE + pointer move; capacity-skips; idempotent-by-existing-allocation; one summary audit + per-student `StudentPromoted`) |
| TRANSFER | ~ allocation-level only (allocate with reason TRANSFER closes old row as TRANSFERRED; `StudentStatus.TRANSFERRED` never set; no Transfer-Certificate concept) |
| WITHDRAW | ✗ no endpoint (enum values only) |
| DEACTIVATE | ✗ no endpoint |
| ARCHIVE | ✗ no endpoint (docs: archive after 7y per DPDP, reasons EXIT_7_YEARS/PARENT_REQUEST/REGULATORY) |
| DELETE | ✗ **no DELETE route exists for students** — hard delete impossible via API; `deletedAt` soft-delete column exists but no flow sets it |

```
DOCUMENT SAYS:       ERD §14.4.15-19: promotion/transfer/archive models + student_history; BRC R-DAT-011 soft delete, 90-day restore; DDD archived = read-only.
IMPLEMENTATION DOES: creation + promotion only; lifecycle terminal ops unimplemented; no DELETE at all.
TEST EXPECTS:        "Archived/withdrawn/transferred student ops" — 0 tests (test agent §D-8).
CONFLICT:            The lifecycle the docs mandate stops after admission; statuses are vocabulary without verbs.
RECOMMENDATION:      P1 — implement WITHDRAW and TRANSFER (out) as state-changing endpoints with reasons + audit + parent notification; ARCHIVE as admin flow; keep DELETE absent (recommendation: soft-delete/archive only for an education system — DPDP retention); add lifecycle tests.
REQUIRES PRODUCT DECISION: YES (whether v1 ships withdraw/transfer; delete policy = recommend soft-delete only, never hard delete)
```

**Verdict: UNDEFINED → treated as WARNING** (absence is safe — nothing can be silently destroyed — but the product cannot complete its own lifecycle story; SPEC §10 demands 6 operations, 4 exist).

---

## 12. Phase 12 — Parent Audit

- **When created:** Guardian + StudentGuardian created in the approval transaction ✓ (Phase 6). Relationship hardcoded `MOTHER` (defect).
- **Multi-child:** ✓ one guardian → many `student_guardians` links (DB: 33 guardians / 34 links).
- **Account/portal access:** Guardian.userId optional 1:1. **No product path provisions a parent user:** `POST /api/v1/users` explicitly refuses PARENT role (F: …/users/route.ts — "cannot assign PLATFORM_ADMIN/OWNER/PARENT"). The M01 test fixture had to create the parent account with **raw SQL** (F: scripts/m01-fixture.mjs:17-35) — meaning **a school cannot onboard a parent through the product**, violating the M00 DoD spirit ("no engineer touches the DB") for the parent persona.
- **Scoping (positive):** `GET /parent/today` — guardian-scoped via `guardian.userId = session.uid`, all queries `studentId IN childrenIds`, observations PUBLISHED-only, no internal follow-up detail ✓ (T28/T29). `GET /timeline` — same scoping + explicit membership check ✓.
- **Scoping (leaks):**
  - **PR-6 CONFIRMED:** `GET /api/v1/invoices` returns the whole tenant ledger to PARENT (24 invoices vs 2 own-child) — the finance page renders staff collection data to parents.
  - **PR-7 CONFIRMED:** `/app/students/{id}` SSR page renders any student (incl. non-child) with finance data to a logged-in parent.
  - `GET /students/{id}` API: parent check exists (route:33-38) but is **unreachable** (PARENT lacks `students:read` → 403 first) — dead defensive code; the SSR page bypasses it entirely.
- **IDOR between two parents in the same tenant:** not directly reproducible via the leaked surfaces above — but by the same mechanism (no guardian filter on invoices list / SSR page), Parent B's child data is visible to Parent A. **Confirmed by construction** (PR-6/PR-7 used exactly this path); a dedicated two-parent test must be added (test agent §D-10).
- **Account status:** user must be ACTIVE to login ✓; but a deactivated user's existing cookie remains valid up to 7 days (no per-request status re-check) — see Phase 21 finding F-9.

**Verdict: FAIL.**

---

## 13. Phase 13 — Teacher Audit

- **Dashboard derived from actual assignments ✓:** `GET /teacher/today` scopes classrooms by `primaryTeacherId = session.uid` (F: …/teacher/today/route.ts:26-37); UI cannot fabricate rosters (SPEC §11 "MUST NOT manually recreate class lists" — met on the read path). Follow-ups auto-scoped for TEACHER (assigned-to-me OR my classrooms) ✓.
- **Server-side authorization of writes:** **assignment NOT checked.** `POST /attendance` validates only classroom.tenantId (F: …/attendance/route.ts:73-77) — any teacher/coordinator can mark **any class in the tenant**. `POST /care` likewise validates tenant, not assignment. `GET /students` returns the **entire tenant roster** to TEACHER (`students:read`, no assignment filter) — docs scope teacher reads to "Class" (PRD §7.2).
- No negative test exists for cross-class access (test agent §D-11).

**Verdict: WARNING** (read-path good, write-path and roster scope violate the assignment model).

---

## 14. Phase 14 — Operations Command Centre

| Aspect | Finding |
|---|---|
| Purpose / users | "Is my preschool running correctly today?" — OWNER/PRINCIPAL/COORDINATOR (`operations:read`), ACCOUNTS read-only, TEACHER scoped view ✓ |
| Data sources | All real: `GET /operations/today` (dayStatus, per-section attendance incl. understaffing, exception bands, activity counts), `GET /operations/follow-ups?take=100` ✓ — **no decorative KPIs among the four tiles** (critical count, attention count, attendance %, activity counts are all computed from rows) |
| Alerts/actions | Bands CRITICAL (≥1 → red), ATTENTION, NORMAL ✓ (SPEC §34 exact); Ack/Start/Resolve wired to state machine ✓ |
| Filters | status/severity/domain/studentId/mine ✓ (API; partial in UI) |
| Empty/loading/error | Skeleton KPI row; `EmptyState` "Zero unresolved follow-ups"; failure toasts ✓ |
| API/database/audit | Reads follow_ups/attendance/timeline/care ✓; mutations audited via followup engine ✓ |
| Responsive | Taskbar/Start shell responsive; operations page single-column collapse ✓ (visual QA previously done) |
| Defects | (1) Branch scoping claimed in code comment ("current branch") but queries are tenant-wide — doc/UI vs behavior mismatch; (2) hardcoded notification bell badge `3` (AppShell) is decorative and wrong; (3) dashboard KPI trend arrows are heuristic ("ACT NOW"/"CLEAR" labels are styling, not data) — flagged, not KPIs; (4) `GET /api/v1/dashboard` endpoint exists but is **never called by any page** (dead duplicate of RSC queries) |

**Verdict: PASS w/ warnings.**

---

## 15. Phase 15 — Teacher Today View

Identity ✓ (session-derived); today's classes ✓ (assignment-aware); today's students ✓ (roster from own classrooms); attendance ✓ (pending → "Mark now"); activities ✓ (care taps, config-driven types, disabled types rejected `BUSINESS_TYPE_DISABLED`); observations ✓ (own only on list; composer student-scoped); follow-ups ✓ (auto-scoped); alerts ✓ (closed-day banner from real calendar + operating config).

Leak vector: the teacher can still reach **other** classes' data via generic endpoints (`GET /students`, `POST /attendance` any classroom) — see Phase 13. Within the Today view itself: no unauthorized data.

**Verdict: PASS w/ warnings.**

---

## 16. Phase 16 — Parent Today View

Answers "How is my child doing today?" ✓: per-child card with attendance badge, health/safety alert band (open HEALTH/SAFETY follow-ups only), today's care entries, latest PUBLISHED teacher observation, outstanding fees. Guardian scoping server-side ✓. Internal admin information (follow-up machinery, staff notes, DRAFT observations) **not exposed** ✓.

Adjacent surfaces violate it: `/app/finance` ledger leak (PR-6) and `/app/students/{id}` SSR leak (PR-7) — both reachable by a parent via normal navigation links ("Pay / view invoices" button). Growth information = published observations ✓ (Growth Passport as a named module does not exist — Phase 22).

**Verdict: PASS w/ warnings** (the Today surface itself conforms; sibling surfaces leak).

---

## 17. Phase 17 — AI Audit

- **No AI features are implemented in M01** (no AI routes; existing AI gateway untouched; grep: zero AI endpoints in src). SPEC §22 makes AI **conditional** ("where configured") and the implementation's known-gaps register (IMAP I-15, worklog) declares AI daily-summary drafting not wired.
- Consequently: "AI must not silently modify core student records" is **trivially satisfied** (there is no AI writer); no SYSTEM/AI-GENERATED/HUMAN-APPROVED labeling exists because no AI output surface exists; AI access permissions do not exist in the RBAC matrix.
- Observed data shows a deterministic triage concern enum (`ObservationConcern`) authored by humans — compliant with §14's "no uncontrolled AI diagnosis".

```
DOCUMENT SAYS:       SRC API Catalog §21: PII redaction, human-in-the-loop, "AI DRAFT" watermark, quota; SPEC §22 teacher-review gate.
IMPLEMENTATION DOES: nothing AI — declared known gap.
TEST EXPECTS:        no AI tests.
CONFLICT:            none (conditional feature absent, documented).
RECOMMENDATION:      keep OUT of M01 scope; when introduced, enforce the §22/§21 gates (draft-only, teacher approval, labeling) and add AI permission `ai:read/draft` to the matrix.
REQUIRES PRODUCT DECISION: YES (whether AI drafting is v1 scope — currently declared out)
```

**Verdict: UNDEFINED (documented conditional gap; no violation).**

---

## 18. Phase 18 — Notification Audit

**Chain implemented:** Event → (notify funnel) → TimelineEntry (child events) / Announcement (broadcasts, ≤500-student fan-out, audience-filtered) → visible in ParentToday/Communication page. Config gating: `notificationEventEnabled` — disabled events produce `NOTIFY_SUPPRESSED` audit instead of noise ✓ (a thoughtful touch).

**vs required chain (Event → Notification → Recipient → Channel → Delivery → Read → Audit):**

| Stage | Implemented |
|---|---|
| Recipient model | ⚠ implicit (student link / audience type); no per-recipient notification rows |
| Channel | IN_APP only (TimelineEntry/Announcement). No SMS/WhatsApp/email/push (docs model per-channel logs + TRAI windows) — declared known gap (worklog; IMAP I-15-adjacent) |
| Delivery/Read states | ✗ none (no DeliveryStatus, no read receipts) |
| Audit | ✓ creation audited; suppression audited |
| notification ≠ resolution | ✓ ENFORCED (Phase 8) — the critical invariant holds |

**Verdict: WARNING** — the semantic invariant the brief cares about most is enforced; the delivery model is a simplified funnel, documented as a gap, acceptable for MVP only with product sign-off.

---

## 19. Phase 19 — Audit Log Audit

**Model (F: prisma/schema.prisma AuditLog; F: src/lib/sequence.ts:56-80):** `actorId, actorName, action, entity, entityId, summary, tenantId?` + createdAt. Live: 778 rows; platform actions have NULL tenantId (by design, 15 rows).

**vs SPEC §44 (actor/timestamp/tenant/school/branch/AY/action/entity/before/after/reason) and ADR-113 §11.2 (old_value/new_value JSONB, ip, device, request_id, role_snapshot, result, hash-chain, same-transaction write):**

| Required field | Present |
|---|---|
| actor, timestamp, tenant, action, entity, entityId | ✓ |
| school/branch/AY context | ✗ (tenant only) |
| **before/after** | ✗ (human-readable summary string only) |
| reason | ✗ |
| ip / request id / result | ✗ |
| hash chain / tamper evidence | ✗ |
| Same-transaction atomicity | ✗ — `audit()` is fire-and-forget **and swallows its own errors** (F: sequence.ts:77-79 `catch { console.error }`); a failed audit write is lost while the business mutation commits. Docs demand the opposite (audit failure rolls back the operation). |

**Coverage of the Phase 19 minimum event list:** audited today: LOGIN, tenant/user CREATE, step/config complete/skip/reopen, lead CREATE/UPDATE/CONVERT, application CREATE/VERIFY/APPROVE/REJECT/WAITLIST, student CREATE/ALLOCATE/IMPORT, attendance CREATE (+FORCED), observation CREATE/PUBLISH, invoice CREATE/REMIND, payment CREATE, academic-year CREATE/CLOSE/PROMOTE, branch/program/facility/staff/calendar CRUD, classroom UPDATE, setup sync/validate/go-live, follow-up raise/transition/auto-resolve. **Not** audited: pickup release (only timeline entry; the block path audits via follow-up), overdue status flips (emits event, audit only via syncOverdue? — verified: overdue flips emit InvoiceOverdue; audit entry only for reminders), user deactivation/role changes (no such endpoints yet), notification suppression (NOTIFY_SUPPRESSED ✓ exists).

```
DOCUMENT SAYS:       ADR-113 §11.2 + SPEC §44: before/after, reason, same-tx atomicity, hash chain.
IMPLEMENTATION DOES: summary-line audit, best-effort, outside tx.
TEST EXPECTS:        T48 asserts only "audit endpoint returns success" — no per-mutation audit assertion anywhere (test agent §D-12).
CONFLICT:            Audit trail exists but cannot prove what changed (no before/after) and can silently lose entries.
RECOMMENDATION:      P1 — extend AuditLog with `data Json?` (before/after payload) and `reason String?`; write audit inside the business transaction (return from tx) or use an outbox; add per-mutation audit assertions to E2E. Hash-chain: P3 (docs-level requirement, decide with product).
REQUIRES PRODUCT DECISION: YES (hash-chain/WORM retention timeline)
```

**Verdict: FAIL vs ADR** (structural), **WARNING pragmatically** (coverage breadth is genuinely good).

---

## 20. Phase 20 — API Contract Audit

**Envelope ✓:** `{success, data, meta?, traceId}` + error `{success:false, error:{code,message}, traceId}`; error codes AUTH_001/003, PERMISSION_001, VALIDATION_001, NOT_FOUND_001, CONFLICT_001, SYSTEM_001, SETUP_001-004, IMPORT_001, BUSINESS_* — consistent with API Catalog §8 (OpenAPI's contrary §10.1 is a doc conflict, Appendix A-3). `X-API-Version: 1.0.0` header ✓. URI versioning `/api/v1/` ✓. State-transition verbs via subresource paths (`/approve`, `/verify`, `/waitlist`, `/close`, `/promote`) ✓.

**Method/route contract table for the 13 new M01 routes + 3 extended (IMAP registry) — verified against code:** auth guards present on all; permission names match IMAP; tenant check present on 13/16, **missing on the 9 id-addressed lookups listed in Phase 2** (routes overlap).

**Validation:** input enums validated (type/category/method/status), numeric guards (capacity ≥1, amount >0), pagination pageSize ≤100 — good; **no Idempotency-Key support** (API Catalog §14 mandates it for payments/refunds/submission) — proven harmful (PR-5).

**UI/API agreement:** 8 mismatch cases where the UI renders actions that 403 (Phase 22) — frontend shows, backend correctly refuses (security holds; UX contract broken). Frontend-only reliance on validation: **none found** — every business rule (docs gate, capacity, closed-day, overpay, cash limit, pickup PIN, type-disabled) is enforced in the API layer ✓.

**Write-on-GET anti-pattern:** `GET /invoices` (syncOverdue) and `GET /setup/status` (syncSetup auto-completes steps + audit) mutate on read. Both are idempotent-by-state and audited, but they break GET semantics and can surprise clients/caches.

**Verdict: WARNING.**

---

## 21. Phase 21 — Database Audit

**Map (PAGE → API → SERVICE → DB):** pages call `/api/v1/*` which use `db` (Prisma) directly + `src/lib` services (engine layer); dashboards read via RSC (server components) directly from `db` — consistent with the implementation's declared architecture (no controller/repository split; acceptable for this stack, documented in IMAP §0).

**For every M01-new table/field (SPEC §48 checklist):**

| Item | WHY EXISTS | OWNER | TENANT SCOPE | RELATIONSHIPS | STATUS | INDEXES | UNIQUE | FKs / delete | AUDIT |
|---|---|---|---|---|---|---|---|---|---|
| `FollowUp` | SPEC §32/§42 exception engine | Operations domain | ✓ tenantId | student, classroom, (branchId/academicSessionId columns **without FK relations**) | FollowUpStatus ✓ | (tenantId,status),(tenantId,severity),(studentId) | **dedupeKey @unique** (idempotency) | tenant/student CASCADE, classroom SETNULL | via engine actions ✓ |
| `StudentAllocation` | SPEC §10 per-AY allocation history | Student domain | ✓ | student, classroom, academicSession (all CASCADE) | StudentAllocationStatus ✓ | (tenantId,studentId),(academicSessionId),(classroomId) | **none** (history model; multiple rows/AY allowed — intentional) | CASCADE ×4 | ALLOCATE/PROMOTE audited ✓ |
| `Guardian.pickupPin` | §16 pickup verification | Student/parent | (on guardian ✓) | — | — | — | via guardian.userId unique | — | pickup release → timeline; block → FU + audit |
| `Observation.category/concern` | §18 triage | Academics | ✓ (row-level) | — | ObservationConcern ✓ | — | — | — | CREATE/PUBLISH ✓ |
| `*.academicSessionId` (Attendance/Invoice/TimelineEntry/Observation) | §6 AY context | respective domains | ✓ inherited | academicSession SETNULL | — | — | — | SetNull (year delete detaches, rows survive) | — |

**Schema-wide checks (DB-verified):**

- 33/33 tables, 38/38 enums match schema file verbatim; all 11 money columns are PostgreSQL `integer` (paise) ✓
- Composite tenant-scoped uniques on every business number (application/invoice/payment/receipt/lead/admissionNo/branch+program+facility codes) ✓, zero duplicates live
- `branchId` on Student/Attendance/Invoice is a **plain column, not an FK** — no DB-level branch integrity (app writes it consistently today)
- `StudentGuardian`, `ApplicationDocument`, `FeePlanItem`, `InvoiceItem` carry **no tenantId** — they inherit scope through parents; reachable only via joins (acceptable, but any future direct query is a foot-gun)
- **No RLS.** SRC ADR-043/044 + ERD §5 mandate Postgres RLS defense-in-depth (`current_setting('app.tenant_id')`); implementation is app-level scoping only. Given Phase 2's proven IDOR class, defense-in-depth absence is now a **material** gap, not a nicety.
- Delete behavior: student-related CASCADE from Student, RESTRICT to Tenant/Invoice — sensible; no triggers enforcing soft-delete (docs' BEFORE DELETE trigger absent — hard deletes are only prevented at API level, and Prisma could still hard-delete)
- `audit_logs`: monthly partitioning / BRIN per docs not present (fine at this scale), fields gap per Phase 19

**Verdict: WARNING.**

---

## 22. Phase 22 — UI Navigation Audit

**Admin nav (F: src/lib/nav.ts):** Dashboard · **Operations (M01)** · **Setup (M00)** · Students · Admissions · Attendance · Fees · Academics · Child Timeline · Announcements · Settings · Audit Log · Platform (dead item — PLATFORM_ADMIN is redirected to /onboard before AppShell renders). Role-filtered via `navForRole`/`can` ✓.

**vs the Phase-22 expected list:** Dashboard ✓, Admissions ✓, Students ✓, **Parents ✗** (no page; guardians visible inside student detail), **Teachers ✗** (Settings → staff tab), **Classes ✗** (Settings → classes tab), Operations ✓, Fees ✓, **Growth Passport ✗** (grep: zero hits; "Academics" covers observations), **AI Center ✗** (none — consistent with Phase 17), Communication ~ ("Announcements" only; no parent messaging surface), **Reports ✗** (dashboard KPIs only), Setup Wizard ✓, Onboarding ✓ (/onboard), Settings ✓, **System ~** (Audit Log). **No duplicate top-level concepts created** ✓ — the brief's anti-duplication rule holds; the missing items are scope decisions, not duplications.

**Nav visibility vs API authorization agreement — 8 mismatches (role can open page, action 403s):**

| # | Role | Page | Broken action |
|---|---|---|---|
| 1 | PARENT | /app/finance | Raise Invoice / Record Payment / Remind (`finance:write`) + students dropdown 403 |
| 2 | ACCOUNTS | /app/attendance | Save Register / All Present (`attendance:mark`) |
| 3 | ACCOUNTS | /app/operations | Ack/Start/Resolve (`operations:write`) |
| 4 | TEACHER/ACCOUNTS | /app/students | Add Student, Allocate (`students:write`) |
| 5 | RECEPTION | /app/admissions | Approve & Enroll / Reject (`admissions:approve`) |
| 6 | TEACHER/RECEPTION/PARENT | /app/communication | New Announcement (`communication:broadcast`) |
| 7 | COORDINATOR | /app/setup | Validate / Complete / Go-live (`settings:write`) |
| 8 | PARENT | /app/students/{id} (SSR) | **full data render — not a 403 but a data leak (PR-7)** |

Cases 1-7 are UX-contract violations (backend holds); case 8 is a security violation. **No role lands on a page that hard-errors on load** — data calls fail gracefully (empty/toast) — but "navigation visibility and API authorization must agree" is not yet true.

**Waitlist UI:** `POST /applications/{id}/waitlist` exists but **no button anywhere in /app/admissions** — the waitlist is unreachable from the UI (API-only). Attendance page lacks the closed-day banner/force toggle (API-only guard).

**Verdict: WARNING.**

---

## 23. Phase 23 — M01 E2E Test Quality Audit

**Counts re-verified today by the auditor (fresh runs):** `smoke.sh` → **31/31 PASS** · `m00-e2e.sh` → **41/41 PASS** · `m01-e2e.sh` → **49/49 PASS**. The claims are honest.

**Classification (49 M01 tests):**

| Cat | Tests | Count |
|---|---|---|
| A Happy Path | T01-T10, T12-T15, T17-T24, T27-T30, T32-T38, T40-T47 | ~41 |
| B Validation | T11 (closed day), T16 (disabled type), T39 (capacity full) | 3 |
| C Authorization | T25 (teacher→approve), T26 (unlinked parent), T31 (pickup guard) | 3 |
| **D Tenant Isolation** | — | **0** |
| **E State Transition (invalid)** | — | **0** (T25 hits role guard before any state guard) |
| **F Concurrency** | — | **0** |
| **G Idempotency** | — | **0** |
| **H Failure Recovery** | — | **0** |
| I Audit | T48 only — asserts endpoint success, **no audit row ever asserted** | 1 (weak) |
| J Regression | T08/T09/T33/T40/T46 consistency re-checks; M00 walk re-done inline | partial |

**Required-test coverage (user's Phase 23 list): 0 of 16 conclusively covered** — cross-tenant access, unauthorized access, duplicate requests, concurrent admission, concurrent payments, invalid transitions, rollback, partial failure, archived/transferred/withdrawn students, suspended school, deactivated user, parent-vs-parent IDOR, teacher cross-class, audit-per-mutation, attendance lock, waitlist promotion: **all uncovered** (detail: test agent §D). This audit's probes (§24) demonstrate exactly why this matters: every severe defect found was in a category with zero coverage.

**Matrix doc vs script reality (overstatements):** "exactly 1, deduped" is asserted as `>=1` (no dedupe proof); "3+ care events" as `>=1`; "promote 2" as `>=1`; "audited" labels on T12/T30 assert nothing; "tenant-scoped numbering verified" has no uniqueness assertion; "dependency graph" testing in m00 is a dead helper function (`step_blocked_check()` never called) + one malformed no-assert call; T24/T27 count fixture invocations (raw SQL) as product checks. Counts are honest; **several PASS labels are weaker than documented**.

**Fixture risks:** `m01-fixture.mjs` uses a hardcoded DSN, performs raw-SQL INSERT/UPDATE (parent user + guardian link), has **no cleanup** (16 tenants and growing in the shared DB), and would happily mutate the sunshine demo tenant if handed its ID. Parent provisioning via raw SQL masks the real product gap (no parent-creation path — Phase 12).

**Verdict: FAIL as a conformance instrument** (excellent happy-path regression suite; not a security/integrity suite).

---

## 24. Live Probe Log (empirical evidence, 2026-09-11)

Environment: production build on :3000, PG :54329, demo + test tenants. Probes are persisted (`scripts/audit-probes.sh`, `audit-probes2.sh`, `dbq.mjs`) and re-runnable. Mutations were confined to test tenants (M01*), except where noted as reading demo data.

| Probe | Request | Expected if conformant | Observed | Verdict |
|---|---|---|---|---|
| PR-1 | `GET /api/v1/students` without cookie | 401 | 401 AUTH_001 | safe ✓ |
| PR-2 | sunshine OWNER `GET /api/v1/students/{M01230515 student}` | 404/403 | **200 full cross-tenant profile** | **IDOR-read** |
| PR-3 | sunshine OWNER `PATCH /api/v1/leads/{M01 lead}` | 404/403 | **200, record mutated** | **IDOR-write** |
| PR-4 | sunshine OWNER `POST /api/v1/invoices/{M01 invoice}/payments` ₹1 | 404/403 | **201, invoice PARTIALLY_PAID** | **IDOR-money** |
| PR-5 | exact retry of PR-4 (same `transactionRef`) | dedupe/409 | **201; 2 payment rows, 2 receipts** | **no idempotency** |
| PR-6 | parent@sunshine `GET /api/v1/invoices` | own-child only (2) | **24 tenant-wide invoices** | **ledger leak** |
| PR-7 | parent@sunshine `GET /app/students/{non-child}` | deny/empty | **200; name + INV-2026-0003 rendered** | **SSR IDOR** |
| PR-8 | 2 concurrent allocates into cap-1 classroom ×6 rounds | 1 success, 1 block | **both 201, 2 ACTIVE rows — 6/6** | **TOCTOU overbooking** |

Additional code-verified (not probed live, no fixtures harmed): suspended tenant can still login (login route never reads `tenant.status` — F: …/auth/login/route.ts:20-40 include tenant but never checks); deactivated user's live cookie remains valid ≤7d (`verifySession` checks JWT only); `leads/[id]` PATCH also skips `deletedAt` check (deleted leads editable).

---

## 25. Final Report (26 sections)

1. **Executive Verdict:** **M01 IS NOT CONFORMANT.** The happy-path product journey is genuinely well-built (state machine for follow-ups exact, enrollment transaction atomic, M00 setup engine solid, notification≠resolution enforced, money invariant held), and all 121 automated checks honestly pass. But the audit **empirically proves 7 security/integrity defects** the tests cannot see — most critically: 9 id-addressed endpoints accept cross-tenant access (read, write, and **money**), capacity overbooking reproduces 6/6, payments are not idempotent, and parents can read other children's finance data through two surfaces. Per the FINAL RULE, **"M01 complete" cannot be claimed.** No unresolved P0s may remain before that changes.

2. **Product Flow Compliance: WARNING.** The 23-stage journey (SPEC §35) is executable and tested end-to-end; admission→enrollment→student→allocation→daily ops→learning→fees→promotion all work in one connected system (T01-T47). Flow breaks at the edges: waitlist dead-end (no promotion), student lifecycle stops after promotion (no withdraw/transfer/archive), parent provisioning impossible via product.

3. **Architecture Compliance: PASS w/ warnings.** No second systems: one RBAC, one audit helper, one notify funnel, one config accessor, one event seam, M00 config consumed by real workflows (attendance/care/finance/pickup all read SchoolConfig at runtime — verified in code). The event catalog is partial (8 of 20 SPEC §31 named events not emitted by that name). No parallel APIs. In-process events (not a broker) — acceptable and declared.

4. **RBAC Compliance: WARNING.** Coarse-grained server RBAC real and tested; platform-plane protection correct. Missing: branch/class object scoping (`branchId` in JWT, used nowhere), page-level guards, SSR authorization, and two dead permissions. UI/API agreement broken in 8 places (backend holds).

5. **Tenant Isolation Compliance: FAIL.** 9 endpoints unscoped; cross-tenant read/write/money all reproduced (PR-2/3/4). Defense-in-depth (RLS) absent.

6. **Admissions Compliance: WARNING.** Domains field-separated; document/approval sub-domains simplified; numbering prefix misnomer (ADM- on applications); WAITLISTED dead-end; lead transitions unvalidated.

7. **Enrollment Compliance: PASS w/ warnings.** Single-transaction approval with post-commit events and rollback is correct and verified; implicit fee plan (silent no-invoice path), hardcoded MOTHER, count-based numbering inside tx.

8. **Student Lifecycle Compliance: UNDEFINED→WARNING.** Create/promote only; withdraw/transfer/archive/deactivate missing; DELETE absent (safe; recommend soft-delete-only policy).

9. **Parent Compliance: FAIL.** Ledger leak (PR-6), SSR leak (PR-7), no product provisioning path, hardcoded guardian relationship. Core Today surface itself conforms.

10. **Teacher Compliance: WARNING.** Assignment-derived reads ✓; writes and roster reads not assignment-scoped.

11. **Attendance Compliance: WARNING.** Statuses, uniqueness, calendar guard, force-audit, AY stamping ✓; historical-edit protection and correction model absent.

12. **Finance Compliance: FAIL.** No idempotency (PR-5), stale-read payment race, cross-tenant payment (PR-4), write-on-GET overdue sync; structure/statuses/numbering/invariants otherwise sound.

13. **Operations Compliance: PASS w/ warnings.** Command centre real-data-backed with correct bands; branch scope not enforced; two decorative elements (bell badge, trend arrows) flagged.

14. **Communication Compliance: WARNING.** Funnel + suppression-audit good; no recipient/channel/delivery/read model; declared gap.

15. **AI Compliance: UNDEFINED.** Not implemented; conditional per brief; no AI writes trivially; decision required on v1 scope.

16. **Audit Compliance: FAIL vs ADR** (no before/after/reason, best-effort non-atomic writes, no hash-chain) **/ WARNING pragmatically** (broad action coverage).

17. **API Compliance: WARNING.** Envelope/codes/versioning/verb-usage ✓; Idempotency-Key missing; write-on-GET; 9 unscoped lookups; UI/API agreement gaps.

18. **Database Compliance: WARNING.** Full schema↔DB parity, correct uniques, paise-int money ✓; no RLS; branchId not FKs; 4 join tables without tenantId; audit model thin.

19. **UI Compliance: WARNING.** Windows-Shell system respected, no duplicated concepts, role nav ✓; 8 nav/API mismatches; waitlist + closed-day UI absent; module-list deviations (Parents/Teachers/Classes/Growth Passport/AI Center/Reports not top-level).

20. **E2E Compliance: FAIL as conformance proof** — 121 green checks honestly re-verified, but 0 coverage in six required categories (D/E/F/G/H + substantive I); matrix doc overstates several assertions; fixture bypasses product for parents.

21. **Security Findings (all empirical):** S-1 cross-tenant read (PR-2); S-2 cross-tenant write (PR-3); S-3 cross-tenant payment (PR-4); S-4 no payment idempotency (PR-5); S-5 parent finance ledger leak (PR-6); S-6 parent SSR student-page IDOR (PR-7); S-7 capacity TOCTOU overbooking 6/6 (PR-8); S-8 suspended tenant / deactivated-user-cookie can operate (code-verified); S-9 deleted leads editable (no deletedAt on PATCH).

22. **Data Integrity Findings:** D-1 duplicate payment rows possible (S-4); D-2 overbooked classrooms possible (S-7); D-3 payment balance computed from stale read (concurrent over-credit possible); D-4 numbering collisions under load surface as 500s (unique backstop holds — atomic but user-visible); D-5 lead flip swallowed post-approval; D-6 no before/after anywhere — historical "what changed" unanswerable; D-7 hardcoded MOTHER relationship; D-8 audit rows lossy on failure.

23. **Product Conflicts (require decisions):** PC-1 canonical role list; PC-2 admission entity & ADM/APP numbering; PC-3 refund matrix (4 versions) & whether refunds are v1; PC-4 AI scope v1; PC-5 attendance lock-window policy; PC-6 parent provisioning UX (invite from guardian?); PC-7 Growth Passport as module vs observations (name absent everywhere in sources — the feature name itself is undefined in canon); PC-8 notification channel set for v1; PC-9 hash-chain/WORM audit timeline; PC-10 capacity level canon (classroom-enforced today; program capacity documented but dead).

24. **Missing Requirements:** MR-1 waitlist machine (position/priority/promotion/offer-expiry); MR-2 student lifecycle ops; MR-3 parent provisioning; MR-4 branch-level authorization anywhere; MR-5 attendance correction model; MR-6 Idempotency-Key; MR-7 before/after audit payloads; MR-8 8 named domain events (§31); MR-9 per-document verification statuses (REJECTED/RESUBMIT); MR-10 waitlist UI + closed-day UI affordances; MR-11 16 negative-path E2E scenarios.

25. **Recommended Fixes:** see §26 Remediation Plan.

26. **Items Requiring Product Approval:** all PC-1…PC-10 above, plus ratification of the implementation's simplifications as canon: enrollment folded into application status; allocation rows as the enrollment record; IN_APP-only notifications; AI out of scope; no student DELETE (soft-delete/archive only).

---

## 26. Remediation Plan

### P0 — Critical / Security / Data Integrity (blocking; no product decisions required)

| # | Fix | Where | Verify by |
|---|---|---|---|
| P0-1 | Tenant-scope ALL id-addressed lookups via one shared helper (`findFirst({where:{id, tenantId, deletedAt?}})`); incl. leads PATCH deletedAt | 9 routes listed Phase 2 | PR-2/3/4 must return 404; add cross-tenant E2E pair per route |
| P0-2 | Capacity race: enforce seat atomically (partial unique index on ACTIVE allocation per classroom+seat, or `SELECT … FOR UPDATE` on classroom, or conditional counter UPDATE) | capacity.ts + allocate/approve/promote | parallel-allocate probe: second call MUST fail 6/6 |
| P0-3 | Payment idempotency + concurrency: unique index on `(tenantId, transactionRef)` where ref not null (or Idempotency-Key table per API Catalog §14); compute balance inside tx via `SELECT … FOR UPDATE` on invoice | payments route + schema | PR-5 retry MUST return the first payment (200/409), not create a second |
| P0-4 | Parent surfaces: guardian-scope `GET /invoices` for PARENT (join student_guardians); server-check session+guardian link on `/app/students/[id]` page (or block PARENT role) | invoices route, students/[id] page | PR-6/PR-7 must leak nothing |
| P0-5 | Fix SSR authorization class: every server component doing `db.` reads must resolve session + role + tenant/guardian scope | students/[id] page (+ audit all RSC reads) | PARENT probe returns denied |

### P1 — Product Flow / Business Logic

| # | Fix |
|---|---|
| P1-1 | WAITLISTED→approval path (capacity-gated) + waitlist UI button + promotion test |
| P1-2 | Student lifecycle: WITHDRAW / TRANSFER(endpoints with reason + audit + status change) |
| P1-3 | Lead transition validation in PATCH |
| P1-4 | Attendance edit protection: capture before-value into audit (or correction rows); define lock window (product decision PC-5) |
| P1-5 | AuditLog: add `data Json` (before/after) + `reason`; write within the business transaction; stop swallowing audit errors |
| P1-6 | Teacher/class scoping: assignment check on attendance/care writes; students list scoped to assigned classes for TEACHER |
| P1-7 | Parent provisioning: product path to create/invite a parent user from a Guardian record (replace fixture reliance) |
| P1-8 | Approve-time FeePlan requirement (or explicit config flag) to eliminate the silent no-invoice path; remove hardcoded 'MOTHER' |
| P1-9 | Emit the 8 missing §31 events (or amend the brief's list — one decision, then align) |

### P2 — UX / Workflow

| # | Fix |
|---|---|
| P2-1 | 8 nav/API agreement fixes (hide/disable actions by `can()`; page-level guards) |
| P2-2 | Attendance page: closed-day banner + audited-force affordance |
| P2-3 | Operations: surface WAITING/IN_PROGRESS actions; branch scope in queries or remove the claim |
| P2-4 | Remove decorative elements (bell badge `3`, heuristic trends) or wire them to data |
| P2-5 | Delete dead code: `/api/v1/dashboard` (or use it), dead nav item, dead validation tautology, kanban dead span |
| P2-6 | Fix `DepsPayload` type hole (ignoreBuildErrors masks it) |

### P3 — Optimization / Enhancement

| # | Fix |
|---|---|
| P3-1 | RLS defense-in-depth (ADR-043/044) or Prisma middleware tenant guard as second layer |
| P3-2 | Hash-chain audit + retention policy (docs-level) |
| P3-3 | Notification delivery model (recipient rows, channels, read states) |
| P3-4 | Numbering: DB sequence/counter table to remove count-based races |
| P3-5 | Test-hygiene: fixture cleanup mode, per-mutation audit assertions, replace >= assertions to match matrix claims |
| P3-6 | Refund flow (after PC-3 decision), document verification statuses (REJECTED/RESUBMIT) |

### Sequence

P0-1 → P0-4/P0-5 (security floor) → P0-2 → P0-3 → re-run full regression + expanded probes → P1 in order → P2 → product decisions (PC-*) in parallel → P3. **Only after P0 verification and PC decisions may implementation resume.**

---

## Appendix A — Document-level conflicts (REQUIRES PRODUCT DECISION — not implementation faults)

| # | Topic | Variants |
|---|---|---|
| A-1 | Role taxonomy | PRD §7.1 (8 roles incl Owner/Coordinator/Reception) vs ERD §11.4.5 (CENTER_HEAD…) vs Prisma seed (SCHOOL_ADMIN/ACCOUNTANT/RECEPTIONIST/LIBRARIAN) vs Security Arch §8.2 (+HR/Finance/Student) vs BRC approver ladder vs ADR-38 (+Inventory/Transport) vs ADR-064 (generic two-tier) |
| A-2 | Tenant discriminator | ERD `school_id` + RLS vs Prisma `tenantId` vs Security Arch JWT triple (tenantId+schoolId+branchId) vs API headers X-Tenant-ID + X-School-ID |
| A-3 | Response envelope | API Catalog §8.1 + Engineering Standards (wrapped) vs OpenAPI §10.1 (unwrapped success) |
| A-4 | Number formats | ERD INV-YYYY-NNNNN vs BRC INV-{BRANCH}-{FY}-{SEQ} vs DDD "per tenant per FY" |
| A-5 | Refund approver matrix | PRD R-FIN-003 (Principal ≤5k / Owner >5k) vs DDD (2-tier >5k) vs BRC R-APR-002 (5k/25k ladder) vs ERD (Accountant/Branch Head/Director) |
| A-6 | Student status | ERD (5 values) vs Prisma v3 (+SUSPENDED) vs DDD (+Provisional/+Promoted) |
| A-7 | Payment status | ERD 4 values vs Prisma 6 (+INITIATED/DISPUTED) |
| A-8 | Money | integer paise (API Catalog/ERD/Backend TD) vs decimal Money VO (DDD) |
| A-9 | Age-band labels | Jr.KG/Sr.KG (BRC) vs LKG/UKG (DDD/ERD/Prisma) |
| A-10 | Portal strategy | PRD/Frontend separate teacher/parent apps vs ADR-38 LOCKED single PreOne Hub |
| A-11 | ADR numbering | three colliding universes (§1.2) |
| A-12 | "Growth Passport" | named feature absent from ALL 19 sources — closest canon: observation/portfolio/milestone suite |

## Appendix B — Evidence index (key file:line)

- `src/lib/auth.ts:28-86` RBAC matrix + wildcard rule · `src/lib/auth-api.ts:7-21` requireApi · `src/middleware.ts` authn-only
- Unscoped lookups: `students/[id]/route.ts:16` · `invoices/[id]/route.ts:16` · `invoices/[id]/payments/route.ts:35` · `applications/[id]/approve|reject|verify/route.ts:26|20|20` · `leads/[id]/route.ts:19` · `leads/[id]/convert/route.ts:17` · `observations/[id]/publish/route.ts:20`
- Enrollment tx: `applications/[id]/approve/route.ts:26-235` · allocation race: `students/[id]/allocate/route.ts:49-108` + `src/lib/capacity.ts` · payment: `invoices/[id]/payments/route.ts:35-84` · numbering: `src/lib/sequence.ts:7-53` · audit swallow: `sequence.ts:64-80`
- Follow-up engine: `src/lib/followups.ts` (transitions, dedupe) · `src/lib/integrations.ts` (event→FU wiring, payment auto-resolve) · attendance guard: `attendance/route.ts:73-93`
- Setup engine: `src/lib/setup/engine.ts`, `validate.ts` · login gates: `auth/login/route.ts:20-40`
- Parent surfaces: `parent/today/route.ts:23-75` (scoped ✓) vs `invoices/route.ts:34-52` (leak) vs `app/students/[id]/page.tsx` (SSR, unscoped)
- Probes: `scripts/audit-probes.sh`, `scripts/audit-probes2.sh`, `scripts/dbq.mjs`
- Tests: `scripts/m01-e2e.sh` (49), `scripts/m00-e2e.sh` (41), `scripts/smoke.sh` (31), `scripts/m01-fixture.mjs`

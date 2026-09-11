# M01 — End-to-End Integration Impact Map

**Status:** ACTIVE · **Phase:** 0 (Impact Map First — mandated before coding)
**References:** PreOne Master PRD · DDD · BRC · ADRs · ERD/Prisma Schema v3.0 · API Contract Catalog · UI Design Philosophy · `docs/M00_Implementation_Impact_Map.md`
**Scope:** Connect M00 configuration to the existing bounded contexts and complete the preschool lifecycle
(SETUP → ACADEMIC STRUCTURE → ADMISSION → STUDENT → TEACHER → DAILY OPERATIONS → CARE → LEARNING →
COMMUNICATION → FINANCE → REPORTING → YEAR-END → NEXT YEAR).

---

## 0. Governing rules honoured (Absolute Rules §0)

- No redesign of architecture; no second Student/Parent/Teacher/AY/Fee/Attendance/Notification/Curriculum system.
- All new entities are additive, tenant-scoped (`tenantId`), soft-delete or immutable per existing conventions.
- No parallel APIs where one exists — extensions are marked per row below.
- No second business-rule / notification / configuration / audit engine.
- BRC rules are enforced in the backend/domain layer (`src/lib/*`), never only in UI.
- RBAC: new permissions are **additive entries in existing ROLE_PERMISSIONS bundles** (`src/lib/auth.ts`); no bypass.
- Domain events: single-process Next.js app — event seam is an **in-process dispatcher** (`src/lib/events.ts`)
  mapping domain events → existing infra (AuditLog, FollowUp engine, TimelineEntry/Announcement via notify).
  No new message broker, no second notification engine.

---

## 1. M00 → Existing Module consumption map (Phase 1)

Pattern: `M00 CONFIG → DOMAIN CONFIGURATION → DOMAIN WORKFLOW`. No config values are copied into
duplicate tables; SchoolConfig JSON stays the single source of truth; access is centralised in
`src/lib/config.ts` (`getDomain(tenantId, domain)` with typed defaults so nothing breaks pre-M00).

| # | M00 Config (SchoolConfig domain) | Consumed by (existing) | Consumption point (new) | Rule / BRC |
|---|---|---|---|---|
| 1 | OPERATING (hours, arrival window, working days, late/absence rules) | Attendance module | attendance POST: holiday/working-day guard, LATE derivation when marked after arrival window end, absence rule text surfaced on exceptions | Attendance BRC; calendar feeds |
| 2 | CalendarEvent (HOLIDAY/VACATION/EVENT/…) + AcademicSession | Attendance, Operations | `src/lib/calendar.ts` `dayStatus()` — OPEN / CLOSED(holiday) / NON_WORKING / EVENT | Attendance not expected on closed days |
| 3 | ADMISSION (requiredDocuments, registrationFee, approvalStages) | Applications approve | approve route checks required documents verified before ENROLLED; BUS_* errors preserved | Admission eligibility BRC |
| 4 | Program.capacity + Classroom.capacity | Admissions / Student allocation | `src/lib/capacity.ts` seat count → allocate/approve guard; WAITLISTED path | No silent overbooking |
| 5 | FeePlan (+FINANCE dueDayOffset) | Finance | approve→invoice already exists; extended with `academicSessionId`, due offset from FINANCE config, overdue sync, reminder | Finance BRC; money integer paise |
| 6 | Classroom.primaryTeacherId | Teacher Portal | `/api/v1/teacher/today` resolves assigned sections (teacher never recreates class lists) | RBAC branch scope |
| 7 | Student.currentClassroom (+ new StudentAllocation history) | Attendance / Academics / Parent / Finance | roster + timeline + fee flows resolve section→students; history kept in StudentAllocation | AY isolation |
| 8 | COMMUNICATION.notificationEvents / channels | Notification infra (Announcement + TimelineEntry) | `src/lib/notify.ts` — single funnel: child events → TimelineEntry (parent-visible), broadcasts → Announcement; module never sends directly | Notification rules |
| 9 | HEALTH_SAFETY (checks, incident categories, escalation) | Health/Safety flows | health check & incident intake (`POST /api/v1/care`, type HEALTH_CHECK/INCIDENT) → severity → FollowUp + notify | Never a normal notification |
| 10 | DAILY_OPERATIONS.recordTypes | Daily sheet UI | teacher day sheet renders exactly configured record types | Smart defaults, minimal taps |
| 11 | STUDENT_PARENT (pickupVerification, maxAuthorizedPickups) | Pickup/release | `POST /api/v1/operations/pickup` verifies authorised guardian (+ optional PIN) → release or BLOCK+alert | Pickup BRC; BLOCK on mismatch |
| 12 | CURRICULUM.learningAreas | Observations | observation `category` validated against configured learning areas | Observation BRC |

---

## 2. Integration rows (Feature → contexts → entities → changes → acceptance)

Legend: **Reuse** = existing untouched · **Ext** = extend existing · **New** = genuinely missing.

### I-1 Academic-year operational scoping (Spec §6)
- Source: Settings/Academics · Target: Attendance, Finance, Daily Ops, Academics
- Existing: AcademicSession (`isCurrent`, PLANNED/ACTIVE/CLOSING/CLOSED/ARCHIVED); Classroom already carries `academicSessionId`
- **New:** `src/lib/academic.ts` — `currentSession(tenantId)`, `sessionForClassroom`, `sessionForDate`
- **DB (Ext):** additive nullable `academicSessionId` on `Attendance`, `Invoice`, `TimelineEntry`, `Observation`; populated on write from the student's current classroom / fee plan context (nullable → history stays valid)
- Acceptance: every newly written operational record resolves an academic year; historical rows remain readable; no cross-year mixing in defaults views

### I-2 Follow-up / Exception engine (Spec §14, §32, §42, §43)
- Source: every operational context · Target: Operations command centre
- **New model `FollowUp`** (the ONE reusable exception+follow-up aggregate):
  `tenantId, branchId?, academicSessionId?, classroomId?, studentId?, domain (ATTENDANCE|HEALTH|SAFETY|LEARNING|CARE|ADMISSION|FINANCE|OPERATIONS), severity (INFO|WARNING|URGENT|EMERGENCY), status (OPEN|ACKNOWLEDGED|IN_PROGRESS|WAITING|RESOLVED|CLOSED), sourceType, sourceId?, title, detail?, responsibleRole, assignedToId?, dueAt?, actionTaken?, outcome?, resolvedAt?, resolvedByName?, createdById/Name`
- **New:** `src/lib/followups.ts` — `raise()` (idempotent per source when `dedupeKey` provided), `transition()` (OPEN→ACKNOWLEDGED→IN_PROGRESS→WAITING→RESOLVED→CLOSED; reopen allowed), every mutation audited
- Rules: notification ≠ resolution — raising a follow-up leaves status OPEN until a human resolves; unresolved items stay visible forever (operations centre + teacher/parent surfaces)
- Acceptance: 10 problem scenarios all observable as follow-ups with full lifecycle + audit

### I-3 Attendance → exceptions → parent comms (Spec §12, Scenario 1/2)
- Existing: Attendance aggregate (upsert per student/date), attendance GET/POST
- **Ext:** POST /api/v1/attendance — reads OPERATING + calendar: (a) holiday/working-day guard (block with BUS_CLOSED unless `force`), (b) LATE derivation hint, (c) after-commit: ABSENT → FollowUp(ATTENDANCE, WARNING, dedupeKey `attendance:{studentId}:{date}`) + notify parent (ATTENDANCE_UPDATE); reason captured on resolve via notes
- Acceptance: marking a section creates exactly one absence follow-up per absent child; marking LATE follows the arrival-window rule; closed day blocks

### I-4 Daily care events (Spec §13, Scenario 8)
- Existing: TimelineEntry aggregate (11 types) — currently no write API for ops
- **New:** `POST /api/v1/care` (teacher, attendance:mark) — `{studentId, type, title?, body?, mood?, value?}`; type validated against DAILY_OPERATIONS.recordTypes mapping (MEALS→MEAL etc.); bulk mode `entries[]`; per-child day view via `GET /api/v1/care?studentId&date`
- Mood/daily summary feed parent "How is my child doing today?"
- Acceptance: teacher can record a full day with minimal taps; parent sees the same events on the child timeline

### I-5 Health check & incidents (Spec §15, Scenario 2, 9)
- **Ext enum:** `TimelineEntryType.HEALTH_CHECK` (additive)
- **New intake:** care POST type=HEALTH_CHECK (outcome NORMAL/ABNORMAL) and type=INCIDENT (category from HEALTH_SAFETY.incidentCategories, severity from escalation rules)
- ABNORMAL health check / incident → FollowUp(HEALTH/SAFETY, URGENT/EMERGENCY) + notify(HEALTH_ALERT/INCIDENT_ALERT) — never plain info; EMERGENCY flagged for command centre CRITICAL band
- Acceptance: unwell child → exception raised, parent alerted, resolution recorded; incident visible to management until resolved

### I-6 Pickup / authorised release (Spec §16, Scenario 3)
- Existing: Guardian.canPickup, StudentGuardian, TimelineEntry.PICKUP
- **DB (Ext):** `Guardian.pickupPin String?` (optional PIN_MATCH mode per STUDENT_PARENT config)
- **New:** `POST /api/v1/operations/pickup` `{studentId, guardianId?, pin?}` → authorised+verified → TimelineEntry(PICKUP) + audit; unauthorised/mismatch → **BLOCK (403 BUSINESS_PICKUP_BLOCKED)** + FollowUp(SAFETY, EMERGENCY, dedupe per attempt burst) + notify
- Acceptance: valid release audited; mismatch blocked with alert trail

### I-7 Observation → action → outcome loop (Spec §17-19, Scenario 4)
- Existing: Observation + publish→TimelineEntry
- **DB (Ext):** `Observation.category String?` (learning area from CURRICULUM), `concern ObservationConcern (NORMAL|PROGRESS|NEEDS_ATTENTION|URGENT, default NORMAL)` (additive enum)
- **Ext:** POST /api/v1/observations accepts category/concern; NEEDS_ATTENTION/URGENT → FollowUp(LEARNING, WARNING/URGENT, dedupe `observation:{id}`) linking source; teacher acts → actionTaken → follow-up observation → outcome recorded on the follow-up
- No automatic medical/psychological diagnosis — deterministic categorisation only
- Acceptance: concern observation yields a visible learning follow-up with outcome trail

### I-8 Admission → student lifecycle hardening (Spec §8, §24, Scenario 5)
- Existing: approve fan-out (Student+Guardian+invoice in ONE tx) — reuse as-is
- **New:** `POST /api/v1/applications/{id}/waitlist` (WAITLISTED status already exists) + approve auto-suggests alternate section when full; allocation history row created on enrol
- **New model `StudentAllocation`** (mutable per-AY history, never overwrite): `tenantId, studentId, academicSessionId, classroomId, programType, startedAt, endedAt?, status (ACTIVE|COMPLETED|TRANSFERRED|PROMOTED|WITHDRAWN), reason?, byId/Name`
- **New:** `POST /api/v1/students/{id}/allocate` — section change/transfer with capacity guard + reason + audit + history ( closes previous ACTIVE row )
- Acceptance: one admission → one student → correct guardian links → correct allocation trail; full section blocks with waitlist path

### I-9 Finance integration (Spec §23-24, Scenario 7)
- Existing: Invoice aggregate, payments→receipt, approve→invoice
- **Ext:** invoices GET/dashboard — overdue sync (ISSUED + dueDate<today → OVERDUE, audited); invoice academicSessionId; due offset from FINANCE config
- **New:** `POST /api/v1/invoices/{id}/remind` → notify(FEE_DUE) + FollowUp(FINANCE) deduped per invoice; full payment auto-resolves the open fee follow-up (notify FEE_RECEIVED)
- Acceptance: overdue visible, reminder tracked, payment closes the loop; no direct mutation of issued invoices (payments/adjustments only)

### I-10 Teacher portal integration (Spec §11, 40; Scenario 6)
- Existing: Classroom.primaryTeacherId (PATCH for substitution = Scenario 6, audited)
- **New:** `GET /api/v1/teacher/today` — assigned sections (branch+AY scoped), expected vs arrived, pending attendance, today's care events, observations due, unresolved follow-ups assigned to teacher, latest messages; teacher sees actions, not config tables
- Acceptance: teacher logs in → sees exactly their sections' actionable work

### I-11 Parent experience (Spec §21-22, 41)
- Existing: timeline (guardian-scoped), finance, announcements — parent RBAC unchanged
- **New:** `GET /api/v1/parent/today` — per child: attendance state, care events (meals/nap/mood/activities), teacher updates, health flags (parent-appropriate only), fees due, follow-ups where parent action needed; sensitive internal notes never leak (TimelineEntry/Announcement only; FollowUp detail is staff-side)
- Acceptance: parent answers "How is my child doing today?" in one screen; no internal data leakage

### I-12 Operations command centre (Spec §33-34)
- **New:** `GET /api/v1/operations/today` (perm operations:read) — school status (calendar+working day), per-section staffing/attendance, exceptions banded CRITICAL/ATTENTION/NORMAL (exception-driven, not raw records), pending follow-ups, comms sent today
- **New:** `/api/v1/operations/exceptions` (list, filters) · `/api/v1/operations/follow-ups` + `PATCH /{id}` transitions (acknowledge/start/wait/resolve/close/reopen; perm operations:write)
- **UI:** `/app/operations` command centre; dashboard role-switch stays
- Acceptance: principal answers "Is my preschool running correctly today?" with only exceptions surfaced

### I-13 Year-end / promotion / next year (Spec §6, Scenario 10)
- Existing: AcademicSession status machine + PATCH set-current
- **New:** `POST /api/v1/academic-years/{id}/close` (transactional: ACTIVE→CLOSING→CLOSED, isCurrent=false, open items report) and `POST /api/v1/academic-years/{id}/promote` `{mappings:[{from,to}]}` — per student: allocation COMPLETED in old year + ACTIVE in new-year classroom (capacity-guarded), attendance/fees/observations keep old context; audited; idempotent per student
- Acceptance: year change preserves every historical record and never overwrites allocations

### I-14 Events seam (Spec §31)
- **New:** `src/lib/events.ts` — typed in-process dispatcher; emitted: StudentCreated, StudentAllocated, AttendanceExceptionDetected, HealthIncidentCreated, ObservationRecorded, FollowUpCreated/Resolved, InvoiceIssued, PaymentReceived, AcademicYearClosed, StudentPromoted; handlers wire notify/followups/audit. Meaningful state changes only — no CRUD noise.

### I-15 Transport / Inventory / Payroll (Spec §28-29, §26)
- **Decision:** no Transport/Inventory/Leave/Payroll bounded contexts exist in the MVP schema; creating them would violate "no duplicate/parallel systems" and the implementation order. M00 documents them as not-applicable; feature exposure stays OFF via configuration. Recorded as known gaps in the delivery report.

---

## 3. RBAC deltas (additive only, `src/lib/auth.ts`)

| Role | Added permissions |
|---|---|
| OWNER | covered by `*` |
| PRINCIPAL | `operations:read`, `operations:write` |
| COORDINATOR | `operations:read`, `operations:write` |
| TEACHER | `operations:read`, `operations:write` (own follow-ups) |
| ACCOUNTS | `operations:read` |
| PARENT | unchanged (timeline:read, communication:read, finance:read) |

Security invariants preserved: tenant/school/branch scoping on every query; teacher sees only assigned sections; parent sees only linked children; health data flagged severity-gated.

---

## 4. DB delta summary (all additive, `prisma db push`)

1. Enums: `ObservationConcern`, `FollowUpDomain`, `FollowUpSeverity`, `FollowUpStatus`, `StudentAllocationStatus`; `TimelineEntryType += HEALTH_CHECK`
2. Models: `FollowUp`, `StudentAllocation`
3. Columns: `Guardian.pickupPin?`; `Observation.category?`, `Observation.concern?`; `Attendance.academicSessionId?`; `Invoice.academicSessionId?`; `TimelineEntry.academicSessionId?`; `Observation.academicSessionId?`

---

## 5. New/extended API registry (envelope + requireApi per Contract Catalog)

| Endpoint | Verb | Perm | Kind |
|---|---|---|---|
| /api/v1/operations/today | GET | operations:read | New |
| /api/v1/operations/exceptions | GET | operations:read | New |
| /api/v1/operations/follow-ups | GET | operations:read | New |
| /api/v1/operations/follow-ups/[id] | PATCH | operations:write | New |
| /api/v1/operations/pickup | POST | attendance:mark | New |
| /api/v1/care | GET/POST | attendance:mark (write), timeline:read (read) | New |
| /api/v1/teacher/today | GET | attendance:read | New |
| /api/v1/parent/today | GET | timeline:read | New |
| /api/v1/students/[id]/allocate | POST | students:write | New |
| /api/v1/applications/[id]/waitlist | POST | admissions:write | New |
| /api/v1/invoices/[id]/remind | POST | finance:write | New |
| /api/v1/academic-years/[id]/close | POST | settings:write | New |
| /api/v1/academic-years/[id]/promote | POST | settings:write | New |
| /api/v1/attendance | POST ext | attendance:mark | Extended (calendar guard, AY scope, exception hooks) |
| /api/v1/observations | POST ext | academics:write | Extended (category, concern→follow-up) |
| /api/v1/dashboard | GET ext | session | Extended (operations summary links, role-neutral) |

---

## 6. UI delta summary (existing Windows-Shell design system only)

| Surface | Change |
|---|---|
| `/app/operations` (new nav "Operations", perm operations:read) | Command centre: today band, CRITICAL/ATTENTION/NORMAL, sections grid, follow-up queue with actions |
| `/app/dashboard` | TEACHER → teacher-today action view; PARENT → child-centric today; OWNER/PRINCIPAL → existing + operations shortcut |
| `/app/attendance` | Section roster w/ calendar guard messaging, late hints, absence follow-up feedback |
| `/app/timeline` | Teacher quick-add care composer (config-driven types); parent view unchanged |
| `/app/academics` | Observation composer (category/concern), follow-up chips, outcome capture |
| `/app/students/[id]` | Allocation panel (section change/transfer), pickup contacts + release, follow-ups |
| `/app/admissions` | Waitlist action; approve shows capacity; waitlisted re-activate |
| `/app/finance` | Overdue auto-badges, remind action, follow-up status per invoice |

---

## 7. Implementation order (Spec §57) → task mapping

P1 config consumption (§1) → P2 AY+structure (I-1) → P3 admission→student (I-8) → P4 student/teacher/parent (I-10, I-11) → P5 attendance+daily ops (I-3, I-4) → P6 health & safety (I-5, I-6) → P7 academics+observation+follow-up (I-2, I-7) → P8 communication (notify funnel) → P9 finance (I-9) → P10 reports/command centre (I-12) → P11 transport/inventory/HR (I-15: documented gaps) → P12 year-end (I-13) → P13 end-to-end validation (E2E script + matrices).

---

## 8. Test & regression strategy

- `scripts/m01-e2e.sh`: full journey on a fresh tenant — setup → go-live → AY → program/class/section → teacher → admission → approve → student/guardian/invoice → allocate → attendance (absent/late) → care day → health check abnormal → incident → observation concern → follow-ups resolved → fee overdue→remind→payment→receipt → pickup valid+blocked → teacher/parent today → year-end close+promote → data-consistency assertions (§53).
- Regression: `scripts/smoke.sh` (31 checks) must stay green; M00 E2E `scripts/m00-e2e.sh` unaffected (additive only).
- Security checks inside E2E: teacher 403 on admissions approve; parent isolation (other child 403/empty); cross-tenant 404s.

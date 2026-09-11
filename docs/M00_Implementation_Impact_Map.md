# M00 — Preschool Creation & Setup — Implementation Impact Map

> Status: **AUTHORITATIVE PRE-CODE ARTIFACT** (per M00 brief §"Do not start coding until this impact map is complete")
> Scope: additive integration with the existing PreOne architecture. **Nothing existing is redesigned, replaced, or removed.**
> Codebase state inspected: Prisma schema v3.0 MVP (23 models), 16 API route groups, Windows-Shell design system v4.1, 8-role RBAC, audit + envelope conventions.

---

## 1. ARCHITECTURE RULES HONORED (traceability to the brief)

| Brief rule | How this implementation complies |
|---|---|
| §41 One source of truth; SETUP → CONFIGURATION → MASTER DATA → OPERATIONAL DATA | Setup engine **derives** step completion from real operational data (Branch/Classroom/FeePlan rows), never stores parallel copies. Config domains store **only** what has no natural entity (JSON `SchoolConfig`), and operational modules will read from there. |
| §12 Use existing RBAC, no second authorization system | All setup APIs guard via existing `requireApi(req, 'settings:read'/'settings:write')` + `can()` / `ROLE_PERMISSIONS`. Roles step *audits* the existing RBAC; it does not create one. |
| §34 First inspect existing API contracts, extend consistently, no duplicates | Branches/programs/facilities/calendar/staff config get **new minimal CRUD** (none exists); classrooms reuse existing `/api/v1/classrooms` (additive optional fields); tenants profile edit goes through a **setup-scoped PATCH** that writes the existing `Tenant` row. |
| §35 Inspect ERD/Prisma first; add only genuinely missing entities; follow tenant isolation, soft-delete, audit, `_cents` money | New entities listed in §4; all carry `tenantId`, `createdAt/updatedAt`, `deletedAt` where lifecycle-relevant, UUID PKs, `@@map` snake_case, `@@index([tenantId,…])`. |
| §33 Audit every setup mutation | Every mutation routes through existing `audit()` helper (`src/lib/sequence.ts`) into `audit_logs`. |
| §8 Use existing Theme Engine | Branding step writes `Tenant.logoUrl` + `SchoolConfig(BRANDING)`; no new theme architecture. |
| Do not hardcode programs | New `Program` master-data table; legacy `ProgramType` enum kept and linked (`Program.programType`) so existing `Classroom.programType`, `FeePlan.programType`, `Lead.interestedProgram` contracts remain untouched. |

## 2. ENTITY MAPPING — M00 CONCEPT → EXISTING SCHEMA (no redesign)

| M00 brief concept | PreOne existing entity | Decision |
|---|---|---|
| Tenant / School | `Tenant` | Reused. Identity fields already exist (name, code, city/state/pincode, phone/email/website, timezone, locale, logoUrl, gst/pan, academicYearStartMonth). |
| Branch / Campus | `Branch` (timing, isMain, isActive) | Reused + **additive nullable** `capacity Int?`. |
| Academic Year | `AcademicSession` (status, isCurrent) | Reused verbatim — this IS the academic year. |
| Program | `ProgramType` enum (hardcoded 5 values) used by Classroom/FeePlan/Lead | **New `Program` master table** (configurable), keeps mandatory link `programType ProgramType` for legacy contracts. |
| Class + Section | `Classroom` (branchId, academicSessionId, programType, capacity, primaryTeacherId, ageBandMin/MaxMonths) | Reused as the class/section unit **per existing schema v3.0**. Additive nullable `programId String?`, `facilityId String?`. |
| Classroom/Room (physical) | — none | **New `Facility`** table (CLASSROOM / ACTIVITY_AREA / PLAY_AREA / NAP_AREA / MEAL_AREA / WASHROOM / MEDICAL / OTHER). |
| Staff | `User` + `TenantUser` (role, branchId) | Reused for identity+RBAC. **New `StaffProfile`** for employment data (employeeCode, designation, qualification, joiningDate, employmentType, emergency contact). "Created ≠ assigned" enforced by predicate: assigned ⇔ `TenantUser.branchId` set (and teacher assignment ⇔ `Classroom.primaryTeacherId`). |
| Teacher assignment | `Classroom.primaryTeacherId` | Reused; exposed via existing classrooms API extension. |
| Curriculum | — | `SchoolConfig(CURRICULUM)` JSON: learning areas, assessment methods, report structure, per-program codes. |
| School calendar | — | **New `CalendarEvent`** (HOLIDAY/VACATION/EVENT/PARENT_MEETING/ASSESSMENT/SPECIAL_DAY). Working days live in `SchoolConfig(OPERATING)` + existing `Branch.timingOpen/Close`. |
| Admission rules | `AdmissionApplication`, `Lead`, `DocumentType` (flow exists) | Config layer **new** `SchoolConfig(ADMISSION)`: open/close dates, registration/admission fee (paise `*_cents`), required docs, approval workflow. |
| Fees | `FeePlan` + `FeePlanItem` (paise) | Reused. Predicate: every active Program has ≥1 active FeePlan. Payment methods → `SchoolConfig(FINANCE)`. |
| Daily ops config | `Attendance`, `TimelineEntry`, `Observation` | Config **new** `SchoolConfig(DAILY_OPERATIONS)`: enabled record types, arrival/pickup windows. |
| Health & safety | `Student.bloodGroup`, `TimelineEntryType.INCIDENT` | Config **new** `SchoolConfig(HEALTH_SAFETY)`: allergy categories, incident categories, emergency contacts, escalation, pickup verification rules. |
| Communication | `Announcement` (in-app) | Config **new** `SchoolConfig(COMMUNICATION)`: channels, notification events → recipients, quiet hours, consent. |
| Documents/templates | `DocumentType` enum | Config **new** `SchoolConfig(DOCUMENT_TEMPLATES)`: template registry with branding flag. |
| Student/parent rules | `Student`, `Guardian`, `StudentGuardian` (canPickup, isFeePayer, receivesComm) | Config **new** `SchoolConfig(STUDENT_PARENT)`: required fields, consent types (with version), pickup rules. |
| Setup state machine | `Tenant.onboardingStep/onboardedAt` (coarse) | Kept for compat; authoritative state = **new `SchoolSetup`** + `SchoolSetupStep`. |
| Audit | `AuditLog` + `audit()` | Reused verbatim. |

## 3. NEW DATABASE ENTITIES (all tenant-scoped, following frozen conventions)

| Model | Purpose | Key fields |
|---|---|---|
| `SchoolSetup` | Persistent state machine, 1:1 tenant | `tenantId @unique`, `status` (`NOT_STARTED/IN_PROGRESS/BLOCKED/READY_FOR_REVIEW/READY_FOR_GO_LIVE/LIVE`), `goLiveAt`, `goLiveById`, `lastValidationAt` |
| `SchoolSetupStep` | Per-step persistent state | `tenantId+stepKey @unique`, `status` (`PENDING/COMPLETE/BLOCKED/SKIPPED`), `applicability` (`MANDATORY/OPTIONAL/RECOMMENDED`), `blockedReason`, `completedById/Name`, `completedAt`, `dataSnapshot Json` (drift detection → "changed after completion"), `lastCheckedAt` |
| `SchoolSetupValidationRun` | Persisted validation / go-live check results | `tenantId`, `kind` (`SETUP_VALIDATION/GO_LIVE_CHECK`), `overall` (`PASS/WARNING/BLOCKED`), `result Json`, `runById/Name` |
| `Program` | Configurable program master data | `code`, `name`, `programType` (legacy link), `ageMinMonths/ageMaxMonths`, `durationMonths`, `capacity`, `isActive`, soft-delete |
| `Facility` | Infrastructure tree below branch | `branchId`, `type FacilityType`, `name`, `code`, `capacity`, `floorOrArea`, `isActive`, soft-delete |
| `StaffProfile` | Employment foundation (identity stays in User/TenantUser) | `userId @unique`, `branchId?`, `employeeCode`, `designation`, `qualification`, `joiningDate`, `employmentType`, emergency contact, status, soft-delete |
| `CalendarEvent` | School calendar entries | `branchId?`, `academicSessionId?`, `date @db.Date`, `type CalendarEventType`, `title`, `notes` |
| `SchoolConfig` | JSON config per domain (only where no natural entity) | `tenantId+domain @unique` over `ConfigDomain` (`OPERATING, ADMISSION, STUDENT_PARENT, FINANCE, DAILY_OPERATIONS, HEALTH_SAFETY, COMMUNICATION, DOCUMENT_TEMPLATES, CURRICULUM, BRANDING`), `data Json`, `updatedById/Name` |

**Additive columns (non-breaking):** `Classroom.programId?`, `Classroom.facilityId?`, `Branch.capacity?`.
**New enums:** `SetupStatus, SetupStepStatus, SetupApplicability, ValidationKind, ValidationOverall, FacilityType, EmploymentType, CalendarEventType, ConfigDomain`.

## 4. SETUP STEP REGISTRY (engine `src/lib/setup/steps.ts`) — 20 steps

| # | stepKey | Label | Applicability | Completion predicate (derived from real data) | Depends on (blocking) |
|---|---|---|---|---|---|
| 1 | `school_profile` | School Profile | MANDATORY | Tenant has name, email, phone, city, address, timezone, locale | — |
| 2 | `branch` | Branch / Campus | MANDATORY | ≥1 active Branch with timingOpen<timingClose | school_profile |
| 3 | `branding` | Branding & Theme | RECOMMENDED | `Tenant.logoUrl` set OR `SchoolConfig(BRANDING)` exists | school_profile |
| 4 | `programs` | Programs Offered | MANDATORY | ≥1 active Program with age band + capacity | school_profile |
| 5 | `infrastructure` | Infrastructure | MANDATORY | ≥1 active Classroom (rooms) ; ≥1 Facility recommended | branch |
| 6 | `operating_config` | Operating Configuration | MANDATORY | `SchoolConfig(OPERATING)` with start/end times + working days | branch |
| 7 | `roles` | Roles & Permissions | MANDATORY | ≥2 TenantUser memberships (owner + operator) | school_profile |
| 8 | `staff` | Staff Foundation | MANDATORY | ≥1 StaffProfile whose user is branch-assigned | roles |
| 9 | `academic_year` | Academic Year | MANDATORY | ≥1 AcademicSession `isCurrent` with valid range | branch |
| 10 | `classes_sections` | Classes & Sections | MANDATORY | ≥1 active Classroom on current session with capacity linked to a Program | academic_year, programs, infrastructure |
| 11 | `teacher_assignment` | Teacher Assignment | MANDATORY | every active classroom (current session) has primaryTeacherId | classes_sections, staff |
| 12 | `curriculum` | Curriculum & Learning Areas | MANDATORY | `SchoolConfig(CURRICULUM)` with ≥1 learning area | programs, academic_year |
| 13 | `calendar` | School Calendar | MANDATORY | ≥1 CalendarEvent in current session AND operating working-days set | academic_year, operating_config |
| 14 | `fees` | Fees & Finance | MANDATORY | every active Program has ≥1 active FeePlan | programs, academic_year |
| 15 | `admission_config` | Admission Configuration | MANDATORY | `SchoolConfig(ADMISSION)` with window + required docs + workflow | programs, fees |
| 16 | `student_parent` | Student & Parent Foundation | MANDATORY | `SchoolConfig(STUDENT_PARENT)` with ≥1 consent type + pickup rule | school_profile |
| 17 | `daily_operations` | Daily Operations | MANDATORY | `SchoolConfig(DAILY_OPERATIONS)` with attendance + record types | operating_config, classes_sections |
| 18 | `health_safety` | Health & Safety | MANDATORY | `SchoolConfig(HEALTH_SAFETY)` with allergy + incident categories + emergency contact | school_profile |
| 19 | `communication` | Communication | MANDATORY | `SchoolConfig(COMMUNICATION)` with ≥1 channel + notification events | student_parent |
| 20 | `documents` | Documents & Templates | RECOMMENDED | `SchoolConfig(DOCUMENT_TEMPLATES)` with ≥1 template | school_profile |
| 21 | `data_import` | Data Import (optional) | OPTIONAL | SKIPPED or ≥1 imported student batch | classes_sections, student_parent |

(Dashboard groups these into 4 phases: Foundation 1–8, Academic Structure 9–13, Business Rules 14–16, Operations & Readiness 17–21.)

## 5. STATE MACHINE & ENGINES

- Tenant status: `NOT_STARTED → IN_PROGRESS → (BLOCKED ⇄) READY_FOR_REVIEW → READY_FOR_GO_LIVE → LIVE`.
  - Any mandatory step BLOCKED ⇒ tenant `BLOCKED`; all mandatory complete/skipped ⇒ `READY_FOR_REVIEW`; `POST /validate` PASS/WARNING ⇒ `READY_FOR_GO_LIVE`; `POST /go-live` ⇒ `LIVE` (sets `goLiveAt`, audit).
- Step lifecycle: `PENDING → (deps unmet ⇒ BLOCKED[reason]) → COMPLETE(actor, time, dataSnapshot) → drift ⇒ changedAfterCompletion`. `SKIP` allowed only when `applicability ≠ MANDATORY`.
- Auto-evaluation: `GET /setup/status` re-runs predicates (lazy init for pre-existing tenants incl. demo Sunshine), auto-completes satisfied steps with actor `system:auto` + audit; explicit `POST /steps/{key}/complete` records the human actor.
- Validation engine: 15 categories (Identity, Branch, Users/RBAC, Infrastructure, Academic, Curriculum, Calendar, Admissions, Students/Parents, Finance, DailyOps, Health&Safety, Communication, Documents, Data) → `PASS/WARNING/BLOCKED` + findings; persisted as `SchoolSetupValidationRun`; go-live re-runs `GO_LIVE_CHECK`.

## 6. API IMPACT MAP (existing envelope `{success,data,meta?,traceId}`; guards: settings:read for reads, settings:write for mutations; platform tenant creation unchanged)

| M00 need | API | Status |
|---|---|---|
| Setup status/dashboard | `GET /api/v1/setup/status` | NEW |
| Progress widget | `GET /api/v1/setup/progress` | NEW |
| Dependency graph / why-blocked | `GET /api/v1/setup/dependencies` | NEW |
| Complete / skip / reopen step | `POST /api/v1/setup/steps/[key]/(complete|skip|reopen)` | NEW |
| Run validation | `POST /api/v1/setup/validate` | NEW |
| Go live | `POST /api/v1/setup/go-live` | NEW |
| Config domains (8 JSON domains) | `GET/PUT /api/v1/setup/config/[domain]` | NEW |
| School profile edit | `PATCH /api/v1/setup/school-profile` (writes existing Tenant) | NEW |
| Branches CRUD | `GET/POST /api/v1/branches`, `PATCH /api/v1/branches/[id]` | NEW |
| Programs CRUD | `GET/POST /api/v1/programs`, `PATCH /api/v1/programs/[id]` | NEW |
| Facilities | `GET/POST /api/v1/facilities` | NEW |
| Academic years | `GET/POST /api/v1/academic-years`, `PATCH /api/v1/academic-years/[id]` | NEW |
| Calendar | `GET/POST /api/v1/calendar`, `DELETE /api/v1/calendar/[id]` | NEW |
| Staff | `GET/POST /api/v1/staff` (optionally creates User+TenantUser transactionally) | NEW |
| Data import (students CSV) | `POST /api/v1/setup/import/students` `{mode:'preview'|'commit'}` | NEW |
| Classrooms | `GET/POST /api/v1/classrooms` | EXISTS — additive optional `programId`, `facilityId`, `primaryTeacherId` on POST |
| Tenant/school creation | `POST /api/v1/tenants` | EXISTS — transaction extended to seed `SchoolSetup` + `SchoolSetupStep*` + `Program` rows; nothing removed |
| Users/RBAC | `/api/v1/users` | EXISTS (roles step consumes) |
| Fee plans | `/api/v1/fee-plans` | EXISTS (fees step consumes) |

## 7. UI IMPACT MAP (existing Windows-Shell design system only: `.card .btn .badge .dtable .field .form-grid .kpi .modal .progressbar` tokens; Poppins/Nunito; violet #7C3AED; light/dark via `data-theme`)

| Artifact | File | Status |
|---|---|---|
| Nav entry "Setup" | `src/lib/nav.ts` (`{key:'setup', href:'/app/setup', perm:'settings:read', grad:'g-violet', icon: Rocket}`) | EDIT (additive) |
| Setup Dashboard (progress %, 4 phase groups, per-step status/blocker/last-updated/completed-by, Continue Setup, Review Completed, View Dependencies, guidance feed) | `src/app/app/setup/page.tsx` | NEW |
| Guided step page (title, explanation, fields/CRUD per step type, Save & Continue / Save as Draft / Back / Skip-if-optional, dependency warning with [Fix Configuration], empty states) | `src/app/app/setup/[step]/page.tsx` | NEW |
| First-login setup handoff | `src/app/app/dashboard/page.tsx` server guard → redirect `/app/setup` when status ≠ LIVE and role ∈ {OWNER, PRINCIPAL}; dashboard banner for others | EDIT (additive) |
| Settings → Preschool Setup entry card | `src/app/app/settings/page.tsx` | EDIT (additive link) |
| /onboard platform console | unchanged UX; tenant creation now also initializes setup state server-side | NO UI CHANGE |

## 8. SECURITY MATRIX (existing RBAC — §36)

| Action | Permission (existing) | Roles granted |
|---|---|---|
| View setup status/dependencies/summary | `settings:read` | OWNER, PRINCIPAL, COORDINATOR |
| Mutate any setup step/config/CRUD | `settings:write` | OWNER (`*` school-scope), PRINCIPAL |
| Create school (tenant) | `platform:manage` | PLATFORM_ADMIN only (hardened in Task 7) |
| Finance config PUT | `settings:write` (OWNER/PRINCIPAL; ACCOUNTS has finance:write but not settings — documented as intentional: school-level config is principal/owner) | OWNER, PRINCIPAL |
| Go-live | `settings:write` + audit actor | OWNER, PRINCIPAL |
| Tenant-creation seeding | server-side within platform transaction | n/a |

## 9. DEPENDENCIES & ACCEPTANCE CRITERIA

**Build order (incremental, each step leaves app green):** schema+migrate → engine libs → setup APIs → config/CRUD APIs → dashboard UI → step UI → integration (onboard/dashboard/settings/nav) → E2E.

**Acceptance (from §40 Definition of Done):** a brand-new tenant created via `/onboard` reaches `LIVE` through UI/API alone — every mandatory step completable in-app, validation gates go-live, no engineer touches the DB. Regression: existing smoke matrix (30 checks) stays green; demo tenant Sunshine auto-migrates into setup system via lazy init without data loss.

**Risks / documented trade-offs:** (a) Class+Section remain merged in `Classroom` per existing schema — mapped, not redesigned; (b) `ProgramType` enum retained for legacy contracts alongside configurable `Program`; (c) communication channels remain in-app until a provider ADR exists — config stores intent; (d) finance config permissions intentionally limited to settings:write holders.

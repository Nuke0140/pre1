# PreOne: Module & Screen Technical Acceptance Criteria & Expected Behavior Specification

**Document Version:** 1.0 (Production Engineering & QA Contract)  
**System:** PreOne Preschool & Early Childhood Management System  
**Audience:** Full-Stack Engineers, QA Automation Leads, DevOps/SRE Engineers, Security Auditors, Tech Leads  
**Target Environment:** Next.js 16.3 (Webpack/Turbopack), TypeScript 5.7, Prisma ORM 6.11, PostgreSQL 16  
**Reference Tenant:** `PreOne Preschool (Code: SUNSHINE)`  

---

## 1. Global Architectural & Security Invariants

All modules and screens must satisfy the following overarching engineering invariants:

1. **Uniform API Response Contract:**
   - **Success (2xx):**
     ```json
     { "success": true, "data": { ... }, "traceId": "PRE-XXXXXXXX" }
     ```
   - **Failure (4xx / 5xx):**
     ```json
     { "success": false, "error": "ERROR_CODE", "message": "Localized string", "traceId": "PRE-XXXXXXXX" }
     ```
2. **Fail-Closed Authorization Invariant:** If an actor's session, `tenantId`, or `branchId` cannot be cryptographically verified, the request must fail closed (`401 Unauthorized` or `403 Forbidden`). Synthetic fallback data in production is strictly forbidden.
3. **Zero IDOR Invariant:** Entity mutation or retrieval must verify that the target entity belongs to `session.tenantId`. Role scoping must ensure staff only access their assigned `branchId` (unless holding `OWNER` / `PRINCIPAL` school-wide scope).
4. **Performance SLAs:**
   - Read API Queries: $P95 \le 300\text{ms}$.
   - Write API Mutations: $P95 \le 500\text{ms}$.
   - Core Web Vitals: LCP $\le 2.0\text{s}$, FID $\le 100\text{ms}$, CLS $\le 0.05$.
5. **Localization Invariant:** All user-facing error strings, field labels, and notification titles must resolve through `getTranslation(key, locale)` across `en-IN`, `mr-IN`, and `hi-IN`.

---

## 2. Screen-by-Screen Technical Specifications & Acceptance Criteria

---

### Module 1: Authentication & Identity Management
**Primary Routes:** `/login`, `/api/v1/auth/login`, `/api/v1/auth/mfa/verify`, `/api/v1/auth/switch-role`, `/api/v1/auth/logout`

#### Expected Behavior
1. Users enter `email`, `password`, and optional `schoolCode`.
2. If `schoolCode` is omitted, the system resolves the tenant by user email. If the user belongs to multiple tenants, `schoolCode` is required.
3. Passwords must be verified against `user.passwordHash` using bcrypt.
4. **Privileged Roles Step-Up (MFA):** Accounts with `OWNER` or `ACCOUNTS` roles require an OTP challenge (`requiresMfa: true`, returning `mfaToken`).
5. In non-production environments, demo OTPs (`1234`, `0000`, `000000`) are accepted. In production, real OTPs are delivered via email/SMS.
6. Upon successful authentication, an HTTP-only, SameSite=Lax, Secure session cookie (`preone_session`) is issued with a signed JWT.

#### Acceptance Criteria
* [x] **AC-AUTH-01 (Successful Login):** Given valid credentials for `principal.main.1@sunshine.demo` + `PreOne@2026`, when submitting to `/api/v1/auth/login`, then return HTTP 200 with user profile, roles `['PRINCIPAL']`, and `preone_session` cookie.
* [x] **AC-AUTH-02 (Privileged Step-Up):** Given valid credentials for `owner@sunshine.demo`, when submitting to `/api/v1/auth/login`, then return HTTP 200 with `requiresMfa: true` and a valid `mfaToken`. Session cookie must NOT be set until `/api/v1/auth/mfa/verify` completes with code `1234`.
* [x] **AC-AUTH-03 (Account Lockout):** Given 5 consecutive invalid password attempts from an IP/account within 5 minutes, then return HTTP 429 (`AUTH_RATE_LIMIT_EXCEEDED`) and lock the account for 15 minutes.
* [x] **AC-AUTH-04 (Role Switching):** Given a multi-role user (`teacher.main.multirole@sunshine.demo`), when invoking `POST /api/v1/auth/switch-role` with `{ targetRole: 'COORDINATOR' }`, then verify the target role is in `session.roles` and issue an updated session token within 200ms.

---

### Module 2: Global Workspace Shell & Navigation
**Primary Routes:** `/app`, `/app/dashboard`, Global Header, Drawer Components

#### Expected Behavior
1. The global header renders the active school brand logo, name, branch dropdown, language selector, role switcher, notification bell, and user avatar.
2. The **Branch Switcher** displays all branches assigned to the current user. Users with single-branch assignment see their branch fixed without dropdown controls.
3. The **Language Selector** switches the application locale between `en-IN`, `mr-IN`, and `hi-IN` without requiring a full page reload.
4. The **Notification Drawer** displays unread badge counts, allows marking notifications as read, and navigates to the target record URL upon click.

#### Acceptance Criteria
* [x] **AC-SHELL-01 (Brand Isolation):** Given tenant `SUNSHINE`, the workspace header must display `"PreOne Preschool"` and the customized primary color (`#8B5CF6`).
* [x] **AC-SHELL-02 (Branch Switching):** Given an `OWNER` or `PRINCIPAL` user, when switching from *Main Campus* to *Pune Campus*, then all dashboard metrics, student rosters, and active classrooms update reactively within 400ms.
* [x] **AC-SHELL-03 (In-App Notification Click-Through):** Given an unread notification with `linkUrl: "/app/students/[id]?tab=observations"`, when clicked:
  1. Issues `PATCH /api/v1/notifications/[id]/read`.
  2. Decrements unread badge count by 1.
  3. Executes `router.push(n.linkUrl)`.
  4. Activates the Observations tab directly.

---

### Module 3: School Setup & Onboarding Wizard
**Primary Routes:** `/app/setup`, `/app/setup/[step]`, `/api/v1/setup/*`

#### Expected Behavior
1. A 9-step sequential wizard guiding initial school configuration:
   - Step 1: School Identity (`/app/setup/school`)
   - Step 2: Campus Branches (`/app/setup/branch`)
   - Step 3: Academic Session & Terms (`/app/setup/academic-years`)
   - Step 4: Classrooms & Capacity (`/app/setup/classroom`)
   - Step 5: Fee Plans & Concessions (`/app/setup/fee`)
   - Step 6: Staff Onboarding (`/app/setup/staff`)
   - Step 7: Transport Fleet (`/app/setup/transport`)
   - Step 8: Parent Portal Defaults (`/app/setup/parent-portal`)
   - Step 9: Review & Launch (`/app/setup/review`)
2. Each step validates required fields and blocks progression until valid.
3. The Staff step supports both single manual entry and bulk CSV/Excel upload with real-time error reporting.

#### Acceptance Criteria
* [x] **AC-SETUP-01 (Step Validation):** Given Step 2 (Campus Branches), if branch name or code is omitted, the "Continue" button must be disabled, and submitting via API must return HTTP 400 with specific field errors.
* [x] **AC-SETUP-02 (Single Main Branch):** The setup engine must require exactly one branch with `isMain: true`. Attempting to deselect all main branches or set multiple main branches must be rejected.
* [x] **AC-SETUP-03 (CSV Staff Import):** Given a CSV with 50 staff records containing 2 invalid email formats, the import processor must reject only the 2 invalid rows, return line numbers with error reasons, and allow 1-click batch import of the 48 valid rows.

---

### Module 4: Admissions & Enquiries CRM Pipeline
**Primary Routes:** `/app/admissions`, `/api/v1/admissions/*`, `/api/v1/public/enquiry`

#### Expected Behavior
1. Interactive Kanban board visualizing leads across 5 stages:
   $$\text{NEW\_LEAD} \longrightarrow \text{TOUR\_SCHEDULED} \longrightarrow \text{FORM\_VERIFIED} \longrightarrow \text{SEAT\_OFFERED} \longrightarrow \text{ENROLLED}$$
2. Public website enquiry endpoint `/api/v1/public/enquiry` ingests external parent leads into `NEW_LEAD`.
3. Leads display child's calculated age in years and months based on date of birth.
4. Dragging a lead to `ENROLLED` triggers the atomic enrollment transaction.

#### Acceptance Criteria
* [x] **AC-ADM-01 (Public Lead Intake):** Given a valid payload to `/api/v1/public/enquiry` with child name, DOB, and parent phone, then insert an `Enquiry` record under the tenant and emit domain event `EnquiryCreated` within 250ms.
* [x] **AC-ADM-02 (Age-Program Qualification):** Given a child DOB indicating age 2 years 8 months, the lead card must display `"2 yr, 8 mos"` and suggest the `NURSERY` program.
* [x] **AC-ADM-03 (Atomic Enrollment Transaction):** When moving lead to `ENROLLED`:
  1. `Enquiry` status becomes `ENROLLED`.
  2. `Student` record created with unique `admissionNo`.
  3. `Guardian` user account created/linked with `StudentGuardian` mapping.
  4. Initial `ClassroomAllocation` created.
  5. Admission fee `Invoice` generated.
  6. All executed in a single atomic database transaction; any failure rolls back completely.

---

### Module 5: Student Directory & 360° Living Dossier
**Primary Routes:** `/app/students`, `/app/students/[id]`, `/api/v1/students/*`

#### Expected Behavior
1. Directory view `/app/students` displays a searchable, filterable grid/table of active students with classroom, program, and attendance badges.
2. Dossier view `/app/students/[id]` renders a 13-tab unified child dossier.
3. Server-side rendering resolves initial tab via query parameter `?tab=...` (e.g. `?tab=observations`, `?tab=fees`).
4. Medical alerts (allergies, chronic conditions) are rendered in persistent high-visibility badges across all tabs.

#### Acceptance Criteria
* [x] **AC-STU-01 (Student Search):** Searching `"Aarav"` on `/app/students` must return matching students across first name, last name, and admission number within 150ms.
* [x] **AC-STU-02 (Tab Persistence & Deep Linking):** Given direct navigation to `/app/students/[id]?tab=observations`, the server component must pass `initialTab: 'observations'`, rendering the Observations tab active without flash of overview content.
* [x] **AC-STU-03 (Parent Access Quarantine):** Given a logged-in parent, requesting `/api/v1/students/[id]` for their own child must return HTTP 200. Tampering with the URL to another student ID must return HTTP 403 Forbidden.

---

### Module 6: Classroom Directory & Daily Attendance Kiosk
**Primary Routes:** `/app/classrooms`, `/app/attendance`, `/api/v1/classrooms/*`, `/api/v1/attendance/*`

#### Expected Behavior
1. Classroom view shows assigned teacher, program type, current enrollment, and room capacity.
2. Attendance Kiosk allows marking daily attendance per student: `PRESENT`, `ABSENT`, `LATE`, or `EXCUSED`.
3. "Mark All Present" button sets all unrecorded students to `PRESENT` in a single client action.
4. Marking a student `ABSENT` triggers an automated attendance alert to guardians.

#### Acceptance Criteria
* [x] **AC-ATT-01 (One-Tap Attendance Submission):** Submitting attendance for a classroom of 25 students via `POST /api/v1/attendance/batch` must complete in $\le 400\text{ms}$.
* [x] **AC-ATT-02 (Absence Notification Trigger):** When a student is marked `ABSENT`, the domain dispatcher must emit `AttendanceExceptionDetected`, creating an `InAppNotification` for the child's guardian within 1 second.
* [x] **AC-ATT-03 (Classroom Capacity Guard):** Attempting to allocate a student to a classroom whose active enrollment equals or exceeds `capacity` must return a confirmation warning modal requiring managerial override.

---

### Module 7: Classroom Daily Care & Routine Diary
**Primary Routes:** `/app/daily-diary`, `/api/v1/daily-diary/*`

#### Expected Behavior
1. Allows teachers to log care routines across 4 categories:
   - **Meals:** Breakfast, lunch, snack (Intake: *All, Most, Half, Little, None*).
   - **Naps:** Start time, end time, sleep quality.
   - **Hygiene:** Potty check, diaper change (*Wet, BM, Dry*).
   - **Hydration:** Water intake checks.
2. Timeline generates an aggregated daily digest for parents available in the mobile view.

#### Acceptance Criteria
* [x] **AC-DIARY-01 (Routine Logging):** Submitting a meal routine for 10 students in a classroom must record 10 `DailyDiaryEntry` records with timestamps within 350ms.
* [x] **AC-DIARY-02 (Parent Daily Digest):** When a parent accesses their child's daily diary, only entries from authorized teachers of the child's active classroom must be visible. Cross-classroom bleed is strictly blocked.

---

### Module 8: Developmental Observations & PreO AI Copilot
**Primary Routes:** `/app/daily-diary?tab=observations`, `/app/learning`, `/api/v1/observations/*`

#### Expected Behavior
1. Teachers record milestone observations with:
   - Narrative description.
   - Domain category (*Gross Motor, Fine Motor, Cognitive, Language/Literacy, Socio-Emotional, Creative Arts*).
   - Concern level (*NORMAL, PROGRESS, NEEDS_ATTENTION, URGENT*).
   - Optional photo attachment.
2. **PreO AI Integration:** Teachers can click "Polish with PreO AI" to convert bullet points into an EYFS/Montessori-aligned paragraph.
3. Observations remain in `DRAFT` status until explicitly published.
4. Publishing emits `ObservationRecorded` and dispatches notifications to guardians.

#### Acceptance Criteria
* [x] **AC-OBS-01 (Observation Publishing Lifecycle):**
  1. `POST /api/v1/observations` creates record with status `DRAFT`.
  2. `POST /api/v1/observations/[id]/publish` updates status to `PUBLISHED` and sets `publishedAt = now()`.
  3. Re-publishing an already published observation must fail closed with HTTP 409 Conflict.
* [x] **AC-OBS-02 (Branch Mismatch Quarantine):** A teacher assigned exclusively to Branch A attempting to publish an observation for a student in Branch B must be rejected with HTTP 403 Forbidden.
* [x] **AC-OBS-03 (PreO AI Generation SLA):** The AI observation polisher must return formatted output in $\le 2.5\text{s}$ with proper domain tagging.

---

### Module 9: Child Safety, Gate Dismissal & Cryptographic PIN Handover
**Primary Routes:** Student Profile Safety Panel, `/api/v1/students/[id]/verify-pickup`

#### Expected Behavior
1. Renders the **Authorized Guardian Pickup Allowlist** with guardian photos, relationship labels, and authorized status.
2. Contacts designated as emergency-only (`authorizedPickup: false`) are visually distinct and cannot be selected for child release.
3. Gate attendant enters the guardian's 4-digit PIN.
4. The server compares the PIN against `guardian.pickupPinHash` using bcrypt.
5. Successful verification displays a green authorization badge and logs an immutable `StudentDismissalLog`.

#### Acceptance Criteria
* [x] **AC-SAFE-01 (Authorized PIN Match):** Given a guardian with hashed PIN for `1234`, submitting `POST /api/v1/students/[id]/verify-pickup` with `{ code: '1234' }` must return HTTP 200 with `{ valid: true, status: 'AUTHORIZED' }`.
* [x] **AC-SAFE-02 (Failed PIN Block):** Submitting an invalid PIN (`9999`) must return HTTP 200 with `{ valid: false, status: 'INVALID_PIN' }` and increment the failed verification counter.
* [x] **AC-SAFE-03 (Bcrypt Hash Storage):** Plaintext PINs must never be persisted in the database or serialized in any API response. The database field `pickupPinHash` must start with `$2a$` or `$2b$`.

---

### Module 10: Academics & Preschool Report Card Studio
**Primary Routes:** `/app/academics`, `/api/v1/academics/*`, `/api/v1/templates/*`

#### Expected Behavior
1. Aggregates continuous observations and attendance into term report cards.
2. Supports qualitative rubrics (*Emerging, Developing, Proficient, Mastered*).
3. Teachers enter qualitative remarks; Center Head approves and publishes.
4. Bulk generates vector PDF report cards with school crest, colors, and signature blocks.

#### Acceptance Criteria
* [x] **AC-ACAD-01 (Rubric Mapping):** Observations recorded in the term must pre-populate the corresponding milestone rubrics in the draft report card.
* [x] **AC-ACAD-02 (PDF Rendering):** Clicking "Generate PDF" must return an application/pdf stream with vector styling, school logo, student photo, and developmental evaluation in $\le 3.0\text{s}$.

---

### Module 11: Fee Management, Invoicing & Financial Settlement
**Primary Routes:** `/app/fees`, `/app/finance`, `/api/v1/fees/*`, `/api/v1/payments/*`

#### Expected Behavior
1. Automatically generates term invoices based on student's fee plan.
2. Detects enrolled siblings and applies configured discount percentages.
3. Supports recording payments via Cash, Cheque, Bank Transfer, or Online UPI.
4. Mutates invoice status from `UNPAID` to `PARTIAL` or `PAID`.
5. Issues sequential, non-reusable receipt numbers (`REC-YYYY-XXXXX`).

#### Acceptance Criteria
* [x] **AC-FEE-01 (Sibling Concession Calculation):** Given a family with 2 enrolled children under a 15% sibling discount policy, the second child's invoice must automatically deduct 15% from tuition line items.
* [x] **AC-FEE-02 (Payment Balance Mutation):** Given an invoice for ₹30,000, recording a partial payment of ₹10,000 must update `balanceCents` to ₹20,000 and status to `PARTIAL`. Recording remaining ₹20,000 must set status to `PAID`.
* [x] **AC-FEE-03 (Sequential Receipts):** Every payment must generate a unique sequential receipt number per tenant. Deleting or modifying a committed receipt number is strictly blocked by database constraints.

---

### Module 12: Fleet Transport Management
**Primary Routes:** `/app/transport`, `/api/v1/transport/*`

#### Expected Behavior
1. Defines transport routes, vehicles, drivers, attendants, and ordered stops.
2. Assigns students to specific pickup and drop-off stops.
3. Attendants access a mobile-optimized manifest to mark student boarding and deboarding.
4. Boarding events dispatch real-time alerts to parents.

#### Acceptance Criteria
* [x] **AC-TRANS-01 (Manifest Capacity Guard):** Assigning a student to a route whose vehicle seating capacity is exhausted must fail with an alert: `VEHICLE_CAPACITY_EXCEEDED`.
* [x] **AC-TRANS-02 (Attendant Check-In Dispatch):** Marking a student as `BOARDED` on the attendant manifest must record a trip log and dispatch an alert to the child's guardian in $\le 1.5\text{s}$.

---

### Module 13: Uniforms, Books & Welcome Kit Inventory
**Primary Routes:** `/app/inventory`, `/api/v1/inventory/*`

#### Expected Behavior
1. Bundles individual inventory items (bags, uniforms, books, stationery) into Welcome Kits.
2. Enrollment automatically pre-allocates a Welcome Kit in `PENDING_HANDOVER` status.
3. Staff selects uniform size and confirms handover on Orientation Day.
4. Generates a printable PDF Handover Slip with parent signature acknowledgment and decrements inventory stock.

#### Acceptance Criteria
* [x] **AC-INV-01 (Stock Decrement on Issue):** Confirming a Welcome Kit issue must atomically decrement the quantity of each bundled item in `inventory_items` and create corresponding `stock_movements` records.
* [x] **AC-INV-02 (Low Stock Threshold):** When an item's quantity falls below `reorderLevel`, emit domain event `StockBelowReorderLevel` and alert Center Operations.

---

### Module 14: Staff HR, Floating Multi-Branch RBAC & Users
**Primary Routes:** `/app/hr`, `/app/users`, `/api/v1/users/*`, `/api/v1/roles/*`

#### Expected Behavior
1. Staff directory displays active employees, designations, and branch assignments.
2. Supports floating multi-branch assignment for specialized teachers (e.g. Music, Dance).
3. Enforces strict hierarchical RBAC: users cannot assign roles equal to or higher than their own rank.
4. Updating staff roles or branches immediately evicts session permission caches.

#### Acceptance Criteria
* [x] **AC-HR-01 (Privilege Escalation Prevention):** A user with role `PRINCIPAL` attempting to assign role `OWNER` or `PLATFORM_ADMIN` to any user must be rejected with HTTP 403 Forbidden.
* [x] **AC-HR-02 (Primary Branch Integrity):** Attempting to execute `REMOVE_BRANCH` on a staff member's primary branch without designating a new primary branch must fail closed with HTTP 400.
* [x] **AC-HR-03 (Immediate Cache Eviction):** Upon updating a user's roles or branches via `/api/v1/roles/branch-assignments`, subsequent API calls by that user must evaluate the new permissions immediately without stale cache delays.

---

### Module 15: Settings, Audit Logs & System Notifications
**Primary Routes:** `/app/settings`, `/app/audit`, `/app/communication`, `/api/v1/settings/*`

#### Expected Behavior
1. **Audit Log:** Captures all sensitive mutations (role changes, fee waivers, student dismissals, deletions) with user ID, IP address, timestamp, and diff payload.
2. **Gateway Tester:** Tests WhatsApp/SMS gateways. When unconfigured, returns `CONFIGURATION_ONLY` (`delivered: false`) without faking transmission.
3. **Delivery Logs:** Paginated audit log of all in-app, email, and webhook dispatches, clamped to a maximum limit of 100 per page.

#### Acceptance Criteria
* [x] **AC-SET-01 (Immutable Audit Logging):** Every call to `/api/v1/users/[id]/roles` must create an unmodifiable row in `audit_logs` capturing the actor, target user, old roles, and new roles.
* [x] **AC-SET-02 (Zero Fake Success):** Invoking `/api/v1/setup/notifications/test` with unconfigured credentials must return HTTP 200 with `testStatus: "CONFIGURATION_ONLY"` and `delivered: false`.
* [x] **AC-SET-03 (Bounded Query Limits):** Requesting `/api/v1/notifications?limit=500000` must be clamped safely to `limit=100` and `offset >= 0` without memory spikes or database crashes.

---
*End of Technical Acceptance Criteria & Expected Behavior Specification — PreOne Engineering Team*

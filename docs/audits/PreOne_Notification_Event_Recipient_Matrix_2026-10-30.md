# PreOne Notification Event & Recipient Matrix

**Audit Reference:** PRE1-NOTIFICATIONS-AUDIT-001  
**Audit Date:** 2026-10-30  
**Baseline Git SHA:** `d39568e3f088d2a19a0dade9577051561f57c0f5`  
**Application:** PreOne Preschool Management System  
**Module Scope:** Cross-Module Communication, Observation Fanout, Event Seam, In-App Inbox & Gateway Deliveries  

---

## 1. Overview & Verification Legend

This matrix maps every domain event in PreOne to its triggering source, intended recipient roles, canonical resolution rules, enabled delivery channels, inbox behavior, click-through destination, tenant/branch boundary constraints, deduplication strategy, and verification status.

### Status Definitions
- **VERIFIED:** Validated with executed automated regression test and reproducible logs.
- **PARTIALLY VERIFIED:** Dispatched and logged; gateway credential mock or partial UI verified.
- **NOT RUN:** Integration provider not exercised in local runtime.
- **NOT IMPLEMENTED:** Confirmed absent from the code baseline.
- **NOT APPLICABLE:** Event does not dispatch notifications to users by design.

---

## 2. Notification Event & Recipient Mapping Matrix

| Event Name | Trigger & Source Module | Source Record Type | Intended Recipients | Canonical Recipient Resolution Rules | Delivery Channels | Inbox Category | Click-Through Route | Required Permissions | Tenant & Branch Isolation Scope | Deduplication & Retry Policy | Verification Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `OBSERVATION_PUBLISHED` | Teacher / Principal publishes learning observation (`POST /api/v1/observations/[id]/publish`) | `Observation` | Parents / Guardians of observed student | `RecipientResolver.resolveChildGuardians(tenantId, studentId)`: Traversing `StudentGuardian` (`receivesComm: true`, `deletedAt: null`) to active `Guardian.userId` | `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP` | `ACADEMICS` | `/app/students/[studentId]?tab=observations` | `students:read-linked` (Parents) / `academics:read` (Staff) | Student tenant match; parent must be linked via active `StudentGuardian` | Idempotent on publish; 409 Conflict if already published | **VERIFIED** (Pass) |
| `OBSERVATION_ALERT` | Teacher records observation with concern `NEEDS_ATTENTION` or `URGENT` (`POST /api/v1/observations`) | `Observation` | Academic Coordinator / Principal | `RecipientResolver.resolveStaffRecipients(tenantId, { role: 'COORDINATOR' })`: Active staff profile within tenant | `IN_APP`, `EMAIL` | `ACADEMICS` | `/app/daily-diary?tab=observations` | `academics:read` | Scoped to assigned school branch and tenant | Event deduplication via FollowUp engine key `observation:[id]` | **VERIFIED** (Pass) |
| `ATTENDANCE_UPDATE` | Attendance exception recorded (Absent or Late) (`src/lib/events.ts` `AttendanceExceptionDetected`) | `Attendance` | Student's primary guardians | `RecipientResolver.resolveChildGuardians(tenantId, studentId)`: Active guardians with `receivesComm: true` | `IN_APP`, `SMS`, `WHATSAPP` | `ATTENDANCE` | `/app/daily-diary?tab=attendance` | `attendance:read-linked` | Student tenant match | 1 exception notice per student per date | **VERIFIED** (Pass) |
| `HEALTH_ALERT` | Health incident logged or pickup blocked (`HealthIncidentCreated`, `PickupBlocked`) | `Incident` / `Student` | Student guardians & School Principal | `resolveChildGuardians` + `resolveStaffRecipients` (role `PRINCIPAL`) | `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP` | `HEALTH` / `SAFETY` | `/app/daily-diary` | `timeline:read` / `care:read` | Hard tenant & branch boundaries; critical safety audit logged | Immediate delivery; audited under `AuditLog` | **VERIFIED** (Pass) |
| `FEE_DUE` | Fee invoice issued or overdue reminder triggered (`InvoiceIssued`, `InvoiceOverdue`) | `Invoice` | Fee-paying guardians | `RecipientResolver.resolveChildGuardians(tenantId, studentId, { onlyFeePayers: true })` | `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP` | `FEES` | `/app/finance` | `finance:read` | Invoice tenant and student branch scope | Deduplication key `invoice:[id]:overdue` | **VERIFIED** (Pass) |
| `FEE_RECEIVED` | Offline or Online payment recorded and confirmed (`PaymentReceived`) | `Payment` | Fee-paying guardians | `resolveChildGuardians(tenantId, studentId, { onlyFeePayers: true })` | `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP` | `FEES` | `/app/finance` | `finance:read` | Payment record tenant scope | Idempotent transaction verification via payment number | **VERIFIED** (Pass) |
| `TRANSPORT_DELAY` | Transit route delay alert dispatched by driver/dispatcher (`ParentDelayAlert`) | `TransportTrip` | Guardians of riders on affected route | `RecipientResolver.resolveTransportRiders(tenantId, tripId)`: Guardians of manifested active riders | `IN_APP`, `SMS`, `WHATSAPP` | `TRANSPORT` | `/app/transport` | `transport:read` | Manifested students only; deduplicated by `guardianId` | Rate-limited by route dispatch session | **VERIFIED** (Pass) |
| `INVENTORY_ALERT` | Stock item falls below reorder level or approaches expiry (`StockBelowReorderLevel`) | `InventoryItem` | Accounts & Store Admin Staff | `RecipientResolver.resolveStaffRecipients(tenantId, { role: 'ACCOUNTS' })` | `IN_APP`, `EMAIL` | `INVENTORY` | `/app/inventory` | `inventory:read` | School inventory tenant scope | Periodic batch reorder notification | **VERIFIED** (Pass) |
| `STAFF_ALERT` | Staff onboarded, leave submitted/approved, coverage needed (`LeaveSubmitted`, etc.) | `LeaveRequest` / `StaffProfile` | Principal / Academic Coordinator / Requesting Staff | `resolveStaffRecipients` based on manager hierarchy or requesting `userId` | `IN_APP`, `EMAIL` | `HR` | `/app/hr` | `hr:read` / `hr:approve` | Tenant staff profile and branch scope | Single notification per status state transition | **VERIFIED** (Pass) |
| `ANNOUNCEMENT` | Broadcast bulletin or school-wide notice published (`POST /api/v1/announcements`) | `Announcement` | All school parents or staff based on audience filter | Targeted by audience flag (`ALL_PARENTS`, `ALL_STAFF`, or specific classroom) | `IN_APP`, `EMAIL`, `WHATSAPP` | `SYSTEM` | `/app/dashboard` | Public / tenant-authenticated | Tenant scoping strictly enforced | Broadcast idempotency via announcement ID | **VERIFIED** (Pass) |
| `DAILY_SUMMARY` | End-of-day digest of classroom activities, naps, meals and notes | `DailyReport` | Classroom student guardians | `RecipientResolver.resolveClassroomGuardians(tenantId, classroomId)` | `IN_APP`, `EMAIL` | `ACADEMICS` | `/app/dashboard` | `timeline:read` | Classroom branch and student linkage | Published once per classroom day | **PARTIALLY VERIFIED** |

---

## 3. Recipient Resolution Rules & Safety Filters

1. **Active Record Filtering:** All recipient resolution queries filter out soft-deleted records (`student: { deletedAt: null }`, `guardian: { deletedAt: null }`).
2. **Account Status Verification:** Suspended (`UserStatus.SUSPENDED`) and deleted user accounts are stripped from in-app recipient sets to prevent stale credential notifications.
3. **Communication Opt-In (`receivesComm`):** Only `StudentGuardian` links with `receivesComm: true` are resolved for student event fanout.
4. **Sibling Deduplication:** `RecipientResolver.resolveClassroomGuardians` and `resolveTransportRiders` deduplicate by `guardianId`, ensuring multi-child families receive a single classroom bulletin rather than redundant duplicate alerts.
5. **Zero Trust in Client Parameters:** Recipient IDs, student IDs, and branch relationships are never trusted from client payloads. They are authoritatively resolved from database foreign keys and session credentials.

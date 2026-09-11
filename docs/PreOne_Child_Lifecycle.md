# PreOne — Child Lifecycle (M01)

**References:** Master PRD (child journey) · DDD (Student aggregate, AdmissionApplication, Guardian) · BRC (admission/attendance/finance rules) · ERD/Prisma Schema · M01 Impact Map I-8
**Verified by:** `scripts/m01-e2e.sh` (49 checks) — every arrow below is executable in the application with zero manual DB intervention.

## The complete journey

```
ENQUIRY (Lead, CRM)
  ↓  POST /api/v1/leads  ·  leadNumber LEAD-{FY}-####  ·  status NEW→…
APPLICATION (AdmissionApplication)
  ↓  POST /api/v1/leads/{id}/convert  ·  mandatory doc checklist created (BRC)
ELIGIBILITY / DOCUMENTS
  ↓  POST /api/v1/applications/{id}/verify  ·  docs verified:true (gate)
  ↓  SUBMITTED → DOCUMENT_PENDING → VERIFIED → UNDER_REVIEW
APPROVAL  ── or ──→ WAITLISTED (section full; FU ADMISSION keeps it visible)
  ↓  POST /api/v1/applications/{id}/approve   (ONE transaction)
  │     · Student created (admissionNo STU-{FY}-####)
  │     · Guardian created + StudentGuardian (isPrimary, canPickup, isFeePayer)
  │     · StudentAllocation row (ACTIVE, admission enrolment)
  │     · First invoice from FeePlan (ADMISSION head first; due = FINANCE.dueDayOffset)
  │     · Welcome timeline entry (parent-visible)
STUDENT CREATED  → events: StudentCreated, StudentAllocated, InvoiceIssued
  ↓
ACADEMIC ALLOCATION (per academic year — history never overwritten)
  ↓  POST /api/v1/students/{id}/allocate  ·  capacity-guarded  ·  closes previous ACTIVE row
SECTION + TEACHER
  ↓  Student.currentClassroom → Classroom.primaryTeacher → /api/v1/teacher/today
FIRST DAY
  ↓  Attendance sheet (class register)  ·  arrival health check (care HEALTH_CHECK)
DAILY CARE
  ↓  care events: ARRIVAL/MEALS/NAP/BATHROOM/MOOD/ACTIVITIES  (minimal-tap teacher flow)
LEARNING
  ↓  Curriculum learning areas (CURRICULUM config) → observations
OBSERVATION
  ↓  POST /api/v1/observations  ·  category + concern triage (NORMAL/PROGRESS/NEEDS_ATTENTION/URGENT)
  ↓  NEEDS_ATTENTION/URGENT → FollowUp(LEARNING) → teacher action → follow-up observation → OUTCOME
PARENT UPDATE
  ↓  PUBLISHED observations + care timeline → /api/v1/parent/today ("How is my child doing today?")
HEALTH / SAFETY EVENTS
  ↓  abnormal checks & incidents → FollowUp(HEALTH) + parent alert; unauthorised pickup → BLOCK + EMERGENCY FU
FEE CYCLE
  ↓  Invoice → overdue sync → reminder (FU FINANCE) → payment → receipt (RCT-{FY}-####) → FU auto-resolved
PROGRESS / REPORTS
  ↓  /operations/today (school) · /teacher/today (class) · /parent/today (child) · attendance % · observations
YEAR-END
  ↓  POST /api/v1/academic-years/{id}/close (report: outstanding invoices, unresolved FUs)
  ↓  POST /api/v1/academic-years/{id}/promote (mappings; capacity-guarded; idempotent)
NEXT ACADEMIC YEAR
  ↓  new ACTIVE allocation in new year's classroom; old year PROMOTED (history intact)
CONTINUOUS OPERATION
```

## Invariants (Spec §53 data-consistency — all verified in E2E)

1. One admission → exactly one Student (status ENROLLED blocks re-approval).
2. One Student → correct Guardian links (isPrimary/canPickup/isFeePayer flags).
3. One Student → allocation history per AY; `currentClassroomId` is only a live pointer; history rows are immutable facts (ACTIVE/COMPLETED/TRANSFERRED/PROMOTED).
4. One Section → correct primary teacher; substitution = audited PATCH.
5. One Invoice → correct student + academic year; issued invoices are never mutated (payments only); paid+balance=total.
6. One attendance row → correct section/date/year (`academicSessionId` stamped from classroom).
7. One observation → correct student/year/curriculum category.
8. One parent → only linked children visible (parent/today, timeline, finance).
9. No cross-branch or cross-AY leakage in any default view.
10. Every state change → AuditLog (existing architecture, single audit mechanism).

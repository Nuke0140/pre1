# PreOne — Daily Operating Loop (M01)

**References:** PRD (daily operations) · BRC (attendance/pickup/health rules) · M00 OPERATING + DAILY_OPERATIONS + HEALTH_SAFETY configs (single source of truth) · M01 Impact Map I-3/I-4/I-5/I-6/I-12
**Principle:** the school day is ONE loop, not a collection of modules. Every event answers: WHAT HAPPENED → WHO IS AFFECTED → DOES IT NEED ATTENTION → WHO ACTS → WHO IS INFORMED → WAS IT RESOLVED (Spec §3).

## Morning

| Step | What happens | Consumed config | Where |
|---|---|---|---|
| 1. School opens | `operations/today` derives day status: WORKING_DAY / NON_WORKING_DAY / HOLIDAY / VACATION / EVENT_DAY | CalendarEvent + OPERATING.workingDays | Command centre header |
| 2. Teachers sign in | Teacher sees ASSIGNED sections + expected children — never manual class lists | Classroom.primaryTeacherId | /api/v1/teacher/today |
| 3. Arrival | Quick-tap ARRIVAL events on the child timeline | DAILY_OPERATIONS.recordTypes | Teacher today cards |
| 4. Health check | HEALTH_CHECK outcome NORMAL → continue; ABNORMAL → **URGENT FollowUp(HEALTH)** + parent alert; child isolated | HEALTH_SAFETY.healthCheckRules | Teacher quick action |
| 5. Attendance | Section register marked (bulk). ABSENT → **FollowUp(ATTENDANCE/WARNING)** + parent note. LATE → derived from arrival window. Closed day → blocked (audited `force` override) | OPERATING timings/late/absence rules | POST /api/v1/attendance |

## During the day

- **Care events** — meals, nap, bathroom, mood, activities recorded with minimal taps (single-tap buttons per child, bulk mode supported). Parents see them live on the child timeline. Types come from DAILY_OPERATIONS config — nothing hardcoded (disabled types rejected with `BUSINESS_TYPE_DISABLED`).
- **Learning** — observations captured with learning area + deterministic concern triage. NEEDS_ATTENTION/URGENT opens a **learning follow-up**: action → follow-up observation → outcome (a real improvement loop, never an automated diagnosis).
- **Incidents** — category from HEALTH_SAFETY config; EMERGENCY escalates ownership to PRINCIPAL and alerts parents immediately; every incident stays an open follow-up until resolved.
- **Visitor/pickup control** — release only to authorised guardians (canPickup + optional PIN per STUDENT_PARENT.pickupVerification). Mismatch → **BLOCK + EMERGENCY safety follow-up + audit**.
- **Exceptions surface automatically** — absent children, full sections, staffing gaps, health events — all become FollowUp rows; nothing depends on someone remembering.

## End of day

| Step | What happens | Where |
|---|---|---|
| 1. Sheet review | Teacher day sheet complete; gaps visible (`teacher/today` care count vs roster) | Teacher today |
| 2. Parent summary | Daily summary pushed at DAILY_OPERATIONS.parentSummaryTime (event-gated DAILY_SUMMARY) | notify funnel |
| 3. Pickup | Authorised release audited to the child timeline (PICKUP) | /operations/pickup |
| 4. Principal review | Command centre: CRITICAL → ATTENTION → NORMAL bands; unresolved follow-ups acted on; "Is my preschool running correctly today?" answered with exceptions, not raw records | /app/operations |
| 5. Fee loop | Overdue invoices synced on read; reminders sent (FU stays OPEN); payments → receipts → FU auto-resolves | Finance |

## Why nothing disappears

- **Notification ≠ resolution.** Every raised follow-up stays OPEN/ACKNOWLEDGED/IN_PROGRESS/WAITING until a human resolves it with an outcome; resolution and closure are separately audited; reopen is allowed.
- **Exception-driven presentation.** The command centre shows the CRITICAL/ATTENTION/NORMAL bands plus pending work — owners are never buried in raw records.
- **Default scope = current branch + current academic year + today** (Spec §55) — the loop never loads history unless explicitly asked.

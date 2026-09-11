# PreOne — End-to-End Test Matrix (M01)

**References:** M01 Spec §51-§54 · API Contract Catalog (envelope/RBAC) · ERD conventions · BRC rules
**Executed by:** `scripts/m01-e2e.sh` (49 checks, RESULT: 49 passed, 0 failed) · regression: `scripts/smoke.sh` 31/31 · `scripts/m00-e2e.sh` 41/41

## Level 1 — Journey test (Spec §51 mandatory E2E)

NEW SCHOOL → M00 SETUP → GO LIVE → CREATE ACADEMIC YEAR → PROGRAM/CLASS/SECTION → ASSIGN TEACHER →
CREATE ADMISSION → APPROVE → CREATE STUDENT → LINK PARENT → ALLOCATE → TEACHER LOGIN → ATTENDANCE →
DAILY CARE → OBSERVATION → PARENT UPDATE → FEE → REPORT → YEAR-END → NEXT YEAR — **all executable, verified 2026-09-11 on tenant M01\* fresh each run.**

| # | Check (E2E step) | Asserts | BRC/ADR |
|---|---|---|---|
| 0 | platform login + tenant wizard | tenant+branch+AY+classrooms+programs+fee plans+owner in ONE call | Wizard tx |
| 1 | setup → validate → go-live | status LIVE with zero manual DB config | M00 state machine |
| 2 | lead → convert → verify → approve | ONE tx: Student + Guardian + Allocation + Invoice | Admission BRC |
| 3 | consistency | guardian link; allocation history = 1 ACTIVE | §53 |
| 3b | second admission | multi-child scenarios | — |
| 4 | attendance | Sunday blocked (BUSINESS_SCHOOL_CLOSED); force audited; absent → exceptionsRaised | OPERATING config |
| 4b | absence follow-up | exactly 1 OPEN FU ATTENDANCE (deduped) | §42/§43 |
| 5 | care | bulk events; disabled type rejected; day sheet count | DAILY_OPERATIONS config |
| 6 | health | ABNORMAL → URGENT FU; incident → FU; critical band = 2 | HEALTH_SAFETY config |
| 7 | learning loop | NEEDS_ATTENTION → FU LEARNING → teacher resolve with outcome | Observation BRC |
| 8 | RBAC | teacher 403 on approve; unlinked parent 403 on student | Spec §45 |
| 8b | parent portal | exactly 1 linked child; sees 3+ care events | Guardian scoping |
| 9 | pickup | authorised release audited; unauthorised → 403 BUSINESS_PICKUP_BLOCKED + EMERGENCY FU | Pickup BRC |
| 10 | finance | overdue auto-flip; FU OPEN after reminder; payment → receipt → PAID → FU auto-RESOLVED | Finance BRC |
| 11 | capacity | fill 1/1 → next allocate blocked → re-allocate trail | No silent overbooking |
| 12 | teacher portal | sections from real assignments; open follow-ups count | Spec §11 |
| 13 | year-end | close report; new AY current; promote 2 students; history PROMOTED+ACTIVE | §6/§10 |
| 14 | read models + audit | operations/today; exception bands CRITICAL/ATTENTION/NORMAL; audit captures transitions | §33/§44 |

## Level 2 — Problem-scenario coverage (Spec §36; detail in Problem-Solving Matrix)

| Scenario | Where tested | Status |
|---|---|---|
| 1 Child absent | E2E step 4 | PASS |
| 2 Child arrives unwell | E2E step 6 (health check ABNORMAL) | PASS |
| 3 Unauthorized pickup | E2E step 9 | PASS |
| 4 Child needs learning attention | E2E step 7 | PASS |
| 5 Section full | E2E step 11 | PASS |
| 6 Teacher absent (substitution) | E2E step 12 + classrooms PATCH audited | PASS |
| 7 Parent misses payment | E2E step 10 | PASS |
| 8 Parent needs daily visibility | E2E steps 5+8b (parent/today) | PASS |
| 9 Incident follow-up | E2E step 6 (incident → FU) | PASS |
| 10 Academic year change | E2E step 13 | PASS |
| Emergency escalation | E2E step 6 (EMERGENCY band) | PASS |
| Missing parent document | approve gate BUSINESS_DOCS_PENDING (verified in dev runs) | PASS |
| Fee overdue → reminder ≠ resolution | E2E step 10 | PASS |
| Activity missed / disabled type | E2E step 5 (BATHROOM rejected) | PASS |

## Level 3 — Regression (Spec §54)

| Suite | Checks | Result | Scope |
|---|---|---|---|
| scripts/smoke.sh | 31 | 31/31 PASS | login, RBAC redirects, all modules, setup redirect |
| scripts/m00-e2e.sh | 41 | 41/41 PASS | M00 setup engine, dependency graph, go-live, guards |

## Level 4 — Security & data consistency (Spec §45/§53, inside E2E)

- Teacher cannot approve admissions (403 PERMISSION_001).
- Parent without guardian link cannot read any student (403).
- Parent with link sees exactly N linked children — no cross-child leak.
- Tenant-scoped numbering: application/receipt numbers unique per tenant (fixed global-unique defect found during M01).
- Allocation history immutable: PROMOTED/TRANSFERRED rows never overwritten.
- Every transition (FU lifecycle, allocation, close/promote) lands in AuditLog.

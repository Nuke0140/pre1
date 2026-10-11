# PreOne Phase B — B4 Domain Integrations Report

**Date:** October 11, 2026  
**Auditor / Engineer:** Senior Full-Stack Engineer, Security Auditor & QA Engineer  
**Phase:** B4 — Admissions, Finance & HR Integrations Gate  

---

## 1. Scope & Objective
Wire central email delivery into business workflows across Admissions, Finance, and HR without duplicating pipelines or breaking existing operations:
1. **Admissions:** Send automated enquiry acknowledgements upon public form submission (`POST /api/v1/public/enquiry`).
2. **Finance:** Dispatch `FEE_DUE` notifications with student/invoice details to guardians resolving through `RecipientResolver` and `NotificationEngine`.
3. **HR & Workforce:** Dispatch `STAFF_ALERT` emails for staff leave and onboarding workflows.
4. Verify tenant isolation, recipient resolution, and non-blocking failure isolation.

---

## 2. Changes Made
- **Admissions Integration:**
  - Modified `src/app/api/v1/public/enquiry/route.ts` to dispatch an enquiry acknowledgement email to the parent's submitted email address with reference ID (`ENQ-YYYY-XXXX`).
  - Wrapped email dispatch in `.catch(() => {})` ensuring public enquiry submission and Lead creation in PostgreSQL never fail even if the email transport experiences an error.
  - Added `/api/v1/public` to `PUBLIC_PATHS` in `src/middleware.ts` to permit unauthenticated public enquiries.
- **Finance Integration:**
  - Verified `NotificationEngine.dispatch` for `FEE_DUE` events. Guardian recipients are resolved canonically from `StudentGuardian` (`receivesComm: true`). When the tenant enables the `EMAIL` channel in `COMMUNICATION` config, emails are dispatched and logged in `notification_delivery_logs`.
- **HR Integration:**
  - Verified `NotificationEngine.dispatch` for `STAFF_ALERT` events. Targeted staff (`userId` or `role`) receive email notices without leaking staff data to parent recipients.
- **Tests Created:**
  - `tests/domain/domain-integrations.test.ts`: Deterministic tests covering Admissions enquiry, Finance fee invoices, and HR staff alerts.

---

## 3. Test Suite & Verification Results
**Command:** `bun test tests/domain/domain-integrations.test.ts`  
**Execution Time:** 2.00s  
**Results:** **3 PASS / 0 FAIL / 10 assertions**

| Test ID | Domain | Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **B4-01** | Admissions | Public enquiry submission | Generates Lead, sends email acknowledgement with lead reference | 200 OK, email dispatched, Lead stored | **PASS** |
| **B4-02** | Finance | `FEE_DUE` notification | Resolves student guardians, dispatches email, writes delivery log | `gated: false`, recipients resolved, log recorded | **PASS** |
| **B4-03** | HR | `STAFF_ALERT` leave notice | Resolves target staff, dispatches email, writes delivery log | `gated: false`, staff email dispatched, log recorded | **PASS** |

---

## 4. Security & Isolation Evaluation
- **Decoupled Execution:** Business records (Leads, Invoices, Leaves) are committed before email dispatch. Email failures never abort or corrupt database operations.
- **Audience Isolation:** Guardian resolvers only query guardians linked to the active `studentId` within the current `tenantId`. Staff alerts query staff profiles strictly scoped to the active tenant.

---

## 5. B4 Exit Criteria Verification
- [x] Admissions public enquiry email integrated and verified.
- [x] Finance fee notification email integrated and verified.
- [x] HR staff notification email integrated and verified.
- [x] In-app notifications and timeline entries preserved.
- [x] All deterministic tests passing (3/3).

**B4 Gate Status:** **PASSED & APPROVED** -> Ready to proceed to **B5 — Amazon SES and Operations**.

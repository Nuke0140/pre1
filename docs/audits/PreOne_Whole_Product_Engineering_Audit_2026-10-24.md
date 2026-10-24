# PreOne — Whole-Product Engineering Audit (Evidence-Based)

**Audit date:** 2026-10-24  
**Repository:** https://github.com/Nuke0140/pre1  
**Reviewed branch / baseline:** `main` at `3792b8fe92a8813dc65b36194bf2ffe518263d60`  
**Audit branch:** `audit/whole-product-2026-10-24`  
**Status:** Phase 1 — repository, prior audit, CI and targeted source review. Not a full runtime penetration test or fresh full-suite execution.  
**Production code changed:** No. This branch contains the audit report only.

## 1. Executive verdict

**Current decision: NOT READY TO CERTIFY AS PRODUCTION-READY.** This is a gate decision based on evidence gaps and observed CI failures, not a claim that every module is broken.

The repository has meaningful product depth and prior analysis documents, including a whole-product gap analysis, UI/UX audit, domain integration matrix, M00 implementation impact map and M01 end-to-end impact map. The immediate problem is that the quality gates do not currently provide a green, trustworthy signal: the latest main-branch CI run failed before build and browser-level responsive tests could run.

### Current evidence snapshot

| Signal | Evidence | Audit interpretation |
|---|---|---|
| Repository baseline | Main SHA `3792b8fe92a8813dc65b36194bf2ffe518263d60`; 4,921 tracked tree entries | Audit findings must be tied to this baseline; re-check after each merge |
| Latest CI | [Responsive Matrix CI run 40087831505](https://github.com/Nuke0140/pre1/actions/runs/40087831505), 2026-10-24 | **FAIL** |
| CI test result | `tests/design-system/responsive-transformation.test.ts`: 31 pass, 1 fail, 405 assertions | The failure blocks subsequent lint, build and Playwright steps |
| Skipped checks in failed CI | ESLint, Next.js production build, Playwright 7 pages × 9 viewports | No passing evidence for these checks from this run |
| TypeScript build policy | `next.config.ts`: `typescript.ignoreBuildErrors: true` | A successful Next build can mask type errors; enforce typecheck independently |
| Existing audit baseline | `docs/Whole_Product_Gap_Analysis.md` dated 2026-10-17 | Valuable baseline, but findings must be re-verified against current SHA |
| Existing UI audit | `docs/Global_CSS_UI_UX_Audit_2026-10-10.md` | Prior UI review exists; latest responsive CI is still failing |
| Workflow coverage | Only `.github/workflows/responsive-matrix.yml` appeared in the current tree scan | CI gate breadth appears too narrow for whole-product production assurance |

## 2. Verified current findings

### F-001 — CI is red on main (P1, release blocker)

**Evidence:** Run [40087831505](https://github.com/Nuke0140/pre1/actions/runs/40087831505), commit `3792b8fe92a8813dc65b36194bf2ffe518263d60`. The job reports 31 tests passed and 1 failed. The failed assertion is in `tests/design-system/responsive-transformation.test.ts`, test `keeps Inventory hook imports and lint guards in CI`.

**Impact:** The workflow stops after this unit/contract test. Its lint guard, production build, Playwright viewport matrix and screenshot validation do not run. A green snapshot artifact upload does not mean the workflow passed.

**Required action:** Reproduce locally with `bun test tests/design-system/responsive-transformation.test.ts`; inspect the exact assertion diff; determine whether code, ESLint configuration, or workflow contract is stale; fix the source of truth rather than weakening the assertion without justification.

**Acceptance:** This test passes; then all later workflow steps execute; run is green on the remediation commit.

### F-002 — TypeScript errors are not a build gate (P1)

**Evidence:** `next.config.ts` sets `typescript.ignoreBuildErrors: true`.

**Impact:** Production build success does not prove the application type-checks. This can conceal invalid Prisma fields, missing imports and mismatched API contracts until runtime. The prior whole-product audit reported 737 TypeScript errors across 105 files on 2026-10-17; that count is historical and must be remeasured on this baseline, not assumed current.

**Required action:** Add a separate mandatory CI step for `npx tsc --noEmit`; inventory current errors; fix in risk-ranked batches; remove `ignoreBuildErrors` only after the tree is clean or replace it with an explicit, time-bounded and tracked exception process.

**Acceptance:** CI fails on new TypeScript errors; baseline is zero or every remaining exception is explicit, scoped and approved. Build is not the type-check substitute.

### F-003 — Responsive/UI regression gate currently prevents visual verification (P1)

**Evidence:** Current responsive workflow fails at the unit/contract step; the Playwright step for 7 pages × 9 viewports is skipped.

**Impact:** Latest changes to viewport behavior cannot be certified through the intended end-to-end visual matrix. The failure is a test-contract assertion, not direct proof of a user-facing visual defect.

**Required action:** Fix F-001, run Playwright across the defined viewports, inspect screenshots/artifacts, and verify at minimum 320px width, tablet, desktop, short landscape, keyboard focus, scroll containment and touch target reachability.

**Acceptance:** Unit/contract tests, ESLint guard, production build and Playwright all execute and pass. Snapshot updates must include human-reviewed diffs and a reason.

### F-004 — CI gate breadth does not represent the whole product (P1/P2)

**Evidence:** Tree scan shows a single workflow file, `.github/workflows/responsive-matrix.yml`, focused on responsive UI. It does not visibly provide a broad independent gate for typecheck, all unit/integration suites, migration validation, tenant-isolation security tests, dependency/security scanning or API contract checks.

**Impact:** A responsive-focused workflow cannot certify finance, admissions, auth, student lifecycle, multi-tenant isolation or data integrity.

**Required action:** Introduce separate, deterministic CI jobs for typecheck/lint, unit tests, integration tests with isolated PostgreSQL, migration/schema checks, security regressions, API contracts, build, and selected Playwright journeys. Keep slow tests separate but required for release.

**Acceptance:** Branch protection requires all critical jobs; a red critical job blocks merge/release.

### F-005 — Demo OTP policy requires explicit security regression coverage (P1 until proven safe)

**Evidence:** Current `src/lib/auth/otp-service.ts` includes demo codes `0000`, `000000`, `1234`. `isDemoOtpAllowed` has an explicit production branch that returns false for general identifiers, but it also allows identifiers matching patterns such as `.demo`, `sunshine`, `owner`, or `admin` before the production branch. The code comments and actual policy need to be reviewed together.

**Impact:** A demo-code mechanism is an authentication boundary. Identifier substring/prefix matching can be overly broad, and an environment-dependent exception is dangerous if it reaches real accounts. This review has not executed a live OTP login, so exploitability is **not confirmed** by this audit.

**Required action:** Make demo OTP opt-in only, disabled by default in production, restricted to explicit seeded demo accounts in non-production or a tightly controlled allowlist; never permit broad matching against ordinary identifiers. Add tests for production, preview, development, exact demo account, lookalike identifier, rate limit, expiry, replay, brute-force lockout and account enumeration.

**Acceptance:** In production, all demo codes fail for normal and lookalike identifiers; only the documented explicit demo policy can pass; rate limit and audit events are verified.

### F-006 — Security headers exist, but CSP remains permissive (P2)

**Evidence:** `next.config.ts` configures HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy. CSP includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`.

**Impact:** Baseline headers are positive, but the script policy reduces XSS defense-in-depth. Compatibility requirements may explain it; this is not by itself proof of an exploitable XSS.

**Required action:** Inventory inline scripts and eval-dependent libraries; move toward nonce/hash-based script policy; test CSP in report-only mode first; preserve required image/font/connect sources with an allowlist. Validate deployment-specific headers, not just Next config.

**Acceptance:** CSP report-only has no unexplained violations; enforce policy without breaking login, uploads, editor, charts or portals; confirm headers in deployed responses.

### F-007 — Whole-product prior audit contains high-severity historical findings that must be re-verified (P0/P1)

**Evidence:** `docs/Whole_Product_Gap_Analysis.md` (2026-10-17) documented, among other items, an OTP bypass, payment webhook concerns, hardcoded transport pickup PIN/forgeable QR token, parent report-card runtime crash, missing parent two-way chat/event RSVP, missing subscription/billing and a large TypeScript backlog.

**Impact:** These are important prior findings, but the current audit has not independently reproduced every one at HEAD `3792b8f`. Some may have been fixed since the document was written; do not blindly carry historical statuses forward.

**Required action:** Create a finding-by-finding verification ledger: finding ID, old status, current code location, repro/test, current status (OPEN / FIXED / REGRESSED / NOT VERIFIED), commit evidence and retest. Prioritize authentication, payment/webhook, tenant isolation, student/guardian privacy and transport pickup safety first.

**Acceptance:** Every historical P0/P1 has a current evidence-backed status; no item is marked fixed from comments or a commit message alone.

## 3. Whole-product audit workstreams

This audit must proceed across all layers. Each workstream should produce concrete evidence and a pass/fail result.

### A. Product and requirements conformance
- Compare current routes, screens, Prisma models and services against Master PRD, DDD, BRC, ERD v3.0, API Contract Catalog and ADRs.
- Identify shipped-but-not-specified features, specified-but-missing features, duplicated business rules and inconsistent terminology.
- For each requirement, record: requirement ID, implementation path, test path, status and gap.
- Do not silently redefine canonical requirements to match existing code.

### B. Architecture and domain boundaries
- Map Next.js pages → API routes → service/domain functions → Prisma entities → external adapters.
- Check domain ownership, circular imports, duplicated validation, business logic inside UI/routes, shadow tables and cross-module side effects.
- Confirm that setup/configuration is consumed by operational workflows rather than stored as dead intent.
- Review server/client boundaries, Edge-vs-Node compatibility and dependency health.

### C. Authentication, authorization and tenant isolation
- Verify session creation/expiry/revocation, OTP generation/verification, brute-force controls, password reset, role normalization and account lifecycle.
- Check every ID-addressed API route for tenant-scoped lookup and branch/assignment scope.
- Test cross-tenant A/B pairs for read, update, delete, export, upload and background jobs.
- Verify authorization on both API and server-rendered pages; hiding a UI button is not authorization.
- Test webhook signature, replay/idempotency, rate limiting, CSRF/origin assumptions and sensitive log redaction.
- Run security checks in isolated test data; do not probe or mutate production data.

### D. API contracts and error handling
- Compare each endpoint's method, permission, request schema, response envelope, status code, pagination, filtering and error codes with the API Contract Catalog.
- Check validation of malformed JSON, missing fields, enum drift, oversized payloads, duplicate submissions and concurrency.
- Verify GET/HEAD have no persistent side effects. Identify endpoints that sync or mutate on read.
- Ensure errors are stable, traceable and do not expose secrets, stack traces or cross-tenant information.

### E. Data model, migrations and integrity
- Compare Prisma schema, ERD, migrations and real query patterns.
- Check foreign keys, unique constraints, nullable semantics, soft-delete filters, tenantId consistency and indexes for common queries.
- Test transaction boundaries for enrollment, fees, payment, promotion, branch copy and audit writes.
- Check idempotency, race conditions, rollback, partial failure, orphaned rows and historical data immutability.
- Validate migration from a clean database and upgrade from a prior schema using disposable databases.

### F. Module integration and end-to-end journeys
- Trace the critical journey from school onboarding/setup → branch/program/classroom → staff/roles → admission → student allocation → attendance/care/daily diary → parent portal/communication → fees/payments → reports/export.
- Verify every handoff uses the same canonical entity IDs and status semantics.
- Test failure paths: missing prerequisites, inactive branch, duplicate request, timeout, external provider outage, permission denial and concurrent changes.
- Maintain a domain integration matrix with source, consumer, contract, failure behavior and test.

### G. UI, UX and accessibility
- Test every role-specific screen at mobile (320px), common phone, tablet, desktop and short landscape.
- Check overflow, nested scroll, sticky headers, dialogs/drawers, focus trap, keyboard navigation, visible focus, labels, validation messages, contrast, touch target size and reduced motion.
- Verify loading, empty, error, success, offline and permission-denied states.
- Test tables/filters/forms with long names, large datasets and localization/Indian currency/date formats.
- Treat screenshots as evidence only when paired with functional interaction checks.

### H. Performance and reliability
- Profile slow pages and API queries; inspect N+1 queries, unbounded reads, oversized client bundles and repeated context loading.
- Check pagination, caching, invalidation, timeouts, retry/backoff, connection pool settings and background-job recovery.
- Test realistic tenant/branch/student volumes and concurrent writes in a non-production environment.
- Define SLOs for critical journeys and collect traces, latency/error metrics and actionable logs.

### I. Production operations
- Verify environment variable validation, secret handling, storage/email/SMS/WhatsApp provider behavior, database backups and restore drills.
- Confirm health/readiness endpoints, structured logs, alerting, audit retention, incident runbooks and deployment rollback.
- Ensure adapters never report delivery success without provider confirmation.
- Test deployment with clean build, migrations, seed/bootstrap, graceful restart and rollback.
- Verify production CSP and other headers from the actual deployment.

### J. Test quality and release governance
- Inventory all tests and classify unit, integration, API, E2E, visual, security and migration coverage.
- Remove test collection ambiguity (e.g. Playwright specs accidentally picked up by a unit runner).
- Ensure deterministic fixtures, test cleanup, no shared-state coupling and isolated databases.
- Require critical checks in branch protection and retain artifacts for failed CI runs.
- Add a release checklist and explicit stop-ship criteria for P0/P1.

## 4. Recommended execution order

### Phase 0 — Baseline freeze and evidence
1. Record the exact main SHA.
2. Reproduce the current CI failure.
3. Run `npx tsc --noEmit`, scoped ESLint and build separately so one failure does not mask others.
4. Run tests by suite; capture commands, exit codes and logs.
5. Mark prior audit findings OPEN / FIXED / REGRESSED / NOT VERIFIED with evidence.

### Phase 1 — Stop-ship security and data integrity
1. Authentication/OTP, payment/webhook and transport pickup security.
2. Tenant/branch authorization and IDOR regression pairs.
3. Payment/enrollment transactions, idempotency and audit consistency.
4. Parent/guardian privacy and sensitive exports.
5. Remove false-positive delivery success.

### Phase 2 — Contract and integration correctness
1. TypeScript and Prisma contract errors.
2. API schema/permission/error envelope.
3. Domain integration and end-to-end critical journeys.
4. Migration and concurrency tests.

### Phase 3 — UI and accessibility
1. Fix responsive CI contract failure.
2. Run all viewport tests and review screenshots.
3. Exercise real interactions and all loading/error/empty states.
4. Run accessibility checks and keyboard/manual pass.

### Phase 4 — Production readiness
1. Performance, observability and provider failure behavior.
2. Backup/restore and deployment rollback drill.
3. Security headers/CSP and dependency scanning.
4. Final release gate with all critical CI jobs green.

## 5. Severity and disposition rubric

- **P0 — Critical / stop ship:** account takeover, cross-tenant data disclosure or mutation, payment integrity compromise, child safety risk, destructive data loss.
- **P1 — High / release blocker:** core journey crash, authorization bypass, incorrect billing/enrollment, failed critical integration, no reliable build/test gate.
- **P2 — Medium:** meaningful UX/accessibility issue, operational weakness, recoverable data inconsistency, incomplete non-critical feature.
- **P3 — Low:** polish, maintainability, minor documentation drift.

Each finding must include:
1. ID and severity.
2. Exact file/route/symbol and line range at the audited SHA.
3. Preconditions and reproducible steps.
4. Expected vs actual behavior.
5. User/business/security impact.
6. Root cause and recommended minimal fix.
7. Regression test.
8. Verification evidence and commit SHA.
9. Status and owner.

## 6. Release gate — required before calling PreOne production-ready

- [ ] Main CI is green; no critical step skipped because an earlier job failed.
- [ ] TypeScript check is enforced independently of Next build.
- [ ] Critical unit/integration/API/E2E suites pass on a clean environment.
- [ ] All historical P0/P1 audit findings have current verified disposition.
- [ ] Cross-tenant and branch-scope regression tests pass.
- [ ] Authentication, OTP, payments and webhooks pass negative security tests.
- [ ] Migrations work from clean and prior-schema databases.
- [ ] Setup → admission → student → operations → parent → fees critical journeys pass.
- [ ] Responsive matrix and accessibility review pass on defined viewports.
- [ ] Provider outage, timeout, retry and idempotency behavior are tested.
- [ ] Backup restore and deployment rollback are demonstrated.
- [ ] Logs, metrics, alerts, incident and data-recovery runbooks are available.

## 7. Limitations and honesty statement

This is a repository-level audit phase using source files, existing audit documents and GitHub Actions evidence. It did not run a fresh full application build or test suite in an isolated local checkout, did not connect to a production database, did not perform a live penetration test, and did not inspect a deployed production instance. Findings explicitly labeled historical or not verified must not be presented as reproduced current defects.

The next phase should reproduce CI and run isolated checks, then expand into code-path reviews and test evidence. Do not mark production-ready until the release gate above is met.

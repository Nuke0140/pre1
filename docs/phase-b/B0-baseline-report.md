# PreOne Phase B — B0 Baseline and Safety Report

**Date:** October 11, 2026  
**Auditor / Engineer:** Senior Full-Stack Engineer, Security Auditor & QA Engineer  
**Repository:** https://github.com/Nuke0140/pre1  
**Phase:** B0 — Baseline & Safety Gate  

---

## 1. Scope & Objective
Establish a strict, verifiable technical baseline before beginning any code modifications for Phase B (B1 Login Resilience through B5 SES Operations). Ensure existing test failures, repository state, secrets posture, and service inventories are cataloged and preserved.

---

## 2. Git & Working Tree State
- **Branch:** `main` (synchronized with `origin/main`)
- **HEAD Commit:** `a88c062d5ac54c0af35611449b419e051025c1a7`
- **Latest Commit Date:** `Sat Oct 10 23:17:50 2026 +0530`
- **Commit Message:** `Merge branch 'main' of https://github.com/Nuke0140/pre1`
- **Working Tree Status:** Clean (`nothing to commit, working tree clean` verified via `git status`)

---

## 3. Environment & Runtime Inventory
- **Runtime:** Bun `1.3.14`, Node.js `v24.16.0`
- **Package Manager:** Bun (`bun.lock`, 337,918 bytes) & npm (`package-lock.json`, 413,610 bytes)
- **Primary Framework:** Next.js `16.1.1` (App Router, Webpack engine), React `19.0.0`
- **Database / ORM:** PostgreSQL, Prisma Client `6.11.1` (runtime URL auto-upgraded to pooled connection)
- **Authentication:** Custom JWT via `jose` `6.2.12`, password hashing via `bcryptjs` `3.0.3`
- **Validation:** `zod` `4.0.2`
- **Package Scripts:**
  - `dev`: `next dev --webpack -p 3000`
  - `build`: `next build --webpack`
  - `start`: `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log`
  - `lint`: `eslint .`
  - `db:push`: `prisma db push --accept-data-loss`
  - `db:generate`: `prisma generate`
  - `db:migrate`: `prisma migrate dev`
  - `db:reset`: `prisma migrate reset`

---

## 4. Architecture & Service Inventory

### 4.1 Authentication & Identity Routes
| Route / File | Method | Description | Implementation Status |
|---|---|---|---|
| `src/app/api/v1/auth/login/route.ts` | POST | Primary password login with sliding window failure tracker and multi-role resolution | Implemented |
| `src/app/api/v1/auth/logout/route.ts` | POST | Clears session cookie and invalidates session token | Implemented |
| `src/app/api/v1/auth/password/route.ts` | POST | Authenticated user password update via `SettingsService` | Implemented |
| `src/app/api/v1/auth/switch-role/route.ts` | POST | Switches primary active role for multi-role users | Implemented |
| `src/app/api/v1/auth/branding/route.ts` | GET | Returns school branding config for login screen | Implemented |
| `src/app/api/v1/users/invitations/route.ts` | GET, POST | Lists, resends, activates, or cancels pending staff invitations | Implemented (DB state only, no email) |
| `src/app/api/v1/users/[id]/revoke-sessions/route.ts` | POST | Admin/User session revocation | Implemented |
| *Forgot Password API* | N/A | Missing backend route (UI modal directs user to contact Principal) | **Missing (Gap)** |
| *OTP Issuance/Verification API* | N/A | Missing backend route (UI simulates client-side codes `0000`/`1234`) | **Missing (Mock only)** |
| *Email Verification API* | N/A | Missing backend route | **Missing (Gap)** |

### 4.2 Notification & Email Infrastructure
| Component / File | Purpose | Observed Implementation & Truthfulness |
|---|---|---|
| `src/lib/notify.ts` | M01 child-scoped timeline events & broadcast notices | Records `TimelineEntry` and `Announcement` rows |
| `src/lib/notifications/notification-engine.ts` | Central notification engine | Reads `COMMUNICATION` domain config, resolves recipients via `RecipientResolver`, calls channel adapters |
| `src/lib/notifications/recipient-resolver.ts` | Canonical recipient resolution | Resolves guardian, staff, and classroom recipients from DB |
| `src/lib/notifications/channel-adapters.ts` | Multi-channel delivery (`IN_APP`, `EMAIL`, `SMS`, `WHATSAPP`) | **EMAIL adapter is a stub:** If SMTP/SendGrid env vars are missing, records `CONFIGURATION_ONLY` in `notification_delivery_logs`. If present, creates DB row with `SENT`, but **no physical email transport library (`nodemailer`) is called or installed**. |
| `src/lib/notifications/event-listeners.ts` | Domain event listeners | Listens to domain events (`AttendanceExceptionDetected`, `InvoiceIssued`, `LeaveApproved`, etc.) and calls `NotificationEngine.dispatch` |

---

## 5. Existing Test Baseline & Defect Classification

Running the repository security test suite:
`bun test tests/security/user-security.test.ts`

### 5.1 Test Inventory Table

| Test Suite / Case | Purpose | Command | Result | Classification |
|---|---|---|---|---|
| `Phase 1: Tenant-Scoped User Lifecycle` | Verifies staff suspension in School A leaves parent access in School B intact | `bun test tests/security/user-security.test.ts` | **PASS** (70.58ms) | Existing Passing |
| `Phase 2: Secure Password Reset` | Verifies `mustChangePassword` flag persistence in JWT | `bun test tests/security/user-security.test.ts` | **PASS** (5.68ms) | Existing Passing |
| `Phase 3: Rate Limiting Enforcement` | Verifies sliding window rate limit blocks excessive attempts | `bun test tests/security/user-security.test.ts` | **PASS** (0.69ms) | Existing Passing |
| `Phase 4: CSV Import Atomic Rollback` | Verifies atomic rollback on invalid row in staff import | `bun test tests/security/user-security.test.ts` | **FAIL** (234.13ms) | **Pre-Existing Failure (`TEST-001`)** |
| `scripts/check-login-status.ts` | Verifies owner account existence, hash match, and recent audit logs | `bun run scripts/check-login-status.ts` | **PASS** | Existing Passing |

### 5.2 Pre-Existing Defect Detail (`TEST-001`)
- **Location:** `tests/security/user-security.test.ts:208:35`
- **Failure:**
  ```text
  expect(result.createdCount).toBe(0)
  Expected: 0
  Received: 1
  ```
- **Context:** In `UserCsvEngine.executeStaffImport`, when running in `atomicAllOrNothing: true` mode, the in-memory return object reports `createdCount = 1` for the first valid row processed before the second invalid row triggers rollback. This failure **existed prior to Phase B** and is explicitly preserved as a baseline finding so it is not conflated with Phase B changes.

---

## 6. Secrets & Safety Posture
- `.env` is listed in `.gitignore` and is not tracked in Git.
- No real credentials, API keys, passwords, or tokens are checked into tracked files.
- No real production emails will be sent during testing.
- Non-production tests will use mock providers, dedicated synthetic fixtures, and an in-memory or staging allowlist.

---

## 7. B0 Exit Criteria Verification
- [x] Baseline report completed and saved to `docs/phase-b/B0-baseline-report.md`.
- [x] Relevant auth, session, and notification routes/services inventoried.
- [x] Pre-existing test failure (`TEST-001`) documented and distinguished.
- [x] Working tree clean; zero unauthorized modifications made.
- [x] Deterministic test plan established for Phase B1.

**B0 Gate Status:** **PASSED & APPROVED** -> Ready to proceed to **B1 — Login Resilience**.

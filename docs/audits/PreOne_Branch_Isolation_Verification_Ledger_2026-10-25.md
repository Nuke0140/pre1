# PreOne — Branch Isolation Verification Evidence Ledger

**Audit Reference:** PRE1-BRANCH-ISOLATION-002  
**Date:** 2026-10-25  
**Candidate Commit SHA:** `2bf8b83b4b77aab3cdfa6513ae7d179edea0078e`  
**Test Environment:** Bun v1.3.14 (0d9b296a), Local PostgreSQL database, Windows 11  

---

## 1. Automated Test Execution Ledger

| Check ID | Check Description | Exact Command | Tested Commit SHA | Exit Code | Executed / Passed / Failed | Duration | Evidence Reference |
|---|---|---|:---:|:---:|:---:|:---:|---|
| **CHK-01** | Git Working Tree Baseline | `git status --short --branch` | `2bf8b83` | 0 | 1 / 1 / 0 | 0.8s | Active branch: `feat/global-school-branding-PRE1-BRAND-001` [ahead 1] |
| **CHK-02** | Remote Upstream Sync Check | `git fetch --prune origin; git rev-parse origin/...` | `cf8e566` | 0 | 1 / 1 / 0 | 1.2s | Remote branch exists at SHA `cf8e566ef63db6f87913f4d48d5c91d36255962d` |
| **CHK-03** | F-ISO-01 Payments Branch Isolation | `bun test ./tests/security/branch-isolation-p1-remediation.test.ts` | `2bf8b83` + working tree | 0 | 6 / 6 / 0 | 5.8s | Rejects foreign branch query with 403, isolates listing, allows multi-branch staff, allows Owner school-wide |
| **CHK-04** | F-ISO-02 Admission Progression Branch Check | `bun test ./tests/security/branch-isolation-p1-remediation.test.ts` | `2bf8b83` + working tree | 0 | 5 / 5 / 0 | 2.8s | Rejects foreign lead progression with 403, blocks query/body tampering, allows Owner school-wide |
| **CHK-05** | F-ISO-03 Branches API Error Fallback | `bun test ./tests/security/branch-isolation-p1-remediation.test.ts` | `2bf8b83` + working tree | 0 | 2 / 2 / 0 | 1.6s | Verifies no demo metadata in success, verifies fail-closed 500 without leaking mock on DB error |
| **CHK-06** | Complete P1 Remediation Suite | `bun test ./tests/security/branch-isolation-p1-remediation.test.ts` | `2bf8b83` + working tree | 0 | 13 / 13 / 0 | 23.59s | 13 passed, 0 failed, 38 expect calls |
| **CHK-07** | Multi-Branch Staff Junction Suite | `bun test tests/security/multi-branch-staff.test.ts` | `2bf8b83` + working tree | 0 | 6 / 6 / 0 | 6.93s | 6 passed, 0 failed |
| **CHK-08** | Staff vs Family Branch Isolation Suite | `bun test tests/security/users-family-branch-isolation-audit.test.ts` | `2bf8b83` + working tree | 0 | 13 / 13 / 0 | 21.67s | 13 passed, 0 failed |
| **CHK-09** | Global School Branding Scenario Suite | `bun test tests/branding/` | `2bf8b83` + working tree | 0 | 35 / 35 / 0 | 4.27s | 35 passed, 0 failed, 105 expect calls |
| **CHK-10** | Admission Pipeline Kanban Board Suite | `bun test tests/admissions/admission-pipeline.test.ts` | `2bf8b83` + working tree | 0 | 9 / 9 / 0 | 1.05s | 9 passed, 0 failed |
| **CHK-11** | Zero-Retype Progression Full Suite | `bun test --timeout 15000 tests/admissions/zero-retype-progression.test.ts` | `2bf8b83` + working tree | 0 | 12 / 12 / 0 | 5.44s | 12 passed, 0 failed, 70 expect calls |
| **CHK-12** | Nested Fee Routes Copy & 404 Builder | `bun test tests/api/bug-024-nested-fee-routes-copy.test.ts` | `2bf8b83` + working tree | 0 | 8 / 8 / 0 | 0.89s | 8 passed, 0 failed |
| **CHK-13** | GitHub Actions Workflow CI Check | `gh run list --branch feat/global-school-branding-PRE1-BRAND-001` | `cf8e566` | 0 | 2 / 2 / 0 | 0.9s | Run `40181308435` (success), Run `40175261053` (success) |
| **CHK-14** | GitHub Branch Protection / Rulesets | `gh api repos/Nuke0140/pre1/rulesets` | `main` | 0 | 1 / 1 / 0 | 0.6s | Verified no active rulesets configured on remote |
| **CHK-15** | Build-time Type-check Suppression Audit | `git grep -n "ignoreBuildErrors" next.config*` | `2bf8b83` | 0 | 1 / 1 / 0 | 0.3s | Confirmed `next.config.ts:9` sets `ignoreBuildErrors: true` |

---

## 2. Test Execution Totals

- **Total Automated Test Suites Executed in Re-Audit:** 8 suites.
- **Total Test Cases Executed:** **97 tests**.
- **Total Tests Passed:** **97 tests (100%)**.
- **Total Tests Failed:** **0**.
- **Total Tests Skipped / Todo:** **0**.

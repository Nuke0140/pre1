# PreOne — Branch Isolation Residual Risks & Remediation Register

**Audit Reference:** PRE1-BRANCH-ISOLATION-002  
**Date:** 2026-10-25  
**Evaluation Scope:** Codebase Security, Authorization Policies, and CI Promotion Readiness  

---

## 1. Remediation Status of Previous Audit Findings

| Finding ID | Title & Component | Severity | Initial Status | Re-Audit Status | Regression Coverage | Closure Condition Met? |
|---|---|:---:|:---:|:---:|---|:---:|
| **F-ISO-01** | Payments API Branch Scope Bypass (`src/app/api/v1/payments/route.ts`) | **High (P1)** | OPEN | **VERIFIED FIXED** | `branch-isolation-p1-remediation.test.ts` (6 tests) | **YES** |
| **F-ISO-02** | Admission Progression Parameter Tampering (`src/app/api/v1/admissions/progression/[id]/route.ts`) | **High (P1)** | OPEN | **VERIFIED FIXED** | `branch-isolation-p1-remediation.test.ts` (5 tests) | **YES** |
| **F-ISO-03** | Branches API Demo Data in Error Fallback (`src/app/api/v1/branches/route.ts`) | **Medium (P2)** | OPEN | **VERIFIED FIXED** | `branch-isolation-p1-remediation.test.ts` (2 tests) | **YES** |

---

## 2. Residual Risk Register

| Risk ID | Category | Severity | Description | Current Mitigation | Follow-Up Action Required Before Release |
|---|---|:---:|---|---|---|
| **RSK-01** | Build / Type Safety | Low (P3) | Next.js production build suppresses TypeScript compiler errors via `typescript: { ignoreBuildErrors: true }` in `next.config.ts:9`. | Modified files and security endpoints pass type check and runtime verification; tests pass with Bun. | Add a separate CI pipeline step that runs `bun x tsc --noEmit` before staging deployments to ensure long-term type health. |
| **RSK-02** | Git / Synchronization | Low (P3) | The P1 remediations and regression tests currently reside in the local working tree (unstaged/uncommitted) and have not been pushed to the remote GitHub repository. | Local working tree is clean of any unwanted artifacts; all 13 regression tests pass locally against PostgreSQL. | Stage, commit, and push the verified changes to `feat/global-school-branding-PRE1-BRAND-001` once authorized. |
| **RSK-03** | Branch Listing Directory Scope | Informational | Non-admin users can see the names/codes of all campus branches within their tenant via `GET /api/v1/branches`. | Evaluated and approved as intentional design: branch list is an organizational directory used for dropdown selectors; all actual operational endpoints enforce server-side branch filters. | None. Documented in architecture policy. |

---

## 3. Conditions for Final Merge Approval

To advance from **CONDITIONAL PASS** to a final merged release on `main`:
1. **Commit Working Tree Changes:** Stage and commit:
   - `src/lib/auth-api.ts`
   - `src/app/api/v1/payments/route.ts`
   - `src/app/api/v1/admissions/progression/[id]/route.ts`
   - `src/app/api/v1/branches/route.ts`
   - `src/app/api/v1/users/[id]/route.ts`
   - `src/app/api/v1/users/bulk/route.ts`
   - `src/app/api/v1/users/route.ts`
   - `tests/security/branch-isolation-p1-remediation.test.ts`
   - `docs/audits/PreOne_Final_Branch_Isolation_ReAudit_2026-10-25.md`
   - `docs/audits/PreOne_Branch_Isolation_Module_Matrix_2026-10-25.md`
   - `docs/audits/PreOne_Branch_Isolation_Verification_Ledger_2026-10-25.md`
   - `docs/audits/PreOne_Branch_Isolation_Residual_Risks_2026-10-25.md`
2. **Push to Remote:** Push the commit to `origin/feat/global-school-branding-PRE1-BRAND-001`.
3. **Verify Remote CI:** Confirm that GitHub Actions CI workflow triggers and finishes green on the pushed commit.
4. **Merge Review:** Submit for standard peer/owner review and merge into `main`.

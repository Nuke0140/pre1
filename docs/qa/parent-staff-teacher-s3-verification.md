# PreOne QA Blocker Verification Checklist

**Status: NOT YET VERIFIED — release-blocking until evidence is attached**

Repository: https://github.com/Nuke0140/pre1  
Base at audit creation: `main`  
Scope: Parent/Family creation, Staff Access & Login, Teacher creation, centralized S3 photo uploads.

This checklist records verifiable checks. Do not mark an item PASS based on code comments, screenshots alone, or an unexecuted test command.

## Snapshot findings from repository inspection

- `src/components/users/AddStaffModal.tsx`: the current `handleSubmit` validates Steps 1 and 2 but does not guard against `step !== 3`. The form should explicitly prevent native Enter-key form submits on Steps 1–2 and refuse final submission unless the current step is Step 3.
- `src/components/users/UserPhotoUpload.tsx`: current client upload posts multipart form data to `/api/v1/users/photo`; it does not currently use a browser-to-S3 presigned URL flow.
- `src/app/api/v1/users/photo/route.ts`: current route calls `saveUserProfilePhoto`; inspect the underlying storage implementation before claiming S3 is the configured production backend.
- `src/lib/storage.ts`: imports Node `fs` and `path`. Its image persistence behavior must be audited and made environment-safe; production photo storage must not silently fall back to local persistent files.
- `src/lib/users/user-validation.ts`: has `normalizeFamilyCreateInput`, but aliases and returned canonical values still need to be tested against actual modal request payloads and schema requirements.
- Open PR #13 (`refactor/users-module-simplify`) modifies only `src/app/api/v1/users/route.ts` and `src/app/app/users/page.tsx`; it is not a four-blocker/S3 implementation PR. Keep its changes separate unless a verified dependency is identified.
- The reported `tests/domain/qa-blockers-users-s3.test.ts` was not found by default-branch code search. The reported “12 tests, 66 assertions” result therefore remains unverified in this review.
- GitHub API/code inspection is not a test runner. No application test command is reported as executed by this checklist.

## Blocker 1 — Parent / Family creation

### Code and contract review
- [ ] Capture the exact current failing payload and server response from a non-production environment.
- [ ] Compare `AddFamilyModal.tsx` payload keys with `normalizeFamilyCreateInput()` and `FamilyUserService.createFamilyUser()`.
- [ ] Verify both EXISTING-child and CREATE-child paths.
- [ ] Verify alias support for full name, email, phone, child DOB, student ID/admission number, role and permissions against actual supported payloads.
- [ ] Verify role/relationship/status values match Prisma enum values.
- [ ] Verify user/guardian/student associations are persisted in one appropriate transaction.
- [ ] Verify branch/campus and student IDs are scoped to the current tenant.
- [ ] Verify principal cross-branch access follows existing RBAC policy, rather than a blanket exception.
- [ ] Verify endpoint returns the established response envelope and HTTP 201 only after committed success.
- [ ] Verify errors are shown in UI and do not produce success notifications.

### Required regression evidence
- [ ] Valid existing-child family creation.
- [ ] Valid new-child family creation.
- [ ] Invalid required fields rejected.
- [ ] Duplicate/parent-limit rule exercised.
- [ ] Cross-tenant student reference rejected.
- [ ] Simulated transaction failure rolls back associated records.
- [ ] Retrying a failed request does not create duplicate identities/links.

## Blocker 2 — Staff creation / Access & Login step

- [ ] Step 1 → Step 2 works.
- [ ] Step 2 → Step 3 requires Step 2 validation.
- [ ] Step 1 or 2 native Enter submission cannot invoke final API.
- [ ] Final submit handler rejects every step other than Step 3.
- [ ] Step 3 validates username/password or the project's canonical invitation/password setup flow.
- [ ] Password policy is sourced from the existing authentication contract; do not assume six characters without evidence.
- [ ] Form state is retained after API failure.
- [ ] Submission is idempotent from the UI (loading state/double-click prevention).
- [ ] Changing branch clears/revalidates classroom to prevent mismatched assignment.
- [ ] Success notification, modal close and list refresh occur only after successful API response.

## Blocker 3 — Teacher creation

- [ ] Identify and document the actual Teacher creation entry point.
- [ ] Test Teacher separately from generic STAFF and other supported roles.
- [ ] Verify `primaryRole`, `roles` and `additionalRoles` semantics and invalid role handling.
- [ ] Verify tenant-scoped branch/classroom validation.
- [ ] Verify profile, membership, classroom association and login setup are persisted consistently.
- [ ] Verify atomicity: profile/membership/classroom changes should not be partially committed after a later failure.
- [ ] Verify the API response includes the fields actually required by its caller (do not add aliases speculatively).
- [ ] Verify invalid classroom and duplicate-employee-code scenarios.

## Blocker 4 — Production-safe S3 photo storage

### Architecture
- [ ] One shared storage abstraction is used by profile and branding upload surfaces.
- [ ] Browser requests a short-lived presigned URL from an authenticated endpoint.
- [ ] Presign endpoint validates tenant, user permission, upload purpose, MIME/content and file-size limits.
- [ ] Object keys are server-generated and tenant-scoped; client paths are never trusted.
- [ ] Bucket public access is blocked by default.
- [ ] Browser uploads binary directly to S3 with required CORS configuration.
- [ ] Completion step verifies object key, size/content metadata and tenant ownership.
- [ ] DB stores stable object key/file ID and required metadata, never an expiring presigned URL as canonical reference.
- [ ] Read/display URL is resolved through the intended private CDN or signed-read mechanism.
- [ ] DB metadata failure after S3 upload triggers cleanup or a documented orphan-reconciliation path.
- [ ] Production configuration failure is explicit; no production local-disk or in-memory fallback.
- [ ] IAM policy is least-privilege; no credentials or presigned URLs appear in logs or responses beyond intended URL.
- [ ] No binary photos are committed to Git or written into the application repository/public directory.
- [ ] Audit parent, staff, teacher, student, campus-logo and branding image upload surfaces.
- [ ] Remove is authorized, tenant-scoped and deletes only approved objects.

### Required S3 tests
- [ ] Unit test generates tenant-isolated, traversal-safe keys.
- [ ] Unit test rejects unsupported MIME/content and oversized files.
- [ ] Authorization test rejects wrong tenant / wrong role.
- [ ] Presigned upload contract test verifies TTL and expected object key/content constraints.
- [ ] Mocked S3 upload test confirms no filesystem writes.
- [ ] Completion test verifies object before DB metadata save.
- [ ] DB failure test covers orphan cleanup/reconciliation.
- [ ] Fresh-read test verifies persistent profile image reference after page reload.
- [ ] Negative configuration test fails closed in production mode.
- [ ] Optional non-production AWS smoke test records bucket/prefix, test timestamp and result without logging credentials or full signed URL.

## Test execution protocol

First inspect `package.json`, lockfile, test files and CI configuration. Use the repository's actual framework and commands. Do not assume `bun test` is correct without checking scripts/dependencies.

Minimum checks:
- [ ] Targeted parent/family tests.
- [ ] Targeted staff step/navigation tests.
- [ ] Targeted teacher creation tests.
- [ ] S3 service and upload-route tests.
- [ ] Related existing regression suite.
- [ ] Lint.
- [ ] Typecheck, if configured.
- [ ] Production build.
- [ ] Inspect CI checks on the exact PR head SHA.

Attach actual command, commit SHA, exit code, pass/fail counts, skipped tests and relevant sanitized logs. Never substitute a code-search result for test execution. Real AWS smoke test is opt-in and must use a non-production bucket/prefix.

## Release sign-off gate

Do not approve or merge this PR until:
1. Every blocking regression test above is passing or explicitly dispositioned with an approved reason.
2. CI is green on the final PR head SHA.
3. Diff is reviewed for tenant isolation, auth, secret leakage, local disk fallback and unrelated changes.
4. Required AWS region/bucket/CORS/IAM/CDN configuration is documented and available in deployment configuration.
5. Manual QA confirms photo display after reload and full onboarding flow for parent, staff and teacher.
6. The delivery report lists only changes actually present and tests actually run.

Merge/deployment is outside this checklist and requires separate authorization.

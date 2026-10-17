# PreOne — QA Blocker Resolution Implementation Prompt

## Mission

Investigate and fix four release-blocking defects in PreOne:

1. Parent / Family account creation failure.
2. Staff creation bypasses the Access & Login step.
3. Teacher onboarding fails or is incomplete.
4. Photo uploads across supported modules must use centralized S3 object storage.

Repository: https://github.com/Nuke0140/pre1

Treat this as root-cause engineering, not a UI-only patch. Inspect the existing branch/PR history and current code before editing. Reproduce issues in a non-production environment, trace UI → API → service → database/storage → response, make the smallest safe change, and add regression tests. Preserve existing API contracts, RBAC, tenant isolation, schema conventions and product workflows.

## 1. Parent / Family account creation

Inspect:
- `src/components/users/AddFamilyModal.tsx`
- `src/lib/users/user-validation.ts`
- `src/lib/users/family-user-service.ts`
- `src/app/api/v1/users/route.ts`
- Relevant Prisma schema and tests.

Verify the exact UI payload keys against normalization and service input. Test both EXISTING-child and CREATE-child paths, role/relationship/status enums, parent-limit and duplicate rules, identity/username/password contract, branch/classroom/student/academic-session tenant scoping, transaction boundaries, API envelope and frontend error parsing.

Fix actual cause without weakening validation. Related records must be atomic where business rules require it; failed retries must not create duplicate identities or links. Show success only after the intended transaction commits.

## 2. Staff creation — Access & Login step

Inspect `src/components/users/AddStaffModal.tsx`. The current source inspected on main contains a `handleSubmit` that validates Step 1 and Step 2 but does not check `step === 3`. Reconfirm this on the branch being changed.

Ensure:
- Steps are Basic Information → Work & Assignment → Account & Access.
- “Continue” never submits the form.
- Enter on Steps 1–2 cannot trigger final creation.
- Final submit handler explicitly rejects when the current step is not Step 3.
- Previous-step validation, username/credential requirements, loading state and duplicate-submit prevention are correct.
- API failure preserves form state and no success notification appears.
- Back navigation preserves data; branch changes clear/revalidate classroom selection.

Follow PreOne’s canonical identity and password/invitation flow; don't invent a conflicting authentication mechanism or log plaintext passwords.

## 3. Teacher creation

Trace the actual Teacher-specific entry point. Test Teacher independently from generic Staff. Validate primaryRole/roles/additionalRoles semantics; tenant-scoped branch/classroom references; profile, membership, credentials and classroom persistence; duplicate employee code; invalid-classroom failure; response fields needed by actual callers.

Keep related database writes atomic when required. Invalid references must fail without partial profile/membership/classroom state. Preserve other staff roles.

## 4. Centralized S3 photo upload

Current main-branch source inspection indicates:
- `src/components/users/UserPhotoUpload.tsx` posts multipart data to `/api/v1/users/photo`, not a browser-direct presigned upload.
- `src/app/api/v1/users/photo/route.ts` calls `saveUserProfilePhoto`.
- `src/lib/storage.ts` imports Node `fs` and `path`; trace exact production write/read/delete behavior before choosing changes.
- The claimed `tests/domain/qa-blockers-users-s3.test.ts` was not found in default-branch search at inspection time.

Do not assume there is no S3 implementation on another branch. Search code, storage services, upload routes, file metadata schema, environment config, deployment config and all image consumers before adding a new abstraction. Reuse a compatible existing implementation.

Target architecture:
1. Authenticated presign endpoint checks permission, tenant, purpose, file size and content type.
2. Server-generated unique object key scoped to tenant and upload category. Never accept arbitrary client object paths.
3. Short-lived presigned PUT; browser uploads bytes directly to private S3 over HTTPS.
4. Authorized completion endpoint verifies object existence and allowed metadata.
5. PostgreSQL/Prisma stores stable file ID/object key and metadata, not binary image data and not an expiring presigned URL.
6. Read path uses approved CDN/private signing model.
7. DB failure after object upload triggers cleanup or documented orphan reconciliation.
8. Production must fail explicitly when S3 is unavailable; no local filesystem or in-memory production fallback.
9. IAM least privilege, private bucket, blocked public access, safe CORS, no credentials/signed URL leakage in logs.
10. Integrate all supported image surfaces: parent/guardian, staff, teacher, student and branding/logo surfaces. Verify reload/display/delete paths.

Validate actual file content where feasible, allow only project-approved image formats, enforce size limits, and tenant-scope reads/deletes. Never commit photo binaries or store them in repository/public/local persistent storage in production.

## Regression tests

Use the repository's actual test runner and patterns, verified from `package.json` and existing tests before selecting a command. Do not assume a test framework or claim execution when unavailable.

Family:
- valid existing child + parent
- valid new child + parent
- missing/invalid required fields
- parent limit/duplicate handling
- cross-tenant reference rejected
- transaction rollback and retry/idempotency

Staff:
- complete step progression and back navigation
- Enter on Step 1/2 cannot submit
- handler blocked unless Step 3
- credentials validated according to existing policy
- request failure preserves form
- no duplicate submit

Teacher:
- teacher flow and role persisted
- assignment same tenant/branch
- invalid classroom fails atomically
- non-teacher staff regression remains green

S3:
- tenant-scoped traversal-safe generated keys
- invalid content type/size rejected
- permission/cross-tenant attempts rejected
- presign expiry/constraints verified
- mocked S3 confirms no filesystem writes
- upload verified before metadata persistence
- DB failure cleanup/reconciliation
- persisted reference resolves after reload
- production missing-config fails closed
- branding/avatar delete is tenant-scoped

## Required validation and evidence

Inspect scripts and CI. Execute targeted tests, relevant regression tests, lint, typecheck if configured, and production build when a supported runner/environment is available. Run real AWS smoke testing only with a designated non-production bucket/prefix and valid configuration.

Attach the actual target commit SHA, command, exit code, counts (pass/fail/skipped), sanitized logs and exact CI run links. Code search is not test execution. Unit tests against a mocked S3 client are not proof of live AWS configuration.

Before sign-off review diff for secrets, disk fallbacks, tenant isolation, auth and unrelated changes. Do not perform destructive DB resets or migrations against shared/production data.

## Done only when

Every blocker has a documented root cause, fix and regression evidence; required CI checks are green on the final PR head; manual QA confirms parent/staff/teacher creation and photo reload; AWS setup requirements are documented; delivery notes accurately separate verified facts from limitations. Do not merge or deploy without explicit authorization.

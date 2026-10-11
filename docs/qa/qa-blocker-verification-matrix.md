# PreOne QA Blocker — Verification Matrix

**Current disposition: NOT VERIFIED / release blocked until evidence is attached.** A checked box means the check was actually performed and evidence is linked; do not check items from inspection or intention alone.

## Branch/PR provenance
- [ ] Confirm current base SHA and final head SHA.
- [ ] Confirm exact list of files changed and no unrelated changes.
- [ ] Identify any dependency on existing open PRs; do not assume another PR is merged.
- [ ] Link test workflow runs against the exact final head SHA.

## 1. Parent / Family
- [ ] Capture failing request/response before fix (sanitized; no credentials/PII).
- [ ] Unit-test canonical payload normalization and all supported aliases.
- [ ] Integration-test existing child flow.
- [ ] Integration-test create child flow.
- [ ] Verify status and response envelope.
- [ ] Verify expected user, guardian, student and student-guardian relationship rows persisted.
- [ ] Verify tenant, branch and student scoping.
- [ ] Verify duplicate/parent-limit policy.
- [ ] Verify rollback on persistence error and no success toast before commit.

## 2. Staff / Access & Login
- [ ] Confirm Step 1 → 2 → 3 navigation.
- [ ] Press Enter on every Step 1 text input; assert no POST.
- [ ] Press Enter on every Step 2 text input; assert no POST.
- [ ] Directly invoke submit while current step is 1 or 2; assert blocked.
- [ ] Verify Step 3 credential policy matches authentication service.
- [ ] Verify error retains form values and does not close modal.
- [ ] Verify repeated click cannot create duplicate staff users.
- [ ] Verify branch change clears/revalidates classroom.

## 3. Teacher
- [ ] Test teacher flow independently from generic staff.
- [ ] Assert canonical role and memberships.
- [ ] Assert StaffProfile persistence.
- [ ] Assert classroom primaryTeacherId association when requested.
- [ ] Reject classroom in another tenant/branch.
- [ ] Simulate failure after profile/user persistence and verify transaction behaviour.
- [ ] Run a non-teacher staff regression test.

## 4. S3 / images
- [ ] List all upload components and endpoints; prove every relevant entry point uses the same storage abstraction.
- [ ] Presign endpoint auth and tenant isolation.
- [ ] TTL is short and bounded; client cannot choose arbitrary bucket/key.
- [ ] Key is server-generated, tenant-scoped and path-safe.
- [ ] Bucket privacy/public access policy and CORS are configured.
- [ ] MIME is checked against content where feasible; size enforced server-side.
- [ ] S3 object verification happens before DB metadata is marked complete.
- [ ] Metadata retains stable object ID/key, not temporary presigned URL.
- [ ] DB failure cleanup/orphan reconciliation tested.
- [ ] Reload displays photo successfully.
- [ ] Delete is authorized and tenant-scoped.
- [ ] Production missing config fails closed.
- [ ] Mocked S3 tests verify no filesystem writes.
- [ ] Search verifies no new photo binaries and no production filesystem fallback.
- [ ] Optional live smoke test passed against non-production bucket/prefix (record environment, date, object cleanup).

## Actual commands and results
For each command, record:
| Command | Commit SHA | Exit code | Passed | Failed | Skipped | Evidence / CI URL |
|---|---|---:|---:|---:|---:|---|
| Targeted family tests | TBD | TBD | TBD | TBD | TBD | TBD |
| Staff/Teacher tests | TBD | TBD | TBD | TBD | TBD | TBD |
| S3 tests | TBD | TBD | TBD | TBD | TBD | TBD |
| Related regression suite | TBD | TBD | TBD | TBD | TBD | TBD |
| Lint | TBD | TBD | TBD | TBD | TBD | TBD |
| Typecheck (if configured) | TBD | TBD | TBD | TBD | TBD | TBD |
| Production build | TBD | TBD | TBD | TBD | TBD | TBD |

Do not convert TBD to a pass without the real output. If the connector or environment cannot run a command, state that and use CI to run it.

## Release sign-off
- [ ] All required tests pass on final PR SHA.
- [ ] CI green; any skipped test has an approved reason.
- [ ] No P0/P1 blocker remains.
- [ ] Tenant isolation/auth reviewed.
- [ ] S3 config, bucket policy, CORS, IAM and CDN requirements documented.
- [ ] Manual parent/staff/teacher onboarding verified.
- [ ] Avatar/logo survives fresh page reload.
- [ ] No merge/deploy without explicit authorization.

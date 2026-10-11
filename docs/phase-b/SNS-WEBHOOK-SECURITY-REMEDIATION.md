# PreOne Phase B — Secure SNS Webhook Remediation Report

**Date:** October 11, 2026  
**Auditor & Implementation Roles:** Senior TypeScript/Next.js Engineer, AWS SNS Integration Engineer, Application Security Engineer, QA Automation Engineer  
**Repository:** https://github.com/Nuke0140/pre1  
**Git Baseline:** Branch `main` | Commit `657409f3642c5514daddd054faebcd25bb965d01`

---

## 1. Executive Summary & Defect Remediation

### Defect Identified:
In the earlier Phase B staging prototype, `src/app/api/v1/webhooks/ses/route.ts` processed Amazon SNS notifications (SubscriptionConfirmation, Bounce, Complaint) without cryptographic signature verification or Topic ARN allowlisting. Unauthenticated attackers could submit crafted HTTP POST requests to create fake bounces or spam complaint logs.

### Remediation Implemented:
1. **Cryptographic Verification Module (`src/lib/email/sns-verifier.ts`):**
   - Implemented strict canonical string construction for Amazon SNS `SignatureVersion: "1"` across `Notification` and `SubscriptionConfirmation` message types.
   - Built RSA-SHA1 cryptographic verification using Node.js `crypto.createVerify('RSA-SHA1')`.
2. **SSRF & Host Spoofing Prevention:**
   - Enforces HTTPS on `SigningCertURL`.
   - Strictly validates hostname against AWS SNS certificate hosts: `^sns\.[a-z0-9\-]+\.amazonaws\.com$` or `sns.amazonaws.com`.
   - Rejects non-PEM extensions, user credentials in URLs, and non-standard ports.
   - Restricts downloaded certificate response sizes to a maximum of 10 KB with a 5-second timeout and disables HTTP redirects (`redirect: 'error'`).
   - Caches certificates in-memory (1-hour TTL) to prevent repeated network queries.
3. **Topic ARN Allowlisting:**
   - Evaluates `data.TopicArn` against configured `SNS_SES_TOPIC_ARN` or `SNS_ALLOWED_TOPIC_ARNS`.
   - Rejects unauthorized topics with HTTP 403 Forbidden.
4. **SubscriptionConfirmation Security:**
   - Eliminates blind/automated fetching of `data.SubscribeURL`.
   - Logs subscription requests securely for manual administrator confirmation or console approval.
5. **Idempotency & Replay Defense:**
   - Checks `notification_delivery_logs` for existing `metadata.snsMessageId === data.MessageId`.
   - Ignores duplicate deliveries cleanly (`DUPLICATE_IGNORED`).
6. **Tenant Correlation:**
   - Resolves originating `tenantId` by matching `sesMessageId` against existing `notification_delivery_logs` records. Falls back safely to tenant root if unmatched.

---

## 2. Test Verification Matrix

**Command:** `bun test tests/email/ses-operations.test.ts`

| Test ID | Scenario | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|
| **SNS-01** | SigningCertURL validation | Rejects HTTP, arbitrary hosts, credentials, and lookalikes | Strict whitelist enforced | **PASS — VERIFIED** |
| **SNS-02** | Cryptographic RSA-SHA1 verification | Verifies authentic signature, rejects tampered content | Valid signature passes, tampered fails | **PASS — VERIFIED** |
| **SNS-03** | Unauthenticated webhook call | Returns HTTP 401 Unauthorized with error message | 401 Unauthorized, rejected | **PASS — VERIFIED** |
| **SNS-04** | Unauthorized Topic ARN | Returns HTTP 403 Forbidden with error message | 403 Forbidden, rejected | **PASS — VERIFIED** |
| **SNS-05** | Valid bounce ingestion & idempotency | Persists bounce log and rejects duplicate replay | Processed, duplicate replay handled | **PASS — VERIFIED** |

---

## 3. Required Operator-Side AWS Configuration

To operate Amazon SES and SNS in production, the operator must set the following environment variables:

```bash
# Amazon SES Configuration
AWS_REGION=ap-south-1
SES_FROM_EMAIL=PreOne Notifications <notifications@preone.in>
EMAIL_PROVIDER=SES

# Optional explicit keys (or rely on ambient ECS/EC2 IAM role)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Amazon SNS Webhook Security
SNS_SES_TOPIC_ARN=arn:aws:sns:ap-south-1:123456789012:preone-ses-events
```

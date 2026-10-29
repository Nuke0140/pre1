# PreOne Notifications API, Background Jobs & Integrations Matrix

**Audit Reference:** PRE1-NOTIFICATIONS-AUDIT-001  
**Audit Date:** 2026-10-30  
**Baseline Git SHA:** `d39568e3f088d2a19a0dade9577051561f57c0f5`  
**Application:** PreOne Preschool Management System  

---

## 1. Discovered Notifications & Integrations Inventory

This document provides a comprehensive technical inventory of all notification-related API routes, background jobs, webhooks, external delivery channels, rate limits, and verification evidence.

---

## 2. API Endpoints Inventory

| Route / Method | Purpose | Authentication & RBAC | Tenant & Branch Boundary | Request Parameters & Pagination Ceiling | Idempotency / Concurrency | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/notifications` | Lists current user's in-app notifications | Authenticated (`requireApi`) | Bound to `session.tenantId` and `session.uid` (No cross-user IDOR) | `unread=true/false`<br>`limit` (default 20, **max 100**)<br>`offset` (min 0) | Read-only; cached via Topbar SWR | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 2, 11, 12) | **VERIFIED** |
| `GET /api/v1/notifications/unread-count` | Returns badge count for Workspace Topbar bell | Authenticated (`requireApi`) | Scoped to `tenantId` and `session.uid` | None | Read-only aggregate count | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 2, 7) | **VERIFIED** |
| `PATCH /api/v1/notifications/[id]/read` | Marks a single notification as read | Authenticated (`requireApi`) | Validates `id`, `tenantId`, and `userId === session.uid` | Path param `id` | Idempotent; updates `isRead: true`, `readAt: Date` | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 7, 8) | **VERIFIED** |
| `POST /api/v1/notifications/mark-all-read` | Marks all unread user notifications as read | Authenticated (`requireApi`) | Scoped to `tenantId` and `session.uid` | None | Idempotent; returns `{ markedCount }` | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 10) | **VERIFIED** |
| `GET /api/v1/settings/notifications` | Fetches communication config & recent delivery audit logs | `settings:read` (Admin/Owner) | Scoped to `session.tenantId` | None | Read-only config | `src/app/api/v1/settings/notifications/route.ts` (Code Inspection) | **VERIFIED** |
| `PUT /api/v1/settings/notifications` | Updates notification rules, channels, language and templates | `settings:write` (Owner/Principal) | Scoped to `session.tenantId` | Body: `{ channels, notificationEvents, templates, rules, language }` | Validates domain config; audits changes via `AuditLog` | `src/app/api/v1/settings/notifications/route.ts` (Code Inspection) | **VERIFIED** |
| `GET /api/v1/settings/notifications/logs` | Filtered audit query of delivery logs | `settings:read` (Admin/Owner) | Scoped to `session.tenantId` | `eventType`, `channel`, `status`<br>`limit` (default 50, **max 100**)<br>`offset` (min 0) | Paginated audit log retrieval | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 1) | **VERIFIED** |
| `POST /api/v1/setup/notifications/test` | Truthful gateway connectivity tester (Zero Fake Success) | `settings:write` (Admin/Owner) | Scoped to `session.tenantId` | Body: `{ channel, templateBody, recipient }` | Evaluates real server credentials; records truthful `CONFIGURATION_ONLY` or `REAL_TEST` | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 17) | **VERIFIED** |
| `POST /api/v1/observations/[id]/publish` | Approves and publishes observation; fans out to parent notification & timeline | `academics:write` (Teacher/Principal) | Observation tenant + classroom branch scope; teacher ownership | Path param `id` | Idempotent: rejects already-published observations with 409 Conflict | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 1, 10) | **VERIFIED** |
| `GET /api/v1/students/[id]` | 360° student profile with developmental observations tab | `students:read` (Staff) / `students:read-linked` (Parents) | Tenant + branch scope for staff; linked child for parents | Path param `id` | Read-only | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 2, 3) | **VERIFIED** |

---

## 3. Background Jobs & Asynchronous Workers Inventory

| Job Type | Trigger | Queue & Processor | Tenant Context Propagation | Retry Policy & Timeout | Dead-Letter Handling | Failure Observability | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| `BULK_INVOICE` | Scheduled billing cycle or admin trigger | `src/lib/jobs.ts` (`processJob`) | `job.tenantId` attached to all generated invoices | Max 3 attempts, exponential backoff | Marked `FAILED` with `failureReason` | Stored in `BackgroundJob` table with progress tracking | Code inspection (`src/lib/jobs.ts`) | **VERIFIED** |
| `BULK_RECEIPT` | Batch payment receipt generation | `src/lib/jobs.ts` (`processJob`) | `job.tenantId` attached | 3 retries | Marked `FAILED` | Observable in jobs audit | Code inspection (`src/lib/jobs.ts`) | **VERIFIED** |
| `CSV_IMPORT` | Asynchronous user or student CSV import | `src/lib/jobs.ts` | `job.tenantId` propagated | 1 attempt (batch validation failure fails closed) | Marked `FAILED` with row-level error report | Observable in import modal | `tests/security/async-csv-import.test.ts` | **VERIFIED** |
| `DATA_EXPORT` | Administrator data backup / export | `src/lib/jobs.ts` | Scoped to `tenantId` | Single execution with timeout | Marked `FAILED` | Observable via export list | Code inspection (`src/lib/jobs.ts`) | **VERIFIED** |
| Outbound Delivery Worker | Notification event creation | In-process asynchronous dispatch via `NotificationEngine.dispatch` | Tenant ID passed in `DispatchNotificationInput` | Gateway failure logged in `NotificationDeliveryLog` | Unconfigured providers logged truthfully as `CONFIGURATION_ONLY` | Audited in `notification_delivery_logs` table | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 1, 17) | **VERIFIED** |

---

## 4. Webhooks & External Integrations Inventory

| Integration Name | Direction | Transport / Protocol | Secret & Signature Verification | Idempotency & Replay Protection | Tenant Scoping & Isolation | Misconfiguration Handling | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| **n8n Orchestrator Callback** | Inbound | HTTP POST (`/api/v1/integrations/n8n/callback`) | Cryptographic HMAC-SHA256 (`x-preone-signature` matching `N8N_WEBHOOK_SECRET`) | Replay protection via `eventId` cache & database check (`ALREADY_PROCESSED`) | Header/body `tenantId` verified against tenant record | 401 Unauthorized on invalid signature; 404 on missing tenant | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 14, 15) | **VERIFIED** |
| **AWS SES Webhook** | Inbound | HTTP POST (`/api/v1/webhooks/ses`) | Cryptographic AWS SNS certificate & message signature verification | Message ID deduplication | Correlated tenant resolution via message metadata | Fails closed with 500/400 if SNS topic is unallowed | `tests/email/ses-webhook-handler.test.ts` | **VERIFIED** |
| **Payment Gateway Webhook** | Inbound | HTTP POST (`/api/v1/payments/webhook`) | HMAC-SHA256 gateway signature (`x-gateway-signature`, `PAYMENT_WEBHOOK_SECRET`) | Payment verification via unique payment/transaction ref | Payment record authoritatively determines `tenantId` | Fails closed (401 Unauthorized) in production mode | `tests/notifications/notifications-observation-integrations-audit.test.ts` (Scenario 14) | **VERIFIED** |
| **Transactional Email (SMTP/SendGrid)** | Outbound | SMTP / SendGrid API | Evaluated from environment variables | Message ID logged | Scoped to originating tenant | Fallback to `CONFIGURATION_ONLY` with zero fake delivery | `src/lib/notifications/channel-adapters.ts` | **VERIFIED** |
| **SMS Gateway (Twilio / SMS API)** | Outbound | HTTP REST API | Evaluated via `SMS_API_KEY` or `TWILIO_AUTH_TOKEN` | Message ID logged | Scoped to originating tenant | Missing credentials log `CONFIGURATION_ONLY` | `src/lib/notifications/channel-adapters.ts` | **VERIFIED** |
| **WhatsApp Cloud API** | Outbound | Meta Graph API | Evaluated via `WHATSAPP_API_TOKEN` | Message ID logged | Scoped to originating tenant | Missing token logs `CONFIGURATION_ONLY` | `src/lib/notifications/channel-adapters.ts` | **VERIFIED** |

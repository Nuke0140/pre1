# PreOne Error Handling & Observability Playbook

## 1. Error Taxonomy & Decision Rule

Every error in PreOne Enterprise OS must be classified as either **OPERATIONAL** or **DEVELOPER**.

| Classification | Meaning | Examples | Log Level | User Presentation |
| :--- | :--- | :--- | :--- | :--- |
| **OPERATIONAL** | An educated school staff member can fix the issue by altering data, configuration, permissions, or workflow. | `VALIDATION_*`<br>`CONFLICT_*`<br>`PERMISSION_*`<br>`BUSINESS_*`<br>`NOT_FOUND_*` | `WARN` | Actionable message explaining what happened and what the user can do to proceed. |
| **DEVELOPER** | A school operator cannot fix this issue through normal business actions. Indicates bug, network crash, or unhandled exception. | Null pointer, Prisma connection failure, unhandled crash, syntax error, memory limit. | `ERROR` (with internal stack) | Safe generic message: *"Something went wrong on our side. Reference: PRE-XXXXXXXX"*. Stack is never exposed. |

### Decision Rule:
> Ask: *"Can the preschool principal or teacher fix this by correcting their input or checking school settings?"*
> - If **YES** ➡️ `OPERATIONAL` (`errBusiness`, `errValidation`, `errNotFound`, `errConflict`, `errPermission`, `errAuth`).
> - If **NO** ➡️ `DEVELOPER` (`errDeveloper` or uncaught exception caught by `withApi`).

---

## 2. Trace ID Workflow: Support to Developer

Every request receives a single, authoritative Trace ID (`PRE-XXXXXXXX`) generated once at the edge.

```
User sees in UI:
"Something went wrong. Reference: PRE-7F3A9C21"
                        ↓
User quotes reference code to PreOne Support
                        ↓
Developer searches logs in Vercel / CloudWatch:
traceId == "PRE-7F3A9C21"
                        ↓
Developer retrieves full timeline:
- HTTP Method & Path
- User ID & Role
- Tenant & Branch Context
- Request Duration (ms)
- Exception Stack Trace
- Pre-sanitized payload
```

### Log Search Query:
```json
{ "traceId": "PRE-7F3A9C21" }
```

---

## 3. How to Create Errors in Services

Never throw a raw `new Error("...")`. Always throw a `PreOneError` using the centralized factories:

```typescript
import {
  errValidation,
  errNotFound,
  errConflict,
  errBusiness,
  errPermission,
  ErrorCodes
} from '@/lib/api'

// 1. Validation error (status 400)
throw errValidation('Child admission number must be 6 digits', 'admissionNo')

// 2. Resource not found (status 404)
throw errNotFound('Student', ErrorCodes.NOT_FOUND_STUDENT)

// 3. Conflict / Duplicate (status 409)
throw errConflict('A staff member with this employee code already exists', ErrorCodes.CONFLICT_EMPLOYEE_CODE)

// 4. Business rule (status 422)
throw errBusiness(
  ErrorCodes.BUSINESS_PARENT_LIMIT_EXCEEDED,
  'Child already has 2 registered Parent accounts. Please link as Guardian instead.'
)
```

---

## 4. How to Wrap API Routes

Always wrap your route handlers using `withApi`:

```typescript
import { NextRequest } from 'next/server'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

export const POST = withApi(async (req: NextRequest, ctx) => {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errPermission('No tenant context')

  const data = await req.json()
  const result = await MyService.create(session.tenantId, data)
  
  return ok(result, undefined, 201)
}, { module: 'students' })
```

---

## 5. CSV Import Row-Level Error Standards

When importing CSVs, individual row failures must use the `CsvImportError` standard:

```typescript
import { CsvImportError } from '@/lib/csv-error'

const rowError: CsvImportError = {
  traceId: ctx.traceId,
  rowNumber: 14,
  identifier: 'ADM-1049',
  field: 'parentEmail',
  code: 'VALIDATION_EMAIL_001',
  class: 'OPERATIONAL',
  severity: 'ERROR',
  message: 'Invalid email address format',
  currentValue: 'invalid-email',
}
```

All downloaded CSV error reports are automatically protected against formula injection (`=`, `+`, `-`, `@`, `\t`, `\r`) via `sanitizeCsvCell`.

---

## 6. Sensitive Data & Redaction Policy

All logs, audit records, and error details automatically pass through `redactSensitive`:
- Passwords (`password`, `passwordHash`, `tempPassword`)
- Access tokens & session cookies (`token`, `jwt`, `cookie`)
- Pickup security credentials (`pickupPin`, `pin`, `otp`)
- Payment & statutory identity numbers (`cardNumber`, `cvv`, `pan`, `aadhaar`)

Never log raw user passwords or credentials.

---

## 7. Audit Log Observability Rule

If writing an audit log fails outside of a database transaction:
- The business operation **must continue** (do not crash user flow).
- The failure is logged at `WARN` level with code `AUDIT_WRITE_FAILED`.
- Never attempt an audit call inside an audit catch handler (prevents infinite recursion).

# PreOne Enterprise Error Handling & Observability Architecture

## Architectural Overview

PreOne Enterprise Preschool OS implements a unified, platform-wide Error Handling and Observability pipeline. Every domain module—Setup, Users, Staff, Family, Students, Admissions, Academics, Attendance, Fees, HR, Transport, Inventory, Reports, and Notifications—adheres to the same error contract.

```
                         HTTP Request / Task
                                  │
                                  ↓
                        Edge Next.js Middleware
                       (Generates: PRE-XXXXXXXX)
                                  │
                                  ↓
                     Route Handler with withApi()
                       (Stores in AsyncLocalStorage)
                                  │
                                  ↓
                        Domain Service / Database
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                    Success                Error
                       │                     │
                       │                     ↓
                       │              toPreOneError()
                       │          (Sanitization & Mapping)
                       │                     │
                       │           ┌─────────┴─────────┐
                       │           ↓                   ↓
                       │      OPERATIONAL         DEVELOPER
                       │         (4xx)               (500)
                       │           ↓                   ↓
                       │       logger.warn        logger.error
                       │           │            (+ Stack Trace)
                       │           └─────────┬─────────┘
                       │                     │
                       ↓                     ↓
                    Structured JSON Stdout / CloudWatch
                       │
                       ↓
               Unified Response Envelope
        Header: X-Trace-Id: PRE-XXXXXXXX
        Body:   { success, data/error, traceId }
                       │
                       ↓
            Client UI / Toast / Error Boundary
```

## Key Invariants

1. **Single Trace ID Guarantee**: Generated once per request lifecycle and forwarded consistently across middleware, services, child loggers, HTTP response headers (`X-Trace-Id`), response JSON body (`traceId`), and client UI references.
2. **Operational vs. Developer Taxonomy**: Operational issues are user-remediable and logged at `WARN` level without alarming stacks. Developer issues are logged at `ERROR` level with stack traces, while the client receives a safe, generic message.
3. **PII and Secret Redaction**: Passwords, hashes, tokens, cookies, JWTs, pickup PINs, and payment data are stripped recursively before hitting stdout or audit tables.
4. **Resilient Audit Logging**: If non-transactional audit writing fails, the system logs `AUDIT_WRITE_FAILED` at `WARN` level while preserving the primary user operation.
5. **Spreadsheet CSV Protection**: CSV exports and error reports sanitize leading formula control characters (`=`, `+`, `-`, `@`, `\t`, `\r`) to guard against client-side CSV formula injection.

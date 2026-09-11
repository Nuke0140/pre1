P R E O N E E N T E R P R I S E
PreOne Enterprise
Backend Technical Design
Backend Architecture — Enterprise Preschool Operating System
Document Version: 1.0
Status: Backend Architecture Freeze
Date: 2026-07-14
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Vision v1.0, BRC v1.0, Master PRD v1.0, DDD v1.0, ADR Catalog, ERD v3.0, Prisma Schema v3.0, API
Contract Catalog
Successor: Backend Implementation, Unit Tests, Integration Tests, Deployment, Production Release
Classification: Internal Engineering Reference
Prepared by: PreOne Architecture & Engineering Team
PreOne Platform Backend TD v1.0

PreOne Backend TD v1.0 | Backend Architecture Freeze
Table of Contents
1. Backend Overview..........................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Audience.........................................................................................................................3
1.4 Document Conventions..................................................................................................4
1.5 Related Documents........................................................................................................5
2. Technology Stack............................................................................................................5
2.1 Stack Pipeline.................................................................................................................5
2.2 Component Catalog........................................................................................................8
2.3 Version Pinning Strategy................................................................................................8
3. Solution Architecture......................................................................................................8
3.1 Layered Architecture......................................................................................................9
3.2 Request Lifecycle..........................................................................................................11
3.3 Cross-Cutting Concerns................................................................................................13
3.4 Real-Time Layer............................................................................................................14
4. Folder Structure............................................................................................................14
4.1 Top-Level Layout..........................................................................................................15
4.2 Top-Level Directory Roles............................................................................................17
4.3 Module Folders............................................................................................................18
5. Module Structure..........................................................................................................18
5.1 Module Template (student/ example).........................................................................18
5.2 Directory Responsibilities.............................................................................................22
5.3 Module Wiring (student.module.ts)............................................................................22
6. Dependency Rules........................................................................................................25
1

PreOne Backend TD v1.0 | Backend Architecture Freeze
6.1 Layer-to-Layer Rules.....................................................................................................26
6.2 Cross-Module Communication.....................................................................................26
6.3 ESLint Configuration.....................................................................................................27
7. Controllers....................................................................................................................29
7.1 Controller Responsibilities...........................................................................................29
7.2 Controller Anti-Patterns...............................................................................................29
7.3 Example — POST /v1/students....................................................................................30
8. DTOs.............................................................................................................................35
8.1 DTO Types.....................................................................................................................35
8.2 DTO Rules.....................................................................................................................36
8.3 Example — CreateStudentDto.....................................................................................37
9. Application Services......................................................................................................42
9.1 Responsibilities.............................................................................................................43
9.2 Transaction Boundary Pattern.....................................................................................43
10. Domain Services.........................................................................................................47
10.1 Responsibilities...........................................................................................................47
10.2 Example — FeeCalculationService.............................................................................48
11. Repositories................................................................................................................52
11.1 Repository Interface Contract....................................................................................53
11.2 Repository Rules.........................................................................................................53
11.3 Example — PrismaStudentRepository.......................................................................54
12. CQRS...........................................................................................................................59
12.1 When to Use CQRS.....................................................................................................59
12.2 Command Side...........................................................................................................60
Command Catalog........................................................................................................61
12.3 Query Side..................................................................................................................62
Query Catalog...............................................................................................................63
13. Domain Events............................................................................................................63
2

PreOne Backend TD v1.0 | Backend Architecture Freeze
13.1 Event Flow..................................................................................................................63
13.2 Event Catalog..............................................................................................................65
13.3 Event Schema Rules...................................................................................................65
14. Integration Events.......................................................................................................67
14.1 Integration Event Catalog...........................................................................................67
14.2 Integration Patterns...................................................................................................67
14.3 Integration Rules........................................................................................................68
15. Background Jobs.........................................................................................................69
15.1 BullMQ Queue Catalog...............................................................................................69
15.2 Retry Policy.................................................................................................................70
15.3 Job Lifecycle................................................................................................................70
16. Cache Strategy............................................................................................................72
16.1 Cache Layers...............................................................................................................72
16.2 Cache Patterns............................................................................................................72
16.3 Cache Invalidation Rules............................................................................................73
16.4 Permission Cache Deep-Dive.....................................................................................74
17. Transactions...............................................................................................................76
17.1 Transaction Patterns..................................................................................................76
17.2 Transaction Rules.......................................................................................................77
17.3 Example — Admission Approval Saga........................................................................78
18. Validation...................................................................................................................81
18.1 Validation Layers........................................................................................................82
18.2 Validation Flow...........................................................................................................82
18.3 Validation Best Practices............................................................................................84
19. Exception Handling.....................................................................................................85
19.1 Exception Types..........................................................................................................85
19.2 Standard Error Response............................................................................................85
Response Field Reference............................................................................................87
3

PreOne Backend TD v1.0 | Backend Architecture Freeze
19.3 Global Exception Filter...............................................................................................87
20. Security.......................................................................................................................91
20.1 Security Controls Catalog...........................................................................................91
20.2 Authentication Flow...................................................................................................91
20.3 PII Protection..............................................................................................................94
21. Multi-Tenant Strategy.................................................................................................94
21.1 Isolation Layers...........................................................................................................94
21.2 Isolation Scope...........................................................................................................94
21.3 PostgreSQL RLS Policy................................................................................................95
22. Logging.......................................................................................................................97
22.1 Log Fields....................................................................................................................97
22.2 Log Levels...................................................................................................................97
22.3 Pino Configuration......................................................................................................98
23. Observability............................................................................................................101
23.1 Three Pillars..............................................................................................................101
23.2 Health Checks...........................................................................................................102
23.3 Alerting Strategy.......................................................................................................102
24. Testing......................................................................................................................103
24.1 Test Pyramid.............................................................................................................103
24.2 Test Pyramid Diagram..............................................................................................103
24.3 Testing Rules.............................................................................................................105
24.4 Example — Aggregate Unit Test..............................................................................106
25. Performance.............................................................................................................110
25.1 Performance Tactics.................................................................................................111
25.2 Service Level Objectives (SLOs)................................................................................111
25.3 Connection Pooling..................................................................................................111
26. Coding Standards......................................................................................................113
26.1 Standards Catalog....................................................................................................114
4

PreOne Backend TD v1.0 | Backend Architecture Freeze
26.2 Pre-commit Hooks....................................................................................................116
26.3 PR Review Checklist..................................................................................................118
27. Deployment Readiness.............................................................................................119
27.1 Pre-Deployment Checklist........................................................................................120
27.2 Deployment Topology..............................................................................................120
27.3 CI/CD Pipeline...........................................................................................................120
28. Glossary....................................................................................................................123
29. Document Control.....................................................................................................124
29.1 Version History.........................................................................................................124
29.2 Approval Matrix........................................................................................................124
29.3 Review Cadence.......................................................................................................124
29.4 Distribution List........................................................................................................125
29.5 Companion Documents............................................................................................126
29.6 Deliverables..............................................................................................................126
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
5

PreOne Backend TD v1.0 | Backend Architecture Freeze
1. Backend Overview
1.1 Purpose
हा(cid:2) Document PreOne च्या(cid:2) Backend System ची(cid:7) complete technical blueprint प्र(cid:9)दा(cid:2)न करतो(cid:15).
Backend हा(cid:2) PreOne platform ची(cid:2) core engine आहा (cid:17)जो(cid:15) 13 business domains, 530+ REST APIs, 14
NestJS modules, आणि(cid:20) शे(cid:17)कडो(cid:15) background jobs क(cid:15)(cid:20)त्या(cid:2)हा(cid:7) वे(cid:17)ळी(cid:7) orchestrate करतो(cid:15). या(cid:2) document ची(cid:2)
primary goal म्हा(cid:20)जो (cid:17)architecture, patterns, आणि(cid:20) standards ची(cid:7) एकची source of truth स्था(cid:2)णिप्रतो कर(cid:20) (cid:17)
जो(cid:7) implementation, review, आणि(cid:20) onboarding सा(cid:2)ठी(cid:7) reference म्हा(cid:20)जो(cid:17) वे(cid:2)प्ररली(cid:7) जो(cid:2)ऊ शेक(cid:17) ली.
Backend Technical Design (BTD) हा(cid:2) Vision, BRC, PRD, आणि(cid:20) DDD च्या(cid:2) वेर build हा(cid:15)तो(cid:15) — त्या(cid:2)च्# या(cid:2)
business requirements ली(cid:2) concrete software architecture मध्या(cid:17) translate करतो(cid:15). DDD मध्या (cid:17)
define क(cid:17) लीली(cid:17) (cid:17)aggregates, entities, आणि(cid:20) bounded contexts या(cid:2) document मध्या (cid:17)NestJS modules,
Prisma schemas, आणि(cid:20) application services मध्या(cid:17) implement हा(cid:15)तो(cid:2)तो. प्र(cid:9)त्याक(cid:17) architectural choice
ली(cid:2) ADR Catalog मध्या (cid:17)documented decision आणि(cid:20) ERD v3.0 मध्या (cid:17)physical schema backing आहा(cid:17).
या(cid:2) document वेरून प्रढी' (cid:7)ली production artifacts तोया(cid:2)र हा(cid:15)तो(cid:7)ली: Complete NestJS Folder Structure
(14 domain modules), Controllers (~530 REST APIs), DTO Library, Application & Domain
Services, CQRS Commands / Queries / Handlers, Domain Event Catalog, BullMQ Job
Definitions, Redis Cache Design, Transaction Strategy, Exception & Validation Framework,
Logging & Observability Standards, Testing Strategy, आणि(cid:20) Backend Implementation
Guidelines.
1.2 Scope
हा(cid:2) document फक्तो Backend System च्या(cid:2) architecture आणि(cid:20) implementation guidelines cover
करतो(cid:15). खा(cid:2)ली(cid:7)ली explicitly out of scope आहा(cid:17)तो:
• Frontend / Mobile Architecture — separate frontend design document मध्या (cid:17)cover
हा(cid:15)तो(cid:17).
• Infrastructure as Code (Terraform / Pulumi) — DevOps runbook मध्या (cid:17)documented
आहा(cid:17).
• Third-party SDK integration details — per-provider spec sheets (SMS, WhatsApp,
Payment gateways) reference क(cid:17) ली (cid:17)आहा(cid:17)तो.
• Mobile Push (FCM / APNs) cert management — operations runbook मध्या.(cid:17)
• Data migration scripts from legacy systems — separate migration runbook.
6

PreOne Backend TD v1.0 | Backend Architecture Freeze
1.3 Audience
हा(cid:2) document खा(cid:2)ली(cid:7)ली audiences सा(cid:2)ठी(cid:7) णिलीणिखातो आहा(cid:17):
• Backend Engineers: Primary reference — module structure, patterns, coding
standards, testing strategy implementation सा(cid:2)ठी(cid:7).
• Tech Leads / Architects: Architecture enforcement — dependency rules, CQRS
applicability, transaction boundaries review सा(cid:2)ठी(cid:7).
• QA Engineers: Testing pyramid understanding, integration test patterns, आणि(cid:20) SLO
targets सा(cid:2)ठी(cid:7).
• DevOps / SRE: Deployment readiness checklist, observability stack, health checks,
आणि(cid:20) scaling patterns सा(cid:2)ठी(cid:7).
• AI Code Assistants: Each section structured as a prompt-able block; AI tools च्या(cid:2)
context मध्या (cid:17)णिदाल्या(cid:2)वेर accurate NestJS code generation हा(cid:15)तो(cid:17).
• New Hires: Onboarding reference — first 2 weeks मध्या (cid:17)वे(cid:2)चीन- backend mental model
तोया(cid:2)र हा(cid:15)तो(cid:15).
1.4 Document Conventions
• Module names: kebab-case (student, attendance, identity).
• Class names: PascalCase (StudentAggregate, CreateStudentCommand).
• File names: kebab-case (student.aggregate.ts, create-student.dto.ts).
• Database tables: snake_case (students, admission_applications).
• REST endpoints: kebab-case plural (/v1/students, /v1/attendance-records).
• Code blocks: monospace font (Consolas); tree diagrams use └ ─ characters.
• Bilingual content: Marathi business context + English technical terms preserved
exactly as user provided.
1.5 Related Documents
PreOne document series मध्या(cid:17) BTD ची(cid:17) specific position आहा(cid:17). खा(cid:2)ली(cid:7)ली documents BTD ची (cid:17)
predecessors आहा(cid:17)तो:
7

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Document        | Version | Status        | Relationship to BTD |
| --------------- | ------- | ------------- | ------------------- |
| Vision Document | v1.0    | Vision Freeze | Strategic intent —  |
BTD च्या(cid:2) non-
functional
requirements (scale,
compliance) Vision
शे(cid:7) align
| BRC | v1.0 | Business Freeze | 176 rules — BTD च्या(cid:2)  |
| --- | ---- | --------------- | ---------------------------- |
Domain Events +
Specifications BRC ची (cid:17)
implementation
| Master PRD | v1.0 | Product Freeze | Functional  |
| ---------- | ---- | -------------- | ----------- |
requirements — BTD
ची (cid:17)API endpoints PRD
च्या(cid:2) FRs ची (cid:17)direct
mapping
| DDD | v1.0 | Architecture Freeze | Domain model —  |
| --- | ---- | ------------------- | --------------- |
BTD च्या(cid:2) NestJS
modules DDD च्या(cid:2)
bounded contexts ची (cid:17)
implementation
| ADR Catalog | v1.0 | Architecture Freeze | Decisions — BTD  |
| ----------- | ---- | ------------------- | ---------------- |
प्र(cid:9)त्या(cid:17)क architectural
choice ली(cid:2) ADR
reference करतो(cid:15)
| ERD v3.0 | v3.0 | Schema Freeze | Physical schema —  |
| -------- | ---- | ------------- | ------------------ |
BTD च्या(cid:2) Prisma
models ERD ची (cid:17)direct
translation
| Prisma Schema v3.0 | v3.0 | Schema Freeze | Code-first schema —  |
| ------------------ | ---- | ------------- | -------------------- |
BTD च्या(cid:2) repositories
ची (cid:17)data access layer
| API Contract Catalog | v1.0 | API Freeze | Endpoint contracts  |
| -------------------- | ---- | ---------- | ------------------- |
— BTD च्या(cid:2)
controllers ची (cid:17)spec
8

PreOne Backend TD v1.0 | Backend Architecture Freeze
2. Technology Stack
PreOne backend ची(cid:2) technology stack enterprise-grade reliability, developer productivity,
आणि(cid:20) AI-assisted development optimize करण्या(cid:2)सा(cid:2)ठी(cid:7) choose क(cid:17) ली(cid:2) आहा(cid:17). प्र(cid:9)त्याक(cid:17) choice ली(cid:2) ADR
(Architecture Decision Record) backing आहा(cid:17) जो(cid:15) trade-offs documented करतो(cid:15). Stack ची(cid:2) core
philosophy म्हा(cid:20)जो(cid:17) type safety end-to-end (TypeScript + Prisma + Zod), modularity (NestJS
DI), आणि(cid:20) operational maturity (BullMQ + OpenTelemetry + Pino)।
2.1 Stack Pipeline
Request ची(cid:2) flow stack च्या(cid:2) प्र(cid:9)त्याक(cid:17) layer through जो(cid:2)तो(cid:15). हा(cid:7) pipeline request lifecycle सामजोण्या(cid:2)सा(cid:2)ठी(cid:7)
critical आहा(cid:17):
Client Request
↓
NestJS Controller (route + auth + DTO validation)
↓
Application Service / Command Handler
↓
Domain Aggregate (business rules + invariants)
↓
Repository (port interface)
↓
Prisma ORM (type-safe SQL)
↓
PostgreSQL (primary) / Read Replica
↓
Outbox Table (event publishing)
↓
Redis Stream (async integration events)
↓
BullMQ Worker (background jobs)
↓
External Services (S3 / SMS / WhatsApp / Email)
2.2 Component Catalog
खा(cid:2)ली(cid:7)ली table सावे0 stack components ची(cid:7) authoritative list आहा(cid:17). नवे(cid:7)न component introduce
करतो(cid:2)न(cid:2) या(cid:2) table मध्या (cid:17)entry जो(cid:15)डो(cid:2)वे(cid:7) ली(cid:2)गे(cid:17)ली आणि(cid:20) corresponding ADR draft कर(cid:2)वे(cid:2) ली(cid:2)गेली(cid:17) :
9

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Component | Version | Role         | Highlights      | Why Chosen     |
| --------- | ------- | ------------ | --------------- | -------------- |
| NestJS    | v11.x   | Application  | Modular DI,     | Production-    |
|           |         | Framework    | decorators,     | grade Angular- |
|           |         |              | microservices,  | style DI;      |
|           |         |              | WebSocket       | ecosystem      |
|           |         |              | gateway,        | mature; squad  |
|           |         |              | scheduling,     | familiarity    |
OpenAPI via
@nestjs/swagge
r
| TypeScript | v5.4+ | Language | Strict mode,   | Type safety at  |
| ---------- | ----- | -------- | -------------- | --------------- |
|            |       |          | path aliases,  | compile time;   |
|            |       |          | decorators,    | DDD-friendly    |
|            |       |          | const          | with branded    |
|            |       |          | assertions,    | types & value   |
|            |       |          | satisfies      | objects         |
operator
| Prisma ORM | v6.x | ORM / Data  | Schema-first,      | Type safety      |
| ---------- | ---- | ----------- | ------------------ | ---------------- |
|            |      | Access      | type-safe client,  | end-to-end;      |
|            |      |             | migrations,        | migration        |
|            |      |             | multi-schema,      | history;         |
|            |      |             | read-replica       | excellent        |
|            |      |             | routing (client    | Postgres         |
|            |      |             | extensions)        | support          |
| PostgreSQL | v16  | Primary     | RLS, partial       | ACID             |
|            |      | Database    | indexes, JSONB,    | compliance; RLS  |
|            |      |             | generated          | for tenant       |
|            |      |             | columns,           | isolation;       |
|            |      |             | pgcrypto,          | pgvector for     |
|            |      |             | pgvector (for      | embeddings       |
AI), logical
replication
| Redis | v7.2 | Cache + Queue  | Permission     | Sub-ms reads;  |
| ----- | ---- | -------------- | -------------- | -------------- |
|       |      | Backend        | cache, menu    | supports       |
|       |      |                | cache, BullMQ  | BullMQ         |
|       |      |                | backend, rate- | persistence;   |
|       |      |                | limit store,   | Redis Streams  |
|       |      |                | pub/sub        | for events     |
10

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Component  | Version | Role            | Highlights         | Why Chosen         |
| ---------- | ------- | --------------- | ------------------ | ------------------ |
| BullMQ     | v5.x    | Background Job  | Repeatable         | Battle-tested on   |
|            |         | Queue           | jobs, delayed      | Redis;             |
|            |         |                 | jobs, priorities,  | observability via  |
|            |         |                 | rate-limited       | Bull Board;        |
|            |         |                 | queues, DLQ,       | sandboxed          |
|            |         |                 | flow producer      | processors         |
| JWT (jose) | v5.x    | Authentication  | Access tokens      | Stateless          |
|            |         | Tokens          | (15 min) +         | verification;      |
|            |         |                 | refresh tokens     | horizontal         |
|            |         |                 | (30 d, rotated),   | scaling friendly   |
RS256 signed
| WebSocket   | v4.x | Real-Time Layer | Adaptive        | Bi-directional    |
| ----------- | ---- | --------------- | --------------- | ----------------- |
| (Socket.IO) |      |                 | transport,      | push for chat,    |
|             |      |                 | rooms per       | attendance live,  |
|             |      |                 | tenant+branch,  | dashboards        |
sticky-session
via Redis
adapter
| AWS S3 | —   | Object Storage | Pre-signed       | Durable file   |
| ------ | --- | -------------- | ---------------- | -------------- |
|        |     |                | uploads, server- | storage;       |
|        |     |                | side encryption  | lifecycle to   |
|        |     |                | (SSE-KMS),       | Glacier for    |
|        |     |                | lifecycle to     | archives; KMS  |
|        |     |                | Glacier,         | encryption     |
versioning
| Zod / class- | —   | Validation | DTO validation  | Pipe               |
| ------------ | --- | ---------- | --------------- | ------------------ |
| validator    |     |            | pipeline;       | integration; fail- |
|              |     |            | schema          | fast on invalid    |
|              |     |            | composition;    | input              |
custom
decorators
| Pino | v9.x | Logging | JSON structured  | Low overhead;   |
| ---- | ---- | ------- | ---------------- | --------------- |
|      |      |         | logs, child      | structured for  |
|      |      |         | loggers, redact  | Loki/ELK;       |
|      |      |         | PII, async       | correlation by  |
|      |      |         | transport        | traceId         |
11

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Component     | Version | Role       | Highlights       | Why Chosen       |
| ------------- | ------- | ---------- | ---------------- | ---------------- |
| OpenTelemetry | v1.x    | Tracing /  | Auto-            | Vendor-neutral;  |
|               |         | Metrics    | instrumentation  | spans            |
|               |         |            | for              | correlated to    |
|               |         |            | HTTP/PG/Redis,   | logs             |
custom spans,
OTLP exporter
| Vitest | v1.x | Unit Test  | Native ESM,      | Fast startup;    |
| ------ | ---- | ---------- | ---------------- | ---------------- |
|        |      | Runner     | snapshot, in-    | Jest-compatible  |
|        |      |            | source testing,  | API; TS native   |
coverage via v8
| Testcontainers | v10.x | Integration  | Real Postgres +   | Real DB        |
| -------------- | ----- | ------------ | ----------------- | -------------- |
|                |       | Tests        | Redis containers  | semantics; no  |
|                |       |              | per test run      | mocked Prisma  |
drift
| ESLint + Prettier | v9.x | Linting &  | Import          | Enforce        |
| ----------------- | ---- | ---------- | --------------- | -------------- |
|                   |      | Format     | boundaries      | dependency     |
|                   |      |            | (eslint-plugin- | rules; format  |
|                   |      |            | import),        | consistency    |
functional
patterns, no-
magic-numbers
| Husky + lint- | —   | Pre-commit  | Lint, format,  | Catch issues  |
| ------------- | --- | ----------- | -------------- | ------------- |
| staged        |     | Hooks       | type-check on  | before push;  |
|               |     |             | staged files   | block broken  |
commits
| Compodoc | —   | Module        | Auto-generated  | Living        |
| -------- | --- | ------------- | --------------- | ------------- |
|          |     | Documentation | module          | architecture  |
|          |     |               | diagrams from   | docs          |
NestJS sources
| Helmet +    | —   | HTTP Hardening | CSP, HSTS, no-     | Standard  |
| ----------- | --- | -------------- | ------------------ | --------- |
| compression |     |                | sniff, gzip/brotli | OWASP     |
headers;
payload size
reduction
2.3 Version Pinning Strategy
Production stability सा(cid:2)ठी(cid:7) सावे0 dependencies pinned आहा(cid:17)तो — caret ranges (~) फक्तो patch
updates allow करतो(cid:2)तो, minor/major bumps ली(cid:2) explicit review ली(cid:2)गेतो(cid:15). Lockfile (bun.lock)
12

PreOne Backend TD v1.0 | Backend Architecture Freeze
committed आहा(cid:17) आणि(cid:20) Renovate Bot weekly PRs raise करतो(cid:15) for updates. Critical security
patches emergency channel through release हा(cid:15)तो(cid:2)तो — on-call engineer च्या(cid:2) approval नतो# र 4
hours मध्या (cid:17)deploy.
3. Solution Architecture
PreOne ची(cid:2) backend हा(cid:2) modular monolith architecture follow करतो(cid:15) — single deployable
NestJS application ज्या(cid:2)तो 14 bounded contexts (modules) clean boundaries साहा co-exist
करतो(cid:2)तो. हा(cid:2) decision ADR-003 मध्या(cid:17) documented आहा(cid:17): microservices ची(cid:17) operational overhead
(service discovery, distributed tracing, network failures) टा(cid:2)ळीण्या(cid:2)सा(cid:2)ठी(cid:7) modular monolith प्र(cid:9)थाम
phase मध्या(cid:17) choose क(cid:17) ली(cid:2) आहा(cid:17). जो(cid:17)व्हा(cid:2) specific module ची(cid:7) scale demand वे(cid:2)ढी(cid:17)ली (e.g., AI inference,
Report generation), तो(cid:17)व्हा(cid:2) त्या(cid:2)ली(cid:2) separate microservice म्ध्या(cid:17) extract क(cid:17) ली(cid:17) जो(cid:2)ईली — DDD च्या(cid:2)
bounded context boundaries हा(cid:17) extraction smooth करतो(cid:7)ली.
3.1 Layered Architecture
Backend ची(cid:17) ची(cid:2)र layers आहा(cid:17)तो — Presentation, Application, Domain, Infrastructure. हा(cid:17) layers
DDD च्या(cid:2) standard pattern follow करतो(cid:2)तो आणि(cid:20) dependency rule enforce करतो(cid:2)तो क(cid:7)
dependencies फक्तो inward point करतो(cid:2)तो:
+---------------------------------------------------+
| Presentation Layer (Controllers, DTOs, Guards) |
+---------------------------------------------------+
↓
+---------------------------------------------------+
| Application Layer (Handlers, App Services, UoW) |
+---------------------------------------------------+
↓
+---------------------------------------------------+
| Domain Layer (Aggregates, Entities, VOs, Events) | <-- Pure TS, zero deps
+---------------------------------------------------+
↓ (implements interfaces)
+---------------------------------------------------+
| Infrastructure Layer (Prisma, Redis, S3, BullMQ) |
+---------------------------------------------------+
3.2 Request Lifecycle
प्र(cid:9)त्याक(cid:17) HTTP request खा(cid:2)ली(cid:7)ली stages through जो(cid:2)तो(cid:15). हा(cid:7) traceability observability मध्या(cid:17) critical आहा(cid:17)
— क(cid:15)(cid:20)तो(cid:2)हा(cid:7) bottleneck trace ID न(cid:17) identify क(cid:17) ली(cid:2) जो(cid:2)ऊ शेकतो(cid:15):
• Middleware: traceId generation, request logging, tenantId extraction.
• Guard (JwtAuthGuard): token verification, user context population.
13

PreOne Backend TD v1.0 | Backend Architecture Freeze
• Guard (PermissionsGuard): RBAC check via Casbin policies.
• Pipe (ValidationPipe): DTO class-validator + Zod schema validation.
• Interceptor (LoggingInterceptor): request/response logging with duration.
• Interceptor (CacheInterceptor): Redis cache lookup for GET requests.
• Controller: route handler invocation.
• Handler / Application Service: business orchestration, UoW, event publishing.
• Domain Aggregate: invariant enforcement, state mutation.
• Repository (Prisma): SQL execution, optimistic lock check.
• Outbox: event persistence in same transaction.
• Response: ResponseDto envelope, status code, headers.
• Exception Filter (on error): standardised error response, traceId correlation.
3.3 Cross-Cutting Concerns
क(cid:2)हा(cid:7) concerns सावे0 modules ली(cid:2) apply हा(cid:15)तो(cid:2)तो — तो(cid:17) global modules मध्या(cid:17) implemented आहा(cid:17)तो जो(cid:17)
AppModule मध्या(cid:17) registered आहा(cid:17)तो. या(cid:2)मळी' (cid:17) per-module boilerplate कम(cid:7) हा(cid:15)तो(cid:17) आणि(cid:20) consistency
साणि'नणि6चीतो हा(cid:15)तो(cid:17):
• Logging: Pino global logger with traceId, userId, tenantId auto-injected via
AsyncLocalStorage.
• Validation: Global ValidationPipe with Zod + class-validator, whitelist +
forbidNonWhitelisted.
• Exception Handling: Global ExceptionFilter catching all errors, mapping to standard
response shape.
• Auth: Global JwtAuthGuard with @Public() decorator opt-out for login/health.
• RBAC: Global PermissionsGuard backed by Casbin enforcer (cached in Redis).
• Rate Limiting: Global ThrottlerGuard — per-IP and per-user limits.
• CORS / Helmet: Standard OWASP headers + CORS allowlist.
• OpenTelemetry: Auto-instrumentation for HTTP, PG, Redis, BullMQ — spans auto-
created.
• Trace Context: traceId propagated via W3C Trace Context header (traceparent).
14

PreOne Backend TD v1.0 | Backend Architecture Freeze
3.4 Real-Time Layer
WebSocket (Socket.IO) layer real-time features सा(cid:2)ठी(cid:7) आहा(cid:17) — parent chat, live attendance
dashboard, instant notifications. Multi-instance deployment मध्या(cid:17) Redis adapter वे(cid:2)प्ररून
cross-instance broadcast क(cid:17) ली(cid:17) जो(cid:2)तो(cid:17). Connection authentication JWT न(cid:17) हा(cid:15)तो(cid:17); room join करतो(cid:2)न(cid:2)
tenantId + branchId न(cid:17) namespace isolate क(cid:17) ली(cid:17) जो(cid:2)तो(cid:17) ज्या(cid:2)मळी' (cid:17) cross-tenant data leak हा(cid:15)ऊ शेकतो
न(cid:2)हा(cid:7).
4. Folder Structure
Project folder structure हा(cid:17) developer navigation ची(cid:2) foundation आहा(cid:17). PreOne मध्या (cid:17)strict folder
convention आहा(cid:17) जो(cid:15) ESLint import boundaries न(cid:17) enforce क(cid:17) ली(cid:2) जो(cid:2)तो(cid:15) — क(cid:15)(cid:20)तो(cid:7)हा(cid:7) file wrong
folder मध्या (cid:17)place क(cid:17) ल्या(cid:2)सा lint error यातो(cid:17) (cid:15) आणि(cid:20) build fail हा(cid:15)तो(cid:15). हा(cid:7) discipline onboarding friction कम(cid:7)
करतो(cid:17) आणि(cid:20) code discoverability वे(cid:2)ढीवेतो(cid:17).
4.1 Top-Level Layout
src/ folder च्या(cid:2) खा(cid:2)ली(cid:7)ली top-level directories आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17) directory ची(cid:7) specific responsibility आहा(cid:17)
आणि(cid:20) cross-directory imports णिनयाणिमतो आहा(cid:17)तो:
src/
├── app/ # Bootstrap, global modules, filters, pipes
├── common/ # Shared kernel (errors, types, utils)
├── config/ # Typed config loaders
├── infrastructure/ # Cross-module infra (Prisma, Redis, S3)
├── shared/ # DDD kernel (base entity, VO, spec)
└── modules/ # Business modules (bounded contexts)
├── identity/
├── crm/
├── admissions/
├── student/
├── academics/
├── attendance/
├── communication/
├── finance/
├── inventory/
├── hr/
├── administration/
├── reports/
├── settings/
└── platform/
15

PreOne Backend TD v1.0  |  Backend Architecture Freeze
4.2 Top-Level Directory Roles
| Directory | Responsibility |     | Notes |
| --------- | -------------- | --- | ----- |
app/ Application bootstrap, global  Crown of the process; one-
|     | modules, filters, pipes,  |     | time wiring |
| --- | ------------------------- | --- | ----------- |
interceptors, guards
| common/ | Shared kernel — base          |     | Cross-cutting, dependency- |
| ------- | ----------------------------- | --- | -------------------------- |
|         | classes, error codes, result  |     | free                       |
types, decorators, utilities,
types
| config/ | Typed config loaders (env,  |     | Loaded once at bootstrap |
| ------- | --------------------------- | --- | ------------------------ |
secrets, tenant config,
feature flags)
infrastructure/ Cross-module infra — Prisma  Concrete adapters; domain
|     | client, Redis client, S3 client,  |     | sees only interfaces |
| --- | --------------------------------- | --- | -------------------- |
EventBus, Mailer, BullMQ
registrars
shared/ Shared domain primitives —  DDD kernel reused by all
|     | UoW base, base entity, base  |     | modules |
| --- | ---------------------------- | --- | ------- |
aggregate, value object base,
specification base
modules/ Business modules (one folder  Where the actual product
|     | per bounded context) |     | lives |
| --- | -------------------- | --- | ----- |
4.3 Module Folders
modules/ directory मध्या(cid:17) 14 business domains ची(cid:17) एक folder आहा(cid:17). प्र(cid:9)त्याक(cid:17)  folder स्वेतो7ची(cid:17) sub-
structure follow करतो(cid:15) (Section 5 मध्या(cid:17) detail). नवे(cid:7)न module add करतो(cid:2)न(cid:2) AppModule मध्या (cid:17)
registration + ESLint boundary rule update + Compodoc diagram regenerate ली(cid:2)गेतो(cid:17). Module
list खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20) (cid:17)आहा(cid:17):
| #   | Module | Primary Domain | Approximate API  |
| --- | ------ | -------------- | ---------------- |
Count
| 1   | identity | Users, Roles,  | ~70 |
| --- | -------- | -------------- | --- |
Permissions,
Tenants, Branches
| 2   | crm | Leads, Campaigns,  | ~40 |
| --- | --- | ------------------ | --- |
Conversions
16

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| #   | Module | Primary Domain | Approximate API  |
| --- | ------ | -------------- | ---------------- |
Count
| 3   | admissions | Applications,  | ~50 |
| --- | ---------- | -------------- | --- |
Counselling,
Approvals
| 4   | student | Student Lifecycle,  | ~55 |
| --- | ------- | ------------------- | --- |
Profiles, Guardians
| 5   | academics | Curriculum,  | ~60 |
| --- | --------- | ------------ | --- |
Observations, Report
Cards
| 6   | attendance | Daily Attendance,  | ~35 |
| --- | ---------- | ------------------ | --- |
Arrival, Pickup
| 7   | communication | Announcements,  | ~50 |
| --- | ------------- | --------------- | --- |
Chat, Notifications
| 8   | finance | Fees, Invoices,  | ~80 |
| --- | ------- | ---------------- | --- |
Payments, Ledger,
GST
| 9   | inventory | Items, Stock, PR, PO,  | ~45 |
| --- | --------- | ---------------------- | --- |
GRN
| 10  | hr  | Staff, Payroll, Leave,  | ~45 |
| --- | --- | ----------------------- | --- |
Attendance
| 11  | administration | Assets, Maintenance,  | ~25 |
| --- | -------------- | --------------------- | --- |
Visitors
| 12  | reports | Cross-domain  | ~30 |
| --- | ------- | ------------- | --- |
Reports, Analytics
| 13  | settings | Academic Years,  | ~20 |
| --- | -------- | ---------------- | --- |
Calendars, Configs
| 14  | platform | Subscriptions, Billing,  | ~25 |
| --- | -------- | ------------------------ | --- |
Feature Flags
5. Module Structure
PreOne ची(cid:2) प्र(cid:9)त्याक(cid:17)  business domain identical folder template follow करतो(cid:15). हा(cid:17) consistency
onboarding friction कम(cid:7) करतो (cid:17)— developer एक module णिशेकल्या(cid:2)वेर दासा' र(cid:2) module navigate कर(cid:20) (cid:17)
intuitive हा(cid:15)तो(cid:17). Template DDD patterns (aggregates, repositories, domain events) आणि(cid:20) NestJS
conventions (module, controllers, providers) ची(cid:2) hybrid आहा(cid:17).
17

PreOne Backend TD v1.0 | Backend Architecture Freeze
5.1 Module Template (student/ example)
खा(cid:2)ली(cid:7)ली tree student/ module ची(cid:17) complete structure दा(cid:2)खावेतो(cid:17). हा(cid:17)ची pattern सावे0 14 modules सा(cid:2)ठी(cid:7)
apply हा(cid:15)तो(cid:17) — फक्तो folder name बदालीतो(cid:17):
student/
├── controllers/ # HTTP controllers
├── application/
│ ├── commands/ # CQRS command objects
│ ├── queries/ # CQRS query objects
│ ├── handlers/ # Command & query handlers
│ ├── dto/ # Request/Response DTOs
│ ├── mappers/ # DTO ↔ Domain ↔ Persistence
│ └── services/ # Application services (orchestration)
├── domain/
│ ├── aggregates/ # Aggregate roots + child entities
│ ├── entities/ # Entities inside aggregates
│ ├── value-objects/ # Immutable VOs (Address, Money)
│ ├── repositories/ # Repository interfaces (ports)
│ ├── services/ # Domain services (pure rules)
│ ├── events/ # Domain event classes
│ ├── policies/ # Business policies
│ └── specifications/ # Spec pattern (predicates)
├── infrastructure/
│ ├── prisma/ # Prisma schema slice + client
│ ├── repositories/ # Prisma-backed implementations
│ ├── cache/ # Redis cache wrappers
│ ├── events/ # Event bus adapters
│ └── jobs/ # BullMQ producers + processors
├── presentation/ # Presenters (view-models)
└── student.module.ts # NestJS module wiring
5.2 Directory Responsibilities
प्र(cid:9)त्याक(cid:17) sub-directory ची(cid:7) specific responsibility आहा(cid:17). खा(cid:2)ली(cid:7)ली table सावे0 directories ची(cid:17) purpose +
boundaries document करतो(cid:17):
Directory Responsibility Critical Rule
controllers/ HTTP controllers — Controllers MUST NOT
versioned, route mapped, contain business logic; only
Swagger tagged DTO validation + dispatch
application/commands/ CQRS command objects e.g.,
(immutable, validated) CreateStudentCommand,
PromoteStudentCommand
18

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Directory | Responsibility | Critical Rule |
| --------- | -------------- | ------------- |
application/queries/ CQRS query objects for read  e.g., GetStudentByIdQuery,
|     | side | SearchStudentsQuery |
| --- | ---- | ------------------- |
application/handlers/ Command & query handlers  Single handler per
|     | — orchestrate aggregate +  | command/query;  |
| --- | -------------------------- | --------------- |
|     | UoW + events               | Idempotent via  |
idempotency-key
application/dto/ Request/Response DTOs +  Zod schemas + class-validator
|     | mappers | decorators + Swagger  |
| --- | ------- | --------------------- |
metadata
application/mappers/ DTO ↔ Domain ↔  Three-way mapping; never
|     | Persistence mappers | leak Prisma types to  |
| --- | ------------------- | --------------------- |
controllers
application/services/ Application services — multi- Coordinate repositories;
|     | aggregate orchestration,  | publish integration events |
| --- | ------------------------- | -------------------------- |
transactional
domain/aggregates/ Aggregate roots + child  Pure TS; zero infra deps;
|     | entities | enforce invariants |
| --- | -------- | ------------------ |
domain/entities/ Entities inside aggregates  Only mutate via aggregate
|     | (identity within parent) | root |
| --- | ------------------------ | ---- |
domain/value-objects/ Immutable value objects  Equals by value; throw on
|     | (Address, Money, Age,  | invalid construction |
| --- | ---------------------- | -------------------- |
TimeWindow)
domain/repositories/ Repository interfaces (port) Implemented in
infrastructure/; mockable in
tests
| domain/services/ | Domain services — pure  | No state; no IO |
| ---------------- | ----------------------- | --------------- |
business rules involving
multiple aggregates
domain/events/ Domain event classes Past-tense; serialisable;
versioned schema
domain/policies/ Business policies (e.g.,  Decision tables; pure
|     | RefundPolicy, LateFeePolicy) | functions |
| --- | ---------------------------- | --------- |
domain/specifications/ Specification pattern for  Composable
|     | complex predicate logic | with .and(), .or(), .not() |
| --- | ----------------------- | -------------------------- |
19

PreOne Backend TD v1.0 | Backend Architecture Freeze
Directory Responsibility Critical Rule
infrastructure/prisma/ Prisma schema slice + client Per-module Prisma schema
wiring fragment
infrastructure/repositories/ Concrete Prisma-backed Map Prisma rows ↔ domain
repository implementations aggregates
infrastructure/cache/ Redis cache wrappers (read- TTL + invalidation versioned
through, write-through) by cache key prefix
infrastructure/events/ Event bus adapters — in- Outbox pattern for cross-
memory (sync) + Redis aggregate reliability
Streams (async)
infrastructure/jobs/ BullMQ job producers + Worker isolation; sandboxed
processors for this module processors
presentation/ Presenters — format domain View-model layer; keeps
responses for DTOs clean
HTTP/WebSocket views
student.module.ts NestJS module wiring — Single source of DI graph
providers, controllers,
imports, exports
5.3 Module Wiring (student.module.ts)
प्र(cid:9)त्याक(cid:17) module ची(cid:7) .module.ts file NestJS DI container ची(cid:2) configuration point आहा(cid:17). हा(cid:7) file
imports, providers, controllers, exports declare करतो(cid:17). हा (cid:17)wiring ADR-007 मध्या (cid:17)defined pattern
follow करतो(cid:17) — providers list मध्या(cid:17) interfaces bind क(cid:17) ल्या(cid:2) जो(cid:2)तो(cid:2)तो concrete implementations साहा,
ज्या(cid:2)मळी' (cid:17) testing मध्या (cid:17)swap कर(cid:20) (cid:17)सा(cid:15)प्र(cid:17) हा(cid:15)तो(cid:17):
@Module({
imports: [
PrismaModule,
RedisModule,
EventBusModule,
BullmqModule.registerQueue({ name: 'student-jobs' }),
],
controllers: [StudentsController, StudentProfileController],
providers: [
// Application
CreateStudentHandler,
UpdateStudentHandler,
GetStudentHandler,
SearchStudentsHandler,
StudentMapper,
// Domain
20

PreOne Backend TD v1.0 | Backend Architecture Freeze
{ provide: 'StudentRepository', useClass: PrismaStudentRepository },
StudentFactory,
AgeEligibilitySpecification,
// Infrastructure
StudentCache,
{ provide: 'StudentEventBus', useClass: RedisStreamEventBus },
],
exports: ['StudentRepository', 'StudentEventBus'],
})
export class StudentModule {}
6. Dependency Rules
Dependency rules हा(cid:17) architecture ची(cid:17) enforcement mechanism आहा(cid:17)तो. हा(cid:17) rules ESLint plugin
(eslint-plugin-import) न (cid:17)code level प्रर enforce क(cid:17) ली (cid:17)जो(cid:2)तो(cid:2)तो — violation सा(cid:2)ठी(cid:7) lint error यातो(cid:17) (cid:15) आणि(cid:20)
build fail हा(cid:15)तो(cid:15). या(cid:2)मळी' (cid:17) architecture drift detect हा(cid:15)तो(cid:15) जो(cid:17)व्हा(cid:2) developer accidentally wrong layer
import करतो(cid:15).
6.1 Layer-to-Layer Rules
खा(cid:2)ली(cid:7)ली table सावे0 possible layer-to-layer import combinations ची(cid:7) status document करतो(cid:17).
'Allowed' णिक#वे(cid:2) 'Forbidden' tags strict enforcement साणि-चीतो करतो(cid:2)तो:
From → To Status Notes
Presentation → Application Allowed Controllers call application
services / command handlers
Presentation → Domain Forbidden Controllers must never touch
aggregates/entities directly
Presentation → Forbidden Controllers must never
Infrastructure import Prisma/Redis/S3
Application → Domain Allowed Handlers orchestrate
aggregates via repository
ports
Application → Infrastructure Allowed (via interfaces) Repositories injected as
abstractions; never concrete
class
Application → Presentation Forbidden No back-flow into
DTOs/controllers
Domain → Application Forbidden Domain knows nothing about
use cases
21

PreOne Backend TD v1.0 | Backend Architecture Freeze
From → To Status Notes
Domain → Infrastructure Forbidden Domain is pure TypeScript;
zero NestJS/Prisma imports
Domain → Domain Allowed (same module) Cross-module imports
forbidden — use integration
events
Infrastructure → Domain Allowed (implements Repos implement domain-
interfaces) side ports
Infrastructure → Application Forbidden Infra must not know about
handlers
Cross-module direct imports Forbidden Modules talk via ACL (Anti-
Corruption Layer) or events
6.2 Cross-Module Communication
Modules एकम(cid:17)क(cid:2)शे# (cid:7) direct imports करू शेकतो न(cid:2)हा(cid:7)तो — हा(cid:17) strict rule आहा(cid:17). Cross-module
communication खा(cid:2)ली(cid:7)ली patterns through हा(cid:15)तो(cid:17):
• Integration Events (Async): Redis Stream प्रर event publish करून consumer module
subscribe करतो(cid:15). Most common pattern — eventual consistency acceptable.
• HTTP Call (Sync): Same-process module-to-module call internal HTTP endpoint वेर.
Used when immediate response required (e.g., Admissions → Identity for student
ID).
• ACL (Anti-Corruption Layer): Calling module त्या(cid:2)च्या(cid:2) own context मध्या (cid:17)translation
layer ठी(cid:17)वेतो(cid:17) जो(cid:15) external module ची (cid:17)model translate करतो(cid:15). Prevents model pollution.
• Shared Kernel: common/ आणि(cid:20) shared/ directories मधी(cid:7)ली code सावे0 modules import
करू शेकतो(cid:2)तो — base classes, error types, utilities.
• Read Model Projection: Module दासा' ऱ्या(cid:2) module ची(cid:2) read-only data ची(cid:7) copy ठी(cid:17)वेतो(cid:17) via
event subscription (CQRS pattern). Avoids cross-module queries.
6.3 ESLint Configuration
Import boundary rules ESLint config मध्या(cid:17) defined आहा(cid:17)तो. खा(cid:2)ली(cid:7)ली snippet rules ची(cid:2) essence
दा(cid:2)खावेतो(cid:15) — full config repo मध्या (cid:17).eslintrc.js मध्या (cid:17)आहा(cid:17):
'import/no-restricted-paths': ['error', {
zones: [
// Controllers cannot import domain or infra
22

PreOne Backend TD v1.0  |  Backend Architecture Freeze
    { target: './src/modules/**/controllers', from: './src/modules/**/domain' },
    { target: './src/modules/**/controllers', from:
'./src/modules/**/infrastructure' },
    // Domain cannot import anything external
    { target: './src/modules/**/domain', from: './src/modules/**/application' },
    { target: './src/modules/**/domain', from: './src/modules/**/infrastructure' },
    { target: './src/modules/**/domain', from: './node_modules' },
    // Cross-module imports forbidden
    { target: './src/modules/identity', from: './src/modules/finance' },
    // ... one entry per module pair
  ],
}],
7. Controllers
Controllers फक्तो HTTP layer handle करतो(cid:7)ली. Controllers मध्या(cid:17) business logic नसा(cid:20)(cid:2)र — हा(cid:2) DDD
coding guideline ची(cid:2) main णिनयाम आहा(cid:17). Controller ची(cid:2) responsibility सा(cid:7)णिमतो आहा(cid:17): request receive
कर(cid:20),(cid:17) validate कर(cid:20),(cid:17) application layer कडो(cid:17) delegate कर(cid:20),(cid:17) response format करून return कर(cid:20).(cid:17)
Business decisions handler णिक#वे(cid:2) domain aggregate मध्या (cid:17)हा(cid:15)तो(cid:2)तो.
7.1 Controller Responsibilities
खा(cid:2)ली(cid:7)ली table प्र(cid:9)त्याक(cid:17)  controller responsibility ची(cid:17) detail दातो(cid:17) (cid:17). हा(cid:17) responsibilities ADR-008 मध्या (cid:17)
defined आहा(cid:17)तो आणि(cid:20) PR review मध्या (cid:17)verify क(cid:17) ली (cid:17)जो(cid:2)तो(cid:2)तो:
| Responsibility | Mechanism | Notes |
| -------------- | --------- | ----- |
Route Mapping @Controller('v1/students'),  Path includes /v1/ for
|     | @Get(':id'), @Post() —  | forward compatibility |
| --- | ----------------------- | --------------------- |
versioned URLs
Authentication @UseGuards(JwtAuthGuard)  Global guard; opt-out via
|     | — verifies JWT, populates  | @Public() for login/health |
| --- | -------------------------- | -------------------------- |
req.user
Authorization @Permissions('students:read Custom decorator backed by
|                | ') — RBAC data scope check | Casbin policies                 |
| -------------- | -------------------------- | ------------------------------- |
| DTO Validation | @Body() dto:               | Fail fast on schema violation;  |
|                | CreateStudentDto — class-  | 422 response                    |
validator + Zod pipe
Response Formatting Returns ResponseDto<T>  Consistent { success, data,
|                  | envelope        | traceId } shape           |
| ---------------- | --------------- | ------------------------- |
| OpenAPI Metadata | @ApiOperation,  | Swagger UI auto-generated |
@ApiResponse, @ApiTags
23

PreOne Backend TD v1.0 | Backend Architecture Freeze
Responsibility Mechanism Notes
Idempotency @Idempotent() decorator for Key from header or body
POST/PUT hash; 24h TTL in Redis
Rate Limiting @Throttle(20, 60) per route Bullhorn or per-IP + per-user
7.2 Controller Anti-Patterns
खा(cid:2)ली(cid:7)ली anti-patterns PR review मध्या (cid:17)block क(cid:17) ली (cid:17)जो(cid:2)तो(cid:7)ली. क(cid:15)(cid:20)तो(cid:2)हा(cid:7) controller या(cid:2)प्र;क(cid:7) क(cid:15)(cid:20)तो(cid:2) pattern
exhibit करतो असाली(cid:17) तोर PR reject हा(cid:15)ईली आणि(cid:20) refactor request क(cid:17) ली(cid:2) जो(cid:2)ईली:
• Business logic in controller (use handler instead)
• Direct Prisma calls in controller (use application service)
• Returning domain entities from controller (return DTOs only)
• Conditional logic beyond input validation (move to handler)
• Catching business exceptions (let global filter handle them)
• Multiple responsibilities per route (split into separate endpoints)
• Skipping Swagger metadata (every route must be documented)
• Using req.body raw without DTO (always validate)
7.3 Example — POST /v1/students
खा(cid:2)ली(cid:7)ली example सावे0 layers कसा(cid:17) coordinate करतो(cid:2)तो तो(cid:17) दा(cid:2)खावेतो(cid:17). Controller फक्तो orchestration
करतो(cid:15) — actual business logic aggregate मध्या,(cid:17) persistence repository मध्या,(cid:17) event publishing
application service मध्या:(cid:17)
@Controller('v1/students')
@ApiTags('students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentsController {
constructor(
private readonly commandBus: CommandBus,
private readonly queryBus: QueryBus,
) {}
@Post()
@Permissions('students:create')
@Idempotent({ ttl: 86400 })
@ApiOperation({ summary: 'Create new student' })
@ApiResponse({ status: 201, type: StudentResponseDto })
async create(
@Body() dto: CreateStudentDto,
24

PreOne Backend TD v1.0 | Backend Architecture Freeze
@ReqUser() user: AuthenticatedUser,
): Promise<ResponseDto<StudentResponseDto>> {
const command = new CreateStudentCommand(dto, user);
const student = await this.commandBus.execute(command);
return ResponseDto.success(StudentMapper.toResponse(student));
}
}
// Flow:
// POST /students
// ↓
// CreateStudentCommand (validated DTO)
// ↓
// CreateStudentHandler (orchestration + UoW)
// ↓
// StudentAggregate (invariants enforced)
// ↓
// StudentRepository.save() (Prisma persistence)
// ↓
// StudentCreatedEvent (outbox → Redis Stream)
8. DTOs
Data Transfer Objects (DTOs) हा(cid:7) process / network boundaries प्रर data carry करण्या(cid:2)ची(cid:2)
mechanism आहा(cid:17). PreOne मध्या (cid:17)DTOs ची(cid:7) strict typing आणि(cid:20) validation असातो(cid:17) — क(cid:15)(cid:20)तो(cid:2)हा(cid:7) untyped
payload accept हा(cid:15)तो न(cid:2)हा(cid:7). हा(cid:17) discipline type safety end-to-end साणि'नणि6चीतो करतो(cid:17) आणि(cid:20) runtime
errors compile-time ली(cid:2) move हा(cid:15)तो(cid:2)तो.
8.1 DTO Types
PreOne मध्या (cid:17)8 primary DTO types आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17) type ची(cid:7) specific purpose आहा (cid:17)आणि(cid:20) त्या(cid:2)च्या(cid:2) वेर खा(cid:2)सा
decorators apply हा(cid:15)तो(cid:2)तो:
DTO Class Type Endpoint Purpose
CreateStudentDto Request POST /v1/students All required +
optional fields,
validation
decorators, Swagger
metadata
UpdateStudentDto Request PATCH PartialType(CreateSt
/v1/students/:id udentDto) — all
fields optional
25

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| DTO Class | Type | Endpoint | Purpose |
| --------- | ---- | -------- | ------- |
StudentResponseDto Response GET /v1/students/:id Sanitised output;
never includes PII
like Aadhaar
StudentListItemDto Response GET /v1/students Lightweight fields for
list view; pagination
metadata
StudentFilterDto Query GET /v1/students? Filterable fields, sort
|     |     | filter[...] | spec, pagination  |
| --- | --- | ----------- | ----------------- |
params
| StudentSearchDto | Query | GET                 | Full-text search     |
| ---------------- | ----- | ------------------- | -------------------- |
|                  |       | /v1/students/search | query, fuzzy match,  |
suggestions
| BulkCreateStudentDt | Request | POST              | Array of            |
| ------------------- | ------- | ----------------- | ------------------- |
| o                   |         | /v1/students/bulk | CreateStudentDto +  |
idempotency key per
item
| StudentExportDto | Query | GET                 | Filter + format   |
| ---------------- | ----- | ------------------- | ----------------- |
|                  |       | /v1/students/export | (xlsx/csv/pdf) +  |
columns spec
8.2 DTO Rules
खा(cid:2)ली(cid:7)ली rules सावे0 DTOs सा(cid:2)ठी(cid:7) mandatory आहा(cid:17)तो. PR review मध्या (cid:17)verify क(cid:17) ली (cid:17)जो(cid:2)तो (cid:17)क(cid:7) नवे(cid:7)न DTO या(cid:2)प्र;क(cid:7)
प्र(cid:9)त्याक(cid:17)
 rule follow करतो आहा(cid:17):
•  Every DTO must extend a base DTO with traceId + correlationId
•  Request DTOs use class-validator decorators (@IsString, @IsEmail, @MinLength,
etc.)
•  Request DTOs also define Zod schema for runtime validation (double-layer)
•  Response DTOs use @ApiProperty with example values for Swagger
•  PII fields in response DTOs masked via @Mask('***-**-****') decorator
•  Never expose internal domain entity types in DTOs — always map via Presenter
•  DTOs are immutable (readonly fields) — modification is anti-pattern
•  Bulk operations use array DTO with maxItems=500 enforced
•  Date fields use ISO-8601 string (not Date object) for portability
26

PreOne Backend TD v1.0 | Backend Architecture Freeze
• Money fields stored as integer minor units (paise) with currency code
• Pagination cursor is opaque base64 — never decoded client-side
• Every breaking DTO change requires DTO version bump (V2 suffix)
8.3 Example — CreateStudentDto
खा(cid:2)ली(cid:7)ली example complete DTO definition दा(cid:2)खावेतो(cid:17) — class-validator decorators, Zod schema,
Swagger metadata एक(cid:2)ची file मध्या.(cid:17) हा(cid:17) triple validation belt type safety maximum करतो(cid:17):
export class CreateStudentDto {
@ApiProperty({ example: 'Aarav', description: 'Student first name' })
@IsString() @MinLength(1) @MaxLength(50)
@Matches(/^[\p{L}\s.'-]+$/u, { message: 'Invalid name format' })
readonly firstName!: string;
@ApiProperty({ example: 'Sharma', description: 'Student last name' })
@IsString() @MinLength(1) @MaxLength(50)
readonly lastName!: string;
@ApiProperty({ example: '2019-05-15', description: 'Date of birth (ISO-8601)'
})
@IsDateString() @IsBeforeThan('today')
readonly dateOfBirth!: string;
@ApiProperty({ example: 'MALE', enum: Gender })
@IsEnum(Gender)
readonly gender!: Gender;
@ApiProperty({ type: () => AddressDto })
@ValidateNested() @Type(() => AddressDto)
readonly address!: AddressDto;
@ApiProperty({ type: () => [GuardianDto], minItems: 1 })
@ValidateNested({ each: true }) @Type(() => GuardianDto)
@ArrayMinSize(1)
readonly guardians!: GuardianDto[];
}
// Zod schema for runtime validation (double-layer)
export const CreateStudentSchema = z.object({
firstName: z.string().min(1).max(50),
lastName: z.string().min(1).max(50),
dateOfBirth: z.string().datetime(),
gender: z.nativeEnum(Gender),
address: AddressSchema,
guardians: z.array(GuardianSchema).min(1),
});
27

PreOne Backend TD v1.0  |  Backend Architecture Freeze
9. Application Services
Application Services हा (cid:17)workflow orchestration ची (cid:17)hub आहा(cid:17)तो. तो (cid:17)transaction boundaries define
करतो(cid:2)तो, aggregates coordinate करतो(cid:2)तो, आणि(cid:20) integration events publish करतो(cid:2)तो. Domain logic
त्या(cid:2)च्# या(cid:2) आतो नसातो(cid:17) — तो(cid:17) फक्तो glue code आहा(cid:17) जो(cid:17) domain layer कडो(cid:17) delegate करतो(cid:17). या(cid:2)मळी' (cid:17) domain
layer pure र(cid:2)हातो(cid:17) आणि(cid:20) application concerns (transactions, events) isolated हा(cid:15)तो(cid:2)तो.
9.1 Responsibilities
| Responsibility | Mechanism | Example |
| -------------- | --------- | ------- |
Workflow Orchestration Coordinate multiple  EnrollStudentService →
|     | aggregates in a single  | Student + Enrollment +  |
| --- | ----------------------- | ----------------------- |
|     | transaction             | Invoice + FeePlan       |
Transaction Boundary Define UoW scope,  Single aggregate = single
|     | commit/rollback | transaction; multi-aggregate  |
| --- | --------------- | ----------------------------- |
via saga
Event Publishing Dispatch domain events after  Outbox pattern — events
|     | commit | written to DB, then published  |
| --- | ------ | ------------------------------ |
async
Cross-Domain Coordination Call ACL of another bounded  Finance → Identity ACL for
|     | context | user lookup |
| --- | ------- | ----------- |
Authorization Decision Check permissions before  @PreAuthorize decorator or
|     | invoking domain | explicit check |
| --- | --------------- | -------------- |
Caching Decision Read-through cache for read- Idempotent reads only;
|     | heavy paths | cache key = method  |
| --- | ----------- | ------------------- |
signature + args
Idempotency Enforcement Check idempotency-key in  Return cached response if
|     | Redis | key exists; else compute +  |
| --- | ----- | --------------------------- |
cache
| Audit Trail | Persist who did what when | Audit log entry per  |
| ----------- | ------------------------- | -------------------- |
command, immutable
9.2 Transaction Boundary Pattern
Application service हा(cid:2) transaction boundary आहा(cid:17). प्र(cid:9)त्याक(cid:17)
 public method एक(cid:2) UoW मध्या(cid:17) wrap
क(cid:17) लीली(cid:17) (cid:2) असातो(cid:15) — commit सावे0 operations successful असाल्या(cid:2)वेर हा(cid:15)तो(cid:15), rollback क(cid:15)(cid:20)तो(cid:7)हा(cid:7) exception
आल्या(cid:2)सा हा(cid:15)तो(cid:15). या(cid:2)मळी' (cid:17) partial state updates prevent हा(cid:15)तो(cid:2)तो:
28

PreOne Backend TD v1.0 | Backend Architecture Freeze
@Injectable()
export class EnrollStudentService {
constructor(
@Inject('StudentRepository') private students: StudentRepository,
@Inject('EnrollmentRepository') private enrollments: EnrollmentRepository,
@Inject('InvoiceRepository') private invoices: InvoiceRepository,
private readonly uow: UnitOfWork,
private readonly eventBus: EventBus,
) {}
async execute(cmd: EnrollStudentCommand): Promise<Enrollment> {
return this.uow.execute(async (txn) => {
// 1. Fetch aggregates
const student = await this.students.findByIdOrThrow(cmd.studentId, txn);
const section = await this.sections.findByIdOrThrow(cmd.sectionId, txn);
// 2. Domain operation (pure business logic)
const enrollment = student.enroll(section, cmd.academicYearId);
// 3. Generate invoice (domain event raised inside)
const invoice = student.generateInvoiceForTerm(cmd.feePlanId);
// 4. Persist
await this.students.save(student, txn);
await this.enrollments.save(enrollment, txn);
await this.invoices.save(invoice, txn);
// 5. Publish events (via outbox - same txn)
await this.eventBus.publishAll(student.pullEvents(), txn);
return enrollment;
});
}
}
10. Domain Services
Domain Services हा(cid:17) pure business rules encapsulate करतो(cid:2)तो जो(cid:17) single aggregate मध्या(cid:17) fit हा(cid:15)तो
न(cid:2)हा(cid:7)तो. उदा(cid:2). FeeCalculationService हा(cid:17) FeePlan, Concession, LateFee या(cid:2) तो(cid:7)न aggregates ची(cid:2)
combination वे(cid:2)प्ररून final invoice amount calculate करतो(cid:15). Domain Service ली(cid:2) state नसातो(cid:17), IO
नसातो(cid:17) — फक्तो pure functions. या(cid:2)मळी' (cid:17) तो(cid:17) 100% unit testable असातो(cid:2)तो.
29

PreOne Backend TD v1.0 | Backend Architecture Freeze
10.1 Responsibilities
Responsibility Description Example
Pure Business Rules Encapsulate logic that FeeCalculationService —
doesn't fit a single aggregate combines FeePlan +
Concession + LateFee
Aggregate Coordination Coordinate multiple TransferStudentService
aggregates without moves student between
persistence sections
Policy Execution Apply business policies RefundPolicy decides refund
amount given cancellation
date
Specification Composition Chain specifications for EligibilitySpec =
complex predicates AgeSpec.and(DocumentSpec)
.and(PaymentSpec)
Invariant Enforcement Validate cross-entity No two students same roll
invariants number in same section
State Transitions Aggregate state machine AdmissionAggregate.advance
decisions State() checks allowed
transitions
10.2 Example — FeeCalculationService
खा(cid:2)ली(cid:7)ली example domain service ची (cid:17)pure nature दा(cid:2)खावेतो (cid:17)— क(cid:15)(cid:20)तो(cid:17)हा(cid:7) side effects न(cid:2)हा(cid:7)तो, क(cid:15)(cid:20)तो(cid:17)हा(cid:7) IO
न(cid:2)हा(cid:7). सावे0 inputs parameters through यातो(cid:17) (cid:2)तो आणि(cid:20) output return हा(cid:15)तो(cid:15). हा(cid:17) testing सा(cid:15)प्र(cid:17) करतो(cid:17) आणि(cid:20)
concurrency issues eliminate करतो(cid:17):
export class FeeCalculationService {
calculate(
feePlan: FeePlan,
concessions: Concession[],
lateFeePolicy: LateFeePolicy,
asOfDate: Date,
): FeeBreakdown {
// 1. Base fee from plan
const baseFee = feePlan.totalAmount;
// 2. Apply concessions (in priority order)
const concessionAmount = concessions.reduce(
(sum, c) => sum + c.apply(baseFee),
0 as Money,
);
30

PreOne Backend TD v1.0 | Backend Architecture Freeze
// 3. Calculate late fee if past due
const lateFee = lateFeePolicy.calculate(
feePlan.dueDate,
asOfDate,
baseFee.minus(concessionAmount),
);
// 4. Tax (GST on applicable components)
const taxableAmount = baseFee.minus(concessionAmount);
const tax = TaxCalculator.gst(taxableAmount, feePlan.taxRate);
// 5. Final breakdown
return new FeeBreakdown({
baseFee,
concessionAmount,
lateFee,
tax,
total: baseFee.minus(concessionAmount).plus(lateFee).plus(tax),
});
}
}
11. Repositories
Repositories हा (cid:17)aggregate persistence ची (cid:17)abstraction आहा(cid:17)तो. Domain layer ली(cid:2) कसा (cid:17)data store हा(cid:15)तो(cid:17)
हा (cid:17)म(cid:2)णिहातो नसातो (cid:17)— तो (cid:17)फक्तो repository interface (port) शे(cid:7) interact करतो(cid:17). Concrete implementation
(Prisma-backed) infrastructure layer मध्या (cid:17)आहा(cid:17). या(cid:2)मळी' (cid:17) domain layer pure र(cid:2)हातो(cid:17) आणि(cid:20) testing मध्या (cid:17)
in-memory repository substitute क(cid:17) ली(cid:7) जो(cid:2)ऊ शेकतो(cid:17).
11.1 Repository Interface Contract
प्र(cid:9)त्याक(cid:17) aggregate ची(cid:2) एक repository आहा(cid:17). खा(cid:2)ली(cid:7)ली interface methods standard आहा(cid:17)तो — सावे0
repositories या(cid:2)प्र;क(cid:7) णिकम(cid:2)न methods implement करतो(cid:2)तो. Aggregate-specific queries (e.g.,
findByRollNumber) additional methods through add हा(cid:15)तो(cid:2)तो:
Method Returns Notes
findById(id) Student | null Single aggregate by id;
returns null if not found or
soft-deleted
findByIdOrThrow(id) Student Throws NotFoundException if
missing — fail-fast path
31

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Method | Returns | Notes |
| ------ | ------- | ----- |
findBySpecification(spec,  Student[] Specification pattern query;
| opts) |     | opts = pagination/sort |
| ----- | --- | ---------------------- |
findOneBySpecification(spec) Student | null Convenience for unique
matches
| countBySpecification(spec) | number | For pagination totals;  |
| -------------------------- | ------ | ----------------------- |
cheaper than full fetch
| save(aggregate) | void | Insert or update (decides by  |
| --------------- | ---- | ----------------------------- |
presence of id); writes within
UoW
| delete(id) | void | Soft-delete (sets deletedAt);  |
| ---------- | ---- | ------------------------------ |
hard delete only via admin
tooling
| lock(id, mode) | Student | Pessimistic lock for  |
| -------------- | ------- | --------------------- |
concurrent writes (SELECT
FOR UPDATE)
versionedSave(aggregate,  void Optimistic locking — fails on
| expectedVersion)   |     | version mismatch             |
| ------------------ | --- | ---------------------------- |
| beginTransaction() | UoW | Returns unit-of-work handle  |
for explicit control
11.2 Repository Rules
खा(cid:2)ली(cid:7)ली rules repository implementation discipline साणि'नणि6चीतो करतो(cid:2)तो. या(cid:2)तो(cid:7)ली बऱ्या(cid:2)ची rules ESLint
न(cid:17) enforce हा(cid:15)तो(cid:2)तो — ब(cid:2)क(cid:7) PR review मध्या (cid:17)check हा(cid:15)तो(cid:2)तो:
•  Repository returns domain aggregate (not Prisma model)
•  Repository does not publish events — that's the application service's job
•  Repository methods are within UoW; commit happens at application layer
•  One repository per aggregate root — not per entity
•  Repository interface lives in domain/, implementation in infrastructure/
•  Bulk operations use bulkSave() not looped save() — single SQL round-trip
•  Read-only queries bypass aggregate — direct Prisma read for performance
•  Caching layer wraps repository, transparent to caller
•  No SQL in repository — use Prisma query builder; raw SQL only via approved DAO
32

PreOne Backend TD v1.0 | Backend Architecture Freeze
• Repository never throws business exceptions — only infrastructure exceptions
11.3 Example — PrismaStudentRepository
Concrete implementation प्र(cid:9)त्याक(cid:17) interface method ची (cid:17)Prisma translation करतो(cid:17). Aggregate ↔
Prisma row mapping mapper class through हा(cid:15)तो(cid:17) जो(cid:15) three-way translation (DTO ↔ Domain
↔ Prisma) handle करतो(cid:15):
@Injectable()
export class PrismaStudentRepository implements StudentRepository {
constructor(private readonly prisma: PrismaClient) {}
async findById(id: UUID, txn?: PrismaTransaction): Promise<Student | null>
{
const row = await this.prisma.student.findFirst({
where: { id: id.toString(), deletedAt: null },
include: { guardians: true, address: true },
});
return row ? StudentMapper.toDomain(row) : null;
}
async save(student: Student, txn?: PrismaTransaction): Promise<void> {
const data = StudentMapper.toPersistence(student);
const client = txn ?? this.prisma;
if (student.isNew()) {
await client.student.create({ data });
} else {
// Optimistic locking
const result = await client.student.updateMany({
where: { id: student.id.toString(), version: student.expectedVersion },
data: { ...data, version: { increment: 1 } },
});
if (result.count === 0) {
throw new ConflictException('VERSION_MISMATCH',
'Student was modified by another transaction');
}
}
}
}
12. CQRS
CQRS (Command Query Responsibility Segregation) हा(cid:2) pattern reads आणि(cid:20) writes ली(cid:2) separate
करतो(cid:15). PreOne मध्या (cid:17)CQRS फक्तो complex workflows मध्या (cid:17)वे(cid:2)प्ररली(cid:2) जो(cid:2)ईली, प्र(cid:9)त्याक(cid:17) CRUD endpoint मध्या (cid:17)
न(cid:2)हा(cid:7). हा(cid:2) ADR-012 ची(cid:2) decision आहा(cid:17) — simple CRUD operations सा(cid:2)ठी(cid:7) CQRS overhead justify हा(cid:15)तो
33

PreOne Backend TD v1.0 | Backend Architecture Freeze
न(cid:2)हा(cid:7), प्र(cid:20) multi-aggregate workflows (admissions → enrollment → invoice) सा(cid:2)ठी(cid:7)
command/query separation clarity दातो(cid:17) (cid:17).
12.1 When to Use CQRS
CQRS use करण्या(cid:2)ची(cid:17) clear criteria आहा(cid:17)तो. हा(cid:17) criteria ADR-012 मध्या(cid:17) documented आहा(cid:17)तो आणि(cid:20)
architect च्या(cid:2) approval नतो# र वे(cid:2)प्रर(cid:2)वे(cid:17) ली(cid:2)गेतो(cid:2)तो:
• Multi-aggregate workflows (3+ aggregates coordinated) — Admission approval
involves Application + Student + Invoice.
• Read/write asymmetry — heavy reads with complex filters, simpler writes (e.g.,
student search).
• Independent scaling of reads — read replicas, denormalised projections (e.g.,
dashboard KPIs).
• Long-running business processes with state machine — application lifecycle, fee
collection cycle.
• Event sourcing requirements — financial ledger, audit trail.
Simple CRUD (single aggregate, no workflow) सा(cid:2)ठी(cid:7) plain application service प्रर' (cid:17)सा(cid:2) आहा(cid:17) —
CreateStudentHandler सा(cid:2)रखा(cid:2) command handler unnecessary complexity जो(cid:15)डोतो(cid:15).
12.2 Command Side
Commands state-changing operations represent करतो(cid:2)तो — Create, Update, Delete,
Approve, Reject. प्र(cid:9)त्याक(cid:17) command immutable आहा(cid:17), validated आहा(cid:17), आणि(cid:20) त्या(cid:2)ची(cid:2) एकची handler आहा(cid:17).
Handler ची(cid:7) responsibility aggregate load कर(cid:20),(cid:17) method invoke कर(cid:20),(cid:17) repository through save
कर(cid:20),(cid:17) आणि(cid:20) events publish कर(cid:20):(cid:17)
CreateStudentCommand (DTO)
↓
CommandBus.execute()
↓
CreateStudentHandler
↓ (loads + invokes + saves + publishes)
StudentAggregate.create() // pure domain logic
↓
StudentRepository.save() // Prisma persistence
↓
Outbox → StudentCreatedEvent // async event publishing
34

PreOne Backend TD v1.0  |  Backend Architecture Freeze
Command Catalog
| Command | Module | Purpose | Event Published |
| ------- | ------ | ------- | --------------- |
CreateStudentComm Identity Create new student  StudentCreatedEvent
| and |     | record + initial  |     |
| --- | --- | ----------------- | --- |
profile
EnrollStudentComma Academics Enroll student in  StudentEnrolledEven
| nd  |     | section for academic  | t,                  |
| --- | --- | --------------------- | ------------------- |
|     |     | year                  | InvoiceGeneratedEve |
nt
| MarkAttendanceCom | Attendance | Mark daily      | AttendanceMarkedE |
| ----------------- | ---------- | --------------- | ----------------- |
| mand              |            | attendance for  | vent              |
student
GenerateInvoiceCom Finance Generate fee invoice  InvoiceGeneratedEve
| mand              |         | for student     | nt                 |
| ----------------- | ------- | --------------- | ------------------ |
| ReceivePaymentCom | Finance | Record payment  | PaymentReceivedEve |
| mand              |         | against invoice | nt,                |
ReceiptIssuedEvent
ApproveAdmissionC Admissions Approve pending  AdmissionApprovedE
| ommand |     | admission   | vent,               |
| ------ | --- | ----------- | ------------------- |
|        |     | application | StudentCreatedEvent |
PublishReportCardCo Academics Publish term report  ReportCardPublished
| mmand |     | card to parents | Event |
| ----- | --- | --------------- | ----- |
ScheduleInterviewCo HR Schedule interview  InterviewScheduledE
| mmand |     | with candidate | vent |
| ----- | --- | -------------- | ---- |
RaisePurchaseReque Inventory Create PR for  PurchaseRequestRais
| stCommand |     | procurement | edEvent |
| --------- | --- | ----------- | ------- |
IssueGoodsComman Inventory Issue goods from  GoodsIssuedEvent,
| d   |     | store to department | StockReducedEvent |
| --- | --- | ------------------- | ----------------- |
12.3 Query Side
Queries read-only operations represent  करतो(cid:2)तो —  Get, Search, List, Count. Queries
aggregate layer ली(cid:2) touch करतो न(cid:2)हा(cid:7)तो — तो(cid:17) direct Prisma read model वे(cid:2)प्ररतो(cid:2)तो performance
सा(cid:2)ठी(cid:7). या(cid:2)मळी' (cid:17) read path फक्तो DB + cache + DTO mapping इतोक(cid:2) simple आहा(cid:17):
GetStudentQuery
    ↓
QueryBus.execute()
35

PreOne Backend TD v1.0  |  Backend Architecture Freeze
    ↓
GetStudentHandler
    ↓ (read-optimized path)
PrismaStudentReadModel.find()
    ↓
StudentListItemDto  // no aggregate hydration
Query Catalog
| Query | Module | Purpose | Returns |
| ----- | ------ | ------- | ------- |
GetStudentByIdQuer Identity Fetch full student  StudentResponseDto
| y   |     | profile |     |
| --- | --- | ------- | --- |
SearchStudentsQuer Identity Full-text + filter  Paginated<StudentLi
| y                  |            | search             | stItemDto>         |
| ------------------ | ---------- | ------------------ | ------------------ |
| GetAttendanceRepor | Attendance | Date-range         | AttendanceReportDt |
| tQuery             |            | attendance summary | o                  |
GetFeeOutstandingQ Finance Outstanding fees per  FeeOutstandingDto[]
| uery               |         | student/class      |                 |
| ------------------ | ------- | ------------------ | --------------- |
| GetDashboardKpiQu  | Reports | Dashboard KPIs by  | DashboardKpiDto |
| ery                |         | role/branch        |                 |
| GetStaffOnLeaveQue | HR      | Staff on leave     | StaffLeaveDto[] |
| ry                 |         | today/this week    |                 |
GetLowStockItemsQ Inventory Items below reorder  LowStockDto[]
| uery |     | level |     |
| ---- | --- | ----- | --- |
GetAdmissionPipelin Admissions Admission funnel  AdmissionPipelineDt
| eQuery |     | metrics | o   |
| ------ | --- | ------- | --- |
GetLedgerQuery Finance GL ledger entries by  Paginated<LedgerEnt
|     |     | period | ryDto> |
| --- | --- | ------ | ------ |
GetAuditTrailQuery Platform Audit trail by  Paginated<AuditLog
|     |     | entity/user/date | Dto> |
| --- | --- | ---------------- | ---- |
13. Domain Events
Domain Events हा(cid:17) 'something happened in the domain' ची(cid:2) formal way आहा(cid:17). Aggregate जो(cid:17)व्हा(cid:2)
state change करतो(cid:15) तो(cid:17)व्हा(cid:2) event raise करतो(cid:15), आणि(cid:20) तो(cid:15) event bus वेर publish हा(cid:15)तो(cid:15). Subscribers
(within same module णिक#वे(cid:2) cross-module via integration events) त्या(cid:2) event ली(cid:2) react करतो(cid:2)तो.
| या(cid:2)मळी' (cid:17) aggregates एकम(cid:17)क(cid:2)शे# | (cid:7) loosely coupled र(cid:2)हातो(cid:2)तो. |     |     |
| -------------------------------------------------------- | ---------------------------------------------- | --- | --- |
36

PreOne Backend TD v1.0  |  Backend Architecture Freeze
13.1 Event Flow
Event ची(cid:2) flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). Outbox pattern reliability साणि'नणि6चीतो करतो(cid:15) — event same
transaction मध्या(cid:17) DB ली(cid:2) णिलीहाली(cid:2) जो(cid:2)तो(cid:15), नतो# र background publisher त्या(cid:2)ली(cid:2) Redis Stream वेर push
करतो(cid:15). या(cid:2)मळी' (cid:17) events कधी(cid:7)ची lost हा(cid:15)तो न(cid:2)हा(cid:7)तो:
Aggregate (state change)
    ↓
aggregate.raiseEvent(new StudentCreated(...))
    ↓
Application Service (within transaction)
    ↓
Outbox Table (same DB transaction)
    ↓
Publisher Worker (polls outbox)
    ↓
Event Bus (Redis Stream)
    ↓
Subscribers (Notification, Analytics, Audit)
13.2 Event Catalog
खा(cid:2)ली(cid:7)ली table PreOne च्या(cid:2) सावे0 domain events ची(cid:7) authoritative list आहा(cid:17). नवे(cid:7)न event introduce
करतो(cid:2)न(cid:2) या(cid:2) table मध्या (cid:17)entry जो(cid:15)डो(cid:2)वे(cid:7) ली(cid:2)गे(cid:17)ली आणि(cid:20) event schema versioned असा(cid:20) (cid:17)mandatory आहा(cid:17):
| Event | Module | Trigger | Payload | Subscribers |
| ----- | ------ | ------- | ------- | ----------- |
StudentCreated identity New student  Student id,  Sync: parent
|     |     | created | name, branch,  | welcome email;  |
| --- | --- | ------- | -------------- | --------------- |
|     |     |         | section,       | Async: CRM      |
|     |     |         | createdBy      | lead conversion |
StudentUpdate identity Student profile  Diff of changed  Sync: cache
| d   |     | updated | fields,   | invalidation;    |
| --- | --- | ------- | --------- | ---------------- |
|     |     |         | updatedBy | Async: audit log |
StudentPromot academics Student  From class, to  Async: new fee
| ed  |     | promoted to  | class, academic  | plan, new  |
| --- | --- | ------------ | ---------------- | ---------- |
|     |     | next class   | year             | section    |
assignment
StudentTransfer identity Student  From branch, to  Async: archival
| red |     | transferred to  | branch, reason | at old branch,  |
| --- | --- | --------------- | -------------- | --------------- |
|     |     | another branch  |                | new record at   |
new branch
37

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Event | Module | Trigger | Payload | Subscribers |
| ----- | ------ | ------- | ------- | ----------- |
AdmissionApplic admissions New admission  Application id,  Sync:
| ationSubmitted |     | enquiry | student name,  | confirmation  |
| -------------- | --- | ------- | -------------- | ------------- |
|                |     |         | parent contact | SMS; Async:   |
counsellor
assignment
AdmissionAppro admissions Admission  Application id,  Async:
| ved |     | application  | student id,  | StudentCreated,  |
| --- | --- | ------------ | ------------ | ---------------- |
|     |     | approved     | branch       | InvoiceGenerate  |
d, welcome
email
AdmissionRejec admissions Admission  Application id,  Async: rejection
| ted |     | application  | reason | email, CRM    |
| --- | --- | ------------ | ------ | ------------- |
|     |     | rejected     |        | status update |
AttendanceMar attendance Daily  Student, date,  Sync: parent
| ked |     | attendance  | status,  | SMS; Async:  |
| --- | --- | ----------- | -------- | ------------ |
|     |     | marked      | markedBy | monthly      |
summary
InvoiceGenerat finance Fee invoice  Invoice id,  Async: email +
| ed            |         | raised          | student,         | WhatsApp,       |
| ------------- | ------- | --------------- | ---------------- | --------------- |
|               |         |                 | amount, due      | reminder        |
|               |         |                 | date             | schedule        |
| PaymentReceiv | finance | Payment         | Invoice id,      | Sync: receipt   |
| ed            |         | recorded        | amount,          | SMS; Async:     |
|               |         | against invoice | method,          | ledger entry,   |
|               |         |                 | receiptNo        | GST return prep |
| PaymentFailed | finance | Payment         | Invoice id,      | Async: failure  |
|               |         | attempt failed  | amount, failure  | notification,   |
|               |         |                 | reason           | retry schedule  |
ReportCardPubli academics Term report  Student, term,  Async: parent
| shed |     | card published | sections, grades | email + push  |
| ---- | --- | -------------- | ---------------- | ------------- |
notification
ObservationApp academics Teacher  Observation id,  Async: parent
| roved |     | observation  | student,  | notification,  |
| ----- | --- | ------------ | --------- | -------------- |
|       |     | approved     | milestone | milestone      |
tracking
38

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Event          | Module | Trigger    | Payload          | Subscribers  |
| -------------- | ------ | ---------- | ---------------- | ------------ |
| StaffOnboarded | hr     | New staff  | Staff id, name,  | Sync:        |
|                |        | onboarded  | role, branch     | credentials  |
setup; Async:
asset
assignment
| StaffOffboarded | hr  | Staff offboarded | Staff id,        | Async: asset      |
| --------------- | --- | ---------------- | ---------------- | ----------------- |
|                 |     |                  | exitDate, reason | recovery, access  |
revoke, final
settlement
LeaveApplied hr Leave request  Staff id, leave  Sync: manager
|     |     | submitted | type, dates | notification;  |
| --- | --- | --------- | ----------- | -------------- |
Async: calendar
block
| LeaveApproved | hr  | Leave request  | Staff id, leave  | Async:      |
| ------------- | --- | -------------- | ---------------- | ----------- |
|               |     | approved       | type, dates,     | substitute  |
|               |     |                | approver         | assignment  |
PurchaseReques inventory PR created PR id, items,  Async: manager
| tRaised |     |     | department | approval  |
| ------- | --- | --- | ---------- | --------- |
workflow
GoodsIssued inventory Goods issued  Items, qty, to  Async: stock
|     |     | from store | department | recalc, ledger  |
| --- | --- | ---------- | ---------- | --------------- |
impact
StockLow inventory Item below  Item, current  Async: PR auto-
|              |               | reorder level | qty, reorder  | creation if rule  |
| ------------ | ------------- | ------------- | ------------- | ----------------- |
|              |               |               | level         | exists            |
| Announcement | communication | Announcement  | Audience,     | Async:            |
| Published    |               | broadcast     | channels,     | SMS/WhatsApp      |
|              |               |               | content       | /Email/Push       |
fan-out
MessageSent communication Chat message  Room, sender,  Sync:
|     |     | sent | message | WebSocket  |
| --- | --- | ---- | ------- | ---------- |
push; Async:
push for offline
users
BackupComplet platform Daily backup  Database size,  Async: integrity
| ed  |     | finished | duration,  | check, alert on  |
| --- | --- | -------- | ---------- | ---------------- |
|     |     |          | location   | failure          |
39

PreOne Backend TD v1.0 | Backend Architecture Freeze
Event Module Trigger Payload Subscribers
FeatureFlagTog platform Feature flag Flag key, old Sync: cache
gled changed value, new bust; Async:
value, audit log
changedBy
13.3 Event Schema Rules
• Event names: past-tense verb (StudentCreated, not CreateStudent).
• Events are immutable — once published, never modified.
• Event payload includes: eventId (UUID v7), occurredAt, tenantId, userId,
aggregateId, version.
• Schema versioned via .v1, .v2 suffix — backward-compatible evolution only.
• Subscribers must be idempotent — same event processed twice must yield same
result.
• Events published after transaction commit — never before.
• Event payload size max 64 KB — larger payloads use reference (URL) instead of
inline data.
• PII in events encrypted at rest (Redis AES); access logged.
14. Integration Events
Integration Events हा(cid:17) cross-bounded-context communication ची(cid:2) mechanism आहा(cid:17). Domain
events (Section 13) single bounded context अ#तोगे0तो असातो(cid:2)तो, integration events त्या(cid:2)च्# या(cid:2)
translation हा(cid:15)तो(cid:2)तो जो(cid:17)व्हा(cid:2) दासा' र(cid:2) context त्या(cid:2)ची(cid:2) subscriber असातो(cid:15). उदा(cid:2). StudentCreated event
Identity module मध्या(cid:17) raise हा(cid:15)तो(cid:15), प्र(cid:20) Finance module ली(cid:2) new student ची(cid:7) जो(cid:2)(cid:20)(cid:7)वे हावे(cid:7) असाली(cid:17) तोर
Identity एक StudentEnrolled integration event publish करतो(cid:15) जो(cid:15) Finance subscribe करतो(cid:15).
14.1 Integration Event Catalog
Event Producer → Purpose Delivery
Consumer
StudentEnrolled.v1 Identity → Finance Trigger fee plan Sync (HTTP) —
creation finance needs
immediate response
40

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Event | Producer →  | Purpose | Delivery |
| ----- | ----------- | ------- | -------- |
Consumer
InvoiceGenerated.v1 Finance → Identity Notify student  Async (Redis Stream)
|     |     | record of pending  | — eventual  |
| --- | --- | ------------------ | ----------- |
|     |     | invoice            | consistency |
PaymentReceived.v1 Finance →  Trigger receipt  Async (Redis Stream)
|     | Communication | notification |     |
| --- | ------------- | ------------ | --- |
AdmissionApproved. Admissions →  Create student  Sync (HTTP) —
| v1  | Identity | record | admissions waits for  |
| --- | -------- | ------ | --------------------- |
student id
AttendanceMarked.v Attendance →  Trigger parent SMS Async (Redis Stream)
| 1   | Communication |     |     |
| --- | ------------- | --- | --- |
StaffOnboarded.v1 HR → Identity Create user account Sync (HTTP) — HR
waits for credentials
StockLow.v1 Inventory →  Auto-create PR if  Async (Redis Stream)
|     | Procurement | rule active |     |
| --- | ----------- | ----------- | --- |
ReportCardPublished Academics →  Notify parents via  Async (Redis Stream)
| .v1 | Communication | email + push |     |
| --- | ------------- | ------------ | --- |
AnnouncementPublis Communication →  Record in audit log Async (Redis Stream)
| hed.v1 | Platform |     |     |
| ------ | -------- | --- | --- |
FeatureFlagChanged. Platform → All Cache bust  Pub/Sub (Redis) —
| v1  |     | notification | all subscribers  |
| --- | --- | ------------ | ---------------- |
invalidate
14.2 Integration Patterns
Integration events च्या(cid:2) two delivery patterns आहा(cid:17)तो — sync (HTTP) आणि(cid:20) async (Redis Stream).
Pattern choice ADR-015 मध्या(cid:17) per-integration basis decide क(cid:17) ली(cid:2) जो(cid:2)तो(cid:15). मख्' या criteria: क(cid:2)या
consumer ची(cid:2) immediate response प्र(cid:2)णिहाजो(cid:17) आहा(cid:17)?
•  Sync (HTTP): Producer HTTP call करतो(cid:15) consumer च्या(cid:2) internal endpoint वेर, response
waits. Used when producer ली(cid:2) consumer ची(cid:2) result प्र(cid:2)णिहाजो(cid:17) (e.g., Admissions →
Identity for student ID).
•  Async (Redis Stream): Producer event Redis Stream वेर publish करतो(cid:15), consumer
खा(cid:2)ली(cid:7) subscribe करतो(cid:15). Used when eventual consistency acceptable (e.g.,
PaymentReceived → Communication).
41

PreOne Backend TD v1.0 | Backend Architecture Freeze
• Saga Pattern: Long-running multi-step transactions ज्या(cid:2)तो प्र(cid:9)त्याक(cid:17) step own transaction
आहा(cid:17). Compensating actions rollback सा(cid:2)ठी(cid:7). Used for admission → enrollment →
invoice flow.
• Outbox Pattern: Producer event DB outbox table मध्या (cid:17)same transaction मध्या (cid:17)writes
करतो(cid:15). Background publisher outbox ली(cid:2) drain करून Redis Stream वेर push करतो(cid:15).
Reliability साणि'नणि6चीतो करतो(cid:15).
14.3 Integration Rules
• Integration events are versioned (.v1, .v2) — backward-compatible schema
evolution
• Sync integration = HTTP call within same request — must have timeout + circuit
breaker
• Async integration = Redis Stream — at-least-once delivery; consumer must be
idempotent
• Producer publishes to outbox table; publisher worker drains to Redis Stream
• Consumer maintains last-read position in Redis (consumer group offset)
• Retry policy: 3 retries with exponential backoff (1s, 5s, 25s); then DLQ
• Poison messages (failed 3x) routed to DLQ for manual inspection
• Schema changes require new version — never modify existing event schema in-
place
• Event payload includes schema URL for runtime validation by consumer
• All events include: eventId (UUID), occurredAt (ISO), tenantId, branchId, userId
15. Background Jobs
Background Jobs हा(cid:17) long-running णिक#वे(cid:2) deferred work handle करतो(cid:2)तो. Request lifecycle मध्या (cid:17)
synchronous हा(cid:15)ऊ नया(cid:17) असा(cid:17) work BullMQ च्या(cid:2) through offload क(cid:17) ली(cid:17) जो(cid:2)तो(cid:17) — उदा(cid:2). PDF report
generation (30s+), bulk WhatsApp send (rate-limited), nightly backups. या(cid:2)मळी' (cid:17) API responses
fast र(cid:2)हातो(cid:2)तो आणि(cid:20) user क(cid:15)(cid:20)तो(cid:2)हा(cid:7) wait करतो न(cid:2)हा(cid:7).
15.1 BullMQ Queue Catalog
PreOne मध्या (cid:17)12 dedicated queues आहा(cid:17)तो, प्र(cid:9)त्याक(cid:17) queue ची(cid:7) priority आणि(cid:20) rate limit वे(cid:17)गेवे(cid:17)गेळी(cid:7) आहा(cid:17). हा(cid:17)
separation critical work (notifications) कम(cid:7) priority work (reports) प्र(cid:2)सान- isolate करतो(cid:17), ज्या(cid:2)मळी' (cid:17)
एक queue overload झा(cid:2)ल्या(cid:2)सा दासा' र(cid:7) affected हा(cid:15)तो न(cid:2)हा(cid:7):
42

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Queue        | Purpose       | Priority | Rate Limit | Notes           |
| ------------ | ------------- | -------- | ---------- | --------------- |
| notification | Parent SMS /  | High     | 1000/min   | Burst during    |
|              | push          |          |            | attendance      |
|              | notifications |          |            | mark, fee due,  |
report publish
| email | Transactional +  | Medium | 500/min | Bulk admissions  |
| ----- | ---------------- | ------ | ------- | ---------------- |
|       | marketing        |        |         | email uses       |
|       | emails           |        |         | separate child   |
queue
| whatsapp | WhatsApp      | Medium | 100/min | WhatsApp rate  |
| -------- | ------------- | ------ | ------- | -------------- |
|          | Business API  |        |         | limits are     |
|          | messages      |        |         | stricter than  |
SMS
| sms | Transactional  | High | 2000/min | DLT template  |
| --- | -------------- | ---- | -------- | ------------- |
|     | SMS via DLT-   |      |          | validation    |
|     | approved       |      |          | before send   |
senders
| report | PDF/Excel       | Low    | 50/min  | Long-running   |
| ------ | --------------- | ------ | ------- | -------------- |
|        | report          |        |         | (30s-5min) —   |
|        | generation      |        |         | sandboxed      |
| ai     | AI/LLM          | Medium | 100/min | Token-bucket   |
|        | inference jobs  |        |         | per tenant to  |
|        | (chatbot,       |        |         | control cost   |
summaries)
| image-     | Image resize,  | Medium | 200/min | Sharp library;  |
| ---------- | -------------- | ------ | ------- | --------------- |
| processing | watermark,     |        |         | CPU-bound       |
thumbnail
| backup | Daily DB + S3  | Low | 1/day (off-peak) | 03:00 IST; full  |
| ------ | -------------- | --- | ---------------- | ---------------- |
|        | backup         |     |                  | backup +         |
incremental
| audit-cleanup | Audit log       | Low | 1/week | Move logs older  |
| ------------- | --------------- | --- | ------ | ---------------- |
|               | archival to S3  |     |        | than 1 year      |
Glacier
| invoice- | Fee due   | Medium | 1000/hr burst | Cron at 09:00  |
| -------- | --------- | ------ | ------------- | -------------- |
| reminder | reminders |        |               | IST daily      |
43

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Queue | Purpose | Priority | Rate Limit | Notes |
| ----- | ------- | -------- | ---------- | ----- |
report-card- Bulk report card  Medium 500/hr Term-end spike;
| publish | publishing |     |     | pre-generated  |
| ------- | ---------- | --- | --- | -------------- |
PDFs
| data-export | User-requested  | Low | 50/min | Async upload to  |
| ----------- | --------------- | --- | ------ | ---------------- |
|             | data exports    |     |        | S3 + email link  |
15.2 Retry Policy
Background jobs fail हा(cid:15)ऊ शेकतो(cid:2)तो — external service down, DB timeout, network glitch.
Retry policy या(cid:2)न# (cid:2) gracefully handle करतो(cid:15). खा(cid:2)ली(cid:7)ली table policy ची (cid:17)detail दातो(cid:17) (cid:17). Exponential backoff
न(cid:17) retry ची(cid:7) frequency कम(cid:7) हा(cid:15)तो(cid:17) ज्या(cid:2)मळी' (cid:17) downstream service ली(cid:2) recover हा(cid:15)ण्या(cid:2)ची(cid:7) मदा' तो णिमळीतो(cid:17):
| Aspect |     | Value | Notes |     |
| ------ | --- | ----- | ----- | --- |
Max Attempts 3 retries after initial attempt Total 4 attempts before DLQ
Backoff Strategy Exponential — delay =  1s, 2s, 4s, 8s, 16s, 32s, 60s,
|     |     | 2^attempt × 1s, capped at  | 60s, ... |     |
| --- | --- | -------------------------- | -------- | --- |
60s
| Jitter |     | ±20% random jitter on  | Avoids thundering herd on  |     |
| ------ | --- | ---------------------- | -------------------------- | --- |
|        |     | backoff                | retry                      |     |
Dead Letter Queue {queueName}:dead Manual inspection; alert via
PagerDuty
Failure Alert Slack webhook after 3  Auto-page on-call engineer
|     |     | consecutive failures in same  | for critical queues         |     |
| --- | --- | ----------------------------- | --------------------------- | --- |
|     |     | queue                         | (notification, sms, backup) |     |
Idempotency Job ID = hash(payload +  Duplicate job detection; safe
|     |     | tenantId) | retry |     |
| --- | --- | --------- | ----- | --- |
Sandboxed Processors BullMQ sandbox mode for  Crash isolation; parent
|           |     | report/ai queues           | process survives              |     |
| --------- | --- | -------------------------- | ----------------------------- | --- |
| Cron Jobs |     | Defined via                | Single-instance enforced via  |     |
|           |     | @nestjs/schedule + BullMQ  | Redis lock                    |     |
repeatable
15.3 Job Lifecycle
प्र(cid:9)त्याक(cid:17)  job खा(cid:2)ली(cid:7)ली lifecycle stages through जो(cid:2)तो(cid:17). हा(cid:17) visibility debugging आणि(cid:20) monitoring सा(cid:2)ठी(cid:7)
critical आहा(cid:17) — Bull Board UI सावे0 active/waiting/delayed/failed jobs दा(cid:2)खावेतो(cid:17):
44

PreOne Backend TD v1.0 | Backend Architecture Freeze
Producer (e.g., Controller or Handler)
↓ queue.add('job-name', payload, opts)
Waiting (in Redis sorted set)
↓ worker picks up
Active (being processed)
↓ on success
Completed (retained 24h for inspection)
-- OR --
↓ on failure
Delayed (backoff timer running)
↓ retries up to maxAttempts
Failed (moved to DLQ after maxAttempts)
↓ alert triggered
Manual inspection via Bull Board
16. Cache Strategy
Redis हा(cid:2) PreOne ची(cid:2) primary cache layer आहा(cid:17) — sub-ms reads, persistence, pub/sub, आणि(cid:20)
BullMQ backend सावे0 एक(cid:2)ची instance वेर. Cache strategy ADR-018 मध्या(cid:17) defined आहा(cid:17) आणि(cid:20) त्या(cid:2)ची(cid:2)
core principle म्हा(cid:20)जो(cid:17) 'explicit invalidation over TTL' — predictable behaviour ची(cid:7) preference
convenience वेर. Permission cache आणि(cid:20) version-based invalidation ADR मध्या(cid:17) define क(cid:17) लीली(cid:17) (cid:17)
आहा(cid:17)तो.
16.1 Cache Layers
PreOne मध्या(cid:17) 10 distinct cache layers आहा(cid:17)तो, प्र(cid:9)त्याक(cid:17) layer ची(cid:7) specific TTL आणि(cid:20) invalidation
strategy आहा(cid:17). खा(cid:2)ली(cid:7)ली table सावे0 layers ची(cid:7) catalog करतो(cid:17):
Layer Key Pattern TTL Invalidation Notes
Permission user_id → 300s TTL Invalidated on Hot path on
Cache [permissions] role change, every request
permission
grant/revoke
Menu Cache role_id → menu 1h TTL Invalidated on Avoids DB hit on
tree menu config every page load
change
User Session session_id → 24h TTL sliding Deleted on Stored as Redis
user context logout hash
Dashboard KPIs tenant+branch+ 60s TTL Auto-expire; Refreshed by
role → KPI manual bust via background job
bundle admin tool
45

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Layer    | Key Pattern    | TTL    | Invalidation      | Notes         |
| -------- | -------------- | ------ | ----------------- | ------------- |
| Settings | tenant+branch  | 1h TTL | Versioned by      | Bump version  |
|          | → settings     |        | settings_version  | on update     |
|          | object         |        | counter           |               |
Feature Flags tenant → flag  300s TTL Invalidated on  Pub/Sub
|     | map |     | flag change  | broadcast to all  |
| --- | --- | --- | ------------ | ----------------- |
|     |     |     | event        | instances         |
DTO Validation  schema name  Process lifetime Recompile on  In-process Map;
| Schema | → compiled Zod  |     | deploy | not Redis |
| ------ | --------------- | --- | ------ | --------- |
schema
| Compiled     | tenant →  | 1h TTL | Invalidated on  | Hot path on  |
| ------------ | --------- | ------ | --------------- | ------------ |
| Casbin Model | enforcer  |        | policy change   | auth check   |
Pre-signed S3  object key →  55 min TTL (URL  Auto- Avoids S3 API
| URLs | URL | valid 1h) | regenerate | calls |
| ---- | --- | --------- | ---------- | ----- |
Rate Limit  ip+route →  60s window Auto-expire Sliding window
| Counters | counter |     |     | via Redis sorted  |
| -------- | ------- | --- | --- | ----------------- |
set
16.2 Cache Patterns
वे(cid:17)गेवे(cid:17)गेळ्या(cid:2) use cases सा(cid:2)ठी(cid:7) वे(cid:17)गेवे(cid:17)गेळी(cid:17)  patterns वे(cid:2)प्ररली(cid:17) जो(cid:2)तो(cid:2)तो. Pattern choice data consistency
requirements + read/write ratio वेर depend करतो(cid:17):
| Pattern |     | Flow | Use Case |     |
| ------- | --- | ---- | -------- | --- |
Read-Through App → cache → DB → cache  Hot reads; transparent to
|     |     | → app | caller |     |
| --- | --- | ----- | ------ | --- |
Write-Through App → cache + DB (sync) →  Strong consistency; slightly
|     |     | app | higher write latency |     |
| --- | --- | --- | -------------------- | --- |
Write-Behind App → cache → ack; async  High write throughput; risk
|     |     | DB write | of data loss on crash |     |
| --- | --- | -------- | --------------------- | --- |
Cache-Aside App checks cache; on miss  Most common; explicit cache
|     |     | loads from DB | management |     |
| --- | --- | ------------- | ---------- | --- |
Refresh-Ahead Background job refreshes  Prevents cache stampede on
|     |     | before expiry | hot keys |     |
| --- | --- | ------------- | -------- | --- |
46

PreOne Backend TD v1.0 | Backend Architecture Freeze
16.3 Cache Invalidation Rules
Cache invalidation हा(cid:17) computer science च्या(cid:2) two hard problems प्र;क(cid:7) एक आहा(cid:17). खा(cid:2)ली(cid:7)ली rules
predictable invalidation साणि'नणि6चीतो करतो(cid:2)तो:
• Explicit invalidation preferred over TTL — predictability over convenience
• Versioned cache keys (e.g., user_perms:{userId}:v{version}) allow atomic
invalidation
• Pub/Sub broadcast for multi-instance invalidation
• Cache stampede protection via single-flight pattern (only one DB fetch per key)
• Never cache PII without encryption at rest (Redis AES enabled)
• Cache hit ratio target: ≥ 90% for permission/menu; ≥ 70% for KPIs
• Monitoring: per-cache hit/miss/error metrics emitted to Prometheus
16.4 Permission Cache Deep-Dive
Permission cache हा(cid:2) सावेBतो hot path आहा(cid:17) — प्र(cid:9)त्याक(cid:17) request वेर permission check हा(cid:15)तो(cid:15), ज्या(cid:2)मळी' (cid:17)
cache hit ratio ≥ 90% प्र(cid:2)णिहाजो(cid:17). Permission cache ची(cid:7) architecture खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20) (cid:17)आहा(cid:17). Version-based
invalidation atomic cache busting साणि'नणि6चीतो करतो(cid:17) — role change झा(cid:2)ल्या(cid:2)वेर user_perms:
{userId}:v{version} ची(cid:2) version bump हा(cid:15)तो(cid:15) आणि(cid:20) जोन' (cid:7) entry TTL expire हा(cid:15)ऊन नवे(cid:7)न entry populate
हा(cid:15)तो(cid:17):
Request arrives (userId in JWT)
↓
Cache key: user_perms:{userId}:v{version}
↓
Redis GET
↓ HIT
Return permissions
-- OR --
↓ MISS
Casbin enforcer load (DB query)
↓
Redis SET with 300s TTL
↓
Return permissions
// Invalidation on role change:
UPDATE users SET perms_version = perms_version + 1 WHERE id = ?
// Old cache key naturally expires; new key populated on next request
47

PreOne Backend TD v1.0  |  Backend Architecture Freeze
17. Transactions
Transactions हा (cid:17)data consistency ची(cid:2) foundation आहा(cid:17)तो. PreOne ची(cid:2) core principle: 'Aggregate =
Transaction Boundary'. एक(cid:2) aggregate ची(cid:2) save हा(cid:2) एक transaction आहा(cid:17) — multiple aggregates
एक(cid:2)ची transaction मध्या(cid:17) save हा(cid:15)(cid:20)(cid:17) anti-pattern आहा(cid:17). जोर multi-aggregate operation हावे(cid:2) असाली(cid:17)  तोर
Saga pattern वे(cid:2)प्रर(cid:2) — प्र(cid:9)त्याक(cid:17)  step own transaction, rollback via compensating action.
17.1 Transaction Patterns
वे(cid:17)गेवे(cid:17)गेळ्या(cid:2) scenarios सा(cid:2)ठी(cid:7) वे(cid:17)गेवे(cid:17)गेळी(cid:17) transaction patterns वे(cid:2)प्ररली (cid:17)जो(cid:2)तो(cid:2)तो. खा(cid:2)ली(cid:7)ली table सावे 0patterns ची(cid:7)
catalog करतो(cid:17):
| Pattern | Mechanism | Use Case | Flow |
| ------- | --------- | -------- | ---- |
Single-Aggregate  ACID via Prisma  Default — 95% of  Begin → save
| Transaction | $transaction | writes | aggregate → commit |
| ----------- | ------------ | ------ | ------------------ |
Multi-Aggregate  Orchestration via  Cross-bounded- Each step = own
| Saga | state machine +  | context flows | transaction; rollback  |
| ---- | ---------------- | ------------- | ---------------------- |
|      | compensating     |               | via compensation       |
actions
Outbox Pattern DB transaction  Reliable event  Same transaction as
|     | writes events to  | publishing | aggregate write |
| --- | ----------------- | ---------- | --------------- |
outbox table;
publisher drains to
stream
Optimistic Locking version column  Low-contention  WHERE version =
|     | checked on save | aggregates | expected; throw on 0  |
| --- | --------------- | ---------- | --------------------- |
rows affected
Pessimistic Locking SELECT ... FOR  High-contention  Hold lock for
|             | UPDATE               | (concurrent fee  | shortest possible  |
| ----------- | -------------------- | ---------------- | ------------------ |
|             |                      | edits)           | duration           |
| Idempotency | idempotency_key      | All POST/PUT     | Reject duplicate;  |
|             | table; unique        |                  | return cached      |
|             | constraint           |                  | response           |
| Read-Only   | Prisma read without  | All GET          | No lock acquired;  |
| Transaction | write                |                  | replica routing    |
possible
48

PreOne Backend TD v1.0 | Backend Architecture Freeze
17.2 Transaction Rules
• Aggregate = Transaction Boundary — never split one aggregate across transactions
• No cross-aggregate transactions — use saga or domain events instead
• Always set transaction timeout (default 5s; longer for batch)
• Never call external services (HTTP, S3, email) within transaction — do after commit
• Rollback on any exception — let it propagate to global filter
• Transaction isolation level: READ COMMITTED (default); SERIALIZABLE only for
critical billing
• Max transaction duration: 5s; longer = suspect deadlock — alert
• Test transactions under load to detect deadlocks (Testcontainers + concurrent
Vitest)
• Log transaction begin/commit/rollback with traceId for observability
17.3 Example — Admission Approval Saga
Admission approval हा(cid:17) multi-aggregate workflow आहा(cid:17) — Application, Student, FeePlan,
Invoice या(cid:2) ची(cid:2)र aggregates involve हा(cid:15)तो(cid:2)तो. एक(cid:2)ची transaction मध्या(cid:17) सावे0 save कर(cid:20)(cid:17) anti-pattern
असाली(cid:17) . खा(cid:2)ली(cid:7)ली saga pattern ची(cid:17) implementation दा(cid:2)खावेतो(cid:17) — प्र(cid:9)त्याक(cid:17) step own transaction, failure
वेर compensating action:
Step 1: Approve Application (admissions module)
Txn 1: application.status = APPROVED; application.save()
Event: AdmissionApproved
↓
Step 2: Create Student (identity module)
Txn 2: student = StudentFactory.fromApplication(application); student.save()
Event: StudentCreated
↓ (compensation on failure: mark application for manual review)
↓
Step 3: Create FeePlan (finance module)
Txn 3: feePlan = FeePlanFactory.forStudent(student, branch); feePlan.save()
Event: FeePlanCreated
↓ (compensation: soft-delete student, alert ops)
↓
Step 4: Generate First Invoice (finance module)
Txn 4: invoice = student.generateInvoice(feePlan, term1); invoice.save()
Event: InvoiceGenerated
↓ (compensation: delete feePlan, alert ops)
↓
Step 5: Send Welcome Email (communication module, async)
Job: enqueue welcome email + WhatsApp message
49

PreOne Backend TD v1.0  |  Backend Architecture Freeze

// If any step fails after max retries:
//   - Saga state = FAILED
//   - Compensating actions execute in reverse order
//   - PagerDuty alert to on-call engineer
18. Validation
Validation हा(cid:17) defense-in-depth strategy आहा(cid:17). PreOne मध्या(cid:17) 6 validation layers आहा(cid:17)तो — प्र(cid:9)त्याक(cid:17)
layer वे(cid:17)गेवे(cid:17)गेळ्या(cid:2) type ची(cid:7) invalid input catch करतो(cid:17). या(cid:2)मळी' (cid:17) invalid data कधी(cid:7)ची database प्रया0तो#  प्र(cid:15)हा(cid:15)चीतो
न(cid:2)हा(cid:7). Layer-by-layer validation fail-fast principle follow करतो(cid:17) — णिजोतोक्या(cid:2) लीवेकर error catch
हा(cid:15)ईली णितोतोक(cid:2) clear error message.
18.1 Validation Layers
| Layer | Tool | Where | Error Code | What It Catches |
| ----- | ---- | ----- | ---------- | --------------- |
DTO Validation class-validator +  Request pipe 422  Schema shape,
|            | Zod           |              | Unprocessable  | required fields,   |
| ---------- | ------------- | ------------ | -------------- | ------------------ |
|            |               |              | Entity         | type coercion      |
| Domain     | Value object  | Domain layer | DomainExceptio | Business           |
| Validation | constructors  |              | n              | invariants (e.g.,  |
valid phone, age
range)
Business Rule  Specifications +  Application  BusinessExcepti Cross-entity
| Validation | Policies | layer | on  | rules (e.g.,  |
| ---------- | -------- | ----- | --- | ------------- |
unique roll
number in
section)
Database  NOT NULL,  Database layer ConflictExceptio Last line of
| Constraints | UNIQUE, FK,  |     | n   | defense —     |
| ----------- | ------------ | --- | --- | ------------- |
|             | CHECK        |     |     | should never  |
trigger if above
layers work
Authorization  Guards +  Request pipe  AuthorizationEx Permission +
| Validation | decorators | (after DTO) | ception | data scope  |
| ---------- | ---------- | ----------- | ------- | ----------- |
check
Rate Limit  Throttler guard Request pipe  429 Too Many  Per-IP + per-
| Validation |     | (first) | Requests | user counters |
| ---------- | --- | ------- | -------- | ------------- |
50

PreOne Backend TD v1.0 | Backend Architecture Freeze
18.2 Validation Flow
Request ची(cid:2) flow खा(cid:2)ली(cid:7)ली stages through जो(cid:2)तो(cid:15). प्र(cid:9)त्याक(cid:17) stage वे(cid:17)गेवे(cid:17)गेळ्या(cid:2) type ची(cid:7) validation perform
करतो(cid:17). जोर early stage मध्या (cid:17)fail झा(cid:2)ली (cid:17)तोर later stages skip हा(cid:15)तो(cid:2)तो — या(cid:2)मळी' (cid:17) wasted work कम(cid:7) हा(cid:15)तो(cid:17):
1. Request arrives at controller
2. Throttler guard checks rate limit (429 if exceeded)
3. JwtAuthGuard authenticates (401 if invalid token)
4. PermissionsGuard checks authorization (403 if denied)
5. ValidationPipe runs DTO class-validator (422 if invalid)
6. Zod validation pipe runs schema (422 if invalid)
7. Idempotency check (409 if duplicate)
8. Handler invoked
9. Domain validation throws DomainException (400)
10. Business rule check throws BusinessException (409)
11. Repository save - DB constraint violation throws ConflictException (409)
12. Success - ResponseDto returned (200/201)
Each layer has a specific responsibility and a specific error code on failure. This separation
makes debugging easier — the error code tells you which layer failed, and the field-level
details array pinpoints the exact field.
18.3 Validation Best Practices
• Validate at the boundary — never trust external input.
• Fail fast — cheapest check first (rate limit before DB query).
• Return specific error codes — not generic 'INVALID_INPUT'.
• Field-level errors for ValidationException — array of { field, code, message }.
• Never swallow exceptions — let them propagate to global filter.
• Log validation failures at warn level — useful for UX improvement.
• Domain layer validates via value object constructors — fail on construction.
• Business rules in specifications — composable, testable.
19. Exception Handling
Exception handling हा(cid:17) user experience ची(cid:2) critical part आहा(cid:17). Generic error messages
("Something went wrong") user कडो-न frustration create करतो(cid:2)तो. PreOne ची(cid:2) standardised
error response shape specific error codes, localised messages, आणि(cid:20) traceId correlation दातो(cid:17) (cid:15)
— ज्या(cid:2)मळी' (cid:17) user ली(cid:2) क(cid:2)या चीक' ली (cid:17)आणि(cid:20) support ली(cid:2) कसा (cid:17)debug कर(cid:2)याची (cid:17)हा(cid:17) clear हा(cid:15)तो(cid:17).
51

PreOne Backend TD v1.0  |  Backend Architecture Freeze
19.1 Exception Types
| Exception | HTTP Status | When | Example Codes | Recovery |
| --------- | ----------- | ---- | ------------- | -------- |
ValidationExcep 422 DTO schema  FIELD_REQUIRE Client error —
| tion |     | violation | D,              | retry with      |
| ---- | --- | --------- | --------------- | --------------- |
|      |     |           | INVALID_EMAIL,  | corrected input |
OUT_OF_RANG
E
| BusinessExcepti | 409 | Business rule  | ROLL_NUMBER   | Client must     |
| --------------- | --- | -------------- | ------------- | --------------- |
| on              |     | violation      | _TAKEN,       | change request  |
|                 |     |                | INVOICE_ALREA | — retry with    |
|                 |     |                | DY_PAID,      | different data  |
ADMISSION_CL
OSED
| AuthorizationEx | 403 | Insufficient  | PERMISSION_D  | Client must     |
| --------------- | --- | ------------- | ------------- | --------------- |
| ception         |     | permissions   | ENIED,        | request         |
|                 |     |               | SCOPE_VIOLATI | elevated access |
ON
| AuthenticationE | 401 | Invalid or    | TOKEN_EXPIRE | Client must re- |
| --------------- | --- | ------------- | ------------ | --------------- |
| xception        |     | expired token | D,           | authenticate    |
TOKEN_INVALID
,
SESSION_REVOK
ED
| NotFoundExcep | 404 | Resource does  | STUDENT_NOT_ | Client must  |
| ------------- | --- | -------------- | ------------ | ------------ |
| tion          |     | not exist      | FOUND,       | verify ID    |
INVOICE_NOT_F
OUND
ConflictExceptio 409 Concurrent  VERSION_MISM Client may retry
| n   |     | modification | ATCH,  | with fresh fetch |
| --- | --- | ------------ | ------ | ---------------- |
DUPLICATE_KEY
| RateLimitExcep | 429 | Rate limit  | RATE_LIMIT_EX | Client must      |
| -------------- | --- | ----------- | ------------- | ---------------- |
| tion           |     | exceeded    | CEEDED        | back off (Retry- |
After header)
ExternalService 502 Downstream  S3_UNAVAILABL Server retries
| Exception |     | service failure | E,  | via BullMQ |
| --------- | --- | --------------- | --- | ---------- |
SMS_GATEWAY
_DOWN
52

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Exception | HTTP Status | When | Example Codes | Recovery |
| --------- | ----------- | ---- | ------------- | -------- |
InfrastructureEx 500 DB/Redis failure DB_CONNECTIO Server alert —
| ception |     |     | N_LOST,  | on-call paged |
| ------- | --- | --- | -------- | ------------- |
REDIS_TIMEOU
T
| DomainExceptio | 400 | Invalid value  | INVALID_PHON | Client must    |
| -------------- | --- | -------------- | ------------ | -------------- |
| n              |     | object         | E,           | provide valid  |
|                |     | construction   | INVALID_MONE | value          |
Y
19.2 Standard Error Response
PreOne च्या(cid:2) सावे0 error responses खा(cid:2)ली(cid:7)ली shape follow करतो(cid:2)तो. Global ExceptionFilter हा(cid:17) shape
enforce करतो(cid:15) — क(cid:15)(cid:20)तो(cid:2)हा(cid:7) unhandled exception या(cid:2) shape मध्या(cid:17) wrap हा(cid:15)तो(cid:15). traceId logs शे(cid:7)
correlate करतो(cid:15) ज्या(cid:2)मळी' (cid:17) support tickets मध्या(cid:17) user फक्तो traceId quote करतो(cid:15) आणि(cid:20) engineer full
context प्रन्'हा(cid:2) reconstruct करू शेकतो(cid:15):
{
  "success": false,
  "errorCode": "STUDENT_NOT_FOUND",
  "message": "Student with ID abc-123 does not exist",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "details": [],
  "timestamp": "2026-07-14T10:30:45.123Z",
  "path": "/v1/students/abc-123"
}
Response Field Reference
| Field     |     | Type    | Purpose                 |     |
| --------- | --- | ------- | ----------------------- | --- |
| success   |     | boolean | Always false for errors |     |
| errorCode |     | string  | Stable machine code —   |     |
never localize
| message |     | string | Human-readable, localized  |     |
| ------- | --- | ------ | -------------------------- | --- |
per Accept-Language
| traceId |     | UUID | Correlates to logs — quote in  |     |
| ------- | --- | ---- | ------------------------------ | --- |
support tickets
| details |     | object[] | Field-level errors (for  |     |
| ------- | --- | -------- | ------------------------ | --- |
ValidationException only) — {
field, code, message }
53

PreOne Backend TD v1.0 | Backend Architecture Freeze
Field Type Purpose
timestamp ISO-8601 When the error occurred
path string Request path that triggered
the error
19.3 Global Exception Filter
Global ExceptionFilter सावे0 exceptions catch करतो(cid:15) आणि(cid:20) त्या(cid:2)न# (cid:2) standard response shape मध्या (cid:17)
translate करतो(cid:15). खा(cid:2)ली(cid:7)ली snippet filter ची(cid:2) essence दा(cid:2)खावेतो(cid:17) — full implementation
app/filters/all-exceptions.filter.ts मध्या (cid:17)आहा(cid:17):
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
catch(exception: unknown, host: ArgumentsHost) {
const ctx = host.switchToHttp();
const response = ctx.getResponse();
const request = ctx.getRequest();
const traceId = request.traceId;
let status: number;
let body: ErrorResponse;
if (exception instanceof DomainException) {
status = 400;
body = this.buildBody(exception.code, exception.message, traceId,
request.path);
} else if (exception instanceof BusinessException) {
status = 409;
body = this.buildBody(exception.code, exception.message, traceId,
request.path);
} else if (exception instanceof HttpException) {
status = exception.getStatus();
body = this.buildBody(exception.name, exception.message, traceId,
request.path);
} else {
// Unhandled - log + 500
logger.error({ exception, traceId });
status = 500;
body = this.buildBody('INTERNAL_ERROR', 'An unexpected error
occurred', traceId, request.path);
}
response.status(status).json(body);
}
}
54

PreOne Backend TD v1.0  |  Backend Architecture Freeze
20. Security
Security हा(cid:17) PreOne सा(cid:2)रख्या(cid:2) enterprise SaaS सा(cid:2)ठी(cid:7) non-negotiable आहा(cid:17). DPDP Act 2023, ISO
27001, आणि(cid:20) client contract SLAs strict security requirements impose करतो(cid:2)तो. PreOne ची(cid:2)
security approach defense-in-depth आहा (cid:17)— multiple layers मध्या (cid:17)controls, ज्या(cid:2)मळी' (cid:17) एक layer fail
झा(cid:2)ली(cid:2) तोर(cid:7) दासा' र(cid:2) defense दातो(cid:17) (cid:15). हा(cid:17) section ADR-022 मध्या (cid:17)documented controls ची(cid:2) summary आहा(cid:17).
20.1 Security Controls Catalog
| Control | Implementation | Purpose |
| ------- | -------------- | ------- |
JWT Authentication Access token 15 min (RS256  Stateless; horizontal scaling
|     | signed); refresh token 30 d  | friendly |
| --- | ---------------------------- | -------- |
(rotated, HttpOnly cookie)
Refresh Token Rotation Each refresh issues new  Detects token theft — both
|      | token; old one blacklisted | tokens used = revoke all |
| ---- | -------------------------- | ------------------------ |
| RBAC | Casbin policies; role →    | Fine-grained; per-route  |
|      | permissions matrix         | enforcement via          |
@Permissions decorator
Data Scope Validation Every query scoped by  Tenant isolation at ORM
|     | tenantId + branchId from  | layer (Prisma middleware) |
| --- | ------------------------- | ------------------------- |
JWT
Tenant Isolation PostgreSQL Row-Level  Defense in depth — even
|     | Security (RLS) policies | buggy query returns only  |
| --- | ----------------------- | ------------------------- |
tenant data
Branch Isolation Branch ID in JWT; query filter  Cross-branch access requires
|     | enforced | explicit permission |
| --- | -------- | ------------------- |
Academic Year Isolation Academic year ID in context;  Prevents mixing current +
|     | filter on every academic  | archived data |
| --- | ------------------------- | ------------- |
query
Rate Limiting Per-IP (anonymity) + per-user  Default 100 req/min; stricter
|     | (authenticated) limits | on auth routes (5/min) |
| --- | ---------------------- | ---------------------- |
Input Sanitisation DOMPurify on rich text;  XSS + SQL injection
|     | parameterised queries  | prevention |
| --- | ---------------------- | ---------- |
(Prisma)
PII Protection PII fields encrypted at rest  DPDP Act compliance
(pgcrypto); masked in logs
55

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Control | Implementation | Purpose |
| ------- | -------------- | ------- |
Audit Logging Every state-changing action  Compliance + forensic
|     | logged with user + diff | analysis |
| --- | ----------------------- | -------- |
Secrets Management AWS Secrets Manager;  No secrets in env files or
|     | rotated quarterly | code |
| --- | ----------------- | ---- |
CSP / Helmet Content-Security-Policy +  XSS mitigation in browser
OWASP headers
| CORS | Allowlist of origins per  | Production: only preone.app  |
| ---- | ------------------------- | ---------------------------- |
|      | environment               | + subdomains                 |
| HSTS | Force HTTPS; 1-year max-  | Prevents protocol            |
|      | age; includeSubDomains    | downgrade                    |
Dependency Scanning Snyk + npm audit in CI; fail on  Supply chain security
high+ vulns
| SAST | SonarCloud on every PR | Static analysis — bugs +  |
| ---- | ---------------------- | ------------------------- |
vulnerabilities
| DAST | OWASP ZAP scan on staging  | Runtime vulnerabilities |
| ---- | -------------------------- | ----------------------- |
weekly
20.2 Authentication Flow
JWT authentication ची(cid:2) flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). Access tokens short-lived (15 min) आहा(cid:17)तो —
compromise झा(cid:2)ल्या(cid:2)सा limited damage. Refresh tokens long-lived (30 d) प्र(cid:20) rotated — प्र(cid:9)त्याक(cid:17)

refresh न(cid:17) new token issue हा(cid:15)तो(cid:15) आणि(cid:20) old one blacklist हा(cid:15)तो(cid:15). दा(cid:15)न्हा(cid:7) tokens वे(cid:2)प्ररली(cid:17) गेल्(cid:17) या(cid:2)सा
(concurrent use) theft detect हा(cid:15)तो(cid:17) आणि(cid:20) सावे0 sessions revoke हा(cid:15)तो(cid:2)तो:
Login Request (email + password)
    ↓
Verify password (argon2 hash compare)
    ↓ valid
Issue Access Token (15 min, RS256 signed)
Issue Refresh Token (30 d, rotated, HttpOnly cookie)
    ↓
Client uses Access Token for API calls
    ↓ on expiry
Client calls /auth/refresh with Refresh Token
    ↓
Server verifies + rotates: new Access + new Refresh
    ↓ old refresh token blacklisted
Continue session
    -- OR --
    ↓ on logout
56

PreOne Backend TD v1.0 | Backend Architecture Freeze
Both tokens blacklisted
↓
Redis session record deleted
20.3 PII Protection
PII (Personally Identifiable Information) fields database मध्या(cid:17) encrypted at rest (pgcrypto)
store हा(cid:15)तो(cid:2)तो. Logs मध्या (cid:17)mask हा(cid:15)तो(cid:2)तो. Audit trail मध्या (cid:17)access logged हा(cid:15)तो(cid:15). DPDP Act Section 17 नसा' (cid:2)र
data principal (user) ली(cid:2) access, correction, आणि(cid:20) erasure ची(cid:2) right आहा(cid:17) — हा(cid:17) rights PreOne च्या(cid:2)
DSAR (Data Subject Access Request) workflow through honored हा(cid:15)तो(cid:2)तो.
21. Multi-Tenant Strategy
PreOne हा(cid:2) multi-tenant SaaS आहा(cid:17) — एकची instance 10,000+ schools serve करतो(cid:15). Tenant
isolation हा (cid:17)security ची(cid:2) foundation आहा(cid:17) — एक school ची data दासा' ऱ्या(cid:2) school ली(cid:2) कधी(cid:7)ची visible हा(cid:15)ऊ
नया.(cid:17) PreOne ची(cid:2) approach 'shared schema with discriminator' आहा(cid:17) — क(cid:15)(cid:20)त्या(cid:2)हा(cid:7) table मध्या (cid:17)
tenant_id column आहा(cid:17) आणि(cid:20) प्र(cid:9)त्या(cid:17)क query मध्या (cid:17)WHERE tenant_id = ? filter mandatory आहा(cid:17).
21.1 Isolation Layers
Tenant isolation 5 layers मध्या(cid:17) enforce हा(cid:15)तो(cid:17) — defense in depth. एक layer fail झा(cid:2)ली(cid:2) तोर(cid:7) दासा' र(cid:2)
defense दातो(cid:17) (cid:15). हा(cid:17) layers ADR-025 मध्या (cid:17)documented आहा(cid:17)तो:
Layer Mechanism Notes
Tenant Discriminator tenant_id column on every Index on (tenant_id, ...);
table partitioning-ready
JWT Claim tenantId in JWT payload Populated on login; verified
on every request
Prisma Middleware Auto-inject tenantId WHERE Catches missing filters; logs
clause violation
PostgreSQL RLS Row-Level Security policy per Last line of defense; failsafe if
tenant Prisma bypassed
Tenant Config Per-tenant settings (logo, Cached in Redis; hot reload
colors, modules enabled) on change
Tenant Onboarding New tenant = new schema? Cost-efficient; migration
No — shared schema with simplicity
discriminator
57

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Layer | Mechanism |     | Notes |
| ----- | --------- | --- | ----- |
Cross-Tenant Admin Platform admin role bypasses  Only platform team has this
|     | RLS (BYPASSRLS) |     | — audited |
| --- | --------------- | --- | --------- |
Tenant Backup/Restore Per-tenant logical backup  Customer data portability
(pg_dump with WHERE)
Tenant Deletion Soft delete + 90-day  DPDP Act right to erasure
|     | retention + then hard purge |     | compliance |
| --- | --------------------------- | --- | ---------- |
21.2 Isolation Scope
PreOne मध्या(cid:17) tenant हा(cid:2) primary isolation scope आहा(cid:17), प्र(cid:20) त्या(cid:2)वेर दा(cid:15)न additional scopes आहा(cid:17)तो —
Branch आणि(cid:20) Academic Year. Branch isolation optional आहा(cid:17) (multi-branch schools सा(cid:2)ठी(cid:7)),
Academic Year isolation academic queries सा(cid:2)ठी(cid:7) mandatory आहा(cid:17):
| Scope  | Mandatory? | Applies To          | Source            |
| ------ | ---------- | ------------------- | ----------------- |
| Tenant | Mandatory  | Every query, every  | tenantId from JWT |
table
| Branch | Optional (multi- | Branch-specific  | branchId from JWT  |
| ------ | ---------------- | ---------------- | ------------------ |
|        | branch schools)  | tables           | or query param     |
Academic Year Optional (academic- Academic tables academicYearId from
|     | year-aware queries) |     | context |
| --- | ------------------- | --- | ------- |
21.3 PostgreSQL RLS Policy
Row-Level Security (RLS) हा(cid:2) last line of defense आहा (cid:17)— जोर Prisma middleware bug असाली(cid:17)  णिक#वे(cid:2)
developer raw query णिलीणिहाली(cid:7) तोर(cid:7) RLS policy ensure करतो(cid:17) क(cid:7) cross-tenant data return हा(cid:15)तो न(cid:2)हा(cid:7).
खा(cid:2)ली(cid:7)ली snippet typical RLS policy दा(cid:2)खावेतो(cid:17). tenant_id session variable through set हा(cid:15)तो(cid:17) जो(cid:17)व्हा(cid:2)
connection acquire हा(cid:15)तो(cid:17):
-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see rows from their tenant
CREATE POLICY tenant_isolation ON students
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Platform admin bypasses RLS (audited)
CREATE ROLE platform_admin BYPASSRLS;

58

PreOne Backend TD v1.0  |  Backend Architecture Freeze
-- Application sets tenant_id on connection acquire:
--   SET app.tenant_id = 'abc-123-...';
--   SET app.user_id = 'user-456-...';
--   SET app.branch_id = 'branch-789-...';
22. Logging
Logging हा(cid:17) observability ची(cid:2) primary pillar आहा(cid:17). PreOne मध्या(cid:17) structured JSON logging (Pino)
वे(cid:2)प्ररली(cid:7) जो(cid:2)तो(cid:17) — free-text logs कठी(cid:7)(cid:20) parse कर(cid:2)याली(cid:2), त्या(cid:2)ऐवेजो(cid:7) structured fields enable करतो(cid:2)तो
efficient querying, alerting, आणि(cid:20) dashboarding. प्र(cid:9)त्याक(cid:17)  log entry traceId साहा correlate हा(cid:15)तो(cid:17)
ज्या(cid:2)मळी' (cid:17) single request ची(cid:2) complete journey एक(cid:2) query न(cid:17) fetch क(cid:17) ली(cid:2) जो(cid:2)ऊ शेकतो(cid:15).
22.1 Log Fields
प्र(cid:9)त्याक(cid:17)
 log entry खा(cid:2)ली(cid:7)ली fields contain करतो(cid:17). हा(cid:17) fields structured format मध्या(cid:17) emit हा(cid:15)तो(cid:2)तो ज्या(cid:2)मळी' (cid:17)
Loki / Elasticsearch मध्या(cid:17) indexed queryable हा(cid:15)तो(cid:2)तो. PII fields redact plugin न(cid:17) automatically
mask हा(cid:15)तो(cid:2)तो — developer ली(cid:2) manually redact करण्या(cid:2)ची(cid:7) गेरजो न(cid:2)हा(cid:7):
| Field     | Type                           | Purpose                    |
| --------- | ------------------------------ | -------------------------- |
| timestamp | ISO-8601 with ms               | When the log was generated |
| level     | info | warn | error | debug |  | Severity                   |
trace
| traceId | UUID | Distributed trace correlation |
| ------- | ---- | ----------------------------- |
| spanId  | UUID | Sub-span within trace         |
| userId  | UUID | Authenticated user (or null   |
for anon)
| tenantId | UUID   | Tenant context            |
| -------- | ------ | ------------------------- |
| branchId | UUID   | Branch context (optional) |
| module   | string | Module name (identity,    |
finance, etc.)
| method | string | Method/class generating the  |
| ------ | ------ | ---------------------------- |
log
| message | string | Human-readable message       |
| ------- | ------ | ---------------------------- |
| payload | object | Structured data (never PII)  |
| error   | object | Stack trace + code (only on  |
error level)
59

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Field    | Type   | Purpose                        |
| -------- | ------ | ------------------------------ |
| duration | number | Operation duration in ms (for  |
performance logs)
| requestId | UUID | Per-request correlation (set  |
| --------- | ---- | ----------------------------- |
by middleware)
22.2 Log Levels
Log levels severity indicate करतो(cid:2)तो. Production मध्या(cid:17) trace आणि(cid:20) debug disabled असातो(cid:2)तो — तो(cid:17)
staging / dev मध्या (cid:17)enable हा(cid:15)तो(cid:2)तो. warn आणि(cid:20) error ली(cid:2) alerting rules attach आहा(cid:17)तो — high volume
= automated alert:
| Level | When                          | Production Default     |
| ----- | ----------------------------- | ---------------------- |
| trace | Very detailed — SQL queries,  | Disabled in production |
cache hits/misses
| debug | Detailed diagnostic info | Enabled on staging; per- |
| ----- | ------------------------ | ------------------------ |
route enable on prod via
feature flag
| info | Normal operation — request  | Always enabled |
| ---- | --------------------------- | -------------- |
received, command
executed, event published
| warn | Unexpected but recoverable  | Always enabled; alert on  |
| ---- | --------------------------- | ------------------------- |
|      | — rate limit hit, retry     | >10/min                   |
scheduled, fallback used
error Failures requiring attention  Always enabled; alert on >0
|     | — external service down, DB  | in critical paths |
| --- | ---------------------------- | ----------------- |
error, unhandled exception
| fatal | Process must exit — config  | Always enabled; immediate  |
| ----- | --------------------------- | -------------------------- |
|       | invalid, port in use        | PagerDuty                  |
22.3 Pino Configuration
Pino logger ची(cid:2) configuration app/logger.ts मध्या (cid:17)आहा(cid:17). खा(cid:2)ली(cid:7)ली snippet essence दा(cid:2)खावेतो(cid:17) — async
transport (Loki push), redact paths (PII masking), serializers (custom request/response
logging), आणि(cid:20) child logger factory (per-module logger with module field pre-populated):
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
60

PreOne Backend TD v1.0 | Backend Architecture Freeze
paths: [
'req.headers.authorization',
'req.body.password',
'req.body.aadhaar',
'req.body.pan',
'*.aadhaar',
'*.pan',
'*.password',
],
censor: '[REDACTED]',
},
serializers: {
req: (req) => ({
method: req.method,
url: req.url,
traceId: req.traceId,
userId: req.user?.id,
tenantId: req.user?.tenantId,
}),
},
transport: process.env.NODE_ENV === 'production'
? { target: 'pino-loki', options: { host: process.env.LOKI_HOST } }
: { target: 'pino-pretty' },
});
23. Observability
Observability हा(cid:17) 'system ची interior state external outputs through infer करण्या(cid:2)ची(cid:7) ability' आहा(cid:17).
PreOne मध्या(cid:17) observability ची(cid:17) तो(cid:7)न pillars आहा(cid:17)तो — Metrics, Logs, Traces. हा(cid:17) तो(cid:7)नहा(cid:7) traceId न(cid:17)
correlate हा(cid:15)तो(cid:2)तो — एक trace ID शे(cid:7) dashboard मध्या(cid:17) सावे0 data query क(cid:17) ली(cid:2) जो(cid:2)ऊ शेकतो(cid:15). या(cid:2)मळी' (cid:17) root
cause analysis minutes मध्या (cid:17)हा(cid:15)तो(cid:17), न(cid:2)हा(cid:7)तोर hours.
23.1 Three Pillars
Pillar Tool What It Captures Retention
Metrics Prometheus + RED (Rate, Errors, 10s scrape interval
Grafana Duration) per
endpoint; Saturation
(DB pool, Redis
memory); Utilisation
(CPU, RAM, disk)
61

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Pillar | Tool | What It Captures | Retention |
| ------ | ---- | ---------------- | --------- |
Logs Pino JSON → Loki Structured; traceId  Indexed by traceId,
|     |     | correlation; 30-day  | userId, tenantId |
| --- | --- | -------------------- | ---------------- |
hot retention + 1-
year cold (S3)
Traces OpenTelemetry →  Distributed traces  1% sampling in prod;
|     | Tempo | across services; span  | 100% on errors |
| --- | ----- | ---------------------- | -------------- |
per DB/Redis/HTTP
call
| Alerts     | Prometheus      | Error rate, latency  | Severity-based  |
| ---------- | --------------- | -------------------- | --------------- |
|            | AlertManager →  | p95, saturation      | routing         |
|            | PagerDuty/Slack | thresholds           |                 |
| Dashboards | Grafana         | Per-module           | 10s refresh     |
dashboard + system
overview + tenant
health
Synthetic Monitoring Checkly / custom  Login, mark  Multi-region probes
|     | prober | attendance, generate  |     |
| --- | ------ | --------------------- | --- |
invoice every 5 min
23.2 Health Checks
Health checks k8s probes सा(cid:2)ठी(cid:7) critical आहा(cid:17)तो — liveness probe determine करतो(cid:17) क(cid:7) process
restart कर(cid:2)याची(cid:2) क(cid:2), readiness probe determine करतो(cid:17) क(cid:7) traffic route कर(cid:2)याची(cid:2) क(cid:2). खा(cid:2)ली(cid:7)ली table
सावे0 health endpoints ची(cid:7) catalog करतो(cid:17):
| Endpoint     | What It Checks     | Response | Used By               |
| ------------ | ------------------ | -------- | --------------------- |
| /health/live | Process is running | 200 OK   | Used by k8s liveness  |
probe
| /health/ready | Process can serve   | 200 OK or 503 | Used by k8s     |
| ------------- | ------------------- | ------------- | --------------- |
|               | traffic (DB, Redis  |               | readiness probe |
connected)
/health/startup Process has finished  200 OK Used by k8s startup
|     | booting |     | probe |
| --- | ------- | --- | ----- |
/health/deep All downstream  200 OK with details Manual + synthetic
|     | services reachable |     | monitoring |
| --- | ------------------ | --- | ---------- |
62

PreOne Backend TD v1.0  |  Backend Architecture Freeze
23.3 Alerting Strategy
Alerts हा(cid:17) actionable असा(cid:2)वे(cid:17) ली(cid:2)गेतो(cid:2)तो — जोर alert fire झा(cid:2)ली(cid:2) आणि(cid:20) on-call engineer ली(cid:2) क(cid:2)हा(cid:7) कर(cid:2)याची(cid:2)
नसाली(cid:17)  तोर alert noise आहा(cid:17). PreOne ची(cid:2) alerting strategy strict आहा(cid:17):
•  Critical alerts (errors in critical paths, DB down, Redis down) → PagerDuty, page on-
call immediately.
•  Warning alerts (latency p95 > SLO, cache hit ratio < 80%) → Slack, page only if
sustained for 5 min.
•  Info alerts (deployment completed, backup finished) → Slack info channel, no page.
•  Alerts include runbook link — on-call knows what to do without searching.
•  Alert fatigue prevention: suppress known-issue alerts, group similar alerts, auto-
resolve when issue clears.
24. Testing
Testing हा(cid:17) software quality ची(cid:2) foundation आहा(cid:17). PreOne ची(cid:2) testing approach classic test
pyramid follow करतो(cid:15) — broad base of fast unit tests, narrow top of slow E2E tests. या(cid:2)मळी' (cid:17)
feedback loop fast र(cid:2)हातो(cid:15) (unit tests ms मध्या(cid:17) run हा(cid:15)तो(cid:2)तो) आणि(cid:20) confidence high र(cid:2)हातो(cid:15) (E2E tests
real user journeys cover करतो(cid:2)तो).
24.1 Test Pyramid
| Layer | Tool | Scope | Coverage  | Speed |
| ----- | ---- | ----- | --------- | ----- |
Target
| Unit Tests  | Vitest | Pure TS —   | 100% coverage  | ms  |
| ----------- | ------ | ----------- | -------------- | --- |
| (Domain)    |        | aggregate,  | target         |     |
entity, VO, spec,
policy, domain
service
| Unit Tests    | Vitest + mocked  | Handler logic  | 90% coverage  | ms  |
| ------------- | ---------------- | -------------- | ------------- | --- |
| (Application) | repos            | with mocked    | target        |     |
repositories +
event bus
| Repository Tests | Vitest +        | Real DB —      | 80% coverage  | seconds |
| ---------------- | --------------- | -------------- | ------------- | ------- |
|                  | Testcontainers  | verify Prisma  | target        |         |
|                  | (Postgres)      | mapping +      |               |         |
migrations
63

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Layer | Tool | Scope | Coverage  | Speed |
| ----- | ---- | ----- | --------- | ----- |
Target
| Controller Tests | Vitest +  | HTTP layer —     | 70% coverage  | ms  |
| ---------------- | --------- | ---------------- | ------------- | --- |
|                  | supertest | DTO validation,  | target        |     |
auth guards,
response shape
| Integration  | Vitest +        | End-to-end      | Critical paths  | seconds |
| ------------ | --------------- | --------------- | --------------- | ------- |
| Tests        | Testcontainers  | within module   | only            |         |
|              | (full stack)    | — controller →  |                 |         |
handler → repo
→ DB
| Contract Tests | Pact | Consumer-         | Per integration  | seconds |
| -------------- | ---- | ----------------- | ---------------- | ------- |
|                |      | driven contracts  | point            |         |
between
bounded
contexts
| E2E Tests | Playwright +  | Full user        | Smoke tests per  | minutes |
| --------- | ------------- | ---------------- | ---------------- | ------- |
|           | real backend  | journeys across  | release          |         |
modules
| Load Tests | k6  | Performance  | Quarterly + pre- | minutes |
| ---------- | --- | ------------ | ---------------- | ------- |
|            |     | benchmarks;  | release          |         |
capacity
planning
| Chaos Tests | Litmus /  | Failure injection  | Quarterly | minutes |
| ----------- | --------- | ------------------ | --------- | ------- |
|             | Gremlin   | — DB kill, Redis   |           |         |
flush, network
partition
24.2 Test Pyramid Diagram
                  /\
                 /  \         E2E (10%)
                /----\        Playwright + real backend
               /      \
              /        \      Integration (20%)
             /----------\     Testcontainers + full stack
            /            \
           /              \   Unit (70%)
          /----------------\  Vitest + mocked repos

Speed:    fast <-----------> slow
Coverage: broad <---------> narrow
64

PreOne Backend TD v1.0 | Backend Architecture Freeze
Cost: cheap <---------> expensive
24.3 Testing Rules
• 70% unit, 20% integration, 10% E2E — classic pyramid
• Domain tests must be pure — no DB, no network, no async IO
• Test files live next to source (co-location): student.aggregate.ts →
student.aggregate.spec.ts
• Each PR must maintain or improve coverage — never decrease
• Tests run in CI on every push; failures block merge
• Flaky tests auto-disabled after 3 flakes; ticket created for fix
• Test data via factory functions (StudentFactory.create()) — never inline literals
• Mock at port boundary — mock repository interface, not Prisma client
• Integration tests use real Postgres via Testcontainers — never sqlite mock
• E2E tests run against staging with seeded data — reset between suites
24.4 Example — Aggregate Unit Test
Aggregate unit test pure domain logic verify करतो(cid:15) — क(cid:15)(cid:20)तो(cid:17)हा(cid:7) DB, क(cid:15)(cid:20)तो(cid:17)हा(cid:7) IO न(cid:2)हा(cid:7). खा(cid:2)ली(cid:7)ली
example StudentAggregate ची(cid:17) behavior verify करतो(cid:15). Tests co-located with source
(student.aggregate.spec.ts). Vitest native ESM support न(cid:17) fast execution णिमळीतो(cid:17):
describe('StudentAggregate', () => {
describe('enroll', () => {
it('should enroll student in section + raise StudentEnrolled event', () => {
// Arrange
const student = StudentFactory.create({ dateOfBirth: '2019-05-15' });
const section = SectionFactory.create({ capacity: 30, enrolledCount: 15 });
const academicYearId = UUID.v7();
// Act
const enrollment = student.enroll(section, academicYearId);
// Assert
expect(enrollment.studentId).toBe(student.id);
expect(enrollment.sectionId).toBe(section.id);
expect(section.enrolledCount).toBe(16);
const events = student.pullEvents();
expect(events).toHaveLength(1);
expect(events[0]).toBeInstanceOf(StudentEnrolledEvent);
expect(events[0].payload.studentId).toBe(student.id);
65

PreOne Backend TD v1.0 | Backend Architecture Freeze
});
it('should throw BusinessException when section is full', () => {
const student = StudentFactory.create();
const section = SectionFactory.create({ capacity: 30, enrolledCount: 30 });
expect(() => student.enroll(section, UUID.v7()))
.toThrow(BusinessException);
expect(student.pullEvents()).toHaveLength(0);
});
});
});
25. Performance
Performance हा(cid:17) user experience ची(cid:2) direct contributor आहा(cid:17) — slow app frustrates users आणि(cid:20)
drives churn. PreOne ची(cid:17) SLO (Service Level Objective) णिनधीBणिरतो आहा(cid:17)तो आणि(cid:20) तो(cid:17) continuously
monitor क(cid:17) ली (cid:17)जो(cid:2)तो(cid:2)तो. SLO breach alert trigger करतो(cid:17) आणि(cid:20) performance optimization sprint मध्या (cid:17)
priority item बनतो(cid:17).
25.1 Performance Tactics
PreOne मध्या (cid:17)12 distinct performance tactics apply हा(cid:15)तो(cid:2)तो. प्र(cid:9)त्याक(cid:17) tactic ची(cid:7) specific use case आहा(cid:17)
— blanket application न(cid:2)हा(cid:7). खा(cid:2)ली(cid:7)ली table सावे0 tactics ची(cid:7) catalog करतो(cid:17):
Tactic Mechanism Benefit When
Connection Pooling Prisma connection Tune per instance Avoid pool
pool (default = size exhaustion under
num_cpus × 2 + 1) load
Read Replica Routing Prisma client eventual Writes always to
extension routes consistency primary
reads to replica acceptable for
reports
Batch Operations Bulk insert/update Single round-trip Limit to 500 rows per
via Prisma batch
createMany /
updateMany
Pagination Cursor-based for Cursor = stable sort Avoid OFFSET
large tables; offset key 10000+ — slow
for small
66

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Tactic | Mechanism | Benefit | When |
| ------ | --------- | ------- | ---- |
Redis Cache Hot reads  ≥ 90% hit ratio target Invalidation via
|     | (permissions, menus,  |     | version bump |
| --- | --------------------- | --- | ------------ |
KPIs)
Async Jobs Long-running work  5s+ operations  Prevents request
|     | via BullMQ | offloaded | timeout |
| --- | ---------- | --------- | ------- |
Query Optimisation EXPLAIN ANALYZE in  Alert on > 100ms p95 Index review
|     | CI on slow queries |     | quarterly |
| --- | ------------------ | --- | --------- |
N+1 Prevention Prisma includes /  Lint rule: no nested  Auto-detect via
|     | DataLoader for  | find in loop | Prisma logging |
| --- | --------------- | ------------ | -------------- |
nested reads
Field Selection Prisma select() to  Reduces payload +  Especially for list
|     | fetch only needed  | memory | endpoints |
| --- | ------------------ | ------ | --------- |
columns
HTTP/2 + Brotli Compression +  30% smaller  Enabled at reverse
|     | multiplexing | payloads vs gzip | proxy |
| --- | ------------ | ---------------- | ----- |
CDN for Static CloudFront for S3- 1ms TTFB globally Pre-signed URLs still
|     | hosted assets |     | valid through CDN |
| --- | ------------- | --- | ----------------- |
Database Indexing Composite indexes  Audit quarterly Index-only scans
|     | for hot queries |     | where possible |
| --- | --------------- | --- | -------------- |
25.2 Service Level Objectives (SLOs)
SLOs measurable performance targets आहा(cid:17)तो. या(cid:2) targets consistently miss झा(cid:2)ल्या(cid:2)सा capacity
planning णिक#वे(cid:2) architecture review triggered हा(cid:15)तो(cid:15). PreOne ची(cid:17) SLOs aggressive प्र(cid:20) achievable
आहा(cid:17)तो — industry benchmarks शे(cid:7) aligned:
| Metric                     | Target    |     | Scope                      |
| -------------------------- | --------- | --- | -------------------------- |
| API p50 latency            | < 200 ms  |     | 99% of endpoints           |
| API p95 latency            | < 500 ms  |     | 99% of endpoints           |
| API p99 latency            | < 2000 ms |     | 99% of endpoints           |
| WebSocket message delivery | < 100 ms  |     | 99% of messages            |
| Background job pickup      | < 30 s    |     | 99% of jobs                |
| Report generation (small)  | < 30 s    |     | Single branch, single term |
| Report generation (large)  | < 5 min   |     | Multi-branch, full year    |
67

PreOne Backend TD v1.0 | Backend Architecture Freeze
Metric Target Scope
Database query p95 < 100 ms Alert if exceeded
Cache hit ratio (permissions) ≥ 90% Critical for auth path
Uptime ≥ 99.9% Monthly — ~43 min
downtime allowed
25.3 Connection Pooling
Prisma connection pool हा(cid:2) performance ची(cid:2) critical factor आहा(cid:17) — कम(cid:7) pool size = requests
queue, जो(cid:2)स्तो pool size = DB overload. PreOne ची(cid:7) pool sizing formula खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). हा(cid:17)
formula AWS RDS max_connections limit शे(cid:7) aligned आहा(cid:17) — खाप्र- जो(cid:2)स्तो connections असाल्या(cid:2)सा
RDS throttle करतो(cid:17):
Formula: pool_size = (num_cpus * 2) + 1
Example (t3.medium instance - 2 vCPU):
pool_size = (2 * 2) + 1 = 5
Example (t3.large instance - 4 vCPU):
pool_size = (4 * 2) + 1 = 9
If 4 app instances run, total DB connections = 4 * 5 = 20
RDS t3.medium max_connections ~= 90 (safe margin)
Monitoring:
- Prisma logs pool wait time
- Alert if wait > 100ms (pool exhaustion)
- Scale up instance OR add read replica
26. Coding Standards
Coding standards हा(cid:17) codebase consistency साणि'नणि6चीतो करतो(cid:2)तो — ज्या(cid:2)मळी' (cid:17) code read कर(cid:20),(cid:17) review
कर(cid:20),(cid:17) आणि(cid:20) maintain कर(cid:20) (cid:17)सा(cid:15)प्र (cid:17)हा(cid:15)तो(cid:17). PreOne ची (cid:17)standards strict प्र(cid:20) pragmatic आहा(cid:17)तो — developer
productivity balance with code quality. ESLint + Prettier automated enforcement करतो(cid:2)तो;
ब(cid:2)क(cid:7) rules PR review मध्या (cid:17)check हा(cid:15)तो(cid:2)तो.
26.1 Standards Catalog
• TypeScript strict mode enabled — no implicit any, no unchecked index access
• All types explicit — no var, no function keyword (use const arrow)
• PascalCase for classes/interfaces/types; camelCase for functions/variables
68

PreOne Backend TD v1.0 | Backend Architecture Freeze
• UPPER_SNAKE_CASE for constants; kebab-case for filenames
• One class per file; filename matches class name (student.aggregate.ts →
StudentAggregate)
• Import order: Node built-ins → external → internal absolute → relative → types
• No magic numbers — extract to named constant
• No any — use unknown + type guard if truly unknown
• Functional patterns preferred — pure functions, immutable data, no side effects
• Use Result<T, E> type for fallible operations (no thrown exceptions in domain layer)
• Comments explain WHY, not WHAT — code explains WHAT
• JSDoc on every public API (controller, service, repository method)
• No console.log — use Pino logger
• No Date — use ISO-8601 string or custom DateTime VO
• No Math.random for IDs — use UUID v7 (time-ordered)
• No setTimeout for business logic — use BullMQ delayed jobs
• No direct env access — use ConfigService
• No new Date().getFullYear() — use injected Clock service for testability
26.2 Pre-commit Hooks
Quality enforcement local level प्रर हा(cid:15)ण्या(cid:2)सा(cid:2)ठी(cid:7) Husky pre-commit hooks install आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17)
commit वेर lint + format + type-check run हा(cid:15)तो(cid:2)तो — failures commit block करतो(cid:2)तो. या(cid:2)मळी' (cid:17) broken
code repository मध्या (cid:17)push हा(cid:15)तो न(cid:2)हा(cid:7):
// package.json
"husky": {
"hooks": {
"pre-commit": "lint-staged",
"pre-push": "npm run test:unit"
}
},
"lint-staged": {
"*.ts": [
"eslint --fix",
"prettier --write",
"tsc --noEmit"
]
}
69

PreOne Backend TD v1.0 | Backend Architecture Freeze
26.3 PR Review Checklist
PR review मध्या(cid:17) खा(cid:2)ली(cid:7)ली checklist follow क(cid:17) ली(cid:2) जो(cid:2)तो(cid:15). हा(cid:17) checklist reviewer ची(cid:7) cognitive load कम(cid:7)
करतो(cid:17) — सावे0 aspects systematically cover हा(cid:15)तो(cid:2)तो:
• Domain logic in domain/ layer only — no business rules in controllers/handlers.
• Aggregate invariants enforced — no direct entity mutation outside aggregate.
• Repository returns domain aggregate — not Prisma model.
• DTOs have validation decorators + Zod schema + Swagger metadata.
• No console.log — use Pino logger.
• No any — use unknown + type guard.
• Tests added for new behavior — unit tests mandatory, integration tests for cross-
module.
• Error codes are stable + documented in error catalog.
• PII not logged — verify redact paths cover new fields.
• New env vars documented in .env.example + secrets manager.
27. Deployment Readiness
Deployment readiness checklist हा(cid:17) production release च्या(cid:2) quality gate आहा(cid:17) — या(cid:2)तो(cid:7)ली क(cid:15)(cid:20)तो(cid:2)हा(cid:7)
item pending असाली(cid:17) तोर deployment block हा(cid:15)तो(cid:15). Checklist ADR-028 मध्या(cid:17) defined आहा(cid:17) आणि(cid:20)
release manager च्या(cid:2) approval नतो# र production deployment proceed हा(cid:15)तो(cid:15). हा(cid:7) discipline
production incidents कम(cid:7) करतो(cid:17).
27.1 Pre-Deployment Checklist
Aspect Item Tool
Code All PRs merged to main; no Git
unmerged feature branches
Migrations Prisma migrations applied to prisma migrate deploy
staging; verified
Tests All tests green in CI; coverage Vitest + Codecov
≥ 80%
Lint ESLint + Prettier clean; 0 ESLint
warnings
70

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Aspect   | Item                          | Tool                |
| -------- | ----------------------------- | ------------------- |
| Env Vars | All required env vars set in  | AWS Secrets Manager |
production secrets store
| Feature Flags | New features behind flags;  | Flagsmith / custom |
| ------------- | --------------------------- | ------------------ |
default off
| Database Backup | Pre-deployment backup  | pg_dump + S3 |
| --------------- | ---------------------- | ------------ |
taken + verified restorable
| Rollback Plan | Documented rollback steps;  | Runbook |
| ------------- | --------------------------- | ------- |
tested in staging
| Monitoring | Dashboards + alerts  | Grafana + AlertManager |
| ---------- | -------------------- | ---------------------- |
configured for new metrics
| Logs      | New log fields indexed in Loki | Loki  |
| --------- | ------------------------------ | ----- |
| Traces    | New spans visible in Tempo     | Tempo |
| Load Test | k6 load test on critical new   | k6    |
endpoints; meets SLO
| Security Scan | Snyk + SonarCloud clean; no  | Snyk + Sonar |
| ------------- | ---------------------------- | ------------ |
new vulnerabilities
| Documentation | README + API docs updated;  | Compodoc + Swagger |
| ------------- | --------------------------- | ------------------ |
Swagger regenerated
| Runbook | Operational runbook for new  | Confluence |
| ------- | ---------------------------- | ---------- |
module updated
| On-call | On-call rotation updated;  | PagerDuty |
| ------- | -------------------------- | --------- |
new alerts mapped to team
| Stakeholder Comms | Release notes circulated;  | Email |
| ----------------- | -------------------------- | ----- |
stakeholders notified
| Window | Deployment window  | Calendar |
| ------ | ------------------ | -------- |
scheduled (low-traffic: 11 PM
IST)
27.2 Deployment Topology
Production deployment topology खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). हा(cid:17) topology AWS hosted आहा(cid:17) — multi-AZ
for HA, autoscaling for elasticity, आणि(cid:20) managed services for operational simplicity. खा(cid:2)ली(cid:7)ली
table सावे0 infrastructure components ची(cid:7) catalog करतो(cid:17):
71

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Component     | Service         | Notes                     |
| ------------- | --------------- | ------------------------- |
| Reverse Proxy | Nginx / AWS ALB | TLS termination, HTTP/2,  |
brotli compression
| App Tier | Kubernetes (EKS) — min 3  | HPA on CPU + custom      |
| -------- | ------------------------- | ------------------------ |
|          | replicas                  | metrics                  |
| Database | Amazon RDS PostgreSQL 16  | Primary + 1 read replica |
Multi-AZ
Cache Amazon ElastiCache Redis 7.2  Multi-AZ, automatic failover
(cluster mode off)
| Queue          | Same ElastiCache Redis  | BullMQ uses DB 0; cache      |
| -------------- | ----------------------- | ---------------------------- |
|                | (logical DB separation) | uses DB 1                    |
| Object Storage | Amazon S3               | Server-side encryption (SSE- |
KMS)
| CDN | CloudFront | For static assets + pre-signed  |
| --- | ---------- | ------------------------------- |
S3 URLs
| Secrets | AWS Secrets Manager | Auto-rotation for DB  |
| ------- | ------------------- | --------------------- |
credentials
| CI/CD | GitHub Actions → ECR → EKS | Blue-green for zero  |
| ----- | -------------------------- | -------------------- |
downtime
Observability Grafana Cloud (Prometheus +  Or self-hosted on dedicated
|     | Loki + Tempo) | node |
| --- | ------------- | ---- |
27.3 CI/CD Pipeline
CI/CD pipeline GitHub Actions वेर आहा (cid:17)— प्र(cid:9)त्या(cid:17)क push ची(cid:2) build + test + security scan हा(cid:15)तो(cid:15), main
branch merge झा(cid:2)ल्या(cid:2)वेर staging deploy हा(cid:15)तो(cid:15), production deploy manual approval नतो# र हा(cid:15)तो(cid:15).
Blue-green deployment pattern zero-downtime releases साणि'नणि6चीतो करतो(cid:15):
Push to feature branch
    ↓
CI: lint + typecheck + unit tests
    ↓ pass
CI: integration tests (Testcontainers)
    ↓ pass
CI: build Docker image + push to ECR
    ↓
CI: Snyk + SonarCloud scan
    ↓ pass
PR review + approval
    ↓ merge to main
72

PreOne Backend TD v1.0 | Backend Architecture Freeze
CD: deploy to staging (auto)
↓
Smoke tests on staging
↓ pass
Manual approval (release manager)
↓
CD: blue-green deploy to production
↓
Health checks + smoke tests
↓ pass
Traffic switch + old version drain
↓
Release complete (rollback if anomalies)
28. Glossary
Backend terminology ची(cid:7) authoritative reference. नवे(cid:7)न terms introduce करतो(cid:2)न(cid:2) या(cid:2) glossary
मध्या(cid:17) entry add कर(cid:2)वे(cid:7) ली(cid:2)गेली(cid:17) . Onboarding engineers सा(cid:2)ठी(cid:7) हा(cid:2) glossary प्रणिहाली(cid:2) read कर(cid:2)याची(cid:2)
resource आहा(cid:17) — domain vocabulary build करण्या(cid:2)सा(cid:2)ठी(cid:7).
Term Meaning
ACID Atomicity, Consistency, Isolation, Durability
— properties of reliable database
transactions
ACL Anti-Corruption Layer — translation layer
between bounded contexts to prevent model
pollution
ADR Architecture Decision Record — short
document capturing a single architectural
decision
Aggregate Cluster of domain objects treated as a single
unit for data consistency; has one root
Bounded Context Explicit boundary within which a domain
model makes sense and terms have one
meaning
BullMQ Redis-backed queue library for Node.js; used
for background jobs in PreOne
Casbin Authorization library supporting RBAC, ABAC,
ACL; used for PreOne permission checks
73

PreOne Backend TD v1.0 | Backend Architecture Freeze
Term Meaning
CQRS Command Query Responsibility Segregation
— separate models for reads vs writes
DLQ Dead Letter Queue — queue for messages
that failed processing after retries
DTO Data Transfer Object — serialisable object for
crossing process/network boundaries
DDD Domain-Driven Design — software approach
that mirrors business domain in code
HPA Horizontal Pod Autoscaler — Kubernetes
controller that scales pods based on metrics
Idempotency Property where repeated operations produce
same result — critical for safe retries
JWT JSON Web Token — compact, signed token
for stateless authentication
OTLP OpenTelemetry Protocol — wire format for
exporting traces, metrics, logs
Glossary (cont.)
Term Meaning
Outbox Pattern Writing events to DB table in same
transaction as data; async publisher drains
table
PII Personally Identifiable Information — data
that can identify an individual
Prisma Type-safe ORM for Node.js / TypeScript —
schema-first, generates client
RAG Reduction in Force — but in PreOne context:
Retrieval-Augmented Generation for AI
features
RBAC Role-Based Access Control — permissions
assigned to roles; users inherit via role
Redis In-memory key-value store — used for cache,
pub/sub, queues, rate limiting
74

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Term |     | Meaning                                  |     |
| ---- | --- | ---------------------------------------- | --- |
| RLS  |     | Row-Level Security — PostgreSQL feature  |     |
that filters rows by user/tenant context
| SAGA |     | Pattern for managing multi-step transactions  |     |
| ---- | --- | --------------------------------------------- | --- |
with compensating actions on failure
| SLO |     | Service Level Objective — target metric for  |     |
| --- | --- | -------------------------------------------- | --- |
service quality (e.g., 99.9% uptime)
| Specification |     | Pattern encapsulating business rule as  |     |
| ------------- | --- | --------------------------------------- | --- |
composable predicate (e.g.,
AgeEligibilitySpec)
| Tenant |     | Customer organisation in multi-tenant SaaS  |     |
| ------ | --- | ------------------------------------------- | --- |
— in PreOne, a school
| UoW |     | Unit of Work — pattern that tracks changes  |     |
| --- | --- | ------------------------------------------- | --- |
and commits them as a single transaction
| Value Object |     | Immutable object identified by its values  |     |
| ------------ | --- | ------------------------------------------ | --- |
(e.g., Address, Money) — no identity
| Vitest |     | Modern test runner for Vite-powered  |     |
| ------ | --- | ------------------------------------ | --- |
projects — used for PreOne unit tests
| WebSocket |     | Full-duplex communication protocol over TCP  |     |
| --------- | --- | -------------------------------------------- | --- |
— used for real-time features in PreOne
29. Document Control
29.1 Version History
| Version | Date       | Author               | Changes            |
| ------- | ---------- | -------------------- | ------------------ |
| 1.0     | 2026-07-14 | PreOne Architecture  | Initial version —  |
|         |            | Team                 | Backend            |
Architecture Freeze
29.2 Approval Matrix
या(cid:2) document च्या(cid:2) freeze सा(cid:2)ठी(cid:7) खा(cid:2)ली(cid:7)ली roles ची(cid:7) approval mandatory आहा(cid:17). सावे 0approvals recorded
असाल्या(cid:2)वेरची document 'Architecture Freeze' status मध्या (cid:17)move हा(cid:15)तो(cid:15):
75

PreOne Backend TD v1.0  |  Backend Architecture Freeze
| Role            | Name  | Responsibility       | Status  |
| --------------- | ----- | -------------------- | ------- |
| Chief Architect | [TBD] | Architecture review  | Pending |
+ sign-off
| VP Engineering       | [TBD] | Engineering approval | Pending |
| -------------------- | ----- | -------------------- | ------- |
| Tech Lead - Identity | [TBD] | Identity module      | Pending |
review
| Tech Lead - Finance | [TBD] | Finance module  | Pending |
| ------------------- | ----- | --------------- | ------- |
review
| DevOps Lead | [TBD] | Deployment +  | Pending |
| ----------- | ----- | ------------- | ------- |
observability review
| Security Officer | [TBD] | Security +  | Pending |
| ---------------- | ----- | ----------- | ------- |
compliance review
29.3 Review Cadence
•  Architecture Freeze: quarterly review (Q1, Q2, Q3, Q4)
•  Major version bump (v2.0): on architectural shift (e.g., microservices split)
•  Minor version bump (v1.1): on new chapter / significant section addition
•  Patch version bump (v1.0.1): on clarification / typo fixes only
29.4 Distribution List
हा(cid:2)  document  खा(cid:2)ली(cid:7)ली  teams  प्रर  distributed  आहा(cid:17). Internal Engineering Reference —
confidential, not for external distribution:
•  PreOne Architecture Team (primary authors + maintainers)
•  PreOne Engineering Team (all backend engineers)
•  PreOne QA Team (test strategy + integration testing reference)
•  PreOne DevOps / SRE Team (deployment + observability reference)
•  PreOne Product Team (technical constraints awareness)
•  PreOne Onboarding Team (new hire orientation reference)
•  PreOne Security Team (security + compliance review)
•  PreOne Leadership (architectural investment decisions)
76

PreOne Backend TD v1.0  |  Backend Architecture Freeze
29.5 Companion Documents
हा(cid:2) document खा(cid:2)ली(cid:7)ली documents साहा read क(cid:17) ली(cid:2) जो(cid:2)वे(cid:2) — त्या(cid:2)ची# (cid:2) context this document ली(cid:2)
supplement करतो(cid:15):
| Document        | Version | Relationship            |
| --------------- | ------- | ----------------------- |
| Vision Document | v1.0    | Strategic intent + non- |
functional requirements
| BRC | v1.0 | 176 business rules —  |
| --- | ---- | --------------------- |
backend implementation
reference
| Master PRD | v1.0 | Functional requirements —  |
| ---------- | ---- | -------------------------- |
API endpoint mapping
| DDD | v1.0 | Domain model — backend  |
| --- | ---- | ----------------------- |
module structure
| ADR Catalog | v1.0 | Architecture decisions —  |
| ----------- | ---- | ------------------------- |
backend choices rationale
| ERD v3.0 | v3.0 | Physical schema —  |
| -------- | ---- | ------------------ |
repository data access layer
| Prisma Schema v3.0 | v3.0 | Code-first schema — Prisma  |
| ------------------ | ---- | --------------------------- |
client generation
| API Contract Catalog | v1.0 | Endpoint contracts —  |
| -------------------- | ---- | --------------------- |
controller implementation
spec
29.6 Deliverables
या(cid:2) Backend Technical Design document मधीन-  खा(cid:2)ली(cid:7)ली production artifacts तोया(cid:2)र हा(cid:15)तो(cid:7)ली. हा(cid:17)
artifacts implementation phase मध्या (cid:17)engineering team द्वा(cid:2)र(cid:17) deliver क(cid:17) ली (cid:17)जो(cid:2)तो(cid:7)ली:
•  Complete NestJS Folder Structure — 14 domain modules with consistent template.
•  Controllers (~530 REST APIs) — versioned, Swagger-documented, RBAC-enforced.
•  DTO Library — request/response/query DTOs with class-validator + Zod + Swagger.
•  Application & Domain Services — workflow orchestration + pure business rules.
•  CQRS Commands / Queries / Handlers — for complex workflows only (per
ADR-012).
•  Domain Event Catalog — 24 events with versioned schema + outbox publishing.
77

PreOne Backend TD v1.0 | Backend Architecture Freeze
• BullMQ Job Definitions — 12 queues with retry policy + DLQ + alerting.
• Redis Cache Design — 10 cache layers with versioned invalidation.
• Transaction Strategy — aggregate = boundary, saga for multi-aggregate.
• Exception & Validation Framework — 6 validation layers + standardised error
response.
• Logging & Observability Standards — structured logging + 3 pillars + alerting.
• Testing Strategy — test pyramid + coverage targets + Testcontainers.
• Backend Implementation Guidelines — coding standards + PR review checklist.
78
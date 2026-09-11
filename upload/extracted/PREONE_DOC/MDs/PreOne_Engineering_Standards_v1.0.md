P R E O N E E N T E R P R I S E
PreOne Engineering
Standards
Engineering Standards — Enterprise Preschool Operating System
Document Version: 1.0
Status: Engineering Freeze
Date: 2026-07-13
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Vision v1.0, ADR v1.0, DDD v1.0, Master PRD v1.0
Successor: Coding Guidelines, CI/CD Pipeline, QA Standards, DevOps Standards
Classification: Internal Engineering Reference
Prepared by: PreOne Architecture & Engineering Team
PreOne Platform ENG v1.0

PreOne Engineering Standards v1.0 | Engineering Freeze
Table of Contents
Introduction.......................................................................................................................1
Document Purpose...............................................................................................................1
Scope & Applicability............................................................................................................2
How to Use This Document..................................................................................................2
Document Hierarchy............................................................................................................2
Standards Series Overview...................................................................................................2
ENG-001: Engineering Principles & Architecture Standards.................................................3
Core Philosophy....................................................................................................................3
Six Engineering Priorities......................................................................................................3
Ten Engineering Rules..........................................................................................................4
Layered Architecture............................................................................................................4
Forbidden Architecture Patterns....................................................................................4
Domain-Driven Design Alignment........................................................................................5
Project Structure Standards.................................................................................................5
Per-Aggregate File Structure................................................................................................6
ENG-002: Coding & Naming Standards................................................................................6
Language & Framework Stack..............................................................................................6
Code Size Limits....................................................................................................................7
Forbidden Patterns...............................................................................................................7
Naming Standards................................................................................................................7
ESLint Rules..........................................................................................................................7
Prettier Configuration...........................................................................................................8
ENG-003: API & Database Standards...................................................................................8
API Design Principles............................................................................................................8
1

PreOne Engineering Standards v1.0 | Engineering Freeze
HTTP Methods......................................................................................................................9
Standard Response Format................................................................................................10
Success Response Example..........................................................................................10
Error Response Example..............................................................................................11
Error Code Taxonomy.........................................................................................................13
API Versioning....................................................................................................................13
Database Standards............................................................................................................13
Indexing Standards.............................................................................................................14
Migration Standards...........................................................................................................14
ENG-004: Security Engineering Standards.........................................................................15
Authentication Standards..................................................................................................15
Authorization Standards.....................................................................................................16
Secrets Management.........................................................................................................16
Encryption Standards.........................................................................................................16
HTTP Security Headers.......................................................................................................16
Input Protection.................................................................................................................17
Audit Logging......................................................................................................................17
Secure Development Lifecycle (SDL)..................................................................................17
ENG-005: Logging & Observability Standards....................................................................18
Log Levels...........................................................................................................................18
Mandatory Request Fields.................................................................................................18
Never Log These.................................................................................................................18
Structured Log Format.......................................................................................................20
Metrics Standards..............................................................................................................22
Distributed Tracing.............................................................................................................23
Dashboards.........................................................................................................................23
Alerting Standards..............................................................................................................23
ENG-006: Testing & QA Standards....................................................................................23
2

PreOne Engineering Standards v1.0 | Engineering Freeze
Coverage Standards...........................................................................................................24
Test Pyramid.......................................................................................................................24
Mandatory Test Types........................................................................................................24
Forbidden Testing Practices...............................................................................................24
Mocking Strategy................................................................................................................26
Test Naming Conventions..................................................................................................26
QA Gates.............................................................................................................................26
ENG-007: Code Review & Git Standards............................................................................26
Branch Model.....................................................................................................................27
Commit Convention...........................................................................................................27
Commit Rules.....................................................................................................................27
Pull Request Standards.......................................................................................................28
Code Review Checklist........................................................................................................29
Reasons to Reject a PR.......................................................................................................29
ENG-008: CI/CD & DevOps Standards...............................................................................31
Pipeline Stages...................................................................................................................31
Deployment Blockers.........................................................................................................31
Environments.....................................................................................................................33
Deployment Strategies.......................................................................................................33
Rollback Policy....................................................................................................................33
Quality Gates......................................................................................................................34
Release Standards..............................................................................................................34
ENG-009: Performance & Monitoring Standards...............................................................35
Performance Budgets.........................................................................................................35
Caching Strategy.................................................................................................................35
Query Optimization............................................................................................................36
Monitoring Coverage.........................................................................................................37
Alert Severities...................................................................................................................37
3

PreOne Engineering Standards v1.0 | Engineering Freeze
Incident Response..............................................................................................................38
Capacity Planning...............................................................................................................38
ENG-010: AI-Assisted Development Standards..................................................................38
Core Principles....................................................................................................................38
Allowed AI Use Cases.........................................................................................................39
Forbidden AI Use Cases......................................................................................................40
AI Code Review Requirements...........................................................................................41
Prompt Hygiene..................................................................................................................41
AI Effectiveness Metrics.....................................................................................................42
Appendix A: Engineering Checklist — Before Merge.........................................................42
Code Quality.......................................................................................................................42
Tests...................................................................................................................................44
Security...............................................................................................................................45
Domain Driven Design........................................................................................................46
Error Handling....................................................................................................................47
Logging & Observability.....................................................................................................48
Database.............................................................................................................................49
API Design...........................................................................................................................51
Documentation...................................................................................................................52
CI/CD & Review..................................................................................................................53
Appendix B: Static Analysis Rules......................................................................................54
Appendix C: Secure Development Lifecycle (SDL)..............................................................54
Appendix D: Quality Gates................................................................................................55
Appendix E: Glossary........................................................................................................55
Document Control & Sign-off............................................................................................55
Approval Matrix..................................................................................................................56
Revision History..................................................................................................................56
Document Control..............................................................................................................56
4

PreOne Engineering Standards v1.0 | Engineering Freeze
Right-click the table above and choose “Update Field” to refresh page numbers.
5

PreOne Engineering Standards v1.0 | Engineering Freeze
Introduction
Document Purpose
This Engineering Standards document is the authoritative reference for how software is
built, tested, deployed, and operated at PreOne. It consolidates ten sub-standards
(ENG-001 through ENG-010) plus five appendices into a single engineering freeze,
applicable to every engineer, contractor, and AI-assisted workflow contributing to the
PreOne platform. Compliance is mandatory; deviations require architecture approval
documented in an Architecture Decision Record (ADR).
The standards are derived from the predecessor documents — Vision v1.0, ADR Catalog
v1.0, DDD v1.0, and Master PRD v1.0 — and operationalize the architectural and business
decisions captured in those documents. Where this document and a predecessor conflict,
this document takes precedence for engineering execution; the predecessor remains
authoritative for product and architectural direction. Successor documents (Coding
Guidelines, CI/CD Pipeline, QA Standards, DevOps Standards) will reference this document
as the source of truth for engineering rules.
Scope & Applicability
These standards apply to all production code running under the PreOne brand: the backend
API (NestJS + TypeScript + Prisma + PostgreSQL), the web frontend (Next.js 16), the mobile
apps (React Native), the infrastructure layer (Terraform + Kubernetes + Helm), and the
supporting tooling (code generators, migration scripts, data seeders). They apply to first-
party engineers, contractors, and AI-generated code alike. Code that does not follow these
standards does not merge, regardless of author or deadline.
Out of scope: marketing websites (governed by brand guidelines, not engineering
standards), internal hack-week prototypes (governed by lighter rules), and third-party
vendor code running in customer environments (governed by vendor SLA). However, any
code that processes PreOne customer data — regardless of where it runs — must comply
with the security standards in ENG-004 and the data protection clauses of the Master PRD.
How to Use This Document
Each of the ten sub-standards (ENG-001 through ENG-010) is self-contained and can be
read independently. An engineer working on a new endpoint should read ENG-002 (Coding
& Naming), ENG-003 (API & Database), ENG-004 (Security), ENG-005 (Logging), and
6

PreOne Engineering Standards v1.0  |  Engineering Freeze
ENG-006 (Testing) before writing code. An engineer setting up a new service should
additionally read ENG-001 (Architecture), ENG-008 (CI/CD), and ENG-009 (Performance &
Monitoring). An engineer using AI tools should read ENG-010. Appendices A through E
provide cross-cutting checklists, static analysis rules, the secure development lifecycle,
quality gates, and a glossary.
The Engineering Checklist (Appendix A) is the consolidated pre-merge bar. Print it, pin it,
use it on every PR. The Static Analysis Rules (Appendix B) are enforced by CI automatically;
understanding them helps write code that passes on the first try. The Secure Development
Lifecycle (Appendix C) governs feature-level security from requirements through release.
The Quality Gates (Appendix D) define what blocks merge and what blocks release. The
Glossary (Appendix E) defines PreOne-specific terminology used throughout.
Document Hierarchy
| Document        | Version | Relationship | Authority           |
| --------------- | ------- | ------------ | ------------------- |
| Vision Document | v1.0    | Predecessor  | Product & business  |
direction
| ADR Catalog | v1.0 | Predecessor | Architectural  |
| ----------- | ---- | ----------- | -------------- |
decisions
| DDD Document | v1.0 | Predecessor | Domain model and  |
| ------------ | ---- | ----------- | ----------------- |
bounded contexts
| Master PRD | v1.0 | Predecessor | Product  |
| ---------- | ---- | ----------- | -------- |
requirements
| **Engineering     | **v1.0** | **This document** | **Engineering  |
| ----------------- | -------- | ----------------- | -------------- |
| Standards**       |          |                   | execution**    |
| Coding Guidelines | TBD      | Successor         | Detailed code  |
patterns (per-
language)
| CI/CD Pipeline | TBD | Successor | Pipeline  |
| -------------- | --- | --------- | --------- |
configuration
reference
| QA Standards | TBD | Successor | Test strategy and  |
| ------------ | --- | --------- | ------------------ |
tooling
| DevOps Standards | TBD | Successor | Infrastructure and  |
| ---------------- | --- | --------- | ------------------- |
operations
7

PreOne Engineering Standards v1.0  |  Engineering Freeze
Standards Series Overview
The Engineering Standards series is structured as ten independent sub-standards, each
focused on a specific engineering discipline. This modular structure allows engineers to
consume only the standards relevant to their current task, enables AI-assisted
development to load only the relevant context, and supports independent versioning as
each discipline evolves. The table below summarizes the ten sub-standards and their
primary audience.
| ID      | Title                     | Primary Audience          |
| ------- | ------------------------- | ------------------------- |
| ENG-001 | Engineering Principles &  | All engineers, architects |
Architecture Standards
| ENG-002 | Coding & Naming Standards | All engineers                |
| ------- | ------------------------- | ---------------------------- |
| ENG-003 | API & Database Standards  | Backend engineers, DBAs      |
| ENG-004 | Security Engineering      | All engineers, security team |
Standards
| ENG-005 | Logging & Observability  | All engineers, on-call |
| ------- | ------------------------ | ---------------------- |
Standards
| ENG-006 | Testing & QA Standards      | All engineers, QA        |
| ------- | --------------------------- | ------------------------ |
| ENG-007 | Code Review & Git Standards | All engineers            |
| ENG-008 | CI/CD & DevOps Standards    | DevOps, release managers |
| ENG-009 | Performance & Monitoring    | All engineers, on-call   |
Standards
ENG-010 AI-Assisted Development  All engineers using AI tools
Standards
8

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-001: Engineering Principles & Architecture Standards
Establish the foundational engineering philosophy and architectural guardrails that every
PreOne engineer, contractor, and AI-assisted workflow must follow. This standard defines
the non-negotiable principles, layered architecture, DDD alignment, and project structure
conventions that ensure long-term maintainability, security, and scalability across the
PreOne platform.
Core Philosophy
PreOne engineering follows a strict priority order: Readable before Maintainable,
Maintainable before Secure, Secure before Testable, Testable before Observable,
Observable before Scalable. When two values conflict, the earlier value wins. A scalable
system that is unreadable will not survive the next engineer; a fast system that is
unobservable will not survive the next incident. This priority order is the foundation of
every architectural and engineering decision at PreOne.
The philosophy is operationalized through ten engineering rules (below), a layered
architecture that separates concerns, DDD alignment that protects the domain core, and a
project structure that mirrors the bounded contexts. Every engineer must internalize these
principles before contributing to the codebase. Code review enforces them; CI automates
them; this document codifies them.
Six Engineering Priorities
Priority Description
Readable Code is read 10× more than it is written.
Optimize for the next reader, not the current
writer. Names must reveal intent; structure
must reveal architecture; comments must
reveal the why, not the what.
Maintainable Every change must leave the codebase
healthier than it was found. Maintainability is
measured by the time it takes a new engineer
to safely make a change — not by the
cleverness of the original implementation.
9

PreOne Engineering Standards v1.0 | Engineering Freeze
Priority Description
Secure Security is a default, not a feature. Every
input is hostile until validated; every output is
leaky until sanitized; every secret is exposed
until rotated; every privilege is abused until
scoped.
Testable If it cannot be tested, it cannot be trusted.
Business logic must be isolated from
infrastructure; dependencies must be
injectable; side effects must be explicit;
coverage must be measurable.
Observable Production behavior must be reconstructable
from logs, metrics, and traces alone. If a bug
cannot be diagnosed without adding new
code, the system is not observable — it is
only running.
Scalable Design for 10× current load without re-
architecture. Statelessness, idempotency,
async boundaries, and horizontal scaling are
defaults — not optimizations added later.
Ten Engineering Rules
Rule Detail
Clean Code First Code must express intent through naming,
structure, and minimal abstractions.
Cleverness is a defect. If a junior engineer
cannot read it in one pass, rewrite it.
Business Logic inside Domain All business rules, state transitions, and
invariants live inside DDD aggregates and
domain services. Controllers, repositories,
and DTOs must never contain business logic
— only orchestration and translation.
Security by Default Every endpoint requires authentication and
authorization by default — public access must
be explicitly declared and reviewed. Every
database query is parameterized. Every
secret comes from Vault or env var — never
hardcoded.
10

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Fail Fast Validate inputs at the boundary (controller /
DTO). Throw domain exceptions at the core.
Never swallow errors silently. Never return
null when an empty collection or exception
communicates intent.
Explicit over Implicit Prefer named arguments, explicit types, and
visible dependencies over magic strings,
dynamic typing, and hidden side effects.
Dependency injection over global state.
Named exports over default exports.
Immutable where possible Value Objects are immutable. DTOs are
immutable. Configuration is immutable per
request. Mutation is restricted to aggregate
roots and only through intent-revealing
methods.
Small Components Max function size 50 lines, max class size 500
lines, max file size 400 lines, max nesting 3
levels, max parameters 5. Anything larger is a
refactor candidate, not a PR.
Single Responsibility Each module, class, and function has exactly
one reason to change. A controller that also
validates, persists, and notifies violates this —
split it.
DRY (Don't Repeat Yourself) Duplication of business rules or domain
knowledge is forbidden. Duplication of
boilerplate is acceptable when extraction
would couple unrelated modules.
KISS (Keep It Simple, Stupid) The simplest correct solution is the best
solution. Architecture astronauts will be
grounded. Premature abstraction is worse
than duplication.
Layered Architecture
PreOne follows a strict four-layer architecture inspired by DDD and Hexagonal Architecture.
Each layer has a single responsibility and a strictly enforced dependency direction:
Presentation depends on Application; Application depends on Domain and Infrastructure
interfaces; Domain depends on nothing; Infrastructure implements Domain interfaces.
11

PreOne Engineering Standards v1.0  |  Engineering Freeze
Violations of this dependency direction — such as a controller calling a repository directly,
or a domain entity importing Prisma — are blocking code review findings.
| Layer         | Responsibility        | Allowed            | Forbidden       |
| ------------- | --------------------- | ------------------ | --------------- |
|               |                       | Dependencies       | Dependencies    |
| Presentation  | HTTP routing,         | Application Layer  | Domain,         |
| (Controller)  | request parsing, DTO  | only               | Infrastructure  |
|               | validation, response  |                    | (direct)        |
serialization, auth
scope enforcement.
Zero business logic.
Application Service Orchestrates use  Domain Layer,  HTTP, ORM, external
|     | cases, coordinates   | Infrastructure  | APIs directly |
| --- | -------------------- | --------------- | ------------- |
|     | aggregates, manages  | Interfaces      |               |
transactions,
publishes domain
events. Contains no
business rules —
only workflow.
Domain (Aggregate /  Business rules,  Other domain  Any layer above or
| Entity / VO) | invariants, state  | objects only | infrastructure |
| ------------ | ------------------ | ------------ | -------------- |
transitions. Pure
TypeScript, no
framework deps, no
I/O. The heart of the
system.
Infrastructure  Persistence (Prisma),  Domain interfaces,  Business logic of any
| (Repository /      | external API calls,  | external libs | kind |
| ------------------ | -------------------- | ------------- | ---- |
| Gateway / Adapter) | message bus, file    |               |      |
storage. Implements
interfaces declared
in Domain or
Application.
Forbidden Architecture Patterns
The following architecture patterns are explicitly forbidden. Their presence in a PR is a
blocking review finding — not a suggestion, not a 'refactor later', but a 'do not merge until
fixed'.
•  Controller → Repository (skips Application and Domain layers)
12

PreOne Engineering Standards v1.0 | Engineering Freeze
• Controller ↓ Repository (with business logic in controller)
• Domain → Prisma (couples pure domain to ORM)
• Repository → Controller (inverse dependency)
• Cross-aggregate direct reference (must use ID, not object reference)
• Aggregate root reaches into another aggregate's internals
• Service that holds mutable static state
• Domain service that calls database directly
Domain-Driven Design Alignment
PreOne's architecture is DDD-aligned: each bounded context owns its own domain model,
ubiquitous language, and aggregate roots. Cross-context communication happens via
domain events or anti-corruption layers, never via direct database access or shared
mutable state. The eight DDD rules below are non-negotiable; they protect the integrity of
the domain model and prevent the 'big ball of mud' anti-pattern that plagues monolithic
systems without clear boundaries.
DDD Rule Detail
One Aggregate = One Transaction A single transaction boundary never spans
multiple aggregates. Cross-aggregate
coordination uses domain events and
eventual consistency, not foreign locks.
Repository only for Aggregate Root Repositories exist exclusively for aggregate
roots. Internal entities are loaded and
persisted through their root, never directly.
There is no StudentProfileRepository — only
StudentRepository.
Value Objects are immutable Money, Address, DateRange, Quantity,
TaxBreakup are all value objects. Equality is
structural (all fields equal), not referential.
Mutation returns a new instance.
Entities have identity Entities (Student, Invoice, Staff) are defined
by their ID, not their attributes. Two students
with the same name but different IDs are
different students.
13

PreOne Engineering Standards v1.0 | Engineering Freeze
DDD Rule Detail
Aggregate enforces invariants Every aggregate root enforces its own
consistency rules. If Invoice.total !=
sum(items.price), the Invoice throws, not the
controller or service.
Domain events for cross-aggregate When Admission is approved, it raises
AdmissionApproved. Student listens and
creates a Student record. The Admission
aggregate does not call StudentRepository —
that would couple aggregates.
Bounded contexts own their language The word 'Student' in the Admissions context
means 'candidate'; in the Student context it
means 'enrolled child'; in Finance it means
'payer'. Each context's ubiquitous language is
sovereign.
Anti-Corruption Layer for external Payment gateways, WhatsApp, government
APIs — all isolated behind an ACL that
translates external schemas into PreOne
domain models. Provider changes never leak
past the ACL.
Project Structure Standards
The PreOne monorepo is organized by bounded context, with shared kernels extracted into
packages. Each domain folder contains the full vertical slice (controller, service, repository,
entity, DTO, mapper, module, spec) for its aggregates. Cross-cutting concerns (auth, RBAC,
audit) live in the platform folder. Truly shared value objects (Money, DateRange) live in the
shared package and require architecture review to modify.
Path Purpose Owner
/apps/api/src/domains/ Admissions bounded context Admissions Squad
admissions/ — controller, application,
domain, infrastructure
folders per aggregate
/apps/api/src/domains/ Student bounded context — Student Squad
student/ student master, classroom,
promotion
14

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Path | Purpose | Owner |
| ---- | ------- | ----- |
/apps/api/src/domains/ Finance bounded context —  Finance Squad
| finance/ | invoice, payment, refund, fee  |     |
| -------- | ------------------------------ | --- |
plan
/apps/api/src/platform/ Cross-cutting: auth, RBAC,  Platform Squad
audit, tenancy, AI gateway,
integration manager
/apps/api/src/shared/ Truly shared kernel — Money  Platform Squad (gated)
VO, DateRange VO,
pagination, error codes, base
classes
| /apps/web/ | Next.js 16 frontend — admin  | Frontend Squad |
| ---------- | ---------------------------- | -------------- |
portal, parent app, teacher
app
| /apps/mobile/ | React Native parent +  | Mobile Squad |
| ------------- | ---------------------- | ------------ |
teacher mobile apps
/packages/contracts/ Shared TypeScript types —  Platform Squad
DTOs, enums, event schemas
— consumed by all apps
| /packages/ui/ | Shared design system  | Frontend Squad |
| ------------- | --------------------- | -------------- |
components — buttons,
tables, forms — used by all
frontends
| /infra/ | Terraform, Kubernetes  | DevOps Squad |
| ------- | ---------------------- | ------------ |
manifests, Helm charts,
deployment scripts
| /docs/ | ADR catalog, ERD, API specs,  | Architecture |
| ------ | ----------------------------- | ------------ |
runbooks, postmortems
| /tools/ | Code generators, migration  | Platform Squad |
| ------- | --------------------------- | -------------- |
scripts, data seeders, linters
config
Per-Aggregate File Structure
Each aggregate in a bounded context is represented by a fixed set of eight files, each with a
single responsibility. This consistency allows any engineer to navigate any aggregate in the
codebase without reading documentation — the file structure itself is the documentation.
New aggregates must follow this pattern exactly; deviations require architecture approval.
15

PreOne Engineering Standards v1.0 | Engineering Freeze
File Role
student.controller.ts HTTP entrypoint — route handlers, DTO
binding, auth guard, response mapping
student.service.ts Application service — orchestrates use case,
opens transaction, publishes events
student.repository.ts Infrastructure — Prisma implementation of
IStudentRepository interface
student.entity.ts Domain — aggregate root with invariants,
factory methods, state transitions
student.dto.ts Contracts — request/response DTOs with
class-validator decorators
student.mapper.ts Pure functions — DTO ↔ Entity ↔ Prisma
Model translations
student.module.ts NestJS module — wires controller, service,
repository, providers
student.spec.ts Unit tests — entity behavior, service
orchestration, mapper purity
16

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-002: Coding & Naming Standards
Define the language, structure, size limits, and naming conventions that every line of
PreOne code must follow. These standards are enforced by ESLint, Prettier, SonarQube, and
mandatory code review — not by goodwill. Code that fails these gates does not merge,
regardless of author or deadline.
Language & Framework Stack
PreOne's technology stack is intentionally narrow. Every language and framework choice
has been made deliberately, with a focus on type safety, ecosystem maturity, and long-
term maintainability. Engineers do not introduce new languages or frameworks without
architecture approval documented in an ADR. This discipline prevents the 'technology zoo'
that makes long-term maintenance expensive.
Layer Choice
Primary TypeScript
StrictMode Strict (no implicit any, no implicit this, no null
without explicit check)
Ecmascript Latest stable (ES2024+ features allowed:
optional chaining, nullish coalescing, top-level
await in scripts, structured clone)
Backend NestJS 11+ with decorators, dependency
injection, and module-per-aggregate
structure
Orm Prisma 5+ with raw SQL only for analytics
queries (reviewed by architecture)
Database PostgreSQL 16+ with UUID primary keys,
JSONB for flexible metadata, partial indexes
for soft-delete queries
Frontend Next.js 16 with App Router, React Server
Components by default, client components
only when interactivity requires
Mobile React Native 0.74+ with Hermes, Reanimated
3, and offline-first architecture
17

PreOne Engineering Standards v1.0 | Engineering Freeze
Code Size Limits
Code size limits are not guidelines — they are CI-enforced gates. ESLint rules block PRs that
exceed these limits. The rationale is not aesthetic; large functions, classes, and files are
empirically more defect-prone, harder to review, and harder to test. When a limit is hit, the
correct response is to refactor — not to disable the rule.
Metric Limit Rationale
Max Function Size 50 lines Beyond 50 lines a function is
doing too much — extract
helpers, reduce branches, or
split responsibility
Max Class Size 500 lines Beyond 500 lines a class has
multiple reasons to change
— split into cohesive smaller
classes
Max File Size 400 lines Beyond 400 lines navigation
becomes painful — split by
responsibility
Max Nesting 3 levels Deeper nesting hides bugs —
extract early returns, guard
clauses, or helper functions
Max Parameters 5 Beyond 5 parameters the
function is doing too much —
group into an options object
Max Cyclomatic Complexity 10 per method Higher complexity makes
testing exponential —
refactor with strategy
pattern or lookup table
Max Cognitive Complexity 15 per method SonarQube measures how
hard code is to read —
beyond 15 needs refactor
Code Duplication < 3% Duplication above 3%
indicates missing abstraction
— extract shared helper or
value object
18

PreOne Engineering Standards v1.0 | Engineering Freeze
Forbidden Patterns
The following patterns are forbidden in PreOne code. Their presence triggers ESLint errors
(blocking CI) or mandatory code review rejection. Each forbidden pattern has a safe
alternative documented; engineers should reach for the alternative, not the forbidden
pattern.
Forbidden Detail
Magic Numbers Use named constants:
`OTP_EXPIRY_MINUTES = 5`, not
`setTimeout(fn, 300000)`
Hardcoded Strings Use enums or constants:
`StudentStatus.ACTIVE`, not `'ACTIVE'`
Business Logic in Controller Controllers orchestrate; they do not
compute. Move rules to domain.
Duplicate Code Copy-paste is a defect. Extract shared module
or accept the duplication with explicit `//
DRY-WAIVER:` comment and architecture
sign-off.
Circular Dependency Modules must form a DAG. Cycles indicate a
missing abstraction — extract shared module.
Direct SQL in Controller SQL belongs in repository implementations
behind interfaces. Analytics queries need
architecture review.
any type `any` disables type safety. Use `unknown` +
narrowing, or define a proper type. ESLint
`@typescript-eslint/no-explicit-any` is error-
level.
console.log in production code Use structured logger (`logger.info`,
`logger.error`). Console output bypasses log
routing, correlation IDs, and PII redaction.
Sync I/O in async context Never use `fs.readFileSync` in a request path.
Async only.
Un awaited promises Every Promise must be awaited or explicitly
fire-and-forget with `.catch()` handler logged.
Mutable global state Globals are forbidden except for read-only
config loaded at boot.
19

PreOne Engineering Standards v1.0  |  Engineering Freeze
Forbidden Detail
var keyword Use `const` by default, `let` only when
reassignment is required. `var` is forbidden.
Naming Standards
Naming is the single most impactful readability lever. Consistent naming allows engineers
to scan code without reading every line — the name itself reveals the type, role, and scope
of the identifier. PreOne enforces naming conventions through ESLint rules and code
review; violations are blocking. The conventions below apply to all PreOne code, regardless
of language or framework.
| Category | Convention | Examples |
| -------- | ---------- | -------- |
Variables camelCase. Start lowercase,  studentName, feeAmount,
|     | each subsequent word   | attendanceDate, isEligible,  |
| --- | ---------------------- | ---------------------------- |
|     | capitalized. Booleans  | hasPaid                      |
prefixed with
is/has/can/should.
| Classes | PascalCase. Nouns for         | StudentService,        |
| ------- | ----------------------------- | ---------------------- |
|         | entities, suffixed with role  | InvoiceRepository,     |
|         | (Service, Repository,         | FeeCalculator,         |
|         | Calculator, Controller,       | AdmissionApprovedEvent |
Module, Gateway, Strategy).
| Interfaces | PascalCase with I prefix.       | IStudentRepository,        |
| ---------- | ------------------------------- | -------------------------- |
|            | Interfaces that mirror a class  | IPaymentGateway,           |
|            | use I prefix. Interfaces that   | IEmailSender, IAuditLogger |
are pure data shapes (DTOs)
do not.
| Enums | PascalCase enum,         | StudentStatus.ACTIVE,  |
| ----- | ------------------------ | ---------------------- |
|       | UPPER_CASE values. Enum  | PaymentStatus.PAID,    |
|       | name is singular noun.   | AttendanceType.PRESENT |
Values are UPPER_CASE.
Numeric enums forbidden;
use string enums for
readability.
20

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Category  | Convention                   | Examples                |
| --------- | ---------------------------- | ----------------------- |
| Constants | UPPER_SNAKE_CASE. Top-       | MAX_RETRY, OTP_EXPIRY,  |
|           | level constants only. Local  | CACHE_TTL,              |
|           | constants may use            | DEFAULT_PAGE_SIZE       |
camelCase if scope is a single
function.
| ApiPaths | Plural nouns, kebab-case,    | /api/v1/students,      |
| -------- | ---------------------------- | ---------------------- |
|          | versioned. Plural resource   | /api/v1/invoices,      |
|          | names, kebab-case for multi- | /api/v1/admission-     |
|          | word, version prefix         | applications,          |
|          | mandatory. Never verbs in    | /api/v2/fees/calculate |
path.
DbTables snake_case plural. Plural  students, invoice_items,
|     | snake_case. Junction tables  | fee_plans, audit_logs |
| --- | ---------------------------- | --------------------- |
use both parents:
`student_guardian`.
| DbColumns | snake_case. snake_case.  | student_id, created_at,  |
| --------- | ------------------------ | ------------------------ |
|           | Booleans prefixed        | is_active, total_amount  |
`is_`/`has_`. Foreign keys
suffixed `_id`. Timestamps
suffixed `_at`.
| Files | kebab-case for modules,     | admissions.module.ts,       |
| ----- | --------------------------- | --------------------------- |
|       | entity-named for aggregate  | student.controller.ts, fee- |
|       | files. Aggregate files use  | calculator.service.ts       |
entity name
(student.controller.ts).
Helper files use kebab-case
(fee-calculator.ts).
| EnvVars | UPPER_SNAKE_CASE with         | PREONE_DB_URL,      |
| ------- | ----------------------------- | ------------------- |
|         | PREONE_ prefix. All env vars  | PREONE_JWT_SECRET,  |
|         | prefixed with PREONE_.        | PREONE_REDIS_URL    |
Never inline secrets in code.
EnvVarFiles .env.local, .env.dev, .env.stag .env.local, .env.dev
ing, .env.prod
(gitignored). .env.example
committed with placeholder
values. Real env files
gitignored.
21

PreOne Engineering Standards v1.0  |  Engineering Freeze
ESLint Rules
The ESLint configuration is the automated enforcement of ENG-002. Every rule below is
either 'error' (blocks CI) or 'warn' (triggers review comment). Engineers do not disable
ESLint rules inline without architecture approval and a tracking issue. The configuration is
versioned in the monorepo and inherited by all packages.
| Rule                   | Level | Rationale                     |
| ---------------------- | ----- | ----------------------------- |
| @typescript-eslint/no- | error | `any` defeats type safety —   |
| explicit-any           |       | use `unknown` + narrowing     |
| @typescript-eslint/no- | error | Dead code accumulates;        |
| unused-vars            |       | remove or prefix with `_` if  |
intentionally unused
@typescript-eslint/explicit- error Return types must be explicit
| function-return-type       |       | on public APIs                |
| -------------------------- | ----- | ----------------------------- |
| @typescript-eslint/no-     | error | Every Promise must be         |
| floating-promises          |       | awaited or explicitly handled |
| @typescript-eslint/strict- | warn  | Catches `if (value)` where    |
| boolean-expressions        |       | value could be 0 or empty     |
string
| no-console | error | Use structured logger;  |
| ---------- | ----- | ----------------------- |
console bypasses log routing
| no-magic-numbers | warn | Extract to named constants;  |
| ---------------- | ---- | ---------------------------- |
allow 0, 1, -1
| max-lines-per-function | error | Functions must be small and  |
| ---------------------- | ----- | ---------------------------- |
focused
| max-params | error | Beyond 5 params, group into  |
| ---------- | ----- | ---------------------------- |
options object
| max-depth  | error | Deep nesting hides bugs      |
| ---------- | ----- | ---------------------------- |
| complexity | error | Cyclomatic complexity limit  |
per method
| import/no-cycle | error | Circular dependencies  |
| --------------- | ----- | ---------------------- |
indicate missing abstraction
| import/order | warn | Consistent import order  |
| ------------ | ---- | ------------------------ |
improves readability
22

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Rule                 | Level | Rationale                       |
| -------------------- | ----- | ------------------------------- |
| no-restricted-syntax | error | Forbid `var`, `for-in` without  |
`hasOwnProperty`, `eval`
Prettier Configuration
Prettier handles code formatting; ESLint handles code quality. The two are complementary
— Prettier runs first (formatting), then ESLint runs (quality). The Prettier configuration is
fixed across the monorepo; engineers do not customize it per-package. Consistent
formatting eliminates 'diff noise' in code review and reduces cognitive load.
| Setting    | Value | Rationale                 |
| ---------- | ----- | ------------------------- |
| printWidth | 100   | Wide enough for readable  |
code, narrow enough for
split-screen review
| tabWidth | 2   | Standard for TS/JS  |
| -------- | --- | ------------------- |
ecosystems
| semi | true | Always semicolons —  |
| ---- | ---- | -------------------- |
prevents ASI bugs
| singleQuote | true | Single quotes for strings,  |
| ----------- | ---- | --------------------------- |
double for JSX attributes
| trailingComma | all | Cleaner diffs, easier  |
| ------------- | --- | ---------------------- |
reordering
| bracketSpacing | true   | { foo } not {foo}      |
| -------------- | ------ | ---------------------- |
| arrowParens    | always | (x) => x not x => x —  |
consistent and easier to add
params
| endOfLine | lf  | Unix line endings across all  |
| --------- | --- | ----------------------------- |
platforms
23

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-003: API & Database Standards
Define how PreOne APIs are designed, versioned, secured, and documented, and how the
underlying PostgreSQL database is structured, indexed, and queried. These standards
guarantee that every API is uniform, every response is predictable, every query is
performant, and every schema change is non-breaking.
API Design Principles
PreOne APIs are RESTful, JSON-encoded, HTTPS-only, and versioned. Every API follows the
same design principles regardless of domain, ensuring that a developer who learns one
endpoint can predict the structure of any other. Consistency is enforced through shared
DTO base classes, a global response interceptor, and an OpenAPI spec that is generated
from the code (not written by hand).
• REST over JSON — resources are nouns, methods are verbs, state is explicit
• HTTPS only — HTTP requests are redirected, never served
• Stateless — every request carries full auth context, no server-side session
• Versioned — path-based versioning (/api/v1/, /api/v2/) with deprecation policy
• Idempotent writes — POST/PATCH accept Idempotency-Key header for safe retries
• Pagination mandatory — no unbounded list endpoints, default page size 20, max
100
• Structured errors — every error response has code, message, traceId; never stack
traces
• Consistent fields — snake_case in JSON (matches DB), camelCase in TS code,
mapping in DTO
HTTP Methods
PreOne uses four HTTP methods (GET, POST, PATCH, DELETE). PUT is forbidden — its full-
replacement semantics conflict with our soft-delete and audit-column model. Idempotency
is supported via the Idempotency-Key header for POST and PATCH on critical endpoints
(payments, refunds, admissions approval). Every method has a single, well-defined
semantic; engineers do not overload methods.
24

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Method | Usage                      | Examples                   |
| ------ | -------------------------- | -------------------------- |
| GET    | Read resource(s). Never    | GET /api/v1/students, GET  |
|        | mutates state. Cacheable.  | /api/v1/students/123       |
Idempotent.
| POST | Create a new resource.  | POST /api/v1/students, POST  |
| ---- | ----------------------- | ---------------------------- |
|      | Trigger an action. Not  | /api/v1/invoices/123/send    |
idempotent unless
Idempotency-Key provided.
PATCH Partial update of a resource.  PATCH /api/v1/students/123,
|     | Not idempotent unless     | PATCH                      |
| --- | ------------------------- | -------------------------- |
|     | payload is deterministic. | /api/v1/invoices/123/mark- |
paid
DELETE Soft-delete a resource. Sets  DELETE /api/v1/students/123
deleted_at. Idempotent.
Never hard-deletes PII
records.
| PUT | Forbidden in PreOne — use  | (none) |
| --- | -------------------------- | ------ |
PATCH for partial updates.
PUT implies full replacement
which conflicts with our soft-
delete + audit model.
Standard Response Format
Every API response follows the same envelope: a 'success' boolean, a 'data' object (or
array), a 'meta' object (pagination, trace ID), and a 'traceId' for support. Error responses
follow a parallel structure with an 'error' object containing 'code', 'message', and optional
'field'/'details'. This consistency allows client SDKs to handle responses generically and
allows support engineers to correlate any customer-reported issue via trace ID.
Success Response Example
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "totalPages": 8,
    "traceId": "abc-123-xyz"
  }
25

PreOne Engineering Standards v1.0  |  Engineering Freeze
}
Error Response Example
{
  "success": false,
  "error": {
    "code": "VALIDATION_001",
    "message": "feeAmount must be a positive number",
    "field": "feeAmount",
    "details": [{ "field": "feeAmount", "rule": "min", "value": -500 }]
  },
  "traceId": "abc-123-xyz"
}
Error Code Taxonomy
PreOne uses a structured error code taxonomy: CATEGORY_NUMBER (e.g., AUTH_001,
VALIDATION_001, BUSINESS_001). The category tells the client what kind of error it is; the
number identifies the specific error. HTTP status codes are derived from the error category
— engineers do not pick HTTP status codes directly. This prevents the common bug where
similar errors return different status codes across endpoints.
| Code     | HTTP Status | Meaning             | Retryable |
| -------- | ----------- | ------------------- | --------- |
| AUTH_001 | 401         | Missing or invalid  | No        |
authentication token
| AUTH_002 | 403 | Authenticated but  | No  |
| -------- | --- | ------------------ | --- |
not authorized for
this resource/action
| AUTH_003       | 401 | Token expired        | Yes (refresh token)  |
| -------------- | --- | -------------------- | -------------------- |
| VALIDATION_001 | 422 | Request body failed  | No (client must fix) |
DTO validation
| PERMISSION_001 | 403 | User lacks required  | No  |
| -------------- | --- | -------------------- | --- |
permission scope
| NOT_FOUND_001 | 404 | Resource does not  | No  |
| ------------- | --- | ------------------ | --- |
exist or belongs to
another tenant
| CONFLICT_001 | 409 | Optimistic  | Yes (with fresh GET) |
| ------------ | --- | ----------- | -------------------- |
concurrency conflict
or duplicate unique
key
26

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Code         | HTTP Status | Meaning           | Retryable |
| ------------ | ----------- | ----------------- | --------- |
| BUSINESS_001 | 422         | Domain invariant  | No        |
violated (e.g., cannot
promote to same
grade)
| RATE_LIMIT_001 | 429 | Too many requests  | Yes |
| -------------- | --- | ------------------ | --- |
— back off using
Retry-After header
| SYSTEM_001 | 500 | Unexpected server  | No  |
| ---------- | --- | ------------------ | --- |
error — ops alerted,
traceId for support
| SYSTEM_002 | 503 | Service unavailable  | Yes |
| ---------- | --- | -------------------- | --- |
— maintenance or
downstream failure
API Versioning
API versioning is path-based (/api/v1/, /api/v2/). The version is part of the URL — visible to
clients, cacheable by CDNs, and unambiguous in logs. Breaking changes require a new
major version; non-breaking changes (adding fields, adding endpoints) are allowed within a
version. Old versions are supported for 12 months after the new version ships, with
deprecation announced via the Sunset HTTP header and developer email.
| Rule |     | Detail |     |
| ---- | --- | ------ | --- |
Path-based versioning /api/v1/students, /api/v2/students. URL is
the contract; versioning is visible to clients
and cacheable.
Never breaking change within a version Adding fields is allowed. Removing/renaming
fields, changing types, changing semantics —
all require a new major version.
Deprecation policy Old version supported for 12 months after
new version ships. Deprecation announced
via Sunset HTTP header and developer email.
| Removal policy |     | After 12-month deprecation window, old  |     |
| -------------- | --- | --------------------------------------- | --- |
version returns 410 Gone with migration
guide URL in error message.
27

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Backward-compatible additions New optional fields, new endpoints, new
enum values (with safe default), new query
params — all allowed within same version.
Changelog mandatory Every API change logged in
/docs/api/changelog.md with version, date,
breaking/non-breaking flag, and migration
notes.
Database Standards
PreOne uses PostgreSQL 16+ as its sole OLTP database. Every table follows the same
structural conventions: UUID primary key, multi-tenant columns (tenant_id, school_id,
branch_id), audit columns (created_at, created_by, updated_at, updated_by, deleted_at),
and soft delete (deleted_at). These conventions are non-negotiable; migrations that violate
them are rejected in review. Prisma is the ORM; raw SQL is allowed only for analytics
queries with architecture review.
Rule Detail
UUID Primary Keys Every table uses `id UUID PRIMARY KEY
DEFAULT gen_random_uuid()`. UUIDs
prevent enumeration attacks, allow offline
generation, and simplify sharding.
Multi-tenant columns mandatory Every business table has `tenant_id`,
`school_id`, `branch_id UUID NOT NULL`.
Composite indexes on these. Cross-tenant
queries forbidden at ORM layer.
Audit columns mandatory Every table has `created_at TIMESTAMPTZ,
created_by UUID, updated_at TIMESTAMPTZ,
updated_by UUID, deleted_at TIMESTAMPTZ
NULL`.
Soft delete mandatory DELETE sets `deleted_at = NOW()`. Every
query includes `WHERE deleted_at IS NULL`
unless explicitly fetching archived records.
Partial index supports this.
No SELECT * Explicit column lists only. SELECT * breaks on
schema changes, hides intent, and pulls
unneeded data. Prisma select{} mandatory.
28

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Pagination mandatory Every list query has LIMIT + OFFSET or cursor.
Default page size 20, max 100. Unbounded
queries are a defect.
Parameterized queries only No string concatenation in SQL. Prisma
parameterizes by default. Raw SQL uses `$1,
$2` placeholders.
Foreign keys enforced Every relation has FK constraint with ON
DELETE RESTRICT for parent tables, ON
DELETE CASCADE only for true children (e.g.,
invoice_items).
JSONB for flexible metadata Use JSONB for genuinely flexible fields
(template variables, integration configs).
Never for fields that need indexing or
querying.
Timestamps in TIMESTAMPTZ Never TIMESTAMP without timezone. All
timestamps stored as UTC, displayed in user
timezone at API layer.
Indexing Standards
Indexes are the single most impactful performance lever in a relational database. PreOne
indexes every foreign key (Prisma does not auto-index), every frequently-filtered column,
every unique business key, and uses partial indexes for soft-delete queries. Composite
indexes are ordered by selectivity (tenant_id first, then most selective column). EXPLAIN
ANALYZE is run on every new query in review to verify index usage.
Index Type Rule
Foreign Key Every FK column indexed. Prisma does not
auto-index FKs — explicit
`@@index([tenant_id, school_id, branch_id])`
Search Frequently filtered columns (status, email,
phone, admission_number) get B-tree
indexes. Text search uses GIN index with
`to_tsvector('english', name)`
29

PreOne Engineering Standards v1.0 | Engineering Freeze
Index Type Rule
Unique Business unique constraints
(admission_number per tenant, email per
tenant, invoice_number per tenant) use
`@@unique([tenant_id, admission_number])`
Composite Multi-column queries (e.g., branch +
academic_year + status) get composite index
ordered by selectivity
Partial Soft-delete queries get partial index: `CREATE
INDEX ... WHERE deleted_at IS NULL`
Covering Hot list queries get INCLUDE clause to cover
SELECT list without table lookup
Migration Standards
Database migrations are forward-only and tested on staging with production-scale data
before production deployment. Destructive migrations (drop column, rename) follow the
expand-contract pattern: add new column, backfill, switch reads, drop old column — across
two releases. Index creation uses CREATE INDEX CONCURRENTLY to avoid blocking writes.
Every migration PR documents the rollback plan in its description.
• Every schema change via Prisma migration — never manual SQL on prod
• Migrations are forward-only — down migrations are dangerous, write a new
forward migration to reverse
• Destructive migrations (drop column, rename) require 2-step: deprecate → wait 1
release → drop
• Large table migrations use expand-contract pattern: add new column → backfill →
switch reads → drop old
• Index creation uses `CREATE INDEX CONCURRENTLY` — never block writes
• Migration tested on staging with prod-scale data before prod deploy
• Migration rollback plan documented in PR description
• Zero-downtime deployments — app must tolerate both old and new schema during
rolling deploy
30

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-004: Security Engineering Standards
Define the security controls that protect PreOne's children, parents, staff, and business
data. These standards are non-negotiable: every API requires auth, every secret is rotated,
every PII field is encrypted, every action is audited, and every dependency is scanned.
Security review is mandatory before any external-facing feature ships.
Authentication Standards
PreOne supports seven authentication methods, each scoped to a specific use case. JWT
(15-minute expiry) is the primary access token; refresh tokens (30-day) enable seamless
session extension; OTP is used for parent login and admin MFA; passwords are hashed with
Argon2id (never MD5, never SHA, never bcrypt with cost < 12). API keys (90-day rotation)
handle service-to-service auth; service tokens (mTLS) handle internal microservice auth.
Every method has explicit expiry, rotation, and revocation policies.
Method Detail
JWT (Access Token) RS256 signed, 15-minute expiry, claims: sub,
tenant_id, school_id, branch_id, scope, exp,
iat. Stored in httpOnly Secure cookie for web,
in secure storage for mobile.
Refresh Token Opaque random token, 30-day expiry, stored
hashed in DB, single-use (rotated on each
refresh), revoked on logout/password
change.
OTP 6-digit numeric, 5-minute expiry, max 3
attempts, rate-limited per phone (5/hour),
hashed in Redis with TTL. Used for parent
login and admin MFA.
Password Argon2id with memory=64MB, iterations=3,
parallelism=4. Never MD5, never SHA, never
bcrypt with cost < 12. Password never logged,
never returned in API response.
MFA Ready TOTP (Google Authenticator) for admin roles.
Backup codes stored hashed. SMS OTP
fallback for parents. WebAuthn planned for
v2.
31

PreOne Engineering Standards v1.0 | Engineering Freeze
Method Detail
API Key Service-to-service auth. 90-day rotation
mandatory. Stored hashed (SHA-256). Scoped
to specific endpoints. Revocable instantly via
admin UI.
Service Token Internal microservice auth via mTLS + short-
lived JWT issued by internal IdP. Never
crosses trust boundary.
Authorization Standards
Authorization in PreOne is RBAC-based with five layers of enforcement. First, every
endpoint is decorated with @RequirePermissions. Second, permissions are cached in Redis
for 5 minutes (cache invalidated on role change). Third, scope validation enforces data
scope (teacher sees only their classroom). Fourth, tenant isolation filters every query by
tenant_id from JWT. Fifth, defense-in-depth validates resource ownership even after auth
— the URL ID alone is never trusted.
Rule Detail
RBAC mandatory Every endpoint decorated with
`@RequirePermissions('students.read',
'students.write')`. No endpoint is unprotected
by default.
Permission cache User permissions cached in Redis for 5
minutes. Cache invalidated on role change,
permission grant, or explicit admin flush.
Scope validation Beyond permission check, validate data
scope: teacher can only see students in their
classroom; branch head can only see their
branch; parent can only see their children.
Tenant isolation Every query filtered by tenant_id from JWT.
Cross-tenant queries require platform-admin
scope and are audited at WARN level.
Defense in depth Even with auth, validate resource ownership:
`WHERE id = $1 AND tenant_id = $2` — never
trust the URL alone.
32

PreOne Engineering Standards v1.0 | Engineering Freeze
Secrets Management
Secrets never live in code, never live in env files committed to Git, and never live in plaintext
at rest. Production secrets are stored in HashiCorp Vault; dev/staging secrets are in
gitignored .env files injected by CI from secret manager. Every secret has a rotation policy
(90 days for JWT signing keys and API keys; 180 days for DB passwords). Secret scanning
(TruffleHog + Gitleaks) runs on every commit and blocks PRs on hit.
Rule Detail
Vault for production All secrets (DB passwords, JWT signing keys,
payment gateway keys, API keys) stored in
HashiCorp Vault. App fetches at boot, caches
in memory, refreshes every 1 hour.
Environment variables for dev/staging .env files gitignored. .env.example committed
with placeholder values. Real env injected by
CI/CD from secret manager.
Never hardcoded secrets ESLint rule `no-restricted-syntax` forbids
strings matching key patterns. Pre-commit
hook scans for high-entropy strings.
Rotation policy JWT signing keys: 90 days. API keys: 90 days.
DB passwords: 180 days. Payment gateway
keys: per provider policy. Rotation automated
via Vault.
Secret scanning in CI TruffleHog + Gitleaks scan every commit.
Match on regex patterns for AWS keys, JWT,
private keys. PR blocked on hit.
Encryption Standards
Encryption protects data at rest and in transit. At rest, PII columns (parent.aadhaar,
parent.pan, staff.bank_account) are encrypted with AES-256-GCM via Postgres pgcrypto;
database volumes and S3 buckets are encrypted with AWS KMS. In transit, TLS 1.3 is
mandatory (TLS 1.2 deprecated); HSTS enforces HTTPS for 1 year with preload. JWT uses
RS256 (asymmetric) so services can verify tokens with the public key without sharing the
private key.
33

PreOne Engineering Standards v1.0 | Engineering Freeze
Layer Detail
At rest — PII columns AES-256-GCM via Postgres `pgcrypto`
extension. Columns: parent.aadhaar,
parent.pan, staff.aadhaar, staff.pan,
staff.bank_account. Key in Vault, rotated
annually.
At rest — database volume EBS volumes encrypted with AWS KMS.
Backups encrypted. Snapshots encrypted. Key
rotation annually.
At rest — object storage S3 buckets encrypted with SSE-KMS. Pre-
signed URLs for upload/download. Lifecycle
policy moves to Glacier after 90 days.
In transit TLS 1.3 mandatory. TLS 1.2 deprecated. HSTS
header with 1-year max-age and preload.
HTTP redirected to HTTPS at load balancer.
Application layer — JWT RS256 (asymmetric) so multiple services can
verify with public key without sharing private
key.
HTTP Security Headers
Every PreOne HTTP response carries seven security headers. These headers protect against
XSS, clickjacking, MIME-sniffing, mixed content, and referrer leakage. Headers are set at the
load balancer (CloudFront + ALB) and verified by the security team's synthetic monitoring.
CSP is the most critical — it blocks inline scripts and restricts resource origins. CORS is
explicit (specific origins, never wildcard).
Header Value Purpose
Strict-Transport-Security max-age=31536000; Force HTTPS for 1 year,
includeSubDomains; preload include subdomains, submit
to HSTSPreload list
Content-Security-Policy default-src 'self'; script-src Prevent XSS, clickjacking,
'self' 'nonce-{nonce}'; style- mixed content
src 'self' 'unsafe-inline'; img-
src 'self' data: https:;
connect-src 'self'
https://api.preone.in; frame-
ancestors 'none'
34

PreOne Engineering Standards v1.0 | Engineering Freeze
Header Value Purpose
X-Content-Type-Options nosniff Prevent MIME-type sniffing
attacks
X-Frame-Options DENY Prevent clickjacking by
forbidding iframe embedding
Referrer-Policy strict-origin-when-cross- Limit referrer leakage to
origin cross-origin
Permissions-Policy geolocation=(self), Restrict browser feature
camera=(), microphone=() access
Access-Control-Allow-Origin https://app.preone.in CORS — explicit allow-list,
(specific origins, never *) never wildcard
Input Protection
Every external input is hostile until proven otherwise. PreOne defends against eight
categories of input-based attacks. SQL injection is prevented by parameterized queries
(Prisma parameterizes by default; raw SQL uses $1, $2 placeholders). XSS is prevented by
input sanitization (DOMPurify) and output encoding (React auto-escaping). CSRF is
prevented by token-based auth (not cookie-based) and SameSite cookies. Rate limiting, file
upload validation, brute force protection, SSRF prevention, and deserialization safety round
out the defenses.
Threat Control
SQL Injection Parameterized queries via Prisma. Raw SQL
audited by security team. No string
concatenation in any query path.
XSS Input sanitization via DOMPurify on server.
Output encoding via React's automatic
escaping. CSP header blocks inline scripts.
CSRF Token-based (not cookie-based) auth for
state-changing operations. SameSite=Strict
on session cookies. Origin header validation.
Rate Limiting Per-IP and per-user rate limit via Redis sliding
window. Login: 5/min. API: 100/min. Sensitive
ops (refund, delete): 10/min.
35

PreOne Engineering Standards v1.0 | Engineering Freeze
Threat Control
File Upload Virus scan via ClamAV. Extension allow-list
(pdf, docx, png, jpg, mp4). MIME type
verification (not just extension). Max size
10MB. Store on S3, never on app server.
Brute Force Account lockout after 5 failed attempts (15-
min lockout). IP block after 20 failed attempts
across accounts (1-hour block). Alert security
team.
SSRF Outbound HTTP only via allow-listed
domains. DNS rebinding protection. Block
requests to private IP ranges (10.x, 192.168.x,
169.254.x).
Deserialization Never use `JSON.parse` on untrusted input
without schema validation. Use zod or class-
validator on every DTO. No `eval`, no
`Function` constructor.
Audit Logging
Every state-changing action, every PII read, every failed auth attempt, and every admin
action is audited. Audit logs are immutable (no UPDATE/DELETE), hash-chained (each row
includes hash of previous row), and backed up daily to a write-only S3 bucket. Retention is 7
years per DPDP. Audit log integrity is verified daily by a background job that recomputes the
hash chain and alerts on any break.
Rule Detail
Every state-changing action audited Who (user_id, role), what (entity, action,
before, after), when (timestamp), where (IP,
user-agent), why (request_id, trace_id).
Stored in audit_logs table, immutable, 7-year
retention per DPDP.
Read access to PII audited Reading parent.aadhaar, staff.pan,
student.medical_record logs at WARN level.
Quarterly review by security team.
36

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Failed auth attempts audited Failed logins, expired tokens, permission
denials logged at INFO with IP and user-
agent. Aggregated daily for anomaly
detection.
Admin actions audited Role changes, permission grants, feature flag
toggles, config changes — all logged at WARN
with explicit before/after diff.
Audit log integrity Append-only table (no UPDATE/DELETE).
Hash-chained (each row includes hash of
previous row). Daily backup to write-only S3
bucket.
Secure Development Lifecycle (SDL)
Security is built into every stage of development, not bolted on after a breach. The SDL
(detailed in Appendix C) takes a feature from requirements through release approval with
security sign-off at each gate. Threat modeling (STRIDE) is mandatory for high-risk features
(payments, PII, admin actions). Static analysis (SAST) and dependency scanning run on
every PR. Annual third-party penetration tests and a bug bounty program provide external
validation.
Stage Activity
Requirements Security requirements captured per feature
(auth, authz, PII handling, audit). Threat
modeling for high-risk features.
Design Review Architecture review for new endpoints,
schema changes, integrations. Security design
review for any feature touching PII or
payments.
Implementation Follow secure coding guidelines. Pair
programming on security-sensitive code. Pre-
commit hooks for secret scanning.
Static Analysis (SAST) SonarQube + ESLint security rules run on
every PR. Critical findings block merge. Snyk
for dependency vulnerabilities.
37

PreOne Engineering Standards v1.0 | Engineering Freeze
Stage Activity
Dependency Scan Snyk + npm audit on every build. Critical CVEs
block deploy. High CVEs require architecture
sign-off to deploy.
Unit Testing Security unit tests for auth, authz, input
validation, output encoding. Mutation testing
on security-critical modules.
Integration Testing End-to-end auth flows, multi-tenant isolation
tests, permission boundary tests.
Security Testing OWASP ZAP automated scan on staging.
Annual third-party penetration test. Bug
bounty program for external researchers.
Release Approval Security sign-off on release notes. SOC2
change management workflow. Rollback plan
documented.
38

PreOne Engineering Standards v1.0  |  Engineering Freeze
ENG-005: Logging & Observability Standards
Define how PreOne captures, structures, and routes logs, metrics, and traces so that any
production issue can be diagnosed within 5 minutes without adding new code.
Observability is a feature — it is built into every endpoint, every job, every integration from
day one, not bolted on after an incident.
Log Levels
PreOne uses six log levels, each with a specific semantic and retention policy. TRACE and
DEBUG are disabled in production by default (enabled temporarily for incident diagnosis).
INFO captures normal business events (invoice generated, admission approved). WARN
captures unexpected-but-recoverable situations (cache miss, retry triggered). ERROR
captures failed operations (notification send failed, external API timeout). FATAL captures
service-ending failures (DB connection lost). Retention ranges from 1 day (TRACE) to 1 year
(ERROR/FATAL).
| Level | When to Use           | Example              | Retention |
| ----- | --------------------- | -------------------- | --------- |
| TRACE | Extremely detailed    | Entering             | 1 day     |
|       | flow tracing          | StudentService.findB |           |
|       | (disabled in prod by  | yId with id=123      |           |
default)
| DEBUG | Diagnostic info        | Cache hit for  | 3 days |
| ----- | ---------------------- | -------------- | ------ |
|       | useful in dev/staging  | student:123    |        |
(disabled in prod)
| INFO  | Normal operation —    | Invoice INV-2026-    | 30 days |
| ----- | --------------------- | -------------------- | ------- |
|       | significant business  | 001 generated for    |         |
|       | events                | student 123          |         |
| WARN  | Unexpected but        | Permission cache     | 90 days |
|       | recoverable;          | miss for user 456 —  |         |
|       | potential issue       | falling back to DB   |         |
| ERROR | Operation failed but  | Failed to send       | 1 year  |
|       | service continues     | WhatsApp             |         |
notification —
retrying
FATAL Service cannot  Database connection  1 year (alert on-call)
|     | continue — process  | lost — cannot serve  |     |
| --- | ------------------- | -------------------- | --- |
|     | will exit           | requests             |     |
39

PreOne Engineering Standards v1.0 | Engineering Freeze
Mandatory Request Fields
Every API request log carries seven mandatory fields. These fields enable correlation across
logs, traces, and metrics; without them, an engineer diagnosing an incident cannot
reconstruct what happened. The fields are propagated via the X-Request-ID header (set at
the API gateway) and the OpenTelemetry trace context. Logs missing mandatory fields are
rejected by the logging pipeline.
Field Detail
RequestId UUIDv7 generated at API gateway,
propagated via X-Request-ID header. Same ID
in all logs for the request.
UserId From JWT sub claim. Null for unauthenticated
requests.
TenantId From JWT. Mandatory for all authenticated
requests. Allows per-tenant log filtering.
API HTTP method + path (e.g., POST
/api/v1/students). Not full URL (query string
may contain PII).
Duration Request processing time in milliseconds. Slow
queries (>1s) flagged.
Status HTTP response status code. 5xx triggers
ERROR log. 4xx triggers WARN if rate spikes.
TraceId OpenTelemetry trace ID. Links logs to
distributed trace for cross-service debugging.
SpanId OpenTelemetry span ID. Allows drilling into
specific operation within trace.
Never Log These
The following data must never appear in logs — not even in 'debug' mode, not even in
'temporary' code, not even behind a feature flag. Logging this data is a DPDP violation and a
security incident. The list below is enforced by a log sanitizer that scans outgoing log events
and redacts matching patterns; engineers who attempt to log this data will see the
redaction in the next log event.
• Password (even hashed — log only 'password verified' boolean)
• OTP (log only 'OTP sent to phone ending 1234')
40

PreOne Engineering Standards v1.0 | Engineering Freeze
• Card number, CVV, expiry (log only last 4 digits)
• Aadhaar (log only 'aadhaar verified' boolean)
• PAN (log only 'pan verified' boolean)
• JWT (log only 'token issued for user X, expires at Y')
• Bank account number (log only 'bank account updated')
• Parent personal notes about child (log only 'observation created')
• Medical records (log only 'medical record accessed by user X — audited')
• Webhook payloads containing any of the above
Structured Log Format
All PreOne logs are JSON-structured (not string-concatenated). Structured logs enable log
routing, filtering, and aggregation without fragile regex parsing. The structure below is
mandatory; every log event has these fields. Engineers use the structured logger
(`logger.info`, `logger.error`) which enforces the structure; `console.log` is forbidden by
ESLint.
{
"timestamp": "2026-07-13T10:30:00.123Z",
"level": "INFO",
"traceId": "4a3b2c1d-5e6f-7890-abcd-ef1234567890",
"spanId": "a1b2c3d4e5f6",
"requestId": "req_abc123",
"userId": "usr_456",
"tenantId": "tnt_789",
"schoolId": "sch_012",
"branchId": "br_345",
"api": "POST /api/v1/invoices",
"duration": 142,
"status": 201,
"message": "Invoice INV-2026-001 generated for student 123",
"entity": "invoice",
"entityId": "inv_001",
"action": "create"
}
Metrics Standards
PreOne captures four categories of metrics. RED metrics (Rate, Errors, Duration) cover
every API endpoint. USE metrics (Utilization, Saturation, Errors) cover every infrastructure
resource. Business metrics (admissions today, fee collection, attendance rate) cover
operational health. Custom metrics (AI tokens consumed, webhook deliveries) cover
41

PreOne Engineering Standards v1.0 | Engineering Freeze
system-specific behaviors. All metrics are sent to Datadog with 15-second granularity and
retained for 13 months.
Category Metrics
RED metrics (per endpoint) Rate (requests/sec), Errors (error rate %),
Duration (p50, p95, p99 latency)
USE metrics (per resource) Utilization (CPU, memory, disk, DB
connection pool), Saturation (queue depth,
retry count), Errors (failed operations)
Business metrics Admissions today, fee collection today,
attendance rate, active users, notification
delivery rate
Custom metrics AI tokens consumed, webhook deliveries,
background job throughput, cache hit rate
Distributed Tracing
OpenTelemetry is mandatory for distributed tracing. Every HTTP request, every DB query,
every external API call, and every message publish/consume is wrapped in a span. Spans
carry attributes (tenant_id, user_id, entity_type, entity_id, operation) enabling trace
filtering by tenant or user. Sampling is 100% for errors and slow requests, 10% for normal
requests in production (100% in dev/staging). Traces are exported to Jaeger via OTLP and
retained for 7 days.
Rule Detail
OpenTelemetry mandatory Every HTTP request, every DB query, every
external API call, every message
publish/consume wrapped in span.
Propagated via W3C Trace Context headers.
Span attributes Spans carry: tenant_id, user_id, entity_type,
entity_id, operation. Allows filtering traces by
tenant or user.
Sampling 100% sampling for errors and slow requests
(>1s). 10% sampling for normal requests in
prod. 100% in dev/staging.
Trace export Traces exported to Jaeger via OTLP. Retained
7 days. Long-term analytics to ClickHouse.
42

PreOne Engineering Standards v1.0 | Engineering Freeze
Dashboards
PreOne maintains five operational dashboards. API Health covers request rate, error rate,
latency, and status code distribution. Database Health covers connection pool, slow
queries, replication lag, and disk usage. Business Operations covers admissions, fee
collection, attendance, and pending approvals. Security covers failed logins, permission
denials, PII access anomalies, and audit log volume. Infrastructure covers CPU, memory,
disk, and pod health. Dashboards are owned by the on-call team and reviewed quarterly.
Dashboard Panels Audience
API Health Request rate, error rate, p95 On-call, Engineering
latency, status code
distribution, top slow
endpoints
Database Health Connection pool usage, slow On-call, DBA
queries, replication lag, disk
usage, cache hit rate
Business Operations Admissions today, fee Operations, Product
collection, attendance rate,
active branches, pending
approvals
Security Failed logins, permission Security team
denials, suspicious IP, PII
access anomalies, audit log
volume
Infrastructure CPU, memory, disk, network DevOps, On-call
per service. Pod restarts,
OOM kills, node health
Alerting Standards
Alerts are the bridge between observability and action. PreOne uses four alert severities
with explicit SLAs for notification and response. P1 (Critical) pages on-call within 5 minutes
for service down, DB unreachable, error rate > 5%. P2 (High) notifies on-call within 30
minutes for latency spikes, queue depth, cache degradation. P3 (Medium) emails within 4
hours for slow queries, disk growth, cert expiry. P4 (Low) sends a daily digest for trends and
deprecation warnings.
43

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Severity | SLA | Examples |
| -------- | --- | -------- |
Critical (P1) Page on-call within 5 minutes Service down, DB
unreachable, error rate > 5%,
payment gateway down
High (P2) Notify on-call within 30  p95 latency > 500ms for 5
|     | minutes | min, queue depth > 1000,  |
| --- | ------- | ------------------------- |
cache hit rate < 80%
Medium (P3) Email engineering within 4  Slow query > 5s, disk usage >
|     | hours | 80%, certificate expiring in 7  |
| --- | ----- | ------------------------------- |
days
| Low (P4) | Daily digest | Deprecation warnings, info- |
| -------- | ------------ | --------------------------- |
level anomalies, capacity
trend alerts
44

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-006: Testing & QA Standards
Define the testing pyramid, coverage gates, and quality bar that every PreOne feature must
meet before merge. Tests are not optional, not 'nice to have', not 'we'll add later' — they
are the contract that lets us ship 50 times a day without breaking 50 things. Code without
tests does not merge, period.
Coverage Standards
Coverage is a leading indicator of quality — not a guarantee, but a floor. PreOne enforces
coverage thresholds per module type. The overall minimum is 90% lines / 85% branches.
Critical modules (auth, payments, admissions, attendance) require 100% lines / 95%
branches. The domain layer (aggregates, entities, value objects) requires 100% lines / 100%
branches — it is pure logic with no excuse for missing tests. Coverage is measured by
SonarQube on new code (per-PR delta) and blocks merge below threshold.
Scope Threshold Enforcement
Minimum overall 90% lines, 85% branches SonarQube quality gate
blocks merge below
threshold
Critical modules (auth, 100% lines, 95% branches Per-module override in
payments, admissions, sonar-project.properties
attendance)
Domain layer (aggregates, 100% lines, 100% branches Pure logic — no excuse for
entities, value objects) missing test
Controllers and repositories 85% lines, 80% branches Integration tests cover happy
path + 2 error paths
Frontend components 80% lines, 70% branches Storybook + Jest + React
Testing Library
Test Pyramid
PreOne follows the classic test pyramid: many fast unit tests at the base, fewer integration
tests in the middle, very few end-to-end tests at the top. The ratio is approximately
70/20/7/3 (unit/integration/API/E2E). Unit tests run in < 10ms each and execute on every
commit. Integration tests (with real Postgres via testcontainers) run in < 500ms each. API
tests run in < 2s each. E2E tests run nightly, not on every PR.
45

PreOne Engineering Standards v1.0 | Engineering Freeze
Level Proportion Scope Tools
Unit Tests 70% of all tests Pure functions, value Jest
objects, entities,
mappers, validators.
Fast (<10ms each).
No I/O, no DB, no
network.
Integration Tests 20% of all tests Service + repository Jest + testcontainers
+ real Postgres
(testcontainers).
Verifies wiring,
transactions,
migrations. Slow
(<500ms each).
API Tests 7% of all tests End-to-end HTTP via Jest + supertest
supertest. Verifies
auth, validation,
response shape,
error codes. Slower
(<2s each).
E2E Tests 3% of all tests Full user journey via Playwright, Detox
Playwright (web) /
Detox (mobile).
Slowest (<30s each).
Run nightly, not on
every PR.
Mandatory Test Types
Every PR must include the test types applicable to its changes. A new endpoint requires unit
tests (service logic), integration tests (service + repository + DB), repository tests (custom
queries), security tests (auth, authz, isolation), and API tests (happy path + 2 error paths). A
new aggregate method requires unit tests only. Performance tests are required before
release for endpoints expected to handle > 100 RPS. Contract tests are required when the
API contract changes.
46

PreOne Engineering Standards v1.0 | Engineering Freeze
Test Type What When
Unit Test Every public method on Same PR as the code
domain entities, value
objects, and pure services
Integration Test Every application service Same PR as the code
method that touches the
database
Repository Test Every custom repository Same PR as the code
method (findXyz, custom
queries)
Security Test Auth, authz, multi-tenant Same PR as the endpoint
isolation, input validation for
every endpoint
API Test Happy path + at least 2 error Same PR as the endpoint
paths (validation, auth) per
endpoint
Performance Test Load test for endpoints Before release to staging
expected to handle > 100
RPS
Contract Test Pact tests for every When contract changes
consumer-provider pair (e.g.,
web ↔ api, mobile ↔ api)
Forbidden Testing Practices
The following testing practices are forbidden. Their presence in a PR is a blocking review
finding. The goal of tests is to verify behavior and catch regressions — not to hit a coverage
number. Tests that test implementation details, mock the system under test, share mutable
state, depend on real time, or hit real external services provide false confidence and are
worse than no tests.
• Merging without tests — no exceptions, no 'I'll add tests in a follow-up PR'
• Merging with skipped tests (`it.skip`, `xdescribe`) without an issue link and 7-day
SLA
• Testing implementation details instead of behavior (e.g., asserting a private method
was called)
• Mocking the system under test — mock dependencies, not the thing you're testing
47

PreOne Engineering Standards v1.0 | Engineering Freeze
• Shared mutable state between tests — each test must be independent and order-
independent
• Time-dependent tests without injected clock — use `jest.useFakeTimers()` or inject
DateProvider
• Tests that hit real external services — mock at the boundary, use wiremock or msw
Mocking Strategy
Mocking is a precision tool — mock too little and tests are slow and flaky; mock too much
and tests verify the mocks instead of the system. PreOne's strategy is to mock at
boundaries: mock repository interfaces when testing application services; mock external
gateway interfaces (IPaymentGateway) when testing integrations; use real domain objects
(never mock value objects or entities); use real Postgres via testcontainers when testing
repositories.
Layer Strategy
Domain No mocks — domain is pure. Test with real
objects.
Application Service Mock repository interfaces
(IStudentRepository). Real domain objects.
Real value objects.
Repository Real Postgres via testcontainers. No mocking.
Verifies SQL, transactions, migrations.
Controller Mock application service. Real DTOs,
validators, auth guards. Verifies HTTP layer.
External APIs (Payment, WhatsApp) Mock at the gateway interface
(IPaymentGateway). Never hit real provider
in tests. Wiremock for contract tests.
Test Naming Conventions
Test names describe behavior, not implementation. A reader should be able to understand
what a test verifies from its name alone — without reading the test body. The 'should X
when Y' pattern is preferred. The 'Given X, When Y, Then Z' pattern is acceptable for
complex scenarios. Names like 'test1', 'test_function', or 'shouldWork' are forbidden —
they describe nothing.
48

PreOne Engineering Standards v1.0 | Engineering Freeze
Pattern Example
should <expected behavior> when should promote student when academic year
<condition> boundary reached
Given <state>, When <action>, Then <result> Given student is enrolled, When promotion
triggered, Then student advances to next
grade
[Please fill in] [Please fill in]
QA Gates
Quality is enforced at four gates: pre-merge (unit + integration tests, coverage, lint, security
scan), staging deploy (E2E suite, performance baseline, smoke tests, security scan),
production deploy (canary with auto-rollback, smoke tests, on-call acknowledgement), and
post-deploy (synthetic monitoring, business metrics, 30-minute watch window). Each gate
has an explicit owner; gates do not advance without owner sign-off.
Gate Checks Owner
Pre-merge Unit + integration tests pass, PR author + 2 reviewers
coverage thresholds met,
linter clean, security scan
clean
Staging deploy E2E suite passes, QA engineer
performance baseline met,
smoke tests pass, security
scan clean
Production deploy Canary deploy with auto- Release manager + on-call
rollback on error rate > 1%,
smoke tests pass, on-call
acknowledged
Post-deploy Synthetic monitoring passes, On-call
business metrics within
baseline, no critical alerts for
30 min
49

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-007: Code Review & Git Standards
Define how PreOne engineers collaborate via Git, structure their commits, and review each
other's code. Code review is not gatekeeping — it is knowledge sharing, defect prevention,
and architectural stewardship. Every PR is a conversation; every merge is a collective
decision; every commit is a recoverable history.
Branch Model
PreOne follows a Git Flow variant with six branch types. main is production-ready, always
deployable, protected (no direct push). develop is the integration branch for the next
release. Feature branches (feature/ENG-1234-slug) are branched from develop and
merged back via PR. Bugfix branches follow the same pattern. Hotfix branches are branched
from main and merged to both main AND develop, triggering an immediate release.
Release branches prepare a specific version for deployment.
Branch Purpose Access
main Production-ready code. Merge via PR only, 2
Always deployable. approvers required
Protected — no direct push,
only via PR merge. Tagged
with semantic version on
release.
develop Integration branch for next Merge via PR, 1 approver
release. All feature branches required
merge here first. Auto-
deployed to staging.
feature/<jira-id>-<slug> New feature development. feature/ENG-1234-fee-
Branched from develop. refund-flow
Merged back to develop via
PR.
bugfix/<jira-id>-<slug> Bug fix on develop. Branched bugfix/ENG-5678-invoice-
from develop, merged to pdf-typo
develop.
hotfix/<jira-id>-<slug> Critical fix on production. hotfix/ENG-9012-payment-
Branched from main, merged gateway-timeout
to both main AND develop.
Triggers immediate release.
50

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Branch            | Purpose               | Access        |
| ----------------- | --------------------- | ------------- |
| release/<version> | Release preparation.  | release/2.4.0 |
Branched from develop, only
bug fixes allowed. Merged to
main and tagged.
Commit Convention
PreOne uses Conventional Commits. Every commit message starts with a type (feat, fix,
refactor, perf, docs, test, chore, ci, build), followed by an optional scope in parentheses,
followed by a description. The subject line is max 50 chars, imperative mood ('add' not
'added'). The body (optional) explains why, wrapped at 72 chars. The footer (optional)
references issues ('Closes ENG-1234'). This convention enables automated changelog
generation and semantic versioning.
| Type  | Usage                          | Example                |
| ----- | ------------------------------ | ---------------------- |
| feat: | New feature for the user (not  | feat(admissions): add  |
|       | build/script feature)          | document upload to     |
application form
| fix: | Bug fix for the user (not  | fix(finance): correct GST  |
| ---- | -------------------------- | -------------------------- |
|      | build/script fix)          | calculation on round-off   |
invoices
refactor: Code change that neither  refactor(student): extract age
|     | fixes a bug nor adds a feature | calculation to value object |
| --- | ------------------------------ | --------------------------- |
perf: Code change that improves  perf(reports): add covering
|     | performance | index for daily attendance  |
| --- | ----------- | --------------------------- |
query
docs: Documentation only changes docs(api): add examples for
v2 fee calculation endpoint
| test: | Adding missing tests or   | test(auth): cover refresh  |
| ----- | ------------------------- | -------------------------- |
|       | correcting existing tests | token rotation edge cases  |
chore: Build process, dependencies,  chore(deps): bump prisma
|     | tooling — no production  | from 5.1.0 to 5.2.0 |
| --- | ------------------------ | ------------------- |
code change
| ci: | CI/CD pipeline changes | ci: add Snyk scan to build  |
| --- | ---------------------- | --------------------------- |
stage
51

PreOne Engineering Standards v1.0 | Engineering Freeze
Type Usage Example
build: Build system or external build: upgrade Node.js from
dependencies changes 20 to 22 in Dockerfile
Commit Rules
• Conventional Commits format — type(scope): description
• Subject line max 50 chars, imperative mood ('add' not 'added')
• Body wrapped at 72 chars, explains why (not what — diff shows what)
• One logical change per commit — if you wrote 'and also', split it
• Never commit secrets, even for testing — use test fixtures
• Never commit commented-out code — delete it, Git remembers
• Never commit generated files (dist/, node_modules/, .next/) — .gitignore handles it
• Sign commits with GPG or SSH key — required for main branch
• Reference issue in footer: 'Refs ENG-1234' or 'Closes ENG-1234'
Pull Request Standards
Every code change — including hotfixes — goes through a pull request. Direct pushes to
main and develop are forbidden (branch protection enforced). PRs require a description
(what, why, how to test, rollback plan), a linked Jira issue, and CI passing. PRs are squash-
merged to keep history clean — one commit per PR, preserving the conventional-commit
message. Source branches are auto-deleted after merge.
Rule Detail
Minimum 2 reviewers 1 reviewer for trivial PRs (typo, doc-only). 2
reviewers for code changes. 1 must be a
domain expert if PR touches finance, auth, or
PII.
PR description mandatory What changed, why, how to test, screenshots
for UI, migration notes, rollback plan. PR
template enforces structure.
Small PRs preferred Max 500 LOC without justification. Reviewers
can reject large PRs and request split. 'It was
hard to write, it should be hard to review' is
not a defense.
52

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Linked issue Every PR links to its Jira issue. No 'drive-by'
fixes — create an issue first.
CI must pass All CI checks green before merge. Failed CI =
blocked merge button. Re-run only after fix,
never 'override'.
Squash and merge Feature branches squash-merged into
develop/main. Single clean commit per PR.
Preserves conventional-commit message.
Delete branch after merge Auto-delete source branch. Stale branches
pruned weekly.
Code Review Checklist
Reviewers use a ten-area checklist. The checklist is not exhaustive — it is the minimum bar.
Reviewers should also apply domain expertise and judgment. The checklist appears in the
PR template as a series of checkboxes; reviewers tick each box as they verify it. A PR with
unchecked boxes is not ready to merge.
Area Checks
Naming Names reveal intent? No abbreviations?
Consistent with codebase conventions?
Security Auth required? Authz scoped? Input
validated? Output sanitized? Secrets not
logged? SQL parameterized?
Tests Tests added? Coverage threshold met? Tests
test behavior not implementation? Edge
cases covered (null, empty, max)?
Performance No N+1 queries? Pagination on lists? Indexes
added for new query patterns? Cache
considered for hot reads?
Logging Structured logging? Right level? PII not
logged? Request ID propagated?
Documentation Public API documented? README updated?
ADR referenced? Changelog updated?
53

PreOne Engineering Standards v1.0 | Engineering Freeze
Area Checks
Business Rules Rules in domain layer? Invariants enforced in
aggregate? Cross-aggregate via events?
DDD Compliance Layered correctly? No business logic in
controller? No domain dependency on
infrastructure? Aggregate boundaries
respected?
Error Handling Domain exceptions thrown? Global filter
catches? Error responses structured? TraceId
included?
Migration Safety Forward-only? Expand-contract for
destructive? Index created concurrently?
Rollback plan documented?
Reasons to Reject a PR
The following are blocking review findings — a reviewer must reject the PR if any of these
are present. The author must fix the issue and re-request review. 'I'll fix it in a follow-up' is
not acceptable for blocking findings. The list below is not exhaustive; reviewers may reject
for any reason that compromises the engineering standards in ENG-001 through ENG-010.
• No tests or test coverage below threshold
• Hardcoded secrets, magic numbers, or string literals
• Duplicate code without DRY waiver
• PR size > 500 LOC without justification
• Security risk (missing auth, SQL injection, XSS)
• Missing error handling — uncaught promise, unhandled edge case
• Business logic in controller or repository
• Breaking API change without version bump
• Destructive DB migration without expand-contract
• Commit messages don't follow Conventional Commits
54

PreOne Engineering Standards v1.0  |  Engineering Freeze
ENG-008: CI/CD & DevOps Standards
Define the automated pipeline that takes code from commit to production safely,
repeatably, and quickly. CI/CD is not a DevOps concern — it is an engineering culture. Every
commit triggers build, lint, test, scan, and deploy decisions automatically. Humans approve
strategy; automation executes tactics.
Pipeline Stages
Every commit to a feature branch triggers a 10-stage CI pipeline. The pipeline runs build,
lint, unit tests, integration tests, SAST, container scan, staging deploy, performance test,
and canary production deploy. Total pipeline duration is 30-60 minutes (most stages
parallelize). Any stage failure blocks progression. The canary stage deploys to 5% of
production traffic, monitors for 10 minutes, then ramps to 25%, 50%, 100% with auto-
rollback on error rate > 1%.
| Stage | Tool            | Actions        | Duration | Block On        |
| ----- | --------------- | -------------- | -------- | --------------- |
| Build | GitHub Actions  | Install deps,  | 3-5 min  | Compile error,  |
|       | + Docker Buildx | compile TS,    |          | build script    |
|       |                 | build Docker   |          | failure         |
image, push to
registry
| Lint      | ESLint + Prettier  | Run linter,      | 1-2 min | Any error or   |
| --------- | ------------------ | ---------------- | ------- | -------------- |
|           | + TypeScript       | format check,    |         | warning        |
|           | strict             | type check       |         |                |
| Unit Test | Jest               | Run unit tests,  | 2-4 min | Test failure,  |
|           |                    | compute          |         | coverage < 90% |
coverage,
upload to
SonarQube
| Integration Test | Jest +         | Spin up     | 5-10 min | Test failure |
| ---------------- | -------------- | ----------- | -------- | ------------ |
|                  | testcontainers | Postgres +  |          |              |
Redis, run
integration
suite, tear down
55

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Stage | Tool | Actions | Duration | Block On |
| ----- | ---- | ------- | -------- | -------- |
Security Scan  SonarQube +  Static analysis,  3-5 min Critical
| (SAST) | Snyk Code | security hotspot  |     | vulnerability,    |
| ------ | --------- | ----------------- | --- | ----------------- |
|        |           | review,           |     | security hotspot  |
|        |           | dependency        |     | unresolved        |
vulnerability
scan
Container Scan Trivy + Grype Scan Docker  1-2 min Critical CVE in
|            |               | image for OS +   |         | production    |
| ---------- | ------------- | ---------------- | ------- | ------------- |
|            |               | library CVEs     |         | image         |
| Deploy to  | ArgoCD + Helm | GitOps deploy    | 5-8 min | Smoke test    |
| Staging    |               | to staging, run  |         | failure, E2E  |
|            |               | smoke tests,     |         | failure       |
run E2E suite
| Performance  | k6  | Load test critical  | 5-10 min | p95 latency >    |
| ------------ | --- | ------------------- | -------- | ---------------- |
| Test         |     | endpoints,          |          | baseline + 10%,  |
|              |     | compare             |          | error rate >     |
|              |     | against baseline    |          | 0.5%             |
Deploy to  ArgoCD + Argo  Deploy to 5%  30-60 min Error rate > 1%,
| Production  | Rollouts | traffic, monitor  |     | p95 latency >  |
| ----------- | -------- | ----------------- | --- | -------------- |
| (Canary)    |          | for 10 min,       |     | 500ms, manual  |
|             |          | ramp to 25%,      |     | abort          |
50%, 100%
Post-Deploy  Synthetic  Synthetic  Continuous Auto-rollback if
Verification monitoring +  checks every 1  checks fail for 5
|     | Datadog | min, business  |     | min |
| --- | ------- | -------------- | --- | --- |
metric
dashboard
review
Deployment Blockers
The following conditions block deployment to production. Some are CI-enforced (build
failure, test failure, security scan); others are human-enforced (manual approval denied).
The list is not exhaustive — the release manager may block deployment for any reason that
compromises production stability. Blocked deployments are documented in the release
notes with the blocking reason and remediation plan.
•  Build failed — compile error, missing dependency, build script error
56

PreOne Engineering Standards v1.0  |  Engineering Freeze
•  Unit test failed — any test failure, regardless of 'flaky' claims
•  Coverage below 90% — SonarQube quality gate fail
•  Integration test failed — service wiring broken, migration broken
•  Critical security issue — SAST/Snyk critical finding unresolved
•  Lint failed — any ESLint error or Prettier diff
•  Container scan critical CVE — Trivy/Grype critical finding in image
•  Performance regression — p95 latency worse than baseline by > 10%
•  Smoke test failure on staging — basic flows broken
•  Manual approval denied — release manager or on-call rejects
Environments
PreOne maintains four environments. Local (developer laptop, Docker Compose) is for
individual development. Dev (shared) is for cross-squad integration testing. Staging
(production-mirror, anonymized data) is for performance, E2E, UAT, and pre-release
validation. Production is the live customer environment with strict change management.
Each environment has explicit access controls and data refresh policies.
| Environment | Purpose             | Data                  | Access    |
| ----------- | ------------------- | --------------------- | --------- |
| local       | Developer laptop.   | Synthetic test data,  | Developer |
|             | Docker Compose for  | seeded via prisma db  |           |
|             | Postgres, Redis,    | seed                  |           |
MinIO. Hot reload.
| dev | Shared dev       | Synthetic, refreshed  | All engineers |
| --- | ---------------- | --------------------- | ------------- |
|     | environment for  | nightly               |               |
integration testing
across squad
| staging | Pre-prod mirror.    | Anonymized prod      | Engineers + QA +  |
| ------- | ------------------- | -------------------- | ----------------- |
|         | Production-scale    | snapshot, refreshed  | Product           |
|         | data (anonymized).  | weekly               |                   |
Performance, E2E,
UAT.
production Live customer  Real customer data On-call + release
|     | environment. Strict  |     | manager only |
| --- | -------------------- | --- | ------------ |
change
management.
57

PreOne Engineering Standards v1.0  |  Engineering Freeze
Deployment Strategies
PreOne uses four deployment strategies depending on the change. Canary is the default for
all production deploys — 5% to 100% over 30-60 min with auto-rollback. Blue-Green is used
for database schema changes (run both versions, switch atomically). Rolling is used for non-
production environments. Feature flags (LaunchDarkly) provide instantaneous feature-
level rollback without deployment, used for high-risk features and gradual rollouts.
| Strategy | When                        | Detail                 |
| -------- | --------------------------- | ---------------------- |
| Canary   | Default for all production  | 5% → 25% → 50% → 100%  |
|          | deploys                     | over 30-60 min. Auto-  |
rollback on error rate > 1% or
latency spike.
| Blue-Green | Database schema changes | Run both versions  |
| ---------- | ----------------------- | ------------------ |
simultaneously, switch traffic
atomically, keep old version
warm for instant rollback.
| Rolling | Non-production  | Replace pods one at a time.  |
| ------- | --------------- | ---------------------------- |
|         | environments    | Slower but resource-         |
efficient.
Feature Flags High-risk features, gradual  LaunchDarkly flag per
|     | rollout | feature. Roll out to internal  |
| --- | ------- | ------------------------------ |
→ 1 branch → 10% → 100%.
Instant kill switch.
Rollback Policy
Rollback is a first-class operation — not an afterthought. Auto-rollback triggers on error
rate > 1% for 2 minutes, p95 latency > 500ms for 5 minutes, or health check failure for 3
consecutive checks. Manual rollback via ArgoCD UI takes < 2 minutes. Database rollback
requires a forward migration (we do not run down migrations — they are dangerous with
prod data). Every rollback triggers a blameless postmortem within 48 hours.
•  Auto-rollback on error rate > 1% for 2 minutes
•  Auto-rollback on p95 latency > 500ms for 5 minutes
•  Auto-rollback on health check failure for 3 consecutive checks
•  Manual rollback via ArgoCD UI — single button, takes < 2 minutes
•  Database rollback requires forward migration (we don't run down migrations)
58

PreOne Engineering Standards v1.0  |  Engineering Freeze
•  Rollback triggers incident postmortem within 48 hours
•  Feature flags provide instant feature-level rollback without deploy
Quality Gates
Quality gates are the consolidated enforcement of ENG-001 through ENG-010 across the
pipeline. Each gate has an explicit tool and block level. Hard gates block CI; soft gates block
release but not PR. The gates are detailed in Appendix D; the summary below shows the
gate-to-stage mapping.
| Stage         | Gate                       | Tool                     |
| ------------- | -------------------------- | ------------------------ |
| Build         | Compile success            | tsc + nest build         |
| Lint          | Zero errors, zero warnings | ESLint + Prettier        |
| Unit Test     | ≥ 90% coverage             | Jest + SonarQube         |
| Integration   | All tests pass             | Jest + testcontainers    |
| Security      | No critical issues         | SonarQube + Snyk + Trivy |
| Code Review   | 2 approvals                | GitHub PR                |
| Performance   | SLA met (p95 < 300ms)      | k6                       |
| Documentation | Updated and reviewed       | Manual + PR template     |
| Release       | QA sign-off                | Jira release workflow    |
Release Standards
Releases follow semantic versioning (MAJOR.MINOR.PATCH) and require release notes, a
release branch, a GPG-signed tag, and a release-window check (Tuesday-Thursday
10am-4pm IST; no Friday releases). Hotfixes are exempt with on-call approval. Quarterly
rollback drills on staging verify rollback works in < 5 minutes; gaps are documented and
remediated.
Rule Detail
Semantic versioning MAJOR.MINOR.PATCH. Major = breaking API
change. Minor = new feature. Patch = bug fix.
Pre-release: -alpha, -beta, -rc.1
59

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Release notes mandatory Every release has CHANGELOG.md entry
with: version, date, features, fixes, breaking
changes, migration guide.
Release branch release/X.Y.Z branched from develop. Only
bug fixes allowed. Merged to main and
develop after release.
Release tag Annotated GPG-signed tag on main: v2.4.0.
Tag message contains release notes
summary.
Release window Production releases Tuesday-Thursday
10am-4pm IST. No Friday releases. Hotfixes
exempt with on-call approval.
Rollback drill Quarterly rollback drill on staging. Verify
rollback works in < 5 minutes. Document any
gaps.
60

PreOne Engineering Standards v1.0  |  Engineering Freeze
ENG-009: Performance & Monitoring Standards
Define the performance budgets, monitoring coverage, and alerting rigor that keep PreOne
fast and reliable. Performance is a feature — a slow app loses users faster than a buggy one.
Monitoring is the only way to know you're fast; alerts are the only way to know you're
broken.
Performance Budgets
Performance budgets are the SLAs we hold ourselves to. They are measured continuously
and alerted on breach. API p95 latency must be < 300ms; p99 < 500ms. DB query p95 must
be < 100ms. Web page LCP must be < 2s. Mobile cold start must be < 2s. Reports and AI
endpoints have explicit exceptions documented. Performance regressions (> 10% slower
than baseline) block release; the release manager may grant exceptions with architecture
approval.
| Metric | Target | Measurement | Exceptions |
| ------ | ------ | ----------- | ---------- |
API p95 latency < 300ms Datadog APM, per- Reports (sync): < 2s.
|     |     | endpoint | AI endpoints: < 5s.  |
| --- | --- | -------- | -------------------- |
File upload:
streaming, no
budget.
| API p99 latency | < 500ms | Datadog APM, per- | Same as p95 |
| --------------- | ------- | ----------------- | ----------- |
endpoint
| DB query p95 | < 100ms | pg_stat_statements  | Analytics queries  |
| ------------ | ------- | ------------------- | ------------------ |
|              |         | + Datadog DBM       | (reviewed): < 1s.  |
Migrations: not
budgeted.
Page load (web) < 2s LCP Lighthouse + RUM  Reports page: < 5s
|     |     | (Real User  | LCP |
| --- | --- | ----------- | --- |
Monitoring)
| Time to Interactive  | < 3s | Lighthouse | None |
| -------------------- | ---- | ---------- | ---- |
(web)
| Mobile app cold start | < 2s | Firebase  | None |
| --------------------- | ---- | --------- | ---- |
Performance
Monitoring
| Background job  | < 30s | BullMQ metrics | Nightly batch jobs: <  |
| --------------- | ----- | -------------- | ---------------------- |
| pickup          |       |                | 1 hour                 |
61

PreOne Engineering Standards v1.0 | Engineering Freeze
Metric Target Measurement Exceptions
Webhook delivery < 5s to first attempt Webhook queue Retries follow
metrics exponential backoff
up to 24h
Caching Strategy
Caching is the highest-leverage performance optimization — when used correctly. PreOne
uses five caching layers. Redis (application cache) holds sessions, permissions, feature flags,
rate limit counters, and OTPs. CloudFront (CDN) serves static assets (JS, CSS, images) with 1-
year TTL and filename-hash cache-busting. Database query cache holds hot read queries (5-
min TTL, flushed on write). HTTP cache (ETag) handles rarely-changing data. Browser cache
serves static assets via Cache-Control headers.
Layer Use Invalidation
Redis (Application cache) Session, permission cache, TTL + explicit flush on change
feature flags, rate limit
counters, OTP storage. TTL: 5
min - 24 hours.
CDN (CloudFront) Static assets (JS, CSS, images, Cache-bust via filename hash
fonts). TTL: 1 year (file hash
in URL). HTML: no-cache.
Database query cache Hot read queries (branch list, Flush on relevant write
academic year, fee plans).
TTL: 5 min. Cached at
application layer.
HTTP cache (ETag/Last- GET responses for rarely- Automatic on data change
Modified) changing data (settings,
configurations).
Browser cache Static assets via Cache- Filename hash + Cache-
Control headers. Control: no-cache for HTML
Query Optimization
Database queries are the most common performance bottleneck in a SaaS application.
PreOne enforces ten query optimization rules. No SELECT * (explicit column lists via Prisma
select). Pagination mandatory. Indexes on every FK and frequently-filtered column. N+1
prevention via Prisma include or DataLoader. Cursor pagination for deep pages. Composite
62

PreOne Engineering Standards v1.0 | Engineering Freeze
indexes ordered by selectivity. Partial indexes for soft-delete. EXPLAIN ANALYZE on every
new query in review. Read replicas for analytics. Connection pooling via PgBouncer.
• No SELECT * — explicit column lists via Prisma select{}
• Pagination mandatory — LIMIT + OFFSET or cursor for large tables
• Indexes on every FK, every frequently-filtered column, every unique business key
• N+1 prevention — Prisma include{} or DataLoader for batch loading
• Avoid OFFSET for deep pagination — use WHERE created_at < $1 (cursor)
• Composite indexes ordered by selectivity — tenant_id first, then most selective
• Partial indexes for soft-delete — WHERE deleted_at IS NULL
• EXPLAIN ANALYZE on every new query — verify index usage
• Read replicas for analytics — never run heavy reports on primary
• Connection pooling via PgBouncer — max 100 connections per service instance
Monitoring Coverage
Monitoring covers seven layers: infrastructure (CPU, memory, disk, network), application
(request rate, error rate, latency), database (connection pool, slow queries, replication lag),
cache (hit rate, memory, eviction), queue (depth, processing rate, DLQ), external APIs (call
rate, latency, error rate per provider), and business (admissions, fee collection, attendance,
active users). Every layer has explicit metrics, dashboards, and alerts.
Layer Metrics Tool
Infrastructure CPU, memory, disk, network Prometheus + Grafana,
per pod/node. Pod restarts, Datadog
OOM kills, node health.
Application Request rate, error rate, Datadog APM,
latency per endpoint. OpenTelemetry
Background job throughput,
queue depth.
Database Connection pool usage, slow Datadog DBM,
queries, replication lag, disk pg_stat_statements
usage, cache hit ratio.
Cache (Redis) Hit rate, memory usage, Redis Insight, Datadog
eviction rate, connected
clients.
63

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Layer | Metrics                       | Tool                    |
| ----- | ----------------------------- | ----------------------- |
| Queue | Messages waiting, processing  | BullMQ metrics, Datadog |
rate, dead letter queue size,
consumer lag.
External APIs Call rate, latency, error rate  Datadog synthetics + custom
per provider (payment,
WhatsApp, SMS, AI).
| Business | Admissions, fee collection,    | Custom dashboards in  |
| -------- | ------------------------------ | --------------------- |
|          | attendance rate, active users  | Datadog               |
per tenant.
Alert Severities
Alerts are classified into four severities with explicit notification SLAs. P1 (Critical) pages on-
call within 5 minutes for service down, DB unreachable, error rate > 5%, payment gateway
down, data loss. P2 (High) notifies on-call within 30 minutes for latency spikes, queue
depth, cache degradation. P3 (Medium) emails within 4 hours for slow queries, disk growth,
cert expiry. P4 (Low) sends a daily digest for trends and deprecation warnings. Alert fatigue
is real — every alert must be actionable.
| Severity | SLA | Examples |
| -------- | --- | -------- |
P1 Critical Page on-call within 5 min API down, DB unreachable,
error rate > 5%, payment
gateway down, data loss
detected
| P2 High | Notify on-call within 30 min | p95 > 500ms for 5 min,  |
| ------- | ---------------------------- | ----------------------- |
queue depth > 1000, cache
hit < 80%, replication lag >
10s
P3 Medium Email engineering within 4  Slow query > 5s, disk > 80%,
|     | hours | cert expiring in 7 days, 4xx  |
| --- | ----- | ----------------------------- |
rate spike
| P4 Low | Daily digest | Deprecation warnings,  |
| ------ | ------------ | ---------------------- |
capacity trend alerts, info
anomalies
64

PreOne Engineering Standards v1.0  |  Engineering Freeze
Incident Response
Incidents follow a six-phase response: Detect (< 5 min), Triage (< 10 min), Mitigate (< 30
min), Resolve (< 4 hours for P1), Postmortem (< 48 hours), Follow-up (< 30 days). The goal of
mitigation is to stop the bleeding — rollback, feature flag off, scale up, fail safe — not to fix
the root cause under pressure. Root cause analysis happens in the postmortem, which is
blameless (focus on system failures, not individual mistakes).
| Phase  | SLA     | Action                       |
| ------ | ------- | ---------------------------- |
| Detect | < 5 min | Alert fires, on-call paged.  |
Acknowledge in PagerDuty
within 5 min.
| Triage | < 10 min | On-call assesses severity,  |
| ------ | -------- | --------------------------- |
opens incident channel,
posts initial summary.
| Mitigate | < 30 min | Stop the bleeding — rollback,  |
| -------- | -------- | ------------------------------ |
feature flag off, scale up, fail
safe. Not fix — mitigate.
| Resolve | < 4 hours (P1) | Root cause identified, fix  |
| ------- | -------------- | --------------------------- |
deployed, normal operations
restored.
| Postmortem | < 48 hours | Blameless postmortem  |
| ---------- | ---------- | --------------------- |
document. Action items filed.
Review meeting scheduled.
| Follow-up | < 30 days | Action items completed.  |
| --------- | --------- | ------------------------ |
Prevention measures
deployed. Postmortem
published.
Capacity Planning
Capacity planning is proactive, not reactive. PreOne tracks six capacity metrics with explicit
thresholds. CPU utilization target is < 70% average, < 85% peak. Memory < 75% average. DB
connection pool < 60% utilized. Disk < 70%. Queue depth < 1000 messages. API RPS plans
for 10x current peak. Quarterly capacity reviews scale ahead of growth; alerts at 70%
utilization trigger scaling actions before 85% is reached.
65

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Metric | Target | Action |
| ------ | ------ | ------ |
CPU utilization < 70% average, < 85% peak Scale out if sustained > 70%
for 15 min
Memory utilization < 75% average, < 85% peak Scale out or up if sustained >
75%
DB connection pool < 60% utilized Add read replicas or increase
pool size if > 60%
| Disk usage | < 70% | Alert at 70%, expand at 80%,  |
| ---------- | ----- | ----------------------------- |
critical at 90%
| Queue depth | < 1000 messages | Scale consumers if > 1000 for  |
| ----------- | --------------- | ------------------------------ |
5 min
API RPS Plan for 10× current peak Quarterly capacity review,
scale ahead of growth
66

PreOne Engineering Standards v1.0 | Engineering Freeze
ENG-010: AI-Assisted Development Standards
Define how PreOne engineers use AI coding tools (Copilot, Cursor, Claude Code, ChatGPT)
safely and effectively. AI is a force multiplier — it accelerates implementation, but it does
not absolve responsibility. Every line of AI-generated code is owned by the engineer who
committed it, reviewed like human-written code, and held to the same security and quality
bar.
Core Principles
AI coding tools (Copilot, Cursor, Claude Code) are force multipliers — they accelerate
implementation but do not absolve responsibility. The six principles below govern AI-
assisted development at PreOne. They are not optional. Every engineer using AI tools must
internalize them. Violations (e.g., pasting secrets into prompts, accepting AI code without
review) are treated as security incidents.
Rule Detail
AI output is a draft, not a deliverable AI generates code that compiles, not code
that is correct. Engineer must verify intent,
security, performance, and alignment with
architecture.
Human owns every line The engineer who commits AI-generated
code is the author of record. 'Copilot wrote it'
is not a defense in code review or incident
postmortem.
Never accept without review Every AI suggestion reviewed line-by-line
before acceptance. Diff read in full. No
'accept all' without reading.
AI cannot make architectural decisions AI suggests patterns; engineers choose
architecture. DDD boundaries, aggregate
design, integration patterns — all human
decisions, AI assists implementation.
Never paste secrets or PII into AI AI prompts are logged, trained on, and
potentially leaked. No JWT secrets, no
production data, no customer PII in prompts.
Use synthetic data.
67

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Cite AI assistance in PR When AI generated > 20% of a PR, note in PR
description: 'Generated with Copilot/Cursor
— reviewed and tested by [engineer]'.
Transparency for reviewers and audit.
Allowed AI Use Cases
AI excels at boilerplate generation, documentation drafts, refactoring suggestions, test case
generation, code explanation, bug hypothesis, query optimization, and regex generation.
These use cases are encouraged — they free engineers to focus on architecture, domain
logic, and customer value. For each use case, the engineer remains responsible for verifying
correctness, security, and alignment with PreOne standards.
• Boilerplate generation — DTOs, mappers, CRUD controllers, test scaffolding
• Documentation drafts — JSDoc, README sections, code comments (verify accuracy)
• Refactoring suggestions — extract method, rename, simplify conditionals
• Test case generation — happy path, edge cases, error scenarios (verify against
actual behavior)
• Code explanation — 'explain this function' for onboarding unfamiliar code
• Bug hypothesis — 'this code has a race condition — where?' — use as starting
point, verify with tests
• SQL query optimization — suggest indexes, rewrite for performance (verify with
EXPLAIN ANALYZE)
• Regular expressions — generate and explain complex regex (always test against real
data)
Forbidden AI Use Cases
AI cannot make architectural decisions — DDD boundaries, aggregate design, service
decomposition are human decisions. AI cannot write security-critical code without expert
review (auth, crypto, payment, PII). AI cannot author database migrations — it cannot
reason about production data shape. AI must never receive production data or secrets in
prompts. Blind acceptance of long AI suggestions is forbidden — every line must be read. AI
is not a sole reviewer; AI code review tools complement human review, not replace it.
68

PreOne Engineering Standards v1.0 | Engineering Freeze
• Architectural decisions — DDD boundaries, aggregate design, service
decomposition. AI suggests; human decides.
• Security-critical code without expert review — auth, crypto, payment, PII handling.
AI code here requires security team sign-off.
• Database migrations — AI cannot reason about prod data shape. Human authors, AI
may assist with syntax.
• Production data in prompts — no real customer records, no real PII, no real secrets.
Synthetic data only.
• Blind acceptance of long suggestions — if AI generates 200 lines, read all 200.
'Looks right' is not review.
• AI as sole reviewer — AI code review tools (Copilot review) complement human
review, do not replace it.
• Copyright-protected code — if AI reproduces GPL/aggressive-copyleft code, reject.
Use AI tools with commercial-use indemnification.
• Bypassing tests — 'AI wrote it, it probably works' is not a test. AI writes tests;
human verifies they test the right thing.
AI Code Review Requirements
AI-generated code must pass the same gates as human-written code: lint, type check, unit
tests, security scan, DDD compliance, naming standards. Additionally, every AI-generated
file must be opened, read, and approved by the committing engineer — no bulk-accept. AI
code touching auth, payments, PII, or external APIs requires security team review, not just
code review. The engineer who commits AI code is the author of record.
Requirement Detail
Pass lint ESLint + Prettier must pass. AI often
generates code with style violations.
Pass type check TypeScript strict mode must pass. AI often
uses `any` or implicit types.
Pass unit tests New code must have tests. AI-generated tests
must verify correct behavior, not just shape.
Pass security scan SAST must pass. AI sometimes generates
vulnerable patterns (eval, unsanitized SQL).
69

PreOne Engineering Standards v1.0 | Engineering Freeze
Requirement Detail
Follow DDD No business logic in controller, no
infrastructure in domain. AI often blurs layers
— reviewer enforces.
Follow naming standards Variables camelCase, classes PascalCase,
constants UPPER_SNAKE. AI is inconsistent —
reviewer enforces.
Human approval on every file Every AI-generated file must be opened, read,
and approved by the committing engineer.
No bulk-accept.
Security review for sensitive areas AI code touching auth, payments, PII, or
external APIs requires security team review,
not just code review.
Prompt Hygiene
AI prompts are not private — they are logged, potentially trained on, and discoverable in
legal proceedings. PreOne enforces six prompt hygiene rules. No secrets in prompts (use
placeholders). No production data (use synthetic). No proprietary third-party code (NDA
risk). Sanitize before paste (strip real names, emails, phones, IDs). Use only approved AI
tools (Copilot Enterprise, Cursor privacy mode, Claude via AWS Bedrock). Audit trail
retained 90 days.
Rule Detail
No secrets in prompts Never paste JWT signing keys, DB passwords,
API keys, or customer data. Use placeholders:
'JWT_SECRET=<redacted>'.
No production data Use synthetic data. 'Customer John Doe with
phone 9876543210' is forbidden. 'Customer
TEST_001 with phone 5555555555' is fine.
No proprietary third-party code Don't paste vendor SDK code, customer code,
or anything under NDA. AI may train on it.
Sanitize before paste Strip real names, real emails, real phone
numbers, real IDs before pasting logs or code
into AI tools.
70

PreOne Engineering Standards v1.0 | Engineering Freeze
Rule Detail
Use approved AI tools only Corporate-approved: GitHub Copilot
Enterprise, Cursor (with privacy mode),
Claude via AWS Bedrock. Personal ChatGPT
forbidden for work code.
Audit trail AI tool usage logs retained 90 days for
security review. Prompt history is
discoverable in legal proceedings.
AI Effectiveness Metrics
PreOne tracks four AI effectiveness metrics. AI-assisted PRs (goal: 60-80% of PRs use AI for
at least boilerplate). AI-generated defect rate (defects per AI-assisted PR, compared to
human-only baseline). AI code rework (percentage of AI suggestions significantly modified
in review — high rework indicates poor prompt quality). Security findings in AI code (SAST
findings per 1000 LOC, trended monthly). These metrics inform AI tool selection and
prompt engineering training.
Metric Target Purpose
AI-assisted PRs Track percentage of PRs that Adoption tracking
use AI. Goal: 60-80% of PRs
use AI for at least boilerplate.
AI-generated defect rate Defects found in review per Quality monitoring
AI-assisted PR. Compare to
baseline. Investigate if higher
than human-only baseline.
AI code rework % of AI suggestions Effectiveness
significantly modified during
review. High rework = poor
prompt quality or AI misuse.
Security findings in AI code SAST findings per 1000 LOC Security posture
of AI code. Trend monitored
monthly.
71

PreOne Engineering Standards v1.0 | Engineering Freeze
Appendix A: Engineering Checklist — Before Merge
This checklist is the consolidated engineering bar that every PR must meet before merge. It
is not optional, not 'best effort', not 'we'll fix later'. Reviewers should reject any PR that
cannot check every applicable box. The checklist is derived from ENG-001 through ENG-010
and represents the minimum quality bar for production code at PreOne.
Code Quality
☐ Code compiles without errors or warnings
☐ ESLint passes with zero errors and zero warnings
☐ Prettier formatting applied (no diff in CI)
☐ TypeScript strict mode passes
☐ No `any` type — use `unknown` + narrowing or proper types
☐ No magic numbers — extracted to named constants
☐ No hardcoded strings — use enums or constants
☐ No commented-out code — deleted; Git remembers
☐ No console.log — use structured logger
☐ Function size ≤ 50 lines, class size ≤ 500 lines, nesting ≤ 3, params ≤ 5
Tests
☐ Unit tests added for every new public method
☐ Integration tests added for service methods touching DB
☐ API tests cover happy path + at least 2 error paths
☐ Coverage ≥ 90% (100% for critical modules: auth, finance, admissions)
☐ Tests test behavior, not implementation
☐ Tests are independent and order-independent
☐ Tests use fake clock for time-dependent logic
☐ Tests mock at boundaries, not at the system under test
Security
☐ Every endpoint requires authentication (or explicitly marked public with
justification)
72

PreOne Engineering Standards v1.0 | Engineering Freeze
☐ Every endpoint has authorization scope check
☐ Multi-tenant isolation verified — query filtered by tenant_id from JWT
☐ Input validation on every DTO field (class-validator)
☐ Output sanitization for any user-generated content
☐ No SQL injection — parameterized queries only
☐ No XSS — React auto-escaping + DOMPurify for rich text
☐ No secrets in code, logs, or error messages
☐ Rate limiting applied to sensitive endpoints
☐ File uploads scanned (ClamAV), extension + MIME validated
Domain Driven Design
☐ Business logic in domain layer, not in controller or repository
☐ Aggregate root enforces its own invariants
☐ Cross-aggregate communication via domain events, not direct reference
☐ Repository only for aggregate root
☐ Value objects are immutable
☐ Application service orchestrates, doesn't compute business rules
☐ DTO ↔ Entity ↔ Prisma Model mapping via explicit mapper functions
☐ No direct Prisma calls from controllers
Error Handling
☐ Domain exceptions thrown for business rule violations
☐ Global exception filter catches and formats all errors
☐ Error responses structured (code, message, traceId)
☐ No swallowed exceptions (empty catch blocks)
☐ No unhandled promise rejections
☐ External API failures retried with exponential backoff
☐ Circuit breaker for external dependencies
Logging & Observability
☐ Structured logging (JSON, not string concatenation)
73

PreOne Engineering Standards v1.0 | Engineering Freeze
☐ Right log level (INFO for business events, WARN for anomalies, ERROR for failures)
☐ PII not logged (no passwords, OTPs, tokens, Aadhaar, PAN)
☐ Request ID propagated through all logs
☐ Trace ID set on every external call
☐ Metrics emitted for business-relevant events
☐ Dashboard updated if new metric added
Database
☐ Migration forward-only, tested on staging
☐ Destructive migration uses expand-contract pattern
☐ Index added for every new query pattern
☐ Index created concurrently in migration
☐ No SELECT * — explicit column selection
☐ Pagination on every list endpoint
☐ Soft delete respected (deleted_at IS NULL)
☐ UUID primary key on every table
☐ Audit columns (created_at, updated_at, created_by, updated_by, deleted_at) on
every table
API Design
☐ Endpoint follows REST conventions (plural noun, correct method)
☐ API versioned (/api/v1/)
☐ Request DTO validated
☐ Response follows standard format (success, data, meta, traceId)
☐ Error codes follow standard taxonomy
☐ Idempotency-Key supported for POST/PATCH on critical endpoints
☐ OpenAPI spec updated
☐ Changelog updated
Documentation
☐ README updated if setup or behavior changed
74

PreOne Engineering Standards v1.0 | Engineering Freeze
☐ API docs (OpenAPI) updated
☐ JSDoc on public methods
☐ ADR referenced if architectural decision involved
☐ Sequence diagram updated if flow changed
☐ ERD updated if schema changed
☐ Changelog updated
CI/CD & Review
☐ CI pipeline passes (build, lint, test, scan)
☐ SonarQube quality gate passes
☐ Snyk vulnerability scan passes
☐ PR description complete (what, why, how to test, rollback)
☐ PR linked to Jira issue
☐ 2 reviewers approved (1 for trivial PRs)
☐ Squash-merge into target branch
☐ Branch deleted after merge
75

PreOne Engineering Standards v1.0  |  Engineering Freeze
Appendix B: Static Analysis Rules
Static analysis is the automated enforcement of ENG-001 through ENG-010. These rules run
on every commit and every PR; violations block merge. SonarQube is the system of record;
ESLint and Snyk run in CI as additional gates.
| Tool | Rule | Enforcement | Scope |
| ---- | ---- | ----------- | ----- |
ESLint Zero errors, zero  CI fails on any error  All TypeScript files
|     | warnings | or warning |     |
| --- | -------- | ---------- | --- |
Prettier Formatting  CI runs `prettier -- All TS, JS, JSON, MD,
|     | mandatory | check`, fails on diff | YAML files |
| --- | --------- | --------------------- | ---------- |
SonarQube Quality Gate = PASS PR cannot merge if  All repositories
gate fails
SonarQube Code duplication <  Per-file duplication  All source files
|           | 3%          | limit            |             |
| --------- | ----------- | ---------------- | ----------- |
| SonarQube | Cyclomatic  | Per-method check | All methods |
complexity ≤ 10 per
method
| SonarQube | Cognitive complexity  | Per-method check | All methods |
| --------- | --------------------- | ---------------- | ----------- |
≤ 15 per method
| SonarQube | Maintainability  | Per-file rating | All source files |
| --------- | ---------------- | --------------- | ---------------- |
Rating = A
SonarQube Reliability Rating = A Per-file rating All source files
SonarQube Security Rating = A Per-file rating All source files
SonarQube Coverage ≥ 90% on  Per-PR delta  Changed files only
|     | new code | coverage |     |
| --- | -------- | -------- | --- |
SonarQube No Critical or Blocker  Hard block on merge All findings
security issues
| SonarQube | No Bug issues  | Hard block on merge | All findings |
| --------- | -------------- | ------------------- | ------------ |
(Critical, Blocker,
High)
| Snyk Code | No high/critical  | PR cannot merge | All TS files |
| --------- | ----------------- | --------------- | ------------ |
security findings
Snyk Open Source No critical CVEs in  CI fails on critical CVE package.json,
|     | dependencies |     | package-lock.json |
| --- | ------------ | --- | ----------------- |
76

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Tool | Rule | Enforcement | Scope |
| ---- | ---- | ----------- | ----- |
Trivy No critical CVEs in  CI fails on critical CVE Built Docker image
Docker image
| Gitleaks | No secrets in commit  | Pre-commit + CI | All commits |
| -------- | --------------------- | --------------- | ----------- |
history
| TruffleHog | No high-entropy  | Pre-commit + CI | All commits |
| ---------- | ---------------- | --------------- | ----------- |
secrets
| License checker | No                 | CI fails on copyleft  | All dependencies |
| --------------- | ------------------ | --------------------- | ---------------- |
|                 | GPL/AGPL/copyleft  | license               |                  |
licenses
77

PreOne Engineering Standards v1.0 | Engineering Freeze
Appendix C: Secure Development Lifecycle (SDL)
The SDL is the end-to-end process that ensures security is built into every PreOne feature,
not bolted on after a breach. Every feature moves through these 9 stages; security sign-off
at each gate is mandatory. Skipping a stage is a security incident in itself.
Stage Activity Owner Output
1. Requirement Capture security Product + Security Security
requirements per requirements in Jira
feature: auth model,
authz scopes, PII
handling, audit
needs, compliance
(DPDP, POSH, GST).
Threat model for
high-risk features
(payments, PII,
admin actions).
2. Threat Modeling STRIDE analysis for Architecture + Threat model
new endpoints, Security document
integrations, data
flows. Identify attack
surface, trust
boundaries, data
classification.
Document in ADR.
3. Design Review Architecture review Architecture + Approved design in
for new endpoints, Security ADR
schema changes,
integrations. Security
design review for
PII/payments.
Validate against
DDD, ENG-001,
ENG-004.
78

PreOne Engineering Standards v1.0 | Engineering Freeze
Stage Activity Owner Output
4. Implementation Follow secure coding Engineer Code in PR
guidelines (ENG-002,
ENG-004). Pair
programming on
security-sensitive
code. Pre-commit
hooks for secret
scanning. Daily pulls
from main to catch
security fixes.
5. Static Analysis SonarQube + ESLint CI + Engineer Clean SAST report
(SAST) security rules on
every PR. Snyk Code
for data flow
analysis. Critical
findings block merge.
Security hotspots
reviewed by security
team.
6. Dependency Scan Snyk Open Source + CI + Security Clean dependency
npm audit on every report
build. Critical CVEs
block deploy. High
CVEs require
architecture sign-off.
License check for
copyleft.
7. Unit Testing Security unit tests: Engineer Passing security tests
auth, authz, input
validation, output
encoding, multi-
tenant isolation.
Mutation testing on
security-critical
modules.
79

PreOne Engineering Standards v1.0 | Engineering Freeze
Stage Activity Owner Output
8. Integration Testing End-to-end auth QA + Engineer Passing integration
flows. Multi-tenant tests
isolation tests (user
from tenant A
cannot read tenant B
data). Permission
boundary tests
(teacher cannot
access other
classroom).
9. Security Testing OWASP ZAP Security + External Security sign-off
automated scan on
staging. Manual
pentest on high-risk
features. Annual
third-party pentest.
Bug bounty for
external researchers.
10. Release Approval Security sign-off on Security + Release Approved release
release notes. SOC2 Manager
change management
workflow. Rollback
plan documented.
On-call briefed on
new security-
relevant changes.
80

PreOne Engineering Standards v1.0  |  Engineering Freeze
Appendix D: Quality Gates
Quality gates are the automated and human checks that every PR and every release must
pass. A failed gate blocks progression; no override, no exception, no 'I'll fix it tomorrow'.
The gates below are derived from ENG-001 through ENG-010 and enforced by CI,
SonarQube, and the PR approval workflow.
| Stage | Gate            | Tool               | Block Level     | Override |
| ----- | --------------- | ------------------ | --------------- | -------- |
| Build | Compile success | tsc + nest build   | Hard — CI fails | None     |
| Lint  | Zero errors,    | ESLint + Prettier  | Hard — CI fails | None     |
|       | zero warnings   | + TypeScript       |                 |          |
strict
Unit Test ≥ 90% coverage  Jest +  Hard — CI fails Architecture
|     | on new code;  | SonarQube |     | approval (rare) |
| --- | ------------- | --------- | --- | --------------- |
100% on critical
modules
| Integration Test | All tests pass | Jest +  | Hard — CI fails | None |
| ---------------- | -------------- | ------- | --------------- | ---- |
testcontainers
Static Analysis  No  SonarQube +  Hard — CI fails Security team
| (SAST) | critical/blocker  | Snyk Code |     | approval (with  |
| ------ | ----------------- | --------- | --- | --------------- |
|        | issues; security  |           |     | tracking issue) |
hotspots
reviewed
Dependency  No critical CVEs  Snyk Open  Hard — CI fails Architecture +
| Scan | in dependencies | Source + npm  |     | Security        |
| ---- | --------------- | ------------- | --- | --------------- |
|      |                 | audit         |     | approval (with  |
remediation
date)
Container Scan No critical CVEs  Trivy + Grype Hard — CI fails Security
|     | in Docker image |     |     | approval (with  |
| --- | --------------- | --- | --- | --------------- |
remediation
date)
Secret Scan No secrets in  Gitleaks +  Hard — pre- None — secrets
|             | commits          | TruffleHog | commit + CI   | must be rotated |
| ----------- | ---------------- | ---------- | ------------- | --------------- |
| Code Review | 2 approvals (1   | GitHub PR  | Hard — merge  | None            |
|             | for trivial PRs) |            | blocked       |                 |
81

PreOne Engineering Standards v1.0  |  Engineering Freeze
| Stage | Gate | Tool | Block Level | Override |
| ----- | ---- | ---- | ----------- | -------- |
Performance  p95 latency <  k6 on staging Soft — release  Architecture
| Test | 300ms (or         |     | blocked, not PR | approval for  |
| ---- | ----------------- | --- | --------------- | ------------- |
|      | feature-specific  |     |                 | known slow    |
|      | SLA)              |     |                 | features      |
Documentation README +  Manual + PR  Soft — reviewer  Reviewer
|     | OpenAPI + ADR  | template  | discretion | judgment |
| --- | -------------- | --------- | ---------- | -------- |
|     | updated        | checklist |            |          |
Release  QA sign-off +  Jira release  Hard — deploy  VP Engineering
| Approval | release  | workflow | blocked | approval    |
| -------- | -------- | -------- | ------- | ----------- |
|          | manager  |          |         | (emergency  |
|          | approval |          |         | only)       |
82

PreOne Engineering Standards v1.0 | Engineering Freeze
Appendix E: Glossary
Terminology used throughout the Engineering Standards series. Definitions are PreOne-
specific; where industry definitions differ, the PreOne definition takes precedence within
this document set.
Term Definition
ACL Anti-Corruption Layer — pattern that isolates
a bounded context from external systems by
translating their schemas into local domain
models
ADR Architecture Decision Record — immutable
document capturing architectural decisions,
context, consequences, and alternatives
considered
Aggregate Cluster of domain objects treated as a single
unit for data consistency. Has one root entity;
external references go to root only.
Aggregate Root The single entry point to an aggregate. Only
the root is loaded/saved by the repository;
internal entities accessed through it.
Argon2 Modern password hashing algorithm (winner
of Password Hashing Competition 2015).
Used in PreOne for password storage.
Bounded Context Explicit boundary within which a ubiquitous
language and domain model apply. Different
contexts may use the same term differently.
BRC Business Rules Catalog — PreOne document
cataloging 176 business rules across 12
categories
Canary Deploy Deployment strategy that rolls out new
version to a small percentage of traffic first,
monitoring for issues before full rollout
CSP Content Security Policy — HTTP header that
restricts which scripts/styles/resources the
browser will execute
83

PreOne Engineering Standards v1.0 | Engineering Freeze
Term Definition
DDD Domain-Driven Design — methodology for
software development centered on a domain
model shared by experts and engineers
DLQ Dead Letter Queue — queue where messages
that cannot be processed are sent for
inspection and reprocessing
DPDP Digital Personal Data Protection Act 2023 —
India's data protection law governing PII
handling
DTO Data Transfer Object — object carrying data
across process boundaries (e.g., HTTP request
body to service layer)
E2E Test End-to-End Test — test exercising the full
system from user action through all layers,
including UI/DB/external APIs
EKS Elastic Kubernetes Service — AWS-managed
Kubernetes cluster
ESLint Linter for JavaScript/TypeScript enforcing
code quality and style rules
FIFO First In First Out — inventory valuation
method where oldest stock is consumed first
GIN Index Generalized Inverted Index — PostgreSQL
index type for full-text search and
array/collection containment
GRN Goods Receipt Note — acknowledgment of
stock received against a purchase order
GST Goods and Services Tax — Indian indirect tax
system
HSTS HTTP Strict Transport Security — header
forcing browsers to use HTTPS for a domain
Idempotency Key Client-provided identifier allowing safe retry
of POST/PATCH without duplicate side effects
JWT JSON Web Token — compact, signed token
carrying claims between parties
84

PreOne Engineering Standards v1.0 | Engineering Freeze
Term Definition
KISS Keep It Simple, Stupid — principle favoring
simplest correct solution
LCP Largest Contentful Paint — Core Web Vital
measuring perceived load speed
MFA Multi-Factor Authentication — requiring two
or more independent factors for login
mTLS Mutual TLS — both client and server present
certificates for mutual authentication
N+1 Query Anti-pattern where one query loads N records
and N additional queries load related data;
solved by eager loading
OTLP OpenTelemetry Protocol — standard format
for exporting traces, metrics, and logs
OWASP Open Web Application Security Project —
nonprofit publishing the OWASP Top 10
security risks
P95 95th percentile — 95% of requests complete
within this duration; 5% are slower
PII Personally Identifiable Information — data
that can identify a specific individual
POSH Prevention of Sexual Harassment — Indian
law (2013) requiring workplace compliance
Prisma TypeScript ORM used by PreOne for
PostgreSQL access
RBAC Role-Based Access Control — model where
permissions attach to roles, roles attach to
users
RDBMS Relational Database Management System —
database using tables, rows, and relations
RED Metrics Rate, Errors, Duration — three key metrics for
monitoring services
Repository Pattern Pattern isolating domain layer from
persistence concerns via an interface
85

PreOne Engineering Standards v1.0 | Engineering Freeze
Term Definition
SAST Static Application Security Testing —
analyzing source code for security
vulnerabilities without running it
SDL Secure Development Lifecycle — process
embedding security into every stage of
software development
SLA Service Level Agreement — contract
specifying availability/performance
guarantees
SLO Service Level Objective — internal target for
service reliability (e.g., 99.9% uptime)
SonarQube Platform for continuous inspection of code
quality and security
Snyk Security platform for dependency
vulnerability scanning and code analysis
STRIDE Threat modeling framework: Spoofing,
Tampering, Repudiation, Information
Disclosure, Denial of Service, Elevation of
Privilege
TLS Transport Layer Security — cryptographic
protocol encrypting network traffic
TOTP Time-based One-Time Password — algorithm
generating short-lived numeric codes for MFA
USE Metrics Utilization, Saturation, Errors — three key
metrics for monitoring resources
UUID Universally Unique Identifier — 128-bit
identifier with negligible collision risk
Value Object Immutable domain object identified by its
values rather than an identity (e.g., Money,
Address)
Vault HashiCorp Vault — secret management tool
for storing and rotating credentials
Webhook HTTP callback triggered by an event; PreOne
calls customer-configured URLs on events like
AdmissionApproved
86

PreOne Engineering Standards v1.0 | Engineering Freeze
Term Definition
ZAP OWASP Zed Attack Proxy — free security
scanner for finding vulnerabilities in web apps
87

PreOne Engineering Standards v1.0 | Engineering Freeze
Document Control & Sign-off
This Engineering Standards document is the authoritative reference for all engineering
work at PreOne. Compliance is mandatory for all engineers, contractors, and AI-assisted
workflows. Deviations require architecture approval and ADR documentation.
Approval Matrix
Role Name Responsibility Date
VP Engineering Architecture Council Final authority on 2026-07-13
engineering
standards
Chief Security Officer Security Council Security standards 2026-07-13
sign-off (ENG-004,
Appendix C)
Head of Architecture Architecture Council Architecture 2026-07-13
standards sign-off
(ENG-001, ENG-003)
Head of DevOps DevOps Council CI/CD + monitoring 2026-07-13
standards sign-off
(ENG-008, ENG-009)
Head of QA QA Council Testing standards 2026-07-13
sign-off (ENG-006)
Head of Product Product Council Product alignment 2026-07-13
confirmation
Revision History
Version Date Author Changes
1.0 2026-07-13 Architecture & Initial release.
Engineering Team Engineering Freeze
status. 10 sub-
standards (ENG-001
to ENG-010) + 5
appendices.
88

PreOne Engineering Standards v1.0 | Engineering Freeze
Document Control
This document is maintained by the PreOne Architecture & Engineering Team. Changes
require architecture council approval and a new revision history entry. The document is
reviewed quarterly and updated as engineering practices evolve. The current version is
always available in the PreOne engineering wiki. Questions, suggestions, and deviation
requests should be directed to the architecture council via the engineering Slack channel.
Distribution: All PreOne engineers, contractors, and engineering managers. Classification:
Internal Engineering Reference — not for external distribution without VP Engineering
approval. The document is stored in the engineering wiki (single source of truth) and
mirrored to the monorepo /docs/ folder for version control. The wiki version is
authoritative when the two diverge.
89
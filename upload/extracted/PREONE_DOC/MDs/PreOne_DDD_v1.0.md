P R E O N E E N T E R P R I S E
PreOne Enterprise DDD
Domain-Driven Design — Enterprise Preschool Operating System
Document Version: 1.0
Status: Architecture Freeze
Date: 2026-07-12
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Master PRD v1.0 (Product Freeze)
Successor: ADR Catalog v1.0 + Database Schema v3
Classification: Internal Engineering Reference
Prepared by: PreOne Architecture & Engineering Team
PreOne Platform DDD v1.0

PreOne DDD v1.0 | Architecture Freeze
Table of Contents
1. Introduction...................................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Audience.........................................................................................................................3
1.4 Document Conventions..................................................................................................4
1.5 Related Documents........................................................................................................5
2. DDD Overview................................................................................................................5
2.1 The Translation Pipeline.................................................................................................6
2.2 Why DDD for PreOne?....................................................................................................7
2.3 DDD Layers in PreOne....................................................................................................7
3. Ubiquitous Language......................................................................................................8
3.1 Business Term → Software Model Mapping..................................................................9
4. Strategic Design..............................................................................................................9
4.1 Domain Decomposition................................................................................................10
4.2 Domain Classification...................................................................................................12
4.3 Domain Catalog............................................................................................................12
5. Bounded Contexts........................................................................................................12
5.1 Eight Bounded Contexts...............................................................................................13
5.2 Admissions Context......................................................................................................14
5.3 Student Context...........................................................................................................14
5.4 Finance Context............................................................................................................14
5.5 HR Context....................................................................................................................15
5.6 Inventory Context.........................................................................................................15
5.7 Transport Context........................................................................................................16
1

PreOne DDD v1.0 | Architecture Freeze
5.8 Communication Context..............................................................................................16
5.9 Platform Context..........................................................................................................16
6. Context Map.................................................................................................................17
6.1 High-Level Context Map...............................................................................................17
6.2 Detailed Context Relationships....................................................................................20
6.3 Anti-Corruption Layer Strategy....................................................................................20
7. Domain Model..............................................................................................................21
7.1 Aggregate Trees per Domain........................................................................................21
7.2 Marketing & CRM.........................................................................................................21
7.3 Admissions....................................................................................................................22
7.4 Student Lifecycle..........................................................................................................24
7.5 Academics.....................................................................................................................25
7.6 Daily Operations (Attendance).....................................................................................26
7.7 Parent Communication................................................................................................27
7.8 Finance.........................................................................................................................28
7.9 Inventory......................................................................................................................30
7.10 HR...............................................................................................................................31
7.11 Administration............................................................................................................32
7.12 Reports & Analytics....................................................................................................33
7.13 Settings.......................................................................................................................34
7.14 Platform Management...............................................................................................36
8. Aggregates....................................................................................................................37
8.1 Aggregate Catalog........................................................................................................38
8.2 Admission Aggregate....................................................................................................38
8.3 Student Aggregate........................................................................................................38
8.4 Invoice Aggregate.........................................................................................................39
8.5 Payment Aggregate......................................................................................................39
8.6 Attendance Aggregate..................................................................................................39
2

PreOne DDD v1.0 | Architecture Freeze
8.7 Observation Aggregate.................................................................................................39
8.8 Payslip Aggregate.........................................................................................................40
8.9 InventoryItem Aggregate.............................................................................................40
8.10 PurchaseOrder Aggregate..........................................................................................40
8.11 TransportRoute Aggregate.........................................................................................40
8.12 Notification Aggregate...............................................................................................41
8.13 Conversation Aggregate.............................................................................................41
8.14 ReportCard Aggregate................................................................................................41
8.15 Tenant Aggregate.......................................................................................................41
8.16 AuditLog Aggregate....................................................................................................42
9. Entities.........................................................................................................................42
9.1 Entity Catalog...............................................................................................................42
10. Value Objects..............................................................................................................43
10.1 Value Object Catalog..................................................................................................43
11. Domain Services.........................................................................................................44
11.1 Domain Service Catalog..............................................................................................44
12. Repositories................................................................................................................44
12.1 Repository Catalog.....................................................................................................45
13. Domain Events............................................................................................................45
13.1 Domain Event Catalog................................................................................................47
14. Specifications..............................................................................................................47
14.1 Specification Catalog..................................................................................................48
15. Factories.....................................................................................................................48
15.1 Factory Catalog...........................................................................................................49
16. Application Services....................................................................................................49
16.1 Application Service Catalog........................................................................................51
17. Domain Policies..........................................................................................................51
17.1 Policy Catalog.............................................................................................................52
3

PreOne DDD v1.0 | Architecture Freeze
18. Anti-Corruption Layer.................................................................................................52
18.1 ACL Catalog.................................................................................................................53
19. Integration Events.......................................................................................................54
19.1 Integration Event Catalog...........................................................................................54
20. Domain Workflows.....................................................................................................54
20.1 Workflow Catalog.......................................................................................................55
20.2 Admission Workflow..................................................................................................55
20.3 Invoice Lifecycle Workflow.........................................................................................57
20.4 Attendance Workflow................................................................................................59
20.5 Observation Workflow...............................................................................................61
20.6 Refund Workflow.......................................................................................................62
20.7 Purchase Order Workflow..........................................................................................64
20.8 Transport Trip Workflow............................................................................................66
20.9 Tenant Lifecycle Workflow.........................................................................................68
21. Mapping to PRD..........................................................................................................70
21.1 FR → Domain Element Mapping................................................................................71
22. Mapping to BRC..........................................................................................................71
22.1 BRC Rule → Domain Element Mapping.....................................................................72
23. Mapping to ADR.........................................................................................................73
23.1 ADR → Domain Element Mapping.............................................................................73
24. Mapping to Database..................................................................................................73
24.1 Aggregate → Table → Prisma → Migration...............................................................74
24.2 Schema Conventions..................................................................................................75
25. Coding Guidelines.......................................................................................................76
25.1 Core Principles............................................................................................................76
1. Rich Domain Model..................................................................................................77
2. Thin Controllers........................................................................................................77
3. Fat Domain...............................................................................................................78
4

PreOne DDD v1.0 | Architecture Freeze
4. No Business Logic in Controllers..............................................................................78
5. Repository Pattern....................................................................................................79
6. CQRS (where needed)..............................................................................................79
7. Domain Events for Cross-Context............................................................................80
8. Naming Conventions................................................................................................80
9. Immutability of VOs..................................................................................................81
10. Aggregate Boundary Discipline..............................................................................81
11. Transaction Boundary = Aggregate Boundary.......................................................82
12. NestJS Module per Bounded Context....................................................................82
25.2 NestJS Module Structure............................................................................................83
25.3 Code Style...................................................................................................................87
26. Testing Strategy..........................................................................................................88
26.1 Test Pyramid...............................................................................................................88
26.2 Test Layers..................................................................................................................89
26.3 Testing Principles........................................................................................................90
27. Glossary......................................................................................................................91
27.1 DDD Terms..................................................................................................................91
28. Modular DDD Document Split Recommendation........................................................91
28.1 DDD-001 — Strategic Design......................................................................................92
28.2 DDD-002 — Tactical Design........................................................................................92
28.3 DDD-003 — Domain Models Detail............................................................................92
28.4 DDD-004 — Domain Events & Integration.................................................................93
28.5 DDD-005 — Implementation Guide...........................................................................93
28.6 Document Split Summary...........................................................................................93
28.7 Migration Path............................................................................................................93
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
5

PreOne DDD v1.0 | Architecture Freeze
1. Introduction
1.1 Purpose
हा(cid:2) Document PreOne च्या(cid:2) Business Domain ला(cid:2) Software Model मध्या(cid:9) translate करतो(cid:13). DDD
(Domain-Driven Design) हा(cid:2) architecture approach आहा(cid:9) जो(cid:13) business च्या(cid:2) complexity ला(cid:2)
software च्या(cid:2) structure मध्या (cid:9)mirror करतो(cid:13) — ज्या(cid:2)मळे(cid:18) (cid:9) code readable, testable, आणि(cid:21) maintainable
हा(cid:13)तो(cid:9). PreOne सा(cid:2)रख्या(cid:2) enterprise SaaS मध्या(cid:9) णिजोथे(cid:9) 13+ business domains एक(cid:2)च platform वर
interact करतो(cid:2)तो, DDD without it असाभ(cid:29) वनी या आहा(cid:9).
या(cid:2)च Document वरूनी पुढी(cid:18) ला गो(cid:13)ष्टी तोया(cid:2)र हा(cid:13)तो ला: Database Design (Prisma Schema + Migrations),
Backend Services (NestJS modules per bounded context), APIs (REST + WebSocket),
Microservices (future split if scale demands), Unit Tests (entity/aggregate/spec), AI Code
Generation (this document is the primary prompt for AI tools), आणि(cid:21) Implementation
Roadmap (squad-wise delivery sequence).
हा(cid:2) document हा(cid:2) single source of truth आहा(cid:9) जो(cid:13) product (PRD) आ(cid:21)i code (implementation) च्या(cid:2)
मध्या (cid:9)bridge आहा(cid:9). PRD क(cid:2)या build कर(cid:2)याच (cid:9)तो (cid:9)सा(cid:2)गो(cid:29) तो(cid:9); DDD कसा (cid:9)build कर(cid:2)याच (cid:9)तो (cid:9)सा(cid:2)गो(cid:29) तो(cid:9). दो(cid:13)न्हा documents
एकम(cid:9)क(cid:2)शी(cid:29) reference करतो(cid:2)तो — पु*त्याक(cid:9) Functional Requirement च Domain Model शी mapping
या(cid:2) document च्या(cid:2) Section 21 मध्या (cid:9)document आहा(cid:9).
1.2 Scope
DDD हा(cid:2) फक्तो Domain Model Document आहा(cid:9). हा(cid:2) document स्पुष्टीपु(cid:21) (cid:9)खा(cid:2)ला ला गो(cid:13)ष्टी cover करतो नी(cid:2)हा :
• UI Design Document नी(cid:2)हा — screens, components, आणि(cid:21) interaction flows UI/UX
spec मध्या (cid:9)separate आहा(cid:9)तो.
• Database Document नी(cid:2)हा — schema, indexes, आणि(cid:21) migrations च detail PreOne
Database Schema v3 मध्या (cid:9)आहा(cid:9). Section 24 फक्तो mapping दोतो(cid:9) (cid:9).
• API Document नी(cid:2)हा — endpoint signatures, request/response schemas, आणि(cid:21)
OpenAPI spec व(cid:9)गोळ्या(cid:2) API Contract catalog मध्या (cid:9)आहा(cid:9)तो.
• Infrastructure Document नी(cid:2)हा — deployment topology, scaling policies, आणि(cid:21)
observability stack separate run-book मध्या.(cid:9)
DDD च(cid:2) scope फक्तो हा(cid:2) आहा(cid:9): business domain ला(cid:2) software मध्या(cid:9) model कर(cid:21)(cid:2)र(cid:9) concepts —
aggregates, entities, value objects, services, repositories, events, specifications, factories,
policies, workflows — आणि(cid:21) त्या(cid:2)च्(cid:29) या(cid:2) एकमक(cid:9) (cid:2)शी(cid:29) relationships.
6

PreOne DDD v1.0 | Architecture Freeze
1.3 Audience
हा(cid:2) document खा(cid:2)ला ला audiences सा(cid:2)ठी णिलाणिखातो आहा(cid:9):
• Backend Engineers: Aggregate design, repository patterns, आ(cid:21)i domain services
implement करण्या(cid:2)सा(cid:2)ठी primary reference.
• Architects: Bounded context boundaries, context map, आणि(cid:21) cross-cutting policies
enforce करण्या(cid:2)सा(cid:2)ठी .
• QA Engineers: Test pyramid understanding — entity/aggregate/spec tests vs
integration tests.
• AI Code Assistants: Each section structured as a prompt-able block; AI tools
(Cursor, Copilot) च्या(cid:2) context मध्या (cid:9)णिदोल्या(cid:2)वर accurate code generation हा(cid:13)तो(cid:9).
• Product Managers: Technical constraints of features understand करण्या(cid:2)सा(cid:2)ठी — why
certain features take longer (aggregate refactor) आणि(cid:21) why certain requests are
rejected (invariants).
• New Hires: Onboarding reference — domain vocabulary + architectural philosophy
एक(cid:2) document मध्या.(cid:9)
1.4 Document Conventions
• Aggregate names: PascalCase singular (e.g., Invoice, not Invoices).
• Entity names: PascalCase singular (Student, Parent).
• Value Object names: PascalCase singular (Address, Money).
• Service names: verb+Noun+Service (FeeCalculationService, RefundService).
• Specification names: adjective+Noun+Specification (AgeEligibilitySpecification).
• Factory names: noun+Factory (StudentFactory).
• Use Case names: verb+Noun+UseCase (ApproveAdmissionUseCase).
• Repository names: noun+Repository (StudentRepository).
• Domain Event names: past-tense verb (StudentCreated, PaymentReceived).
• Code blocks: monospace font (Consolas); tree diagrams use └ ─ └ characters.
• Bilingual content: Marathi/Hindi business context + English technical terms
preserved exactly as user provided.
7

PreOne DDD v1.0  |  Architecture Freeze
1.5 Related Documents
PreOne document series मध्या(cid:9) DDD च(cid:9) specific position आहा(cid:9). खा(cid:2)ला ला documents DDD च (cid:9)
predecessors आहा(cid:9)तो आणि(cid:21) DDD त्या(cid:2)च्(cid:29) या(cid:2) वर build हा(cid:13)तो(cid:13):
| Document        | Version | Status        | Relationship to DDD    |
| --------------- | ------- | ------------- | ---------------------- |
| Vision Document | v1.0    | Vision Freeze | Strategic intent; DDD  |
च (cid:9)strategic design
(bounded contexts)
Vision च्या(cid:2) pillars शी
align करतो(cid:9)
| BPM (Business  | v1.0 | Process Freeze | Business workflows;  |
| -------------- | ---- | -------------- | -------------------- |
| Process Map)   |      |                | DDD च (cid:9)Domain  |
Workflows (Section
20) BPM च (cid:9)direct
translation आहा(cid:9)तो
BRC (Business Rules  v1.0 Business Freeze 176 rules; DDD च (cid:9)
| Catalog) |     |     | Specifications  |
| -------- | --- | --- | --------------- |
(Section 14) +
Policies (Section 17)
BRC च (cid:9)
implementation
| Master PRD | v1.0 | Product Freeze | Functional  |
| ---------- | ---- | -------------- | ----------- |
requirements; DDD च (cid:9)
PRD Mapping
(Section 21) पु*त्या(cid:9)क FR
ला(cid:2) Domain Element
शी  जो(cid:13)डतो(cid:9)
| ADR Catalog | v1.0 (planned) | Architecture Freeze | Architecture  |
| ----------- | -------------- | ------------------- | ------------- |
decisions; DDD च (cid:9)
ADR Mapping
(Section 23) पु*त्या(cid:9)क
ADR ला(cid:2) Domain
Element शी  जो(cid:13)डतो(cid:9)
| Database Schema | v3 (planned) | Schema Freeze | Physical schema;  |
| --------------- | ------------ | ------------- | ----------------- |
DDD च (cid:9)DB Mapping
(Section 24)
aggregate → table →
Prisma model trail दोतो(cid:9) (cid:9)
8

PreOne DDD v1.0 | Architecture Freeze
Document Version Status Relationship to DDD
API Contract Catalog v1.0 (planned) API Freeze Endpoint contracts;
DDD च (cid:9)Application
Services (Section 16)
API controllers च (cid:9)
backing layer आहा(cid:9)तो
UI/UX Spec v1.0 (planned) Design Freeze Screen flows; DDD शी
थेटी(cid:9) relation नी(cid:2)हा पु(cid:21)
user actions PRD द्वा(cid:2)र(cid:9)
DDD शी connect
हा(cid:13)तो(cid:2)तो
2. DDD Overview
DDD म्हा(cid:21)जो (cid:9)Business Logic Software मध्या (cid:9)या(cid:13)ग्या पु*क(cid:2)र (cid:9)model कर(cid:21).(cid:9) Eric Evans च्या(cid:2) 2003 च्या(cid:2) book नी(cid:9)
introduce क(cid:9) लाला(cid:9) (cid:2) हा(cid:2) approach आहा(cid:9) जो(cid:13) complex business domains ला(cid:2) software मध्या(cid:9) structure
करण्या(cid:2)च(cid:2) systematic way दोतो(cid:9) (cid:13). PreOne सा(cid:2)रख्या(cid:2) enterprise system मध्या(cid:9) णिजोथे(cid:9) 13+ domains
एकम(cid:9)क(cid:2)शी(cid:29) interact करतो(cid:2)तो, DDD without code टी(cid:2)क(cid:21)(cid:9) अशीक्या आहा(cid:9) — क(cid:2)र(cid:21) एखा(cid:2)द्या(cid:2) feature च(cid:2)
change करतो(cid:2)नी(cid:2) क(cid:13)(cid:21)तो(cid:9) aggregate touch कर(cid:2)याच(cid:9) आणि(cid:21) क(cid:13)(cid:21)तो(cid:9) टी(cid:2)ळे(cid:2)याच(cid:9) हा(cid:9) स्पुष्टी नीसाल्या(cid:2)सा regression
risk exponential grow करतो(cid:13).
2.1 The Translation Pipeline
DDD च(cid:9) core म्हा(cid:21)जो(cid:9) Business च language Software Code मध्या(cid:9) translate करण्या(cid:2)च(cid:2) systematic
pipeline. PreOne मध्या (cid:9)हा(cid:2) pipeline असा(cid:2) आहा(cid:9):
Business (Real World)
↓
Domain (Mental Model)
↓
Software Model (Aggregates + Entities + VOs)
↓
Code (NestJS + Prisma + TypeScript)
पु*त्याक(cid:9) stage तो(cid:9) पुढी(cid:18) ला stage च(cid:2) translation explicit आहा(cid:9). Business experts जो(cid:9) terms व(cid:2)पुरतो(cid:2)तो
(Admission, Student, Invoice) तो(cid:9)च terms code मध्या (cid:9)class names म्हा(cid:21)जो (cid:9)णिदोसातो(cid:2)तो — हा(cid:13) 'Ubiquitous
Language' म्हा(cid:21)तो(cid:2)तो आणि(cid:21) Section 3 मध्या (cid:9)detail मध्या (cid:9)cover क(cid:9) ला (cid:9)आहा(cid:9).
2.2 Why DDD for PreOne?
PreOne सा(cid:2)ठी DDD च (cid:9)तो नी strong reasons आहा(cid:9)तो:
9

PreOne DDD v1.0  |  Architecture Freeze
•  Complex Business Domain: PreOne हा(cid:2) CRUD app नी(cid:2)हा  — 13 domains, 176 business
rules, 8 compliance frameworks (DPDP, POSH, GST, RTE, FSSR, NBC, ISO 27001,
State). CRUD approach नी(cid:9) code जोणिटीला हा(cid:13)तो(cid:13) आणि(cid:21) rules everywhere scatter हा(cid:13)तो(cid:2)तो.
•  Multi-Tenant Enterprise Scale: 10,000+ schools, 100,000+ students, 1M+ parents —
अशी(cid:2) scale वर monolithic anemic model maintain हा(cid:13)तो नी(cid:2)हा . Bounded contexts enable
independent scaling आणि(cid:21) squad-wise ownership.
•  AI-Assisted Development: DDD च(cid:2) structured vocabulary AI tools सा(cid:2)ठी  prompt-able
आहा(cid:9). 'Create an Invoice aggregate with items, discounts, tax, payment' हा(cid:2) prompt
DDD-aware AI कड(cid:9) directly executable code generate करतो(cid:13). Anemic model मध्या (cid:9)AI
ला(cid:2) guess कर(cid:2)व(cid:9) ला(cid:2)गोतो(cid:9).
2.3 DDD Layers in PreOne
PreOne च (cid:9)backend NestJS modules खा(cid:2)ला ला DDD layers follow करतो(cid:2)तो:
| Layer | Responsibility | NestJS Location | Dependencies |
| ----- | -------------- | --------------- | ------------ |
Presentation HTTP/WebSocket  controllers/, dto/ Application layer
|     | controllers, DTOs,  |     | only |
| --- | ------------------- | --- | ---- |
validation
| Application | Use cases,            | usecases/ | Domain layer +       |
| ----------- | --------------------- | --------- | -------------------- |
|             | transaction           |           | Infrastructure (via  |
|             | orchestration, event  |           | interfaces)          |
dispatch
| Domain | Aggregates, entities,  | domain/ | Pure TypeScript; zero  |
| ------ | ---------------------- | ------- | ---------------------- |
|        | VOs, services, specs,  |         | external deps          |
factories, policies,
events
Infrastructure Prisma repos, Kafka  infrastructure/ Domain interfaces +
|     | producers, external  |     | external SDKs |
| --- | -------------------- | --- | ------------- |
ACLs, Redis cache
Domain layer हा(cid:2) pure TypeScript आहा(cid:9) — Prisma, NestJS, णिक(cid:29)व(cid:2) क(cid:13)(cid:21)तो हा  external dependency
domain layer मध्या(cid:9) import नी(cid:2)हा . हा(cid:9) testability साणि(cid:18)नीणि9चतो करतो(cid:9): domain logic च(cid:2) unit test in-
memory repos साहा run हा(cid:13)तो(cid:13), real database नीक(cid:13). हा  discipline खा(cid:2)सा importance च  आहा(cid:9) क(cid:2)र(cid:21)
domain rules साव:तो जो(cid:2)स्तो volatile असातो(cid:2)तो आणि(cid:21) त्या(cid:2)च(cid:29) (cid:2) test coverage 100% पु(cid:2)णिहाजो(cid:9).
10

PreOne DDD v1.0 | Architecture Freeze
3. Ubiquitous Language
DDD मधी ला साव:तो महात्त्व(cid:2)च(cid:2) भ(cid:2)गो म्हा(cid:21)जो(cid:9) Ubiquitous Language — business आ(cid:21)i developers एकच
भ(cid:2)षा(cid:2) व(cid:2)पुरतो(cid:2)तो. Business experts जो(cid:9) terms बो(cid:13)लातो(cid:2)तो तो(cid:9)च terms code मध्या(cid:9) class names, method
names, आणि(cid:21) database tables मध्या(cid:9) णिदोसातो(cid:2)तो. हा(cid:2) translation layer नीसाल्या(cid:2)मळे(cid:18) (cid:9) communication
overhead कम हा(cid:13)तो(cid:13) आणि(cid:21) misunderstanding च(cid:2) risk लाग्नी(cid:2)तोनी? णिमटीतो(cid:13).
PreOne मध्या (cid:9)हा language खा(cid:2)ला ला णिनीयाम follow करतो(cid:9):
• Marathi/Hindi business terms जो(cid:9) preschool staff व(cid:2)पुरतो(cid:2)तो (Admission, Fees,
Attendance) तो(cid:9) आहा(cid:9) तोसाच(cid:9) code मध्या.(cid:9)
• English technical terms (Aggregate, Repository, Specification) standard DDD
vocabulary व(cid:2)पुरतो(cid:2)तो.
• Code identifiers PascalCase (Student, AdmissionRepository); database tables
snake_case (students, admission_repositories).
• Mix नी(cid:2)हा — एकच concept सा(cid:2)ठी एकच term. 'Student' कधी 'Learner' णिक(cid:29)व(cid:2) 'Child' नी(cid:2)हा
(व(cid:9)गोळ्या(cid:2) context मध्या (cid:9)'Child' user-facing UI मध्या (cid:9)आहा(cid:9) पु(cid:21) code मध्या (cid:9)नी(cid:2)हा ).
3.1 Business Term → Software Model Mapping
खा(cid:2)ला ला table PreOne च्या(cid:2) ubiquitous language च(cid:2) authoritative reference आहा(cid:9). नीव नी feature
design करतो(cid:2)नी(cid:2) जोर नीव नी term introduce कर(cid:2)याच(cid:2) असा(cid:9)ला तोर या(cid:2) table मध्या(cid:9) entry जो(cid:13)ड(cid:2)व ला(cid:2)गो(cid:9)ला —
table हा(cid:9) living document आहा(cid:9).
Business Term Software Model Notes
Admission Admission Aggregate The complete lifecycle from
lead to enrolled student; root
entity carries admission
number and status
Student Student Entity Identity-bearing record of a
child enrolled (or enrolling) in
a school
Parent Parent Entity Guardian record linked to
one or more students; carries
contact, custody, and
authorization
11

PreOne DDD v1.0  |  Architecture Freeze
| Business Term | Software Model      | Notes                         |
| ------------- | ------------------- | ----------------------------- |
| Classroom     | Classroom Aggregate | Physical or logical grouping  |
of students under a teacher
for an academic year
| Attendance | Attendance Entity | Per-student, per-day  |
| ---------- | ----------------- | --------------------- |
presence record with check-
in/check-out timestamps
| Observation | Observation Entity | Teacher-recorded narrative  |
| ----------- | ------------------ | --------------------------- |
note about a child's behavior,
learning, or milestone
| Invoice | Invoice Aggregate | Bill raised against a student  |
| ------- | ----------------- | ------------------------------ |
for fees; root contains items,
discount, tax, payment,
receipt
| Fee | Fee Entity | Line item within an invoice —  |
| --- | ---------- | ------------------------------ |
tuition, transport, meal,
activity, one-time
| Fee Plan | FeePlan Value Object | Template defining fee  |
| -------- | -------------------- | ---------------------- |
structure, frequency, and
applicable discounts for a
program
| Branch | Branch Entity | A single physical preschool  |
| ------ | ------------- | ---------------------------- |
location under a tenant
(school chain)
| School | Tenant | Top-level multi-tenant  |
| ------ | ------ | ----------------------- |
boundary; one school = one
tenant; can own multiple
branches
| Tenant | Tenant Aggregate | Isolation boundary for all  |
| ------ | ---------------- | --------------------------- |
data, config, and users;
subscription and feature flags
attach here
Academic Year AcademicYear Value Object Date-bounded period (e.g.,
2026–27) controlling
promotion, fee cycles,
attendance sheets
12

PreOne DDD v1.0  |  Architecture Freeze
| Business Term | Software Model    | Notes                |
| ------------- | ----------------- | -------------------- |
| Program       | Program Aggregate | Curriculum offering  |
(Playgroup, Nursery, LKG,
UKG) with age band and
learning outcomes
| Lead | Lead Entity | Pre-admission prospect  |
| ---- | ----------- | ----------------------- |
captured from marketing
channels, walk-ins, or
referrals
| Enquiry | Enquiry Entity | First qualified interaction  |
| ------- | -------------- | ---------------------------- |
with a lead — captures
intent, preferred program,
source
| Application | Application Entity | Formally submitted  |
| ----------- | ------------------ | ------------------- |
admission request with
documents and parent
declarations
| Approval | Approval Entity | Decision record  |
| -------- | --------------- | ---------------- |
(approve/reject/waitlist)
carrying approver, reason,
and timestamp
Business Term → Software Model (cont.)
| Business Term | Software Model | Notes |
| ------------- | -------------- | ----- |
Document Document Value Object Uploaded artifact (birth cert,
photo, medical) with type,
URL, verification status
Medical Record MedicalRecord Value Object Allergies, conditions,
immunizations, emergency
contact
| Payment | Payment Entity | Money receipt against an  |
| ------- | -------------- | ------------------------- |
invoice; carries gateway ref,
mode, status
| Receipt | Receipt Value Object | Generated proof-of-payment  |
| ------- | -------------------- | --------------------------- |
document number issued to
parent
13

PreOne DDD v1.0  |  Architecture Freeze
| Business Term | Software Model        | Notes                         |
| ------------- | --------------------- | ----------------------------- |
| Discount      | Discount Value Object | Applied reduction — sibling,  |
early-bird, staff, scholarship
— with approval trail
| Tax | TaxBreakup Value Object | GST or other applicable tax  |
| --- | ----------------------- | ---------------------------- |
computation against an
invoice line
| Staff | Staff Entity | Employee record — teaching,  |
| ----- | ------------ | ---------------------------- |
admin, support — with role,
branch, payroll link
| Teacher | Teacher Entity | Staff subtype with classroom  |
| ------- | -------------- | ----------------------------- |
assignment, qualifications,
schedule
| Payslip | Payslip Aggregate | Monthly salary computation  |
| ------- | ----------------- | --------------------------- |
— earnings, deductions, net
pay, statutory filings
| Leave | LeaveRequest Aggregate | Staff leave application with  |
| ----- | ---------------------- | ----------------------------- |
approvals, balance impact,
coverage plan
Inventory Item InventoryItem Aggregate Stock-keeping unit (SKU) with
quantity, reorder level,
valuation
| GRN | GoodsReceiptNote Entity | Inward stock  |
| --- | ----------------------- | ------------- |
acknowledgment against a
purchase order
Purchase Order PurchaseOrder Aggregate Authorized procurement
request to a vendor with line
items and totals
| Vendor | Vendor Entity | Supplier master with GST,  |
| ------ | ------------- | -------------------------- |
contact, payment terms
Transport Route TransportRoute Aggregate Pickup/drop sequence with
stops, vehicle, driver,
students-per-stop
| Vehicle | Vehicle Entity | Transport asset with  |
| ------- | -------------- | --------------------- |
capacity, registration,
insurance, driver assignment
14

PreOne DDD v1.0  |  Architecture Freeze
| Business Term | Software Model         | Notes                    |
| ------------- | ---------------------- | ------------------------ |
| Notification  | Notification Aggregate | Outbound message — SMS,  |
WhatsApp, email, in-app —
with template, recipient,
delivery status
| Template | MessageTemplate Value  | Reusable content blueprint  |
| -------- | ---------------------- | --------------------------- |
|          | Object                 | with variables and locale   |
Business Term → Software Model (cont.)
| Business Term | Software Model       | Notes                |
| ------------- | -------------------- | -------------------- |
| Report Card   | ReportCard Aggregate | Periodic assessment  |
document for a student —
milestones, grades, teacher
remarks
| Milestone | Milestone Value Object | Age-appropriate  |
| --------- | ---------------------- | ---------------- |
developmental checkpoint
with status
(emerging/achieving/master
ed)
| Audit Log | AuditLog Entity | Immutable record of who- |
| --------- | --------------- | ------------------------ |
did-what-when for DPDP,
SOC2, and operational
forensics
| Role | Role Entity | Named permission bundle —  |
| ---- | ----------- | -------------------------- |
Center Head, Teacher,
Parent, Accountant, etc.
| Permission | Permission Value Object | Atomic capability (e.g.,  |
| ---------- | ----------------------- | ------------------------- |
'fees.refund.execute')
attached to roles
| Consent | ConsentAggregate | Parental consent record for  |
| ------- | ---------------- | ---------------------------- |
field trips, media usage,
medical emergencies
हा  language consistency PR review मध्या(cid:9) enforce क(cid:9) ला  जो(cid:2)ईला. Code reviewer च(cid:9) पुणिहाला(cid:9) check हा(cid:13)
आहा(cid:9): क(cid:13)(cid:21)त्या(cid:2)हा  new identifier च  mapping या(cid:2) table मध्या (cid:9)आहा(cid:9) क(cid:2)? जोर नी(cid:2)हा , तोर PR block हा(cid:13)ईला आणि(cid:21)
architect च्या(cid:2) approval नीतो(cid:29) र table update करूनी पुन्(cid:18)हा(cid:2) submit कर(cid:2)व(cid:9) ला(cid:2)गोला(cid:9) .
15

PreOne DDD v1.0 | Architecture Freeze
4. Strategic Design
PreOne च (cid:9)High-Level Domains खा(cid:2)ला ला आहा(cid:9)तो. Strategic design च(cid:2) purpose म्हा(cid:21)जो (cid:9)या(cid:2) domains ला(cid:2)
Core, Supporting, आणि(cid:21) Generic categories मध्या(cid:9) classify कर(cid:21)(cid:9) — ज्या(cid:2)मळे(cid:18) (cid:9) engineering
investment prioritize हा(cid:13)तो(cid:13). Core domains साव:तो जो(cid:2)स्तो engineering effort deserve करतो(cid:2)तो क(cid:2)र(cid:21)
तो(cid:9) competitive advantage आहा(cid:9)तो; Generic domains outsource णिक(cid:29)व(cid:2) off-the-shelf solution
व(cid:2)पुर(cid:2)याला(cid:2) हाव(cid:9)तो.
4.1 Domain Decomposition
PreOne
├─ CRM
├─ Admissions
├─ Student
├─ Academics
├─ Attendance
├─ Observation
├─ Communication
├─ Finance
├─ HR
├─ Inventory
├─ Transport
├─ Reports
├─ Settings
└─ Platform
4.2 Domain Classification
पु*त्याक(cid:9) domain ला(cid:2) खा(cid:2)ला ला three categories मधी ला एक(cid:2) category मध्या(cid:9) classify क(cid:9) ला(cid:9) गोला(cid:9) (cid:9) आहा(cid:9). हा
classification engineering investment decisions drive करतो(cid:9):
• Core Domain: Competitive advantage — in-house, best talent, highest test
coverage, most refactoring tolerance. PreOne च (cid:9)core आहा(cid:9) Admissions, Student,
Academics, Finance.
• Supporting Domain: Necessary for product completeness पु(cid:21) differentiator नी(cid:2)हा —
in-house पु(cid:21) lower investment. PreOne मध्या (cid:9)HR, Inventory, Transport.
• Generic Domain: Cross-cutting concerns — outsource जोर possible असाला(cid:9) तोर, else
standard pattern. PreOne मध्या (cid:9)Reports, Settings, Platform.
16

PreOne DDD v1.0  |  Architecture Freeze
4.3 Domain Catalog
| Domain | Type | Responsibility | Key KPI          |
| ------ | ---- | -------------- | ---------------- |
| CRM    | Core | Lead capture,  | Lead-to-enquiry  |
|        |      | nurturing,     | ≥70%             |
attribution; feeds
Admissions
| Admissions | Core | Application,            | Application-to-  |
| ---------- | ---- | ----------------------- | ---------------- |
|            |      | eligibility, approval,  | approval ≤7 days |
fee-plan selection;
produces Student
| Student | Core | Master record,  | Single source of truth |
| ------- | ---- | --------------- | ---------------------- |
lifecycle, promotion,
archival
| Academics | Core | Curriculum, lesson    | Report card coverage  |
| --------- | ---- | --------------------- | --------------------- |
|           |      | plans, observations,  | 100%                  |
report cards
| Attendance | Core | Daily check-in/out,  | Same-day entry  |
| ---------- | ---- | -------------------- | --------------- |
|            |      | absences, late       | ≥99%            |
arrivals, transport-
linked attendance
| Observation | Core | Teacher narrative      | ≥2                  |
| ----------- | ---- | ---------------------- | ------------------- |
|             |      | notes, milestone       | observations/studen |
|             |      | tracking, AI-assisted  | t/week              |
drafts
| Communication | Core | Parent messaging,  | Delivery rate ≥98% |
| ------------- | ---- | ------------------ | ------------------ |
notifications,
broadcasts,
conversation history
| Finance | Core | Invoices, payments,  | DSO ≤15 days |
| ------- | ---- | -------------------- | ------------ |
receipts, GST,
refunds, late fees
| HR  | Supporting | Staff master, payroll,  | Payroll cycle ≤3 days |
| --- | ---------- | ----------------------- | --------------------- |
leave, attendance,
compliance
17

PreOne DDD v1.0  |  Architecture Freeze
| Domain    | Type       | Responsibility   | Key KPI             |
| --------- | ---------- | ---------------- | ------------------- |
| Inventory | Supporting | Stock, GRN, PO,  | Stock accuracy ≥98% |
vendor,
consumption,
valuation
| Transport | Supporting | Routes, vehicles,  | On-time drop ≥95% |
| --------- | ---------- | ------------------ | ----------------- |
drivers, GPS tracking,
pickup authorization
| Reports | Generic | Cross-domain  | Report SLA ≤5 sec |
| ------- | ------- | ------------- | ----------------- |
analytics, regulatory
filings, management
dashboards
| Settings | Generic | Tenant config,  | Config propagation  |
| -------- | ------- | --------------- | ------------------- |
|          |         | feature flags,  | <60 sec             |
academic year,
workflow toggles
| Platform | Generic | Tenancy, identity,  | P99 API latency <400  |
| -------- | ------- | ------------------- | --------------------- |
|          |         | RBAC, audit,        | ms                    |
integrations, AI/LLM
gateway
हा  classification quarterly review मध्या (cid:9)revisit क(cid:9) ला  जो(cid:2)ईला. उदो(cid:2)हार(cid:21)(cid:2)थेB, जोर Reports domain वर AI-
driven insights कड?नी competitive advantage emerge क(cid:9) ला(cid:2) तोर तो(cid:13) Core मध्या (cid:9)promote हा(cid:13)ईला आणि(cid:21)
investment व(cid:2)ढी(cid:9)ला. Reverse पु(cid:21) सातोतो हा(cid:13)तो (cid:9)— Platform domain mature झा(cid:2)ल्या(cid:2)वर क(cid:2)हा  capabilities
open-source library मध्या (cid:9)extract हा(cid:13)ऊ शीकतो(cid:2)तो.
5. Bounded Contexts
पु*त्याक(cid:9)  Domain स्वतोत्र(cid:29)  Bounded Context असाला(cid:9) . Bounded Context हा(cid:9) explicit boundary आहा(cid:9) णिजोथे(cid:9)
एक ubiquitous language आणि(cid:21) एक domain model apply हा(cid:13)तो(cid:13). PreOne मध्या(cid:9) आठी bounded
contexts आहा(cid:9)तो — क(cid:2)हा  domains एकतोर context मध्या(cid:9) merge झा(cid:2)ला(cid:9) आहा(cid:9)तो (उदो(cid:2).: Academics +
Attendance + Observation → Student-facing contexts reference shared Student context),
आणि(cid:21) क(cid:2)हा  domains एक(cid:2)च context मध्या (cid:9)आहा(cid:9)तो क(cid:2)र(cid:21) त्या(cid:2)च(cid:29) (cid:2) cohesiveness जो(cid:2)स्तो आहा(cid:9).
पु*त्याक(cid:9)  Bounded Context:
•  स्वतोFच (cid:9)Models — aggregates, entities, VOs defined within boundary.
•  स्वतोFच  Database Tables — other contexts cannot directly query these tables.
•  स्वतोFच (cid:9)APIs — HTTP + Kafka events exposed via published contracts.
18

PreOne DDD v1.0 | Architecture Freeze
• स्वतोFच (cid:9)Business Rules — specifications + policies defined within context.
• स्वतोFच Squad Ownership — one team owns one context; cross-context changes
require coordination.
5.1 Eight Bounded Contexts
खा(cid:2)ला ला आठी contexts PreOne च(cid:9) architectural backbone आहा(cid:9)तो. पु*त्याक(cid:9) context च detail खा(cid:2)ला ला
subsections मध्या (cid:9)आहा(cid:9):
5.2 Admissions Context
Mission: Convert leads into enrolled students through a transparent, auditable, eligibility-
driven pipeline.
Aggregates Admission, Application, Lead, Enquiry
Entities Approval, CounsellingSession
Value Objects Document, MedicalRecord, ApplicationForm
Domain Services AdmissionEligibilityService,
AgeValidationService,
ApplicationReviewService
Domain Events LeadCaptured, EnquiryCreated,
ApplicationSubmitted, DocumentsVerified,
AdmissionApproved, AdmissionRejected
Key Business Rules R-ELG-001 Age eligibility per program | R-
ADM-006 Document checklist mandatory |
R-ADM-012 Approval matrix by fee waiver
amount
REST APIs POST /admissions/leads, POST
/admissions/applications, POST
/admissions/{id}/approve
Database Tables leads, enquiries, applications, admissions,
approvals, documents
Squad Owner Admissions Squad
19

PreOne DDD v1.0 | Architecture Freeze
5.3 Student Context
Mission: Maintain the authoritative master record of every enrolled child across their full
lifecycle in the school.
Aggregates Student, Classroom, Promotion
Entities StudentProfile, ClassroomAssignment
Value Objects AcademicYear, Age, Address, Demographics
Domain Services PromotionService, StudentSearchService,
ArchivalService
Domain Events StudentCreated, StudentPromoted,
StudentTransferred, StudentArchived,
ClassroomAssigned
Key Business Rules R-STD-001 One active classroom per student
per year | R-STD-008 Promotion only at year
boundary | R-STD-014 Archive after 7 years
per DPDP
REST APIs POST /students, GET /students/{id}, POST
/students/{id}/promote
Database Tables students, student_profiles,
classroom_assignments, promotions,
student_history
Squad Owner Student Squad
5.4 Finance Context
Mission: Bill, collect, reconcile, and report all monetary flows with GST, DPDP, and audit
compliance.
Aggregates Invoice, Payment, FeePlan, Refund
Entities Fee, Receipt, Adjustment
Value Objects Money, TaxBreakup, Discount,
PaymentMethod
Domain Services FeeCalculationService, LateFeePolicyService,
RefundService, GSTFilingService
20

PreOne DDD v1.0 | Architecture Freeze
Domain Events InvoiceGenerated, PaymentReceived,
PaymentFailed, RefundIssued,
LateFeeApplied, InvoiceWrittenOff
Key Business Rules R-FIN-001 Invoice numbering GST-compliant
| R-FIN-005 Late fee triggers after grace
period | R-FIN-012 Refund needs 2-tier
approval | R-FIN-018 GST filing monthly
REST APIs POST /invoices, POST /payments, POST
/refunds, GET /invoices/{id}/receipt
Database Tables invoices, invoice_items, payments, receipts,
fee_plans, discounts, refunds, tax_breakups
Squad Owner Finance Squad
5.5 HR Context
Mission: Manage staff lifecycle from hire to retire, including payroll, leave, attendance, and
statutory compliance.
Aggregates Staff, Payslip, LeaveRequest,
AttendanceRecord
Entities Designation, Department, StatutoryFiling
Value Objects SalaryStructure, LeaveBalance, PAN, Aadhaar,
BankAccount
Domain Services PayrollCalculationService, LeavePolicyService,
PFESIService, TDSComputationService
Domain Events StaffOnboarded, StaffOffboarded,
PayslipGenerated, LeaveApproved,
LeaveRejected, AttendanceMarked
Key Business Rules R-HR-001 PF + ESI as per statute | R-HR-006
Leave accrual monthly | R-HR-010 Payroll
lock after disbursement | R-HR-012 POSH
training annual
REST APIs POST /staff, POST /payroll/run, POST /leaves,
GET /staff/{id}/payslips
21

PreOne DDD v1.0 | Architecture Freeze
Database Tables staff, designations, departments, payslips,
leave_requests, leave_balances,
statutory_filings
Squad Owner HR Squad
5.6 Inventory Context
Mission: Track every consumable and asset from procurement to consumption with
valuation and audit trail.
Aggregates InventoryItem, PurchaseOrder,
GoodsReceiptNote, Vendor
Entities StockMovement, ConsumptionLog, Asset
Value Objects Quantity, Unit, Money, ReorderLevel
Domain Services StockValuationService, ReorderService,
ConsumptionReportService,
VendorEvaluationService
Domain Events POCreated, POApproved, GRNReceived,
StockAdjusted, ConsumptionLogged,
ReorderTriggered
Key Business Rules R-INV-001 FIFO valuation default | R-
INV-006 PO ≥₹50k needs 2-tier approval | R-
INV-010 Stock count quarterly
REST APIs POST /inventory/items, POST /purchase-
orders, POST /grn, POST /inventory/consume
Database Tables inventory_items, purchase_orders, po_items,
grns, stock_movements, consumption_logs,
vendors
Squad Owner Operations Squad
5.7 Transport Context
Mission: Safe, auditable, GPS-tracked pickup-and-drop service with parent authorization.
Aggregates TransportRoute, Vehicle, Driver, Trip
22

PreOne DDD v1.0 | Architecture Freeze
Entities RouteStop, TripLog, PickupAuthorization
Value Objects GPSPoint, ETA, Capacity, License
Domain Services RouteOptimizationService, ETAService,
PickupAuthorizationService,
TripReplayService
Domain Events RouteAssigned, TripStarted, StopReached,
StudentPickedUp, StudentDropped,
TripCompleted, RouteDeviationDetected
Key Business Rules R-OPS-006 Pickup only by authorized
guardian with OTP | R-OPS-009 Speed alert
>60 km/h | R-OPS-012 Route deviation
triggers parent alert
REST APIs POST /transport/routes, POST /trips/start,
POST /trips/{id}/pickup, GET /trips/{id}/live
Database Tables transport_routes, route_stops, vehicles,
drivers, trips, trip_logs, pickup_authorizations
Squad Owner Operations Squad
5.8 Communication Context
Mission: Reliable multi-channel parent and staff communication with templates, locale,
and audit trail.
Aggregates Notification, Conversation, Broadcast,
MessageTemplate
Entities DeliveryReceipt, ConversationMessage,
OptOut
Value Objects Template, Channel, Locale, DeliveryStatus
Domain Services TemplateRenderService,
ChannelRoutingService, OptOutService,
DeliveryReportService
Domain Events NotificationQueued, NotificationSent,
NotificationDelivered, NotificationFailed,
BroadcastTriggered, MessageReceived
23

PreOne DDD v1.0 | Architecture Freeze
Key Business Rules R-COM-002 No marketing post 8 PM per TRAI
| R-COM-005 Opt-out honored within 24h |
R-COM-009 Template versioning mandatory
REST APIs POST /notifications, POST /broadcasts,
POST /conversations/{id}/messages
Database Tables notifications, delivery_receipts,
conversations, conversation_messages,
broadcasts, templates, opt_outs
Squad Owner Engagement Squad
5.9 Platform Context
Mission: Provide cross-cutting tenancy, identity, RBAC, audit, integration, and AI gateway
services to all other contexts.
Aggregates Tenant, User, Role, AuditLog, Integration
Entities Permission, FeatureFlag, APIKey,
WebhookEndpoint
Value Objects JWT, MFAFactor, Scope, TenantConfig
Domain Services AuthService, TenantProvisioningService,
RBACService, AuditService,
AIGatewayService,
IntegrationManagerService
Domain Events TenantCreated, TenantSuspended,
UserCreated, UserLoggedIn, RoleAssigned,
PermissionRevoked, APIKeyRotated,
WebhookDelivered
Key Business Rules R-PLT-001 JWT 15-min rotation | R-PLT-004
MFA mandatory for admin roles | R-PLT-008
Cross-tenant read forbidden | R-PLT-012 API
key rotation 90-day
REST APIs POST /auth/login, POST /auth/refresh, GET
/users, POST /roles, GET /audit-logs, POST
/integrations
24

PreOne DDD v1.0 | Architecture Freeze
Database Tables tenants, users, roles, permissions,
role_permissions, user_roles, audit_logs,
feature_flags, api_keys, integrations,
webhook_endpoints
Squad Owner Platform Squad
6. Context Map
Bounded Contexts एकम(cid:9)क(cid:2)शी(cid:29) कसा(cid:9) relate हा(cid:13)तो(cid:2)तो हा(cid:9) Context Map define करतो(cid:13). हा(cid:9) relationship
patterns DDD च(cid:9) standard vocabulary व(cid:2)पुरतो(cid:2)तो — Customer/Supplier, Conformist, Shared
Kernel, Open Host Service, Published Language, Anti-Corruption Layer. पु*त्याक(cid:9) relationship च(cid:2)
explicit pattern असाल्या(cid:2)मळे(cid:18) (cid:9) team boundaries आणि(cid:21) integration approach clear हा(cid:13)तो(cid:13).
6.1 High-Level Context Map
CRM
│
▼
Admissions
│
▼
Student
│
├───► Attendance
│
├───► Academics
│
├───► Observation
│
└───► Finance
Finance
│
▼
Reports
Platform ───► (All Contexts — Shared Kernel + ACL)
Communication ───► (All Contexts — Open Host Service)
25

PreOne DDD v1.0 | Architecture Freeze
6.2 Detailed Context Relationships
खा(cid:2)ला ला table सावB context-context आणि(cid:21) context-external relationships च authoritative list
आहा(cid:9). पु*त्याक(cid:9) relationship च(cid:2) pattern, upstream/downstream, आणि(cid:21) integration notes specify
क(cid:9) ला (cid:9)आहा(cid:9)तो:
Upstream Downstream Pattern Notes
CRM Admissions Customer/Supplier CRM (supplier) hands
off qualified leads to
Admissions
(customer) via
LeadCaptured event;
Admissions can
request enrichment
Admissions Student Customer/Supplier Admission approval
triggers
StudentCreated;
Student owns master
record thereafter
Student Finance Conformist Finance conforms to
Student's identity;
never duplicates
student data, only
references StudentId
Student Attendance Conformist Attendance
references StudentId
+ ClassroomId; no
redundant copies
Student Academics Shared Kernel Shared StudentId +
AcademicYear value
objects; careful
coordination needed
Student Observation Conformist Observations are
append-only against
an immutable
StudentId
26

PreOne DDD v1.0  |  Architecture Freeze
| Upstream | Downstream | Pattern    | Notes      |
| -------- | ---------- | ---------- | ---------- |
| Student  | Transport  | Conformist | Transport  |
assignments
reference StudentId;
authorization
tracked in Transport
context
| Finance | Reports | Open Host Service +  | Finance exposes  |
| ------- | ------- | -------------------- | ---------------- |
|         |         | Published Language   | invoice/payment  |
aggregates via OHS;
Reports consumes
via published event
schemas
| HR  | Finance | Customer/Supplier | Payroll disbursal  |
| --- | ------- | ----------------- | ------------------ |
creates Finance
invoices for salary;
Finance owns the GL
posting
| Inventory | Finance | Customer/Supplier | GRN approval  |
| --------- | ------- | ----------------- | ------------- |
triggers inventory GL
entry in Finance
| Platform | All Contexts | Shared Kernel + ACL | Platform provides  |
| -------- | ------------ | ------------------- | ------------------ |
identity, RBAC, audit;
each context applies
ACL to translate
Platform tokens into
domain calls
| Communication | All Contexts | Open Host Service | Communication  |
| ------------- | ------------ | ----------------- | -------------- |
publishes
NotificationSent
events; other
contexts subscribe
for delivery
confirmation
| External (Payment  | Finance | Anti-Corruption  | PaymentGatewayAC       |
| ------------------ | ------- | ---------------- | ---------------------- |
| Gateway)           |         | Layer            | L translates provider- |
specific responses
into Finance's
PaymentReceived
event
27

PreOne DDD v1.0 | Architecture Freeze
Upstream Downstream Pattern Notes
External (WhatsApp) Communication Anti-Corruption WhatsAppACL
Layer isolates Meta API
changes from
Communication's
notification domain
हा map architectural decisions enforce करतो(cid:9). उदो(cid:2)हार(cid:21)(cid:2)थेB, Finance context Student context च(cid:2)
Conformist आहा(cid:9) — म्हा(cid:21)जो(cid:9) Finance कधी च Student च(cid:2) data duplicate करतो नी(cid:2)हा , फक्तो StudentId
reference करतो(cid:13). हा (cid:9)rule PR review मध्या (cid:9)verify क(cid:9) ला (cid:9)जो(cid:2)तो(cid:9): जोर Finance मध्या (cid:9)student_name column
णिदोसाला(cid:2) तोर PR reject.
6.3 Anti-Corruption Layer Strategy
External systems सा(cid:13)बोतो integration सातोतो ACL pattern व(cid:2)पुरतो(cid:9). ACL च(cid:2) purpose म्हा(cid:21)जो(cid:9) external
system च terminology आणि(cid:21) data shapes आपुल्या(cid:2) domain model पुरस्पुर isolate कर(cid:21).(cid:9) उदो(cid:2).:
Razorpay च (cid:9)payment_id, status, amount specific terminology आहा(cid:9) — PaymentGatewayACL
हा(cid:9) translate करूनी PaymentReceived domain event emit करतो(cid:13). Razorpay च API change झा(cid:2)ला
तोर फक्तो ACL update कर(cid:2)याच(cid:2) आहा(cid:9), बो(cid:2)क च (cid:9)code unaffected.
7. Domain Model
Domain Model हा(cid:9) software मध्या(cid:9) business च(cid:9) mental model आहा(cid:9). PreOne मध्या(cid:9) पु*त्याक(cid:9) domain च(cid:2)
model खा(cid:2)ला ला structure मध्या(cid:9) express क(cid:9) ला(cid:2) आहा(cid:9): aggregate root खा(cid:2)ला त्या(cid:2)च्या(cid:2) child entities आणि(cid:21)
value objects tree structure मध्या.(cid:9) हा (cid:9)trees static documentation आहा(cid:9)तो — live version code मध्या (cid:9)
TypeScript interfaces मध्या (cid:9)आहा(cid:9)तो.
7.1 Aggregate Trees per Domain
खा(cid:2)ला ला 13 aggregate trees PreOne च्या(cid:2) पु*त्याक(cid:9) domain च root structure दोशीBवतो(cid:2)तो. पु*त्याक(cid:9) tree मध्या (cid:9)
root aggregate पुणिहाला(cid:2), त्या(cid:2)खा(cid:2)ला children; children brackets मध्या (cid:9)arrays दोशीBवतो(cid:2)तो.
7.2 Marketing & CRM
Root: Lead
Lead
├── Enquiry
├── CounsellingSession
├── SourceAttribution
├── LeadScore
└── Disposition
28

PreOne DDD v1.0 | Architecture Freeze
Notes: Lead is the aggregate root; Enquiry is the first qualified interaction. Lead score
recomputed on every disposition change.
7.3 Admissions
Root: Admission
Admission
├── Student(provisional)
├── Parent
├── Documents[]
├── MedicalRecord
├── FeePlanSelection
├── Approval
└── Status
Notes: Admission carries provisional Student until approval; on approval, StudentCreated
event fires and Student context owns the record thereafter.
7.4 Student Lifecycle
Root: Student
Student
├── StudentProfile
├── ClassroomAssignment
├── Promotion[]
├── TransferHistory[]
└── ArchiveStatus
Notes: Student is the master aggregate. ClassroomAssignment is mutable per academic
year. Promotion is append-only history.
7.5 Academics
Root: CurriculumPlan
CurriculumPlan
├── Program
├── LearningOutcome[]
├── LessonPlan[]
├── Milestone[]
├── ReportCard[]
└── Observation[]
Notes: CurriculumPlan drives lesson plans and milestones; ReportCard references both
CurriculumPlan and Student.
29

PreOne DDD v1.0 | Architecture Freeze
7.6 Daily Operations (Attendance)
Root: AttendanceSheet
AttendanceSheet
├── AttendanceRecord[]
├── ClassroomRef
├── Date
└── MarkedBy
Notes: AttendanceSheet is per classroom per day; records are immutable once submitted;
corrections create new adjustment records.
7.7 Parent Communication
Root: Notification
Notification
├── Template
├── Recipient
├── Channel
├── DeliveryReceipt[]
└── ConversationRef
Notes: Notification is one outbound message; broadcast is a parent aggregate generating N
notifications. Conversations thread 1:1 parent-school chat.
7.8 Finance
Root: Invoice
Invoice
├── StudentRef
├── FeeItem[]
├── Discount[]
├── TaxBreakup
├── Payment[]
├── Receipt
├── Adjustment[]
└── Status
Notes: Invoice is the billing aggregate root; once issued, immutable — corrections via
CreditNote or Adjustment. Payment is a separate aggregate referencing Invoice.
7.9 Inventory
Root: InventoryItem
30

PreOne DDD v1.0 | Architecture Freeze
InventoryItem
├── SKU
├── QuantityOnHand
├── ReorderLevel
├── Valuation
├── StockMovement[]
└── ConsumptionLog[]
Notes: InventoryItem is the SOH authority. StockMovement is append-only. PO and GRN
are separate aggregates that post movements on GRN approval.
7.10 HR
Root: Staff
Staff
├── StaffProfile
├── Designation
├── DepartmentRef
├── SalaryStructure
├── Payslip[]
├── LeaveBalance
└── AttendanceRecord[]
Notes: Staff is the master aggregate; Payslip is a child aggregate per pay period.
LeaveBalance is recomputed monthly via LeaveRequest approvals.
7.11 Administration
Root: Branch
Branch
├── Facility[]
├── ComplianceCert[]
├── Asset[]
├── VendorRef[]
└── ApprovalMatrix
Notes: Branch owns facility and compliance metadata; ApprovalMatrix drives context-
specific approval workflows (Admissions, Finance, HR).
7.12 Reports & Analytics
Root: Report
Report
├── DatasetRef
├── Parameters
├── Schedule
31

PreOne DDD v1.0 | Architecture Freeze
├── Snapshot[]
└── Distribution[]
Notes: Report is the rendering aggregate; snapshots stored for historical consistency.
Datasets pull from cross-context views (read models).
7.13 Settings
Root: TenantConfig
TenantConfig
├── AcademicYear
├── WorkflowToggle[]
├── FeatureFlag[]
├── Localization
└── Branding
Notes: TenantConfig is single-instance per tenant; FeatureFlag drives conditional feature
exposure; WorkflowToggle enables/disables approval steps.
7.14 Platform Management
Root: Tenant
Tenant
├── Subscription
├── User[]
├── Role[]
├── AuditLog[]
├── Integration[]
├── APIKey[]
└── WebhookEndpoint[]
Notes: Tenant is the isolation root. All other contexts reference TenantId. Subscription
drives feature availability.
8. Aggregates
Aggregate म्हा(cid:21)जो (cid:9)Transaction Boundary. हा (cid:9)cluster of domain objects आहा (cid:9)जो (cid:9)एकत्र persist हा(cid:13)तो(cid:2)तो
आणि(cid:21) एक(cid:2)च transaction मध्या (cid:9)modify हा(cid:13)तो(cid:2)तो. Aggregate Root हा(cid:2) entry point आहा (cid:9)— external code
फक्तो root ला(cid:2) reference करू शीकतो(cid:9), children ला(cid:2) direct access नी(cid:2)हा . हा(cid:9) discipline invariant
enforcement साणि(cid:18)नीणि9चतो करतो(cid:9) — root च्या(cid:2) methods मध्या (cid:9)सावB invariants check हा(cid:13)तो(cid:2)तो.
PreOne मध्या (cid:9)aggregates च design खा(cid:2)ला ला principles follow करतो(cid:9):
32

PreOne DDD v1.0 | Architecture Freeze
• Keep aggregates small — एक aggregate एक(cid:2) concept ला(cid:2) represent करतो(cid:13). उदो(cid:2).: Invoice
+ InvoiceItems एक aggregate, पु(cid:21) Invoice + Customer separate aggregates.
• Reference by ID, not by object — Invoice.studentId (UUID), Invoice.student नी(cid:2)हा .
Cross-aggregate references फक्तो IDs.
• One transaction = one aggregate — eventual consistency cross-aggregate via
domain events.
• Optimistic concurrency — version field on root; concurrent update conflict
detection.
8.1 Aggregate Catalog
खा(cid:2)ला ला 15 aggregates PreOne च (cid:9)transactional backbone आहा(cid:9)तो. पु*त्याक(cid:9) aggregate च root, child
entities, value objects, invariants, आणि(cid:21) transaction boundary specify क(cid:9) ला आहा(cid:9):
8.2 Admission Aggregate
Root Admission
Child Entities Student (provisional), Parent, Approval
Value Objects Document, MedicalRecord, ApplicationForm,
FeePlanSelection
Invariants • Admission number is unique per tenant and
immutable after assignment • Status
transitions: Draft → Submitted → Verified →
Approved/Rejected → Enrolled • Cannot
approve without all mandatory documents
verified • FeePlanSelection required before
approval if any fee waiver applied • Approval
must carry approver UserId and timestamp
Transaction Boundary Single ACID transaction covers admission
status change + audit log + notification
dispatch (outbox pattern)
8.3 Student Aggregate
Root Student
33

PreOne DDD v1.0 | Architecture Freeze
Child Entities StudentProfile, ClassroomAssignment,
Promotion
Value Objects AcademicYear, Demographics, Address
Invariants • StudentId (UUID) is globally unique and
immutable • AdmissionNumber unique per
tenant • Only one active
ClassroomAssignment per AcademicYear •
Promotion history is append-only • Archive
after 7 years per DPDP; archived students are
read-only
Transaction Boundary Promotion touches Student +
ClassroomAssignment + PromotionLog in one
transaction; failures roll back entirely
8.4 Invoice Aggregate
Root Invoice
Child Entities Fee, Payment, Receipt
Value Objects Money, TaxBreakup, Discount,
PaymentMethod
Invariants • Invoice number GST-compliant, sequential
per tenant per financial year • Once issued,
immutable — corrections via CreditNote •
Total = Σ(Fee) − Σ(Discount) + Σ(Tax) • Receipt
generated only on successful payment •
Cannot write off without 2-tier approval if
amount > ₹10,000
Transaction Boundary Invoice generation + audit + notification +
ledger posting in single transaction (outbox
pattern for notification)
8.5 Payment Aggregate
Root Payment
Child Entities Receipt, Refund
34

PreOne DDD v1.0 | Architecture Freeze
Value Objects Money, PaymentMethod, GatewayReference
Invariants • Payment references exactly one Invoice •
Payment status: Pending → Success/Failed →
Refunded (partial/full) • Gateway reference
idempotency enforced • Refund amount
cannot exceed payment amount • Refund
requires approver matrix approval if > ₹5,000
Transaction Boundary Payment success → Invoice status update +
Receipt generation + outbox events; all in one
transaction
8.6 Attendance Aggregate
Root AttendanceSheet
Child Entities AttendanceRecord
Value Objects Date, ClassroomRef, Timestamp
Invariants • One AttendanceSheet per classroom per
date • Records immutable after submission;
corrections via AdjustmentRecord • Cannot
mark attendance for a future date •
MarkedBy UserId mandatory • Student must
be active in classroom to be marked
Transaction Boundary Sheet submission + per-student records +
audit log in one transaction
8.7 Observation Aggregate
Root Observation
Child Entities Attachment
Value Objects Milestone, Category, Template
35

PreOne DDD v1.0 | Architecture Freeze
Invariants • Observation references StudentId +
ClassroomRef + AcademicYear • Cannot edit
after 24h; corrections via new observation
with reference • AI-drafted observations
carry provenance flag (ai_draft=true) until
teacher review • Mandatory fields: category,
narrative, observedAt • Attachment size ≤5
MB per file, max 5 attachments
Transaction Boundary Observation create + attachment metadata +
notification + parent-visibility toggle in one
transaction
8.8 Payslip Aggregate
Root Payslip
Child Entities Earning, Deduction, TaxFiling
Value Objects Money, SalaryStructure, PayPeriod
Invariants • One Payslip per Staff per PayPeriod • Net
Pay = Σ(Earning) − Σ(Deduction) • Once
disbursed, immutable — corrections via
supplementary payslip • PF, ESI, TDS
computed per statute; computation audit-
logged • Payroll lock after disbursement
prevents edits
Transaction Boundary Payslip generation + GL posting + audit +
outbox notification in one transaction
8.9 InventoryItem Aggregate
Root InventoryItem
Child Entities StockMovement, ConsumptionLog
Value Objects Quantity, ReorderLevel, Unit, Money
36

PreOne DDD v1.0 | Architecture Freeze
Invariants • SKU unique per tenant • QuantityOnHand =
Σ(inward movements) − Σ(outward
movements) • Negative stock forbidden —
movement validation rejects • ReorderLevel
triggers automatic PO draft when SOH falls
below • Valuation method
(FIFO/LIFO/Weighted) is per-tenant config
Transaction Boundary Stock movement + QuantityOnHand update +
audit + reorder check in one transaction
8.10 PurchaseOrder Aggregate
Root PurchaseOrder
Child Entities POLineItem, Approval
Value Objects Money, Quantity, VendorRef
Invariants • PO number sequential per tenant per year •
Status: Draft → PendingApproval →
Approved → Dispatched → Received →
Closed • Total = Σ(POLineItem.amount) • PO
> ₹50,000 requires 2-tier approval • Cannot
receive (GRN) more than approved quantity
Transaction Boundary PO approval + audit + vendor notification
dispatch in one transaction
8.11 TransportRoute Aggregate
Root TransportRoute
Child Entities RouteStop, Trip, PickupAuthorization
Value Objects GPSPoint, ETA, Capacity
Invariants • Route unique per branch per academic year
• Total assigned students ≤ Vehicle capacity •
PickupAuthorization per student per trip
mandatory; OTP-verified • Route deviation
>500m triggers alert • Trip cannot start
without driver + vehicle assignment
37

PreOne DDD v1.0 | Architecture Freeze
Transaction Boundary Trip start + stop-level events + audit + parent
notification in one transaction per stop
8.12 Notification Aggregate
Root Notification
Child Entities DeliveryReceipt
Value Objects Template, Channel, Locale, Recipient
Invariants • One Notification per recipient per template
render • Status: Queued → Sent →
Delivered/Failed • Opt-out respected before
send (pre-send check) • Delivery receipts
immutable; failure retry capped at 3 •
Template version locked at notification
creation
Transaction Boundary Notification create + queue dispatch + audit
in one transaction; delivery receipt updates
are independent
8.13 Conversation Aggregate
Root Conversation
Child Entities ConversationMessage
Value Objects Channel, ThreadRef
Invariants • Conversation is 1:1 between school staff
and parent • Messages append-only; edit
only within 5 minutes • Cannot send to opt-
out parent • Messages carry template-id if
marketing; transactional allowed always •
Read receipts per message per recipient
Transaction Boundary Message send + recipient copy + audit +
delivery dispatch in one transaction
38

PreOne DDD v1.0 | Architecture Freeze
8.14 ReportCard Aggregate
Root ReportCard
Child Entities Milestone, Grade, TeacherRemark
Value Objects AcademicYear, Period, CurriculumPlanRef
Invariants • One ReportCard per Student per
AcademicYear per Period • Milestone status:
NotObserved → Emerging → Achieving →
Mastered • Cannot publish without Principal
sign-off • Once published to parent,
immutable; corrections via addendum •
Teacher remark mandatory per milestone
category
Transaction Boundary Publish + parent notification + audit in one
transaction
8.15 Tenant Aggregate
Root Tenant
Child Entities Subscription, User, Role, AuditLog
Value Objects TenantConfig, Branding, FeatureFlags
Invariants • TenantId is globally unique; all data scoped
by TenantId • Subscription status drives
feature availability • Cannot delete tenant —
only suspend (DPDP retention) • Cross-tenant
reads forbidden at ORM layer • Audit log
immutable; retention 7 years
Transaction Boundary Tenant provisioning + admin user + default
roles + default config in one transaction
8.16 AuditLog Aggregate
Root AuditLog
Child Entities —
39

PreOne DDD v1.0  |  Architecture Freeze
Value Objects Actor, Action, Resource, Timestamp, Diff
Invariants • Audit log entries are append-only; never
edited or deleted • Mandatory: actor
(UserId), action (verb), resource (entity+id),
timestamp • Retention 7 years per DPDP • PII
fields masked in audit unless actor has
unmask permission • Cross-tenant audit
reads forbidden
Transaction Boundary Audit entries written in same transaction as
the business operation (no async audit)
9. Entities
Entities हा (cid:9)Identity असालाला(cid:9)  (cid:9)Objects आहा(cid:9)तो. दो(cid:13)नी entities same attributes असानी? हा  जोर त्या(cid:2)च(cid:29)   identity
(UUID) different  असाला(cid:9)  तोर तो(cid:9)  different entities  आहा(cid:9)तो. Identity object  च्या(cid:2)  lifecycle  मध्या (cid:9)
immutable असातो(cid:9) — entity च (cid:9)attributes change हा(cid:13)ऊ शीकतो(cid:2)तो पु(cid:21) identity कधी च बोदोलातो नी(cid:2)हा .
PreOne मध्या(cid:9) पु*त्याक(cid:9)  entity च  identity UUID v4 आहा(cid:9) (database-stored as UUID). Human-
readable secondary identifiers (AdmissionNumber, InvoiceNumber, PONumber) separate
fields मध्या (cid:9)stored आहा(cid:9)तो — तो(cid:9) unique-per-tenant असातो(cid:2)तो पु(cid:21) globally unique नी(cid:2)हा तो.
9.1 Entity Catalog
खा(cid:2)ला ला table 35 entities च  identity, attributes, lifecycle, आणि(cid:21) notes summarize करतो(cid:9):
| Entity  | Identity   | Attributes      | Lifecycle      | Notes      |
| ------- | ---------- | --------------- | -------------- | ---------- |
| Student | StudentId  | AdmissionNumb   | Provisional →  | Carries    |
|         | (UUID)     | er, FirstName,  | Active →       | admission  |
|         |            | LastName, DOB,  | Promoted →     | number as  |
|         |            | Gender,         | Transferred →  | human-     |
|         |            | CurrentClass,   | Archived       | readable   |
|         |            | Status          |                | secondary  |
identifier
Parent ParentId (UUID) Name, Mobile,  Active →  Can be linked to
|     |     | Email,         | Inactive (when  | multiple         |
| --- | --- | -------------- | --------------- | ---------------- |
|     |     | Relationship,  | all students    | students across  |
|     |     | Custody,       | archived)       | branches         |
IsPrimary
40

PreOne DDD v1.0  |  Architecture Freeze
| Entity | Identity       | Attributes     | Lifecycle        | Notes            |
| ------ | -------------- | -------------- | ---------------- | ---------------- |
| Staff  | StaffId (UUID) | EmployeeCode,  | Probation →      | Carries          |
|        |                | Name,          | Active → Notice  | SalaryStructure  |
|        |                | Designation,   | → Offboarded     | as separate VO   |
Department,
BranchRef,
JoinedAt, Status
Teacher StaffId (sub- Qualifications[],  Inherits Staff Subtype of Staff
|           | type)        | Subjects[],      |                | with classroom- |
| --------- | ------------ | ---------------- | -------------- | --------------- |
|           |              | ClassroomAssig   |                | facing          |
|           |              | nments[]         |                | capabilities    |
| Admission | AdmissionId  | AdmissionNumb    | Draft →        | Root of         |
|           | (UUID)       | er, StudentRef,  | Submitted →    | Admission       |
|           |              | Status,          | Verified →     | aggregate       |
|           |              | AppliedAt,       | Approved/Rejec |                 |
|           |              | ApprovedAt,      | ted → Enrolled |                 |
Approver
Application ApplicationId  AdmissionRef,  Submitted →  Formally
|     | (UUID) | Form,       | UnderReview →  | submitted form  |
| --- | ------ | ----------- | -------------- | --------------- |
|     |        | SubmittedAt | Decision       | with parent     |
declarations
| Approval | ApprovalId  | EntityType,  | Pending →      | Generic          |
| -------- | ----------- | ------------ | -------------- | ---------------- |
|          | (UUID)      | EntityRef,   | Approved/Rejec | approval record  |
|          |             | Approver,    | ted            | referenced by    |
|          |             | Decision,    |                | Admission, PO,   |
|          |             | Reason,      |                | Refund,          |
|          |             | Timestamp    |                | LeaveRequest     |
Invoice InvoiceId (UUID) InvoiceNumber,  Draft → Issued  GST-compliant
|     |              | StudentRef,      | → Paid →         | numbering per     |
| --- | ------------ | ---------------- | ---------------- | ----------------- |
|     |              | Period, Total,   | PartiallyPaid →  | tenant per FY     |
|     |              | Status, IssuedAt | WrittenOff       |                   |
| Fee | FeeId (UUID) | InvoiceRef,      | Computed at      | Line item —       |
|     |              | Type, Amount,    | invoice creation | tuition,          |
|     |              | Tax, Period      |                  | transport, meal,  |
activity, one-
time
41

PreOne DDD v1.0  |  Architecture Freeze
| Entity  | Identity   | Attributes     | Lifecycle       | Notes        |
| ------- | ---------- | -------------- | --------------- | ------------ |
| Payment | PaymentId  | InvoiceRef,    | Pending →       | Idempotency  |
|         | (UUID)     | Amount, Mode,  | Success/Failed  | enforced on  |
|         |            | GatewayRef,    | → Refunded      | GatewayRef   |
Status,
ReceivedAt
Receipt ReceiptNumber  PaymentRef,  Generated on  Sequential per
|     | (string) | Amount,  | payment  | tenant per FY |
| --- | -------- | -------- | -------- | ------------- |
|     |          | IssuedAt | success  |               |
Refund RefundId (UUID) PaymentRef,  Requested →  2-tier approval
|     |     | Amount,  | Approved →  | if amount >  |
| --- | --- | -------- | ----------- | ------------ |
|     |     | Reason,  | Issued      | ₹5,000       |
Approver,
Status
Entity Catalog (cont.)
| Entity  | Identity         | Attributes   | Lifecycle    | Notes            |
| ------- | ---------------- | ------------ | ------------ | ---------------- |
| Payslip | PayslipId (UUID) | StaffRef,    | Draft →      | Locked after     |
|         |                  | PayPeriod,   | Generated →  | disbursement;    |
|         |                  | Gross,       | Disbursed →  | corrections via  |
|         |                  | Deductions,  | Locked       | supplementary    |
Net, Status
LeaveRequest LeaveRequestId  StaffRef, Type,  Pending →  Approves/
|     | (UUID) | From, To,        | Approved/Rejec | deducts       |
| --- | ------ | ---------------- | -------------- | ------------- |
|     |        | Reason, Status,  | ted            | LeaveBalance  |
|     |        | Approver         |                | on approval   |
AttendanceReco AttendanceId  StudentRef,  Marked →  Immutable after
| rd  | (UUID) | SheetRef,         | Adjusted (via  | sheet      |
| --- | ------ | ----------------- | -------------- | ---------- |
|     |        | Status, CheckIn,  | adjustment     | submission |
|     |        | CheckOut,         | record)        |            |
MarkedBy
Observation ObservationId  StudentRef,  Draft →  AiDraft flag
|     | (UUID) | TeacherRef,  | Published →    | distinguishes AI- |
| --- | ------ | ------------ | -------------- | ----------------- |
|     |        | Category,    | Archived (24h  | assisted drafts   |
|     |        | Narrative,   | edit window)   |                   |
ObservedAt,
AiDraft
42

PreOne DDD v1.0  |  Architecture Freeze
| Entity | Identity | Attributes | Lifecycle | Notes |
| ------ | -------- | ---------- | --------- | ----- |
ReportCard ReportCardId  StudentRef,  Draft →  Principal sign-
|     | (UUID) | AcademicYear,    | Reviewed →   | off required   |
| --- | ------ | ---------------- | ------------ | -------------- |
|     |        | Period, Status,  | Published →  | before publish |
|     |        | PublishedAt      | Archived     |                |
InventoryItem ItemId (UUID) SKU, Name,  Active →  ReorderLevel
|     |     | Category,     | Discontinued | triggers auto-PO  |
| --- | --- | ------------- | ------------ | ----------------- |
|     |     | QuantityOnHan |              | draft             |
d, ReorderLevel,
Valuation
| PurchaseOrder | PONumber  | VendorRef,       | Draft →        | Sequential per  |
| ------------- | --------- | ---------------- | -------------- | --------------- |
|               | (string)  | Lines[], Total,  | PendingApprov  | tenant per FY   |
|               |           | Status,          | al → Approved  |                 |
|               |           | Approver         | → Dispatched   |                 |
→ Received →
Closed
GoodsReceiptN GRNNumber  PORef, Lines[],  Draft → Verified  Triggers
| ote | (string) | ReceivedAt,  | → Posted | InventoryItem  |
| --- | -------- | ------------ | -------- | -------------- |
|     |          | Receiver     |          | stock          |
movement
| Vendor | VendorId  | Name, GSTIN,   | Active →    | GSTIN          |
| ------ | --------- | -------------- | ----------- | -------------- |
|        | (UUID)    | Contact,       | Blacklisted | mandatory for  |
|        |           | PaymentTerms,  |             | GST-compliant  |
|        |           | Rating         |             | invoices       |
TransportRoute RouteId (UUID) BranchRef,  Active →  Stops ordered
|         |            | Name, Stops[],    | Suspended →    | by sequence;     |
| ------- | ---------- | ----------------- | -------------- | ---------------- |
|         |            | VehicleRef,       | Closed         | capacity         |
|         |            | DriverRef         |                | enforced         |
| Vehicle | VehicleId  | RegistrationNu    | Active →       | Alerts on        |
|         | (UUID)     | mber, Capacity,   | Maintenance →  | insurance/fitnes |
|         |            | InsuranceExpiry,  | Retired        | s expiry         |
FitnessExpiry
| Driver | DriverId (UUID) | Name, License,    | Active →     | Police        |
| ------ | --------------- | ----------------- | ------------ | ------------- |
|        |                 | Mobile,           | Suspended →  | verification  |
|        |                 | PoliceVerificatio | Offboarded   | mandatory     |
n, Status
Entity Catalog (cont.)
43

PreOne DDD v1.0  |  Architecture Freeze
| Entity | Identity      | Attributes       | Lifecycle    | Notes           |
| ------ | ------------- | ---------------- | ------------ | --------------- |
| Trip   | TripId (UUID) | RouteRef, Date,  | Scheduled →  | GPS log         |
|        |               | StartTime,       | Started →    | captured every  |
|        |               | EndTime,         | Completed →  | 30 seconds      |
|        |               | Status, GPSLog[] | Cancelled    |                 |
Notification NotificationId  Recipient,  Queued → Sent  Template
|     | (UUID) | Channel,   | →                | version locked  |
| --- | ------ | ---------- | ---------------- | --------------- |
|     |        | Template,  | Delivered/Failed | at creation     |
Status,
QueuedAt,
SentAt
Conversation ConversationId  StaffRef,  Active → Closed 1:1 thread;
|     | (UUID) | ParentRef,  |     | archived after 1  |
| --- | ------ | ----------- | --- | ----------------- |
|     |        | Channel,    |     | year              |
LastMessageAt
| Broadcast | BroadcastId  | Sender,    | Draft →       | Generates N   |
| --------- | ------------ | ---------- | ------------- | ------------- |
|           | (UUID)       | Audience,  | Scheduled →   | Notification  |
|           |              | Template,  | Dispatched →  | records per   |
|           |              | Status,    | Completed     | recipient     |
DispatchedAt
Tenant TenantId (UUID) Name, Code,  Trial → Active  Multi-tenant
|     |     | Status, Plan,  | → Suspended  | isolation root |
| --- | --- | -------------- | ------------ | -------------- |
|     |     | CreatedAt      | → Offboarded |                |
User UserId (UUID) TenantRef,  Invited → Active  Email + Mobile
|     |     | Email, Mobile,  | → Locked →  | unique per  |
| --- | --- | --------------- | ----------- | ----------- |
|     |     | Status,         | Offboarded  | tenant      |
MFAEnrolled,
LastLogin
| Role | RoleId (UUID) | TenantRef,    | Active →   | System roles  |
| ---- | ------------- | ------------- | ---------- | ------------- |
|      |               | Name,         | Deprecated | cannot be     |
|      |               | Description,  |            | deleted       |
IsSystem
| Permission | PermissionId  | Code (e.g.,     | Stable | Atomic       |
| ---------- | ------------- | --------------- | ------ | ------------ |
|            | (string)      | fees.refund.exe |        | capability;  |
|            |               | cute),          |        | assigned to  |
|            |               | Description,    |        | roles        |
Module
44

PreOne DDD v1.0  |  Architecture Freeze
| Entity | Identity | Attributes | Lifecycle | Notes |
| ------ | -------- | ---------- | --------- | ----- |
AuditLog AuditLogId  TenantRef,  Append-only 7-year retention
|     | (UUID) | Actor, Action,  |     | per DPDP |
| --- | ------ | --------------- | --- | -------- |
Resource, Diff,
Timestamp
Integration IntegrationId  TenantRef,  Connected →  Credentials
|     | (UUID) | Type, Provider,  | Suspended →  | encrypted at  |
| --- | ------ | ---------------- | ------------ | ------------- |
|     |        | Credentials      | Disconnected | rest          |
(encrypted),
Status
| APIKey | APIKeyId (UUID) | TenantRef,   | Active →   | Hash stored;     |
| ------ | --------------- | ------------ | ---------- | ---------------- |
|        |                 | Name, Hash,  | Rotated →  | raw key visible  |
|        |                 | Scopes[],    | Revoked    | only at creation |
ExpiresAt,
LastUsedAt
10. Value Objects
Value Objects हा(cid:9) Identity नीसालाला(cid:9) (cid:9) Immutable Objects आहा(cid:9)तो. दो(cid:13)नी VOs same attributes असाल्या(cid:2)सा
equal आहा(cid:9)तो — equality by value, not by reference. VOs च(cid:9) फ(cid:2)यादो:(cid:9)  immutability नी(cid:9) side-effect
bugs कम  हा(cid:13)तो(cid:2)तो, equality comparison trivial हा(cid:13)तो(cid:13), आणि(cid:21) domain concepts (Money, Address,
Age) explicit type-safety णिमळेतो(cid:9).
PreOne मध्या(cid:9) VOs database मध्या(cid:9) JSON columns मध्या(cid:9) store हा(cid:13)तो(cid:2)तो (PostgreSQL JSONB). ORM
(Prisma) custom type converters व(cid:2)पुरूनी JSON ↔ VO TypeScript class convert करतो(cid:13). हा(cid:9)
approach denormalized storage दोतो(cid:9) (cid:9) पु(cid:21) query simplicity कम  करतो(cid:9) — त्या(cid:2)मळे(cid:18) (cid:9) ज्या(cid:2) VOs वर
queries जो(cid:2)स्तो आहा(cid:9)तो (उदो(cid:2).: Student.address.city) तो(cid:9) denormalize करूनी separate column करतो(cid:2)
यातो(cid:9) (cid:9).
Examples of value objects: Address, Money, PhoneNumber, Age, Email, Percentage,
AcademicYear.
10.1 Value Object Catalog
खा(cid:2)ला ला  table 25 VOs  च   attributes, immutability, validation rules,  आणि(cid:21)  usage notes
summarize करतो(cid:9):
45

PreOne DDD v1.0  |  Architecture Freeze
| Value Object | Attributes | Validation | Notes |
| ------------ | ---------- | ---------- | ----- |
Address Line1, Line2, City,  Pincode 6 digits;  Stored as JSON
|       | State, Pincode,     | State from enum | column; equality by  |
| ----- | ------------------- | --------------- | -------------------- |
|       | Country             |                 | all fields           |
| Money | Amount (decimal),   | Amount ≥ 0; 2   | All currency         |
|       | Currency (ISO 4217) | decimal places  | operations via       |
Money VO; no raw
floats
PhoneNumber CountryCode,  E.164 format; India:  Stored normalized;
|       | Number        | +91 followed by 10   | display formatted  |
| ----- | ------------- | -------------------- | ------------------ |
|       |               | digits               | per locale         |
| Email | Local, Domain | RFC 5322; lowercase  | Equality case-     |
|       |               | on create            | insensitive        |
Age Years, Months, Days Computed from DOB  Used for admission
|     |     | at a reference date | eligibility checks |
| --- | --- | ------------------- | ------------------ |
Percentage Value (0–100) 0 ≤ Value ≤ 100; 2  Used in discounts,
|     |     | decimal places | tax, attendance % |
| --- | --- | -------------- | ----------------- |
AcademicYear Start, End, Label  Start < End; 12- Drives fee cycles,
|     | (e.g., 2026-27) | month span | promotion,  |
| --- | --------------- | ---------- | ----------- |
attendance sheets
GPSPoint Lat, Lng, Timestamp,  Lat −90 to 90; Lng  Vehicle + trip
|     | Speed?, Heading? | −180 to 180 | tracking |
| --- | ---------------- | ----------- | -------- |
Quantity Amount (decimal),  Amount ≥ 0; Unit  Inventory operations
|     | Unit | from enum (PCS, KG,  |     |
| --- | ---- | -------------------- | --- |
LTR, etc.)
| Document | Type, URL,  | Type from enum;  | Stored as object URL;  |
| -------- | ----------- | ---------------- | ---------------------- |
|          | MimeType,   | Size ≤10MB       | not embedded           |
SizeBytes, VerifiedAt,
VerifiedBy?
MedicalRecord BloodGroup,  EmergencyContact  Versioned; updates
|     | Allergies[],  | mandatory | create new VO |
| --- | ------------- | --------- | ------------- |
Conditions[],
Immunizations[],
EmergencyContact
46

PreOne DDD v1.0  |  Architecture Freeze
| Value Object | Attributes           | Validation          | Notes                |
| ------------ | -------------------- | ------------------- | -------------------- |
| Discount     | Type,                | Reason mandatory;   | Snapshot at invoice  |
|              | Amount/Percent,      | ApprovedBy for >5%  | creation; not        |
|              | Reason, ApprovedBy,  | discount            | editable later       |
ValidUntil
TaxBreakup CGST, SGST, IGST,  CGST+SGST = IGST  Computed from
|     | Cess, TotalRate | equivalent for intra- | place-of-supply rules |
| --- | --------------- | --------------------- | --------------------- |
state; total ≤28%
Value Object Catalog (cont.)
| Value Object  | Attributes          | Validation          | Notes                |
| ------------- | ------------------- | ------------------- | -------------------- |
| PaymentMethod | Mode                | Provider mandatory  | Snapshot in Payment  |
|               | (UPI/Card/NetBankin | for non-cash        | aggregate            |
g/Cash/Cheque),
Provider?, Last4?,
Reference?
| Template | Id, Version, Locale,  | Version semver;      | Locked at             |
| -------- | --------------------- | -------------------- | --------------------- |
|          | Variables{}           | locale from enum     | notification creation |
| Channel  | Type                  | Provider config per  | Channel routing       |
|          | (SMS/WhatsApp/Em      | tenant               | decisions per         |
|          | ail/InApp),           |                      | template              |
ProviderConfig
Locale Language (ISO 639- en, mr, hi supported Drives template
|     | 1), Country? |     | selection |
| --- | ------------ | --- | --------- |
DeliveryStatus State, Reason?,  State from enum  Per recipient per
|     | Timestamp | (Sent, Delivered,  | notification |
| --- | --------- | ------------------ | ------------ |
Failed, Read)
JWT Token, ExpiresAt,  ExpiresAt ≤15 min  Short-lived; refresh
|     | RefreshToken?,  | from issue | rotation |
| --- | --------------- | ---------- | -------- |
Scopes[]
| MFAFactor | Type               | TOTP secret  | Per user; max 3  |
| --------- | ------------------ | ------------ | ---------------- |
|           | (TOTP/SMS/Email),  | encrypted    | factors          |
Secret, Verified
| Scope | Permissions[],    | Permissions from  | Granted on token  |
| ----- | ----------------- | ----------------- | ----------------- |
|       | TenantRef, Expiry | enum              | issue             |
47

PreOne DDD v1.0  |  Architecture Freeze
| Value Object | Attributes | Validation | Notes |
| ------------ | ---------- | ---------- | ----- |
SalaryStructure Basic, HRA, Special,  Basic ≥30% of gross;  Per staff; versioned
|              | Allowances{},    | PF computed on      | on revision |
| ------------ | ---------------- | ------------------- | ----------- |
|              | Deductions{}     | Basic               |             |
| LeaveBalance | Type, Accrued,   | Accrued ≥ Availed;  | Recomputed  |
|              | Availed,         | cap on carried      | monthly     |
|              | CarriedForward,  | forward             |             |
AsOfDate
| ETA            | Minutes,      | Confidence 0–1;   | Per stop per trip;     |
| -------------- | ------------- | ----------------- | ---------------------- |
|                | ComputedAt,   | minutes ≥0        | recomputed on GPS      |
|                | Confidence    |                   | update                 |
| ApprovalMatrix | EntityType,   | Sequence          | Per tenant; overrides  |
|                | Threshold,    | mandatory; min 1  | default rules          |
|                | Approvers[],  | approver          |                        |
Sequence
11. Domain Services
Domain Services हा (cid:9)Business Logic आहा (cid:9)जो (cid:9)नीGसाणिगोBकणिरत्या(cid:2) क(cid:13)(cid:21)त्या(cid:2)हा  single Entity णिक(cid:29)व(cid:2) Value Object
मध्या(cid:9) fit हा(cid:13)तो नी(cid:2)हा . हा(cid:9) stateless operations आहा(cid:9)तो — multiple aggregates वर operate करतो(cid:2)तो णिक(cid:29)व(cid:2)
cross-cutting computation  करतो(cid:2)तो. Domain services pure domain layer  मध्या(cid:9) आहा(cid:9)तो —
database, HTTP, णिक(cid:29)व(cid:2) क(cid:13)(cid:21)तो हा  infrastructure dependency नी(cid:2)हा .
Examples: AdmissionEligibilityService (checks age + documents + program capacity),
FeeCalculationService   (computes   invoice   items   from   plan   +   discounts   +   tax),
PayrollCalculationService (computes payslips for all staff for a period).
Domain Service आणि(cid:21) Application Service मधी ला difference: Domain Service pure business
logic  आहा(cid:9)  (no transaction, no event dispatch); Application Service transaction +
orchestration + event dispatch handle करतो(cid:13). Application Service ला(cid:2) Domain Service inject
हा(cid:13)तो(cid:13) आणि(cid:21) तो(cid:13) use case execute करतो(cid:2)नी(cid:2) service call करतो(cid:13).
48

PreOne DDD v1.0  |  Architecture Freeze
11.1 Domain Service Catalog
| Service | Responsibility | Dependencies | Signature | Notes |
| ------- | -------------- | ------------ | --------- | ----- |
AdmissionEligibi Check age,  Admission  checkEligibility( Pure domain
lityService document, and  Repository,  application):  logic; no side
|     | program           | Program         | EligibilityResult | effects |
| --- | ----------------- | --------------- | ----------------- | ------- |
|     | availability for  | Repository,     |                   |         |
|     | an admission      | AgeValidationSe |                   |         |
|     | application       | rvice           |                   |         |
AgeValidationSe Compute age as  [Please fill in] validateAge(dob Pure function;
| rvice | of academic       |     | , program,       | uses Age VO |
| ----- | ----------------- | --- | ---------------- | ----------- |
|       | year start and    |     | academicYear):   |             |
|       | validate against  |     | ValidationResult |             |
program age
band
FeeCalculationS Compute  FeePlan  calculate(feePla Returns draft;
ervice invoice items  Repository,  n, student,  Finance context
|     | from FeePlan,   | TaxRuleService | period):     | commits |
| --- | --------------- | -------------- | ------------ | ------- |
|     | discounts, and  |                | InvoiceDraft |         |
tax rules
LateFeePolicySe Apply late fee  TenantConfig  applyLateFee(in Idempotent —
| rvice | per tenant    | Repository | voice,        | same          |
| ----- | ------------- | ---------- | ------------- | ------------- |
|       | policy after  |            | asOfDate):    | invoice+date  |
|       | grace period  |            | LateFeeResult | returns same  |
result
| RefundService | Validate,        | Payment        | processRefund(r | Triggers     |
| ------------- | ---------------- | -------------- | --------------- | ------------ |
|               | approve, and     | Repository,    | efundRequest):  | PaymentGatew |
|               | execute refunds  | ApprovalMatrix | RefundResult    | ay ACL       |
with policy
enforcement
GSTFilingService Aggregate  Invoice  generateFiling(t Read-only;
|     | monthly GST      | Repository,  | enantId,  | doesn't modify  |
| --- | ---------------- | ------------ | --------- | --------------- |
|     | data for         | TaxBreakup   | month):   | aggregates      |
|     | GSTR-1/3B filing | Repository   | GSTFiling |                 |
AttendancePolic Validate  TenantConfig validateMark(sh Called before
| yService | attendance     |     | eet, record):    | AttendanceShee |
| -------- | -------------- | --- | ---------------- | -------------- |
|          | marks against  |     | ValidationResult | t submission   |
policy (e.g., max
per day, future
prevention)
49

PreOne DDD v1.0  |  Architecture Freeze
| Service        | Responsibility    | Dependencies    | Signature        | Notes           |
| -------------- | ----------------- | --------------- | ---------------- | --------------- |
| PromotionServi | Promote           | Student         | promote(studen   | Batch           |
| ce             | students to next  | Repository,     | t,               | operation;      |
|                | program at        | CurriculumPlan  | targetProgram):  | idempotent per  |
|                | academic year     | Repository      | PromotionResul   | student per     |
|                | boundary          |                 | t                | year            |
PayrollCalculati Compute  Staff Repository,  runPayroll(tena Batch job;
onService payslips for all  SalaryStructure,  ntId,  PF/ESI/TDS
active staff for a  LeaveBalance,  payPeriod):  computed per
|     | pay period | StatutoryRules | PayslipBatch | statute |
| --- | ---------- | -------------- | ------------ | ------- |
LeavePolicyServi Validate leave  LeaveBalance  validateRequest Called before
| ce  | requests against  | Repository,  | (request):       | LeaveRequest  |
| --- | ----------------- | ------------ | ---------------- | ------------- |
|     | policy and        | TenantConfig | ValidationResult | approval      |
update
LeaveBalance
StockValuationS Compute  InventoryItem  valuate(itemId,  Read-only;
| ervice | inventory      | Repository,    | asOfDate):      | cached per item  |
| ------ | -------------- | -------------- | --------------- | ---------------- |
|        | valuation      | StockMovement  | ValuationResult | per day          |
|        | (FIFO/LIFO/Wei | Repository     |                 |                  |
ghted) for a
date
ReorderService Check items  InventoryItem  checkAndDraft(t Scheduled job;
|     | below reorder    | Repository,  | enantId):  | drafts only —  |
| --- | ---------------- | ------------ | ---------- | -------------- |
|     | level and draft  | Vendor       | DraftPO[]  | approval       |
|     | POs              | Repository   |            | manual         |
RouteOptimizati Optimize stop  RouteStop  optimize(routeI AI/LLM-
| onService | sequence within  | Repository, GPS  | d):            | assisted;  |
| --------- | ---------------- | ---------------- | -------------- | ---------- |
|           | transport route  | Service          | OptimizedRoute | teacher    |
|           | constraints      |                  |                | confirms   |
ETAService Compute ETAs  Trip Repository,  computeETA(tri Recomputed
|     | for all stops on  | GPSPoint  | pId): ETA[] | every 60        |
| --- | ----------------- | --------- | ----------- | --------------- |
|     | an active trip    | stream    |             | seconds during  |
active trip
PickupAuthoriza Validate OTP- PickupAuthoriza authorize(stopI OTP valid for 10
tionService based pickup  tion Repository d, studentId,  minutes; one-
|     | authorization at  |     | otp): AuthResult | time use |
| --- | ----------------- | --- | ---------------- | -------- |
stop
50

PreOne DDD v1.0  |  Architecture Freeze
| Service | Responsibility | Dependencies | Signature | Notes |
| ------- | -------------- | ------------ | --------- | ----- |
TemplateRende Render message  MessageTempla render(templat Locale fallback:
rService template with  te Repository eId, vars,  requested → en
|     | variables and   |     | locale):      |     |
| --- | --------------- | --- | ------------- | --- |
|     | locale fallback |     | RenderedConte |     |
nt
ChannelRouting Decide channel  OptOut  route(notificatio Honors TRAI
| Service | per recipient   | Repository,  | n):            | DLT rules for  |
| ------- | --------------- | ------------ | -------------- | -------------- |
|         | based on        | Recipient    | ChannelDecisio | SMS            |
|         | preference and  | Preferences  | n              |                |
opt-out
AIGatewayServi Proxy all LLM/AI  Tenant  invoke(prompt,  Cost tracking
| ce  | calls with tenant  | Subscription,  | model,      | per call; rate- |
| --- | ------------------ | -------------- | ----------- | --------------- |
|     | quota, audit,      | Audit Service  | tenantId):  | limited per     |
|     | and safety         |                | AIResponse  | tenant          |
filters
12. Repositories
Repositories हा(cid:9) Persistence Interface आहा(cid:9)तो. Domain layer मध्या(cid:9) repository interface defined
आहा(cid:9) (e.g., StudentRepository); infrastructure layer मध्या(cid:9) Prisma-backed implementation आहा(cid:9)
(PrismaStudentRepository).  हा(cid:9)  separation testability  दोतो(cid:9) (cid:9) —  unit tests  मध्या(cid:9)  in-memory
repository implement करूनी domain logic isolated test हा(cid:13)तो(cid:13).
PreOne मध्या(cid:9) पु*त्याक(cid:9)  aggregate root च(cid:2) separate repository आहा(cid:9). Child entities च्या(cid:2) repositories
नी(cid:2)हा तो — तो(cid:9)  parent aggregate  सा(cid:13)बोतो  persist  हा(cid:13)तो(cid:2)तो.  उदो(cid:2).: StudentRepository  आहा(cid:9) पु(cid:21)
StudentProfileRepository नी(cid:2)हा  — StudentProfile Student aggregate सा(cid:13)बोतो persist हा(cid:13)तो(cid:13).
Repository pattern च (cid:9)णिनीयाम:
•  Returns aggregate or null — never partial entities.
•  Save method persists entire aggregate — child entities automatically persisted.
•  No business logic — pure CRUD + queries.
•  TenantId enforced at repository base class — cross-tenant reads impossible.
•  Optimistic concurrency — save checks version field, throws ConflictError if
mismatch.
51

PreOne DDD v1.0  |  Architecture Freeze
12.1 Repository Catalog
| Repository | Entity | Operations | Queries | Notes |
| ---------- | ------ | ---------- | ------- | ----- |
StudentReposit Student findById,  byClassroom,  Returns Student
| ory            |           | findByAdmissio    | byBranch,     | aggregate or  |
| -------------- | --------- | ----------------- | ------------- | ------------- |
|                |           | nNumber,          | byStatus,     | null; never   |
|                |           | search(filters),  | byAcademicYea | partial       |
|                |           | save, archive     | r             |               |
| AdmissionRepos | Admission | findById,         | byStatus,     | Status        |
| itory          |           | findByNumber,     | byBranch,     | transitions   |
|                |           | save, submit,     | byDateRange,  | validated at  |
|                |           | approve, reject   | byApprover    | service layer |
ApplicationRepo Application findById,  byStatus,  Attachments
| sitory |     | findByAdmissio | byReviewer | stored as    |
| ------ | --- | -------------- | ---------- | ------------ |
|        |     | n, save,       |            | Document VOs |
submitForRevie
w
InvoiceReposito Invoice findById,  byStudent,  GST-compliant
| ry  |     | findByNumber,  | byStatus,   | sequential  |
| --- | --- | -------------- | ----------- | ----------- |
|     |     | save, issue,   | byPeriod,   | numbering   |
|     |     | writeOff       | byDueDate,  |             |
overdue
| PaymentReposit | Payment | findById,      | byInvoice,  | GatewayRef  |
| -------------- | ------- | -------------- | ----------- | ----------- |
| ory            |         | findByGatewayR | byStatus,   | uniqueness  |
|                |         | ef             | byDateRange | enforced    |
(idempotency),
save
ReceiptReposito Receipt findById,  byPayment,  Sequential per
| ry  |     | findByNumber,  | byStudent,  | tenant per FY |
| --- | --- | -------------- | ----------- | ------------- |
|     |     | generate       | byDate      |               |
AttendanceRep AttendanceShee findById,  byClassroom,  One sheet per
| ository | t   | findByClassroo | byDateRange,  | classroom per  |
| ------- | --- | -------------- | ------------- | -------------- |
|         |     | mDate, save,   | byStudent     | date           |
submit
ObservationRep Observation findById, save,  byStudent,  AI-draft flag
| ository |     | publish, archive | byClassroom,  | preserved in  |
| ------- | --- | ---------------- | ------------- | ------------- |
|         |     |                  | byDateRange,  | queries       |
byCategory,
byTeacher
52

PreOne DDD v1.0  |  Architecture Freeze
| Repository | Entity | Operations | Queries | Notes |
| ---------- | ------ | ---------- | ------- | ----- |
ReportCardRep ReportCard findById, save,  byStudent,  Principal sign-
| ository         |         | publish, archive | byAcademicYea | off recorded   |
| --------------- | ------- | ---------------- | ------------- | -------------- |
|                 |         |                  | r, byPeriod   | before publish |
| PayslipReposito | Payslip | findById,        | byStaff,      | Locked after   |
| ry              |         | findByStaffPerio | byPeriod,     | disbursement   |
|                 |         | d, save, lock    | byStatus      |                |
LeaveRequestRe LeaveRequest findById, save,  byStaff,  Updates
| pository        |       | approve, reject | byStatus,       | LeaveBalance     |
| --------------- | ----- | --------------- | --------------- | ---------------- |
|                 |       |                 | byDateRange     | on approval      |
| StaffRepository | Staff | findById,       | byBranch,       | SalaryStructure  |
|                 |       | findByCode,     | byDesignation,  | versioned        |
|                 |       | save, onboard,  | byStatus        |                  |
offboard
InventoryItemR InventoryItem findById,  byCategory,  StockMovement
| epository |     | findBySKU,   | belowReorderLe | append-only |
| --------- | --- | ------------ | -------------- | ----------- |
|           |     | save, adjust | vel, byBranch  |             |
PurchaseOrderR PurchaseOrder findById,  byVendor,  Sequential per
| epository |     | findByNumber,   | byStatus,   | tenant per FY |
| --------- | --- | --------------- | ----------- | ------------- |
|           |     | save, approve,  | byDateRange |               |
dispatch,
receive, close
GRNRepository GoodsReceiptN findById,  byPO, byStatus,  Triggers stock
|     | ote | findByNumber,  | byDate | movement on  |
| --- | --- | -------------- | ------ | ------------ |
|     |     | save, verify,  |        | post         |
post
| VendorReposito | Vendor | findById,       | byName,    | GSTIN unique  |
| -------------- | ------ | --------------- | ---------- | ------------- |
| ry             |        | findByGSTIN,    | byStatus,  | per tenant    |
|                |        | save, blacklist | byRating   |               |
TransportRoute TransportRoute findById, save,  byBranch,  Capacity check
| Repository     |      | assignStudent,    | byAcademicYea    | on assign        |
| -------------- | ---- | ----------------- | ---------------- | ---------------- |
|                |      | removeStudent     | r, byVehicle     |                  |
| TripRepository | Trip | findById, save,   | byRoute,         | GPS log          |
|                |      | start, complete,  | byDate,          | streamed;        |
|                |      | cancel, logGPS    | byStatus, active | persisted every  |
30s
53

PreOne DDD v1.0  |  Architecture Freeze
| Repository | Entity | Operations | Queries | Notes |
| ---------- | ------ | ---------- | ------- | ----- |
NotificationRep Notification findById, save,  byRecipient,  Opt-out check
| ository |     | queue,          | byStatus,     | pre-save |
| ------- | --- | --------------- | ------------- | -------- |
|         |     | markSent,       | byDateRange,  |          |
|         |     | markDelivered,  | byTemplate    |          |
markFailed
ConversationRe Conversation findById,  byStaff,  1:1 thread;
| pository |     | findByStaffPare | byParent,       | archived after 1  |
| -------- | --- | --------------- | --------------- | ----------------- |
|          |     | nt, save,       | byLastMessage,  | year              |
|          |     | appendMessage   | byChannel       |                   |
, close
TenantReposito Tenant findById,  byStatus, byPlan Multi-tenant
| ry  |     | findByCode,  |     | isolation root |
| --- | --- | ------------ | --- | -------------- |
save, suspend,
reactivate
| AuditLogReposit | AuditLog | append,          | byActor,      | Append-only; 7-  |
| --------------- | -------- | ---------------- | ------------- | ---------------- |
| ory             |          | findById, search | byAction,     | year retention;  |
|                 |          |                  | byResource,   | cross-tenant     |
|                 |          |                  | byDateRange,  | reads forbidden  |
byTenant
13. Domain Events
Domain Events हा(cid:9) Business मध्या(cid:9) घड(cid:21)(cid:2)ऱ्या(cid:2) घटीनी(cid:2) आहा(cid:9)तो. जो(cid:9)व्हा(cid:2) क(cid:13)ई significant business operation
हा(cid:13)तो(cid:9) तो(cid:9)व्हा(cid:2)  aggregate event emit  करतो(cid:13) — उदो(cid:2).: AdmissionApproved, PaymentReceived,
StudentCreated. Events immutable आहा(cid:9)तो आणि(cid:21) past-tense verb form  मध्या(cid:9) named आहा(cid:9)तो
(Created, not Create).
PreOne मध्या (cid:9)events च(cid:2) flow असा(cid:2) आहा(cid:9):
Aggregate operation
    ↓ (same transaction)
Outbox table write
    ↓ (async relay)
Kafka topic publish
    ↓ (consumer)
Subscriber context handler
    ↓ (separate transaction)
Subscribing aggregate update
54

PreOne DDD v1.0  |  Architecture Freeze
हा(cid:2) Outbox Pattern आहा (cid:9)— त्या(cid:2)मळे(cid:18) (cid:9) aggregate update आ(cid:21)i event publish atomic हा(cid:13)तो(cid:2)तो. जोर Kafka
down असाला(cid:9)  तोर  aggregate update succeed हा(cid:13)तो(cid:13), पु(cid:21) event later publish हा(cid:13)तो(cid:13) जो(cid:9)व्हा(cid:2) Kafka
recover हा(cid:13)तो(cid:13).
13.1 Domain Event Catalog
| Event | Payload | Subscribers | Side Effects |
| ----- | ------- | ----------- | ------------ |
LeadCaptured {leadId, source,  CRM Context,  Triggers Enquiry
|     | channel, branchId,  | Admissions Context | creation if qualified;  |
| --- | ------------------- | ------------------ | ----------------------- |
|     | capturedAt}         |                    | CRM attribution         |
update
ApplicationSubmitte {applicationId,  Admissions Context,  Acknowledgment to
| d   | admissionId,  | Notification Context | parent; reviewer  |
| --- | ------------- | -------------------- | ----------------- |
|     | branchId,     |                      | assignment        |
submittedAt}
AdmissionApproved {admissionId,  Student Context,  StudentCreated;
|     | studentId, approver,  | Finance Context,     | FeePlan proposal;  |
| --- | --------------------- | -------------------- | ------------------ |
|     | approvedAt}           | Notification Context | parent welcome     |
message
AdmissionRejected {admissionId, reason,  Notification Context Rejection message to
|     | rejectedAt} |     | parent with appeal  |
| --- | ----------- | --- | ------------------- |
process
StudentCreated {studentId, tenantId,  Academics Context,  Classroom eligibility
|     | branchId,    | Attendance Context,  | check; default     |
| --- | ------------ | -------------------- | ------------------ |
|     | admissionId} | Transport Context    | attendance sheet;  |
transport opt-in
prompt
StudentPromoted {studentId,  Academics Context,  New CurriculumPlan
|     | fromProgram,  | Finance Context | assignment; new  |
| --- | ------------- | --------------- | ---------------- |
|     | toProgram,    |                 | FeePlan proposal |
academicYear}
StudentArchived {studentId,  All Contexts Read-only flag set;
|     | archivedAt, reason} |     | data archived per  |
| --- | ------------------- | --- | ------------------ |
DPDP; parent access
revoked
AttendanceMarked {sheetId, studentId,  Notification Context,  Parent absence alert
|     | status, markedAt} | Reports Context | if status=Absent;  |
| --- | ----------------- | --------------- | ------------------ |
daily attendance
report
55

PreOne DDD v1.0  |  Architecture Freeze
| Event | Payload | Subscribers | Side Effects |
| ----- | ------- | ----------- | ------------ |
ObservationAdded {observationId,  Notification Context,  Parent notification if
|     | studentId, category,  | Reports Context | published; weekly  |
| --- | --------------------- | --------------- | ------------------ |
|     | teacherId}            |                 | observation        |
summary
InvoiceGenerated {invoiceId, studentId,  Notification Context,  Invoice delivery to
|     | amount, dueDate} | Reports Context | parent; finance  |
| --- | ---------------- | --------------- | ---------------- |
dashboard update
PaymentReceived {paymentId,  Finance Context,  Receipt generation;
|     | invoiceId, amount,  | Notification Context,  | parent confirmation;  |
| --- | ------------------- | ---------------------- | --------------------- |
|     | mode}               | Reports Context        | GL posting            |
PaymentFailed {paymentId,  Notification Context Parent alert with
|     | invoiceId, reason,  |     | retry options |
| --- | ------------------- | --- | ------------- |
failedAt}
| RefundIssued | {refundId,          | Finance Context,     | GL adjustment;      |
| ------------ | ------------------- | -------------------- | ------------------- |
|              | paymentId, amount,  | Notification Context | parent confirmation |
approver}
LateFeeApplied {invoiceId,  Notification Context Updated invoice
|     | lateFeeAmount,  |     | delivery to parent |
| --- | --------------- | --- | ------------------ |
appliedAt}
PayslipGenerated {payslipId, staffId,  Notification Context Salary slip email/SMS
|               | payPeriod, netPay}  |                      | to staff            |
| ------------- | ------------------- | -------------------- | ------------------- |
| LeaveApproved | {leaveRequestId,    | HR Context,          | LeaveBalance        |
|               | staffId, from, to,  | Notification Context | update; coverage    |
|               | approver}           |                      | plan notification   |
| POCreated     | {poId, vendorId,    | Inventory Context    | Vendor              |
|               | total, createdBy}   |                      | acknowledgment (if  |
integration enabled)
| GRNReceived | {grnId, poId,  | Finance Context,  | Stock movement        |
| ----------- | -------------- | ----------------- | --------------------- |
|             | receivedAt}    | Inventory Context | posted; GL entry for  |
procurement
StockAdjusted {itemId, delta,  Reports Context Stock accuracy
|     | reason, adjustedBy} |     | report; reorder  |
| --- | ------------------- | --- | ---------------- |
check
TransportAssigned {studentId, routeId,  Notification Context,  Parent confirmation
|     | stopId} | Transport Context | with route + ETA  |
| --- | ------- | ----------------- | ----------------- |
details
56

PreOne DDD v1.0  |  Architecture Freeze
| Event | Payload | Subscribers | Side Effects |
| ----- | ------- | ----------- | ------------ |
TripStarted {tripId, routeId,  Notification Context,  Parent push
|     | startedAt, driverId} | Transport Context | notification with live  |
| --- | -------------------- | ----------------- | ----------------------- |
tracking link
StudentPickedUp {tripId, studentId,  Notification Context Parent push: 'Your
|     | stopId, pickedUpAt} |     | child boarded at  |
| --- | ------------------- | --- | ----------------- |
HH:MM'
StudentDropped {tripId, studentId,  Notification Context Parent push: 'Your
|     | stopId, droppedAt} |     | child alighted at  |
| --- | ------------------ | --- | ------------------ |
HH:MM'
RouteDeviationDetec {tripId,  Notification Context,  Alert to transport
| ted | expectedRoute,  | Transport Context | admin + parent if  |
| --- | --------------- | ----------------- | ------------------ |
|     | actualGPS,      |                   | >500m              |
deviationMeters}
NotificationQueued {notificationId,  Communication  Channel dispatch
|     | recipient, channel} | Context | initiated |
| --- | ------------------- | ------- | --------- |
NotificationDelivered {notificationId,  Reports Context Delivery rate
|     | deliveredAt} |     | dashboard update |
| --- | ------------ | --- | ---------------- |
TenantSuspended {tenantId, reason,  Platform Context, All  All API access
|     | suspendedAt} | Contexts | blocked; data  |
| --- | ------------ | -------- | -------------- |
preserved for
retention
AuditLogAppended {auditLogId, actor,  Platform Context (for  SIEM forwarding;
|     | action, resource} | security monitoring) | anomaly detection |
| --- | ----------------- | -------------------- | ----------------- |
14. Specifications
Specifications हा (cid:9)Complex Business Rules आहा(cid:9)तो जो (cid:9)predicate objects म्हा(cid:21)नी?  encapsulated आहा(cid:9)तो.
Specification pattern च(cid:2) फ(cid:2)यादो(cid:2): rules composable आहा(cid:9)तो (AND, OR, NOT), reusable आहा(cid:9)तो
(same spec multiple places), आणि(cid:21) testable आहा(cid:9)तो (independent unit tests).
PreOne  मध्या(cid:9)  specifications BRC  च(cid:9)  direct implementation  आहा(cid:9)तो.  उदो(cid:2).: R-ELG-001 (Age
eligibility per program) हा(cid:2) rule AgeEligibilitySpecification मध्या (cid:9)implement आहा(cid:9). BRC section of
every rule च(cid:2) 'Domain Element' field त्या(cid:2) rule च्या(cid:2) corresponding specification ला(cid:2) reference
करतो(cid:13).
Specification pattern च(cid:2) composition:
57

PreOne DDD v1.0  |  Architecture Freeze
•  AND: spec1.and(spec2) — both must be satisfied.
•  OR: spec1.or(spec2) — either must be satisfied.
•  NOT: spec1.not() — negation.
•  Composite: PromotionSpecification = AgeEligibility AND AttendanceEligibility AND
NOT FeeDue AND MilestoneSpec.
14.1 Specification Catalog
| Specification | Rule | Composition | Notes |
| ------------- | ---- | ----------- | ----- |
AgeEligibilitySpecific Student age as of  AND with  Backed by
ation academic year start  DocumentCompleteS AgeValidationService
|     | must be within  | pecification |     |
| --- | --------------- | ------------ | --- |
program's age band
(e.g., Nursery 2.5–
3.5 years)
DocumentCompleteS All mandatory  AND with  Mandatory doc list
pecification documents (birth  AgeEligibilitySpecific per program config
|     | cert, photo, parent  | ation |     |
| --- | -------------------- | ----- | --- |
ID, medical) verified
FeeDueSpecification Student has unpaid  Used in report card  Excludes invoices
|     | invoices past grace  | release gate | with approved  |
| --- | -------------------- | ------------ | -------------- |
|     | period               |              | payment plan   |
DiscountEligibilitySpe Discount type valid  AND with  Sibling, staff, early-
cification for student (e.g.,  DiscountCapSpecifica bird, scholarship
|     | sibling discount  | tion | rules |
| --- | ----------------- | ---- | ----- |
requires active
sibling)
DiscountCapSpecifica Total discount on an  AND with  Prevents excessive
| tion | invoice ≤ tenant- | DiscountEligibilitySpe | stacking |
| ---- | ----------------- | ---------------------- | -------- |
|      | configured cap    | cification             |          |
(default 25%)
AttendanceEligibility Student attendance  AND with  Medical leaves
Specification ≥75% in the period  FeeDueSpecification  excluded with
|     | (for report card  | for promotion gate | documentation |
| --- | ----------------- | ------------------ | ------------- |
promotion gate)
58

PreOne DDD v1.0  |  Architecture Freeze
| Specification | Rule | Composition | Notes |
| ------------- | ---- | ----------- | ----- |
PromotionSpecificati Student eligible for  AND of AgeEligibility  Composite
| on  | promotion: age +     | ∧                      | specification;     |
| --- | -------------------- | ---------------------- | ------------------ |
|     | attendance + fee +   | AttendanceEligibility  | evaluated at year- |
|     | academic milestones  | ∧ FeeDue(negated)      | end                |
|     | met                  | ∧ MilestoneSpec        |                    |
MilestoneAchieveme Student has achieved  Part of  Milestone data from
ntSpecification ≥80% of curriculum  PromotionSpecificati Observations
|     | milestones for the  | on  |     |
| --- | ------------------- | --- | --- |
period
LateFeeApplicabilityS Invoice past due date  Standalone Idempotent per
| pecification | + grace period  |     | invoice per day |
| ------------ | --------------- | --- | --------------- |
(default 7 days) and
no approved
extension
RefundEligibilitySpeci Payment was  AND with  90-day window per
| fication | successful and    | ApprovalMatrixSpeci | finance policy |
| -------- | ----------------- | ------------------- | -------------- |
|          | refund requested  | fication            |                |
within 90 days;
refund ≤ payment
amount
ApprovalMatrixSpeci Refund requires N- AND with  Thresholds per
fication tier approval based  RefundEligibilitySpeci tenant config
|     | on amount  | fication |     |
| --- | ---------- | -------- | --- |
thresholds
StockAvailabilitySpec Inventory item has  Standalone Negative stock
| ification | sufficient quantity  |     | forbidden |
| --------- | -------------------- | --- | --------- |
for consumption
request
ReorderSpecification Item SOH ≤ reorder  Standalone Prevents duplicate
|     | level AND no  |     | POs |
| --- | ------------- | --- | --- |
pending PO for the
item in last 7 days
PickupAuthorizationS OTP valid, within 10- Standalone One-time use; OTP
| pecification | min window, not  |     | fail counter limits |
| ------------ | ---------------- | --- | ------------------- |
previously used, for
the correct
stop+student+trip
59

PreOne DDD v1.0  |  Architecture Freeze
| Specification | Rule | Composition |     | Notes |
| ------------- | ---- | ----------- | --- | ----- |
NotificationOptOutS Recipient has not  AND with  Transactional
pecification opted out of the  TRAITimeWindowSp notifications bypass
|     | channel + template  | ecification |     | opt-out |
| --- | ------------------- | ----------- | --- | ------- |
category
TRAITimeWindowSp Marketing SMS sent  AND with  Transactional
ecification only between 9 AM –  NotificationOptOutS bypasses window
8 PM per TRAI DLT  pecification
rules
15. Factories
Factories हा(cid:9) Complex Object Creation handle करतो(cid:2)तो. जो(cid:9)व्हा(cid:2) aggregate च  creation अनी(cid:9)क
invariants enforce करतो(cid:9), अनी(cid:9)क child entities initialize करतो(cid:9), आणि(cid:21) external services सा(cid:13)बोतो
coordinate करतो(cid:9) तो(cid:9)व्हा(cid:2) direct constructor व(cid:2)पुर(cid:21) (cid:9)cumbersome आणि(cid:21) error-prone आहा(cid:9). Factory हा(cid:9)
encapsulation दोतो(cid:9)  (cid:9)— creation logic एक(cid:2) णिठीक(cid:2)(cid:21) , callers फक्तो required parameters pass करतो(cid:2)तो.
PreOne मध्या (cid:9)पु*त्याक(cid:9)  aggregate root च(cid:2) factory आहा(cid:9). Factory च (cid:9)responsibilities:
•  Validate mandatory fields — throw ValidationError if missing.
•  Enforce invariants at construction — e.g., StudentFactory requires Parent,
AdmissionFactory requires BranchId+ProgramId.
•  Initialize child entities — e.g., InvoiceFactory computes items via
FeeCalculationService.
•  Assign sequential identifiers — e.g., InvoiceFactory assigns invoice number via
InvoiceRepository.nextNumber().
•  Set initial status — e.g., AdmissionFactory creates with status=Draft.
15.1 Factory Catalog
| Factory | Creates | Validation | Invariants  | Notes |
| ------- | ------- | ---------- | ----------- | ----- |
Enforced
| StudentFactory | Student | Mandatory:       | AdmissionNumb   | Called by      |
| -------------- | ------- | ---------------- | --------------- | -------------- |
|                |         | Name, DOB,       | er uniqueness;  | AdmissionAppro |
|                |         | Gender, Parent;  | Classroom       | ved event      |
|                |         | AdmissionNumb    | assignment      | handler        |
|                |         | er auto-         | optional at     |                |
|                |         | assigned         | creation        |                |
60

PreOne DDD v1.0  |  Architecture Freeze
| Factory | Creates | Validation | Invariants  | Notes |
| ------- | ------- | ---------- | ----------- | ----- |
Enforced
AdmissionFacto Admission Mandatory:  Status=Draft on  Called by Lead
| ry  |     | BranchId,       | creation; cannot  | conversion or  |
| --- | --- | --------------- | ----------------- | -------------- |
|     |     | ProgramId,      | create with       | direct         |
|     |     | ParentContact,  | already-used      | application    |
|     |     | AcademicYear    | AdmissionNumb     |                |
er
InvoiceFactory Invoice Mandatory:  Total = Σ(items)  Delegates to
|     |     | StudentRef,       | − Σ(discounts) +  | FeeCalculationS |
| --- | --- | ----------------- | ----------------- | --------------- |
|     |     | Period, FeePlan;  | Σ(tax); invoice   | ervice          |
|     |     | computes items    | number            |                 |
|     |     | + tax +           | sequential        |                 |
discounts
| PaymentFactory | Payment | Mandatory:      | Amount ≤      | Called by  |
| -------------- | ------- | --------------- | ------------- | ---------- |
|                |         | InvoiceRef,     | invoice       | payment    |
|                |         | Amount, Mode;   | outstanding;  | gateway    |
|                |         | GatewayRef for  | GatewayRef    | callback   |
|                |         | non-cash        | idempotency   |            |
ReceiptFactory Receipt Mandatory:  Generated only  Called by
|     |     | PaymentRef;  | on successful  | Payment         |
| --- | --- | ------------ | -------------- | --------------- |
|     |     | number       | payment        | success handler |
sequential
| PayslipFactory | Payslip | Mandatory:       | One per staff    | Called by        |
| -------------- | ------- | ---------------- | ---------------- | ---------------- |
|                |         | StaffRef,        | per period; Net  | PayrollCalculati |
|                |         | PayPeriod;       | = Gross −        | onService        |
|                |         | SalaryStructure  | Deductions       |                  |
active
AttendanceShee AttendanceShee Mandatory:  Records for all  Called by
| tFactory | t   | ClassroomRef,  | active students  | teacher at    |
| -------- | --- | -------------- | ---------------- | ------------- |
|          |     | Date,          | in classroom     | session start |
|          |     | AcademicYear;  | pre-populated    |               |
one per
classroom per
date
61

PreOne DDD v1.0  |  Architecture Freeze
| Factory | Creates | Validation | Invariants  | Notes |
| ------- | ------- | ---------- | ----------- | ----- |
Enforced
ObservationFact Observation Mandatory:  AiDraft flag  Called by
| ory |     | StudentRef,  | from AI       | teacher or AI  |
| --- | --- | ------------ | ------------- | -------------- |
|     |     | TeacherRef,  | assistant;    | assistant      |
|     |     | Category,    | observedAt =  |                |
|     |     | Narrative    | now           |                |
ReportCardFact ReportCard Mandatory:  Milestones pre- Called at period
| ory |     | StudentRef,    | populated from  | start |
| --- | --- | -------------- | --------------- | ----- |
|     |     | AcademicYear,  | CurriculumPlan  |       |
Period;
CurriculumPlan
resolved
PurchaseOrderF PurchaseOrder Mandatory:  Status=Draft;  Called by
| actory |     | VendorRef,      | PO number  | manual creation  |
| ------ | --- | --------------- | ---------- | ---------------- |
|        |     | Lines[]; total  | sequential | or               |
|        |     | computed        |            | ReorderService   |
draft
TransportRoute TransportRoute Mandatory:  Stops ordered;  Called at
| Factory |     | BranchRef,      | capacity ≥  | academic year  |
| ------- | --- | --------------- | ----------- | -------------- |
|         |     | Name, Stops[],  | enrolled    | start          |
|         |     | VehicleRef,     | students    |                |
DriverRef,
AcademicYear
TenantFactory Tenant Mandatory:  Code unique;  Called by tenant
|     |     | Name, Code,  | default config  | provisioning  |
| --- | --- | ------------ | --------------- | ------------- |
|     |     | Plan; admin  | applied         | flow          |
user; default
roles +
permissions
seeded
16. Application Services
Application Services Use Cases Handle करतो(cid:2)तो. हा (cid:9)thin orchestration layer आहा(cid:9) — transaction
boundary, event dispatch, आणि(cid:21) service coordination handle करतो(cid:2)तो. Business logic नी(cid:2)हा  — तो(cid:9)
domain layer (aggregates, services, specs) मध्या(cid:9) आहा(cid:9). Application services च(cid:9) नी(cid:2)व always
verb+Noun+UseCase आहा(cid:9) (e.g., ApproveAdmissionUseCase, GenerateInvoiceUseCase).
Application service च(cid:2) typical flow:
62

PreOne DDD v1.0  |  Architecture Freeze
1. Parse + validate input DTO
2. Start transaction
3. Load aggregate(s) via repository
4. Call domain service or aggregate method
5. Save aggregate(s) via repository
6. Append audit log
7. Write event(s) to outbox
8. Commit transaction
9. Return result DTO
Application services stateless आहा(cid:9)तो — each use case invocation independent. NestJS मध्या (cid:9)
पु*त्याक(cid:9)  use case एक class आहा(cid:9) जो(cid:13) NestJS DI container द्वा(cid:2)र(cid:9) inject हा(cid:13)तो(cid:13).
16.1 Application Service Catalog
| Use Case        | Responsibility  | Transaction | Orchestrates   | Notes       |
| --------------- | --------------- | ----------- | -------------- | ----------- |
| CreateAdmissio  | Orchestrate     | Single      | AdmissionFacto | Returns     |
| nUseCase        | lead → enquiry  | transaction | ry →           | AdmissionId |
|                 | → application   |             | AdmissionRepos |             |
|                 | → admission     |             | itory →        |             |
|                 | draft           |             | AuditService   |             |
| SubmitApplicati | Validate        | Single      | DocumentComp   | Triggers    |
onUseCase completeness,  transaction leteSpecificatio ApplicationSub
|     | attach      |     | n →              | mitted event |
| --- | ----------- | --- | ---------------- | ------------ |
|     | documents,  |     | AdmissionRepos   |              |
|     | submit for  |     | itory →          |              |
|     | review      |     | NotificationServ |              |
ice
ApproveAdmissi Verify eligibility,  Single  AgeEligibilitySpe Idempotent per
onUseCase run approval  transaction with  cification →  admission
|     | matrix, fire   | outbox | ApprovalMatrix  |     |
| --- | -------------- | ------ | --------------- | --- |
|     | StudentCreated |        | →               |     |
StudentFactory
→
AdmissionRepos
itory →
NotificationServ
ice
RejectAdmissio Record rejection  Single  AdmissionRepos Triggers
| nUseCase | reason, notify  | transaction | itory →          | AdmissionRejec |
| -------- | --------------- | ----------- | ---------------- | -------------- |
|          | parent with     |             | NotificationServ | ted event      |
|          | appeal process  |             | ice              |                |
63

PreOne DDD v1.0  |  Architecture Freeze
| Use Case | Responsibility | Transaction | Orchestrates | Notes |
| -------- | -------------- | ----------- | ------------ | ----- |
PromoteStuden Validate  Single  PromotionSpeci Batch at year-
| tUseCase | promotion spec,  | transaction | fication →     | end |
| -------- | ---------------- | ----------- | -------------- | --- |
|          | create           |             | StudentReposit |     |
|          | promotion        |             | ory →          |     |
|          | record, update   |             | AuditService   |     |
classroom
GenerateInvoic Compute fees  Single  FeeCalculationS Batch at period
| eUseCase | for a student-  | transaction with  | ervice →        | start |
| -------- | --------------- | ----------------- | --------------- | ----- |
|          | period, create  | outbox            | InvoiceFactory  |       |
|          | invoice,        |                   | →               |       |
|          | dispatch to     |                   | InvoiceReposito |       |
|          | parent          |                   | ry →            |       |
NotificationServ
ice
CollectPayment Validate  Single  PaymentFactory  Idempotent on
| UseCase | payment,         | transaction with  | →               | GatewayRef |
| ------- | ---------------- | ----------------- | --------------- | ---------- |
|         | capture via      | outbox            | PaymentGatew    |            |
|         | gateway,         |                   | ayACL →         |            |
|         | generate         |                   | ReceiptFactory  |            |
|         | receipt, update  |                   | →               |            |
|         | invoice          |                   | InvoiceReposito |            |
ry →
NotificationServ
ice
ProcessRefundU Validate refund  Single  RefundEligibility 2-tier approval
seCase spec, approve  transaction with  Specification →  if > ₹5,000
|     | via matrix,  | outbox | ApprovalMatrix   |     |
| --- | ------------ | ------ | ---------------- | --- |
|     | execute via  |        | Specification →  |     |
|     | gateway      |        | PaymentGatew     |     |
ayACL →
NotificationServ
ice
64

PreOne DDD v1.0  |  Architecture Freeze
| Use Case | Responsibility | Transaction | Orchestrates | Notes |
| -------- | -------------- | ----------- | ------------ | ----- |
ApplyLateFeesU Scheduled job:  Per-invoice  LateFeeApplicab Runs daily at 9
| seCase | identify overdue  | transaction | ilitySpecification  | AM  |
| ------ | ----------------- | ----------- | ------------------- | --- |
|        | invoices, apply   |             | →                   |     |
|        | late fee, notify  |             | LateFeePolicySe     |     |
rvice →
InvoiceReposito
ry →
NotificationServ
ice
MarkAttendanc Validate marks,  Single  AttendancePolic Per classroom
eUseCase submit sheet,  transaction with  yService →  per day
|     | dispatch       | outbox | AttendanceRep |     |
| --- | -------------- | ------ | ------------- | --- |
|     | absence alerts |        | ository →     |     |
NotificationServ
ice
| ShareObservati | Validate        | Single            | ObservationRep   | Edit window  |
| -------------- | --------------- | ----------------- | ---------------- | ------------ |
| onUseCase      | observation,    | transaction with  | ository →        | 24h          |
|                | publish to      | outbox            | NotificationServ |              |
|                | parent, log to  |                   | ice →            |              |
|                | report card     |                   | ReportCardRep    |              |
ository
(optional)
PublishReportC Principal sign- Single  ReportCardRep Immutable after
ardUseCase off, publish to  transaction with  ository →  publish
|     | parent, archive  | outbox | NotificationServ |     |
| --- | ---------------- | ------ | ---------------- | --- |
|     | draft            |        | ice              |     |
RunPayrollUseC Compute  Per-staff  PayrollCalculati Monthly batch
| ase | payslips for all  | transaction;  | onService →     |     |
| --- | ----------------- | ------------- | --------------- | --- |
|     | active staff for  | batch         | PayslipFactory  |     |
|     | period, lock      |               | →               |     |
|     | after             |               | PayslipReposito |     |
|     | disbursement      |               | ry →            |     |
NotificationServ
ice
65

PreOne DDD v1.0  |  Architecture Freeze
| Use Case | Responsibility | Transaction | Orchestrates | Notes |
| -------- | -------------- | ----------- | ------------ | ----- |
ApplyLeaveUse Validate leave  Single  LeavePolicyServi Balance update
| Case | request, route  | transaction with  | ce →             | on approval |
| ---- | --------------- | ----------------- | ---------------- | ----------- |
|      | approval,       | outbox            | LeaveRequestRe   |             |
|      | update balance  |                   | pository →       |             |
|      | on approval     |                   | NotificationServ |             |
ice
CreatePurchase Validate vendor,  Single  PurchaseOrderF 2-tier if >
OrderUseCase compute total,  transaction with  actory →  ₹50,000
|     | route approval | outbox | PurchaseOrderR |     |
| --- | -------------- | ------ | -------------- | --- |
epository →
ApprovalMatrix
→
NotificationServ
ice
| ReceiveGRNUse | Validate GRN      | Single            | GRNRepository     | Triggers       |
| ------------- | ----------------- | ----------------- | ----------------- | -------------- |
| Case          | against PO, post  | transaction with  | →                 | StockAdjusted  |
|               | stock             | outbox            | StockAvailability | event          |
|               | movement,         |                   | Specification     |                |
|               | update GL         |                   | (negated) →       |                |
StockMovement
→ GLService
StartTripUseCas Validate driver +  Single  TripRepository  GPS stream
| e   | vehicle, mark  | transaction with  | →                | begins |
| --- | -------------- | ----------------- | ---------------- | ------ |
|     | trip started,  | outbox            | NotificationServ |        |
|     | notify parents |                   | ice              |        |
RecordPickupUs Validate OTP,  Single  PickupAuthoriza OTP one-time
eCase mark picked up,  transaction with  tionSpecificatio use
|     | notify parent | outbox | n →  |     |
| --- | ------------- | ------ | ---- | --- |
TripRepository
→
NotificationServ
ice
RecordDropUse Mark dropped,  Single  TripRepository  TripCompleted
| Case | notify parent,    | transaction with  | →                | auto-fires |
| ---- | ----------------- | ----------------- | ---------------- | ---------- |
|      | complete trip if  | outbox            | NotificationServ |            |
|      | last stop         |                   | ice              |            |
66

PreOne DDD v1.0  |  Architecture Freeze
| Use Case        | Responsibility | Transaction | Orchestrates  | Notes    |
| --------------- | -------------- | ----------- | ------------- | -------- |
| SendNotificatio | Render         | Single      | TemplateRende | Opt-out  |
nUseCase template, route  transaction with  rService →  respected
|     | channel,       | outbox | ChannelRouting  |     |
| --- | -------------- | ------ | --------------- | --- |
|     | dispatch, log  |        | Service →       |     |
|     | delivery       |        | NotificationRep |     |
ository →
TRAITimeWindo
wSpecification
| SendBroadcastU | Generate N  | Batch  | BroadcastRepos | Chunked to  |
| -------------- | ----------- | ------ | -------------- | ----------- |
seCase notifications  transaction per  itory →  respect rate
|     | from broadcast  | chunk | NotificationFact | limits |
| --- | --------------- | ----- | ---------------- | ------ |
|     | template +      |       | ory →            |        |
|     | audience        |       | SendNotificatio  |        |
nUseCase
OnboardStaffUs Create staff,  Single  StaffFactory →  Triggers
eCase assign role, init  transaction with  StaffRepository  StaffOnboarded
|     | leave balance,  | outbox | →               |     |
| --- | --------------- | ------ | --------------- | --- |
|     | schedule        |        | RoleAssignment  |     |
|     | induction       |        | →               |     |
NotificationServ
ice
OffboardStaffUs Mark  Single  StaffRepository  Access revoked
eCase offboarded,  transaction with  → RBACService  immediately
|     | revoke access,  | outbox | → AuditService |     |
| --- | --------------- | ------ | -------------- | --- |
archive records
after retention
ProvisionTenant Create tenant,  Single  TenantFactory  Self-service or
| UseCase | seed admin +     | transaction with  | →              | admin-triggered |
| ------- | ---------------- | ----------------- | -------------- | --------------- |
|         | roles + config,  | outbox            | TenantReposito |                 |
|         | dispatch         |                   | ry →           |                 |
|         | welcome          |                   | RoleFactory →  |                 |
NotificationServ
ice
| SuspendTenant | Mark  | Single  | TenantReposito | Reversible  |
| ------------- | ----- | ------- | -------------- | ----------- |
UseCase suspended,  transaction with  ry →  within retention
|     | block API         | outbox | AuditService →   | window |
| --- | ----------------- | ------ | ---------------- | ------ |
|     | access, preserve  |        | NotificationServ |        |
|     | data per DPDP     |        | ice              |        |
67

PreOne DDD v1.0  |  Architecture Freeze
17. Domain Policies
Domain Policies  हा(cid:9)  Cross-Aggregate Rules  आहा(cid:9)तो जो(cid:9)  specific point  वर  enforce  हा(cid:13)तो(cid:2)तो.
Specification आणि(cid:21) Policy मधी ला difference: Specification pure predicate आहा(cid:9) (returns bool);
Policy enforcement point सा(cid:13)बोतो tied आहा(cid:9) — कधी  check हा(cid:13)तो(cid:9), क(cid:2)या happen करतो(cid:9) जोर fail हा(cid:13)तो(cid:9).
Policy specification ला(cid:2) wrap करूनी enforcement logic add करतो(cid:9).
PreOne मध्या(cid:9) 12 policies आहा(cid:9)तो जो(cid:9) cross-cutting business rules represent करतो(cid:2)तो. उदो(cid:2).: Age
Policy Admissions + Academics contexts मध्या (cid:9)apply हा(cid:13)तो(cid:13); Refund Policy Finance context मध्या;(cid:9)
Pickup Authorization Policy Transport context मध्या.(cid:9)
Policy enforcement points:
•  Pre-action validation — spec check before action; reject if fail.
•  Post-action trigger — event handler applies policy on event.
•  Scheduled job — daily/weekly policy enforcement (e.g., late fee).
•  Workflow guard — state transition blocked if policy fails.
17.1 Policy Catalog
| Policy | Scope | Rule | Enforcement | Notes |
| ------ | ----- | ---- | ----------- | ----- |
Age Policy Admissions +  Nursery 2.5– AgeValidationSe State-specific
|     | Academics | 3.5y, LKG 3.5–   | rvice +           | RTE alignment  |
| --- | --------- | ---------------- | ----------------- | -------------- |
|     |           | 4.5y, UKG 4.5–   | AgeEligibilitySpe | per tenant     |
|     |           | 5.5y, Playgroup  | cification        | config         |
1.8–2.5y as of
June 1
| Attendance  | Academics +  | ≥75%  | AttendanceEligi | Computed per  |
| ----------- | ------------ | ----- | --------------- | ------------- |
Policy Promotion attendance  bilitySpecificatio academic year
|     |     | required for  | n   |     |
| --- | --- | ------------- | --- | --- |
promotion;
medical leaves
excluded with
documentation
68

PreOne DDD v1.0  |  Architecture Freeze
| Policy     | Scope     | Rule           | Enforcement    | Notes          |
| ---------- | --------- | -------------- | -------------- | -------------- |
| Promotion  | Academics | Promotion      | PromotionSpeci | Evaluated at   |
| Policy     |           | requires: age  | fication       | year-end batch |
|            |           | eligibility +  | (composite)    |                |
attendance +
fee clearance +
milestone
achievement
Refund Policy Finance Refund within  RefundEligibility Capture in
|     |     | 90 days of       | Specification +  | TenantConfig |
| --- | --- | ---------------- | ---------------- | ------------ |
|     |     | payment; 2-tier  | ApprovalMatrix   |              |
|     |     | approval if >    | Specification    |              |
₹5,000;
processing fee
deducted per
tenant config
| Leave Policy | HR  | Annual leave    | LeavePolicyServi | Per tenant  |
| ------------ | --- | --------------- | ---------------- | ----------- |
|              |     | accrual; carry- | ce +             | config      |
|              |     | forward ≤15     | LeaveBalance     |             |
|              |     | days; no        | VO               |             |
negative
balance;
maternity per
statute
Late Fee Policy Finance Grace period 7  LateFeePolicySe Per tenant
|     |     | days; late fee  | rvice +            | config |
| --- | --- | --------------- | ------------------ | ------ |
|     |     | flat ₹100/day   | LateFeeApplicab    |        |
|     |     | capped at       | ilitySpecification |        |
₹1,000 or 5% of
invoice
(whichever
lower)
Discount Policy Finance +  Sibling 10%,  DiscountEligibili Approval matrix
|     | Admissions | Staff 50%, Early- | tySpecification +  | for > 5%  |
| --- | ---------- | ----------------- | ------------------ | --------- |
|     |            | bird 5%,          | DiscountCapSpe     | discount  |
|     |            | Scholarship up    | cification         |           |
to 100% with
documentation;
total ≤25%
69

PreOne DDD v1.0  |  Architecture Freeze
| Policy | Scope | Rule | Enforcement | Notes |
| ------ | ----- | ---- | ----------- | ----- |
Pickup  Transport Only authorized  PickupAuthoriza Authorized
Authorization  guardians with  tionSpecificatio guardian list per
| Policy |     | OTP; OTP valid  | n   | student |
| ------ | --- | --------------- | --- | ------- |
10 min; one-
time use; max 3
attempts
Data Retention  Platform + All  Student records  ArchivalService  DPDP §4
| Policy | Contexts | 7 years after   | scheduled job +  | compliant |
| ------ | -------- | --------------- | ---------------- | --------- |
|        |          | archive; audit  | AuditService     |           |
|        |          | logs 7 years;   | retention        |           |
financial records
8 years per GST;
medical records
10 years
Notification  Communication Transactional:  TRAITimeWindo DLT template
| Policy |     | any time;      | wSpecification +  | IDs per tenant |
| ------ | --- | -------------- | ----------------- | -------------- |
|        |     | Marketing: 9   | NotificationOpt   |                |
|        |     | AM–8 PM only;  | OutSpecification  |                |
opt-out
honored within
24h
Concurrent Edit  Platform Optimistic  Repository  Prevents silent
| Policy |     | concurrency       | pattern           | overwrites |
| ------ | --- | ----------------- | ----------------- | ---------- |
|        |     | control via       | enforces version  |            |
|        |     | version field on  | check             |            |
aggregates;
conflict
resolution via
manual merge
UI
Cross-Tenant  Platform + All  All queries  TenantScope  Verified by
Isolation Policy Contexts scoped by  middleware +  automated test
|     |     | TenantId; cross- | Repository base  | suite |
| --- | --- | ---------------- | ---------------- | ----- |
|     |     | tenant reads     | class            |       |
forbidden at
ORM layer;
super-admin
exemption with
audit
70

PreOne DDD v1.0  |  Architecture Freeze
18. Anti-Corruption Layer
Anti-Corruption Layer (ACL) External Systems Integration सा(cid:2)ठी  isolation layer आहा(cid:9). PreOne
च्या(cid:2) domain model ला(cid:2) external systems च्या(cid:2) terminology, data shapes, आणि(cid:21) API quirks पु(cid:2)सानी?
isolate करतो(cid:13). ACL च(cid:2) purpose: domain pure ठी(cid:9)व(cid:21);(cid:9)  external changes contained.
ACL च (cid:9)key characteristics:
•  Adapter pattern — external SDK wrapped in adapter implementing domain
interface.
•  Translation — external DTO → domain event / aggregate.
•  Per-tenant configuration — each tenant can choose provider (Razorpay vs PayU).
•  Idempotency — external callbacks deduplicated via reference IDs.
•  Circuit breaker — if external system down, fail fast, don't cascade.
Examples of ACLs: PaymentGatewayACL (Razorpay/PayU), WhatsAppACL (Meta), SMSACL
(MSG91), EmailACL (SES), GPSACL (Google Maps), AILLMACL (OpenAI/Anthropic).
18.1 ACL Catalog
| ACL | External System | Translation | Isolation  | Notes |
| --- | --------------- | ----------- | ---------- | ----- |
Strategy
PaymentGatew Razorpay / PayU  Provider- Adapter  Idempotency
| ayACL | / Cashfree | specific        | pattern;         | keys per  |
| ----- | ---------- | --------------- | ---------------- | --------- |
|       |            | refund/capture  | provider config  | gateway   |
|       |            | responses →     | per tenant       |           |
PaymentReceiv
ed /
PaymentFailed
domain events
WhatsAppACL Meta WhatsApp  Message status  Webhook  Template pre-
|     | Business API | webhooks →       | signature      | approval per  |
| --- | ------------ | ---------------- | -------------- | ------------- |
|     |              | NotificationDeli | verification;  | Meta          |
|     |              | vered events;    | template sync  |               |
template
rendering via
provider
| SMSACL | MSG91 /          | DLT-compliant    | Adapter; DLT  | TRAI DLT      |
| ------ | ---------------- | ---------------- | ------------- | ------------- |
|        | Twilio / Kaleyra | SMS dispatch;    | template IDs  | registration  |
|        |                  | delivery reports | per tenant    | mandatory     |
71

PreOne DDD v1.0  |  Architecture Freeze
| ACL | External System | Translation | Isolation  | Notes |
| --- | --------------- | ----------- | ---------- | ----- |
Strategy
EmailACL SES / SendGrid /  Email dispatch +  Adapter;  SPF/DKIM/
|     | Postmark | bounce/complai | bounce         | DMARC           |
| --- | -------- | -------------- | -------------- | --------------- |
|     |          | nt webhooks    | handling       | configured per  |
|     |          |                | updates OptOut | tenant domain   |
GPSACL OpenStreetMap  Lat/Lng →  Adapter; rate- Fallback chain if
|     | / Google Maps /  | reverse         | limited | primary fails |
| --- | ---------------- | --------------- | ------- | ------------- |
|     | MapMyIndia       | geocode; route  |         |               |
polyline → ETA
GSTNACL GST Network  Invoice data →  Adapter; auth  Monthly filing
|     | API | GSTR-1/3B e- | via GST          | automation |
| --- | --- | ------------ | ---------------- | ---------- |
|     |     | filing       | credentials per  |            |
tenant
| AadhaarACL   | UIDAI      | Aadhaar         | Adapter;       | Stored masked;  |
| ------------ | ---------- | --------------- | -------------- | --------------- |
|              |            | verification    | consent flow   | full access     |
|              |            | (masking        | mandatory per  | audit-logged    |
|              |            | supported)      | DPDP           |                 |
| BiometricACL | SecuGen /  | Fingerprint     | Device SDK     | Templates       |
|              | Mantra /   | capture → user  | wrapper; ISO   | stored per      |
|              | Suprema    | identity match  | templates      | device;         |
revocable
| AILLMACL | OpenAI /          | Prompt →          | Gateway; per- | PII redaction  |
| -------- | ----------------- | ----------------- | ------------- | -------------- |
|          | Anthropic / Z.ai  | response; safety  | tenant quota  | pre-prompt     |
|          | GLM               | filter pass;      |               |                |
cost+latency
logged
GovernmentEdu Maharashtra  Curriculum  Adapter;  Used for NEP
cationACL SCERT / NCERT  standards →  periodic sync 2020 alignment
|     | APIs | CurriculumPlan  |     |     |
| --- | ---- | --------------- | --- | --- |
sync
19. Integration Events
Integration Events हा(cid:9) cross-context communication च(cid:2) mechanism आहा(cid:9). Domain events
(Section 13) आणि(cid:21) Integration events मधी ला difference: Domain events same-context internal
आहा(cid:9)तो; Integration events versioned, published contracts आहा(cid:9)तो जो(cid:9) cross-context (or cross-
service) flow करतो(cid:2)तो.
72

PreOne DDD v1.0  |  Architecture Freeze
PreOne मध्या (cid:9)integration events Kafka topics मध्या (cid:9)publish हा(cid:13)तो(cid:2)तो. Schema Registry द्वा(cid:2)र(cid:2) schemas
enforce क(cid:9) ला (cid:9)जो(cid:2)तो(cid:2)तो — breaking change (e.g., field rename) requires new version. Consumers
must handle unknown fields gracefully (forward compatibility).
Examples:   PaymentSuccessful,   SMSDelivered,   EmailSent,   NotificationDelivered,
GPSUpdated.
19.1 Integration Event Catalog
| Event | Schema | Contract Type | Versioning  | Notes |
| ----- | ------ | ------------- | ----------- | ----- |
Strategy
PaymentSucces {paymentId,  Versioned via  v1 → v2 adds  Consumed by
sful invoiceId,  schema registry;  field; consumers  Finance,
|     | amount,    | Avro/JSON | must handle    | Notification,  |
| --- | ---------- | --------- | -------------- | -------------- |
|     | currency,  |           | unknown fields | Reports        |
|     | gateway,   |           |                | contexts       |
occurredAt}
| PaymentFailed | {paymentId,  | Versioned | v1 stable | Consumed by       |
| ------------- | ------------ | --------- | --------- | ----------------- |
|               | invoiceId,   |           |           | Notification for  |
|               | reason,      |           |           | retry prompt      |
occurredAt}
| SMSDelivered | {notificationId,  | Versioned | v1 stable | Updates          |
| ------------ | ----------------- | --------- | --------- | ---------------- |
|              | providerMessag    |           |           | Notification     |
|              | eId,              |           |           | delivery receipt |
deliveredAt}
| EmailSent     | {notificationId,  | Versioned | v1 stable | Updates          |
| ------------- | ----------------- | --------- | --------- | ---------------- |
|               | providerMessag    |           |           | Notification     |
|               | eId, sentAt}      |           |           | delivery receipt |
| WhatsAppDeliv | {notificationId,  | Versioned | v1 stable | Updates          |
| ered          | providerMessag    |           |           | Notification     |
|               | eId,              |           |           | delivery receipt |
deliveredAt}
NotificationDeli {notificationId,  Versioned v1 stable Cross-channel
| vered | channel,     |     |     | delivery     |
| ----- | ------------ | --- | --- | ------------ |
|       | deliveredAt} |     |     | confirmation |
GPSUpdated {tripId, lat, lng,  Stream (Kafka  Schema registry  High-frequency
|     | speed, heading,  | topic) | enforced | stream; 30s  |
| --- | ---------------- | ------ | -------- | ------------ |
|     | timestamp}       |        |          | snapshots    |
persisted
73

PreOne DDD v1.0  |  Architecture Freeze
| Event | Schema | Contract Type | Versioning  | Notes |
| ----- | ------ | ------------- | ----------- | ----- |
Strategy
InvoiceIssued {invoiceId,  Versioned v1 → v2 adds  Consumed by
|     | studentId, total,  |     | taxBreakup | Reports +  |
| --- | ------------------ | --- | ---------- | ---------- |
|     | dueDate,           |     |            | parent app |
issuedAt}
| StudentEnrolled | {studentId,   | Versioned | v1 stable | Triggers       |
| --------------- | ------------- | --------- | --------- | -------------- |
|                 | branchId,     |           |           | downstream     |
|                 | programId,    |           |           | context        |
|                 | academicYear} |           |           | initialization |
TenantProvision {tenantId,  Versioned v1 stable Triggers default
| ed  | name, plan,  |     |     | config seeding |
| --- | ------------ | --- | --- | -------------- |
adminUserId,
provisionedAt}
AuditLogAppen {auditLogId,  Stream (Kafka  Schema registry  Streamed to
| ded | tenantId, actor,  | topic) | enforced | SIEM for   |
| --- | ----------------- | ------ | -------- | ---------- |
|     | action,           |        |          | security   |
|     | resource,         |        |          | monitoring |
timestamp}
PayrollDisburse {payslipId,  Versioned v1 stable Triggers GL
| d   | staffId, netPay,  |     |     | posting +        |
| --- | ----------------- | --- | --- | ---------------- |
|     | payPeriod,        |     |     | payslip delivery |
disbursedAt}
20. Domain Workflows
Domain Workflows हा (cid:9)aggregate च्या(cid:2) lifecycle मधी ला state machines आहा(cid:9)तो. पु*त्याक(cid:9)  workflow मध्या (cid:9)
states, transitions,  आणि(cid:21)  guards defined  आहा(cid:9)तो. State transitions audit-logged  आहा(cid:9)तो;
reversions allowed with reason.
Workflow design principles:
•  States are nouns — Draft, Submitted, Approved.
•  Transitions are verbs — submit, approve, reject, cancel.
•  Guards are specifications — transition blocked if spec fails.
•  Each transition emits a domain event.
•  Reversions explicit — 'reopen' transition with reason; audit-logged.
74

PreOne DDD v1.0 | Architecture Freeze
20.1 Workflow Catalog
20.2 Admission Workflow
States: Lead → Enquiry → Counselling → Application → Documents → Approval → Fee →
Student
Transitions:
• Lead → Enquiry: qualified
• Enquiry → Counselling: scheduled
• Counselling → Application: applied
• Application → Documents: form submitted
• Documents → Approval: verified
• Approval → Fee: approved
• Approval → Application: rejected (with reason)
• Fee → Student: payment received
Guards:
• AgeEligibilitySpecification at Approval
• DocumentCompleteSpecification at Documents → Approval
• FeePlanSelection at Fee
Notes: Each transition emits a domain event; reversions allowed for correction with audit
20.3 Invoice Lifecycle Workflow
States: Draft → Issued → PartiallyPaid → Paid → Overdue → WrittenOff → Refunded
Transitions:
• Draft → Issued: finalized
• Issued → PartiallyPaid: partial payment
• Issued → Paid: full payment
• PartiallyPaid → Paid: balance cleared
• Issued → Overdue: past grace
• Overdue → Paid: payment received
75

PreOne DDD v1.0 | Architecture Freeze
• Paid → Refunded: refund processed
• Overdue → WrittenOff: 2-tier approval
Guards:
• LateFeeApplicabilitySpecification at Issued → Overdue
• RefundEligibilitySpecification at Paid → Refunded
Notes: GST invoice number assigned at Draft → Issued; immutable after
20.4 Attendance Workflow
States: Open → Marked → Submitted → Adjusted
Transitions:
• Open → Marked: teacher marks records
• Marked → Submitted: sheet finalized
• Submitted → Adjusted: correction via AdjustmentRecord
Guards:
• AttendancePolicyService validation at Marked → Submitted
• No future dates
Notes: Adjustment creates new record referencing original; original immutable
20.5 Observation Workflow
States: Draft → Published → Edited → Archived
Transitions:
• Draft → Published: teacher publishes
• Published → Edited: edited within 24h
• Published → Archived: archived after 1 year
• Edited → Archived: archived after 1 year
Guards:
• Edit window 24h from Published
76

PreOne DDD v1.0 | Architecture Freeze
• AiDraft flag cleared when teacher reviews
Notes: AI-assisted drafts flow through same workflow with provenance flag
20.6 Refund Workflow
States: Requested → Approved → Rejected → Issued → Failed
Transitions:
• Requested → Approved: 1st-tier approver
• Approved → Issued: 2nd-tier (if > threshold) + gateway execution
• Requested → Rejected: approver decline
• Issued → Failed: gateway failure
• Failed → Requested: re-queue with reason
Guards:
• RefundEligibilitySpecification at Requested
• ApprovalMatrixSpecification at Approved → Issued
Notes: Failed refunds re-queued; manual intervention after 3 retries
20.7 Purchase Order Workflow
States: Draft → PendingApproval → Approved → Dispatched → PartiallyReceived →
Received → Closed → Cancelled
Transitions:
• Draft → PendingApproval: submitted
• PendingApproval → Approved: approver
• PendingApproval → Draft: returned for edit
• Approved → Dispatched: vendor confirmation
• Dispatched → PartiallyReceived: partial GRN
• PartiallyReceived → Received: full GRN
• Received → Closed: reconciled
• Approved → Cancelled: cancelled with reason
77

PreOne DDD v1.0 | Architecture Freeze
Guards:
• ApprovalMatrixSpecification at PendingApproval → Approved
• GRN quantity ≤ approved quantity
Notes: Sequential PO number per tenant per FY
20.8 Transport Trip Workflow
States: Scheduled → Started → InProgress → Completed → Cancelled → Deviation
Transitions:
• Scheduled → Started: driver starts
• Started → InProgress: first stop reached
• InProgress → Deviation: route deviation detected
• Deviation → InProgress: route resumed
• InProgress → Completed: last stop done
• Scheduled → Cancelled: cancelled
• Started → Cancelled: emergency cancel
Guards:
• PickupAuthorizationSpecification at each pickup
• Driver + Vehicle assigned at Scheduled → Started
Notes: GPS stream drives transitions; auto-detection
20.9 Tenant Lifecycle Workflow
States: Trial → Active → Suspended → Offboarded → Archived
Transitions:
• Trial → Active: subscription converted
• Trial → Offboarded: trial ended without conversion
• Active → Suspended: payment failure / violation
• Suspended → Active: issue resolved
78

PreOne DDD v1.0  |  Architecture Freeze
•  Suspended → Offboarded: retention window expired
•  Offboarded → Archived: data purge complete (per DPDP)
Guards:
•  DPDP retention period before Offboarded → Archived
•  Super-admin approval for Active → Suspended
Notes: Archived data purge is irreversible; pre-purge backup mandatory
21. Mapping to PRD
पु*त्याक(cid:9)
 PRD Requirement च  Domain Model शी  Mapping. हा  mapping traceability दोतो(cid:9) (cid:9) —
functional requirement च(cid:2) implementation क(cid:13)(cid:21)त्या(cid:2) aggregate, service, आणि(cid:21) context मध्या (cid:9)आहा(cid:9)
तो(cid:9) clear हा(cid:13)तो(cid:9). नीव नी FR add करतो(cid:2)नी(cid:2) या(cid:2) table मध्या (cid:9)entry add कर(cid:2)व  ला(cid:2)गोला(cid:9) .
Mapping च(cid:2) pattern:
FR-XXX (Functional Requirement)
    ↓
Bounded Context (which context owns)
    ↓
Aggregate (which aggregate root)
    ↓
Application Service / Use Case (orchestration)
21.1 FR → Domain Element Mapping
| FR ID + Title   | Context   | Aggregate | Service     | Notes     |
| --------------- | --------- | --------- | ----------- | --------- |
| FR-001          | Platform  | User      | AuthService | JWT + MFA |
| Authentication  | Context   |           |             |           |
& Login
| FR-002 Lead  | CRM/       | Lead        | CreateAdmissio  | Multi-channel |
| ------------ | ---------- | ----------- | --------------- | ------------- |
| Capture      | Admissions |             | nUseCase        |               |
| FR-003       | Admissions | Application | SubmitApplicati | Document      |
| Application  |            |             | onUseCase       | upload        |
Submission
FR-004 Eligibility  Admissions Admission AdmissionEligibi Age +
| Check |     |     | lityService | documents |
| ----- | --- | --- | ----------- | --------- |
79

PreOne DDD v1.0  |  Architecture Freeze
| FR ID + Title | Context    | Aggregate | Service        | Notes         |
| ------------- | ---------- | --------- | -------------- | ------------- |
| FR-005        | Admissions | Admission | ApproveAdmissi | 2-tier matrix |
| Admission     |            |           | onUseCase      |               |
Approval
| FR-006 Student  | Student | Student | StudentFactory | Post-approval |
| --------------- | ------- | ------- | -------------- | ------------- |
Master
| FR-007     | Student | Student | ClassroomAssig | Per academic  |
| ---------- | ------- | ------- | -------------- | ------------- |
| Classroom  |         |         | nmentService   | year          |
Assignment
| FR-008    | Student | Student | PromoteStuden | Year-end batch |
| --------- | ------- | ------- | ------------- | -------------- |
| Promotion |         |         | tUseCase      |                |
FR-009 Daily  Attendance AttendanceShee MarkAttendanc Per classroom
| Attendance  |            | t              | eUseCase       | per day     |
| ----------- | ---------- | -------------- | -------------- | ----------- |
| FR-010      | Attendance | AttendanceShee | AdjustAttendan | Adjustment  |
| Attendance  |            | t              | ceUseCase      | record      |
Correction
| FR-011       | Academics | Observation | ShareObservati | AI-assisted |
| ------------ | --------- | ----------- | -------------- | ----------- |
| Observation  |           |             | onUseCase      |             |
Create
| FR-012     | Academics | ReportCard | MilestoneServic | Per period |
| ---------- | --------- | ---------- | --------------- | ---------- |
| Milestone  |           |            | e               |            |
Tracking
FR-013 Report  Academics ReportCard PublishReportC Principal sign-
| Card Generation  |         |         | ardUseCase     | off         |
| ---------------- | ------- | ------- | -------------- | ----------- |
| FR-014 Fee Plan  | Finance | FeePlan | FeePlanFactory | Per program |
Setup
FR-015 Invoice  Finance Invoice GenerateInvoice Batch at period
| Generation      |         |         | UseCase        | start         |
| --------------- | ------- | ------- | -------------- | ------------- |
| FR-016 Payment  | Finance | Payment | CollectPayment | Multi-gateway |
| Collection      |         |         | UseCase        |               |
| FR-017 Receipt  | Finance | Receipt | ReceiptFactory | Sequential    |
Generation
| FR-018 Late Fee  | Finance | Invoice | ApplyLateFeesU | Daily 9 AM |
| ---------------- | ------- | ------- | -------------- | ---------- |
| Application      |         |         | seCase         |            |
80

PreOne DDD v1.0  |  Architecture Freeze
| FR ID + Title   | Context   | Aggregate     | Service          | Notes           |
| --------------- | --------- | ------------- | ---------------- | --------------- |
| FR-019 Refund   | Finance   | Refund        | ProcessRefundU   | 2-tier approval |
| Processing      |           |               | seCase           |                 |
| FR-020 GST      | Finance   | Invoice       | GSTFilingService | Monthly         |
| Filing          |           |               |                  | GSTR-1/3B       |
| FR-021 Staff    | HR        | Staff         | OnboardStaffUs   | Role assignment |
| Onboarding      |           |               | eCase            |                 |
| FR-022 Payroll  | HR        | Payslip       | RunPayrollUseC   | Monthly batch   |
| Run             |           |               | ase              |                 |
| FR-023 Leave    | HR        | LeaveRequest  | ApplyLeaveUse    | Balance update  |
| Application     |           |               | Case             |                 |
| FR-024          | Inventory | InventoryItem | InventoryItemF   | SKU + reorder   |
| Inventory       |           |               | actory           |                 |
Master
FR-025  Inventory PurchaseOrder CreatePurchase 2-tier if > ₹50k
| Purchase Order |           |               | OrderUseCase  |                |
| -------------- | --------- | ------------- | ------------- | -------------- |
| FR-026 GRN     | Inventory | GoodsReceiptN | ReceiveGRNUse | Stock          |
| Receive        |           | ote           | Case          | movement       |
| FR-027 Stock   | Inventory | InventoryItem | ConsumeStockU | Per            |
| Consumption    |           |               | seCase        | classroom/bran |
ch
FR-028  Transport TransportRoute TransportRoute Per academic
| Transport Route  |     |     | Factory | year |
| ---------------- | --- | --- | ------- | ---- |
Setup
| FR-029 Live Trip  | Transport | Trip | StartTripUseCas | GPS stream |
| ----------------- | --------- | ---- | --------------- | ---------- |
| Tracking          |           |      | e               |            |
| FR-030 Pickup     | Transport | Trip | RecordPickupUs  | OTP-based  |
| Authorization     |           |      | eCase           |            |
FR-031 Parent  Communication Notification SendNotificatio Multi-channel
| Notification |               |           | nUseCase       |          |
| ------------ | ------------- | --------- | -------------- | -------- |
| FR-032       | Communication | Broadcast | SendBroadcastU | Chunked  |
| Broadcast    |               |           | seCase         | dispatch |
FR-033 1:1 Chat Communication Conversation SendMessageUs Staff-parent
|     |     |     | eCase | thread |
| --- | --- | --- | ----- | ------ |
81

PreOne DDD v1.0  |  Architecture Freeze
| FR ID + Title | Context  | Aggregate | Service      | Notes       |
| ------------- | -------- | --------- | ------------ | ----------- |
| FR-034 Audit  | Platform | AuditLog  | AuditService | Append-only |
Log
| FR-035 Tenant  | Platform | Tenant | ProvisionTenant | Self-service |
| -------------- | -------- | ------ | --------------- | ------------ |
| Provisioning   |          |        | UseCase         |              |
हा  mapping PRD section of every FR ला(cid:2) back-reference दोतो(cid:9) (cid:9). PRD document मध्या(cid:9) पु*त्याक(cid:9)  FR च(cid:2)
'Domain Reference' field या(cid:2) table च्या(cid:2) corresponding row ला(cid:2) point करतो(cid:13). दो(cid:13)न्हा  documents
एकम(cid:9)क(cid:2)शी(cid:29)   synced आहा(cid:9)तो.
22. Mapping to BRC
Business Rules Domain मध्या(cid:9) कशी(cid:2) ला(cid:2)गो? हा(cid:13)तो(cid:2)तो. BRC (Business Rules Catalog) च्या(cid:2) पु*त्याक(cid:9)  rule च(cid:2)
implementation domain element (specification, policy, invariant) शी  mapping या(cid:2) section मध्या (cid:9)
आहा(cid:9). हा  mapping enforcement traceability दोतो(cid:9)  (cid:9)— क(cid:13)(cid:21)तो(cid:2) rule क(cid:13)(cid:21)त्या(cid:2) code location वर enforce
हा(cid:13)तो(cid:13).
Mapping च(cid:2) pattern:
R-XXX-YYY (BRC Rule ID)
    ↓
Domain Element (Specification / Policy / Invariant)
    ↓
Bounded Context (where enforced)
    ↓
Test Cases (verify enforcement)
22.1 BRC Rule → Domain Element Mapping
| Rule | Domain Element | Context |     | Notes |
| ---- | -------------- | ------- | --- | ----- |
R-ELG-001 Age  AgeEligibilitySpecific Admissions Nursery 2.5-3.5y, etc.
| eligibility per  | ation |     |     |     |
| ---------------- | ----- | --- | --- | --- |
program
R-ELG-004 Document  DocumentCompleteS Admissions Birth cert, photo,
| checklist mandatory    | pecification       |            |     | parent ID, medical |
| ---------------------- | ------------------ | ---------- | --- | ------------------ |
| R-ADM-006              | Application Entity | Admissions |     | Submitted →        |
| Application form lock  |                    |            |     | UnderReview        |
| after submit           |                    |            |     | transition         |
R-ADM-012 Approval  ApprovalMatrixSpeci Admissions 2-tier if waiver > 5%
| matrix by fee waiver | fication |     |     |     |
| -------------------- | -------- | --- | --- | --- |
82

PreOne DDD v1.0  |  Architecture Freeze
| Rule           | Domain Element     | Context | Notes         |
| -------------- | ------------------ | ------- | ------------- |
| R-STD-001 One  | Student Aggregate  | Student | Validated at  |
| classroom per  | invariant          |         | assignment    |
student per year
| R-STD-008  | PromotionService | Student | Batch at year-end |
| ---------- | ---------------- | ------- | ----------------- |
Promotion only at
year boundary
R-STD-014 Archive  Data Retention  Platform + Student Scheduled archival
| after 7 years per  | Policy |     | job |
| ------------------ | ------ | --- | --- |
DPDP
| R-ACD-003         | Observation         | Academics | Corrections via new  |
| ----------------- | ------------------- | --------- | -------------------- |
| Observation edit  | Aggregate invariant |           | observation          |
window 24h
R-ACD-007 AI draft  Observation.aiDraft  Academics Cleared on teacher
| provenance flag      | field               |           | review           |
| -------------------- | ------------------- | --------- | ---------------- |
| R-ACD-012 Report     | ReportCard          | Academics | Pre-publish gate |
| card principal sign- | Aggregate invariant |           |                  |
off
R-OPS-006 Pickup  PickupAuthorizationS Transport 10-min validity, one-
| OTP authorization | pecification |     | time |
| ----------------- | ------------ | --- | ---- |
R-OPS-009 Speed  GPSACL + Alert  Transport Driver + parent alert
| alert >60 km/h | Service |     |     |
| -------------- | ------- | --- | --- |
R-OPS-012 Route  RouteDeviationDetec Transport Auto-alert trigger
| deviation >500m    | ted event         |         |                 |
| ------------------ | ----------------- | ------- | --------------- |
| R-FIN-001 GST-     | InvoiceFactory +  | Finance | Sequential per  |
| compliant invoice  | InvoiceRepository |         | tenant per FY   |
numbering
R-FIN-005 Late fee  LateFeePolicyService  Finance Daily 9 AM job
| grace period 7 days | +   |     |     |
| ------------------- | --- | --- | --- |
LateFeeApplicabilityS
pecification
| R-FIN-008 Refund  | RefundEligibilitySpeci | Finance | Window      |
| ----------------- | ---------------------- | ------- | ----------- |
| 90-day window     | fication               |         | enforcement |
R-FIN-012 Refund 2- ApprovalMatrixSpeci Finance Threshold per tenant
| tier approval >₹5k | fication |     |     |
| ------------------ | -------- | --- | --- |
83

PreOne DDD v1.0  |  Architecture Freeze
| Rule               | Domain Element   | Context | Notes       |
| ------------------ | ---------------- | ------- | ----------- |
| R-FIN-018 Monthly  | GSTFilingService | Finance | GSTR-1 + 3B |
GST filing
R-FIN-022 Discount  DiscountCapSpecifica Finance Prevents stacking
| cap 25% | tion |     |     |
| ------- | ---- | --- | --- |
R-HR-001 PF + ESI  PayrollCalculationSer HR Auto-compute per
| per statute | vice |     | statute |
| ----------- | ---- | --- | ------- |
R-HR-006 Leave  LeavePolicyService +  HR Carry-forward cap 15
| accrual monthly   | LeaveBalance VO    |     | days             |
| ----------------- | ------------------ | --- | ---------------- |
| R-HR-010 Payroll  | Payslip Aggregate  | HR  | Corrections via  |
| lock after        | invariant          |     | supplementary    |
disbursement
R-HR-012 POSH  Compliance Module HR + Platform Tracked per staff
training annual
R-INV-001 FIFO  StockValuationServic Inventory Per tenant override
| valuation default | e   |     |     |
| ----------------- | --- | --- | --- |
R-INV-006 PO 2-tier  ApprovalMatrixSpeci Inventory Threshold config
| approval >₹50k   | fication    |           |                       |
| ---------------- | ----------- | --------- | --------------------- |
| R-INV-010 Stock  | StockCount  | Inventory | Adjustment via stock  |
| count quarterly  | Workflow    |           | movement              |
R-COM-002 No  TRAITimeWindowSp Communication Transactional bypass
| marketing post 8 PM | ecification |     |     |
| ------------------- | ----------- | --- | --- |
R-COM-005 Opt-out  NotificationOptOutS Communication Transactional bypass
| honored 24h         | pecification     |               |                     |
| ------------------- | ---------------- | ------------- | ------------------- |
| R-COM-009           | Template VO +    | Communication | Locked at           |
| Template versioning | MessageTemplate  |               | notification create |
aggregate
R-PLT-001 JWT 15- AuthService + JWT  Platform Refresh rotation
| min rotation     | VO               |          |                |
| ---------------- | ---------------- | -------- | -------------- |
| R-PLT-004 MFA    | MFAFactor VO +   | Platform | TOTP/SMS/Email |
| mandatory admin  | RBACService      |          |                |
| R-PLT-008 Cross- | Cross-Tenant     | Platform | ORM layer      |
| tenant read      | Isolation Policy |          | enforcement    |
forbidden
84

PreOne DDD v1.0  |  Architecture Freeze
| Rule | Domain Element | Context | Notes |
| ---- | -------------- | ------- | ----- |
R-PLT-012 API key  APIKey entity +  Platform Auto-expiry + alert
| rotation 90-day  | scheduled job       |          |               |
| ---------------- | ------------------- | -------- | ------------- |
| R-DG-001 PII     | AuditService + PII  | Platform | Unmask needs  |
| masking in audit | mask rules          |          | permission    |
| R-DG-007 7-year  | Data Retention      | Platform | Append-only;  |
| audit retention  | Policy +            |          | immutable     |
AuditLogRepository
हा  mapping BRC document च्या(cid:2) पु*त्याक(cid:9)  rule च्या(cid:2) 'Implementation' field ला(cid:2) fill करतो(cid:9). जो(cid:9)व्हा(cid:2) rule
change हा(cid:13)तो(cid:13) तो(cid:9)व्हा(cid:2) corresponding specification/policy update कर(cid:2)व(cid:2) ला(cid:2)गोतो(cid:13) — दो(cid:13)न्हा  documents
एकम(cid:9)क(cid:2)शी(cid:29)   synced आहा(cid:9)तो. PR review मध्या (cid:9)verify क(cid:9) ला (cid:9)जो(cid:2)तो (cid:9)क  rule change सा(cid:13)बोतो spec update PR मध्या (cid:9)
आहा(cid:9).
23. Mapping to ADR
Architecture Decisions शी  Mapping. ADR (Architecture Decision Records) document series च (cid:9)
पु*त्याक(cid:9)  record च(cid:2) impact क(cid:13)(cid:21)त्या(cid:2) domain element वर पुडतो(cid:13) तो(cid:9) या(cid:2) section मध्या(cid:9) document आहा(cid:9). हा
mapping architectural consistency दोतो(cid:9) (cid:9) — जो(cid:9)व्हा(cid:2) ADR update हा(cid:13)तो(cid:13) तो(cid:9)व्हा(cid:2) corresponding domain
elements review कर(cid:2)व(cid:9) ला(cid:2)गोतो(cid:2)तो.
PreOne मध्या (cid:9)ADRs architecture decisions document करतो(cid:2)तो: technology choices (PostgreSQL,
Kafka, NestJS), patterns (Outbox, CQRS), boundaries (Bounded Context splits). पु*त्याक(cid:9)  ADR च(cid:2)
status (Proposed, Accepted, Deprecated, Superseded) tracked आहा(cid:9).
23.1 ADR → Domain Element Mapping
| ADR | Domain Element | Context | Notes |
| --- | -------------- | ------- | ----- |
ADR-001 Multi- Tenant Aggregate +  Platform Row-level isolation
| tenant from day 1 | TenantScope  |     | via TenantId |
| ----------------- | ------------ | --- | ------------ |
middleware
ADR-004 PostgreSQL  All Repositories +  Platform JSONB for VOs;
| as primary RDBMS | Prisma client |     | partitioning for  |
| ---------------- | ------------- | --- | ----------------- |
AuditLog
| ADR-007 Outbox     | All Application  | All | Same-txn outbox +    |
| ------------------ | ---------------- | --- | -------------------- |
| pattern for events | Services         |     | async relay to Kafka |
85

PreOne DDD v1.0  |  Architecture Freeze
| ADR | Domain Element | Context | Notes |
| --- | -------------- | ------- | ----- |
ADR-012 Identity  Platform Context  Platform Owns identity; other
| Context separation | (User, Role,  |     | contexts reference |
| ------------------ | ------------- | --- | ------------------ |
Permission)
ADR-018 Kafka for  Integration Events +  All Schema registry
| event streaming | GPSUpdated stream |     | enforced |
| --------------- | ----------------- | --- | -------- |
ADR-023 NestJS as  Module structure per  All One NestJS module
| backend framework | Bounded Context |     | per context |
| ----------------- | --------------- | --- | ----------- |
ADR-028 Prisma as  All Repositories All Type-safe; migration-
| ORM |     |     | managed |
| --- | --- | --- | ------- |
ADR-033 Redis for  Cache layer in  Platform TTL per entity type
| caching + rate limit | Repositories + Rate  |     |     |
| -------------------- | -------------------- | --- | --- |
limit in API gateway
ADR-038 Universal  Platform Context +  Platform Single user identity
| User Context | User entity |     | across contexts |
| ------------ | ----------- | --- | --------------- |
ADR-042 CQRS for  Reports Context read  Reports Read-optimized
| Reports | models |     | projections; no  |
| ------- | ------ | --- | ---------------- |
aggregates
ADR-047 AI Gateway  AIGatewayService +  Platform Per-tenant quota +
| centralized | AILLMACL |     | cost tracking |
| ----------- | -------- | --- | ------------- |
ADR-053 Event  AuditLog Aggregate  Platform Replayable for SIEM
| sourcing for AuditLog | (append-only) +  |     |     |
| --------------------- | ---------------- | --- | --- |
Kafka topic
हा  mapping ADR document च्या(cid:2) पु*त्याक(cid:9)  record च्या(cid:2) 'Impact' field ला(cid:2) fill करतो(cid:9). ADR change हा(cid:13)तो(cid:2)नी(cid:2)
affected domain elements identify हा(cid:13)तो(cid:2)तो आणि(cid:21) review queue मध्या(cid:9) add हा(cid:13)तो(cid:2)तो. उदो(cid:2).: ADR-018
(Kafka) deprecated क(cid:9) ला(cid:2) तोर सावB integration events re-evaluate कर(cid:2)व(cid:9) ला(cid:2)गोतो ला.
24. Mapping to Database
DDD → Database. हा(cid:2) section aggregate च  physical schema शी  mapping दोतो(cid:9) (cid:9). PreOne च
database PostgreSQL  आहा(cid:9); Prisma ORM  व(cid:2)पुरूनी  migrations manage  क(cid:9) ला(cid:9) जो(cid:2)तो(cid:2)तो.  पु*त्याक(cid:9)
aggregate root च(cid:2) separate table (णिक(cid:29)व(cid:2) table group) आहा(cid:9); child entities separate tables मध्या (cid:9)
foreign key सा(cid:13)बोतो; value objects JSONB columns मध्या (cid:9)store हा(cid:13)तो(cid:2)तो.
Mapping च(cid:2) flow:
Aggregate
    ↓
86

PreOne DDD v1.0  |  Architecture Freeze
Table (or table group)
    ↓
Prisma Model (TypeScript type-safe)
    ↓
Migration (version-controlled SQL)
24.1 Aggregate → Table → Prisma → Migration
खा(cid:2)ला ला table सावB 25 aggregates च  database mapping दोतो(cid:9) (cid:9):
| Aggregate | Tables               | Prisma Models          | Migration         |
| --------- | -------------------- | ---------------------- | ----------------- |
| Admission | admissions,          | Admission,             | 20260101000000_cr |
|           | application_forms,   | ApplicationForm,       | eate_admissions   |
|           | counselling_sessions | CounsellingSession     |                   |
| Student   | students,            | Student,               | 20260101000001_cr |
|           | student_profiles,    | StudentProfile,        | eate_students     |
|           | classroom_assignme   | ClassroomAssignmen     |                   |
|           | nts, promotions,     | t, Promotion,          |                   |
|           | student_history      | StudentHistory         |                   |
| Invoice   | invoices,            | Invoice, InvoiceItem,  | 20260101000002_cr |
|           | invoice_items,       | Discount,              | eate_invoices     |
|           | discounts,           | TaxBreakup,            |                   |
|           | tax_breakups,        | Adjustment             |                   |
adjustments
Payment payments, receipts,  Payment, Receipt,  20260101000003_cr
|         | refunds        | Refund      | eate_payments     |
| ------- | -------------- | ----------- | ----------------- |
| FeePlan | fee_plans,     | FeePlan,    | 20260101000004_cr |
|         | fee_plan_items | FeePlanItem | eate_fee_plans    |
AttendanceSheet attendance_sheets,  AttendanceSheet,  20260101000005_cr
|             | attendance_records,  | AttendanceRecord,   | eate_attendance   |
| ----------- | -------------------- | ------------------- | ----------------- |
|             | attendance_adjustm   | AttendanceAdjustme  |                   |
|             | ents                 | nt                  |                   |
| Observation | observations,        | Observation,        | 20260101000006_cr |
|             | observation_attachm  | ObservationAttachm  | eate_observations |
|             | ents,                | ent,                |                   |
|             | observation_milesto  | ObservationMileston |                   |
|             | nes                  | e                   |                   |
| ReportCard  | report_cards,        | ReportCard,         | 20260101000007_cr |
|             | milestones, grades,  | Milestone, Grade,   | eate_report_cards |
|             | teacher_remarks      | TeacherRemark       |                   |
87

PreOne DDD v1.0  |  Architecture Freeze
| Aggregate | Tables | Prisma Models | Migration |
| --------- | ------ | ------------- | --------- |
CurriculumPlan curriculum_plans,  CurriculumPlan,  20260101000008_cr
|     | learning_outcomes,  | LearningOutcome,  | eate_curriculum |
| --- | ------------------- | ----------------- | --------------- |
|     | lesson_plans,       | LessonPlan,       |                 |
|     | milestones_catalog  | MilestoneCatalog  |                 |
Payslip payslips, earnings,  Payslip, Earning,  20260101000009_cr
|     | deductions,  | Deduction, TaxFiling | eate_payslips |
| --- | ------------ | -------------------- | ------------- |
tax_filings
Staff staff, staff_profiles,  Staff, StaffProfile,  20260101000010_cr
|     | designations,  | Designation,  | eate_staff |
| --- | -------------- | ------------- | ---------- |
|     | departments    | Department    |            |
LeaveRequest leave_requests,  LeaveRequest,  20260101000011_cr
|     | leave_balances,  | LeaveBalance,  | eate_leaves |
| --- | ---------------- | -------------- | ----------- |
|     | leave_approvals  | LeaveApproval  |             |
InventoryItem inventory_items,  InventoryItem,  20260101000012_cr
|     | stock_movements,   | StockMovement,   | eate_inventory |
| --- | ------------------ | ---------------- | -------------- |
|     | consumption_logs,  | ConsumptionLog,  |                |
|     | stock_counts       | StockCount       |                |
Aggregate → Table → Prisma Mapping (cont.)
| Aggregate | Tables | Prisma Models | Migration |
| --------- | ------ | ------------- | --------- |
PurchaseOrder purchase_orders,  PurchaseOrder,  20260101000013_cr
|     | po_items,    | POItem, POApproval | eate_purchase_orde |
| --- | ------------ | ------------------ | ------------------ |
|     | po_approvals |                    | rs                 |
GoodsReceiptNote grns, grn_items GRN, GRNItem 20260101000014_cr
eate_grns
| Vendor | vendors,         | Vendor,        | 20260101000015_cr |
| ------ | ---------------- | -------------- | ----------------- |
|        | vendor_ratings,  | VendorRating,  | eate_vendors      |
|        | vendor_documents | VendorDocument |                   |
TransportRoute transport_routes,  TransportRoute,  20260101000016_cr
|         | route_stops,        | RouteStop,         | eate_transport_rout |
| ------- | ------------------- | ------------------ | ------------------- |
|         | route_assignments   | RouteAssignment    | es                  |
| Vehicle | vehicles,           | Vehicle,           | 20260101000017_cr   |
|         | vehicle_maintenance | VehicleMaintenance | eate_vehicles       |
|         | _logs,              | Log,               |                     |
|         | vehicle_documents   | VehicleDocument    |                     |
88

PreOne DDD v1.0  |  Architecture Freeze
| Aggregate | Tables               | Prisma Models       | Migration         |
| --------- | -------------------- | ------------------- | ----------------- |
| Driver    | drivers,             | Driver,             | 20260101000018_cr |
|           | driver_documents,    | DriverDocument,     | eate_drivers      |
|           | driver_attendance    | DriverAttendance    |                   |
| Trip      | trips, trip_logs,    | Trip, TripLog,      | 20260101000019_cr |
|           | pickup_authorization | PickupAuthorization | eate_trips        |
s
Notification notifications,  Notification,  20260101000020_cr
|     | delivery_receipts | DeliveryReceipt | eate_notifications |
| --- | ----------------- | --------------- | ------------------ |
Conversation conversations,  Conversation,  20260101000021_cr
|     | conversation_messa | ConversationMessag | eate_conversations |
| --- | ------------------ | ------------------ | ------------------ |
|     | ges,               | e,                 |                    |
|     | message_read_recei | MessageReadReceipt |                    |
pts
| Broadcast | broadcasts,        | Broadcast,             | 20260101000022_cr |
| --------- | ------------------ | ---------------------- | ----------------- |
|           | broadcast_audience | BroadcastAudience      | eate_broadcasts   |
| Tenant    | tenants,           | Tenant, Subscription,  | 20260101000023_cr |
|           | subscriptions,     | TenantConfig,          | eate_tenants      |
|           | tenant_configs,    | FeatureFlag            |                   |
feature_flags
| AuditLog | audit_logs    | AuditLog | 20260101000024_cr |
| -------- | ------------- | -------- | ----------------- |
|          | (partitioned  |          | eate_audit_logs   |
monthly)
24.2 Schema Conventions
•  Table names: snake_case plural (students, invoices).
•  Column names: snake_case (created_at, tenant_id).
•  Primary keys: UUID v4 stored as uuid type.
•  Tenant isolation: tenant_id column on every table except tenants itself.
•  Timestamps: created_at + updated_at on every table.
•  Soft delete: deleted_at column where applicable (students, staff); never hard
delete.
•  Foreign keys: explicit constraints; ON DELETE RESTRICT by default.
•  Indexes: on tenant_id, foreign keys, frequent query columns; composite indexes for
common filters.
89

PreOne DDD v1.0 | Architecture Freeze
• JSONB: for value objects (address, money, tax_breakup).
• Partitioning: AuditLog partitioned monthly; TripLog partitioned monthly per trip.
25. Coding Guidelines
PreOne च्या(cid:2) backend code च(cid:9) guidelines. हा(cid:9) guidelines DDD principles enforce करतो(cid:2)तो आणि(cid:21)
code consistency साणि(cid:18)नीणि9चतो करतो(cid:2)तो. PR review मध्या (cid:9)या(cid:2) guidelines च verification mandatory आहा(cid:9).
25.1 Core Principles
खा(cid:2)ला ला principles PreOne च्या(cid:2) codebase च (cid:9)foundation आहा(cid:9)तो:
1. Rich Domain Model
Rule: All business logic lives in aggregates, entities, VOs, domain services, and
specifications. Application services orchestrate; controllers stay thin.
Example: Invoice aggregate computes totals, applies discounts, validates invariants — not
InvoiceService
Notes: Anemic domain model is an anti-pattern; reject in PR review
2. Thin Controllers
Rule: Controllers only: parse request, call application service, format response. No business
logic, no direct repository access.
Example: POST /invoices → InvoiceController.create() →
GenerateInvoiceUseCase.execute() → response
Notes: Single responsibility: HTTP transport
3. Fat Domain
Rule: Domain layer carries all rules; persistence layer is plumbing. If a rule lives in SQL or
controller, refactor to domain.
Example: Late fee computation in LateFeePolicyService, not in SQL trigger or
InvoiceController
Notes: Testability: domain rules testable without DB
90

PreOne DDD v1.0 | Architecture Freeze
4. No Business Logic in Controllers
Rule: Controllers cannot: compute totals, validate business rules, call external services
directly. They only translate HTTP ↔ application service.
Example: InvoiceController cannot compute GST — delegates to GenerateInvoiceUseCase
→ FeeCalculationService
Notes: Lint rule enforces controller line count
5. Repository Pattern
Rule: All persistence goes through Repository interfaces defined in domain layer.
Implementation in infrastructure layer. Domain layer has zero Prisma imports.
Example: StudentRepository interface in domain; PrismaStudentRepository in infra
Notes: Enables unit testing with in-memory repos
6. CQRS (where needed)
Rule: Reports and analytics use read models (projections) — not aggregates. Command side
uses aggregates + repositories. Query side uses optimized views.
Example: ReportsContext reads from denormalized views; FinanceContext commands go
through Invoice aggregate
Notes: Don't apply CQRS everywhere — only where read/write asymmetry demands
7. Domain Events for Cross-Context
Rule: Contexts communicate only via domain events. No direct service calls across contexts.
Events flow via outbox + Kafka.
Example: Admissions doesn't call Student.create() — it emits AdmissionApproved; Student
context subscribes
Notes: Decouples contexts; enables independent deployability
8. Naming Conventions
Rule: Aggregates: singular noun (Invoice). Entities: singular noun. VOs: singular noun.
Services: verb+Noun (FeeCalculationService). Specifications: adj+NounSpec
(AgeEligibilitySpecification). Factories: noun+Factory (StudentFactory). Use cases:
verb+NounUseCase (ApproveAdmissionUseCase).
91

PreOne DDD v1.0 | Architecture Freeze
Example: RefundService, LateFeePolicyService, AgeEligibilitySpecification
Notes: Consistency aids AI code generation
9. Immutability of VOs
Rule: Value objects are immutable. Updates create new instances. No setters on VOs.
Example: Address update → student.updateAddress(new Address(...)) — not
address.setCity(...)
Notes: Prevents side-effect bugs
10. Aggregate Boundary Discipline
Rule: References between aggregates are by ID only — never by object reference. Loading
another aggregate requires repository call.
Example: Invoice.studentId (UUID) — not Invoice.student (object)
Notes: Prevents lazy-loading N+1 + boundary violations
11. Transaction Boundary = Aggregate Boundary
Rule: One transaction modifies one aggregate. Cross-aggregate consistency via eventual
consistency (domain events).
Example: Payment success updates Payment aggregate + emits PaymentReceived; Invoice
update happens in separate txn subscribed to event
Notes: Outbox pattern ensures event delivery
12. NestJS Module per Bounded Context
Rule: One NestJS module per bounded context. Cross-module imports forbidden except via
Platform module (shared kernel).
Example: AdmissionsModule, FinanceModule, HRModule — each with its own controllers,
services, repos
Notes: Module boundaries enforce bounded context discipline
25.2 NestJS Module Structure
Each bounded context maps to one NestJS module. Within module:
admissions/
92

PreOne DDD v1.0 | Architecture Freeze
├─ controllers/ # HTTP layer
│ ├ admissions.controller.ts
│ └ dto/
│ ├ create-admission.dto.ts
│ └ approve-admission.dto.ts
├ usecases/ # Application layer
│ ├ create-admission.usecase.ts
│ └ approve-admission.usecase.ts
├ domain/ # Pure domain layer
│ ├ aggregates/
│ │ └ admission.aggregate.ts
│ ├ entities/
│ │ └ approval.entity.ts
│ ├ value-objects/
│ │ └ document.vo.ts
│ ├ services/
│ │ └ admission-eligibility.service.ts
│ ├ specifications/
│ │ └ age-eligibility.spec.ts
│ ├ factories/
│ │ └ admission.factory.ts
│ ├ events/
│ │ └ admission-approved.event.ts
│ ├ policies/
│ │ └ age.policy.ts
│ └ repositories/
│ └ admission.repository.ts (interface)
├ infrastructure/ # Infra layer
│ └ prisma-admission.repository.ts (impl)
└ admissions.module.ts
25.3 Code Style
• TypeScript strict mode mandatory.
• ESLint + Prettier enforced via CI.
• No any types; use unknown + type narrowing.
• No console.log in production code; use NestJS Logger.
• No direct Prisma imports in domain layer.
• All public methods documented with JSDoc.
• Tests co-located: admission.aggregate.test.ts next to admission.aggregate.ts.
93

PreOne DDD v1.0  |  Architecture Freeze
26. Testing Strategy
PreOne च  testing strategy pyramid structure follow करतो(cid:9). Bottom layer (most tests) unit
tests; middle integration tests; top E2E tests. Domain layer 100% unit test coverage
mandatory; application layer 90%; infrastructure layer 70%.
26.1 Test Pyramid
        /\
       /E2E\        (20 journeys)
      /------\
     /Contract \     (per event)
    /------------\
   / Integration \   (per context)
  /----------------\
 /     Unit        \ (100% domain)
/--------------------\
26.2 Test Layers
खा(cid:2)ला ला table सावB test layers च  scope, tools, coverage, आणि(cid:21) examples summarize करतो(cid:9):
| Layer | Scope | Tools | Coverage | Example |
| ----- | ----- | ----- | -------- | ------- |
Entity Tests Per entity —  Jest, in-memory  100% of entity  Student.promot
|     | lifecycle     | repos | methods | e() validates     |
| --- | ------------- | ----- | ------- | ----------------- |
|     | transitions,  |       |         | classroom +       |
|     | invariants,   |       |         | period; fails if  |
|     | equality      |       |         | already           |
promoted
Aggregate Tests Per aggregate  Jest, in-memory  100% of  Invoice.issue()
|     | — invariants,  | repos | aggregate roots  | validates draft  |
| --- | -------------- | ----- | ---------------- | ---------------- |
|     | transaction    |       | + invariants     | state, assigns   |
|     | boundaries,    |       |                  | number, emits    |
|     | event emission |       |                  | InvoiceGenerate  |
d
Domain Service  Per service —  Jest, mocks 100% of service  FeeCalculationS
| Tests | business logic  |     | methods | ervice with   |
| ----- | --------------- | --- | ------- | ------------- |
|       | with mocked     |     |         | mock FeePlan  |
|       | dependencies    |     |         | returns       |
expected
InvoiceDraft
94

PreOne DDD v1.0  |  Architecture Freeze
| Layer | Scope | Tools | Coverage | Example |
| ----- | ----- | ----- | -------- | ------- |
Specification  Per specification  Jest 100% of spec  AgeEligibilitySpe
| Tests | — isSatisfiedBy  |     | combinations | c: too young →  |
| ----- | ---------------- | --- | ------------ | --------------- |
|       | with various     |     |              | false; exactly  |
|       | inputs           |     |              | min → true;     |
max+1day →
false
| Factory Tests | Per factory —  | Jest | 100% of   | StudentFactory. |
| ------------- | -------------- | ---- | --------- | --------------- |
|               | creation,      |      | factories | create() with   |
|               | validation,    |      |           | missing parent  |
|               | invariant      |      |           | throws          |
enforcement
Repository Tests  Per repository  Jest,  100% of  StudentReposit
(Integration) — CRUD +  testcontainers  repository  ory.findById
|     | queries against  | (PostgreSQL) | methods | returns null for  |
| --- | ---------------- | ------------ | ------- | ----------------- |
|     | test DB          |              |         | unknown;          |
save+find
round-trip
Application  Per use case —  Jest, in-memory  100% of use  ApproveAdmissi
Service Tests orchestration,  repos, mock  case paths onUseCase:
|     | transaction,   | services |     | happy path +  |
| --- | -------------- | -------- | --- | ------------- |
|     | event emission |          |     | already-      |
approved +
eligibility-fail
API Contract  Per controller —  Supertest,  100% of  POST /invoices
| Tests | request/respons   | OpenAPI  | endpoints | with valid body  |
| ----- | ----------------- | -------- | --------- | ---------------- |
|       | e shapes, status  | schema   |           | → 201 +          |
|       | codes             |          |           | InvoiceDTO;      |
missing field →
400
Test Layers (cont.)
| Layer        | Scope          | Tools          | Coverage       | Example         |
| ------------ | -------------- | -------------- | -------------- | --------------- |
| Bounded      | Per context —  | Jest,          | Critical paths | Admissions:     |
| Context      | end-to-end     | testcontainers |                | lead → enquiry  |
| Integration  | within context |                |                | → application   |
| Tests        |                |                |                | → approval →    |
student created
95

PreOne DDD v1.0  |  Architecture Freeze
| Layer | Scope | Tools | Coverage | Example |
| ----- | ----- | ----- | -------- | ------- |
Cross-Context  Per integration  Pact, schema  100% of  AdmissionAppro
Contract Tests event —  registry integration  ved producer +
|     | producer +  |     | events | Student context  |
| --- | ----------- | --- | ------ | ---------------- |
|     | consumer    |     |        | consumer —       |
|     | contract    |     |        | schema match     |
End-to-End  Critical user  Playwright, test  Top 20 user  Parent
(E2E) Tests journeys across  environment journeys onboards child:
|     | contexts |     |     | lead →  |
| --- | -------- | --- | --- | ------- |
admission →
fee payment →
first day
attendance
Performance  Critical APIs +  k6, Artillery Top 50 APIs by  POST
| Tests | batch jobs |     | traffic | /payments:  |
| ----- | ---------- | --- | ------- | ----------- |
1000 RPS, P99
<400ms
Security Tests Auth, RBAC,  OWASP ZAP,  100% of  Tenant A user
|     | ACL, cross- | custom tests | endpoints | cannot read  |
| --- | ----------- | ------------ | --------- | ------------ |
|     | tenant      |              |           | Tenant B     |
invoice
Mutation Tests Critical domain  Stryker Domain services  Change > to ≥ in
|     | logic |     | + specifications | AgeEligibilitySpe |
| --- | ----- | --- | ---------------- | ----------------- |
c — tests must
fail
26.3 Testing Principles
•  Domain layer tests pure unit — no DB, no HTTP, no Kafka.
•  Test names: should_<expected>_when_<condition>.
•  One assert per test (preferred); logical grouping allowed.
•  Test data via builders (e.g., StudentBuilder.create()) — not raw literals.
•  Mock external dependencies; never real network calls in tests.
•  CI runs full suite on PR; nightly runs E2E + performance.
•  Coverage gate: PR blocked if domain layer coverage drops below 100%.
96

PreOne DDD v1.0 | Architecture Freeze
27. Glossary
सावB Domain Terms च अणिधीकKतो व्या(cid:2)ख्या(cid:2). हा(cid:2) glossary ubiquitous language च(cid:2) authoritative
reference आहा(cid:9). नीव नी terms introduce करतो(cid:2)नी(cid:2) या(cid:2) glossary मध्या (cid:9)entry add कर(cid:2)व ला(cid:2)गोला(cid:9) .
27.1 DDD Terms
Standard DDD vocabulary जो(cid:9) PreOne codebase मध्या (cid:9)व(cid:2)पुरला (cid:9)जो(cid:2)तो(cid:9):
Term Meaning
Aggregate Cluster of domain objects treated as a single
unit for data changes; defines transaction
boundary
Aggregate Root Entry point to an aggregate; only object
external references can hold; ensures
invariants
Entity Object defined by identity (not attributes);
identity persists across state changes
Value Object (VO) Object defined by attributes; immutable; no
identity; equality by all fields
Domain Service Stateless operation that doesn't naturally
belong to an entity or VO; carries business
logic
Application Service Orchestrates use cases; transaction script;
thin coordination layer
Repository Collection-like interface for aggregate
persistence; abstraction over ORM
Factory Encapsulates complex object creation;
enforces invariants at construction
Domain Event Something meaningful that happened in the
domain; immutable; published to subscribers
Integration Event Event intended for cross-context
communication; versioned contract
Specification Object that encapsulates a business rule as a
predicate; composable via AND/OR/NOT
Bounded Context Explicit boundary within which a ubiquitous
language and domain model apply
97

PreOne DDD v1.0 | Architecture Freeze
Term Meaning
Ubiquitous Language Shared vocabulary between domain experts
and developers; same terms in code as in
business
Context Map Diagram of relationships between bounded
contexts (U/D, ACL, etc.)
Anti-Corruption Layer (ACL) Translation layer between contexts/systems
to isolate domain from external concepts
Glossary (cont.)
Term Meaning
Shared Kernel Subset of model shared between contexts;
changes require coordination
Open Host Service (OHS) Context exposes operations via a published
protocol/standard
Published Language (PL) Well-documented shared language for inter-
context communication (e.g., event schema)
Conformist Downstream context conforms to upstream
model without translation; trusts upstream
Customer/Supplier Upstream serves downstream; downstream
has say in upstream priorities
Domain Model Software model of the business domain;
entities, VOs, aggregates, services
Domain Policy Cross-aggregate business rule enforced at a
specific point in a workflow
Invariant Business rule that must always hold true for
an aggregate (e.g., total = Σitems − Σdiscounts
+ Σtax)
Transaction Boundary Scope within which data changes are atomic;
in DDD = one aggregate
Outbox Pattern Same-transaction write of aggregate + event
row; async relay publishes events
CQRS Command Query Responsibility Segregation;
separate read and write models
98

PreOne DDD v1.0 | Architecture Freeze
Term Meaning
Event Sourcing Store events as source of truth; state
reconstructed by replay
Optimistic Concurrency Version field on aggregate; concurrent
updates detect conflict
Idempotency Same operation called multiple times has
same effect; key for payment callbacks
Domain Workflow State machine for an aggregate; states +
transitions + guards
Glossary (cont.)
Term Meaning
Read Model Projection optimized for queries;
denormalized; used in CQRS
Projection Listener that builds read models from events
Tenant Multi-tenant isolation boundary; one school =
one tenant
TenantScope Middleware that injects TenantId into all
queries; enforces isolation
PII Personally Identifiable Information; needs
DPDP-compliant handling
RBAC Role-Based Access Control; permissions
grouped by role
ABAC Attribute-Based Access Control; permissions
evaluated by attributes (rare in PreOne)
JWT JSON Web Token; short-lived auth token (15
min in PreOne)
MFA Multi-Factor Authentication; mandatory for
admin roles
DLT Distributed Ledger Technology — in TRAI
context, the SMS template registration
system
GST Goods and Services Tax; PreOne handles
CGST/SGST/IGST per place-of-supply
99

PreOne DDD v1.0 | Architecture Freeze
Term Meaning
DPDP Digital Personal Data Protection Act 2023;
governs PII handling in India
POSH Prevention of Sexual Harassment Act 2013;
staff training + ICC compliance
FIFO First-In-First-Out; default inventory valuation
method in PreOne
GRN Goods Receipt Note; inward stock
acknowledgment against a PO
28. Modular DDD Document Split Recommendation
PreOne सा(cid:2)रख्या(cid:2) म(cid:13)ठीL(cid:2) Enterprise System सा(cid:2)ठी DDD ला(cid:2) एक(cid:2) Document मध्या(cid:9) नी ठी(cid:9)वतो(cid:2) खा(cid:2)ला लापु*म(cid:2)(cid:21)(cid:9)
णिवभ(cid:2)णिजोतो करण्या(cid:2)च णिशीफ(cid:2)रसा क(cid:9) ला जो(cid:2)तो(cid:9). हा(cid:2) Modular Approach PreOne सा(cid:2)रख्या(cid:2) Enterprise SaaS सा(cid:2)ठी
अणिधीक maintainable, scalable, आणि(cid:21) AI-assisted development सा(cid:2)ठी उपुयाक्(cid:18) तो ठीर(cid:9)ला.
खा(cid:2)ला ला पु(cid:2)च sub-documents च recommendation आहा(cid:9). पु*त्याक(cid:9) document एक(cid:2) specific aspect वर
focus करतो(cid:13) आणि(cid:21) व(cid:9)गोव(cid:9)गोळ्या(cid:2) audiences सा(cid:2)ठी optimized आहा(cid:9):
28.1 DDD-001 — Strategic Design
Scope Bounded Contexts, Context Map, Ubiquitous
Language
Sections Covered Sections 1–6 of this document (Introduction,
DDD Overview, Ubiquitous Language,
Strategic Design, Bounded Contexts, Context
Map)
Primary Audience Architects, Tech Leads, Product Managers
Update Frequency Low — bounded context changes are rare
Successor Documents DDD-002 (Tactical Design), ADR Catalog
Estimated Length 40–50 pages
Freeze Stage Architecture Freeze v1.0
DDD-001 च(cid:2) purpose म्हा(cid:21)जो(cid:9) strategic decisions document कर(cid:21) (cid:9) — क(cid:13)(cid:21)तो(cid:9) contexts आहा(cid:9)तो, त्या(cid:2)च(cid:29) (cid:9)
boundaries क(cid:2)या आहा(cid:9)तो, तो(cid:9) एकमक(cid:9) (cid:2)शी(cid:29) कसा(cid:9) relate हा(cid:13)तो(cid:2)तो. हा(cid:9) decisions architectural stability दोतो(cid:9) (cid:2)तो
आणि(cid:21) बोदोला जो(cid:2)स्तो expensive हा(cid:13)तो(cid:2)तो, त्या(cid:2)मळे(cid:18) (cid:9) low update frequency आहा(cid:9).
100

PreOne DDD v1.0 | Architecture Freeze
28.2 DDD-002 — Tactical Design
Scope Entities, Value Objects, Aggregates,
Repositories, Services
Sections Covered Sections 7–17 of this document (Domain
Model, Aggregates, Entities, Value Objects,
Domain Services, Repositories, Domain
Events, Specifications, Factories, Application
Services, Domain Policies)
Primary Audience Backend Engineers, Senior Engineers
Update Frequency Medium — new aggregates/entities added
per feature
Successor Documents DDD-003 (Domain Models detail), DDD-005
(Implementation Guide)
Estimated Length 60–80 pages
Freeze Stage Architecture Freeze v1.0; incremental
updates per release
DDD-002 च(cid:2) purpose म्हा(cid:21)जो(cid:9) tactical building blocks document कर(cid:21).(cid:9) नीव नी feature add हा(cid:13)तो(cid:2)नी(cid:2)
new aggregates, entities, आणि(cid:21) services add हा(cid:13)तो(cid:2)तो — तो(cid:9) या(cid:2) document मध्या(cid:9) reflect हा(cid:13)तो(cid:2)तो. PR
review मध्या (cid:9)verify क(cid:9) ला (cid:9)जो(cid:2)तो(cid:9) क new aggregate addition सा(cid:13)बोतो DDD-002 update आहा(cid:9).
28.3 DDD-003 — Domain Models Detail
Scope पु*त्या(cid:9)क Domain च (cid:9)साणिवस्तोर मMड(cid:9)ला — Admissions,
Student, Finance, HR, Inventory, etc.
Sections Covered Section 7 (Domain Model) expanded per
domain with full entity attributes, VO
validation, invariant lists, lifecycle diagrams
Primary Audience Backend Engineers implementing specific
domain
Update Frequency High — per-domain changes constant
Successor Documents Database Schema, API Contract Catalog
Estimated Length 100–150 pages (one chapter per domain)
Freeze Stage Per-domain freeze (Admissions v1.0, Student
v1.1, etc.)
101

PreOne DDD v1.0 | Architecture Freeze
DDD-003 हा(cid:2) document series आहा(cid:9) — पु*त्याक(cid:9) domain च(cid:2) एक chapter. उदो(cid:2).: DDD-003-
Admissions, DDD-003-Finance, DDD-003-HR. हा(cid:9) split करण्या(cid:2)च(cid:2) फ(cid:2)यादो(cid:2): each squad त्या(cid:2)च्(cid:29) या(cid:2)
domain च(cid:2) chapter own करतो(cid:13), updates independent. AI tools ला(cid:2) एक domain च(cid:2) chapter
णिदोल्या(cid:2)वर focused code generation णिमळेतो(cid:9).
28.4 DDD-004 — Domain Events & Integration
Scope Events, Policies, ACL, Event Flows
Sections Covered Sections 13 (Domain Events), 17 (Domain
Policies), 18 (ACL), 19 (Integration Events), 20
(Domain Workflows)
Primary Audience Backend Engineers, Integration Engineers,
Architects
Update Frequency Medium — new events per feature; new
integrations per quarter
Successor Documents API Contract Catalog, Integration Specs
Estimated Length 50–70 pages
Freeze Stage Architecture Freeze v1.0; event schema
versioning per change
DDD-004 च(cid:2) purpose म्हा(cid:21)जो(cid:9) cross-context communication document कर(cid:21).(cid:9) Events, policies,
ACLs, workflows एक(cid:2) णिठीक(cid:2)(cid:21) बोणिघतोल्या(cid:2)मळे(cid:18) (cid:9) integration patterns consistent र(cid:2)हातो(cid:2)तो. नीव n
integration add करतो(cid:2)नी(cid:2) ACL section मध्या (cid:9)entry add हा(cid:13)तो(cid:9) आणि(cid:21) contract documented हा(cid:13)तो(cid:9).
28.5 DDD-005 — Implementation Guide
Scope Prisma Mapping, NestJS Structure, Coding
Standards, Testing
Sections Covered Sections 24 (Database Mapping), 25 (Coding
Guidelines), 26 (Testing Strategy)
Primary Audience All Backend Engineers, New Hires, AI Code
Assistants
Update Frequency Low-Medium — coding standards stable;
tooling updates occasional
Successor Documents Database Schema, CI/CD Config, Onboarding
Guide
Estimated Length 40–60 pages
102

PreOne DDD v1.0  |  Architecture Freeze
Freeze Stage Engineering Standards Freeze v1.0
DDD-005  च(cid:2)  purpose  म्हा(cid:21)जो(cid:9)  implementation patterns document  कर(cid:21).(cid:9)  नीव नी  engineer
onboarding च(cid:2) primary reference आहा(cid:9). AI code generation सा(cid:2)ठी  prompt prefix म्हा(cid:21)नी?  व(cid:2)पुरला (cid:9)
जो(cid:2)ऊ शीकतो(cid:9) — 'Follow DDD-005 standards' असा(cid:29) instruction AI ला(cid:2) णिदोल्या(cid:2)वर consistent code
generate हा(cid:13)तो(cid:13).
28.6 Document Split Summary
| Document | Scope | Audience | Length | Update  |
| -------- | ----- | -------- | ------ | ------- |
Frequency
| DDD-001 | Strategic Design | Architects, PMs | 40–50 pages | Low    |
| ------- | ---------------- | --------------- | ----------- | ------ |
| DDD-002 | Tactical Design  | Senior          | 60–80 pages | Medium |
Engineers
| DDD-003 | Domain Models  | Squad           | 100–150 pages | High   |
| ------- | -------------- | --------------- | ------------- | ------ |
|         | (per domain)   | Engineers       |               |        |
| DDD-004 | Events &       | Integration Eng | 50–70 pages   | Medium |
Integration
| DDD-005 | Implementation  | All Engineers | 40–60 pages | Low-Medium |
| ------- | --------------- | ------------- | ----------- | ---------- |
Guide
28.7 Migration Path
Current document (DDD v1.0 unified) ला(cid:2) खा(cid:2)ला ला phases मध्या (cid:9)split क(cid:9) ला (cid:9)जो(cid:2)ईला:
•  Phase 1 (next sprint): DDD-001 + DDD-002 extracted from this document; reviewed
by architecture council.
•  Phase 2 (next month): DDD-003 split per domain; each squad owns their chapter;
reviewed in domain-level freeze.
•  Phase 3 (next quarter): DDD-004 + DDD-005 extracted; aligned with ADR Catalog +
Database Schema v3.
•  Phase 4 (ongoing): each sub-document independently versioned; cross-references
maintained.
हा (cid:9)split approach सावB stakeholders ला(cid:2) त्या(cid:2)च्(cid:29) या(cid:2) interest च(cid:2) specific document access करूनी दोतो(cid:9) (cid:13) —
architects फक्तो DDD-001 पु(cid:2)हातो(cid:2)तो, engineers DDD-002/003/005 पु(cid:2)हातो(cid:2)तो, integration engineers
DDD-004 पु(cid:2)हातो(cid:2)तो. AI code generation सा(cid:2)ठी  पु*त्याक(cid:9)  document एक focused prompt-able unit आहा(cid:9),
ज्या(cid:2)मळे(cid:18) (cid:9) context window efficiency increase हा(cid:13)तो(cid:9).
103